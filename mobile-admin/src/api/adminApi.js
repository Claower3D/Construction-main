// Связь приложения «QazGost Админ» с сервером.
// Вход — только существующим аккаунтом с ролью «администратор». Никакой автоматической
// регистрации (в отличие от старых приложений) и никаких вписанных паролей.

export const DEFAULT_SERVER = 'https://construction-main-production.up.railway.app';
const K_SERVER = 'qga_server';
const K_TOKEN = 'qga_token';
const K_USER = 'qga_user';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* память недоступна */ } };

export function getServer() { return (read(K_SERVER) || DEFAULT_SERVER).replace(/\/+$/, ''); }
export function setServer(url) {
  const clean = String(url || '').trim().replace(/\/+$/, '');
  write(K_SERVER, clean && clean !== DEFAULT_SERVER ? clean : null);
}

export function getSession() {
  const token = read(K_TOKEN);
  if (!token) return null;
  try {
    const user = JSON.parse(read(K_USER) || 'null');
    // срок жизни токена — в нём самом (exp, секунды)
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) { clearSession(); return null; }
    return { token, user };
  } catch { clearSession(); return null; }
}
function saveSession(token, user) { write(K_TOKEN, token); write(K_USER, JSON.stringify(user)); }
export function clearSession() { write(K_TOKEN, null); write(K_USER, null); }

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

async function request(path, { method = 'GET', body, auth = true, timeout = 20000 } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const s = getSession();
    if (!s) { onUnauthorized(); throw new ApiError('Сессия закончилась — войдите снова', 401); }
    headers.Authorization = `Bearer ${s.token}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(getServer() + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'Сервер не ответил вовремя. Проверьте интернет.' : 'Нет связи с сервером. Проверьте интернет.', 0);
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const msg = (data && data.error) || `Сервер ответил ошибкой ${res.status}`;
    if (res.status === 401 && auth) { clearSession(); onUnauthorized(); }
    throw new ApiError(msg, res.status);
  }
  return data;
}

export async function login(email, password) {
  const body = { email: email.trim().toLowerCase(), password };
  let data;
  try {
    data = await request('/api/v1/auth/login', { method: 'POST', body, auth: false });
  } catch (e) {
    // клавиатура телефона часто добавляет пробел после слова: пробуем ещё раз без пробелов по краям
    if (e.status !== 401 || password.trim() === password || !password.trim()) throw e;
    data = await request('/api/v1/auth/login', { method: 'POST', body: { ...body, password: password.trim() }, auth: false });
  }
  if (!data || !data.token || !data.user) throw new ApiError('Сервер вернул неполный ответ', 500);
  if (data.user.role !== 'admin') {
    throw new ApiError('Это приложение только для администраторов. У этого аккаунта роль «' + roleLabel(data.user.role) + '».', 403);
  }
  saveSession(data.token, data.user);
  return data.user;
}

export const api = {
  overview: (days) => request(`/api/v1/admin/overview?days=${days}`),
  users: ({ q = '', role = '', unverified = false, limit = 50, offset = 0 } = {}) => {
    const p = new URLSearchParams({ limit, offset });
    if (q) p.set('q', q);
    if (role) p.set('role', role);
    if (unverified) p.set('unverified', '1');
    return request(`/api/v1/admin/users?${p}`);
  },
  updateUser: (id, patch) => request(`/api/v1/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }),
  audit: () => request('/api/v1/admin/audit?limit=200'),
  orders: () => request('/api/v1/orders'),
  updateOrder: (id, patch) => request(`/api/v1/orders/${id}`, { method: 'PATCH', body: patch }),
  disputes: () => request('/api/v1/disputes'),
  priceStats: () => request('/api/v1/prices/stats', { auth: false }),
  regions: () => request('/api/v1/prices/regions', { auth: false }),
  prices: ({ q = '', type = '', limit = 40 } = {}) => {
    const p = new URLSearchParams({ limit });
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    return request(`/api/v1/prices?${p}`, { auth: false });
  },
  equipment: () => request('/api/v1/equipment', { auth: false }),
  materials: () => request('/api/v1/materials', { auth: false }),
  health: () => request('/health', { auth: false }),
  changePassword: (currentPassword, newPassword) => request('/api/v1/auth/password', { method: 'POST', body: { currentPassword, newPassword } }),
};

export function updateStoredToken(token) {
  const s = getSession();
  if (s && token) saveSession(token, s.user);
}

// ── Подписи ──────────────────────────────────────────────
export const ROLES = [
  { id: 'customer', label: 'Заказчик', plural: 'Заказчики' },
  { id: 'executor', label: 'Исполнитель', plural: 'Исполнители' },
  { id: 'engineer', label: 'Инженер', plural: 'Инженеры' },
  { id: 'company', label: 'Компания', plural: 'Компании' },
  { id: 'manager', label: 'Менеджер', plural: 'Менеджеры' },
  { id: 'admin', label: 'Администратор', plural: 'Администраторы' },
];
export function roleLabel(id) { return (ROLES.find((r) => r.id === id) || {}).label || id || 'без роли'; }

export const ORDER_STATUSES = ['Новые', 'Запланировано', 'В работе', 'Завершено', 'Отменено'];

export function formatMoney(v) { return `${Math.round(Number(v) || 0).toLocaleString('ru-RU')} ₸`; }
export function formatInt(v) { return Math.round(Number(v) || 0).toLocaleString('ru-RU'); }
export function formatDate(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', withTime
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}
export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100; const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
