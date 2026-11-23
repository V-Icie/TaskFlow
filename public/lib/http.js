// Browser + Node-compatible fetch helper for practical #5.
const defaultSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function retryAfterMs(header, now = Date.now()) {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export function backoffMs(base, attempt, jitter = true, random = Math.random) {
  const exponential = base * 2 ** attempt;
  return Math.round(exponential + (jitter ? random() * (base / 2) : 0));
}

export async function fetchWithResilience(url, {
  retry = {}, idempotencyKey, requestId, onRetry, fetchImpl = globalThis.fetch,
  sleepImpl = defaultSleep, ...init
} = {}) {
  const { retries = 2, baseDelayMs = 300, timeoutMs = 3000, jitter = true } = retry;
  const method = (init.method || 'GET').toUpperCase();
  // PATCH/DELETE should not be retried blindly; POST must have a stable idem key.
  const retrySafe = ['GET', 'HEAD'].includes(method) || (method === 'POST' && Boolean(idempotencyKey));
  const maxRetries = retrySafe ? Math.max(0, Math.min(5, retries)) : 0;
  const headers = new Headers(init.headers || {});
  headers.set('X-Request-Id', requestId || crypto.randomUUID());
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
  if (init.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const external = init.signal;
    const externalAbort = () => controller.abort(external.reason);
    if (external?.aborted) controller.abort(external.reason);
    else external?.addEventListener('abort', externalAbort, { once: true });
    const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
    let response;
    let failure;
    try {
      response = await fetchImpl(url, { ...init, method, headers, signal: controller.signal });
    } catch (error) {
      failure = error;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', externalAbort);
    }

    if (external?.aborted) throw failure ?? external.reason ?? new Error('Request cancelled');

    const isServerError = response && response.status >= 500 && response.status <= 599;
    const isRateLimited = response?.status === 429;
    const retryable = Boolean(failure || isServerError || isRateLimited);
    if (!retryable || attempt === maxRetries) {
      if (failure) throw failure;
      return response;
    }
    let delayMs = backoffMs(baseDelayMs, attempt, jitter);
    if (isRateLimited) {
      const suggested = retryAfterMs(response.headers.get('Retry-After'));
      if (suggested !== null) delayMs = suggested;
    }
    // Respect modest Retry-After values; cap to prevent a demo UI from hanging for hours.
    delayMs = Math.min(30_000, delayMs);
    onRetry?.({ attempt: attempt + 1, delayMs, reason: failure ? 'network/timeout' : `HTTP ${response.status}` });
    await sleepImpl(delayMs);
  }
}
