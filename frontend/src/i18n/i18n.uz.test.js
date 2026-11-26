// Проверка языка «Oʻzbekcha»: свой словарь, запасной английский, числа, единицы, даты, правила.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { hostname: 'qazgost.kz' } };
globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? 'uz' : null), setItem() {} };
const { translate, langReady, getLang, langLocale, defaultLangForHost, LANGS } = await import('./index.js');
await langReady();
const CYR = /[А-Яа-яЁё]/;
const CASES = [
  ['Войти', 'Kirish'], ['Оценка стоимости', 'Narxni baholash'], ['Найдено: 9 708', 'Topildi: 9 708'],
  ['12 шт', '12 dona'], ['3 дн', '3 kun'], ['2 на 10 м²', '2 ta / 10 m²'],
  ['стены 12.5 м × 2.7 м − проёмы 3.4 м² = 30.4 м²', 'devorlar 12.5 m × 2.7 m − oraliqlar 3.4 m² = 30.4 m²'],
  ['Выбрать «Полы и плитка»', '«Pollar va kafel»ni tanlash'],
  ['5 дней назад', '5 kun oldin'],
  ['12 000 ₸ / смена', '12 000 ₸ / smena'], ['Показать 14 объявлений', '14 ta eʼlonni koʻrsatish'],
];

test('язык выбран и известен браузеру', () => {
  assert.equal(getLang(), 'uz');
  assert.equal(langLocale(), 'uz-UZ');
  assert.ok(LANGS.some((l) => l.code === 'uz' && l.name === 'Oʻzbekcha'));
  assert.equal(defaultLangForHost('qazgost.com', ['uz-UZ', 'en-US']), 'uz');
  assert.equal(defaultLangForHost('qazgost.kz', ['uz-UZ']), 'ru');
});

test('фразы, числа, единицы, даты и правила', () => {
  for (const [src, out] of CASES) assert.equal(translate(src), out, src);
  assert.equal(translate('Hello'), null);
});

test('чего нет в словаре — показывается по-английски, а не по-русски', async () => {
  const en = await import('./dict.en.js');
  const own = await import('./dict.uz.js');
  const missing = Object.keys(en.EN).filter((k) => own.T[k] == null && !/\{n\}/.test(k) && k.length > 12);
  assert.ok(missing.length > 100);
  for (const k of missing.slice(0, 50)) {
    const t = translate(k);
    assert.ok(t && !CYR.test(t.replace(/[₸№]/g, '')), `«${k}» → ${t}`);
  }
  for (const [k, v] of Object.entries(own.T)) assert.ok(!CYR.test(v), `${k} → ${v}`);
});
