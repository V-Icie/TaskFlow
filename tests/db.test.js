import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, readItems } from '../src/db.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('SQLite створює таблицю items та заповнює її прикладами', () => {
  const db = openDatabase(':memory:');
  try {
    const items = readItems(db);
    assert.equal(items.length, 4);
    assert.deepEqual(Object.keys(items[0]), ['id', 'name']);
    assert.equal(items[0].id, 1);
    assert.equal(typeof items[0].name, 'string');
  } finally { db.close(); }
});

test('повторне відкриття файлу SQLite не дублює початкові записи', () => {
  const folder = mkdtempSync(join(tmpdir(), 'taskflow-lab01-'));
  const databasePath = join(folder, 'test.sqlite');
  try {
    const first = openDatabase(databasePath);
    assert.equal(readItems(first).length, 4);
    first.close();

    const second = openDatabase(databasePath);
    assert.equal(readItems(second).length, 4);
    second.close();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test('дані з таблиці items читаються у порядку id', () => {
  const db = openDatabase(':memory:');
  try {
    db.prepare('INSERT INTO items (name) VALUES (?)').run('П’яте завдання');
    const items = readItems(db);
    assert.equal(items.at(-1).name, 'П’яте завдання');
    assert.deepEqual(items.map(item => item.id), [1, 2, 3, 4, 5]);
  } finally { db.close(); }
});
