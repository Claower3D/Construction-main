// Тесты расчётов графика работ. Запуск: npm run test:vip (node --test, без зависимостей)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayNumber, isIso, addDays, todayIso, durationDays, formatDay, formatRange, isOverdue, suggestedStatus,
  buildTimeline, barPosition, brigadeConflicts, brigadeIssues, assignmentReport, projectSummary, shortName, nextId, importProblem, emptyProject,
} from './vipSchedule.js';

const project = () => ({
  name: 'Завод', startDate: '2026-10-01',
  staff: [{ id: 'p1', name: 'Барбашин Максим Владимирович' }, { id: 'p2', name: 'Игнатко Артем Игоревич' }, { id: 'p3', name: 'Айдос Аинкен' }, { id: 'p4', name: 'Свободный Человек' }],
  equipment: [{ id: 'm1', name: 'Кран' }, { id: 'm2', name: 'КАМАЗ' }, { id: 'm3', name: 'Резерв' }],
  brigades: [{ id: 'b1', name: 'Бригада 1', members: ['p1', 'p2'], equipment: ['m1'] }, { id: 'b2', name: 'Бригада 2', members: ['p3', 'p1'], equipment: ['m2', 'm1'] }],
  works: [
    { id: 'w1', title: 'Ливневая система', start: '2026-10-29', end: '2026-11-13', status: 'progress', brigadeId: 'b1', media: [{ id: 'f1' }] },
    { id: 'w2', title: 'Лестничные марши', start: '2026-11-10', end: '2026-11-20', status: 'plan', brigadeId: 'b1' },
    { id: 'w3', title: 'Резка отверстий', start: '2026-11-11', end: '2026-11-11', status: 'done', brigadeId: 'b2', check: 'уточнить диаметр' },
    { id: 'w4', title: 'Отопление', start: '2026-11-23', end: '2026-11-29', status: 'plan', brigadeId: 'b1' },
    { id: 'w5', title: 'На паузе', start: '2026-11-01', end: '2026-11-30', status: 'hold', brigadeId: 'b1' },
  ],
});

test('даты: проверка, сложение, длительность', () => {
  assert.equal(isIso('2026-11-24'), true);
  assert.equal(isIso('2026-11-31'), false);
  assert.equal(isIso('2026-02-29'), false);
  assert.equal(isIso('2028-02-29'), true);
  assert.equal(isIso('24.11.2026'), false);
  assert.equal(isIso(null), false);
  assert.equal(addDays('2026-10-29', 3), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(durationDays('2026-10-29', '2026-11-13'), 16);
  assert.equal(durationDays('2026-11-23', '2026-11-23'), 1);
  assert.equal(durationDays('2026-11-23', '2026-11-20'), 0);
  assert.equal(durationDays('', '2026-11-20'), 0);
  assert.ok(Number.isNaN(dayNumber('мусор')));
});

test('сегодня — по местным часам, а не по UTC', () => {
  assert.equal(todayIso(new Date(2026, 10, 24, 0, 30)), '2026-11-24');
  assert.equal(todayIso(new Date(2026, 10, 24, 23, 59)), '2026-11-24');
});

test('подписи дат', () => {
  assert.equal(formatDay('2026-10-29'), '29 октября');
  assert.equal(formatDay('2026-11-03', true), '3 ноя');
  assert.equal(formatDay('нет'), '—');
  assert.equal(formatRange('2026-10-29', '2026-11-13'), '29 октября — 13 ноября');
  assert.equal(formatRange('2026-11-10', '2026-11-20'), '10–20 ноября');
  assert.equal(formatRange('2026-11-23', '2026-11-23'), '23 ноября');
  assert.equal(formatRange('', ''), '—');
});

test('просрочка и подсказка состояния', () => {
  const today = '2026-11-24';
  const [w1, w2, w3, w4, w5] = project().works;
  assert.equal(isOverdue(w1, today), true); // срок вышел 13-го, отметки нет
  assert.equal(isOverdue(w2, today), true);
  assert.equal(isOverdue(w3, today), false); // выполнена
  assert.equal(isOverdue(w4, today), false); // идёт
  assert.equal(isOverdue(w5, '2026-12-05'), false); // приостановлена
  assert.equal(isOverdue({ ...w4 }, '2026-11-29'), false); // последний день — ещё не просрочка
  assert.equal(suggestedStatus(w4, '2026-11-20'), 'plan');
  assert.equal(suggestedStatus(w4, today), 'progress');
  assert.equal(suggestedStatus(w3, today), 'done');
});

test('сетка календаря: от начала проекта до последней работы с запасом', () => {
  const t = buildTimeline(project(), '2026-11-24');
  assert.equal(t.start, '2026-10-01');
  assert.equal(t.end, '2026-12-03'); // 30 ноября + 3 дня
  assert.equal(t.days.length, 64);
  assert.deepEqual(t.months.map((m) => [m.key, m.span]), [['2026-10', 31], ['2026-11', 30], ['2026-12', 3]]);
  assert.equal(t.months[0].label, 'октябрь 2026');
  assert.equal(t.days[0].weekday, 'чт'); // 1 октября 2026 — четверг
  assert.equal(t.days[2].weekend, true); // 3 октября — суббота
  assert.equal(t.days[31].monthStart, true);
  // сегодня позже последней работы — день всё равно попадает в сетку
  const later = buildTimeline(project(), '2026-12-10');
  assert.ok(later.days.some((d) => d.iso === '2026-12-10'));
  // пустой проект
  const empty = buildTimeline({ works: [] }, '2026-11-24');
  assert.equal(empty.start, '2026-11-24');
  assert.equal(empty.days.length, 4);
  // очень длинный проект обрезается до двух лет
  assert.equal(buildTimeline({ startDate: '2020-01-01', works: [{ start: '2026-01-01', end: '2026-01-02' }] }, '2026-11-24').days.length, 731);
});

test('положение полосы работы', () => {
  const p = project();
  const t = buildTimeline(p, '2026-11-24');
  assert.deepEqual(barPosition(p.works[0], t), { offset: 28, span: 16, cutLeft: false, cutRight: false });
  assert.deepEqual(barPosition(p.works[2], t), { offset: 41, span: 1, cutLeft: false, cutRight: false });
  assert.equal(barPosition({ start: '2025-01-01', end: '2025-01-05' }, t), null);
  assert.deepEqual(barPosition({ start: '2026-09-20', end: '2026-10-02' }, t), { offset: 0, span: 2, cutLeft: true, cutRight: false });
  assert.equal(barPosition({ start: 'x', end: 'y' }, t), null);
});

test('занятость бригады: пересечения работ', () => {
  const c = brigadeConflicts(project());
  assert.deepEqual(c.get('w1'), ['Лестничные марши']); // 10–13 ноября обе работы у бригады 1
  assert.deepEqual(c.get('w2'), ['Ливневая система']);
  assert.equal(c.has('w3'), false); // другая бригада
  assert.equal(c.has('w4'), false); // после окончания остальных
  assert.equal(c.has('w5'), false); // приостановленная не считается
  // стык в один день — тоже пересечение
  const p = project();
  p.works = [{ id: 'a', title: 'А', start: '2026-11-01', end: '2026-11-05', status: 'plan', brigadeId: 'b1' }, { id: 'b', title: 'Б', start: '2026-11-05', end: '2026-11-08', status: 'plan', brigadeId: 'b1' }, { id: 'c', title: 'В', start: '2026-11-06', end: '2026-11-08', status: 'plan', brigadeId: '' }];
  const c2 = brigadeConflicts(p);
  assert.deepEqual([...c2.keys()].sort(), ['a', 'b']);
});

test('состав бригады: 2–4 человека, 1–2 единицы техники', () => {
  assert.deepEqual(brigadeIssues({ members: ['a', 'b'], equipment: ['m'] }), []);
  assert.deepEqual(brigadeIssues({ members: ['a', 'b', 'c', 'd'], equipment: ['m', 'n'] }), []);
  assert.deepEqual(brigadeIssues({ members: ['a'], equipment: [] }), ['мало людей: 1 из 2–4', 'нет техники']);
  assert.deepEqual(brigadeIssues({ members: ['a', 'b', 'c', 'd', 'e'], equipment: ['m', 'n', 'o'] }), ['много людей: 5 при норме 2–4', 'много техники: 3 при норме 1–2']);
  assert.deepEqual(brigadeIssues({}), ['мало людей: 0 из 2–4', 'нет техники']);
});

test('кто не распределён и кто в двух бригадах', () => {
  const r = assignmentReport(project());
  assert.deepEqual(r.peopleTwice, ['p1']);
  assert.deepEqual(r.machinesTwice, ['m1']);
  assert.deepEqual(r.freePeople, ['p4']);
  assert.deepEqual(r.freeMachines, ['m3']);
  assert.equal(r.brigadeOf.get('p3').name, 'Бригада 2');
  assert.equal(r.machineBrigade.get('m2').name, 'Бригада 2');
});

test('сводка проекта', () => {
  const s = projectSummary(project(), '2026-11-24');
  assert.deepEqual({ total: s.total, plan: s.plan, progress: s.progress, done: s.done, hold: s.hold }, { total: 5, plan: 2, progress: 1, done: 1, hold: 1 });
  assert.equal(s.overdue, 2);
  assert.equal(s.media, 1);
  assert.equal(s.check, 1);
  assert.equal(s.first, '2026-10-29');
  assert.equal(s.last, '2026-11-30');
  assert.equal(s.donePct, 20);
  assert.equal(projectSummary({ works: [] }, '2026-11-24').donePct, 0);
});

test('короткое имя и номера записей', () => {
  assert.equal(shortName('Барбашин Максим Владимирович'), 'Барбашин М. В.');
  assert.equal(shortName('Айдос Аинкен'), 'Айдос А.');
  assert.equal(shortName('Глотов'), 'Глотов');
  assert.equal(shortName(''), '');
  assert.equal(nextId('w', []), 'w1');
  assert.equal(nextId('w', [{ id: 'w1' }, { id: 'w3' }]), 'w4'); // w3 занят
  assert.equal(nextId('w', [{ id: 'w2' }]), 'w3');
});

test('проверка файла проекта перед загрузкой', () => {
  assert.equal(importProblem(project()), '');
  assert.equal(importProblem(emptyProject('Новый', '2026-11-24')), '');
  assert.match(importProblem(null), /не похож на проект/);
  assert.match(importProblem([]), /не похож на проект/);
  assert.match(importProblem({ works: [] }), /нет названия/);
  assert.match(importProblem({ name: 'x', works: {} }), /works в файле должно быть списком/);
  assert.match(importProblem({ name: 'x', works: [{ title: '' }] }), /без названия/);
  assert.match(importProblem({ name: 'x', works: [{ title: 'А', start: '29.10', end: '2026-11-01' }] }), /нет дат/);
  assert.match(importProblem({ name: 'x', works: [{ title: 'А', start: '2026-11-05', end: '2026-11-01' }] }), /раньше начала/);
});

// ── выходной, факт, бюджет, подгруппы, виды работ ──
import {
  restDayOf, factRange, budgetSummary, money, guessMachineGroup, machineGroup, guessWorkKind, workKind,
  workPicture, initials, nameHue, workZone,
} from './vipSchedule.js';

test('выходной день: по умолчанию воскресенье, можно любой день недели', () => {
  assert.equal(restDayOf({}), 0);
  assert.equal(restDayOf({ restDay: 3 }), 3);
  assert.equal(restDayOf({ restDay: 9 }), 0);
  const sun = buildTimeline({ startDate: '2026-11-01', works: [] }, '2026-11-08');
  assert.deepEqual(sun.days.filter((d) => d.rest).map((d) => d.iso).slice(0, 2), ['2026-11-01', '2026-11-08']);
  const wed = buildTimeline({ startDate: '2026-11-01', restDay: 3, works: [] }, '2026-11-08');
  assert.equal(wed.days.find((d) => d.rest).iso, '2026-11-04');
});

test('календарь по факту', () => {
  const today = '2026-11-20';
  assert.equal(factRange({ status: 'plan', start: '2026-11-25', end: '2026-11-28' }, today), null);
  // идёт и уже опаздывает на 2 дня
  assert.deepEqual(factRange({ status: 'progress', start: '2026-11-10', end: '2026-11-18' }, today), { start: '2026-11-10', end: today, running: true, shift: 2 });
  // идёт, срок ещё не вышел — опоздания нет
  assert.equal(factRange({ status: 'progress', start: '2026-11-10', end: '2026-11-25' }, today).shift, 0);
  // выполнена с отметками: начали позже, закончили на 3 дня позже
  assert.deepEqual(factRange({ status: 'done', start: '2026-11-01', end: '2026-11-05', factStart: '2026-11-02', factEnd: '2026-11-08' }, today), { start: '2026-11-02', end: '2026-11-08', running: false, shift: 3 });
  // выполнена без отметок — по плану
  assert.deepEqual(factRange({ status: 'done', start: '2026-11-01', end: '2026-11-05' }, today), { start: '2026-11-01', end: '2026-11-05', running: false, shift: 0 });
  // «в работе» раньше плановой даты
  assert.equal(factRange({ status: 'progress', start: '2026-11-25', end: '2026-11-28' }, today).start, today);
  // фактические даты расширяют сетку
  const t = buildTimeline({ works: [{ start: '2026-11-10', end: '2026-11-12', factStart: '2026-11-05', factEnd: '2026-11-20' }] }, '2026-11-11');
  assert.equal(t.start, '2026-11-05');
  assert.ok(t.end >= '2026-11-20');
});

test('бюджет на строительство', () => {
  const b = budgetSummary({ budget: 1000, works: [{ cost: 400, paid: 100, status: 'done' }, { cost: 300, paid: 50, status: 'progress' }, { status: 'plan' }] });
  assert.deepEqual(b, { budget: 1000, planned: 700, paid: 150, doneCost: 400, left: 850, paidPct: 15, donePct: 40, unpriced: 1 });
  assert.equal(budgetSummary({ invoice: { amount: 500 }, works: [] }).budget, 500);
  assert.equal(budgetSummary({ works: [{ cost: 70 }] }).budget, 70);
  assert.equal(money(12500000), '12 500 000 ₸');
});

test('подгруппы техники', () => {
  assert.equal(guessMachineGroup('Кран КАМАЗ 25 т'), 'crane');
  assert.equal(guessMachineGroup('Манипулятор Hyundai'), 'manipulator');
  assert.equal(guessMachineGroup('Автовышка 33 м'), 'lift');
  assert.equal(guessMachineGroup('КАМАЗ самосвал'), 'truck');
  assert.equal(guessMachineGroup('Экскаватор JCB'), 'earth');
  assert.equal(guessMachineGroup('Генератор'), 'other');
  assert.equal(guessMachineGroup('XCMG QY25K5S'), 'crane');
  assert.equal(guessMachineGroup('Nissan X-Trail'), 'truck');
  assert.equal(guessMachineGroup('DONGFENG RRR5040JGKE'), 'lift');
  assert.equal(machineGroup({ name: 'Кран', group: 'truck' }), 'truck'); // выбор человека важнее подсказки
  assert.equal(machineGroup({ name: 'Кран', group: 'ракета' }), 'crane');
});

test('виды работ и место на модели', () => {
  assert.equal(guessWorkKind('Ливневая система'), 'drain');
  assert.equal(guessWorkKind('Монтаж кровли'), 'roof');
  assert.equal(guessWorkKind('Резка отверстий'), 'cut');
  assert.equal(guessWorkKind('Резка отверстия под трубу'), 'cut');
  assert.equal(guessWorkKind('Демонтаж и монтаж профлиста'), 'walls');
  assert.equal(guessWorkKind('Профлист на крышу'), 'roof');
  assert.equal(guessWorkKind('Сборка 2 лестничных маршей'), 'stairs');
  assert.equal(guessWorkKind('Рельсовый монтаж'), 'rails');
  assert.equal(guessWorkKind('Отопление: монтаж'), 'heat');
  assert.equal(guessWorkKind('Монтаж вентиляции'), 'vent');
  assert.equal(guessWorkKind('Монтаж сэндвич-панелей'), 'walls');
  assert.equal(guessWorkKind('Сборка каркаса'), 'steel');
  assert.equal(guessWorkKind('Что-то ещё'), 'other');
  assert.equal(workKind({ title: 'Кровля', kind: 'weld' }), 'weld');
  assert.equal(workZone({ title: 'Монтаж кровли' }), 'roof');
  assert.equal(workZone({ title: 'Панели', place: 'восточный торец' }), 'wall-e');
  assert.equal(workZone({ title: 'Кровля', zone: 'floor' }), 'floor');
  assert.equal(workZone({ title: 'Что-то' }), 'all');
});

test('картинка работы и инициалы', () => {
  assert.equal(workPicture({ media: [] }), null);
  assert.equal(workPicture({ media: [{ kind: 'photo', url: '/a.jpg' }, { kind: 'video', url: '/v.mp4' }, { kind: 'photo', url: '/b.jpg' }] }), '/b.jpg');
  assert.equal(initials('Иванов Иван Иванович'), 'ИИ');
  assert.equal(initials(''), '?');
  assert.equal(nameHue('Иванов'), nameHue('Иванов'));
  assert.ok(nameHue('Иванов') >= 0 && nameHue('Иванов') < 360);
});

import { buildFactDays } from './vipSchedule.js';
test('календарь по факту по дням', () => {
  const days = buildFactDays({ works: [
    { id: 'a', title: 'А', status: 'progress', start: '2026-11-10', end: '2026-11-12' },
    { id: 'b', title: 'Б', status: 'done', start: '2026-11-11', end: '2026-11-11' },
    { id: 'c', title: 'В', status: 'plan', start: '2026-11-11', end: '2026-11-11' },
  ] }, '2026-11-14');
  assert.deepEqual(Object.keys(days).sort(), ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']);
  assert.deepEqual(days['2026-11-11'].map((x) => x.work.id), ['a', 'b']); // запланированная в факт не попадает
  assert.equal(days['2026-11-12'][0].late, false);
  assert.equal(days['2026-11-13'][0].late, true); // идёт позже срока
});

import { guessShape, workFloor, workCount, projectPlaces, HANGAR, HANGAR_INNER, floorRise,
} from './vipSchedule.js';
test('место и фигура работы на модели', () => {
  assert.equal(guessShape({ title: 'Сборка 2 лестничных маршей' }), 'stairs');
  assert.equal(guessShape({ title: 'Ливневая система' }), 'storm');
  assert.equal(guessShape({ title: 'Канализация и септик' }), 'sewer');
  assert.equal(guessShape({ title: 'Демонтаж и монтаж профлиста' }), 'sheet_wall');
  assert.equal(guessShape({ title: 'Профлист на крышу, привозка связей' }), 'sheet_roof');
  assert.equal(guessShape({ title: 'Резка отверстий под будку' }), 'opening');
  assert.equal(guessShape({ title: 'Сварка короба под дробилку' }), 'box');
  assert.equal(guessShape({ title: 'Рельсовый монтаж' }), 'rails');
  assert.equal(guessShape({ title: 'Заливка закладных, 2 этаж' }), 'embeds');
  assert.equal(guessShape({ title: 'Отопление: монтаж' }), 'heating');
  assert.equal(guessShape({ title: 'Уборка' }), 'pin');
  assert.equal(workFloor({ title: 'Заливка закладных, 2 этаж' }), 2);
  assert.equal(workFloor({ title: 'Резка', place: '1 этаж' }), 1);
  assert.equal(workFloor({ title: 'Резка', floor: 2, place: '1 этаж' }), 2);
  assert.equal(workFloor({ title: 'Ливневая система' }), 0);
  assert.equal(workCount({ title: 'Сборка 2 лестничных маршей' }), 2);
  assert.equal(workCount({ title: 'Закладные', volume: '11 штук' }), 11);
  assert.equal(workCount({ title: 'Рельсовый монтаж', volume: '6 полос: обнаружение' }), 6);
  assert.equal(workCount({ title: 'Что-то' }, 3), 3);
  const p = projectPlaces([
    { id: 'a', title: 'Заливка закладных, 1 этаж', volume: '11 штук' },
    { id: 'b', title: 'Обнаружение закладных в бетоне', volume: '10 штук' },
    { id: 'c', title: 'Заливка закладных, 2 этаж' },
    { id: 'd', title: 'Сборка 2 лестничных маршей', pos: { x: 50, z: 20 } },
    { id: 'e', title: 'Ливневая система' },
  ]);
  assert.equal(p.get('a').shape, 'embeds');
  assert.equal(p.get('a').count, 11);
  assert.notDeepEqual([p.get('a').x, p.get('a').z], [p.get('b').x, p.get('b').z]); // одинаковые работы не сливаются
  assert.equal(p.get('c').floor, 2);
  assert.ok(p.get('c').x > HANGAR_INNER.mezzFrom); // второй этаж — на площадке
  assert.deepEqual([p.get('d').x, p.get('d').z, p.get('d').auto], [50, 20, false]); // место, указанное человеком
  assert.equal(p.get('e').label, 'снаружи здания');
  // две лестницы — две точки: первая в середине здания, вторая (двухэтажная) в начале, у входа
  const st = projectPlaces([{ id: 's', title: 'Сборка 2 лестничных маршей' }, { id: 't', title: 'Лестница', pos2: { x: 10, z: 20 } }]);
  assert.deepEqual([st.get('s').x, st.get('s').z, st.get('s').x2, st.get('s').z2, st.get('s').auto2], [30, 12, 3, 4, true]);
  assert.deepEqual([st.get('t').x2, st.get('t').z2, st.get('t').auto2], [10, 20, false]);
  assert.equal(p.get('a').label, '1 этаж');
});

test('выступ пола у восточного торца: кровля ровная, пол поднят только внутри выступа', () => {
  assert.equal(HANGAR.bump, undefined);
  const s = HANGAR.step, z0 = (HANGAR.width - s.width) / 2;
  assert.equal(floorRise(s.from + 1, z0 + 1), s.height); // внутри выступа
  assert.equal(floorRise(HANGAR.length, HANGAR.width / 2), s.height); // у самого торца
  assert.equal(floorRise(s.from - 1, HANGAR.width / 2), 0); // до выступа по длине
  assert.equal(floorRise(s.from + 1, z0 - 1), 0); // сбоку от выступа
  assert.equal(floorRise(30, 12), 0); // середина здания
});
