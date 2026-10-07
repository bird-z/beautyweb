import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CTA, NewsLead, NewsRow, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import { SECTIONS } from '../data/site.js';
import { useResource } from '../services/hooks.js';
import { getSite, listArticles, listDepartments, listEvents, listMembers, listStudios } from '../services/endpoints.js';

const ORB = ['#86e0c8', '#6cc9d6', '#f0c890', '#b9eadc'];
const INDEX = SECTIONS.filter((s) => !['/join', '/news'].includes(s.to));

// 3D 种子旁的说明牌：位置与进度由 three/Space.js 通过 qif:seed 事件推送
function SeedLabel() {
  const [d, setD] = useState(null);
  useEffect(() => {
    const on = (e) => setD(e.detail);
    window.addEventListener('qif:seed', on);
    return () => window.removeEventListener('qif:seed', on);
  }, []);
  if (!d?.show) return null;
  const done = d.p >= 99;
  // 挂到 body：页面过渡动画的 transform 会让 position: fixed 相对 main 定位而错位
  return createPortal(
    <p className="seedtag" style={{ left: d.x, top: d.y, opacity: d.o }} aria-hidden="true">
      <span className="seedtag__line" />
      <span className="seedtag__box">
        <span className="mono seedtag__k">Seed · 生长 {d.p}%</span>
        <b>{done ? '生根发芽，下一粒种子是你' : '一粒因热爱播种的种子'}</b>
        <span className="seedtag__hint">{done ? '加入我们，一起长大' : '向下滚动，看它长大 ↓'}</span>
      </span>
    </p>,
    document.body
  );
}

// 栏目索引：左侧清爽的编号列表，右侧预览卡随悬停切换
function Explore() {
  const [on, setOn] = useState(0);
  const s = INDEX[on];
  return (
    <div className="explore">
      <ol className="explore__list">
        {INDEX.map((d, i) => (
          <li key={d.to}>
            <Link to={d.to} className={`explore__a ${on === i ? 'is-on' : ''}`} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)}>
              <span className="mono">{d.no}</span>
              <b>{d.title}</b>
              <span className="explore__desc">{d.desc}</span>
              <span className="explore__arr" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="explore__peek glass" aria-hidden="true">
        <span key={s.to} className="explore__orb" style={{ '--c': ORB[on % 4] }} />
        <span className="mono explore__en">{s.no} · {s.en}</span>
        <span className="explore__title">{s.title}</span>
        <span className="explore__d">{s.desc}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const site = useResource(getSite, [], { cacheKey: 'site' });
  const news = useResource(listArticles, [], { cacheKey: 'articles' });
  const events = useResource(listEvents, [], { cacheKey: 'events' });
  const members = useResource(listMembers, [], { cacheKey: 'members' });
  const departments = useResource(listDepartments, [], { cacheKey: 'departments' });
  const studios = useResource(listStudios, [], { cacheKey: 'studios' });

  const all = [site, news, events, members, departments, studios];
  const pending = all.find((s) => s.status === 'loading' || s.status === 'idle');
  const failed = all.find((s) => s.status === 'error');
  if (pending || failed) {
    const st = pending || failed;
    return <Async state={st} render={() => null} />;
  }

  const s = site.data ?? {};
  const articles = news.data ?? [];
  const [lead, ...rest] = articles;
  const pillarList = s.pillars ?? [];
  const facts = [
    [String(members.data?.length ?? 0), '位会员'],
    [String(departments.data?.length ?? 0).padStart(2, '0'), '职能部门'],
    [String(studios.data?.length ?? 0).padStart(2, '0'), '特色工作室'],
  ];
  // 「即将启程」：优先取含未举办活动的学期,否则取最近一个学期
  const groups = [];
  for (const e of events.data ?? []) {
    let g = groups.find((x) => x.term === e.term);
    if (!g) { g = { term: e.term, items: [] }; groups.push(g); }
    g.items.push(e);
  }
  const next = groups.find((g) => g.items.some((e) => e.statusLabel !== '已举办')) ?? groups[0];

  return (
    <>
      <section className="hero">
        <div className="wrap hero__wrap">
          <p className="hero__pill"><span className="hero__live" aria-hidden="true" />{s.school} · {s.en}</p>
          <h1 className="hero__title">
            <span className="hero__line">启迪生命</span>
            <span className="hero__line grad">扉向未来</span>
          </h1>
          <p className="hero__lede">{s.motto}</p>
          <div className="hero__btns">
            <Link to="/join" className="btn btn--pri">加入我们 <span className="arr">→</span></Link>
            <Link to="/about" className="btn btn--ghost">认识启扉</Link>
          </div>
          <dl className="hero__facts">
            {facts.map(([n, l]) => <div key={l}><dt>{n}</dt><dd>{l}</dd></div>)}
          </dl>
        </div>
        <SeedLabel />
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head"><div><p className="eyebrow">Bio · 生命 — Qif · 启扉</p><h2 className="h2">因热爱而启程，<br />在四个方向上生长</h2></div></Reveal>
          <ul className="pillars">
            {pillarList.map((p, i) => (
              <Reveal as="li" key={p.name} delay={i * 90} className="pillar glass glow">
                <span className="pillar__orb" style={{ '--c': ORB[i % ORB.length] }} aria-hidden="true" />
                <span className="mono pillar__en">0{i + 1} · {p.en}</span>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <div><p className="eyebrow">News · 启扉快讯</p><h2 className="h2">最近发生的事</h2></div>
            <Link to="/news" className="tlink">全部快讯 <span className="arr">→</span></Link>
          </Reveal>
          {lead ? (
            <>
              <Reveal><NewsLead n={lead} /></Reveal>
              <Reveal className="nlist" delay={100}>{rest.slice(0, 3).map((n) => <NewsRow key={n.id} n={n} />)}</Reveal>
            </>
          ) : <p className="empty">快讯筹备中，敬请期待。</p>}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head"><div><p className="eyebrow">Explore · 探索</p><h2 className="h2">协会的每一个角落</h2></div></Reveal>
          <Reveal><Explore /></Reveal>
        </div>
      </section>

      {next && (
        <section className="section">
          <div className="wrap">
            <Reveal className="sec-head">
              <div><p className="eyebrow">Next · {next.term}</p><h2 className="h2">即将启程</h2></div>
              <Link to="/events" className="tlink">品牌活动 <span className="arr">→</span></Link>
            </Reveal>
            <div className="upnext">
              {next.items.map((e, i) => (
                <Reveal key={e.id} delay={i * 120} className="upnext__card glass glow">
                  <span className="upnext__orb" style={{ '--c': ORB[i + 1] }} aria-hidden="true" />
                  <span className="tag tag--on">{e.statusLabel}</span>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTA />
    </>
  );
}
