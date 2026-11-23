import { Router } from 'express';
import { parseTaskId } from '../service/tasksService.js';

export function createTasksRouter(service, idempotency) {
  const router = Router();
  // Express 5 forwards rejected async handlers to the error middleware.
  router.get('/', async (_req, res) => res.json(await service.list()));
  router.post('/', async (req, res) =>
    res.status(201).json(await idempotency.create(req.get('Idempotency-Key'), req.body)));
  router.get('/:id', async (req, res) =>
    res.json(await service.get(parseTaskId(req.params.id))));
  router.patch('/:id', async (req, res) =>
    res.json(await service.update(parseTaskId(req.params.id), req.body)));
  router.delete('/:id', async (req, res) => {
    await service.delete(parseTaskId(req.params.id));
    res.status(204).end();
  });
  return router;
}
