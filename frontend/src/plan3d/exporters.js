// Выгрузка: чертёж плана (SVG, DXF) и ведомость объёмов. Без зависимостей от three.js — работает и в Node.

import { wallFaces, wallJoins, wallLength } from './model.js';
import { buildRooms } from './rooms.js';

const r3 = (v) => Math.round(v * 1000) / 1000;
const ru = (v, digits = 2) => v.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Всё, что нужно начертить на плане этажа, в метрах и в координатах плана (Y вверх). */
export function planPrimitives(floor) {
  const joins = wallJoins(floor.walls);
  const byWall = new Map();
  for (const o of floor.openings) {
    const arr = byWall.get(o.wallId);
    if (arr) arr.push(o); else byWall.set(o.wallId, [o]);
  }
  const polys = [];
  const faceLines = [];
  const windows = [];
  const doors = [];
  const axes = [];
  for (const w of floor.walls) {
    const len = wallLength(w);
    if (len < 0.02) continue;
    const ux = (w.bx - w.ax) / len;
    const uy = (w.by - w.ay) / len;
    const h = w.t / 2;
    const P = (s, side) => ({ x: r3(w.ax + ux * s - uy * side * h), y: r3(w.ay + uy * s + ux * side * h) });
    const f = wallFaces(w, joins);
    axes.push([w.ax, w.ay, w.bx, w.by]);
    const ops = (byWall.get(w.id) || [])
      .map((o) => ({ s0: Math.max(0, o.at - o.w / 2), s1: Math.min(len, o.at + o.w / 2), type: o.type }))
      .filter((o) => o.s1 - o.s0 > 0.02)
      .sort((a, b) => a.s0 - b.s0);
    let l0 = f.left[0];
    let r0 = f.right[0];
    let capStart = f.capA;
    const piece = (l1, r1, capEnd) => {
      if (Math.max(l1 - l0, r1 - r0) > 0.005) {
        polys.push([P(l0, 1), P(l1, 1), P(r1, -1), P(r0, -1)]);
        faceLines.push([P(l0, 1), P(l1, 1)], [P(r0, -1), P(r1, -1)]);
        if (capStart) faceLines.push([P(l0, 1), P(r0, -1)]);
        if (capEnd) faceLines.push([P(l1, 1), P(r1, -1)]);
      }
    };
    for (const o of ops) {
      piece(o.s0, o.s0, true);
      if (o.type === 'window') {
        windows.push([[P(o.s0, 1), P(o.s1, 1)], [P(o.s0, -1), P(o.s1, -1)], [P(o.s0, 0), P(o.s1, 0)]]);
      } else {
        const width = o.s1 - o.s0;
        const hinge = P(o.s0, 0);
        doors.push({
          leaf: [hinge, { x: r3(hinge.x - uy * width), y: r3(hinge.y + ux * width) }],
          arc: { cx: hinge.x, cy: hinge.y, r: r3(width), from: Math.atan2(uy, ux), to: Math.atan2(uy, ux) + Math.PI / 2 },
        });
      }
      l0 = o.s1; r0 = o.s1; capStart = true;
    }
    piece(f.left[1], f.right[1], f.capB);
  }
  const { rooms } = buildRooms(floor.walls);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polys) {
    for (const p of poly) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  }
  const bounds = Number.isFinite(minX) ? { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY } : null;
  return { polys, faceLines, windows, doors, axes, rooms, bounds };
}

// ── DXF (R12, миллиметры): открывается в AutoCAD, nanoCAD, Компас ───────────────
export function toDxf(floor) {
  const prim = planPrimitives(floor);
  const mm = (v) => String(Math.round(v * 1000 * 10) / 10);
  const out = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '5'];
  const layers = [['QG_WALLS', 7], ['QG_WINDOWS', 4], ['QG_DOORS', 3], ['QG_AXES', 1], ['QG_ROOMS', 2]];
  for (const [name, color] of layers) out.push('0', 'LAYER', '2', name, '70', '0', '62', String(color), '6', 'CONTINUOUS');
  out.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  const line = (layer, a, b) => out.push('0', 'LINE', '8', layer, '10', mm(a.x), '20', mm(a.y), '30', '0', '11', mm(b.x), '21', mm(b.y), '31', '0');
  prim.faceLines.forEach(([a, b]) => line('QG_WALLS', a, b));
  prim.windows.forEach((w) => w.forEach(([a, b]) => line('QG_WINDOWS', a, b)));
  prim.doors.forEach((d) => {
    line('QG_DOORS', d.leaf[0], d.leaf[1]);
    const deg = (a) => String(Math.round(((a * 180) / Math.PI) * 100) / 100);
    out.push('0', 'ARC', '8', 'QG_DOORS', '10', mm(d.arc.cx), '20', mm(d.arc.cy), '30', '0', '40', mm(d.arc.r), '50', deg(d.arc.from), '51', deg(d.arc.to));
  });
  prim.axes.forEach(([x1, y1, x2, y2]) => line('QG_AXES', { x: x1, y: y1 }, { x: x2, y: y2 }));
  prim.rooms.forEach((r, i) => {
    out.push('0', 'TEXT', '8', 'QG_ROOMS', '10', mm(r.center.x - 0.6), '20', mm(r.center.y), '30', '0', '40', '250', '1', `${i + 1}: S=${r.netArea.toFixed(2)} m2`);
  });
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\r\n');
}

// ── SVG-лист А3 с рамкой, размерами и штампом ────────────────────────────────
const SCALES = [20, 25, 40, 50, 75, 100, 150, 200, 250, 400, 500, 1000, 2000];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function toSvgSheet(project, floorIndex, { date = new Date() } = {}) {
  const floor = project.floors[floorIndex];
  const prim = planPrimitives(floor);
  const W = 420;
  const H = 297;
  const area = { x: 20, y: 12, w: W - 40, h: H - 12 - 62 }; // поле чертежа над штампом
  const b = prim.bounds || { minX: 0, minY: 0, maxX: 1, maxY: 1, w: 1, h: 1 };
  const pad = 22; // место под размерные линии, мм
  const scale = SCALES.find((s) => (b.w * 1000) / s <= area.w - pad * 2 && (b.h * 1000) / s <= area.h - pad * 2) || SCALES[SCALES.length - 1];
  const k = 1000 / scale; // мм на листе за метр
  const ox = area.x + (area.w - b.w * k) / 2;
  const oy = area.y + (area.h - b.h * k) / 2;
  const X = (x) => (ox + (x - b.minX) * k).toFixed(2);
  const Y = (y) => (oy + (b.maxY - y) * k).toFixed(2);
  const pts = (list) => list.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');

  const s = [];
  s.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}" font-family="Arial, sans-serif">`);
  s.push(`<rect width="${W}" height="${H}" fill="#fff"/>`);
  s.push(`<rect x="20" y="5" width="${W - 25}" height="${H - 10}" fill="none" stroke="#000" stroke-width="0.7"/>`);
  // оси
  s.push('<g stroke="#c0392b" stroke-width="0.13" stroke-dasharray="3 1 0.5 1">');
  prim.axes.forEach(([x1, y1, x2, y2]) => s.push(`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}"/>`));
  s.push('</g>');
  // стены
  // обводка в цвет заливки: стыки кусков стен в углах и примыканиях не видны
  s.push('<g fill="#3a3a3a" stroke="#3a3a3a" stroke-width="0.2" stroke-linejoin="round">');
  prim.polys.forEach((poly) => s.push(`<polygon points="${pts(poly)}"/>`));
  s.push('</g>');
  // окна и двери
  s.push('<g stroke="#000" stroke-width="0.18" fill="none">');
  prim.windows.forEach((w) => w.forEach(([p, q]) => s.push(`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(q.x)}" y2="${Y(q.y)}"/>`)));
  prim.doors.forEach((d) => {
    const [p, q] = d.leaf;
    const end = { x: d.arc.cx + d.arc.r * Math.cos(d.arc.from), y: d.arc.cy + d.arc.r * Math.sin(d.arc.from) };
    const rr = (d.arc.r * k).toFixed(2);
    s.push(`<line x1="${X(p.x)}" y1="${Y(p.y)}" x2="${X(q.x)}" y2="${Y(q.y)}"/>`);
    // картинка на листе та же, что на плане (дуга против часовой), но ось Y у SVG направлена вниз — отсюда sweep = 0
    s.push(`<path d="M ${X(end.x)} ${Y(end.y)} A ${rr} ${rr} 0 0 0 ${X(q.x)} ${Y(q.y)}" stroke-width="0.13"/>`);
  });
  s.push('</g>');
  // помещения
  s.push('<g text-anchor="middle" fill="#000">');
  prim.rooms.forEach((r, i) => {
    s.push(`<circle cx="${X(r.center.x)}" cy="${(+Y(r.center.y) - 3.2).toFixed(2)}" r="2.6" fill="#fff" stroke="#000" stroke-width="0.18"/>`);
    s.push(`<text x="${X(r.center.x)}" y="${(+Y(r.center.y) - 2.2).toFixed(2)}" font-size="2.8">${i + 1}</text>`);
    s.push(`<text x="${X(r.center.x)}" y="${(+Y(r.center.y) + 3.6).toFixed(2)}" font-size="3">${ru(r.netArea)} м²</text>`);
  });
  s.push('</g>');
  // габаритные размеры
  if (prim.bounds) {
    const dim = (x1, y1, x2, y2, text, vertical) => {
      s.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="0.18"/>`);
      const tick = 1.2;
      [[x1, y1], [x2, y2]].forEach(([x, y]) => s.push(`<line x1="${(+x - tick).toFixed(2)}" y1="${(+y + tick).toFixed(2)}" x2="${(+x + tick).toFixed(2)}" y2="${(+y - tick).toFixed(2)}" stroke="#000" stroke-width="0.35"/>`));
      const mx = ((+x1 + +x2) / 2).toFixed(2);
      const my = ((+y1 + +y2) / 2).toFixed(2);
      s.push(vertical
        ? `<text x="${(+mx - 1.5).toFixed(2)}" y="${my}" font-size="3" text-anchor="middle" transform="rotate(-90 ${(+mx - 1.5).toFixed(2)} ${my})">${text}</text>`
        : `<text x="${mx}" y="${(+my - 1.5).toFixed(2)}" font-size="3" text-anchor="middle">${text}</text>`);
    };
    const yb = (+Y(b.minY) + 12).toFixed(2);
    const xl = (+X(b.minX) - 12).toFixed(2);
    s.push(`<g stroke="#000" stroke-width="0.13"><line x1="${X(b.minX)}" y1="${Y(b.minY)}" x2="${X(b.minX)}" y2="${(+yb + 2).toFixed(2)}"/><line x1="${X(b.maxX)}" y1="${Y(b.minY)}" x2="${X(b.maxX)}" y2="${(+yb + 2).toFixed(2)}"/><line x1="${X(b.minX)}" y1="${Y(b.minY)}" x2="${(+xl - 2).toFixed(2)}" y2="${Y(b.minY)}"/><line x1="${X(b.minX)}" y1="${Y(b.maxY)}" x2="${(+xl - 2).toFixed(2)}" y2="${Y(b.maxY)}"/></g>`);
    dim(X(b.minX), yb, X(b.maxX), yb, Math.round(b.w * 1000), false);
    dim(xl, Y(b.minY), xl, Y(b.maxY), Math.round(b.h * 1000), true);
  }
  // штамп
  const sx = W - 5 - 185;
  const sy = H - 5 - 55;
  const netArea = prim.rooms.reduce((sum, r) => sum + r.netArea, 0);
  s.push(`<g stroke="#000" stroke-width="0.7" fill="none"><rect x="${sx}" y="${sy}" width="185" height="55"/><line x1="${sx}" y1="${sy + 15}" x2="${sx + 185}" y2="${sy + 15}" stroke-width="0.35"/><line x1="${sx}" y1="${sy + 40}" x2="${sx + 185}" y2="${sy + 40}" stroke-width="0.35"/><line x1="${sx + 120}" y1="${sy + 15}" x2="${sx + 120}" y2="${sy + 55}" stroke-width="0.35"/></g>`);
  s.push(`<text x="${sx + 92.5}" y="${sy + 10}" font-size="5" text-anchor="middle" font-weight="bold">${esc(project.name)}</text>`);
  s.push(`<text x="${sx + 60}" y="${sy + 25}" font-size="4.5" text-anchor="middle">План. ${esc(floor.name)}</text>`);
  s.push(`<text x="${sx + 60}" y="${sy + 33}" font-size="3" text-anchor="middle">Размеры в мм, площади помещений в свету</text>`);
  s.push(`<text x="${sx + 152.5}" y="${sy + 25}" font-size="3.2" text-anchor="middle">Масштаб</text>`);
  s.push(`<text x="${sx + 152.5}" y="${sy + 34}" font-size="6" text-anchor="middle" font-weight="bold">1:${scale}</text>`);
  s.push(`<text x="${sx + 4}" y="${sy + 47}" font-size="3">Помещений: ${prim.rooms.length} · площадь ${ru(netArea)} м² · высота этажа ${ru(project.floorHeight)} м</text>`);
  s.push(`<text x="${sx + 4}" y="${sy + 52}" font-size="2.6" fill="#444">Сформировано в QazGost AI из 2D-плана. Перед выдачей в работу проверьте у проектировщика.</text>`);
  s.push(`<text x="${sx + 152.5}" y="${sy + 49}" font-size="3.2" text-anchor="middle">${date.toLocaleDateString('ru-RU')}</text>`);
  s.push('</svg>');
  return { svg: s.join('\n'), scale };
}

// ── Ведомость объёмов: строки для XLSX и CSV ─────────────────────────────────
export function quantitySheets(project, q) {
  const summary = [
    ['Объект', project.name],
    ['Этажей', project.floors.length],
    ['Высота этажа, м', project.floorHeight],
    ['Толщина перекрытия, м', project.slab],
    ['Высота стен в свету, м', q.wallHeight],
    [],
    ['Показатель', 'Значение', 'Ед.'],
    ['Длина стен по осям', q.totals.wallLength, 'м'],
    ['Площадь стен за вычетом проёмов', q.totals.wallArea, 'м²'],
    ['Объём стен', q.totals.wallVolume, 'м³'],
    ['Дверных проёмов', q.totals.doors, 'шт'],
    ['Оконных проёмов', q.totals.windows, 'шт'],
    ['Помещений', q.totals.rooms, 'шт'],
    ['Площадь помещений в свету', q.totals.roomsNetArea, 'м²'],
    ['Площадь перекрытий', q.totals.slabArea, 'м²'],
    ['Объём перекрытий', q.totals.slabVolume, 'м³'],
  ];
  const walls = [['Этаж', 'Толщина, м', 'Длина, м', 'Площадь брутто, м²', 'Проёмы, м²', 'Площадь нетто, м²', 'Объём, м³']];
  const rooms = [['Этаж', '№', 'Площадь по осям, м²', 'Площадь в свету, м²', 'Периметр по осям, м']];
  for (const f of q.floors) {
    for (const g of f.walls) walls.push([f.name, g.t, g.length, g.gross, g.openings, g.net, g.volume]);
    for (const r of f.rooms) rooms.push([f.name, r.n, r.area, r.netArea, r.perimeter]);
  }
  const slabs = [['Плита', 'Площадь, м²', 'Объём, м³'], ...q.slabs.map((x) => [x.name, x.area, x.volume])];
  return { 'Сводка': summary, 'Стены': walls, 'Помещения': rooms, 'Перекрытия': slabs };
}
