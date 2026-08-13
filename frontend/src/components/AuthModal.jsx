import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ mode, onClose, onLogin }) {
  const [activeTab, setActiveTab] = useState(mode || 'login');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bin, setBin] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!mode) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'login') {
        const res = await loginUser(email, password);
        if (onLogin && res.user) onLogin(res.user);
      } else {
        let finalCompanyId = null;
        if (inviteCodeInput.trim()) {
          const savedUsers = JSON.parse(localStorage.getItem('qazgost_registered_users') || '[]');
          const company = savedUsers.find(u => u.role === 'company' && u.inviteCode === inviteCodeInput.trim());
          if (!company) {
            throw new Error('Неверный ID компании (Invite Code). Проверьте код и попробуйте снова.');
          }
          finalCompanyId = company.id;
        }
        
        const res = await registerUser({ email, password, fullName, bin, role: selectedRole, companyId: finalCompanyId });
        if (onLogin && res.user) onLogin(res.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Modal Auth Tabs */}
        <div className="modal-auth-tabs">
          <button
            className={`modal-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            🔑 Вход
          </button>
          <button
            className={`modal-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            📝 Регистрация
          </button>
        </div>

        <h2 className="modal-title">
          {activeTab === 'login' ? 'Вход в QazGost AI' : 'Создание учётной записи'}
        </h2>
        <p className="modal-sub">
          {activeTab === 'login'
            ? 'Введите email и пароль для доступа к платформе'
            : 'Заполните данные для создания аккаунта в системе QazGost'}
        </p>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Role Select for Register */}
        {activeTab === 'register' && (
          <div className="modal-role-selector">
            <label className="input-label">Выберите вашу роль:</label>
            <div className="role-cards-grid">
              <button
                type="button"
                className={`modal-role-card ${selectedRole === 'customer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('customer')}
              >
                <span>📋</span>
                <div>
                  <strong>Заказчик</strong>
                  <small>Поиск мастеров</small>
                </div>
              </button>

              <button
                type="button"
                className={`modal-role-card ${selectedRole === 'executor' ? 'active' : ''}`}
                onClick={() => setSelectedRole('executor')}
              >
                <span>🛠️</span>
                <div>
                  <strong>Исполнитель</strong>
                  <small>Выполнение заказов</small>
                </div>
              </button>

              <button
                type="button"
                className={`modal-role-card ${selectedRole === 'engineer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('engineer')}
              >
                <span>📐</span>
                <div>
                  <strong>Инженер</strong>
                  <small>Технадзор РК</small>
                </div>
              </button>

              <button
                type="button"
                className={`modal-role-card ${selectedRole === 'company' ? 'active' : ''}`}
                onClick={() => setSelectedRole('company')}
              >
                <span>🏢</span>
                <div>
                  <strong>Компания</strong>
                  <small>ТОО / ИП</small>
                </div>
              </button>

              <button
                type="button"
                className={`modal-role-card ${selectedRole === 'manager' ? 'active' : ''}`}
                onClick={() => setSelectedRole('manager')}
              >
                <span>💼</span>
                <div>
                  <strong>Менеджер</strong>
                  <small>Управление CRM</small>
                </div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="input-label">ФИО / Название компании</label>
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Иван Иванов или ТОО СтройПроект"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {(selectedRole === 'executor' || selectedRole === 'engineer' || selectedRole === 'manager') && (
                <div className="form-group">
                  <label className="input-label">Привязаться к компании (необязательно)</label>
                  <input 
                    type="text"
                    className="custom-input" 
                    placeholder="Например: C-12345 (Выдается вашей компанией)"
                    value={inviteCodeInput} 
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                  />
                </div>
              )}

              {selectedRole === 'company' && (
                <div className="form-group">
                  <label className="input-label">БИН / ИИН компании</label>
                  <input 
                    type="text"
                    className="custom-input" 
                    placeholder="Введите 12 цифр"
                    maxLength={12}
                    required
                    value={bin} 
                    onChange={(e) => setBin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="input-label">Email адрес</label>
            <input
              type="email"
              className="custom-input"
              placeholder="example@qazgost.kz"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="input-label">Пароль</label>
            <input
              type="password"
              className="custom-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? 'Обработка...' : activeTab === 'login' ? 'Войти в систему ➔' : 'Зарегистрироваться ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}
