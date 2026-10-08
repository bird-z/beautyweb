// 旧后端（manage.bioqif.com → Payload）最小 HTTP 客户端
// 只封装 GET，带超时与错误归一化；POST/PUT 等管理动作不经过这里
const API_BASE = (import.meta.env.VITE_API_BASE || 'https://manage.bioqif.com').replace(/\/$/, '');
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 8000;

export class HttpError extends Error {
  constructor(message, { status, url } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

/**
 * GET 一个 JSON 资源
 * @param {string} path  以 / 开头的路径，如 /api/public-articles
 * @param {object} opts  { params: {k:v}, timeout, signal }
 * @returns {Promise<any>} 解析后的 JSON
 */
export async function getJSON(path, { params, timeout = DEFAULT_TIMEOUT, signal } = {}) {
  const url = new URL(path, API_BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), timeout);
  if (signal) {
    if (signal.aborted) ctrl.abort(signal.reason);
    else signal.addEventListener('abort', () => ctrl.abort(signal.reason), { once: true });
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new HttpError(`GET ${url.pathname} → ${res.status}`, {
        status: res.status,
        url: url.toString(),
      });
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export { API_BASE };
