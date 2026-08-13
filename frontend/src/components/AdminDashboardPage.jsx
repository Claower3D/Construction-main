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

  const handleSelectRole = (e) => {
    const roleKey = e.target.value;
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
      item.id.includes('engineering') || 
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

  return (
    <div className="admin-redesign-layout">
      {userRole === 'customer' && <OnboardingTour steps={currentCustomerSteps} tourKey={`customer_${selectedItemId}`} />}
      {userRole === 'executor' && <OnboardingTour steps={currentExecutorSteps} tourKey={`executor_${selectedItemId}`} />}
      {/* Background */}
      <AnimatedBackground />

      {/* LEFT SIDEBAR */}
      <aside className="admin-redesign-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="logo-emoji">🏗️</span>
            <div>QazGost <span>AI</span></div>
          </div>
          <div className="role-dropdown-wrapper">
            {userRole === 'admin' || userRole === 'company' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>выбрать дашборд</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleSelectRole({ target: { value: 'admin' } })}
                    style={{ 
                      flex: 1, padding: '0.6rem 0.2rem', 
                      background: selectedRole === 'admin' ? 'var(--gold-main)' : 'rgba(255,255,255,0.05)', 
                      border: '1px solid',
                      borderColor: selectedRole === 'admin' ? 'var(--gold-main)' : 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      color: selectedRole === 'admin' ? '#0b0f1f' : '#fff', 
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                      fontSize: '0.85rem'
                    }}
                  >
                    ⚙️ Админ
                  </button>
                  <button 
                    onClick={() => handleSelectRole({ target: { value: 'company' } })}
                    style={{ 
                      flex: 1, padding: '0.6rem 0.2rem', 
                      background: selectedRole === 'company' ? '#0ea5e9' : 'rgba(255,255,255,0.05)', 
                      border: '1px solid',
                      borderColor: selectedRole === 'company' ? '#0ea5e9' : 'rgba(255,255,255,0.1)', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                      fontSize: '0.85rem'
                    }}
                  >
                    🏢 Компания
                  </button>
                </div>
                <select className="role-select" value={selectedRole} onChange={handleSelectRole} style={{ marginTop: '0.5rem', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                  <option value="" disabled>-- Демо-просмотр других ролей --</option>
                  <option value="customer">📋 Заказчик</option>
                  <option value="executor">🔧 Исполнитель</option>
                  <option value="engineer">👷 Инженер</option>
                  <option value="manager">💼 Менеджер</option>
                </select>
              </div>
            ) : (
              <div className="role-display-badge" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{currentRoleData.roleIcon}</span> Роль: {currentRoleData.roleTitle}
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentRoleData.categories.map((cat) => (
            <div key={cat.id} className="sidebar-category">
              <div className="sidebar-category-header">{cat.name}</div>
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
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            <span className="online-ai-badge" style={{ display: 'inline-block', marginBottom: '10px' }}>🟢 Online AI 2.0</span>
            <br/>
            Система активна и готова к работе.
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="admin-redesign-main">
        {/* Top Header */}
        <header className="main-top-header">
          <div className="header-breadcrumbs">
            {currentRoleData.roleTitle} <span>/</span> Управление <span>/</span> {currentItemName}
          </div>
          <div className="header-actions">
            <button className="btn-return-home" onClick={onBackToHome} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
              🏠 На сайт
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="main-content-area">
          {embeddedModule === 'engineer' && (
             <EngineerDashboardPage
               key={selectedRole}
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
             />
          )}

          {embeddedModule === 'admin_panel' && (
             <AdminDashboardModal isOpen={true} inline={true} startTab={selectedItemId.replace('adm-', '')} onClose={() => setSelectedItemObject(null)} currentUser={currentUser} userRole={userRole} />
          )}

          {embeddedModule === 'crm' && (
             <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
               <CrmPage onBackToHome={onBackToHome} currentUser={currentUser} />
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
               onBack={() => setSelectedItemObject(null)}
               onOpenAdminTab={(tab) => {
                 setEmbeddedModule('admin_panel');
                 setSelectedItemId(`adm-${tab}`);
               }}
             />
          )}


          {!embeddedModule && !selectedItemObject && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              <h2>Выберите инструмент в меню слева</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
