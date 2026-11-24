// Practice 8: small, dependency-free Prometheus exposition + structured logs.
// Traces are supplied by the official OpenTelemetry Node.js auto-instrumentation.
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 2, 5];
const SERVICE_NAME = 'taskflow-api';

function labelEscape(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function safeRoute(req) {
  // Do not include IDs / query strings / user-controlled path components in labels.
  const path = (req.originalUrl || req.url || '/').split('?')[0];
  if (/^\/tasks\/\d+\/?$/.test(path)) return '/tasks/:id';
  const allowed = new Set(['/tasks', '/items', '/health', '/demo/config', '/observability/demo-error', '/observability/demo-slow']);
  return allowed.has(path) ? path : '/other';
}

export function createObservability({ enabled = false, logFile = '', serviceName = SERVICE_NAME, append = appendFile } = {}) {
  const counters = new Map();
  const histogram = { count: 0, sum: 0, buckets: new Array(BUCKETS.length).fill(0) };
  const logBuffer = [];

  function record({ method, route, status, durationSeconds, requestId }) {
    const code = String(status);
    const key = [method, route, code].join('|');
    counters.set(key, (counters.get(key) || 0) + 1);
    histogram.count++;
    histogram.sum += durationSeconds;
    BUCKETS.forEach((bound, i) => { if (durationSeconds <= bound) histogram.buckets[i]++; });
    const item = {
      ts: new Date().toISOString(), service: serviceName,
      level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
      msg: 'http request complete', method, route,
      status_code: status, duration_ms: Math.round(durationSeconds * 1000),
      request_id: requestId || ''
    };
    logBuffer.push(item);
    if (logBuffer.length > 40) logBuffer.shift();
    if (logFile) {
      // File is already mounted into demo collector. Failures never break API replies.
      void Promise.resolve().then(() => append(logFile, `${JSON.stringify(item)}\n`, 'utf8')).catch(error => {
        console.error('TaskFlow observability log write failed:', error.message);
      });
    }
    return item;
  }

  function middleware(req, res, next) {
    if (!enabled || req.path === '/metrics') return next();
    const start = process.hrtime.bigint();
    res.once('finish', () => {
      record({
        method: req.method, route: safeRoute(req), status: res.statusCode,
        durationSeconds: Number(process.hrtime.bigint() - start) / 1e9,
        requestId: req.requestId
      });
    });
    next();
  }

  function metricsText() {
    const rows = [
      '# HELP http_requests_total Total completed HTTP requests in TaskFlow.',
      '# TYPE http_requests_total counter'
    ];
    for (const [key, count] of [...counters].sort()) {
      const [method, route, status] = key.split('|');
      const labels = `service_name="${labelEscape(serviceName)}",method="${labelEscape(method)}",route="${labelEscape(route)}",status_code="${labelEscape(status)}"`;
      rows.push(`http_requests_total{${labels}} ${count}`);
    }
    rows.push('# HELP http_request_duration_seconds Duration of completed HTTP requests in seconds.');
    rows.push('# TYPE http_request_duration_seconds histogram');
    const label = `service_name="${labelEscape(serviceName)}"`;
    BUCKETS.forEach((limit, i) => rows.push(`http_request_duration_seconds_bucket{${label},le="${limit}"} ${histogram.buckets[i]}`));
    rows.push(`http_request_duration_seconds_bucket{${label},le="+Inf"} ${histogram.count}`);
    rows.push(`http_request_duration_seconds_sum{${label}} ${histogram.sum.toFixed(9)}`);
    rows.push(`http_request_duration_seconds_count{${label}} ${histogram.count}`);
    return rows.join('\n') + '\n';
  }

  function metricsHandler(_req, res) {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsText());
  }

  return { middleware, metricsHandler, metricsText, record, logBuffer, enabled };
}

// Isolated bootstrap: missing log directory is created by the preparation script.
// Not called during normal npm start or tests.
export async function prepareLogDirectory(logFile) {
  if (logFile) await mkdir(dirname(logFile), { recursive: true });
}
