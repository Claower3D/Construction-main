// QazGost Executor Mobile — Real Production Railway Client & Data Sync
import { createSyncStore, localDateISO, addDaysISO, authHeaders, makeNote, nowTimeLabel, fetchWithTimeout, cleanServerUrl } from './syncCore';
import { rememberVerifiedLogin, checkVerifiedLogin, forgetVerifiedLogin } from './offlineAuth';
const STORAGE_KEY_ORDERS = 'qazgost_executor_orders_perm';
const STORAGE_KEY_AUTH = 'qazgost_executor_auth_perm';
const STORAGE_KEY_SAVED_LOGIN = 'qazgost_executor_saved_login';

export const DEFAULT_EXECUTOR = {
  id: 'exec_brigadir_timur',
  name: 'Тимур (Бригадир СМР)',
  login: 'timur.executor@qazgost.kz',
  email: 'timur.executor@qazgost.kz',
  role: 'Бригадир строительно-монтажных работ',
  phone: '+7 (705) 333-44-55',
  crewSize: 'Бригада №3 (4 монтажника)',
  avatar: '🔨'
};

export const STAGE_CONFIG = [
  { id: 1, title: 'Разметка и подготовка площадки', desc: 'Вынос осей котлована и трассы трубы' },
  { id: 2, title: 'Копка котлована и траншеи', desc: 'Экскаватор / вручную с контролем глубины' },
  { id: 3, title: 'Монтаж колец ЖБИ / септика', desc: 'Установка манипулятором КС-15 / КС-20' },
  { id: 4, title: 'Прокладка трубопровода d110', desc: 'Песчаная подушка, соблюдение уклона 2см/м' },
  { id: 5, title: 'Врезка и герметизация швов', desc: 'Гидроизоляция стыков, заделка раствором' },
  { id: 6, title: 'Монтаж плиты перекрытия и люка', desc: 'Установка ПП-15 и люка 6т с горловиной' },
  { id: 7, title: 'Обратная засыпка и сдача', desc: 'Послойная трамбовка, подписание акта' }
];

export const STATUS_CONFIG = {
  'Новые': { label: 'Новый наряд', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📝' },
  'Выезд назначен': { label: 'Назначен выезд', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '📅' },
  'В работе': { label: 'В работе / Монтаж', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '⚙️' },
  'На объекте': { label: 'Бригада на объекте', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: '📍' },
  'Приёмка': { label: 'Готов к приёмке', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '🔍' },
  'Завершено': { label: 'Объект сдан', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' }
};

export function defaultStages() {
  return STAGE_CONFIG.map(s => ({ id: s.id, title: s.title, done: false, time: null, note: '' }));
}

// Demo data: FICTIONAL, shown only offline before the first successful sync, never pushed to the server
export function buildDemoOrders() {
  const today = localDateISO();
  const mk = (n, extra) => ({
    id: `demo-exec-${n}`,
    leadNum: `00${n}`,
    client: `Демо-клиент ${n}`,
    contractor: `Демо-клиент ${n}`,
    phone: `+7 700 000 00 0${n}`,
    location: `Демо-адрес ${n}`,
    role: 'executor',
    priority: 'normal',
    crew: 'Демо-бригада',
    stages: defaultStages(),
    materials: [],
    photos: [],
    machinery: [],
    notes: [{ text: 'Демонстрационный наряд (офлайн-демо, не синхронизируется)', time: '', author: 'Демо' }],
    ...extra
  });
  return [
    mk(1, { title: 'Установка септика (Демо-клиент 1)', budget: 700000, status: 'В работе', date: today, time: '09:00' }),
    mk(2, { title: 'Монтаж колодца (Демо-клиент 2)', budget: 375000, status: 'Выезд назначен', date: today, time: '13:30' }),
    mk(3, { title: 'Прокладка трубы (Демо-клиент 3)', budget: 250000, status: 'Новые', date: addDaysISO(today, 1), time: '10:00' })
  ];
}


export function resolveExecutorProfile(cleanLogin, serverUser = null) {
  const lower = (cleanLogin || '').trim().toLowerCase();

  if (serverUser && serverUser.name) {
    const rawName = serverUser.name;
    const name = rawName.includes('Бригадир') ? rawName : `${rawName} (Бригадир СМР)`;
    return {
      id: String(serverUser.id || 'exec_' + Date.now()),
      name: name,
      login: cleanLogin,
      email: serverUser.email || (cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`),
      role: serverUser.role || 'Бригадир строительно-монтажных работ',
      phone: serverUser.phone || '+7 (705) 333-44-55',
      crewSize: 'Бригада СМР',
      avatar: '🔨'
    };
  }

  if (lower.includes('timur') || lower.startsWith('timur')) {
    return {
      id: 'exec_brigadir_timur',
      name: 'Тимур (Бригадир СМР)',
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
      role: 'Бригадир строительно-монтажных работ',
      phone: '+7 (705) 333-44-55',
      crewSize: 'Бригада №3 (4 монтажника)',
      avatar: '🔨'
    };
  }

  if (lower.includes('samat') || lower.startsWith('samat')) {
    return {
      id: 'exec_brigadir_samat',
      name: 'Самат (Бригадир СМР)',
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
      role: 'Бригадир строительно-монтажных работ',
      phone: '+7 (701) 444-55-66',
      crewSize: 'Бригада №1 (5 монтажников)',
      avatar: '🔨'
    };
  }

  const rawPrefix = cleanLogin.split('@')[0].split('.')[0].replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  const displayName = rawPrefix ? (rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1)) : 'Бригадир';
  return {
    id: 'exec_' + Date.now(),
    name: `${displayName} (Бригадир СМР)`,
    login: cleanLogin,
    email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
    role: 'Бригадир строительно-монтажных работ',
    phone: '+7 (705) 000-00-00',
    crewSize: 'Бригада СМР',
    avatar: '🔨'
  };
}

export function getSavedLogin() {
  try {
    return localStorage.getItem(STORAGE_KEY_SAVED_LOGIN) || '';
  } catch (e) {
    return '';
  }
}

export function setSavedLogin(login) {
  try {
    if (login) localStorage.setItem(STORAGE_KEY_SAVED_LOGIN, login);
  } catch (e) {}
}

export function getSavedAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.login || parsed.email)) return parsed;
    }
  } catch (e) {}
  // Без сохранённого входа — экран входа (раньше сразу открывался аккаунт по умолчанию)
  return null;
}

export function setSavedAuth(authData) {
  try {
    if (authData) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
      if (authData.login || authData.email) {
        setSavedLogin(authData.login || authData.email);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (e) {}
}


export function getSavedServerUrl() {
  try {
    return localStorage.getItem('qazgost_server_url') || 'https://construction-main-production.up.railway.app';
  } catch (e) {
    return 'https://construction-main-production.up.railway.app';
  }
}

export function setSavedServerUrl(url) {
  try {
    if (url) localStorage.setItem('qazgost_server_url', url);
  } catch (e) {}
}

export async function testServerPing(serverUrl) {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cleanUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);
    if (res.ok) return { ok: true, latency };
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

function currentToken() {
  try { return getSavedAuth()?.token; } catch (e) { return undefined; }
}

export function getAuthHeaders() {
  return authHeaders(currentToken());
}

export const ordersStore = createSyncStore({
  dealsKey: STORAGE_KEY_ORDERS,
  tombKey: 'qazgost_executor_deleted_ids',
  demoFactory: buildDemoOrders,
  getServerUrl: getSavedServerUrl,
  getToken: currentToken,
  getAuthorName: () => getSavedAuth()?.name || 'Бригадир'
});

export function getStoredOrders() {
  return ordersStore.load();
}

export function saveStoredOrders(orders) {
  return ordersStore.save(orders);
}

export function pendingSyncCount(list) {
  return ordersStore.pendingCount(list);
}

export function loadDemoOrders() {
  return ordersStore.loadDemo();
}

/** Pull → merge (newer side wins, role/materials are never rewritten) → push changed records only. */
export function syncOrders() {
  return ordersStore.sync();
}

export function resetCachedOrders() {
  const keep = ordersStore.load().filter((o) => o._dirty && !o._demo);
  ordersStore.save(keep);
  return keep;
}

export function updateOrderStatus(orderId, newStatus, newNote = null, authorName = 'Бригадир') {
  return ordersStore.edit(orderId, (o) => ({
    ...o,
    status: newStatus,
    notes: newNote ? [makeNote(newNote, authorName), ...(o.notes || [])] : (o.notes || [])
  }));
}

export function toggleWorkStage(orderId, stageId, isDone, stageNote = '', authorName = 'Бригадир') {
  return ordersStore.edit(orderId, (o) => {
    const stages = (o.stages && o.stages.length ? o.stages : defaultStages()).map(s => ({ ...s }));
    const sIdx = stages.findIndex(s => s.id === stageId);
    if (sIdx === -1) return o;
    stages[sIdx].done = isDone;
    stages[sIdx].time = isDone ? nowTimeLabel() : null;
    if (stageNote) stages[sIdx].note = stageNote;
    const doneCount = stages.filter(s => s.done).length;
    let status = o.status;
    if (doneCount === stages.length) status = 'Завершено';
    else if (doneCount > 0 && (o.status === 'Новые' || o.status === 'Выезд назначен')) status = 'В работе';
    const text = `${isDone ? 'Выполнен этап' : 'Сброшен этап'}: "${stages[sIdx].title}"${stageNote ? ` (${stageNote})` : ''}`
      + (status !== o.status ? `; статус → «${status}»` : '');
    return { ...o, stages, status, notes: [makeNote(text, authorName), ...(o.notes || [])] };
  });
}

/** Uploads the photo when a real server session exists; otherwise keeps it on the device with a mark. */
export async function uploadWorkPhoto(blob, fileName = 'photo.jpg') {
  const token = currentToken();
  if (!(typeof token === 'string' && token.startsWith('eyJ'))) {
    return { uploaded: false, reason: 'нет серверной сессии — фото хранится на устройстве' };
  }
  const base = cleanServerUrl(getSavedServerUrl());
  const fd = new FormData();
  fd.append('file', blob, fileName);
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/files/upload`, { method: 'POST', headers: { ...authHeaders(token) }, body: fd }, 30000);
    if (!res.ok) return { uploaded: false, reason: `загрузка фото: HTTP ${res.status}` };
    const data = await res.json();
    if (!data || !data.url) return { uploaded: false, reason: 'сервер не вернул ссылку на фото' };
    return { uploaded: true, url: /^https?:/i.test(data.url) ? data.url : `${base}${data.url}` };
  } catch (e) {
    return { uploaded: false, reason: `загрузка фото: ${e.message || 'нет сети'}` };
  }
}

export function addWorkPhoto(orderId, photoObj, authorName = 'Бригадир') {
  return ordersStore.edit(orderId, (o) => ({
    ...o,
    photos: [photoObj, ...(o.photos || [])],
    notes: [makeNote(
      `Фотоотчёт «${photoObj.tag || 'Этап СМР'}»: ${photoObj.serverUrl ? photoObj.serverUrl : 'фото хранится только на телефоне бригадира'}`,
      authorName
    ), ...(o.notes || [])]
  }));
}

export function requestMachinery(orderId, machineryType, date, time, comment, authorName = 'Бригадир') {
  const d = date || localDateISO();
  const t = time || '10:00';
  return ordersStore.edit(orderId, (o) => ({
    ...o,
    machinery: [{
      id: 'mach_' + Date.now(),
      type: machineryType,
      date: d,
      time: t,
      comment: comment || '',
      status: 'ordered',
      createdAt: new Date().toISOString()
    }, ...(o.machinery || [])],
    notes: [makeNote(`Заказана спецтехника: ${machineryType} на ${d} в ${t}${comment ? ` (${comment})` : ''}`, authorName), ...(o.notes || [])]
  }));
}


export async function loginExecutor(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin) {
    return { success: false, error: 'Заполните логин или email' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Введите пароль' };
  }

  const cleanEmail = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`;
  const defaultProfile = resolveExecutorProfile(cleanLogin);

  const finishOnline = async (user, token) => {
    const profile = resolveExecutorProfile(cleanLogin, user);
    const authData = {
      ...profile,
      token: token || `jwt_railway_${Date.now()}`,
      isOnline: true,
      serverType: 'railway',
      loginTime: new Date().toISOString()
    };
    setSavedAuth(authData);
    await rememberVerifiedLogin('executor', cleanLogin, cleanPass, profile);
    return { success: true, authData };
  };

  // 1. Вход через сервер. Неверный пароль — отказ (раньше пускало с любым паролем).
  if (serverUrl) {
    const cleanUrl = serverUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      }, 5000);

      if (res.ok) {
        const data = await res.json();
        return finishOnline(data.user, data.token);
      }
      if (res.status === 400 || res.status === 401) {
        // Аккаунта ещё нет на сервере — создаём его с введённым паролем.
        // Если аккаунт есть, сервер ответит «уже существует» → значит, пароль неверный.
        try {
          const regRes = await fetchWithTimeout(`${cleanUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: cleanPass, name: defaultProfile.name, role: 'executor' })
          }, 5000);
          if (regRes.ok) {
            const regData = await regRes.json();
            return finishOnline(regData.user, regData.token);
          }
        } catch (regErr) {
          console.warn('[ExecutorApi] auto-register skipped:', regErr && regErr.message);
        }
        forgetVerifiedLogin('executor', cleanLogin);
        return { success: false, error: 'Неверный логин или пароль' };
      }
      // 5xx и прочее — сервер недоступен, пробуем офлайн-вход ниже
    } catch (err) {
      console.warn('[ExecutorApi] server unreachable, trying offline login:', err && err.message);
    }
  }

  // 2. Без связи — только аккаунт, который уже входил на этом телефоне, и с тем же паролем
  const offlineProfile = await checkVerifiedLogin('executor', cleanLogin, cleanPass);
  if (offlineProfile) {
    const authData = {
      ...defaultProfile,
      ...offlineProfile,
      token: `exec_offline_token_${Date.now()}`,
      isOnline: false,
      serverType: 'offline',
      loginTime: new Date().toISOString()
    };
    setSavedAuth(authData);
    return { success: true, authData };
  }
  return {
    success: false,
    error: 'Нет связи с сервером. Без интернета можно войти только в аккаунт, который уже входил на этом телефоне.'
  };
}
