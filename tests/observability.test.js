import test from 'node:test';
import assert from 'node:assert/strict';
import { createObservability } from '../src/observability/metrics.js';

test('prometheus output contains valid counters and histogram structure', () => {
  const obs = createObservability({ enabled: true });
  obs.record({ method:'GET', route:'/items',status:200,durationSeconds:0.02,requestId:'test-1' });
  obs.record({ method:'GET', route:'/observability/demo-error',status:503,durationSeconds:1.5,requestId:'test-2' });
  const text = obs.metricsText();
  assert.match(text,/http_requests_total\{[^\n]*status_code="503"\} 1/);
  assert.match(text,/http_request_duration_seconds_count\{service_name="taskflow-api"\} 2/);
  assert.match(text,/http_request_duration_seconds_bucket\{service_name="taskflow-api",le="\+Inf"\} 2/);
  assert.match(text,/http_request_duration_seconds_sum\{service_name="taskflow-api"\} 1\.520000000/);
});
test('logs carry service, request id, route, status and severity with no payloads', () => {
  const obs=createObservability({enabled:true});
  const log=obs.record({method:'POST',route:'/tasks',status:503,durationSeconds:0.1,requestId:'rid-5'});
  assert.equal(log.service,'taskflow-api');
  assert.equal(log.request_id,'rid-5');
  assert.equal(log.level,'error');
  assert.equal(log.status_code,503);
  assert.equal(log.route,'/tasks');
  assert.equal(Object.prototype.hasOwnProperty.call(log,'body'),false);
});
test('metrics are isolated per application instance', () => {
  const a=createObservability({enabled:true});
  const b=createObservability({enabled:true});
  a.record({method:'GET',route:'/items',status:200,durationSeconds:0.1});
  assert.match(a.metricsText(),/http_request_duration_seconds_count\{service_name="taskflow-api"\} 1/);
  assert.match(b.metricsText(),/http_request_duration_seconds_count\{service_name="taskflow-api"\} 0/);
});
