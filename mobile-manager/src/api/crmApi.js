// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)

const STORAGE_KEY_DEALS = 'qazgost_manager_crm_deals_v1';
const STORAGE_KEY_SETTINGS = 'qazgost_manager_crm_settings_v1';
const STORAGE_KEY_AUTH = 'qazgost_manager_crm_auth_v1';

export const MANAGERS_LIST = [
  { 
    id: 'm1', 
    name: 'Алихан Касымов', 
    email: 'alikhan@qazgost.kz',
    role: 'Ведущий менеджер ПТО', 
    phone: '+7 (701) 999-11-22', 
    avatar: '👨‍💼',
    passcode: '1234'
  },
  { 
    id: 'm2', 
    name: 'Ернар Сарсенов', 
    email: 'ernar@qazgost.kz',
    role: 'Куратор объектов / Инженер', 
    phone: '+7 (702) 888-33-44', 
    avatar: '👷',
    passcode: '1234'
  },
  { 
    id: 'm3', 
    name: 'Динара Нурланова', 
    email: 'dinara@qazgost.kz',
    role: 'Менеджер по работе с клиентами', 
    phone: '+7 (777) 444-55-66', 
    avatar: '👩‍💼',
    passcode: '1234'
  }
];

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
    subBadge: 'GPS Логистика',
    icon: '🚜',
    color: '#38bdf8',
    border: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    glow: 'rgba(56, 189, 248, 0.3)'
  },
  deadline: {
    badge: 'СДАЧА ЭТАПА',
    subBadge: 'Приёмка / Акт',
    icon: '✅',
    color: '#10b981',
    border: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    glow: 'rgba(16, 185, 129, 0.3)'
  }
};

export const STAGES = ['Новые', 'В работе', 'Дожим', 'Успешно', 'Отказ'];

const INITIAL_DEALS = [
  {
    id: 'deal-101',
    leadNum: '101',
    title: 'Оценка фундамента и дефектоскопия бетона',
    client: 'Касымбеков Арман',
    phone: '+7 (701) 555-12-34',
    location: 'г. Алматы, мкр. Баганашил, ул. Санаторная 14',
    budget: 1850000,
    status: 'Новые',
    role: 'engineer',
    date: '2026-09-18',
    time: '10:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Клиент запросил срочную экспертизу до заливки перекрытия', time: 'Сегодня, 09:15', author: 'Алихан' }
    ],
    estimateItems: [
      { name: 'Ультразвуковой контроль прочности бетона', qty: '12 точек', sum: 240000 },
      { name: 'Составление заключения по СНиП РК', qty: '1 отчёт', sum: 1610000 }
    ]
  },
  {
    id: 'deal-102',
    leadNum: '102',
    title: 'Монолитные работы 3-этажного коттеджа',
    client: 'ТОО "GostBuild Almaty"',
    phone: '+7 (777) 888-99-00',
    location: 'г. Алматы, Ремизовка, уч. 45',
    budget: 6450000,
    status: 'В работе',
    role: 'executor',
    date: '2026-09-18',
    time: '14:30',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Бригада заливает колонны 2-го яруса. Опалубка принята.', time: 'Вчера, 16:40', author: 'Ернар' }
    ],
    estimateItems: [
      { name: 'Вязка арматурного каркаса', qty: '8.4 т', sum: 2520000 },
      { name: 'Бетонирование насосом B25 М350', qty: '65 м³', sum: 3930000 }
    ]
  },
  {
    id: 'deal-103',
    leadNum: '103',
    title: 'Подача автобетононасоса 36м + 3 миксера',
    client: 'ИП "СтройМастер KZ"',
    phone: '+7 (705) 123-45-67',
    location: 'г. Астана, левый берег, ул. Мангилик Ел',
    budget: 850000,
    status: 'В работе',
    role: 'machinery',
    date: '2026-09-19',
    time: '09:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Диспетчер подтвердил подачу техники на 9 утра.', time: '17 сен, 11:20', author: 'Алихан' }
    ]
  },
  {
    id: 'deal-104',
    leadNum: '104',
    title: 'Согласование сметы на гидроизоляцию кровли',
    client: 'Смагулов Бахыт',
    phone: '+7 (702) 444-55-66',
    location: 'г. Алматы, мкр. Самал-2',
    budget: 3200000,
    status: 'Дожим',
    role: 'lead',
    date: '2026-09-19',
    time: '13:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Смета выслана в WhatsApp. Клиент ждёт скидку 5% на материалы.', time: 'Сегодня, 10:00', author: 'Динара' }
    ]
  },
  {
    id: 'deal-105',
    leadNum: '105',
    title: 'Финальная сдача объекта и подписание Акта КС-2',
    client: 'ТОО "ФинансКонсалт"',
    phone: '+7 (775) 333-22-11',
    location: 'г. Астана, ул. Достык 18',
    budget: 9800000,
    status: 'Успешно',
    role: 'deadline',
    date: '2026-09-17',
    time: '16:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Акты подписаны, эскроу-транш разблокирован в банке.', time: 'Вчера, 17:30', author: 'Алихан' }
    ]
  },
  {
    id: 'deal-106',
    leadNum: '106',
    title: 'Инспекция перекрытий и сканирование арматуры',
    client: 'Омаров Тимур',
    phone: '+7 (707) 654-32-10',
    location: 'г. Алматы, пр. Аль-Фараби 77',
    budget: 950000,
    status: 'Новые',
    role: 'engineer',
    date: '2026-09-15',
    time: '11:30',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Запланирован выезд с георадаром.', time: '14 сен', author: 'Ернар' }]
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
    notes: [{ text: 'Доставка панелей 1-й партии завершена.', time: '16 сен', author: 'Алихан' }]
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
    notes: [{ text: 'Договор на согласовании у юриста заказчика.', time: '15 сен', author: 'Динара' }]
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
    notes: [{ text: 'Подготовка исполнительной документации.', time: '12 сен', author: 'Алихан' }]
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
    serverUrl: 'https://qazgost-backend.up.railway.app', // Default Railway server URL
    activeManagerId: 'm1',
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

export async function loginManager(serverUrl, email, password, selectedManagerId) {
  if (serverUrl && email && password) {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const mgr = MANAGERS_LIST.find(m => m.email.toLowerCase() === email.toLowerCase()) || {
          id: data.user?.id || 'm1',
          name: data.user?.name || email.split('@')[0],
          email,
          role: data.user?.role || 'Менеджер QazGost',
          avatar: '👨‍💼'
        };
        const authData = {
          user: mgr,
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

  // Local / Offline manager authentication fallback
  const targetManager = MANAGERS_LIST.find(m => 
    m.id === selectedManagerId || 
    (email && m.email.toLowerCase() === email.toLowerCase())
  ) || MANAGERS_LIST[0];

  const authData = {
    user: targetManager,
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

    // 1. PULL: Fetch server events from Railway PostgreSQL
    const res = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const serverItems = data.items || [];

    // 2. MERGE: Reconcile server events with local storage
    const dealsMap = new Map();

    // Load server items first
    serverItems.forEach(item => {
      dealsMap.set(item.id, {
        id: item.id,
        leadNum: item.lead_num || item.leadNum || item.id,
        title: item.title,
        status: item.status || 'Новые',
        role: item.role || 'lead',
        date: item.date || new Date().toISOString().split('T')[0],
        time: item.time || '10:00',
        phone: item.phone || '',
        client: item.contractor || item.client || 'Заказчик',
        location: item.location || '',
        budget: parseInt(String(item.budget || '0').replace(/[^0-9]/g, ''), 10) || 500000,
        priority: item.priority || 'normal',
        updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        notes: item.notes ? (Array.isArray(item.notes) ? item.notes : [{ text: String(item.notes), time: 'Сервер', author: 'Railway' }]) : []
      });
    });

    // Merge local items with priority to newer modifications
    localDeals.forEach(localItem => {
      if (!dealsMap.has(localItem.id)) {
        dealsMap.set(localItem.id, localItem);
      } else {
        const serverItem = dealsMap.get(localItem.id);
        const localTime = new Date(localItem.updated_at || 0).getTime();
        const serverTime = new Date(serverItem.updated_at || 0).getTime();
        if (localTime > serverTime) {
          dealsMap.set(localItem.id, localItem);
        }
      }
    });

    const mergedList = Array.from(dealsMap.values());

    // 3. PUSH: Send merged state back to Railway for cloud persistence
    const pushPayload = mergedList.map(d => ({
      id: d.id,
      lead_num: String(d.leadNum || ''),
      title: d.title,
      status: d.status,
      type: d.type || 'request_engineering',
      role: d.role,
      date: d.date,
      time: d.time,
      phone: d.phone,
      contractor: d.client,
      location: d.location,
      budget: String(d.budget || '0'),
      notes: JSON.stringify(d.notes || []),
      updated_at: d.updated_at || new Date().toISOString()
    }));

    // Fire push in background
    fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: pushPayload })
    }).catch(e => console.warn('Background sync push warning:', e));

    const latency = Math.round(performance.now() - start);

    return {
      success: true,
      mergedDeals: mergedList,
      serverCount: serverItems.length,
      latencyMs: latency,
      lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      latencyMs: 0
    };
  }
}
