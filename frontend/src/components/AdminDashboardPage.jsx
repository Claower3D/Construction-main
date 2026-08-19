import React, { useState } from 'react';
import AnimatedBackground from './AnimatedBackground';
import EngineerDashboardPage from './EngineerDashboardPage';
import CompanyDashboardPage from './CompanyDashboardPage';
import AdminDashboardModal from './AdminDashboardModal';
import FeaturePageModule from './FeaturePageModule';
import OnboardingTour from './OnboardingTour';
import CrmPage from './CrmPage';

export default function AdminDashboardPage({ onBackToHome, onOpenEngineer, userRole = 'admin', currentUser }) {
  // Блок 1: Выбранная роль ('customer' | 'executor' | 'engineer' | 'admin')
  const [selectedRole, setSelectedRole] = useState(userRole);
  
  // Блок 2 & 3: Выбранный элемент для рабочей области
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemObject, setSelectedItemObject] = useState(null);
  const [embeddedModule, setEmbeddedModule] = useState(null); // 'engineer' | 'admin_panel' | null

  // Collapsible sidebar categories state
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Иерархические данные ролей и элементов
  const hierarchyData = {
    customer: {
      roleTitle: 'Заказчик',
      roleIcon: '📋',
      roleColor: '#10b981',
      categories: [
        {
          id: 'tools',
          name: '🛠️ ИНСТРУМЕНТЫ',
          desc: 'Автоматические инструменты расчётов и AI',
          items: [
            { id: 'c-estimate', name: 'Оценка стоимости', icon: '📸', iconBg: '#f59e0b', desc: 'Быстрая оценка стоимости по фото за 2 секунды' },
            { id: 'c-inspect', name: 'Проверка дефектов', icon: '🔍', iconBg: '#8b5cf6', desc: 'Детектоскопия трещин, брака и перепадов стен' },
            { id: 'c-volume', name: 'Расчёт объёмов', icon: '📏', iconBg: '#06b6d4', desc: 'Автоматический выбор площадей и материалов BOM' },
            { id: 'c-engineering', name: 'Инженерные решения', icon: '⚙️', iconBg: '#10b981', desc: 'Разработка технической документации и технадзор' },
          ],
        },
        {
          id: 'management',
          name: '📂 УПРАВЛЕНИЕ',
          desc: 'Заказы, календари и маркетплейс подрядчиков',
          items: [
            { id: 'c-calendar', name: 'Календарь', icon: '📅', iconBg: '#ef4444', desc: 'График выполнения строительных работ по объекту' },
            { id: 'c-orders', name: 'Мои заказы', icon: '📬', iconBg: '#10b981', desc: 'Список активных и завершенных заявок' },
            { id: 'c-catalog', name: 'Каталог подрядчиков', icon: '📒', iconBg: '#f59e0b', desc: 'Реестр проверенных мастеров и ТОО по ИИН/БИН' },
            { id: 'c-equipment', name: 'Техника / Маркетплейс', icon: '🚜', iconBg: '#8b5cf6', desc: 'Аренда спецтехники и закуп материалов' },
            { id: 'c-wallet', name: 'Мой кошелёк', icon: '💳', iconBg: '#3b82f6', desc: 'Баланс, транзакции и эскроу-счета' },
          ],
        },
        {
          id: 'profile',
          name: '👤 ПРОФИЛЬ',
          desc: 'Личные данные и VIP статус',
          items: [
            { id: 'c-profile', name: 'Моя анкета', icon: '📝', iconBg: '#06b6d4', desc: 'Личные данные Заказчика и реквизиты' },
            { id: 'c-vip', name: 'Строительство зданий', icon: '🏗️', iconBg: '#f59e0b', isVip: true, desc: 'Капитальное монолитное строительство объектов VIP' },
          ],
        },
      ],
    },

    executor: {
      roleTitle: 'Исполнитель',
      roleIcon: '🔧',
      roleColor: '#c084fc',
      categories: [
        {
          id: 'my-orders',
          name: '📋 МОИ ЗАКАЗЫ',
          desc: 'Лента заказов и график работ мастера',
          items: [
            { id: 'e-feed', name: 'Лента заказов', icon: '🌐', iconBg: '#06b6d4', desc: 'Живой поток заказов со всего Казахстана' },
            { id: 'e-works', name: 'Мои работы', icon: '📌', iconBg: '#ef4444', desc: 'Портфолио и текущие объекты мастера' },
            { id: 'e-calendar', name: 'Календарь работ', icon: '📅', iconBg: '#f59e0b', desc: 'Расписание выездов и этапов монтажа' },
          ],
        },
        {
          id: 'tools',
          name: '🎯 ИНСТРУМЕНТЫ',
          desc: 'Сметный калькулятор и экспертиза дефектов',
          items: [
            { id: 'e-estimate', name: 'Оценка стоимости', icon: '📸', iconBg: '#f59e0b', desc: 'Калькулятор сметных расходов' },
            { id: 'e-inspect', name: 'Проверка дефектов', icon: '🔍', iconBg: '#8b5cf6', desc: 'Экспертная проверка состояния конструкций' },
            { id: 'e-volume', name: 'Расчёт объёмов', icon: '📏', iconBg: '#06b6d4', desc: 'Расчет нормативного расхода материалов' },
            { id: 'e-engineering', name: 'Инженерные решения', icon: '⚙️', iconBg: '#10b981', desc: 'Техническая спецификация работ' },
          ],
        },
        {
          id: 'services',
          name: '📂 СЕРВИСЫ & ПРОФИЛЬ',
          desc: 'Анкета исполнителя, маркетплейс и фото-объёмы',
          items: [
            { id: 'e-catalog', name: 'Каталог подрядчиков', icon: '📒', iconBg: '#f59e0b', desc: 'Рейтинг и анкеты специалистов' },
            { id: 'e-equipment', name: 'Техника / Маркетплейс', icon: '🚜', iconBg: '#8b5cf6', desc: 'Поиск спецтехники в аренду' },
            { id: 'e-wallet', name: 'Мой кошелёк', icon: '💳', iconBg: '#3b82f6', desc: 'Вывод средств и заработанный баланс' },
            { id: 'e-profile', name: 'Анкета исполнителя', icon: '📝', iconBg: '#06b6d4', desc: 'Профиль мастера, ИИН/БИН и квалификация' },
            { id: 'e-vip', name: 'Строительство зданий', icon: '🏗️', iconBg: '#f59e0b', isVip: true, desc: 'Генподрядные работы VIP уровня' },
            { id: 'e-soil', name: 'Фото-объёмы грунта', icon: '📐', iconBg: '#10b981', desc: 'Геодезический расчёт земляных работ' },
          ],
        },
      ],
    },

    engineer: {
      roleTitle: 'Инженер',
      roleIcon: '👷',
      roleColor: '#38bdf8',
      categories: [
        {
          id: 'engineering-panel',
          name: '📊 ИНЖЕНЕРНАЯ ПАНЕЛЬ',
          desc: 'Объекты технадзора и заявки на проверку',
          items: [
            { id: 'ing-main', name: 'Главная панель', icon: '📊', iconBg: '#3b82f6', desc: 'Дашборд технического надзора и проверок' },
            { id: 'ing-requests', name: 'Заявки', icon: '📬', iconBg: '#ef4444', desc: 'Очередь вызовов экспертов на объекты' },
            { id: 'ing-objects', name: 'Мои объекты', icon: '🏗️', iconBg: '#f59e0b', desc: 'Реестр строящихся объектов на контроле' },
          ],
        },
        {
          id: 'ai-tools',
          name: '🤖 AI ИНСТРУМЕНТЫ И СМЕТЫ',
          desc: 'AI просчёт по СНиП и контролю расходов',
          items: [
            { id: 'ing-calendar', name: 'Календарь', icon: '📅', iconBg: '#10b981', desc: 'План инспекций и подписания актов' },
            { id: 'ing-ai', name: 'AI-просчёт', icon: '🤖', iconBg: '#8b5cf6', desc: 'Автоматический анализ ГОСТ и СНиП РК' },
            { id: 'ing-expenses', name: 'Расходы', icon: '💰', iconBg: '#06b6d4', desc: 'Контроль сметных перерасходов и лимитов' },
          ],
        },
      ],
    },

    company: {
      roleTitle: 'Компания',
      roleIcon: '🏢',
      roleColor: '#0ea5e9',
      categories: [
        {
          id: 'comp-management',
          name: '🏢 ПРОФИЛЬ И УПРАВЛЕНИЕ',
          desc: 'Реквизиты, документы и сотрудники',
          items: [
            { id: 'comp-profile', name: 'Профиль компании', icon: '📝', iconBg: '#0ea5e9', desc: 'Управление БИН/ИИН и реквизитами' },
            { id: 'comp-employees', name: 'Сотрудники', icon: '👥', iconBg: '#10b981', desc: 'Список привязанных инженеров и исполнителей' },
          ],
        },
        {
          id: 'comp-analytics',
          name: '📊 АНАЛИТИКА',
          desc: 'Статистика по объектам и заявкам',
          items: [
            { id: 'comp-stats', name: 'Статистика', icon: '📈', iconBg: '#8b5cf6', desc: 'Сводные данные по эффективности компании' },
          ],
        },
      ],
    },

    admin: {
      roleTitle: 'Админ',
      roleIcon: '⚙️',
      roleColor: '#f59e0b',
      categories: [
        {
          id: 'prices-mod',
          name: '💰 ПРАЙСЫ И МОДЕРАЦИЯ',
          desc: 'Справочники ГЭСН-2026 и проверка заказов',
          items: [
            { id: 'adm-prices', name: 'Прайсы', icon: '💰', iconBg: '#f59e0b', desc: '12 764+ позиций ГЭСН/СНиП 2026' },
            { id: 'adm-moderation', name: 'Модерация', icon: '🛡️', iconBg: '#ef4444', desc: 'Очередь верификации компаний и заказов' },
            { id: 'adm-regions', name: 'Регионы', icon: '🗺️', iconBg: '#8b5cf6', desc: 'Индексы цен по 17 областям Казахстана' },
          ],
        },
        {
          id: 'audit-kpi',
          name: '📜 АУДИТ И KPI',
          desc: 'Логи операций и аналитика платформы',
          items: [
            { id: 'adm-audit', name: 'Журнал действий', icon: '📜', iconBg: '#3b82f6', desc: 'Логи операций пользователей и AI-вызовов' },
            { id: 'adm-kpi', name: 'KPI Dashboard', icon: '📊', iconBg: '#10b981', desc: 'Метрики эффективности платформы' },
            { id: 'adm-analytics', name: 'Аналитика', icon: '📈', iconBg: '#06b6d4', desc: 'Финансовые показатели и объёмы смет' },
            { id: 'adm-roles', name: 'Роли', icon: '🎭', iconBg: '#ec4899', desc: 'Управление ролями и доступами' },
          ],
        },
        {
          id: 'legal',
          name: '⚖️ АРБИТРАЖ И ДОГОВОРЫ',
          desc: 'Разрешение споров и ЭЦП договора РК',
          items: [
            { id: 'adm-disputes', name: 'Споры и арбитраж', icon: '⚖️', iconBg: '#f59e0b', desc: 'Разрешение конфликтов Заказчик/Исполнитель' },
            { id: 'adm-contracts', name: 'Договоры', icon: '📄', iconBg: '#8b5cf6', desc: 'Реестр договоров подряда и ЭЦП E-Gov' },
          ],
        },
      ],
    },

    manager: {
      roleTitle: 'Менеджер',
      roleIcon: '💼',
      roleColor: '#fbbf24',
      categories: [
        {
          id: 'crm-management',
          name: '📊 УПРАВЛЕНИЕ КЛИЕНТАМИ',
          desc: 'CRM-система и воронка продаж',
          items: [
            { id: 'mgr-crm', name: 'CRM-система', icon: '📊', iconBg: '#3b82f6', desc: 'Управление заявками и клиентами' },
            { id: 'mgr-reports', name: 'Отчеты', icon: '📄', iconBg: '#10b981', desc: 'Аналитика по продажам' },
          ],
        },
      ],
    },
  };

  const currentRoleData = hierarchyData[selectedRole] || hierarchyData.customer;

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles = [
    { id: 'admin', label: 'Администратор', icon: '⚙️', badge: 'VIP' },
    { id: 'company', label: 'Компания', icon: '🏢', badge: 'PRO' },
    { id: 'customer', label: 'Заказчик', icon: '📋', badge: '' },
    { id: 'executor', label: 'Исполнитель', icon: '🔧', badge: '' },
    { id: 'engineer', label: 'Инженер', icon: '👷', badge: '' },
    { id: 'manager', label: 'Менеджер', icon: '💼', badge: '' },
  ];

  const activeRoleObj = roles.find((r) => r.id === selectedRole) || roles[2];

  const handleSelectRole = (roleKeyOrEvent) => {
    const roleKey = typeof roleKeyOrEvent === 'string' ? roleKeyOrEvent : roleKeyOrEvent?.target?.value;
    setSelectedRole(roleKey);
    setSelectedItemObject(null);
    setEmbeddedModule(null);
    const newRoleObj = hierarchyData[roleKey];
    if (newRoleObj && newRoleObj.categories.length > 0) {
      const firstCat = newRoleObj.categories[0];
      if (firstCat.items.length > 0) {
        handleSelectItem(firstCat.items[0]);
      }
    }
  };

  React.useEffect(() => {
    const roleKey = selectedRole || 'customer';
    const newRoleObj = hierarchyData[roleKey] || hierarchyData.customer;
    if (newRoleObj && newRoleObj.categories.length > 0) {
      const firstCat = newRoleObj.categories[0];
      if (firstCat.items.length > 0) {
        handleSelectItem(firstCat.items[0]);
      }
    }
  }, [selectedRole]);

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    
    // Check if it's admin section
    if (item.id.startsWith('adm-')) {
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
    // Otherwise it's a standard feature module (c-engineering, e-engineering, c-orders, c-catalog, c-wallet, c-profile, etc.)
    else {
      setEmbeddedModule(null);
      setSelectedItemObject(item);
    }
  };

  const currentItemName = selectedItemObject ? selectedItemObject.name : 'Главная';

  const customerTourSteps = {
    'c-overview': [
      { target: '.sidebar-nav', title: 'Меню Заказчика', content: 'Здесь находятся инструменты для управления вашим проектом: статистика, галерея и документы.', placement: 'right' },
      { target: '.admin-redesign-main', title: 'Рабочая область', content: 'Тут отображаются фотоотчеты со стройки, акты КС-2 и прозрачные сметы.', placement: 'left' }
    ],
    'c-estimate': [
      { target: '.feature-content-box', title: 'Оценка стоимости', content: 'Выберите тип объекта и загрузите фото. AI за пару секунд рассчитает черновую стоимость работ.', placement: 'bottom' }
    ],
    'c-inspect': [
      { target: '.feature-content-box', title: 'Поиск дефектов', content: 'Загрузите фотографии проблемных участков, чтобы нейросеть выявила трещины или перепады.', placement: 'bottom' }
    ],
    'c-orders': [
      { target: '.feature-content-box', title: 'Мои заказы', content: 'Здесь вы можете создать новую заявку на поиск подрядчика или отслеживать статус текущих.', placement: 'left' }
    ],
    'c-calendar': [
      { target: '.feature-content-box', title: 'Календарь', content: 'График выполнения строительных работ по вашему объекту.', placement: 'left' }
    ]
  };

  const executorTourSteps = {
    'e-feed': [
      { target: '.feature-content-box', title: 'Лента заказов', content: 'Отслеживайте новые заявки от заказчиков по всему Казахстану и откликайтесь на подходящие.', placement: 'left' }
    ],
    'e-works': [
      { target: '.feature-content-box', title: 'Мои работы', content: 'Здесь отображаются ваши текущие активные объекты и архив выполненных заказов.', placement: 'left' }
    ],
    'e-estimate': [
      { target: '.feature-content-box', title: 'Оценка стоимости', content: 'Калькулятор сметных расходов. Используйте для быстрого расчета стоимости работ перед откликом.', placement: 'bottom' }
    ],
    'e-inspect': [
      { target: '.feature-content-box', title: 'Детектоскопия', content: 'Загрузите фото объекта, чтобы заранее выявить скрытые дефекты (трещины, влага).', placement: 'bottom' }
    ],
    'e-wallet': [
      { target: '.feature-content-box', title: 'Мой кошелёк', content: 'Управляйте заработанными средствами и выводите их на карту.', placement: 'left' }
    ]
  };

  const genericCustomerSteps = [
    { target: '.feature-content-box', title: 'Рабочая область', content: 'Здесь отображается выбранный инструмент или модуль системы.', placement: 'left' }
  ];

  const genericExecutorSteps = [
    { target: '.feature-content-box', title: 'Рабочая область', content: 'Здесь отображается выбранный инструмент. Следуйте инструкциям на экране для работы.', placement: 'left' }
  ];

  const currentCustomerSteps = customerTourSteps[selectedItemId] || (selectedItemId ? genericCustomerSteps : customerTourSteps['c-overview']);
  const currentExecutorSteps = executorTourSteps[selectedItemId] || (selectedItemId ? genericExecutorSteps : executorTourSteps['e-feed']);

  const isLandingView = !embeddedModule && !selectedItemId;

  return (
    <div className="admin-redesign-layout">
      {userRole === 'customer' && <OnboardingTour steps={currentCustomerSteps} tourKey={`customer_${selectedItemId}`} />}
      {userRole === 'executor' && <OnboardingTour steps={currentExecutorSteps} tourKey={`executor_${selectedItemId}`} />}
      {/* Background */}
      <AnimatedBackground />

      {/* LEFT SIDEBAR (Only visible once a tool or module is opened) */}
      
      {/* The inline toggle node to pass down */}
      {(() => {
        const sidebarToggleNode = (!isLandingView && isSidebarHidden) ? (
          <button 
            onClick={() => setIsSidebarHidden(false)}
            className="sidebar-show-btn-inline"
            title="Показать меню"
          >
            <span style={{ fontSize: '1.2rem' }}>≡</span>
          </button>
        ) : null;

        return (
          <>
      {!isLandingView && (
        <aside className={`admin-redesign-sidebar ${isSidebarHidden ? 'hidden' : ''}`}>
          <div className="sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div 
                className="sidebar-brand" 
                onClick={() => {
                  setSelectedItemId(null);
                  setEmbeddedModule(null);
                }}
                style={{ cursor: 'pointer', marginBottom: 0 }}
                title="На главную страницу сервисов"
              >
                <span className="logo-emoji">🏗️</span>
                <div>QazGost <span>AI</span></div>
              </div>
              <button 
                onClick={() => setIsSidebarHidden(true)}
                className="sidebar-hide-btn"
                title="Скрыть меню"
              >
                ◀
              </button>
            </div>
            <div className="role-dropdown-wrapper" style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', marginBottom: '0.4rem' }}>
              ВЫБРАТЬ ДАШБОРД
            </div>

            <button 
              className="custom-role-trigger-btn"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{activeRoleObj.icon}</span>
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.92rem' }}>{activeRoleObj.label}</span>
              </div>
              <span style={{ color: '#ec4899', fontSize: '0.75rem', transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {isRoleDropdownOpen && (
              <div className="custom-role-popover">
                <div className="popover-title-row">
                  <span>ДОСТУПНЫЕ ДАШБОРДЫ</span>
                  <span className="popover-close-x" onClick={() => setIsRoleDropdownOpen(false)}>✕</span>
                </div>
                <div className="popover-items-list">
                  {roles.map((r) => (
                    <div 
                      key={r.id} 
                      className={`popover-role-item ${selectedRole === r.id ? 'active-role' : ''}`}
                      onClick={() => {
                        handleSelectRole(r.id);
                        setIsRoleDropdownOpen(false);
                      }}
                    >
                      <span className="p-icon">{r.icon}</span>
                      <span className="p-label">{r.label}</span>
                      {r.badge && <span className={`p-badge ${r.badge.toLowerCase()}`}>{r.badge}</span>}
                      {selectedRole === r.id && <span className="p-check">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentRoleData.categories.map((cat) => {
            const isCollapsed = !!collapsedCategories[cat.id];
            return (
              <div key={cat.id} className={`sidebar-category ${isCollapsed ? 'collapsed' : ''}`}>
                <div 
                  className="sidebar-category-header clickable"
                  onClick={() => toggleCategoryCollapse(cat.id)}
                  title={isCollapsed ? 'Развернуть категорию' : 'Свернуть категорию'}
                >
                  <span>{cat.name}</span>
                  <span className={`category-arrow ${isCollapsed ? 'is-collapsed' : ''}`}>
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                </div>
                {!isCollapsed && (
                  <div className="sidebar-items-group">
                    {cat.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`sidebar-item ${selectedItemId === item.id ? 'active' : ''}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            <span className="online-ai-badge" style={{ display: 'inline-block', marginBottom: '10px' }}>🟢 Online AI 2.0</span>
            <br/>
            Система активна и готова к работе.
          </div>
        </div>
      </aside>
      )}

      {/* MAIN WORKSPACE */}
      <main className="admin-redesign-main" style={isLandingView ? { flex: 1, width: '100%', maxWidth: '100%', margin: 0, padding: 0 } : {}}>
        {/* Top Header (only if not landing view and not crm) */}
        {!isLandingView && embeddedModule !== 'crm' && (
          <header className="main-top-header">
            <div className="header-left-side" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {sidebarToggleNode}
              <button 
                onClick={() => {
                  setSelectedItemId(null);
                  setEmbeddedModule(null);
                }}
                className="em-btn-glass-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '10px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
                title="Вернуться к начальному выбору сервисов"
              >
                ← <span>Главный экран</span>
              </button>
              <div className="header-title-badge">
                <span className="header-icon">{selectedItemObject?.icon || '🌐'}</span>
                <div>
                  <h2 className="header-main-title">{currentItemName}</h2>
                  <div className="header-breadcrumbs">
                    {currentRoleData.roleTitle} <span>/</span> Управление <span>/</span> {currentItemName}
                  </div>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-return-home" onClick={onBackToHome}>
                🏠 На сайт
              </button>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className="main-content-area" style={(embeddedModule === 'crm' || embeddedModule === 'admin_panel') ? { padding: 0, margin: 0, height: '100%', overflow: 'hidden' } : {}}>
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
               onBackToHome={onBackToHome}
               viewRole={selectedRole}
               currentUser={currentUser}
               sidebarToggleNode={sidebarToggleNode}
             />
          )}

          {embeddedModule === 'admin_panel' && (
             <AdminDashboardModal isOpen={true} inline={true} startTab={selectedItemId.replace('adm-', '')} onClose={() => setSelectedItemObject(null)} currentUser={currentUser} userRole={userRole} />
          )}

          {embeddedModule === 'crm' && (
             <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
               <CrmPage onBackToHome={onBackToHome} currentUser={currentUser} sidebarToggleNode={sidebarToggleNode} />
             </div>
          )}

          {embeddedModule === 'company' && (
             <CompanyDashboardPage 
               currentUser={currentUser} 
               initialTab={
                 selectedItemId === 'comp-employees' ? 'employees' :
                 selectedItemId === 'comp-stats' ? 'stats' : 'profile'
               }
               sidebarToggleNode={sidebarToggleNode}
             />
          )}

          {!embeddedModule && selectedItemObject && (
             <FeaturePageModule
               itemData={selectedItemObject}
               onBack={() => setSelectedItemObject(null)}
               onOpenAdminTab={(tab) => {
                 setEmbeddedModule('admin_panel');
                 setSelectedItemId(`adm-${tab}`);
               }}
             />
          )}


          {!embeddedModule && !selectedItemObject && (
            <div style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Hero Header */}
              <div style={{ position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                
                {/* Back to Home Button Row */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => {
                      window.history.pushState({}, '', '/');
                      window.location.reload();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    <span>🏠</span> На главную
                  </button>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '0.4rem 1.1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '800', color: '#38bdf8', marginBottom: '1.25rem', backdropFilter: 'blur(16px)', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.2)' }}>
                  ✨ AI-powered • Версия 2.0
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', margin: '0 0 0.75rem 0', letterSpacing: '-0.5px' }}>
                  Умная оценка <span style={{ background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>строительных работ</span>
                </h1>

                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
                  Загрузите фото объекта — получите точный расчёт материалов, стоимости или найдите дефекты
                </p>
              </div>

              {/* 3 Role Selection Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {[
                  { id: 'customer', title: 'Я Заказчик', icon: '📋', desc: 'Создаю заказы, выбираю исполнителей, принимаю работу', color: '#10b981' },
                  { id: 'executor', title: 'Я Исполнитель', icon: '🔧', desc: 'Ищу заказы, отправляю предложения, выполняю работы', color: '#ec4899' },
                  { id: 'engineer', title: 'Я Инженер', icon: '👷', desc: 'Принимаю заявки, разрабатываю проектную документацию', color: '#8b5cf6' }
                ].map(r => {
                  const isActive = selectedRole === r.id;
                  return (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        background: 'rgba(18, 22, 38, 0.75)',
                        border: isActive ? `2px solid ${r.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '24px',
                        padding: '1.75rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.28s ease',
                        backdropFilter: 'blur(24px)',
                        boxShadow: isActive ? `0 15px 35px ${r.color}44` : '0 10px 25px rgba(0,0,0,0.3)',
                        position: 'relative'
                      }}
                    >
                      {isActive && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: r.color, color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.8rem', boxShadow: `0 0 12px ${r.color}` }}>
                          ✓
                        </div>
                      )}
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.85rem' }}>{r.icon}</div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>{r.title}</h3>
                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>{r.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Enter Selected Role Big CTA Button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    if (selectedRole === 'engineer') {
                      setEmbeddedModule('engineer');
                      setSelectedItemId('ing-main');
                    } else if (selectedRole === 'executor') {
                      setSelectedItemId('e-feed');
                    } else {
                      setSelectedItemId('c-overview');
                    }
                  }}
                  style={{
                    background: selectedRole === 'engineer' 
                      ? 'linear-gradient(90deg, #8b5cf6, #ec4899)' 
                      : selectedRole === 'executor' 
                      ? 'linear-gradient(90deg, #ec4899, #f59e0b)' 
                      : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    color: '#fff',
                    border: 'none',
                    padding: '1.1rem 3rem',
                    borderRadius: '20px',
                    fontWeight: '900',
                    fontSize: '1.15rem',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.28s ease'
                  }}
                >
                  <span>🚀 Перейти в раздел «{selectedRole === 'engineer' ? 'Я Инженер' : selectedRole === 'executor' ? 'Я Исполнитель' : 'Я Заказчик'}»</span>
                  <span style={{ fontSize: '1.3rem' }}>→</span>
                </button>
              </div>

              {/* Metrics Pill Bar */}
              <div style={{ background: 'rgba(18, 22, 38, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '1.25rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#c084fc' }}>10K+</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px' }}>ПРОЕКТОВ</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ec4899' }}>98%</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px' }}>ТОЧНОСТЬ</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38bdf8' }}>2 сек</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#cbd5e1', letterSpacing: '1px' }}>СКОРОСТЬ</div>
                </div>
              </div>

              {/* Grid of Feature Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {[
                  { id: 'c-estimate', title: 'Оценка стоимости', icon: '📊', desc: 'Загрузите фото → AI-анализ → смета за 2 сек... 3 сценария цены', btnText: '🚀 Начать оценку', btnGradient: 'linear-gradient(90deg, #ec4899, #8b5cf6)' },
                  { id: 'c-inspect', title: 'Проверка дефектов', icon: '🔍', desc: 'Трещины, влага, плесень. AI-отчёт + план устранения', btnText: '🔍 Начать проверку', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
                  { id: 'c-engineering', title: 'Строительство зданий', icon: '🏗️', desc: 'ПСД, ВВР-документация, сметы полного цикла', btnText: '⭐ Открыть', btnGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
                  { id: 'c-solutions', title: 'Инженерные решения', icon: '⚙️', desc: 'Электрика, сантехника, HVAC, слаботочные системы', btnText: '⚡ Выбрать', btnGradient: 'linear-gradient(90deg, #ec4899, #c084fc)' },
                  { id: 'c-orders', title: 'Мои заказы', icon: '📬', desc: 'Просмотр заказов, откликов и статусов работ', btnText: '📗 Открыть заказы', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
                  { id: 'c-wallet', title: 'Мой кошелёк', icon: '💳', desc: 'Баланс, операции, подписки и пополнение счёта', btnText: '💳 Открыть кошелёк', btnGradient: 'linear-gradient(90deg, #8b5cf6, #f59e0b)' },
                  { id: 'c-equipment', title: 'Маркетплейс техники', icon: '🚜', desc: 'Аренда экскаваторов, кранов, самосвалов', btnText: '🚜 Открыть', btnGradient: 'linear-gradient(90deg, #3b82f6, #06b6d4)' },
                  { id: 'c-soil', title: 'Фото-объёмы грунта', icon: '📐', desc: 'Объёмы выемки/насыпи по фото ДО/ПОСЛЕ', btnText: '📸 Рассчитать', btnGradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }
                ].map(card => (
                  <div 
                    key={card.id}
                    onClick={() => handleSelectItem(card)}
                    style={{
                      background: 'rgba(18, 22, 38, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '24px',
                      padding: '1.6rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                      backdropFilter: 'blur(24px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                      transition: 'all 0.28s ease'
                    }}
                  >
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>
                      {card.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: '0 0 0.4rem 0' }}>{card.title}</h4>
                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>{card.desc}</p>
                    </div>
                    <button 
                      style={{
                        width: '100%',
                        background: card.btnGradient,
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '14px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        marginTop: '0.5rem'
                      }}
                    >
                      {card.btnText}
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Profile Questionnaire Card */}
              <div style={{ background: 'rgba(18, 22, 38, 0.75)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '24px', padding: '1.75rem 2rem', textAlign: 'center', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>📋</div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>Моя анкета</h4>
                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: 0 }}>Заполните анкету: контакты, тип проекта, бюджет, техника и бригады</p>
                <button 
                  style={{ background: 'linear-gradient(90deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.85rem 2rem', borderRadius: '14px', fontWeight: '800', fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)', marginTop: '0.5rem' }}
                >
                  📝 Заполнить
                </button>
              </div>

            </div>
          )}
        </div>
      </main>
          
          </>
        );
      })()}
    </div>
  );
}
