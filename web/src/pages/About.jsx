import { CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { Async, Empty } from '../components/Async.jsx';
import { useResource } from '../services/hooks.js';
import { getSite } from '../services/endpoints.js';

const CHARTER = ['总则', '会员', '组织机构', '活动与经费', '附则'];

export default function About() {
  const site = useResource(getSite, [], { cacheKey: 'site' });
  return (
    <>
      <PageHead lede="协会简介、章程与发展历程。" />

      <Async state={site} emptyRender={() => <Empty text="站点信息加载中…" />} render={(s) => (
        <>
          <section className="section">
            <div className="wrap about">
              <Reveal className="about__quote">
                <p className="eyebrow">简介 · Intro</p>
                <blockquote>{s.motto}</blockquote>
              </Reveal>
              <Reveal className="about__body glass" delay={120}>
                <p>「Bio」是生命，「Qif」是启扉。我们相信每一份对生命的好奇，都值得有一扇门为它打开——这就是协会名字的由来。</p>
                <p className="about__ph">协会简介正文占位：成立时间、隶属单位、指导老师、会员规模与主要方向。接入后台后，这里将展示由协会编辑的完整简介。</p>
                <ul className="about__facts">
                  {(s.pillars ?? []).map((p) => <li key={p.name} className="tag">{p.name}</li>)}
                </ul>
              </Reveal>
            </div>
          </section>

          <section className="section">
            <div className="wrap">
              <Reveal className="sec-head"><div><p className="eyebrow">章程 · Charter</p><h2 className="h2">协会章程</h2></div></Reveal>
              <Reveal className="charter glass glow">
                <ol className="charter__toc">
                  {CHARTER.map((c, i) => (
                    <li key={c}><span className="mono">第{'一二三四五'[i]}章</span><b>{c}</b></li>
                  ))}
                </ol>
                <div className="charter__side">
                  <p>章程目录与正文为占位。章程文件上传后，可在此在线阅读或下载。</p>
                  <button type="button" className="btn btn--ghost" disabled>阅读章程（待上传）</button>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="section">
            <div className="wrap">
              <Reveal className="sec-head"><div><p className="eyebrow">历程 · Milestones</p><h2 className="h2">发展历程</h2></div></Reveal>
              <ol className="tline">
                {(s.milestones ?? []).map((m, i) => (
                  <Reveal as="li" key={m.title} delay={i * 90} className="tline__item">
                    <span className="tline__dot" aria-hidden="true" />
                    <div className="tline__card glass glow">
                      <span className="mono tline__when">{m.when}</span>
                      <h3>{m.title}</h3>
                      <p>{m.description}</p>
                    </div>
                  </Reveal>
                ))}
                <li className="tline__item tline__item--next">
                  <span className="tline__dot" aria-hidden="true" />
                  <div className="tline__card"><span className="mono tline__when">未来</span><h3>下一页，由你来写</h3></div>
                </li>
              </ol>
            </div>
          </section>
        </>
      )} />

      <CTA />
    </>
  );
}
