// fetch wrapper:超时、取消、错误归一化
// 参考 docs/api/web-data-access.md §3.1

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 8000;

export class ApiError extends Error {
  constructor(code, message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.body = body;
  }
}

const STATUS_CODE = {
  400: 'bad_request',
  404: 'not_found',
  429: 'rate_limited',
  500: 'server',
};

export async function request(path, { signal, timeoutMs = DEFAULT_TIMEOUT, method = 'GET', body } = {}) {
  const url = new URL(path, API_BASE);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort('timeout'), timeoutMs);

  // 上游 signal 也联到本地 ctrl
  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else signal.addEventListener('abort', () => ctrl.abort(signal.reason), { once: true });
  }

  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timer);

    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch {
      throw new ApiError('bad_payload', `Invalid JSON from ${url}`, res.status, text);
    }

    if (!res.ok) {
      const code = STATUS_CODE[res.status] || 'unknown';
      const msg = json?.error?.message || json?.error || `HTTP ${res.status}`;
      throw new ApiError(code, msg, res.status, json);
    }
    return { data: json?.data, raw: json };
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') {
      const reason = ctrl.signal.reason;
      if (reason === 'timeout') throw new ApiError('timeout', `Request timed out after ${timeoutMs}ms`);
      throw e; // 外部 abort 原样抛出,让 hook 静默
    }
    throw new ApiError('network', e?.message || 'Network error', undefined, undefined);
  }
}
