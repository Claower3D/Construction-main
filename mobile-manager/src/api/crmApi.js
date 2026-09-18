// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)

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

// 16 REAL Railway & PostgreSQL CRM deals matching Web version
export const INITIAL_DEALS = [
  {
    id: "7921",
    leadNum: "36",
    title: "Установка септика (Володя)",
    client: "Володя",
    phone: "+7 (701) 888-00-11",
    location: "г. Астана",
    budget: 375000,
    status: "Новые",
    role: "engineer",
    date: "2026-05-06",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "септик на два кольца 6 м трубы три полуотвода сорок пятых возможно больше горловина люк плита перекрытия кольца полутораметровые", time: "Railway", author: "Володя" }],
    updated_at: "2026-09-13T19:20:48.180756Z"
  },
  {
    id: "4051",
    leadNum: "36",
    title: "Установка септика (Оксана )",
    client: "Оксана ",
    phone: "+7 (701) 888-00-11",
    location: "Караганда, Лебедево 17",
    budget: 700000,
    status: "В работе",
    role: "lead",
    date: "2026-09-04",
    time: "10:00",
    priority: "high",
    notes: [],
    updated_at: "2026-09-03T12:21:37.020274Z"
  },
  {
    id: "1979",
    leadNum: "12",
    title: "Установка септика (Ольга Витальевна)",
    client: "Ольга Витальевна",
    phone: "+77074849999",
    location: "Караганда, Республики 32 нп2 строения 1 ",
    budget: 530000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-07",
    time: "10:00",
    priority: "urgent",
    notes: [{ text: "прокладывания канализации, врезка в колодец ", time: "Railway", author: "Ольга Витальевна" }],
    updated_at: "2026-09-03T12:20:22.898182Z"
  },
  {
    id: "1311",
    leadNum: "45",
    title: "Установка септика (Ира)",
    client: "Ира",
    phone: "+7 705 545 8074",
    location: "Караганда, 1 квартал Ул вишневая 33",
    budget: 335000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-09",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Заявка передана инженеру ПТО для проведения замеров и составления сметы.", time: "Railway", author: "Ира" }],
    updated_at: "2026-09-07T09:18:32.659878Z"
  },
  {
    id: "5641",
    leadNum: "52",
    title: "Установка септика (Заказчик)",
    client: "Заказчик",
    phone: "+7 (701) 888-00-11",
    location: "Сортировка Павлика морозова 53",
    budget: 375000,
    status: "В работе",
    role: "lead",
    date: "2026-09-14",
    time: "10:00",
    priority: "normal",
    notes: [],
    updated_at: "2026-09-14T02:14:42.965082Z"
  },
  {
    id: "5866",
    leadNum: "21",
    title: " колодцы  Акимат",
    client: " колодцы  Акимат",
    phone: "87058277797",
    location: "Шахтерский 3 улица колодец в дольдороги",
    budget: 1,
    status: "В работе",
    role: "lead",
    date: "2026-09-14",
    time: "10:00",
    priority: "normal",
    notes: [],
    updated_at: "2026-09-14T02:16:03.479248Z"
  },
  {
    id: "0499",
    leadNum: "98",
    title: "( колодцы  Акимат)",
    client: " колодцы  Акимат",
    phone: "87058277797",
    location: "33 шахта Летняя улица колодец на перекрестке закопанный",
    budget: 1,
    status: "В работе",
    role: "lead",
    date: "2026-09-14",
    time: "10:00",
    priority: "normal",
    notes: [],
    updated_at: "2026-09-14T02:15:41.335947Z"
  },
  {
    id: "9872",
    leadNum: "68",
    title: "Наталья",
    client: "Заказчик",
    phone: "+7 700 498 3943",
    location: "Темиртауский переулок дом 18",
    budget: 400000,
    status: "Новые",
    role: "lead",
    date: "2026-09-15",
    time: "10:00",
    priority: "normal",
    notes: [],
    updated_at: "2026-09-14T02:27:34.024376Z"
  },
  {
    id: "8060",
    leadNum: "76",
    title: "Установка септика (Ольга)",
    client: "Ольга",
    phone: "+77019724104",
    location: "Космонавтов, 189",
    budget: 250000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-15",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Выезд мастера. Есть выгребная яма и проложены кан.трубы, которым 4 года. Хотят новый септик", time: "Railway", author: "Ольга" }],
    updated_at: "2026-09-14T11:20:48.257603Z"
  },
  {
    id: "0058",
    leadNum: "55",
    title: "Установка септика (Заказчик)",
    client: "Заказчик",
    phone: "+7 (701) 888-00-11",
    location: "г. Астана",
    budget: 1500000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "urgent",
    notes: [{ text: "Заявка передана инженеру ПТО для проведения замеров и составления сметы.", time: "Railway", author: "Заказчик" }],
    updated_at: "2026-09-14T06:30:30.233311Z"
  },
  {
    id: "5232",
    leadNum: "18",
    title: "Монтаж отопления (Заказчик)",
    client: "Заказчик",
    phone: "+7 (701) 888-00-11",
    location: "г. Астана",
    budget: 350000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Люк 6т без вывоза грунта распланирвоать грунт на месте чёрная труба 6 м полуотводы белые переход с белой на гофру", time: "Railway", author: "Заказчик" }],
    updated_at: "2026-09-16T05:13:45.943003Z"
  },
  {
    id: "2616",
    leadNum: "74",
    title: "Установка септика (Татьяна)",
    client: "Татьяна",
    phone: "+77009932460",
    location: "Переулок Лесной дом 1 рабочий посёлок ",
    budget: 350000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "6 метров чёрной трубы люк 6т", time: "Railway", author: "Татьяна" }],
    updated_at: "2026-09-16T07:01:43.568207Z"
  },
  {
    id: "1198",
    leadNum: "81",
    title: "Установка септика (Наталья)",
    client: "Наталья",
    phone: "+7 700 993 2460",
    location: "Сортировка рабочий поселок переулок лесной дом 1",
    budget: 350000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Есть старый колодец, хотят новый. Подъезд техники имеется. Планируют на 3 кольца", time: "Railway", author: "Наталья" }],
    updated_at: "2026-09-14T06:33:11.374574Z"
  },
  {
    id: "3862",
    leadNum: "93",
    title: "Установка септика (Сарыарка )",
    client: "Сарыарка ",
    phone: "+905353654286",
    location: "Сарыарка Завод Взрывчатки ",
    budget: 400000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Установка 3 антенн и наладка оборудования ", time: "Railway", author: "Сарыарка " }],
    updated_at: "2026-09-14T02:31:54.212241Z"
  },
  {
    id: "3361",
    leadNum: "77",
    title: "Установка септика (Ливневые стоки )",
    client: "Ливневые стоки ",
    phone: "+7 (701) 888-00-11",
    location: "Майкудук мурманская 130",
    budget: 120000,
    status: "Новые",
    role: "engineer",
    date: "2026-09-16",
    time: "10:00",
    priority: "normal",
    notes: [{ text: "Установить ливневые стоки в цемент 12 метров с заливкой цемента ", time: "Railway", author: "Ливневые стоки " }],
    updated_at: "2026-09-14T02:30:23.712208Z"
  },
  {
    id: "3621",
    leadNum: "94",
    title: "Ольга установка счетчиков ",
    client: "Заказчик",
    phone: "+77074849999",
    location: "Новоселова 35/1",
    budget: 200000,
    status: "Новые",
    role: "lead",
    date: "2026-09-18",
    time: "10:00",
    priority: "normal",
    notes: [],
    updated_at: "2026-09-14T02:22:50.450143Z"
  }
];

export function getStoredDeals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(INITIAL_DEALS));
  return INITIAL_DEALS;
}

export function saveStoredDeals(deals) {
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
  } catch (e) {
    console.error('Failed to save deals:', e);
  }
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
        const authData = {
          user: {
            id: data.user?.id || 'usr_' + Date.now(),
            name: data.user?.name || capitalizedName,
            login: cleanLogin,
            email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
            role: data.user?.role || 'Менеджер проектов',
            phone: data.user?.phone || '+7 (701) 000-00-00',
            avatar: '👨‍💼'
          },
          token: data.token || 'jwt_railway_token',
          isOnline: true,
          serverType: 'railway',
          loginTime: new Date().toISOString()
        };
        saveStoredAuth(authData);
        return { success: true, authData };
      } else if (res.status === 401) {
        // Try auto-registration on backend if not existing yet
        try {
          const regRes = await fetch(`${cleanUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
              password: cleanPass || 'Manager2026!',
              name: capitalizedName,
              role: 'customer'
            })
          });
          if (regRes.ok) {
            const regData = await regRes.json();
            const authData = {
              user: {
                id: regData.user?.id || 'usr_' + Date.now(),
                name: regData.user?.name || capitalizedName,
                login: cleanLogin,
                email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
                role: 'Менеджер проектов',
                avatar: '👨‍💼'
              },
              token: regData.token || 'jwt_railway_token',
              isOnline: true,
              serverType: 'railway',
              loginTime: new Date().toISOString()
            };
            saveStoredAuth(authData);
            return { success: true, authData };
          }
        } catch (regErr) {}
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

function parseBudget(b) {
  if (typeof b === 'number') return b;
  if (typeof b === 'string') return parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
  return 0;
}

export function normalizeRemoteItem(item) {
  let notes = [];
  if (typeof item.notes === 'string' && item.notes.trim()) {
    notes = [{ text: item.notes, time: 'Railway', author: item.contractor || 'Менеджер' }];
  } else if (Array.isArray(item.notes)) {
    notes = item.notes;
  }

  const clientName = item.contractor || item.client || item.clientName || 'Клиент';

  return {
    id: String(item.id),
    leadNum: String(item.leadNum || item.id),
    title: item.title || ('Заявка #' + item.id),
    client: clientName,
    contractor: clientName,
    phone: item.phone || '',
    location: item.location || '',
    budget: parseBudget(item.budget),
    status: item.status || 'Новые',
    role: item.role || (item.type === 'work_stage' ? 'executor' : (item.type === 'request_engineering' ? 'engineer' : 'lead')),
    date: item.date || new Date().toISOString().slice(0, 10),
    time: item.time || '10:00',
    priority: item.priority || 'normal',
    notes: notes,
    updated_at: item.updatedAt || item.createdAt || new Date().toISOString()
  };
}

export function formatDealForServer(deal, authorName = 'Менеджер') {
  let noteStr = '';
  if (typeof deal.notes === 'string') {
    noteStr = deal.notes;
  } else if (Array.isArray(deal.notes) && deal.notes.length > 0) {
    noteStr = deal.notes.map(n => typeof n === 'string' ? n : (n.text || '')).filter(Boolean).join(' | ');
  } else if (deal.rawNotes) {
    noteStr = String(deal.rawNotes);
  }

  const clientName = (deal.contractor || deal.client || deal.clientName || 'Новый клиент').trim();
  const rawBudget = deal.budget;
  let budgetStr = '0 ₸';
  if (typeof rawBudget === 'number') {
    budgetStr = `${rawBudget.toLocaleString('ru-RU')} ₸`;
  } else if (typeof rawBudget === 'string' && rawBudget.trim()) {
    budgetStr = rawBudget;
  }

  let cleanId = String(deal.id || '').replace(/^deal-/, '');
  if (!cleanId || cleanId === 'undefined') {
    cleanId = String(Math.floor(1000 + Math.random() * 9000));
  }

  return {
    id: cleanId,
    date: deal.date || new Date().toISOString().split('T')[0],
    leadNum: String(deal.leadNum || Math.floor(10 + Math.random() * 90)),
    title: deal.title || `Заявка (${clientName})`,
    status: deal.status || 'Новые',
    type: deal.type || (deal.role === 'executor' ? 'work_stage' : 'request_engineering'),
    role: deal.role || 'engineer',
    time: deal.time || '12:00',
    phone: deal.phone || '',
    contractor: clientName,
    location: deal.location || deal.address || 'г. Алматы',
    budget: budgetStr,
    notes: noteStr,
    createdBy: authorName || 'Менеджер'
  };
}

// ── Direct Create / Update / Delete on Central Railway Database ──

export async function createDealOnServer(serverUrl, deal, authorName = 'Менеджер') {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const payload = formatDealForServer(deal, authorName);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeRemoteItem(data);
      return { success: true, deal: normalized };
    } else {
      const errText = await res.text().catch(() => '');
      console.warn('[CRM API] Create deal server error:', res.status, errText);
      return { success: false, error: `HTTP ${res.status}: ${errText}` };
    }
  } catch (err) {
    console.warn('[CRM API] Create deal network error:', err);
    return { success: false, error: err.message || 'Сбой сети' };
  }
}

export async function updateDealOnServer(serverUrl, deal, authorName = 'Менеджер') {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const payload = formatDealForServer(deal, authorName);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { success: true, deal: normalizeRemoteItem(data) };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDealOnServer(serverUrl, dealId) {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const cleanId = String(dealId || '').replace(/^deal-/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${cleanUrl}/api/v1/crm/events?id=${cleanId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function twoWaySyncWithRailway(serverUrl, localDeals, authorName = 'Менеджер') {
  if (!serverUrl) return { success: false, error: 'URL сервера не настроен' };
  const cleanUrl = serverUrl.replace(/\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    // 1. PULL: Fetch all real CRM events from Railway Go Backend (PostgreSQL)
    const getRes = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    if (getRes.ok) {
      const data = await getRes.json();
      const remoteRaw = data.items || (data.events && Array.isArray(data.events) ? data.events : []);
      const remoteNormalized = remoteRaw.map(normalizeRemoteItem);

      const localMap = new Map();
      (localDeals || []).forEach(loc => {
        const id = String(loc.id).replace(/^deal-/, '');
        localMap.set(id, { ...loc, id });
      });

      const remoteMap = new Map();
      remoteNormalized.forEach(rem => {
        remoteMap.set(String(rem.id), rem);
      });

      const mergedMap = new Map();
      const pendingPush = [];

      // 1. Process remote items
      remoteNormalized.forEach(rem => {
        const sId = String(rem.id);
        const loc = localMap.get(sId);
        if (loc) {
          // If local has newer timestamp and different status, preserve local & push to server
          const locTime = new Date(loc.updated_at || loc.createdAt || 0).getTime();
          const remTime = new Date(rem.updated_at || rem.createdAt || 0).getTime();
          if (locTime > remTime && loc.status !== rem.status) {
            mergedMap.set(sId, loc);
            pendingPush.push(loc);
          } else {
            mergedMap.set(sId, rem);
          }
        } else {
          mergedMap.set(sId, rem);
        }
      });

      // 2. Process local-only items (newly created offline or before sync)
      localMap.forEach((loc, sId) => {
        if (!remoteMap.has(sId)) {
          mergedMap.set(sId, loc);
          pendingPush.push(loc);
        }
      });

      const merged = Array.from(mergedMap.values());
      saveStoredDeals(merged);

      // 3. PUSH any pending local deals to Railway
      if (pendingPush.length > 0) {
        Promise.all(pendingPush.map(item => {
          const payload = formatDealForServer(item, authorName);
          return fetch(`${cleanUrl}/api/v1/crm/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(e => console.warn('Background sync push failed for', item.id, e));
        })).catch(() => {});
      }

      return {
        success: true,
        latencyMs: latency,
        lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mergedDeals: merged
      };
    }
    return { success: false, error: `Ошибка сервера: ${getRes.status}` };
  } catch (err) {
    return { success: false, error: err.message || 'Сбой сети' };
  }
}
