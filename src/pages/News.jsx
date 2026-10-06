import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Chips, Cover, NewsLead, NewsRow, PageHead, Reveal } from '../components/Bits.jsx';
import NotFound from './NotFound.jsx';
import { NEWS, NEWS_CATS } from '../data/news.js';

// 按「年 · 月」分组，保持原有的倒序
function months(list) {
  const map = new Map();
  list.forEach((n) => {
    const [y, m] = n.date.split('-');
    const k = `${y} · ${m} 月`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(n);
  });
  return [...map];
}

export function NewsIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const list = NEWS.filter((n) => !cat || n.cat === cat);
  return (
    <>
      <PageHead lede="记录启扉的每一次探索、实践与成长。" />
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <Chips items={NEWS_CATS} value={cat} onChange={(v) => setParams(v ? { cat: v } : {}, { replace: true })} label="按分类筛选" />
            <span className="mono toolbar__count">{String(list.length).padStart(2, '0')} 篇</span>
          </div>
          {list.length ? (
            <>
              <Reveal><NewsLead n={list[0]} /></Reveal>
              {months(list.slice(1)).map(([m, items]) => (
                <Reveal key={m} className="nmonth">
                  <h2 className="nmonth__h mono">{m}</h2>
                  <div className="nlist">{items.map((n) => <NewsRow key={n.id} n={n} />)}</div>
                </Reveal>
              ))}
            </>
          ) : <p className="empty">这一类暂时还没有快讯。</p>}
        </div>
      </section>
    </>
  );
}

export function NewsDetail() {
  const { id } = useParams();
  const i = NEWS.findIndex((n) => n.id === id);
  if (i < 0) return <NotFound title="这篇新闻还没有发布" text="它可能尚未发布、已经归档，或者链接有误。" back="/news" backText="返回快讯" />;
  const n = NEWS[i];
  const newer = NEWS[i - 1];
  const older = NEWS[i + 1];
  return (
    <article>
      <PageHead title={n.title} crumb="正文" />
      <div className="wrap article">
        <aside className="article__meta glass">
          <dl>
            <div><dt className="mono">发布</dt><dd>{n.date.replaceAll('-', '.')}</dd></div>
            <div><dt className="mono">分类</dt><dd>{n.cat}</dd></div>
            <div><dt className="mono">来源</dt><dd>{n.source}</dd></div>
            <div><dt className="mono">浏览</dt><dd>{n.views || '—'}</dd></div>
          </dl>
        </aside>
        <div className="article__main">
          <p className="article__abs"><span className="mono">摘要 · Abstract</span>{n.excerpt}</p>
          <Cover seed={n.id} ratio={0.5} label="封面待补充" className="article__cover" />
          <div className="prose">{n.body.map((p, k) => <p key={k}>{p}</p>)}</div>
          <nav className="pager" aria-label="上一篇与下一篇">
            {older ? <Link to={`/news/${older.id}`} className="pager__a glass glow"><span className="mono">← 上一篇</span><b>{older.title}</b></Link> : <span />}
            {newer ? <Link to={`/news/${newer.id}`} className="pager__a pager__a--r glass glow"><span className="mono">下一篇 →</span><b>{newer.title}</b></Link> : <span />}
          </nav>
        </div>
      </div>
    </article>
  );
}
