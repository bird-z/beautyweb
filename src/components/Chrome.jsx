import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ORG, SECTIONS } from '../data/site.js';
import { useScrolled } from '../lib/hooks.js';
import { useMotion } from '../lib/motion.js';

// 顶栏只放 6 个高频入口，其余在「更多」菜单里
const NAV = ['/about', '/news', '/science', '/events', '/members', '/popular'].map((to) => SECTIONS.find((s) => s.to === to));

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${ORG.school}${ORG.name} · 返回首页`}>
      <span className="logo__orb" aria-hidden="true" />
      <span className="logo__txt">
        <b>生物启扉</b>
        <span className="mono">BioQif</span>
      </span>
    </Link>
  );
}

export function Header({ menuOpen, onMenu }) {
  const scrolled = useScrolled(24);
  return (
    <header className={`hdr ${scrolled ? 'is-scrolled' : ''}`}>
      <Logo />
      <nav className="hdr__nav" aria-label="主导航" inert={menuOpen || undefined}>
        {NAV.map((s) => (
          <NavLink key={s.to} to={s.to} className="hdr__link">{s.title}</NavLink>
        ))}
      </nav>
      <div className="hdr__end">
        <Link to="/join" className="btn btn--pri hdr__cta" inert={menuOpen || undefined} tabIndex={menuOpen ? -1 : undefined}>加入我们</Link>
        <button
          type="button"
          className={`hdr__burger ${menuOpen ? 'is-open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? '关闭菜单' : '打开全部栏目'}
          onClick={onMenu}
        >
          <span className="hdr__burger-txt">{menuOpen ? '关闭' : '更多'}</span>
          <span className="hdr__burger-ico" aria-hidden="true"><i /><i /></span>
        </button>
      </div>
    </header>
  );
}

export function Menu({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  return (
    <div id="site-menu" className={`menu ${open ? 'is-open' : ''}`} inert={open ? undefined : true}>
      <nav aria-label="移动端导航">
        <ul className="menu__list">
          {SECTIONS.map((s, i) => (
            <li key={s.to} style={{ '--i': i }}>
              <NavLink to={s.to} onClick={onClose}>
                <span className="mono">{s.no}</span>
                <b>{s.title}</b>
                <span className="menu__en mono">{s.en}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <p className="menu__foot mono">{ORG.slogan}</p>
    </div>
  );
}

// 动效开关：默认开启；需要减少动态效果的访客可以在这里关闭
function MotionSwitch() {
  const [on, set] = useMotion();
  return (
    <button type="button" role="switch" aria-checked={on} className={`mswitch ${on ? 'is-on' : ''}`} onClick={() => set(!on)}>
      <span className="mswitch__track" aria-hidden="true"><i /></span>
      动效 {on ? '开' : '关'}
    </button>
  );
}

export function Footer() {
  return (
    <footer className="ftr" id="contact" aria-label="页底信息与联系方式">
      <div className="wrap">
        <div className="ftr__panel glass">
          <div className="ftr__top">
            <p className="ftr__slogan"><span>启迪生命</span><span className="grad">扉向未来</span></p>
            <Link to="/join" className="btn btn--pri">成为同路人 <span className="arr">→</span></Link>
          </div>
          <div className="ftr__grid">
            <div>
              <Logo />
              <p className="ftr__org">{ORG.school} · {ORG.name}</p>
              <p className="mono ftr__en">{ORG.sloganEn}</p>
            </div>
            <div>
              <h2 className="ftr__h mono">联系我们</h2>
              <ul className="ftr__list">
                <li>{ORG.address}</li>
                <li><span>校外合作 / 企业交流</span><a href={`mailto:${ORG.mailCoop}`}>{ORG.mailCoop}</a></li>
                <li><span>校内报名 / 活动咨询</span><a href={`mailto:${ORG.mailOffice}`}>{ORG.mailOffice}</a></li>
                <li><span>B 站</span><span className="ftr__todo">链接待补充</span></li>
              </ul>
            </div>
            <nav aria-label="页脚导航">
              <h2 className="ftr__h mono">栏目</h2>
              <ul className="ftr__links">
                {SECTIONS.map((s) => <li key={s.to}><Link to={s.to}>{s.title}</Link></li>)}
              </ul>
            </nav>
          </div>
        </div>
        <div className="ftr__bar mono">
          <span>© 2026 {ORG.school}{ORG.name}</span>
          <MotionSwitch />
        </div>
      </div>
    </footer>
  );
}
