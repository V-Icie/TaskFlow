import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWithResilience, retryAfterMs, backoffMs } from '../public/lib/http.js';

test('http: retries 503 with exponential backoff and stable X-Request-Id', async () => {
  const delays = [];
  const requestIds = [];
  let calls = 0;
  const response = await fetchWithResilience('/health', {
    retry: { retries: 2, baseDelayMs: 100, timeoutMs: 1000, jitter: false },
    fetchImpl: async (_url, opts) => {
      requestIds.push(opts.headers.get('X-Request-Id'));
      calls += 1;
      return calls < 3 ? new Response('{}', { status: 503 }) : new Response('{"status":"ok"}', { status: 200 });
    },
    sleepImpl: async ms => { delays.push(ms); }
  });
  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [100, 200]);
  assert.equal(new Set(requestIds).size, 1);
});

test('http: respects 429 Retry-After and retries POST with idempotency key', async () => {
  const delays = [];
  const keys = [];
  let n = 0;
  const response = await fetchWithResilience('/tasks', {
    method: 'POST', body: JSON.stringify({ title: 'Demo' }), idempotencyKey: 'fixed-key-12345',
    retry: { retries: 2, timeoutMs: 1000 },
    fetchImpl: async (_url, opts) => {
      keys.push(opts.headers.get('Idempotency-Key'));
      n += 1;
      return n === 1 ? new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }) : new Response('{"id":1}', { status: 201 });
    },
    sleepImpl: async ms => { delays.push(ms); }
  });
  assert.equal(response.status, 201);
  assert.deepEqual(delays, [2000]);
  assert.deepEqual(keys, ['fixed-key-12345', 'fixed-key-12345']);
});

test('http: no automatic retry for PATCH or unsafe POST without idem key', async () => {
  for (const opts of [{ method: 'PATCH', body: '{}' }, { method: 'POST', body: '{}' }]) {
    let calls = 0;
    const response = await fetchWithResilience('/tasks', {
      ...opts, retry: { retries: 2, timeoutMs: 1000 },
      fetchImpl: async () => { calls += 1; return new Response('{}', { status: 503 }); },
      sleepImpl: async () => { throw new Error('Must not sleep'); }
    });
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
  }
});

test('http: timeout aborts pending request with AbortController', async () => {
  let aborted = false;
  await assert.rejects(() => fetchWithResilience('/health', {
    retry: { retries: 0, timeoutMs: 20 },
    fetchImpl: async (_url, opts) => new Promise((_resolve, reject) => {
      opts.signal.addEventListener('abort', () => {
        aborted = true;
        reject(opts.signal.reason ?? new Error('Aborted'));
      });
    })
  }), error => error.name === 'TimeoutError');
  assert.equal(aborted, true);
});

test('http: Retry-After HTTP-date and jitter math', () => {
  assert.equal(retryAfterMs('2'), 2000);
  assert.equal(retryAfterMs('invalid'), null);
  assert.equal(backoffMs(200, 2, false), 800);
  assert.equal(backoffMs(200, 0, true, () => 0.5), 250);
});

test('http: network failure is retried for safe GET', async () => {
  let n = 0;
  const res = await fetchWithResilience('/items', {
    retry: { retries: 1, timeoutMs: 1000 },
    fetchImpl: async () => {
      if (++n === 1) throw new TypeError('Network offline');
      return new Response('[]');
    },
    sleepImpl: async () => {}
  });
  assert.equal(res.status, 200);
  assert.equal(n, 2);
});
