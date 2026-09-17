const STORAGE_KEY_DEALS = 'qazgost_manager_crm_deals_v2';
const STORAGE_KEY_SETTINGS = 'qazgost_manager_crm_settings_v2';
const STORAGE_KEY_AUTH = 'qazgost_manager_crm_auth_v2';

// Clear legacy v1 mock cache on launch
try {
  localStorage.removeItem('qazgost_manager_crm_deals_v1');
  localStorage.removeItem('qazgost_manager_crm_auth_v1');
  localStorage.removeItem('qazgost_manager_crm_settings_v1');
} catch (e) {}

export const DEFAULT_MANAGER = { 
  id: 'mgr_default', 
  name: 'Менеджер QazGost', 
  email: 'manager@qazgost.kz',
  role: 'Ведущий специалист ПТО', 
  phone: '+7 (701) 999-00-00', 
  avatar: '👨‍💼'
};

// Exported for backwards compatibility
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
  'Новые заявки',
  'В работе',
  'КП / Смета',
  'Договор',
  'Дожим',
  'Оплачено / В работе'
];

export const STAGES = PIPELINE_STAGES;

export const INITIAL_DEALS = [
  {
    id: 'deal-101',
    leadNum: '101',
    title: 'Техническое обследование несущих конструкций БЦ "Алматы Тауэрс"',
    client: 'ТОО "Premier Development"',
    phone: '+7 (777) 123-45-67',
    location: 'г. Алматы, пр. Достык, 180',
    budget: 8500000,
    status: 'КП / Смета',
    role: 'engineer',
    date: '2026-09-18',
    time: '11:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Заказчик запросил выездную группу со сканером LiDAR.', time: '17 сен', author: 'Менеджер' },
      { text: 'Подготовлен предварительный расчёт сметы.', time: '17 сен', author: 'Инженер ПТО' }
    ]
  },
  {
    id: 'deal-102',
    leadNum: '102',
    title: 'Монолитные работы и армирование фундаментной плиты (Блок Б)',
    client: 'BI Group Almaty',
    phone: '+7 (701) 987-65-43',
    location: 'г. Алматы, р-н Наурызбайский',
    budget: 42000000,
    status: 'В работе',
    role: 'executor',
    date: '2026-09-18',
    time: '14:30',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Бригада из 14 человек на объекте. Бетононасос заказан.', time: '16 сен', author: 'Прораб' }
    ]
  },
  {
    id: 'deal-103',
    leadNum: '103',
    title: 'Усиление перекрытий углеволокном и инъектирование трещин',
    client: 'ЖК "Apple City"',
    phone: '+7 (705) 555-44-33',
    location: 'г. Алматы, ул. Сатпаева, 45',
    budget: 3200000,
    status: 'Новые заявки',
    role: 'lead',
    date: '2026-09-19',
    time: '10:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Новая входящая заявка с сайта через ИИ-анализ трещин.', time: '17 сен', author: 'Система' }
    ]
  },
  {
    id: 'deal-104',
    leadNum: '104',
    title: 'Поставка бетона М350 B25 с противоморозной добавкой (450 м³)',
    client: 'ТОО "BAZIS Construction"',
    phone: '+7 (702) 333-22-11',
    location: 'г. Астана, левый берег',
    budget: 11250000,
    status: 'Договор',
    role: 'executor',
    date: '2026-09-20',
    time: '09:00',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Договор подписан со стороны заказчика. Ждём предоплату 30%.', time: '16 сен', author: 'Менеджер' }
    ]
  },
  {
    id: 'deal-105',
    leadNum: '105',
    title: 'Аренда автобетононасоса 42м со сменой оператора',
    client: 'ИП "СтройСнаб KZ"',
    phone: '+7 (771) 400-50-60',
    location: 'г. Алматы, Капчагайская трасса',
    budget: 650000,
    status: 'Оплачено / В работе',
    role: 'machinery',
    date: '2026-09-18',
    time: '16:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Оплата поступила. Выезд назначен на 18 сентября.', time: '17 сен', author: 'Менеджер' }
    ]
  },
  {
    id: 'deal-106',
    leadNum: '106',
    title: 'Экспертиза прочности бетона склерометром и ультразвуком',
    client: 'ТОО "КазСтройЭксперт"',
    phone: '+7 (707) 777-88-99',
    location: 'г. Алматы, пр. Аль-Фараби, 77',
    budget: 1800000,
    status: 'КП / Смета',
    role: 'engineer',
    date: '2026-09-21',
    time: '12:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Запланирован выезд с георадаром.', time: '14 сен', author: 'Инженер ПТО' }]
  },
  {
    id: 'deal-107',
    leadNum: '107',
    title: 'Монтаж сэндвич-панелей складского комплекса',
    client: 'ТОО "КазЛогистик"',
    phone: '+7 (701) 111-22-33',
    location: 'г. Шымкент, индустриальная зона',
    budget: 14500000,
    status: 'В работе',
    role: 'executor',
    date: '2026-09-22',
    time: '10:00',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Доставка панелей 1-й партии завершена.', time: '16 сен', author: 'Менеджер' }]
  },
  {
    id: 'deal-108',
    leadNum: '108',
    title: 'Аренда башенного крана 8 тонн',
    client: 'ТОО "MegaBuild KZ"',
    phone: '+7 (778) 999-00-11',
    location: 'г. Алматы, ул. Розыбакиева',
    budget: 2800000,
    status: 'Дожим',
    role: 'machinery',
    date: '2026-09-25',
    time: '08:30',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Договор на согласовании у юриста заказчика.', time: '15 сен', author: 'Менеджер' }]
  },
  {
    id: 'deal-109',
    leadNum: '109',
    title: 'Госприёмка и подписание акта ввода в эксплуатацию',
    client: 'Акимат г. Алматы (подрядчик)',
    phone: '+7 (727) 222-33-44',
    location: 'г. Алматы, мкр. Нуркент',
    budget: 24000000,
    status: 'В работе',
    role: 'deadline',
    date: '2026-09-28',
    time: '15:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Подготовка исполнительной документации.', time: '12 сен', author: 'Менеджер' }]
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
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    serverUrl: 'https://qazgost-backend.up.railway.app',
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

  // 1. First attempt online authentication with Railway backend
  if (serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
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
      }
    } catch (err) {
      console.warn('Backend login unreachable, falling back to local auth:', err.message);
    }
  }

  // 2. Seamless offline / local authentication fallback
  const displayName = cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin;
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

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

export async function twoWaySyncWithRailway(serverUrl, localDeals) {
  if (!serverUrl) return { success: false, error: 'URL сервера не настроен' };
  const cleanUrl = serverUrl.replace(/\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        source: 'android-manager-crm',
        timestamp: new Date().toISOString(),
        deals: localDeals
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      let merged = localDeals;
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        const remoteMap = new Map();
        data.events.forEach(e => {
          if (e.id) remoteMap.set(e.id, e);
        });
        localDeals.forEach(d => {
          if (!remoteMap.has(d.id)) {
            remoteMap.set(d.id, d);
          }
        });
        merged = Array.from(remoteMap.values());
      }
      return {
        success: true,
        latencyMs: latency,
        lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mergedDeals: merged
      };
    }
    return { success: false, error: `Ошибка сервера: ${res.status}` };
  } catch (err) {
    return { success: false, error: err.message || 'Сбой сети' };
  }
}
