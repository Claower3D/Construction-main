// Расчёт ремонта трещин по длине: работа за погонный метр + материалы по нормам расхода.
// Цены берутся из каталога платформы (/api/v1/prices) с коэффициентом города;
// если каталог недоступен — из снимка ниже (каталог на ноябрь 2026), о чём экран предупреждает.
//
// Нормы расхода на 1 м трещины — практические, для расшивки шва примерно 10×10 мм
// и полосы отделки шириной около 20 см. Это ориентир для закупки, не проектная смета.

const PRIMER = { code: 'mat_dmx_primer_deep_5l', query: 'Грунтовка глубокого проникновения (5л)', name: 'Грунтовка глубокого проникновения', per: 0.03, unit: 'л', pack: 5, packName: 'канистра 5 л', price: 1800 };

export const SURFACES = [
  {
    id: 'plaster',
    label: 'Штукатурка',
    method: 'Расшить трещину, прогрунтовать, заполнить шпаклёвкой, проклеить серпянкой и вывести финишным слоем.',
    work: { code: 'wrk_plst_repair_crack', query: 'Ремонт трещин в штукатурке', name: 'Ремонт трещин в штукатурке', price: 600 },
    materials: [
      PRIMER,
      { code: 'mat_dmx_putty_gypsum_base', query: 'Шпаклёвка гипсовая базовая (25кг)', name: 'Шпаклёвка гипсовая базовая', per: 0.4, unit: 'кг', pack: 25, packName: 'мешок 25 кг', price: 1500 },
      { code: 'tape_gkl_serpyanka_50mm_45m', query: 'Серпянка самоклейка 50мм (45м)', name: 'Серпянка самоклеящаяся 50 мм', per: 1.1, unit: 'м', pack: 45, packName: 'рулон 45 м', price: 480 },
      { code: 'mat_dmx_putty_gypsum_finish', query: 'Шпаклёвка гипсовая финишная (25кг)', name: 'Шпаклёвка гипсовая финишная', per: 0.25, unit: 'кг', pack: 25, packName: 'мешок 25 кг', price: 2000 },
    ],
  },
  {
    id: 'concrete',
    label: 'Бетон',
    method: 'Расшить и обеспылить трещину, прогрунтовать, заполнить конструкционной ремонтной смесью. Сквозные и растущие трещины — только после осмотра инженером.',
    work: { code: 'wrk_conc_repair_crack', query: 'Ремонт трещин в бетоне (инъекция)', name: 'Ремонт трещин в бетоне', price: 3000 },
    materials: [
      PRIMER,
      { code: 'repair_structural_25', query: 'Ремонтная смесь конструкционная (25кг)', name: 'Ремонтная смесь конструкционная', per: 0.5, unit: 'кг', pack: 25, packName: 'мешок 25 кг', price: 4800 },
    ],
  },
  {
    id: 'masonry',
    label: 'Кладка',
    method: 'Расчистить шов на глубину 2–3 см, прогрунтовать и заполнить быстротвердеющей ремонтной смесью.',
    work: { code: 'wrk_rf_masonry_repoint', query: 'Расшивка и заделка трещин в кладке', name: 'Расшивка и заделка трещин в кладке', price: 1500 },
    materials: [
      PRIMER,
      {
        code: 'repair_fast_25', query: 'Ремонтная смесь быстротв. (25кг)', name: 'Ремонтная смесь быстротвердеющая', per: 0.8, unit: 'кг', pack: 25, packName: 'мешок 25 кг', price: 3000,
        // на короткую трещину хватает малой фасовки
        small: { code: 'repair_fast_5', query: 'Ремонтная смесь быстротв. (5кг)', pack: 5, packName: 'пакет 5 кг', price: 900 },
      },
    ],
  },
];

export const surfaceById = (id) => SURFACES.find((s) => s.id === id) || SURFACES[0];

/** Цены каталога для всех позиций: { код: цена }. Ошибки сети не бросает — вернёт что успел. */
export async function loadCatalogPrices(city) {
  const items = new Map();
  SURFACES.forEach((s) => [s.work, ...s.materials].forEach((it) => {
    items.set(it.code, it);
    if (it.small) items.set(it.small.code, it.small);
  }));
  const out = {};
  await Promise.all([...items.values()].map(async (it) => {
    try {
      const qs = new URLSearchParams({ q: it.query, limit: '20' });
      if (city) qs.set('region', city);
      const res = await fetch(`/api/v1/prices?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const hit = (data.items || []).find((x) => x.code === it.code);
      if (hit && Number(hit.price) > 0) out[it.code] = Number(hit.price);
    } catch (e) { /* останется цена из снимка */ }
  }));
  return out;
}

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Смета ремонта. lengthBySurface — длина трещин по типам поверхности, м: { plaster: 1.4, concrete: 0.6 }.
 * Материалы продаются упаковками, поэтому расход по всем участкам складывается
 * и стоимость считается по целым упаковкам.
 */
export function calcRepair(lengthBySurface, prices = {}) {
  const priceOf = (it) => (prices[it.code] > 0 ? prices[it.code] : it.price);
  const works = [];
  const need = new Map(); // код материала → { позиция, расход }
  let lengthM = 0;
  SURFACES.forEach((s) => {
    const L = Math.max(0, Number(lengthBySurface[s.id]) || 0);
    if (L <= 0) return;
    lengthM += L;
    const price = priceOf(s.work);
    works.push({ code: s.work.code, name: s.work.name, surface: s.label, qty: round1(L), unit: 'м', price, cost: Math.round(L * price), fromCatalog: prices[s.work.code] > 0 });
    s.materials.forEach((m) => {
      const cur = need.get(m.code) || { item: m, qty: 0 };
      cur.qty += m.per * L;
      need.set(m.code, cur);
    });
  });
  const materials = [...need.values()].map(({ item: m, qty }) => {
    // малая фасовка, если расхода хватает на одну-две такие упаковки
    const p = m.small && qty <= m.small.pack * 2 ? m.small : m;
    const packs = Math.max(1, Math.ceil(qty / p.pack - 1e-9));
    const price = priceOf(p);
    return { code: m.code, name: m.name, need: round2(qty), unit: m.unit, packs, packName: p.packName, price, cost: packs * price, fromCatalog: prices[p.code] > 0 };
  });
  const materialsCost = materials.reduce((sum, m) => sum + m.cost, 0);
  const worksCost = works.reduce((sum, w) => sum + w.cost, 0);
  return { lengthM: round1(lengthM), works, materials, materialsCost, worksCost, total: materialsCost + worksCost };
}

// Угол обзора основной камеры телефона по длинной стороне кадра ≈ 66° (эквивалент 26–28 мм).
// Длинная сторона кадра на стене = 2·d·tan(33°) ≈ 1,3·d. Разброс между телефонами — до ±20%.
const LONG_SIDE_PER_METER = 2 * Math.tan((33 * Math.PI) / 180);

/** Длина трещины по рамке (доли кадра) при съёмке с расстояния distanceM, м. Трещина ≈ диагональ рамки. */
export function crackLengthM(box, frameW, frameH, distanceM) {
  const longPx = Math.max(frameW, frameH);
  if (!longPx) return 0;
  const mPerPx = (LONG_SIDE_PER_METER * distanceM) / longPx;
  return Math.hypot(box.w * frameW, box.h * frameH) * mPerPx;
}
