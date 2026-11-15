// Заключение по трещинам, найденным на фото: класс, категория состояния, что делать, смета.
// Работы и материалы считаются от измеренной длины и раскрытия; цены — из базы сметы сайта
// (data/estimateTemplates.js). То, чему в базе цены нет, помечено «по осмотру», без выдуманных сумм.

const RANK = { low: 1, medium: 2, high: 3, critical: 4 };

// Цены из базы сметы сайта
const PRICE_INJECTION_PER_M = 16000; // «Инъекционная гидроизоляция трещин», ₸/п.м
const PRICE_EPOXY_PER_KG = 4200;     // «Эпоксидный состав», ₸/кг
const PRICE_PACKER = 1070;           // пакер инъекционный d=10 мм, ₸/шт (12 800 ₸ за 12 шт)
const PACKER_STEP_M = 0.25;          // пакеры через 20–30 см вдоль трещины
const INJECT_DEPTH_M = 0.1;          // глубина заполнения при инъектировании, м
const EPOXY_KG_PER_L = 1.1;

export const NORMS = 'ГОСТ 31937 «Правила обследования и мониторинга технического состояния»; СП РК EN 1992-1-1:2004/2011, п. 7.3 — ограничение раскрытия трещин (обычно до 0,3 мм)';

const STATE = {
  critical: 'Аварийное — опасность обрушения или разрушения элемента; ограничить эксплуатацию до обследования',
  high: 'Ограниченно-работоспособное — нужен ремонт и контроль раскрытия',
  medium: 'Работоспособное — нужен ремонт, чтобы влага не проникала к арматуре',
  low: 'Нормативное или работоспособное — раскрытие в допустимых пределах',
};

const REBAR = {
  critical: 'Высокий: через раскрытую трещину вода и соли попадают прямо к арматуре — коррозия идёт быстро',
  high: 'Повышенный: раскрытие больше 1 мм — влага доходит до арматуры',
  medium: 'Умеренный: раскрытие больше допустимых 0,3 мм — со временем возможна коррозия',
  low: 'Низкий: раскрытие в пределах допустимого',
};

const FIX = {
  critical: 'Срочно вызвать специализированную организацию для обследования по ГОСТ 31937 и выяснить причину (осадка, перегрузка, промерзание, удар). До решения — оградить место и ограничить нагрузку. Сборный элемент (кольцо колодца, плиту, перемычку) с раскрытой трещиной, как правило, заменяют или усиливают обоймой; инъектирование — только как временная мера.',
  high: 'Установить маяки и 2–4 недели наблюдать, растёт ли раскрытие. Если трещина не растёт — расшить, инъектировать эпоксидным составом под давлением через пакеры и восстановить защитный слой. Если растёт — нужно обследование и усиление конструкции.',
  medium: 'Расшить трещину и заполнить её низковязким эпоксидным составом (инъектирование), затем восстановить защитный слой ремонтной смесью, чтобы влага не попадала к арматуре.',
  low: 'Волосяные трещины в пределах допуска: расшить и затереть ремонтным составом при ближайшей отделке; при появлении новых трещин — поставить маяки.',
};

const SEVERITY_TEXT = {
  critical: '5 класс — КРИТИЧЕСКИЙ: раскрытая трещина более 3 мм',
  high: '4 класс — Высокий: раскрытие 1–3 мм',
  medium: '3 класс — Средний: раскрытие 0,3–1 мм',
  low: '2 класс — Низкий: раскрытие до 0,3 мм',
};

const round1 = (v) => Math.round(v * 10) / 10;

/**
 * @param items  зоны трещин (regions из detectCracks)
 * @param opts.scaleAssumed  ширина кадра не указана и взята по умолчанию
 * @param opts.spanMm        ширина кадра, мм
 */
export function buildCrackReport(items, { scaleAssumed = false, spanMm = 1500 } = {}) {
  const cracks = items.filter((it) => it && it.severity);
  if (!cracks.length) return null;
  const top = cracks.reduce((a, b) => (RANK[b.severity] > RANK[a.severity] ? b : a));
  const sev = top.severity;

  const totalLenM = cracks.reduce((s, c) => s + (c.length_mm || 0), 0) / 1000;
  const repairLenM = cracks.filter((c) => RANK[c.severity] >= 2).reduce((s, c) => s + (c.length_mm || 0), 0) / 1000;
  const hairLenM = Math.max(0, totalLenM - repairLenM);
  const maxOpen = Math.max(0, ...cracks.map((c) => c.opening_mm || 0));

  const materials = [];
  const labor = [];
  if (repairLenM > 0) {
    // объём заполнения: длина × среднее раскрытие × глубина
    const vol = cracks.filter((c) => RANK[c.severity] >= 2)
      .reduce((s, c) => s + (c.length_mm || 0) / 1000 * (c.opening_mean_mm || c.opening_mm || 1) / 1000 * INJECT_DEPTH_M, 0);
    const epoxyKg = Math.max(0.5, round1(vol * 1000 * EPOXY_KG_PER_L * 1.2)); // +20% потери
    const packers = Math.max(2, Math.ceil(repairLenM / PACKER_STEP_M));
    materials.push({ name: 'Эпоксидный инъекционный состав', qty: `${epoxyKg} кг`, cost_kzt: Math.round(epoxyKg * PRICE_EPOXY_PER_KG) });
    materials.push({ name: 'Пакеры инъекционные d=10 мм', qty: `${packers} шт`, cost_kzt: packers * PRICE_PACKER });
    labor.push({ name: 'Расшивка и инъектирование трещин под давлением', qty: `${round1(repairLenM)} п.м`, cost_kzt: Math.round(repairLenM * PRICE_INJECTION_PER_M) });
  }
  if (hairLenM > 0) {
    labor.push({ name: 'Расшивка и затирка волосяных трещин ремонтным составом', qty: `${round1(hairLenM)} п.м`, cost_kzt: null });
  }
  if (RANK[sev] >= 3) {
    labor.push({ name: 'Установка маяков и наблюдение за раскрытием (2–4 недели)', qty: `${Math.max(2, cracks.length * 2)} шт`, cost_kzt: null });
  }
  if (sev === 'critical') {
    labor.push({ name: 'Обследование специализированной организацией (ГОСТ 31937)', qty: '1 объект', cost_kzt: null });
    labor.push({ name: 'Замена или усиление повреждённого элемента — по проекту', qty: 'по обследованию', cost_kzt: null });
  }
  const priced = [...materials, ...labor].filter((x) => x.cost_kzt != null);
  const total = priced.reduce((s, x) => s + x.cost_kzt, 0);
  const unpriced = [...materials, ...labor].some((x) => x.cost_kzt == null);

  // Профиль раскрытия — по самой опасной трещине
  const profileSrc = cracks.filter((c) => Array.isArray(c.width_profile) && c.width_profile.length > 1)
    .sort((a, b) => (b.opening_mm || 0) - (a.opening_mm || 0))[0];

  const assumed = scaleAssumed ? ` (при ширине кадра ≈ ${round1(spanMm / 1000)} м — укажите реальную, чтобы уточнить)` : '';
  const estimatedCost = total > 0
    ? `≈ ${total.toLocaleString('ru-RU')} ₸ за инъектирование${unpriced ? ' + работы по осмотру' : ''}${assumed}`
    : 'По осмотру — расценок на эти работы в базе нет';

  return {
    defectType: `Трещины: ${cracks.length} шт., общая длина ≈ ${round1(totalLenM)} м, наибольшее раскрытие ≈ ${maxOpen} мм${scaleAssumed ? ' (оценка)' : ''}`,
    severity: SEVERITY_TEXT[sev] + (scaleAssumed ? ' (оценка без замера)' : ''),
    snipCode: NORMS,
    fixMethod: FIX[sev],
    estimatedCost,
    workDays: sev === 'critical' ? null : Math.max(1, Math.ceil(totalLenM / 5)),
    analytics: {
      materials,
      labor,
      total_cost_kzt: total,
      width_profile: profileSrc ? profileSrc.width_profile : null,
      gost_status: `Категория: ${STATE[sev]}`,
      rebar_risk: REBAR[sev],
    },
  };
}
