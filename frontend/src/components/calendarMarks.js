// Отметки в календаре сверх самой заявки: период «с — по», выезд, дни работ (по этапам), сдача объекта.
// Заявка хранится на одной дате (её «домашний» день); остальные дни вычисляются из полей карточки.

const ISO = /^\d{4}-\d{2}-\d{2}/;
const MAX_DAYS = 180;

export function isoDay(v) {
  const s = String(v || '').trim();
  return ISO.test(s) ? s.slice(0, 10) : '';
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// Дни от from до to включительно (не больше полугода — защита от опечатки в годе)
export function daysBetween(from, to) {
  const a = isoDay(from);
  let b = isoDay(to) || a;
  if (!a) return [];
  if (b < a) b = a;
  const out = [];
  for (let i = 0, d = a; d <= b && i < MAX_DAYS; i += 1, d = addDays(d, 1)) out.push(d);
  return out;
}

export const MARK_KINDS = {
  handover: { icon: '✅', label: 'Сдача объекта', rank: 4 },
  visit: { icon: '🚗', label: 'Выезд', rank: 3 },
  work: { icon: '🏗️', label: 'Работы', rank: 2 },
  range: { icon: '↔', label: 'Продолжение', rank: 1 },
};

// Периоды работ карточки: этапы с датами, а если их нет — общий период работ.
export function workPeriods(card) {
  const stages = Array.isArray(card.stages) ? card.stages.filter((s) => isoDay(s && s.start)) : [];
  if (stages.length) return stages.map((s) => ({ from: isoDay(s.start), to: isoDay(s.end) || isoDay(s.start), name: String(s.name || 'Работы').replace(/^\d+\.\s*/, '') }));
  const from = isoDay(card.workStart);
  return from ? [{ from, to: isoDay(card.workEnd) || from, name: 'Работы' }] : [];
}

// events: { 'ГГГГ-ММ-ДД': [карточки] } → { 'ГГГГ-ММ-ДД': [{ key, card, homeDate, kind, text }] }
export function buildCalendarMarks(events) {
  const byDay = {};
  const put = (day, card, homeDate, kind, text) => {
    if (!day || day === homeDate) return; // в «домашний» день показана сама заявка
    const list = byDay[day] || (byDay[day] = []);
    const same = list.findIndex((m) => String(m.card.id) === String(card.id));
    const mark = { key: `${card.id}-${day}`, card, homeDate, kind, text };
    if (same < 0) list.push(mark);
    else if (MARK_KINDS[kind].rank > MARK_KINDS[list[same].kind].rank) list[same] = mark;
  };
  Object.entries(events || {}).forEach(([homeDate, cards]) => {
    (cards || []).forEach((card) => {
      if (!card || card.id == null) return;
      if (isoDay(card.dateEnd)) daysBetween(homeDate, card.dateEnd).forEach((d) => put(d, card, homeDate, 'range', ''));
      workPeriods(card).forEach((p) => daysBetween(p.from, p.to).forEach((d) => put(d, card, homeDate, 'work', p.name)));
      const visit = isoDay(card.visitDate);
      if (visit) put(visit, card, homeDate, 'visit', String(card.visitDate).slice(11, 16));
      const handover = isoDay(card.handoverDate);
      if (handover) put(handover, card, homeDate, 'handover', '');
    });
  });
  return byDay;
}

// «23.11 – 28.11.2026» для подписи периода
export function formatPeriod(from, to) {
  const a = isoDay(from);
  const b = isoDay(to);
  const ru = (s, year) => `${s.slice(8, 10)}.${s.slice(5, 7)}${year ? `.${s.slice(0, 4)}` : ''}`;
  if (!a) return '';
  if (!b || b === a) return ru(a, true);
  return `${ru(a, a.slice(0, 4) !== b.slice(0, 4))} – ${ru(b, true)}`;
}
