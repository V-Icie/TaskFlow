import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readItems } from './db.js';
import { TasksRepository } from './tasksRepository.js';
import { PostgresTasksRepository, PostgresIdempotencyService } from './postgres/repositories.js';
import { TasksService, ApiError } from './service/tasksService.js';
import { IdempotencyService } from './service/idempotencyService.js';
import { createTasksRouter } from './api/tasksRouter.js';
import { requestContext, errorResponse, createRateLimiter, createDemoMiddleware, isLocalRequest } from './middleware/resilience.js';
import { createObservability } from './observability/metrics.js';

const publicDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp(db, {
  rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 8),
  rateLimitWindowMs = 10_000,
  demoEnabled = process.env.DEMO_FAILURES === '1'
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext);
  const obsEnabled = process.env.OBSERVABILITY_ENABLED === '1';
  const observability = createObservability({ enabled: obsEnabled, logFile: process.env.TASKFLOW_LOG_FILE || '' });
  app.use(observability.middleware);
  if (obsEnabled) {
    app.get('/metrics', observability.metricsHandler);
    // Explicitly opt-in synthetic endpoints; never enabled in standard Docker / npm start.
    if (process.env.OBSERVABILITY_DEMO_FAILURES === '1') {
      app.get('/observability/demo-error', (_req, res) => res.status(503).json({ error: 'DemoUnavailable' }));
      app.get('/observability/demo-slow', async (_req, res) => {
        await new Promise(resolve => setTimeout(resolve, 1100));
        res.json({ status: 'slow-demo' });
      });
    }
  }
  app.use(express.json({ limit: '16kb' }));
  app.use(createRateLimiter({ max: rateLimitMax, windowMs: rateLimitWindowMs }));
  app.use(createDemoMiddleware({ enabled: demoEnabled }));

  const isPostgres = db.kind === 'postgres';
  const service = new TasksService(isPostgres
    ? new PostgresTasksRepository(db.pool)
    : new TasksRepository(db));
  const idempotency = isPostgres
    ? new PostgresIdempotencyService(db.pool)
    : new IdempotencyService(db, service);

  // Previous practices remain available; /health is a simple readiness check.
  app.get('/items', async (_req, res) => res.json(await readItems(db)));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/demo/config', (req, res) => res.json({ enabled: demoEnabled && isLocalRequest(req) }));
  app.use('/tasks', createTasksRouter(service, idempotency));
  app.use(express.static(publicDirectory));

  app.use((req, res) => res.status(404).json(errorResponse(req, 'NotFound', 'ROUTE_NOT_FOUND', [])));
  app.use((err, req, res, _next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json(errorResponse(req, err.errorName, err.code, err.details));
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json(errorResponse(req, 'ValidationError', 'INVALID_JSON', [{ field: 'body', message: 'Invalid JSON' }]));
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json(errorResponse(req, 'ValidationError', 'BODY_TOO_LARGE', []));
    }
    console.error('Unexpected server error:', err);
    return res.status(500).json(errorResponse(req, 'InternalError', 'INTERNAL_ERROR', []));
  });
  return app;
}
