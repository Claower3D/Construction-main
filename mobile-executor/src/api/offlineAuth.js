// Офлайн-вход без «пускаем всех».
// После успешного входа через сервер на телефоне сохраняется соль и SHA-256 от логина и пароля
// (сам пароль не хранится). Без связи с сервером войти можно только в такой, уже проверенный
// на этом телефоне аккаунт и только с тем же паролем.
// Одинаковая копия лежит в mobile-engineer и mobile-executor (src/api/offlineAuth.js).

function storageKey(app) {
  return `qazgost_${app}_verified_logins`;
}

function readAll(app) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(app)) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function canHash() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const norm = (login) => String(login || '').trim().toLowerCase();

/** Запомнить аккаунт после успешного входа через сервер. */
export async function rememberVerifiedLogin(app, login, password, profile) {
  if (!canHash() || !login || !password) return;
  try {
    const all = readAll(app);
    const salt = randomSalt();
    all[norm(login)] = { salt, hash: await sha256Hex(`${salt}:${norm(login)}:${password}`), profile, at: new Date().toISOString() };
    localStorage.setItem(storageKey(app), JSON.stringify(all));
  } catch (e) { /* без офлайн-входа */ }
}

/** Профиль, если этот логин уже входил на телефоне с тем же паролем; иначе null. */
export async function checkVerifiedLogin(app, login, password) {
  if (!canHash() || !login || !password) return null;
  const rec = readAll(app)[norm(login)];
  if (!rec || !rec.salt || !rec.hash) return null;
  try {
    const hash = await sha256Hex(`${rec.salt}:${norm(login)}:${password}`);
    return hash === rec.hash ? (rec.profile || null) : null;
  } catch (e) {
    return null;
  }
}

/** Забыть сохранённую проверку (например, сервер сказал, что пароль неверный). */
export function forgetVerifiedLogin(app, login) {
  try {
    const all = readAll(app);
    delete all[norm(login)];
    localStorage.setItem(storageKey(app), JSON.stringify(all));
  } catch (e) { /* ничего */ }
}
