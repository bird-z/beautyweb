import { useEffect, useState } from 'react';

// 动效开关：本地有明确偏好就用本地的；否则跟随系统「减少动态效果」
const KEY = 'qif-motion';
let on = true;
try {
  const saved = localStorage.getItem(KEY);
  on = saved !== null ? saved !== 'off' : !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) {
  /* 隐私模式下不可用，保持默认 */
}
const subs = new Set();
const apply = () => document.documentElement.classList.toggle('no-motion', !on);
apply();

export const motionOn = () => on;

export function setMotion(v) {
  on = v;
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off');
  } catch (e) {
    /* 忽略 */
  }
  apply();
  subs.forEach((f) => f(on));
}

export function subscribeMotion(f) {
  subs.add(f);
  return () => subs.delete(f);
}

export function useMotion() {
  const [v, setV] = useState(on);
  useEffect(() => subscribeMotion(setV), []);
  return [v, setMotion];
}
