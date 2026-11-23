import { randomUUID } from 'node:crypto';

export function errorResponse(req, error, code = null, details = null) {
  return { error, code, details, requestId: req.requestId };
}

// A correlation ID must be available even when express.json() rejects a request.
export function requestContext(req, res, next) {
  const proposed = req.get('X-Request-Id');
  req.requestId = typeof proposed === 'string' && /^[\w.:-]{1,128}$/.test(proposed)
    ? proposed : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export function createRateLimiter({ max = 8, windowMs = 10_000, now = Date.now } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    // Apply the sample limit only to the resource-creating operation.
    if (req.method !== 'POST' || !/^\/tasks\/?$/.test(req.path)) return next();
    const ip = req.ip || req.socket?.remoteAddress || 'local';
    const timestamp = now();
    let entry = buckets.get(ip);
    if (!entry || timestamp - entry.start >= windowMs) {
      entry = { start: timestamp, count: 0 };
    }
    entry.count += 1;
    buckets.set(ip, entry);
    if (entry.count > max) {
      const seconds = Math.max(1, Math.ceil((entry.start + windowMs - timestamp) / 1000));
      res.setHeader('Retry-After', String(seconds));
      return res.status(429).json(errorResponse(req, 'too_many_requests', 'RATE_LIMITED', []));
    }
    // Simple bounded cleanup for a long-running demo server.
    if (buckets.size > 500) {
      for (const [key, value] of buckets) {
        if (timestamp - value.start >= windowMs) buckets.delete(key);
      }
    }
    next();
  };
}

export function isLocalRequest(req) {
  const address = req.ip || req.socket?.remoteAddress || '';
  return address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1';
}

export function createDemoMiddleware({ enabled = false } = {}) {
  const seen = new Map();
  return (req, res, next) => {
    // For security, fault injection is opt-in and only accessible from localhost.
    if (!enabled || !isLocalRequest(req)) return next();
    const mode = req.get('X-Demo-Scenario');
    if (!mode) return next();
    const once = mode === 'fail-once' || mode === 'rate-once';
    if (once) {
      const key = `${req.requestId}:${mode}`;
      if (seen.has(key)) return next();
      seen.set(key, Date.now());
      if (seen.size > 200) {
        const cutoff = Date.now() - 60_000;
        for (const [k, timestamp] of seen) if (timestamp < cutoff) seen.delete(k);
      }
    }
    if (mode === 'fail-once' || mode === 'fail-always') {
      return res.status(503).json(errorResponse(req, 'unavailable', 'DEMO_UNAVAILABLE', []));
    }
    if (mode === 'rate-once') {
      res.setHeader('Retry-After', '1');
      return res.status(429).json(errorResponse(req, 'too_many_requests', 'DEMO_RATE_LIMIT', []));
    }
    if (mode === 'slow') {
      return setTimeout(() => { if (!res.writableEnded && !res.destroyed) next(); }, 1600);
    }
    next();
  };
}
