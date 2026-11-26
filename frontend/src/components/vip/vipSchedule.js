// Расчёты графика работ модуля «Строительство зданий и сооружений»: даты, сетка календаря,
// занятость бригад, проверка состава бригады. Без React и без обращения к серверу — проверяется тестами
// (npm run test:vip).

export const BRIGADE_PEOPLE = { min: 2, max: 4 };
export const BRIGADE_MACHINES = { min: 1, max: 2 };

export const STATUS = {
  plan: { label: 'Запланирована', short: 'План' },
  progress: { label: 'В работе', short: 'В работе' },
  done: { label: 'Выполнена', short: 'Готово' },
  hold: { label: 'Приостановлена', short: 'Пауза' },
};
export const STATUS_ORDER = ['plan', 'progress', 'done', 'hold'];

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const pad = (n) => String(n).padStart(2, '0');

/** «2026-11-24» → число дней от начала эпохи (полдень по UTC, чтобы часовой пояс не сдвигал дату) */
export function dayNumber(iso) {
  if (!isIso(iso)) return NaN;
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function isIso(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function isoFromDayNumber(n) {
  const t = new Date(n * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addDays(iso, n) {
  return isoFromDayNumber(dayNumber(iso) + n);
}

/** Сегодняшняя дата по часам устройства (местная, не UTC) */
export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Сколько календарных дней длится работа, считая оба края */
export function durationDays(start, end) {
  const a = dayNumber(start), b = dayNumber(end);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return b - a + 1;
}

/** «29 октября» / «29 окт» */
export function formatDay(iso, short = false) {
  if (!isIso(iso)) return '—';
  const [, m, d] = iso.split('-').map(Number);
  return short ? `${d} ${MONTHS_GEN[m - 1].slice(0, 3)}` : `${d} ${MONTHS_GEN[m - 1]}`;
}

/** «29 октября — 13 ноября», «10–20 ноября», «23 ноября» */
export function formatRange(start, end) {
  if (!isIso(start)) return '—';
  if (!isIso(end) || end === start) return formatDay(start);
  const [ys, ms] = start.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  if (ys === ye && ms === me) return `${Number(start.slice(8))}–${de} ${MONTHS_GEN[me - 1]}`;
  return `${formatDay(start)} — ${formatDay(end)}`;
}

/** Работа просрочена: срок вышел, а отметки «выполнена» нет */
export function isOverdue(work, today) {
  return work.status !== 'done' && work.status !== 'hold' && isIso(work.end) && work.end < today;
}

/** Статус, который подсказывают даты (для подсветки, сам статус ставит человек) */
export function suggestedStatus(work, today) {
  if (work.status === 'done' || work.status === 'hold') return work.status;
  if (!isIso(work.start) || !isIso(work.end)) return work.status || 'plan';
  if (today < work.start) return 'plan';
  return 'progress';
}

/**
 * Сетка графика: дни от начала проекта (или самой ранней работы) до самой поздней работы с запасом.
 * Возвращает { start, end, days: [{ iso, day, weekday, weekend, monthStart }], months: [{ key, label, span }] }.
 */
export function buildTimeline(project, today, pad_ = 3) {
  const works = (project.works || []).filter((w) => isIso(w.start) && isIso(w.end));
  const starts = works.map((w) => w.start);
  const ends = works.map((w) => w.end);
  for (const w of project.works || []) { if (isIso(w.factStart)) starts.push(w.factStart); if (isIso(w.factEnd)) ends.push(w.factEnd); }
  if (isIso(project.startDate)) starts.push(project.startDate);
  if (isIso(project.endDate)) ends.push(project.endDate);
  if (!starts.length) starts.push(today);
  if (!ends.length) ends.push(today);
  let start = starts.reduce((a, b) => (a < b ? a : b));
  let end = ends.reduce((a, b) => (a > b ? a : b));
  if (today >= start && today > end && dayNumber(today) - dayNumber(end) <= 31) end = today; // сегодняшний день виден
  end = addDays(end, pad_);
  // не длиннее двух лет: график из тысяч столбцов бесполезен и тормозит
  if (dayNumber(end) - dayNumber(start) > 730) end = addDays(start, 730);
  const restDay = restDayOf(project);
  const days = [];
  const months = [];
  for (let n = dayNumber(start); n <= dayNumber(end); n++) {
    const iso = isoFromDayNumber(n);
    const t = new Date(n * 86400000);
    const wd = t.getUTCDay();
    const key = iso.slice(0, 7);
    const last = months[months.length - 1];
    if (!last || last.key !== key) months.push({ key, label: `${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`, span: 1 });
    else last.span += 1;
    days.push({ iso, day: t.getUTCDate(), weekday: WEEKDAYS[wd], weekend: wd === 0 || wd === 6, rest: wd === restDay, monthStart: t.getUTCDate() === 1 });
  }
  return { start, end, days, months };
}

/** Положение полосы работы на графике: с какого столбца и сколько столбцов (обрезается по краям сетки) */
export function barPosition(work, timeline) {
  const t0 = dayNumber(timeline.start), t1 = dayNumber(timeline.end);
  const a = dayNumber(work.start), b = dayNumber(work.end);
  if (Number.isNaN(a) || Number.isNaN(b) || b < t0 || a > t1) return null;
  const from = Math.max(a, t0), to = Math.min(b, t1);
  return { offset: from - t0, span: to - from + 1, cutLeft: a < t0, cutRight: b > t1 };
}

const overlap = (a, b) => a.start <= b.end && b.start <= a.end;

/**
 * Пересечения по времени у одной бригады: Map(workId → [названия работ, с которыми она пересекается]).
 * Приостановленные работы не считаются.
 */
export function brigadeConflicts(project) {
  const out = new Map();
  const byBrigade = new Map();
  for (const w of project.works || []) {
    if (!w.brigadeId || w.status === 'hold' || !isIso(w.start) || !isIso(w.end)) continue;
    if (!byBrigade.has(w.brigadeId)) byBrigade.set(w.brigadeId, []);
    byBrigade.get(w.brigadeId).push(w);
  }
  for (const list of byBrigade.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (!overlap(list[i], list[j])) continue;
        out.set(list[i].id, [...(out.get(list[i].id) || []), list[j].title]);
        out.set(list[j].id, [...(out.get(list[j].id) || []), list[i].title]);
      }
    }
  }
  return out;
}

/** Замечания к составу бригады по правилу «2–4 человека, 1–2 единицы техники» */
export function brigadeIssues(brigade) {
  const issues = [];
  const people = (brigade.members || []).length;
  const machines = (brigade.equipment || []).length;
  if (people < BRIGADE_PEOPLE.min) issues.push(`мало людей: ${people} из ${BRIGADE_PEOPLE.min}–${BRIGADE_PEOPLE.max}`);
  if (people > BRIGADE_PEOPLE.max) issues.push(`много людей: ${people} при норме ${BRIGADE_PEOPLE.min}–${BRIGADE_PEOPLE.max}`);
  if (machines < BRIGADE_MACHINES.min) issues.push('нет техники');
  if (machines > BRIGADE_MACHINES.max) issues.push(`много техники: ${machines} при норме ${BRIGADE_MACHINES.min}–${BRIGADE_MACHINES.max}`);
  return issues;
}

/**
 * Кто где числится: люди и техника в нескольких бригадах сразу и не распределённые.
 * Возвращает { peopleTwice: [id], machinesTwice: [id], freePeople: [id], freeMachines: [id], brigadeOf: Map(personId → brigade), machineBrigade: Map }
 */
export function assignmentReport(project) {
  const count = new Map(), mcount = new Map();
  const brigadeOf = new Map(), machineBrigade = new Map();
  for (const b of project.brigades || []) {
    for (const id of b.members || []) { count.set(id, (count.get(id) || 0) + 1); if (!brigadeOf.has(id)) brigadeOf.set(id, b); }
    for (const id of b.equipment || []) { mcount.set(id, (mcount.get(id) || 0) + 1); if (!machineBrigade.has(id)) machineBrigade.set(id, b); }
  }
  return {
    peopleTwice: [...count].filter(([, n]) => n > 1).map(([id]) => id),
    machinesTwice: [...mcount].filter(([, n]) => n > 1).map(([id]) => id),
    freePeople: (project.staff || []).filter((p) => !count.has(p.id)).map((p) => p.id),
    freeMachines: (project.equipment || []).filter((m) => !mcount.has(m.id)).map((m) => m.id),
    brigadeOf,
    machineBrigade,
  };
}

/** Сводка проекта для шапки */
export function projectSummary(project, today) {
  const works = project.works || [];
  const by = { plan: 0, progress: 0, done: 0, hold: 0 };
  let overdue = 0, media = 0, check = 0;
  for (const w of works) {
    by[STATUS[w.status] ? w.status : 'plan'] += 1;
    if (isOverdue(w, today)) overdue += 1;
    if (w.check) check += 1;
    media += (w.media || []).length;
  }
  const dated = works.filter((w) => isIso(w.start) && isIso(w.end));
  return {
    total: works.length, ...by, overdue, media, check,
    first: dated.length ? dated.map((w) => w.start).reduce((a, b) => (a < b ? a : b)) : '',
    last: dated.length ? dated.map((w) => w.end).reduce((a, b) => (a > b ? a : b)) : '',
    donePct: works.length ? Math.round((by.done / works.length) * 100) : 0,
  };
}

/** Короткое имя: «Барбашин Максим Владимирович» → «Барбашин М. В.» */
export function shortName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || '';
  return `${parts[0]} ${parts.slice(1).map((p) => `${p[0].toUpperCase()}.`).join(' ')}`;
}

/** Новый номер записи, не совпадающий с уже занятыми */
export function nextId(prefix, items) {
  const used = new Set((items || []).map((x) => x.id));
  let n = (items || []).length + 1;
  while (used.has(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

/** Пустой проект */
export function emptyProject(name, today) {
  return {
    name, object: '', address: '', startDate: today, endDate: '', note: '',
    client: { name: '' }, contractor: { name: '' }, invoice: { number: '', date: '', amount: 0 },
    staff: [], equipment: [], brigades: [], works: [],
  };
}

/** Проверка файла проекта перед загрузкой на сервер: понятная причина или пустая строка */
export function importProblem(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'Файл не похож на проект: ожидается объект с полями name, works, staff';
  if (!String(doc.name || '').trim()) return 'В файле нет названия проекта (поле name)';
  for (const key of ['works', 'staff', 'equipment', 'brigades']) {
    if (doc[key] != null && !Array.isArray(doc[key])) return `Поле ${key} в файле должно быть списком`;
  }
  for (const w of doc.works || []) {
    if (!String(w.title || '').trim()) return 'В файле есть работа без названия';
    if (!isIso(w.start) || !isIso(w.end)) return `У работы «${w.title}» нет дат начала и окончания`;
    if (w.end < w.start) return `У работы «${w.title}» дата окончания раньше начала`;
  }
  return '';
}

// ── Выходной день ──
export const WEEKDAY_NAMES = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

/** Выходной день недели в проекте: 0 — воскресенье (по умолчанию) … 6 — суббота */
export function restDayOf(project) {
  const n = Number(project && project.restDay);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : 0;
}

// ── Календарь по факту ──
/**
 * Фактические сроки работы: { start, end, running, shift }.
 * Начало — отметка «начали» или плановая дата; окончание — отметка «закончили», у идущей работы — сегодня,
 * у выполненной без отметки — плановая дата. Запланированные и приостановленные без отметок — null.
 * shift — на сколько дней окончание позже (+) или раньше (−) плана; у идущей считается только опоздание.
 */
export function factRange(work, today) {
  const started = isIso(work.factStart);
  if (!started && work.status !== 'progress' && work.status !== 'done') return null;
  let start = started ? work.factStart : work.start;
  if (!isIso(start)) return null;
  if (!started && start > today) start = today; // «в работе» раньше плановой даты
  const running = work.status !== 'done' && !isIso(work.factEnd);
  let end = isIso(work.factEnd) ? work.factEnd : running ? today : work.end;
  if (!isIso(end) || end < start) end = start;
  const diff = isIso(work.end) ? dayNumber(end) - dayNumber(work.end) : 0;
  return { start, end, running, shift: running ? Math.max(0, diff) : diff };
}

// ── Бюджет на строительство ──
/** { budget, planned, paid, doneCost, left, paidPct, unpriced } — суммы в тенге */
export function budgetSummary(project) {
  const works = project.works || [];
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);
  const planned = works.reduce((s, w) => s + num(w.cost), 0);
  const paid = works.reduce((s, w) => s + num(w.paid), 0);
  const doneCost = works.filter((w) => w.status === 'done').reduce((s, w) => s + num(w.cost), 0);
  const budget = num(project.budget) || num(project.invoice && project.invoice.amount) || planned;
  return {
    budget, planned, paid, doneCost,
    left: budget - paid,
    paidPct: budget ? Math.min(100, Math.round((paid / budget) * 100)) : 0,
    donePct: budget ? Math.min(100, Math.round((doneCost / budget) * 100)) : 0,
    unpriced: works.filter((w) => !num(w.cost)).length,
  };
}

/** «12 500 000 ₸» */
export function money(n) {
  return `${Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`;
}

// ── Подгруппы техники ──
export const MACHINE_GROUPS = [
  { id: 'crane', label: 'Краны' },
  { id: 'manipulator', label: 'Манипуляторы' },
  { id: 'lift', label: 'Автовышки и подъёмники' },
  { id: 'truck', label: 'Автомобили' },
  { id: 'earth', label: 'Землеройная техника' },
  { id: 'other', label: 'Прочая техника' },
];
const MACHINE_RULES = [
  ['manipulator', /манипулятор|кму|борт.*кран|самопогруз/],
  ['lift', /вышк|подъ[её]мник|агп|люльк|ножнич|телескоп|jgk/],
  ['crane', /кран|\bqy\s?\d|xzj\d/],
  ['earth', /экскаватор|бульдозер|погрузчик|грейдер|каток|трактор|бобкэт|bobcat|jcb|мини-?погруз|ямобур|бур/],
  ['truck', /камаз|самосвал|газел|грузов|автомоб|машин|фургон|тягач|бортов|пикап|легков|микроавтобус|toyota|hyundai|isuzu|howo|shacman|зил|газ\b|уаз|лада|нива|subaru|mitsubishi|nissan|kia\b|lexus|ford|chevrolet|volkswagen|mercedes|bmw|audi|honda|mazda|renault|daewoo|dongfeng|faw\b|foton|jac\b/],
];

/** Подгруппа техники по названию (когда она не выбрана вручную) */
export function guessMachineGroup(name) {
  const s = String(name || '').toLowerCase();
  for (const [id, re] of MACHINE_RULES) if (re.test(s)) return id;
  return 'other';
}
export const machineGroup = (m) => (m && MACHINE_GROUPS.some((g) => g.id === m.group) ? m.group : guessMachineGroup(m && m.name));

// ── Виды работ (для картинки на графике) ──
export const WORK_KINDS = [
  { id: 'steel', label: 'Металлоконструкции' },
  { id: 'roof', label: 'Кровля' },
  { id: 'walls', label: 'Стены и панели' },
  { id: 'concrete', label: 'Бетон и фундамент' },
  { id: 'floor', label: 'Полы' },
  { id: 'earth', label: 'Земляные работы' },
  { id: 'drain', label: 'Вода, ливнёвка, канализация' },
  { id: 'electric', label: 'Электрика' },
  { id: 'vent', label: 'Вентиляция и отопление' },
  { id: 'cut', label: 'Резка и отверстия' },
  { id: 'weld', label: 'Сварка' },
  { id: 'paint', label: 'Покраска и отделка' },
  { id: 'doors', label: 'Ворота, двери, окна' },
  { id: 'lift', label: 'Подъём и монтаж краном' },
  { id: 'other', label: 'Другие работы' },
];
const WORK_RULES = [
  ['cut', /резк|отверст|алмазн|сверл|штроб/],
  ['drain', /ливн|канализ|септик|водопровод|водосток|водоотв|колод|дренаж|труб|сантех/],
  ['roof', /кровл|крыш|конёк|конек|мембран/],
  ['weld', /свар/],
  ['electric', /электр|кабел|освещ|щит|провод|заземл|молниезащ/],
  ['vent', /вентил|отоплен|воздуховод|кондицион|дымоуд/],
  ['doors', /ворот|двер|окн|витраж|остеклен/],
  ['walls', /сэндвич|сендвич|панел|профлист|стен|кладк|обшивк|фасад|перегород/],
  ['floor', /пол\b|полы|полов|стяжк|топпинг|покрыти/],
  ['concrete', /бетон|фундамент|опалуб|армир|залив|плит|ростверк|анкер/],
  ['earth', /грунт|котлован|землян|планировк|отсыпк|траншe|транше|засыпк/],
  ['steel', /металлоконстр|каркас|колонн|ферм|балк|прогон|связ|монтаж мк|\bмк\b|стальн|лестни|рельс/],
  ['paint', /покрас|окрас|грунтов|огнезащ|отделк|штукат|шпакл/],
  ['lift', /кран|подъ[её]м|разгруз|погруз|монтаж/],
];

/** Вид работ по названию (когда он не выбран вручную) */
export function guessWorkKind(title) {
  const s = String(title || '').toLowerCase();
  for (const [id, re] of WORK_RULES) if (re.test(s)) return id;
  return 'other';
}
export const workKind = (w) => (w && WORK_KINDS.some((k) => k.id === w.kind) ? w.kind : guessWorkKind(w && w.title));

/** Картинка работы на графике: последнее фото или null (тогда рисуется значок вида работ) */
export function workPicture(work) {
  const photos = (work.media || []).filter((m) => m.kind !== 'video' && m.url);
  return photos.length ? photos[photos.length - 1].url : null;
}

// ── Люди ──
/** Инициалы для кружка вместо фото: «Барбашин Максим Владимирович» → «БМ» */
export function initials(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}
/** Постоянный оттенок кружка по имени (0…359) */
export function nameHue(full) {
  let h = 0;
  for (const ch of String(full || '')) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

// ── Места на модели ангара 25 × 70 м ──
export const HANGAR = { width: 25, length: 70, eave: 20, ridge: 23, bays: 10 };
export const HANGAR_ZONES = [
  { id: 'all', label: 'Всё здание' },
  { id: 'frame', label: 'Каркас' },
  { id: 'roof', label: 'Кровля' },
  { id: 'wall-n', label: 'Стена длинная, северная' },
  { id: 'wall-s', label: 'Стена длинная, южная' },
  { id: 'wall-w', label: 'Торец западный' },
  { id: 'wall-e', label: 'Торец восточный' },
  { id: 'floor', label: 'Пол' },
  { id: 'outside', label: 'Площадка вокруг' },
];
const KIND_ZONE = { roof: 'roof', steel: 'frame', weld: 'frame', floor: 'floor', concrete: 'floor', earth: 'outside', drain: 'outside', walls: 'wall-s', doors: 'wall-w', lift: 'frame' };

/** Место работы на модели: выбранное вручную или подсказанное видом работ и текстом «места» */
export function workZone(work) {
  if (work && HANGAR_ZONES.some((z) => z.id === work.zone)) return work.zone;
  const s = `${(work && work.place) || ''} ${(work && work.title) || ''}`.toLowerCase();
  if (/кровл|крыш|конёк|конек/.test(s)) return 'roof';
  if (/торец/.test(s)) return /вост/.test(s) ? 'wall-e' : 'wall-w';
  if (/север/.test(s)) return 'wall-n';
  if (/юж/.test(s)) return 'wall-s';
  if (/\bпол\b|полы|стяжк/.test(s)) return 'floor';
  if (/снаружи|улиц|площадк|территор|ливн|колод|траншe|транше/.test(s)) return 'outside';
  return KIND_ZONE[workKind(work)] || 'all';
}

/**
 * Календарь по факту по дням: { 'ГГГГ-ММ-ДД': [{ work, fact, running, late }] }.
 * late — этот день позже планового окончания работы. Не длиннее двух лет на работу.
 */
export function buildFactDays(project, today) {
  const out = {};
  for (const work of (project && project.works) || []) {
    const fact = factRange(work, today);
    if (!fact) continue;
    const a = dayNumber(fact.start), b = Math.min(dayNumber(fact.end), a + 730);
    for (let n = a; n <= b; n++) {
      const iso = isoFromDayNumber(n);
      (out[iso] = out[iso] || []).push({ work, fact, running: fact.running, late: isIso(work.end) && iso > work.end });
    }
  }
  for (const list of Object.values(out)) list.sort((x, y) => Number(y.late) - Number(x.late) || String(x.work.start).localeCompare(String(y.work.start)));
  return out;
}
