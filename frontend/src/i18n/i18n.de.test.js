// Проверка языка «Deutsch»: свой словарь, запасной английский, числа, единицы, даты, правила.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { hostname: 'qazgost.kz' } };
globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? 'de' : null), setItem() {} };
const { translate, langReady, getLang, langLocale, defaultLangForHost, LANGS } = await import('./index.js');
await langReady();
const CYR = /[А-Яа-яЁё]/;
const CASES = [
  ['Войти', 'Anmelden'], ['Оценка стоимости', 'Kostenschätzung'], ['Найдено: 9 708', 'Gefunden: 9 708'],
  ['12 шт', '12 Stk.'], ['3 дн', '3 Tg.'], ['2 на 10 м²', '2 pro 10 m²'],
  ['стены 12.5 м × 2.7 м − проёмы 3.4 м² = 30.4 м²', 'Wände 12.5 m × 2.7 m − Öffnungen 3.4 m² = 30.4 m²'],
  ['Выбрать «Полы и плитка»', '„Böden und Fliesen“ wählen'],
  ['24 ноября 2026 г.', '24. November 2026'], ['5 дней назад', 'vor 5 Tagen'],
  ['12 000 ₸ / смена', '12 000 ₸ / Schicht'], ['Показать 14 объявлений', '14 Anzeigen zeigen'],
];

test('язык выбран и известен браузеру', () => {
  assert.equal(getLang(), 'de');
  assert.equal(langLocale(), 'de-DE');
  assert.ok(LANGS.some((l) => l.code === 'de' && l.name === 'Deutsch'));
  assert.equal(defaultLangForHost('qazgost.com', ['de-DE', 'en-US']), 'de');
  assert.equal(defaultLangForHost('qazgost.kz', ['de-DE']), 'ru');
});

test('фразы, числа, единицы, даты и правила', () => {
  for (const [src, out] of CASES) assert.equal(translate(src), out, src);
  assert.equal(translate('Hello'), null);
});

test('чего нет в словаре — показывается по-английски, а не по-русски', async () => {
  const en = await import('./dict.en.js');
  const own = await import('./dict.de.js');
  const missing = Object.keys(en.EN).filter((k) => own.T[k] == null && !/\{n\}/.test(k) && k.length > 12);
  assert.ok(missing.length > 100);
  for (const k of missing.slice(0, 50)) {
    const t = translate(k);
    assert.ok(t && !CYR.test(t.replace(/[₸№]/g, '')), `«${k}» → ${t}`);
  }
  for (const [k, v] of Object.entries(own.T)) assert.ok(!CYR.test(v), `${k} → ${v}`);
});
