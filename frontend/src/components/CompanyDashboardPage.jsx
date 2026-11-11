import React, { useState, useEffect } from 'react';
import RoleHierarchyTreePage from './RoleHierarchyTreePage';
import { getAuthToken, jsonAuthHeaders } from '../services/platformUtils';

const DONE_STATUS = /заверш|выполн|сдан|закрыт|done|completed/i;
const WORK_STATUS = /в работе|in_progress|progress/i;

export default function CompanyDashboardPage({ currentUser, initialTab = 'profile', sidebarToggleNode }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [employees, setEmployees] = useState([]);
  
  // Settings State
  const defaultSettings = {
    primaryColor: '#a78bfa', // default blue
    showStats: true,
    showEmployees: true,
  };
  const [settings, setSettings] = useState(defaultSettings);

  // Load settings and employees on mount
  useEffect(() => {
    if (currentUser?.id) {
      // Load Settings
      const savedSettings = JSON.parse(localStorage.getItem(`company_settings_${currentUser.id}`)) || defaultSettings;
      setSettings(savedSettings);

      // Load employees that attached to this company
      const savedUsers = JSON.parse(localStorage.getItem('qazgost_registered_users') || '[]');
      const myEmployees = savedUsers.filter(u => u.companyId === currentUser.id);
      setEmployees(myEmployees);
    }
  }, [currentUser]);

  useEffect(() => {
    // If a disabled tab is active, fallback to profile
    if (initialTab === 'employees' && !settings.showEmployees) {
      setActiveTab('profile');
    } else if (initialTab === 'stats' && !settings.showStats) {
      setActiveTab('profile');
    } else {
      setActiveTab(initialTab);
    }
  }, [initialTab, settings]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`company_settings_${currentUser?.id}`, JSON.stringify(newSettings));
  };

  // Статистика — по заказам компании на сервере. Раньше здесь стояли вшитые «12 объектов,
  // 5 заявок, 34 проекта» — одинаковые у любой, даже только что созданной компании.
  const [orderStats, setOrderStats] = useState(null); // null — ещё не загружено или нет связи
  useEffect(() => {
    if (!currentUser?.id || !getAuthToken()) return undefined;
    let cancelled = false;
    fetch('/api/v1/orders', { headers: jsonAuthHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((orders) => {
        if (cancelled || !Array.isArray(orders)) return;
        const company = (currentUser.company || currentUser.name || '').trim().toLowerCase();
        const mine = orders.filter((o) => o.createdBy === currentUser.id
          || (company && String(o.contractor || '').trim().toLowerCase() === company));
        const done = mine.filter((o) => DONE_STATUS.test(o.status || '')).length;
        const inWork = mine.filter((o) => WORK_STATUS.test(o.status || '')).length;
        setOrderStats({ active: mine.length - done, inWork, done });
      })
      .catch(() => { if (!cancelled) setOrderStats(null); });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.company, currentUser?.name]);

  const stat = (v) => (orderStats ? String(v) : '—');
  const stats = [
    { label: 'Активных объектов', value: stat(orderStats?.active), icon: '🏗️', color: settings.primaryColor },
    { label: 'Заявок в работе', value: stat(orderStats?.inWork), icon: '📬', color: settings.primaryColor },
    { label: 'Завершено проектов', value: stat(orderStats?.done), icon: '✅', color: settings.primaryColor },
    { label: 'Всего сотрудников', value: employees.length, icon: '👥', color: settings.primaryColor },
  ];

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {sidebarToggleNode}
          <div>
            <h1 className="cmp-title" style={{ color: '#fff', marginBottom: '0.5rem' }}>
              Дашборд Компании: {currentUser?.name || 'Неизвестно'}
            </h1>
            <p style={{ color: '#a39cc2' }}>Управление сотрудниками и реквизитами</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            type="button"
            className={`cmp-tab${activeTab === 'profile' ? ' is-active' : ''}`}
            aria-pressed={activeTab === 'profile'}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'profile' ? settings.primaryColor : 'rgba(255,255,255,0.1)',
              color: activeTab === 'profile' ? '#fff' : '#a39cc2',
              transition: 'all 0.2s'
            }}>
            Профиль
          </button>

          {settings.showEmployees && (
            <button 
              onClick={() => setActiveTab('employees')}
            type="button"
            className={`cmp-tab${activeTab === 'employees' ? ' is-active' : ''}`}
            aria-pressed={activeTab === 'employees'}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                background: activeTab === 'employees' ? settings.primaryColor : 'rgba(255,255,255,0.1)',
                color: activeTab === 'employees' ? '#fff' : '#a39cc2',
                transition: 'all 0.2s'
              }}>
              Сотрудники
            </button>
          )}

          {settings.showStats && (
            <button 
              onClick={() => setActiveTab('stats')}
            type="button"
            className={`cmp-tab${activeTab === 'stats' ? ' is-active' : ''}`}
            aria-pressed={activeTab === 'stats'}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                background: activeTab === 'stats' ? settings.primaryColor : 'rgba(255,255,255,0.1)',
                color: activeTab === 'stats' ? '#fff' : '#a39cc2',
                transition: 'all 0.2s'
              }}>
              Статистика
            </button>
          )}

          <button 
            onClick={() => setActiveTab('tree')}
            type="button"
            className={`cmp-tab${activeTab === 'tree' ? ' is-active' : ''}`}
            aria-pressed={activeTab === 'tree'}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'tree' ? settings.primaryColor : 'rgba(255,255,255,0.1)',
              color: activeTab === 'tree' ? '#fff' : '#a39cc2',
              transition: 'all 0.2s'
            }}>
            🌳 Древо ролей
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            type="button"
            className={`cmp-tab${activeTab === 'settings' ? ' is-active' : ''}`}
            aria-pressed={activeTab === 'settings'}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'settings' ? '#4b5563' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'settings' ? '#fff' : '#a39cc2',
              transition: 'all 0.2s'
            }}>
            ⚙️ Настройки
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="cmp-panel" style={{ borderRadius: '20px', padding: '2rem', border: `1px solid ${settings.primaryColor}33` }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: settings.primaryColor }}>📝</span> Реквизиты компании
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: '#a39cc2', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Название компании (ТОО/ИП)</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff', borderLeft: `3px solid ${settings.primaryColor}` }}>
                {currentUser?.name || 'Не указано'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#a39cc2', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email администратора</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff', borderLeft: `3px solid ${settings.primaryColor}` }}>
                {currentUser?.email || 'Не указано'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#a39cc2', fontSize: '0.85rem', marginBottom: '0.5rem' }}>БИН/ИИН</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff', borderLeft: `3px solid ${settings.primaryColor}` }}>
                {currentUser?.bin || 'Не указан'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#a39cc2', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Юридический адрес</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff', borderLeft: `3px solid ${settings.primaryColor}` }}>
                {currentUser?.address || (currentUser?.city ? `г. ${currentUser.city} (адрес не указан)` : 'Не указан')}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && settings.showEmployees && (
        <div className="cmp-panel" style={{ borderRadius: '20px', padding: '2rem', border: `1px solid ${settings.primaryColor}33` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <span style={{ color: settings.primaryColor }}>👥</span> Привязанные сотрудники ({employees.length})
            </h2>
          </div>
          
          {employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#a39cc2', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              К вашей компании пока не привязан ни один сотрудник.
              <br/><br/>
              Привязка сотрудников по коду компании пока не работает: в форме регистрации ещё нет поля для этого кода.
              Раздел заработает вместе с этой функцией.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {employees.map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: settings.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{emp.name}</div>
                      <div style={{ color: '#a39cc2', fontSize: '0.85rem' }}>{emp.email} • Роль: {emp.role}</div>
                    </div>
                  </div>
                  <div style={{ color: settings.primaryColor, fontWeight: 'bold', fontSize: '0.9rem', background: `${settings.primaryColor}1A`, padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                    Активен
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && settings.showStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {stats.map((s, idx) => (
            <div key={idx} className="cs-stat" style={{ borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span style={{ color: '#a39cc2', fontSize: '0.9rem', fontWeight: 'bold' }}>{s.label}</span>
              </div>
              <div className="cs-stat-value" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="cmp-panel" style={{ borderRadius: '20px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚙️ Персонализация дашборда Компании
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Color Picker */}
            <div>
              <label style={{ display: 'block', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Основной цвет (Branding)
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#b9a4ff'].map(color => (
                  <button
                    key={color}
                    onClick={() => handleSaveSettings({ ...settings, primaryColor: color })}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: color,
                      border: settings.primaryColor === color ? '3px solid #fff' : 'none',
                      cursor: 'pointer', outline: 'none', transition: 'transform 0.2s',
                      transform: settings.primaryColor === color ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: settings.primaryColor === color ? `0 0 15px ${color}` : 'none'
                    }}
                  />
                ))}
              </div>
              <p style={{ color: '#a39cc2', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Этот цвет будет применяться ко всем кнопкам, акцентам и иконкам в вашем дашборде.
              </p>
            </div>

            {/* Modules Toggle */}
            <div>
              <label style={{ display: 'block', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Активные модули
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.showEmployees}
                    onChange={(e) => handleSaveSettings({ ...settings, showEmployees: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: settings.primaryColor }}
                  />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>Вкладка "Сотрудники"</div>
                    <div style={{ color: '#a39cc2', fontSize: '0.85rem' }}>Показывать список инженеров и мастеров, привязанных к фирме.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.showStats}
                    onChange={(e) => handleSaveSettings({ ...settings, showStats: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: settings.primaryColor }}
                  />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>Вкладка "Статистика"</div>
                    <div style={{ color: '#a39cc2', fontSize: '0.85rem' }}>Аналитика по количеству объектов и статусу работ.</div>
                  </div>
                </label>

              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tree' && (
        <div style={{ background: 'transparent', padding: '0', marginTop: '1rem' }}>
          <RoleHierarchyTreePage hideHeader={true} />
        </div>
      )}
    </div>
  );
}
