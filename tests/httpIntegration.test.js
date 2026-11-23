import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';

// Runs for the student after npm install. Express is unavailable in this artifact
// creation sandbox, so the suite explicitly reports SKIP rather than inventing PASS.
const expressAvailable = await import('express').then(() => true, () => false);

test('HTTP integration: API headers, idempotency, 400/409/429 and /health', {
  skip: !expressAvailable && 'Requires npm install (Express)'
}, async () => {
  const { createApp } = await import('../src/app.js');
  const db = openDatabase(':memory:');
  const server = createApp(db, { rateLimitMax: 2, demoEnabled: true }).listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.ok(health.headers.get('X-Request-Id'));
    assert.deepEqual(await health.json(), { status: 'ok' });

    const body = JSON.stringify({ title: 'Integrated test' });
    const post = (key, content = body) => fetch(`${base}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: content
    });
    const noKey = await fetch(`${base}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body
    });
    assert.equal(noKey.status, 400);
    assert.equal((await noKey.json()).code, 'IDEMPOTENCY_KEY_REQUIRED');

    // Rate limit is tested separately below, because it counts even rejected POSTs.
    const first = await post('http-integration-key-1');
    assert.equal(first.status, 201);
    const record = await first.json();
    assert.ok(record.id > 0);
    const repeated = await post('http-integration-key-1');
    assert.equal(repeated.status, 429); // 3 POSTs in a 2-request window
    assert.ok(Number(repeated.headers.get('Retry-After')) >= 1);
    assert.equal((await repeated.json()).requestId, repeated.headers.get('X-Request-Id'));

    const tasks = await fetch(`${base}/tasks`).then(res => res.json());
    assert.equal(tasks.length, 1);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    db.close();
  }
});

test('HTTP integration: replay returns same ID and 409 for changed payload', {
  skip: !expressAvailable && 'Requires npm install (Express)'
}, async () => {
  const { createApp } = await import('../src/app.js');
  const db = openDatabase(':memory:');
  const server = createApp(db, { rateLimitMax: 10, demoEnabled: true }).listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = title => fetch(`${base}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'repeated-integration-key' }, body: JSON.stringify({ title })
    });
    const first = await post('Same');
    const second = await post('Same');
    assert.equal(first.status, 201); assert.equal(second.status, 201);
    assert.deepEqual(await first.json(), await second.json());
    const conflict = await post('Different');
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).code, 'IDEMPOTENCY_KEY_REUSED');
    assert.equal((await fetch(`${base}/tasks`).then(r => r.json())).length, 1);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    db.close();
  }
});
