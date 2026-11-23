import { createHash } from 'node:crypto';
import { ApiError } from './tasksService.js';

// Canonical JSON ignores object key order when hashing the request payload.
export function stableStringify(value) {
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export class IdempotencyService {
  constructor(db, tasksService) {
    this.db = db;
    this.tasksService = tasksService;
  }

  create(key, payload) {
    if (typeof key !== 'string' || !/^[\x21-\x7E]{8,200}$/.test(key)) {
      throw new ApiError(400, 'ValidationError', 'IDEMPOTENCY_KEY_REQUIRED', [
        { field: 'Idempotency-Key', message: 'Provide an Idempotency-Key (8-200 printable ASCII characters)' }
      ]);
    }
    const hash = createHash('sha256').update(stableStringify(payload)).digest('hex');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const saved = this.db.prepare('SELECT payload_hash, response_json FROM idempotency_keys WHERE key = ?').get(key);
      if (saved) {
        if (saved.payload_hash !== hash) {
          throw new ApiError(409, 'Conflict', 'IDEMPOTENCY_KEY_REUSED', [
            { field: 'Idempotency-Key', message: 'This key already belongs to a different payload' }
          ]);
        }
        const response = JSON.parse(saved.response_json);
        this.db.exec('COMMIT');
        return response;
      }
      // Convert SQLite null-prototype row to a plain JSON DTO on both first and repeated calls.
      const response = JSON.parse(JSON.stringify(this.tasksService.create(payload)));
      this.db.prepare('INSERT INTO idempotency_keys (key, payload_hash, response_json, created_at) VALUES (?, ?, ?, ?)')
        .run(key, hash, JSON.stringify(response), new Date().toISOString());
      this.db.exec('COMMIT');
      return response;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
