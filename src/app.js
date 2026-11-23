import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readItems } from './db.js';
import { TasksRepository } from './tasksRepository.js';
import { TasksService, ApiError } from './service/tasksService.js';
import { createTasksRouter } from './api/tasksRouter.js';

const publicDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  const service = new TasksService(new TasksRepository(db));

  // Practice 1 endpoint stays exactly as before.
  app.get('/items', (_req, res) => res.json(readItems(db)));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/tasks', createTasksRouter(service));
  app.use(express.static(publicDirectory));

  app.use((req, res, next) => {
    if (req.path === '/tasks' || req.path.startsWith('/tasks/')) {
      return res.status(404).json({ error: 'NotFound', code: 'ROUTE_NOT_FOUND', details: [] });
    }
    next();
  });
  app.use((err, _req, res, _next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: err.errorName, code: err.code, details: err.details });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'ValidationError', code: 'INVALID_JSON', details: [{ field: 'body', message: 'Invalid JSON' }] });
    }
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'InternalError', code: 'INTERNAL_ERROR', details: [] });
  });
  return app;
}
