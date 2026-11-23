import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { TasksRepository } from '../src/tasksRepository.js';
import { TasksService, ApiError, parseTaskId } from '../src/service/tasksService.js';
function setup() {
  const db = openDatabase(':memory:');
  return { db, service: new TasksService(new TasksRepository(db)) };
}
test('create + get + list: successful use case', () => {
  const { db, service } = setup();
  try {
    const task = service.create({ title: '  Prepare lab 4  ' });
    assert.equal(task.title, 'Prepare lab 4');
    assert.equal(task.status, 'open');
    assert.equal(task.ownerId, 1);
    assert.equal(service.get(task.id).id, task.id);
    assert.equal(service.list().length, 1);
  } finally { db.close(); }
});
test('create: missing title leads to validation error', () => {
  const { db, service } = setup();
  try {
    assert.throws(() => service.create({ status: 'open' }), e => e instanceof ApiError && e.status === 400 && e.code === 'TITLE_REQUIRED');
    assert.equal(service.list().length, 0);
  } finally { db.close(); }
});
test('update and delete: preserve expected task lifecycle', () => {
  const { db, service } = setup();
  try {
    const t = service.create({ title: 'Demo' });
    assert.equal(service.update(t.id, { status: 'done', title: 'Demo done' }).status, 'done');
    service.delete(t.id);
    assert.throws(() => service.get(t.id), e => e.status === 404);
  } finally { db.close(); }
});
test('reject invalid task ids and payload fields', () => {
  assert.throws(() => parseTaskId('abc'), e => e.code === 'INVALID_ID');
  const { db, service } = setup();
  try { assert.throws(() => service.create({ title: 'x', secret: 'a' }), e => e.code === 'UNKNOWN_FIELD'); }
  finally { db.close(); }
});
