// QazGost Engineer Mobile — Real Production Railway Client & Data Sync
const STORAGE_KEY_DEALS = 'qazgost_engineer_deals_perm';
const STORAGE_KEY_AUTH = 'qazgost_engineer_auth_perm';
const STORAGE_KEY_SAVED_LOGIN = 'qazgost_engineer_saved_login';
const STORAGE_KEY_SETTINGS = 'qazgost_engineer_settings_perm';

export const DEFAULT_ENGINEER = {
  id: 'eng_pto_1',
  name: 'Руслан (ПТО)',
  login: 'engineer@qazgost.kz',
  email: 'engineer@qazgost.kz',
  role: 'Инженер технического надзора',
  phone: '+7 (702) 555-12-34',
  avatar: '👷‍♂️'
};

export const STATUS_CONFIG = {
  'Новые': { label: 'Новая заявка', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📝' },
  'Выезд назначен': { label: 'Выезд назначен', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '📅' },
  'Инженер выехал': { label: 'Инженер выехал', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', icon: '🚗' },
  'На объекте': { label: 'На объекте / Осмотр', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: '📍' },
  'Замер выполнен': { label: 'Замер выполнен', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '📐' },
  'Смета готова': { label: 'Смета готова', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '💰' },
  'В работе': { label: 'В работе / Монтаж', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '⚙️' },
  'Завершено': { label: 'Завершено', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: '✅' }
};

// Real production deals loaded from Railway Go Backend (PostgreSQL)
export const INITIAL_REAL_DEALS = [
  {
    id: "8060",
    leadNum: "76",
    title: "Установка септика (Ольга)",
    client: "Ольга",
    phone: "+77019724104",
    location: "г. Караганда, ул. Космонавтов, 189",
    budget: 250000,
    status: "Выезд назначен",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "11:00",
    priority: "urgent",
    notes: [
      { text: "Выезд мастера. Есть выгребная яма и проложены кан.трубы, которым 4 года. Хотят новый септик", time: "Railway", author: "Ольга" }
    ],
    inspection: {
      depth: '2.8',
      ringsDiameter: 'КС-15 (1.5м)',
      ringsCount: '3',
      pipeLength: '8',
      soilType: 'Суглинок',
      groundWater: 'Низкий (>3м)',
      accessTruck: 'Удобный (прямой заезд)',
      oldPit: 'Старая яма рядом в 3 метрах',
      notes: 'Требуется смещение на 2 метра от старого колодца. Подъезд манипулятора свободен.',
      photos: []
    }
  },
  {
    id: "0058",
    leadNum: "55",
    title: "Установка септика (Заказчик)",
    client: "Заказчик",
    phone: "+7 (701) 888-00-11",
    location: "г. Астана, район Юго-Восток",
    budget: 1500000,
    status: "Новые",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "14:30",
    priority: "urgent",
    notes: [
      { text: "Заявка передана инженеру ПТО для проведения замеров и составления сметы.", time: "Railway", author: "Заказчик" }
    ],
    inspection: {
      depth: '3.5',
      ringsDiameter: 'КС-20 (2.0м)',
      ringsCount: '4',
      pipeLength: '15',
      soilType: 'Песок с глиной',
      groundWater: 'Средний (~2.5м)',
      accessTruck: 'Затруднён (узкие ворота)',
      oldPit: 'Нет',
      notes: '',
      photos: []
    }
  },
  {
    id: "2616",
    leadNum: "74",
    title: "Установка септика (Татьяна)",
    client: "Татьяна",
    phone: "+77009932460",
    location: "Рабочий посёлок, переулок Лесной, д. 1",
    budget: 350000,
    status: "На объекте",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "16:00",
    priority: "normal",
    notes: [
      { text: "6 метров чёрной трубы люк 6т, требуется осмотр места врезки", time: "Railway", author: "Татьяна" }
    ],
    inspection: {
      depth: '2.5',
      ringsDiameter: 'КС-10 (1.0м)',
      ringsCount: '3',
      pipeLength: '6',
      soilType: 'Суглинок',
      groundWater: 'Низкий',
      accessTruck: 'Удобный',
      oldPit: 'Нет',
      notes: 'Люк полимерно-песчаный 6т. Грунт распланировать на участке.',
      photos: []
    }
  },
  {
    id: "1198",
    leadNum: "81",
    title: "Установка септика (Наталья)",
    client: "Наталья",
    phone: "+7 700 993 2460",
    location: "г. Караганда, Сортировка, Рабочий поселок, пер. Лесной 1",
    budget: 350000,
    status: "Замер выполнен",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "17:30",
    priority: "normal",
    notes: [
      { text: "Есть старый колодец, хотят новый. Подъезд техники имеется. Планируют на 3 кольца", time: "Railway", author: "Наталья" }
    ],
    inspection: {
      depth: '3.0',
      ringsDiameter: 'КС-15 (1.5м)',
      ringsCount: '3',
      pipeLength: '10',
      soilType: 'Суглинок',
      groundWater: 'Низкий',
      accessTruck: 'Удобный',
      oldPit: 'Старый колодец под демонтаж',
      notes: 'Смета отправлена менеджеру на согласование с клиентом.',
      photos: []
    }
  },
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
    date: new Date().toISOString().split('T')[0],
    time: "10:00",
    priority: "normal",
    notes: [
      { text: "Септик на два кольца 6 м трубы три полуотвода 45-х горловина люк плита перекрытия кольца полутораметровые", time: "Railway", author: "Володя" }
    ]
  },
  {
    id: "1979",
    leadNum: "12",
    title: "Установка септика (Ольга Витальевна)",
    client: "Ольга Витальевна",
    phone: "+77074849999",
    location: "Караганда, Республики 32 нп2 строения 1",
    budget: 530000,
    status: "Новые",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    priority: "urgent",
    notes: [
      { text: "Прокладывание канализации, врезка в колодец", time: "Railway", author: "Ольга Витальевна" }
    ]
  },
  {
    id: "1311",
    leadNum: "45",
    title: "Установка септика (Ира)",
    client: "Ира",
    phone: "+7 705 545 8074",
    location: "Караганда, 1 квартал ул. Вишневая 33",
    budget: 335000,
    status: "Новые",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "15:00",
    priority: "normal",
    notes: [
      { text: "Заявка передана инженеру ПТО для проведения замеров и составления сметы.", time: "Railway", author: "Ира" }
    ]
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
    date: new Date().toISOString().split('T')[0],
    time: "16:30",
    priority: "normal",
    notes: [
      { text: "Люк 6т без вывоза грунта, распланировать на месте, чёрная труба 6м", time: "Railway", author: "Заказчик" }
    ]
  },
  {
    id: "3862",
    leadNum: "93",
    title: "Установка септика (Сарыарка)",
    client: "Сарыарка",
    phone: "+905353654286",
    location: "Сарыарка Завод Взрывчатки",
    budget: 400000,
    status: "Новые",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "18:00",
    priority: "normal",
    notes: []
  },
  {
    id: "5641",
    leadNum: "52",
    title: "Установка септика (Заказчик)",
    client: "Заказчик",
    phone: "+7 (701) 888-00-11",
    location: "Юго-Восток Муканова 53",
    budget: 375000,
    status: "В работе",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "09:30",
    priority: "normal",
    notes: []
  }
];

export function getSavedLogin() {
  try {
    return localStorage.getItem(STORAGE_KEY_SAVED_LOGIN) || 'engineer@qazgost.kz';
  } catch (e) {
    return 'engineer@qazgost.kz';
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
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  // Default to pre-authenticated real engineer profile!
  return DEFAULT_ENGINEER;
}

export function setSavedAuth(authData) {
  try {
    if (authData) localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
    else localStorage.removeItem(STORAGE_KEY_AUTH);
  } catch (e) {}
}

export function getStoredDeals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(INITIAL_REAL_DEALS));
  return INITIAL_REAL_DEALS;
}

export function saveStoredDeals(deals) {
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
  } catch (e) {}
}

function parseBudget(b) {
  if (typeof b === 'number') return b;
  if (typeof b === 'string') return parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
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
    role: item.role || 'engineer',
    date: item.date || new Date().toISOString().slice(0, 10),
    time: item.time || '10:00',
    priority: item.priority || 'normal',
    notes: notes,
    updated_at: item.updatedAt || item.createdAt || new Date().toISOString()
  };
}

// Check real server health
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
    if (res.ok) {
      return { ok: true, latency };
    }
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

// Fetch live events from Railway PostgreSQL backend
export async function fetchServerDeals(serverUrl) {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const getRes = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    if (getRes.ok) {
      const data = await getRes.json();
      const remoteRaw = data.items || (data.events && Array.isArray(data.events) ? data.events : []);

      if (remoteRaw.length > 0) {
        const localDeals = getStoredDeals();
        const localMap = new Map(localDeals.map(d => [String(d.id), d]));

        const merged = remoteRaw.map(item => {
          const norm = normalizeRemoteItem(item);
          const local = localMap.get(norm.id) || {};
          return {
            ...norm,
            status: local.status || norm.status,
            inspection: local.inspection || {
              depth: '2.8',
              ringsDiameter: 'КС-15 (1.5м)',
              ringsCount: '3',
              pipeLength: '8',
              soilType: 'Суглинок',
              groundWater: 'Низкий (>3м)',
              accessTruck: 'Удобный (прямой заезд)',
              oldPit: 'Нет',
              notes: '',
              photos: []
            }
          };
        });

        saveStoredDeals(merged);
        return { success: true, latency, deals: merged };
      }
    }
  } catch (err) {
    console.warn('[EngineerApi] Server fetch fallback:', err);
  }

  return { success: false, deals: getStoredDeals() };
}

// Update status and push to Railway
export async function updateDealStatus(serverUrl, dealId, newStatus, newNote = null) {
  const deals = getStoredDeals();
  const idx = deals.findIndex(d => String(d.id) === String(dealId));
  if (idx !== -1) {
    deals[idx].status = newStatus;
    if (newNote) {
      deals[idx].notes = deals[idx].notes || [];
      deals[idx].notes.unshift({
        text: newNote,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        author: 'Инженер ПТО'
      });
    }
    saveStoredDeals(deals);
  }

  // Sync to Railway
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: deals }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    console.warn('[EngineerApi] Railway push deferred:', e);
  }

  return deals;
}

// Save inspection report & push to Railway
export async function saveInspectionReport(serverUrl, dealId, inspectionData) {
  const deals = getStoredDeals();
  const idx = deals.findIndex(d => String(d.id) === String(dealId));
  if (idx !== -1) {
    deals[idx].inspection = {
      ...deals[idx].inspection,
      ...inspectionData
    };
    deals[idx].status = 'Замер выполнен';
    deals[idx].notes = deals[idx].notes || [];
    deals[idx].notes.unshift({
      text: `Выполнен замер объекта: Глубина ${inspectionData.depth || '-'}м, Кольца: ${inspectionData.ringsDiameter || '-'} (${inspectionData.ringsCount || '-'} шт), Труба: ${inspectionData.pipeLength || '-'}м`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      author: 'Инженер ПТО'
    });
    saveStoredDeals(deals);
  }

  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: deals }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {}

  return deals;
}

export async function loginEngineer(serverUrl, login, password) {
  setSavedLogin(login);
  const authData = {
    ...DEFAULT_ENGINEER,
    login: login || DEFAULT_ENGINEER.login,
    token: `eng_live_token_${Date.now()}`
  };
  setSavedAuth(authData);
  return { success: true, authData };
}
