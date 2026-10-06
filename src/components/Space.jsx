import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motionOn, subscribeMotion } from '../lib/motion.js';

// 全站常驻的 3D 背景。WebGL 不可用时只保留 CSS 星云兜底。
export default function Space() {
  const ref = useRef(null);
  const api = useRef(null);
  const [on, setOn] = useState(false);
  const { pathname } = useLocation();
  const mode = pathname === '/' ? 'home' : 'page';
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    import('../three/Space.js')
      .then(({ mount }) => {
        if (cancelled) return;
        api.current = mount(ref.current, { motion: motionOn() });
        api.current.setMode(modeRef.current);
        unsub = subscribeMotion((m) => api.current?.setMotion(m));
        setOn(true);
      })
      .catch((e) => console.warn('3D 背景未启用：', e?.message));
    return () => {
      cancelled = true;
      unsub();
      api.current?.dispose();
      api.current = null;
    };
  }, []);

  useEffect(() => { api.current?.setMode(mode); }, [mode]);

  // 外层负责首次淡入，画布自身的不透明度由场景按滚动/路由实时控制
  return (
    <>
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className={`space ${on ? 'is-on' : ''}`} aria-hidden="true"><canvas ref={ref} /></div>
    </>
  );
}
