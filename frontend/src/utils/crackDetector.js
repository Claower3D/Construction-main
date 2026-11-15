/**
 * crackDetector.js v10 — Multi-Scale Tiled Valley Detector + Balanced DBSCAN + NMS Merging
 * 
 * Key capabilities:
 *  1. Letterbox / Image Border Rejection: ignores dark viewer bars and frame edges.
 *  2. Multi-Scale Valley Detection (R=2, 4, 6): detects everything from 0.3mm hairline
 *     cracks to wide deep fractures and structural damage.
 *  3. 4x4 Tiled Adaptive Thresholding: faint cracks in clean areas are NOT drowned out
 *     by high-contrast rebar or shadows in other parts of the photo.
 *  4. Balanced Spatial Subsampling: prevents one noisy corner from dominating DBSCAN.
 *  5. DBSCAN Clustering: groups contiguous defect fragments into distinct zones.
 *  6. NMS Box Merging: merges overlapping/concentric boxes into one unified bounding box per defect.
 */

const MAX_SIZE = 512;

import { createCrackDetector, DEFAULT_CONF } from '../services/crackVision';
import { measureCrackInBox, crackSeverity, CRACK_TITLES, CRACK_TITLES_NO_SCALE } from './crackMeasure';

// Слабые зоны модели (уверенность 25–40%) принимаются, только если
// внутри рамки действительно есть линия трещины. Пороги подобраны на размеченных фото
// (audit/crack_eval.cjs): так находим больше трещин, не возвращая «трещины» на песке и швах.
export const WEAK_CONF = 0.25;
export const DEFAULT_SPAN_MM = 1500;
const VERIFY_LEN = 0.5;      // линия не короче половины диагонали рамки
const VERIFY_CONTRAST = 18;  // и заметно темнее окружения (уровни яркости 0–255)

// Увеличенные четверти кадра с перекрытием: мелкие трещины на большом кадре модель
// иначе видит в 512 пикселях и пропускает
const TILE = 0.6;
const REFINE_CONF = 0.15; // узкие рамки для уточнения места (сами зонами не становятся)
const REFINE_ONLY_BELOW = 0.5; // уточняем только неуверенные зоны — в них чаще попадает край предмета
const TILE_OFFS = [[0, 0], [0.4, 0], [0, 0.4], [0.4, 0.4]];

function boxIoU(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  return { iou: inter / (a.w * a.h + b.w * b.h - inter + 1e-9), inMin: inter / (Math.min(a.w * a.h, b.w * b.h) + 1e-9) };
}

async function proposeBoxes(det, img, zoneConf, useTiles) {
  const minConf = Math.min(zoneConf, REFINE_CONF);
  const all = (await det.detect(img, minConf)).boxes.map((b) => ({ ...b }));
  if (useTiles) {
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;
    const c = document.createElement('canvas');
    c.width = Math.round(W * TILE); c.height = Math.round(H * TILE);
    const cx = c.getContext('2d');
    for (const [ox, oy] of TILE_OFFS) {
      cx.drawImage(img, Math.round(ox * W), Math.round(oy * H), c.width, c.height, 0, 0, c.width, c.height);
      const r = await det.detect(c, minConf);
      for (const b of r.boxes) all.push({ x: ox + b.x * TILE, y: oy + b.y * TILE, w: b.w * TILE, h: b.h * TILE, conf: b.conf });
    }
  }
  // Зоны — рамки от порога minConf; повторы одной трещины с разных масштабов объединяем
  all.sort((a, b) => b.conf - a.conf);
  const zones = [];
  for (const b of all) {
    if (b.conf < zoneConf) continue;
    if (zones.some((k) => { const o = boxIoU(k, b); return o.iou > 0.3 || o.inMin > 0.6; })) continue;
    zones.push({ ...b });
  }
  // Уточнение места: модель часто даёт широкую рамку (трещина + край предмета) и внутри неё —
  // узкую рамку точно по трещине, но с меньшей уверенностью. Берём геометрию узкой рамки,
  // уверенность — широкой.
  for (const z of zones) {
    if (z.conf >= REFINE_ONLY_BELOW) continue; // уверенная рамка уже очерчивает трещину целиком
    const za = z.w * z.h;
    let best = null;
    for (const r of all) {
      if (r.conf < REFINE_CONF || r.w * r.h >= 0.6 * za) continue;
      const ix = Math.max(0, Math.min(r.x + r.w, z.x + z.w) - Math.max(r.x, z.x));
      const iy = Math.max(0, Math.min(r.y + r.h, z.y + z.h) - Math.max(r.y, z.y));
      if (ix * iy / (r.w * r.h + 1e-9) < 0.7) continue;
      if (!best || r.conf > best.conf) best = r;
    }
    if (best) { z.x = best.x; z.y = best.y; z.w = best.w; z.h = best.h; z.refined = true; }
  }
  const keep = [];
  for (const z of zones) if (!keep.some((k) => { const o = boxIoU(k, z); return o.iou > 0.3 || o.inMin > 0.6; })) keep.push(z);
  return keep;
}

// Модель трещин грузится один раз на страницу (≈10 МБ, потом из кэша браузера)
let modelDetector = null;
function getModel() {
  if (!modelDetector) modelDetector = createCrackDetector();
  return modelDetector;
}

/**
 * Найти трещины на фото.
 * Зоны находит обученная модель (YOLO26n, точность 0,87): пиксельный фильтр сам по себе
 * принимал за трещины край люка, песок, швы и тени. Пиксельная карта используется только
 * внутри рамок модели — для скелета, теплокарты и измерения длины/раскрытия.
 * @param source  фото
 * @param opts.spanMm  реальная ширина участка на фото в мм (если известна) — тогда размеры в мм
 */
export async function detectCracks(source, opts = {}) {
  console.log('[CV] v11: модель находит зоны, пиксели — только для измерения');
  const img = await loadImage(source);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  
  const scale = Math.max(w0, h0) > MAX_SIZE ? MAX_SIZE / Math.max(w0, h0) : 1;
  const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  
  let px;
  try {
    px = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    console.error('[CV] getImageData failed:', e);
    return { crackPoints: [], measurements: [], regions: [], edgeCanvas: null, scale };
  }

  // 1. Grayscale conversion
  // 1. Grayscale conversion
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }

  // 1b. Dark interior pit/hole rejection (box filter of gray < 40 in 15x15 window)
  const isDark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (gray[i] < 42) isDark[i] = 1;
  }
  const voidMask = new Uint8Array(w * h);
  const vR = 7;
  for (let y = vR; y < h - vR; y += 2) {
    for (let x = vR; x < w - vR; x += 2) {
      let darkCount = 0;
      for (let dy = -vR; dy <= vR; dy += 3) {
        for (let dx = -vR; dx <= vR; dx += 3) {
          if (isDark[(y + dy) * w + (x + dx)]) darkCount++;
        }
      }
      if (darkCount >= 13) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (y + dy < h && x + dx < w) voidMask[(y + dy) * w + (x + dx)] = 1;
          }
        }
      }
    }
  }

  // 2. Multi-scale Valley Filter (R=2, 4, 6)
  const valley = new Float32Array(w * h);
  for (const R of [2, 4, 6]) {
    for (let y = R; y < h - R; y++) {
      for (let x = R; x < w - R; x++) {
        const center = gray[y * w + x];
        // Ignore dark letterbox margins and interior void pits
        if (center < 20 || voidMask[y * w + x]) continue;

        const dH = Math.min(gray[y * w + (x - R)], gray[y * w + (x + R)]) - center;
        const dV = Math.min(gray[(y - R) * w + x], gray[(y + R) * w + x]) - center;
        const dD1 = Math.min(gray[(y - R) * w + (x - R)], gray[(y + R) * w + (x + R)]) - center;
        const dD2 = Math.min(gray[(y - R) * w + (x + R)], gray[(y + R) * w + (x - R)]) - center;
        
        const maxV = Math.max(dH, dV, dD1, dD2);
        if (maxV > 4.0 && maxV > valley[y * w + x]) {
          valley[y * w + x] = maxV;
        }
      }
    }
  }

  // 3. Local Contrast Filter & Border Margin Filter (3.5% borders)
  const filtered = new Float32Array(w * h);
  const borderX = Math.round(w * 0.035);
  const borderY = Math.round(h * 0.035);

  for (let y = borderY; y < h - borderY; y++) {
    for (let x = borderX; x < w - borderX; x++) {
      if (valley[y * w + x] < 4.5) continue;

      let sum = 0, sum2 = 0, n = 0;
      for (let dy = -3; dy <= 3; dy += 2) {
        for (let dx = -3; dx <= 3; dx += 2) {
          const v = gray[(y + dy) * w + (x + dx)];
          sum += v;
          sum2 += v * v;
          n++;
        }
      }
      const mean = sum / n;
      const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      if (std > 4.5) {
        filtered[y * w + x] = valley[y * w + x];
      }
    }
  }

  // 4. 4x4 Tiled Adaptive Thresholding with Contrast Floor
  const crackPoints = [];
  const mask = new Uint8Array(w * h);
  const tileH = Math.floor(h / 4);
  const tileW = Math.floor(w / 4);

  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const y1 = ty * tileH;
      const y2 = ty === 3 ? h : (ty + 1) * tileH;
      const x1 = tx * tileW;
      const x2 = tx === 3 ? w : (tx + 1) * tileW;

      const tileVals = [];
      let tileMax = 0;
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const v = filtered[y * w + x];
          if (v > 0) {
            tileVals.push(v);
            if (v > tileMax) tileMax = v;
          }
        }
      }

      // CRITICAL: If tile has no prominent crack valley >= 14.0, DO NOT calculate noise threshold!
      if (tileVals.length < 10 || tileMax < 14.0) continue;

      tileVals.sort((a, b) => a - b);
      const t60 = tileVals[Math.floor(tileVals.length * 0.60)] || 8.0;
      const tHigh = tileVals[Math.floor(tileVals.length * 0.85)] || 15.0;
      const thresh = Math.max(9.0, t60);

      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const v = filtered[y * w + x];
          if (v > thresh) {
            const isStrong = v > tHigh;
            mask[y * w + x] = isStrong ? 2 : 1;
            crackPoints.push({
              xPct: (x / w) * 100,
              yPct: (y / h) * 100,
              strength: isStrong ? 2 : 1,
            });
          }
        }
      }
    }
  }

  console.log('[CV] Tiled detection points:', crackPoints.length);

  // 5. Модель: где на фото трещины
  let modelBoxes = null;
  let modelError = null;
  try {
    const det = getModel();
    await det.ready;
    const weak = opts.weakConf != null ? opts.weakConf : WEAK_CONF;
    modelBoxes = await proposeBoxes(det, img, weak, opts.tiles !== false);
  } catch (e) {
    modelError = e.message || String(e);
    console.warn('[CV] Модель трещин недоступна:', modelError);
  }

  // Масштаб: реальная ширина кадра. Если не указана — типичный кадр осмотра ≈ 1,5 м
  // (элемент целиком: кольцо колодца, проём, участок стены). Допущение явно пишется в отчёте.
  const scaleAssumed = !(Number(opts.spanMm) > 0);
  const spanMm = scaleAssumed ? DEFAULT_SPAN_MM : Number(opts.spanMm);
  const mmPerPx = spanMm / w0;
  const diag0 = Math.hypot(w0, h0);
  let regions = [];
  let kept = [];

  if (modelBoxes) {
    // 6. Измеряем трещину в каждой рамке модели
    const PAD = 0.02;
    const strongConf = opts.minConf != null ? opts.minConf : DEFAULT_CONF;
    const vLen = opts.verifyLen != null ? opts.verifyLen : VERIFY_LEN;
    const vContrast = opts.verifyContrast != null ? opts.verifyContrast : VERIFY_CONTRAST;
    for (const b of modelBoxes) {
      const bx = { x: Math.max(0, b.x - PAD), y: Math.max(0, b.y - PAD), w: Math.min(1, b.w + 2 * PAD), h: Math.min(1, b.h + 2 * PAD) };
      const m = measureCrackInBox(img, bx);
      if (b.conf < strongConf) {
        // слабая зона: нужна видимая линия трещины внутри
        const boxDiag = Math.hypot(b.w * w0, b.h * h0);
        if (!m.found || m.lengthPx < vLen * boxDiag || m.contrast < vContrast) continue;
      }
      const lengthPx = m.found ? m.lengthPx : Math.hypot(b.w * w0, b.h * h0) * 0.9;
      const lengthRel = lengthPx / diag0;
      // раскрытие — в самом широком месте (по нему класс опасности), и среднее
      const openingMm = m.found ? Math.round(m.gapPx * mmPerPx * 10) / 10 : null;
      const openingMeanMm = m.found ? Math.round(m.widthPx * mmPerPx * 10) / 10 : null;
      const lengthMm = Math.round(lengthPx * mmPerPx);
      let severity = crackSeverity({ openingMm, lengthRel, conf: b.conf });
      // Без указанной ширины кадра тонкую линию (меньше 3 пикселей фото) в мм не пересчитать
      // надёжно: на крупном плане волосяная трещина иначе «становится» щелью. Не поднимаем
      // такие зоны выше «среднего» и просим уточнить размер.
      const unsure = scaleAssumed && m.found && m.gapPx < 3 && (severity === 'high' || severity === 'critical');
      if (unsure) severity = 'medium';
      // Рамку сужаем до найденной линии трещины (модель часто даёт рамку с запасом)
      let shown = b;
      if (m.found && m.tight) {
        const P = 0.015;
        const t = m.tight;
        const x = Math.max(0, t.x - P); const y = Math.max(0, t.y - P);
        shown = { x, y, w: Math.min(1 - x, t.w + 2 * P), h: Math.min(1 - y, t.h + 2 * P), conf: b.conf };
      }
      kept.push({ b: shown, m, lengthPx, lengthRel, openingMm, openingMeanMm, lengthMm, severity, unsure, weak: b.conf < strongConf });
    }
    kept.sort((a, c) => c.b.conf - a.b.conf);
    // после сужения разные рамки могут указывать на одну и ту же трещину
    kept = kept.filter((k, i) => !kept.slice(0, i).some((q) => { const o = boxIoU(q.b, k.b); return o.iou > 0.3 || o.inMin > 0.6; }));
    kept = kept.slice(0, 8);
    regions = kept.map((k, i) => {
      const bbox = [k.b.x * 100, k.b.y * 100, (k.b.x + k.b.w) * 100, (k.b.y + k.b.h) * 100].map((v) => Number(v.toFixed(1)));
      const title = k.openingMm != null ? CRACK_TITLES[k.severity] : (CRACK_TITLES_NO_SCALE[k.severity] || CRACK_TITLES_NO_SCALE.low);
      const lenTxt = `длина ≈ ${k.lengthMm} мм`;
      const coarse = k.openingMm != null && k.m.gapPx < 3;
      const openTxt = k.openingMm != null ? `, раскрытие до ≈ ${k.openingMm} мм (в среднем ${k.openingMeanMm} мм)${k.unsure ? ' — линия тоньше 3 пикселей фото: укажите ширину кадра или снимите ближе, класс может оказаться выше' : coarse ? ' — линия тоньше 3 пикселей фото, для точного раскрытия снимите ближе' : ''}` : ', раскрытие не измерено — линия трещины не выделилась';
      return {
        id: i + 1,
        bbox,
        type: title,
        severity: k.severity,
        confidence: Number(k.b.conf.toFixed(2)),
        length_mm: k.lengthMm,
        opening_mm: k.openingMm,
        opening_mean_mm: k.openingMeanMm,
        width_profile: k.m.found ? k.m.profile.map((p) => ({ pos_pct: Math.round(p.pos * 100), width_mm: Math.round(p.widthPx * mmPerPx * 10) / 10 })) : null,
        scale_assumed: scaleAssumed,
        length_rel: Number(k.lengthRel.toFixed(3)),
        area_percent: null,
        measured: k.m.found,
        opening_coarse: coarse,
        severity_unsure: !!k.unsure,
        weak: k.weak,
        contrast: k.m.found ? Math.round(k.m.contrast) : null,
        gap_px: k.m.found ? Number(k.m.gapPx.toFixed(1)) : null,
        width_px: k.m.found ? Number(k.m.widthPx.toFixed(1)) : null,
        img_diag_px: Math.round(diag0),
        description: `Зона ${i + 1}: ${title} (${lenTxt}${openTxt}; уверенность модели ${Math.round(k.b.conf * 100)}%${k.weak ? ', невысокая — зона принята, потому что на фото видна линия трещины; проверьте на месте' : ''})`,
      };
    });

    // Пиксельная карта — только внутри рамок модели, остальное (песок, края, тени) убираем
    const inside = new Uint8Array(w * h);
    for (const k of kept) {
      const x0 = Math.floor(k.b.x * w), y0 = Math.floor(k.b.y * h);
      const x1 = Math.ceil((k.b.x + k.b.w) * w), y1 = Math.ceil((k.b.y + k.b.h) * h);
      for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) inside[y * w + x] = 1;
    }
    for (let i = 0; i < w * h; i++) if (!inside[i]) mask[i] = 0;
    crackPoints.length = 0;
    for (const k of kept) for (const p of k.m.points) crackPoints.push(p);
  } else {
    crackPoints.length = 0;
    mask.fill(0);
  }

  console.log('[CV] Зон от модели:', regions.length, modelError ? `(модель: ${modelError})` : '');

  // 8. Отметки измерений
  const measurements = regions.map((r) => ({
    xPct: (r.bbox[0] + r.bbox[2]) / 2,
    yPct: (r.bbox[1] + r.bbox[3]) / 2,
    widthMM: r.opening_mm,
  }));

  // 9. Edge canvas for skeleton mode
  const ec = document.createElement('canvas');
  ec.width = w; ec.height = h;
  const ectx = ec.getContext('2d');
  const ed = ectx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const bg = Math.round(gray[i] * 0.18);
    if (mask[i] === 2) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 220;
      ed.data[i * 4 + 2] = 255;
    } else if (mask[i] === 1) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 140;
      ed.data[i * 4 + 2] = 230;
    } else {
      ed.data[i * 4] = bg;
      ed.data[i * 4 + 1] = bg;
      ed.data[i * 4 + 2] = Math.round(bg * 1.1);
    }
    ed.data[i * 4 + 3] = 255;
  }
  ectx.putImageData(ed, 0, 0);

  // Скелет найденных трещин поверх затемнённого фото
  ectx.fillStyle = 'rgb(0,220,255)';
  for (const p of crackPoints) ectx.fillRect((p.xPct / 100) * w - 1, (p.yPct / 100) * h - 1, 2, 2);

  return { crackPoints, measurements, regions, edgeCanvas: ec, scale, modelError, scaled: true, scaleAssumed, spanMm };
}

// ---- DBSCAN Clustering with Non-Maximum Suppression (NMS) Box Merging ----
export function dbscanClustering(points, eps = 4.0, minPts = 6) {
  const n = points.length;
  if (n === 0) return [];

  const visited = new Uint8Array(n);
  const clusterIds = new Int16Array(n).fill(-1);
  let cId = 0;

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const neighbors = [];
    const p1 = points[i];
    for (let j = 0; j < n; j++) {
      const p2 = points[j];
      const dx = p1.xPct - p2.xPct;
      const dy = p1.yPct - p2.yPct;
      if (dx * dx + dy * dy <= eps * eps) {
        neighbors.push(j);
      }
    }

    if (neighbors.length < minPts) continue;

    clusterIds[i] = cId;
    for (let k = 0; k < neighbors.length; k++) {
      const j = neighbors[k];
      if (!visited[j]) {
        visited[j] = 1;
        const pJ = points[j];
        const jNeighbors = [];
        for (let m = 0; m < n; m++) {
          const pM = points[m];
          const dx = pJ.xPct - pM.xPct;
          const dy = pJ.yPct - pM.yPct;
          if (dx * dx + dy * dy <= eps * eps) {
            jNeighbors.push(m);
          }
        }
        if (jNeighbors.length >= minPts) {
          for (let m = 0; m < jNeighbors.length; m++) {
            if (!neighbors.includes(jNeighbors[m])) {
              neighbors.push(jNeighbors[m]);
            }
          }
        }
      }
      if (clusterIds[j] === -1) {
        clusterIds[j] = cId;
      }
    }
    cId++;
  }

  // Aggregate raw clusters
  const rawClusters = [];
  for (let c = 0; c < cId; c++) {
    let minX = 100, maxX = 0, minY = 100, maxY = 0, count = 0;
    for (let i = 0; i < n; i++) {
      if (clusterIds[i] === c) {
        const p = points[i];
        if (p.xPct < minX) minX = p.xPct;
        if (p.xPct > maxX) maxX = p.xPct;
        if (p.yPct < minY) minY = p.yPct;
        if (p.yPct > maxY) maxY = p.yPct;
        count++;
      }
    }

    const bw = maxX - minX;
    const bh = maxY - minY;
    // Reject full-image circular rims/outer frames (>55% width AND >55% height)
    if (bw > 55 && bh > 55) continue;

    if (count >= minPts) {
      rawClusters.push({
        bbox: [minX, minY, maxX, maxY],
        count,
      });
    }
  }

  // Sort raw clusters by point count descending
  rawClusters.sort((a, b) => b.count - a.count);

  // Non-Maximum Suppression (NMS) / Box Merging
  // Merges overlapping/concentric boxes into one unified defect box without creating giant full-frame boxes
  const merged = [];
  for (const b of rawClusters) {
    const b1 = b.bbox;
    let wasMerged = false;
    for (const m of merged) {
      const b2 = m.bbox;
      const dx = Math.max(0, Math.min(b1[2], b2[2]) - Math.max(b1[0], b2[0]));
      const dy = Math.max(0, Math.min(b1[3], b2[3]) - Math.max(b1[1], b2[1]));
      const inter = dx * dy;
      const a1 = (b1[2] - b1[0]) * (b1[3] - b1[1]);
      const a2 = (b2[2] - b2[0]) * (b2[3] - b2[1]);
      const iou = inter / Math.max(1e-5, a1 + a2 - inter);
      const contained = inter / Math.max(1e-5, Math.min(a1, a2));

      const mergedW = Math.max(b1[2], b2[2]) - Math.min(b1[0], b2[0]);
      const mergedH = Math.max(b1[3], b2[3]) - Math.min(b1[1], b2[1]);
      if (mergedW > 50 && mergedH > 50) continue;

      // Merge if significant overlap or one box is largely inside another
      if (iou > 0.15 || contained > 0.45) {
        m.bbox = [
          Math.min(b1[0], b2[0]),
          Math.min(b1[1], b2[1]),
          Math.max(b1[2], b2[2]),
          Math.max(b1[3], b2[3]),
        ];
        m.count += b.count;
        wasMerged = true;
        break;
      }
    }
    if (!wasMerged) {
      merged.push({ bbox: [...b.bbox], count: b.count });
    }
  }

  // Format final merged clusters with padding, type titles, and physical dimensions
  const finalClusters = merged.map((cl, i) => {
    const padX = 1.8;
    const padY = 1.8;
    const x1 = Math.max(0, cl.bbox[0] - padX);
    const y1 = Math.max(0, cl.bbox[1] - padY);
    const x2 = Math.min(100, cl.bbox[2] + padX);
    const y2 = Math.min(100, cl.bbox[3] + padY);
    const w_pct = x2 - x1;
    const h_pct = y2 - y1;
    const length_pct = Math.sqrt(w_pct * w_pct + h_pct * h_pct);
    const severity = (length_pct > 32 || cl.count > 100) ? 'critical' : (length_pct > 16 || cl.count > 35) ? 'high' : 'medium';
    
    const typeTitle = severity === 'critical' ? 'Глубокий разлом / силовая трещина бетона' :
                      severity === 'high' ? 'Конструктивная трещина с раскрытием' :
                      'Усадочная трещина штукатурного слоя / скол';

    return {
      id: i + 1,
      typeTitle,
      bbox: [
        Number(x1.toFixed(1)),
        Number(y1.toFixed(1)),
        Number(x2.toFixed(1)),
        Number(y2.toFixed(1)),
      ],
      count: cl.count,
      severity,
      w_pct: Number(w_pct.toFixed(1)),
      h_pct: Number(h_pct.toFixed(1)),
      length_mm: Math.round(length_pct * 8 + 60),
      opening_mm: (Math.min(w_pct, h_pct) * 0.35 + 1.2).toFixed(1),
      area_percent: (w_pct * h_pct / 100).toFixed(1),
    };
  });

  return finalClusters.slice(0, 6);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src && src.src);
    if (!url) return reject(new Error('No source'));
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('0 dim'));
    img.onerror = () => reject(new Error('Load fail'));
    img.src = url;
  });
}
