// useResource / 五态 hook
// 参考 docs/api/web-data-access.md §4

import { useEffect, useRef, useState, useCallback } from 'react';
import { ApiError } from './http.js';

const CACHE = new Map();
const CACHE_TTL = 60_000;
const MIN_LOADING_MS = 200;

function cacheKey(deps) {
  return JSON.stringify(deps);
}

/**
 * @param {(o:{signal:AbortSignal}) => Promise<T>} fn
 * @param {unknown[]} deps 请求参数变化时重新拉
 * @param {{ notFoundOn?: (data:any)=>boolean, cacheKey?: string }} opts
 */
export function useResource(fn, deps = [], opts = {}) {
  const key = opts.cacheKey ?? cacheKey(deps);
  const [state, setState] = useState(() => {
    const cached = CACHE.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      return { status: 'ready', data: cached.data };
    }
    return { status: 'idle' };
  });
  const reqId = useRef(0);
  const retry = useCallback(() => {
    CACHE.delete(key);
    setState({ status: 'loading' });
    reqId.current += 1;
    run(reqId.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // run 的引用在 useEffect 里;用 ref 避免闭包陈旧
  const runRef = useRef();
  const run = useCallback((id) => runRef.current(id), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const id = ++reqId.current;

    runRef.current = async (rid) => {
      const started = Date.now();
      setState({ status: 'loading' });
      try {
        const data = await fn({ signal: ctrl.signal });
        if (rid !== reqId.current) return; // 竞态:旧响应丢弃
        // 最短 loading 200ms 防抖
        const elapsed = Date.now() - started;
        if (elapsed < MIN_LOADING_MS) await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
        if (rid !== reqId.current) return;
        if (opts.notFoundOn?.(data)) {
          setState({ status: 'notFound' });
        } else {
          CACHE.set(key, { data, at: Date.now() });
          setState({ status: 'ready', data });
        }
      } catch (e) {
        if (rid !== reqId.current) return;
        if (e?.name === 'AbortError' || ctrl.signal.aborted) return;
        setState({ status: 'error', error: e instanceof ApiError ? e : new ApiError('unknown', e?.message), retry });
      }
    };
    run(id);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // retry 引用挂到 error 态上
  if (state.status === 'error' && state.retry !== retry) {
    return { ...state, retry };
  }
  return state;
}
