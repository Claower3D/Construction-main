// Проверка французского, итальянского и испанского (Мексика): свой словарь, запасной английский, единицы, правила.
// Каждый язык проверяется в отдельном процессе (язык выбирается при загрузке модуля): node --test запускает
// этот файл, а он — сам себя по разу на каждый язык.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CASES = {
  fr: {
    locale: 'fr-FR', name: 'Français', browser: 'fr-CA',
    phrases: { Войти: 'Se connecter', 'Оценка стоимости': 'Estimation des coûts', 'Каталог': 'Catalogue', 'Найдено: 9 708': 'Trouvé : 9 708' },
    units: { '12 шт': '12 u.', '3 дн': '3 j' },
    rules: { '5 дней назад': 'il y a 5 jours', '12 000 ₸ / смена': '12 000 ₸ / poste', 'Показать 14 объявлений': 'Afficher 14 annonces' },
  },
  it: {
    locale: 'it-IT', name: 'Italiano', browser: 'it-IT',
    phrases: { Войти: 'Accedi', 'Оценка стоимости': 'Stima dei costi', 'Каталог': 'Catalogo', 'Найдено: 9 708': 'Trovati: 9 708' },
    units: { '12 шт': '12 pz', '3 дн': '3 gg' },
    rules: { '5 дней назад': '5 giorni fa', '12 000 ₸ / смена': '12 000 ₸ / turno', 'Показать 14 объявлений': 'Mostra 14 annunci' },
  },
  es: {
    locale: 'es-MX', name: 'Español (México)', browser: 'es-MX',
    phrases: { Войти: 'Iniciar sesión', 'Оценка стоимости': 'Estimación de costos', 'Каталог': 'Catálogo', 'Найдено: 9 708': 'Encontrados: 9 708' },
    units: { '12 шт': '12 pza', '3 дн': '3 días' },
    rules: { '5 дней назад': 'hace 5 días', '12 000 ₸ / смена': '12 000 ₸ / turno', 'Показать 14 объявлений': 'Mostrar 14 anuncios' },
  },
};

const one = process.env.I18N_LANG;
if (!one) {
  for (const code of Object.keys(CASES)) {
    test(`язык ${code}`, () => {
      const r = spawnSync(process.execPath, ['--test', fileURLToPath(import.meta.url)], { env: { ...process.env, I18N_LANG: code }, encoding: 'utf8' });
      assert.equal(r.status, 0, r.stdout + r.stderr);
    });
  }
} else {
  const c = CASES[one];
  globalThis.window = { location: { hostname: 'qazgost.kz' } };
  globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? one : null), setItem() {} };
  const { translate, langReady, getLang, langLocale, defaultLangForHost, LANGS } = await import('./index.js');
  await langReady();
  const CYR = /[А-Яа-яЁё]/;

  test(`${one}: язык выбран и известен браузеру`, () => {
    assert.equal(getLang(), one);
    assert.equal(langLocale(), c.locale);
    assert.ok(LANGS.some((l) => l.code === one && l.name === c.name));
    assert.equal(defaultLangForHost('qazgost.com', [c.browser, 'en-US']), one);
    assert.equal(defaultLangForHost('qazgost.kz', [c.browser]), 'ru');
  });

  test(`${one}: фразы, единицы и правила`, () => {
    for (const [ru, out] of Object.entries({ ...c.phrases, ...c.units, ...c.rules })) assert.equal(translate(ru), out, ru);
    assert.equal(translate('Hello'), null);
  });

  test(`${one}: чего нет на языке — показывается по-английски, а не по-русски`, async () => {
    const en = await import('./dict.en.js');
    const own = await import(`./dict.${one}.js`);
    const missing = Object.keys(en.EN).filter((k) => own.T[k] == null && !/\{n\}/.test(k) && k.length > 12);
    assert.ok(missing.length > 100);
    for (const k of missing.slice(0, 50)) {
      const t = translate(k);
      assert.ok(t && !CYR.test(t.replace(/[₸№]/g, '')), `«${k}» → ${t}`);
    }
    for (const [k, v] of Object.entries(own.T)) assert.ok(!CYR.test(v), `${k} → ${v}`);
  });
}
