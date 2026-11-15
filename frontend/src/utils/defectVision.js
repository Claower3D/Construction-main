// Распознавание дефектов большой моделью зрения (сервер: /api/v1/ai/defect-vision).
// На копию фото накладывается сетка с подписями ячеек — модель называет ячейки, где виден дефект.
// Точные размеры трещин потом измеряются по пикселям внутри этих ячеек (utils/crackDetector.js).

import { jsonAuthHeaders } from '../services/platformUtils';

const MAX_SIDE = 1280;
const isRealOpenAIKey = (k) => typeof k === 'string' && /^sk-[A-Za-z0-9_-]{10,}/.test(k.trim());

export const VISION_KIND_LABEL = {
  crack: 'Трещина', spall: 'Скол / разрушение', exposed_rebar: 'Оголённая арматура', corrosion: 'Коррозия',
  leak: 'Протечка / высолы', mold: 'Плесень', delamination: 'Отслоение отделки', deformation: 'Деформация', other: 'Дефект',
};

export function gridFor(w, h) {
  const r = w / h;
  if (r > 1.15) return { cols: 8, rows: 6 };
  if (r < 0.87) return { cols: 6, rows: 8 };
  return { cols: 7, rows: 7 };
}

const colName = (i) => String.fromCharCode(65 + i);

/** Копия фото (до 1280 px) с сеткой и подписями ячеек → dataURL JPEG */
export function makeGridPhoto(img, cols, rows) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const k = Math.min(1, MAX_SIDE / Math.max(W, H));
  const w = Math.round(W * k), h = Math.round(H * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const cw = w / cols, ch = h / rows;
  // линии: тёмная подложка + светлая линия — видны и на светлом, и на тёмном
  const line = (x0, y0, x1, y1) => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
  };
  for (let i = 1; i < cols; i++) line(Math.round(i * cw) + 0.5, 0, Math.round(i * cw) + 0.5, h);
  for (let j = 1; j < rows; j++) line(0, Math.round(j * ch) + 0.5, w, Math.round(j * ch) + 0.5);
  const fs = Math.max(11, Math.round(Math.min(cw, ch) * 0.17));
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textBaseline = 'top';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const label = `${colName(i)}${j + 1}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(i * cw + 2, j * ch + 2, tw + 6, fs + 4);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, i * cw + 5, j * ch + 4);
    }
  }
  return c.toDataURL('image/jpeg', 0.85);
}

/** Ячейки («C2», «D2»…) → рамка в долях кадра */
export function cellsToBox(cells, cols, rows) {
  let c0 = cols, c1 = -1, r0 = rows, r1 = -1;
  for (const cell of cells || []) {
    const m = /^([A-L])(\d{1,2})$/.exec(String(cell).toUpperCase());
    if (!m) continue;
    const ci = m[1].charCodeAt(0) - 65, ri = Number(m[2]) - 1;
    if (ci < 0 || ci >= cols || ri < 0 || ri >= rows) continue;
    if (ci < c0) c0 = ci; if (ci > c1) c1 = ci; if (ri < r0) r0 = ri; if (ri > r1) r1 = ri;
  }
  if (c1 < 0) return null;
  return { x: c0 / cols, y: r0 / rows, w: (c1 - c0 + 1) / cols, h: (r1 - r0 + 1) / rows };
}

/**
 * Спросить модель зрения.
 * @returns {ok:true, data, cols, rows, defects:[{…, box}]} или {ok:false, reason}
 *          reason: no_key | bad_key | quota | upstream | parse | network
 */
export async function askVision(img, { description = '', signal } = {}) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const { cols, rows } = gridFor(W, H);
  const headers = jsonAuthHeaders();
  let key = '';
  try { key = localStorage.getItem('qazgost_user_openai_key') || ''; } catch { /* приватный режим */ }
  if (isRealOpenAIKey(key)) headers['X-OpenAI-Key'] = key.trim();
  let res;
  try {
    res = await fetch('/api/v1/ai/defect-vision', {
      method: 'POST', headers, signal,
      body: JSON.stringify({ photo: makeGridPhoto(img, cols, rows), cols, rows, description: String(description || '').slice(0, 600) }),
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !Array.isArray(data.defects)) {
    return { ok: false, reason: (data && data.error) || (res.status === 503 ? 'no_key' : 'upstream') };
  }
  const defects = data.defects
    .map((d) => ({ ...d, box: cellsToBox(d.cells, cols, rows) }))
    .filter((d) => d.box);
  return { ok: true, data, cols, rows, defects };
}
