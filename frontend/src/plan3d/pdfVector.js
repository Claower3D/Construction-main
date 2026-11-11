// Линии из векторного PDF (чертёж, выгруженный из CAD). Слоёв в PDF обычно нет,
// поэтому делим линии по толщине: стены на чертежах начерчены толще размеров и штриховок.
// Координаты — в пунктах листа (1 pt = 1/72 дюйма), ось Y вверх.

const PT_TO_MM = 25.4 / 72;
const MAX_SEGMENTS = 200000;

const mul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

export function widthLabel(mm) {
  return mm < 0.03 ? 'Линии волосные' : `Линии ${mm.toFixed(2).replace('.', ',')} мм`;
}

/**
 * @param {{fnArray:number[], argsArray:any[]}} opList результат page.getOperatorList()
 * @param {Record<string, number>} OPS таблица кодов операций pdf.js
 * @returns {{ segments: Array<{layer:string,x1:number,y1:number,x2:number,y2:number}>,
 *             layers: Array<{name:string,count:number,length:number,widthMm:number}>, skipped:number }}
 */
export function segmentsFromOperatorList(opList, OPS) {
  const { fnArray, argsArray } = opList;
  let ctm = [1, 0, 0, 1, 0, 0];
  let lineWidth = 1;
  const stack = [];
  const segments = [];
  let skipped = 0;
  let pending = null; // отрезки последнего построенного пути в координатах листа

  const strokeOps = new Set([OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
  const dropOps = new Set([OPS.fill, OPS.eoFill, OPS.endPath]);

  const build = (ops, coords) => {
    const out = [];
    let i = 0;
    let sx = 0;
    let sy = 0;
    let cx = 0;
    let cy = 0;
    const tf = (x, y) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]];
    const seg = (x1, y1, x2, y2) => { const a = tf(x1, y1); const b = tf(x2, y2); out.push([a[0], a[1], b[0], b[1]]); };
    for (const op of ops) {
      if (op === OPS.moveTo) { cx = coords[i]; cy = coords[i + 1]; sx = cx; sy = cy; i += 2; }
      else if (op === OPS.lineTo) { seg(cx, cy, coords[i], coords[i + 1]); cx = coords[i]; cy = coords[i + 1]; i += 2; }
      else if (op === OPS.curveTo) { cx = coords[i + 4]; cy = coords[i + 5]; i += 6; } // кривые не берём: стены прямые
      else if (op === OPS.curveTo2 || op === OPS.curveTo3) { cx = coords[i + 2]; cy = coords[i + 3]; i += 4; }
      else if (op === OPS.closePath) { if (cx !== sx || cy !== sy) seg(cx, cy, sx, sy); cx = sx; cy = sy; }
      else if (op === OPS.rectangle) {
        const [x, y, w, h] = [coords[i], coords[i + 1], coords[i + 2], coords[i + 3]];
        seg(x, y, x + w, y); seg(x + w, y, x + w, y + h); seg(x + w, y + h, x, y + h); seg(x, y + h, x, y);
        cx = x; cy = y; sx = x; sy = y; i += 4;
      }
    }
    return out;
  };

  for (let n = 0; n < fnArray.length; n += 1) {
    const fn = fnArray[n];
    const args = argsArray[n];
    if (fn === OPS.save) stack.push({ ctm, lineWidth });
    else if (fn === OPS.restore) { const s = stack.pop(); if (s) { ctm = s.ctm; lineWidth = s.lineWidth; } }
    else if (fn === OPS.transform) ctm = mul(ctm, args);
    else if (fn === OPS.paintFormXObjectBegin) { stack.push({ ctm, lineWidth }); if (Array.isArray(args?.[0])) ctm = mul(ctm, args[0]); }
    else if (fn === OPS.paintFormXObjectEnd) { const s = stack.pop(); if (s) { ctm = s.ctm; lineWidth = s.lineWidth; } }
    else if (fn === OPS.setLineWidth) lineWidth = args[0];
    else if (fn === OPS.constructPath) pending = build(args[0], args[1]);
    else if (strokeOps.has(fn) && pending) {
      const k = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2]));
      const mm = Math.round(lineWidth * k * PT_TO_MM * 20) / 20;
      const layer = widthLabel(mm);
      for (const [x1, y1, x2, y2] of pending) {
        if (segments.length >= MAX_SEGMENTS) { skipped += 1; continue; }
        if ([x1, y1, x2, y2].every(Number.isFinite)) segments.push({ layer, widthMm: mm, x1, y1, x2, y2 });
      }
      pending = null;
    } else if (dropOps.has(fn)) pending = null;
  }

  const byLayer = new Map();
  for (const s of segments) {
    const l = byLayer.get(s.layer) || { name: s.layer, count: 0, length: 0, widthMm: s.widthMm };
    l.count += 1;
    l.length += Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    byLayer.set(s.layer, l);
  }
  return { segments, layers: [...byLayer.values()].sort((a, b) => b.widthMm - a.widthMm), skipped };
}

/** Стены обычно — самые толстые линии, которых на листе заметно много (рамку и штамп отсекаем по доле длины). */
export function guessWallWidths(layers) {
  const total = layers.reduce((s, l) => s + l.length, 0);
  if (!total) return { names: [], confident: false };
  const thick = layers.filter((l) => l.count >= 4 && l.length / total >= 0.05);
  if (layers.length < 2 || !thick.length) return { names: layers.map((l) => l.name), confident: false };
  const best = thick.reduce((a, b) => (b.widthMm > a.widthMm ? b : a), thick[0]);
  return { names: [best.name], confident: thick.length > 1 || layers.length > 1 };
}

/** Метров в одном пункте листа при масштабе чертежа 1:N. */
export const ptToMetres = (scale) => (PT_TO_MM / 1000) * scale;
