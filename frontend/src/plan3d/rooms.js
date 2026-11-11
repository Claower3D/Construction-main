// Помещения по осям стен: строим плоский граф и обходим его грани.
// Каждая замкнутая грань — помещение; внешняя грань даёт контур здания.

const key = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);

export function polygonArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return s / 2;
}

export function polygonCentroid(pts) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const f = p.x * q.y - q.x * p.y;
    a += f; cx += (p.x + q.x) * f; cy += (p.y + q.y) * f;
  }
  if (Math.abs(a) < 1e-9) return { x: pts[0].x, y: pts[0].y };
  return { x: cx / (3 * a), y: cy / (3 * a) };
}

/**
 * @param {Array<{ax,ay,bx,by,t}>} walls
 * @returns {{ rooms: Array<{polygon:Array<{x,y}>, area:number, netArea:number, perimeter:number, center:{x,y}}>,
 *             outlines: Array<Array<{x,y}>>, footprint:number, outerLength:number, outerHalfArea:number, closed:boolean }}
 *          outlines — наружные контуры здания по наружным граням стен, footprint — их площадь
 */
export function buildRooms(walls, tol = 0.03) {
  const nodes = [];
  const grid = new Map();
  const cellOf = (v) => Math.floor(v / (tol * 2));
  const nodeAt = (x, y) => {
    const cx = cellOf(x);
    const cy = cellOf(y);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const arr = grid.get(`${cx + dx}:${cy + dy}`);
        if (!arr) continue;
        for (const id of arr) if (Math.hypot(nodes[id].x - x, nodes[id].y - y) <= tol) return id;
      }
    }
    const id = nodes.length;
    nodes.push({ x, y });
    const k = `${cx}:${cy}`;
    const arr = grid.get(k);
    if (arr) arr.push(id); else grid.set(k, [id]);
    return id;
  };

  const segs = walls.map((w) => ({ ax: w.ax, ay: w.ay, bx: w.bx, by: w.by, t: w.t, len: Math.hypot(w.bx - w.ax, w.by - w.ay) })).filter((s) => s.len > tol);
  const cuts = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i += 1) {
    const a = segs[i];
    const ux = (a.bx - a.ax) / a.len;
    const uy = (a.by - a.ay) / a.len;
    for (let j = 0; j < segs.length; j += 1) {
      if (i === j) continue;
      const b = segs[j];
      // концы b, лежащие на a (примыкания и наложения)
      for (const [px, py] of [[b.ax, b.ay], [b.bx, b.by]]) {
        const t = ux * (px - a.ax) + uy * (py - a.ay);
        const d = Math.abs(-uy * (px - a.ax) + ux * (py - a.ay));
        if (d <= tol && t > tol && t < a.len - tol) cuts[i].push(t / a.len);
      }
      if (j < i) continue;
      // настоящее пересечение
      const vx = b.bx - b.ax;
      const vy = b.by - b.ay;
      const den = (a.bx - a.ax) * vy - (a.by - a.ay) * vx;
      if (Math.abs(den) < 1e-9) continue;
      const rx = b.ax - a.ax;
      const ry = b.ay - a.ay;
      const k = (rx * vy - ry * vx) / den;
      const m = (rx * (a.by - a.ay) - ry * (a.bx - a.ax)) / den;
      const ea = tol / a.len;
      const eb = tol / b.len;
      if (k > ea && k < 1 - ea && m > eb && m < 1 - eb) { cuts[i].push(k); cuts[j].push(m); }
    }
  }

  const edges = new Map(); // key → { a, b, t }
  segs.forEach((s, i) => {
    const ks = [...new Set(cuts[i].map((v) => Math.round(v * 1e6) / 1e6))].sort((p, q) => p - q);
    let prev = nodeAt(s.ax + (s.bx - s.ax) * ks[0], s.ay + (s.by - s.ay) * ks[0]);
    for (let n = 1; n < ks.length; n += 1) {
      const cur = nodeAt(s.ax + (s.bx - s.ax) * ks[n], s.ay + (s.by - s.ay) * ks[n]);
      if (cur !== prev) {
        const k = key(prev, cur);
        const old = edges.get(k);
        if (!old || old.t < s.t) edges.set(k, { a: prev, b: cur, t: s.t });
      }
      prev = cur;
    }
  });

  // тупиковые стены в обходе граней не участвуют
  const adj = nodes.map(() => new Set());
  for (const e of edges.values()) { adj[e.a].add(e.b); adj[e.b].add(e.a); }
  let pruned = true;
  while (pruned) {
    pruned = false;
    adj.forEach((set, n) => {
      if (set.size === 1) {
        const [m] = set;
        set.clear();
        adj[m].delete(n);
        pruned = true;
      }
    });
  }

  const order = adj.map((set, n) => [...set].sort((p, q) => Math.atan2(nodes[p].y - nodes[n].y, nodes[p].x - nodes[n].x) - Math.atan2(nodes[q].y - nodes[n].y, nodes[q].x - nodes[n].x)));
  const visited = new Set();
  const faces = [];
  adj.forEach((set, u) => {
    for (const v of set) {
      if (visited.has(`${u}>${v}`)) continue;
      const loop = [];
      let a = u;
      let b = v;
      let guard = 0;
      while (!visited.has(`${a}>${b}`) && guard < 100000) {
        visited.add(`${a}>${b}`);
        loop.push(a);
        const ring = order[b];
        const idx = ring.indexOf(a);
        const next = ring[(idx - 1 + ring.length) % ring.length]; // ближайшее по часовой от обратного ребра
        a = b;
        b = next;
        guard += 1;
      }
      if (loop.length >= 3) faces.push(loop);
    }
  });

  const rooms = [];
  const outlines = [];
  let outerLength = 0;
  let outerHalfArea = 0;
  for (const loop of faces) {
    const polygon = loop.map((n) => ({ x: nodes[n].x, y: nodes[n].y }));
    const area = polygonArea(polygon);
    let perimeter = 0;
    let half = 0;
    let tSum = 0;
    for (let i = 0; i < loop.length; i += 1) {
      const e = edges.get(key(loop[i], loop[(i + 1) % loop.length]));
      const len = Math.hypot(nodes[e.a].x - nodes[e.b].x, nodes[e.a].y - nodes[e.b].y);
      perimeter += len;
      half += len * e.t / 2;
      tSum += e.t * len;
    }
    if (area > 0.05) {
      const tAvg = perimeter > 0 ? tSum / perimeter : 0;
      // «в свету»: вычитаем полтолщины стен по периметру и возвращаем дважды вычтенные углы (верно для прямых углов)
      const netArea = Math.max(0, area - half + tAvg * tAvg);
      rooms.push({ polygon, area, netArea, perimeter, center: polygonCentroid(polygon) });
    } else if (area < -0.05) {
      outerLength += perimeter;
      outerHalfArea += half;
      const outline = offsetOutline(loop.map((n) => nodes[n]), loop.map((n, i) => edges.get(key(n, loop[(i + 1) % loop.length])).t));
      if (outline.length >= 3) outlines.push(outline);
    }
  }
  rooms.sort((p, q) => q.area - p.area);
  const footprint = outlines.reduce((sum, o) => sum + Math.abs(polygonArea(o)), 0);
  return { rooms, outlines, footprint, outerLength, outerHalfArea, closed: rooms.length > 0 };
}

/**
 * Наружный контур здания: обход внешней грани по осям стен, сдвинутый наружу на полтолщины каждой стены.
 * @param {Array<{x:number,y:number}>} loop внешняя грань (по часовой стрелке, как её даёт обход)
 * @param {number[]} thickness толщина стены на ребре loop[i] → loop[i+1]
 */
function offsetOutline(loop, thickness) {
  // разворачиваем: дальше контур идёт против часовой, наружу — вправо от направления обхода
  const pts = loop.slice().reverse();
  const n = pts.length;
  const t = thickness.slice().reverse();
  // после разворота ребро i (pts[i] → pts[i+1]) — это бывшее ребро с индексом n − 2 − i
  const edgeT = (i) => t[(i + 1) % n];
  const lines = [];
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dx = (b.x - a.x) / len;
    const dy = (b.y - a.y) / len;
    const h = edgeT(i) / 2;
    lines.push({ px: a.x + dy * h, py: a.y - dx * h, dx, dy, h, ex: b.x + dy * h, ey: b.y - dx * h });
  }
  const out = [];
  const push = (x, y) => {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - x, last.y - y) > 1e-6) out.push({ x, y });
  };
  for (let i = 0; i < n; i += 1) {
    const prev = lines[(i - 1 + n) % n];
    const cur = lines[i];
    const den = prev.dx * cur.dy - prev.dy * cur.dx;
    const corner = pts[i];
    if (Math.abs(den) > 1e-6) {
      const k = ((cur.px - prev.px) * cur.dy - (cur.py - prev.py) * cur.dx) / den;
      const x = prev.px + prev.dx * k;
      const y = prev.py + prev.dy * k;
      // слишком острый угол даёт длинный «шип» — срезаем его
      if (Math.hypot(x - corner.x, y - corner.y) <= 4 * Math.max(prev.h, cur.h) + 0.01) { push(x, y); continue; }
    }
    // прямое продолжение той же толщины — лишняя точка на прямой, пропускаем
    if (Math.abs(den) <= 1e-6 && prev.dx * cur.dx + prev.dy * cur.dy > 0 && Math.abs(prev.h - cur.h) < 1e-9) continue;
    push(prev.ex, prev.ey);
    push(cur.px, cur.py);
  }
  if (out.length > 1 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].y - out[out.length - 1].y) <= 1e-6) out.pop();
  return out;
}
