import React, { useState, useEffect } from 'react';

export default function CompanyDashboardPage({ currentUser, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [employees, setEmployees] = useState([]);
  
  // Example dummy stats
  const stats = [
    { label: 'Активных объектов', value: '12', icon: '🏗️', color: '#10b981' },
    { label: 'Заявок в работе', value: '5', icon: '📬', color: '#3b82f6' },
    { label: 'Завершено проектов', value: '34', icon: '✅', color: '#8b5cf6' },
    { label: 'Всего сотрудников', value: employees.length, icon: '👥', color: '#f59e0b' },
  ];

  useEffect(() => {
    // Load employees that attached to this company
    const savedUsers = JSON.parse(localStorage.getItem('qazgost_registered_users') || '[]');
    const myEmployees = savedUsers.filter(u => u.companyId === currentUser?.id);
    setEmployees(myEmployees);
  }, [currentUser]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            Дашборд Компании: {currentUser?.name || 'Неизвестно'}
          </h1>
          <p style={{ color: '#94a3b8' }}>Управление сотрудниками и реквизитами</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'profile' ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'profile' ? '#fff' : '#94a3b8'
            }}>
            Профиль
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'employees' ? '#10b981' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'employees' ? '#fff' : '#94a3b8'
            }}>
            Сотрудники
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              background: activeTab === 'stats' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'stats' ? '#fff' : '#94a3b8'
            }}>
            Статистика
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📝 Реквизиты компании
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Название компании (ТОО/ИП)</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff' }}>
                {currentUser?.name || 'Не указано'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Email администратора</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff' }}>
                {currentUser?.email || 'Не указано'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>БИН/ИИН (Демо)</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff' }}>
                123456789012
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Юридический адрес (Демо)</label>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', color: '#fff' }}>
                г. Алматы, пр. Абая 150
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👥 Привязанные сотрудники ({employees.length})
          </h2>
          
          {employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              К вашей компании пока не привязан ни один сотрудник.
              <br/>
              При регистрации сотрудники могут выбрать вашу компанию в выпадающем списке.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {employees.map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{emp.name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{emp.email} • Роль: {emp.role}</div>
                    </div>
                  </div>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', background: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                    Активен
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {stats.map((s, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
