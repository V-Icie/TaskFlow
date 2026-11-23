export class TasksRepository {
  constructor(db) { this.db = db; }
  list() {
    return this.db.prepare('SELECT id, title, status, owner_id AS ownerId, category_id AS categoryId, created_at AS createdAt, updated_at AS updatedAt FROM tasks ORDER BY id ASC').all();
  }
  find(id) {
    return this.db.prepare('SELECT id, title, status, owner_id AS ownerId, category_id AS categoryId, created_at AS createdAt, updated_at AS updatedAt FROM tasks WHERE id = ?').get(id) ?? null;
  }
  create({ title, status, ownerId, categoryId }) {
    const timestamp = new Date().toISOString();
    const result = this.db.prepare('INSERT INTO tasks (title,status,owner_id,category_id,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(title,status,ownerId,categoryId,timestamp,timestamp);
    return this.find(Number(result.lastInsertRowid));
  }
  update(id, { title, status, categoryId }) {
    const timestamp = new Date().toISOString();
    this.db.prepare('UPDATE tasks SET title=?,status=?,category_id=?,updated_at=? WHERE id=?').run(title,status,categoryId,timestamp,id);
    return this.find(id);
  }
  remove(id) { return this.db.prepare('DELETE FROM tasks WHERE id=?').run(id).changes > 0; }
}
