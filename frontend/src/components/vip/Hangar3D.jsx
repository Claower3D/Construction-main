import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HANGAR, HANGAR_INNER } from './vipSchedule';
import { translate } from '../../i18n';

// Модель ангара завода: 25 × 70 м, двускатная кровля (стены 20 м, конёк 23 м), внутри стальной каркас
// из рам с шагом 7 м и площадка второго этажа. Каждая работа объекта нарисована на своём месте:
// лестничные марши, ливнёвка с колодцем, септик, короб, рельсы, закладные, отверстия, отопление,
// обшивка стены, кровля. Выбранная работа подсвечивается, камера поворачивается к ней.
//
// items: [{ id, title, status, shape, floor, x, z, count }] — x от западного торца, z от северной стены, м.

const GOLD = 0xfbbf24;
const STATUS_COLOR = { plan: 0x8b7cf6, progress: 0xe9a23b, done: 0x22c55e, hold: 0x94a3b8 };
const COLORS = { frame: 0xa9bbdc, roof: 0x64748b, wall: 0xb6c2d6, floor: 0x596274, outside: 0x1b2333 };

function label(source, color = '#e9e5f7') {
  const text = translate(source) || source; // подписи рисуются на картинке — переводим их сами
  const FONT = '700 50px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const c = document.createElement('canvas');
  const probe = c.getContext('2d');
  probe.font = FONT;
  c.width = Math.max(256, Math.ceil(probe.measureText(text).width) + 40); c.height = 96; // смена размера сбрасывает настройки холста
  const g = c.getContext('2d');
  g.font = FONT;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(11,18,32,0.9)';
  g.strokeText(text, c.width / 2, 48);
  g.fillStyle = color;
  g.fillText(text, c.width / 2, 48);
  const tex = new THREE.CanvasTexture(c);
  // sizeAttenuation: false — подпись одного размера на экране, где бы ни стояла камера
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
  s.scale.set(0.115 * (c.width / 256), 0.043, 1);
  s.renderOrder = 10;
  return s;
}

function beam(a, b, size, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, dir.length()), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.lookAt(b);
  return m;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const tube = (a, b, r, mat) => {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 12), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
  return m;
};
const dimLine = (a, b, mat) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat);

// ── Фигуры работ. Возвращают { group, center } в координатах модели (центр здания — начало координат) ──
function buildShape(item, mat) {
  const { width: Wd, length: L, eave, ridge } = HANGAR;
  const hw = Wd / 2, hl = L / 2;
  const g = new THREE.Group();
  const x = item.x - hl, z = item.z - hw;
  const y0 = item.floor === 2 ? HANGAR_INNER.floor2 + 0.3 : 0.4;
  let center = V(x, y0 + 1.5, z);
  const n = item.count || 1;
  switch (item.shape) {
    case 'stairs': {
      // Лестницы стоят в разных местах: первая — один этаж, в середине здания, со своей площадкой;
      // вторая — двухэтажная, у входа: марш на второй этаж, площадка, второй марш выше (у остальных, если их больше, вид первой).
      const rise = HANGAR_INNER.floor2, run = 9, width = 1.8, steps = 14;
      const ang = Math.atan2(rise, run), len = Math.hypot(rise, run);
      const flight = (fx, fy, fz, dir) => { // марш от (fx, fy) вверх по ходу dir = ±1 вдоль здания
        for (const side of [-1, 1]) {
          const plate = new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, 0.12), mat); // косоур — стальная полоса
          plate.position.set(fx + dir * run / 2, fy + 0.1 + rise / 2, fz + side * width / 2);
          plate.rotation.z = dir * ang;
          g.add(plate);
          g.add(beam(V(fx, fy + 1.3, fz + side * width / 2), V(fx + dir * run, fy + rise + 1.3, fz + side * width / 2), 0.1, mat)); // поручень
          for (const t of [0, 0.25, 0.5, 0.75, 1]) g.add(beam(V(fx + dir * run * t, fy + rise * t, fz + side * width / 2), V(fx + dir * run * t, fy + 1.3 + rise * t, fz + side * width / 2), 0.08, mat));
        }
        for (let st = 0; st < steps; st++) g.add(box(run / steps * 0.92, 0.12, width, mat, fx + dir * (st + 0.5) * run / steps, fy + 0.15 + (st + 0.8) * rise / steps, fz));
      };
      const deck = (cx, cy, cz, lx, lz, posts) => { // площадка с ограждением, при необходимости на стойках
        g.add(box(lx, 0.16, lz, mat, cx, cy, cz));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          g.add(beam(V(cx + sx * lx / 2, cy, cz + sz * lz / 2), V(cx + sx * lx / 2, cy + 1.2, cz + sz * lz / 2), 0.08, mat));
          if (posts) g.add(beam(V(cx + sx * (lx / 2 - 0.2), 0.4, cz + sz * (lz / 2 - 0.2)), V(cx + sx * (lx / 2 - 0.2), cy, cz + sz * (lz / 2 - 0.2)), 0.2, mat));
        }
        g.add(beam(V(cx - lx / 2, cy + 1.2, cz - lz / 2), V(cx + lx / 2, cy + 1.2, cz - lz / 2), 0.08, mat), beam(V(cx - lx / 2, cy + 1.2, cz + lz / 2), V(cx + lx / 2, cy + 1.2, cz + lz / 2), 0.08, mat));
      };
      const single = (sx, sz) => { flight(sx, 0.4, sz, 1); deck(sx + run + 1.6, 0.4 + rise, sz, 3.2, width + 1.4, true); };
      single(x, z);
      if (n >= 2) { // двухэтажная
        const bx = item.x2 - hl, bz = item.z2 - hw, lane = width + 0.4;
        flight(bx, 0.4, bz, 1);
        deck(bx + run + 1, 0.4 + rise, bz + lane / 2, 2, width * 2 + 0.6, false); // промежуточная площадка на уровне второго этажа
        flight(bx + run, 0.4 + rise, bz + lane, -1);
        deck(bx - 1.3, 0.4 + rise * 2, bz + lane, 2.6, width + 1.2, true); // верхняя площадка
      }
      for (let i = 2; i < Math.min(n, 4); i++) single(x - (i - 1) * 4, z + (i - 1) * (width + 1.4));
      break;
    }
    case 'storm': {
      // желоба по карнизам, водосточные трубы, труба вдоль южной стены и колодец из колец
      const zs = hw + 2.4;
      for (const side of [-1, 1]) g.add(tube(V(-hl, eave - 0.1, side * (hw + 0.5)), V(hl, eave - 0.1, side * (hw + 0.5)), 0.2, mat));
      for (let i = 0; i <= 4; i++) g.add(tube(V(-hl + 2 + i * (L - 4) / 4, eave, hw + 0.6), V(-hl + 2 + i * (L - 4) / 4, 0.3, hw + 0.6), 0.14, mat));
      g.add(tube(V(-hl, 0.35, zs), V(hl + 1, 0.35, zs), 0.32, mat));
      g.add(tube(V(hl + 1, 0.35, zs), V(x, 0.35, z), 0.32, mat));
      for (let i = 0; i < 3; i++) g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.85, 20, 1, true), mat).translateX(x).translateY(0.45 + i * 0.9).translateZ(z));
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 20), mat).translateX(x).translateY(2.75).translateZ(z));
      center = V(x - 6, 2, z - 2);
      break;
    }
    case 'sewer': {
      // выпуск из здания и септик из двухметровых колец
      const zin = Math.max(-hw + 2, Math.min(hw - 2, z));
      g.add(tube(V(-hl + 26, 0.35, zin), V(-hl - 0.5, 0.35, zin), 0.25, mat));
      g.add(tube(V(-hl - 0.5, 0.35, zin), V(x, 0.35, z), 0.25, mat));
      for (let i = 0; i < 4; i++) g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.95, 22, 1, true), mat).translateX(x).translateY(0.5 + i).translateZ(z));
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.14, 22), mat).translateX(x).translateY(4.05).translateZ(z));
      center = V(x + 3, 2, z);
      break;
    }
    case 'heating': {
      // подача и обратка вдоль стен, регистры в каждом пролёте
      for (const side of [-1, 1]) {
        const zz = side * (hw - 0.7);
        g.add(tube(V(-hl + 1, 0.9, zz), V(hl - 1, 0.9, zz), 0.1, mat));
        g.add(tube(V(-hl + 1, 1.5, zz), V(hl - 1, 1.5, zz), 0.1, mat));
        for (let i = 0; i < 10; i++) g.add(box(3.4, 1.0, 0.25, mat, -hl + 3.5 + i * 7, 1.2, zz));
      }
      g.add(tube(V(hl - 1, 0.9, -hw + 0.7), V(hl - 1, 0.9, hw - 0.7), 0.1, mat));
      center = V(0, 1.5, 0);
      break;
    }
    case 'rails': {
      const len = 30, gap = 1.6, k = Math.min(n, 12);
      for (let i = 0; i < k; i++) g.add(box(len, 0.2, 0.2, mat, x, y0 + 0.1, z + (i - (k - 1) / 2) * gap));
      center = V(x, y0 + 0.5, z);
      break;
    }
    case 'embeds': {
      const k = Math.min(n, 24), cols = Math.ceil(Math.sqrt(k * 1.6));
      for (let i = 0; i < k; i++) {
        const cx = x + ((i % cols) - (cols - 1) / 2) * 1.8, cz = z + (Math.floor(i / cols) - (Math.ceil(k / cols) - 1) / 2) * 1.8;
        g.add(box(0.7, 0.14, 0.7, mat, cx, y0 + 0.07, cz));
        g.add(box(0.1, 0.5, 0.1, mat, cx, y0 + 0.3, cz));
      }
      center = V(x, y0 + 0.5, z);
      break;
    }
    case 'opening': {
      if (item.floor === 2) { // круглое отверстие в перекрытии
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.16, 10, 28), mat);
        ring.rotation.x = Math.PI / 2; ring.position.set(x, y0 + 0.05, z);
        g.add(ring, tube(V(x, y0 - 2.5, z), V(x, y0 + 2.2, z), 0.42, mat));
      } else { // проёмы в полу под будку
        const k = Math.min(Math.max(n, 2), 6);
        for (let i = 0; i < k; i++) {
          const cx = x + (i % 2) * 3.2, cz = z - Math.floor(i / 2) * 2.6;
          g.add(box(1.5, 0.12, 0.14, mat, cx, y0 + 0.06, cz - 0.68), box(1.5, 0.12, 0.14, mat, cx, y0 + 0.06, cz + 0.68), box(0.14, 0.12, 1.5, mat, cx - 0.68, y0 + 0.06, cz), box(0.14, 0.12, 1.5, mat, cx + 0.68, y0 + 0.06, cz));
        }
        g.add(beam(V(x - 1, y0, z + 1.6), V(x - 1, y0 + 2.6, z + 1.6), 0.12, mat), beam(V(x + 4.2, y0, z + 1.6), V(x + 4.2, y0 + 2.6, z + 1.6), 0.12, mat), beam(V(x - 1, y0 + 2.6, z + 1.6), V(x + 4.2, y0 + 2.6, z + 1.6), 0.12, mat));
      }
      center = V(x + 1, y0 + 1, z);
      break;
    }
    case 'box': {
      // сварной короб: рама из уголка и воронка
      const w = 4, h = 3.2, d = 3.2;
      const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      c.forEach(([sx, sz], i) => {
        const [nx, nz] = c[(i + 1) % 4];
        g.add(beam(V(x + sx * w / 2, y0, z + sz * d / 2), V(x + sx * w / 2, y0 + h, z + sz * d / 2), 0.2, mat));
        for (const yy of [y0 + 0.1, y0 + h]) g.add(beam(V(x + sx * w / 2, yy, z + sz * d / 2), V(x + nx * w / 2, yy, z + nz * d / 2), 0.2, mat));
        g.add(beam(V(x + sx * w / 2, y0 + h, z + sz * d / 2), V(x + sx * 0.6, y0 + 1.1, z + sz * 0.6), 0.12, mat));
      });
      center = V(x, y0 + h / 2, z);
      break;
    }
    case 'sheet_wall': {
      // участок обшивки на ближайшей стене
      const dN = Math.abs(item.z), dS = Math.abs(Wd - item.z), dW = Math.abs(item.x), dE = Math.abs(L - item.x);
      const m = Math.min(dN, dS, dW, dE);
      const pm = mat.clone(); pm.side = THREE.DoubleSide; pm.transparent = true; pm.opacity = 0.8;
      if (m === dW || m === dE) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(Wd, eave), pm);
        p.rotation.y = Math.PI / 2; p.position.set(m === dW ? -hl - 0.6 : hl + 0.6, eave / 2, 0);
        g.add(p); center = p.position.clone();
      } else {
        const cx = Math.max(-hl + 7, Math.min(hl - 7, x));
        const p = new THREE.Mesh(new THREE.PlaneGeometry(14, eave), pm);
        p.position.set(cx, eave / 2, m === dN ? -hw - 0.6 : hw + 0.6);
        g.add(p); center = p.position.clone();
      }
      g.userData.ownMat = pm;
      break;
    }
    case 'sheet_roof': {
      const pm = mat.clone(); pm.side = THREE.DoubleSide; pm.transparent = true; pm.opacity = 0.82;
      const slope = Math.hypot(hw, ridge - eave);
      for (const side of [-1, 1]) {
        const r = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.4, slope + 0.8), pm);
        r.position.set(0, (eave + ridge) / 2 + 0.8, side * hw / 2);
        r.rotation.x = -Math.PI / 2 + side * Math.atan2(ridge - eave, hw);
        g.add(r);
      }
      const B = HANGAR.bump;
      if (B && B.height > 0) {
        const lid = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(L - B.from, B.length) + 0.6, B.width + 0.6), pm);
        lid.rotation.x = -Math.PI / 2; lid.position.set(B.from - hl + Math.min(L - B.from, B.length) / 2, ridge + B.height + 0.35, 0);
        g.add(lid);
      }
      g.userData.ownMat = pm;
      center = V(0, ridge, 0);
      break;
    }
    case 'frame':
      center = V(0, eave / 2, 0);
      break;
    default: { // отметка места
      g.add(tube(V(x, y0, z), V(x, y0 + 3, z), 0.08, mat));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 14), mat); ball.position.set(x, y0 + 3.6, z);
      g.add(ball);
      center = V(x, y0 + 2, z);
    }
  }
  const bb = new THREE.Box3().setFromObject(g);
  if (!bb.isEmpty()) {
    const sph = bb.getBoundingSphere(new THREE.Sphere());
    return { group: g, center: sph.center, radius: sph.radius, top: bb.max.y };
  }
  return { group: g, center, radius: 40, top: center.y + 4 };
}

export default function Hangar3D({ items = [], selected = '', skin = true, height = 380 }) {
  const mountRef = useRef(null);
  const tagRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;
    const { width: Wd, length: L, eave, ridge, bays } = HANGAR;
    const hw = Wd / 2, hl = L / 2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1424);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 900);
    camera.position.set(58, 40, 66);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      el.textContent = 'Трёхмерная модель не открылась на этом устройстве.';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(60, 90, 40);
    scene.add(sun);

    // площадка и пол
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(L + 90, Wd + 90), new THREE.MeshStandardMaterial({ color: COLORS.outside, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05;
    scene.add(ground);
    const grid = new THREE.GridHelper(Math.max(L, Wd) + 90, 16, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);
    scene.add(box(L, 0.4, Wd, new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9 }), 0, 0.2, 0));

    // каркас: рамы с шагом L / bays, прогоны кровли, ригели стен, связи в крайних пролётах
    const steel = new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.45, metalness: 0.6 });
    const frame = new THREE.Group();
    const step = L / bays;
    for (let i = 0; i <= bays; i++) {
      const x = -hl + i * step;
      frame.add(beam(V(x, 0.4, -hw), V(x, eave, -hw), 0.55, steel), beam(V(x, 0.4, hw), V(x, eave, hw), 0.55, steel));
      frame.add(beam(V(x, eave, -hw), V(x, ridge, 0), 0.5, steel), beam(V(x, eave, hw), V(x, ridge, 0), 0.5, steel));
      frame.add(beam(V(x, eave, -hw), V(x, eave, hw), 0.22, steel));
    }
    const slopeY = (z) => ridge - (Math.abs(z) / hw) * (ridge - eave);
    for (const z of [-hw, -hw * 0.66, -hw * 0.33, 0, hw * 0.33, hw * 0.66, hw]) frame.add(beam(V(-hl, slopeY(z) + 0.2, z), V(hl, slopeY(z) + 0.2, z), 0.26, steel));
    for (const y of [5, 10, 15]) frame.add(beam(V(-hl, y, -hw), V(hl, y, -hw), 0.22, steel), beam(V(-hl, y, hw), V(hl, y, hw), 0.22, steel));
    for (const x0 of [-hl, hl - step]) for (const z of [-hw, hw]) frame.add(beam(V(x0, 0.4, z), V(x0 + step, eave, z), 0.16, steel), beam(V(x0 + step, 0.4, z), V(x0, eave, z), 0.16, steel));
    scene.add(frame);

    // площадка второго этажа у восточного торца (схема)
    const f2 = HANGAR_INNER.floor2, mx0 = HANGAR_INNER.mezzFrom - hl;
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x7c8aa5, transparent: true, opacity: 0.55, roughness: 0.8, depthWrite: false });
    scene.add(box(hl - mx0, 0.3, Wd, slabMat, (mx0 + hl) / 2, f2 + 0.15, 0));
    for (let x = mx0; x <= hl + 0.1; x += step) {
      for (const z of [-hw / 3, hw / 3]) scene.add(beam(V(x, 0.4, z), V(x, f2, z), 0.35, steel));
      scene.add(beam(V(x, f2 - 0.2, -hw), V(x, f2 - 0.2, hw), 0.3, steel));
    }
    scene.add(beam(V(mx0, f2 + 1.3, -hw), V(mx0, f2 + 1.3, hw), 0.08, steel)); // ограждение края площадки
    const put = (s, x, y, z) => { s.position.set(x, y, z); scene.add(s); return s; };
    put(label('2 этаж', '#cbd5e1'), (mx0 + hl) / 2, f2 + 2.2, 0);

    // обшивка: две длинные стены, два торца, два ската кровли, ворота
    const skins = [];
    const cover = (color, opacity) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.1, depthWrite: false });
    const wallMat = cover(COLORS.wall, 0.26), roofMat = cover(COLORS.roof, 0.5);
    const wallGeo = new THREE.PlaneGeometry(L, eave);
    const north = new THREE.Mesh(wallGeo, wallMat); north.position.set(0, eave / 2, -hw - 0.3);
    const south = new THREE.Mesh(wallGeo, wallMat); south.position.set(0, eave / 2, hw + 0.3);
    const gable = new THREE.Shape();
    gable.moveTo(-hw, 0); gable.lineTo(hw, 0); gable.lineTo(hw, eave); gable.lineTo(0, ridge); gable.lineTo(-hw, eave); gable.closePath();
    const gableGeo = new THREE.ShapeGeometry(gable);
    const west = new THREE.Mesh(gableGeo, wallMat); west.rotation.y = Math.PI / 2; west.position.x = -hl - 0.3;
    const east = new THREE.Mesh(gableGeo, wallMat); east.rotation.y = Math.PI / 2; east.position.x = hl + 0.3;
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), new THREE.MeshStandardMaterial({ color: 0x334155, side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 0.85 }));
    gate.rotation.y = Math.PI / 2; gate.position.set(-hl - 0.45, 3.5, 0);
    scene.add(north, south, west, east, gate); skins.push(north, south, west, east, gate);
    const slopeLen = Math.hypot(hw, ridge - eave);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.2, slopeLen + 0.6), roofMat);
      r.position.set(0, (eave + ridge) / 2 + 0.45, side * hw / 2);
      r.rotation.x = -Math.PI / 2 + side * Math.atan2(ridge - eave, hw);
      scene.add(r); skins.push(r);
    }

    // выступ кровли вверх (надстройка) у восточного торца: каркас, стенки и крышка
    const B = HANGAR.bump;
    if (B && B.height > 0) {
      const bx0 = B.from - hl, bx1 = Math.min(hl, bx0 + B.length), bw = B.width / 2, top = ridge + B.height, low = slopeY(bw) + 0.45;
      for (const bx of [bx0, bx1]) for (const side of [-1, 1]) frame.add(beam(V(bx, low, side * bw), V(bx, top, side * bw), 0.3, steel));
      for (const side of [-1, 1]) frame.add(beam(V(bx0, top, side * bw), V(bx1, top, side * bw), 0.26, steel));
      for (const bx of [bx0, (bx0 + bx1) / 2, bx1]) frame.add(beam(V(bx, top, -bw), V(bx, top, bw), 0.26, steel));
      const bumpMat = cover(0x93a4c4, 0.5);
      const lid = new THREE.Mesh(new THREE.PlaneGeometry(bx1 - bx0, B.width), bumpMat);
      lid.rotation.x = -Math.PI / 2; lid.position.set((bx0 + bx1) / 2, top + 0.05, 0);
      const sideGeo = new THREE.PlaneGeometry(bx1 - bx0, top - low);
      const sides = [-1, 1].map((side) => { const m = new THREE.Mesh(sideGeo, bumpMat); m.position.set((bx0 + bx1) / 2, (top + low) / 2, side * bw); return m; });
      const end = new THREE.Shape();
      end.moveTo(-bw, low); end.lineTo(0, ridge + 0.45); end.lineTo(bw, low); end.lineTo(bw, top); end.lineTo(-bw, top); end.closePath();
      const endGeo = new THREE.ShapeGeometry(end);
      const ends = [bx0, bx1 + 0.3].map((bx) => { const m = new THREE.Mesh(endGeo, bumpMat); m.rotation.y = Math.PI / 2; m.position.x = bx; return m; });
      scene.add(lid, ...sides, ...ends); skins.push(lid, ...sides, ...ends);
      // светлый контур: выступ читается и на подсвеченной кровле
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(bx1 - bx0, top - low, B.width)), new THREE.LineBasicMaterial({ color: 0xf1f5f9 }));
      edge.position.set((bx0 + bx1) / 2, (top + low) / 2 + 0.06, 0); edge.renderOrder = 5; edge.material.depthTest = false;
      scene.add(edge);
      put(label(`выступ +${B.height} м`, '#fcd34d'), (bx0 + bx1) / 2, top + 2.2, 0);
    }

    // размеры и стороны света
    const dm = new THREE.LineBasicMaterial({ color: 0xfcd34d });
    scene.add(dimLine(V(-hl, 0.3, hw + 6), V(hl, 0.3, hw + 6), dm), dimLine(V(hl + 6, 0.3, -hw), V(hl + 6, 0.3, hw), dm), dimLine(V(hl + 6, 0, hw), V(hl + 6, eave, hw), dm), dimLine(V(hl + 6, 0, 0), V(hl + 6, ridge, 0), dm));
    put(label(`${L} м`, '#fcd34d'), 0, 2.4, hw + 8);
    put(label(`${Wd} м`, '#fcd34d'), hl + 8, 2.4, 0);
    put(label(`${eave} м`, '#fcd34d'), hl + 8, eave * 0.5, hw + 1);
    put(label(`${ridge} м`, '#fcd34d'), hl + 8, ridge + 2.4, 0);
    put(label('Север'), 0, 1.5, -hw - 14);
    put(label('Юг'), 0, 1.5, hw + 15);
    put(label('Запад'), -hl - 14, 1.5, 0);
    put(label('Восток'), hl + 16, 1.5, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    const home = V(0, 9, 0);
    controls.target.copy(home);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 14;
    controls.maxDistance = 320;
    controls.update();

    // ── работы ──
    let shapes = new Map(); // id → { group, center, mat, status, shape }
    const works = new THREE.Group();
    scene.add(works);
    let picked = '';
    let skinOn = true;
    let focus = null; // куда плавно ведём взгляд камеры
    const dispose = (o) => o.traverse((m) => { if (m.geometry) m.geometry.dispose(); });
    const paint = () => {
      const interior = picked && shapes.has(picked) && !['storm', 'sewer', 'sheet_roof', 'sheet_wall'].includes(shapes.get(picked).shape);
      wallMat.opacity = interior ? 0.1 : 0.26;
      roofMat.opacity = interior ? 0.12 : 0.5;
      // работу внутри здания не должен заслонять каркас: на время показа он становится полупрозрачным
      steel.transparent = true; steel.opacity = interior ? 0.3 : 1; steel.depthWrite = !interior;
      skins.forEach((m) => { m.visible = skinOn; });
      for (const [id, s] of shapes) {
        const on = id === picked;
        const list = [s.mat, s.group.userData.ownMat].filter(Boolean);
        for (const m of list) {
          m.color.setHex(on ? GOLD : STATUS_COLOR[s.status] || STATUS_COLOR.plan);
          m.emissive.setHex(on ? 0x8a5a00 : 0x000000);
          m.emissiveIntensity = on ? 0.9 : 0;
          m.transparent = true;
          m.opacity = on ? (m === s.group.userData.ownMat ? 0.85 : 1) : picked ? 0.22 : (m === s.group.userData.ownMat ? 0.0 : 0.9);
        }
        s.group.visible = !(s.group.userData.ownMat && !on); // обшивка и кровля как фигуры видны только выбранными
        if (s.shape === 'frame') { steel.color.setHex(on ? GOLD : COLORS.frame); steel.emissive.setHex(on ? 0x7a5200 : 0); }
      }
      if (!picked || !shapes.has(picked) || shapes.get(picked).shape !== 'frame') { steel.color.setHex(COLORS.frame); steel.emissive.setHex(0); }
    };
    const api = {
      items(list) {
        for (const s of shapes.values()) { works.remove(s.group); dispose(s.group); s.mat.dispose(); }
        shapes = new Map();
        for (const it of list) {
          const mat = new THREE.MeshStandardMaterial({ color: STATUS_COLOR[it.status] || STATUS_COLOR.plan, roughness: 0.5, metalness: 0.35 });
          const { group, center, radius, top } = buildShape(it, mat);
          works.add(group);
          shapes.set(it.id, { group, center, radius, top, mat, status: it.status, shape: it.shape, title: it.title });
        }
        paint();
      },
      pick(id) {
        picked = id || '';
        const s = shapes.get(picked);
        // камера подлетает к выбранной работе: тем ближе, чем меньше сама фигура
        const target = s ? s.center.clone() : home.clone();
        const dist = s ? Math.max(24, Math.min(homeDist() * 1.25, s.radius * 3.1)) : homeDist();
        const flat = camera.position.clone().sub(controls.target); flat.y = 0;
        if (flat.lengthSq() < 1) flat.set(1, 0, 1);
        flat.normalize();
        // работу у края здания или снаружи смотрим с её стороны, а не сквозь всё здание
        const inside = s && !['storm', 'sewer', 'sheet_roof', 'sheet_wall', 'frame', 'heating'].includes(s.shape);
        if (inside) flat.set(-0.45, 0, s.center.z > 0 ? 1 : -1).normalize(); // то, что внутри, смотрим сбоку, через длинную стену: лестницы и рельсы идут вдоль здания
        else if (s) { const out = V(s.center.x, 0, s.center.z); if (out.length() > 8) flat.multiplyScalar(0.35).add(out.normalize()).normalize(); }
        const dir = V(flat.x, inside ? 0.4 : 0.62, flat.z).normalize();
        focus = { target, pos: target.clone().addScaledVector(dir, dist), frames: 46 };
        if (tagRef.current) { tagRef.current.textContent = s ? s.title : ''; tagRef.current.style.display = s ? 'block' : 'none'; }
        paint();
      },
      skin(on) { skinOn = on; paint(); },
    };
    apiRef.current = api;

    const homeDist = () => 98 * Math.min(2.4, Math.max(1, 1.15 / camera.aspect));
    const resize = () => {
      const w = el.clientWidth || 600, h = el.clientHeight || 380;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // узкий экран телефона: отодвигаем камеру, чтобы ангар помещался целиком
      camera.updateProjectionMatrix();
      if (!picked) { // пока работа не выбрана, держим общий вид; выбранную не «отбрасываем» при повороте телефона
        const dir = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).addScaledVector(dir, homeDist());
      }
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(el);

    let raf = 0;
    const p = new THREE.Vector3();
    const tick = () => {
      if (focus && focus.frames > 0) { controls.target.lerp(focus.target, 0.12); camera.position.lerp(focus.pos, 0.12); focus.frames -= 1; }
      controls.update();
      renderer.render(scene, camera);
      // подпись выбранной работы держится над её местом
      const s = shapes.get(picked), tag = tagRef.current;
      if (s && tag) {
        p.set(s.center.x, s.top + 1.2, s.center.z).project(camera);
        const w = el.clientWidth, h = el.clientHeight;
        const sx = Math.max(70, Math.min(w - 70, (p.x * 0.5 + 0.5) * w)), sy = Math.max(24, Math.min(h - 16, (-p.y * 0.5 + 0.5) * h - 10));
        tag.style.transform = `translate(-50%, -100%) translate(${sx}px, ${sy}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  const itemsKey = JSON.stringify(items);
  useEffect(() => { if (apiRef.current) { apiRef.current.items(items); apiRef.current.pick(selected); } }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (apiRef.current) apiRef.current.pick(selected); }, [selected]);
  useEffect(() => { if (apiRef.current) apiRef.current.skin(skin); }, [skin]);

  return (
    <div className="vob-3d-wrap" style={{ height }}>
      <div ref={mountRef} className="vob-3d" style={{ height: '100%' }} role="img" aria-label={`Модель ангара ${HANGAR.width} на ${HANGAR.length} метров, высота в коньке ${HANGAR.ridge} метра`} />
      <div ref={tagRef} className="vob-3d-tag" translate="no" style={{ display: 'none' }} />
    </div>
  );
}
