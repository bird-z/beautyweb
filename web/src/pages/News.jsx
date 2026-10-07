import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Chips, Cover, NewsLead, NewsRow, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import NotFound from './NotFound.jsx';
import { NEWS_CATS } from '../data/news.js';
import { useResource } from '../services/hooks.js';
import { getArticle, listArticles, postArticleView } from '../services/endpoints.js';
// 按「年 · 月」分组，保持原有的倒序
function months(list) {
  const map = new Map();
  list.forEach((n) => {
    const [y, m] = (n.date || '--').split('-');
    const k = `${y} · ${m} 月`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(n);
  });
  return [...map];
}

export function NewsIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const news = useResource(listArticles, [], { cacheKey: 'articles' });
  return (
    <>
      <PageHead lede="记录启扉的每一次探索、实践与成长。" />
      <section className="section">
        <div className="wrap">
          <Async state={news} render={(all) => {
            const list = all.filter((n) => !cat || (n.cats ?? []).includes(cat));
            return (
              <>
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
              </>
            );
          }} />
        </div>
      </section>
    </>
  );
}

export function NewsDetail() {
  const { id } = useParams();
  const article = useResource((o) => getArticle(id, o), [id], {
    cacheKey: `article:${id}`,
    notFoundOn: (d) => !d,
  });
  const list = useResource(listArticles, [], { cacheKey: 'articles' });
  const [views, setViews] = useState(null);

  // 详情页记一次浏览;失败静默,不影响阅读
  const pid = article.status === 'ready' ? article.data?.pid : null;
  useEffect(() => {
    if (!pid) return;
    postArticleView(pid).then((v) => v != null && setViews(v)).catch(() => {});
  }, [pid]);

  if (article.status === 'notFound') {
    return <NotFound title="这篇新闻还没有发布" text="它可能尚未发布、已经归档，或者链接有误。" back="/news" backText="返回快讯" />;
  }

  return (
    <Async state={article} render={(n) => {
      const all = list.status === 'ready' ? list.data : [];
      const i = all.findIndex((x) => x.id === n.id);
      const newer = i > 0 ? all[i - 1] : null;
      const older = i >= 0 ? all[i + 1] : null;
      return (
        <article>
          <PageHead title={n.title} crumb="正文" />
          <div className="wrap article">
            <aside className="article__meta glass">
              <dl>
                <div><dt className="mono">发布</dt><dd>{(n.date || '').replaceAll('-', '.')}</dd></div>
                <div><dt className="mono">分类</dt><dd>{n.cat}</dd></div>
                <div><dt className="mono">来源</dt><dd>{n.source}</dd></div>
                <div><dt className="mono">浏览</dt><dd>{views ?? n.views ?? '—'}</dd></div>
              </dl>
            </aside>
            <div className="article__main">
              <p className="article__abs"><span className="mono">摘要 · Abstract</span>{n.excerpt}</p>
              <Cover seed={n.id} ratio={0.5} label="封面待补充" className="article__cover" />
              {/* content 为服务端 Lexical→HTML 输出 */}
              <div className="prose" dangerouslySetInnerHTML={{ __html: n.content }} />
              <nav className="pager" aria-label="上一篇与下一篇">
                {older ? <Link to={`/news/${older.id}`} className="pager__a glass glow"><span className="mono">← 上一篇</span><b>{older.title}</b></Link> : <span />}
                {newer ? <Link to={`/news/${newer.id}`} className="pager__a pager__a--r glass glow"><span className="mono">下一篇 →</span><b>{newer.title}</b></Link> : <span />}
              </nav>
            </div>
          </div>
        </article>
      );
    }} />
  );
}
