import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CTA, NewsLead, NewsRow, Reveal } from '../components/Bits.jsx';
import { NEWS } from '../data/news.js';
import { EVENTS } from '../data/content.js';
import { ROSTER } from '../data/people.js';
import { ORG, PILLARS, SECTIONS } from '../data/site.js';

const ORB = ['#86e0c8', '#6cc9d6', '#f0c890', '#b9eadc'];
const INDEX = SECTIONS.filter((s) => !['/join', '/news'].includes(s.to));
const FACTS = [[String(ROSTER.length), '位会员'], ['04', '职能部门'], ['02', '特色工作室']];

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
  const next = EVENTS[EVENTS.length - 1];
  const [lead, ...rest] = NEWS;
  return (
    <>
      <section className="hero">
        <div className="wrap hero__wrap">
          <p className="hero__pill"><span className="hero__live" aria-hidden="true" />{ORG.school} · {ORG.en}</p>
          <h1 className="hero__title">
            <span className="hero__line">启迪生命</span>
            <span className="hero__line grad">扉向未来</span>
          </h1>
          <p className="hero__lede">{ORG.motto}</p>
          <div className="hero__btns">
            <Link to="/join" className="btn btn--pri">加入我们 <span className="arr">→</span></Link>
            <Link to="/about" className="btn btn--ghost">认识启扉</Link>
          </div>
          <dl className="hero__facts">
            {FACTS.map(([n, l]) => <div key={l}><dt>{n}</dt><dd>{l}</dd></div>)}
          </dl>
        </div>
        <SeedLabel />
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head"><div><p className="eyebrow">Bio · 生命 — Qif · 启扉</p><h2 className="h2">因热爱而启程，<br />在四个方向上生长</h2></div></Reveal>
          <ul className="pillars">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.name} delay={i * 90} className="pillar glass glow">
                <span className="pillar__orb" style={{ '--c': ORB[i] }} aria-hidden="true" />
                <span className="mono pillar__en">0{i + 1} · {p.en}</span>
                <h3>{p.name}</h3>
                <p>{p.text}</p>
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
          <Reveal><NewsLead n={lead} /></Reveal>
          <Reveal className="nlist" delay={100}>{rest.slice(0, 3).map((n) => <NewsRow key={n.id} n={n} />)}</Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head"><div><p className="eyebrow">Explore · 探索</p><h2 className="h2">协会的每一个角落</h2></div></Reveal>
          <Reveal><Explore /></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <div><p className="eyebrow">Next · {next.term}</p><h2 className="h2">即将启程</h2></div>
            <Link to="/events" className="tlink">品牌活动 <span className="arr">→</span></Link>
          </Reveal>
          <div className="upnext">
            {next.items.map((e, i) => (
              <Reveal key={e.title} delay={i * 120} className="upnext__card glass glow">
                <span className="upnext__orb" style={{ '--c': ORB[i + 1] }} aria-hidden="true" />
                <span className="tag tag--on">{e.status}</span>
                <h3>{e.title}</h3>
                <p>{e.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
