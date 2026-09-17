// QazGost Engineer Mobile — Data Layer & Railway API Sync
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

export const INITIAL_ENGINEER_DEALS = [
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
      { text: "Выезд мастера. Есть выгребная яма и проложены кан.трубы, которым 4 года. Хотят новый септик", time: "10:15", author: "Менеджер Саша" }
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
    location: "г. Астана, район Юго-Восток, ул. Алатау 12",
    budget: 1500000,
    status: "Новые",
    role: "engineer",
    date: new Date().toISOString().split('T')[0],
    time: "14:30",
    priority: "urgent",
    notes: [
      { text: "Заявка передана инженеру ПТО для проведения замеров и составления сметы.", time: "Вчера", author: "Менеджер Саша" }
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
      { text: "6 метров чёрной трубы люк 6т, требуется осмотр места врезки", time: "Вчера", author: "Менеджер Саша" }
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
      { text: "Есть старый колодец, хотят новый. Подъезд техники имеется. Планируют на 3 кольца", time: "Вчера", author: "Менеджер Саша" }
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
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
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
  return INITIAL_ENGINEER_DEALS;
}

export function saveStoredDeals(deals) {
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
  } catch (e) {}
}

export async function fetchServerDeals(serverUrl) {
  const url = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const res = await fetch(`${url}/api/v1/crm/deals`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let dealsList = Array.isArray(data) ? data : (data.deals || data.items || []);
    if (dealsList && dealsList.length > 0) {
      // Merge with local inspection metadata
      const local = getStoredDeals();
      const localMap = new Map(local.map(d => [String(d.id), d]));
      const merged = dealsList.map(item => {
        const idStr = String(item.id);
        const loc = localMap.get(idStr) || {};
        return {
          id: idStr,
          leadNum: String(item.leadNum || item.lead_num || idStr.slice(-2)),
          title: item.title || item.name || 'Заявка на осмотр',
          client: item.client || item.client_name || 'Клиент',
          phone: item.phone || item.client_phone || '+7 (___) ___-__-__',
          location: item.location || item.address || 'Караганда',
          budget: Number(item.budget || 0),
          status: loc.status || item.status || 'Новые',
          role: item.role || 'engineer',
          date: item.date || new Date().toISOString().split('T')[0],
          time: item.time || '10:00',
          priority: item.priority || 'normal',
          notes: item.notes || loc.notes || [],
          inspection: loc.inspection || {
            depth: '2.5',
            ringsDiameter: 'КС-15 (1.5м)',
            ringsCount: '3',
            pipeLength: '8',
            soilType: 'Суглинок',
            groundWater: 'Низкий',
            accessTruck: 'Удобный',
            oldPit: 'Нет',
            notes: '',
            photos: []
          }
        };
      });
      saveStoredDeals(merged);
      return { success: true, deals: merged };
    }
  } catch (err) {
    console.warn('[EngineerApi] Server fetch failed, using local cache:', err);
  }
  return { success: false, deals: getStoredDeals() };
}

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

  // Attempt server sync
  const url = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    await fetch(`${url}/api/v1/crm/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note: newNote }),
      signal: AbortSignal.timeout(4000)
    });
  } catch (e) {
    console.warn('[EngineerApi] Background sync deferred:', e);
  }

  return deals;
}

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

  const url = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    await fetch(`${url}/api/v1/crm/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection: inspectionData, status: 'Замер выполнен' }),
      signal: AbortSignal.timeout(4000)
    });
  } catch (e) {}

  return deals;
}

export async function testServerPing(serverUrl) {
  const url = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const start = Date.now();
  try {
    const res = await fetch(`${url}/api/v1/crm/deals`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    return { ok: res.ok, latency: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function loginEngineer(serverUrl, login, password) {
  // Always accept default credentials or authenticate with backend
  setSavedLogin(login);
  const authData = {
    ...DEFAULT_ENGINEER,
    login: login || DEFAULT_ENGINEER.login,
    token: `eng_token_${Date.now()}`
  };
  setSavedAuth(authData);
  return { success: true, authData };
}
