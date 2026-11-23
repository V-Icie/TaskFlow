import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/db.js';
import { TasksRepository } from '../src/tasksRepository.js';
import { TasksService } from '../src/service/tasksService.js';
import { IdempotencyService } from '../src/service/idempotencyService.js';

const makeService = db => new IdempotencyService(db, new TasksService(new TasksRepository(db)));

test('POST idempotency: same key, same payload -> same task, without duplicates', () => {
  const db = openDatabase(':memory:');
  try {
    const idem = makeService(db);
    const key = 'practical-05-key-001';
    const first = idem.create(key, { title: 'Study' });
    const second = idem.create(key, { title: 'Study' });
    assert.deepEqual(second, first);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM idempotency_keys').get().n, 1);
  } finally { db.close(); }
});

test('idempotency survives database reopen', () => {
  const directory = mkdtempSync(join(tmpdir(), 'taskflow-5-'));
  const path = join(directory, 'test.sqlite');
  let db;
  try {
    db = openDatabase(path);
    const first = makeService(db).create('persistent-12345', { title: 'Persisted' });
    db.close();
    db = openDatabase(path);
    const second = makeService(db).create('persistent-12345', { title: 'Persisted' });
    assert.deepEqual(first, second);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n, 1);
  } finally { db?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('reusing a key for a different payload returns 409 without creating a task', () => {
  const db = openDatabase(':memory:');
  try {
    const idem = makeService(db);
    idem.create('conflicting-key-1234', { title: 'First' });
    assert.throws(() => idem.create('conflicting-key-1234', { title: 'Second' }), error => error.status === 409 && error.code === 'IDEMPOTENCY_KEY_REUSED');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n, 1);
  } finally { db.close(); }
});

test('object key order does not affect idempotency hash', () => {
  const db = openDatabase(':memory:');
  try {
    const idem = makeService(db);
    const a = idem.create('ordering-key-123456', { title: 'One', status: 'open' });
    const b = idem.create('ordering-key-123456', { status: 'open', title: 'One' });
    assert.deepEqual(a, b);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n, 1);
  } finally { db.close(); }
});

test('invalid POST rolls back and does not reserve the key', () => {
  const db = openDatabase(':memory:');
  try {
    const idem = makeService(db);
    assert.throws(() => idem.create('retry-this-key-123', { title: '' }), error => error.code === 'TITLE_REQUIRED');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM idempotency_keys').get().n, 0);
    assert.equal(idem.create('retry-this-key-123', { title: 'Now valid' }).title, 'Now valid');
  } finally { db.close(); }
});

test('POST requires a nonempty Idempotency-Key', () => {
  const db = openDatabase(':memory:');
  try {
    assert.throws(() => makeService(db).create(undefined, { title: 'x' }), error => error.status === 400 && error.code === 'IDEMPOTENCY_KEY_REQUIRED');
  } finally { db.close(); }
});
