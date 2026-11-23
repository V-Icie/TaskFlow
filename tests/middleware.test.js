import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, requestContext, createDemoMiddleware } from '../src/middleware/resilience.js';

function mockRes() {
  return {
    headers: {}, code: 200, body: null,
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}
const req = (headers = {}, method = 'POST') => ({
  method, path: '/tasks', ip: '127.0.0.1', requestId: 'request-test-42',
  get(key) { return headers[key]; }
});

test('middleware: X-Request-Id is returned on every response', () => {
  const request = req({ 'X-Request-Id': 'provided-id-123' });
  const response = mockRes();
  let nextCalled = false;
  requestContext(request, response, () => { nextCalled = true; });
  assert.equal(request.requestId, 'provided-id-123');
  assert.equal(response.headers['X-Request-Id'], 'provided-id-123');
  assert.equal(nextCalled, true);
});

test('middleware: POST rate-limit responds 429 with Retry-After', () => {
  let time = 0;
  const limiter = createRateLimiter({ max: 1, windowMs: 5000, now: () => time });
  let nextCount = 0;
  limiter(req(), mockRes(), () => { nextCount += 1; });
  const second = mockRes();
  limiter(req(), second, () => { nextCount += 1; });
  assert.equal(second.code, 429);
  assert.equal(second.headers['Retry-After'], '5');
  assert.equal(second.body.requestId, 'request-test-42');
  assert.equal(nextCount, 1);
  time = 5000;
  limiter(req(), mockRes(), () => { nextCount += 1; });
  assert.equal(nextCount, 2);
});

test('middleware: opt-in failure is returned once per request ID', () => {
  const demo = createDemoMiddleware({ enabled: true });
  const first = mockRes();
  let forwarded = 0;
  const request = req({ 'X-Demo-Scenario': 'fail-once' }, 'GET');
  demo(request, first, () => { forwarded++; });
  assert.equal(first.code, 503);
  assert.equal(first.body.requestId, 'request-test-42');
  demo(request, mockRes(), () => { forwarded++; });
  assert.equal(forwarded, 1);
});

test('middleware: demo injection is disabled unless explicitly enabled', () => {
  const demo = createDemoMiddleware({ enabled: false });
  let forwarded = 0;
  demo(req({ 'X-Demo-Scenario': 'fail-always' }), mockRes(), () => { forwarded++; });
  assert.equal(forwarded, 1);
});
