import { useEffect, useRef, useState } from 'react';
import { Chips, Cover, CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { WALL } from '../data/people.js';

const KINDS = [...new Set(WALL.map((w) => w.kind))];

export default function Wall() {
  const [kind, setKind] = useState('');
  const [active, setActive] = useState(null);
  const dlg = useRef(null);
  const opener = useRef(null);
  const list = WALL.map((w, i) => ({ ...w, i })).filter((w) => !kind || w.kind === kind);

  const openAt = (i) => {
    opener.current = document.activeElement;
    setActive(i);
  };

  useEffect(() => {
    const d = dlg.current;
    if (active !== null && !d.open) d.showModal();
    if (active === null && d.open) d.close();
    // 灯箱关闭后把焦点还给打开它的卡片，键盘用户不至于丢回 body
    if (active === null && opener.current) {
      opener.current.focus?.();
      opener.current = null;
    }
  }, [active]);

  const cur = active !== null ? WALL[active] : null;
  return (
    <>
      <PageHead lede="校园观察记录与活动影像墙。" />
      <section className="section">
        <div className="wrap">
          <div className="toolbar">
            <Chips items={KINDS} value={kind} onChange={setKind} label="按类型筛选" />
            <span className="mono toolbar__count">{String(list.length).padStart(2, '0')} 帧</span>
          </div>
          <ul className="wall">
            {list.map((w, n) => (
              <Reveal as="li" key={w.i} delay={(n % 3) * 80} className="wall__item">
                <button type="button" className="wall__btn glass glow" onClick={() => openAt(w.i)}>
                  <Cover seed={`wall-${w.i}`} ratio={w.ratio} label="照片待补充" />
                  <span className="wall__cap"><span className="mono">{w.kind} · {w.date}</span><span>{w.caption}</span></span>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      <dialog ref={dlg} className="lightbox" onClose={() => setActive(null)} onClick={(e) => e.target === dlg.current && setActive(null)}>
        {cur && (
          <figure className="lightbox__fig glass">
            <Cover seed={`wall-${active}`} ratio={cur.ratio} label="照片待补充" />
            <figcaption><span className="mono">{cur.kind} · {cur.date}</span><span>{cur.caption}</span></figcaption>
            <button type="button" className="lightbox__x" onClick={() => setActive(null)} aria-label="关闭" autoFocus>✕</button>
          </figure>
        )}
      </dialog>
      <CTA />
    </>
  );
}
