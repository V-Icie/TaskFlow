import { createHash } from 'node:crypto';
import { stableStringify } from '../service/idempotencyService.js';
import { TasksService, ApiError } from '../service/tasksService.js';

const TASK_COLUMNS = `id, title, status, owner_id AS "ownerId",
  category_id AS "categoryId", created_at AS "createdAt", updated_at AS "updatedAt"`;

// Works with a pg.Pool or a pg.Client checked out for an idempotent transaction.
export class PostgresTasksRepository {
  constructor(executor) { this.executor = executor; }
  async list() {
    const result = await this.executor.query(`SELECT ${TASK_COLUMNS} FROM tasks ORDER BY id ASC`);
    return result.rows;
  }
  async find(id) {
    const result = await this.executor.query(`SELECT ${TASK_COLUMNS} FROM tasks WHERE id=$1`, [id]);
    return result.rows[0] || null;
  }
  async create({ title, status, ownerId, categoryId }) {
    const time = new Date().toISOString();
    const result = await this.executor.query(`
      INSERT INTO tasks (title, status, owner_id, category_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${TASK_COLUMNS}
    `, [title, status, ownerId, categoryId, time, time]);
    return result.rows[0];
  }
  async update(id, { title, status, categoryId }) {
    const result = await this.executor.query(`
      UPDATE tasks SET title=$1, status=$2, category_id=$3, updated_at=$4
      WHERE id=$5 RETURNING ${TASK_COLUMNS}
    `, [title, status, categoryId, new Date().toISOString(), id]);
    return result.rows[0];
  }
  async remove(id) {
    const result = await this.executor.query('DELETE FROM tasks WHERE id=$1', [id]);
    return result.rowCount > 0;
  }
}

export class PostgresIdempotencyService {
  constructor(pool) { this.pool = pool; }
  async create(key, payload) {
    if (typeof key !== 'string' || !/^[\x21-\x7E]{8,200}$/.test(key)) {
      throw new ApiError(400, 'ValidationError', 'IDEMPOTENCY_KEY_REQUIRED', [
        { field: 'Idempotency-Key', message: 'Provide an Idempotency-Key (8-200 printable ASCII characters)' }
      ]);
    }
    const hash = createHash('sha256').update(stableStringify(payload)).digest('hex');
    const client = await this.pool.connect();
    let started = false;
    try {
      await client.query('BEGIN');
      started = true;
      // A transaction-level lock serializes concurrent requests for the same key.
      // A hash collision only adds waiting; the full key is still checked below.
      await client.query('SELECT pg_advisory_xact_lock(61006, hashtext($1))', [key]);
      const existing = await client.query(
        'SELECT payload_hash, response_json FROM idempotency_keys WHERE key=$1', [key]
      );
      if (existing.rows.length) {
        if (existing.rows[0].payload_hash !== hash) {
          throw new ApiError(409, 'Conflict', 'IDEMPOTENCY_KEY_REUSED', [
            { field: 'Idempotency-Key', message: 'This key belongs to a different payload' }
          ]);
        }
        const saved = JSON.parse(existing.rows[0].response_json);
        await client.query('COMMIT');
        started = false;
        return saved;
      }
      const service = new TasksService(new PostgresTasksRepository(client));
      const task = JSON.parse(JSON.stringify(await service.create(payload)));
      await client.query(`
        INSERT INTO idempotency_keys (key, payload_hash, response_json, created_at)
        VALUES ($1,$2,$3,$4)
      `, [key, hash, JSON.stringify(task), new Date().toISOString()]);
      await client.query('COMMIT');
      started = false;
      return task;
    } catch (error) {
      if (started) await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
