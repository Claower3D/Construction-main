// Проверка документов сметы (Excel и страница для печати). Запуск: npm run test:docs
import test from 'node:test';
import assert from 'node:assert/strict';
import { smetaSheets, smetaPrintHtml, docTotals, docFileName, docNumber, reservePercent, pickScenario } from './smetaDocs.js';

const item = (over) => ({ stage: 'Подготовка', category: 'floors', key: 'w.x', name: 'Грунтование пола', unit: 'м²', qty: 20.5, price: 400, total: 8200,
  kind: 'work', source: 'Прайс бригады', url: 'https://example.kz/price', verified: true, why: 'площадь пола 20,5 м²', ...over });

const scenario = (id, k) => {
  const items = [item({}), item({ name: 'Ламинат 33 класс', kind: 'material', price: 5000 * k, total: 102500 * k, key: 'm.x', stage: 'Покрытие' }),
    item({ name: 'Аренда <шлифмашины> & "диска"', kind: 'equipment', qty: 2, unit: 'сут', price: 9000, total: 18000, stage: 'Покрытие', verified: false, source: 'Оценка', note: 'нет прайса' })];
  const works = 8200; const materials = 102500 * k; const equipment = 18000;
  const subtotal = works + materials + equipment; const reserve = Math.round(subtotal * 0.07);
  return { id, name: id, note: 'Полы: ламинат 33 класса', items, works, materials, equipment, subtotal, reserve, total: subtotal + reserve, unverified: 18000 };
};

const result = {
  title: 'Полы', parts: ['floors'], city: 'Алматы', regionCoef: 1, priceDate: 'ноябрь 2026',
  geometry: { area: 20.5, perimeter: 18.2, height: 2.7, doors: 1, windows: 1, wallArea: 45 },
  scenarios: [scenario('eco', 0.8), scenario('std', 1), scenario('prem', 1.6)],
  assumptions: ['Запас ламината 5% на подрезку.'],
  method: 'Объёмы — по обмеру и нормам расхода.',
  sources: [{ source: 'Прайс бригады', urls: ['https://example.kz/price'], count: 2 }],
  schedule: { std: { days: 4, note: 'При работе одной бригады.', stages: [{ stage: 'Подготовка', category: 'Полы', start: 0, days: 1, wait: 1, why: 'сохнет грунт' }, { stage: 'Покрытие', category: 'Полы', start: 2, days: 2, wait: 0 }] } },
  purchases: { std: [{ name: 'Ламинат 33 класс', unit: 'м²', qty: 21.5, price: 5000, total: 107500, source: 'Магазин', url: 'https://example.kz/lam' }] },
};
const info = { partTitles: { floors: 'Полы' }, customer: 'ТОО «Ромашка»', description: 'Комната <b>12</b> м' };
const when = new Date(2026, 10, 26, 9, 5);

test('резерв берётся из сметы, а не «всегда 10%»', () => {
  const sc = pickScenario(result, 'std');
  assert.equal(reservePercent(sc), 7);
  const totals = docTotals(sc);
  assert.deepEqual(totals.map((r) => r[0]), ['Работы', 'Материалы', 'Техника', 'Итого по смете', 'Резерв 7%', 'Бюджет с резервом']);
  assert.equal(totals[3][1], sc.works + sc.materials + sc.equipment);
  assert.equal(totals[5][1], sc.subtotal + sc.reserve);
});

test('книга Excel: листы, числа остаются числами, суммы сходятся', () => {
  const sheets = smetaSheets(result, 'std', info, undefined, when);
  assert.deepEqual(sheets.map((s) => s.name), ['Смета', 'Закупка', 'График', 'Допущения']);
  const main = sheets[0].rows;
  assert.equal(main[0][0], 'QazGost AI — Смета № 261126-0905');
  const head = main.findIndex((r) => r[0] === '№');
  const lines = main.slice(head + 1, head + 4);
  assert.equal(lines.length, 3);
  lines.forEach((r) => { assert.equal(typeof r[4], 'number'); assert.equal(typeof r[7], 'number'); });
  assert.equal(lines[0][1], 'Полы'); // раздел — названием, а не кодом
  assert.equal(lines.reduce((s, r) => s + r[7], 0), main.find((r) => r[3] === 'Итого по смете')[7]);
  assert.equal(lines[2][9], 'Оценка: нет прайса'); // у непроверенной цены видно, почему
  assert.ok(main.some((r) => r[0] === 'Заказчик' && r[1] === 'ТОО «Ромашка»'));
  const buy = sheets[1].rows;
  assert.equal(buy[buy.length - 1][4], 107500);
  assert.equal(sheets[2].rows[3][2], 1); // график: первый этап начинается в 1-й день
  // ширины заданы для каждого столбца
  sheets.forEach((s) => assert.ok(s.widths.length >= Math.max(...s.rows.map((r) => r.length))));
});

test('другой сценарий — другие суммы', () => {
  const eco = smetaSheets(result, 'eco', info, undefined, when)[0].rows.find((r) => r[3] === 'Бюджет с резервом')[7];
  const prem = smetaSheets(result, 'prem', info, undefined, when)[0].rows.find((r) => r[3] === 'Бюджет с резервом')[7];
  assert.ok(eco < prem);
  // у сценария без графика и закупки лишних листов нет
  assert.deepEqual(smetaSheets(result, 'eco', info, undefined, when).map((s) => s.name), ['Смета', 'Допущения']);
});

test('страница для печати: всё на месте, разметка в тексте обезврежена', () => {
  const html = smetaPrintHtml(result, 'std', info, undefined, when);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('Смета № 261126-0905'));
  assert.ok(html.includes('Резерв 7%'));
  assert.ok(html.includes('Ведомость закупки материалов'));
  assert.ok(html.includes('График работ'));
  assert.ok(html.includes('Аренда &lt;шлифмашины&gt; &amp; &quot;диска&quot;'));
  assert.ok(html.includes('Комната &lt;b&gt;12&lt;/b&gt; м'));
  assert.ok(!html.includes('<b>12</b>'));
  assert.ok(!/<script/i.test(html));
  assert.ok(html.replace(/\u00a0/g, ' ').includes('137 709 ₸')); // бюджет с резервом
});

test('английский документ: надписи, числа и дата по-английски', () => {
  const dict = { 'Смета': 'Estimate', 'Работы': 'Labour', 'Бюджет с резервом': 'Budget with reserve', 'Резерв 7%': 'Reserve 7%', 'Полы': 'Floors' };
  const tr = (s) => dict[s] || s;
  const en = { ...info, lang: 'en' };
  const html = smetaPrintHtml(result, 'std', en, tr, when);
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(html.includes('Estimate № 261126-0905'));
  assert.ok(html.includes('November 26, 2026'));
  assert.ok(html.includes('137,709 ₸'));
  assert.equal(smetaSheets(result, 'std', en, tr, when)[0].name, 'Estimate');
  assert.equal(docFileName(result, 'std', 'xlsx', tr, when), 'Estimate_QazGost_Floors_Стандарт_2026-11-26.xlsx');
  // после английского документа русский снова пишет числа по-русски
  assert.ok(!smetaPrintHtml(result, 'std', info, undefined, when).includes('137,709 ₸'));
});

test('имя файла и номер документа', () => {
  assert.equal(docNumber(when), '261126-0905');
  const odd = { ...result, title: 'Дом: "под ключ" / 2 этажа?' };
  assert.equal(docFileName(odd, 'prem', 'pdf', undefined, when), 'Смета_QazGost_Дом_под_ключ_2_этажа_Премиум_2026-11-26.pdf');
});
