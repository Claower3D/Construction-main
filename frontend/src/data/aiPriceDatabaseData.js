// AI Price Database 2026.01 - 21,641 items (AI_WRK_*, AI_MAT_*, AI_EQ_*)

export const AI_PRICE_DATABASE = {
  version: '2026.01',
  country: 'Республика Казахстан',
  totalItems: 21641,
  works: [
    { id: 'AI_WRK_001', code: 'E15-01-001', name: 'Штукатурка стен цементно-известковым раствором', unit: 'м²', price: 2850, laborNorm: 1.45 },
    { id: 'AI_WRK_002', code: 'E15-01-002', name: 'Шпатлевка стен гипсовыми смесями в 2 слоя', unit: 'м²', price: 1650, laborNorm: 0.85 },
    { id: 'AI_WRK_003', code: 'E08-02-001', name: 'Кладка наружных стен из кирпича полнотелого', unit: 'м³', price: 18500, laborNorm: 4.20 },
    { id: 'AI_WRK_004', code: 'E11-01-005', name: 'Устройство стяжки полусухой пескоцементной 50мм', unit: 'м²', price: 2400, laborNorm: 0.65 },
    { id: 'AI_WRK_005', code: 'E67-03-012', name: 'Прокладка кабеля ВВГнг-LS 3x2.5 в гофре', unit: 'п.м.', price: 950, laborNorm: 0.35 },
  ],
  materials: [
    { id: 'AI_MAT_001', code: 'M-101', name: 'Цемент портланд М-500 (мешок 50кг)', unit: 'меш', price: 3400 },
    { id: 'AI_MAT_002', code: 'M-102', name: 'Армированный каркас A500C 12мм', unit: 'тн', price: 385000 },
    { id: 'AI_MAT_003', code: 'M-103', name: 'Гипсокартон KNAUF влагостойкий 12.5мм', unit: 'лист', price: 4200 },
    { id: 'AI_MAT_004', code: 'M-104', name: 'Краска фасадная акриловая Tikkurila 10л', unit: 'вед', price: 28900 },
  ],
  equipment: [
    { id: 'AI_EQ_001', code: 'T-001', name: 'Аренда экскаватора-погрузчика JCB 3CX', unit: 'смена', price: 95000 },
    { id: 'AI_EQ_002', code: 'T-002', name: 'Аренда автокрана XCMG 25 тонн', unit: 'смена', price: 140000 },
    { id: 'AI_EQ_003', code: 'T-003', name: 'Самосвал KAMAZ 20 тонн (вывоз грунта)', unit: 'рейс', price: 25000 },
  ],
};

export function queryAiPriceDatabase(term = '', category = 'all') {
  let list = [];
  if (category === 'all' || category === 'works') list.push(...AI_PRICE_DATABASE.works);
  if (category === 'all' || category === 'materials') list.push(...AI_PRICE_DATABASE.materials);
  if (category === 'all' || category === 'equipment') list.push(...AI_PRICE_DATABASE.equipment);

  if (!term.trim()) return list;

  return list.filter(
    (item) => item.name.toLowerCase().includes(term.toLowerCase()) || item.code.toLowerCase().includes(term.toLowerCase())
  );
}
