// Измерение трещины внутри зоны, найденной моделью.
// Модель (YOLO) отвечает на вопрос «где трещина». Здесь по пикселям внутри её рамки
// выделяется сама линия трещины, утончается до скелета и считаются длина и раскрытие.
// Без масштаба (ширины участка в кадре) миллиметры не выдумываем — только доли кадра.

const CROP_MAX = 640; // сторона участка для измерения: достаточно для трещин в 2–3 пикселя

function grayOf(px, n) {
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  return g;
}

// Zhang–Suen: утончение маски до линии толщиной 1 пиксель
function thin(mask, w, h) {
  const m = mask.slice();
  const del = [];
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 60) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      del.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!m[i]) continue;
          const p2 = m[i - w], p3 = m[i - w + 1], p4 = m[i + 1], p5 = m[i + w + 1];
          const p6 = m[i + w], p7 = m[i + w - 1], p8 = m[i - 1], p9 = m[i - w - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let A = 0;
          for (let k = 0; k < 8; k++) if (!seq[k] && seq[k + 1]) A++;
          if (A !== 1) continue;
          if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
          del.push(i);
        }
      }
      if (del.length) { changed = true; for (const i of del) m[i] = 0; }
    }
  }
  return m;
}

// Связные области (8-соседство); возвращает метки и список областей
function components(mask, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || label[s] !== -1) continue;
    const id = comps.length;
    let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
    label[s] = id; stack.push(s);
    while (stack.length) {
      const i = stack.pop();
      n++;
      const x = i % w, y = (i - x) / w;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          if (mask[j] && label[j] === -1) { label[j] = id; stack.push(j); }
        }
      }
    }
    comps.push({ id, n, span: Math.hypot(x1 - x0 + 1, y1 - y0 + 1) });
  }
  return { label, comps };
}

/**
 * Измерить трещину в рамке модели.
 * Участок берётся с запасом вокруг рамки (CONTEXT): линия, которая в основном лежит ЗА
 * рамкой (край кольца, шов, граница поверхностей), — это контур предмета, а не трещина.
 * Трещина заканчивается внутри зоны, найденной моделью.
 * @param img     загруженное изображение
 * @param box     рамка в долях кадра {x, y, w, h}
 * @returns { found, lengthPx, widthPx, contrast, gapPx, profile, tight, points }
 *          lengthPx / widthPx — в пикселях исходного фото; contrast — глубина «ложбины»
 *          в уровнях яркости; profile — раскрытие вдоль трещины [{pos, widthPx}]
 */
const CONTEXT = 0.35;
const NOT_FOUND = { found: false, lengthPx: 0, widthPx: 0, contrast: 0, points: [] };

export function measureCrackInBox(img, box) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  // внутренняя рамка (пиксели фото) и участок с запасом
  const ix0 = Math.max(0, Math.floor(box.x * W));
  const iy0 = Math.max(0, Math.floor(box.y * H));
  const ix1 = Math.min(W, Math.ceil((box.x + box.w) * W));
  const iy1 = Math.min(H, Math.ceil((box.y + box.h) * H));
  const mx = (ix1 - ix0) * CONTEXT, my = (iy1 - iy0) * CONTEXT;
  const sx = Math.max(0, Math.floor(ix0 - mx));
  const sy = Math.max(0, Math.floor(iy0 - my));
  const sw = Math.max(4, Math.min(W, Math.ceil(ix1 + mx)) - sx);
  const sh = Math.max(4, Math.min(H, Math.ceil(iy1 + my)) - sy);
  const k = Math.min(1, CROP_MAX / Math.max(sw, sh));
  const w = Math.max(4, Math.round(sw * k));
  const h = Math.max(4, Math.round(sh * k));
  // внутренняя рамка в координатах участка
  const bx0 = (ix0 - sx) * k, by0 = (iy0 - sy) * k, bx1 = (ix1 - sx) * k, by1 = (iy1 - sy) * k;
  const inBox = (x, y) => x >= bx0 && x < bx1 && y >= by0 && y < by1;

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  let px;
  try { px = ctx.getImageData(0, 0, w, h).data; } catch { return NOT_FOUND; }
  const g = grayOf(px, w * h);

  // Трещина — «ложбина»: пиксель темнее соседей ПО ОБЕ стороны (в одном из 4 направлений).
  // Граница двух поверхностей темна лишь с одной стороны и сюда не попадает.
  const radii = [2, 4, 7].filter((R) => R * 3 < Math.min(w, h));
  const Rmax = radii[radii.length - 1] || 2;
  const diff = new Float32Array(w * h);
  for (const R of radii) {
    for (let y = R; y < h - R; y++) {
      for (let x = R; x < w - R; x++) {
        const i = y * w + x;
        const c0 = g[i];
        const v = Math.max(
          Math.min(g[i - R], g[i + R]) - c0,
          Math.min(g[i - R * w], g[i + R * w]) - c0,
          Math.min(g[i - R * w - R], g[i + R * w + R]) - c0,
          Math.min(g[i - R * w + R], g[i + R * w - R]) - c0,
        );
        if (v > diff[i]) diff[i] = v;
      }
    }
  }
  const vals = [];
  for (let y = Math.floor(by0); y < by1; y++) for (let x = Math.floor(bx0); x < bx1; x++) { const d = diff[y * w + x]; if (d > 0) vals.push(d); }
  vals.sort((a, b) => a - b);
  const p90 = vals.length ? vals[Math.floor(vals.length * 0.9)] : 0;
  const thr = Math.max(12, p90);
  const mask = new Uint8Array(w * h);
  for (let y = Rmax; y < h - Rmax; y++) for (let x = Rmax; x < w - Rmax; x++) { const i = y * w + x; if (diff[i] > thr) mask[i] = 1; }

  const { label, comps } = components(mask, w, h);
  const strength = new Float64Array(comps.length);
  const nIn = new Int32Array(comps.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const l = label[i];
      if (l < 0) continue;
      strength[l] += diff[i];
      if (inBox(x, y)) nIn[l]++;
    }
  }
  const boxSide = Math.max(bx1 - bx0, by1 - by0);
  const minSpan = boxSide * 0.25;
  const cands = [];
  for (const cp of comps) {
    const elongated = cp.span * cp.span / Math.max(1, cp.n) > 3; // площадь мала относительно размаха
    const inside = nIn[cp.id] / cp.n;
    // трещина в основном внутри зоны; контур предмета уходит далеко за неё
    if (cp.n >= 15 && elongated && inside >= 0.6 && cp.span >= minSpan && cp.span <= boxSide * 1.9) {
      cp.mean = strength[cp.id] / cp.n;
      cp.score = cp.span * cp.mean;
      cands.push(cp);
    }
  }
  if (!cands.length) return NOT_FOUND;
  // Главная линия — длинная и самая тёмная; рядом с ней — только сопоставимые ветви
  cands.sort((a, b) => b.score - a.score);
  const top = cands[0];
  const keep = new Uint8Array(comps.length);
  for (const cp of cands) if (cp === top || (cp.score >= 0.6 * top.score && cp.mean >= 0.75 * top.mean)) keep[cp.id] = 1;
  let area = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] && keep[label[i]]) area++;
    else mask[i] = 0;
  }

  const skel = thin(mask, w, h);
  let tx0 = w, ty0 = h, tx1 = -1, ty1 = -1;
  let n4Links = 0, ndLinks = 0, skelN = 0, coreDark = 0, maskDark = 0;
  let mx2 = 0, my2 = 0;
  const sk = [];
  const points = [];
  const step = Math.max(1, Math.round(Math.max(w, h) / 160));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i]) maskDark += diff[i];
      if (!skel[i]) continue;
      skelN++;
      coreDark += diff[i];
      mx2 += x; my2 += y;
      sk.push(i);
      if (x < tx0) tx0 = x; if (x > tx1) tx1 = x; if (y < ty0) ty0 = y; if (y > ty1) ty1 = y;
      // связи «вперёд»; диагональ не считаем, если её замыкают два прямых шага
      if (x < w - 1 && skel[i + 1]) n4Links++;
      if (y < h - 1 && skel[i + w]) n4Links++;
      if (x < w - 1 && y < h - 1 && skel[i + w + 1] && !skel[i + 1] && !skel[i + w]) ndLinks++;
      if (x > 0 && y < h - 1 && skel[i + w - 1] && !skel[i - 1] && !skel[i + w]) ndLinks++;
      if ((x + y) % step === 0) points.push({ xPct: ((sx + x / k) / W) * 100, yPct: ((sy + y / k) / H) * 100, strength: 2 });
    }
  }
  if (skelN < 3) return NOT_FOUND;
  // Оценка Кульпы для цифровой линии: прямой шаг 0,948, диагональный 1,343
  const lengthCrop = Math.max(0.948 * n4Links + 1.343 * ndLinks, skelN * 0.9);
  // Раскрытие: «сколько темноты» поперёк линии, делённое на темноту её середины
  const coreMean = coreDark / skelN;
  const widthCrop = Math.max(0.5, maskDark / Math.max(1e-6, coreMean) / lengthCrop);

  // Профиль раскрытия: делим трещину на 8 участков вдоль её главной оси
  mx2 /= skelN; my2 /= skelN;
  let sxx = 0, syy = 0, sxy = 0;
  for (const i of sk) { const x = i % w - mx2, y = (i - (i % w)) / w - my2; sxx += x * x; syy += y * y; sxy += x * y; }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(ang), uy = Math.sin(ang);
  let pmin = Infinity, pmax = -Infinity;
  const proj = (x, y) => (x - mx2) * ux + (y - my2) * uy;
  for (const i of sk) { const t = proj(i % w, (i - (i % w)) / w); if (t < pmin) pmin = t; if (t > pmax) pmax = t; }
  const BINS = 8;
  const binDark = new Float64Array(BINS), binCore = new Float64Array(BINS), binN = new Float64Array(BINS);
  const binOf = (x, y) => Math.min(BINS - 1, Math.max(0, Math.floor((proj(x, y) - pmin) / Math.max(1e-6, pmax - pmin) * BINS)));
  for (const i of sk) { const b = binOf(i % w, (i - (i % w)) / w); binCore[b] += diff[i]; binN[b]++; }
  for (let i = 0; i < w * h; i++) if (mask[i]) binDark[binOf(i % w, (i - (i % w)) / w)] += diff[i];
  const profile = [];
  for (let b = 0; b < BINS; b++) {
    if (binN[b] < 2) continue;
    const cm = binCore[b] / binN[b];
    profile.push({ pos: (b + 0.5) / BINS, widthPx: Math.max(0.5, binDark[b] / Math.max(1e-6, cm) / binN[b]) / k });
  }
  // Самое широкое место — по нему оценивается класс опасности
  const gapPx = profile.length ? Math.max(...profile.map((p) => p.widthPx)) : widthCrop / k;

  const tight = { x: (sx + tx0 / k) / W, y: (sy + ty0 / k) / H, w: (tx1 - tx0 + 1) / k / W, h: (ty1 - ty0 + 1) / k / H };
  return { found: true, lengthPx: lengthCrop / k, widthPx: widthCrop / k, gapPx, contrast: coreMean, profile, tight, points };
}

/**
 * Класс опасности по наибольшему раскрытию трещины.
 * СП РК EN 1992-1-1, п. 7.3: допустимое раскрытие для железобетона обычно 0,3 мм.
 * Свыше 3 мм — раскрытая (как правило сквозная) трещина: аварийная категория по ГОСТ 31937.
 * Без измеренной линии — только по относительной длине, «критический» не ставится.
 */
export function crackSeverity({ openingMm, lengthRel, conf }) {
  if (openingMm != null) {
    if (openingMm > 3) return 'critical';
    if (openingMm > 1) return 'high';
    if (openingMm > 0.3) return 'medium';
    return 'low';
  }
  if (lengthRel > 0.45 && conf >= 0.6) return 'high';
  if (lengthRel > 0.15) return 'medium';
  return 'low';
}

export const CRACK_TITLES = {
  critical: 'Раскрытая (вероятно сквозная) трещина — раскрытие более 3 мм',
  high: 'Трещина с раскрытием 1–3 мм',
  medium: 'Трещина с раскрытием 0,3–1 мм',
  low: 'Волосяная трещина (до 0,3 мм)',
};
export const CRACK_TITLES_NO_SCALE = {
  high: 'Протяжённая трещина (раскрытие не измерено — нет масштаба)',
  medium: 'Трещина средней длины (раскрытие не измерено — нет масштаба)',
  low: 'Короткая трещина (раскрытие не измерено — нет масштаба)',
};
