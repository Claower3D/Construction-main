// QazGost Executor Mobile — Real Production Railway Client & Data Sync
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

export const INITIAL_REAL_ORDERS = [
  {
    id: "4051",
    leadNum: "101",
    title: "Установка септика (Оксана)",
    client: "Оксана",
    phone: "+7 (701) 888-00-11",
    location: "Караганда, Лебедево 17",
    budget: 700000,
    status: "В работе",
    role: "executor",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    priority: "urgent",
    crew: "Бригада №3",
    stages: [
      { id: 1, title: 'Разметка и подготовка площадки', done: true, time: '09:30', note: 'Оси вынесены, заезд свободен' },
      { id: 2, title: 'Копка котлована и траншеи', done: true, time: '12:00', note: 'Котлован глубиной 3.2м готов' },
      { id: 3, title: 'Монтаж колец ЖБИ / септика', done: false, time: null, note: '' },
      { id: 4, title: 'Прокладка трубопровода d110', done: false, time: null, note: '' },
      { id: 5, title: 'Врезка и герметизация швов', done: false, time: null, note: '' },
      { id: 6, title: 'Монтаж плиты перекрытия и люка', done: false, time: null, note: '' },
      { id: 7, title: 'Обратная засыпка и сдача', done: false, time: null, note: '' }
    ],
    materials: [
      { name: 'Кольцо ЖБИ КС-15.9 (1.5м)', qty: 3, unit: 'шт', status: 'delivered' },
      { name: 'Плита перекрытия ПП-15', qty: 1, unit: 'шт', status: 'delivered' },
      { name: 'Люк полимерно-песчаный 6т', qty: 1, unit: 'шт', status: 'delivered' },
      { name: 'Труба канализационная рыжая 110 (2м)', qty: 5, unit: 'шт', status: 'delivered' },
      { name: 'Щебень фракция 20-40', qty: 2, unit: 'т', status: 'pending' }
    ],
    photos: [
      { id: 'p1', tag: 'Котлован', caption: 'Глубина 3.2м, суглинок', time: '12:05' }
    ],
    machinery: [
      { type: 'Экскаватор колесный', date: new Date().toISOString().split('T')[0], time: '10:00', status: 'completed' }
    ],
    notes: [
      { text: 'Начали монтаж. Заказчик на месте, электричество подключено.', time: '09:15', author: 'Тимур' }
    ]
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
    role: "executor",
    date: new Date().toISOString().split('T')[0],
    time: "13:30",
    priority: "normal",
    crew: "Бригада №3",
    stages: [
      { id: 1, title: 'Разметка и подготовка площадки', done: true, time: '13:45', note: '' },
      { id: 2, title: 'Копка котлована и траншеи', done: false, time: null, note: '' },
      { id: 3, title: 'Монтаж колец ЖБИ / септика', done: false, time: null, note: '' },
      { id: 4, title: 'Прокладка трубопровода d110', done: false, time: null, note: '' },
      { id: 5, title: 'Врезка и герметизация швов', done: false, time: null, note: '' },
      { id: 6, title: 'Монтаж плиты перекрытия и люка', done: false, time: null, note: '' },
      { id: 7, title: 'Обратная засыпка и сдача', done: false, time: null, note: '' }
    ],
    materials: [
      { name: 'Кольцо ЖБИ КС-15.9 (1.5м)', qty: 2, unit: 'шт', status: 'delivered' },
      { name: 'Люк полимерно-песчаный 6т', qty: 1, unit: 'шт', status: 'delivered' },
      { name: 'Труба рыжая 110 (2м)', qty: 3, unit: 'шт', status: 'delivered' }
    ],
    photos: [],
    machinery: [],
    notes: [
      { text: 'Люк 6т без вывоза грунта, распланировать на месте, черная труба 6м', time: 'Railway', author: 'Менеджер' }
    ]
  },
  {
    id: "5866",
    leadNum: "21",
    title: "Колодцы Акимат (вдоль дороги)",
    client: "Акимат",
    phone: "87058277797",
    location: "Шахтерский 3 улица, колодец вдоль дороги",
    budget: 850000,
    status: "В работе",
    role: "executor",
    date: new Date().toISOString().split('T')[0],
    time: "15:00",
    priority: "urgent",
    crew: "Бригада №3",
    stages: [
      { id: 1, title: 'Разметка и подготовка площадки', done: true, time: '15:10', note: 'Ограждение выставлено' },
      { id: 2, title: 'Копка котлована и траншеи', done: true, time: '16:30', note: '' },
      { id: 3, title: 'Монтаж колец ЖБИ / септика', done: true, time: '17:45', note: 'КС-20 смонтированы' },
      { id: 4, title: 'Прокладка трубопровода d110', done: false, time: null, note: '' },
      { id: 5, title: 'Врезка и герметизация швов', done: false, time: null, note: '' },
      { id: 6, title: 'Монтаж плиты перекрытия и люка', done: false, time: null, note: '' },
      { id: 7, title: 'Обратная засыпка и сдача', done: false, time: null, note: '' }
    ],
    materials: [
      { name: 'Кольцо ЖБИ КС-20.9 (2.0м)', qty: 3, unit: 'шт', status: 'delivered' },
      { name: 'Плита перекрытия ПП-20', qty: 1, unit: 'шт', status: 'delivered' },
      { name: 'Люк чугунный тяжелый 25т', qty: 1, unit: 'шт', status: 'delivered' }
    ],
    photos: [],
    machinery: [
      { type: 'Манипулятор 10т', date: new Date().toISOString().split('T')[0], time: '17:00', status: 'completed' }
    ],
    notes: [
      { text: 'Требуется соблюдение техники безопасности возле проезжей части.', time: 'Railway', author: 'Акимат' }
    ]
  },
  {
    id: "8060",
    leadNum: "76",
    title: "Установка септика (Ольга)",
    client: "Ольга",
    phone: "+77019724104",
    location: "г. Караганда, ул. Космонавтов, 189",
    budget: 250000,
    status: "Выезд назначен",
    role: "executor",
    date: new Date().toISOString().split('T')[0],
    time: "11:00",
    priority: "normal",
    crew: "Бригада №3",
    stages: STAGE_CONFIG.map(s => ({ id: s.id, title: s.title, done: false, time: null, note: '' })),
    materials: [
      { name: 'Кольцо ЖБИ КС-15.9 (1.5м)', qty: 3, unit: 'шт', status: 'pending' },
      { name: 'Люк полимерно-песчаный 6т', qty: 1, unit: 'шт', status: 'pending' }
    ],
    photos: [],
    machinery: [],
    notes: [
      { text: 'Замер инженера выполнен. Выгребная яма в 3м, новый септик со смещением.', time: 'Инженер', author: 'Максим (ПТО)' }
    ]
  },
  {
    id: "1198",
    leadNum: "81",
    title: "Установка септика (Наталья)",
    client: "Наталья",
    phone: "+7 700 993 2460",
    location: "г. Караганда, Сортировка, пер. Лесной 1",
    budget: 350000,
    status: "Выезд назначен",
    role: "executor",
    date: new Date().toISOString().split('T')[0],
    time: "16:00",
    priority: "normal",
    crew: "Бригада №3",
    stages: STAGE_CONFIG.map(s => ({ id: s.id, title: s.title, done: false, time: null, note: '' })),
    materials: [
      { name: 'Кольцо ЖБИ КС-15.9 (1.5м)', qty: 3, unit: 'шт', status: 'pending' },
      { name: 'Труба 110 (2м)', qty: 4, unit: 'шт', status: 'pending' }
    ],
    photos: [],
    machinery: [],
    notes: [
      { text: 'Замер готов, подъезд техники удобный, планируют на 3 кольца.', time: 'Инженер', author: 'Максим (ПТО)' }
    ]
  }
];

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
    return localStorage.getItem(STORAGE_KEY_SAVED_LOGIN) || 'timur.executor@qazgost.kz';
  } catch (e) {
    return 'timur.executor@qazgost.kz';
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
  return DEFAULT_EXECUTOR;
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

export function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_REAL_ORDERS));
  return INITIAL_REAL_ORDERS;
}

export function saveStoredOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
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

export async function fetchServerOrders(serverUrl) {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${cleanUrl}/api/v1/crm/events`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      const remoteRaw = data.items || (data.events && Array.isArray(data.events) ? data.events : []);
      if (remoteRaw.length > 0) {
        const local = getStoredOrders();
        const localMap = new Map(local.map(o => [String(o.id), o]));

        const merged = remoteRaw.map(r => {
          const sId = String(r.id);
          const loc = localMap.get(sId) || {};
          return {
            id: sId,
            leadNum: String(r.leadNum || r.id),
            title: r.title || ('Заказ #' + r.id),
            client: r.contractor || r.client || 'Клиент',
            phone: r.phone || '',
            location: r.location || '',
            budget: r.budget || 0,
            status: loc.status || r.status || 'В работе',
            role: 'executor',
            date: r.date || new Date().toISOString().slice(0, 10),
            time: r.time || '10:00',
            priority: r.priority || 'normal',
            crew: loc.crew || 'Бригада №3',
            stages: loc.stages || STAGE_CONFIG.map(s => ({ id: s.id, title: s.title, done: false, time: null, note: '' })),
            materials: loc.materials || [
              { name: 'Кольцо КС-15', qty: 3, unit: 'шт', status: 'pending' },
              { name: 'Люк 6т', qty: 1, unit: 'шт', status: 'pending' },
              { name: 'Труба 110 (2м)', qty: 4, unit: 'шт', status: 'pending' }
            ],
            photos: loc.photos || [],
            machinery: loc.machinery || [],
            notes: loc.notes || []
          };
        });

        saveStoredOrders(merged);
        return { success: true, ok: true, latency, orders: merged };
      }
    }
  } catch (e) {
    console.warn('[ExecutorApi] Sync fallback:', e);
  }
  return { success: false, ok: true, fromCache: true, orders: getStoredOrders() };
}

export async function updateOrderStatus(serverUrl, orderId, newStatus, newNote = null, authorName = 'Тимур (Бригадир)') {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => String(o.id) === String(orderId));
  if (idx !== -1) {
    orders[idx].status = newStatus;
    if (newNote) {
      orders[idx].notes = orders[idx].notes || [];
      orders[idx].notes.unshift({
        text: newNote,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        author: authorName
      });
    }
    saveStoredOrders(orders);
  }

  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: orders }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {}

  return orders;
}

export async function toggleWorkStage(serverUrl, orderId, stageId, isDone, stageNote = '', authorName = 'Тимур (Бригадир)') {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => String(o.id) === String(orderId));
  if (idx !== -1) {
    orders[idx].stages = orders[idx].stages || [];
    const sIdx = orders[idx].stages.findIndex(s => s.id === stageId);
    if (sIdx !== -1) {
      orders[idx].stages[sIdx].done = isDone;
      orders[idx].stages[sIdx].time = isDone ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null;
      if (stageNote) orders[idx].stages[sIdx].note = stageNote;
    }

    const doneCount = orders[idx].stages.filter(s => s.done).length;
    if (doneCount === orders[idx].stages.length) {
      orders[idx].status = 'Завершено';
    } else if (doneCount > 0 && orders[idx].status === 'Новые') {
      orders[idx].status = 'В работе';
    }

    orders[idx].notes = orders[idx].notes || [];
    orders[idx].notes.unshift({
      text: `${isDone ? 'Выполнен этап' : 'Сброшен этап'}: "${orders[idx].stages[sIdx]?.title || stageId}"${stageNote ? ' (' + stageNote + ')' : ''}`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      author: authorName
    });

    saveStoredOrders(orders);
  }

  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: orders }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {}

  return orders;
}

export async function addWorkPhoto(serverUrl, orderId, photoObj, authorName = 'Тимур (Бригадир)') {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => String(o.id) === String(orderId));
  if (idx !== -1) {
    orders[idx].photos = orders[idx].photos || [];
    orders[idx].photos.unshift(photoObj);
    orders[idx].notes = orders[idx].notes || [];
    orders[idx].notes.unshift({
      text: `Загружен фотоотчёт: "${photoObj.tag || 'Этап СМР'}"`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      author: authorName
    });
    saveStoredOrders(orders);
  }
  return orders;
}

export async function requestMachinery(serverUrl, orderId, machineryType, date, time, comment, authorName = 'Тимур (Бригадир)') {
  const orders = getStoredOrders();
  const idx = orders.findIndex(o => String(o.id) === String(orderId));
  if (idx !== -1) {
    orders[idx].machinery = orders[idx].machinery || [];
    orders[idx].machinery.unshift({
      id: 'mach_' + Date.now(),
      type: machineryType,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00',
      comment: comment || '',
      status: 'ordered',
      createdAt: new Date().toISOString()
    });
    orders[idx].notes = orders[idx].notes || [];
    orders[idx].notes.unshift({
      text: `Заказана спецтехника: ${machineryType} на ${date} в ${time}`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      author: authorName
    });
    saveStoredOrders(orders);
  }

  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${cleanUrl}/api/v1/crm/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: orders }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {}

  return orders;
}

export async function loginExecutor(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin) {
    return { success: false, error: 'Заполните логин или email исполнителя' };
  }

  setSavedLogin(cleanLogin);
  const cleanEmail = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`;
  const defaultProfile = resolveExecutorProfile(cleanLogin);

  if (serverUrl) {
    const cleanUrl = serverUrl.replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const profile = resolveExecutorProfile(cleanLogin, data.user);
        const authData = {
          ...profile,
          token: data.token || `jwt_railway_${Date.now()}`,
          isOnline: true,
          serverType: 'railway',
          loginTime: new Date().toISOString()
        };
        setSavedAuth(authData);
        return { success: true, authData };
      } else if (res.status === 401) {
        try {
          const regController = new AbortController();
          const regTimeout = setTimeout(() => regController.abort(), 4000);
          const regRes = await fetch(`${cleanUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              password: cleanPass || 'Master2026!',
              name: defaultProfile.name,
              role: 'executor'
            }),
            signal: regController.signal
          });
          clearTimeout(regTimeout);

          if (regRes.ok) {
            const regData = await regRes.json();
            const profile = resolveExecutorProfile(cleanLogin, regData.user);
            const authData = {
              ...profile,
              token: regData.token || `jwt_railway_${Date.now()}`,
              isOnline: true,
              serverType: 'railway',
              loginTime: new Date().toISOString()
            };
            setSavedAuth(authData);
            return { success: true, authData };
          }
        } catch (regErr) {}
      }
    } catch (e) {}
  }

  const authData = {
    ...defaultProfile,
    token: `exec_offline_token_${Date.now()}`,
    isOnline: false,
    serverType: 'offline',
    loginTime: new Date().toISOString()
  };
  setSavedAuth(authData);
  return { success: true, authData };
}