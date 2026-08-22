import React, { useState, useEffect, useCallback } from 'react';

function getDefaultNotificationsForRole(userRole) {
  if (userRole === 'engineer') {
    return [
      { id: 'n-eng-1', icon: '👷', title: 'Назначена инспекция', text: 'Новая заявка на технический надзор по объекту ЖК «Кабанбай».', time: '5 мин назад', unread: true, target: 'engineer' },
      { id: 'n-eng-2', icon: '🤖', title: 'AI-проверка ГОСТ завершена', text: 'Проверка раздела ПСД закончена: 0 критических дефектов.', time: '35 мин назад', unread: true, target: 'engineer' },
      { id: 'n-eng-3', icon: '📋', title: 'Подписание акта КС-2', text: 'Заказчик согласовал промежуточный акт скрытых работ.', time: '2 часа назад', unread: false, target: 'engineer' }
    ];
  }
  if (userRole === 'manager') {
    return [
      { id: 'n-mgr-1', icon: '💼', title: 'Новый лид в CRM', text: 'Поступила новая коммерческая заявка от ТОО «КазСтройИнвест».', time: '2 мин назад', unread: true, target: 'manager' },
      { id: 'n-mgr-2', icon: '📊', title: 'Сделка переведена в Дожим', text: 'Заказчик №1085 запросил счет на эскроу-транш №2.', time: '15 мин назад', unread: true, target: 'manager' },
      { id: 'n-mgr-3', icon: '✅', title: 'Успешная сдача объекта', text: 'Подрядчик сдал сметный этап №3 без замечаний.', time: '1 час назад', unread: false, target: 'manager' }
    ];
  }
  if (userRole === 'admin') {
    return [
      { id: 'n-adm-1', icon: '🛡️', title: 'Заявка на верификацию ИП', text: 'ИП «ТемирСтрой» отправил документы на проверку ИИН/БИН.', time: '10 мин назад', unread: true, target: 'admin' },
      { id: 'n-adm-2', icon: '⚖️', title: 'Новый арбитражный спор', text: 'Открыта претензия по качеству заливки монолита (DSP-882).', time: '40 мин назад', unread: true, target: 'admin' },
      { id: 'n-adm-3', icon: '💰', title: 'Обновление ГЭСН 2026', text: 'Индексы удорожания по 17 регионам Казахстана обновлены.', time: '3 часа назад', unread: false, target: 'admin' }
    ];
  }
  if (userRole === 'executor') {
    return [
      { id: 'n-exe-1', icon: '🌐', title: 'Новый доступный заказ', text: 'В ленте заказов: Ремонт офисного помещения 450 м² в г. Астана.', time: '8 мин назад', unread: true, target: 'executor' },
      { id: 'n-exe-2', icon: '💳', title: 'Эскроу-транш зачислен', text: 'Заказчик подтвердил этап №1. Средства готовы к выводу.', time: '45 мин назад', unread: true, target: 'wallet' },
      { id: 'n-exe-3', icon: '📌', title: 'Отклик принят', text: 'Ваше коммерческое предложение выбрано главным исполнителем.', time: '2 часа назад', unread: false, target: 'orders' }
    ];
  }
  return [
    { id: 'n-cus-1', icon: '📸', title: 'Смета готова (AI 2.0)', text: 'Загруженные фото проанализированы: рассчитано 3 сценария цены.', time: '4 мин назад', unread: true, target: 'orders' },
    { id: 'n-cus-2', icon: '💳', title: 'Резерв эскроу-счета', text: 'Безопасная сделка успешно оформлена и защищена гарантом.', time: '30 мин назад', unread: true, target: 'wallet' },
    { id: 'n-cus-3', icon: '🔍', title: 'Отчёт дефектовки', text: 'AI-сканер выявил 2 микротрещины и сформировал отчёт по СНиП.', time: '1 час назад', unread: false, target: 'customer' }
  ];
}

// ── Список городов Казахстана с координатами для автоопределения ──
const KZ_CITIES = [
  { name: 'Алматы', lat: 43.2380, lng: 76.9457 },
  { name: 'Астана', lat: 51.1694, lng: 71.4491 },
  { name: 'Шымкент', lat: 42.3417, lng: 69.5901 },
  { name: 'Караганда', lat: 49.8047, lng: 73.0856 },
  { name: 'Актау', lat: 43.6353, lng: 51.1689 },
  { name: 'Актобе', lat: 50.2839, lng: 57.1670 },
  { name: 'Атырау', lat: 47.1076, lng: 51.9141 },
  { name: 'Тараз', lat: 42.9000, lng: 71.3667 },
  { name: 'Павлодар', lat: 52.2873, lng: 76.9674 },
  { name: 'Усть-Каменогорск', lat: 49.9481, lng: 82.6279 },
  { name: 'Семей', lat: 50.4111, lng: 80.2275 },
  { name: 'Костанай', lat: 53.2198, lng: 63.6354 },
  { name: 'Кызылорда', lat: 44.8488, lng: 65.5093 },
  { name: 'Петропавловск', lat: 54.8753, lng: 69.1408 },
  { name: 'Уральск', lat: 51.2269, lng: 51.3863 },
  { name: 'Талдыкорган', lat: 45.0175, lng: 78.3739 },
  { name: 'Кокшетау', lat: 53.2948, lng: 69.3965 },
  { name: 'Туркестан', lat: 43.3017, lng: 68.2522 },
  { name: 'Жезказган', lat: 47.7833, lng: 67.7131 },
  { name: 'Темиртау', lat: 50.0547, lng: 72.9647 },
];

export default function Header({ role, setRole, theme, toggleTheme, onOpenAuth, onOpenAdmin, onOpenEngineer, currentUser, onLogout, onOpenDashboard, onLogoClick, onOpenProfile, onOpenWallet, onOpenMaterials, onOpenEquipment }) {
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ── Город: выбор + автоопределение GPS ──
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('qazgost_city') || '';
  });
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isDetectingCity, setIsDetectingCity] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Найти ближайший город по координатам
  const findNearestCity = useCallback((lat, lng) => {
    let nearest = KZ_CITIES[0];
    let minDist = Infinity;
    for (const city of KZ_CITIES) {
      const dLat = city.lat - lat;
      const dLng = city.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }
    return nearest.name;
  }, []);

  // GPS автоопределение города
  const handleAutoDetectCity = useCallback(() => {
    if (!navigator.geolocation) {
      // GPS не поддерживается — ставим Алматы и открываем выбор
      if (!selectedCity) {
        setSelectedCity('Алматы');
        localStorage.setItem('qazgost_city', 'Алматы');
      }
      setIsCityDropdownOpen(true);
      return;
    }
    setIsDetectingCity(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Пробуем reverse geocoding через Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`)
          .then(r => r.json())
          .then(data => {
            const addr = data.address || {};
            const detectedCity = addr.city || addr.town || addr.village || addr.state || '';
            // Проверяем, есть ли в нашем списке
            const matched = KZ_CITIES.find(c =>
              detectedCity.toLowerCase().includes(c.name.toLowerCase()) ||
              c.name.toLowerCase().includes(detectedCity.toLowerCase())
            );
            const cityName = matched ? matched.name : findNearestCity(latitude, longitude);
            setSelectedCity(cityName);
            localStorage.setItem('qazgost_city', cityName);
            setIsDetectingCity(false);
          })
          .catch(() => {
            // Fallback: ближайший по координатам
            const cityName = findNearestCity(latitude, longitude);
            setSelectedCity(cityName);
            localStorage.setItem('qazgost_city', cityName);
            setIsDetectingCity(false);
          });
      },
      (err) => {
        setIsDetectingCity(false);
        // GPS отключён/запрещён — ставим Алматы по умолчанию и открываем список
        if (!selectedCity) {
          setSelectedCity('Алматы');
          localStorage.setItem('qazgost_city', 'Алматы');
        }
        setIsCityDropdownOpen(true);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, [findNearestCity]);

  // Выбор города вручную
  const handleCitySelect = useCallback((cityName) => {
    setSelectedCity(cityName);
    localStorage.setItem('qazgost_city', cityName);
    setIsCityDropdownOpen(false);
    // Оповещаем другие компоненты
    window.dispatchEvent(new CustomEvent('city_changed', { detail: { city: cityName } }));
  }, []);

  // Автоопределение при первом заходе (если город ещё не выбран)
  useEffect(() => {
    if (!selectedCity) {
      handleAutoDetectCity();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotifs = React.useCallback(() => {
    if (!currentUser) return;
    const key = `${currentUser.role}_notifications`;
    let raw = localStorage.getItem(key);
    let list = [];
    if (!raw) {
      list = getDefaultNotificationsForRole(currentUser.role);
      localStorage.setItem(key, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) {
          list = getDefaultNotificationsForRole(currentUser.role);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (e) {
        list = getDefaultNotificationsForRole(currentUser.role);
        localStorage.setItem(key, JSON.stringify(list));
      }
    }
    setNotifications(list);
    setUnreadNotifsCount(list.filter(n => n.unread).length);
  }, [currentUser]);

  React.useEffect(() => {
    loadNotifs();
    window.addEventListener('notifications_updated', loadNotifs);
    return () => window.removeEventListener('notifications_updated', loadNotifs);
  }, [currentUser, loadNotifs]);

  const handleNotifClick = (notif) => {
    if (!currentUser) return;
    const key = `${currentUser.role}_notifications`;
    const updated = notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n);
    setNotifications(updated);
    setUnreadNotifsCount(updated.filter(n => n.unread).length);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('notifications_updated'));

    setIsNotifOpen(false);

    if (notif.target === 'wallet' && onOpenWallet) {
      onOpenWallet();
    } else if (notif.target === 'profile' && onOpenProfile) {
      onOpenProfile();
    } else if (notif.target === 'engineer' && onOpenEngineer) {
      onOpenEngineer();
    } else if (notif.target === 'admin' && onOpenAdmin) {
      onOpenAdmin();
    } else if (onOpenDashboard) {
      onOpenDashboard(notif.target || currentUser.role);
    }
  };

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    const key = `${currentUser.role}_notifications`;
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    setUnreadNotifsCount(0);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const handleClearNotifs = () => {
    if (!currentUser) return;
    const key = `${currentUser.role}_notifications`;
    setNotifications([]);
    setUnreadNotifsCount(0);
    localStorage.setItem(key, JSON.stringify([]));
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const toggleDropdown = (menuName) => {
    setActiveNavDropdown(activeNavDropdown === menuName ? null : menuName);
  };

  const closeDropdown = () => {
    setActiveNavDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileAccordion = (name) => {
    setMobileAccordion(mobileAccordion === name ? null : name);
  };

  const handleLogoClick = (e) => {
    closeDropdown();
    if (onLogoClick) onLogoClick(e);
  };

  return (
    <>
      <header className="header-wrapper">
        <div className="container header-container">
        {/* Brand Logo */}
        <a href="#" className="logo-brand" onClick={handleLogoClick}>
          <div className="logo-icon-wrap">
            <span className="logo-spark">✨</span>
            <span className="logo-emoji">🏗️</span>
          </div>
          <div className="logo-text">
            <div className="logo-title-row">
              <span className="logo-title">QazGost AI</span>
              <span className="logo-version-badge">2.0</span>
            </div>
            <span className="logo-subtitle">Платформа смет & AI дефектовки</span>
          </div>
        </a>

        {/* Navigation Dropdowns for 4 Roles */}
        <div className="nav-links-group">
          {/* 1. ROLE: ZA KAZCHIK (ORDERER) */}
          {currentUser && currentUser.role === 'customer' && (
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-dropdown-btn ${activeNavDropdown === 'orderer' ? 'active' : ''}`}
              onClick={() => toggleDropdown('orderer')}
            >
              📋 Заказчик <span className="nav-arrow">▼</span>
            </button>
            {activeNavDropdown === 'orderer' && (
              <div className="dropdown-menu-popover rich-dropdown">
                <div className="dropdown-section-label label-cyan">🛠️ ИНСТРУМЕНТЫ</div>
                <a href="#hero" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📸</span>
                  <span>Оценка стоимости</span>
                </a>
                <a href="#services" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">🔍</span>
                  <span>Проверка дефектов</span>
                </a>
                <a href="#prices" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📏</span>
                  <span>Расчёт объёмов</span>
                </a>
                <a href="#engineering" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">⚙️</span>
                  <span>Инженерные решения</span>
                </a>

                <div className="dropdown-divider"></div>
                <div className="dropdown-section-label label-purple">📂 УПРАВЛЕНИЕ</div>
                <a href="#calendar" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📅</span>
                  <span>Календарь</span>
                </a>
                <a href="#orders" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📬</span>
                  <span>Мои заказы</span>
                </a>
                <a href="#catalog" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📒</span>
                  <span>Каталог подрядчиков</span>
                </a>
                <a href="#equipment" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">🚜</span>
                  <span>Техника / Маркетплейс</span>
                </a>
                <a href="#wallet" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">💳</span>
                  <span>Мой кошелёк</span>
                </a>

                <div className="dropdown-divider"></div>
                <div className="dropdown-section-label label-pink">👤 ПРОФИЛЬ</div>
                <a href="#profile" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📝</span>
                  <span>Моя анкета</span>
                </a>

                <div className="dropdown-divider"></div>
                <a href="#vip" className="dropdown-item vip-item" onClick={closeDropdown}>
                  <span className="item-icon">🏗️</span>
                  <span>Строительство зданий</span>
                  <span className="vip-badge">VIP</span>
                </a>
              </div>
            )}
          </div>
          )}

          {/* 2. ROLE: ISPOLNITEL (CONTRACTOR) */}
          {currentUser && currentUser.role === 'executor' && (
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-dropdown-btn ${activeNavDropdown === 'contractor' ? 'active' : ''}`}
              onClick={() => toggleDropdown('contractor')}
            >
              🔧 Исполнитель <span className="nav-arrow">▼</span>
            </button>
            {activeNavDropdown === 'contractor' && (
              <div className="dropdown-menu-popover rich-dropdown">
                {/* Org Badge */}
                <div className="contractor-org-badge">
                  <span className="org-badge-icon">🔧</span>
                  <div>
                    <div className="org-title">Мастер</div>
                    <div className="org-sub">Заполните анкету</div>
                  </div>
                </div>

                <div className="dropdown-section-label label-cyan">📋 МОИ ЗАКАЗЫ</div>
                <a href="#orders-feed" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">🌐</span>
                  <span>Лента заказов</span>
                </a>
                <a href="#my-works" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📌</span>
                  <span>Мои работы</span>
                </a>
                <a href="#calendar-works" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📅</span>
                  <span>Календарь работ</span>
                </a>

                <div className="dropdown-divider"></div>
                <div className="dropdown-section-label label-purple">🎯 ИНСТРУМЕНТЫ</div>
                <a href="#hero" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📸</span>
                  <span>Оценка стоимости</span>
                </a>
                <a href="#services" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">🔍</span>
                  <span>Проверка дефектов</span>
                </a>
                <a href="#prices" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📏</span>
                  <span>Расчёт объёмов</span>
                </a>

                <div className="dropdown-divider"></div>
                <div className="dropdown-section-label label-green">👤 ПРОФИЛЬ & СЕРВИСЫ</div>
                <a href="#catalog" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📒</span>
                  <span>Каталог подрядчиков</span>
                </a>
                <a href="#profile" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📝</span>
                  <span>Анкета исполнителя</span>
                </a>

                <div className="dropdown-divider"></div>
                <a href="#vip" className="dropdown-item vip-item" onClick={closeDropdown}>
                  <span className="item-icon">🏗️</span>
                  <span>Строительство зданий</span>
                  <span className="vip-badge">VIP</span>
                </a>
                <a href="#volume" className="dropdown-item" onClick={closeDropdown}>
                  <span className="item-icon">📐</span>
                  <span>Фото-объёмы грунта</span>
                </a>
              </div>
            )}
          </div>
          )}

          {/* 3. ROLE: ENGINEER */}
          {currentUser && currentUser.role === 'engineer' && (
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-dropdown-btn ${activeNavDropdown === 'engineer' ? 'active' : ''}`}
              onClick={() => { closeDropdown(); onOpenEngineer(); }}
            >
              👷 Инженер <span className="nav-arrow">▼</span>
            </button>
            {activeNavDropdown === 'engineer' && (
              <div className="dropdown-menu-popover rich-dropdown">
                <a href="#engineering" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">📊</span>
                  <span>Главная панель</span>
                </a>
                <a href="#requests" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">📬</span>
                  <span>Заявки</span>
                </a>
                <a href="#objects" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">🏗️</span>
                  <span>Мои объекты</span>
                </a>
                <a href="#calendar" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">📅</span>
                  <span>Календарь</span>
                </a>
                <a href="#ai-calc" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">🤖</span>
                  <span>AI-просчёт</span>
                </a>
                <a href="#expenses" className="dropdown-item" onClick={() => { closeDropdown(); onOpenEngineer(); }}>
                  <span className="item-icon">💰</span>
                  <span>Расходы</span>
                </a>
              </div>
            )}
          </div>
          )}

          {/* 4. ROLE: ADMIN */}
          {currentUser && currentUser.role === 'admin' && (
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-dropdown-btn btn-admin-nav ${activeNavDropdown === 'admin' ? 'active' : ''}`}
              onClick={() => toggleDropdown('admin')}
            >
              ⚙️ Админ <span className="nav-arrow">▼</span>
            </button>
            {activeNavDropdown === 'admin' && (
              <div className="dropdown-menu-popover rich-dropdown">
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">💰</span>
                  <span>Прайсы</span>
                </a>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">🛡️</span>
                  <span>Модерация</span>
                </a>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">🗺️</span>
                  <span>Регионы</span>
                </a>

                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">📜</span>
                  <span>Журнал действий</span>
                </a>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">📊</span>
                  <span>KPI Dashboard</span>
                </a>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">📈</span>
                  <span>Аналитика</span>
                </a>

                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">⚖️</span>
                  <span>Споры и арбитраж</span>
                </a>
                <a href="#" className="dropdown-item" onClick={() => { closeDropdown(); onOpenAdmin(); }}>
                  <span className="item-icon">📄</span>
                  <span>Договоры</span>
                </a>
              </div>
            )}
          </div>
          )}

          {/* 5. ROLE: MANAGER */}
          {currentUser && currentUser.role === 'manager' && (
          <div className="nav-dropdown-wrapper">
            <button
              className={`nav-dropdown-btn btn-admin-nav ${activeNavDropdown === 'manager' ? 'active' : ''}`}
              onClick={() => { closeDropdown(); onOpenDashboard('manager'); }}
            >
              💼 Менеджер <span className="nav-arrow">▼</span>
            </button>
            {activeNavDropdown === 'manager' && (
              <div className="dropdown-menu-popover rich-dropdown">
                <a href="#crm" className="dropdown-item" onClick={(e) => { e.preventDefault(); closeDropdown(); onOpenDashboard('manager'); }}>
                  <span className="item-icon">📊</span>
                  <span>CRM-система</span>
                </a>
              </div>
            )}
          </div>
          )}

          {/* ── GLOBAL NAV: Materials & Equipment (visible to all) ── */}
          <button
            className="header-nav-link nav-materials"
            onClick={() => { closeDropdown(); if (onOpenMaterials) onOpenMaterials(); }}
            title="Маркетплейс строительных материалов"
          >
            <span>🧱</span>
            <span>Стройматериалы</span>
          </button>

          <button
            className="header-nav-link nav-equipment"
            onClick={() => { closeDropdown(); if (onOpenEquipment) onOpenEquipment(); }}
            title="Маркетплейс спецтехники"
          >
            <span>🚜</span>
            <span>Техника</span>
          </button>

        </div>

        {/* ── CITY SELECTOR WITH GPS AUTO-DETECTION ── */}
        <div className="city-picker-box" style={{ position: 'relative' }}>
          <button
            className="city-select-btn"
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
          >
            <span style={{ fontSize: '0.95rem' }}>📍</span>
            <span>{selectedCity || 'Выберите город'}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▼</span>
          </button>

          {/* GPS Auto-detect button */}
          <button
            className="gps-btn"
            onClick={handleAutoDetectCity}
            disabled={isDetectingCity}
            title="Автоопределение по GPS"
          >
            {isDetectingCity ? '⟳' : '⌖'}
          </button>

          {/* Geo Error tooltip */}
          {geoError && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.95)', color: '#fff',
              padding: '4px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
              whiteSpace: 'nowrap', zIndex: 100000, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}>
              ⚠️ {geoError}
            </div>
          )}

          {/* City Dropdown */}
          {isCityDropdownOpen && (
            <>
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99990 }}
                onClick={() => setIsCityDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                width: '280px', maxHeight: '420px',
                background: 'rgba(10, 18, 38, 0.97)',
                border: '1.5px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
                backdropFilter: 'blur(24px)',
                zIndex: 99999, overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🏙️</span>
                    <strong style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 900 }}>Выбор города</strong>
                  </div>
                  <button
                    onClick={handleAutoDetectCity}
                    disabled={isDetectingCity}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00e5ff', padding: '4px 10px', borderRadius: '8px',
                      fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {isDetectingCity ? (
                      <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Определяю...</>
                    ) : (
                      <>📡 GPS</>
                    )}
                  </button>
                </div>

                {/* City List */}
                <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
                  {KZ_CITIES.map((city) => (
                    <div
                      key={city.name}
                      onClick={() => handleCitySelect(city.name)}
                      style={{
                        padding: '10px 14px', borderRadius: '12px', marginBottom: '2px',
                        background: selectedCity === city.name ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                        border: selectedCity === city.name ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCity !== city.name) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCity !== city.name) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: selectedCity === city.name ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem'
                        }}>
                          📍
                        </span>
                        <span style={{
                          color: selectedCity === city.name ? '#00e5ff' : '#e0e6ed',
                          fontSize: '0.85rem', fontWeight: selectedCity === city.name ? 800 : 500
                        }}>
                          {city.name}
                        </span>
                      </div>
                      {selectedCity === city.name && (
                        <span style={{ color: '#00e5ff', fontSize: '1rem' }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Action Icons & Login */}
        <div className="header-right-actions">
          {/* Utility Capsule Group */}
          <div className="header-utility-group">
            <div 
              className="balance-chip" 
              title="Открыть Мой Кошелёк"
              onClick={onOpenWallet}
            >
              <span>💳</span>
              <span>$0.00</span>
            </div>

            <div className="lang-switch">
              <button className="lang-btn active">RU</button>
              <button className="lang-btn">KZ</button>
              <button className="lang-btn">EN</button>
            </div>
          </div>

          {currentUser && (
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  position: 'relative', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '6px', 
                  borderRadius: '12px', 
                  transition: 'all 0.2s ease', 
                  background: isNotifOpen ? 'rgba(56, 189, 248, 0.18)' : 'transparent' 
                }} 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Уведомления"
              >
                <span style={{ fontSize: '1.4rem' }}>🔔</span>
                {unreadNotifsCount > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 2, 
                    right: 2, 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                    color: '#fff', 
                    fontSize: '0.68rem', 
                    fontWeight: '900', 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)', 
                    border: '2px solid #0f172a' 
                  }}>
                    {unreadNotifsCount}
                  </div>
                )}
              </div>

              {/* NOTIFICATIONS DROPDOWN POPOVER */}
              {isNotifOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99990 }} 
                    onClick={() => setIsNotifOpen(false)} 
                  />
                  
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 12px)',
                      right: 0,
                      width: '360px',
                      maxWidth: '92vw',
                      background: 'rgba(12, 18, 38, 0.96)',
                      border: '1.5px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: '22px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 35px rgba(56, 189, 248, 0.2)',
                      backdropFilter: 'blur(24px)',
                      zIndex: 99999,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header Bar */}
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔔</span>
                        <strong style={{ color: '#fff', fontSize: '1rem', fontWeight: 900 }}>Уведомления</strong>
                        {unreadNotifsCount > 0 && (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                            {unreadNotifsCount} новых
                          </span>
                        )}
                      </div>

                      {notifications.length > 0 && unreadNotifsCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Прочитать всё
                        </button>
                      )}
                    </div>

                    {/* Notifications Body List */}
                    <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.6rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🔕</span>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1' }}>Нет уведомлений</div>
                          <small style={{ fontSize: '0.78rem' }}>Здесь будут появляться важные сообщения и статусы заявок</small>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '16px',
                              marginBottom: '0.4rem',
                              background: notif.unread ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                              border: notif.unread ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start'
                            }}
                          >
                            <span style={{ fontSize: '1.4rem', background: 'rgba(255, 255, 255, 0.08)', padding: '6px', borderRadius: '12px', lineHeight: 1 }}>
                              {notif.icon || '🔔'}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                <strong style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 800 }}>{notif.title}</strong>
                                {notif.unread && (
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                                )}
                              </div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.35', marginBottom: '0.35rem' }}>
                                {notif.text}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>{notif.time || 'Только что'}</span>
                                <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  Перейти ➔
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer Bar */}
                    {notifications.length > 0 && (
                      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Всего: {notifications.length}</span>
                        <button 
                          onClick={handleClearNotifs}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          🗑️ Очистить все
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {currentUser ? (
            <>
              <button className="btn-gold-login" onClick={() => onOpenDashboard(currentUser.role)}>
                <span className="item-icon">👤</span> {currentUser.name || 'Дашборд'}
              </button>
              <button className="btn-glass-reg" onClick={onOpenProfile}>
                📋 Моя анкета
              </button>
              <button className="btn-glass-reg" onClick={onLogout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <button className="btn-gold-login" onClick={() => onOpenAuth('login')}>
                🔑 Вход
              </button>
              <button className="btn-glass-reg" onClick={() => onOpenAuth('register')}>
                📝 Регистрация
              </button>
            </>
          )}
        </div>

        {/* Mobile Header Bar Quick Actions & Hamburger Trigger */}
        <div className="mobile-header-actions">
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile Slide-Out Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          <div className="mobile-nav-backdrop" onClick={closeDropdown} />
          <div className="mobile-nav-drawer">
            <div className="mobile-drawer-header">
              <div className="logo-brand">
                <div className="logo-icon-wrap" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
                  <span>🏗️</span>
                </div>
                <span className="logo-title" style={{ fontSize: '1.1rem' }}>QazGost AI 2.0</span>
              </div>
              <button className="mobile-drawer-close" onClick={closeDropdown}>
                ✕
              </button>
            </div>

            <div className="mobile-drawer-body">
              {currentUser && (
                <>
                  {/* Role Badge / Switcher in Drawer */}
                  <div className="mobile-drawer-section">
                    <div className="role-switcher-toggle" style={{ width: '100%', justifyContent: 'center' }}>
                      {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'customer') && (
                        <button
                          className={`role-tab-btn ${role === 'customer' ? 'active' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setRole('customer')}
                        >
                          📋 Заказчик
                        </button>
                      )}
                      {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'executor') && (
                        <button
                          className={`role-tab-btn ${role === 'executor' ? 'active' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setRole('executor')}
                        >
                          🛠️ Исполнитель
                        </button>
                      )}
                      {currentUser?.role === 'manager' && (
                        <button
                          className={`role-tab-btn ${role === 'manager' ? 'active' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setRole('manager')}
                        >
                          💼 Менеджер
                        </button>
                      )}
                      {currentUser?.role === 'engineer' && (
                        <button
                          className={`role-tab-btn ${role === 'engineer' ? 'active' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setRole('engineer')}
                        >
                          👷 Инженер
                        </button>
                      )}
                      {currentUser?.role === 'company' && (
                        <button
                          className={`role-tab-btn ${role === 'company' ? 'active' : ''}`}
                          style={{ flex: 1, textAlign: 'center' }}
                          onClick={() => setRole('company')}
                        >
                          🏢 Компания
                        </button>
                      )}
                    </div>
                  </div>

              {/* Account Balance */}
              <div 
                className="balance-badge" 
                style={{ justifyContent: 'center', padding: '0.6rem 1rem', cursor: 'pointer' }}
                onClick={() => { if (onOpenWallet) onOpenWallet(); setMobileMenuOpen(false); }}
              >
                <span className="balance-icon">💰</span>
                <span>Баланс: $0.00</span>
              </div>

              {/* Accordion 1: Orderer Menu */}
              <div className="mobile-accordion-wrap">
                <button
                  className={`mobile-accordion-btn ${mobileAccordion === 'orderer' ? 'active' : ''}`}
                  onClick={() => toggleMobileAccordion('orderer')}
                >
                  <span>📋 Меню Заказчика</span>
                  <span>{mobileAccordion === 'orderer' ? '▲' : '▼'}</span>
                </button>
                {mobileAccordion === 'orderer' && (
                  <div className="mobile-accordion-content">
                    <a href="#hero" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📸</span> Оценка стоимости
                    </a>
                    <a href="#services" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>🔍</span> Проверка дефектов
                    </a>
                    <a href="#prices" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📏</span> Расчёт объёмов
                    </a>
                    <a href="#engineering" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>⚙️</span> Инженерные решения
                    </a>
                    <a href="#catalog" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📒</span> Каталог подрядчиков
                    </a>
                    <a href="#equipment" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>🚜</span> Маркетплейс техники
                    </a>
                  </div>
                )}
              </div>

              {/* Accordion 2: Contractor Menu */}
              <div className="mobile-accordion-wrap">
                <button
                  className={`mobile-accordion-btn ${mobileAccordion === 'contractor' ? 'active' : ''}`}
                  onClick={() => toggleMobileAccordion('contractor')}
                >
                  <span>🔧 Меню Исполнителя</span>
                  <span>{mobileAccordion === 'contractor' ? '▲' : '▼'}</span>
                </button>
                {mobileAccordion === 'contractor' && (
                  <div className="mobile-accordion-content">
                    <a href="#orders-feed" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>🌐</span> Лента заказов
                    </a>
                    <a href="#my-works" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📌</span> Мои работы
                    </a>
                    <a href="#hero" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📸</span> Оценка стоимости
                    </a>
                    <a href="#prices" className="mobile-menu-item" onClick={closeDropdown}>
                      <span>📏</span> Калькулятор смет
                    </a>
                  </div>
                )}
              </div>

              {/* Accordion 3: Engineer Portal Button */}
              <button
                className="mobile-accordion-btn"
                style={{ background: 'rgba(37, 99, 235, 0.15)', borderColor: 'var(--primary-light)' }}
                onClick={() => { closeDropdown(); onOpenEngineer(); }}
              >
                <span>👷 Кабинет Инженера</span>
                <span>➔</span>
              </button>

              {/* Accordion 4: Admin Panel Button */}
              <button
                className="mobile-accordion-btn"
                style={{ background: 'rgba(246, 196, 83, 0.15)', borderColor: 'var(--gold-main)' }}
                onClick={() => { closeDropdown(); onOpenAdmin(); }}
              >
                <span>⚙️ Панель Админа</span>
                <span>➔</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                </>
              )}

              {/* Language Switcher */}
              <div className="lang-switch" style={{ width: '100%', justifyContent: 'space-around', padding: '4px' }}>
                <button className="lang-btn active" style={{ flex: 1, padding: '0.4rem' }}>RU</button>
                <button className="lang-btn" style={{ flex: 1, padding: '0.4rem' }}>KZ</button>
                <button className="lang-btn" style={{ flex: 1, padding: '0.4rem' }}>EN</button>
              </div>

              {/* Auth Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem', paddingTop: '1rem' }}>
                {currentUser ? (
                  <>
                    <button className="btn-gold-login" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} onClick={() => { closeDropdown(); onOpenDashboard(currentUser.role); }}>
                      👤 Дашборд
                    </button>
                    <button className="btn-glass-reg" style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }} onClick={() => { closeDropdown(); if (onOpenProfile) onOpenProfile(); }}>
                      📋 Моя анкета
                    </button>
                    <button className="btn-glass-reg" style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }} onClick={() => { closeDropdown(); onLogout(); }}>
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-gold-login" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} onClick={() => { closeDropdown(); onOpenAuth('login'); }}>
                      🔑 Войти в систему
                    </button>
                    <button className="btn-glass-reg" style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }} onClick={() => { closeDropdown(); onOpenAuth('register'); }}>
                      📝 Зарегистрироваться
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}