// Проверка дополнительного языка (китайский): свой словарь, запасной английский, даты, единицы, правила.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';

// человек выбрал китайский в переключателе
globalThis.window = { location: { hostname: 'qazgost.kz' } };
globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? 'zh' : null), setItem() {} };
const { translate, langReady, getLang, langLocale, defaultLangForHost, LANGS } = await import('./index.js');
await langReady();
const CYR = /[А-Яа-яЁё]/;

test('язык выбран и известен браузеру', () => {
  assert.equal(getLang(), 'zh');
  assert.equal(langLocale(), 'zh-CN');
  assert.ok(LANGS.some((l) => l.code === 'zh' && l.name === '简体中文'));
});

test('язык по адресу и браузеру', () => {
  assert.equal(defaultLangForHost('qazgost.com', ['zh-CN', 'en-US']), 'zh');
  assert.equal(defaultLangForHost('qazgost.com', ['zh-TW']), 'zh');
  assert.equal(defaultLangForHost('qazgost.com', ['en-GB', 'zh-CN']), 'en-GB'); // британский английский — свой вариант
  assert.equal(defaultLangForHost('qazgost.com', ['en-AU', 'zh-CN']), 'en');
  assert.equal(defaultLangForHost('qazgost.com', ['pt-BR']), 'en');       // языка нет на сайте
  assert.equal(defaultLangForHost('qazgost.com', ['ru-RU', 'zh-CN']), 'zh'); // русский на .com не выбирается сам
  assert.equal(defaultLangForHost('qazgost.com', ['ru-RU']), 'en');
  assert.equal(defaultLangForHost('qazgost.com', ['kk-KZ']), 'en');
  assert.equal(defaultLangForHost('qazgost.com', []), 'en');
  assert.equal(defaultLangForHost('qazgost.kz', ['zh-CN']), 'ru');        // казахстанский адрес — всегда русский
});

test('фразы, знаки по краям и числа', () => {
  assert.equal(translate('Войти'), '登录');
  assert.equal(translate(' Войти '), ' 登录 ');
  assert.equal(translate('📋 Мои заказы'), '📋 我的订单');
  assert.equal(translate('Всего:'), '合计：');
  assert.equal(translate('Оценка стоимости'), '造价估算');
  assert.equal(translate('Найдено: 9 708'), '找到：9 708');
  assert.equal(translate('Резерв 10%'), '预备费 10%');
  assert.equal(translate('МЕНЕДЖЕР'), '经理');
  assert.equal(translate('Hello'), null);
});

test('подстановки и пояснения к смете', () => {
  assert.equal(translate('стены 12.5 м × 2.7 м − проёмы 3.4 м² = 30.4 м²'), '墙面 12.5 m × 2.7 m − 洞口 3.4 m² = 30.4 m²');
  assert.equal(translate('Выбрать «Полы и плитка»'), '选择「地面和瓷砖」');
  assert.equal(translate('12 шт'), '12 件');
  assert.equal(translate('3 дн'), '3 天');
  // порядок слов в китайском другой — числа встают по номерам: «2 на 10 м²» → «每 10 m² 2 个»
  assert.equal(translate('2 на 10 м²'), '每 10 m² 2 个');
  assert.equal(translate('Типично 80–100 кг на 1 м³ ленты'), '通常每 1 m³ 基础带 80–100 kg');
  assert.equal(translate('≈0.9 кг клея на 1 м³ кладки × 12.4 м³'), '每 1 m³ 砌体约 0.9 kg 粘结剂 × 12.4 m³');
});

test('даты — по правилам языка', () => {
  assert.equal(translate('24 ноября 2026 г.'), '2026年11月24日');
  assert.equal(translate('ноябрь 2026 г.'), '2026年11月');
  assert.ok(/11月24日/.test(translate('24 ноября')));
});

test('правила с числами', () => {
  assert.equal(translate('5 дней назад'), '5 天前');
  assert.equal(translate('12 000 ₸ / смена'), '12 000 ₸ / 台班');
  assert.equal(translate('Показать 14 объявлений'), '显示 14 条信息');
  assert.equal(translate('Редакция от 3 июня 2026 г.'), '2026年6月3日 版');
});

test('чего нет по-китайски — показывается по-английски, а не по-русски', async () => {
  const en = await import('./dict.en.js');
  const zh = await import('./dict.zh.js');
  const missing = Object.keys(en.EN).filter((k) => zh.T[k] == null && !/\{n\}/.test(k) && k.length > 12);
  for (const k of missing.slice(0, 50)) {
    const t = translate(k);
    assert.ok(t && !CYR.test(t.replace(/[₸№]/g, '')), `«${k}» → ${t}`);
  }
  // в самом китайском словаре кириллицы нет
  for (const [k, v] of Object.entries(zh.T)) assert.ok(!CYR.test(v), `${k} → ${v}`);
});
