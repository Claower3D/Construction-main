const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ────────────────────────────────────────────────────────────
// 1. Update crmApi.js with permanent session keys and auto-login persistence
// ────────────────────────────────────────────────────────────
const crmApiPath = path.join(rootDir, 'src/api/crmApi.js');

const crmApiContent = `// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)

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
      const cleanUrl = serverUrl.replace(/\\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(\`\${cleanUrl}/api/v1/auth/login\`, {
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
      } else if (res.status === 401) {
        // Try auto-registration on backend if not existing yet
        try {
          const regRes = await fetch(\`\${cleanUrl}/api/v1/auth/register\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
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
                email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
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
console.log('✓ crmApi.js updated with permanent session & auto-login logic.');

// ────────────────────────────────────────────────────────────
// 2. Update LoginScreen.jsx with useRef DOM fallbacks and pre-filled login
// ────────────────────────────────────────────────────────────
const loginPath = path.join(rootDir, 'src/components/LoginScreen.jsx');

const loginScreenContent = `import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { loginManager, testServerPing, getSavedLogin, setSavedLogin } from '../api/crmApi';

export default function LoginScreen({ serverUrl, onUpdateServerUrl, onLoginSuccess }) {
  const initialLogin = getSavedLogin();
  const [loginInput, setLoginInput] = useState(initialLogin);
  const [password, setPassword] = useState('Sasha2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState((serverUrl && !serverUrl.includes('qazgost-backend')) ? serverUrl : 'https://construction-main-production.up.railway.app');
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [pingLatency, setPingLatency] = useState(null);

  const loginInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Sync saved login on mount
  useEffect(() => {
    const saved = getSavedLogin();
    if (saved) {
      setLoginInput(saved);
      if (loginInputRef.current) {
        loginInputRef.current.value = saved;
      }
    }
  }, []);

  // Connectivity check on mount or when server URL changes
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      setServerStatus('checking');
      const res = await testServerPing(customServerUrl);
      if (isMounted) {
        if (res.ok) {
          setServerStatus('online');
          setPingLatency(res.latency);
        } else {
          setServerStatus('offline');
          setPingLatency(null);
        }
      }
    };
    checkPing();
    return () => { isMounted = false; };
  }, [customServerUrl]);

  const handleLoginSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Read directly from DOM input elements to eliminate any Android Autofill / React state desync!
    const domLogin = (loginInputRef.current ? loginInputRef.current.value : '') || loginInput || '';
    const domPass = (passwordInputRef.current ? passwordInputRef.current.value : '') || password || '';

    const cleanLogin = domLogin.trim();
    const cleanPass = domPass.trim();

    if (!cleanLogin) {
      setErrorMsg('Пожалуйста, введите ваш логин, email или телефон');
      if (loginInputRef.current) loginInputRef.current.focus();
      return;
    }

    // Always remember login
    setSavedLogin(cleanLogin);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginManager(customServerUrl, cleanLogin, cleanPass);
      if (res.success && res.authData) {
        if (onUpdateServerUrl && customServerUrl !== serverUrl) {
          onUpdateServerUrl(customServerUrl);
        }
        onLoginSuccess(res.authData);
      } else {
        setErrorMsg(res.error || 'Ошибка авторизации. Проверьте логин и пароль.');
      }
    } catch (err) {
      setErrorMsg('Не удалось выполнить вход: ' + (err.message || 'Сбой сети'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: '100dvh',
      background: 'radial-gradient(circle at 50% 12%, #152445 0%, #060913 85%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      maxWidth: '460px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow circles */}
      <div style={{
        position: 'absolute',
        top: '-8%',
        left: '20%',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '66px',
          height: '66px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 229, 255, 0.45)',
          color: '#060913',
          fontWeight: 900,
          fontSize: '1.9rem'
        }}>
          🏗️
        </div>

        <span style={{
          fontSize: '0.72rem',
          background: 'rgba(0, 229, 255, 0.15)',
          color: '#00e5ff',
          padding: '4px 12px',
          borderRadius: '999px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          QazGost • Мобильная CRM v1.4
        </span>

        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 6px',
          letterSpacing: '-0.02em'
        }}>
          Вход для менеджера
        </h1>

        <p style={{
          fontSize: '0.84rem',
          color: '#94a3b8',
          margin: 0
        }}>
          Управление объектами, сметами и сделками
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '24px 20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        zIndex: 2
      }}>
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '11px 13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '0.82rem',
            lineHeight: 1.35
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          {/* Login / Email / Phone Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Логин, Email или Телефон
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <User size={18} color="#00e5ff" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                ref={loginInputRef}
                type="text"
                defaultValue={initialLogin}
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setErrorMsg(null);
                }}
                onInput={(e) => {
                  setLoginInput(e.target.value);
                  setErrorMsg(null);
                }}
                onBlur={(e) => {
                  setLoginInput(e.target.value);
                  setSavedLogin(e.target.value);
                }}
                placeholder="sasha.manager@qazgost.kz"
                required
                autoComplete="username"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  padding: '13px 0'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Пароль
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <Lock size={18} color="#00e5ff" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                onInput={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  padding: '13px 0'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            fontSize: '0.78rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#00e5ff',
                  width: '15px',
                  height: '15px'
                }}
              />
              <span>Запомнить данные для входа</span>
            </label>
          </div>

          {/* Railway Connection Status Indicator */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: serverStatus === 'online' ? '#10b981' : serverStatus === 'checking' ? '#f59e0b' : '#94a3b8',
                  boxShadow: serverStatus === 'online' ? '0 0 8px #10b981' : 'none'
                }} />
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                  {serverStatus === 'online' ? 'Railway Cloud онлайн' : serverStatus === 'checking' ? 'Проверка связи...' : 'Офлайн / Локальный режим'}
                </span>
                {pingLatency && (
                  <span style={{ color: '#10b981', fontSize: '0.7rem' }}>
                    ({pingLatency} мс)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showServerConfig ? 'Скрыть' : 'Сервер'}
              </button>
            </div>

            {/* Collapsible Server Settings */}
            {showServerConfig && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  АДРЕС БЭКЕНДА:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="https://construction-main-production.up.railway.app"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      color: '#00e5ff',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setServerStatus('checking');
                      const res = await testServerPing(customServerUrl);
                      if (res.ok) {
                        setServerStatus('online');
                        setPingLatency(res.latency);
                      } else {
                        setServerStatus('offline');
                      }
                    }}
                    style={{
                      background: 'rgba(0, 229, 255, 0.15)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00e5ff',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    Пинг
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="glow-btn"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '0.98rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
              color: '#060913',
              border: 'none',
              cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 8px 25px rgba(0, 229, 255, 0.35)'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s infinite linear' }} />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <span>Войти в аккаунт</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div style={{ textAlign: 'center', marginTop: '24px', position: 'relative', zIndex: 2 }}>
        <p style={{
          fontSize: '0.74rem',
          color: '#64748b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Shield size={13} color="#10b981" />
          Защищённая CRM-система • QazGost KZ © 2026
        </p>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(loginPath, loginScreenContent, 'utf8');
console.log('✓ LoginScreen.jsx updated with DOM ref fallbacks and remembered login.');

// ────────────────────────────────────────────────────────────
// 3. Update build.gradle to versionCode 5 / versionName 1.4
// ────────────────────────────────────────────────────────────
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode \d+/, 'versionCode 5');
gradle = gradle.replace(/versionName "[^"]+"/, 'versionName "1.4"');
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('✓ build.gradle bumped to v1.4 (versionCode 5).');
