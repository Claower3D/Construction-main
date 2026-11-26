// Английский для Великобритании и Канады: общий английский словарь, своё написание.
// Каждый вариант проверяется в отдельном процессе, как в i18n.eu.test.js.
// Запуск: npm run test:i18n
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RESPELL } from './enVariants.js';

test('правила написания', () => {
  const gb = RESPELL['en-GB']; const ca = RESPELL['en-CA'];
  assert.equal(gb('Choose a working organization'), 'Choose a working organisation');
  assert.equal(ca('Choose a working organization'), 'Choose a working organization');
  assert.equal(gb('Back to catalog'), 'Back to catalogue');
  assert.equal(ca('Back to catalog'), 'Back to catalogue');
  assert.equal(gb('Area, square meters'), 'Area, square metres');
  assert.equal(gb('Gas meter with temperature correction'), 'Gas meter with temperature correction');
  assert.equal(gb('Apartment renovation'), 'Flat renovation');
  assert.equal(ca('Apartment renovation'), 'Apartment renovation');
  assert.equal(gb('License plate'), 'Number plate');
  assert.equal(ca('License plate'), 'Licence plate');
  assert.equal(gb('Grid cell size'), 'Grid cell size');
  assert.equal(gb('ORGANIZATION'), 'ORGANISATION');
  assert.equal(gb('Recognized structural elements'), 'Recognised structural elements');
  assert.equal(ca('labeled photos, colors'), 'labelled photos, colours');
});

const CASES = {
  'en-GB': { locale: 'en-GB', browser: 'en-GB', phrases: { Каталог: 'Catalogue', Квартира: 'Flat', 'Выбор организации': 'Organisation selection', Войти: 'Sign in' } },
  'en-CA': { locale: 'en-CA', browser: 'en-CA', phrases: { Каталог: 'Catalogue', Квартира: 'Apartment', 'Выбор организации': 'Organization selection', Госномер: 'Licence plate' } },
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
  const { translate, langReady, getLang, langLocale, defaultLangForHost } = await import('./index.js');
  await langReady();
  test(`${one}: язык, браузер и фразы`, () => {
    assert.equal(getLang(), one);
    assert.equal(langLocale(), c.locale);
    assert.equal(defaultLangForHost('qazgost.com', [c.browser]), one);
    assert.equal(defaultLangForHost('qazgost.com', ['en-AU']), 'en');
    for (const [ru, out] of Object.entries(c.phrases)) assert.equal(translate(ru), out, ru);
  });
}
