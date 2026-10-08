import { useEffect, useState } from 'react';
import { fetchMemberArticles } from './articles.js';
import { ROSTER } from '../data/people.js';

/**
 * 会员名录 = 本地 ROSTER（124 人，含演示占位）+ 远程"会员"分类文章。
 * 远程会员排在最前；远程失败/为空时只显示本地名录。
 * @returns {{ list: Array, loading: boolean, remoteCount: number }}
 */
export function useMemberArticles() {
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMemberArticles({ signal: ctrl.signal })
      .then((list) => {
        if (!ctrl.signal.aborted) {
          setRemote(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          setRemote([]);
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, []);

  return { list: [...remote, ...ROSTER], loading, remoteCount: remote.length };
}
