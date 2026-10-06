import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sectionOf } from '../data/site.js';

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [inView, setIn] = useState(false);
  // delay 只服务于入场动画；入场结束后必须清掉，否则会拖慢悬停等后续过渡
  const [staggered, setStaggered] = useState(delay > 0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setIn(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!inView || !staggered) return;
    const t = setTimeout(() => setStaggered(false), delay + 1000);
    return () => clearTimeout(t);
  }, [inView, staggered, delay]);
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={staggered ? { transitionDelay: `${delay}ms` } : undefined}
      onTransitionEnd={(e) => { if (e.target === ref.current && inView) setStaggered(false); }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// 子页页头：编号 + 渐变大标题
export function PageHead({ title, lede, crumb }) {
  const { pathname } = useLocation();
  const s = sectionOf(pathname) || { no: '00', title: title || '', en: 'Lost', to: '/' };
  return (
    <header className="phead">
      <div className="wrap">
        <nav className="phead__crumb mono" aria-label="面包屑导航">
          <Link to="/">首页</Link>
          <span aria-hidden="true">/</span>
          {crumb ? <><Link to={s.to}>{s.title}</Link><span aria-hidden="true">/</span><span aria-current="page">{crumb}</span></> : <span aria-current="page">{s.title}</span>}
        </nav>
        <p className="eyebrow">{s.no} · {s.en}</p>
        <h1 className={`phead__title ${crumb ? 'is-article' : ''}`}>{title || s.title}</h1>
        {lede && <p className="phead__lede">{lede}</p>}
      </div>
    </header>
  );
}

// 占位封面：由种子决定的一团星云（接入真实照片前保证每张不同且稳定）
const HUES = ['#86e0c8', '#6cc9d6', '#f0c890', '#b9eadc'];
export function Cover({ seed, ratio = 0.62, label = '图片待补充', className = '' }) {
  const bg = useMemo(() => {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const blob = () => `radial-gradient(${40 + r() * 50}% ${40 + r() * 50}% at ${r() * 100}% ${r() * 100}%, ${HUES[Math.floor(r() * 4)]}${['aa', 'cc', 'ff'][Math.floor(r() * 3)]}, transparent 72%)`;
    return [blob(), blob(), blob()].join(',');
  }, [seed]);
  return (
    <div className={`cover ${className}`} style={{ aspectRatio: `${1 / ratio}`, backgroundImage: bg }}>
      {label && <span className="cover__label">{label}</span>}
    </div>
  );
}

export function Chips({ items, value, onChange, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {['全部', ...items].map((c) => {
        const v = c === '全部' ? '' : c;
        return (
          <button key={c} type="button" className={`chip ${value === v ? 'is-on' : ''}`} aria-pressed={value === v} onClick={() => onChange(v)}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

const fmt = (d) => d.replaceAll('-', '.');

// 头条：大图 + 文字并排
export function NewsLead({ n }) {
  return (
    <Link to={`/news/${n.id}`} className="nlead glass glow">
      <Cover seed={n.id} ratio={0.68} label="封面待补充" />
      <div className="nlead__body">
        <span className="nmeta"><span className="tag tag--on">{n.cat}</span><time className="mono" dateTime={n.date}>{fmt(n.date)}</time></span>
        <h3 className="nlead__title">{n.title}</h3>
        <p className="nlead__ex">{n.excerpt}</p>
        <span className="tlink">阅读全文 <span className="arr">→</span></span>
      </div>
    </Link>
  );
}

// 列表行：日期 · 分类 · 标题，留白充足，一行一条
export function NewsRow({ n }) {
  const [, m, d] = n.date.split('-');
  return (
    <Link to={`/news/${n.id}`} className="nrow">
      <span className="nrow__date"><b>{d}</b><span className="mono">{m} 月</span></span>
      <span className="nrow__main">
        <span className="nrow__cat">{n.cat}</span>
        <span className="nrow__title">{n.title}</span>
        <span className="nrow__ex">{n.excerpt}</span>
      </span>
      <span className="nrow__arr" aria-hidden="true">→</span>
    </Link>
  );
}

export function CTA({ title = '想一起做点有意思的事？', text = '不必已经专业，只需要保有好奇。' }) {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal className="cta glass">
          <span className="cta__orb" aria-hidden="true" />
          <h2 className="h2">{title}</h2>
          <p className="cta__text">{text}</p>
          <div className="cta__btns">
            <Link to="/join" className="btn btn--pri">加入我们 <span className="arr">→</span></Link>
            <Link to="/about" className="btn btn--ghost">了解协会</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
