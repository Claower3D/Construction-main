import React, { useMemo } from 'react';

/*
 * Современный дом в перспективе: слева — «отрендеренный» фасад с тёплым
 * светом в окнах, справа он переходит в светящийся чертёж (каркас,
 * узлы, сетка земли). Геометрия задана в метрах и проецируется камерой,
 * поэтому картинка чёткая на любом экране и ничего не весит.
 * Выноски показывают, что умеет сервис.
 */

const W = 820;
const H = 620;
const CAM = { p: [-15, 9, -24], t: [8.5, 2.8, 4.5], fl: 1250, cx: 410, cy: 340 };

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }

const F = norm(sub(CAM.t, CAM.p));
const R = norm(cross([0, 1, 0], F));
const U = cross(F, R);

function proj(q) {
  const d = sub(q, CAM.p);
  const z = dot(d, F);
  return [CAM.cx + (CAM.fl * dot(d, R)) / z, CAM.cy - (CAM.fl * dot(d, U)) / z, z];
}
const pts = (arr) => arr.map((q) => proj(q)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// коробка [x0,x1]×[y0,y1]×[z0,z1]; kind влияет на заливку
const BOXES = [
  { id: 'A', b: [0, 14, 0, 3.2, 0, 9], kind: 'wall' },
  { id: 'C', b: [14, 19.5, 0, 2.8, 1.2, 9], kind: 'wall' },
  { id: 'T', b: [8.6, 14.4, 3.2, 3.45, -0.4, 9.4], kind: 'slab' },
  { id: 'B', b: [-1.6, 9, 3.45, 6.55, -1.3, 8], kind: 'wall2' },
  { id: 'S', b: [-2.1, 9.5, 6.55, 6.9, -1.8, 8.5], kind: 'slab' },
];

// окна на гранях: face — 'front' (z = z0) или 'left' (x = x0)
const WINDOWS = [
  { box: 'A', face: 'front', u: [0.6, 4.2], v: [0.25, 2.95], mull: 3 },
  { box: 'A', face: 'front', u: [4.5, 8.2], v: [0.25, 2.95], mull: 2 },
  { box: 'A', face: 'front', u: [9.6, 13.4], v: [0.25, 2.95], mull: 4 },
  { box: 'A', face: 'left', u: [1.2, 7.8], v: [0.25, 2.95], mull: 4 },
  { box: 'B', face: 'front', u: [-1.1, 3.6], v: [3.8, 6.25], mull: 3 },
  { box: 'B', face: 'front', u: [3.9, 8.5], v: [3.8, 6.25], mull: 4 },
  { box: 'B', face: 'left', u: [-0.6, 7.4], v: [3.8, 6.25], mull: 5 },
  { box: 'C', face: 'front', u: [14.7, 18.8], v: [0.3, 2.35], mull: 0, garage: true },
];

function boxFaces(b) {
  const [x0, x1, y0, y1, z0, z1] = b;
  return [
    { n: [0, 0, -1], q: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], side: 'front' },
    { n: [-1, 0, 0], q: [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], side: 'left' },
    { n: [0, 1, 0], q: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], side: 'top' },
    { n: [1, 0, 0], q: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side: 'right' },
    { n: [0, 0, 1], q: [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], side: 'back' },
  ];
}
const center = (q) => q.reduce((a, p) => [a[0] + p[0] / q.length, a[1] + p[1] / q.length, a[2] + p[2] / q.length], [0, 0, 0]);
const dist = (q) => { const c = center(q); const d = sub(c, CAM.p); return Math.hypot(d[0], d[1], d[2]); };

function windowQuad(box, w) {
  const [x0, , , , z0] = box.b;
  const e = 0.02;
  if (w.face === 'front') {
    const z = z0 - e;
    return [[w.u[0], w.v[0], z], [w.u[1], w.v[0], z], [w.u[1], w.v[1], z], [w.u[0], w.v[1], z]];
  }
  const x = x0 - e;
  return [[x, w.v[0], w.u[1]], [x, w.v[0], w.u[0]], [x, w.v[1], w.u[0]], [x, w.v[1], w.u[1]]];
}
function mullions(box, w) {
  const out = [];
  const q = windowQuad(box, w);
  for (let i = 1; i <= w.mull; i += 1) {
    const t = i / (w.mull + 1);
    const a = q[0].map((v, k) => v + (q[1][k] - v) * t);
    const b = q[3].map((v, k) => v + (q[2][k] - v) * t);
    out.push([a, b]);
  }
  if (w.garage) {
    for (let i = 1; i < 6; i += 1) {
      const t = i / 6;
      const a = q[0].map((v, k) => v + (q[3][k] - v) * t);
      const b = q[1].map((v, k) => v + (q[2][k] - v) * t);
      out.push([a, b]);
    }
  }
  return out;
}

export const CALLOUTS = [
  // точка на доме (м) → подпись (левый край и центр по высоте, px во viewBox)
  { id: 'bom', at: [9.5, 6.9, -1.8], label: 'Точный BOM-расчёт', bx: 618, by: 70 },
  { id: 'price', at: [-2.1, 6.9, -1.8], label: 'Прозрачные цены 2026', bx: 60, by: 110 },
  { id: 'defect', at: [2.4, 1.6, -0.02], label: 'Детекция дефектов', bx: 24, by: 540 },
  { id: 'export', at: [17, 1.2, 1.18], label: 'Экспорт в PDF / Excel', bx: 590, by: 540 },
];

export default function BlueprintHouse() {
  const geo = useMemo(() => {
    const byId = Object.fromEntries(BOXES.map((b) => [b.id, b]));
    const faces = [];
    BOXES.forEach((box) => {
      boxFaces(box.b).forEach((f) => {
        const c = center(f.q);
        if (dot(f.n, sub(CAM.p, c)) <= 0) return; // невидимая грань
        faces.push({ ...f, box, d: dist(f.q) });
      });
    });
    faces.sort((a, b) => b.d - a.d);
    const wins = WINDOWS.map((w) => ({ ...w, q: windowQuad(byId[w.box], w), m: mullions(byId[w.box], w) }));

    // все рёбра для чертежа (включая невидимые — как на кальке)
    const edges = [];
    BOXES.forEach(({ b }) => {
      const [x0, x1, y0, y1, z0, z1] = b;
      const P = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => edges.push([P[i], P[j]]));
    });
    const nodes = [];
    BOXES.forEach(({ b }) => {
      const [x0, x1, y0, y1, z0, z1] = b;
      [[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x1, y1, z1], [x0, y0, z0]].forEach((p) => nodes.push(p));
    });
    // сетка земли
    const grid = [];
    for (let x = -6; x <= 24; x += 2) grid.push([[x, 0, -6], [x, 0, 14]]);
    for (let z = -6; z <= 14; z += 2) grid.push([[-6, 0, z], [24, 0, z]]);
    return { faces, wins, edges, nodes, grid };
  }, []);

  const line = ([a, b]) => { const p = proj(a); const q = proj(b); return { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }; };
  const fillFor = (f) => {
    if (f.box.kind === 'slab') return f.side === 'top' ? 'url(#bh-slab-top)' : '#e8e3f5';
    if (f.side === 'top') return '#4b4378';
    if (f.side === 'left') return f.box.kind === 'wall2' ? 'url(#bh-wood)' : 'url(#bh-wall-l)';
    return f.box.kind === 'wall2' ? 'url(#bh-wall2)' : 'url(#bh-wall-f)';
  };

  return (
    <svg className="bh" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="bh-title">
      <title id="bh-title">Дом, который справа превращается в светящийся чертёж, с подписями: точный расчёт материалов, прозрачные цены 2026, детекция дефектов, экспорт в PDF и Excel</title>
      <defs>
        <linearGradient id="bh-wall-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6e6598" /><stop offset="1" stopColor="#3b3462" /></linearGradient>
        <linearGradient id="bh-wall-l" x1="0" x2="1"><stop offset="0" stopColor="#4c4475" /><stop offset="1" stopColor="#2c2650" /></linearGradient>
        <linearGradient id="bh-wall2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9d3ea" /><stop offset="1" stopColor="#8f88b0" /></linearGradient>
        <linearGradient id="bh-wood" x1="0" x2="1"><stop offset="0" stopColor="#a8723f" /><stop offset="1" stopColor="#5e3d20" /></linearGradient>
        <linearGradient id="bh-slab-top" x1="0" x2="1"><stop offset="0" stopColor="#8f86bb" /><stop offset="1" stopColor="#4b4378" /></linearGradient>
        <linearGradient id="bh-ground" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2a2148" /><stop offset="1" stopColor="#120e24" stopOpacity="0" /></linearGradient>
        <linearGradient id="bh-glass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#f6a23e" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffdf9e" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="bh-garage" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3b3264" /><stop offset="1" stopColor="#221c3d" /></linearGradient>
        <radialGradient id="bh-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffb44a" stopOpacity="0.55" /><stop offset="1" stopColor="#ffb44a" stopOpacity="0" /></radialGradient>
        <radialGradient id="bh-node" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff" /><stop offset="0.4" stopColor="#c4a7ff" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></radialGradient>
        <linearGradient id="bh-split" x1="0" x2="1">
          <stop offset="0.4" stopColor="#fff" />
          <stop offset="0.62" stopColor="#000" />
        </linearGradient>
        <linearGradient id="bh-split-inv" x1="0" x2="1">
          <stop offset="0.38" stopColor="#262626" />
          <stop offset="0.6" stopColor="#fff" />
        </linearGradient>
        <mask id="bh-m-solid"><rect width={W} height={H} fill="url(#bh-split)" /></mask>
        <mask id="bh-m-wire"><rect width={W} height={H} fill="url(#bh-split-inv)" /></mask>
        <filter id="bh-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="bh-soft"><feGaussianBlur stdDeviation="14" /></filter>
        <linearGradient id="bh-scan" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c084fc" stopOpacity="0" /><stop offset="0.5" stopColor="#e9d5ff" /><stop offset="1" stopColor="#c084fc" stopOpacity="0" /></linearGradient>
      </defs>

      {/* «Отрендеренный» дом */}
      <g mask="url(#bh-m-solid)">
        <ellipse cx="330" cy="500" rx="300" ry="50" fill="url(#bh-pool)" filter="url(#bh-soft)" />
        {geo.faces.map((f, i) => (
          <polygon key={`f${i}`} points={pts(f.q)} fill={fillFor(f)} stroke="rgba(255,214,160,0.28)" strokeWidth="0.8" />
        ))}
        {geo.wins.map((w, i) => (
          <g key={`w${i}`}>
            <polygon points={pts(w.q)} fill={w.garage ? 'url(#bh-garage)' : 'url(#bh-glass)'} stroke="#15112a" strokeWidth="2" />
            {w.m.map((m, k) => <line key={k} {...line(m)} stroke="#15112a" strokeWidth="1.6" />)}
          </g>
        ))}
        {/* свет из окон на землю */}
        <ellipse cx="300" cy="470" rx="190" ry="24" fill="url(#bh-pool)" />
      </g>

      {/* Чертёж */}
      <g mask="url(#bh-m-wire)" className="bh-wire">
        {geo.grid.map((g, i) => <line key={`g${i}`} {...line(g)} stroke="rgba(167,139,250,0.16)" strokeWidth="0.8" />)}
        <g filter="url(#bh-glow)">
          {geo.edges.map((e, i) => <line key={`e${i}`} {...line(e)} stroke="#b9a2ff" strokeWidth="1.2" strokeOpacity="0.85" />)}
          {geo.wins.map((w, i) => (
            <g key={`ww${i}`}>
              <polygon points={pts(w.q)} fill="rgba(139,92,246,0.08)" stroke="#d8c8ff" strokeWidth="1" />
              {w.m.map((m, k) => <line key={k} {...line(m)} stroke="#c4b0ff" strokeWidth="0.8" strokeOpacity="0.8" />)}
            </g>
          ))}
        </g>
        {geo.nodes.map((n, i) => { const p = proj(n); return <circle key={`n${i}`} cx={p[0]} cy={p[1]} r="5" fill="url(#bh-node)" />; })}
      </g>

      {/* линия сканирования на стыке */}
      <rect className="bh-scan" x="400" y="20" width="2" height="560" fill="url(#bh-scan)" />

      {/* Выноски */}
      {CALLOUTS.map((c) => {
        const [px, py] = proj(c.at);
        const w = c.label.length * 9.2 + 46;
        const h = 40;
        const inside = px >= c.bx && px <= c.bx + w;
        const edgeY = c.by + (py > c.by ? h / 2 : -h / 2);
        const ax = px < c.bx ? c.bx : c.bx + w;
        const leader = inside ? `${px},${py} ${px},${edgeY}` : `${px},${py} ${px},${c.by} ${ax},${c.by}`;
        return (
          <g key={c.id} className="bh-callout">
            <polyline points={leader} fill="none" stroke="#c4b0ff" strokeWidth="1.2" strokeOpacity="0.85" />
            <circle cx={px} cy={py} r="5" fill="#f2b84b" />
            <circle cx={px} cy={py} r="11" fill="none" stroke="#f2b84b" strokeOpacity="0.5" className="bh-pulse" />
            <rect x={c.bx} y={c.by - h / 2} width={w} height={h} rx="10" fill="rgba(18,14,38,0.9)" stroke="rgba(196,176,255,0.6)" />
            <circle cx={c.bx + 18} cy={c.by} r="4" fill="#fff" />
            <text x={c.bx + 32} y={c.by + 6} className="bh-label">{c.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
