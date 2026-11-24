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
    days.push({ iso, day: t.getUTCDate(), weekday: WEEKDAYS[wd], weekend: wd === 0 || wd === 6, monthStart: t.getUTCDate() === 1 });
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
