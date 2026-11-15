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

// Сумма по окну через интегральное изображение — локальная средняя яркость
function boxMean(g, w, h, r) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r); const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r); const x1 = Math.min(w, x + r + 1);
      const s = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      out[y * w + x] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
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
 * @param img     загруженное изображение
 * @param box     рамка в долях кадра {x, y, w, h}
 * @returns { lengthPx, widthPx, points:[{xPct,yPct,strength}], found }
 *          lengthPx / widthPx — в пикселях исходного фото
 */
export function measureCrackInBox(img, box) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const sx = Math.max(0, Math.floor(box.x * W));
  const sy = Math.max(0, Math.floor(box.y * H));
  const sw = Math.max(4, Math.min(W - sx, Math.ceil(box.w * W)));
  const sh = Math.max(4, Math.min(H - sy, Math.ceil(box.h * H)));
  const k = Math.min(1, CROP_MAX / Math.max(sw, sh));
  const w = Math.max(4, Math.round(sw * k));
  const h = Math.max(4, Math.round(sh * k));

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  let px;
  try { px = ctx.getImageData(0, 0, w, h).data; } catch { return { found: false, lengthPx: 0, widthPx: 0, points: [] }; }
  const g = grayOf(px, w * h);

  // Трещина — пиксели заметно темнее своей окрестности (окно ~1/12 участка)
  const r = Math.max(4, Math.round(Math.max(w, h) / 24));
  const mean = boxMean(g, w, h, r);
  const diff = new Float32Array(w * h);
  const vals = [];
  for (let i = 0; i < w * h; i++) {
    const d = mean[i] - g[i];
    diff[i] = d;
    if (d > 0) vals.push(d);
  }
  vals.sort((a, b) => a - b);
  const p90 = vals.length ? vals[Math.floor(vals.length * 0.9)] : 0;
  const thr = Math.max(12, p90);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (diff[i] > thr) mask[i] = 1;

  // Оставляем вытянутые линии и отбрасываем «крошку» (песок, поры, пятна)
  const { label, comps } = components(mask, w, h);
  const minSpan = Math.max(w, h) * 0.12;
  const keep = new Uint8Array(comps.length);
  for (const cp of comps) {
    const elongated = cp.span * cp.span / Math.max(1, cp.n) > 3; // площадь мала относительно размаха
    if (cp.n >= 15 && cp.span >= minSpan && elongated) keep[cp.id] = 1;
  }
  let area = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] && keep[label[i]]) area++;
    else mask[i] = 0;
  }
  if (area === 0) return { found: false, lengthPx: 0, widthPx: 0, points: [] };

  const skel = thin(mask, w, h);
  // Длина скелета по цепочке шагов
  let n4Links = 0;
  let ndLinks = 0;
  let skelN = 0;
  let coreDark = 0;
  let maskDark = 0;
  const points = [];
  const step = Math.max(1, Math.round(Math.max(w, h) / 160));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i]) maskDark += diff[i];
      if (!skel[i]) continue;
      skelN++;
      coreDark += diff[i];
      // Связи с соседями «вперёд» (каждая считается один раз). Диагональ не считаем,
      // если её уже замыкают два прямых шага — иначе уголки лестницы удваивают длину.
      if (x < w - 1 && skel[i + 1]) n4Links++;
      if (y < h - 1 && skel[i + w]) n4Links++;
      if (x < w - 1 && y < h - 1 && skel[i + w + 1] && !skel[i + 1] && !skel[i + w]) ndLinks++;
      if (x > 0 && y < h - 1 && skel[i + w - 1] && !skel[i - 1] && !skel[i + w]) ndLinks++;
      if ((x + y) % step === 0) {
        points.push({ xPct: ((sx + x / k) / W) * 100, yPct: ((sy + y / k) / H) * 100, strength: 2 });
      }
    }
  }
  if (skelN < 3) return { found: false, lengthPx: 0, widthPx: 0, points: [] };
  // Оценка Кульпы для цифровой линии: прямой шаг 0,948, диагональный 1,343
  const lengthCrop = Math.max(0.948 * n4Links + 1.343 * ndLinks, skelN * 0.9);
  // Раскрытие: «сколько темноты» поперёк линии, делённое на темноту её середины.
  // Размытые края тонкой трещины дают доли пикселя, а не целые пиксели маски.
  const coreMean = coreDark / skelN;
  const widthCrop = Math.max(0.5, maskDark / Math.max(1e-6, coreMean) / lengthCrop);
  return { found: true, lengthPx: lengthCrop / k, widthPx: widthCrop / k, points };
}

/**
 * Класс опасности. С масштабом — по раскрытию (СП РК / СП 63: до 0,3 мм допустимо),
 * без масштаба — только по относительной длине, и никогда не «критический».
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
  critical: 'Сквозная / силовая трещина (раскрытие > 3 мм)',
  high: 'Трещина с раскрытием 1–3 мм',
  medium: 'Трещина с раскрытием 0,3–1 мм',
  low: 'Волосяная трещина (до 0,3 мм)',
};
export const CRACK_TITLES_NO_SCALE = {
  high: 'Протяжённая трещина (раскрытие не измерено — нет масштаба)',
  medium: 'Трещина средней длины (раскрытие не измерено — нет масштаба)',
  low: 'Короткая трещина (раскрытие не измерено — нет масштаба)',
};
