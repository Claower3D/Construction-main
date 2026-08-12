import React, { useState, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';
import '../engineer-modal.css';

export default function EngineerDashboardPage({ onBackToHome, initialTab = 'calendar' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'calendar'); // Dynamic tab state

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
  const [modalTab, setModalTab] = useState('info'); // 'info' | 'stages' | 'photos'
  const [evtStages, setEvtStages] = useState([]);
  const [activeStageId, setActiveStageId] = useState(null);
  const [evtPhotos, setEvtPhotos] = useState([]);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageDeadline, setNewStageDeadline] = useState('');
  const [newStageStatus, setNewStageStatus] = useState('Запланировано');

  // Inline stage adding state for the top connected pipeline track
  const [isAddingInlineStage, setIsAddingInlineStage] = useState(false);
  const [inlineStageText, setInlineStageText] = useState('');


  const [objectsSearch, setObjectsSearch] = useState('');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const monthsList = monthNames.map(m => `${m} ${currentYear}`);

  // Scheduled Events state with human-readable deadlines, stage sequence & photo attachments
  const [scheduledEvents, setScheduledEvents] = useState(() => {
    const saved = localStorage.getItem('qazgost_calendar_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse calendar events", e);
      }
    }
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
    localStorage.setItem('qazgost_calendar_events', JSON.stringify(scheduledEvents));
  }, [scheduledEvents]);

  const dayEvents = scheduledEvents[selectedDay] || [];

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
  const [requestsList, setRequestsList] = useState([
    { id: 'REQ-101', client: 'ТОО «Алматы Сити»', type: 'Инспекция монолита', address: 'Алматы, ЖК "Алатау", Блок B', phone: '+7 (701) 555-01-22', status: 'Новая', time: 'Сегодня, 14:30' },
    { id: 'REQ-102', client: 'ИП «Сатов А.В.»', type: 'Приёмка HVAC и электрики', address: 'Караганда, ул. Ленина 42', phone: '+7 (707) 888-44-11', status: 'В обработке', time: 'Завтра, 11:00' },
    { id: 'REQ-103', client: 'ТОО «QazGost»', type: 'Экспертиза фундамента', address: 'Астана, БЦ "Нурлы", ов. 402', phone: '+7 (777) 123-99-00', status: 'Принято', time: '8 Августа, 10:00' }
  ]);

  const [objectsList, setObjectsList] = useState([
    { id: 'OBJ-201', client: 'ЖК "Алатау 2"', address: 'Алматы, проспект Достык 105', budget: 45000000, factCost: 28000000, progress: 65, status: 'В работе', brigade: 'Бригада: Александр Экскаватор', photosCount: 18 },
    { id: 'OBJ-202', client: 'БЦ "Нурлы Тау"', address: 'Астана, ул. Достык 8', budget: 120000000, factCost: 95000000, progress: 80, status: 'В работе', brigade: 'Бригада: Володя Мастер', photosCount: 42 },
    { id: 'OBJ-203', client: 'Коттеджный поселок "Северный"', address: 'Караганда, мкр. Орталык 14', budget: 18000000, factCost: 18000000, progress: 100, status: 'Завершено', brigade: 'Бригада: Я', photosCount: 25 }
  ]);

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

  const [notificationsList, setNotificationsList] = useState([
    { id: 'NOT-1', icon: '📬', title: 'Новая заявка', text: 'Поступила новая заявка на приёмку сетей от ИП «Сатов А.В.»', time: '10 мин назад', unread: true },
    { id: 'NOT-2', icon: '⚠️', title: 'Дедлайн инспекции', text: 'Сегодня до 18:00 — Инспекция монолита ТОО «Алматы Сити»', time: '1 час назад', unread: true },
    { id: 'NOT-3', icon: '✅', title: 'Акт КС-2 подписан', text: 'Заказчик подписал Акт выполненных работ по объекту БЦ "Нурлы Тау"', time: 'Вчера', unread: false }
  ]);

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
    setShowAddModal(true);
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

  // Handlers for Photo Operations
  const handleAttachPhoto = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      const newItems = Array.from(files).map((f, idx) => ({
        id: `p-${Date.now()}-${idx}`,
        name: f.name,
        tag: 'Фотофиксация',
        time: 'Только что',
        preview: f.type.startsWith('image/') ? '🖼️' : '📄',
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        isImg: f.type.startsWith('image/')
      }));
      setEvtPhotos([...evtPhotos, ...newItems]);
    } else {
      const sample = {
        id: `p-${Date.now()}`,
        name: `Снимок_объекта_${evtPhotos.length + 1}.jpg`,
        tag: 'Контроль качества',
        time: 'Только что',
        preview: '📸'
      };
      setEvtPhotos([...evtPhotos, sample]);
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

  const handleRemovePhoto = (photoId) => {
    setEvtPhotos(evtPhotos.filter(p => p.id !== photoId));
  };


  // Save Event (Create or Update)
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
      photos: evtPhotos
    };

    if (editingEvent) {
      // Update existing event
      setScheduledEvents(prev => ({
        ...prev,
        [selectedDay]: (prev[selectedDay] || []).map(item =>
          item.id === editingEvent.id ? { ...item, ...eventPayload } : item
        )
      }));
    } else {
      // Create new event
      const newEvt = {
        id: Date.now(),
        ...eventPayload
      };

      setScheduledEvents(prev => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), newEvt]
      }));
    }

    setShowAddModal(false);
  };


  // Quick Change Status (1-click status cycle)
  const handleQuickStatusChange = (evtId, newStatus) => {
    setScheduledEvents(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map(item =>
        item.id === evtId ? { ...item, status: newStatus } : item
      )
    }));
  };

  // Delete Event
  const handleDeleteEvent = (evtId) => {
    if (!window.confirm('Удалить данное событие из календаря?')) return;
    setScheduledEvents(prev => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(item => item.id !== evtId)
    }));
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

  return (
    <div className="engineer-cabinet-root" style={{ flexDirection: 'row' }}>
      {/* Dynamic Animated Particles Background */}
      <AnimatedBackground />

      {/* LEFT SIDEBAR PANEL (Now full height) */}
      {sidebarOpen && (
        <aside className="engineer-sidebar" style={{ height: '100vh', zIndex: 10 }}>
          <div className="engineer-org-card">
            <div className="org-icon">👤</div>
            <div className="org-info">
              <h4 className="org-name">ТОО «QazGost»</h4>
              <span className="org-sub">📍 Караганда • ТОО ⇄</span>
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
      )}

      {/* MAIN RIGHT COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* NEW BREADCRUMBS HEADER */}
        <header className="main-top-header" style={{ flexShrink: 0, width: '100%', zIndex: 10 }}>
          <div className="header-breadcrumbs">
            Инженер <span>/</span> Управление <span>/</span> {getTabName(activeTab)}
          </div>
          <div className="header-actions">
            <button className="btn-glass-home" onClick={onBackToHome}>
              🏠 На сайт
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* INNER TITLE BLOCK (was engineer-top-header) */}
          <div className="engineer-top-header" style={{ position: 'static', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <div className="header-left-wrap">
              <button
                className="btn-sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Скрыть/показать боковое меню"
              >
                {sidebarOpen ? '◀ Меню' : '▶ Меню'}
              </button>
              <div className="engineer-header-title">
                <span className="engineer-avatar-badge">👷</span>
                <div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>Кабинет инженера v2.0</h1>
                  <span className="engineer-sub-tag" style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>Технический надзор & Экспертиза СНиП РК</span>
                </div>
              </div>
            </div>
            <div className="header-right-wrap">
               <span className="live-status-pill">🟢 Синхронизировано СНиП РК</span>
            </div>
          </div>

        {/* MAIN WORKSPACE PANEL SWITCHER */}
        <main className="engineer-main-content" style={{ flex: 1 }}>
          {/* ======================================================= */}
          {/* 1. CALENDAR TAB (📅 Календарь)                          */}
          {/* ======================================================= */}
          {activeTab === 'calendar' && (
            <div className="tab-view-container">
              {/* TOP HEADER BAR */}
              <div className="calendar-top-bar">
                <div className="calendar-header-left">
                  <button className="btn-back-square" onClick={onBackToHome} title="На главную">
                    ←
                  </button>
                  <h2 className="calendar-section-title">
                    <span className="title-icon-badge">🗓️</span> Календарь работ
                  </h2>
                </div>

                <div className="calendar-controls-right">
                  <div className="view-mode-tabs">
                    <button
                      className={`view-tab ${calendarViewMode === 'month' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('month')}
                    >
                      Месяц
                    </button>
                    <button
                      className={`view-tab ${calendarViewMode === 'week' ? 'active' : ''}`}
                      onClick={() => setCalendarViewMode('week')}
                    >
                      Неделя
                    </button>
                  </div>

                  <div className="month-navigator">
                    <button
                      className="btn-nav-arrow-sm"
                      onClick={() => setMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
                    >
                      ‹
                    </button>
                    <span className="month-nav-label">{monthsList[monthIndex]}</span>
                    <button
                      className="btn-nav-arrow-sm"
                      onClick={() => setMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
                    >
                      ›
                    </button>
                  </div>

                  <button
                    className="btn-today-indigo"
                    onClick={() => {
                      setMonthIndex(7); // August 2026
                      setSelectedDay(6);
                    }}
                  >
                    Сегодня
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
                      const evts = scheduledEvents[dayNum] || [];
                      const isSel = selectedDay === dayNum;
                      return (
                        <div
                          key={`curr-${dayNum}`}
                          className={`month-day-cell ${isSel ? 'selected-day' : ''}`}
                          onClick={() => setSelectedDay(dayNum)}
                        >
                          <span className="day-number-tag">{dayNum}</span>

                          {/* Render Event Pill Badges (Grouped by quantity and designation) */}
                          {evts.length > 0 && (() => {
                            const grouped = evts.reduce((acc, e) => {
                              const icon = e.icon || (
                                e.type === 'active_project' ? '🏭' : 
                                e.type === 'work_stage' ? '🟣' : 
                                e.type === 'deadline' ? '🔴' : 
                                e.type === 'in_review' ? '🟡' : 
                                e.type === 'completed' ? '🟢' : '📜'
                              );
                              if (!acc[e.type]) acc[e.type] = { count: 0, events: [], icon };
                              acc[e.type].count++;
                              acc[e.type].events.push(e);
                              return acc;
                            }, {});
                            
                            return (
                              <div className="day-events-wrapper" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px' }}>
                                {Object.entries(grouped).map(([type, data]) => (
                                  <div
                                    key={type}
                                    className={`event-cell-pill ${type}`}
                                    title={data.events.map(e => e.title).join('\n')}
                                    onClick={(evtClick) => {
                                      evtClick.stopPropagation();
                                      setSelectedDay(dayNum);
                                    }}
                                    style={{ width: 'auto', padding: '2px 6px', justifyContent: 'center' }}
                                  >
                                    <span style={{ fontSize: '0.8rem' }}>{data.icon}</span>
                                    <span className="pill-text" style={{ fontWeight: 'bold' }}>{data.count}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
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
                      <button className="btn-sm-add" onClick={handleOpenCreateModal}>
                        + Добавить
                      </button>
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
                                <button className="btn-evt-edit" onClick={() => handleOpenEditModal(evt)} title="Изменить">
                                  ✏️
                                </button>
                                <button className="btn-evt-delete" onClick={() => handleDeleteEvent(evt.id)} title="Удалить">
                                  🗑️
                                </button>
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
                        <span className="dot-indicator purple" />
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
                <button className="btn-pink-action" onClick={() => alert('Форма добавления нового материала')}>
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
                  <button className="btn-pink-action" onClick={() => alert('Формирование PDF Акта КС-2')}>
                    📄 Сформировать PDF
                  </button>
                </div>
                <div className="report-glass-card">
                  <h4 className="report-card-title">🖼️ Фотоотчёт для клиента</h4>
                  <p className="report-card-desc">До / Во время / После — автоматический PDF</p>
                  <button className="btn-pink-action" onClick={() => alert('Сборка фотоотчета для заказчика')}>
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
                    <button className="btn-pink-action" onClick={() => alert('Экспорт объектов в Excel')}>
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
                  <button className="btn-pink-action" onClick={() => alert('Форма добавления расхода')}>
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
                <button className="btn-pink-action" onClick={runAiPipeline}>
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
                <button className="btn-pink-action" onClick={() => alert('Ввод новых замеров')}>
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
                  <button className="btn-pink-action" onClick={() => alert('Смета утверждена!')}>✅ Утвердить смету</button>
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
                <button className="btn-pink-action" onClick={() => alert('Форма добавления новой бригады')}>
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
                <div className="stat-card stat-purple">
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
                    <div className="evt-actions-bar" style={{ marginTop: '0.85rem' }}>
                      <div className="evt-btn-group" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-evt-action" style={{ flex: 1 }} onClick={() => alert(`Заявка ${req.id} принята в работу!`)}>
                          ✅ Принять заявку
                        </button>
                        <button className="btn-evt-edit" onClick={() => alert(`Просмотр деталей заявки ${req.id}`)}>
                          📋 Карточка
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
                  <button className="btn-pink-action" onClick={handleOpenCreateModal}>+ Новый объект</button>
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
                <button className="btn-pink-action" onClick={() => alert('Загрузка фото с камеры / галереи')}>
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

                <button className="btn-pink-action" style={{ marginTop: '1.25rem', width: '100%' }} onClick={() => alert('Фотоотчет собран и отправлен клиенту!')}>
                  📤 Отправить полный фотоотчёт клиенту
                </button>
              </div>
            </div>
          )}
        </main>
        </div>
      </div>

      {/* Interactive Create / Edit Event Modal with Stage Sequence & Photo Attachments */}
      {showAddModal && (
        <div className="modal-overlay-bg" onClick={() => setShowAddModal(false)}>
          <div className="add-event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? '✏️ Редактировать объект' : `+ Новый объект на ${selectedDay} ${monthsList[monthIndex]}`}</h3>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* TOP CONNECTED PIPELINE TRACK (Exact connected pill style matching screenshot with + button) */}
            <div className="crm-pipeline-box">
              <div className="pipeline-header-row">
                <span className="pipeline-header-title">
                  <span>⚙️</span> Последовательность этапов ({evtStages.length})
                </span>
                <span className="pipeline-progress-badge">
                  {Math.round((evtStages.filter(s => s.status === 'Завершено').length / (evtStages.length || 1)) * 100)}% Выполнено
                </span>
              </div>

              <div className="crm-pipeline-track">
                {evtStages.map((st, idx) => {
                  const isCompleted = st.status === 'Завершено';
                  const isActive = st.status === 'В работе';
                  const isReview = st.status === 'Ожидает приёмки';

                  return (
                    <React.Fragment key={st.id}>
                      {idx > 0 && (
                        <span className={`pipeline-line-connector ${evtStages[idx - 1].status === 'Завершено' ? 'active-line' : ''}`} />
                      )}

                      <div
                        className={`crm-stage-pill ${isCompleted ? 'status-completed' : isActive ? 'status-active' : isReview ? 'status-review' : 'status-planned'} ${activeStageId === st.id ? 'is-active-stage' : ''}`}
                        onClick={() => {
                          setActiveStageId(activeStageId === st.id ? null : st.id);
                        }}
                        title="Нажмите для просмотра деталей этапа"
                      >
                        {isCompleted && <span className="pill-check-icon">✓</span>}
                        <span className="pill-title-text">{st.title.replace(/^\d+\.\s*/, '')}</span>
                        <button
                          type="button"
                          className="pill-quick-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStage(st.id);
                          }}
                          title="Удалить этап"
                        >
                          ✕
                        </button>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* CONNECTING LINE TO PLUS (+) BUTTON */}
                {evtStages.length > 0 && (
                  <span className={`pipeline-line-connector ${evtStages[evtStages.length - 1].status === 'Завершено' ? 'active-line' : ''}`} />
                )}

                {/* INLINE PLUS (+) BUTTON IN THE CONNECTED ROW */}
                {isAddingInlineStage ? (
                  <div className="inline-add-stage-form">
                    <input
                      type="text"
                      className="inline-stage-input"
                      placeholder="Название нового этапа..."
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
                    />
                    <button type="button" className="btn-save-inline-stage" onClick={handleConfirmInlineStage} title="Сохранить этап">✓</button>
                    <button type="button" className="btn-cancel-inline-stage" onClick={() => setIsAddingInlineStage(false)} title="Отмена">✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="crm-stage-pill btn-add-pipeline-stage"
                      onClick={() => setIsAddingInlineStage(true)}
                      title="Добавить новый этап в последовательность"
                    >
                      <span className="pill-plus-icon">+</span>
                      <span>Добавить этап</span>
                    </button>
                    {evtStages.length > 0 && evtStages[evtStages.length - 1].status !== 'Завершено' && (
                      <button
                        type="button"
                        className="crm-stage-pill"
                        style={{ marginLeft: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        onClick={() => {
                          const updated = [...evtStages];
                          updated[updated.length - 1].status = 'Завершено';
                          setEvtStages(updated);
                        }}
                        title="Завершить текущий этап без добавления нового"
                      >
                        <span className="pill-check-icon">✓</span>
                        Завершить этап
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STAGE DETAILS PANEL (SHOWN ONLY WHEN A STAGE IS SELECTED) */}
            {activeStageId && (() => {
              const activeStage = evtStages.find(s => s.id === activeStageId);
              if (!activeStage) return null;
              return (
                <div className="stage-details-panel">
                  <div className="stage-details-header">
                    <div className="stage-details-title">
                      <span>🟣</span> Детали этапа: {activeStage.title}
                    </div>
                    <select
                      className="stage-status-select"
                      value={activeStage.status}
                      onChange={(e) => handleChangeStageStatus(activeStage.id, e.target.value)}
                    >
                      <option value="Запланировано">Запланировано</option>
                      <option value="В работе">В работе</option>
                      <option value="Ожидает приёмки">Ожидает приёмки</option>
                      <option value="Завершено">Завершено</option>
                    </select>
                  </div>
                  
                  <div className="stage-details-content">
                    {/* Left Column: Description */}
                    <div className="stage-field-group">
                      <label className="stage-field-label">Информация / Заметки</label>
                      <textarea
                        className="stage-textarea"
                        placeholder="Добавьте описание или заметки по текущему этапу..."
                        value={activeStage.description || ''}
                        onChange={(e) => {
                          setEvtStages(evtStages.map(s => s.id === activeStageId ? { ...s, description: e.target.value } : s));
                        }}
                      ></textarea>
                    </div>

                    {/* Right Column: Files */}
                    <div className="stage-field-group">
                      <label className="stage-field-label">Материалы (Фото / Документы)</label>
                      <div className="stage-files-area">
                        <label className="stage-dropzone">
                          <div className="stage-dropzone-icon">📁</div>
                          <div className="stage-dropzone-text">Нажмите для загрузки файлов</div>
                          <input type="file" multiple style={{ display: 'none' }} onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const newFiles = Array.from(e.target.files).map(f => ({ 
                                  name: f.name,
                                  url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                                  isImg: f.type.startsWith('image/')
                                }));
                              setEvtStages(evtStages.map(s => s.id === activeStageId ? { ...s, photos: [...(s.photos || []), ...newFiles] } : s));
                            }
                          }} />
                        </label>
                        
                        {(activeStage.photos && activeStage.photos.length > 0) && (
                          <div className="stage-files-list">
                            {activeStage.photos.map((p, idx) => (
                              <div key={idx} className="stage-file-chip">
                                <span>{p.name.endsWith('.jpg') || p.name.endsWith('.png') ? '🖼️' : '📄'}</span>
                                {p.name}
                                <span className="stage-file-chip-del" onClick={() => {
                                  setEvtStages(evtStages.map(s => {
                                    if (s.id === activeStageId) {
                                      const updated = [...s.photos];
                                      updated.splice(idx, 1);
                                      return { ...s, photos: updated };
                                    }
                                    return s;
                                  }));
                                }}>✕</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB BUTTONS (for main event) */}
            <div className="modal-nav-tabs">
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'info' ? 'active' : ''}`}
                onClick={() => setModalTab('info')}
              >
                📋 Основные данные
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'stages' ? 'active' : ''}`}
                onClick={() => setModalTab('stages')}
              >
                🏗️ Этапы ({evtStages.length})
              </button>
              <button
                type="button"
                className={`modal-nav-tab ${modalTab === 'photos' ? 'active' : ''}`}
                onClick={() => setModalTab('photos')}
              >
                📸 Фото ({evtPhotos.length})
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="modal-form-body">
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🏷️ Тип события / Категория:</label>
                      <select value={evtType} onChange={(e) => setEvtType(e.target.value)} className="modal-select">
                        <option value="active_project">🔵 Активный проект</option>
                        <option value="work_stage">🟣 Этап работ</option>
                        <option value="deadline">🔴 Дедлайн</option>
                        <option value="in_review">🟡 На проверке</option>
                        <option value="completed">🟢 Завершено</option>
                        <option value="object">🏗️ Объект технадзора</option>
                        <option value="request">📬 Заявка на проверку</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📊 Статус (Прогресс):</label>
                      <select value={evtStatus} onChange={(e) => setEvtStatus(e.target.value)} className="modal-select">
                        <option value="В работе">🟡 В работе</option>
                        <option value="Ожидает приёмки">⏳ Ожидает приёмки</option>
                        <option value="Завершено">🟢 Завершено</option>
                        <option value="Просрочено">🔴 Просрочено</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📝 Название события / инспекции:</label>
                    <input
                      type="text"
                      placeholder="Например: Инспекция монолита и армопояса"
                      value={evtTitle}
                      onChange={(e) => setEvtTitle(e.target.value)}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📅 Дедлайн (Срок):</label>
                      <input
                        type="text"
                        placeholder="Сегодня до 18:00 / Завтра до 12:00"
                        value={evtDeadline}
                        onChange={(e) => setEvtDeadline(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>⏰ Время проведения:</label>
                      <input
                        type="text"
                        placeholder="10:00 - 12:00"
                        value={evtTime}
                        onChange={(e) => setEvtTime(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>👷 Подрядчик / Организация:</label>
                      <input
                        type="text"
                        placeholder="ТОО Алматы Сити"
                        value={evtContractor}
                        onChange={(e) => setEvtContractor(e.target.value)}
                        className="modal-input"
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📍 Адрес объекта:</label>
                      <input
                        type="text"
                        placeholder="Алматы, ЖК Алатау 2, Блок B"
                        value={evtLocation}
                        onChange={(e) => setEvtLocation(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STAGES SEQUENCE MANAGER */}
              {modalTab === 'stages' && (
                <div className="stages-list-container">
                  <label className="input-label" style={{ color: '#06b6d4' }}>
                    Последовательность этапов работ на объекте:
                  </label>

                  {evtStages.map((stage, idx) => (
                    <div key={stage.id} className="stage-card-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className="stage-left-info">
                          <div className="stage-num-badge">{idx + 1}</div>
                          <div>
                            <h5 className="stage-title-text">{stage.title}</h5>
                            <span className="stage-deadline-sub">⏰ Срок: {stage.deadline}</span>
                          </div>
                        </div>

                        <div className="stage-right-actions">
                          <select
                            value={stage.status}
                            onChange={(e) => handleChangeStageStatus(stage.id, e.target.value)}
                            className="select-stage-status"
                          >
                            <option value="В работе">🟡 В работе</option>
                            <option value="Ожидает приёмки">⏳ Приёмка</option>
                            <option value="Завершено">🟢 Завершено</option>
                            <option value="Запланировано">⚪ Запланировано</option>
                          </select>

                          <button
                            type="button"
                            className="btn-del-stage"
                            onClick={() => handleDeleteStage(stage.id)}
                            title="Удалить этап"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* FILE PREVIEWS (Only show if there are files) */}
                      {(stage.photos && stage.photos.length > 0) && (
                        <div style={{ display: 'flex', gap: '0.5rem', paddingLeft: '2.5rem', flexWrap: 'wrap' }}>
                          {stage.photos.map((p, pIdx) => {
                             const isImg = p.name.match(/\.(jpeg|jpg|gif|png)$/i);
                             const imgUrl = p.url || (isImg ? `https://images.unsplash.com/photo-1541888086925-ebca89bba4c9?w=100&q=80&random=${pIdx}` : null);
                             return (
                               <div key={pIdx} 
                                 onClick={() => setPreviewFile({ name: p.name, url: imgUrl, isImg })}
                                 style={{ 
                                 width: '40px', height: '40px', borderRadius: '6px', 
                                 backgroundColor: '#1e293b', border: '1px solid #334155',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                                 overflow: 'hidden', title: p.name, cursor: 'pointer'
                               }}>
                                 {isImg ? (
                                   <img src={imgUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                 ) : (
                                   <span style={{ fontSize: '1.2rem' }}>📄</span>
                                 )}
                               </div>
                             );
                          })}
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                             {stage.photos.length} прикреплённых файл(ов)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Stage Inline Box */}
                  <div className="add-stage-card-box">
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>+ Добавить новый этап</strong>
                    <div className="add-stage-inputs-row">
                      <input
                        type="text"
                        placeholder="Название этапа (например: Монтаж кровли)"
                        value={newStageTitle}
                        onChange={(e) => setNewStageTitle(e.target.value)}
                        className="modal-input"
                      />
                      <input
                        type="text"
                        placeholder="Дедлайн"
                        value={newStageDeadline}
                        onChange={(e) => setNewStageDeadline(e.target.value)}
                        className="modal-input"
                      />
                      <select
                        value={newStageStatus}
                        onChange={(e) => setNewStageStatus(e.target.value)}
                        className="modal-select"
                      >
                        <option value="Запланировано">⚪ Запланировано</option>
                        <option value="В работе">🟡 В работе</option>
                        <option value="Ожидает приёмки">⏳ Приёмка</option>
                        <option value="Завершено">🟢 Завершено</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="btn-add-stage-confirm"
                      onClick={handleAddStage}
                    >
                      ➕ Сохранить новый этап
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: PHOTOS & ATTACHMENTS */}
              {modalTab === 'photos' && (
                <div className="photos-attach-area">
                  <div className="photo-upload-dropzone" onClick={handleAttachPhoto}>
                    <div className="dropzone-icon">📸</div>
                    <div className="dropzone-title">Прикрепить фотофиксацию / исполнительную схему</div>
                    <div className="dropzone-sub">Нажмите для выбора снимков объекта или перетащите файлы</div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="file-photo-input"
                      onChange={handleAttachPhoto}
                    />
                  </div>

                  {evtPhotos.length > 0 ? (
                    <div className="attached-photos-grid">
                      {evtPhotos.map((photo) => (
                        <div key={photo.id} className="attached-photo-card">
                          <button
                            type="button"
                            className="btn-remove-photo"
                            onClick={() => handleRemovePhoto(photo.id)}
                            title="Удалить фото"
                          >
                            ✕
                          </button>
                          <div className="photo-preview-box" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => setPreviewFile({ name: photo.name, url: photo.url, isImg: photo.isImg })}>
                             {photo.isImg && photo.url ? (
                               <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               photo.preview || '📸'
                             )}
                          </div>
                          <span className="photo-name-tag">{photo.name}</span>
                          <span className="photo-meta-time">{photo.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Снимки пока не прикреплены. Вы можете добавить фотографии для отчёта технадзора.
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions-row" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Отмена</button>
                <button type="submit" className="btn-submit-pink">
                  {editingEvent ? 'Сохранить изменения' : 'Создать объект'}
                </button>
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
