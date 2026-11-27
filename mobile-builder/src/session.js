// Вход в приложение «VIP Застройщик». Сессия хранится под теми же именами, что и на сайте:
// модуль строительства (services/vipApi) берёт токен оттуда сам.
import { apiHost } from '@site/services/vipApi';

const K_TOKEN = 'auth_token';
const K_USER = 'app_currentUser';
export const ROLES = ['admin', 'manager']; // рабочие проекты ведут администратор и менеджер
// наблюдатель (user.observer) проекты только смотрит — сервер пускает его лишь на чтение
export const mayOpen = (user) => !!user && (ROLES.includes(user.role) || user.observer === true);

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

function tokenAlive(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch { return false; }
}

export function getSession() {
  const token = read(K_TOKEN);
  if (!token || !tokenAlive(token)) return null;
  try {
    const user = JSON.parse(read(K_USER) || 'null');
    return mayOpen(user) ? { token, user } : null;
  } catch { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(K_TOKEN); localStorage.removeItem(K_USER); } catch { /* память недоступна */ }
}

export async function signIn(email, password) {
  let res;
  try {
    res = await fetch(`${apiHost()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email || '').trim().toLowerCase(), password }),
    });
  } catch { throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.'); }
  let data = {};
  try { data = await res.json(); } catch { /* ответ без тела */ }
  if (!res.ok) {
    if (res.status === 429) throw new Error(data.error || 'Слишком много попыток входа. Подождите несколько минут.');
    if (res.status === 400 || res.status === 401) throw new Error(data.error || 'Неверный email или пароль');
    throw new Error('Сервер временно недоступен, попробуйте через минуту.');
  }
  if (!data.token || !data.user) throw new Error('Сервер вернул неполный ответ, попробуйте ещё раз.');
  if (!mayOpen(data.user)) throw new Error('Это приложение для администратора и менеджера. Войдите под рабочей учётной записью.');
  try { localStorage.setItem(K_TOKEN, data.token); localStorage.setItem(K_USER, JSON.stringify(data.user)); } catch { /* память недоступна */ }
  return { token: data.token, user: data.user };
}

/** Сервер ещё принимает сессию? false — закрыта (вход с другого устройства, смена пароля, срок). */
export async function sessionAccepted(token) {
  try {
    const res = await fetch(`${apiHost()}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return res.status !== 401;
  } catch { return true; } // нет связи — не выкидываем из приложения
}
