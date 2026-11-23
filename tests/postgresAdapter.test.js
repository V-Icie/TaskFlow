import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresTasksRepository, PostgresIdempotencyService } from '../src/postgres/repositories.js';
import { TasksService } from '../src/service/tasksService.js';
import { openPostgresDatabase } from '../src/postgres/db.js';

class FakePgPool {
  constructor() {
    this.tasks = [];
    this.idempotency = new Map();
    this.items = [];
    this.statements = [];
    this.nextTaskId = 1;
  }
  async connect() { return { query: (sql, args) => this.query(sql, args), release: () => {} }; }
  async query(sql, args = []) {
    this.statements.push(sql.trim());
    const q = sql.trim();
    if (q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK') return { rows: [], rowCount: 0 };
    if (q.includes('pg_advisory_xact_lock')) return { rows: [{}], rowCount: 1 };
    if (q.startsWith('SELECT payload_hash')) {
      const record = this.idempotency.get(args[0]);
      return { rows: record ? [record] : [], rowCount: record ? 1 : 0 };
    }
    if (q.includes('INSERT INTO idempotency_keys')) {
      this.idempotency.set(args[0], { payload_hash: args[1], response_json: args[2] });
      return { rows: [], rowCount: 1 };
    }
    if (q.includes('INSERT INTO tasks')) {
      const [title, status, ownerId, categoryId, createdAt, updatedAt] = args;
      const task = { id: this.nextTaskId++, title, status, ownerId, categoryId, createdAt, updatedAt };
      this.tasks.push(task);
      return { rows: [task], rowCount: 1 };
    }
    if (q.includes('UPDATE tasks SET')) {
      const task = this.tasks.find(t => t.id === args[4]);
      Object.assign(task, { title: args[0], status: args[1], categoryId: args[2], updatedAt: args[3] });
      return { rows: [task], rowCount: 1 };
    }
    if (q.includes('DELETE FROM tasks')) {
      const before = this.tasks.length;
      this.tasks = this.tasks.filter(task => task.id !== args[0]);
      return { rows: [], rowCount: before - this.tasks.length };
    }
    if (q.includes('FROM tasks WHERE id=')) return { rows: this.tasks.filter(t => t.id === args[0]), rowCount: 1 };
    if (q.includes('FROM tasks ORDER BY')) return { rows: [...this.tasks], rowCount: this.tasks.length };
    throw new Error(`Unexpected SQL in test: ${q}`);
  }
}

test('PostgreSQL repository supports asynchronous CRUD through existing TasksService', async () => {
  const pool = new FakePgPool();
  const service = new TasksService(new PostgresTasksRepository(pool));
  const created = await service.create({ title: ' PostgreSQL demo ' });
  assert.equal(created.id, 1);
  assert.equal(created.title, 'PostgreSQL demo');
  assert.equal((await service.list()).length, 1);
  assert.equal((await service.get(created.id)).status, 'open');
  assert.equal((await service.update(created.id, { status: 'done' })).status, 'done');
  await service.delete(created.id);
  assert.equal((await service.list()).length, 0);
  await assert.rejects(() => service.get(created.id), error => error.status === 404);
  assert.ok(pool.statements.some(s => s.includes('RETURNING id')));
});

test('PostgreSQL idempotent POST stores one task for same key and payload', async () => {
  const pool = new FakePgPool();
  const idem = new PostgresIdempotencyService(pool);
  const first = await idem.create('postgres-key-0001', { title: 'Docker test' });
  const again = await idem.create('postgres-key-0001', { title: 'Docker test' });
  assert.deepEqual(again, first);
  assert.equal(pool.tasks.length, 1);
  assert.equal(pool.idempotency.size, 1);
  assert.ok(pool.statements.some(s => s.includes('pg_advisory_xact_lock')));
});

test('PostgreSQL idempotency rejects changed payload and preserves existing entry', async () => {
  const pool = new FakePgPool();
  const idem = new PostgresIdempotencyService(pool);
  await idem.create('postgres-key-0002', { title: 'First' });
  await assert.rejects(() => idem.create('postgres-key-0002', { title: 'Second' }), e => e.status === 409);
  assert.equal(pool.tasks.length, 1);
});

test('PostgreSQL adapter startup creates schema and seeds /items only if empty', async () => {
  const statements = [];
  let closed = false;
  class FakePool {
    async query(sql, args) {
      statements.push([sql, args]);
      if (sql.includes('COUNT(*)')) return { rows: [{ total: 0 }] };
      return { rows: [] };
    }
    async end() { closed = true; }
  }
  const db = await openPostgresDatabase({ poolFactory: FakePool });
  assert.equal(db.kind, 'postgres');
  assert.ok(statements.some(([sql]) => sql.includes('CREATE TABLE IF NOT EXISTS tasks')));
  assert.equal(statements.filter(([sql]) => sql.includes('INSERT INTO items(name)')).length, 4);
  await db.close();
  assert.equal(closed, true);
});
