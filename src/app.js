import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readItems } from './db.js';

const publicDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/items', (_req, res) => {
    try {
      res.json(readItems(db));
    } catch (error) {
      console.error('GET /items failed:', error);
      res.status(500).json({ error: 'Не вдалося прочитати записи з бази даних' });
    }
  });

  app.use(express.static(publicDirectory));
  return app;
}
