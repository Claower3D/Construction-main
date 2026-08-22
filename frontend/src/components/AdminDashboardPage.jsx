import React, { useState, useEffect } from 'react';
import AnimatedBackground from './AnimatedBackground';
import EngineerDashboardPage from './EngineerDashboardPage';
import CompanyDashboardPage from './CompanyDashboardPage';
import AdminDashboardModal from './AdminDashboardModal';
import FeaturePageModule from './FeaturePageModule';
import CrmPage from './CrmPage';
import BuildingConstructionPage from './BuildingConstructionPage';

export default function AdminDashboardPage({ onBackToHome, onOpenEngineer, userRole = 'customer', currentUser }) {
  // Active selected role ('customer' | 'executor' | 'engineer' | 'company' | 'manager' | 'admin')
  const [selectedRole, setSelectedRole] = useState(() => {
    if (['customer', 'executor', 'engineer', 'company', 'manager', 'admin'].includes(userRole)) {
      return userRole;
    }
    return currentUser?.role || 'customer';
  });

  // Active opened tool/module
  const [selectedItemId, setSelectedItemId] = useState(() => {
    if (userRole === 'crm' || userRole === 'manager') return 'mgr-crm';
    if (userRole === 'admin') return 'adm-prices';
    if (userRole === 'company') return 'comp-profile';
    return null;
  });
  const [selectedItemObject, setSelectedItemObject] = useState(null);
  const [embeddedModule, setEmbeddedModule] = useState(() => {
    if (userRole === 'crm' || userRole === 'manager') return 'crm';
    if (userRole === 'admin') return 'admin_panel';
    if (userRole === 'company') return 'company';
    return null;
  });

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Roles Definition
  const roles = [
    {
      id: 'builder',
      title: 'Я Застройщик (VIP)',
      shortLabel: 'Застройщик',
      icon: '🏗️',
      desc: 'Капитальное строительство зданий, ПСД, сметы СНиП и генподряд',
      color: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.45)',
      badge: 'VIP'
    },
    {
      id: 'customer',
      title: 'Я Заказчик',
      shortLabel: 'Заказчик',
      icon: '📋',
      desc: 'Создаю заказы, выбираю исполнителей, принимаю работу',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      badge: ''
    },
    {
      id: 'executor',
      title: 'Я Исполнитель',
      shortLabel: 'Исполнитель',
      icon: '🔧',
      desc: 'Ищу заказы, отправляю предложения, выполняю работы',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.45)',
      badge: ''
    },
    {
      id: 'engineer',
      title: 'Я Инженер',
      shortLabel: 'Инженер',
      icon: '👷',
      desc: 'Принимаю заявки, разрабатываю проектную документацию',
      color: '#2563eb',
      glow: 'rgba(37, 99, 235, 0.45)',
      badge: ''
    },
    {
      id: 'manager',
      title: 'Я Менеджер CRM',
      shortLabel: 'Менеджер',
      icon: '💼',
      desc: 'Управление лидами, клиентами, сделками и CRM-аналитикой',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.45)',
      badge: 'CRM'
    },
    {
      id: 'company',
      title: 'Я Компания',
      shortLabel: 'Компания',
      icon: '🏢',
      desc: 'Управление БИН, сотрудниками и объектами организации',
      color: '#0ea5e9',
      glow: 'rgba(14, 165, 233, 0.45)',
      badge: 'ТОО'
    },
    {
      id: 'admin',
      title: 'Я Администратор',
      shortLabel: 'Админ',
      icon: '⚙️',
      desc: 'Управление платформой, прайсами, модерацией и арбитражем',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      badge: 'ROOT'
    },
    {
      id: 'analyst',
      title: 'Я Аналитик',
      shortLabel: 'Аналитик',
      icon: '📊',
      desc: 'Финальная отчётность, проверка документации, PDF-экспорт',
      color: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.45)',
      badge: 'QA'
    }
  ];

  // Dynamic cards configuration for each role
  const roleCardsData = {
    builder: [
      { id: 'b-objects', title: 'Мои строительные объекты', icon: '🏢', desc: 'Управление портфелем ЖК, БЦ и коттеджных городков с 3D BIM-моделями', btnText: '🏢 Мои объекты', btnGradient: 'linear-gradient(90deg, #6366f1, #3b82f6)' },
      { id: 'b-create', title: 'Создать объект (СНиП)', icon: '➕', desc: 'Выбор типа объекта, этажности и проверка допуска компаний ГАСК', btnText: '➕ Создать объект', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
      { id: 'b-wbs', title: 'Выбор СМР & Оценка', icon: '📐', desc: 'WBS-калькулятор стоимости работ по сборникам ГЭСН-2026 РК', btnText: '📐 Калькулятор СМР', btnGradient: 'linear-gradient(90deg, #38bdf8, #2563eb)' },
      { id: 'b-audit', title: 'Инженерный фото-аудит', icon: '🔍', desc: 'AI-проверка чертежей КЖ/АР, замечания технадзора и дефектовка', btnText: '🔍 AI Экспертиза', btnGradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)' },
      { id: 'b-lots', title: 'Лоты & Тендеры', icon: '📦', desc: 'Публикация строительных лотов в "Мои Заказы Строительство"', btnText: '📦 Лоты и тендеры', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
      { id: 'b-docs', title: 'Сметы & Документы PDF', icon: '📄', desc: 'Локальные сметы СНиП, аналитика прогресса и акты КС-2/КС-3', btnText: '📄 Скачать PDF', btnGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)' },
      { id: 'b-contractors', title: 'Реестр подрядчиков', icon: '🛡️', desc: 'Проверка лицензий ГАСК I/II категории, БИН и контакты ГИП', btnText: '🛡️ База подрядчиков', btnGradient: 'linear-gradient(90deg, #0ea5e9, #10b981)' },
    ],

    customer: [
      { id: 'c-materials', title: 'Маркетплейс материалов', icon: '🧱', desc: 'Оптовые и розничные стройматериалы от заводов РК: цемент, кирпич, арматура, смеси', btnText: '🧱 Открыть маркетплейс', btnGradient: 'linear-gradient(90deg, #10b981, #3b82f6)' },
      { id: 'c-estimate', title: 'Оценка стоимости', icon: '📊', desc: 'Загрузите фото → AI-анализ → смета за 2 сек... 3 сценария цены', btnText: '🚀 Начать оценку', btnGradient: 'linear-gradient(90deg, #38bdf8, #2563eb)' },
      { id: 'c-inspect', title: 'Проверка дефектов', icon: '🔍', desc: 'Трещины, влага, плесень. AI-отчёт + план устранения по ГОСТ РК', btnText: '🔍 Начать проверку', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
      { id: 'c-vip', title: 'Строительство зданий', icon: '🏗️', desc: 'ПСД, ВВР-документация, сметы полного цикла и генподряд VIP', btnText: '⭐ Открыть', btnGradient: 'linear-gradient(90deg, #6366f1, #2563eb)' },
      { id: 'c-engineering', title: 'Инженерные решения', icon: '⚙️', desc: 'Электрика, сантехника, HVAC, слаботочные системы и технадзор', btnText: '⚡ Выбрать', btnGradient: 'linear-gradient(90deg, #38bdf8, #93c5fd)' },
      { id: 'c-orders', title: 'Мои заказы', icon: '📬', desc: 'Просмотр активных заявок, откликов мастеров и статусов работ', btnText: '📗 Открыть заказы', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
      { id: 'c-wallet', title: 'Мой кошелёк', icon: '💳', desc: 'Баланс, безопасные эскроу-счета, пополнение и вывод средств', btnText: '💳 Открыть кошелёк', btnGradient: 'linear-gradient(90deg, #2563eb, #f59e0b)' },
      { id: 'c-equipment', title: 'Маркетплейс техники', icon: '🚜', desc: 'Аренда экскаваторов, кранов, самосвалов по всему Казахстану', btnText: '🚜 Открыть технику', btnGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)' },
      { id: 'c-catalog', title: 'Каталог подрядчиков', icon: '📒', desc: 'Реестр проверенных специалистов и строительных компаний по ИИН/БИН', btnText: '📒 Найти мастеров', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
      { id: 'c-volume', title: 'Расчёт объёмов (BOM)', icon: '📏', desc: 'Автоматический расчёт площадей и спецификации стройматериалов', btnText: '📐 Рассчитать', btnGradient: 'linear-gradient(90deg, #06b6d4, #10b981)' },
      { id: 'c-calendar', title: 'Календарь работ', icon: '📅', desc: 'График выполнения строительно-монтажных работ и инспекций', btnText: '📅 График', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
      { id: 'c-profile', title: 'Моя анкета', icon: '📝', desc: 'Личные данные Заказчика, параметры объекта, бюджет и реквизиты', btnText: '📝 Заполнить', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    ],

    executor: [
      { id: 'e-materials', title: 'Маркетплейс материалов', icon: '🧱', desc: 'Оптовый закуп стройматериалов со скидками до 20% для подрядчиков', btnText: '🧱 Закуп материалов', btnGradient: 'linear-gradient(90deg, #10b981, #3b82f6)' },
      { id: 'e-feed', title: 'Лента заказов', icon: '🌐', desc: 'Живой поток заказов со всего Казахстана без посредников и комиссий', btnText: '🌐 Смотреть заказы', btnGradient: 'linear-gradient(90deg, #38bdf8, #2563eb)' },
      { id: 'e-works', title: 'Мои работы', icon: '📌', desc: 'Портфолио, текущие объекты и онлайн-сдача этапов заказчику', btnText: '📌 Мои объекты', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
      { id: 'e-estimate', title: 'Оценка стоимости', icon: '📸', desc: 'Калькулятор сметных расходов по расценкам ГЭСН 2026', btnText: '🚀 Сметный расчёт', btnGradient: 'linear-gradient(90deg, #38bdf8, #2563eb)' },
      { id: 'e-inspect', title: 'Проверка дефектов', icon: '🔍', desc: 'Экспертная проверка состояния конструкций и дефектоскопия', btnText: '🔍 Проверить дефекты', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
      { id: 'e-soil', title: 'Фото-объёмы грунта', icon: '📐', desc: 'Геодезический 3D-расчёт выемки и насыпи грунта по фото ДО/ПОСЛЕ', btnText: '📸 Рассчитать объём', btnGradient: 'linear-gradient(90deg, #10b981, #0ea5e9)' },
      { id: 'e-engineering', title: 'Инженерные решения', icon: '⚙️', desc: 'Техническая спецификация работ и схемы разводки сетей', btnText: '⚡ Спецификация', btnGradient: 'linear-gradient(90deg, #38bdf8, #93c5fd)' },
      { id: 'e-wallet', title: 'Мой кошелёк', icon: '💳', desc: 'Баланс мастера, выплаты по эскроу и вывод на карту в KZT', btnText: '💳 Открыть кошелёк', btnGradient: 'linear-gradient(90deg, #2563eb, #f59e0b)' },
      { id: 'e-equipment', title: 'Маркетплейс техники', icon: '🚜', desc: 'Поиск спецтехники в аренду и оптовый закуп стройматериалов', btnText: '🚜 Найти технику', btnGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)' },
      { id: 'e-calendar', title: 'Календарь выездов', icon: '📅', desc: 'Расписание выездов на замеры и этапов монтажных работ', btnText: '📅 Расписание', btnGradient: 'linear-gradient(90deg, #ef4444, #10b981)' },
      { id: 'e-catalog', title: 'Каталог специалистов', icon: '📒', desc: 'Рейтинг, отзывы и карточки мастеров в едином реестре РК', btnText: '📒 Реестр мастеров', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
      { id: 'e-vip', title: 'Строительство зданий (VIP)', icon: '🏗️', desc: 'Участие в тендерах генподряда, ПСД и аккредитация I/II категории', btnText: '⭐ VIP Тендеры', btnGradient: 'linear-gradient(90deg, #6366f1, #2563eb)' },
      { id: 'e-profile', title: 'Анкета мастера', icon: '📝', desc: 'Профиль исполнителя, верификация ИИН/БИН, навыки и портфолио', btnText: '📝 Заполнить профиль', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    ],

    engineer: [
      { id: 'ing-main', title: 'Главная панель', icon: '📊', desc: 'Сводный дашборд технического надзора, статусы проверок и графики', btnText: '📊 Открыть панель', btnGradient: 'linear-gradient(90deg, #2563eb, #38bdf8)' },
      { id: 'ing-requests', title: 'Заявки на технадзор', icon: '📬', desc: 'Очередь вызовов инженеров на объекты для проведения инспекций', btnText: '📬 Список заявок', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
      { id: 'ing-objects', title: 'Мои объекты', icon: '🏗️', desc: 'Реестр строящихся объектов под авторским и техническим контролем', btnText: '🏗️ Мои объекты', btnGradient: 'linear-gradient(90deg, #f59e0b, #10b981)' },
      { id: 'ing-ai', title: 'AI-просчёт по СНиП', icon: '🤖', desc: 'Автоматический анализ ПСД на соответствие ГОСТ и СНиП РК', btnText: '🤖 Запустить AI', btnGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)' },
      { id: 'ing-calendar', title: 'Календарь инспекций', icon: '📅', desc: 'План выездных инспекций и график подписания актов КС-2 / КС-3', btnText: '📅 План инспекций', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
      { id: 'ing-expenses', title: 'Контроль расходов', icon: '💰', desc: 'Анализ отклонений от утвержденной сметы и контроль перерасходов', btnText: '💰 Аудит смет', btnGradient: 'linear-gradient(90deg, #06b6d4, #10b981)' },
    ],

    company: [
      { id: 'comp-tree', title: 'Древо ролей и структуры', icon: '🌳', desc: 'Интерактивное семейное древо ролей, отделов, сотрудников и бригад ТОО', btnText: '🌳 Открыть древо', btnGradient: 'linear-gradient(90deg, #10b981, #0ea5e9)' },
      { id: 'comp-profile', title: 'Профиль компании', icon: '📝', desc: 'Управление БИН компании, лицензиями ГСЛ и банковскими реквизитами', btnText: '📝 Реквизиты ТОО', btnGradient: 'linear-gradient(90deg, #0ea5e9, #2563eb)' },
      { id: 'comp-employees', title: 'Сотрудники и бригады', icon: '👥', desc: 'Реестр штатных инженеров, прорабов и привязанных рабочих бригад', btnText: '👥 Управление штатом', btnGradient: 'linear-gradient(90deg, #10b981, #0ea5e9)' },
      { id: 'comp-stats', title: 'Статистика компании', icon: '📈', desc: 'Сводные финансовые показатели, динамика сдачи объектов и KPI', btnText: '📈 Смотреть отчёты', btnGradient: 'linear-gradient(90deg, #2563eb, #38bdf8)' },
    ],

    manager: [
      { id: 'mgr-crm', title: 'CRM-система', icon: '📊', desc: 'Воронка лидов, карточки клиентов, управление компаниями и бригадами', btnText: '📊 Открыть CRM', btnGradient: 'linear-gradient(90deg, #3b82f6, #f59e0b)' },
      { id: 'mgr-reports', title: 'Отчёты по продажам', icon: '📄', desc: 'Конверсия сделок, средний чек смет и аналитика эффективности', btnText: '📄 Сводка продаж', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    ],

    admin: [
      { id: 'adm-tree', title: 'Иерархия ролей (Древо)', icon: '🌳', desc: 'Визуальное древо ролей всех строительных организаций и компаний платформы', btnText: '🌳 Древо ролей', btnGradient: 'linear-gradient(90deg, #10b981, #0ea5e9)' },
      { id: 'adm-prices', title: 'Прайсы ГЭСН-2026', icon: '💰', desc: 'База 23 864+ позиций строительных расценок по 17 областям Казахстана', btnText: '💰 Открыть прайсы', btnGradient: 'linear-gradient(90deg, #f59e0b, #ea580c)' },
      { id: 'adm-moderation', title: 'Модерация заявок', icon: '🛡️', desc: 'Очередь верификации подрядчиков, проверка документов и заказов', btnText: '🛡️ Модерация', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
      { id: 'adm-regions', title: 'Региональные индексы', icon: '🗺️', desc: 'Коэффициенты удорожания стройматериалов по регионам РК', btnText: '🗺️ Индексы цен', btnGradient: 'linear-gradient(90deg, #2563eb, #38bdf8)' },
      { id: 'adm-audit', title: 'Журнал действий', icon: '📜', desc: 'Полный аудит логов пользователей, изменений в сметах и AI-вызовов', btnText: '📜 Журнал логов', btnGradient: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' },
      { id: 'adm-kpi', title: 'KPI Платформы', icon: '📊', desc: 'Метрики скорости расчётов, точности AI и загрузки серверов', btnText: '📊 Открыть KPI', btnGradient: 'linear-gradient(90deg, #10b981, #06b6d4)' },
      { id: 'adm-disputes', title: 'Споры и арбитраж', icon: '⚖️', desc: 'Рассмотрение претензий по качеству работ и разблокировка эскроу', btnText: '⚖️ Разрешить спор', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
      { id: 'adm-contracts', title: 'Договоры подряда', icon: '📄', desc: 'Шаблоны договоров строительного подряда с поддержкой ЭЦП E-Gov', btnText: '📄 Реестр договоров', btnGradient: 'linear-gradient(90deg, #2563eb, #10b981)' },
      { id: 'adm-documents', title: 'Документы & Выгрузка Excel', icon: '📁', desc: 'Выгрузка актов КС-2/КС-3, счетов на оплату, ЭСФ и реестров договоров в Excel (.xlsx)', btnText: '📁 Открыть документы', btnGradient: 'linear-gradient(90deg, #10b981, #06b6d4)' },
    ],

    analyst: [
      { id: 'an-queue', title: 'Очередь завершённых заявок', icon: '📋', desc: 'Заявки, закрытые исполнителями и переданные аналитику для финальной отчётности', btnText: '📋 Открыть очередь', btnGradient: 'linear-gradient(90deg, #8b5cf6, #6366f1)' },
      { id: 'an-reports', title: 'PDF-отчёты и экспорт', icon: '📄', desc: 'Формирование итоговых отчётов с фотографиями, файлами и хронологией работ', btnText: '📄 Генератор отчётов', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
      { id: 'an-stats', title: 'Статистика проделанных работ', icon: '📊', desc: 'Сводная аналитика по объектам, бригадам, бюджетам и срокам выполнения', btnText: '📊 Смотреть статистику', btnGradient: 'linear-gradient(90deg, #10b981, #0ea5e9)' },
      { id: 'an-files', title: 'Архив документации', icon: '📎', desc: 'Договоры, акты КС-2/КС-3, заключения технадзора и гарантийные обязательства', btnText: '📎 Открыть архив', btnGradient: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' },
    ]
  };

  // Visually hide 'company', 'admin', and 'analyst' role cards as requested. Show 4 main roles.
  const visibleRoles = (() => {
    const allowedRoleIds = ['customer', 'executor', 'builder', 'engineer', 'manager'];
    return roles.filter(r => allowedRoleIds.includes(r.id));
  })();

  const activeRoleObj = roles.find((r) => r.id === selectedRole) || visibleRoles[0] || roles[0];
  const activeCards = roleCardsData[selectedRole] || roleCardsData.customer;

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    if (roleKey === 'builder' || roleKey === 'vip') {
      setEmbeddedModule('builder');
      setSelectedItemId('b-objects');
      setSelectedItemObject(roleCardsData.builder ? roleCardsData.builder[0] : null);
    } else if (roleKey === 'manager' || roleKey === 'crm') {
      setEmbeddedModule('crm');
      setSelectedItemId('mgr-crm');
      setSelectedItemObject(roleCardsData.manager ? roleCardsData.manager[0] : null);
    } else if (roleKey === 'admin') {
      setEmbeddedModule('admin_panel');
      setSelectedItemId('adm-prices');
      setSelectedItemObject(roleCardsData.admin ? roleCardsData.admin[0] : null);
    } else if (roleKey === 'company') {
      setEmbeddedModule('company');
      setSelectedItemId('comp-profile');
      setSelectedItemObject(roleCardsData.company ? roleCardsData.company[0] : null);
    } else {
      setSelectedItemId(null);
      setSelectedItemObject(null);
      setEmbeddedModule(null);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setIsMobileSidebarOpen(false);
    
    // Check if it's builder module
    if (item.id.startsWith('b-')) {
      setEmbeddedModule('builder');
      setSelectedItemObject(item);
    }
    // Check if it's admin section
    else if (item.id.startsWith('adm-')) {
      setEmbeddedModule('admin_panel');
      setSelectedItemObject(item);
    } 
    // Check if it's company module
    else if (item.id.startsWith('comp-')) {
      setEmbeddedModule('company');
      setSelectedItemObject(item);
    }
    // Check if it's engineer or calendar module
    else if (
      item.id.startsWith('ing-') || 
      item.id === 'c-calendar' || 
      item.id === 'e-calendar'
    ) {
      setEmbeddedModule('engineer');
      setSelectedItemObject(item);
    } 
    // Check if it's manager module
    else if (item.id.startsWith('mgr-')) {
      setEmbeddedModule('crm');
      setSelectedItemObject(item);
    }
    // Otherwise it's a standard feature module
    else {
      setEmbeddedModule(null);
      setSelectedItemObject(item);
    }
  };

  const handleBackToCardMenu = () => {
    setSelectedItemId(null);
    setSelectedItemObject(null);
    setEmbeddedModule(null);
  };

  const isInnerToolActive = !!(embeddedModule || selectedItemObject || selectedItemId);

  // Keyboard shortcut: Escape to return to card cockpit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInnerToolActive) {
        handleBackToCardMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInnerToolActive]);

  const handlePrimaryRoleAction = () => {
    if (selectedRole === 'engineer') {
      setEmbeddedModule('engineer');
      setSelectedItemId('ing-main');
    } else if (selectedRole === 'executor') {
      setSelectedItemId('e-feed');
    } else if (selectedRole === 'manager' || selectedRole === 'crm') {
      setEmbeddedModule('crm');
      setSelectedItemId('mgr-crm');
    } else if (selectedRole === 'company') {
      setEmbeddedModule('company');
      setSelectedItemId('comp-profile');
    } else if (selectedRole === 'admin') {
      setEmbeddedModule('admin_panel');
      setSelectedItemId('adm-prices');
    } else {
      setSelectedItemId('c-estimate');
    }
  };

  return (
    <div className="admin-redesign-layout" style={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', position: 'relative' }}>
      {/* 3D Holographic Background with BIM Skyline & Electricity */}
      <AnimatedBackground />

      {/* ALWAYS VISIBLE FLOATING "BACK TO MENU" BUTTON */}
      {isInnerToolActive && (
        <button
          onClick={handleBackToCardMenu}
          className="floating-back-to-cards-btn"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 99999,
            background: 'rgba(12, 18, 38, 0.94)',
            border: '2px solid #38bdf8',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '50px',
            fontWeight: '900',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(56, 189, 248, 0.6), 0 0 25px rgba(0,0,0,0.85)',
            backdropFilter: 'blur(24px)',
            transition: 'all 0.25s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(56, 189, 248, 0.8)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(56, 189, 248, 0.6), 0 0 25px rgba(0,0,0,0.85)';
          }}
          title="Вернуться к выбору карточек (Esc)"
        >
          <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>←</span>
          <span>Назад к карточкам</span>
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MOBILE DRAWER SIDEBAR (Only visible when toggled on mobile) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div 
        className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside className={`admin-redesign-sidebar mobile-drawer ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div 
              className="sidebar-brand" 
              onClick={() => {
                handleBackToCardMenu();
                setIsMobileSidebarOpen(false);
              }}
              style={{ cursor: 'pointer', marginBottom: 0 }}
              title="На главный экран"
            >
              <span className="logo-emoji">🏗️</span>
              <div>QazGost <span style={{ color: '#38bdf8' }}>AI</span></div>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="sidebar-close-btn"
              title="Закрыть меню"
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', marginBottom: '0.6rem' }}>
            ВЫБРАТЬ ДАШБОРД
          </div>

          {/* Mobile Role Switcher Grid */}
          <div className="mobile-role-selector-grid" style={{ gridTemplateColumns: `repeat(${Math.min(visibleRoles.length, 3)}, 1fr)` }}>
            {visibleRoles.map(r => (
              <button
                key={r.id}
                className={`mobile-role-btn ${selectedRole === r.id ? 'active' : ''}`}
                onClick={() => handleSelectRole(r.id)}
                style={{
                  borderColor: selectedRole === r.id ? r.color : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: selectedRole === r.id ? `0 0 12px ${r.glow}` : 'none',
                  flexDirection: 'column',
                  padding: '8px 4px'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                <span style={{ fontSize: '0.75rem' }}>{r.shortLabel}</span>
                {selectedRole === r.id && <span style={{ color: r.color, fontWeight: '900', fontSize: '0.8rem' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-category">
            <div className="sidebar-category-header">
              <span>{activeRoleObj.icon} РАЗДЕЛЫ {activeRoleObj.shortLabel.toUpperCase()}</span>
            </div>
            <div className="sidebar-items-group">
              {activeCards.map(item => (
                <div 
                  key={item.id} 
                  className={`sidebar-item ${selectedItemId === item.id ? 'active' : ''}`}
                  onClick={() => handleSelectItem(item)}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            <span className="online-ai-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="live-dot" /> Online AI 2.0
            </span>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.3' }}>
              Система активна и готова к работе.
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MAIN COCKPIT & WORKSPACE                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <main className="admin-redesign-main full-width-workspace" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5 }}>
        
        {/* TOP COMPACT HEADER — STICKY AT TOP */}
        <header className="main-top-header modern-topbar" style={{ position: 'sticky', top: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', background: 'rgba(10, 14, 28, 0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="mobile-menu-trigger-btn"
              title="Открыть меню"
            >
              <span>☰</span>
              <span className="btn-text-mobile">Меню</span>
            </button>

            {/* Back to Card Hub Button */}
            {isInnerToolActive ? (
              <button 
                onClick={handleBackToCardMenu}
                className="btn-back-to-cards"
                title="Вернуться ко всем карточкам"
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1.5px solid #38bdf8',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '8px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  boxShadow: '0 0 18px rgba(56, 189, 248, 0.4)'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>←</span>
                <span>Назад к карточкам</span>
              </button>
            ) : (
              <button 
                onClick={onBackToHome}
                className="btn-back-to-cards"
                title="На главную"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.88rem'
                }}
              >
                <span>🏠</span>
                <span>На главную</span>
              </button>
            )}

            <div className="header-breadcrumbs-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: activeRoleObj.color, fontWeight: '800' }}>
                {activeRoleObj.icon} {activeRoleObj.title}
              </span>
              {selectedItemObject && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>/</span>
                  <span style={{ color: '#fff', fontWeight: '700' }}>{selectedItemObject.title}</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="live-ai-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Online AI 2.0</span>
            </div>

            <button 
              onClick={onBackToHome}
              style={{
                background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              На сайт
            </button>
          </div>
        </header>

        {/* ────────────────────────────────────────────────────────── */}
        {/* WORKSPACE: INNER TOOL OR FULL CARD DASHBOARD               */}
        {/* ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isInnerToolActive ? '0' : '2rem 1.5rem' }}>

          {/* 1. INNER TOOL VIEW */}
          {isInnerToolActive && (
            <div style={{ width: '100%', minHeight: '85vh' }}>
              {embeddedModule === 'engineer' && (
                <EngineerDashboardPage
                  key={selectedRole}
                  hideHeader={true}
                  initialTab={
                    selectedItemId === 'ing-main' ? 'overview' :
                    selectedItemId === 'ing-requests' ? 'requests' :
                    selectedItemId === 'ing-objects' ? 'objects' :
                    (selectedItemId === 'ing-calendar' || selectedItemId === 'c-calendar' || selectedItemId === 'e-calendar') ? 'calendar' :
                    selectedItemId === 'ing-ai' ? 'ai-calc' :
                    selectedItemId === 'ing-expenses' ? 'expenses' :
                    'overview'
                  }
                  onBackToHome={handleBackToCardMenu}
                  viewRole={selectedRole}
                  currentUser={currentUser}
                />
              )}

              {embeddedModule === 'admin_panel' && (
                <AdminDashboardModal 
                  isOpen={true} 
                  inline={true} 
                  startTab={selectedItemId.replace('adm-', '')} 
                  onClose={handleBackToCardMenu} 
                  currentUser={currentUser} 
                  userRole={userRole} 
                />
              )}

              {embeddedModule === 'builder' && (
                <div style={{ height: '100%', width: '100%', minHeight: '80vh', position: 'relative' }}>
                  <BuildingConstructionPage onBack={handleBackToCardMenu} hideHeader={false} />
                </div>
              )}

              {embeddedModule === 'crm' && (
                <div style={{ height: '100%', width: '100%', minHeight: '80vh', position: 'relative' }}>
                  <CrmPage onBackToHome={handleBackToCardMenu} currentUser={currentUser} />
                </div>
              )}

              {embeddedModule === 'company' && (
                <CompanyDashboardPage 
                  currentUser={currentUser} 
                  initialTab={
                    selectedItemId === 'comp-employees' ? 'employees' :
                    selectedItemId === 'comp-stats' ? 'stats' : 'profile'
                  }
                />
              )}

              {!embeddedModule && selectedItemObject && (
                <FeaturePageModule
                  itemData={selectedItemObject}
                  onBack={handleBackToCardMenu}
                  onOpenAdminTab={(tab) => {
                    setEmbeddedModule('admin_panel');
                    setSelectedItemId(`adm-${tab}`);
                  }}
                />
              )}
            </div>
          )}

          {/* 2. CARD COCKPIT VIEW (Matching Screenshot 3) */}
          {!isInnerToolActive && (
            <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Header Titles */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2.6rem', fontWeight: '900', color: '#fff', margin: '0 0 0.6rem 0', letterSpacing: '-0.5px' }}>
                  Умная оценка <span style={{ background: 'linear-gradient(90deg, #38bdf8, #2563eb, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>строительных работ</span>
                </h1>

                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: 0, maxWidth: '680px', lineHeight: '1.5' }}>
                  Загрузите фото объекта — получите точный расчёт материалов, стоимости или найдите дефекты
                </p>
              </div>

              {/* ROLE SELECTION CARDS (Mobile-friendly 2x2 grid & VIP featured layout) */}
              <div className="home-role-cards-grid">
                {visibleRoles.map(r => {
                  const isActive = selectedRole === r.id;
                  const isVip = r.id === 'builder';
                  return (
                    <div 
                      key={r.id}
                      onClick={() => handleSelectRole(r.id)}
                      className={`home-role-card ${isActive ? 'active' : ''} ${isVip ? 'vip-card' : ''}`}
                      style={{
                        '--role-color': r.color,
                        '--role-glow': r.glow
                      }}
                    >
                      {/* Active Glowing Checkmark */}
                      {isActive && (
                        <div className="home-role-check">
                          ✓
                        </div>
                      )}

                      {/* VIP Badge */}
                      {isVip && !isActive && (
                        <div className="home-role-vip-tag">VIP</div>
                      )}

                      <div className="home-role-icon">{r.icon}</div>
                      <div className="home-role-content">
                        <h3 className="home-role-title">{r.title}</h3>
                        <p className="home-role-desc">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Primary Action Button (as in Screenshot 3) */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
                <button 
                  onClick={handlePrimaryRoleAction}
                  style={{
                    background: selectedRole === 'engineer' 
                      ? 'linear-gradient(90deg, #2563eb, #38bdf8)' 
                      : selectedRole === 'executor' 
                      ? 'linear-gradient(90deg, #38bdf8, #f59e0b)' 
                      : selectedRole === 'manager'
                      ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
                      : selectedRole === 'company'
                      ? 'linear-gradient(90deg, #0ea5e9, #2563eb)'
                      : selectedRole === 'admin'
                      ? 'linear-gradient(90deg, #a855f7, #6366f1)'
                      : 'linear-gradient(90deg, #38bdf8, #f59e0b)',
                    color: '#fff',
                    border: 'none',
                    padding: '1.1rem 3.5rem',
                    borderRadius: '22px',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    boxShadow: '0 12px 35px rgba(56, 189, 248, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.28s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>🚀 Перейти в раздел «{activeRoleObj.title}»</span>
                  <span style={{ fontSize: '1.35rem' }}>→</span>
                </button>
              </div>

              {/* Metrics Telemetry Strip (as in Screenshot 3) */}
              <div style={{
                background: 'rgba(18, 24, 44, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '1.25rem 2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                textAlign: 'center',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#93c5fd' }}>10K+</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>ПРОЕКТОВ</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#38bdf8' }}>98%</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>ТОЧНОСТЬ</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#38bdf8' }}>2 сек</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>СКОРОСТЬ</div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────── */}
              {/* DYNAMIC INTERACTIVE CARDS GRID (as in Screenshot 3)    */}
              {/* ────────────────────────────────────────────────────── */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: activeRoleObj.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{activeRoleObj.icon}</span>
                  <span>ДОСТУПНЫЕ ИНСТРУМЕНТЫ РАЗДЕЛА «{activeRoleObj.title.toUpperCase()}»:</span>
                </div>

                <div className="sub-tools-cards-grid">
                  {activeCards.map(card => (
                    <div 
                      key={card.id}
                      onClick={() => handleSelectItem(card)}
                      className="sub-tool-card"
                      style={{
                        '--role-color': activeRoleObj.color,
                        '--role-glow': activeRoleObj.glow
                      }}
                    >
                      {/* Card Icon */}
                      <div className="sub-tool-icon">
                        {card.icon}
                      </div>

                      {/* Card Text */}
                      <div className="sub-tool-content">
                        <h4 className="sub-tool-title">{card.title}</h4>
                        <p className="sub-tool-desc">{card.desc}</p>
                      </div>

                      {/* Card Action Button */}
                      <button 
                        className="sub-tool-btn"
                        style={{
                          background: card.btnGradient
                        }}
                      >
                        {card.btnText}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
