import { useEffect, useMemo, useRef, useState } from 'react';
import { Chips, CTA, PageHead, Reveal } from '../components/Bits.jsx';
import { Async } from '../components/Async.jsx';
import { ROSTER_DEPTS } from '../data/people.js';
import { useResource } from '../services/hooks.js';
import { listMembers } from '../services/endpoints.js';

const ORB = ['#86e0c8', '#6cc9d6', '#f0c890', '#b9eadc'];
const ROWS = 4;

const deptName = (m) => m.department?.name ?? m.department ?? '';

function Chip({ m, onOpen, hidden }) {
  const c = ORB[m.name.charCodeAt(0) % 4];
  return (
    <button type="button" className="mchip" onClick={() => onOpen(m)} tabIndex={hidden ? -1 : undefined}>
      <span className="mchip__orb" style={{ '--c': c }}>{m.name.slice(0, 1)}</span>
      <span className="mchip__txt"><b>{m.name}</b><span>{deptName(m)} · {m.tag}</span></span>
    </button>
  );
}

// 名录墙：上百位会员分成 4 条带，前后错开、左右交替无限滚动，整体带一点 3D 倾斜
function Marquee({ roster, onOpen }) {
  const rows = useMemo(() => Array.from({ length: ROWS }, (_, r) => roster.filter((_, i) => i % ROWS === r)), [roster]);
  return (
    <div className="mwall" aria-label={`会员名录，共 ${roster.length} 人`}>
      <div className="mwall__stage">
        {rows.map((row, r) => (
          <div key={r} className={`mrow ${r % 2 ? 'mrow--rev' : ''}`} style={{ '--dur': `${90 + r * 18}s` }}>
            <div className="mrow__track">
              {row.map((m) => <Chip key={m.id} m={m} onOpen={onOpen} />)}
              <span className="mrow__dup" aria-hidden="true">
                {row.map((m) => <Chip key={m.id} m={m} onOpen={onOpen} hidden />)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Members() {
  const members = useResource(listMembers, [], { cacheKey: 'members' });
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [cur, setCur] = useState(null);
  const dlg = useRef(null);
  const filtering = q.trim() || dept;

  useEffect(() => {
    const d = dlg.current;
    if (cur && !d.open) d.showModal();
    if (!cur && d.open) d.close();
  }, [cur]);

  return (
    <>
      <PageHead lede="每一份好奇，都值得被看见——他们来自不同学院与专业，因为同一份对生命的好奇相聚在启扉。" />

      <Async state={members} render={(roster) => {
        const found = roster.filter((m) => (!dept || deptName(m) === dept) && (!q.trim() || (m.name + m.tag + m.college).includes(q.trim())));
        // 静态部门顺序优先,数据里出现的新部门补在后面
        const depts = ROSTER_DEPTS.length ? ROSTER_DEPTS : [...new Set(roster.map(deptName).filter(Boolean))];
        const featured = roster.filter((m) => m.featured);
        const voices = (featured.length ? featured : roster).slice(0, 3);
        return (
          <>
            <section className="section mpage">
              <div className="wrap">
                <div className="mbar glass">
                  <div className="mbar__stat"><b className="grad">{roster.length}</b><span>位同路人</span></div>
                  <Chips items={depts} value={dept} onChange={setDept} label="按部门筛选" />
                  <label className="msearch">
                    <span className="sr-only">搜索会员</span>
                    <input type="search" placeholder="搜索姓名 / 方向 / 学院" value={q} onChange={(e) => setQ(e.target.value)} />
                  </label>
                </div>
              </div>

              {filtering ? (
                <div className="wrap">
                  <p className="mono mres__count">找到 {found.length} 位</p>
                  {found.length ? (
                    <ul className="mres">{found.map((m) => <li key={m.id}><Chip m={m} onOpen={setCur} /></li>)}</ul>
                  ) : <p className="empty">没有找到匹配的会员。</p>}
                </div>
              ) : (
                <Marquee roster={roster} onOpen={setCur} />
              )}
            </section>

            <section className="section">
              <div className="wrap">
                <Reveal className="sec-head"><div><p className="eyebrow">Voices · 会员寄语</p><h2 className="h2">他们想说的话</h2></div></Reveal>
                <ul className="quotes">
                  {voices.map((m, i) => (
                    <Reveal as="li" key={m.id} delay={i * 100} className="quote glass glow">
                      <p className="quote__text">“{m.quote}”</p>
                      <span className="quote__who"><span className="mchip__orb" style={{ '--c': ORB[i] }}>{m.name.slice(0, 1)}</span>{m.name} · {m.tag}</span>
                    </Reveal>
                  ))}
                </ul>
              </div>
            </section>
          </>
        );
      }} />

      <dialog ref={dlg} className="mdlg glass" onClose={() => setCur(null)} onClick={(e) => e.target === dlg.current && setCur(null)}>
        {cur && (
          <div className="mdlg__in">
            <span className="mdlg__orb" style={{ '--c': ORB[cur.name.charCodeAt(0) % 4] }}>{cur.name.slice(0, 1)}</span>
            <h2>{cur.name}</h2>
            <p className="mono mdlg__meta">{cur.college} · {cur.year}</p>
            <div className="mdlg__tags"><span className="tag tag--on">{deptName(cur)}</span><span className="tag">{cur.tag}</span></div>
            <p className="mdlg__bio">{cur.bio}</p>
            <p className="mdlg__quote">“{cur.quote}”</p>
            <button type="button" className="mdlg__x" onClick={() => setCur(null)} aria-label="关闭" autoFocus>✕</button>
          </div>
        )}
      </dialog>

      <CTA title="下一个名字，会是你吗？" />
    </>
  );
}
