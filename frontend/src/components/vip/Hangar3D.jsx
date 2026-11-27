import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HANGAR, HANGAR_INNER, HANGAR_PLANT, floorRise } from './vipSchedule';
import { translate } from '../../i18n';

// Модель ангара завода: 25 × 70 м, двускатная кровля (стены 20 м, конёк 23 м), стальной каркас с фермами,
// ленты окон и два мостовых крана. Внутри — оборудование, как на фотографиях объекта: будка в углу у входа,
// дробилка на бетонном коробе с двухэтажной лестницей, наклонный конвейер вдоль южной стены, площадка грохота
// с двумя маршами, этажерка с бункерами и своей лестницей на бетонном основании (выступ пола).
// Каждая работа объекта нарисована на своём месте и подсвечивается при выборе, камера поворачивается к ней.
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

/** Неподвижную группу деталей склеивает в несколько больших: по одной на материал. На телефоне это сотни вызовов отрисовки вместо тысячи. */
function fused(group) {
  group.updateMatrixWorld(true);
  const by = new Map();
  group.traverse((m) => {
    if (!m.isMesh) return;
    const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
    if (!by.has(m.material)) by.set(m.material, []);
    by.get(m.material).push(geo);
  });
  const out = new THREE.Group();
  for (const [mat, list] of by) {
    const geo = mergeGeometries(list, false);
    list.forEach((x) => x.dispose());
    if (geo) out.add(new THREE.Mesh(geo, mat));
  }
  group.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });
  return out;
}

// ── Детали стальных конструкций (координаты модели: центр здания — начало координат) ──
/** Лестничный марш вдоль здания: от точки (fx, fy, fz) вверх на rise за run метров, по ходу dir = ±1 */
function addFlight(g, mat, fx, fy, fz, dir, rise, run, width = 1.4) {
  const ang = Math.atan2(rise, run), len = Math.hypot(rise, run), steps = Math.max(4, Math.min(18, Math.round(rise / 0.28)));
  for (const side of [-1, 1]) {
    const zz = fz + side * width / 2;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(len, 0.42, 0.1), mat); // косоур — стальная полоса
    plate.position.set(fx + dir * run / 2, fy + rise / 2, zz);
    plate.rotation.z = dir * ang;
    g.add(plate);
    g.add(beam(V(fx, fy + 1.15, zz), V(fx + dir * run, fy + rise + 1.15, zz), 0.08, mat)); // поручень
    for (const t of [0, 0.5, 1]) g.add(beam(V(fx + dir * run * t, fy + rise * t, zz), V(fx + dir * run * t, fy + 1.15 + rise * t, zz), 0.07, mat));
  }
  for (let st = 0; st < steps; st++) g.add(box(run / steps * 0.9, 0.08, width, mat, fx + dir * (st + 0.5) * run / steps, fy + (st + 0.85) * rise / steps, fz));
}
/** Площадка: настил с верхом на отметке y и ограждение по сторонам — буквы n, s, w, e (север, юг, запад, восток) */
function addDeck(g, mat, x0, x1, z0, z1, y, rails = '', t = 0.16) {
  g.add(box(x1 - x0, t, z1 - z0, mat, (x0 + x1) / 2, y - t / 2, (z0 + z1) / 2));
  const rail = (ax, az, bx, bz) => {
    g.add(beam(V(ax, y + 1.1, az), V(bx, y + 1.1, bz), 0.07, mat), beam(V(ax, y + 0.55, az), V(bx, y + 0.55, bz), 0.05, mat));
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2.2));
    for (let i = 0; i <= n; i++) { const px = ax + (bx - ax) * i / n, pz = az + (bz - az) * i / n; g.add(beam(V(px, y, pz), V(px, y + 1.1, pz), 0.07, mat)); }
  };
  if (rails.includes('n')) rail(x0, z0, x1, z0);
  if (rails.includes('s')) rail(x0, z1, x1, z1);
  if (rails.includes('w')) rail(x0, z0, x0, z1);
  if (rails.includes('e')) rail(x1, z0, x1, z1);
}
/**
 * Лестничная башня: марши «змейкой» в стальной клетке, по два марша на этаж.
 * x0, z0 — северо-западный угол клетки, l × w — её размеры, base — низ, levels — отметки площадок этажей.
 */
function addStairTower(g, mat, x0, z0, l, w, base, levels) {
  const land = 1.1, run = l - land * 2, lane = w / 2, top = levels[levels.length - 1];
  for (const [cx, cz] of [[x0, z0], [x0 + l, z0], [x0, z0 + w], [x0 + l, z0 + w]]) g.add(beam(V(cx, base, cz), V(cx, top + 1.2, cz), 0.28, mat));
  let y = base;
  for (const lv of levels) {
    const mid = (y + lv) / 2;
    addFlight(g, mat, x0 + land, y, z0 + lane / 2, 1, mid - y, run, lane - 0.3);
    addDeck(g, mat, x0 + l - land, x0 + l, z0, z0 + w, mid, 'e'); // промежуточная площадка
    addFlight(g, mat, x0 + l - land, mid, z0 + lane * 1.5, -1, lv - mid, run, lane - 0.3);
    addDeck(g, mat, x0, x0 + land, z0, z0 + w, lv, 'w'); // площадка этажа
    for (const yy of [mid, lv]) for (const zz of [z0, z0 + w]) g.add(beam(V(x0, yy - 0.2, zz), V(x0 + l, yy - 0.2, zz), 0.14, mat));
    y = lv;
  }
}
/** Два марша у площадки грохота: с пола на первый уровень и с него на второй; между ними — проход по краю площадки */
function addTwoFlights(g, mat, bx, bz, base, lv1, lv2) {
  const run1 = (lv1 - base) * 0.9, run2 = (lv2 - lv1) * 0.86, walk = 8;
  addFlight(g, mat, bx, base, bz, 1, lv1 - base, run1, 1.3);
  addDeck(g, mat, bx + run1, bx + run1 + walk, bz - 0.75, bz + 0.75, lv1 + 0.05, 'n');
  addFlight(g, mat, bx + run1 + walk, lv1, bz + 1.6, -1, lv2 - lv1, run2, 1.2);
  addDeck(g, mat, bx + run1 + walk - run2 - 1.3, bx + run1 + walk - run2, bz + 0.9, bz + 2.3, lv2 + 0.05, 'n');
}
/** Обе лестницы объекта: два марша у грохота (x, z — низ первого марша) и двухэтажная башня (x2, z2 — середина её клетки) */
function addStairs(g, mat, x, z, x2, z2, both = true) {
  const { screen, crusherStair: t } = HANGAR_PLANT;
  const hl = HANGAR.length / 2, hw = HANGAR.width / 2;
  const sb = 0.4 + floorRise(screen.x + 1, screen.z + 1); // пол под площадкой грохота
  addTwoFlights(g, mat, x - hl, z - hw, 0.4 + floorRise(x, z), sb + screen.levels[0], sb + screen.levels[1]);
  if (both) addStairTower(g, mat, x2 - hl - t.l / 2, z2 - hw - t.w / 2, t.l, t.w, 0.4 + floorRise(x2, z2), t.levels.map((v) => 0.4 + v));
}

// ── Фигуры работ. Возвращают { group, center } в координатах модели (центр здания — начало координат) ──
function buildShape(item, mat) {
  const { width: Wd, length: L, eave, ridge } = HANGAR;
  const hw = Wd / 2, hl = L / 2;
  const g = new THREE.Group();
  const x = item.x - hl, z = item.z - hw;
  const y0 = item.floor === 2 ? 0.42 + HANGAR_INNER.floor2 : 0.4 + floorRise(item.x, item.z); // второй этаж — первая площадка этажерки
  let center = V(x, y0 + 1.5, z);
  const n = item.count || 1;
  switch (item.shape) {
    case 'stairs': {
      // Лестницы стоят в разных местах: первая — два марша у площадки грохота в середине здания;
      // вторая — двухэтажная башня у входа, рядом с дробилкой. У каждой своя точка на плане.
      addStairs(g, mat, item.x, item.z, item.x2, item.z2, n >= 2 && Number.isFinite(item.x2));
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
      // подача и обратка вдоль стен, регистры в каждом пролёте; на выступе пола всё идёт выше — по его уровню
      const S = HANGAR.step, edge = S && S.height > 0 ? S.from - hl : hl, up = S && S.height > 0 ? S.height : 0;
      for (const side of [-1, 1]) {
        const zz = side * (hw - 0.7);
        for (const yy of [0.9, 1.5]) {
          g.add(tube(V(-hl + 1, yy, zz), V(Math.min(edge, hl - 1), yy, zz), 0.1, mat));
          if (edge < hl - 1) g.add(tube(V(edge, yy, zz), V(edge, yy + up, zz), 0.1, mat), tube(V(edge, yy + up, zz), V(hl - 1, yy + up, zz), 0.1, mat));
        }
        for (let i = 0; i < 10; i++) { const rx = -hl + 3.5 + i * 7; g.add(box(3.4, 1.0, 0.25, mat, rx, 1.2 + floorRise(rx + hl, side < 0 ? 0.7 : Wd - 0.7), zz)); }
      }
      g.add(tube(V(hl - 1, 0.9 + floorRise(L - 1, Wd / 2), -hw + 0.7), V(hl - 1, 0.9 + floorRise(L - 1, Wd / 2), hw - 0.7), 0.1, mat));
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
      const funnel = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w, d) * 0.66, 0.6, h - 1.2, 4), mat); // воронка короба
      funnel.rotation.y = Math.PI / 4; funnel.position.set(x, y0 + 1.1 + (h - 1.2) / 2, z);
      g.add(funnel);
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

    // каркас: колонны и фермы с шагом L / bays, прогоны кровли, ригели стен, связи в крайних пролётах, подкрановые балки
    const steel = new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.45, metalness: 0.6 });
    const frame = new THREE.Group();
    const step = L / bays;
    const slopeY = (z) => ridge - (Math.abs(z) / hw) * (ridge - eave);
    const P = HANGAR_PLANT;
    const railY = 0.4 + P.cranes.rail; // верх подкрановой балки — по нему идёт рельс
    for (let i = 0; i <= bays; i++) {
      const x = -hl + i * step;
      frame.add(beam(V(x, 0.4, -hw), V(x, eave, -hw), 0.55, steel), beam(V(x, 0.4, hw), V(x, eave, hw), 0.55, steel));
      frame.add(beam(V(x, eave, -hw), V(x, ridge, 0), 0.4, steel), beam(V(x, eave, hw), V(x, ridge, 0), 0.4, steel));
      frame.add(beam(V(x, eave, -hw), V(x, eave, hw), 0.26, steel)); // нижний пояс фермы
      frame.add(beam(V(x, eave, 0), V(x, ridge, 0), 0.16, steel)); // решётка фермы
      for (const side of [-1, 1]) frame.add(beam(V(x, eave, side * hw / 2), V(x, slopeY(hw / 2), side * hw / 2), 0.16, steel), beam(V(x, eave, 0), V(x, slopeY(hw / 2), side * hw / 2), 0.14, steel), beam(V(x, eave, side * hw / 2), V(x, slopeY(hw * 0.8), side * hw * 0.8), 0.14, steel));
      for (const side of [-1, 1]) frame.add(beam(V(x, railY - 0.7, side * hw), V(x, railY - 0.7, side * (hw - 0.9)), 0.4, steel)); // консоль под подкрановую балку
    }
    for (const z of [-hw, -hw * 0.66, -hw * 0.33, 0, hw * 0.33, hw * 0.66, hw]) frame.add(beam(V(-hl, slopeY(z) + 0.2, z), V(hl, slopeY(z) + 0.2, z), 0.26, steel));
    for (const y of [5, 10, 15]) frame.add(beam(V(-hl, y, -hw), V(hl, y, -hw), 0.22, steel), beam(V(-hl, y, hw), V(hl, y, hw), 0.22, steel));
    for (const x0 of [-hl, hl - step]) for (const z of [-hw, hw]) frame.add(beam(V(x0, 0.4, z), V(x0 + step, eave, z), 0.16, steel), beam(V(x0 + step, 0.4, z), V(x0, eave, z), 0.16, steel));
    for (const side of [-1, 1]) frame.add(box(L, 0.8, 0.45, steel, 0, railY - 0.4, side * (hw - 0.9))); // подкрановые балки
    scene.add(fused(frame));

    // ── то, что стоит внутри (по фотографиям объекта) ──
    const mx = (v) => v - hl, mz = (v) => v - hw; // метры от западного торца и северной стены → координаты модели
    const solid = (color, extra) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.35, ...extra });
    const plantMat = solid(0x8794ae), concMat = solid(0x8f97a6, { roughness: 0.95, metalness: 0 }), binMat = solid(0xdde4ee, { metalness: 0.15 });
    const craneMat = solid(0xd4532c), darkMat = solid(0x3a435b, { metalness: 0.1 });
    const slabMat = solid(0x7c8aa5, { transparent: true, opacity: 0.55, depthWrite: false });
    const boothMat = solid(0x2b3349, { transparent: true, opacity: 0.6, depthWrite: false });
    const ctxMats = [plantMat, concMat, binMat, craneMat, darkMat, slabMat, boothMat];
    ctxMats.forEach((m) => { m.userData.base = m.opacity; });
    const plant = new THREE.Group();
    const put = (s, x, y, z) => { s.position.set(x, y, z); scene.add(s); return s; };
    const pyramid = (rTop, rBottom, h, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 4), mat); m.rotation.y = Math.PI / 4; m.position.set(x, y, z); return m; };

    // выступ пола вверх — плита на всю дальнюю от входа половину здания; на ней стоят грохот и этажерка
    const S = HANGAR.step;
    if (S && S.height > 0) {
      const sx0 = mx(S.from), sx1 = Math.min(hl, sx0 + S.length), sz0 = mz(S.z), sz1 = Math.min(hw, sz0 + S.width);
      const sl = sx1 - sx0, sw = sz1 - sz0, cx = (sx0 + sx1) / 2, cz = (sz0 + sz1) / 2, cy = 0.4 + S.height / 2;
      plant.add(box(sl, S.height, sw, concMat, cx, cy, cz));
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sl, S.height, sw)), new THREE.LineBasicMaterial({ color: 0xfcd34d }));
      edge.position.set(cx, cy + 0.03, cz); edge.renderOrder = 5; edge.material.depthTest = false;
      scene.add(edge);
      put(label(`выступ +${S.height} м`, '#fcd34d'), sx0 + Math.min(6, sl / 2), 0.4 + S.height + 1.4, sz0 + Math.min(4, sw / 2)); // у края плиты, на свободной стороне цеха
    }

    // этажерка с двумя бункерами: три площадки на колоннах, бункеры в пролёте со стороны цеха, рядом лестничная башня
    {
      const r = P.rack, x0 = mx(r.x), x1 = mx(r.x + r.l), z0 = mz(r.z), z1 = mz(r.z + r.w);
      const baseY = 0.4 + floorRise(r.x + 1, r.z + 1), lv = r.levels.map((v) => 0.4 + v), top = lv[lv.length - 1];
      const xs = [x0, (x0 + x1) / 2, x1], zs = [z0, (z0 + z1) / 2, z1];
      for (const cx of xs) for (const cz of zs) plant.add(beam(V(cx, baseY, cz), V(cx, top, cz), 0.42, plantMat));
      lv.forEach((y) => {
        plant.add(box(x1 - x0, 0.25, z1 - z0, slabMat, (x0 + x1) / 2, y - 0.125, (z0 + z1) / 2));
        for (const cx of xs) plant.add(beam(V(cx, y - 0.45, z0), V(cx, y - 0.45, z1), 0.3, plantMat));
        for (const cz of zs) plant.add(beam(V(x0, y - 0.45, cz), V(x1, y - 0.45, cz), 0.3, plantMat));
        for (const [ax, az, bx, bz] of [[x0, z0, x1, z0], [x0, z0, x0, z1], [x1, z0, x1, z1]]) plant.add(beam(V(ax, y + 1.1, az), V(bx, y + 1.1, bz), 0.08, plantMat), beam(V(ax, y + 0.55, az), V(bx, y + 0.55, bz), 0.05, plantMat));
      });
      const hx = (xs[0] + xs[1]) / 2;
      for (const hz of [(zs[0] + zs[1]) / 2, (zs[1] + zs[2]) / 2]) {
        plant.add(box(4.3, top - lv[1] - 0.9, 4.3, binMat, hx, (top + lv[1] + 0.7) / 2, hz)); // бункер
        plant.add(pyramid(3.04, 0.55, 2.2, binMat, hx, lv[1] - 0.3, hz)); // его воронка
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.28, 1.1, 14), plantMat); cone.position.set(hx, lv[0] + 1.75, hz); plant.add(cone); // конус дозатора
        plant.add(box(1.3, 0.9, 1.3, binMat, hx, lv[0] + 0.5, hz));
      }
      const t = P.rackStair;
      addStairTower(plant, plantMat, mx(t.x), mz(t.z), t.l, t.w, 0.4 + floorRise(t.x + 1, t.z + 1), lv);
      put(label('2 этаж', '#cbd5e1'), (xs[1] + xs[2]) / 2, lv[0] + 1.7, zs[1]);
    }

    // площадка грохота: два уровня; марши к ней — отдельная работа (или показаны серым, если такой работы нет)
    {
      const c = P.screen, x0 = mx(c.x), x1 = mx(c.x + c.l), z0 = mz(c.z), z1 = mz(c.z + c.w), base = 0.4 + floorRise(c.x + 1, c.z + 1), y1 = base + c.levels[0], y2 = base + c.levels[1];
      const ux0 = mx(c.upper.x), ux1 = ux0 + c.upper.l, uz0 = z0 + 1.6, ucx = (ux0 + ux1) / 2, ucz = (uz0 + z1) / 2;
      for (const cx of [x0 + 0.2, x1 - 0.2]) for (const cz of [z0 + 0.2, z1 - 0.2]) plant.add(beam(V(cx, base, cz), V(cx, y1, cz), 0.42, plantMat));
      plant.add(beam(V(x0 + 0.2, base, z0 + 0.2), V(x1 - 0.2, y1 - 0.5, z0 + 0.2), 0.13, plantMat), beam(V(x1 - 0.2, base, z0 + 0.2), V(x0 + 0.2, y1 - 0.5, z0 + 0.2), 0.13, plantMat));
      addDeck(plant, plantMat, x0, x1, z0, z1, y1, 'e', 0.22);
      for (const cx of [ux0, ux1]) for (const cz of [uz0, z1 - 0.2]) plant.add(beam(V(cx, y1, cz), V(cx, y2, cz), 0.3, plantMat));
      addDeck(plant, plantMat, ux0, ux1, uz0, z1, y2, 'nw', 0.22);
      const scr = box(4.3, 1.3, 2.5, binMat, ucx + 0.2, y1 + 1.55, ucz); scr.rotation.z = 0.24; plant.add(scr); // грохот — наклонный короб
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.8, 16), craneMat); ex.rotation.x = Math.PI / 2; ex.position.set(ucx + 0.2, y1 + 1.7, ucz); plant.add(ex); // вибратор
      plant.add(pyramid(1.9, 0.6, 1.5, binMat, ucx, y2 - 1.0, ucz)); // приёмная воронка
      plant.add(beam(V(ucx - 0.4, y1 - 0.3, ucz), V(x0 + 0.9, base + 0.9, ucz), 0.7, binMat), beam(V(ucx + 0.8, y1 - 0.3, ucz), V(x1 - 1.6, base + 0.9, ucz), 0.7, binMat)); // течки вниз
      put(label('Грохот', '#cbd5e1'), ucx, y2 + 2.6, ucz);
    }

    // наклонный конвейер вдоль южной стены: от дробилки к грохоту, на опорах; над ним вдоль стены — труба
    {
      const c = P.conveyor, a = V(mx(c.x1), 0.4 + c.y1, mz(c.z)), b = V(mx(c.x2), 0.4 + c.y2, mz(c.z)), half = c.w / 2;
      for (const dz of [-half, half]) plant.add(beam(a.clone().add(V(0, 0, dz)), b.clone().add(V(0, 0, dz)), 0.28, plantMat));
      const belt = beam(a.clone().add(V(0, 0.22, 0)), b.clone().add(V(0, 0.22, 0)), 0.16, darkMat); belt.scale.x = (c.w * 0.72) / 0.16; plant.add(belt);
      const walk = beam(a.clone().add(V(0, 0.05, -half - 0.45)), b.clone().add(V(0, 0.05, -half - 0.45)), 0.08, plantMat); walk.scale.x = 0.7 / 0.08; plant.add(walk);
      plant.add(beam(a.clone().add(V(0, 1.15, -half - 0.8)), b.clone().add(V(0, 1.15, -half - 0.8)), 0.07, plantMat));
      for (let i = 0; i <= 8; i++) { const q = a.clone().lerp(b, i / 8).add(V(0, 0.05, -half - 0.8)); plant.add(beam(q, q.clone().add(V(0, 1.1, 0)), 0.06, plantMat)); }
      for (const tt of [0.22, 0.5, 0.78]) {
        const q = a.clone().lerp(b, tt), fy = 0.4 + floorRise(q.x + hl, c.z); // пол под опорой
        for (const dz of [-half, half]) plant.add(beam(V(q.x, fy, q.z + dz), V(q.x, q.y - 0.15, q.z + dz), 0.3, plantMat));
        plant.add(beam(V(q.x, fy, q.z - half), V(q.x, q.y - 0.4, q.z + half), 0.1, plantMat), beam(V(q.x, fy, q.z + half), V(q.x, q.y - 0.4, q.z - half), 0.1, plantMat));
      }
      plant.add(tube(V(mx(P.crusher.x + 1), 0.4 + P.crusher.top + 0.6, hw - 0.9), V(mx(P.rack.x - 3), railY - 1.6, hw - 0.9), 0.4, plantMat));
    }

    // дробилка на бетонном коробе; над ней площадка питания с воронкой — на уровне верха двухэтажной лестницы
    {
      const c = P.crusher, x0 = mx(c.x), x1 = mx(c.x + c.l), z0 = mz(c.z), z1 = mz(c.z + c.w), y = 0.4 + c.h, yd = y + 0.2, yt = 0.4 + c.top;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2 + 0.5;
      plant.add(box(c.l, c.h, 0.5, concMat, cx, 0.4 + c.h / 2, z1 - 0.25));
      for (const wx of [x0 + 0.25, x1 - 0.25]) plant.add(box(0.5, c.h, c.w - 1.4, concMat, wx, 0.4 + c.h / 2, z1 - (c.w - 1.4) / 2));
      for (const px of [x0 + 0.2, x1 - 0.2]) plant.add(beam(V(px, 0.4, z0 + 0.2), V(px, yt, z0 + 0.2), 0.3, plantMat), beam(V(px, yd, z1 - 0.5), V(px, yt, z1 - 0.5), 0.3, plantMat));
      addDeck(plant, plantMat, x0, x1, z0, z1, yd, 'ne', 0.22);
      plant.add(box(2.6, 2.1, 2.0, binMat, cx - 0.2, yd + 1.05, cz)); // корпус дробилки
      for (const dz of [-1.2, 1.2]) { const fw = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.3, 24), dz < 0 ? plantMat : binMat); fw.rotation.x = Math.PI / 2; fw.position.set(cx, yd + 1.45, cz + dz); plant.add(fw); } // маховики
      addDeck(plant, plantMat, x0, x1, z0, z1, yt, 'ne', 0.22);
      plant.add(pyramid(2.1, 0.75, 2.3, binMat, cx - 0.2, yt - 1.35, cz));
      put(label('Дробилка', '#cbd5e1'), cx, yt + 2.6, cz);
    }

    // будка из сэндвич-панелей в углу у входа
    {
      const c = P.booth, cx = mx(c.x + c.l / 2), cz = mz(c.z + c.w / 2);
      plant.add(box(c.l, c.h, c.w, boothMat, cx, 0.4 + c.h / 2, cz));
      plant.add(box(c.l + 0.5, 0.16, c.w + 0.5, binMat, cx, 0.4 + c.h + 0.08, cz));
    }

    // подкрановые рельсы по обеим балкам и два мостовых крана на них; у каждого крана под мостом — будка крановщика
    for (const side of [-1, 1]) plant.add(box(L - 0.6, 0.16, 0.14, darkMat, 0, railY + 0.08, side * (hw - 0.9)));
    const cabGlass = new THREE.MeshBasicMaterial({ color: 0xd6e8ff, transparent: true, opacity: 0.75 });
    for (const at of P.cranes.at) {
      const cx = mx(at), tz = hw * 0.15, wy = railY + 0.16 + 0.32; // ось колёс: колесо стоит на рельсе
      for (const side of [-1, 1]) {
        const ez = side * (hw - 0.9);
        plant.add(box(5.2, 0.7, 0.7, craneMat, cx, wy + 0.25, ez)); // концевая балка
        for (const dx of [-2, 2]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), darkMat); wheel.rotation.x = Math.PI / 2; wheel.position.set(cx + dx, wy, ez); plant.add(wheel); } // колёса на рельсе
      }
      for (const dx of [-1.6, 1.6]) plant.add(box(0.7, 1.5, Wd - 1.5, craneMat, cx + dx, wy + 1.0, 0)); // главные балки моста
      plant.add(box(2.8, 0.9, 2.2, craneMat, cx, wy + 2.2, tz)); // грузовая тележка
      plant.add(tube(V(cx, wy + 1.7, tz), V(cx, railY - 2.2, tz), 0.06, darkMat), box(0.7, 0.7, 0.4, darkMat, cx, railY - 2.5, tz)); // трос и крюк
      // будка: висит под мостом у северной стены, окна — в сторону цеха
      const bz = -hw + 2.6, by = wy - 1.75;
      plant.add(box(2.2, 2.3, 2.0, craneMat, cx, by, bz));
      plant.add(box(2.3, 0.14, 2.1, darkMat, cx, by + 1.2, bz), box(2.3, 0.14, 2.1, darkMat, cx, by - 1.2, bz));
      for (const dx of [-0.9, 0.9]) plant.add(beam(V(cx + dx, by + 1.2, bz), V(cx + dx, wy + 0.3, bz), 0.12, craneMat));
      const gl = new THREE.Mesh(new THREE.BoxGeometry(2.24, 1.0, 1.6), cabGlass); gl.position.set(cx, by + 0.35, bz + 0.25); scene.add(gl);
    }
    scene.add(fused(plant));

    // лестницы серым — пока среди работ объекта нет своей «лестничной» работы (она рисует их в цвет состояния)
    const ghostDraft = new THREE.Group();
    addStairs(ghostDraft, plantMat, P.screen.x - (P.screen.levels[0]) * 0.9, P.screen.z + 0.9, P.crusherStair.x + P.crusherStair.l / 2, P.crusherStair.z + P.crusherStair.w / 2);
    const ghostStairs = fused(ghostDraft);
    scene.add(ghostStairs);

    // обшивка: две длинные стены, два торца, два ската кровли, ворота, ленты окон и световой конёк
    const skins = [];
    const cover = (color, opacity) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.1, depthWrite: false });
    const wallMat = cover(COLORS.wall, 0.26), roofMat = cover(COLORS.roof, 0.5);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xd6e8ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x334155, side: THREE.DoubleSide, roughness: 0.8, transparent: true, opacity: 0.85 });
    const wallGeo = new THREE.PlaneGeometry(L, eave);
    const north = new THREE.Mesh(wallGeo, wallMat); north.position.set(0, eave / 2, -hw - 0.3);
    const south = new THREE.Mesh(wallGeo, wallMat); south.position.set(0, eave / 2, hw + 0.3);
    const gable = new THREE.Shape();
    gable.moveTo(-hw, 0); gable.lineTo(hw, 0); gable.lineTo(hw, eave); gable.lineTo(0, ridge); gable.lineTo(-hw, eave); gable.closePath();
    const gableGeo = new THREE.ShapeGeometry(gable);
    const west = new THREE.Mesh(gableGeo, wallMat); west.rotation.y = Math.PI / 2; west.position.x = -hl - 0.3;
    const east = new THREE.Mesh(gableGeo, wallMat); east.rotation.y = Math.PI / 2; east.position.x = hl + 0.3;
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), gateMat); // вход — ворота в западном торце
    gate.rotation.y = Math.PI / 2; gate.position.set(-hl - 0.45, 3.5, 0);
    const gate2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 5.5), gateMat); // вторые ворота — в восточном торце, ближе к северной стене
    gate2.rotation.y = Math.PI / 2; gate2.position.set(hl + 0.45, 2.75 + floorRise(L - 1, Wd * 0.35), -hw * 0.3); // на уровне пола у этого торца
    scene.add(north, south, west, east, gate, gate2); skins.push(north, south, west, east, gate, gate2);
    const slopeLen = Math.hypot(hw, ridge - eave);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.2, slopeLen + 0.6), roofMat);
      r.position.set(0, (eave + ridge) / 2 + 0.45, side * hw / 2);
      r.rotation.x = -Math.PI / 2 + side * Math.atan2(ridge - eave, hw);
      scene.add(r); skins.push(r);
    }
    const winTop = new THREE.PlaneGeometry(step * 0.62, 1.5), winLow = new THREE.PlaneGeometry(step * 0.42, 1.3);
    for (let i = 0; i < bays; i++) for (const side of [-1, 1]) {
      const wx = -hl + (i + 0.5) * step, wz = side * (hw + 0.36);
      const a = new THREE.Mesh(winTop, glassMat); a.position.set(wx, eave - 2.4, wz); // верхняя лента окон
      const b = new THREE.Mesh(winLow, glassMat); b.position.set(wx, 2.6, wz); // нижний ряд
      scene.add(a, b); skins.push(a, b);
    }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(L - 4, 1.3), glassMat); // световая полоса по коньку
    sky.rotation.x = -Math.PI / 2; sky.position.set(0, ridge + 0.62, 0);
    scene.add(sky); skins.push(sky);

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
      for (const m of ctxMats) { m.transparent = true; m.opacity = interior ? Math.min(m.userData.base, 0.22) : m.userData.base; m.depthWrite = !interior && m.userData.base === 1; }
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
        ghostStairs.visible = !list.some((it) => it.shape === 'stairs');
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
        if (inside) flat.set(-0.4, 0, -1).normalize(); // то, что внутри, смотрим из цеха, с северной стороны: оборудование стоит у южной стены открытой стороной к цеху
        else if (s) { const out = V(s.center.x, 0, s.center.z); if (out.length() > 8) flat.multiplyScalar(0.35).add(out.normalize()).normalize(); }
        const dir = V(flat.x, inside ? 0.4 : 0.62, flat.z).normalize();
        focus = { target, pos: target.clone().addScaledVector(dir, dist), frames: 46 };
        if (tagRef.current) { tagRef.current.textContent = s ? s.title : ''; tagRef.current.style.display = s ? 'block' : 'none'; }
        paint();
      },
      skin(on) { skinOn = on; paint(); },
    };
    apiRef.current = api;

    const homeDist = () => 98 * Math.min(2.4, Math.max(1, 1.25 / camera.aspect)); // узкий экран — камера дальше, здание целиком в кадре
    const resize = () => {
      const w = el.clientWidth || 600, h = el.clientHeight || 380;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // узкий экран телефона: отодвигаем камеру, чтобы ангар помещался целиком
      camera.updateProjectionMatrix();
      if (!picked) { // пока работа не выбрана, держим общий вид; выбранную не «отбрасываем» при повороте телефона
        if (focus) { // камера ещё летит к общему виду: цель полёта пересчитываем под новый размер, иначе она остановится слишком близко
          const dir = focus.pos.clone().sub(focus.target).normalize();
          focus.pos = focus.target.clone().addScaledVector(dir, homeDist());
        } else {
          const dir = camera.position.clone().sub(controls.target).normalize();
          camera.position.copy(controls.target).addScaledVector(dir, homeDist());
        }
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
