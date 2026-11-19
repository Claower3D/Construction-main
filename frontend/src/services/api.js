/**
 * QAZGOST AI - Unified API Client (React Frontend -> Go High-Speed Backend)
 */

import { jsonAuthHeaders } from './platformUtils';

const BASE_URL = '/api/v1';

// Helper for JWT Auth headers: Authorization только при настоящем JWT (не при локальных token-…)
function getHeaders(extraHeaders = {}) {
  return jsonAuthHeaders(extraHeaders);
}

// Helper to safely parse JSON or empty response
async function safeJsonParse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

// ==========================================
// 1. SYSTEM & HEALTH
// ==========================================

export async function checkHealth() {
  try {
    const res = await fetch('/health');
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    // Без фейкового «online»: честный статус офлайн
    return { status: 'offline', ok: false, error: e.message };
  }
}

export async function getStatus() {
  try {
    const res = await fetch('/api');
    if (!res.ok) throw new Error(`Status check failed: HTTP ${res.status}`);
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { status: 'offline', ok: false, error: e.message };
  }
}

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================

// Аккаунты команды. Паролей здесь нет и быть не должно: этот файл скачивает любой посетитель сайта.
// Пароль проверяет только сервер. В списке — сотрудники, чей аккаунт создаётся при первом входе
// с тем паролем, который человек ввёл; значение — роль. Имя и роль закрепляет сервер
// (teamAccounts в go-backend/pkg/handlers/auth.go).
const TEAM_FIRST_SIGN_IN = {
  'vladimir.master@qazgost.kz': 'executor',
  'danil.master@qazgost.kz': 'executor',
  'radion.manipulator@qazgost.kz': 'executor',
  'maxim.engineer@qazgost.kz': 'engineer',
};

export async function loginUser(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) throw new Error('Введите email и пароль');
  const firstSignInRole = TEAM_FIRST_SIGN_IN[normalizedEmail];

  // Вход — только через сервер, без «запасных» входов в браузере: раньше они пускали с паролем,
  // записанным прямо в этом файле, или вовсе с любым.
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
  } catch (e) {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.');
  }
  let data = await safeJsonParse(res);
  if (!res.ok && (res.status === 400 || res.status === 401) && firstSignInRole) {
    // Первый вход сотрудника: аккаунта на сервере ещё нет — создаём его с введённым паролем.
    // Если аккаунт уже есть, сервер ответит отказом, и это просто неверный пароль.
    try {
      const reg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, role: firstSignInRole }),
      });
      if (reg.ok) { res = reg; data = await safeJsonParse(reg); }
    } catch { /* нет связи — ниже покажем обычную ошибку входа */ }
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) throw new Error(data.error || 'Неверный email или пароль');
    // 429 — сработала защита от подбора пароля: сервер сам пишет, сколько подождать
    if (res.status === 429) throw new Error(data.error || 'Слишком много попыток входа. Подождите несколько минут.');
    throw new Error('Сервер временно недоступен, попробуйте через минуту.');
  }
  if (!data.token || !data.user) throw new Error('Сервер вернул неполный ответ, попробуйте ещё раз.');
  localStorage.setItem('auth_token', data.token);
  return data;
}

export async function registerUser(userData) {
  // Регистрация — только на сервере. Раньше при недоступном сервере создавался «локальный» аккаунт
  // с выдуманным токеном: человек считал себя зарегистрированным, но аккаунта не существовало —
  // войти с другого устройства или после выхода было нельзя, а данные оставались только в браузере.
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  } catch (error) {
    throw new Error('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз — аккаунт пока не создан.');
  }
  const data = await safeJsonParse(res);
  if ([502, 503, 504].includes(res.status)) {
    throw new Error('Сервер временно недоступен. Попробуйте через минуту — аккаунт пока не создан.');
  }
  if (res.status === 429) throw new Error(data.error || 'Слишком много попыток регистрации. Подождите минуту.');
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  if (!data.token || !data.user) throw new Error('Сервер вернул неполный ответ, попробуйте ещё раз.');
  localStorage.setItem('auth_token', data.token);
  return data;
}

// ==========================================
// 3. PRICEDB & REGIONAL GESN CATALOG (23k items)
// ==========================================
// Все функции ниже при ошибке НЕ выдают фейковых данных:
// списки → [] с флагами .offline/.error, объекты → { ok:false, error }.

function emptyList(error) {
  const list = [];
  list.offline = true;
  list.error = error;
  return list;
}

async function errorText(res) {
  const data = await safeJsonParse(res);
  return data?.error || data?.detail || `HTTP ${res.status}`;
}

export async function fetchPrices({ q = '', category = '', type = '', region = 'Алматы', limit = 50, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams({
      q,
      category,
      type,
      region,
      limit: String(limit),
      offset: String(offset)
    });
    const res = await fetch(`${BASE_URL}/prices?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    return Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  } catch (err) {
    console.warn('fetchPrices failed:', err.message);
    return emptyList(err.message);
  }
}

export async function fetchPriceStats() {
  try {
    const res = await fetch(`${BASE_URL}/prices/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function fetchRegions() {
  try {
    const res = await fetch(`${BASE_URL}/prices/regions`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    return data.regions || {};
  } catch (e) {
    console.warn('fetchRegions failed:', e.message);
    return {};
  }
}

// ==========================================
// 4. QTO ESTIMATOR & SCENARIOS
// ==========================================

export async function calculateQTOEstimate(estimateParams) {
  try {
    const res = await fetch(`${BASE_URL}/ai/estimate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(estimateParams),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    // Раньше здесь подставлялась выдуманная смета area×37 200 ₸
    return { ok: false, error: e.message };
  }
}

export function getExportEstimateCsvUrl(category = 'foundation', city = 'Алматы') {
  return `${BASE_URL}/export/estimate.csv?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
}

// ==========================================
// 5. ORDERS & STAGES
// ==========================================

export async function fetchOrders() {
  try {
    const res = await fetch(`${BASE_URL}/orders`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    // Пустая БД: Go отдаёт null → раньше это падало в catch и показывались фейковые заказы
    if (data === null) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    return emptyList(e.message);
  }
}

export async function createOrder(orderData) {
  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ==========================================
// 6. ENGINEERS & TECH SUPERVISION
// ==========================================

export async function fetchEngineers() {
  try {
    const res = await fetch(`${BASE_URL}/engineers`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.items) ? data.items : [];
  } catch (e) {
    return emptyList(e.message);
  }
}

export async function assignEngineer(orderId, engineerId) {
  try {
    const res = await fetch(`${BASE_URL}/engineers/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderId, engineerId }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), success: true, ok: true };
  } catch (e) {
    return { success: false, ok: false, error: e.message };
  }
}

// ==========================================
// 7. FINANCE, WALLET & ESCROW
// ==========================================
// Ответ с ошибкой (401/4xx/5xx) больше не возвращается как «данные»: { ok:false, error }.

export async function fetchWalletBalance(userId = 'u_customer_1') {
  try {
    const res = await fetch(`${BASE_URL}/finance/balance?userId=${encodeURIComponent(userId)}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function topupWallet(userId = 'u_customer_1', amount = 100000, method = 'Kaspi QR') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'Некорректная сумма' };
  try {
    const res = await fetch(`${BASE_URL}/finance/topup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, amount: value, method }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function lockEscrow({ userId = 'u_customer_1', orderId = 101, amount = 50000, stage = 'Этап 1' } = {}) {
  try {
    const res = await fetch(`${BASE_URL}/finance/escrow/lock`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, orderId, amount: Number(amount), stage }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function releaseEscrow({ fromUserId = 'u_customer_1', toUserId = 'u_exec_1', amount = 50000, orderId = 101 } = {}) {
  try {
    const res = await fetch(`${BASE_URL}/finance/escrow/release`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fromUserId, toUserId, amount: Number(amount), orderId }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function fetchTransactions() {
  try {
    const res = await fetch(`${BASE_URL}/finance/transactions`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    return Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  } catch (e) {
    return emptyList(e.message);
  }
}

// ==========================================
// 8. REAL-TIME CHAT & MESSAGING
// ==========================================

export async function fetchChatMessages(orderId = '') {
  try {
    const url = orderId ? `${BASE_URL}/chat?orderId=${encodeURIComponent(orderId)}` : `${BASE_URL}/chat`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await safeJsonParse(res);
    return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  } catch (e) {
    return emptyList(e.message);
  }
}

export async function sendChatMessage({ orderId = '101', senderId = 'u_customer_1', senderName = 'Заказчик', senderRole = 'customer', text = '' } = {}) {
  try {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ orderId, senderId, senderName, senderRole, text }),
    });
    if (!res.ok) throw new Error(await errorText(res));
    return { ...(await safeJsonParse(res)), ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
