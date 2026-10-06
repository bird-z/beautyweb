import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// 首页 3D：一粒种子在水面上萌发——呼应协会寄语「一粒因热爱播种的种子，在江农的土壤里生根发芽」。
// 进入首页时种子破壳、生根、长出子叶；向下滚动，幼苗继续长高、展开真叶。
// 子页里是一株已长成的小苗，退到右侧角落、变淡。
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const stage = (g, a, b) => ease((g - a) / (b - a));

// 叶片：网格化的叶形（叶基、叶尖收窄），叶面内卷、叶尖下垂，颜色由叶基到叶尖渐亮，中脉略深
function leafGeometry(len, wid, c0, c1) {
  const g = new THREE.PlaneGeometry(1, 1, 10, 28);
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const a = new THREE.Color(c0), b = new THREE.Color(c1), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i), v = p.getY(i) + 0.5;
    const w = wid * Math.pow(Math.sin(Math.PI * Math.min(v, 0.999)), 0.75) * (1 - 0.15 * v);
    const x = u * 2 * w;
    p.setXYZ(i, x, v * len, ((x * x) / wid) * 0.6 - v * v * len * 0.2);
    c.copy(a).lerp(b, v).multiplyScalar(Math.abs(u) < 0.01 ? 0.8 : 1);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// 茎：沿曲线的管子，从下到上逐渐变细
function stemGeometry(curve, seg, rad, r0) {
  const geo = new THREE.TubeGeometry(curve, seg, r0, rad);
  const pos = geo.attributes.position, cpt = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, cpt);
    const k = 1 - 0.45 * (i / seg);
    for (let j = 0; j <= rad; j++) {
      const idx = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(cpt).multiplyScalar(k).add(cpt);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}
export function mount(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fd8c8, 1.2));
  const sun = new THREE.DirectionalLight(0xfff6e6, 2);
  sun.position.set(-3, 6, 5);
  const rim = new THREE.DirectionalLight(0xbdf0e2, 1.4);
  rim.position.set(4, 2, -5);
  scene.add(sun, rim);

  const rig = new THREE.Group();
  const plant = new THREE.Group();
  rig.add(plant);
  scene.add(rig);

  // 水面 + 两圈涟漪
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.2, 96), new THREE.MeshPhysicalMaterial({ color: 0x6cc9bc, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.32, depthWrite: false }));
  water.rotation.x = -Math.PI / 2;
  rig.add(water);
  const ripples = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.004;
    rig.add(m);
    return m;
  });

  // 种子：两瓣种皮 + 发光的胚
  const seed = new THREE.Group();
  seed.position.y = 0.1;
  plant.add(seed);
  const coat = new THREE.MeshPhysicalMaterial({ color: 0xc89a64, roughness: 0.45, clearcoat: 0.6, sheen: 0.6, sheenColor: new THREE.Color(0xffe2b8) });
  const halves = [-1, 1].map((s) => {
    const piv = new THREE.Group();
    piv.position.x = s * 0.02;
    const half = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 32, s < 0 ? Math.PI : 0, Math.PI), coat);
    half.material.side = THREE.DoubleSide;
    half.scale.set(0.82, 1.15, 0.72);
    half.position.y = 0.38;
    piv.add(half);
    seed.add(piv);
    return { piv, s };
  });
  const kernel = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xd8f5c8, emissive: 0x9fe8a8, emissiveIntensity: 0.35, roughness: 0.4, sheen: 1 }));
  kernel.scale.set(0.8, 1.1, 0.7);
  kernel.position.y = 0.36;
  seed.add(kernel);

  // 茎：一条微微弯曲的曲线，用 drawRange 控制“长出”的长度
  const curve = new THREE.CatmullRomCurve3([[0, 0.3, 0], [0.05, 1.2, 0.02], [-0.06, 2.2, -0.03], [0.04, 3.1, 0.02], [0, 3.7, 0]].map((p) => new THREE.Vector3(...p)));
  const SEG = 120, RAD = 12;
  const stem = new THREE.Mesh(stemGeometry(curve, SEG, RAD, 0.07), new THREE.MeshPhysicalMaterial({ color: 0x6cc48a, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xd8ffe0) }));
  stem.geometry.setDrawRange(0, 0);
  plant.add(stem);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), stem.material);
  plant.add(tip);

  // 根：几条细白须根，向下、向外生长
  const rootMat = new THREE.MeshPhysicalMaterial({ color: 0xf3f8ec, roughness: 0.6, transparent: true, opacity: 0.9 });
  const roots = [0, 1.3, 2.5, 3.8, 5.1].map((a, i) => {
    const r = 0.5 + (i % 2) * 0.25;
    const pts = [0, 0.33, 0.66, 1].map((t) => new THREE.Vector3(Math.cos(a) * r * t + Math.sin(t * 6 + i) * 0.04, 0.12 - t * (0.75 + (i % 3) * 0.2), Math.sin(a) * r * t));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.018, 6), rootMat);
    m.geometry.setDrawRange(0, 0);
    plant.add(m);
    return m;
  });
  // 叶：子叶一对 + 真叶两对（十字对生）+ 顶芽。t = 着生在茎上的位置，pivot 缩放即“展开”
  const leafMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, sheen: 0.8, sheenColor: new THREE.Color(0xeaffef), clearcoat: 0.3, side: THREE.DoubleSide });
  const LEAVES = [
    { t: 0.12, len: 0.78, wid: 0.34, tilt: 0.45, yaw: 0, c: [0x7fcf8f, 0xc6f2b8] },
    { t: 0.55, len: 1.25, wid: 0.36, tilt: 0.7, yaw: Math.PI / 2, c: [0x3fae7a, 0x9fe8b8] },
    { t: 0.82, len: 1.0, wid: 0.3, tilt: 0.9, yaw: 0.35, c: [0x44b58a, 0xa8f0cc] },
    { t: 1, len: 0.5, wid: 0.17, tilt: 1.2, yaw: Math.PI / 2 + 0.35, c: [0x5cc79a, 0xc6f7dc] },
  ];
  const leaves = [];
  LEAVES.forEach((L) => {
    const geo = leafGeometry(L.len, L.wid, ...L.c);
    const holder = new THREE.Group();
    holder.position.copy(curve.getPointAt(L.t));
    holder.rotation.y = L.yaw;
    [-1, 1].forEach((s) => {
      const piv = new THREE.Group();
      piv.rotation.z = -s * (Math.PI / 2 - L.tilt);
      piv.add(new THREE.Mesh(geo, leafMat));
      piv.scale.setScalar(0.001);
      holder.add(piv);
      leaves.push({ piv, L, s, ph: Math.random() * 6 });
    });
    plant.add(holder);
  });

  let reduce = opts.motion === false;
  let mode = 'home';
  let t0 = performance.now();
  let g = 0;
  const target = () => {
    const narrow = window.innerWidth < 900;
    const sc = window.scrollY / Math.max(1, window.innerHeight);
    if (mode === 'home') {
      const o = 1 - clamp01((sc - 0.9) / 0.8) * 0.75;
      return narrow ? { x: 0, y: 0.7, s: 0.6, o: o * 0.9 } : { x: 3.2, y: -1.8, s: 1, o };
    }
    return narrow ? { x: 1.1, y: 1.5, s: 0.42, o: 0.3 } : { x: 4.7, y: -0.9, s: 0.6, o: 0.5 };
  };
  const growTarget = (now) => {
    if (mode !== 'home') return 1;
    const load = reduce ? 1 : ease((now - t0) / 2600);
    return Math.min(1, 0.42 * load + 0.58 * clamp01(window.scrollY / (window.innerHeight * 0.9)));
  };
  const cur = { ...target() };
  const ptr = { x: 0, y: 0, cx: 0, cy: 0 };

  const apply = (time) => {
    const L = clamp01((g - 0.15) / 0.85);
    halves.forEach(({ piv, s }) => { piv.rotation.z = -s * 0.85 * stage(g, 0.04, 0.22); });
    kernel.scale.set(0.8, 1.1, 0.7).multiplyScalar(1 - 0.35 * stage(g, 0.15, 0.5));
    stem.geometry.setDrawRange(0, Math.floor(L * SEG) * RAD * 6);
    tip.visible = L > 0.01;
    curve.getPointAt(Math.max(L, 0.001), tip.position);
    const rg = stage(g, 0.08, 0.6);
    roots.forEach((r, i) => r.geometry.setDrawRange(0, Math.floor(clamp01(rg * (1.1 - i * 0.08)) * 40) * 36));
    leaves.forEach(({ piv, L: lf, ph }) => {
      const k = stage(L, lf.t - 0.02, lf.t + 0.14);
      piv.scale.setScalar(Math.max(0.001, k));
      piv.rotation.x = reduce ? 0 : Math.sin(time * 1.2 + ph) * 0.05 * k;
    });
    ripples.forEach((m, i) => {
      const ph = reduce ? 0.35 + i * 0.3 : (time * 0.22 + i * 0.5) % 1;
      m.scale.setScalar(0.35 + ph * 1.9);
      m.material.opacity = 0.55 * (1 - ph);
    });
  };
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduce) draw(performance.now());
  };

  // 把种子在屏幕上的位置和生长进度告诉页面，用来摆放说明标签
  const v = new THREE.Vector3();
  let lastSent = '';
  const report = () => {
    v.set(0, 0, 0).applyMatrix4(rig.matrixWorld).project(camera);
    const unit = window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z);
    // 标签只在首屏附近出现，滚过首屏后淡出，避免漂在后面的内容上
    const lo = 1 - clamp01((window.scrollY / window.innerHeight - 0.55) / 0.35);
    const d = { show: mode === 'home' && window.innerWidth >= 900 && lo > 0, x: Math.round((v.x * 0.5 + 0.5) * window.innerWidth), y: Math.round((-v.y * 0.5 + 0.5) * window.innerHeight + 0.45 * unit * cur.s), p: Math.round(g * 100), o: +lo.toFixed(2) };
    const key = JSON.stringify(d);
    if (key !== lastSent) { lastSent = key; window.dispatchEvent(new CustomEvent('qif:seed', { detail: d })); }
  };

  let last = performance.now();
  const draw = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduce ? 1 : 1 - Math.pow(0.02, dt);
    const tg = target();
    for (const key of ['x', 'y', 's', 'o']) cur[key] += (tg[key] - cur[key]) * k;
    g += (growTarget(now) - g) * (reduce ? 1 : 1 - Math.pow(0.05, dt));
    const time = now / 1000;
    if (!reduce) {
      ptr.cx += (ptr.x - ptr.cx) * 0.05;
      ptr.cy += (ptr.y - ptr.cy) * 0.05;
    }
    rig.position.set(cur.x, cur.y, 0);
    rig.scale.setScalar(cur.s);
    rig.rotation.y = reduce ? -0.5 : -0.5 + time * 0.12;
    plant.rotation.z = reduce ? 0 : Math.sin(time * 0.6) * 0.035;
    canvas.style.opacity = cur.o.toFixed(3);
    camera.position.set(ptr.cx * 0.7, 1.4 - ptr.cy * 0.4, 12);
    camera.lookAt(0, 0.6, 0);
    apply(time);
    scene.updateMatrixWorld();
    renderer.render(scene, camera);
    report();
  };

  let raf = 0;
  const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
  const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const onPtr = (e) => { ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1; };
  const onVis = () => (document.hidden ? stop() : start());
  const onScroll = () => reduce && draw(performance.now());

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPtr, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  resize();
  draw(performance.now());
  start();

  return {
    // 回到首页时重新播放一次发芽
    setMode(m) {
      if (m === 'home' && mode !== 'home') { t0 = performance.now(); g = 0; }
      mode = m;
      if (reduce) draw(performance.now());
    },
    setMotion(m) {
      reduce = !m;
      if (reduce) { stop(); draw(performance.now()); } else { last = performance.now(); start(); }
    },
    dispose() {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPtr);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
