import { Link } from 'react-router-dom';
import { CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { COUNCIL, DEPARTMENTS, STUDIOS } from '../data/content.js';

// 组织结构图：理事会 → 四个部门 → 工作室，用发光连线串起来
export default function Org() {
  return (
    <>
      <PageHead lede="理事会、各部门与工作室的组织关系。" />
      <section className="section">
        <div className="wrap tree">
          <Reveal className="tree__root glass">
            <p className="eyebrow">Council · 理事会</p>
            <ul className="council">
              {COUNCIL.map((c, i) => (
                <li key={i}><span className="council__role">{c.title}</span><b>{c.name}</b></li>
              ))}
            </ul>
          </Reveal>
          <div className="tree__stem" aria-hidden="true" />
          <ol className="tree__depts">
            {DEPARTMENTS.map((d, i) => (
              <Reveal as="li" key={d.name} delay={i * 90} className="dept glass glow">
                <span className="mono dept__no">D-0{i + 1} · {d.en}</span>
                <h2>{d.name}</h2>
                <p>{d.text}</p>
              </Reveal>
            ))}
          </ol>
          <div className="tree__stem" aria-hidden="true" />
          <Reveal className="tree__studios">
            <p className="eyebrow">Studios · 下属工作室</p>
            <div className="tree__row">
              {STUDIOS.map((s) => (
                <Link key={s.key} to="/studios" className="studio-chip glass glow">
                  <b>{s.name}</b><span>{s.tags.slice(0, 2).join(' · ')}</span><span className="studio-chip__arr" aria-hidden="true">↗</span>
                </Link>
              ))}
              <Link to="/studios" className="studio-chip studio-chip--empty">
                <b>下一间</b><span>等你来发起</span><span className="studio-chip__arr" aria-hidden="true">+</span>
              </Link>
            </div>
          </Reveal>
          <p className="note">理事会名单待公布。</p>
        </div>
      </section>
      <CTA />
    </>
  );
}
