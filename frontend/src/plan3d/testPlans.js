// Тестовые планы для проверок и для кнопки «Попробовать на примере».
// Дом 10 × 8 м: наружные стены 400 мм, перегородка 200 мм, входная дверь, дверь в перегородке, окно.

function dxf(entities, layers, insunits = 4) {
  const out = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1015', '9', '$INSUNITS', '70', String(insunits), '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER'];
  for (const l of layers) out.push('0', 'LAYER', '2', l, '70', '0', '62', '7', '6', 'CONTINUOUS');
  out.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  for (const e of entities) out.push(...e);
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\r\n');
}

const line = (layer, x1, y1, x2, y2) => ['0', 'LINE', '8', layer, '10', String(x1), '20', String(y1), '11', String(x2), '21', String(y2)];
const pline = (layer, pts, closed = false) => ['0', 'LWPOLYLINE', '8', layer, '90', String(pts.length), '70', closed ? '1' : '0', ...pts.flatMap(([x, y]) => ['10', String(x), '20', String(y)])];

/** @param {number} k множитель единиц: 1 — миллиметры, 0.001 — метры */
export function sampleHouseDxf({ layer = 'Стены', k = 1, insunits = 4 } = {}) {
  const s = (v) => Math.round(v * k * 1000) / 1000;
  const L = (x1, y1, x2, y2, lay = layer) => line(lay, s(x1), s(y1), s(x2), s(y2));
  const e = [
    // наружные грани; северная разорвана под входную дверь 2000…3000
    pline(layer, [[2000, 8000], [0, 8000], [0, 0], [10000, 0], [10000, 8000], [3000, 8000]].map(([x, y]) => [s(x), s(y)])),
    L(2000, 7600, 2000, 8000), L(3000, 7600, 3000, 8000),
    // комната 1 (внутренние грани): разрыв на севере под вход и на востоке под дверь перегородки 3000…3900
    pline(layer, [[2000, 7600], [400, 7600], [400, 400], [5900, 400], [5900, 3000]].map(([x, y]) => [s(x), s(y)])),
    pline(layer, [[5900, 3900], [5900, 7600], [3000, 7600]].map(([x, y]) => [s(x), s(y)])),
    // комната 2
    pline(layer, [[6100, 3000], [6100, 400], [9600, 400], [9600, 7600], [6100, 7600], [6100, 3900]].map(([x, y]) => [s(x), s(y)])),
    L(5900, 3000, 6100, 3000), L(5900, 3900, 6100, 3900),
    // окно в южной стене 7000…8500: грани сплошные, внутри линия стекла и откосы
    L(7000, 200, 8500, 200), L(7000, 0, 7000, 400), L(8500, 0, 8500, 400),
    // посторонние слои, которые не должны стать стенами
    L(0, -900, 10000, -900, 'Размеры'), L(0, -700, 0, -1100, 'Размеры'), L(10000, -700, 10000, -1100, 'Размеры'),
    pline('Мебель', [[1000, 1000], [3000, 1000], [3000, 1900], [1000, 1900]].map(([x, y]) => [s(x), s(y)]), true),
  ];
  return dxf(e, [layer, 'Размеры', 'Мебель'], insunits);
}

/** Тот же дом готовыми стенами — для примера без файла. */
export function sampleHouseProject() {
  const walls = [
    { id: 'w1', ax: 0.2, ay: 0.2, bx: 9.8, by: 0.2, t: 0.4 },
    { id: 'w2', ax: 9.8, ay: 0.2, bx: 9.8, by: 7.8, t: 0.4 },
    { id: 'w3', ax: 9.8, ay: 7.8, bx: 0.2, by: 7.8, t: 0.4 },
    { id: 'w4', ax: 0.2, ay: 7.8, bx: 0.2, by: 0.2, t: 0.4 },
    { id: 'w5', ax: 6, ay: 0.2, bx: 6, by: 7.8, t: 0.2 },
    { id: 'w6', ax: 0.2, ay: 4.4, bx: 6, by: 4.4, t: 0.2 },
  ];
  const openings = [
    { id: 'o1', wallId: 'w3', type: 'door', at: 7.3, w: 1, h: 2.1, sill: 0 },
    { id: 'o2', wallId: 'w5', type: 'door', at: 2, w: 0.9, h: 2.1, sill: 0 },
    { id: 'o3', wallId: 'w5', type: 'door', at: 5.6, w: 0.9, h: 2.1, sill: 0 },
    { id: 'o4', wallId: 'w1', type: 'window', at: 3, w: 1.5, h: 1.5, sill: 0.9 },
    { id: 'o5', wallId: 'w1', type: 'window', at: 7.75, w: 1.5, h: 1.5, sill: 0.9 },
    { id: 'o6', wallId: 'w2', type: 'window', at: 3.8, w: 1.8, h: 1.5, sill: 0.9 },
    { id: 'o7', wallId: 'w4', type: 'window', at: 1.9, w: 1.2, h: 1.5, sill: 0.9 },
    { id: 'o8', wallId: 'w4', type: 'window', at: 5.7, w: 1.2, h: 1.5, sill: 0.9 },
  ];
  return {
    v: 1, id: null, name: 'Пример: дом 10 × 8 м', floorHeight: 3, slab: 0.2, groundSlab: true,
    floors: [{ id: 'f1', name: '1 этаж', walls, openings }],
  };
}
