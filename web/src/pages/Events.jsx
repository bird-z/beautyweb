import { CTA, Cover, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import { useResource } from '../services/hooks.js';
import { listEvents } from '../services/endpoints.js';

export default function Events() {
  const events = useResource(listEvents, [], { cacheKey: 'events' });
  return (
    <>
      <PageHead lede="从黑客松到自然观察，从全员大会到科普课堂——每一场活动都是一粒落地的种子，在参与者心里继续生长。" />
      <Async state={events} empty emptyRender={() => <p className="wrap note">暂无活动安排。</p>} render={(list) => {
        // 按 term 分组
        const groups = [];
        for (const e of list) {
          let g = groups.find((x) => x.term === e.term);
          if (!g) { g = { term: e.term, items: [] }; groups.push(g); }
          g.items.push(e);
        }
        return groups.map((t) => (
          <section className="section" key={t.term}>
            <div className="wrap">
              <h2 className="term">{t.term}</h2>
              <ol className="evs">
                {t.items.map((e, i) => (
                  <Reveal as="li" key={e.id} delay={i * 100} className={`ev glass glow ${i % 2 ? 'ev--flip' : ''}`}>
                    <Cover seed={e.title} ratio={0.62} label={e.statusLabel === '已举办' ? '照片待补充' : '敬请期待'} />
                    <div className="ev__body">
                      <span className={`tag ${e.statusLabel === '已举办' ? '' : 'tag--on'}`}>{e.statusLabel}</span>
                      <h3>{e.title}</h3>
                      <p>{e.description}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </section>
        ));
      }} />
      <CTA title="下一场活动，一起来？" />
    </>
  );
}
