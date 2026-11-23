import test from 'node:test';
import assert from 'node:assert/strict';
import { User, Task, Category, TASK_STATUS } from '../domain/index.js';

test('User has a valid name and can rename', () => {
  const user = new User({ id: 1, displayName: ' Олена ' });
  assert.equal(user.displayName, 'Олена');
  user.rename('Ірина');
  assert.equal(user.displayName, 'Ірина');
});

test('Task status changes and category can be assigned', () => {
  const task = new Task({ id: 7, title: ' Виконати практичну №3 ', ownerId: 1 });
  assert.equal(task.title, 'Виконати практичну №3');
  assert.equal(task.status, TASK_STATUS.OPEN);
  task.complete();
  assert.equal(task.status, TASK_STATUS.DONE);
  task.reopen();
  task.assignCategory(2);
  assert.equal(task.status, TASK_STATUS.OPEN);
  assert.equal(task.categoryId, 2);
});

test('Invalid titles and ids are rejected', () => {
  assert.throws(() => new Task({ id: 0, title: 'Valid', ownerId: 1 }), /positive integer/);
  assert.throws(() => new Task({ id: 1, title: ' ', ownerId: 1 }), /required/);
  assert.throws(() => new User({ id: 1, displayName: ' ' }), /required/);
  assert.throws(() => new Category({ id: 3, ownerId: 1, name: '' }), /required/);
});

test('Category stores owner and updates name', () => {
  const category = new Category({ id: 3, name: ' Навчання ', ownerId: 1 });
  category.rename('Університет');
  assert.equal(category.name, 'Університет');
  assert.equal(category.ownerId, 1);
});
