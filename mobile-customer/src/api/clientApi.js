// QazGost Клиент — работа с сервером (тот же Go-бэкенд, что у сайта и других приложений).
//   POST /api/v1/auth/login | register     → { token, user }
//   GET  /api/v1/auth/me
//   GET  /api/v1/orders                    → заказы текущего заказчика
//   POST /api/v1/orders                    → создать заказ (нужен вход)
//   POST /api/v1/ai/vision                 → смета по фото
//   POST /api/v1/defect-scan (multipart)   → проверка дефектов (YOLO26)
import { authHeaders, fetchWithTimeout, cleanServerUrl, safeSetItem, genId, localDateISO } from './syncCore';

export const DEFAULT_SERVER = 'https://construction-main-production.up.railway.app';
const K_SERVER = 'qazgost_server_url';
const K_AUTH = 'qazgost_client_auth';
const K_ORDERS = 'qazgost_client_orders';
const K_PENDING = 'qazgost_client_pending';
const K_CITY = 'qazgost_client_city';

export const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Костанай', 'Атырау'];

const readJSON = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } };

export function getServerUrl() {
  return cleanServerUrl(localStorage.getItem(K_SERVER) || DEFAULT_SERVER);
}
export function setServerUrl(url) {
  const u = cleanServerUrl(url);
  if (!u || u === DEFAULT_SERVER) localStorage.removeItem(K_SERVER);
  else safeSetItem(K_SERVER, u);
}
export function getCity() { return localStorage.getItem(K_CITY) || 'Алматы'; }
export function setCity(c) { safeSetItem(K_CITY, c); }

// ── Авторизация ──
export function loadAuth() { return readJSON(K_AUTH, null); }
export function saveAuth(a) { if (a) safeSetItem(K_AUTH, JSON.stringify(a)); else localStorage.removeItem(K_AUTH); }
export function headers() { return authHeaders(loadAuth()?.token); }

async function postJSON(path, body, ms = 12000, extraHeaders = {}) {
  const res = await fetchWithTimeout(`${getServerUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers(), ...extraHeaders },
    body: JSON.stringify(body)
  }, ms);
  let data = null;
  try { data = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `Сервер ответил HTTP ${res.status}`);
  return data;
}

function networkError(e) {
  if (e && e.name === 'AbortError') return new Error('Сервер не ответил вовремя. Проверьте интернет и попробуйте ещё раз.');
  if (e instanceof TypeError) return new Error('Нет связи с сервером. Проверьте интернет.');
  return e;
}

export async function login(email, password) {
  try {
    const d = await postJSON('/api/v1/auth/login', { email: email.trim().toLowerCase(), password });
    const auth = { token: d.token, user: d.user || {} };
    saveAuth(auth);
    return auth;
  } catch (e) { throw networkError(e); }
}

export async function register({ name, email, password, phone, city }) {
  try {
    const d = await postJSON('/api/v1/auth/register', {
      name: name.trim(), fullName: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(), city, role: 'customer'
    });
    if (d && d.token) {
      const auth = { token: d.token, user: d.user || { name, email, phone, city, role: 'customer' } };
      saveAuth(auth);
      return auth;
    }
    return login(email, password);
  } catch (e) { throw networkError(e); }
}

export function logout() { saveAuth(null); }

// ── Заказы ──
export const ORDER_STATUSES = ['Новые', 'Запланировано', 'В работе', 'Приёмка', 'Завершено'];

export function loadOrders() { return readJSON(K_ORDERS, []); }
function saveOrders(list) { return safeSetItem(K_ORDERS, JSON.stringify(list.slice(0, 200))); }
export function loadPending() { return readJSON(K_PENDING, []); }
function savePending(list) { return safeSetItem(K_PENDING, JSON.stringify(list)); }

function normalizeOrder(o) {
  return {
    id: String(o.id ?? genId('o')),
    title: o.title || 'Заказ',
    location: o.location || '',
    type: o.type || '',
    jobType: o.jobType || '',
    status: o.status || 'Запланировано',
    deadline: o.deadline || '',
    time: o.time || '',
    totalSum: Number(o.totalSum) || 0,
    clientName: o.clientName || '',
    clientPhone: o.clientPhone || '',
    contractor: o.contractor || '',
    estimateItems: Array.isArray(o.estimateItems) ? o.estimateItems : [],
    stages: Array.isArray(o.stages) ? o.stages : [],
    createdAt: o.createdAt || new Date().toISOString(),
    _pending: !!o._pending
  };
}

export async function fetchOrders() {
  if (!loadAuth()?.token) return { orders: [...loadPending(), ...loadOrders()].map(normalizeOrder), offline: true };
  try {
    const res = await fetchWithTimeout(`${getServerUrl()}/api/v1/orders`, { headers: { Accept: 'application/json', ...headers() } }, 10000);
    if (res.status === 401) { logout(); throw new Error('Сессия истекла. Войдите снова.'); }
    if (!res.ok) throw new Error(`Сервер ответил HTTP ${res.status}`);
    const data = await res.json();
    const list = (Array.isArray(data) ? data : (data.items || data.orders || [])).map(normalizeOrder)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    saveOrders(list);
    return { orders: [...loadPending().map(normalizeOrder), ...list], offline: false };
  } catch (e) {
    return { orders: [...loadPending(), ...loadOrders()].map(normalizeOrder), offline: true, error: networkError(e).message };
  }
}

/** draft: { service, description, location, city, date, area, budget, phone, name, estimateItems } */
export function buildOrder(draft) {
  const auth = loadAuth();
  const title = draft.service ? `${draft.service}${draft.area ? `, ${draft.area} м²` : ''}` : 'Заказ работ';
  return {
    title,
    location: [draft.city, draft.location].filter(Boolean).join(', '),
    time: '',
    type: 'customer',
    jobType: draft.service || '',
    contractor: '',
    status: 'Новые',
    deadline: draft.date || localDateISO(),
    clientName: draft.name || auth?.user?.name || '',
    clientPhone: draft.phone || auth?.user?.phone || '',
    estimateItems: (draft.estimateItems || []).map((it) => ({
      name: String(it.name || ''), unit: String(it.unit || ''), quantity: Number(it.volume ?? it.quantity) || 0,
      price: Number(it.unit_price ?? it.price) || 0, total: Number(it.total) || 0
    })),
    totalSum: Math.max(0, Math.round(Number(draft.budget) || 0)),
    stages: [],
    description: draft.description || ''
  };
}

export async function createOrder(draft) {
  const body = buildOrder(draft);
  if (!loadAuth()?.token) {
    const local = normalizeOrder({ ...body, id: genId('local'), _pending: true });
    savePending([local, ...loadPending()]);
    return { order: local, queued: true, reason: 'login' };
  }
  try {
    const created = await postJSON('/api/v1/orders', body);
    const order = normalizeOrder(created && created.id ? created : { ...body, id: created?.id });
    saveOrders([order, ...loadOrders()]);
    return { order, queued: false };
  } catch (e) {
    const err = networkError(e);
    if (err.message.startsWith('Нет связи') || err.message.startsWith('Сервер не ответил')) {
      const local = normalizeOrder({ ...body, id: genId('local'), _pending: true });
      savePending([local, ...loadPending()]);
      return { order: local, queued: true, reason: 'offline' };
    }
    throw err;
  }
}

/** Отправить заказы, сохранённые без сети или до входа. */
export async function flushPending() {
  const pending = loadPending();
  if (!pending.length || !loadAuth()?.token) return { sent: 0, left: pending.length };
  const left = [];
  let sent = 0;
  for (const p of pending) {
    try {
      const { _pending, id, createdAt, ...body } = p;
      await postJSON('/api/v1/orders', { ...body, status: 'Новые' });
      sent += 1;
    } catch {
      left.push(p);
    }
  }
  savePending(left);
  return { sent, left: left.length };
}

// ── Смета по фото ──
export async function estimateByPhoto({ photos, description, category, city, area }) {
  try {
    return await postJSON('/api/v1/ai/vision', {
      photos, description, category, city, mode: 'estimate',
      ...(area ? { dimensions: { area: Number(area) } } : {})
    }, 60000);
  } catch (e) { throw networkError(e); }
}

export function normalizeEstimate(raw) {
  // без ключа OpenAI сервер отдаёт сметчик ГЭСН с тремя сценариями — берём «Стандарт»
  let d = raw;
  if (Array.isArray(raw?.scenarios) && raw.scenarios.length) {
    const sc = raw.scenarios.find((x) => /стандарт/i.test(x.name || '')) || raw.scenarios[Math.min(1, raw.scenarios.length - 1)];
    d = {
      detected_type: raw.category ? `${raw.category}${raw.calculatedArea ? `, ${raw.calculatedArea} м²` : ''}` : '',
      items: sc.items,
      total_cost: sc.totalCost,
      works_cost: sc.worksCost,
      materials_cost: sc.materialsCost,
      timeline_days: sc.timelineDays,
      insights: [
        raw.normative ? `Расценки: ${raw.normative}` : '',
        raw.region ? `Регион: ${raw.region}, коэффициент ×${raw.regionalCoeff ?? 1}` : '',
        ...raw.scenarios.map((x) => `${x.name}: ${Math.round(x.totalCost || 0).toLocaleString('ru-RU')} ₸`)
      ]
    };
  }
  const items = (Array.isArray(d?.items) ? d.items : []).map((it) => {
    const volume = Number(it.volume ?? it.quantity) || 0;
    const unitPrice = Number(it.unit_price ?? it.unitPrice ?? it.price) || 0;
    return { name: it.name || 'Работа', unit: it.unit || 'ед.', volume: Math.round(volume * 100) / 100, unit_price: Math.round(unitPrice), total: Math.round(Number(it.total) || volume * unitPrice) };
  });
  const total = Math.round(Number(d?.total_cost ?? d?.totalCost) || items.reduce((s, i) => s + i.total, 0));
  return {
    type: d?.detected_type || d?.detectedType || '',
    items,
    total,
    works: Math.round(Number(d?.works_cost ?? d?.worksCost) || 0),
    materials: Math.round(Number(d?.materials_cost ?? d?.materialsCost) || 0),
    days: Number(d?.timeline_days ?? d?.timelineDays) || 0,
    insights: Array.isArray(d?.insights) ? d.insights.filter(Boolean).map(String) : []
  };
}

// ── Проверка дефектов ──
export async function scanDefects(blob, fileName = 'photo.jpg') {
  const fd = new FormData();
  fd.append('file', blob, fileName);
  try {
    const res = await fetchWithTimeout(`${getServerUrl()}/api/v1/defect-scan?lang=ru`, { method: 'POST', body: fd, headers: headers() }, 60000);
    let data = null;
    try { data = await res.json(); } catch { /* пусто */ }
    if (!res.ok) throw new Error((data && (data.detail || data.error)) || `Сервис дефектов ответил HTTP ${res.status}`);
    return data;
  } catch (e) { throw networkError(e); }
}

export const SEVERITY = {
  critical: { label: 'Критично', tone: 'lost' },
  high: { label: 'Высокая', tone: 'attention' },
  medium: { label: 'Средняя', tone: 'progress' },
  low: { label: 'Низкая', tone: 'done' }
};

export const SUPPORT_WA = 'https://wa.me/77716983869';
