import { Link } from 'react-router-dom';
import { CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import { useResource } from '../services/hooks.js';
import { listCouncil, listDepartments, listStudios } from '../services/endpoints.js';

// 组织结构图：理事会 → 四个部门 → 工作室，用发光连线串起来
export default function Org() {
  const council = useResource(listCouncil, [], { cacheKey: 'council' });
  const departments = useResource(listDepartments, [], { cacheKey: 'departments' });
  const studios = useResource(listStudios, [], { cacheKey: 'studios' });
  // 只要有一个还在加载,整块显示 loading
  const pending = [council, departments, studios].find((s) => s.status === 'loading' || s.status === 'idle');
  const failed = [council, departments, studios].find((s) => s.status === 'error');

  return (
    <>
      <PageHead lede="理事会、各部门与工作室的组织关系。" />
      {pending ? <Async state={pending} render={() => null} /> : failed ? <Async state={failed} render={() => null} /> : (
        <section className="section">
          <div className="wrap tree">
            <Reveal className="tree__root glass">
              <p className="eyebrow">Council · 理事会</p>
              <ul className="council">
                {(council.data ?? []).map((c, i) => (
                  <li key={i}><span className="council__role">{c.title}</span><b>{c.name}</b></li>
                ))}
              </ul>
            </Reveal>
            <div className="tree__stem" aria-hidden="true" />
            <ol className="tree__depts">
              {(departments.data ?? []).map((d, i) => (
                <Reveal as="li" key={d.id} delay={i * 90} className="dept glass glow">
                  <span className="mono dept__no">D-0{i + 1} · {d.en}</span>
                  <h2>{d.name}</h2>
                  <p>{d.description}</p>
                </Reveal>
              ))}
            </ol>
            <div className="tree__stem" aria-hidden="true" />
            <Reveal className="tree__studios">
              <p className="eyebrow">Studios · 下属工作室</p>
              <div className="tree__row">
                {(studios.data ?? []).map((s) => (
                  <Link key={s.id} to="/studios" className="studio-chip glass glow">
                    <b>{s.name}</b><span>{(s.tags ?? []).slice(0, 2).join(' · ')}</span><span className="studio-chip__arr" aria-hidden="true">↗</span>
                  </Link>
                ))}
                <Link to="/studios" className="studio-chip studio-chip--empty">
                  <b>下一间</b><span>等你来发起</span><span className="studio-chip__arr" aria-hidden="true">↗</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}
      <CTA />
    </>
  );
}
