// Клиент сметы QazGost: технологические карты, расчёт, экспорт.
import { csvCell } from '../../services/platformUtils';

let techmapsPromise = null;

export function loadTechmaps() {
  if (!techmapsPromise) {
    techmapsPromise = fetch('/api/v1/estimate/techmaps')
      .then((r) => {
        if (!r.ok) throw new Error(`Справочник техкарт недоступен (${r.status})`);
        return r.json();
      })
      .catch((err) => {
        techmapsPromise = null; // следующая попытка запросит снова
        throw err;
      });
  }
  return techmapsPromise;
}

export async function calcSmeta(body) {
  let res;
  try {
    res = await fetch('/api/v1/estimate/calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Нет связи с сервером расчёта. Проверьте интернет и повторите.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Сервер расчёта ответил ошибкой ${res.status}`);
  }
  return data;
}

export const fmt = (v) => Math.round(Number(v) || 0).toLocaleString('ru-RU');

export const fmtQty = (v) => {
  const n = Number(v) || 0;
  return Number.isInteger(n) ? n.toLocaleString('ru-RU') : n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
};

// Значение параметра: ввод пользователя → параметр комплекса → значение по умолчанию техкарты.
export function paramValue(values, scope, part, param, overrides) {
  const key = scope === part ? param.key : `${part}.${param.key}`;
  const v = values?.[scope]?.[key];
  if (v !== undefined && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  const ov = overrides?.[part]?.[param.key];
  return ov !== undefined ? ov : param.default;
}

// Определение вида работ по описанию — когда пользователь не выбрал категорию.
const KEYWORDS = [
  ['bathroom', /(ванн(ая|ой|ую)|санузел|санузл|туалет)/i],
  ['apartment_renovation', /(ремонт\s+квартир|квартир\w*\s+под\s+ремонт|ремонт\s+\d+-?комн)/i],
  ['house_build', /(постро\w+\s+дом|строительств\w*\s+дом|дом\s+с\s+нуля)/i],
  ['facade_renovation', /(фасад)/i],
  ['roof', /(кровл|крыш)/i],
  ['foundation', /(фундамент)/i],
  ['earth', /(котлован|транше|земляны)/i],
  ['masonry', /(кладк|газоблок|кирпичн\w+\s+стен)/i],
  ['concrete', /(монолит|бетонн\w+\s+плит|перекрыти)/i],
  ['floors', /(ламинат|стяжк|полы?\b|плитк\w*\s+на\s+пол|керамогранит)/i],
  ['ceilings', /(потол)/i],
  ['wall_finish', /(обо[ия]|покраск|штукатур|шпакл[её]в|стен)/i],
  ['electric', /(электр|розетк|проводк|щит)/i],
  ['plumbing', /(сантех|водопровод|унитаз|смесител|труб)/i],
  ['heating', /(отоплен|радиатор|батаре)/i],
  ['hvac', /(кондиц|вентиляц|сплит)/i],
  ['gas', /(газ\b|газопровод|газов)/i],
  ['windows', /(окн[оаы])/i],
  ['interior', /(двер|мебел|кухн)/i],
  ['landscaping', /(брусчатк|тротуарн|мощени)/i],
  ['roads', /(асфальт|дорог)/i],
  ['metal', /(навес|металлоконстр)/i],
  ['design', /(дизайн)/i],
  ['demolition', /(демонтаж|снос)/i],
];

export function detectCategory(text) {
  const t = String(text || '');
  for (const [id, re] of KEYWORDS) {
    const m = t.match(re);
    if (m) return { id, word: m[0] };
  }
  return null;
}

const SCN_NAME = { eco: 'Эконом', std: 'Стандарт', prem: 'Премиум' };

export function smetaToCSV(result, scenarioId) {
  const sc = result.scenarios.find((s) => s.id === scenarioId) || result.scenarios[1];
  const row = (...cells) => cells.map(csvCell).join(';');
  const g = result.geometry;
  const lines = [
    row(`СМЕТА QazGost — ${result.title} (${SCN_NAME[sc.id] || sc.name})`),
    row('Город', `${result.city} (коэффициент ${result.regionCoef})`),
    row('Цены на', result.priceDate),
    row('Площадь, м²', g.area, 'Периметр, м', g.perimeter, 'Высота, м', g.height, 'Стены за вычетом проёмов, м²', g.wallArea),
    row('Дата расчёта', new Date().toLocaleDateString('ru-RU')),
    '',
    row('№', 'Раздел', 'Этап', 'Наименование', 'Кол-во', 'Ед.', 'Цена, ₸', 'Сумма, ₸', 'Вид', 'Источник цены', 'Ссылка', 'Как посчитан объём'),
  ];
  sc.items.forEach((it, i) => {
    lines.push(row(i + 1, it.category, it.stage, it.name, it.qty, it.unit, it.price, it.total,
      it.kind === 'material' ? 'материал' : it.kind === 'equipment' ? 'техника' : 'работа',
      it.verified ? it.source : `${it.source}: ${it.note || ''}`, it.url || '', it.why));
  });
  lines.push('');
  lines.push(row('', '', '', 'Работы', '', '', '', sc.works));
  lines.push(row('', '', '', 'Материалы', '', '', '', sc.materials));
  if (sc.equipment) lines.push(row('', '', '', 'Техника', '', '', '', sc.equipment));
  lines.push(row('', '', '', 'Итого по смете', '', '', '', sc.subtotal));
  lines.push(row('', '', '', 'Резерв 10%', '', '', '', sc.reserve));
  lines.push(row('', '', '', 'Бюджет с резервом', '', '', '', sc.total));

  const purchases = result.purchases?.[sc.id];
  if (purchases?.length) {
    lines.push('', row('ВЕДОМОСТЬ ЗАКУПКИ'), row('Материал', 'Кол-во', 'Ед.', 'Цена, ₸', 'Сумма, ₸', 'Где смотрели цену', 'Ссылка'));
    purchases.forEach((p) => lines.push(row(p.name, p.qty, p.unit, p.price, p.total, p.source, p.url || '')));
  }
  const sched = result.schedule?.[sc.id];
  if (sched?.stages?.length) {
    lines.push('', row('ГРАФИК РАБОТ'), row('Раздел', 'Этап', 'Начало, день', 'Длительность, дн', 'Перерыв, дн'));
    sched.stages.forEach((s) => lines.push(row(s.category, s.stage, s.start + 1, s.days, s.wait || '')));
    lines.push(row('Итого, дней', sched.days));
  }
  lines.push('', row('Допущения'));
  (result.assumptions || []).forEach((a) => lines.push(row(a)));
  return '﻿' + lines.join('\r\n');
}

export function downloadText(text, filename, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
