// platformUtils — общие хелперы: авторизация запросов, локальные даты, ID, деньги, экранирование.

const AUTH_TOKEN_KEY = 'auth_token';

/** Настоящий JWT (header.payload.signature, base64url) — а не локальный фейковый токен. */
export function isRealJwt(token) {
  return typeof token === 'string' && token.startsWith('eyJ') && token.split('.').length === 3;
}

export function getAuthToken() {
  try {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    return isRealJwt(t) ? t : null;
  } catch {
    return null;
  }
}

/** Время истечения JWT (секунды Unix) или null, если токен не разобрать. Подпись здесь не проверяется. */
export function jwtExpiry(token) {
  try {
    const body = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(body + '='.repeat((4 - (body.length % 4)) % 4))).exp;
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

/** Заголовки для fetch к /api: Authorization добавляется только при наличии настоящего JWT. */
export function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function jsonAuthHeaders(extra = {}) {
  return authHeaders({ 'Content-Type': 'application/json', ...extra });
}

/** Текущий пользователь приложения (App.jsx хранит его в app_currentUser). */
export function getStoredCurrentUser() {
  try {
    const raw = localStorage.getItem('app_currentUser');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && typeof u === 'object' ? u : null;
  } catch {
    return null;
  }
}

/** Ключ владельца данных: email → login → name. */
export function userKeyOf(user) {
  if (!user) return null;
  return user.email || user.login || user.name || null;
}

/** Дата YYYY-MM-DD в ЛОКАЛЬНОМ часовом поясе (а не UTC, как toISOString). */
export function localDateKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Уникальный ID с префиксом (UUID, если доступен). */
export function genId(prefix = 'id') {
  let core;
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      core = crypto.randomUUID();
    }
  } catch { /* ignore */ }
  if (!core) {
    core = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${prefix}-${core}`;
}

/** Короткий человекочитаемый номер (для отображения, НЕ для идентификации). */
export function shortNum(id) {
  const s = String(id || '').replace(/[^a-zA-Z0-9]/g, '');
  return s.slice(-6).toUpperCase();
}

// ── Деньги ──

function parseNumberToken(token) {
  let t = token.replace(/[\s  ]/g, '');
  const hasDot = t.includes('.');
  const hasComma = t.includes(',');
  if (hasDot && hasComma) {
    const lastSep = Math.max(t.lastIndexOf('.'), t.lastIndexOf(','));
    const intPart = t.slice(0, lastSep).replace(/[.,]/g, '');
    t = `${intPart}.${t.slice(lastSep + 1)}`;
  } else if (hasComma || hasDot) {
    const sep = hasComma ? ',' : '.';
    const parts = t.split(sep);
    const isThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    t = isThousands ? parts.join('') : `${parts[0]}.${parts[1]}`;
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Числовые токены строки с учётом пробелов-разделителей тысяч («1 250 000», «1 234,56»). */
function extractNumbers(str) {
  const out = [];
  const re = /\d[\d\s  .,]*\d|\d/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    const raw = m[0];
    const groups = raw.split(/[\s  ]+/);
    const thousandsOk = groups.slice(1).every((g) => /^\d{3}([.,]\d+)?$/.test(g));
    if (groups.length > 1 && !thousandsOk) {
      groups.forEach((g) => { const n = parseNumberToken(g); if (!Number.isNaN(n)) out.push(n); });
    } else {
      const n = parseNumberToken(raw);
      if (!Number.isNaN(n)) out.push(n);
    }
  }
  return out;
}

/**
 * Разбор денежной суммы в тенге.
 *  - число → как есть;
 *  - «1 250 000 ₸» → 1250000; «1 234,56» → 1234.56 (округляется до тенге);
 *  - диапазон «55 000 – 120 000 ₸» / «от 45 000 до 75 000» → нижняя граница (mode='min') или среднее (mode='avg');
 *  - нет числа → 0 (никаких выдуманных значений по умолчанию).
 */
export function parseMoney(value, mode = 'min') {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;
  if (value === null || value === undefined) return 0;
  const str = String(value);
  const range = str.match(/(\d[\d\s  .,]*\d|\d)\s*(?:–|—|-|до)\s*(\d[\d\s  .,]*\d|\d)/);
  if (range) {
    const a = parseNumberToken(range[1]);
    const b = parseNumberToken(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return Math.round(mode === 'avg' ? (a + b) / 2 : Math.min(a, b));
    }
  }
  const nums = extractNumbers(str);
  if (nums.length === 0) return 0;
  return Math.round(Math.max(...nums));
}

// ── Безопасность HTML ──

export function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Для <img src> во внешне формируемом HTML: только data:image/… или https:. */
export function safeImgSrc(src) {
  if (typeof src !== 'string') return '';
  const s = src.trim();
  if (/^data:image\/(png|jpe?g|gif|webp|bmp);base64,[a-z0-9+/=\s]+$/i.test(s)) return s;
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  return '';
}

/** Ячейка CSV (разделитель «;»): кавычки, экранирование и защита от формул Excel. */
export function csvCell(value) {
  let s = String(value === null || value === undefined ? '' : value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[;"\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function safeJsonParse(raw, fallback = null) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}

/** Глобальное уведомление об ошибке синхронизации (показывает App.jsx). */
export function reportSyncError(message) {
  try {
    console.warn('[sync]', message);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qazgost_sync_error', { detail: { message } }));
    }
  } catch { /* ignore */ }
}

/** Текст ошибки из ответа fetch (JSON {error|detail} или статус). */
export async function responseError(res) {
  let msg = `HTTP ${res.status}`;
  try {
    const text = await res.text();
    if (text) {
      try {
        const j = JSON.parse(text);
        msg = j.error || j.detail || j.message || msg;
        if (typeof msg !== 'string') msg = JSON.stringify(msg);
      } catch {
        msg = text.slice(0, 200);
      }
    }
  } catch { /* ignore */ }
  return msg;
}

// ── Статусы сделки (воронка) ⇄ статус CRM-карточки ──
// Детальные стадии сохраняются в CRM как есть (раньше 2–4 схлопывались в «В работе»).
export const PIPELINE_STATUS_LABELS = {
  new: 'Новые',
  engineer_assigned: 'Инженер назначен',
  engineer_visit: 'Выезд инженера',
  estimate_ready: 'Смета готова',
  pending_executor: 'Дожим',
  in_progress: 'В работе',
  completed: 'Успешно',
  rejected: 'Отказ',
};

/** Корзина для фильтров/статистики CRM (5 колонок: Новые/В работе/Дожим/Успешно/Отказ). */
export function crmStatusBucket(status) {
  const s = String(status || '').toLowerCase();
  if (!s || s.includes('нов') || s === 'new') return 'Новые';
  if (s.includes('отказ') || s === 'rejected') return 'Отказ';
  if (s.includes('успеш') || s.includes('заверш') || s.includes('сдан') || s === 'completed') return 'Успешно';
  if (s.includes('дожим') || s.includes('поиск') || s === 'pending_executor') return 'Дожим';
  return 'В работе';
}
