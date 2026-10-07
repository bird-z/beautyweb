import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Chips, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import NotFound from './NotFound.jsx';
import { NOTE_CATS } from '../data/notes.js';
import { useResource } from '../services/hooks.js';
import { getNote, listNotes } from '../services/endpoints.js';

export function PopularIndex() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const notes = useResource(listNotes, [], { cacheKey: 'notes' });
  return (
    <>
      <PageHead lede="把课堂上学不到的、实验里踩过的坑，写成人人可读的笔记。这里沉淀协会成员的学习记录，也欢迎每一个路过的你取走。" />
      <section className="section">
        <div className="wrap">
          <Async state={notes} render={(all) => {
            const list = all.filter((n) => !cat || n.category === cat);
            // 分类 chips 优先用静态顺序,再补上数据里出现的新分类
            const cats = NOTE_CATS.length ? NOTE_CATS : [...new Set(all.map((n) => n.category))];
            return (
              <>
                <div className="toolbar">
                  <Chips items={cats} value={cat} onChange={(v) => setParams(v ? { cat: v } : {}, { replace: true })} label="按分类筛选" />
                  <span className="mono toolbar__count">{String(list.length).padStart(2, '0')} 篇</span>
                </div>
                <ul className="notes">
                  {list.map((n, i) => (
                    <Reveal as="li" key={n.slug || n.id} delay={(i % 3) * 80}>
                      <Link to={`/popular/${n.slug}`} className="notecard glass glow">
                        <span className="notecard__top mono"><span>{n.category}</span><span>N°{String(all.indexOf(n) + 1).padStart(2, '0')}</span></span>
                        <h2>{n.title}</h2>
                        <p>{n.lede}</p>
                        <span className="notecard__foot mono"><time dateTime={n.date}>{(n.date || '').replaceAll('-', '.')}</time><span aria-hidden="true">↗</span></span>
                      </Link>
                    </Reveal>
                  ))}
                </ul>
              </>
            );
          }} />
        </div>
      </section>
    </>
  );
}

export function PopularDetail() {
  const { id } = useParams();
  const note = useResource((o) => getNote(id, o), [id], {
    cacheKey: `note:${id}`,
    notFoundOn: (d) => !d,
  });
  const list = useResource(listNotes, [], { cacheKey: 'notes' });

  if (note.status === 'notFound') {
    return <NotFound title="文章未找到" text="这篇文章可能已被移动或重命名。" back="/popular" backText="返回知识普及" />;
  }

  return (
    <Async state={note} render={(n) => {
      const all = list.status === 'ready' ? list.data : [];
      const more = all.filter((x) => x.category === n.category && x.slug !== n.slug).slice(0, 2);
      return (
        <article>
          <PageHead title={n.title} crumb="正文" />
          <div className="wrap article">
            <aside className="article__meta glass">
              <dl>
                <div><dt className="mono">分类</dt><dd>{n.category}</dd></div>
                <div><dt className="mono">更新</dt><dd>{(n.date || '').replaceAll('-', '.')}</dd></div>
              </dl>
              <Link to="/popular" className="tlink">← 返回知识普及</Link>
            </aside>
            <div className="article__main">
              <p className="article__abs"><span className="mono">要点 · TL;DR</span>{n.lede}</p>
              {/* content 为服务端 Lexical→HTML 输出 */}
              <div className="prose" dangerouslySetInnerHTML={{ __html: n.content }} />
              {more.length > 0 && (
                <div className="more">
                  <p className="eyebrow">同类笔记</p>
                  {more.map((m) => <Link key={m.slug} to={`/popular/${m.slug}`} className="more__a glass glow">{m.title} <span aria-hidden="true">↗</span></Link>)}
                </div>
              )}
            </div>
          </div>
        </article>
      );
    }} />
  );
}
