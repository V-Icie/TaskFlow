export class User {
  constructor({ id, displayName }) {
    if (!Number.isInteger(id) || id <= 0) throw new TypeError('User id must be a positive integer');
    this.id = id;
    this.rename(displayName);
  }
  rename(displayName) {
    if (typeof displayName !== 'string' || !displayName.trim()) throw new TypeError('Display name is required');
    this.displayName = displayName.trim();
  }
}
