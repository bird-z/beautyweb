import { Fragment } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Chips, PageHead, Reveal } from '../components/Bits.jsx';
import NotFound from './NotFound.jsx';
import { NOTES, NOTE_CATS } from '../data/notes.js';

// 行内 `code` → <code>
function Inline({ text }) {
  return text.split(/(`[^`]+`)/g).map((s, i) =>
    s.startsWith('`') ? <code key={i}>{s.slice(1, -1)}</code> : <Fragment key={i}>{s}</Fragment>
  );
}

export function PopularIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const list = NOTES.filter((n) => !cat || n.cat === cat);
  return (
    <>
      <PageHead lede="把课堂上学不到的、实验里踩过的坑，写成人人可读的笔记。这里沉淀协会成员的学习记录，也欢迎每一个路过的你取走。" />
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <Chips items={NOTE_CATS} value={cat} onChange={(v) => setParams(v ? { cat: v } : {}, { replace: true })} label="按分类筛选" />
            <span className="mono toolbar__count">{String(list.length).padStart(2, '0')} 篇</span>
          </div>
          <ul className="notes">
            {list.map((n, i) => (
              <Reveal as="li" key={n.id} delay={(i % 3) * 80}>
                <Link to={`/popular/${n.id}`} className="notecard glass glow">
                  <span className="notecard__top mono"><span>{n.cat}</span><span>N°{String(NOTES.indexOf(n) + 1).padStart(2, '0')}</span></span>
                  <h2>{n.title}</h2>
                  <p>{n.lede}</p>
                  <span className="notecard__foot mono"><time dateTime={n.date}>{n.date.replaceAll('-', '.')}</time><span aria-hidden="true">↗</span></span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function PopularDetail() {
  const { id } = useParams();
  const n = NOTES.find((x) => x.id === id);
  if (!n) return <NotFound title="文章未找到" text="这篇文章可能已被移动或重命名。" back="/popular" backText="返回知识普及" />;
  const more = NOTES.filter((x) => x.cat === n.cat && x.id !== n.id).slice(0, 2);
  return (
    <article>
      <PageHead title={n.title} crumb="正文" />
      <div className="wrap article">
        <aside className="article__meta glass">
          <dl>
            <div><dt className="mono">分类</dt><dd>{n.cat}</dd></div>
            <div><dt className="mono">更新</dt><dd>{n.date.replaceAll('-', '.')}</dd></div>
          </dl>
          <Link to="/popular" className="tlink">← 返回知识普及</Link>
        </aside>
        <div className="article__main">
          <p className="article__abs"><span className="mono">要点 · TL;DR</span>{n.lede}</p>
          <div className="prose">
            {n.blocks.map(([type, v], k) => {
              if (type === 'h') return <h2 key={k}>{v}</h2>;
              if (type === 'code') return <pre key={k}><code>{v}</code></pre>;
              if (type === 'ul') return <ul key={k}>{v.map((li) => <li key={li}><Inline text={li} /></li>)}</ul>;
              return <p key={k}><Inline text={v} /></p>;
            })}
          </div>
          {more.length > 0 && (
            <div className="more">
              <p className="eyebrow">同类笔记</p>
              {more.map((m) => <Link key={m.id} to={`/popular/${m.id}`} className="more__a glass glow">{m.title} <span aria-hidden="true">↗</span></Link>)}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
