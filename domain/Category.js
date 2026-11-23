export class Category {
  constructor({ id, name, ownerId }) {
    if (!Number.isInteger(id) || id <= 0) throw new TypeError('Category id must be a positive integer');
    if (!Number.isInteger(ownerId) || ownerId <= 0) throw new TypeError('Owner id must be a positive integer');
    this.id = id;
    this.ownerId = ownerId;
    this.rename(name);
  }
  rename(name) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Category name is required');
    this.name = name.trim();
  }
}
