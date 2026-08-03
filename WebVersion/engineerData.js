// ========== ENGINEER DATA & PERSISTENCE v7.0 ==========
// Центр данных модуля инженера с localStorage-персистенцией
(function(){
'use strict';

const DATA_VERSION = 7; // Bump this to clear old demo data from localStorage
let STORAGE_KEY = 'engineerModuleData';
const VERSION_KEY = 'engineerModuleData_version';

/** Set storage key based on active organization */
function setStorageKeyForOrg(orgId) {
  STORAGE_KEY = orgId ? `engineerModuleData_${orgId}` : 'engineerModuleData';
  _data = loadData();
}

// Auto-clear old demo data if version changed
(function clearOldDemoData() {
  const savedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
  if (savedVersion < DATA_VERSION) {
    // Remove ALL engineer data keys (org-specific and default)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('engineerModuleData')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
    console.log('[EngineerData] 🧹 Old demo data cleared (version upgrade to v' + DATA_VERSION + ')');
  }
})();

// Dynamic date helper — relative to today
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function today() { return new Date().toISOString().split('T')[0]; }

// === CONSTANTS ===
const STATUSES = {
  NEW: 'Новая заявка',
  INSPECTION_REQUIRED: 'Требуется осмотр',
  DEPARTURE_SCHEDULED: 'Выезд назначен',
  ENGINEER_DEPARTED: 'Инженер выехал',
  INSPECTED: 'Осмотр выполнен',
  CALCULATION_REQUIRED: 'Требуется расчёт',
  CP_PREPARED: 'Коммерческое предложение подготовлено',
  AGREED: 'Согласовано с заказчиком',
  IN_WORK: 'Объект в работе',
  WORKS_COMPLETED: 'Работы завершены',
  CLOSED: 'Объект закрыт',
  CANCELLED: 'Отменено',
  PROBLEM: 'Проблемный объект'
};
const STATUS_CSS = {
  NEW: 'new', INSPECTION_REQUIRED: 'waiting', DEPARTURE_SCHEDULED: 'assigned',
  ENGINEER_DEPARTED: 'assigned', INSPECTED: 'inspected', CALCULATION_REQUIRED: 'ai',
  CP_PREPARED: 'ready', AGREED: 'approved', IN_WORK: 'work', WORKS_COMPLETED: 'done',
  CLOSED: 'closed', CANCELLED: 'closed', PROBLEM: 'problem'
};
const STATUS_FLOW = [
  'NEW', 'INSPECTION_REQUIRED', 'DEPARTURE_SCHEDULED', 'ENGINEER_DEPARTED',
  'INSPECTED', 'CALCULATION_REQUIRED', 'CP_PREPARED', 'AGREED', 'IN_WORK',
  'WORKS_COMPLETED', 'CLOSED'
];
const WORK_TYPES = ['Водопровод','Канализация','Септик','Отопление','Дренаж','Ливнёвка','Врезка'];
const PHOTO_CATS = ['До работ','Замеры','Препятствия','Во время работ','Скрытые работы','После работ','Проблемы'];
const AI_STEPS = [
  {id:1,name:'Проверка фото',icon:'📸'},
  {id:2,name:'Распознавание объекта',icon:'🔍'},
  {id:3,name:'Определение объёмов',icon:'📐'},
  {id:4,name:'Первый расчёт',icon:'🧮'},
  {id:5,name:'Самопроверка',icon:'🔄'},
  {id:6,name:'Проверка материалов',icon:'📦'},
  {id:7,name:'Проверка рисков',icon:'⚠️'},
  {id:8,name:'Финальный расчёт',icon:'✅'},
  {id:9,name:'Инженерная проверка',icon:'👷'}
];

// === BRIGADES (constant pool) ===
const BRIGADES = [
  {id:'br_1',name:'Я',workers:1,spec:'Управление / Инженерия',tech:'нет',avatar:'😎',status:'free',pricePerDay:0},
  {id:'br_2',name:'Александр Эксковатор',workers:1,spec:'Земляные работы',tech:'Экскаватор',avatar:'🚜',status:'free',pricePerDay:120000},
  {id:'br_3',name:'Володя Мастер',workers:1,spec:'Общестрой',tech:'Весь инструмент',avatar:'👷',status:'free',pricePerDay:50000},
  {id:'br_4',name:'Рабочий 1',workers:1,spec:'Разнорабочий',tech:'нет',avatar:'👨‍🔧',status:'free',pricePerDay:15000},
  {id:'br_5',name:'Рабочий 2',workers:1,spec:'Разнорабочий',tech:'нет',avatar:'👨‍🔧',status:'free',pricePerDay:15000}
];

// === DEMO DATA (dynamic dates) ===
function getDefaultData() {
  return {
    requests: [
      {id:'req_1',client:'Иван Петров',phone:'+7 701 123 4567',address:'Караганда, мкр. Степной, д.45',
       type:'Водопровод',comment:'Нужно подключить новый дом к центральному водопроводу',
       photos:3,budget:850000,urgency:'обычная',status:'NEW',createdAt:daysAgo(2)+'T09:00:00',
       source:'client',scheduledDate:today()},
      {id:'req_2',client:'Алексей Сидоров',phone:'+7 702 987 6543',address:'Караганда, пос. Солнечный, уч.12',
       type:'Канализация',comment:'Установить септик и проложить канализацию от дома',
       photos:5,budget:1200000,urgency:'срочная',status:'NEW',createdAt:daysAgo(1)+'T10:30:00',
       source:'manager',scheduledDate:daysFromNow(1)},
      {id:'req_3',client:'Марина Ковалёва',phone:'+7 705 555 1234',address:'Караганда, ул. Бухар-Жырау, 28',
       type:'Водопровод',comment:'Замена старых труб, 3 точки подключения',
       photos:2,budget:0,urgency:'обычная',status:'NEW',createdAt:daysAgo(3)+'T14:00:00',
       source:'master',scheduledDate:daysFromNow(2)}
    ],
    objects: [
      {id:'obj_1',client:'Сергей Козлов',phone:'+7 701 777 8888',address:'Караганда, мкр. Юго-Восток, д.15',
       type:'Водопровод',status:'IN_WORK',progress:65,engineer:'Иван',
       budget:950000,planCost:580000,factCost:520000,
       measurements:{length:36,depth:1.2,diameter:'Ø32',soil:'обычный',asphalt:false,wells:1,
         needCut:true,needTech:true,techType:'мини-экскаватор'},
       brigade:{id:'br_1',name:'Алексей',workers:3,spec:'Водопровод',tech:'мини-экскаватор',
         startDate:daysAgo(5),duration:'3 дня',price:340000},
       photos:{before:4,measures:3,obstacles:2,during:6,hidden:3,after:0,problems:0},
       createdAt:daysAgo(10),aiDone:true,estimateReady:true,
       history:[
         {date:daysAgo(10),action:'Заявка принята',by:'Инженер'},
         {date:daysAgo(9),action:'Осмотр объекта, замеры сделаны',by:'Инженер'},
         {date:daysAgo(7),action:'AI-просчёт завершён',by:'Система'},
         {date:daysAgo(5),action:'Бригада назначена, работы начаты',by:'Инженер'}
       ]},
      {id:'obj_2',client:'Дмитрий Ахметов',phone:'+7 702 333 4444',address:'Караганда, пос. Кокпекты, уч.7',
       type:'Канализация',status:'CALCULATION_REQUIRED',progress:40,engineer:'Иван',
       budget:1100000,planCost:720000,factCost:0,
       measurements:{length:17,depth:0,diameter:'Ø110',soil:'глина',uklone:'2 см/м',wells:2,
         wellType:'КС10',septic:true,exitDepth:0.8,entryDepth:1.2},
       brigade:null,
       photos:{before:3,measures:2,obstacles:1,during:0,hidden:0,after:0,problems:0},
       createdAt:daysAgo(7),aiDone:true,estimateReady:false,
       history:[
         {date:daysAgo(7),action:'Заявка принята',by:'Инженер'},
         {date:daysAgo(6),action:'Осмотр завершён',by:'Инженер'},
         {date:daysAgo(5),action:'AI-просчёт завершён',by:'Система'}
       ]},
      {id:'obj_3',client:'Елена Назарова',phone:'+7 705 111 2222',address:'Караганда, ул. Ермекова, 54',
       type:'Септик',status:'WORKS_COMPLETED',progress:100,engineer:'Иван',
       budget:750000,planCost:490000,factCost:530000,
       measurements:{length:12,depth:2.5,diameter:'Ø110',soil:'скальник'},
       brigade:{id:'br_2',name:'Борис',workers:4,spec:'Канализация/Септик',tech:'экскаватор',
         startDate:daysAgo(18),duration:'4 дня',price:420000},
       photos:{before:3,measures:2,obstacles:3,during:5,hidden:4,after:4,problems:1},
       createdAt:daysAgo(23),aiDone:true,estimateReady:true,
       history:[
         {date:daysAgo(23),action:'Заявка принята',by:'Инженер'},
         {date:daysAgo(22),action:'Осмотр и замеры',by:'Инженер'},
         {date:daysAgo(21),action:'AI-просчёт',by:'Система'},
         {date:daysAgo(20),action:'Смета утверждена клиентом',by:'Клиент'},
         {date:daysAgo(18),action:'Работы начаты',by:'Бригада Борис'},
         {date:daysAgo(14),action:'Работы завершены, акт подписан',by:'Инженер'}
       ]}
    ],
    calendar: [
      {id:'cal_1',date:daysAgo(3),title:'Замер водопровода',type:'inspect',time:'10:00',objId:'obj_1'},
      {id:'cal_2',date:daysAgo(3),title:'Проверка уклона',type:'control',time:'15:00',objId:'obj_1'},
      {id:'cal_3',date:daysAgo(2),title:'Осмотр нового объекта',type:'inspect',time:'09:00'},
      {id:'cal_4',date:daysAgo(1),title:'Начало работ бригады',type:'mount',time:'08:00',objId:'obj_2'},
      {id:'cal_5',date:today(),title:'Встреча с клиентом',type:'meeting',time:'14:00'},
      {id:'cal_6',date:daysFromNow(1),title:'Сдать отчёт',type:'deadline',time:'18:00',objId:'obj_3'},
      {id:'cal_7',date:daysFromNow(4),title:'Повторный выезд',type:'inspect',time:'11:00',objId:'obj_2'},
      {id:'cal_8',date:daysFromNow(6),title:'Контроль качества',type:'control',time:'10:00',objId:'obj_1'}
    ],
    estimate: [
      {name:'Разработка грунта (траншея)',unit:'м³',qty:43.2,price:3500,total:151200},
      {name:'Труба ПНД Ø32 SDR11',unit:'м.п.',qty:36,price:450,total:16200},
      {name:'Песчаная подушка',unit:'м³',qty:7.2,price:8000,total:57600},
      {name:'Колодец водопроводный КС-10',unit:'шт',qty:1,price:85000,total:85000},
      {name:'Врезка в центральный водопровод',unit:'компл.',qty:1,price:45000,total:45000},
      {name:'Футляр стальной Ø89',unit:'м.п.',qty:6,price:3200,total:19200},
      {name:'Обратная засыпка',unit:'м³',qty:36,price:2000,total:72000},
      {name:'Благоустройство',unit:'м²',qty:25,price:1500,total:37500},
      {name:'Мини-экскаватор (аренда)',unit:'смена',qty:2,price:45000,total:90000}
    ],
    expenses: [
      {cat:'Материалы',items:[{name:'Труба ПНД',amount:16200},{name:'Кольца КС-10',amount:85000},{name:'Люк',amount:12000},{name:'Муфты/фитинги',amount:8500}]},
      {cat:'Доставка',items:[{name:'Газель (материалы)',amount:15000}]},
      {cat:'Техника',items:[{name:'Мини-экскаватор 2 смены',amount:90000}]},
      {cat:'Рабочие',items:[{name:'Бригада (3 чел × 3 дня)',amount:270000}]},
      {cat:'Топливо',items:[{name:'Дизель',amount:18000}]},
      {cat:'Доп. закуп',items:[{name:'Переходники',amount:3500}]},
      {cat:'Непредвиденные',items:[{name:'Вода в траншее (откачка)',amount:12000}]}
    ],
    notifications: [
      {id:'n1',icon:'📋',text:'Новая заявка от Ивана Петрова',time:'10 мин назад',unread:true,date:today()+'T09:50:00'},
      {id:'n2',icon:'🤖',text:'AI-просчёт завершён для объекта obj_1',time:'1 час назад',unread:true,date:today()+'T09:00:00'},
      {id:'n3',icon:'⚠️',text:'Срочная заявка: канализация, пос. Солнечный',time:'2 часа назад',unread:true,date:today()+'T08:00:00'},
      {id:'n4',icon:'📸',text:'Бригада загрузила 6 фото для объекта obj_1',time:'3 часа назад',unread:false,date:today()+'T07:00:00'},
      {id:'n5',icon:'💰',text:'Расходы по объекту obj_3 превысили план на 40 000 ₸',time:'вчера',unread:false,date:daysAgo(1)+'T16:00:00'},
      {id:'n6',icon:'✅',text:'Клиент принял работу по объекту obj_3',time:'вчера',unread:false,date:daysAgo(1)+'T14:00:00'}
    ],
    materials: [
      {id:'mat_1',name:'Труба ПНД Ø32 SDR11',unit:'м.п.',qty:36,price:450,inStock:true},
      {id:'mat_2',name:'Труба ПНД Ø50 SDR11',unit:'м.п.',qty:0,price:680,inStock:false},
      {id:'mat_3',name:'Кольца КС-10',unit:'шт',qty:2,price:42500,inStock:true},
      {id:'mat_4',name:'Люк чугунный',unit:'шт',qty:1,price:12000,inStock:true},
      {id:'mat_5',name:'Песок (отсев)',unit:'м³',qty:8,price:8000,inStock:true},
      {id:'mat_6',name:'Муфта ПНД Ø32',unit:'шт',qty:4,price:350,inStock:true},
      {id:'mat_7',name:'Переходник Ø32-Ø50',unit:'шт',qty:2,price:480,inStock:false},
      {id:'mat_8',name:'Футляр Ø89',unit:'м.п.',qty:6,price:3200,inStock:true},
      {id:'mat_9',name:'Лента сигнальная',unit:'м.п.',qty:40,price:25,inStock:true}
    ],
    brigades: [] // user-created brigades stored here
  };
}

// === EMPTY DATA for fresh start ===
function getEmptyData() {
  return {
    requests: [],
    objects: [],
    calendar: [],
    estimate: [],
    expenses: [],
    notifications: [],
    materials: [],
    brigades: []
  };
}

// === PERSISTENCE ===
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with empty structure to add any new fields (without overwriting existing data)
      const defaults = getEmptyData();
      for (const key of Object.keys(defaults)) {
        if (!(key in parsed)) parsed[key] = defaults[key];
      }
      return parsed;
    }
  } catch(e) {
    console.warn('[EngineerData] Failed to load from localStorage:', e);
  }
  // First launch — clean empty state, no demo data
  return getEmptyData();
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
  } catch(e) {
    console.warn('[EngineerData] Failed to save:', e);
  }
}

let _data = loadData();

// === CRUD OPERATIONS ===

/** Generate unique ID */
function genId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

/** Accept request → move to objects */
function acceptRequest(reqId) {
  const idx = _data.requests.findIndex(r => r.id === reqId);
  if (idx === -1) return null;
  const req = _data.requests.splice(idx, 1)[0];
  const newObj = {
    id: genId('obj'),
    client: req.client,
    phone: req.phone,
    address: req.address,
    type: req.type,
    status: 'DEPARTURE_SCHEDULED',
    progress: 5,
    engineer: 'Инженер',
    budget: req.budget || 0,
    planCost: 0,
    factCost: 0,
    measurements: {},
    brigade: null,
    photos: {before:0,measures:0,obstacles:0,during:0,hidden:0,after:0,problems:0},
    createdAt: new Date().toISOString().split('T')[0],
    aiDone: false,
    estimateReady: false,
    history: [
      {date: new Date().toISOString().split('T')[0], action: 'Заявка принята в работу', by: 'Инженер'}
    ],
    sourceRequest: reqId,
    comment: req.comment,
    tasks: [],
    assignedEmployees: []
  };
  _data.objects.unshift(newObj);
  addNotification('✅', `Заявка от ${req.client} принята — объект ${newObj.id} создан`);
  saveData();
  return newObj;
}

/** Update object status */
function updateObjectStatus(objId, newStatus) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  obj.status = newStatus;
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: `Статус → ${STATUSES[newStatus]}`, by: 'Инженер'});
  // Auto-update progress based on status position in flow
  const flowIdx = STATUS_FLOW.indexOf(newStatus);
  if (flowIdx >= 0) obj.progress = Math.round((flowIdx / (STATUS_FLOW.length - 1)) * 100);
  saveData();
  return true;
}

/** Save measurements for object */
function saveMeasurements(objId, measurements) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  obj.measurements = { ...obj.measurements, ...measurements };
  if (obj.status === 'DEPARTURE_SCHEDULED' || obj.status === 'ENGINEER_DEPARTED' || obj.status === 'INSPECTION_REQUIRED') {
    updateObjectStatus(objId, 'INSPECTED');
  }
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: 'Замеры обновлены', by: 'Инженер'});
  saveData();
  return true;
}

/** Assign brigade to object */
function assignBrigade(objId, brigadeId) {
  const obj = _data.objects.find(o => o.id === objId);
  const brigade = BRIGADES.find(b => b.id === brigadeId);
  if (!obj || !brigade) return false;
  obj.brigade = {
    id: brigade.id,
    name: brigade.name,
    workers: brigade.workers,
    spec: brigade.spec,
    tech: brigade.tech,
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    duration: '3 дня',
    price: brigade.pricePerDay * 3
  };
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: `Бригада "${brigade.name}" назначена`, by: 'Инженер'});
  if (['CP_PREPARED','AGREED'].includes(obj.status)) {
    updateObjectStatus(objId, 'IN_WORK');
  }
  addNotification('👷', `Бригада "${brigade.name}" назначена на объект ${obj.client}`);
  saveData();
  return true;
}

/** Add calendar event */
function addCalendarEvent(event) {
  event.id = event.id || genId('cal');
  _data.calendar.push(event);
  saveData();
  return event;
}

/** Remove calendar event */
function removeCalendarEvent(eventId) {
  _data.calendar = _data.calendar.filter(e => e.id !== eventId);
  saveData();
}

/** Add expense item */
function addExpense(category, name, amount) {
  let cat = _data.expenses.find(e => e.cat === category);
  if (!cat) {
    cat = {cat: category, items: []};
    _data.expenses.push(cat);
  }
  cat.items.push({name, amount: Number(amount)});
  saveData();
}

/** Add notification */
function addNotification(icon, text) {
  const notif = {
    id: genId('n'),
    icon,
    text,
    time: 'только что',
    unread: true,
    date: new Date().toISOString()
  };
  _data.notifications.unshift(notif);
  if (_data.notifications.length > 50) _data.notifications.pop();
  saveData();
  return notif;
}

/** Mark all notifications as read */
function markAllRead() {
  _data.notifications.forEach(n => n.unread = false);
  saveData();
}

/** Add material */
function addMaterial(mat) {
  mat.id = mat.id || genId('mat');
  _data.materials.push(mat);
  saveData();
  return mat;
}

/** Update photos count for object */
function updatePhotos(objId, category, delta) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj || !obj.photos) return false;
  const catKey = {
    'До работ':'before','Замеры':'measures','Препятствия':'obstacles',
    'Во время работ':'during','Скрытые работы':'hidden','После работ':'after','Проблемы':'problems'
  }[category];
  if (catKey && obj.photos[catKey] !== undefined) {
    obj.photos[catKey] = Math.max(0, obj.photos[catKey] + delta);
    saveData();
    return true;
  }
  return false;
}

/** Complete AI analysis for object */
function completeAI(objId) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  obj.aiDone = true;
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: 'AI-просчёт завершён', by: 'Система'});
  if (obj.status === 'AI_PENDING') updateObjectStatus(objId, 'REVIEW');
  addNotification('🤖', `AI-просчёт завершён для объекта ${obj.client}`);
  saveData();
  return true;
}

/** Approve estimate for object */
function approveEstimate(objId) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  obj.estimateReady = true;
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: 'Смета утверждена', by: 'Инженер'});
  if (['REVIEW','ESTIMATE_READY'].includes(obj.status)) updateObjectStatus(objId, 'APPROVAL');
  addNotification('📄', `Смета утверждена для объекта ${obj.client}`);
  saveData();
  return true;
}

/** Add new request (from calendar) */
function addRequest(data) {
  const req = {
    id: genId('req'),
    client: data.client || '',
    phone: data.phone || '',
    address: data.address || '',
    type: data.type || 'Водопровод',
    comment: data.comment || '',
    photos: 0,
    budget: Number(data.budget) || 0,
    urgency: data.urgency || 'обычная',
    status: 'NEW',
    createdAt: new Date().toISOString(),
    source: data.source || 'master',
    scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0]
  };
  _data.requests.unshift(req);
  addNotification('📋', `Новая заявка: ${req.client} (${req.type})`);
  saveData();
  return req;
}

/** Create full object with all data at once (wizard flow) */
function createFullObject(data) {
  const objId = genId('obj');
  const now = new Date().toISOString().split('T')[0];
  
  // Calculate total budget from estimate
  const estimateItems = data.estimate || [];
  const totalBudget = estimateItems.reduce((s, it) => s + (it.total || 0), 0);
  
  // Build brigade assignment if provided
  let brigadeData = null;
  if (data.brigadeId) {
    const allBr = getAllBrigades();
    const brigade = allBr.find(b => b.id === data.brigadeId);
    if (brigade) {
      const durationDays = Number(data.duration) || 3;
      brigadeData = {
        id: brigade.id,
        name: brigade.name,
        workers: brigade.workers,
        spec: brigade.spec,
        tech: brigade.tech || 'нет',
        startDate: data.startDate || daysFromNow(1),
        duration: durationDays + ' дня',
        price: brigade.pricePerDay * durationDays
      };
    }
  }

  const newObj = {
    id: objId,
    client: data.client || '',
    phone: data.phone || '',
    address: data.address || '',
    type: data.type || 'Водопровод',
    status: brigadeData ? 'IN_WORK' : 'ESTIMATE_READY',
    progress: brigadeData ? 15 : 10,
    engineer: 'Инженер',
    budget: totalBudget,
    planCost: totalBudget,
    factCost: 0,
    measurements: data.measurements || {},
    brigade: brigadeData,
    photos: { before: data.photoCount || 0, measures: 0, obstacles: 0, during: 0, hidden: 0, after: 0, problems: 0 },
    createdAt: now,
    aiDone: true,
    estimateReady: true,
    aiBackend: data.aiBackend || 'gemini',
    scenario: data.scenario || 'standard',
    history: [
      { date: now, action: 'Объект создан (фото-анализ + смета)', by: 'Инженер' }
    ],
    comment: data.comment || ''
  };

  // Save AI analysis results
  if (data.aiResult) {
    newObj.aiResult = {
      objectType: data.aiResult.objectType,
      confidence: data.aiResult.confidence,
      label: data.aiResult.objectLabel || data.aiResult.label
    };
  }

  _data.objects.unshift(newObj);

  // Save estimate linked to this object
  if (estimateItems.length > 0) {
    saveEstimateForObject(objId, estimateItems);
  }

  // Create calendar events
  const startDate = data.startDate || daysFromNow(1);
  const durationDays = Number(data.duration) || 3;

  // Event: Start of work
  addCalendarEvent({
    date: startDate,
    title: `🏗️ Начало: ${data.client} — ${data.type}`,
    type: 'mount',
    time: '08:00',
    objId: objId
  });

  // Event: Inspection visit (day 2)
  if (durationDays > 1) {
    const inspDate = new Date(startDate);
    inspDate.setDate(inspDate.getDate() + 1);
    addCalendarEvent({
      date: inspDate.toISOString().split('T')[0],
      title: `📋 Выезд: проверка ${data.client}`,
      type: 'inspect',
      time: '10:00',
      objId: objId
    });
  }

  // Event: Control/completion
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  addCalendarEvent({
    date: endDate.toISOString().split('T')[0],
    title: `✅ Сдача: ${data.client} — ${data.type}`,
    type: 'control',
    time: '14:00',
    objId: objId
  });

  addNotification('🏗️', `Новый объект: ${data.client} (${data.type}) — бюджет ${totalBudget.toLocaleString('ru-RU')} ₸`);
  saveData();
  return newObj;
}

/** Get all events/tasks for a specific date */
function getEventsForDate(dateStr) {
  const events = _data.calendar.filter(e => e.date === dateStr);
  const requests = _data.requests.filter(r => r.scheduledDate === dateStr);
  const objects = _data.objects.filter(o => {
    if (o.brigade && o.brigade.startDate === dateStr) return true;
    const hist = o.history || [];
    return hist.some(h => h.date === dateStr);
  });
  return { events, requests, objects };
}

/** Delete a request */
function deleteRequest(reqId) {
  const idx = _data.requests.findIndex(r => r.id === reqId);
  if (idx === -1) return false;
  _data.requests.splice(idx, 1);
  saveData();
  return true;
}

/** Delete an object */
function deleteObject(objId) {
  const idx = _data.objects.findIndex(o => o.id === objId);
  if (idx === -1) return false;
  _data.objects.splice(idx, 1);
  addNotification('🗑️', `Объект удалён`);
  saveData();
  return true;
}

/** Update object fields */
function updateObject(objId, fields) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  Object.assign(obj, fields);
  saveData();
  return true;
}

/** Delete expense item */
function deleteExpense(catIndex, itemIndex) {
  if (_data.expenses[catIndex] && _data.expenses[catIndex].items[itemIndex]) {
    _data.expenses[catIndex].items.splice(itemIndex, 1);
    if (_data.expenses[catIndex].items.length === 0) _data.expenses.splice(catIndex, 1);
    saveData();
    return true;
  }
  return false;
}

/** Update material */
function updateMaterial(matId, fields) {
  const mat = _data.materials.find(m => m.id === matId);
  if (!mat) return false;
  Object.assign(mat, fields);
  saveData();
  return true;
}

/** Delete material */
function deleteMaterial(matId) {
  _data.materials = _data.materials.filter(m => m.id !== matId);
  saveData();
}

/** Add custom brigade */
function addBrigade(data) {
  const br = {
    id: genId('br'),
    name: data.name || '',
    workers: Number(data.workers) || 2,
    spec: data.spec || 'Разное',
    tech: data.tech || 'нет',
    avatar: data.avatar || '👷',
    status: 'free',
    pricePerDay: Number(data.pricePerDay) || 80000
  };
  _data.brigades = _data.brigades || [];
  _data.brigades.push(br);
  saveData();
  return br;
}

/** Get all brigades (built-in + user) */
function getAllBrigades() {
  return [...BRIGADES, ...(_data.brigades || [])];
}

/** Delete custom brigade */
function deleteBrigade(brId) {
  if (!_data.brigades) return false;
  _data.brigades = _data.brigades.filter(b => b.id !== brId);
  saveData();
  return true;
}

/** Update custom brigade */
function updateBrigade(brId, fields) {
  const br = (_data.brigades || []).find(b => b.id === brId);
  if (!br) return false;
  Object.assign(br, fields);
  saveData();
  return true;
}

/** Get estimate for specific object (or global fallback) */
function getEstimateForObject(objId) {
  if (_data.objectEstimates && _data.objectEstimates[objId]) {
    return _data.objectEstimates[objId];
  }
  return _data.estimate;
}

/** Save estimate linked to object */
function saveEstimateForObject(objId, estimateItems) {
  if (!_data.objectEstimates) _data.objectEstimates = {};
  _data.objectEstimates[objId] = estimateItems;
  saveData();
}

/** Reset to demo data */
function resetData() {
  _data = getDefaultData();
  saveData();
}

// === TASK MANAGEMENT ===
function addTask(objId, task) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj) return false;
  obj.tasks = obj.tasks || [];
  task.id = task.id || genId('task');
  task.status = task.status || 'PENDING';
  obj.tasks.push(task);
  obj.history = obj.history || [];
  obj.history.push({date: new Date().toISOString().split('T')[0], action: `Добавлена задача: ${task.title}`, by: 'Система'});
  addNotification('📌', `Новая задача: ${task.title}`);
  saveData();
  return task;
}

function updateTaskStatus(objId, taskId, status) {
  const obj = _data.objects.find(o => o.id === objId);
  if (!obj || !obj.tasks) return false;
  const task = obj.tasks.find(t => t.id === taskId);
  if (!task) return false;
  task.status = status;
  obj.history.push({date: new Date().toISOString().split('T')[0], action: `Статус задачи "${task.title}" изменен на ${status}`, by: 'Инженер'});
  saveData();
  return true;
}

// === PUBLIC API ===
window.EngineerData = {
  // Constants
  STATUSES, STATUS_CSS, STATUS_FLOW, WORK_TYPES, PHOTO_CATS, AI_STEPS, BRIGADES,
  // Reactive getters
  get requests() { return _data.requests; },
  get objects() { return _data.objects; },
  get calendar() { return _data.calendar; },
  get estimate() { return _data.estimate; },
  get expenses() { return _data.expenses; },
  get notifications() { return _data.notifications; },
  get materials() { return _data.materials; },
  // CRUD
  acceptRequest,
  addRequest,
  createFullObject,
  deleteRequest,
  updateObjectStatus,
  saveMeasurements,
  assignBrigade,
  addCalendarEvent,
  removeCalendarEvent,
  addExpense,
  deleteExpense,
  addNotification,
  markAllRead,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  updatePhotos,
  completeAI,
  approveEstimate,
  getEventsForDate,
  deleteObject,
  updateObject,
  addBrigade,
  updateBrigade,
  deleteBrigade,
  addTask,
  updateTaskStatus,
  getAllBrigades,
  getEstimateForObject,
  saveEstimateForObject,
  resetData,
  saveData,
  genId,
  setStorageKeyForOrg,
  // Date helpers
  today, daysAgo, daysFromNow
};

console.log('✅ EngineerData v6.0 loaded (org-isolated + full CRUD)');
})();

