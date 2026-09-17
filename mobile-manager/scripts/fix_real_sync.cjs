const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Rewrite crmApi.js with REAL deals and robust GET /api/v1/crm/events sync
const crmApiPath = path.join(rootDir, 'src/api/crmApi.js');

const crmApiContent = `// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)

const STORAGE_KEY_DEALS = 'qazgost_manager_crm_deals_v4';
const STORAGE_KEY_SETTINGS = 'qazgost_manager_crm_settings_v4';
const STORAGE_KEY_AUTH = 'qazgost_manager_crm_auth_v4';

// Clear legacy caches
try {
  ['v1', 'v2', 'v3'].forEach(v => {
    localStorage.removeItem('qazgost_manager_crm_deals_' + v);
    localStorage.removeItem('qazgost_manager_crm_auth_' + v);
    localStorage.removeItem('qazgost_manager_crm_settings_' + v);
  });
} catch (e) {}

export const DEFAULT_MANAGER = { 
  id: 'mgr_default', 
  name: 'Менеджер QazGost', 
  email: 'manager@qazgost.kz',
  role: 'Ведущий специалист ПТО', 
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

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveStoredAuth(authData) {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export async function loginManager(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin || !cleanPass) {
    return { success: false, error: 'Заполните логин и пароль' };
  }

  // Attempt online authentication with Railway backend
  if (serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(\`\${cleanUrl}/api/v1/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanLogin, 
          login: cleanLogin, 
          password: cleanPass 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const displayName = data.user?.name || (cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin);
        const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        const authData = {
          user: {
            id: data.user?.id || 'usr_' + Date.now(),
            name: capitalizedName,
            login: cleanLogin,
            email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
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
      }
    } catch (err) {
      console.warn('Backend login unreachable, falling back to local auth:', err.message);
    }
  }

  // Local authentication fallback
  const displayName = cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin;
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  const authData = {
    user: {
      id: 'local_' + Date.now(),
      name: capitalizedName,
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
      role: 'Менеджер проектов',
      phone: '+7 (701) 000-00-00',
      avatar: '👨‍💼'
    },
    token: \`token_offline_\${Date.now()}\`,
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
  const cleanUrl = serverUrl.replace(/\\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(\`\${cleanUrl}/health\`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      return { ok: true, latency };
    }
    return { ok: false, error: \`HTTP \${res.status}\` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

function parseBudget(b) {
  if (typeof b === 'number') return b;
  if (typeof b === 'string') return parseInt(b.replace(/[^\\d]/g, ''), 10) || 0;
  return 0;
}

function normalizeRemoteItem(item) {
  let notes = [];
  if (typeof item.notes === 'string' && item.notes.trim()) {
    notes = [{ text: item.notes, time: 'Railway', author: item.contractor || 'Менеджер' }];
  } else if (Array.isArray(item.notes)) {
    notes = item.notes;
  }

  return {
    id: String(item.id),
    leadNum: String(item.leadNum || item.id),
    title: item.title || ('Заявка #' + item.id),
    client: item.contractor || item.client || 'Клиент',
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

export async function twoWaySyncWithRailway(serverUrl, localDeals) {
  if (!serverUrl) return { success: false, error: 'URL сервера не настроен' };
  const cleanUrl = serverUrl.replace(/\\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // 1. PULL: Fetch all real CRM events from Railway Go Backend (PostgreSQL)
    const getRes = await fetch(\`\${cleanUrl}/api/v1/crm/events\`, {
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
      
      let merged = [];
      if (remoteRaw.length > 0) {
        const remoteNormalized = remoteRaw.map(normalizeRemoteItem);
        const remoteIdMap = new Map();
        remoteNormalized.forEach(r => remoteIdMap.set(String(r.id), r));

        // Preserve any local deals created on phone that aren't old hardcoded demos (deal-101...)
        (localDeals || []).forEach(local => {
          const sId = String(local.id);
          if (!remoteIdMap.has(sId) && !sId.startsWith('deal-')) {
            remoteIdMap.set(sId, local);
          }
        });
        merged = Array.from(remoteIdMap.values());
      } else {
        merged = localDeals || [];
      }

      // 2. PUSH: If there are new local deals created on phone, push them to Railway
      const localOnlyDeals = (localDeals || []).filter(d => 
        !remoteRaw.some(r => String(r.id) === String(d.id)) && 
        !String(d.id).startsWith('deal-')
      );

      if (localOnlyDeals.length > 0) {
        try {
          const pushController = new AbortController();
          const pushTimeout = setTimeout(() => pushController.abort(), 4000);
          await fetch(\`\${cleanUrl}/api/v1/crm/events/sync\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: localOnlyDeals }),
            signal: pushController.signal
          });
          clearTimeout(pushTimeout);
        } catch (pushErr) {
          console.warn('Background push failed:', pushErr);
        }
      }

      return {
        success: true,
        latencyMs: latency,
        lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mergedDeals: merged
      };
    }
    return { success: false, error: \`Ошибка сервера: \${getRes.status}\` };
  } catch (err) {
    return { success: false, error: err.message || 'Сбой сети' };
  }
}
`;

fs.writeFileSync(crmApiPath, crmApiContent, 'utf8');
console.log('✓ crmApi.js rewritten with REAL deals & full GET/POST sync.');

// 2. Update LoginScreen.jsx version badge
const loginPath = path.join(rootDir, 'src/components/LoginScreen.jsx');
let loginScreen = fs.readFileSync(loginPath, 'utf8');
loginScreen = loginScreen.replace(/v1\.[0-2]/g, 'v1.3');
fs.writeFileSync(loginPath, loginScreen, 'utf8');
console.log('✓ LoginScreen.jsx updated to v1.3.');

// 3. Update build.gradle to versionCode 4 / versionName 1.3
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode \d+/, 'versionCode 4');
gradle = gradle.replace(/versionName "[^"]+"/, 'versionName "1.3"');
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('✓ build.gradle bumped to v1.3 (versionCode 4).');
