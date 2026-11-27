// Вход между адресами сайта: qazgost.kz ↔ qazgost.com.
//
// У каждого адреса своё хранилище в браузере, поэтому человек, вошедший на одном, на втором видел страницу
// входа. Теперь страница входа один раз за вкладку спрашивает соседний адрес: браузер на мгновение переходит
// на его страницу-мост (public/sso.html) и возвращается — с одноразовым кодом, если там человек уже вошёл.
// Код меняется на обычную сессию запросом /api/v1/auth/sso/exchange.
//
// Что защищает от чужих сайтов:
//   - мост возвращает человека только на соседний адрес сайта;
//   - ответ принимается, только если его просила эта вкладка (случайное число state);
//   - сервер меняет код один раз, в течение минуты и только для своего адреса.
// После выхода из аккаунта автоматический вход на этом адресе выключен до следующего входа с паролем:
// иначе выйти и войти под другим аккаунтом было бы нельзя.

const PAIR = { 'qazgost.kz': 'https://qazgost.com', 'qazgost.com': 'https://qazgost.kz' };
const TRIED = 'qg_sso_tried'; // эта вкладка уже спрашивала соседний адрес
const STATE = 'qg_sso_state'; // число, с которым вкладка ждёт ответ
const PATH = 'qg_sso_path'; // кабинет, который человек открывал до страницы входа
const SKIP = 'qg_sso_skip'; // человек сам вышел из аккаунта на этом адресе
const TOKEN = 'auth_token';
const CABINETS = ['admin', 'customer', 'executor', 'company', 'engineer', 'crm', 'manager'];

const isDev = () => typeof import.meta !== 'undefined' && !!import.meta.env && !!import.meta.env.DEV;
const read = (store, key) => { try { return store.getItem(key); } catch (e) { return null; } };
const write = (store, key, value) => { try { if (value === null) store.removeItem(key); else store.setItem(key, value); } catch (e) { /* хранилище недоступно */ } };

/** Соседний адрес сайта для текущего или null, если его нет (приложение, тестовый адрес) */
export function ssoSibling(loc = window.location, dev = isDev()) {
  const host = loc.hostname;
  if (loc.protocol === 'https:' && PAIR[host]) return PAIR[host];
  // на компьютере разработчика два адреса одного сервера ведут себя как два домена
  if (dev && loc.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1')) {
    return `http://${host === 'localhost' ? '127.0.0.1' : 'localhost'}${loc.port ? `:${loc.port}` : ''}`;
  }
  return null;
}

/** Стоит ли спрашивать соседний адрес: он есть, здесь не вошли, из аккаунта сами не выходили, в этой вкладке ещё не спрашивали */
export function canAskSibling({ loc = window.location, local = window.localStorage, session = window.sessionStorage, dev = isDev() } = {}) {
  return !!ssoSibling(loc, dev) && !read(local, TOKEN) && !read(local, SKIP) && !read(session, TRIED);
}

export function randomState(cryptoObj = globalThis.crypto) {
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Адрес страницы-моста соседнего адреса: вернуться нужно на нашу страницу входа */
export function bridgeUrl(sibling, origin, state) {
  return `${sibling}/sso.html#return=${encodeURIComponent(`${origin}/login`)}&state=${state}`;
}

/**
 * Спрашивает соседний адрес. Возвращает true, если браузер уходит на страницу-мост, и false, если остаёмся
 * (спрашивать нельзя или соседний адрес сейчас недоступен — тогда вход с паролем работает как обычно).
 */
export async function askSibling({ loc = window.location, local = window.localStorage, session = window.sessionStorage, doFetch = window.fetch.bind(window), dev = isDev() } = {}) {
  if (!canAskSibling({ loc, local, session, dev })) return false;
  const sibling = ssoSibling(loc, dev);
  write(session, TRIED, '1'); // до любых запросов: повторов не будет, даже если что-то сорвётся
  // если второй адрес не открывается, человека туда не ведём — иначе он увидел бы ошибку браузера вместо входа
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 2500);
    await doFetch(`${sibling}/sso.html`, { mode: 'no-cors', cache: 'no-store', signal: ctl ? ctl.signal : undefined });
    clearTimeout(timer);
  } catch (e) {
    return false;
  }
  const state = randomState();
  write(session, STATE, state);
  loc.replace(bridgeUrl(sibling, loc.origin, state));
  return true;
}

/**
 * Разбирает ответ моста в адресе страницы (#sso=…&state=…) и сразу убирает его из адреса.
 * Возвращает код, если его просила эта вкладка, иначе null.
 */
export function takeSsoReply({ loc = window.location, hist = window.history, local = window.localStorage, session = window.sessionStorage } = {}) {
  const hash = String(loc.hash || '');
  if (!hash.startsWith('#sso=')) return null;
  const params = new URLSearchParams(hash.slice(1));
  try { hist.replaceState(hist.state, '', loc.pathname + (loc.search || '')); } catch (e) { /* адрес останется как есть */ }
  const want = read(session, STATE);
  write(session, STATE, null);
  const code = params.get('sso') || '';
  const state = params.get('state') || '';
  if (!want || state !== want) return null; // ответ, которого эта вкладка не просила
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(code)) return null; // «none» или мусор
  if (read(local, TOKEN) || read(local, SKIP)) return null;
  return code;
}

/** Меняет код на сессию и сохраняет её так же, как обычный вход. Возвращает пользователя или null. */
export async function finishSso(code, { local = window.localStorage, doFetch = window.fetch.bind(window) } = {}) {
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 8000);
    const res = await doFetch('/api/v1/auth/sso/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
      signal: ctl ? ctl.signal : undefined,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.token || !data.user || !data.user.role) return null;
    write(local, TOKEN, data.token);
    write(local, 'app_currentUser', JSON.stringify(data.user));
    write(local, 'app_role', data.user.role);
    return data.user;
  } catch (e) {
    return null;
  }
}

/** Куда вести после входа: в кабинет, который человек открывал, иначе в кабинет своей роли */
export function pathAfterSso(user, { loc = window.location, session = window.sessionStorage } = {}) {
  const wanted = read(session, PATH);
  write(session, PATH, null);
  if (loc.pathname !== '/login') return null; // человек уже на нужной странице
  if (wanted && wanted.startsWith('/') && !wanted.startsWith('//')) return wanted;
  return `/${CABINETS.includes(user.role) ? user.role : 'customer'}`;
}

/** При открытии сайта без входа запоминает адрес кабинета: после входа с соседнего адреса вернём человека туда */
export function rememberCabinetPath({ loc = window.location, local = window.localStorage, session = window.sessionStorage } = {}) {
  const seg = (loc.pathname.split('/')[1] || '').toLowerCase();
  if (CABINETS.includes(seg) && !read(local, TOKEN)) write(session, PATH, loc.pathname + (loc.search || ''));
}

/** Человек сам вышел из аккаунта: автоматический вход на этом адресе выключен до входа с паролем */
export function ssoAfterLogout(local = window.localStorage) { write(local, SKIP, '1'); }
/** Человек вошёл с паролем: автоматический вход снова разрешён */
export function ssoAfterLogin(local = window.localStorage, session = window.sessionStorage) { write(local, SKIP, null); write(session, PATH, null); }

/**
 * Вызывается один раз при открытии сайта, до отрисовки: если страница открыта ответом моста, входит по коду.
 * Сайт рисуется уже вошедшим, без мелькания страницы входа.
 */
export async function ssoOnStart() {
  rememberCabinetPath();
  const code = takeSsoReply();
  if (!code) return;
  const user = await finishSso(code);
  if (!user) return;
  const next = pathAfterSso(user);
  if (next) { try { window.history.replaceState({}, '', next); } catch (e) { /* останемся на странице входа: там есть кнопка «в кабинет» */ } }
}
