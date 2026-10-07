import { CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import { useResource } from '../services/hooks.js';
import { listProjects } from '../services/endpoints.js';
import { STAGES } from '../data/content.js';

const PROGRESS = [0.18, 0.55, 1];
const STAGE_KEYS = ['incubating', 'building', 'released'];

export default function Science() {
  const projects = useResource(listProjects, [], { cacheKey: 'projects' });
  return (
    <>
      <PageHead lede="从一个想法到一份成果：协会的学术与科创项目，按进展分为三个阶段。" />
      <section className="section">
        <Async state={projects} empty emptyRender={() => <p className="wrap note">暂无项目。</p>} render={(list) => (
          <div className="wrap stages">
            {STAGES.map((s, si) => {
              const items = list.filter((p) => p.stage === STAGE_KEYS[si]);
              return (
                <Reveal key={s.name} delay={si * 100} className="stage glass">
                  <header className="stage__head">
                    <span className="mono">Stage 0{si + 1} · {s.en}</span>
                    <span className="stage__count">{String(items.length).padStart(2, '0')}</span>
                  </header>
                  <h2>{s.name}</h2>
                  <div className="stage__bar" aria-hidden="true"><i style={{ width: `${PROGRESS[si] * 100}%` }} /></div>
                  <ul className="stage__list">
                    {items.map((p) => (
                      <li key={p.id} className="proj glow">
                        <span className={`tag ${si === 2 ? 'tag--on' : ''}`}>{p.statusLabel}</span>
                        <h3>{p.title}</h3>
                        <p>{p.description}</p>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              );
            })}
          </div>
        )} />
        <p className="wrap note">以上项目为示例，接入后台后替换为真实立项信息。</p>
      </section>
      <CTA title="有一个想法？" text="协会出同伴、出场地、出资源，陪你把它做出来。" />
    </>
  );
}
