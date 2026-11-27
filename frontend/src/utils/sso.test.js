// Вход между адресами сайта (qazgost.kz ↔ qazgost.com): node --test src/utils/sso.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ssoSibling, canAskSibling, bridgeUrl, askSibling, takeSsoReply, finishSso, pathAfterSso,
  rememberCabinetPath, ssoAfterLogout, ssoAfterLogin, randomState,
} from './sso.js';

const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), has: (k) => m.has(k) };
};
const at = (href) => {
  const u = new URL(href);
  const loc = { hostname: u.hostname, protocol: u.protocol, port: u.port, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash, replaced: null };
  loc.replace = (to) => { loc.replaced = to; };
  return loc;
};
const hist = () => { const h = { state: null, calls: [] }; h.replaceState = (s, t, url) => h.calls.push(url); return h; };
const CODE = 'Zk3vQ1x_9aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456-';

test('соседний адрес есть только у двух доменов сайта и только по https', () => {
  assert.equal(ssoSibling(at('https://qazgost.kz/login'), false), 'https://qazgost.com');
  assert.equal(ssoSibling(at('https://qazgost.com/login'), false), 'https://qazgost.kz');
  for (const href of ['http://qazgost.kz/login', 'https://www.qazgost.kz/', 'https://qazgost.kz.evil.example/', 'https://evil.example/qazgost.kz',
    'https://construction-main-production.up.railway.app/login', 'https://localhost/login', 'capacitor://localhost/login']) {
    assert.equal(ssoSibling(at(href), false), null, href);
  }
});

test('на компьютере разработчика localhost и 127.0.0.1 ведут себя как два адреса; в приложении — нет', () => {
  assert.equal(ssoSibling(at('http://localhost:5173/login'), true), 'http://127.0.0.1:5173');
  assert.equal(ssoSibling(at('http://127.0.0.1:5173/login'), true), 'http://localhost:5173');
  assert.equal(ssoSibling(at('http://localhost:5173/login'), false), null);
  assert.equal(ssoSibling(at('https://localhost/login'), true), null); // приложение Android работает по https://localhost
});

test('соседний адрес спрашиваем, только если здесь не вошли, сами не выходили и в этой вкладке ещё не спрашивали', () => {
  const loc = at('https://qazgost.com/login');
  assert.equal(canAskSibling({ loc, local: store(), session: store(), dev: false }), true);
  assert.equal(canAskSibling({ loc, local: store({ auth_token: 't' }), session: store(), dev: false }), false);
  assert.equal(canAskSibling({ loc, local: store({ qg_sso_skip: '1' }), session: store(), dev: false }), false);
  assert.equal(canAskSibling({ loc, local: store(), session: store({ qg_sso_tried: '1' }), dev: false }), false);
  assert.equal(canAskSibling({ loc: at('https://example.org/login'), local: store(), session: store(), dev: false }), false);
});

test('случайное число для ответа — 32 шестнадцатеричных знака, каждый раз новое', () => {
  const a = randomState(globalThis.crypto), b = randomState(globalThis.crypto);
  assert.match(a, /^[a-f0-9]{32}$/);
  assert.notEqual(a, b);
});

test('вкладка уходит на мост соседнего адреса и просит вернуть её на свою страницу входа', async () => {
  const loc = at('https://qazgost.com/login'), local = store(), session = store();
  const seen = [];
  const left = await askSibling({ loc, local, session, dev: false, doFetch: async (url, opt) => { seen.push([url, opt.mode, session.getItem('qg_sso_tried')]); return {}; } });
  assert.equal(left, true);
  assert.deepEqual(seen, [['https://qazgost.kz/sso.html', 'no-cors', '1']]); // отметка «уже спрашивали» стоит до запроса
  const state = session.getItem('qg_sso_state');
  assert.match(state, /^[a-f0-9]{32}$/);
  assert.equal(loc.replaced, bridgeUrl('https://qazgost.kz', 'https://qazgost.com', state));
  assert.equal(loc.replaced, `https://qazgost.kz/sso.html#return=${encodeURIComponent('https://qazgost.com/login')}&state=${state}`);
  // второй раз в этой вкладке не спрашиваем
  loc.replaced = null;
  assert.equal(await askSibling({ loc, local, session, dev: false, doFetch: async () => { throw new Error('не должно вызываться'); } }), false);
  assert.equal(loc.replaced, null);
});

test('если второй адрес не открывается, человека туда не ведём — вход с паролем остаётся', async () => {
  const loc = at('https://qazgost.kz/login'), session = store();
  const left = await askSibling({ loc, local: store(), session, dev: false, doFetch: async () => { throw new TypeError('Failed to fetch'); } });
  assert.equal(left, false);
  assert.equal(loc.replaced, null);
  assert.equal(session.getItem('qg_sso_state'), null);
  assert.equal(session.getItem('qg_sso_tried'), '1'); // и больше не пробуем
});

test('ответ моста принимается, только если его просила эта вкладка; код сразу убирается из адреса', () => {
  const state = 'a'.repeat(32);
  const ok = at(`https://qazgost.com/login#sso=${CODE}&state=${state}`);
  const h = hist(), session = store({ qg_sso_state: state });
  assert.equal(takeSsoReply({ loc: ok, hist: h, local: store(), session }), CODE);
  assert.deepEqual(h.calls, ['/login']);
  assert.equal(session.getItem('qg_sso_state'), null); // число одноразовое

  const cases = [
    ['чужое число', `#sso=${CODE}&state=${'b'.repeat(32)}`, { qg_sso_state: state }, {}],
    ['вкладка ничего не просила', `#sso=${CODE}&state=${state}`, {}, {}],
    ['на соседнем адресе не вошли', `#sso=none&state=${state}`, { qg_sso_state: state }, {}],
    ['мусор вместо кода', `#sso=<script>&state=${state}`, { qg_sso_state: state }, {}],
    ['здесь уже вошли', `#sso=${CODE}&state=${state}`, { qg_sso_state: state }, { auth_token: 't' }],
    ['человек сам вышел', `#sso=${CODE}&state=${state}`, { qg_sso_state: state }, { qg_sso_skip: '1' }],
  ];
  for (const [why, hash, ses, loc] of cases) {
    const hh = hist();
    assert.equal(takeSsoReply({ loc: at(`https://qazgost.com/login${hash}`), hist: hh, local: store(loc), session: store(ses) }), null, why);
    assert.deepEqual(hh.calls, ['/login'], `${why}: код должен исчезнуть из адреса`);
  }
  // обычный якорь страницы не трогаем
  const plain = hist();
  assert.equal(takeSsoReply({ loc: at('https://qazgost.com/#pricing'), hist: plain, local: store(), session: store({ qg_sso_state: state }) }), null);
  assert.deepEqual(plain.calls, []);
});

test('код меняется на сессию, и она сохраняется так же, как при обычном входе', async () => {
  const local = store();
  const calls = [];
  const user = await finishSso(CODE, { local, doFetch: async (url, opt) => { calls.push([url, opt.method, opt.body]); return { ok: true, json: async () => ({ token: 'jwt', user: { id: 'u1', email: 'a@b.kz', role: 'manager' } }) }; } });
  assert.deepEqual(user, { id: 'u1', email: 'a@b.kz', role: 'manager' });
  assert.deepEqual(calls, [['/api/v1/auth/sso/exchange', 'POST', JSON.stringify({ code: CODE })]]);
  assert.equal(local.getItem('auth_token'), 'jwt');
  assert.deepEqual(JSON.parse(local.getItem('app_currentUser')), user);
  assert.equal(local.getItem('app_role'), 'manager');
});

test('отказ сервера, неполный ответ или обрыв связи — ничего не сохраняем', async () => {
  for (const doFetch of [
    async () => ({ ok: false, json: async () => ({ error: 'Код недействителен' }) }),
    async () => ({ ok: true, json: async () => ({ token: 'jwt' }) }),
    async () => ({ ok: true, json: async () => ({ user: { role: 'admin' } }) }),
    async () => { throw new TypeError('Failed to fetch'); },
  ]) {
    const local = store();
    assert.equal(await finishSso(CODE, { local, doFetch }), null);
    assert.equal(local.has('auth_token') || local.has('app_currentUser') || local.has('app_role'), false);
  }
});

test('после входа ведём в кабинет, который человек открывал, иначе в кабинет его роли', () => {
  const login = at('https://qazgost.com/login');
  assert.equal(pathAfterSso({ role: 'admin' }, { loc: login, session: store() }), '/admin');
  assert.equal(pathAfterSso({ role: 'something' }, { loc: login, session: store() }), '/customer');
  const session = store({ qg_sso_path: '/admin/builder-objects' });
  assert.equal(pathAfterSso({ role: 'admin' }, { loc: login, session }), '/admin/builder-objects');
  assert.equal(session.getItem('qg_sso_path'), null);
  assert.equal(pathAfterSso({ role: 'admin' }, { loc: login, session: store({ qg_sso_path: '//evil.example/x' }) }), '/admin'); // чужой адрес не подставить
  assert.equal(pathAfterSso({ role: 'admin' }, { loc: at('https://qazgost.com/manager'), session: store() }), null);

  const s2 = store();
  rememberCabinetPath({ loc: at('https://qazgost.com/admin/builder-objects?tab=2'), local: store(), session: s2 });
  assert.equal(s2.getItem('qg_sso_path'), '/admin/builder-objects?tab=2');
  const s3 = store();
  rememberCabinetPath({ loc: at('https://qazgost.com/catalog'), local: store(), session: s3 }); // не кабинет
  rememberCabinetPath({ loc: at('https://qazgost.com/admin'), local: store({ auth_token: 't' }), session: s3 }); // уже вошли
  assert.equal(s3.getItem('qg_sso_path'), null);
});

test('после выхода автоматический вход выключен, после входа с паролем — снова включён', () => {
  const local = store(), session = store({ qg_sso_path: '/admin' });
  const loc = at('https://qazgost.kz/login');
  ssoAfterLogout(local);
  assert.equal(canAskSibling({ loc, local, session: store(), dev: false }), false);
  ssoAfterLogin(local, session);
  assert.equal(canAskSibling({ loc, local, session: store(), dev: false }), true);
  assert.equal(session.getItem('qg_sso_path'), null);
});
