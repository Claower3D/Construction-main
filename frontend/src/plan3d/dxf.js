// Чтение DXF без сторонних библиотек: нам нужны только отрезки по слоям.
// Понимаем LINE, LWPOLYLINE, POLYLINE/VERTEX и вставки блоков INSERT (стены часто лежат в блоках).
// Дуги, сплайны, штриховки и текст пропускаем — для поиска стен они не нужны.

const UNIT_TO_M = { 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1 };
const UNIT_NAME = { 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm' };
const MAX_SEGMENTS = 200000;
const MAX_INSERT_DEPTH = 4;

/** DWG — закрытый двоичный формат. Узнаём его по сигнатуре, чтобы честно сказать «сохраните как DXF». */
export function looksLikeDwg(bytes) {
  if (!bytes || bytes.length < 6) return false;
  // DWG начинается с версии «AC10xx»; текстовый DXF — с пары «0 / SECTION»
  return String.fromCharCode(...bytes.slice(0, 4)) === 'AC10';
}

/** AutoCAD до 2007 пишет русские имена слоёв в windows-1251, новее — в UTF-8. */
export function decodeDxfBuffer(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
}

function readPairs(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i], 10);
    if (Number.isNaN(code)) continue;
    pairs.push([code, lines[i + 1].trim()]);
  }
  return pairs;
}

// Сырые сущности одной области (ENTITIES или тело блока)
function readEntities(pairs, from, to) {
  const out = [];
  let i = from;
  let poly = null; // старый POLYLINE копит VERTEX до SEQEND
  while (i < to) {
    if (pairs[i][0] !== 0) { i += 1; continue; }
    const type = pairs[i][1];
    let j = i + 1;
    while (j < to && pairs[j][0] !== 0) j += 1;
    const f = pairs.slice(i + 1, j);
    const get = (code) => { const p = f.find((x) => x[0] === code); return p ? p[1] : undefined; };
    const num = (code, d = 0) => { const v = parseFloat(get(code)); return Number.isFinite(v) ? v : d; };
    const layer = get(8) || '0';
    const paper = get(67) === '1';

    if (!paper) {
      if (type === 'LINE') {
        out.push({ kind: 'seg', layer, x1: num(10), y1: num(20), x2: num(11), y2: num(21) });
      } else if (type === 'LWPOLYLINE') {
        const xs = f.filter((x) => x[0] === 10).map((x) => parseFloat(x[1]));
        const ys = f.filter((x) => x[0] === 20).map((x) => parseFloat(x[1]));
        const closed = (parseInt(get(70) || '0', 10) & 1) === 1;
        const n = Math.min(xs.length, ys.length);
        for (let k = 0; k + 1 < n; k += 1) out.push({ kind: 'seg', layer, x1: xs[k], y1: ys[k], x2: xs[k + 1], y2: ys[k + 1] });
        if (closed && n > 2) out.push({ kind: 'seg', layer, x1: xs[n - 1], y1: ys[n - 1], x2: xs[0], y2: ys[0] });
      } else if (type === 'POLYLINE') {
        poly = { layer, closed: (parseInt(get(70) || '0', 10) & 1) === 1, pts: [] };
      } else if (type === 'VERTEX' && poly) {
        poly.pts.push([num(10), num(20)]);
      } else if (type === 'SEQEND' && poly) {
        const p = poly.pts;
        for (let k = 0; k + 1 < p.length; k += 1) out.push({ kind: 'seg', layer: poly.layer, x1: p[k][0], y1: p[k][1], x2: p[k + 1][0], y2: p[k + 1][1] });
        if (poly.closed && p.length > 2) out.push({ kind: 'seg', layer: poly.layer, x1: p[p.length - 1][0], y1: p[p.length - 1][1], x2: p[0][0], y2: p[0][1] });
        poly = null;
      } else if (type === 'INSERT') {
        out.push({ kind: 'insert', layer, name: get(2) || '', x: num(10), y: num(20), sx: num(41, 1), sy: num(42, 1), rot: num(50) });
      }
    }
    i = j;
  }
  return out;
}

function sectionBounds(pairs) {
  const sections = {};
  for (let i = 0; i + 1 < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2) {
      let j = i + 2;
      while (j < pairs.length && !(pairs[j][0] === 0 && pairs[j][1] === 'ENDSEC')) j += 1;
      sections[pairs[i + 1][1]] = [i + 2, j];
      i = j;
    }
  }
  return sections;
}

/**
 * @returns {{ segments: Array<{layer:string,x1:number,y1:number,x2:number,y2:number}>,
 *             layers: Array<{name:string,count:number,length:number}>,
 *             unit: string|null, unitToM: number|null, skipped: number }}
 */
export function parseDxf(text) {
  const pairs = readPairs(text);
  const sec = sectionBounds(pairs);
  if (!sec.ENTITIES) throw new Error('В файле нет раздела ENTITIES — это не DXF или файл повреждён');

  let unitCode = null;
  if (sec.HEADER) {
    for (let i = sec.HEADER[0]; i < sec.HEADER[1] - 1; i += 1) {
      if (pairs[i][0] === 9 && pairs[i][1] === '$INSUNITS') { unitCode = parseInt(pairs[i + 1][1], 10); break; }
    }
  }

  const blocks = {};
  if (sec.BLOCKS) {
    let i = sec.BLOCKS[0];
    while (i < sec.BLOCKS[1]) {
      if (pairs[i][0] === 0 && pairs[i][1] === 'BLOCK') {
        let j = i + 1;
        let name = '';
        let bx = 0;
        let by = 0;
        while (j < sec.BLOCKS[1] && pairs[j][0] !== 0) {
          if (pairs[j][0] === 2) name = pairs[j][1];
          if (pairs[j][0] === 10) bx = parseFloat(pairs[j][1]) || 0;
          if (pairs[j][0] === 20) by = parseFloat(pairs[j][1]) || 0;
          j += 1;
        }
        let end = j;
        while (end < sec.BLOCKS[1] && !(pairs[end][0] === 0 && pairs[end][1] === 'ENDBLK')) end += 1;
        blocks[name] = { bx, by, entities: readEntities(pairs, j, end) };
        i = end + 1;
      } else i += 1;
    }
  }

  const segments = [];
  let skipped = 0;
  const emit = (entities, tf, depth, parentLayer) => {
    for (const e of entities) {
      if (segments.length >= MAX_SEGMENTS) { skipped += 1; continue; }
      // слой «0» внутри блока наследует слой вставки
      const layer = e.layer === '0' && parentLayer ? parentLayer : e.layer;
      if (e.kind === 'seg') {
        const [x1, y1] = tf(e.x1, e.y1);
        const [x2, y2] = tf(e.x2, e.y2);
        if ([x1, y1, x2, y2].every(Number.isFinite)) segments.push({ layer, x1, y1, x2, y2 });
      } else if (e.kind === 'insert' && depth < MAX_INSERT_DEPTH && blocks[e.name]) {
        const b = blocks[e.name];
        const a = (e.rot * Math.PI) / 180;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const inner = (x, y) => {
          const lx = (x - b.bx) * e.sx;
          const ly = (y - b.by) * e.sy;
          return tf(e.x + lx * cos - ly * sin, e.y + lx * sin + ly * cos);
        };
        emit(b.entities, inner, depth + 1, layer);
      }
    }
  };
  emit(readEntities(pairs, sec.ENTITIES[0], sec.ENTITIES[1]), (x, y) => [x, y], 0, null);

  const byLayer = new Map();
  for (const s of segments) {
    const l = byLayer.get(s.layer) || { name: s.layer, count: 0, length: 0 };
    l.count += 1;
    l.length += Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    byLayer.set(s.layer, l);
  }

  return {
    segments,
    layers: [...byLayer.values()].sort((a, b) => b.length - a.length),
    unit: UNIT_NAME[unitCode] || null,
    unitToM: UNIT_TO_M[unitCode] || null,
    skipped,
  };
}

/** Если единицы в файле не указаны, судим по габаритам: дом в 12 000 единиц — это миллиметры. */
export function guessUnitToM(segments) {
  if (!segments.length) return 0.001;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of segments) {
    minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
  }
  const span = Math.max(maxX - minX, maxY - minY);
  if (span > 2000) return 0.001;
  if (span > 200) return 0.01;
  return 1;
}

const WALL_HINT = /(wall|стен|sten|wand|mur|кладк|несущ|перегород)/i;
const WINDOW_HINT = /(window|окн|okn|glaz|остекл)/i;
const NOT_WALL_HINT = /(dim|размер|text|текст|axis|axes|ось|оси|hatch|штрих|furn|мебел|defpoints|door|двер|san|сантех|elec|электр|title|штамп|рамк|room|помещ)/i;

/**
 * Какие слои, скорее всего, стены: по имени. Слой окон берём вместе со стенами — по линиям стекла
 * внутри разрыва стены отличаем окно от двери. Если по именам стен не нашлось, предлагаем все слои, кроме явно посторонних.
 */
export function guessWallLayers(layers) {
  const named = layers.filter((l) => WALL_HINT.test(l.name) && !NOT_WALL_HINT.test(l.name)).map((l) => l.name);
  if (named.length) {
    const windows = layers.filter((l) => WINDOW_HINT.test(l.name) && !named.includes(l.name)).map((l) => l.name);
    return { names: [...named, ...windows], confident: true };
  }
  return { names: layers.filter((l) => !NOT_WALL_HINT.test(l.name)).map((l) => l.name), confident: false };
}

/** Переводим в метры и сдвигаем к началу координат, чтобы план не уезжал на километры (геопривязка в DXF нам не нужна). */
export function toMetres(segments, unitToM) {
  if (!segments.length) return { segments: [], origin: { x: 0, y: 0 } };
  let minX = Infinity;
  let minY = Infinity;
  for (const s of segments) {
    minX = Math.min(minX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2);
  }
  const k = unitToM;
  return {
    origin: { x: minX, y: minY },
    segments: segments.map((s) => ({
      layer: s.layer,
      x1: (s.x1 - minX) * k, y1: (s.y1 - minY) * k,
      x2: (s.x2 - minX) * k, y2: (s.y2 - minY) * k,
    })),
  };
}
