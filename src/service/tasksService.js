import { TASK_STATUS, Task } from '../../domain/Task.js';

export class ApiError extends Error {
  constructor(status, error, code, details = []) {
    super(error); this.status = status; this.errorName = error; this.code = code; this.details = details;
  }
}
const bad = (code, field, message) => new ApiError(400, 'ValidationError', code, [{ field, message }]);

// SQLite is synchronous; PostgreSQL queries are asynchronous. Keep both adapters
// compatible without changing the public domain API used in practices 1-5.
const mapResult = (result, transform) =>
  result && typeof result.then === 'function' ? result.then(transform) : transform(result);
function validateTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) throw bad('TITLE_REQUIRED', 'title', 'Title is required');
  if (title.trim().length > 120) throw bad('TITLE_TOO_LONG', 'title', 'Title must be at most 120 characters');
  return title.trim();
}
function validateStatus(status) {
  if (status !== TASK_STATUS.OPEN && status !== TASK_STATUS.DONE) throw bad('INVALID_STATUS', 'status', 'Status must be open or done');
  return status;
}
function validateCategory(categoryId) {
  if (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId <= 0)) throw bad('INVALID_CATEGORY_ID', 'categoryId', 'Category ID must be null or a positive integer');
  return categoryId;
}
function validateBody(body, allowed) {
  if (body === null || Array.isArray(body) || typeof body !== 'object') throw bad('INVALID_BODY', 'body', 'A JSON object is required');
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) throw bad('UNKNOWN_FIELD', key, `Unknown field: ${key}`);
  }
}
export class TasksService {
  constructor(repository) { this.repository = repository; }
  list() { return this.repository.list(); }
  get(id) {
    return mapResult(this.repository.find(id), task => {
      if (!task) throw new ApiError(404, 'NotFound', 'TASK_NOT_FOUND', [{ field: 'id', message: 'Task not found' }]);
      return task;
    });
  }
  create(body) {
    validateBody(body, ['title','status','categoryId']);
    const title = validateTitle(body.title);
    const status = validateStatus(body.status ?? TASK_STATUS.OPEN);
    const categoryId = validateCategory(body.categoryId ?? null);
    const task = this.repository.create({ title, status, categoryId, ownerId: 1 });
    return mapResult(task, created => {
      new Task(created); // enforce domain invariants
      return created;
    });
  }
  update(id, body) {
    validateBody(body, ['title','status','categoryId']);
    if (Object.keys(body).length === 0) throw bad('EMPTY_UPDATE', 'body', 'At least one field is required');
    return mapResult(this.get(id), existing => {
      const next = {
        title: 'title' in body ? validateTitle(body.title) : existing.title,
        status: 'status' in body ? validateStatus(body.status) : existing.status,
        categoryId: 'categoryId' in body ? validateCategory(body.categoryId) : existing.categoryId,
      };
      new Task({ ...existing, ...next });
      return this.repository.update(id, next);
    });
  }
  delete(id) {
    return mapResult(this.get(id), () => this.repository.remove(id));
  }
}

export function parseTaskId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) throw bad('INVALID_ID', 'id', 'ID must be a positive integer');
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) throw bad('INVALID_ID', 'id', 'ID must be a safe integer');
  return id;
}
