// 统一渲染 useResource 的五态
// docs/api/web-data-access.md §4.2
import { Link } from 'react-router-dom';

const styles = {
  wrap: { padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted, #888)' },
  err: { color: 'var(--danger, #e07070)' },
  btn: {
    marginTop: '1rem',
    padding: '0.5rem 1.25rem',
    border: '1px solid currentColor',
    borderRadius: '999px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  link: { color: 'inherit', textDecoration: 'underline' },
};

export function Loading({ text = '加载中…' }) {
  return (
    <div style={styles.wrap} role="status" aria-live="polite">
      {text}
    </div>
  );
}

export function Empty({ text = '暂无内容' }) {
  return <div style={styles.wrap}>{text}</div>;
}

export function ErrorState({ error, retry }) {
  const isRateLimited = error?.code === 'rate_limited';
  return (
    <div style={{ ...styles.wrap, ...styles.err }} role="alert">
      <p>{isRateLimited ? '操作过于频繁,请稍后再试。' : '加载失败,请检查网络后重试。'}</p>
      {retry && !isRateLimited && (
        <button type="button" style={styles.btn} onClick={retry}>
          重试
        </button>
      )}
    </div>
  );
}

export function NotFoundState({ hint }) {
  return (
    <div style={styles.wrap}>
      <p>{hint || '页面不存在或已被移除。'}</p>
      <Link to="/" style={styles.link}>回到首页</Link>
    </div>
  );
}

/**
 * state = useResource(...) 的返回值
 * render = (data) => ReactNode
 * emptyRender / notFoundRender 可选覆盖
 */
export function Async({ state, render, empty, emptyRender, notFoundRender, loadingText }) {
  if (state.status === 'idle' || state.status === 'loading') return <Loading text={loadingText} />;
  if (state.status === 'error') return <ErrorState error={state.error} retry={state.retry} />;
  if (state.status === 'notFound') return notFoundRender ? notFoundRender() : <NotFoundState />;
  // ready
  const data = state.data;
  if (empty && (data == null || (Array.isArray(data) && data.length === 0))) {
    return emptyRender ? emptyRender() : <Empty />;
  }
  return render(data);
}
