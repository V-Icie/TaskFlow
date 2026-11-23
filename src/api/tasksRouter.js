import { Router } from 'express';
import { parseTaskId } from '../service/tasksService.js';

export function createTasksRouter(service, idempotency) {
  const router = Router();
  router.get('/', (_req, res) => res.json(service.list()));
  router.post('/', (req, res) => res.status(201).json(idempotency.create(req.get('Idempotency-Key'), req.body)));
  router.get('/:id', (req, res) => res.json(service.get(parseTaskId(req.params.id))));
  router.patch('/:id', (req, res) => res.json(service.update(parseTaskId(req.params.id), req.body)));
  router.delete('/:id', (req, res) => { service.delete(parseTaskId(req.params.id)); res.status(204).end(); });
  return router;
}
