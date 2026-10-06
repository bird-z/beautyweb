import { Cover, CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { ORG } from '../data/site.js';
import { STUDIOS } from '../data/content.js';

export default function Studios() {
  return (
    <>
      <PageHead lede="工作室由会员自发发起、自由生长——把共同的兴趣，做成看得见的作品。" />
      <section className="section">
        <div className="wrap rooms">
          {STUDIOS.map((s, i) => (
            <Reveal as="article" key={s.key} className={`room glass glow ${i % 2 ? 'room--flip' : ''}`}>
              <Cover seed={s.key} ratio={0.8} label="工作室作品待补充" />
              <div className="room__body">
                <span className="mono room__no">Studio 0{i + 1} · {s.en}</span>
                <h2 className="room__name grad">{s.name}</h2>
                <p className="room__text">{s.text}</p>
                <ul className="room__tags">{s.tags.map((t) => <li key={t} className="tag">{t}</li>)}</ul>
              </div>
            </Reveal>
          ))}
          <Reveal as="article" className="room room--empty">
            <div className="room__void" aria-hidden="true"><span /></div>
            <div className="room__body">
              <span className="mono room__no">Studio 0{STUDIOS.length + 1} · 空房间</span>
              <h2 className="room__name">等待你的加入</h2>
              <p className="room__text">下一间工作室，等你来发起。带上你的兴趣与想法，协会出同伴、出场地、出资源，一起把它做出来。</p>
              <a className="btn btn--pri" href={`mailto:${ORG.mailOffice}?subject=${encodeURIComponent('发起工作室')}`}>发起工作室 <span className="arr">→</span></a>
            </div>
          </Reveal>
        </div>
      </section>
      <CTA />
    </>
  );
}
