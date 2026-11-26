// Проверка турецкого языка: свой словарь, запасной английский, числа по номерам, единицы, правила.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { hostname: 'qazgost.kz' } };
globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? 'tr' : null), setItem() {} };
const { translate, langReady, getLang, langLocale, defaultLangForHost, LANGS } = await import('./index.js');
await langReady();
const CYR = /[А-Яа-яЁё]/;

test('язык выбран и известен браузеру', () => {
  assert.equal(getLang(), 'tr');
  assert.equal(langLocale(), 'tr-TR');
  assert.ok(LANGS.some((l) => l.code === 'tr' && l.name === 'Türkçe'));
  assert.equal(defaultLangForHost('qazgost.com', ['tr-TR', 'en-US']), 'tr');
  assert.equal(defaultLangForHost('qazgost.kz', ['tr-TR']), 'ru');
});

test('фразы, знаки по краям и числа', () => {
  assert.equal(translate('Войти'), 'Giriş yap');
  assert.equal(translate('Оценка стоимости'), 'Maliyet tahmini');
  assert.equal(translate('Найдено: 9 708'), 'Bulundu: 9 708');
  assert.equal(translate('Hello'), null);
});

test('подстановки, единицы и пояснения к смете', () => {
  assert.equal(translate('стены 12.5 м × 2.7 м − проёмы 3.4 м² = 30.4 м²'), 'duvarlar 12.5 m × 2.7 m − boşluklar 3.4 m² = 30.4 m²');
  assert.equal(translate('Выбрать «Полы и плитка»'), '«Zeminler ve fayans» seç');
  assert.equal(translate('12 шт'), '12 adet');
  assert.equal(translate('3 дн'), '3 gün');
  // числа остаются на своих местах
  assert.equal(translate('2 на 10 м²'), '2 adet / 10 m²');
  assert.equal(translate('Типично 80–100 кг на 1 м³ ленты'), 'Genellikle 80–100 kg / 1 m³ şerit');
});

test('даты и правила с числами', () => {
  assert.equal(translate('24 ноября 2026 г.'), '24 Kasım 2026');
  assert.equal(translate('5 дней назад'), '5 gün önce');
  assert.equal(translate('12 000 ₸ / смена'), '12 000 ₸ / vardiya');
  assert.equal(translate('Показать 14 объявлений'), '14 ilanı göster');
});

test('чего нет по-турецки — показывается по-английски, а не по-русски', async () => {
  const en = await import('./dict.en.js');
  const tr = await import('./dict.tr.js');
  const missing = Object.keys(en.EN).filter((k) => tr.T[k] == null && !/\{n\}/.test(k) && k.length > 12);
  assert.ok(missing.length > 100);
  for (const k of missing.slice(0, 50)) {
    const t = translate(k);
    assert.ok(t && !CYR.test(t.replace(/[₸№]/g, '')), `«${k}» → ${t}`);
  }
  for (const [k, v] of Object.entries(tr.T)) assert.ok(!CYR.test(v), `${k} → ${v}`);
});
