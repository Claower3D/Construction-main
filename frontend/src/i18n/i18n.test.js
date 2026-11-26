// Проверка слоя перевода: язык по адресу сайта, английский словарь, числа, даты и подстановки.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';

// сайт открыт по английскому адресу, сохранённого выбора языка нет
globalThis.window = { location: { hostname: 'www.qazgost.com' } };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { translate, langReady, getLang, defaultLangForHost } = await import('./index.js');
await langReady();

test('язык по адресу сайта', () => {
  assert.equal(defaultLangForHost('qazgost.com'), 'en');
  assert.equal(defaultLangForHost('www.qazgost.com'), 'en');
  assert.equal(defaultLangForHost('QAZGOST.COM'), 'en');
  assert.equal(defaultLangForHost('qazgost.kz'), 'ru');
  assert.equal(defaultLangForHost('construction-main-production.up.railway.app'), 'ru');
  assert.equal(defaultLangForHost('notqazgost.com'), 'ru');
  assert.equal(defaultLangForHost('qazgost.com.example.org'), 'ru');
  assert.equal(defaultLangForHost('localhost'), 'ru');
  assert.equal(defaultLangForHost(undefined), 'ru');
  assert.equal(getLang(), 'en');
});

test('фразы и знаки по краям', () => {
  assert.equal(translate('Войти'), 'Sign in');
  assert.equal(translate(' Войти '), ' Sign in ');
  assert.equal(translate('📋 Мои заказы'), '📋 My orders');
  assert.equal(translate('Hello'), null); // без кириллицы не трогаем
  assert.equal(translate('Такой фразы в словаре точно нет 7391'), null);
});

test('числа возвращаются на место', () => {
  assert.equal(translate('Найдено: 9 708'), 'Found: 9 708');
  assert.equal(translate('от 450 000 ₸'), 'from 450 000 ₸');
  assert.equal(translate('12,5 м²'), '12,5 m²');
  assert.equal(translate('2 заказа на 150 000 ₸'), '2 orders for 150 000 ₸');
});

test('даты', () => {
  assert.equal(translate('24 ноября 2026 г.'), '24 November 2026');
  assert.equal(translate('24 нояб. 2026 г.'), '24 Nov 2026');
  assert.equal(translate('пн, 24 нояб., 12:30'), 'Mon, 24 Nov, 12:30');
  assert.equal(translate('ноябрь 2026 г.'), 'November 2026');
  assert.equal(translate('1 мая'), '1 May');
  assert.equal(translate('31 августа, понедельник: задач нет'), 'Monday, 31 August: no tasks');
  assert.equal(translate('23 – 29 Ноябрь 2026'), '23 – 29 November 2026');
});

test('единицы, заглавные буквы, фраза из частей, варианты ключей базового словаря', () => {
  assert.equal(translate('12,5 м × 3 м = 37,5 м²'), '12,5 m × 3 m = 37,5 m²');
  assert.equal(translate('МЕНЕДЖЕР'), 'MANAGER');
  assert.equal(translate('Проектировщик · Астана · 0 чел.'), 'Designer · Astana · 0 ppl.');
  assert.equal(translate('Всего'), 'Total'); // в базовом словаре ключ «Всего:»
  assert.equal(translate('Всего:'), 'Total:');
  // точный перевод важнее общего шаблона «Бригада {a}», даже с точкой на конце
  assert.equal(translate('Бригада 4 чел. — срок по норме 9 дн.'), 'Crew of 4 ppl — duration by norm 9 days.');
});

test('подстановки', () => {
  assert.equal(translate('Заказ ORD-12 завершён'), 'Order ORD-12 completed');
  // пустая подстановка в конце и точка после фразы
  assert.equal(translate('Отклик на «Монтаж отопления» отправлен'), 'Response to "Heating installation" sent');
  assert.equal(translate('Цены из каталога QazGost, Алматы. Материалы посчитаны целыми упаковками.'), 'Prices from the QazGost catalog, Almaty. Materials are counted in whole packs.');
  // вложенная часть переводится по кускам
  assert.equal(translate('Бригада №1 — Фундаменты'), 'Crew №1 — Foundations');
});

test('пояснения к смете, которые сервер склеивает из готовых фраз', () => {
  assert.equal(translate('стены 12.5 м × 2.7 м − проёмы 3.4 м² = 30.4 м²'), 'walls 12.5 m × 2.7 m − openings 3.4 m² = 30.4 m²');
  assert.equal(translate('(26 м × 2,7 м × 1 эт. − проёмы 8,3 м²) × 0,3 м + 5% бой и подрезка'), '(26 m × 2,7 m × 1 floors − openings 8,3 m²) × 0,3 m + 5% breakage and cutting');
  assert.equal(translate('26 м × 3,5 м − проёмы 8,3 м² = 82,7 м² × 2 прохода'), '26 m × 3,5 m − openings 8,3 m² = 82,7 m² × 2 passes');
  assert.equal(translate('точки: унитаз 1, раковина 2; ≈3 м трубы на точку + 10%'), 'points: toilet 1, washbasin 2; ≈3 m of pipe per point + 10%');
  // кусок без перевода — фраза остаётся как есть
  assert.equal(translate('точки: унитаз 1, неизвестный прибор 2'), null);
});

test('фраза не переводится наполовину случайным шаблоном', () => {
  for (const s of [
    'Стоимость канализации, водоснабжения и электрики по нормативам РК с поправкой на город. Пустые поля считаются автоматически по площади.',
    'Бригады и компании, которые принимают заказы через QazGost. Звоните напрямую или отправьте приглашение на проект.',
  ]) {
    const t = translate(s);
    assert.ok(t && !/[А-Яа-яЁё]/.test(t), `осталась кириллица: ${t}`);
  }
  // в шаблоне со своими словами длинное название заказа — обычное дело
  const title = '[ЛИД] Разработка котлована 1416 м³ (Скальный / мерзлый грунт), вывоз грунта и обратная засыпка пазух';
  assert.equal(translate(`Отметить выполненной: ${title}`), `Mark as done: ${title}`);
  assert.equal(translate('опишите задачу в шаге 4, обмерьте помещение'), 'describe the task in step 4, measure the room');
  assert.equal(translate('контур помещения'), 'room outline');
  // длинный непереведённый текст в шаблоне из одного слова («Заказ {a}») — совпадение случайное, оставить как есть
  const long = 'Заказ ' + 'это очень длинный пользовательский текст без перевода '.repeat(3).trim();
  assert.equal(translate(long), null);
});

test('пояснение из двух готовых кусков переводится целиком, а не наполовину', () => {
  // раньше шаблон «{a} м² + {n}% на подрезку» забирал всё выражение в {a} и оставлял его русским
  assert.equal(translate('стены 22 м × 2,7 м − проёмы 4,14 м² = 55,26 м² + 10% на подрезку'), 'walls 22 m × 2,7 m − openings 4,14 m² = 55,26 m² + 10% for cutting');
});
