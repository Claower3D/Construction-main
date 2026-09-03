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

  // Machinery / Equipment Questionnaire state for Executor
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentCategory, setEquipmentCategory] = useState('Землеройная техника');
  const [pricePerDay, setPricePerDay] = useState('95000');
  const [plateNumber, setPlateNumber] = useState('');
  const [city, setCity] = useState('Алматы');
  const [phone, setPhone] = useState('');

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
        
        const res = await registerUser({ 
          email, 
          password, 
          fullName, 
          bin, 
          role: selectedRole, 
          companyId: finalCompanyId,
          hasEquipment,
          equipmentName,
          equipmentCategory,
          pricePerDay: Number(pricePerDay) || 95000,
          plateNumber,
          city: city || 'Алматы',
          phone: phone || '+7 (777) 123-45-67'
        });

        // If registered with equipment, also cache in localStorage for instant frontend visibility in EquipmentMarketplace
        if (hasEquipment || equipmentName) {
          const newEq = {
            id: `eq_${Date.now()}`,
            name: equipmentName || `Спецтехника (${fullName || 'Исполнитель'})`,
            category: equipmentCategory,
            pricePerDay: Number(pricePerDay) || 95000,
            pricePerHour: Math.round((Number(pricePerDay) || 95000) / 8),
            city: (city || 'Алматы'),
            status: 'Доступен',
            image: equipmentCategory.includes('Грузоподъем') 
              ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'
              : 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
            ownerName: fullName || email.split('@')[0],
            ownerPhone: phone || '+7 (777) 123-45-67',
            plateNumber: plateNumber || '01 777 KZ 02',
            rating: 5.0,
            reviewsCount: 1,
            distanceKm: 1.5,
            isLiveGps: true
          };

          try {
            const customEqList = JSON.parse(localStorage.getItem('qazgost_custom_equipment') || '[]');
            localStorage.setItem('qazgost_custom_equipment', JSON.stringify([newEq, ...customEqList]));
          } catch(e) {}
        }

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
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(16px)', background: 'rgba(5, 8, 18, 0.75)' }}>
      <div 
        className="modal-content-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(20, 26, 48, 0.95), rgba(12, 16, 32, 0.98))',
          border: '1px solid rgba(246, 196, 83, 0.3)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(246, 196, 83, 0.12)',
          borderRadius: '28px',
          padding: '2.2rem',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Glow Orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(246, 196, 83, 0.25), transparent 70%)', pointerEvents: 'none' }} />

        <button 
          className="modal-close-btn" 
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '12px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
        >
          ✕
        </button>

        {/* Modal Auth Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.35)', padding: '0.35rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
          <button
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'login' ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'transparent',
              color: activeTab === 'login' ? '#fff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
            onClick={() => setActiveTab('login')}
          >
            🔑 Вход в систему
          </button>
          <button
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'register' ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'transparent',
              color: activeTab === 'register' ? '#fff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
            onClick={() => setActiveTab('register')}
          >
            📝 Регистрация
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '0.4px' }}>
            {activeTab === 'login' ? 'Вход в QazGost AI' : 'Создание учётной записи'}
          </h2>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 500 }}>
            {activeTab === 'login'
              ? 'Введите email и пароль для доступа к платформе'
              : 'Заполните данные для создания аккаунта в системе QazGost'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '0.88rem', marginBottom: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* 2 STUNNING ROLE CARDS FOR REGISTER */}
        {activeTab === 'register' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '0.6rem' }}>
              Выберите вашу роль:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Card 1: Заказчик */}
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                style={{
                  background: selectedRole === 'customer' 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(59, 130, 246, 0.25))' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedRole === 'customer' 
                    ? '2px solid #2563eb' 
                    : '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '1.25rem 0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  boxShadow: selectedRole === 'customer' 
                    ? '0 10px 25px rgba(37, 99, 235, 0.35)' 
                    : 'none',
                  transform: selectedRole === 'customer' ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {selectedRole === 'customer' && (
                  <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.72rem', color: '#3b82f6', fontWeight: 900, background: 'rgba(59, 130, 246, 0.2)', padding: '0.15rem 0.45rem', borderRadius: '8px' }}>
                    ✓ Выбрано
                  </span>
                )}
                <span style={{ fontSize: '2.4rem', filter: selectedRole === 'customer' ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))' : 'none' }}>
                  📋
                </span>
                <div>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', display: 'block' }}>Заказчик</strong>
                  <small style={{ fontSize: '0.78rem', color: selectedRole === 'customer' ? '#93c5fd' : '#cbd5e1', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
                    Поиск мастеров и сметы
                  </small>
                </div>
              </button>

              {/* Card 2: Исполнитель */}
              <button
                type="button"
                onClick={() => setSelectedRole('executor')}
                style={{
                  background: selectedRole === 'executor' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(52, 211, 153, 0.25))' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedRole === 'executor' 
                    ? '2px solid #10b981' 
                    : '1.5px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '1.25rem 0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  boxShadow: selectedRole === 'executor' 
                    ? '0 10px 25px rgba(16, 185, 129, 0.35)' 
                    : 'none',
                  transform: selectedRole === 'executor' ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {selectedRole === 'executor' && (
                  <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.72rem', color: '#34d399', fontWeight: 900, background: 'rgba(52, 211, 153, 0.2)', padding: '0.15rem 0.45rem', borderRadius: '8px' }}>
                    ✓ Выбрано
                  </span>
                )}
                <span style={{ fontSize: '2.4rem', filter: selectedRole === 'executor' ? 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.6))' : 'none' }}>
                  🛠️
                </span>
                <div>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', display: 'block' }}>Исполнитель</strong>
                  <small style={{ fontSize: '0.78rem', color: selectedRole === 'executor' ? '#34d399' : '#cbd5e1', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
                    Выполнение заказов
                  </small>
                </div>
              </button>

            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeTab === 'register' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                ФИО / Название компании
              </label>
              <input
                type="text"
                className="custom-input"
                placeholder="Иван Иванов или ТОО СтройПроект"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Email адрес
            </label>
            <input
              type="email"
              className="custom-input"
              placeholder="example@qazgost.kz"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
              Пароль
            </label>
            <input
              type="password"
              className="custom-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          {/* Quick Demo Login Presets — только авторизованные аккаунты команды */}
          {activeTab === 'login' && (
            <div style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                ⚡ Быстрый вход (авторизованные):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setEmail('manager@qazgost.kz'); setPassword('manager123'); }}
                  style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  💼 Менеджер Саша
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@qazgost.kz'); setPassword('admin123'); }}
                  style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  👑 Админ
                </button>
              </div>
            </div>
          )}

          {/* Machinery Questionnaire for Executor */}
          {activeTab === 'register' && selectedRole === 'executor' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1rem', marginTop: '0.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={hasEquipment} 
                  onChange={e => setHasEquipment(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>🚜 Добавить спецтехнику в Маркетплейс</span>
              </label>

              {hasEquipment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Категория техники:
                    </label>
                    <select 
                      value={equipmentCategory} 
                      onChange={e => setEquipmentCategory(e.target.value)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                    >
                      <option value="Землеройная техника">⛏️ Экскаватор / Землеройная</option>
                      <option value="Грузоподъемная техника">🏗️ Автокран / Манипулятор</option>
                      <option value="Бетонное оборудование">🧱 Бетононасос / Миксер</option>
                      <option value="Самосвалы и тягачи">🚚 Самосвал / Трал</option>
                      <option value="Погрузчики">🚜 Экскаватор-погрузчик / Bobcat</option>
                      <option value="Буровое оборудование">⛑️ Буровая установка</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Марка и модель (например: CAT 320D, КамАЗ 6520, JCB 3CX):
                    </label>
                    <input 
                      type="text" 
                      placeholder="Гусеничный экскаватор CAT 320D"
                      value={equipmentName}
                      onChange={e => setEquipmentName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Аренда (₸/смена):
                      </label>
                      <input 
                        type="number" 
                        placeholder="95000"
                        value={pricePerDay}
                        onChange={e => setPricePerDay(e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Город базирования:
                      </label>
                      <input 
                        type="text" 
                        placeholder="Алматы"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Госномер / ID:
                      </label>
                      <input 
                        type="text" 
                        placeholder="01 777 KZ 02"
                        value={plateNumber}
                        onChange={e => setPlateNumber(e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Телефон диспетчера:
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+7 (777) 123-45-67"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(90deg, #f59e0b, #38bdf8, #2563eb)',
              border: 'none',
              borderRadius: '16px',
              padding: '1rem',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(56, 189, 248, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.4px'
            }}
          >
            {loading ? 'Обработка...' : activeTab === 'login' ? 'Войти в систему ➔' : 'Зарегистрироваться ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}
