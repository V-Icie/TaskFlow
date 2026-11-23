import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { openPostgresDatabase } from './postgres/db.js';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Некоректний PORT: ${rawPort}`);
  process.exit(1);
}

// Local npm start stays on SQLite; Docker Compose selects PostgreSQL.
const db = process.env.DB_CLIENT === 'postgres'
  ? await openPostgresDatabase()
  : openDatabase();
const app = createApp(db);
const server = app.listen(port, () => {
  console.log(`TaskFlow запущено: http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/items`);
});

function shutdown() {
  server.close(() => {
    Promise.resolve(db.close()).then(() => process.exit(0)).catch(error => {
      console.error('Database shutdown failed:', error);
      process.exit(1);
    });
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
