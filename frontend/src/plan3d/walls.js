// Поиск стен на плане. Стена в чертеже — две параллельные линии (грани) на расстоянии толщины.
// Берём пары параллельных отрезков, от ближних к дальним, и строим ось стены по их общему участку.
// Все размеры в метрах.

import { buildRooms } from './rooms.js';

const DEG = Math.PI / 180;

export const DETECT_DEFAULTS = {
  minThickness: 0.06, // тоньше — это уже не стена, а линии окна или отделки
  maxThickness: 0.6,
  minLength: 0.1, // короче — уже не стена; простенки у дверей бывают по 10–15 см
  parallelTol: 1.5 * DEG,
  axisThickness: 0.2, // для режима «линии — это оси стен»
  doorGapMin: 0.5,
  doorGapMax: 3.0,
  cornerDoorMax: 1.3, // дверь вплотную к поперечной стене, без простенка
};

let seq = 0;
export const uid = (p) => `${p}${Date.now().toString(36)}${(seq += 1).toString(36)}`;

const round3 = (v) => Math.round(v * 1000) / 1000;

function frame(s) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len = Math.hypot(dx, dy);
  return { ...s, len, ux: dx / len, uy: dy / len };
}

/** Убираем мусор и склеиваем куски одной линии: грань стены часто начерчена несколькими отрезками подряд. */
export function cleanSegments(segments, minLen = 0.03) {
  const items = [];
  for (const s of segments) {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    if (!(len >= minLen)) continue;
    // каноническое направление: вправо, а вертикальные — вверх
    let a = s;
    if (s.x2 < s.x1 - 1e-9 || (Math.abs(s.x2 - s.x1) <= 1e-9 && s.y2 < s.y1)) a = { ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 };
    const ux = (a.x2 - a.x1) / len;
    const uy = (a.y2 - a.y1) / len;
    items.push({ ux, uy, ang: Math.atan2(uy, ux), c: -uy * a.x1 + ux * a.y1, t1: ux * a.x1 + uy * a.y1, t2: ux * a.x2 + uy * a.y2 });
  }
  // почти вертикальные «вниз» (-90°) и «вверх» (+90°) — одно направление
  for (const it of items) {
    if (it.ang < -89.5 * DEG) { it.ang += Math.PI; it.ux = -it.ux; it.uy = -it.uy; it.c = -it.c; [it.t1, it.t2] = [-it.t2, -it.t1]; }
  }
  items.sort((p, q) => p.ang - q.ang || p.c - q.c || p.t1 - q.t1);

  const out = [];
  const used = new Array(items.length).fill(false);
  for (let i = 0; i < items.length; i += 1) {
    if (used[i]) continue;
    const base = items[i];
    const group = [base];
    used[i] = true;
    for (let j = i + 1; j < items.length; j += 1) {
      if (items[j].ang - base.ang > 0.3 * DEG) break;
      if (used[j]) continue;
      // расстояние между линиями меряем в системе базового отрезка
      const it = items[j];
      const off = (t) => -base.uy * (it.ux * t - it.uy * it.c) + base.ux * (it.uy * t + it.ux * it.c) - base.c;
      if (Math.abs(off(it.t1)) < 0.006 && Math.abs(off(it.t2)) < 0.006) { group.push(it); used[j] = true; }
    }
    // точки группы → интервалы вдоль базового направления
    const ivs = group.map((g) => {
      const p1 = { x: g.ux * g.t1 - g.uy * g.c, y: g.uy * g.t1 + g.ux * g.c };
      const p2 = { x: g.ux * g.t2 - g.uy * g.c, y: g.uy * g.t2 + g.ux * g.c };
      const a = base.ux * p1.x + base.uy * p1.y;
      const b = base.ux * p2.x + base.uy * p2.y;
      return [Math.min(a, b), Math.max(a, b)];
    }).sort((p, q) => p[0] - q[0]);
    let cur = ivs[0].slice();
    const flush = () => {
      out.push(frame({
        x1: base.ux * cur[0] - base.uy * base.c, y1: base.uy * cur[0] + base.ux * base.c,
        x2: base.ux * cur[1] - base.uy * base.c, y2: base.uy * cur[1] + base.ux * base.c,
      }));
    };
    for (let k = 1; k < ivs.length; k += 1) {
      if (ivs[k][0] <= cur[1] + 0.01) cur[1] = Math.max(cur[1], ivs[k][1]);
      else { flush(); cur = ivs[k].slice(); }
    }
    flush();
  }
  return out;
}

function subtract(iv, covered) {
  let parts = [iv];
  for (const c of covered) {
    const next = [];
    for (const p of parts) {
      if (c[1] <= p[0] || c[0] >= p[1]) { next.push(p); continue; }
      if (c[0] > p[0]) next.push([p[0], c[0]]);
      if (c[1] < p[1]) next.push([c[1], p[1]]);
    }
    parts = next;
  }
  return parts;
}

function candidatePairs(segs, reach) {
  const cell = 2;
  const grid = new Map();
  segs.forEach((s, i) => {
    const x0 = Math.floor((Math.min(s.x1, s.x2) - reach) / cell);
    const x1 = Math.floor((Math.max(s.x1, s.x2) + reach) / cell);
    const y0 = Math.floor((Math.min(s.y1, s.y2) - reach) / cell);
    const y1 = Math.floor((Math.max(s.y1, s.y2) + reach) / cell);
    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        const k = `${x}:${y}`;
        const arr = grid.get(k);
        if (arr) arr.push(i); else grid.set(k, [i]);
      }
    }
  });
  const seen = new Set();
  const pairs = [];
  for (const arr of grid.values()) {
    for (let a = 0; a < arr.length; a += 1) {
      for (let b = a + 1; b < arr.length; b += 1) {
        const key = arr[a] * 1e6 + arr[b];
        if (!seen.has(key)) { seen.add(key); pairs.push([arr[a], arr[b]]); }
      }
    }
  }
  return pairs;
}

/**
 * Стены по двойным линиям.
 * @returns {{walls: Array, openings: Array, stats: {segments:number, paired:number}}}
 */
/**
 * Торцы стен и откосы проёмов — короткие линии поперёк стены, которые обоими концами упираются в её грани.
 * В пары их брать нельзя: откос двери рядом с поперечной стеной «склеился» бы с её гранью и разорвал настоящую стену.
 */
export function dropCaps(segs, maxLen) {
  const cell = 1;
  const grid = new Map();
  segs.forEach((s, i) => {
    const x0 = Math.floor(Math.min(s.x1, s.x2) / cell);
    const x1 = Math.floor(Math.max(s.x1, s.x2) / cell);
    const y0 = Math.floor(Math.min(s.y1, s.y2) / cell);
    const y1 = Math.floor(Math.max(s.y1, s.y2) / cell);
    for (let x = x0; x <= x1; x += 1) for (let y = y0; y <= y1; y += 1) {
      const k = `${x}:${y}`;
      const arr = grid.get(k);
      if (arr) arr.push(i); else grid.set(k, [i]);
    }
  });
  const touches = (px, py, self) => {
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    for (let x = cx - 1; x <= cx + 1; x += 1) for (let y = cy - 1; y <= cy + 1; y += 1) {
      const arr = grid.get(`${x}:${y}`);
      if (!arr) continue;
      for (const j of arr) {
        if (j === self) continue;
        const b = segs[j];
        if (Math.abs(segs[self].ux * b.uy - segs[self].uy * b.ux) < 0.3) continue; // нужна поперечная линия
        const t = b.ux * (px - b.x1) + b.uy * (py - b.y1);
        const d = Math.abs(-b.uy * (px - b.x1) + b.ux * (py - b.y1));
        if (d <= 0.012 && t >= -0.012 && t <= b.len + 0.012) return true;
      }
    }
    return false;
  };
  // Короткий простенок у двери выглядит так же, как откос. Отличие одно: грань простенка продолжается
  // на той же прямой по другую сторону проёма. Такие линии оставляем.
  const continues = (self) => {
    const a = segs[self];
    for (let j = 0; j < segs.length; j += 1) {
      if (j === self) continue;
      const b = segs[j];
      if (Math.abs(a.ux * b.uy - a.uy * b.ux) > 0.02) continue;
      if (Math.abs(-a.uy * (b.x1 - a.x1) + a.ux * (b.y1 - a.y1)) > 0.012 || Math.abs(-a.uy * (b.x2 - a.x1) + a.ux * (b.y2 - a.y1)) > 0.012) continue;
      const t1 = a.ux * (b.x1 - a.x1) + a.uy * (b.y1 - a.y1);
      const t2 = a.ux * (b.x2 - a.x1) + a.uy * (b.y2 - a.y1);
      const gap = Math.max(Math.min(t1, t2) - a.len, -Math.max(t1, t2));
      if (gap <= 3.2) return true;
    }
    return false;
  };
  return segs.filter((s, i) => !(s.len <= maxLen && touches(s.x1, s.y1, i) && touches(s.x2, s.y2, i) && !continues(i)));
}

export function detectWalls(rawSegments, options = {}) {
  const o = { ...DETECT_DEFAULTS, ...options };
  const segs = dropCaps(cleanSegments(rawSegments), o.maxThickness + 0.02);
  const sinTol = Math.sin(o.parallelTol);

  const found = [];
  for (const [i, j] of candidatePairs(segs, o.maxThickness)) {
    const a = segs[i];
    const b = segs[j];
    const cross = a.ux * b.uy - a.uy * b.ux;
    if (Math.abs(cross) > sinTol) continue;
    // b в системе a: вдоль (t) и поперёк (d)
    const d1 = -a.uy * (b.x1 - a.x1) + a.ux * (b.y1 - a.y1);
    const d2 = -a.uy * (b.x2 - a.x1) + a.ux * (b.y2 - a.y1);
    if (Math.sign(d1) !== Math.sign(d2) || Math.abs(d1 - d2) > 0.03) continue;
    const d = (d1 + d2) / 2;
    const dist = Math.abs(d);
    if (dist < o.minThickness || dist > o.maxThickness) continue;
    const tb1 = a.ux * (b.x1 - a.x1) + a.uy * (b.y1 - a.y1);
    const tb2 = a.ux * (b.x2 - a.x1) + a.uy * (b.y2 - a.y1);
    const s = Math.max(0, Math.min(tb1, tb2));
    const e = Math.min(a.len, Math.max(tb1, tb2));
    if (e - s < o.minLength) continue;
    found.push({ i, j, d, dist, s, e, tb1, dir: tb2 >= tb1 ? 1 : -1 });
  }
  // от тонких к толстым: настоящие грани стены ближе друг к другу, чем стена к стене через комнату
  found.sort((p, q) => p.dist - q.dist || (q.e - q.s) - (p.e - p.s));

  const covered = segs.map(() => []);
  const walls = [];
  let paired = 0;
  for (const p of found) {
    const a = segs[p.i];
    // занятые участки b переводим в координату вдоль a
    const coveredB = covered[p.j].map(([x, y]) => {
      const m = p.tb1 + p.dir * x;
      const n = p.tb1 + p.dir * y;
      return [Math.min(m, n), Math.max(m, n)];
    });
    const free = subtract([p.s, p.e], [...covered[p.i], ...coveredB]);
    for (const [s, e] of free) {
      if (e - s < o.minLength) continue;
      const ox = -a.uy * (p.d / 2);
      const oy = a.ux * (p.d / 2);
      walls.push({
        id: uid('w'),
        ax: round3(a.x1 + a.ux * s + ox), ay: round3(a.y1 + a.uy * s + oy),
        bx: round3(a.x1 + a.ux * e + ox), by: round3(a.y1 + a.uy * e + oy),
        t: Math.round(p.dist * 200) / 200, // до 5 мм
      });
      covered[p.i].push([s, e]);
      const m = (s - p.tb1) * p.dir;
      const n = (e - p.tb1) * p.dir;
      covered[p.j].push([Math.min(m, n), Math.max(m, n)]);
      paired += 1;
    }
  }

  const joined = joinWallEnds(walls);
  const { walls: merged, openings } = openingsFromGaps(joined, o);
  // второй проход: конец мог дотянуться до линии стекла в окне, которой после сборки проёмов уже нет
  const final = rejoinKeepingOpenings(merged, openings);
  return { walls: final.walls.map(plainWall), openings: final.openings, stats: { segments: segs.length, paired } };
}

const plainWall = (w) => ({ id: w.id, ax: w.ax, ay: w.ay, bx: w.bx, by: w.by, t: w.t });

/** Повторная стыковка концов. Положение проёмов отсчитывается от точки A, поэтому при её сдвиге проёмы пересчитываем. */
function rejoinKeepingOpenings(walls, openings) {
  const before = new Map(walls.map((w) => [w.id, w]));
  const after = joinWallEnds(walls);
  const ids = new Set(after.map((w) => w.id));
  const shift = new Map(after.map((w) => { const b = before.get(w.id); return [w.id, Math.hypot(b.ax - w.ax, b.ay - w.ay)]; }));
  return {
    walls: after,
    openings: openings.filter((o) => ids.has(o.wallId)).map((o) => (shift.get(o.wallId) > 1e-6 ? { ...o, at: round3(o.at + shift.get(o.wallId)) } : o)),
  };
}

/** Режим «линии — это оси стен»: одна линия = одна стена заданной толщины. */
export function wallsFromAxes(rawSegments, thickness = DETECT_DEFAULTS.axisThickness, minLength = DETECT_DEFAULTS.minLength) {
  const walls = cleanSegments(rawSegments)
    .filter((s) => s.len >= minLength)
    .map((s) => ({ id: uid('w'), ax: round3(s.x1), ay: round3(s.y1), bx: round3(s.x2), by: round3(s.y2), t: thickness }));
  return { walls: joinWallEnds(walls).map(plainWall), openings: [], stats: { segments: walls.length, paired: walls.length } };
}

const wallLen = (w) => Math.sqrt((w.bx - w.ax) ** 2 + (w.by - w.ay) ** 2);

/**
 * Оси стен, найденные по граням, не доходят до угла на полтолщины. Дотягиваем концы до пересечения осей,
 * чтобы углы и примыкания сошлись. Возвращает новые стены; у каждой — отметка joinA/joinB (к чему примкнула).
 */
export function joinWallEnds(walls, extraTol = 0.03) {
  const out = walls.map((w) => ({ ...w, joinA: null, joinB: null }));
  // длины, направления и габариты исходных стен считаем один раз: цикл по парам на больших чертежах идёт миллионы раз
  const info = walls.map((v) => {
    const len = wallLen(v);
    return {
      v, len, ux: len > 1e-6 ? (v.bx - v.ax) / len : 0, uy: len > 1e-6 ? (v.by - v.ay) / len : 0,
      minX: Math.min(v.ax, v.bx), maxX: Math.max(v.ax, v.bx), minY: Math.min(v.ay, v.by), maxY: Math.max(v.ay, v.by),
    };
  });
  out.forEach((w, wi) => {
    const me = info[wi];
    if (me.len < 1e-6) return;
    const { ux, uy } = me;
    for (const end of ['a', 'b']) {
      const ex = end === 'a' ? w.ax : w.bx;
      const ey = end === 'a' ? w.ay : w.by;
      let best = null;
      for (let j = 0; j < info.length; j += 1) {
        if (j === wi) continue;
        const it = info[j];
        const { v } = it;
        const reach = v.t / 2 + w.t / 2 + extraTol;
        if (it.len < 1e-6 || ex < it.minX - reach || ex > it.maxX + reach || ey < it.minY - reach || ey > it.maxY + reach) continue;
        const den = ux * it.uy - uy * it.ux;
        if (Math.abs(den) < 0.2) continue; // почти параллельны — это не угол
        // точка пересечения осей: (ex,ey) + u*k = (v.a) + v*m
        const rx = v.ax - ex;
        const ry = v.ay - ey;
        const k = (rx * it.uy - ry * it.ux) / den;
        const m = (rx * uy - ry * ux) / den;
        // конец можно только дотянуть наружу (ось, найденная по граням, до узла не доходит); укорачивать стену нельзя —
        // иначе свободный конец у проёма «прилипнет» к ближайшей поперечной стене
        const outward = end === 'a' ? -k : k;
        if (outward < -extraTol || outward > reach) continue;
        if (m < -reach || m > it.len + reach) continue;
        if (!best || Math.abs(k) < Math.abs(best.k)) best = { k, id: v.id, atEnd: m < reach || m > it.len - reach };
      }
      if (best) {
        const nx = round3(ex + ux * best.k);
        const ny = round3(ey + uy * best.k);
        if (end === 'a') { w.ax = nx; w.ay = ny; w.joinA = best; } else { w.bx = nx; w.by = ny; w.joinB = best; }
      }
    }
  });
  return out.filter((w) => wallLen(w) >= 0.05).map((w) => ({
    id: w.id, ax: w.ax, ay: w.ay, bx: w.bx, by: w.by, t: w.t,
    joinA: w.joinA ? { id: w.joinA.id, atEnd: w.joinA.atEnd } : null,
    joinB: w.joinB ? { id: w.joinB.id, atEnd: w.joinB.atEnd } : null,
  }));
}

/**
 * Разрыв между двумя кусками одной стены — это проём. Пустой разрыв считаем дверью,
 * разрыв с тонкими линиями внутри (стекло, подоконник) — окном. Куски встык просто склеиваем.
 * Затем ищем двери вплотную к поперечной стене: свободный конец стены, не доходящий до соседней на ширину двери.
 */
export function openingsFromGaps(walls, options = {}) {
  const o = { ...DETECT_DEFAULTS, ...options };
  // все стены ведём в одном направлении (вправо, вертикальные — вверх), чтобы куски одной стены шли подряд
  const list = walls.map((w) => {
    const len = wallLen(w);
    let ux = (w.bx - w.ax) / len;
    let uy = (w.by - w.ay) / len;
    let c = { ...w };
    if (ux < -1e-9 || (Math.abs(ux) <= 1e-9 && uy < 0) || Math.atan2(uy, ux) < -89.5 * DEG) {
      c = { ...w, ax: w.bx, ay: w.by, bx: w.ax, by: w.ay, joinA: w.joinB, joinB: w.joinA };
      ux = -ux; uy = -uy;
    }
    return { ...c, ux, uy, ang: Math.atan2(uy, ux), off: -uy * c.ax + ux * c.ay, t0: ux * c.ax + uy * c.ay, t1: ux * c.bx + uy * c.by };
  });
  const openings = [];
  const removed = new Set();

  // группы: одна прямая, одна толщина
  const order = list.map((_, i) => i).sort((p, q) => list[p].ang - list[q].ang || list[p].off - list[q].off);
  const groups = [];
  for (const i of order) {
    const w = list[i];
    const g = groups.length ? groups[groups.length - 1] : null;
    const head = g ? list[g[0]] : null;
    if (head && Math.abs(w.ang - head.ang) < 0.6 * DEG && Math.abs(w.off - head.off) < 0.025 && Math.abs(w.t - head.t) <= 0.021) g.push(i);
    else groups.push([i]);
  }
  // от толстых к тонким: сначала собираем настоящие стены и забираем линии стекла в их окна,
  // иначе два соседних окна склеились бы в «тонкую стену с дверью»
  groups.sort((p, q) => list[q[0]].t - list[p[0]].t);

  const thinInside = (a, from, to) => {
    const found = [];
    for (const c of list) {
      if (c === a || removed.has(c.id) || c.t >= a.t * 0.8) continue;
      if (Math.abs(a.ux * c.uy - a.uy * c.ux) > 0.02) continue;
      const c1 = a.ux * c.ax + a.uy * c.ay;
      const c2 = a.ux * c.bx + a.uy * c.by;
      const o1 = Math.abs(-a.uy * c.ax + a.ux * c.ay - a.off);
      const o2 = Math.abs(-a.uy * c.bx + a.ux * c.by - a.off);
      if (Math.min(c1, c2) >= from - 0.05 && Math.max(c1, c2) <= to + 0.05 && o1 <= a.t / 2 + 0.02 && o2 <= a.t / 2 + 0.02) found.push(c);
    }
    return found;
  };
  const addOpening = (wall, from, to) => {
    const thin = thinInside(wall, from, to);
    thin.forEach((c) => removed.add(c.id));
    const isWindow = thin.length > 0;
    openings.push({
      id: uid('o'), wallId: wall.id, s0: from, s1: to,
      type: isWindow ? 'window' : 'door', h: isWindow ? 1.5 : 2.1, sill: isWindow ? 0.9 : 0,
    });
  };

  for (const g of groups) {
    const members = g.map((i) => list[i]).filter((w) => !removed.has(w.id)).sort((p, q) => p.t0 - q.t0);
    let cur = null;
    for (const next of members) {
      if (!cur) { cur = next; continue; }
      const gap = next.t0 - cur.t1;
      const join = () => {
        for (const op of openings) if (op.wallId === next.id) op.wallId = cur.id;
        if (next.t1 > cur.t1) { cur.bx = next.bx; cur.by = next.by; cur.t1 = next.t1; cur.joinB = next.joinB; }
        removed.add(next.id);
      };
      if (gap <= 0.03) join(); // куски встык или внахлёст — одна стена
      else if (gap >= o.doorGapMin && gap <= o.doorGapMax && !cur.joinB && !next.joinA) {
        // оба края разрыва свободны; если бы там примыкала поперечная стена, это был бы коридор, а не проём
        addOpening(cur, cur.t1, next.t0);
        join();
      } else cur = next;
    }
  }

  // дверь вплотную к поперечной стене: простенка нет, конец стены висит в 0,5–1,3 м от соседней
  const alive = () => list.filter((w) => !removed.has(w.id));
  const pool = alive();
  for (const w of pool) {
    if (removed.has(w.id)) continue;
    for (const end of ['a', 'b']) {
      if (end === 'a' ? w.joinA : w.joinB) continue;
      const ex = end === 'a' ? w.ax : w.bx;
      const ey = end === 'a' ? w.ay : w.by;
      const dx = end === 'a' ? -w.ux : w.ux;
      const dy = end === 'a' ? -w.uy : w.uy;
      let hit = null;
      const far = o.cornerDoorMax + 1.1; // дальше искать незачем
      for (const v of pool) {
        if (v === w || removed.has(v.id)) continue;
        if (Math.min(v.ax, v.bx) > ex + far || Math.max(v.ax, v.bx) < ex - far || Math.min(v.ay, v.by) > ey + far || Math.max(v.ay, v.by) < ey - far) continue;
        const den = dx * v.uy - dy * v.ux;
        if (Math.abs(den) < 0.5) continue;
        const rx = v.ax - ex;
        const ry = v.ay - ey;
        const k = (rx * v.uy - ry * v.ux) / den; // расстояние вдоль луча до оси соседней стены
        const m = (rx * dy - ry * dx) / den;
        if (k <= 0 || m < -v.t / 2 || m > v.t1 - v.t0 + v.t / 2) continue;
        if (!hit || k < hit.k) hit = { k, v };
      }
      if (!hit) continue;
      const clear = hit.k - hit.v.t / 2; // до ближней грани соседней стены
      if (clear < o.doorGapMin || clear > o.cornerDoorMax) continue;
      const tEnd = end === 'a' ? w.t0 : w.t1;
      if (end === 'a') {
        addOpening(w, tEnd - clear, tEnd);
        w.ax = round3(ex + dx * hit.k); w.ay = round3(ey + dy * hit.k); w.t0 = tEnd - hit.k; w.joinA = { id: hit.v.id, atEnd: false };
      } else {
        addOpening(w, tEnd, tEnd + clear);
        w.bx = round3(ex + dx * hit.k); w.by = round3(ey + dy * hit.k); w.t1 = tEnd + hit.k; w.joinB = { id: hit.v.id, atEnd: false };
      }
    }
  }

  const byId = new Map(list.map((w) => [w.id, w]));
  const out = alive();
  return {
    walls: out.map((w) => ({ id: w.id, ax: w.ax, ay: w.ay, bx: w.bx, by: w.by, t: w.t, joinA: w.joinA, joinB: w.joinB })),
    openings: openings.filter((op) => !removed.has(op.wallId)).map((op) => {
      const w = byId.get(op.wallId);
      return { id: op.id, wallId: op.wallId, type: op.type, at: round3((op.s0 + op.s1) / 2 - w.t0), w: round3(op.s1 - op.s0), h: op.h, sill: op.sill };
    }),
  };
}

/**
 * Какой слой (или класс толщины линий в PDF) похож на стены: пробуем каждый отдельно и смотрим,
 * сколько замкнутых помещений из него получается. Штриховки и рамки помещений не дают.
 * @returns {Array<{name:string, rooms:number, area:number, wallLength:number}>} по убыванию площади помещений
 */
export function rankLayersByRooms(segments, layerNames, options = {}) {
  const res = [];
  for (const name of layerNames) {
    const own = segments.filter((s) => s.layer === name);
    if (own.length < 4 || own.length > 40000) { res.push({ name, rooms: 0, area: 0, wallLength: 0 }); continue; }
    const { walls } = detectWalls(own, options);
    const { rooms } = walls.length <= 3000 ? buildRooms(walls) : { rooms: [] };
    res.push({
      name,
      rooms: rooms.length,
      area: rooms.reduce((sum, r) => sum + r.area, 0),
      wallLength: walls.reduce((sum, w) => sum + wallLen(w), 0),
    });
  }
  return res.sort((a, b) => b.area - a.area || b.wallLength - a.wallLength);
}
