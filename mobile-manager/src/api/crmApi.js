// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)
import { createSyncStore, localDateISO, addDaysISO, authHeaders, normalizeRemoteItem, parseBudget, toServerPayload, makeNote, genId, genLeadNum } from './syncCore';


// PERMANENT storage keys — NEVER wiped on app updates!
const STORAGE_KEY_DEALS = 'qazgost_crm_deals_permanent';
const STORAGE_KEY_SETTINGS = 'qazgost_crm_settings_permanent';
const STORAGE_KEY_AUTH = 'qazgost_crm_auth_permanent';
const STORAGE_KEY_SAVED_LOGIN = 'qazgost_crm_saved_login';

export const DEFAULT_MANAGER = { 
  id: 'mgr_default', 
  name: 'Саша', 
  login: 'sasha.manager@qazgost.kz',
  email: 'sasha.manager@qazgost.kz',
  role: 'Менеджер проектов', 
  phone: '+7 (701) 999-00-00', 
  avatar: '👨‍💼'
};

export const MANAGERS_LIST = [DEFAULT_MANAGER];

export const ROLE_CONFIG = {
  engineer: {
    badge: 'ИНЖЕНЕР',
    subBadge: 'Выезд / ПТО',
    icon: '👷',
    color: '#f59e0b',
    border: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    glow: 'rgba(245, 158, 11, 0.3)'
  },
  executor: {
    badge: 'ИСПОЛНИТЕЛЬ',
    subBadge: 'Строймонтаж',
    icon: '🔨',
    color: '#00e5ff',
    border: '#00e5ff',
    bg: 'rgba(0, 229, 255, 0.15)',
    glow: 'rgba(0, 229, 255, 0.3)'
  },
  lead: {
    badge: 'ЛИД',
    subBadge: 'Новая заявка',
    icon: '📝',
    color: '#8b5cf6',
    border: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  machinery: {
    badge: 'СПЕЦТЕХНИКА',
    subBadge: 'Аренда крана/экскаватора',
    icon: '🚜',
    color: '#ec4899',
    border: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    glow: 'rgba(236, 72, 153, 0.3)'
  },
  deadline: {
    badge: 'СРОКИ',
    subBadge: 'Контроль графика',
    icon: '⏳',
    color: '#ef4444',
    border: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    glow: 'rgba(239, 68, 68, 0.3)'
  }
};

export const PIPELINE_STAGES = [
  'Новые',
  'В работе',
  'Дожим',
  'Успешно',
  'Отказ'
];

export const STAGES = PIPELINE_STAGES;

// Demo data — FICTIONAL, shown only in offline demo mode and NEVER synchronized to the server.
// (Earlier versions shipped 16 real customer records here; they were removed.)
export function buildDemoDeals() {
  const today = localDateISO();
  const mk = (n, extra) => ({
    id: `demo-${n}`,
    leadNum: `00${n}`,
    client: `Демо-клиент ${n}`,
    contractor: `Демо-клиент ${n}`,
    phone: `+7 700 000 00 0${n}`,
    location: `Демо-адрес ${n}`,
    time: '10:00',
    priority: 'normal',
    notes: [{ text: 'Демонстрационная запись (офлайн-демо, не синхронизируется)', time: '', author: 'Демо' }],
    ...extra
  });
  return [
    mk(1, { title: 'Установка септика (Демо-клиент 1)', budget: 350000, status: 'Новые', role: 'engineer', date: today }),
    mk(2, { title: 'Бурение скважины (Демо-клиент 2)', budget: 600000, status: 'В работе', role: 'lead', date: addDaysISO(today, 1), time: '12:00' }),
    mk(3, { title: 'Монтаж отопления (Демо-клиент 3)', budget: 420000, status: 'Дожим', role: 'executor', date: addDaysISO(today, 2), priority: 'urgent' }),
    mk(4, { title: 'Аренда экскаватора (Демо-клиент 4)', budget: 95000, status: 'Новые', role: 'machinery', date: addDaysISO(today, 3), time: '09:00' }),
    mk(5, { title: 'Кровельные работы (Демо-клиент 5)', budget: 1200000, status: 'Успешно', role: 'executor', date: addDaysISO(today, -2) })
  ];
}

const STORAGE_KEY_TOMBSTONES = 'qazgost_crm_deleted_ids';

export const dealsStore = createSyncStore({
  dealsKey: STORAGE_KEY_DEALS,
  tombKey: STORAGE_KEY_TOMBSTONES,
  demoFactory: buildDemoDeals,
  getServerUrl: () => getStoredSettings().serverUrl,
  getToken: () => getStoredAuth()?.token,
  getAuthorName: () => getStoredAuth()?.user?.name || 'Менеджер'
});

export function getStoredDeals() {
  return dealsStore.load();
}

export function saveStoredDeals(deals) {
  return dealsStore.save(deals);
}

/** Current JWT (only real server tokens produce a header). */
export function getAuthHeaders() {
  return authHeaders(getStoredAuth()?.token);
}


export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.serverUrl || parsed.serverUrl.includes('qazgost-backend')) {
        parsed.serverUrl = 'https://construction-main-production.up.railway.app';
        saveStoredSettings(parsed);
      }
      return parsed;
    }
  } catch (e) {}
  return {
    serverUrl: 'https://construction-main-production.up.railway.app',
    offlineMode: true,
    lastSyncTime: null,
    autoSyncInterval: 30
  };
}

export function saveStoredSettings(settings) {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// ── Auth Management ──

export function getSavedLogin() {
  try {
    return localStorage.getItem(STORAGE_KEY_SAVED_LOGIN) || 'sasha.manager@qazgost.kz';
  } catch (e) {
    return 'sasha.manager@qazgost.kz';
  }
}

export function setSavedLogin(loginStr) {
  try {
    if (loginStr && loginStr.trim()) {
      localStorage.setItem(STORAGE_KEY_SAVED_LOGIN, loginStr.trim());
    }
  } catch (e) {}
}

export function getStoredAuth() {
  try {
    // Check permanent session first
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user) return parsed;
    }

    // Check fallback old versions
    for (let i = 4; i >= 1; i--) {
      const oldRaw = localStorage.getItem('qazgost_manager_crm_auth_v' + i);
      if (oldRaw) {
        const p = JSON.parse(oldRaw);
        if (p && p.user) {
          saveStoredAuth(p);
          return p;
        }
      }
    }
  } catch (e) {}
  return null;
}

export function saveStoredAuth(authData) {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
    if (authData && authData.user && (authData.user.email || authData.user.login)) {
      setSavedLogin(authData.user.email || authData.user.login);
    }
  } catch (e) {}
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    for (let i = 4; i >= 1; i--) {
      localStorage.removeItem('qazgost_manager_crm_auth_v' + i);
    }
  } catch (e) {}
}

export async function loginManager(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin) {
    return { success: false, error: 'Заполните логин, email или телефон' };
  }

  // Always remember login so it never disappears
  setSavedLogin(cleanLogin);

  const displayName = cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin;
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // 1. Attempt online login with Railway backend
  if (serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanLogin, 
          password: cleanPass 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const serverRole = data.user?.role || '';
        if (serverRole !== 'manager' && serverRole !== 'admin') {
          return { success: false, error: 'У этого аккаунта нет роли «Менеджер». Попросите администратора выдать её в приложении «QazGost Админ» → Пользователи.' };
        }
        const authData = {
          user: {
            id: data.user?.id || 'usr_' + Date.now(),
            name: data.user?.name || capitalizedName,
            login: cleanLogin,
            email: data.user?.email || cleanLogin,
            role: serverRole === 'admin' ? 'Администратор' : 'Менеджер проектов',
            phone: data.user?.phone || '',
            avatar: '👨‍💼'
          },
          token: data.token,
          isOnline: true,
          serverType: 'railway',
          loginTime: new Date().toISOString()
        };
        saveStoredAuth(authData);
        return { success: true, authData };
      }
      if (res.status === 400 || res.status === 401) {
        // Раньше здесь создавался новый аккаунт-«заказчик» с введённым паролем — без доступа к CRM
        return { success: false, error: 'Неверный логин или пароль' };
      }
      if (res.status === 429) {
        return { success: false, error: 'Слишком много попыток входа. Подождите несколько минут.' };
      }
    } catch (err) {
      console.warn('Backend login unreachable, falling back to local auth:', err.message);
    }
  }

  // 2. Seamless local/offline authentication fallback — user is NEVER blocked!
  const authData = {
    user: {
      id: 'local_' + Date.now(),
      name: capitalizedName,
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
      role: 'Менеджер проектов',
      phone: '+7 (701) 000-00-00',
      avatar: '👨‍💼'
    },
    token: `token_offline_${Date.now()}`,
    isOnline: false,
    serverType: 'offline',
    loginTime: new Date().toISOString()
  };
  saveStoredAuth(authData);
  return { success: true, authData };
}

// ── Two-Way Synchronization with Railway Server ──

export async function testServerPing(serverUrl) {
  if (!serverUrl) return { ok: false, error: 'Адрес сервера не указан' };
  const cleanUrl = serverUrl.replace(/\/+$/, '');
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
    if (res.ok) {
      return { ok: true, latency };
    }
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

// ── Offline-first CRUD + two-way sync (see syncCore.js) ──

export function createLocalDeal(deal) {
  return dealsStore.add(deal);
}

export function updateLocalDeal(dealId, patchFn) {
  return dealsStore.edit(dealId, patchFn);
}

export function deleteLocalDeal(dealId) {
  return dealsStore.remove(dealId);
}

export function loadDemoDeals() {
  return dealsStore.loadDemo();
}

export function pendingSyncCount(list) {
  return dealsStore.pendingCount(list);
}

/** Pull → merge (local unsynced edits win if newer) → pending DELETEs → push changed records only. */
export function syncDeals() {
  return dealsStore.sync();
}

export { normalizeRemoteItem, parseBudget, toServerPayload as formatDealForServer, localDateISO, makeNote, genId, genLeadNum };
