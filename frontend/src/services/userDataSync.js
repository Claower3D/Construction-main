// userDataSync — личные данные пользователя с сайта хранятся на сервере, а не только в этом браузере.
//
// Страницы сайта по-прежнему читают и пишут localStorage как раньше. Этот модуль следит за
// записями в «личные» ключи (календарь, объекты, уведомления, история смет, настройки компании…)
// и отправляет их на сервер (/api/v1/me/data), а при входе с другого устройства — загружает обратно.
// Работает только после настоящего входа (JWT). Без интернета всё остаётся в браузере и уходит позже.

import { getAuthToken } from './platformUtils';

const API = '/api/v1/me/data';
const META_KEY = 'qazgost_userdata_meta';
const MAX_VALUE = 4 * 1024 * 1024;
const PUSH_DELAY_MS = 2000;
const POLL_MS = 60000;

// Точные имена ключей с данными пользователя
const SYNC_KEYS = new Set([
  'qazgost_calendar_events',
  'qazgost_calendar_events_engineer',
  'qazgost_calendar_events_executor',
  'engineer_notifications',
  'executor_notifications',
  'qazgost_engineer_requests',
  'qazgost_engineer_tasks_store',
  'qazgost_executor_objects',
  'qazgost_vip_objects_v2',
  'qazgost_estimate_history',
  'qazgost_custom_equipment',
  'qazgost_materials_orders',
  'qazgost_contractors_store',
  'defect_history',
  'qazgost_city',
  'qazgost_estimate_city',
  'qazgost_estimate_region',
  'qazgost_smeta_mode',
  'qazgost_measure_calib',
]);
// Ключи с приставкой (например, настройки компании конкретного аккаунта)
const SYNC_PREFIXES = ['company_settings_', 'tour_completed_'];

export function isSyncedKey(key) {
  if (typeof key !== 'string') return false;
  return SYNC_KEYS.has(key) || SYNC_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
}

let rawSet = null;
let rawRemove = null;
let started = false;
let inflight = null;
let pushTimer = null;
let lastToken = null;

function storage() {
  try { return window.localStorage; } catch { return null; }
}

function readMeta() {
  try {
    const m = JSON.parse(storage()?.getItem(META_KEY) || 'null');
    if (m && typeof m === 'object' && m.keys && typeof m.keys === 'object') return m;
  } catch { /* повреждено — начинаем заново */ }
  return { owner: '', keys: {} };
}

function writeMeta(m) {
  try { rawSet.call(storage(), META_KEY, JSON.stringify(m)); } catch { /* хранилище переполнено */ }
}

function tokenOwner(token) {
  try {
    const body = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(decodeURIComponent(escape(atob(body + '='.repeat((4 - (body.length % 4)) % 4)))));
    return String(claims.sub || '');
  } catch {
    return '';
  }
}

function localTrackedKeys() {
  const ls = storage();
  const out = [];
  if (!ls) return out;
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (isSyncedKey(k)) out.push(k);
  }
  return out;
}

function markDirty(key) {
  const m = readMeta();
  const e = m.keys[key] || { t: 0, s: 0 };
  e.t = Date.now();
  delete e.big;
  m.keys[key] = e;
  writeMeta(m);
  schedulePush();
}

function schedulePush() {
  if (!getAuthToken()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { syncUserData(); }, PUSH_DELAY_MS);
}

/** Объединяет две версии одной записи при первом знакомстве устройства с сервером. */
export function mergeValues(localRaw, serverRaw) {
  let a; let b;
  try { a = JSON.parse(localRaw); b = JSON.parse(serverRaw); } catch { return serverRaw; }
  const itemKey = (x) => (x && typeof x === 'object' && (x.id != null) ? `id:${x.id}` : `v:${JSON.stringify(x)}`);
  const mergeArr = (x, y) => {
    const seen = new Set(y.map(itemKey));
    return [...y, ...x.filter((it) => !seen.has(itemKey(it)))];
  };
  if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify(mergeArr(a, b));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out = { ...a, ...b };
    for (const k of Object.keys(a)) {
      if (Array.isArray(a[k]) && Array.isArray(b[k])) out[k] = mergeArr(a[k], b[k]);
    }
    return JSON.stringify(out);
  }
  return serverRaw;
}

async function api(path, opts = {}) {
  const token = getAuthToken();
  if (!token) throw Object.assign(new Error('нет входа'), { status: 401 });
  const res = await fetch(path, {
    ...opts,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json().catch(() => ({}));
}

function notifyPages(keys) {
  if (!keys.length) return;
  try {
    window.dispatchEvent(new CustomEvent('qazgost:userdata-updated', { detail: { keys } }));
    for (const key of keys) window.dispatchEvent(new StorageEvent('storage', { key }));
  } catch { /* старый браузер — страницы обновятся при следующем открытии */ }
}

async function doSync() {
  const token = getAuthToken();
  const ls = storage();
  if (!token || !ls) return { ok: false, skipped: true };
  const owner = tokenOwner(token);
  if (!owner) return { ok: false, skipped: true };

  let meta = readMeta();
  if (meta.owner && meta.owner !== owner) {
    // В этом браузере вошёл другой человек — чужие данные не показываем и не отправляем ему
    for (const k of localTrackedKeys()) rawRemove.call(ls, k);
    meta = { owner, keys: {} };
  } else if (!meta.owner) {
    // Первая синхронизация на этом устройстве: всё, что уже лежит в браузере, — кандидат на отправку
    meta.owner = owner;
    for (const k of localTrackedKeys()) {
      if (!meta.keys[k]) meta.keys[k] = { t: 1, s: 0 };
    }
  }
  writeMeta(meta);

  const list = await api(API);
  const server = new Map((list.items || []).filter((x) => isSyncedKey(x.key)).map((x) => [x.key, x]));
  const keys = new Set([...localTrackedKeys(), ...server.keys(), ...Object.keys(meta.keys)]);
  const pulled = [];
  const errors = [];

  for (const key of keys) {
    if (!isSyncedKey(key)) continue;
    meta = readMeta();
    const e = meta.keys[key] || { t: 0, s: 0 };
    const srv = server.get(key);
    const localVal = ls.getItem(key);
    const localDirty = e.t > 0 && !e.big;
    const serverChanged = srv ? srv.updatedAt !== e.s : e.s > 0;
    if (!localDirty && !serverChanged) continue;

    try {
      let action;
      if (localDirty && !serverChanged) action = 'push';
      else if (!localDirty && serverChanged) action = 'pull';
      else if (e.s === 0 && srv && localVal != null) action = 'merge';
      else action = srv && srv.updatedAt > e.t ? 'pull' : 'push';

      if (action === 'pull' || action === 'merge') {
        if (!srv) {
          rawRemove.call(ls, key); // удалено на другом устройстве
          const m = readMeta(); delete m.keys[key]; writeMeta(m);
          pulled.push(key);
          continue;
        }
        const got = await api(`${API}/${encodeURIComponent(key)}`);
        const value = typeof got.value === 'string' ? got.value : '';
        if (action === 'merge') {
          const merged = mergeValues(localVal, value);
          rawSet.call(ls, key, merged);
          pulled.push(key);
          if (merged === value) {
            const m = readMeta(); m.keys[key] = { t: 0, s: got.updatedAt || srv.updatedAt }; writeMeta(m);
            continue;
          }
          const m = readMeta(); m.keys[key] = { t: Date.now(), s: got.updatedAt || srv.updatedAt }; writeMeta(m);
          // дальше — отправка объединённой версии
        } else {
          if (ls.getItem(key) !== value) {
            rawSet.call(ls, key, value);
            pulled.push(key);
          }
          const m = readMeta(); m.keys[key] = { t: 0, s: got.updatedAt || srv.updatedAt }; writeMeta(m);
          continue;
        }
      }

      // push
      const before = readMeta().keys[key] || { t: 0, s: 0 };
      const current = ls.getItem(key);
      if (current == null) {
        await api(`${API}/${encodeURIComponent(key)}`, { method: 'DELETE' });
        const m = readMeta(); delete m.keys[key]; writeMeta(m);
        continue;
      }
      if (current.length > MAX_VALUE) {
        const m = readMeta(); m.keys[key] = { ...before, big: true }; writeMeta(m);
        errors.push(`${key}: больше 4 МБ — остаётся только на этом устройстве`);
        continue;
      }
      const res = await api(`${API}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value: current }) });
      const m = readMeta();
      const now = m.keys[key] || before;
      // если за время отправки запись снова поменялась — останется «грязной» и уйдёт в следующий раз
      m.keys[key] = { t: now.t === before.t ? 0 : now.t, s: res.updatedAt || Date.now() };
      writeMeta(m);
    } catch (err) {
      if (err.status === 401) return { ok: false, error: 'нужен вход' };
      if (err.status === 413) {
        const m = readMeta(); m.keys[key] = { ...(m.keys[key] || e), big: true }; writeMeta(m);
      }
      errors.push(`${key}: ${err.message}`);
    }
  }

  notifyPages(pulled);
  return { ok: errors.length === 0, pulled, errors };
}

/** Запустить синхронизацию сейчас (повторный вызов во время работы ждёт ту же попытку). */
export function syncUserData() {
  if (!started) return Promise.resolve({ ok: false, skipped: true });
  if (!inflight) {
    inflight = doSync()
      .catch((e) => ({ ok: false, error: e.message || 'сбой сети' }))
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** Подключается один раз при запуске сайта. */
export function startUserDataSync() {
  if (started || typeof window === 'undefined' || !storage() || typeof Storage === 'undefined') return;
  started = true;
  rawSet = Storage.prototype.setItem;
  rawRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    const prev = this === storage() && isSyncedKey(key) ? this.getItem(key) : undefined;
    rawSet.call(this, key, value);
    if (this !== storage()) return;
    if (prev !== undefined && prev !== String(value)) markDirty(key);
    if (key === 'auth_token' && String(value) !== lastToken) {
      lastToken = String(value);
      setTimeout(() => { syncUserData(); }, 300);
    }
  };
  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    const had = this === storage() && isSyncedKey(key) && this.getItem(key) != null;
    rawRemove.call(this, key);
    if (had) markDirty(key);
  };

  lastToken = storage().getItem('auth_token');
  const kick = () => { if (document.visibilityState !== 'hidden') syncUserData(); };
  setTimeout(kick, 1500);
  setInterval(kick, POLL_MS);
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('online', kick);
  window.__qazgostUserDataSync = syncUserData; // для проверки и ручного запуска из консоли
}
