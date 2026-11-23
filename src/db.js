import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DB = resolve(projectRoot, 'data', 'taskflow.sqlite');

export function openDatabase(databasePath = process.env.DATABASE_PATH || DEFAULT_DB) {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(resolve(databasePath)), { recursive: true });
  }

  const db = new DatabaseSync(databasePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),
      owner_id INTEGER NOT NULL DEFAULT 1,
      category_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const count = db.prepare('SELECT COUNT(*) AS total FROM items').get().total;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO items (name) VALUES (?)');
    for (const item of [
      'Підготувати практичну №1',
      'Налаштувати Git та GitHub',
      'Продемонструвати GET /items',
      'Підготуватися до Google Meet'
    ]) {
      insert.run(item);
    }
  }
  return db;
}

export function readItems(db) {
  return db.prepare('SELECT id, name FROM items ORDER BY id ASC').all();
}
