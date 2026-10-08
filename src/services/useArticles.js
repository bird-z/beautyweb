import { useEffect, useState } from 'react';
import { fetchArticles } from './articles.js';
import { NEWS } from '../data/news.js';

/**
 * 加载文章列表：优先远程 /api/public-articles，失败或为空时回退到本地硬编码 NEWS。
 * @returns {{ list: Array, loading: boolean, remote: boolean }}
 *   remote=true 表示数据来自后端，false 表示本地兜底数据
 */
export function useArticles() {
  const [state, setState] = useState({ list: NEWS, loading: true, remote: false });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchArticles({ signal: ctrl.signal })
      .then((list) => {
        if (!ctrl.signal.aborted) {
          setState({ list: list.length ? list : NEWS, loading: false, remote: list.length > 0 });
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setState({ list: NEWS, loading: false, remote: false });
        }
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
