import React, { useState } from 'react';

export default function Header({ role, setRole, theme, toggleTheme, onOpenAuth, onOpenAdmin, onOpenEngineer, currentUser, onLogout, onOpenDashboard, onLogoClick, onOpenProfile, onOpenWallet }) {
  const [activeNavDropdown, setActiveNavDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  React.useEffect(() => {
    if (!currentUser) return;
    const updateNotifs = () => {
      const key = `${currentUser.role}_notifications`;
      const notifs = JSON.parse(localStorage.getItem(key) || '[]');
      setUnreadNotifsCount(notifs.filter(n => n.unread).length);
    };
    updateNotifs();
    window.addEventListener('notifications_updated', updateNotifs);
    return () => window.removeEventListener('notifications_updated', updateNotifs);
  }, [currentUser]);

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

        </div>

        {/* Right Action Icons & Login */}
        <div className="header-right-actions">
          <div 
            className="balance-badge" 
            title="Открыть Мой Кошелёк"
            style={{ cursor: 'pointer' }}
            onClick={onOpenWallet}
          >
            <span className="balance-icon">💰</span>
            <span className="balance-amount">$0.00</span>
          </div>

          <button className="icon-action-btn" onClick={toggleTheme} title="Переключить тему">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <div className="lang-switch">
            <button className="lang-btn active">RU</button>
            <button className="lang-btn">KZ</button>
            <button className="lang-btn">EN</button>
          </div>

          {currentUser && (
            <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onOpenDashboard(currentUser.role)}>
              <span style={{ fontSize: '1.4rem' }}>🔔</span>
              {unreadNotifsCount > 0 && (
                <div style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {unreadNotifsCount}
                </div>
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
          <button className="icon-action-btn" onClick={toggleTheme} title="Тема">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
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
                  {/* Role Toggle Switcher in Drawer */}
                  <div className="mobile-drawer-section">
                <div className="role-switcher-toggle" style={{ width: '100%', justifyContent: 'center' }}>
                  <button
                    className={`role-tab-btn ${role === 'customer' ? 'active' : ''}`}
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setRole('customer')}
                  >
                    📋 Заказчик
                  </button>
                  <button
                    className={`role-tab-btn ${role === 'executor' ? 'active' : ''}`}
                    style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => setRole('executor')}
                  >
                    🛠️ Исполнитель
                  </button>
                  {currentUser.role === 'manager' && (
                    <button
                      className={`role-tab-btn ${role === 'manager' ? 'active' : ''}`}
                      style={{ flex: 1, textAlign: 'center' }}
                      onClick={() => setRole('manager')}
                    >
                      💼 Менеджер
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