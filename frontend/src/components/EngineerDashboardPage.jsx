import React, { useState, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';
import '../engineer-modal.css';
import OnboardingTour from './OnboardingTour';
import SmartDealCreateModal from './SmartDealCreateModal';

export default function EngineerDashboardPage({ onBackToHome, initialTab = 'calendar', currentUser, viewRole = 'engineer', hideHeader = false, sidebarToggleNode }) {
  const isExecutor = (currentUser?.role === 'executor') || (viewRole === 'executor');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'calendar'); // Dynamic tab state

  const defaultOrgObj = { id: 1, name: 'ТОО «QazGost»', city: 'Караганда', type: 'ТОО', bin: '990405351447', icon: '🏢', projectsCount: 4, estimatesCount: 18, workersCount: 12, isDefault: true, role: 'Главный инженер' };
  const [selectedOrg, setSelectedOrg] = useState(defaultOrgObj);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgBin, setNewOrgBin] = useState('');
  const [newOrgType, setNewOrgType] = useState('ТОО');
  const [newOrgCity, setNewOrgCity] = useState('Астана');

  const [organizations, setOrganizations] = useState([
    { id: 1, name: 'ТОО «QazGost»', city: 'Караганда', type: 'ТОО', bin: '990405351447', icon: '🏢', projectsCount: 4, estimatesCount: 18, workersCount: 12, isDefault: true, role: 'Главный инженер' },
    { id: 2, name: 'ТОО «Инжен-Строй»', city: 'Караганда', type: 'ТОО', bin: '123456789012', icon: '🏗️', projectsCount: 2, estimatesCount: 7, workersCount: 5, isDefault: false, role: 'Инженер-сметчик' },
    { id: 3, name: 'ИП «Мастер Сервис»', city: 'Астана', type: 'ИП', bin: '987654321098', icon: '👤', projectsCount: 1, estimatesCount: 3, workersCount: 2, isDefault: false, role: 'Подрядчик' }
  ]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [calendarViewMode, setCalendarViewMode] = useState('month');

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [eventFilter, setEventFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartCreateModal, setShowSmartCreateModal] = useState(false);

  // Editing event state
  const [editingEvent, setEditingEvent] = useState(null); // event object or null

  // Form State for new/edit object modal
  const [evtTitle, setEvtTitle] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtTime, setEvtTime] = useState('10:00 - 12:00');
  const [evtType, setEvtType] = useState('active_project');
  const [evtContractor, setEvtContractor] = useState('ТОО «QazGost»');
  const [evtStatus, setEvtStatus] = useState('В работе');
  const [evtDeadline, setEvtDeadline] = useState('Сегодня до 18:00');

  // Stages & Photo attachments modal state
  const [modalTab, setModalTab] = useState('info'); // 'info' | 'stages' | 'estimate' | 'photos'
  const [evtStages, setEvtStages] = useState([]);
  const [activeStageId, setActiveStageId] = useState(null);
  const [evtPhotos, setEvtPhotos] = useState([]);
  const [evtEstimateItems, setEvtEstimateItems] = useState([]);
  const [evtTotalSum, setEvtTotalSum] = useState(0);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageDeadline, setNewStageDeadline] = useState('');
  const [evtComments, setEvtComments] = useState('');
  const [newStageStatus, setNewStageStatus] = useState('Запланировано');

  // Inline stage adding state for the top connected pipeline track
  const [isAddingInlineStage, setIsAddingInlineStage] = useState(false);
  const [inlineStageText, setInlineStageText] = useState('');

  // Lead Workflow State
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedDept, setSelectedDept] = useState('Инженер-геодезист');
  const [leadWorkType, setLeadWorkType] = useState('Водопровод');


  const [objectsSearch, setObjectsSearch] = useState('');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const monthsList = monthNames.map(m => `${m} ${currentYear}`);

  // Scheduled Events state with human-readable deadlines, stage sequence & photo attachments
  // Scheduled Events state with human-readable deadlines, stage sequence & photo attachments
  const [scheduledEvents, setScheduledEvents] = useState(() => {
    const parseEvents = (key) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse calendar events", e);
        }
      }
      return {};
    };

    const mergeEvents = (events1, events2) => {
      const merged = { ...events1 };
      for (const day in events2) {
        if (!merged[day]) {
          merged[day] = [...events2[day]];
        } else {
          // Avoid duplicates by ID
          const existingIds = new Set(merged[day].map(e => e.id));
          const toAdd = events2[day].filter(e => !existingIds.has(e.id));
          merged[day] = [...merged[day], ...toAdd];
        }
      }
      return merged;
    };

    const crmEvents = parseEvents('qazgost_crm_calendar');
    const calEvents = parseEvents('qazgost_calendar_events');
    const executorEvents = parseEvents('qazgost_calendar_events_executor');
    const engineerEvents = parseEvents('qazgost_calendar_events_engineer');
    
    let allEvents = mergeEvents(crmEvents, calEvents);
    allEvents = mergeEvents(allEvents, executorEvents);
    allEvents = mergeEvents(allEvents, engineerEvents);

    if (Object.keys(allEvents).length > 0) {
      return allEvents;
    }

    // Return a default set of mock data for ALL roles so the calendar isn't empty.
    // Different roles might see different global views, but for demonstration, we show all active projects.
    return {
    3: [
      {
        id: 101,
        type: 'active_project',
        title: 'Реконструкция объекта №1',
        icon: '🏭',
        time: '09:00 - 18:00',
        location: 'Алматы, Объект №1',
        status: 'В работе',
        contractor: 'ТОО «QazGost»',
        deadline: 'Сегодня до 18:00',
        stages: [
          { id: 's1', title: '1. Демонтаж и устройство котлована', deadline: '01 Авг 2026', status: 'Завершено' },
          { id: 's2', title: '2. Заливка монолитного фундамента', deadline: '05 Авг 2026', status: 'В работе' },
          { id: 's3', title: '3. Монтаж несущих колонн и ригелей', deadline: '15 Авг 2026', status: 'Запланировано' },
          { id: 's4', title: '4. Устройство мягкой кровли', deadline: '25 Авг 2026', status: 'Запланировано' }
        ],
        photos: [
          { id: 'p1', name: 'Фундамент_арматура.jpg', tag: 'Замеры', time: '05 Авг 14:20', preview: '🧱' },
          { id: 'p2', name: 'Бетонирование_плиты.jpg', tag: 'В процессе', time: '05 Авг 16:45', preview: '📸' }
        ]
      }
    ],
    5: [
      {
        id: 1,
        type: 'object',
        title: 'Инспекция монолита: ТОО «Алматы Сити»',
        time: '10:00 - 12:00',
        location: 'Алматы, ЖК "Алатау"',
        status: 'В работе',
        contractor: 'ТОО «Алматы Сити»',
        deadline: 'Сегодня до 18:00',
        stages: [
          { id: 's1', title: '1. Армирование фундаментной плиты', deadline: '02 Авг 2026', status: 'Завершено' },
          { id: 's2', title: '2. Заливка бетона М350 B25', deadline: '05 Авг 2026', status: 'В работе' },
          { id: 's3', title: '3. Проверка прочности молотком Кашкарова', deadline: '07 Авг 2026', status: 'Запланировано' }
        ],
        photos: [
          { id: 'p1', name: 'Монолит_арматура_Блок_А.jpg', tag: 'Скрытые работы', time: '04 Авг 11:30', preview: '🏗️' }
        ]
      },
    ],
    12: [
      {
        id: 3,
        type: 'event',
        title: 'Подписание Акта КС-2',
        time: '11:00 - 12:30',
        location: 'Астана, БЦ "Нурлы"',
        status: 'Ожидает приёмки',
        contractor: 'ТОО «QazGost»',
        deadline: '12 Августа',
        stages: [
          { id: 's1', title: '1. Проверка объёмов КС-2', deadline: '10 Авг 2026', status: 'Завершено' },
          { id: 's2', title: '2. Подписание акта ЭЦП', deadline: '12 Авг 2026', status: 'Ожидает приёмки' }
        ],
        photos: []
      },
    ],
    };
  });

  useEffect(() => {
    // Shared calendar state for all roles to simulate a single backend database
    const key = `qazgost_calendar_events`;
    localStorage.setItem(key, JSON.stringify(scheduledEvents));
  }, [scheduledEvents]);

  const selectedDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = [...(scheduledEvents[selectedDay] || []), ...(scheduledEvents[selectedDateKey] || [])];

  // Dynamic calendar grid generation
  const firstDayOfMonth = new Date(currentYear, monthIndex, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, monthIndex, 0).getDate();
  
  const prevMonthDays = [];
  for (let i = startingDayOfWeek - 1; i > 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i + 1);
  }
  
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const nextMonthDays = [];
  const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(i);
  }

  // Calculate statistics across scheduled events
  const allEventsList = Object.values(scheduledEvents).flat();
  const activeProjectsCount = allEventsList.filter(e => e.type === 'active_project' || e.type === 'object' || e.status === 'В работе').length;
  const inReviewCount = allEventsList.filter(e => e.type === 'in_review' || e.type === 'request' || e.status === 'На проверке' || e.status === 'Ожидает приёмки').length;
  const weekDeadlinesCount = allEventsList.filter(e => e.type === 'deadline' || e.status === 'Дедлайн' || e.status === 'Просрочено').length;
  const completedCount = allEventsList.filter(e => e.type === 'completed' || e.status === 'Завершено').length;

  // Brigades state
  const [brigades] = useState([
    { id: 1, name: 'Бригада: Я', icon: '😎', role: 'Управление / Инженерия / 1 чел.', status: 'Свободна', price: '0 ₸/день' },
    { id: 2, name: 'Бригада: Александр Экскаватор', icon: '🚜', role: 'Земляные работы / 1 чел.', status: 'Занята', price: '120 000 ₸/день' },
    { id: 3, name: 'Бригада: Володя Мастер', icon: '👷', role: 'Общестрой / 1 чел.', status: 'Занята', price: '50 000 ₸/день' },
    { id: 4, name: 'Бригада: Рабочий 1', icon: '👨‍🔧', role: 'Разнорабочий / 1 чел.', status: 'Свободна', price: '15 000 ₸/день' },
    { id: 5, name: 'Бригада: Рабочий 2', icon: '👩‍🔧', role: 'Разнорабочий / 1 чел.', status: 'Свободна', price: '15 000 ₸/день' },
  ]);

  // Sample Datasets for all tabs
  const [requestsList, setRequestsList] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_engineer_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'REQ-101', client: 'ТОО «Алматы Сити»', type: 'Инспекция монолита', address: 'Алматы, ЖК "Алатау", Блок B', phone: '+7 (701) 555-01-22', status: 'Новая', time: 'Сегодня, 14:30', managerName: 'Менеджер Саша' },
      { id: 'REQ-102', client: 'ИП «Сатов А.В.»', type: 'Приёмка HVAC и электрики', address: 'Караганда, ул. Ленина 42', phone: '+7 (707) 888-44-11', status: 'В обработке', time: 'Завтра, 11:00', managerName: 'Менеджер Саша' },
      { id: 'REQ-103', client: 'ТОО «QazGost»', type: 'Экспертиза фундамента', address: 'Астана, БЦ "Нурлы", ов. 402', phone: '+7 (777) 123-99-00', status: 'Принято', time: '8 Августа, 10:00', managerName: 'Менеджер Саша' }
    ];
  });

  const [objectsList, setObjectsList] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_executor_objects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'OBJ-201', client: 'ЖК "Алатау 2"', address: 'Алматы, проспект Достык 105', budget: 45000000, factCost: 28000000, progress: 65, status: 'В работе', brigade: 'Бригада: Александр Экскаватор', photosCount: 18 },
      { id: 'OBJ-202', client: 'БЦ "Нурлы Тау"', address: 'Астана, ул. Достык 8', budget: 120000000, factCost: 95000000, progress: 80, status: 'В работе', brigade: 'Бригада: Володя Мастер', photosCount: 42 },
      { id: 'OBJ-203', client: 'Коттеджный поселок "Северный"', address: 'Караганда, мкр. Орталык 14', budget: 18000000, factCost: 18000000, progress: 100, status: 'Завершено', brigade: 'Бригада: Я', photosCount: 25 }
    ];
  });

  const [materialsList, setMaterialsList] = useState([
    { id: 'MAT-01', name: 'Арматура стальная А500С 12мм', unit: 'тн', qty: 14.5, price: 385000, status: 'В наличии' },
    { id: 'MAT-02', name: 'Бетон товарный М350 B25', unit: 'м³', qty: 120, price: 28500, status: 'В наличии' },
    { id: 'MAT-03', name: 'Цемент М500 (мешок 50кг)', unit: 'меш', qty: 350, price: 3400, status: 'В наличии' },
    { id: 'MAT-04', name: 'Кирпич керамический полнотелый', unit: 'тыс. шт', qty: 25, price: 95000, status: 'Мало на складе' },
    { id: 'MAT-05', name: 'Утеплитель Технониколь 100мм', unit: 'м²', qty: 480, price: 4200, status: 'В наличии' }
  ]);

  const [measuresList, setMeasuresList] = useState([
    { id: 'MES-01', objectName: 'ЖК "Алатау 2"', parameter: 'Площадь монолитных перекрытий', norm: '1250 м²', fact: '1248.5 м²', dev: '-1.5 м²', status: 'В допуске' },
    { id: 'MES-02', objectName: 'ЖК "Алатау 2"', parameter: 'Высота армопояса 3-го этажа', norm: '300 мм', fact: '302 мм', dev: '+2 мм', status: 'В допуске' },
    { id: 'MES-03', objectName: 'БЦ "Нурлы Тау"', parameter: 'Толщина штукатурного слоя', norm: '20 мм', fact: '21.5 мм', dev: '+1.5 мм', status: 'В допуске' },
    { id: 'MES-04', objectName: 'Коттеджный поселок', parameter: 'Глубина выемки котлована', norm: '3.50 м', fact: '3.52 м', dev: '+2 см', status: 'В допуске' }
  ]);

  const [estimatesList, setEstimatesList] = useState([
    { id: 'EST-01', name: 'Устройство фундамента Ленточного М300', unit: 'м³', qty: 45, price: 32000, total: 1440000 },
    { id: 'EST-02', name: 'Кладка наружных стен кирпич М125', unit: 'м³', qty: 85, price: 24500, total: 2082500 },
    { id: 'EST-03', name: 'Монтаж металлоконструкций и ферм', unit: 'тн', qty: 8.5, price: 450000, total: 3825000 },
    { id: 'EST-04', name: 'Устройство мягкой кровли 2 слоя', unit: 'м²', qty: 320, price: 5800, total: 1856000 }
  ]);

  const [expensesList, setExpensesList] = useState([
    { id: 'EXP-01', category: 'Закуп материалов', name: 'Арматура 12мм и цемент М500', amount: 5600000, date: '05 Авг 2026', status: 'Оплачено' },
    { id: 'EXP-02', category: 'Аренда техники', name: 'Экскаватор JCB 3CX (5 смен)', amount: 475000, date: '04 Авг 2026', status: 'Оплачено' },
    { id: 'EXP-03', category: 'Оплата бригад', name: 'Аванс бригаде Александра', amount: 600000, date: '02 Авг 2026', status: 'Оплачено' }
  ]);

  const [notificationsList, setNotificationsList] = useState(() => {
    const saved = localStorage.getItem('engineer_notifications');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'NOT-1', icon: '📬', title: 'Новая заявка', text: 'Поступила новая заявка на приёмку сетей от ИП «Сатов А.В.»', time: '10 мин назад', unread: true },
      { id: 'NOT-2', icon: '⚠️', title: 'Дедлайн инспекции', text: 'Сегодня до 18:00 — Инспекция монолита ТОО «Алматы Сити»', time: '1 час назад', unread: true },
      { id: 'NOT-3', icon: '✅', title: 'Акт КС-2 подписан', text: 'Заказчик подписал Акт выполненных работ по объекту БЦ "Нурлы Тау"', time: 'Вчера', unread: false }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('engineer_notifications', JSON.stringify(notificationsList));
  }, [notificationsList]);

  React.useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('engineer_notifications');
      if (saved) setNotificationsList(JSON.parse(saved));
    };
    const handleRequestsUpdate = () => {
      try {
        const saved = localStorage.getItem('qazgost_engineer_requests');
        if (saved) setRequestsList(JSON.parse(saved));
        
        const crmCal = JSON.parse(localStorage.getItem('qazgost_crm_calendar') || '{}');
        const calSaved = JSON.parse(localStorage.getItem('qazgost_calendar_events') || '{}');
        const merged = { ...calSaved };
        for (const day in crmCal) {
          if (!merged[day]) merged[day] = [...crmCal[day]];
          else {
            const existingIds = new Set(merged[day].map(e => String(e.id)));
            const toAdd = crmCal[day].filter(e => !existingIds.has(String(e.id)));
            merged[day] = [...merged[day], ...toAdd];
          }
        }
        setScheduledEvents(merged);
      } catch (e) {}
    };
    window.addEventListener('notifications_updated', handleUpdate);
    window.addEventListener('engineer_requests_updated', handleRequestsUpdate);
    window.addEventListener('crm_calendar_updated', handleRequestsUpdate);
    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
      window.removeEventListener('engineer_requests_updated', handleRequestsUpdate);
      window.removeEventListener('crm_calendar_updated', handleRequestsUpdate);
    };
  }, []);

  // AI Pipeline Steps
  const aiSteps = [
    { icon: '📁', name: 'Проверка фото', desc: isAiRunning ? 'Загрузка снимков объекта...' : 'Ожидание...' },
    { icon: '🔍', name: 'Распознавание объекта', desc: isAiRunning ? 'Детекция конструкций и материалов...' : 'Ожидание...' },
    { icon: '📐', name: 'Определение объёмов', desc: isAiRunning ? 'Расчёт кубатуры и площадей...' : 'Ожидание...' },
    { icon: '📊', name: 'Первый расчёт', desc: isAiRunning ? 'Сопоставление с ГЭСН РК...' : 'Ожидание...' },
    { icon: '🔄', name: 'Самопроверка', desc: isAiRunning ? 'Анализ возможных ошибок...' : 'Ожидание...' },
    { icon: '📦', name: 'Проверка материалов', desc: isAiRunning ? 'Оценка накладных расходов...' : 'Ожидание...' },
    { icon: '⚠️', name: 'Проверка рисков', desc: isAiRunning ? 'Оценка климатических коэффициентов...' : 'Ожидание...' },
    { icon: '✅', name: 'Финальный расчёт', desc: isAiRunning ? 'Формирование итоговой сметы...' : 'Ожидание...' },
    { icon: '👷', name: 'Инженерная проверка', desc: isAiRunning ? 'Верификация инженером QazGost...' : 'Ожидание...' },
  ];


  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(currentYear, monthIndex, selectedDay);
    const isAdmin = currentUser?.role === 'admin' || viewRole === 'admin';
    
    if (selectedDate < today && !isAdmin) {
      alert("Нельзя создать заявку задним числом!");
      return;
    }

    setEditingEvent(null);
    setModalTab('info');
    setEvtTitle('');
    setEvtLocation('');
    setEvtTime('10:00 - 12:00');
    setEvtType('object');
    setEvtContractor('ТОО «QazGost»');
    setEvtStatus('В работе');
    setEvtDeadline(`До 18:00 (${selectedDay} ${monthsList[monthIndex]})`);
    setEvtStages([
      { id: 's1', title: '1. Подготовительные работы и нулевой цикл', deadline: 'До 10 Авг', status: 'Завершено', description: '', photos: [], documents: [] },
      { id: 's2', title: '2. Возведение несущих стен и монолита', deadline: 'До 20 Авг', status: 'В работе', description: '', photos: [], documents: [] },
      { id: 's3', title: '3. Инженерные сети и подписание КС-2', deadline: 'До 30 Авг', status: 'Запланировано', description: '', photos: [], documents: [] }
    ]);
    setActiveStageId(null);
    setEvtPhotos([]);
    setEvtEstimateItems([]);
    setEvtTotalSum(0);
    setEvtComments('');
    setShowSmartCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (evt) => {
    setEditingEvent(evt);
    setModalTab('info');
    setEvtTitle(evt.title);
    setEvtLocation(evt.location);
    setEvtTime(evt.time);
    setEvtType(evt.type);
    setEvtContractor(evt.contractor || 'ТОО «QazGost»');
    setEvtStatus(evt.status || 'В работе');
    setEvtDeadline(evt.deadline || `До 18:00 (${selectedDay} ${monthsList[monthIndex]})`);
    setEvtStages(evt.stages || [
      { id: 's1', title: '1. Нулевой цикл и закуп материалов', deadline: '01 Авг 2026', status: 'Завершено', description: '', photos: [], documents: [] },
      { id: 's2', title: '2. Основные монтажные работы', deadline: '15 Авг 2026', status: 'В работе', description: '', photos: [], documents: [] }
    ]);
    setActiveStageId(null);
    setEvtPhotos(evt.photos || []);
    setEvtEstimateItems(evt.estimateItems || []);
    setEvtTotalSum(evt.totalSum || (evt.estimateItems ? evt.estimateItems.reduce((a, c) => a + (c.sum || 0), 0) : 0));
    setEvtComments(evt.comments || '');
    setShowAddModal(true);
  };

  // Handlers for Stage Operations inside Modal
  const handleAddStage = (e) => {
    e.preventDefault();
    if (!newStageTitle.trim()) return;
    const newStage = {
      id: `s-${Date.now()}`,
      title: `${evtStages.length + 1}. ${newStageTitle}`,
      deadline: newStageDeadline || 'До 18:00',
      status: newStageStatus,
      crew: '',
      machinery: '',
      description: '',
      photos: [],
      documents: []
    };
    setEvtStages([...evtStages, newStage]);
    setNewStageTitle('');
    setNewStageDeadline('');
  };

  const handleDeleteStage = (stageId) => {
    setEvtStages(evtStages.filter(s => s.id !== stageId));
    if (activeStageId === stageId) setActiveStageId(null);
  };

  const handleChangeStageStatus = (stageId, status) => {
    setEvtStages(evtStages.map(s => s.id === stageId ? { ...s, status } : s));
  };

  // Handlers for Executive Report File Operations (Photos, Videos, Docs, CAD)
  const handleAttachPhoto = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      const newItems = Array.from(files).map((f, idx) => {
        const isImg = f.type.startsWith('image/');
        const isVid = f.type.startsWith('video/');
        const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
        const isDoc = f.name.match(/\.(doc|docx|xls|xlsx)$/i);
        const isCad = f.name.match(/\.(dwg|dxf|zip|rar)$/i);

        let tag = 'Документ';
        let previewIcon = '📄';
        if (isImg) { tag = 'Фотофиксация'; previewIcon = '🖼️'; }
        else if (isVid) { tag = 'Видеозапись'; previewIcon = '🎥'; }
        else if (isPdf) { tag = 'Акт / Сертификат'; previewIcon = '📕'; }
        else if (isDoc) { tag = 'Документ / Смета'; previewIcon = '📑'; }
        else if (isCad) { tag = 'Схема / CAD'; previewIcon = '📐'; }

        return {
          id: `file-${Date.now()}-${idx}`,
          name: f.name,
          tag: tag,
          time: 'Только что',
          preview: previewIcon,
          url: (isImg || isVid) ? URL.createObjectURL(f) : null,
          isImg: isImg,
          isVideo: isVid,
          isDoc: isPdf || isDoc,
          isCad: isCad
        };
      });
      setEvtPhotos(prev => [...prev, ...newItems]);
    }
  };

  const handleConfirmInlineStage = () => {
    if (!inlineStageText.trim()) return;
    const updatedStages = [...evtStages];
    if (updatedStages.length > 0) {
      updatedStages[updatedStages.length - 1].status = 'Завершено';
    }
    const newStage = {
      id: `s-${Date.now()}`,
      title: `${evtStages.length + 1}. ${inlineStageText.trim()}`,
      deadline: 'По графику',
      status: 'В работе',
      description: '',
      photos: [],
      documents: []
    };
    setEvtStages([...updatedStages, newStage]);
    setInlineStageText('');
    setIsAddingInlineStage(false);
    setActiveStageId(newStage.id);
  };

  const handleChangeStageField = (stageId, field, value) => {
    setEvtStages(prev => prev.map(s => s.id === stageId ? { ...s, [field]: value } : s));
  };

  const handleAddStageCrew = (stageId, crewName) => {
    if (!crewName) return;
    setEvtStages(prev => prev.map(s => {
      if (s.id === stageId) {
        const currentCrews = Array.isArray(s.crews) ? s.crews : (s.crew ? [s.crew] : []);
        if (!currentCrews.includes(crewName)) {
          const updated = [...currentCrews, crewName];
          return { ...s, crews: updated, crew: updated.join(', ') };
        }
      }
      return s;
    }));
  };

  const handleRemoveStageCrew = (stageId, crewName) => {
    setEvtStages(prev => prev.map(s => {
      if (s.id === stageId) {
        const currentCrews = Array.isArray(s.crews) ? s.crews : (s.crew ? [s.crew] : []);
        const updated = currentCrews.filter(c => c !== crewName);
        return { ...s, crews: updated, crew: updated.join(', ') };
      }
      return s;
    }));
  };

  const handleAddStageMachinery = (stageId, machName) => {
    if (!machName) return;
    setEvtStages(prev => prev.map(s => {
      if (s.id === stageId) {
        const currentMach = Array.isArray(s.machineries) ? s.machineries : (s.machinery ? [s.machinery] : []);
        if (!currentMach.includes(machName)) {
          const updated = [...currentMach, machName];
          return { ...s, machineries: updated, machinery: updated.join(', ') };
        }
      }
      return s;
    }));
  };

  const handleRemoveStageMachinery = (stageId, machName) => {
    setEvtStages(prev => prev.map(s => {
      if (s.id === stageId) {
        const currentMach = Array.isArray(s.machineries) ? s.machineries : (s.machinery ? [s.machinery] : []);
        const updated = currentMach.filter(m => m !== machName);
        return { ...s, machineries: updated, machinery: updated.join(', ') };
      }
      return s;
    }));
  };

  const handleRemovePhoto = (photoId) => {
    setEvtPhotos(evtPhotos.filter(p => p.id !== photoId));
  };


  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!evtTitle.trim()) return;

    const eventPayload = {
      title: evtTitle,
      location: evtLocation || 'Караганда, Объект №1',
      time: evtTime,
      type: evtType,
      contractor: evtContractor,
      status: evtStatus,
      deadline: evtDeadline,
      stages: evtStages,
      photos: evtPhotos,
      estimateItems: evtEstimateItems,
      totalSum: evtTotalSum,
      createdBy: editingEvent ? editingEvent.createdBy : currentUser?.id
    };

    const key = viewRole === 'engineer' ? 'qazgost_calendar_events' : `qazgost_calendar_events_${viewRole}`;

    // Sync payload with local storage and backend API
    try {
      fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      }).catch(() => {});
    } catch(err) {}

    if (editingEvent) {
      // Update existing event across multiple days if estimatedDays > 1
      const daysToPopulate = editingEvent.estimatedDays || 1;

      setScheduledEvents(prev => {
        let newState = { ...prev };
        
        for (let i = 0; i < daysToPopulate; i++) {
          const d = selectedDay + i;
          if (d <= 31) {
             const fullDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
             
             // Remove from integer key to prevent duplicates
             if (newState[d]) {
               const intDayEvents = [...newState[d]];
               const existingIdx = intDayEvents.findIndex(item => item.id === editingEvent.id);
               if (existingIdx !== -1) {
                  intDayEvents.splice(existingIdx, 1);
                  newState[d] = intDayEvents;
               }
             }

             // Update or add in fullDateKey
             const fullDayEvents = [...(newState[fullDateKey] || [])];
             const fullIdx = fullDayEvents.findIndex(item => item.id === editingEvent.id);
             if (fullIdx !== -1) {
                fullDayEvents[fullIdx] = { ...fullDayEvents[fullIdx], ...eventPayload };
             } else {
                fullDayEvents.push({ ...editingEvent, ...eventPayload, id: editingEvent.id });
             }
             newState[fullDateKey] = fullDayEvents;
          }
        }
        
        localStorage.setItem(key, JSON.stringify(newState));
        localStorage.setItem('qazgost_calendar_events', JSON.stringify(newState));
        return newState;
      });
    } else {
      // Create new event
      const newEvt = {
        id: Date.now(),
        ...eventPayload
      };

      const fullDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

      setScheduledEvents(prev => {
        const newState = {
          ...prev,
          [fullDateKey]: [...(prev[fullDateKey] || []), newEvt]
        };
        localStorage.setItem(key, JSON.stringify(newState));
        localStorage.setItem('qazgost_calendar_events', JSON.stringify(newState));
        return newState;
      });
    }

    setShowAddModal(false);
    setShowSmartCreateModal(false);
    setEditingEvent(null);
  };

  const handleAcceptLead = () => {
    setEvtStatus('В пути');
    setEditingEvent(prev => prev ? { ...prev, status: 'В пути' } : prev);
    setModalTab('executor');
  };

  const handleReturnToManager = () => {
    if (!editingEvent) return;
    
    // Remove from engineer's calendar / reset transfer lock
    handleDeleteEvent(editingEvent.id);
    
    // Put back in CRM calendar with "Дожим" status and manager review flags
    const crmKey = 'qazgost_calendar_events';
    try {
      const saved = localStorage.getItem(crmKey);
      let parsed = saved ? JSON.parse(saved) : {};
      const returnedEvt = {
        ...editingEvent,
        status: 'Дожим',
        returnedToManager: true,
        managerResolutionPending: true,
        managerApprovedRevision: false,
        transferredToExecutor: false,
        returnReason: 'Требуется пересогласование условий / сметы менеджером с заказчиком',
        returnedAt: new Date().toISOString(),
      };
      if (!parsed[selectedDay]) parsed[selectedDay] = [];
      parsed[selectedDay].push(returnedEvt);
      localStorage.setItem(crmKey, JSON.stringify(parsed));
      
      // Also send notification to Manager
      const notifs = JSON.parse(localStorage.getItem('engineer_notifications') || '[]');
      notifs.unshift({
        id: `NOT-${Date.now()}`,
        icon: '⚠️',
        title: 'Заявка на пересогласовании',
        text: `Инженер вернул заявку: «${editingEvent.title}» менеджеру. Требуется согласование условий с клиентом.`,
        time: 'Только что',
        unread: true
      });
      localStorage.setItem('engineer_notifications', JSON.stringify(notifs));
      
      alert('Заявка возвращена менеджеру на пересогласование. После решения вопросов менеджером она вернётся инженеру.');
    } catch(err) { console.error(err); }
    
    setShowAddModal(false);
  };

  const handleTransferToSpecialist = (reqItem = null) => {
    const title = reqItem?.client ? `${reqItem.type || 'Строительный объект'} (${reqItem.client})` : (evtTitle || 'Строительный объект');
    const location = reqItem?.address || evtLocation || 'г. Астана';
    const contractor = reqItem?.client || evtContractor || 'ТОО «QazGost»';
    const reqId = reqItem?.id || editingEvent?.id || Date.now();
    const workType = reqItem?.type || leadWorkType || 'Водопровод';

    let newCrew = 'Бригада: Мастер Владимир, Мастер Данил';
    let newMachinery = 'КМУ КамАЗ 65117 (Радион)';
    let estimatedDays = 3;

    if (workType.includes('Водопровод') || workType.includes('Сантех')) {
      newCrew = 'Бригада: Мастер Владимир, Мастер Данил';
      newMachinery = 'КМУ КамАЗ (Радион), Экскаватор JCB';
      estimatedDays = 3;
    } else if (workType.includes('Монолит') || workType.includes('Фундамент')) {
      newCrew = 'Бригада: Мастер Владимир, Мастер Данил';
      newMachinery = 'Автобетононасос, КМУ КамАЗ (Радион)';
      estimatedDays = 5;
    } else if (workType.includes('Электрик') || workType.includes('Сети')) {
      newCrew = 'Бригада электриков (Мастер Данил)';
      newMachinery = 'Автовышка (Радион)';
      estimatedDays = 2;
    }

    const today = new Date();
    const stage2Date = new Date();
    stage2Date.setDate(stage2Date.getDate() + 1);
    const stage3Date = new Date();
    stage3Date.setDate(stage3Date.getDate() + estimatedDays);

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + estimatedDays);
    const formattedDeadline = `До 18:00 (${deadlineDate.getDate()} ${monthNames[deadlineDate.getMonth()]})`;

    const defaultStages = [
      {
        id: Date.now() + 1,
        name: '1. Демонтаж и подготовка основания',
        status: 'В работе',
        deadline: `Срок: ${today.getDate()} ${monthNames[today.getMonth()]}`,
        crew: newCrew,
        crews: [newCrew],
        machinery: newMachinery,
        machineries: [newMachinery],
        files: [],
        notes: ''
      },
      {
        id: Date.now() + 2,
        name: '2. Основные строительно-монтажные работы',
        status: 'Запланировано',
        deadline: `Срок: ${stage2Date.getDate()} ${monthNames[stage2Date.getMonth()]}`,
        crew: newCrew,
        crews: [newCrew],
        machinery: newMachinery,
        machineries: [newMachinery],
        files: [],
        notes: ''
      },
      {
        id: Date.now() + 3,
        name: '3. Пусконаладка и сдача технадзору',
        status: 'Запланировано',
        deadline: `Срок: ${stage3Date.getDate()} ${monthNames[stage3Date.getMonth()]}`,
        crew: newCrew,
        crews: [newCrew],
        machinery: '',
        machineries: [],
        files: [],
        notes: ''
      }
    ];

    const updatedStages = (evtStages && evtStages.length > 0) ? evtStages : defaultStages;

    const payload = {
      id: reqId,
      title: title,
      location: location,
      time: reqItem?.time || evtTime || '10:00 - 18:00',
      type: 'work_stage',
      role: 'executor',
      contractor: contractor,
      status: 'В работе',
      deadline: formattedDeadline,
      stages: updatedStages,
      photos: evtPhotos,
      comments: evtComments || 'Передано инженером ПТО в работу бригаде мастеров',
      assignedWorkers: 'Мастер Владимир, Мастер Данил, Радион (Манипулятор)',
      assignedEngineer: currentUser?.name || 'Асхат Нурланов (Инженер ПТО)',
      estimatedDays: estimatedDays,
      transferredToExecutor: true,
      isTransferred: true,
      handedOverAt: new Date().toISOString()
    };

    // 1. Сохранение в общий календарь и календарь исполнителя на все дни графика!
    const calKey = 'qazgost_calendar_events';
    const curCal = JSON.parse(localStorage.getItem(calKey) || '{}');
    
    for (let i = 0; i < estimatedDays; i++) {
      const d = selectedDay + i;
      if (d <= 31) {
        const fdk = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const stageObj = updatedStages[i] || updatedStages[0];
        const dayPayload = {
          ...payload,
          id: `${reqId}_d${i+1}`,
          dealId: reqId,
          title: `[Этап ${i+1}/${estimatedDays}: ${stageObj?.name || 'Монтаж'}] ${title}`,
          stageName: stageObj?.name || `Этап ${i+1}`,
          time: '09:00 - 18:00',
          type: 'work_stage',
          role: 'executor'
        };
        const dayEvents = [...(curCal[fdk] || [])];
        const existIdx = dayEvents.findIndex(e => String(e.id) === String(dayPayload.id) || String(e.id) === String(reqId));
        if (existIdx >= 0) dayEvents[existIdx] = { ...dayEvents[existIdx], ...dayPayload };
        else dayEvents.push(dayPayload);
        curCal[fdk] = dayEvents;
      }
    }
    localStorage.setItem(calKey, JSON.stringify(curCal));
    localStorage.setItem('qazgost_calendar_events_executor', JSON.stringify(curCal));

    // 2. Добавление в список активных объектов исполнителя
    const newObj = {
      id: `OBJ-${reqId}`,
      client: title,
      address: location,
      budget: reqItem?.budget || 1500000,
      factCost: 0,
      progress: 15,
      status: 'В работе',
      brigade: 'Бригада: Мастер Владимир, Мастер Данил, Радион (Манипулятор)',
      photosCount: evtPhotos?.length || 0,
      stages: updatedStages
    };
    setObjectsList(prev => [newObj, ...prev.filter(o => o.id !== newObj.id)]);
    try {
      const savedObjs = JSON.parse(localStorage.getItem('qazgost_executor_objects') || '[]');
      localStorage.setItem('qazgost_executor_objects', JSON.stringify([newObj, ...savedObjs.filter(o => o.id !== newObj.id)]));
    } catch(e) {}

    // 3. Синхронизация статуса в CRM менеджера
    try {
      const crmCal = JSON.parse(localStorage.getItem('qazgost_crm_calendar') || '{}');
      for (const d in crmCal) {
        crmCal[d] = (crmCal[d] || []).map(e => {
          if (String(e.id) === String(reqId) || (e.title && title.includes(e.title))) {
            return { ...e, status: 'В работе', role: 'executor', type: 'work_stage', assignedWorkers: 'Мастер Владимир, Мастер Данил, Радион (Манипулятор)' };
          }
          return e;
        });
      }
      localStorage.setItem('qazgost_crm_calendar', JSON.stringify(crmCal));
    } catch (e) {}

    // 4. Обновление статуса в заявках инженера
    if (reqItem) {
      setRequestsList(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: 'Передано исполнителям' } : r));
      try {
        const savedReqs = JSON.parse(localStorage.getItem('qazgost_engineer_requests') || '[]');
        const updatedReqs = savedReqs.map(r => r.id === reqItem.id ? { ...r, status: 'Передано исполнителям' } : r);
        localStorage.setItem('qazgost_engineer_requests', JSON.stringify(updatedReqs));
      } catch (e) {}
    }

    // 5. Отправка уведомления исполнителям (Владимир, Данил, Радион)
    try {
      const execNotifs = JSON.parse(localStorage.getItem('executor_notifications') || '[]');
      execNotifs.unshift({
        id: `NOT-${Date.now()}`,
        icon: '🔨',
        title: 'Новый график работ от инженера',
        text: `Объект: "${title}" (${location}). Назначены: Владимир, Данил, Радион. График: ${estimatedDays} дн. Срок: ${formattedDeadline}.`,
        time: 'Только что',
        unread: true
      });
      localStorage.setItem('executor_notifications', JSON.stringify(execNotifs));
    } catch (e) {}

    setScheduledEvents(curCal);
    setShowAddModal(false);
    setEditingEvent(null);

    window.dispatchEvent(new Event('crm_calendar_updated'));
    window.dispatchEvent(new Event('engineer_requests_updated'));
    window.dispatchEvent(new Event('notifications_updated'));

    alert(`🚀 Объект "${title}" успешно передан в работу исполнителям (Мастер Владимир, Мастер Данил, Радион Манипулятор)!\nДедлайн: ${formattedDeadline}`);
  };

  // Quick Change Status (1-click status cycle)
  const handleQuickStatusChange = (evtId, newStatus) => {
    const key = 'qazgost_calendar_events';
    const selectedDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setScheduledEvents(prev => {
      const newState = {
        ...prev
      };
      if (newState[selectedDay]) {
        newState[selectedDay] = (prev[selectedDay] || []).map(item =>
          item.id === evtId ? { ...item, status: newStatus } : item
        );
      }
      if (newState[selectedDateKey]) {
        newState[selectedDateKey] = (prev[selectedDateKey] || []).map(item =>
          item.id === evtId ? { ...item, status: newStatus } : item
        );
      }
      localStorage.setItem(key, JSON.stringify(newState));
      return newState;
    });
  };

  // Delete Event
  const handleDeleteEvent = (evtId) => {
    if (!window.confirm('Удалить данное событие из календаря?')) return;
    
    const selectedDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    const deleteFromKey = (storageKey) => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          let changed = false;
          if (parsed[selectedDay]) {
            const before = parsed[selectedDay].length;
            parsed[selectedDay] = parsed[selectedDay].filter(item => item.id !== evtId);
            if (before !== parsed[selectedDay].length) changed = true;
          }
          if (parsed[selectedDateKey]) {
            const before = parsed[selectedDateKey].length;
            parsed[selectedDateKey] = parsed[selectedDateKey].filter(item => item.id !== evtId);
            if (before !== parsed[selectedDateKey].length) changed = true;
          }
          if (changed) {
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } catch (e) {}
      }
    };

    deleteFromKey('qazgost_calendar_events');

    setScheduledEvents(prev => {
      const newState = { ...prev };
      if (newState[selectedDay]) {
        newState[selectedDay] = newState[selectedDay].filter(item => item.id !== evtId);
      }
      if (newState[selectedDateKey]) {
        newState[selectedDateKey] = newState[selectedDateKey].filter(item => item.id !== evtId);
      }
      return newState;
    });
  };

  const runAiPipeline = () => {
    setIsAiRunning(true);
    setTimeout(() => setIsAiRunning(false), 4000);
  };

  const getTabName = (tab) => {
    switch (tab) {
      case 'calendar': return 'Календарь';
      case 'overview': return 'Обзор';
      case 'requests': return 'Заявки';
      case 'objects': return 'Объекты';
      case 'media': return 'Фото / Видео';
      case 'measurements': return 'Замеры';
      case 'ai-estimation': return 'AI-просчёт';
      case 'estimates': return 'Сметы';
      case 'teams': return 'Бригады';
      case 'materials': return 'Материалы';
      case 'reports': return 'Отчёты';
      case 'expenses': return 'Расходы';
      default: return 'Обзор';
    }
  };

  const engineerTourSteps = {
    calendar: [
      { target: '.engineer-nav-menu', title: 'Навигация', content: 'Переключайтесь между календарем, обзором, заявками и объектами.', placement: 'right' },
      { target: '.calendar-grid', title: 'Календарь задач', content: 'Здесь вы можете планировать свои задачи и инспекции.', placement: 'top' },
      { target: '.btn-sm-add', title: 'Добавление задач', content: 'Нажмите эту кнопку, чтобы быстро создать новую задачу или этап работы на выбранный день.', placement: 'left' }
    ],
    objects: [
      { target: '.objects-grid-view, .objects-list-view', title: 'Управление объектами', content: 'Здесь отображаются все объекты технического надзора.', placement: 'top' },
      { target: '.btn-add-object', title: 'Добавить объект', content: 'Кнопка для заведения новой карточки объекта в базу.', placement: 'left' }
    ],
    'ai-calc': [
      { target: '.ai-upload-area', title: 'Загрузка чертежей', content: 'Перетащите сюда файлы PDF или DWG для автоматического анализа.', placement: 'bottom' },
      { target: '.btn-gen-ai', title: 'Генерация', content: 'ИИ распознает объемы и сформирует черновую смету за несколько секунд.', placement: 'left' }
    ],
    estimates: [
      { target: '.estimates-table-wrapper', title: 'Сметные расчеты', content: 'В этой таблице хранятся все просчитанные сметы. Вы можете экспортировать их в Excel или PDF.', placement: 'top' }
    ]
  };

  const [orgSearch, setOrgSearch] = useState('');

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(orgSearch.toLowerCase()) || 
    o.bin.includes(orgSearch) ||
    o.city.toLowerCase().includes(orgSearch.toLowerCase())
  );

  const currentTourSteps = engineerTourSteps[activeTab] || [];

  if (!selectedOrg) {
    return (
      <div className="engineer-cabinet-root" style={{ flexDirection: 'column', minHeight: '100vh', justifyContent: 'flex-start', alignItems: 'center', padding: '1.5rem 2rem', width: '100%' }}>
        <AnimatedBackground />
        
        {/* Top Header Bar so Navigation & Sidebar Toggle are NEVER missing */}
        <header className="main-top-header" style={{ width: '100%', maxWidth: '1280px', marginBottom: '1.5rem', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-breadcrumbs">
            {viewRole === 'customer' ? 'Заказчик' : (viewRole === 'executor' ? 'Исполнитель' : 'Инженер')} <span>/</span> Выбор организации
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-sidebar-toggle" 
              onClick={() => setSelectedOrg(organizations[0])}
              style={{ background: 'rgba(37, 99, 235, 0.25)', border: '1px solid #2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>◀</span> Меню / Кабинет
            </button>
            <button className="btn-glass-home" onClick={onBackToHome}>
              🏠 На сайт
            </button>
          </div>
        </header>

        {/* Main Centered Selection Hub */}
        <div style={{ width: '100%', maxWidth: '1280px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header Banner with Search & Actions */}
          <div style={{ background: 'rgba(18, 22, 38, 0.75)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '28px', padding: '2.25rem 2.8rem', backdropFilter: 'blur(28px)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '24px', background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.35) 0%, rgba(255,255,255,0.06) 100%)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0, boxShadow: '0 0 35px rgba(37, 99, 235, 0.45)' }}>
                🏢
              </div>
              <div>
                <h2 style={{ fontSize: '2.1rem', fontWeight: '900', color: '#fff', margin: '0 0 0.4rem 0', letterSpacing: '-0.5px' }}>
                  Выберите рабочую организацию
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '0.96rem', margin: 0, lineHeight: '1.4' }}>
                  Управление строительными объектами, сметами и командой специалистов
                </p>
              </div>
            </div>

            {/* Search + Add Org Button */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="em-search-bar" style={{ margin: 0, width: '340px' }}>
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Поиск по названию, БИН или городу..."
                />
              </div>
              <button 
                onClick={() => setShowCreateOrgModal(true)}
                style={{ 
                  background: 'linear-gradient(90deg, #38bdf8, #2563eb)', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '0.95rem 1.8rem', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  fontSize: '0.96rem', 
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(56, 189, 248, 0.45)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.25s ease'
                }}
              >
                + Создать новую организацию
              </button>
            </div>
          </div>

          {/* 3 Spacious Equal Columns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
            {filteredOrgs.map(org => (
              <div 
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                style={{ 
                  background: 'rgba(18, 22, 38, 0.8)', 
                  border: org.isDefault ? '1px solid rgba(37, 99, 235, 0.7)' : '1px solid rgba(255, 255, 255, 0.14)', 
                  borderRadius: '28px', 
                  padding: '2rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(28px)',
                  boxShadow: org.isDefault ? '0 20px 45px rgba(37, 99, 235, 0.3)' : '0 20px 45px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {org.isDefault && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #2563eb, #38bdf8)', color: '#fff', padding: '0.4rem 1.25rem', borderRadius: '0 0 0 20px', fontSize: '0.78rem', fontWeight: '900', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.5)', letterSpacing: '0.6px' }}>
                    ⭐ ОСНОВНАЯ
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', flexShrink: 0, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
                    {org.icon}
                  </div>
                  <div style={{ flex: 1, paddingRight: org.isDefault ? '5rem' : 0 }}>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.35rem', fontWeight: '800', color: '#fff' }}>{org.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      📍 {org.city} • 🏷️ {org.type} <br />
                      БИН: <strong style={{ color: '#fff', letterSpacing: '0.5px' }}>{org.bin}</strong>
                    </p>
                  </div>
                </div>

                {/* 3 Glowing Activity Metric Pill Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#38bdf8' }}>{org.projectsCount}</div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '0.15rem' }}>Объекта</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#93c5fd' }}>{org.estimatesCount}</div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '0.15rem' }}>Смет</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#34d399' }}>{org.workersCount}</div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '0.15rem' }}>Инженеров</div>
                  </div>
                </div>

                {/* Card Role & CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Ваша роль в компании:</span>
                    <strong style={{ color: '#93c5fd', background: 'rgba(192, 132, 252, 0.12)', padding: '0.2rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(192, 132, 252, 0.25)' }}>{org.role}</strong>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrg(org);
                    }}
                    style={{ 
                      width: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #2563eb)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '0.9rem', 
                      borderRadius: '16px', 
                      fontWeight: '800', 
                      fontSize: '0.95rem', 
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <span>Войти в панель управления</span>
                    <span style={{ fontSize: '1.1rem' }}>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for creating new organization */}
        {showCreateOrgModal && (
          <div className="em-modal-overlay" onClick={() => setShowCreateOrgModal(false)}>
            <div className="em-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button className="em-modal-close" onClick={() => setShowCreateOrgModal(false)}>✕</button>
              <h2>🏢 Новая организация</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Введите реквизиты строительной компании или ИП</p>

              <div className="em-form-group mb-3">
                <label>Название компании / ИП:</label>
                <input 
                  type="text" 
                  className="em-input" 
                  value={newOrgName} 
                  onChange={e => setNewOrgName(e.target.value)} 
                  placeholder="например: ТОО «Астана Строй Групп»" 
                />
              </div>

              <div className="em-form-group mb-3">
                <label>БИН / ИИН:</label>
                <input 
                  type="text" 
                  className="em-input" 
                  value={newOrgBin} 
                  onChange={e => setNewOrgBin(e.target.value)} 
                  placeholder="12-значный БИН" 
                />
              </div>

              <div className="em-form-group mb-3">
                <label>Форма собственности:</label>
                <select className="em-select" value={newOrgType} onChange={e => setNewOrgType(e.target.value)}>
                  <option value="ТОО">ТОО (Товарищество с ограниченной ответственностью)</option>
                  <option value="ИП">ИП (Индивидуальный предприниматель)</option>
                  <option value="АО">АО (Акционерное общество)</option>
                </select>
              </div>

              <button 
                className="em-submit-btn w-100 mt-3"
                onClick={() => {
                  if (!newOrgName) return;
                  const created = {
                    id: Date.now(),
                    name: newOrgName,
                    city: newOrgCity,
                    type: newOrgType,
                    bin: newOrgBin || '123456789012',
                    icon: newOrgType === 'ИП' ? '👤' : '🏢'
                  };
                  setOrganizations([...organizations, created]);
                  setSelectedOrg(created);
                  setShowCreateOrgModal(false);
                }}
              >
                ✅ Зарегистрировать и войти
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="engineer-cabinet-root" style={{ flexDirection: 'row' }}>
      <AnimatedBackground />
      {viewRole === 'engineer' && <OnboardingTour steps={currentTourSteps} tourKey={`engineer_${activeTab}`} />}

      {/* LEFT SIDEBAR PANEL (Only rendered when not embedded) */}
      {!hideHeader && sidebarOpen && viewRole === 'engineer' && (
        <>
          <div 
            className="engineer-sidebar-backdrop" 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="engineer-sidebar" style={{ height: '100vh', zIndex: 10 }}>
          <div className="engineer-org-card" onClick={() => setSelectedOrg(null)} title="Кликните чтобы сменить организацию" style={{ cursor: 'pointer' }}>
            <div className="org-icon">{selectedOrg?.icon || '🏢'}</div>
            <div className="org-info">
              <h4 className="org-name">{selectedOrg?.name || 'ТОО «QazGost»'}</h4>
              <span className="org-sub">📍 {selectedOrg?.city || 'Караганда'} • {selectedOrg?.type || 'ТОО'} ⇄</span>
            </div>
          </div>

          <nav className="engineer-nav-menu">
            <button className={`nav-item-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
              <span className="nav-item-icon">📅</span>
              <span className="nav-item-text">Календарь</span>
            </button>

            <button className={`nav-item-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <span className="nav-item-icon">📊</span>
              <span className="nav-item-text">Обзор</span>
            </button>

            <button className={`nav-item-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
              <span className="nav-item-icon">📬</span>
              <span className="nav-item-text">Заявки</span>
              <span className="badge-count-red">0</span>
            </button>

              <button className={`nav-item-btn ${activeTab === 'objects' ? 'active' : ''}`} onClick={() => setActiveTab('objects')}>
                <span className="nav-item-icon">🏗️</span>
                <span className="nav-item-text">Объекты</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
                <span className="nav-item-icon">📸</span>
                <span className="nav-item-text">Фото / Видео</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'measures' ? 'active' : ''}`} onClick={() => setActiveTab('measures')}>
                <span className="nav-item-icon">📐</span>
                <span className="nav-item-text">Замеры</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'ai-calc' ? 'active' : ''}`} onClick={() => setActiveTab('ai-calc')}>
                <span className="nav-item-icon">🤖</span>
                <span className="nav-item-text">AI-просчёт</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'estimates' ? 'active' : ''}`} onClick={() => setActiveTab('estimates')}>
                <span className="nav-item-icon">📄</span>
                <span className="nav-item-text">Сметы</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
                <span className="nav-item-icon">👨‍🏭</span>
                <span className="nav-item-text">Бригады</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
                <span className="nav-item-icon">📦</span>
                <span className="nav-item-text">Материалы</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                <span className="nav-item-icon">📋</span>
                <span className="nav-item-text">Отчёты</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                <span className="nav-item-icon">💰</span>
                <span className="nav-item-text">Расходы</span>
              </button>

              <button className={`nav-item-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                <span className="nav-item-icon">🔔</span>
                <span className="nav-item-text">Уведомления</span>
                <span className="badge-count-red">0</span>
              </button>
            </nav>
          </aside>
        </>
      )}

      {/* MAIN RIGHT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* NEW BREADCRUMBS HEADER — Only when not embedded in Admin/Card cockpit */}
        {!hideHeader && (
          <header className="main-top-header" style={{ flexShrink: 0, width: '100%', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'rgba(10, 14, 28, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={onBackToHome}
                style={{
                  background: 'rgba(56, 189, 248, 0.18)',
                  border: '1.5px solid #38bdf8',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
                }}
              >
                <span>←</span>
                <span>Назад к карточкам</span>
              </button>
              <div className="header-breadcrumbs">
                {viewRole === 'customer' ? 'Заказчик' : (viewRole === 'executor' ? 'Исполнитель' : 'Инженер')} <span>/</span> Управление <span>/</span> {getTabName(activeTab)}
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-glass-home" onClick={onBackToHome}>
                🏠 На сайт
              </button>
            </div>
          </header>
        )}

        {/* WORKSPACE AREA */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* INNER TITLE BLOCK (was engineer-top-header) */}
          {!hideHeader && (
            <div className="engineer-top-header" style={{ position: 'static', borderBottom: viewRole === 'engineer' ? '1px solid rgba(255,255,255,0.05)' : 'none', flexShrink: 0 }}>
              <div className="header-left-wrap">
                {viewRole === 'engineer' && (
                  <button
                    className="btn-sidebar-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title="Скрыть/показать боковое меню"
                  >
                    {sidebarOpen ? '◀ Меню' : '▶ Меню'}
                  </button>
                )}
                <div className="engineer-header-title">
                  <span className="engineer-avatar-badge">{viewRole === 'customer' ? '📋' : (viewRole === 'executor' ? '🔧' : '👷')}</span>
                  <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
                      {viewRole === 'customer' ? 'Мой Календарь' : (viewRole === 'executor' ? 'График работ' : 'Кабинет инженера v2.0')}
                    </h1>
                    <span className="engineer-sub-tag" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                      {viewRole === 'customer' ? 'График выполнения заказов' : (viewRole === 'executor' ? 'Ваши проекты и дедлайны' : 'Технический надзор & Экспертиза СНиП РК')}
                    </span>
                  </div>
                </div>
              </div>
              {viewRole === 'engineer' && (
                <div className="header-right-wrap">
                   <span className="live-status-pill">🟢 Синхронизировано СНиП РК</span>
                </div>
              )}
            </div>
          )}

        {/* MAIN WORKSPACE PANEL SWITCHER */}
        <main className="engineer-main-content" style={{ flex: 1 }}>
          {/* ======================================================= */}
          {/* 1. CALENDAR TAB (📅 Календарь)                          */}
          {/* ======================================================= */}
          {activeTab === 'calendar' && (
            <div className="tab-view-container">
              {/* TOP HEADER BAR */}
              <div className="calendar-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="calendar-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <button className="btn-back-square" onClick={onBackToHome} title="На главную" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1.5px solid #38bdf8', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    ←
                  </button>
                  <h2 className="calendar-section-title" style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="title-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1.5px solid #38bdf8', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗓️</span>
                    <span>Календарь работ</span>
                  </h2>
                </div>

                <div className="calendar-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="view-mode-tabs" style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.9)', border: '1.5px solid rgba(56, 189, 248, 0.4)', borderRadius: '12px', padding: '3px' }}>
                    <button
                      className={`view-tab ${calendarViewMode === 'month' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('month')}
                      style={{
                        background: calendarViewMode === 'month' ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : 'transparent',
                        color: calendarViewMode === 'month' ? '#ffffff' : '#cbd5e1',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '9px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🗓️ Месяц
                    </button>
                    <button
                      className={`view-tab ${calendarViewMode === 'week' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('week')}
                      style={{
                        background: calendarViewMode === 'week' ? 'linear-gradient(135deg, #38bdf8, #2563eb)' : 'transparent',
                        color: calendarViewMode === 'week' ? '#ffffff' : '#cbd5e1',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '9px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      📅 Неделя
                    </button>
                  </div>

                  <div className="month-navigator" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1.5px solid rgba(56, 189, 248, 0.4)', borderRadius: '12px', padding: '5px 12px' }}>
                    <button
                      className="btn-nav-arrow-sm"
                      onClick={() => setMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
                      style={{ background: 'rgba(56, 189, 248, 0.25)', border: '1px solid #38bdf8', color: '#fff', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ‹
                    </button>
                    <span className="month-nav-label" style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', minWidth: '120px', textAlign: 'center' }}>{monthsList[monthIndex]}</span>
                    <button
                      className="btn-nav-arrow-sm"
                      onClick={() => setMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
                      style={{ background: 'rgba(56, 189, 248, 0.25)', border: '1px solid #38bdf8', color: '#fff', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ›
                    </button>
                  </div>

                  <button
                    className="btn-today-indigo"
                    onClick={() => {
                      const now = new Date();
                      setMonthIndex(now.getMonth());
                      setSelectedDay(now.getDate());
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#ffffff',
                      border: '1.5px solid rgba(165, 180, 252, 0.6)',
                      borderRadius: '12px',
                      padding: '8px 20px',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 0 16px rgba(99, 102, 241, 0.45)'
                    }}
                  >
                    ⚡ Сегодня
                  </button>
                </div>
              </div>

              {/* KPI STATS CARDS ROW (4 Summary Counters) */}
              <div className="calendar-stats-row">
                <div className="calendar-kpi-card">
                  <span className="kpi-big-num cyan">{activeProjectsCount}</span>
                  <span className="kpi-card-label">
                    <span>🔨</span> АКТИВНЫХ ПРОЕКТОВ
                  </span>
                </div>
                <div className="calendar-kpi-card">
                  <span className="kpi-big-num gold">{inReviewCount}</span>
                  <span className="kpi-card-label">
                    <span>📋</span> НА ПРОВЕРКЕ
                  </span>
                </div>
                <div className="calendar-kpi-card">
                  <span className="kpi-big-num red">{weekDeadlinesCount}</span>
                  <span className="kpi-card-label">
                    <span>⏰</span> ДЕДЛАЙНОВ НА НЕДЕЛЕ
                  </span>
                </div>
                <div className="calendar-kpi-card">
                  <span className="kpi-big-num green">{completedCount}</span>
                  <span className="kpi-card-label">
                    <span>✅</span> ВЫПОЛНЕНО
                  </span>
                </div>
              </div>

              {/* MAIN WORKSPACE GRID: MONTH GRID + RIGHT SIDEBAR */}
              <div className="calendar-workspace-grid">
                {/* LEFT: MONTH CALENDAR GRID */}
                <div className="calendar-card-panel">
                  {/* Weekday headers */}
                  <div className="weekdays-grid-header">
                    <span className="weekday-col">ПН</span>
                    <span className="weekday-col">ВТ</span>
                    <span className="weekday-col">СР</span>
                    <span className="weekday-col">ЧТ</span>
                    <span className="weekday-col">ПТ</span>
                    <span className="weekday-col weekend">СБ</span>
                    <span className="weekday-col weekend">ВС</span>
                  </div>

                  {/* Days grid: 42 cells dynamically generated */}
                  <div className="days-number-grid-full">
                    {/* Previous Month Days */}
                    {prevMonthDays.map((prevDay) => (
                      <div key={`prev-${prevDay}`} className="month-day-cell faded">
                        <span className="day-number-tag">{prevDay}</span>
                      </div>
                    ))}

                    {/* Current Month Days */}
                    {currentMonthDays.map((dayNum) => {
                      const fullDateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const evts = [...(scheduledEvents[dayNum] || []), ...(scheduledEvents[fullDateKey] || [])];
                      const isSel = selectedDay === dayNum;
                      return (
                        <div
                          key={`curr-${dayNum}`}
                          className={`month-day-cell ${isSel ? 'selected-day' : ''}`}
                          onClick={() => setSelectedDay(dayNum)}
                        >
                          <span className="day-number-tag">{dayNum}</span>

                          {/* Render Individual Role-Differentiated Event Chips */}
                          {evts.length > 0 && (
                            <div className="day-events-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', width: '100%', overflow: 'hidden' }}>
                              {evts.slice(0, 2).map((e, eIdx) => {
                                const isEng = e.role === 'engineer' || e.authorRole === 'engineer' || e.type?.includes('engineer') || e.type === 'request_engineering' || e.title?.toLowerCase().includes('экспертиз') || e.title?.toLowerCase().includes('псд') || e.title?.toLowerCase().includes('инженер') || e.title?.toLowerCase().includes('выезд');
                                const isExec = e.role === 'executor' || e.type === 'work_stage' || e.type === 'active_project' || e.title?.toLowerCase().includes('монтаж') || e.title?.toLowerCase().includes('стройк');
                                const isMachinery = e.type === 'request_construction' || e.title?.toLowerCase().includes('техник') || e.title?.toLowerCase().includes('экскаватор');
                                
                                const roleLabel = isEng ? '👷 ИНЖЕНЕР' : (isExec ? '🔨 ИСПОЛНИТЕЛЬ' : (isMachinery ? '🚜 ТЕХНИКА' : '📝 ЛИД'));
                                const chipBg = isEng ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,88,12,0.18))' :
                                               isExec ? 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(2,132,199,0.15))' :
                                               isMachinery ? 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(14,165,233,0.16))' :
                                               'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.18))';
                                const chipBorder = isEng ? '#f59e0b' : isExec ? '#00e5ff' : isMachinery ? '#38bdf8' : '#8b5cf6';
                                const tagColor = isEng ? '#fcd34d' : isExec ? '#38bdf8' : isMachinery ? '#7dd3fc' : '#c4b5fd';

                                return (
                                  <div
                                    key={e.id || eIdx}
                                    onClick={(evtClick) => {
                                      evtClick.stopPropagation();
                                      setSelectedDay(dayNum);
                                      handleOpenEditModal(e);
                                    }}
                                    style={{
                                      background: chipBg,
                                      border: `1px solid ${chipBorder}`,
                                      borderLeft: `3.5px solid ${chipBorder}`,
                                      borderRadius: '5px',
                                      padding: '2px 4px',
                                      cursor: 'pointer',
                                      fontSize: '0.62rem',
                                      lineHeight: 1.15,
                                      boxShadow: `0 2px 6px rgba(0,0,0,0.35), 0 0 8px ${chipBorder}40`,
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={evt => evt.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={evt => evt.currentTarget.style.transform = 'none'}
                                    title={`${roleLabel} #${e.id || eIdx+1}: ${e.title}\nБюджет: ${e.budget || '—'}\nКлиент: ${e.contractor || '—'}`}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                                      <span style={{ fontWeight: 900, fontSize: '0.55rem', color: tagColor, textTransform: 'uppercase' }}>
                                        {roleLabel}
                                      </span>
                                      <span style={{ fontWeight: 800, fontSize: '0.55rem', color: '#ffd700' }}>
                                        #{e.id || (eIdx + 1)}
                                      </span>
                                    </div>
                                    <div style={{ color: '#ffffff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {e.title}
                                    </div>
                                  </div>
                                );
                              })}
                              {evts.length > 2 && (
                                <div style={{ fontSize: '0.58rem', color: '#38bdf8', textAlign: 'center', fontWeight: 800 }}>
                                  +{evts.length - 2} ещё
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Next Month Days */}
                    {nextMonthDays.map((nextDay) => (
                      <div key={`next-${nextDay}`} className="month-day-cell faded">
                        <span className="day-number-tag">{nextDay}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT SIDEBAR: UPCOMING TASKS & LEGEND */}
                <div className="calendar-sidebar-column">
                  {/* Panel 1: Ближайшие задачи */}
                  <div className="sidebar-panel-card">
                    <div className="sidebar-card-header">
                      <h3 className="sidebar-card-title">
                        <span>📋</span> Ближайшие задачи
                      </h3>
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(currentYear, monthIndex, selectedDay);
                        const isPast = selectedDate < today;
                        const isAdmin = currentUser?.role === 'admin' || viewRole === 'admin';
                        
                        return viewRole !== 'customer' && (!isPast || isAdmin) && (
                          <button className="btn-sm-add" onClick={handleOpenCreateModal}>
                            + Добавить
                          </button>
                        );
                      })()}
                    </div>

                    {dayEvents.length > 0 ? (
                      <div className="events-list">
                        {dayEvents.map((evt) => (
                          <div key={evt.id} className="event-item-card">
                            <div className="evt-card-top">
                              <span className="evt-time">⏰ {evt.time}</span>
                              <span className={`evt-badge ${evt.type}`}>
                                {evt.type === 'active_project'
                                  ? '🏭 Проект'
                                  : evt.type === 'work_stage'
                                  ? '🟣 Этап'
                                  : evt.type === 'deadline'
                                  ? '🔴 Дедлайн'
                                  : evt.type === 'in_review'
                                  ? '🟡 Проверка'
                                  : '🟢 Завершено'}
                              </span>
                            </div>

                            <h4 className="evt-title">{evt.title}</h4>
                            <div className="evt-meta-row">
                              <span className="evt-location">📍 {evt.location}</span>
                              <span className="evt-contractor">🏢 {evt.contractor}</span>
                            </div>

                            <div className="evt-actions-bar">
                              <span className="evt-status">● {evt.status}</span>
                              <div className="evt-btn-group">
                                <button className="btn-evt-edit" onClick={() => handleOpenEditModal(evt)} title={viewRole === 'customer' ? 'Просмотр' : 'Изменить'}>
                                  {viewRole === 'customer' ? '👁️' : '✏️'}
                                </button>
                                {viewRole !== 'customer' && (currentUser?.role === 'admin' || evt.createdBy === currentUser?.id || evt.assignedTo === currentUser?.id || !evt.createdBy) && (
                                  <button className="btn-evt-delete" onClick={() => handleDeleteEvent(evt.id)} title="Удалить">
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="upcoming-clean-state">
                        <div className="confetti-icon">🎉</div>
                        <h4 className="clean-title">Всё чисто!</h4>
                        <p className="clean-desc">Нет предстоящих задач</p>
                      </div>
                    )}
                  </div>

                  {/* Panel 2: Обозначения (Legend) */}
                  <div className="sidebar-panel-card">
                    <h3 className="sidebar-card-title">
                      <span>🏷️</span> Обозначения
                    </h3>

                    <div className="legend-items-list">
                      <div className="legend-row-item">
                        <span className="dot-indicator cyan" />
                        <span>Активный проект</span>
                      </div>
                      <div className="legend-row-item">
                        <span className="dot-indicator cyan" />
                        <span>Этап работ</span>
                      </div>
                      <div className="legend-row-item">
                        <span className="dot-indicator red" />
                        <span>Дедлайн</span>
                      </div>
                      <div className="legend-row-item">
                        <span className="dot-indicator gold" />
                        <span>На проверке</span>
                      </div>
                      <div className="legend-row-item">
                        <span className="dot-indicator green" />
                        <span>Завершено</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. MATERIALS TAB (📦 Материалы)                         */}
          {/* ======================================================= */}
          {activeTab === 'materials' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">📦</span> Материалы и склад ({materialsList.length})
                </h2>
                <button className="btn-primary-action" onClick={() => alert('Форма добавления нового материала')}>
                  + Добавить материал
                </button>
              </div>

              <div className="glass-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#171933', borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Материал</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ед.</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Кол-во</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Цена (₸)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialsList.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{m.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>{m.unit}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#06b6d4' }}>{m.qty}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{m.price.toLocaleString()} ₸</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span className={`evt-badge ${m.status === 'В наличии' ? 'completed' : 'in_review'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. REPORTS TAB (📋 Отчёты)                               */}
          {/* ======================================================= */}
          {activeTab === 'reports' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">📋</span> Отчёты и акты
                </h2>
              </div>
              <div className="reports-cards-grid">
                <div className="report-glass-card">
                  <h4 className="report-card-title">📄 Акт выполненных работ</h4>
                  <p className="report-card-desc">Форма для закрытия объекта с расчётами (КС-2)</p>
                  <button className="btn-primary-action" onClick={() => alert('Формирование PDF Акта КС-2')}>
                    📄 Сформировать PDF
                  </button>
                </div>
                <div className="report-glass-card">
                  <h4 className="report-card-title">🖼️ Фотоотчёт для клиента</h4>
                  <p className="report-card-desc">До / Во время / После — автоматический PDF</p>
                  <button className="btn-primary-action" onClick={() => alert('Сборка фотоотчета для заказчика')}>
                    🖼️ Собрать фотоотчёт
                  </button>
                </div>
                <div className="report-glass-card">
                  <h4 className="report-card-title">📊 Экспорт расходов</h4>
                  <p className="report-card-desc">Выгрузить все расходы в CSV</p>
                  <button className="btn-glass-dark" onClick={() => alert('Скачивание CSV расходов')}>
                    📊 Скачать CSV
                  </button>
                </div>
                <div className="report-glass-card">
                  <h4 className="report-card-title">📊 Выгрузка базы (Excel)</h4>
                  <p className="report-card-desc">Экспорт объектов и бригад в XLSX</p>
                  <div className="dual-btn-row">
                    <button className="btn-primary-action" onClick={() => alert('Экспорт объектов в Excel')}>
                      🏗️ Объекты
                    </button>
                    <button className="btn-glass-dark" onClick={() => alert('Экспорт бригад в Excel')}>
                      👨‍🏭 Бригады
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. EXPENSES TAB (💰 Расходы)                             */}
          {/* ======================================================= */}
          {activeTab === 'expenses' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">💰</span> Учёт расходов
                </h2>
                <div className="header-actions-right">
                  <button className="btn-glass-dark" onClick={() => alert('Экспорт расходов в CSV')}>
                    📊 CSV
                  </button>
                  <button className="btn-primary-action" onClick={() => alert('Форма добавления расхода')}>
                    + Добавить расход
                  </button>
                </div>
              </div>

              <div className="expenses-stats-row">
                <div className="expense-stat-card">
                  <h2>183 000 000 ₸</h2>
                  <span>ПЛАН</span>
                </div>
                <div className="expense-stat-card">
                  <h2>141 000 000 ₸</h2>
                  <span>ФАКТ</span>
                </div>
                <div className="expense-stat-card">
                  <h2>42 000 000 ₸</h2>
                  <span>ПРИБЫЛЬ</span>
                </div>
              </div>

              <div className="glass-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#171933', borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Категория</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Наименование</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Дата</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Сумма (₸)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesList.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', color: '#06b6d4', fontWeight: 800 }}>{exp.category}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{exp.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>{exp.date}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#ef4444' }}>-{exp.amount.toLocaleString()} ₸</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span className="evt-badge completed">● {exp.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 5. NOTIFICATIONS TAB (🔔 Уведомления)                    */}
          {/* ======================================================= */}
          {activeTab === 'notifications' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">🔔</span> Уведомления ({notificationsList.filter(n => n.unread).length})
                </h2>
                <button
                  className="btn-green-check"
                  onClick={() => setNotificationsList(notificationsList.map(n => ({ ...n, unread: false })))}
                >
                  ✅ Прочитать всё
                </button>
              </div>

              <div className="sidebar-panel-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {notificationsList.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        background: notif.unread ? 'rgba(88, 80, 236, 0.15)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '1rem',
                        display: 'flex',
                        gap: '0.85rem',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontSize: '1.8rem' }}>{notif.icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.2rem 0', color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>{notif.title}</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{notif.text}</p>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 6. AI-CALC TAB (🤖 AI-просчёт)                         */}
          {/* ======================================================= */}
          {activeTab === 'ai-calc' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">🤖</span> AI-просчёт объекта
                </h2>
                <button className="btn-primary-action" onClick={runAiPipeline}>
                  🚀 Запустить просчёт
                </button>
              </div>

              <div className="glass-panel-card">
                <h4 className="panel-sub-title">Статус AI-движков</h4>
                <div className="ai-engines-row">
                  <div className="engine-box engine-red">
                    <span className="engine-status-icon">✕</span>
                    <div>
                      <strong>Gemini API</strong>
                      <span className="engine-sub-desc">Ключ не настроен</span>
                    </div>
                  </div>
                  <div className="engine-box engine-green">
                    <span className="engine-status-icon">✓</span>
                    <div>
                      <strong>SmartEstimate</strong>
                      <span className="engine-sub-desc">Локальный расчёт</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel-card">
                <h4 className="panel-sub-title">Процесс анализа данных</h4>
                <div className="ai-steps-list">
                  {aiSteps.map((step, idx) => (
                    <div key={idx} className="ai-step-row">
                      <div className="step-icon-bubble">{step.icon}</div>
                      <div className="step-info">
                        <h4 className="step-name">{step.name}</h4>
                        <span className="step-status-text">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 7. MEASURES TAB (📐 Замеры)                            */}
          {/* ======================================================= */}
          {activeTab === 'measures' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">📐</span> Технические замеры ({measuresList.length})
                </h2>
                <button className="btn-primary-action" onClick={() => alert('Ввод новых замеров')}>
                  + Добавить замер
                </button>
              </div>

              <div className="glass-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#171933', borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Объект</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Параметр</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Норма</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Факт</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Отклонение</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measuresList.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', color: '#06b6d4', fontWeight: 800 }}>{m.objectName}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{m.parameter}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>{m.norm}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#f59e0b' }}>{m.fact}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#10b981' }}>{m.dev}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span className="evt-badge completed">● {m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 8. ESTIMATES TAB (📄 Сметы)                            */}
          {/* ======================================================= */}
          {activeTab === 'estimates' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">📄</span> Сметная документация (4 позиции)
                </h2>
                <div className="header-actions-right">
                  <button className="btn-glass-dark" onClick={() => alert('Экспорт сметы')}>📋 Экспорт СНИП</button>
                  <button className="btn-primary-action" onClick={() => alert('Смета утверждена!')}>✅ Утвердить смету</button>
                </div>
              </div>

              <div className="glass-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#171933', borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Наименование работ</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ед.</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Кол-во</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Цена (₸)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Сумма (₸)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimatesList.map((est) => (
                      <tr key={est.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800 }}>{est.name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>{est.unit}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#06b6d4' }}>{est.qty}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#cbd5e1' }}>{est.price.toLocaleString()} ₸</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#f59e0b' }}>{est.total.toLocaleString()} ₸</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="estimates-summary-box">
                  <div className="summary-left"><strong>ИТОГО ПО СМЕТЕ:</strong></div>
                  <div className="summary-right"><strong>9 203 500 ₸</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 9. BRIGADES TAB (👨‍🏭 Бригады)                            */}
          {/* ======================================================= */}
          {activeTab === 'teams' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">👤</span> Управление бригадами ({brigades.length})
                </h2>
                <button className="btn-primary-action" onClick={() => alert('Форма добавления новой бригады')}>
                  + Новая бригада
                </button>
              </div>

              <div className="brigades-grid">
                {brigades.map((b) => (
                  <div key={b.id} className="brigade-card">
                    <div className="brigade-icon-bubble">{b.icon}</div>
                    <div className="brigade-info">
                      <h4 className="brigade-name">{b.name}</h4>
                      <span className="brigade-role">{b.role}</span>
                      <span className={`brigade-status-chip ${b.status === 'Свободна' ? 'green' : 'gold'}`}>
                        ● {b.status}
                      </span>
                      <strong className="brigade-price">{b.price}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 10. OVERVIEW TAB (📊 Обзор)                            */}
          {/* ======================================================= */}
          {activeTab === 'overview' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title">
                  <span className="icon-title">📊</span> Главная панель
                </h2>
                <button className="btn-reset-demo" onClick={() => { setScheduledEvents({}); setSelectedDay(6); }}>
                  🔄 Сброс демо
                </button>
              </div>

              <div className="overview-stats-grid">
                <div className="stat-card stat-cyan">
                  <div className="stat-icon-box">📋</div>
                  <div className="stat-info"><h2>{requestsList.length}</h2><span>Новые заявки</span></div>
                </div>
                <div className="stat-card stat-gold">
                  <div className="stat-icon-box">🏗️</div>
                  <div className="stat-info"><h2>{objectsList.filter(o => o.status === 'В работе').length}</h2><span>В работе</span></div>
                </div>
                <div className="stat-card stat-green">
                  <div className="stat-icon-box">✅</div>
                  <div className="stat-info"><h2>{objectsList.filter(o => o.status === 'Завершено').length}</h2><span>Завершено</span></div>
                </div>
                <div className="stat-card stat-cyan">
                  <div className="stat-icon-box">💰</div>
                  <div className="stat-info"><h2>42 000 000 ₸</h2><span>Прибыль</span></div>
                </div>
              </div>

              <div className="overview-bottom-grid">
                <div className="glass-panel-card">
                  <div className="card-top-bar">
                    <h3 className="card-title">📅 Ближайшие выезды сегодня</h3>
                    <button className="btn-nav-arrow" onClick={() => setActiveTab('calendar')}>Календарь →</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                    {dayEvents.length > 0 ? (
                      dayEvents.map(e => (
                        <div key={e.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                          <strong style={{ color: '#06b6d4' }}>⏰ {e.time} — {e.title}</strong>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>📍 {e.location}</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-inline-state"><p>Нет событий на сегодня</p></div>
                    )}
                  </div>
                </div>
                <div className="glass-panel-card">
                  <div className="card-top-bar">
                    <h3 className="card-title">🔔 Уведомления</h3>
                    <span className="badge-pill-zero">{notificationsList.filter(n => n.unread).length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                    {notificationsList.slice(0, 3).map(n => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                        <strong style={{ color: '#fff' }}>{n.icon} {n.title}</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 11. REQUESTS TAB (📬 Заявки)                           */}
          {/* ======================================================= */}
          {activeTab === 'requests' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title"><span className="icon-title">📬</span> Новые заявки ({requestsList.length})</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {requestsList.map((req) => (
                  <div key={req.id} className="event-item-card">
                    <div className="evt-card-top">
                      <span className="evt-time">⏰ {req.time}</span>
                      <span className="evt-badge request">{req.status}</span>
                    </div>
                    <h4 className="evt-title">{req.client}</h4>
                    <p style={{ margin: '4px 0', color: '#06b6d4', fontWeight: 800, fontSize: '0.88rem' }}>{req.type}</p>
                    <div className="evt-meta-row">
                      <span className="evt-location">📍 {req.address}</span>
                      <span className="evt-contractor">📞 {req.phone}</span>
                    </div>
                    {req.managerName && (
                      <div style={{ fontSize: '0.75rem', color: '#c4b5fd', marginTop: '4px', fontWeight: 700 }}>
                        👔 Менеджер: {req.managerName}
                      </div>
                    )}
                    <div className="evt-actions-bar" style={{ marginTop: '0.85rem' }}>
                      <div className="evt-btn-group" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-evt-action" style={{ flex: 1 }} onClick={() => handleTransferToSpecialist(req)}>
                          👥 Передать исполнителю
                        </button>
                        <button className="btn-evt-edit" onClick={() => {
                          setEvtTitle(`${req.type || 'Объект'} (${req.client})`);
                          setEvtLocation(req.address);
                          setEvtContractor(req.client);
                          setShowAddModal(true);
                        }}>
                          📋 Детали / Смета
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 12. OBJECTS TAB (🏗️ Объекты)                          */}
          {/* ======================================================= */}
          {activeTab === 'objects' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title"><span className="icon-title">🏗️</span> Мои объекты ({objectsList.length})</h2>
                <div className="header-actions-right">
                  <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="objects-search-field"
                      placeholder="Поиск по клиенту / адресу..."
                      value={objectsSearch}
                      onChange={(e) => setObjectsSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary-action" onClick={handleOpenCreateModal}>+ Новый объект</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {objectsList.filter(o => o.client.toLowerCase().includes(objectsSearch.toLowerCase()) || o.address.toLowerCase().includes(objectsSearch.toLowerCase())).map((obj) => (
                  <div key={obj.id} className="event-item-card">
                    <div className="evt-card-top">
                      <span className="evt-badge object">{obj.status}</span>
                      <span style={{ color: '#10b981', fontWeight: 900 }}>📊 {obj.progress}%</span>
                    </div>
                    <h4 className="evt-title">{obj.client}</h4>
                    <p className="evt-location" style={{ margin: '4px 0 8px 0' }}>📍 {obj.address}</p>
                    <div className="evt-meta-row">
                      <span>💰 Бюджет: <strong>{obj.budget.toLocaleString()} ₸</strong></span>
                      <span>📸 {obj.photosCount} фото</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '6px', width: '100%', margin: '8px 0', overflow: 'hidden' }}>
                      <div style={{ background: '#5850ec', height: '100%', width: `${obj.progress}%` }} />
                    </div>
                    <div className="evt-actions-bar">
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>👷 {obj.brigade}</span>
                      <div className="evt-btn-group">
                        <button className="btn-evt-edit" onClick={() => setActiveTab('media')} title="Фотофиксация">
                          📸
                        </button>
                        <button className="btn-evt-edit" onClick={() => setActiveTab('measures')} title="Замеры">
                          📐
                        </button>
                        <button className="btn-evt-action" onClick={() => setActiveTab('ai-calc')} title="AI-просчёт">
                          🤖
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 13. MEDIA TAB (📸 Фото/Видео)                            */}
          {/* ======================================================= */}
          {activeTab === 'media' && (
            <div className="tab-view-container">
              <div className="view-header-bar">
                <h2 className="view-title"><span className="icon-title">📸</span> Фото / Видео фиксация объекта</h2>
                <button className="btn-primary-action" onClick={() => alert('Загрузка фото с камеры / галереи')}>
                  📷 Загрузить снимки
                </button>
              </div>

              <div className="glass-panel-card">
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <button className="filter-chip active">До начала (6)</button>
                  <button className="filter-chip">Замеры (4)</button>
                  <button className="filter-chip">В процессе (12)</button>
                  <button className="filter-chip">Скрытые работы (8)</button>
                  <button className="filter-chip">После завершения (5)</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '120px', background: '#171933', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        🖼️
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '6px', display: 'block', textAlign: 'center', fontWeight: 800 }}>
                        Снимок #{idx} — ЖК "Алатау"
                      </span>
                    </div>
                  ))}
                </div>

                <button className="btn-primary-action" style={{ marginTop: '1.25rem', width: '100%' }} onClick={() => alert('Фотоотчет собран и отправлен клиенту!')}>
                  📤 Отправить полный фотоотчёт клиенту
                </button>
              </div>
            </div>
          )}
        </main>
        </div>
      </div>

      {showSmartCreateModal && (
        <SmartDealCreateModal 
          onClose={() => setShowSmartCreateModal(false)}
          defaultDate={`До 18:00 (${selectedDay} ${monthsList[monthIndex]})`}
          onSave={(payload) => {
            const mockEvent = { preventDefault: () => {} };
            // Populate state with payload to reuse handleSaveEvent logic, or just manually save it.
            // Actually, handleSaveEvent reads from state (evtTitle, evtLocation, etc).
            // It's better to set the states, then call handleSaveEvent.
            setEditingEvent(null);
            setEvtTitle(payload.title);
            setEvtLocation(payload.location);
            setEvtTime(payload.time);
            setEvtType(payload.type);
            setEvtContractor(payload.contractor);
            setEvtStatus(payload.status);
            setEvtDeadline(payload.deadline);
            setEvtStages(payload.stages);
            setEvtPhotos(payload.photos);
            setEvtEstimateItems(payload.estimateItems || []);
            setEvtTotalSum(payload.totalSum || 0);
            
            // We need a slight delay to allow state to update before calling handleSaveEvent
            setTimeout(() => {
              document.getElementById('hidden-save-btn')?.click();
            }, 50);
          }}
        />
      )}
      
      {/* Hidden button to trigger handleSaveEvent with latest state */}
      <form onSubmit={handleSaveEvent} style={{display: 'none'}}>
        <button id="hidden-save-btn" type="submit"></button>
      </form>

      {/* Interactive Create / Edit Event Modal with Stage Sequence & Photo Attachments */}
      {showAddModal && (
        <div className="modal-overlay-bg" onClick={() => setShowAddModal(false)}>
          <OnboardingTour 
            tourKey="engineer_event_modal" 
            steps={[
              { target: '.add-event-modal', title: 'Окно редактирования', content: 'Здесь вы заполняете всю информацию по объекту.', placement: 'left' },
              { target: '.crm-pipeline-box', title: 'Этапы работ', content: 'Добавляйте новые этапы и нажимайте "Завершить этап" (зеленая кнопка), чтобы двигать процесс.', placement: 'bottom' },
              { target: '.modal-tabs-header', title: 'Вкладки', content: 'Переключайтесь между основными данными, этапами и фотографиями.', placement: 'top' }
            ]} 
          />
          <div className="add-event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? '✏️ Редактировать объект' : `+ Новый объект на ${selectedDay} ${monthsList[monthIndex]}`}</h3>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="modal-form-body">
              <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* LEFT COLUMN: PERMANENT OBJECT PASSPORT & PARAMETERS */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📋 Паспорт объекта
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(236,72,153,0.15)', color: '#60a5fa', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                      {editingEvent ? 'РЕДАКТИРОВАНИЕ' : 'НОВЫЙ ОБЪЕКТ'}
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>📝 Название объекта / инспекции:</label>
                    <input
                      type="text"
                      placeholder="Например: Штамповые испытания - Иван Петров"
                      value={evtTitle}
                      onChange={(e) => setEvtTitle(e.target.value)}
                      className="modal-input"
                      disabled={viewRole === 'customer' || viewRole === 'engineer'}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>🏷️ Категория:</label>
                      <select value={evtType} onChange={(e) => setEvtType(e.target.value)} className="modal-select" disabled={viewRole === 'customer' || viewRole === 'engineer'}>
                        <option value="active_project">🔵 Проект</option>
                        <option value="work_stage">🟣 Этап</option>
                        <option value="deadline">🔴 Срок</option>
                        <option value="in_review">🟡 Проверка</option>
                        <option value="completed">🟢 Завершено</option>
                        <option value="object">🏗️ Объект</option>
                        <option value="request">📬 Заявка</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>📊 Статус:</label>
                      <select value={evtStatus} onChange={(e) => setEvtStatus(e.target.value)} className="modal-select" disabled={viewRole === 'customer' || viewRole === 'engineer'}>
                        <option value="В работе">🟡 В работе</option>
                        <option value="Ожидает приёмки">⏳ Приёмка</option>
                        <option value="Завершено">🟢 Завершено</option>
                        <option value="Просрочено">🔴 Просрочено</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>📅 Дедлайн:</label>
                      <input
                        type="text"
                        placeholder="До 18:00"
                        value={evtDeadline}
                        onChange={(e) => setEvtDeadline(e.target.value)}
                        className="modal-input"
                        disabled={viewRole === 'customer' || viewRole === 'engineer'}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>⏰ Время:</label>
                      <input
                        type="text"
                        placeholder="09:00 - 18:00"
                        value={evtTime}
                        onChange={(e) => setEvtTime(e.target.value)}
                        className="modal-input"
                        disabled={viewRole === 'customer' || viewRole === 'engineer'}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>👷 Ответственная организация:</label>
                    <select
                      value={evtContractor}
                      onChange={(e) => setEvtContractor(e.target.value)}
                      className="modal-input modal-select"
                      style={{ cursor: 'pointer', background: '#1e1e2d', color: '#f8fafc' }}
                      disabled={viewRole === 'customer' || viewRole === 'engineer'}
                    >
                      <option value="Не назначен">Не назначен</option>
                      <option value="ТОО «QazGost»">ТОО «QazGost»</option>
                      <option value="ТОО «Алматы Сити»">ТОО «Алматы Сити»</option>
                      <option value="ИП «Мастер Сервис»">ИП «Мастер Сервис»</option>
                      <option value="ТОО «Инжен-Строй»">ТОО «Инжен-Строй»</option>
                      <option value="ИП «Сатов А.В.»">ИП «Сатов А.В.»</option>
                      <option value="Куаныш Жумагулов (Геология)">Куаныш Жумагулов (Геология)</option>
                      <option value="Алексей Мельников (Геодезия)">Алексей Мельников (Геодезия)</option>
                      <option value="Данияр Айтжанов (Испытания свай)">Данияр Айтжанов (Испытания свай)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>📍 Точный адрес объекта:</label>
                    <input
                      type="text"
                      placeholder="Алматы, Медеуский р-н, ул. Достык 12"
                      value={evtLocation}
                      onChange={(e) => setEvtLocation(e.target.value)}
                      className="modal-input"
                      disabled={viewRole === 'customer'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const targetQuery = evtLocation || 'Алматы';
                        window.open(`https://2gis.kz/search/${encodeURIComponent(targetQuery)}`, '_blank');
                      }}
                      style={{
                        marginTop: '0.45rem',
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        background: 'linear-gradient(90deg, #16a34a, #059669)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 10px rgba(22, 163, 74, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>🟢</span> Найти адрес на 2GIS 🗺️
                    </button>
                  </div>

                  {/* Summary Card inside Left Column */}
                  <div style={{ marginTop: '0.4rem', padding: '0.85rem', background: 'rgba(10, 12, 28, 0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#94a3b8' }}>Итоговая смета:</span>
                      <strong style={{ color: '#10b981' }}>{evtTotalSum.toLocaleString()} ₸</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#94a3b8' }}>Этапы работ:</span>
                      <strong style={{ color: '#38bdf8' }}>{evtStages.filter(s => s.status === 'Завершено').length} из {evtStages.length} завершено</strong>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTIVE WORKSPACE TABS OR LEAD ACCEPTANCE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
                  
                  {(editingEvent && editingEvent.isLead && !editingEvent.transferredToExecutor && !editingEvent.isTransferred && (evtStatus === 'На проверке у инженера' || evtStatus === 'Новые') && evtStatus !== 'В пути' && evtStatus !== 'Передано специалисту') ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem', marginTop: '1rem' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
                      <h2 style={{ color: '#fff', margin: '0 0 1rem 0', fontSize: '1.4rem' }}>Новая заявка поступила</h2>
                      <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.5' }}>
                        Внимательно ознакомьтесь с паспортом объекта слева. <br />
                        Чтобы начать заполнять этапы, прикреплять фото или сметы, необходимо принять объект в работу.
                      </p>
                      <button type="button" onClick={handleAcceptLead} style={{ background: 'linear-gradient(90deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)' }}>
                        🚀 В пути (Принять заявку)
                      </button>
                    </div>

                  ) : (
                    <>
                      {/* WORKSPACE NAVIGATION TABS & TOP SAVE BUTTON */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div className="modal-nav-tabs" style={{ marginBottom: 0 }}>
                          {!(editingEvent && editingEvent.isLead && evtStatus === 'В пути') && (
                            <button
                              type="button"
                              className={`modal-nav-tab ${modalTab === 'stages' || modalTab === 'info' ? 'active' : ''}`}
                              onClick={() => setModalTab('stages')}
                            >
                              🏗️ 1. Этапы ({evtStages.length})
                            </button>
                          )}
                          {!isExecutor && (
                            <button
                              type="button"
                              className={`modal-nav-tab ${modalTab === 'estimate' ? 'active' : ''}`}
                              onClick={() => setModalTab('estimate')}
                            >
                              📊 2. Смета {evtTotalSum > 0 ? `(${evtTotalSum.toLocaleString()} ₸)` : ''}
                            </button>
                          )}
                          {!(editingEvent && editingEvent.isLead && evtStatus === 'В пути') && (
                            <button
                              type="button"
                              className={`modal-nav-tab ${modalTab === 'photos' ? 'active' : ''}`}
                              onClick={() => setModalTab('photos')}
                            >
                              📋 {!isExecutor ? '3. Отчёт' : '2. Отчёт'} ({evtPhotos.length})
                            </button>
                          )}
                          {editingEvent && editingEvent.isLead && evtStatus === 'В пути' && (
                            <button
                              type="button"
                              className={`modal-nav-tab ${modalTab === 'executor' ? 'active' : ''}`}
                              onClick={() => setModalTab('executor')}
                              style={{ background: modalTab === 'executor' ? 'linear-gradient(90deg, #10b981, #059669)' : 'rgba(16, 185, 129, 0.1)', color: modalTab === 'executor' ? '#fff' : '#10b981', border: '1px solid #10b981' }}
                            >
                              🚀 Отправка
                            </button>
                          )}
                        </div>

                        {viewRole !== 'customer' && (
                          <button
                            type="submit"
                            className="btn-submit-pink"
                            style={{
                              padding: '0.65rem 1.4rem',
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                              border: '1px solid rgba(56, 189, 248, 0.5)',
                              borderRadius: '12px',
                              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)',
                              cursor: 'pointer'
                            }}
                          >
                            💾 {editingEvent ? 'Сохранить изменения' : 'Создать объект'}
                          </button>
                        )}
                      </div>

              {/* TAB 1: UNIFIED STAGES SEQUENCE MANAGER */}
              {(modalTab === 'stages' || modalTab === 'info') && (
                <div className="stages-list-container">

                  {/* QUICK INLINE STAGE CREATION FORM */}
                  {viewRole !== 'customer' && isAddingInlineStage && (
                    <div style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '0.85rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(56, 189, 248, 0.35)'
                    }}>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Введите название нового этапа..."
                        autoFocus
                        value={inlineStageText}
                        onChange={(e) => setInlineStageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmInlineStage();
                          } else if (e.key === 'Escape') {
                            setIsAddingInlineStage(false);
                          }
                        }}
                        style={{ flex: 1, margin: 0 }}
                      />
                      <button
                        type="button"
                        className="btn-submit-pink"
                        onClick={handleConfirmInlineStage}
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                      >
                        ✓ Сохранить
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setIsAddingInlineStage(false)}
                        style={{ padding: '0.75rem 1rem', fontSize: '0.88rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* STAGE CARDS LIST WITH INTEGRATED CREWS, MACHINERY, NOTES & FILES */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {evtStages.map((stage, idx) => (
                      <div key={stage.id} className="stage-card-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.9rem', padding: '1.1rem', background: 'rgba(15, 18, 40, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px' }}>
                        {/* STAGE HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div className="stage-left-info">
                            <div className="stage-num-badge">{idx + 1}</div>
                            <div>
                              <h5 className="stage-title-text" style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{stage.title}</h5>
                              <span className="stage-deadline-sub" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>⏰ Срок: {stage.deadline}</span>
                            </div>
                          </div>

                          <div className="stage-right-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              value={stage.status}
                              onChange={(e) => handleChangeStageStatus(stage.id, e.target.value)}
                              className="select-stage-status"
                              disabled={viewRole === 'customer'}
                            >
                              <option value="Запланировано">⚪ Запланировано</option>
                              <option value="В работе">🟡 В работе</option>
                              <option value="Ожидает приёмки">⏳ Приёмка</option>
                              <option value="Завершено">🟢 Завершено</option>
                            </select>

                            {viewRole !== 'customer' && (
                              <button
                                type="button"
                                className="btn-del-stage"
                                onClick={() => handleDeleteStage(stage.id)}
                                title="Удалить этап"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CREW & HEAVY MACHINERY ASSIGNMENT GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Crews Multi-Select */}
                          <div>
                            <label style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                              👷 Задействованные бригады:
                            </label>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.35rem' }}>
                              {(() => {
                                const crewList = Array.isArray(stage.crews) ? stage.crews :
                                  Array.isArray(stage.crew) ? stage.crew.map(c => typeof c === 'object' ? (c.name || JSON.stringify(c)) : String(c)) :
                                  (typeof stage.crew === 'string' && stage.crew ? [stage.crew] : []);
                                return crewList.map((crewName, cIdx) => (
                                  <span key={cIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#7dd3fc', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    👷 {crewName}
                                    {viewRole !== 'customer' && (
                                      <button type="button" onClick={() => handleRemoveStageCrew(stage.id, crewName)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800, padding: 0, marginLeft: '0.2rem' }}>✕</button>
                                    )}
                                  </span>
                                ));
                              })()}
                            </div>

                            {viewRole !== 'customer' && (
                              <select
                                value=""
                                onChange={(e) => {
                                  handleAddStageCrew(stage.id, e.target.value);
                                  e.target.value = '';
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background: '#13131e',
                                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                                  color: '#38bdf8',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                              >
                                <option value="">+ Добавить бригаду к этапу...</option>
                                <option value="Бригада монолитчиков (4 чел + 2 арматурщика)">👷 Бригада монолитчиков (4 чел + 2 арматурщика)</option>
                                <option value="Буровая бригада №2 (3 инженера)">🚜 Буровая бригада №2 (3 инженера)</option>
                                <option value="Бригада монтажников сантехники (3 чел)">🔧 Бригада монтажников сантехники (3 чел)</option>
                                <option value="Геодезическая группа (2 инженера)">📐 Геодезическая группа (2 инженера)</option>
                                <option value="Бригада разнорабочих (5 чел)">🧹 Бригада разнорабочих (5 чел)</option>
                                <option value="Бригада электриков (3 чел)">⚡ Бригада электриков (3 чел)</option>
                                <option value="Собственная бригада подрядчика">👥 Собственная бригада подрядчика</option>
                              </select>
                            )}
                          </div>

                          {/* Machinery Multi-Select */}
                          <div>
                            <label style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                              🚜 Задействованная спецтехника:
                            </label>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.35rem' }}>
                              {(() => {
                                const machList = Array.isArray(stage.machineries) ? stage.machineries :
                                  Array.isArray(stage.machinery) ? stage.machinery.map(m => typeof m === 'object' ? (m.name || m.title || JSON.stringify(m)) : String(m)) :
                                  (typeof stage.machinery === 'string' && stage.machinery ? stage.machinery.split(',').map(s => s.trim()).filter(Boolean) : []);
                                return machList.map((machName, mIdx) => (
                                  <span key={mIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fcd34d', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    🚜 {machName}
                                    {viewRole !== 'customer' && (
                                      <button type="button" onClick={() => handleRemoveStageMachinery(stage.id, machName)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800, padding: 0, marginLeft: '0.2rem' }}>✕</button>
                                    )}
                                  </span>
                                ));
                              })()}
                            </div>

                            {viewRole !== 'customer' && (
                              <select
                                value=""
                                onChange={(e) => {
                                  handleAddStageMachinery(stage.id, e.target.value);
                                  e.target.value = '';
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background: '#13131e',
                                  border: '1px dashed rgba(245, 158, 11, 0.4)',
                                  color: '#f59e0b',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                              >
                                <option value="">+ Добавить спецтехнику...</option>
                                <option value="Буровая установка SANY SR285R (1 ед)">🚜 Буровая установка SANY SR285R (1 ед)</option>
                                <option value="Гусеничный кран XCMG 50т (1 ед)">🏗️ Гусеничный кран XCMG 50т (1 ед)</option>
                                <option value="Автобетононасос Putzmeister 42m (1 ед)">🚚 Автобетононасос Putzmeister 42m (1 ед)</option>
                                <option value="Экскаватор-погрузчик JCB 3CX (2 ед)">🚜 Экскаватор-погрузчик JCB 3CX (2 ед)</option>
                                <option value="Самосвал КАМАЗ 20т (3 ед)">🚛 Самосвал КАМАЗ 20т (3 ед)</option>
                                <option value="Штамповая установка испытания грунтов (1 ед)">⚖️ Штамповая установка испытания грунтов (1 ед)</option>
                                <option value="Дизельный генератор 100 кВт (1 ед)">⚡ Дизельный генератор 100 кВт (1 ед)</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* STAGE NOTES & MATERIALS GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                              📝 Заметки по этапу:
                            </label>
                            <textarea
                              placeholder="Заметки или прогресс по этому этапу..."
                              value={stage.description || ''}
                              onChange={(e) => {
                                setEvtStages(evtStages.map(s => s.id === stage.id ? { ...s, description: e.target.value } : s));
                              }}
                              disabled={viewRole === 'customer'}
                              style={{
                                width: '100%',
                                minHeight: '60px',
                                background: '#101426',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                padding: '0.5rem',
                                fontSize: '0.8rem',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                              }}
                            ></textarea>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                              📁 Файлы этапа (Фото / Документы):
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {viewRole !== 'customer' && (
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  <span>📎</span> Прикрепить файл
                                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      const newFiles = Array.from(e.target.files).map(f => ({ 
                                          name: f.name,
                                          url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                                          isImg: f.type.startsWith('image/')
                                        }));
                                      setEvtStages(evtStages.map(s => s.id === stage.id ? { ...s, photos: [...(s.photos || []), ...newFiles] } : s));
                                    }
                                  }} />
                                </label>
                              )}

                              {(stage.photos && stage.photos.length > 0) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                  {stage.photos.map((p, pIdx) => (
                                    <span key={pIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '5px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                                      {p.isImg ? '🖼️' : '📄'} {p.name}
                                      {viewRole !== 'customer' && (
                                        <span onClick={() => {
                                          setEvtStages(evtStages.map(s => {
                                            if (s.id === stage.id) {
                                              const updated = [...s.photos];
                                              updated.splice(pIdx, 1);
                                              return { ...s, photos: updated };
                                            }
                                            return s;
                                          }));
                                        }} style={{ cursor: 'pointer', color: '#ef4444', marginLeft: '0.2rem', fontWeight: 800 }}>✕</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TWO MAIN ACTION BUTTONS: CREATE STAGE & COMPLETE STAGE (MOVED TO BOTTOM) */}
                  {viewRole !== 'customer' && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingInlineStage(!isAddingInlineStage)}
                        style={{
                          flex: 1,
                          padding: '0.8rem 1.25rem',
                          background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 18px rgba(56, 189, 248, 0.35)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>➕</span> Создать этап
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const uncompletedIdx = evtStages.findIndex(s => s.status !== 'Завершено');
                          if (uncompletedIdx !== -1) {
                            const updated = [...evtStages];
                            updated[uncompletedIdx].status = 'Завершено';
                            setEvtStages(updated);
                          } else if (evtStages.length > 0) {
                            alert('Все этапы уже отмечены как завершённые!');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '0.8rem 1.25rem',
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>✓</span> Завершить этап
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EXECUTIVE REPORT & ATTACHMENTS (Фото, Видео, Документы, Схемы) */}
              {modalTab === 'photos' && (
                <div className="photos-attach-area">
                  {viewRole !== 'customer' && (
                    <div className="photo-upload-dropzone" onClick={() => document.getElementById('file-report-input')?.click()}>
                      <div className="dropzone-icon">📂</div>
                      <div className="dropzone-title">Добавить файлы в исполнительный отчёт</div>
                      <div className="dropzone-sub">Загружайте фотофиксации (JPG, PNG), видеозаписи (MP4), акты/сертификаты (PDF, DOCX) и схемы (DWG, ZIP)</div>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.dwg,.zip,.rar"
                        style={{ display: 'none' }}
                        id="file-report-input"
                        onChange={handleAttachPhoto}
                      />
                    </div>
                  )}

                  {evtPhotos.length > 0 ? (
                    <div className="attached-photos-grid">
                      {evtPhotos.map((photo) => (
                        <div key={photo.id} className="attached-photo-card" style={{ position: 'relative' }}>
                          {viewRole !== 'customer' && (
                            <button
                              type="button"
                              className="btn-remove-photo"
                              onClick={(e) => { e.stopPropagation(); handleRemovePhoto(photo.id); }}
                              title="Удалить файл отчёта"
                            >
                              ✕
                            </button>
                          )}
                          <div className="photo-preview-box" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#11111b' }} onClick={() => setPreviewFile({ name: photo.name, url: photo.url, isImg: photo.isImg })}>
                             {photo.isImg && photo.url ? (
                               <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : photo.isVideo ? (
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: '#38bdf8' }}>
                                 <span style={{ fontSize: '1.8rem' }}>▶️</span>
                                 <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>ВИДЕО</span>
                               </div>
                             ) : (
                               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', color: '#f59e0b' }}>
                                 <span style={{ fontSize: '1.8rem' }}>{photo.preview || '📄'}</span>
                                 <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{photo.tag || 'ФАЙЛ'}</span>
                               </div>
                             )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                            <span className="photo-name-tag" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{photo.name}</span>
                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: '#94a3b8' }}>
                              {photo.tag || 'Отчёт'}
                            </span>
                          </div>
                          <span className="photo-meta-time" style={{ fontSize: '0.7rem', color: '#64748b' }}>{photo.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.88rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      <p style={{ margin: 0 }}>Файлы отчёта пока не прикреплены.</p>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Вы можете добавить фотофиксации, видеозаписи со стройплощадки, технические акты и схемы.</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: REAL COST ESTIMATE (Смета) */}
              {modalTab === 'estimate' && !isExecutor && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
                  <div style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '0.9rem 1.2rem',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.05rem' }}>
                        📊 Итоговая смета объекта
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Позиций в смете: {evtEstimateItems.length} шт
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#10b981',
                      textShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                    }}>
                      {(evtTotalSum || evtEstimateItems.reduce((acc, i) => acc + (i.sum || 0), 0)).toLocaleString()} ₸
                    </div>
                  </div>

                  {evtEstimateItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>Смета для данного объекта ещё не расчитана.</p>
                      {viewRole !== 'customer' && (
                        <button
                          type="button"
                          className="sd-btn-orange-gradient"
                          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                          onClick={() => {
                            const defaultItems = [
                              { id: 1, name: 'Подготовительные и изыскательские работы', unit: 'компл.', qty: 1, price: 45000, sum: 45000 },
                              { id: 2, name: 'Основные строительно-монтажные работы', unit: 'услуга', qty: 1, price: 180000, sum: 180000 },
                              { id: 3, name: 'Лабораторный контроль и сертификация', unit: 'протокол', qty: 1, price: 35000, sum: 35000 }
                            ];
                            setEvtEstimateItems(defaultItems);
                            setEvtTotalSum(260000);
                          }}
                        >
                          + Сформировать смету
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="sd-table-container" style={{ maxHeight: '280px' }}>
                      <table className="sd-estimate-table">
                        <thead>
                          <tr>
                            <th>Наименование работ / материалов</th>
                            <th style={{ width: '50px' }}>Ед.</th>
                            <th style={{ width: '65px' }}>Кол-во</th>
                            <th style={{ width: '95px' }}>Цена (₸)</th>
                            <th style={{ width: '100px' }}>Сумма (₸)</th>
                            {viewRole !== 'customer' && <th style={{ width: '30px' }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {evtEstimateItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <input
                                  type="text"
                                  className="sd-table-input"
                                  value={item.name}
                                  disabled={viewRole === 'customer'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEvtEstimateItems(prev => prev.map(i => i.id === item.id ? { ...i, name: val } : i));
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="sd-table-input sd-center-text"
                                  style={{ width: '45px' }}
                                  value={item.unit}
                                  disabled={viewRole === 'customer'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEvtEstimateItems(prev => prev.map(i => i.id === item.id ? { ...i, unit: val } : i));
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="sd-table-input sd-center-text"
                                  value={item.qty}
                                  disabled={viewRole === 'customer'}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setEvtEstimateItems(prev => {
                                      const next = prev.map(i => {
                                        if (i.id === item.id) {
                                          const newSum = Math.round(val * (i.price || 0));
                                          return { ...i, qty: val, sum: newSum };
                                        }
                                        return i;
                                      });
                                      const newTotal = next.reduce((acc, curr) => acc + (curr.sum || 0), 0);
                                      setEvtTotalSum(newTotal);
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="sd-table-input sd-right-text"
                                  value={item.price}
                                  disabled={viewRole === 'customer'}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setEvtEstimateItems(prev => {
                                      const next = prev.map(i => {
                                        if (i.id === item.id) {
                                          const newSum = Math.round((i.qty || 0) * val);
                                          return { ...i, price: val, sum: newSum };
                                        }
                                        return i;
                                      });
                                      const newTotal = next.reduce((acc, curr) => acc + (curr.sum || 0), 0);
                                      setEvtTotalSum(newTotal);
                                      return next;
                                    });
                                  }}
                                />
                              </td>
                              <td className="sd-text-orange font-bold text-right" style={{ paddingRight: '6px' }}>
                                {(item.sum || 0).toLocaleString()} ₸
                              </td>
                              {viewRole !== 'customer' && (
                                <td>
                                  <button
                                    type="button"
                                    className="sd-row-del-btn"
                                    onClick={() => {
                                      setEvtEstimateItems(prev => {
                                        const next = prev.filter(i => i.id !== item.id);
                                        const newTotal = next.reduce((acc, curr) => acc + (curr.sum || 0), 0);
                                        setEvtTotalSum(newTotal);
                                        return next;
                                      });
                                    }}
                                    title="Удалить позицию"
                                  >
                                    ✕
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {viewRole !== 'customer' && (
                    <button
                      type="button"
                      className="sd-btn-dark-outline w-100"
                      onClick={() => {
                        const newItem = {
                          id: Date.now(),
                          name: 'Новая позиция работ / материалов',
                          unit: 'шт',
                          qty: 1,
                          price: 10000,
                          sum: 10000
                        };
                        setEvtEstimateItems(prev => {
                          const next = [...prev, newItem];
                          const newTotal = next.reduce((acc, curr) => acc + (curr.sum || 0), 0);
                          setEvtTotalSum(newTotal);
                          return next;
                        });
                      }}
                    >
                      + Добавить строку в смету
                    </button>
                  )}
                </div>
              )}

              {/* TAB 4: EXECUTOR DATA */}
              {modalTab === 'executor' && editingEvent && editingEvent.isLead && evtStatus === 'В пути' && (
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid #10b981', marginTop: '1rem' }}>
                  <h3 style={{ color: '#10b981', marginBottom: '1.5rem', fontSize: '1.2rem' }}>📋 Данные для исполнителя</h3>
                  
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>🛠️ Тип работы:</label>
                    <select className="modal-input" style={{ marginTop: '0.4rem' }} value={leadWorkType} onChange={e => setLeadWorkType(e.target.value)}>
                      <option value="Водопровод">Водопровод</option>
                      <option value="Канализация">Канализация</option>
                      <option value="Септик">Септик</option>
                      <option value="Отопление">Отопление</option>
                      <option value="Дренаж">Дренаж</option>
                      <option value="Ливнёвка">Ливнёвка</option>
                      <option value="Врезка">Врезка</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.2rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>📝 Комментарий к работе (описание задачи):</label>
                    <textarea className="modal-input" rows="4" placeholder="Подробно опишите задачу для бригады или специалиста..." style={{ marginTop: '0.4rem', resize: 'vertical' }} value={evtComments} onChange={(e) => setEvtComments(e.target.value)}></textarea>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.2rem' }}>
                    <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>📸 Фото отчёт (Прикрепить файлы): {evtPhotos.length > 0 ? `(Добавлено: ${evtPhotos.length})` : ''}</label>
                    <div className="photo-upload-dropzone" style={{ marginTop: '0.4rem', minHeight: '120px', padding: '1.5rem' }} onClick={() => document.getElementById('executor-file-input')?.click()}>
                      <div className="dropzone-icon" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📥</div>
                      <div className="dropzone-title" style={{ fontSize: '0.95rem' }}>Нажмите, чтобы прикрепить фото или документы</div>
                      <input type="file" id="executor-file-input" style={{ display: 'none' }} multiple onChange={handleAttachPhoto} />
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {evtEstimateItems.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const basePrice = leadWorkType === 'Септик' ? 350000 : leadWorkType === 'Отопление' ? 850000 : 250000;
                          const defaultItems = [
                            { id: 1, name: `Подготовительные работы (${leadWorkType})`, unit: 'компл.', qty: 1, price: 45000, sum: 45000 },
                            { id: 2, name: `Основные монтажные работы`, unit: 'услуга', qty: 1, price: basePrice, sum: basePrice },
                            { id: 3, name: 'Доставка материалов и спецтехника', unit: 'рейс', qty: 2, price: 25000, sum: 50000 }
                          ];
                          setEvtEstimateItems(defaultItems);
                          setEvtTotalSum(45000 + basePrice + 50000);
                          setModalTab('estimate'); // redirect to estimate to show it!
                        }}
                        style={{ background: 'linear-gradient(90deg, #2563eb, #38bdf8)', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 8px 25px rgba(56, 189, 248, 0.4)' }}
                      >
                        🧠 Рассчитать смету через ИИ
                      </button>
                    ) : (
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700 }}>
                        ✅ Смета успешно рассчитана ИИ. Теперь можно передавать заявку исполнителю!
                      </div>
                    )}
                  </div>
                </div>
              )}
                    </>
                  )}
                </div>
              </div>

              <div className="modal-actions-row" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  {viewRole === 'customer' ? 'Закрыть' : 'Отмена'}
                </button>
                {viewRole !== 'customer' && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    
                    {editingEvent && ((editingEvent.transferredToExecutor || editingEvent.isTransferred || evtStatus === 'Передано специалисту') && !editingEvent.managerApprovedRevision) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: 'auto', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', padding: '0.4rem 0.85rem', borderRadius: '8px', color: '#10b981', fontSize: '0.78rem', fontWeight: 800 }}>
                          ✅ Заявка передана исполнителю
                        </div>
                        <button
                          type="button"
                          onClick={handleReturnToManager}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.4)',
                            padding: '0.45rem 0.9rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer'
                          }}
                          title="Вернуть заявку менеджеру для решения вопросов с клиентом"
                        >
                          🔄 Вернуть менеджеру на пересогласование
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', marginRight: 'auto', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleTransferToSpecialist()} 
                          style={{ 
                            background: 'linear-gradient(90deg, #10b981, #059669)', 
                            color: '#fff', 
                            border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 800, 
                            cursor: 'pointer',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          👥 Передать исполнителю
                        </button>
                        {editingEvent?.isLead && (
                          <button type="button" onClick={handleReturnToManager} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.6rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                            ❌ Вернуть менеджеру
                          </button>
                        )}
                      </div>
                    )}

                    {modalTab !== 'photos' && !(editingEvent && editingEvent.isLead && evtStatus !== 'В пути' && evtStatus !== 'Передано специалисту') && (
                      <button
                        type="button"
                        className="sd-btn-dark"
                        style={{ padding: '0.75rem 1.2rem' }}
                        onClick={() => {
                          if (modalTab === 'info') setModalTab('stages');
                          else if (modalTab === 'stages') setModalTab('estimate');
                          else if (modalTab === 'estimate') setModalTab('photos');
                        }}
                      >
                        Далее →
                      </button>
                    )}
                    <button type="submit" className="btn-submit-pink">
                      💾 {editingEvent ? 'Сохранить изменения' : 'Создать объект'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN FILE PREVIEW MODAL */}
      {previewFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 100000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <button 
            onClick={() => setPreviewFile(null)}
            style={{ position: 'absolute', top: '30px', right: '40px', background: 'transparent', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer', zIndex: 100001, opacity: 0.7, transition: '0.2s' }}
            onMouseOver={(e) => e.target.style.opacity = 1}
            onMouseOut={(e) => e.target.style.opacity = 0.7}
          >
            ✕
          </button>
          
          {previewFile.isImg || previewFile.url ? (
            <img 
              src={previewFile.url || `https://images.unsplash.com/photo-1541888086925-ebca89bba4c9?w=800&q=80`} 
              alt={previewFile.name} 
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
            />
          ) : (
            <div style={{ backgroundColor: '#0f172a', padding: '3rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minWidth: '300px' }}>
              <span style={{ fontSize: '5rem' }}>📄</span>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{previewFile.name}</h3>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Предпросмотр недоступен для этого типа файла</p>
              <button 
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '8px', marginTop: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => alert(`Скачивание файла: ${previewFile.name}`)}
              >
                Скачать файл
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
