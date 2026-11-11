// Проект «План → 3D»: этажи со стенами и проёмами. Все размеры в метрах, ось Y на плане направлена вверх (как в DXF).

import { uid } from './walls.js';

export const LIMITS = { floors: 60, walls: 4000, openings: 4000, name: 120 };

export const OPENING_PRESETS = {
  door: { w: 0.9, h: 2.1, sill: 0 },
  window: { w: 1.2, h: 1.5, sill: 0.9 },
};

const num = (v, d, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(max, Math.max(min, n));
};
const r3 = (v) => Math.round(v * 1000) / 1000;

export function newFloor(name) {
  return { id: uid('f'), name, walls: [], openings: [] };
}

export function newProject(name = 'Новый объект') {
  return { v: 1, id: null, name, floorHeight: 3, slab: 0.2, groundSlab: true, floors: [newFloor('1 этаж')] };
}

export const wallLength = (w) => Math.hypot(w.bx - w.ax, w.by - w.ay);

/** Приводим к допустимому виду всё, что пришло из файла или с сервера: чужому JSON не доверяем. */
export function sanitizeProject(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const p = newProject(typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, LIMITS.name) : 'Объект без названия');
  p.id = typeof src.id === 'string' ? src.id.slice(0, 80) : null;
  p.floorHeight = num(src.floorHeight, 3, 2, 12);
  p.slab = num(src.slab, 0.2, 0.05, Math.min(1, p.floorHeight - 1.5));
  p.groundSlab = src.groundSlab !== false;
  const floors = Array.isArray(src.floors) ? src.floors.slice(0, LIMITS.floors) : [];
  p.floors = floors.map((f, i) => {
    const floor = newFloor(typeof f?.name === 'string' && f.name.trim() ? f.name.trim().slice(0, 40) : `${i + 1} этаж`);
    if (typeof f?.id === 'string') floor.id = f.id.slice(0, 40);
    const ids = new Set();
    floor.walls = (Array.isArray(f?.walls) ? f.walls : []).slice(0, LIMITS.walls).map((w) => {
      let id = typeof w?.id === 'string' && w.id ? w.id.slice(0, 40) : uid('w');
      if (ids.has(id)) id = uid('w');
      ids.add(id);
      return {
        id,
        ax: r3(num(w?.ax, 0, -5000, 5000)), ay: r3(num(w?.ay, 0, -5000, 5000)),
        bx: r3(num(w?.bx, 0, -5000, 5000)), by: r3(num(w?.by, 0, -5000, 5000)),
        t: r3(num(w?.t, 0.2, 0.03, 2)),
      };
    }).filter((w) => wallLength(w) >= 0.05);
    const byId = new Map(floor.walls.map((w) => [w.id, w]));
    floor.openings = (Array.isArray(f?.openings) ? f.openings : []).slice(0, LIMITS.openings).map((o) => {
      const wall = byId.get(o?.wallId);
      if (!wall) return null;
      const len = wallLength(wall);
      const type = o?.type === 'window' ? 'window' : 'door';
      const w = r3(num(o?.w, OPENING_PRESETS[type].w, 0.3, Math.max(0.3, len)));
      return {
        id: typeof o?.id === 'string' && o.id ? o.id.slice(0, 40) : uid('o'),
        wallId: wall.id,
        type,
        w,
        at: r3(num(o?.at, len / 2, w / 2, Math.max(w / 2, len - w / 2))),
        h: r3(num(o?.h, OPENING_PRESETS[type].h, 0.3, 6)),
        sill: r3(num(o?.sill, OPENING_PRESETS[type].sill, 0, 4)),
      };
    }).filter(Boolean);
    return floor;
  });
  if (!p.floors.length) p.floors = [newFloor('1 этаж')];
  return p;
}

export function cloneFloor(floor, name) {
  const map = new Map();
  const walls = floor.walls.map((w) => { const id = uid('w'); map.set(w.id, id); return { ...w, id }; });
  const openings = floor.openings.map((o) => ({ ...o, id: uid('o'), wallId: map.get(o.wallId) }));
  return { id: uid('f'), name, walls, openings };
}

export function planBounds(floors) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of floors) {
    for (const w of f.walls) {
      minX = Math.min(minX, w.ax, w.bx); maxX = Math.max(maxX, w.ax, w.bx);
      minY = Math.min(minY, w.ay, w.by); maxY = Math.max(maxY, w.ay, w.by);
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/**
 * К чему примыкает каждый конец стены:
 *  'tee'    — упирается в другую стену (в её середину или в стык двух её кусков);
 *  'corner' — сходится с концом другой стены под углом;
 *  'inline' — продолжается другой стеной по прямой.
 * Нужно, чтобы закрыть углы в 3D, начертить грани без нахлёстов и не считать объём примыкания дважды.
 * dx, dy — направление соседней стены от узла.
 * @returns {Map<string, {a: null|{kind:string,t:number,dx:number,dy:number}, b: null|{kind:string,t:number,dx:number,dy:number}}>}
 */
export function wallJoins(walls, tol = 0.03) {
  const res = new Map();
  for (const w of walls) {
    const wl = wallLength(w);
    const entry = { a: null, b: null };
    if (wl < 1e-6) { res.set(w.id, entry); continue; }
    const wx = (w.bx - w.ax) / wl;
    const wy = (w.by - w.ay) / wl;
    for (const end of ['a', 'b']) {
      const ex = end === 'a' ? w.ax : w.bx;
      const ey = end === 'a' ? w.ay : w.by;
      const touching = [];
      for (const v of walls) {
        if (v.id === w.id) continue;
        const len = wallLength(v);
        if (len < 1e-6) continue;
        const ux = (v.bx - v.ax) / len;
        const uy = (v.by - v.ay) / len;
        const t = ux * (ex - v.ax) + uy * (ey - v.ay);
        const d = Math.abs(-uy * (ex - v.ax) + ux * (ey - v.ay));
        if (d > tol || t < -tol || t > len + tol) continue;
        const atStart = t <= tol;
        const atEnd = t >= len - tol;
        const cross = Math.abs(wx * uy - wy * ux);
        // направление соседа от узла
        touching.push({ mid: !atStart && !atEnd, t: v.t, dx: atEnd ? -ux : ux, dy: atEnd ? -uy : uy, inline: cross < 0.05 });
      }
      if (!touching.length) continue;
      const angled = touching.filter((x) => !x.inline);
      const thickest = (list) => list.reduce((best, x) => (x.t > best.t ? x : best), list[0]);
      const mids = angled.filter((x) => x.mid);
      // сосед продолжает нашу стену по прямой (уходит от узла туда же, куда смотрит наш конец)
      const outX = end === 'a' ? -wx : wx;
      const outY = end === 'a' ? -wy : wy;
      const ahead = touching.filter((x) => x.inline && !x.mid && x.dx * outX + x.dy * outY > 0.98);
      let join;
      if (mids.length) {
        join = { kind: 'tee', ...thickest(mids) };
      } else if (ahead.length) {
        join = { kind: 'inline', ...thickest(ahead) };
      } else {
        // два куска, лежащие на одной прямой и расходящиеся от узла, — это сквозная стена, в которую мы упираемся
        const through = angled.filter((x) => angled.some((y) => y !== x && x.dx * y.dx + x.dy * y.dy < -0.98));
        if (through.length) join = { kind: 'tee', ...thickest(through) };
        else if (angled.length) join = { kind: 'corner', ...thickest(angled) };
        else join = { kind: 'inline', ...thickest(touching) };
      }
      entry[end] = { kind: join.kind, t: join.t, dx: join.dx, dy: join.dy };
    }
    res.set(w.id, entry);
  }
  return res;
}

/** На сколько продлить конец стены, чтобы закрыть узел. */
export const joinExtension = (join) => (join && join.kind !== 'inline' ? join.t / 2 : 0);

/**
 * Грани стены на плане с подрезкой в узлах: в углу наружная грань длиннее на полтолщины соседа,
 * внутренняя — короче; у примыкания обе грани короче. Значения — координаты вдоль оси стены от точки A.
 * @returns {{ left:[number,number], right:[number,number], capA:boolean, capB:boolean }}
 */
export function wallFaces(wall, joins) {
  const len = wallLength(wall);
  const ux = (wall.bx - wall.ax) / len;
  const uy = (wall.by - wall.ay) / len;
  const j = joins.get(wall.id) || {};
  const res = { left: [0, len], right: [0, len], capA: !j.a, capB: !j.b };
  const trim = (join, isA) => {
    if (!join || join.kind === 'inline') return;
    const half = join.t / 2;
    const idx = isA ? 0 : 1;
    const out = isA ? -1 : 1; // наружу от стены
    if (join.kind === 'tee') {
      res.left[idx] -= out * half;
      res.right[idx] -= out * half;
      return;
    }
    // сосед уходит влево от оси → левая грань внутренняя
    const side = -uy * join.dx + ux * join.dy;
    const leftInner = side > 0;
    res.left[idx] += out * (leftInner ? -half : half);
    res.right[idx] += out * (leftInner ? half : -half);
  };
  trim(j.a, true);
  trim(j.b, false);
  return res;
}

/** Точки привязки для выноса на площадку: A — узел у левого нижнего угла плана, B — у правого нижнего. */
export function anchorPoints(floor) {
  const b = planBounds([floor]);
  if (!b) return null;
  const pts = floor.walls.flatMap((w) => [{ x: w.ax, y: w.ay }, { x: w.bx, y: w.by }]);
  const nearest = (x, y) => pts.reduce((best, p) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(best.x - x, best.y - y) ? p : best), pts[0]);
  const a = nearest(b.minX, b.minY);
  let bp = nearest(b.maxX, b.minY);
  if (Math.hypot(bp.x - a.x, bp.y - a.y) < 0.5) bp = nearest(b.maxX, b.maxY);
  return { a, b: bp, distance: Math.hypot(bp.x - a.x, bp.y - a.y) };
}
