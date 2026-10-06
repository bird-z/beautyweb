import { CTA, Cover, PageHead, Reveal } from '../components/Bits.jsx';
import { EVENTS } from '../data/content.js';

export default function Events() {
  return (
    <>
      <PageHead lede="从黑客松到自然观察，从全员大会到科普课堂——每一场活动都是一粒落地的种子，在参与者心里继续生长。" />
      {EVENTS.map((t) => (
        <section className="section" key={t.term}>
          <div className="wrap">
            <h2 className="term">{t.term}</h2>
            <ol className="evs">
              {t.items.map((e, i) => (
                <Reveal as="li" key={e.title} delay={i * 100} className={`ev glass glow ${i % 2 ? 'ev--flip' : ''}`}>
                  <Cover seed={e.title} ratio={0.62} label={e.status === '已举办' ? '照片待补充' : '敬请期待'} />
                  <div className="ev__body">
                    <span className={`tag ${e.status === '已举办' ? '' : 'tag--on'}`}>{e.status}</span>
                    <h3>{e.title}</h3>
                    <p>{e.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ))}
      <CTA title="下一场活动，一起来？" />
    </>
  );
}
