export const TASK_STATUS = Object.freeze({ OPEN: 'open', DONE: 'done' });

export class Task {
  constructor({ id, title, ownerId, categoryId = null, status = TASK_STATUS.OPEN }) {
    if (!Number.isInteger(id) || id <= 0) throw new TypeError('Task id must be a positive integer');
    if (!Number.isInteger(ownerId) || ownerId <= 0) throw new TypeError('Owner id must be a positive integer');
    if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
      throw new TypeError('Category id must be null or a positive integer');
    }
    if (!Object.values(TASK_STATUS).includes(status)) throw new TypeError('Unknown status');
    this.id = id;
    this.ownerId = ownerId;
    this.categoryId = categoryId;
    this.status = status;
    this.rename(title);
  }
  rename(title) {
    if (typeof title !== 'string' || !title.trim()) throw new TypeError('Task title is required');
    this.title = title.trim();
  }
  complete() { this.status = TASK_STATUS.DONE; }
  reopen() { this.status = TASK_STATUS.OPEN; }
  assignCategory(categoryId) {
    if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
      throw new TypeError('Category id must be null or a positive integer');
    }
    this.categoryId = categoryId;
  }
}
