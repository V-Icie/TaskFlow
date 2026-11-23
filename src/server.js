import { createApp } from './app.js';
import { openDatabase } from './db.js';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Некоректний PORT: ${rawPort}`);
  process.exit(1);
}

const db = openDatabase();
const app = createApp(db);
const server = app.listen(port, () => {
  console.log(`TaskFlow запущено: http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/items`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
