import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';
import { KZ_CITIES } from './Header';
import { LEGAL_VERSION } from '../data/legal';
import './AuthModal.css';

// Телефон: в поле — 10 цифр номера, «+7» стоит слева постоянно.
// Вставка полного номера (+7 701…, 8 701…) распознаётся: лишняя первая цифра отбрасывается.
function localPhoneDigits(raw, prevDigits = '') {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length >= 11 && (d[0] === '7' || d[0] === '8') && d.length - prevDigits.length > 1) d = d.slice(1);
  return d.slice(0, 10);
}
function formatLocalPhone(d) {
  if (!d) return '';
  if (d.length <= 3) return '(' + d;
  let out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return out;
}
const isFullKzPhone = (digits) => String(digits || '').length === 10;
const normalizedPhone = (digits) => (isFullKzPhone(digits) ? '+7' + digits : '');

const fieldStyle = { width: '100%', background: 'rgba(10, 8, 28, 0.62)', border: '1px solid rgba(189, 178, 230, 0.22)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' };

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
  const [city, setCity] = useState(() => {
    try { return localStorage.getItem('qazgost_city') || ''; } catch { return ''; }
  });
  const [phone, setPhone] = useState('');
  // Согласия при регистрации (Закон РК «О персональных данных и их защите»)
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Вкладка синхронизируется с режимом открытия (раньше «Регистрация» в шапке открывала вкладку входа)
  useEffect(() => {
    if (mode) {
      setActiveTab(mode);
      setError(null);
    }
  }, [mode]);

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
        const errs = {};
        if (!isFullKzPhone(phone)) errs.phone = 'Укажите номер полностью: 10 цифр после +7';
        if (!city) errs.city = 'Выберите город';
        if (!acceptTerms) errs.terms = 'Нужно принять пользовательское соглашение';
        if (!acceptPrivacy) errs.privacy = 'Нужно согласие на обработку персональных данных';
        setFieldErrors(errs);
        if (Object.keys(errs).length) {
          const order = ['phone', 'city', 'terms', 'privacy'];
          const first = order.find((k) => errs[k]);
          const el = document.getElementById(`auth-${first}`);
          if (el) el.focus();
          const onlyConsents = !errs.phone && !errs.city;
          throw new Error(onlyConsents
            ? 'Чтобы зарегистрироваться, примите соглашение и дайте согласие на обработку персональных данных'
            : 'Проверьте отмеченные поля');
        }

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
          name: fullName, // Go-бэкенд ожидает поле name (fullName игнорировался → пустое имя)
          bin, 
          role: selectedRole, 
          companyId: finalCompanyId,
          hasEquipment,
          equipmentName,
          equipmentCategory,
          pricePerDay: Number(pricePerDay) || 95000,
          plateNumber,
          city,
          phone: normalizedPhone(phone),
          acceptTerms,
          acceptPrivacy,
          marketingOptIn,
          consentVersion: LEGAL_VERSION
        });

        // If registered with equipment, also cache in localStorage for instant frontend visibility in EquipmentMarketplace
        if (hasEquipment || equipmentName) {
          const newEq = {
            id: `eq_${Date.now()}`,
            name: equipmentName || `Спецтехника (${fullName || 'Исполнитель'})`,
            category: equipmentCategory,
            pricePerDay: Number(pricePerDay) || 95000,
            pricePerHour: Math.round((Number(pricePerDay) || 95000) / 8),
            city: city || 'Алматы',
            status: 'Доступен',
            image: equipmentCategory.includes('Грузоподъем') 
              ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'
              : 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
            ownerName: fullName || email.split('@')[0],
            ownerPhone: normalizedPhone(phone),
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
    <div className="modal-overlay qg-auth-overlay" onClick={onClose} style={{ backdropFilter: 'blur(16px)', background: 'rgba(5, 8, 18, 0.75)' }}>
      <div 
        className="modal-content-card qg-auth-card" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, rgba(44, 32, 90, 0.97), rgba(18, 13, 40, 0.98)) padding-box, linear-gradient(150deg, rgba(220, 200, 255, 0.5), rgba(150, 100, 255, 0.12) 38%, rgba(150, 100, 255, 0.08) 62%, rgba(255, 200, 120, 0.7) 88%, rgba(244, 114, 208, 0.75)) border-box',
          border: '1px solid transparent',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,0.95), 0 0 70px -26px rgba(160, 80, 255, 0.6)',
          borderRadius: '28px',
          padding: '2.2rem',
          maxWidth: '480px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Glow Orbs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(246, 196, 83, 0.25), transparent 70%)', pointerEvents: 'none' }} />

        <button 
          type="button"
          className="modal-close-btn"
          aria-label="Закрыть"
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
              background: activeTab === 'login' ? 'linear-gradient(180deg, #f8d27a, #e5a03a)' : 'transparent',
              color: activeTab === 'login' ? '#1c1203' : '#cbc5e3',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? 'none' : 'none',
              transition: 'all 0.25s ease'
            }}
            type="button"
            aria-pressed={activeTab === 'login'}
            onClick={() => { setActiveTab('login'); setError(null); setFieldErrors({}); }}
          >
            Вход
          </button>
          <button
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'register' ? 'linear-gradient(180deg, #f8d27a, #e5a03a)' : 'transparent',
              color: activeTab === 'register' ? '#1c1203' : '#cbc5e3',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? 'none' : 'none',
              transition: 'all 0.25s ease'
            }}
            type="button"
            aria-pressed={activeTab === 'register'}
            onClick={() => { setActiveTab('register'); setError(null); setFieldErrors({}); }}
          >
            Регистрация
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 id="auth-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {activeTab === 'login' ? 'Вход в QazGost AI' : 'Создание учётной записи'}
          </h2>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.86rem', color: '#cbc5e3', fontWeight: 500 }}>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#cbc5e3', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '0.6rem' }}>
              Выберите вашу роль:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Card 1: Заказчик */}
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                style={{
                  background: selectedRole === 'customer' 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: selectedRole === 'customer' 
                    ? '2px solid #7c3aed' 
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
                    ? '0 10px 25px rgba(124, 58, 237, 0.35)' 
                    : 'none',
                  transform: selectedRole === 'customer' ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {selectedRole === 'customer' && (
                  <span style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 900, background: 'rgba(139, 92, 246, 0.2)', padding: '0.15rem 0.45rem', borderRadius: '8px' }}>
                    ✓ Выбрано
                  </span>
                )}
                <span style={{ fontSize: '2.4rem', filter: selectedRole === 'customer' ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))' : 'none' }}>
                  📋
                </span>
                <div>
                  <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', display: 'block' }}>Заказчик</strong>
                  <small style={{ fontSize: '0.78rem', color: selectedRole === 'customer' ? '#ddd6fe' : '#cbc5e3', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
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
                  <small style={{ fontSize: '0.78rem', color: selectedRole === 'executor' ? '#34d399' : '#cbc5e3', fontWeight: 600, marginTop: '0.2rem', display: 'block' }}>
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
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbc5e3', display: 'block', marginBottom: '0.4rem' }}>
                ФИО / Название компании
              </label>
              <input
                type="text"
                className="custom-input"
                placeholder="Иван Иванов или ТОО СтройПроект"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                id="auth-name"
                autoComplete="name"
                style={{ background: 'rgba(21, 18, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
          )}

          {activeTab === 'register' && (
            <div className="qg-auth-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="auth-phone" className="qg-auth-label">Телефон</label>
                <div className="qg-auth-phone">
                  <span className="qg-auth-phone-prefix" aria-hidden="true">+7</span>
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="(701) 555-44-33"
                    required
                    value={formatLocalPhone(phone)}
                    onChange={(e) => { const v = e.target.value; setPhone((prev) => localPhoneDigits(v, prev)); if (fieldErrors.phone) setFieldErrors((f) => ({ ...f, phone: null })); }}
                    aria-invalid={fieldErrors.phone ? 'true' : undefined}
                    aria-describedby={fieldErrors.phone ? 'auth-phone-err' : 'auth-phone-hint'}
                    style={{ ...fieldStyle, paddingLeft: '2.6rem', borderColor: fieldErrors.phone ? 'rgba(255, 92, 138, 0.8)' : fieldStyle.borderColor }}
                  />
                </div>
                {fieldErrors.phone
                  ? <p id="auth-phone-err" className="qg-auth-err">{fieldErrors.phone}</p>
                  : <p id="auth-phone-hint" className="qg-auth-hint">+7 и 10 цифр — для связи по заказам</p>}
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="auth-city" className="qg-auth-label">Город</label>
                <select
                  id="auth-city"
                  required
                  value={city}
                  onChange={(e) => { setCity(e.target.value); if (fieldErrors.city) setFieldErrors((f) => ({ ...f, city: null })); }}
                  aria-invalid={fieldErrors.city ? 'true' : undefined}
                  aria-describedby={fieldErrors.city ? 'auth-city-err' : undefined}
                  style={{ ...fieldStyle, borderColor: fieldErrors.city ? 'rgba(255, 92, 138, 0.8)' : fieldStyle.borderColor }}
                >
                  <option value="" disabled>Выберите город</option>
                  {KZ_CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                {fieldErrors.city && <p id="auth-city-err" className="qg-auth-err">{fieldErrors.city}</p>}
              </div>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbc5e3', display: 'block', marginBottom: '0.4rem' }}>
              Email адрес
            </label>
            <input
              type="email"
              className="custom-input"
              placeholder="example@qazgost.kz"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(21, 18, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbc5e3', display: 'block', marginBottom: '0.4rem' }}>
              Пароль
            </label>
            <input
              type="password"
              className="custom-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: 'rgba(21, 18, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '14px', padding: '0.85rem 1.1rem', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          {/* Quick Demo Login Presets — только авторизованные аккаунты команды */}
          {activeTab === 'login' && (
            <div style={{ marginTop: '0.2rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#a39cc2', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                ⚡ Быстрый вход (авторизованные):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setEmail('manager@qazgost.kz'); setPassword('manager123'); }}
                  style={{ background: 'rgba(185, 164, 255, 0.12)', border: '1px solid rgba(185, 164, 255, 0.3)', color: '#b9a4ff', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
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
                    <label style={{ fontSize: '0.78rem', color: '#cbc5e3', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Категория техники:
                    </label>
                    <select 
                      value={equipmentCategory} 
                      onChange={e => setEquipmentCategory(e.target.value)}
                      style={{ width: '100%', background: 'rgba(21, 18, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
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
                    <label style={{ fontSize: '0.78rem', color: '#cbc5e3', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      Марка и модель (например: CAT 320D, КамАЗ 6520, JCB 3CX):
                    </label>
                    <input 
                      type="text" 
                      placeholder="Гусеничный экскаватор CAT 320D"
                      value={equipmentName}
                      onChange={e => setEquipmentName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(21, 18, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbc5e3', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Аренда (₸/смена):
                      </label>
                      <input 
                        type="number" 
                        placeholder="95000"
                        value={pricePerDay}
                        onChange={e => setPricePerDay(e.target.value)}
                        style={{ width: '100%', background: 'rgba(21, 18, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#cbc5e3', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                        Госномер / ID:
                      </label>
                      <input 
                        type="text" 
                        placeholder="01 777 KZ 02"
                        value={plateNumber}
                        onChange={e => setPlateNumber(e.target.value)}
                        style={{ width: '100%', background: 'rgba(21, 18, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.65rem 0.8rem', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>
                  <p className="qg-auth-hint" style={{ margin: 0 }}>Город и телефон для заказов техники берутся из полей выше.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <fieldset className="qg-auth-consents">
              <legend className="qg-auth-sr">Согласия</legend>
              <label className={`qg-auth-check${fieldErrors.terms ? ' is-invalid' : ''}`}>
                <input
                  id="auth-terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => { setAcceptTerms(e.target.checked); if (fieldErrors.terms) setFieldErrors((f) => ({ ...f, terms: null })); }}
                  aria-invalid={fieldErrors.terms ? 'true' : undefined}
                  aria-describedby={fieldErrors.terms ? 'auth-terms-err' : undefined}
                />
                <span>
                  Мне есть 18 лет, я принимаю{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">пользовательское соглашение</a>
                  <b className="qg-auth-req" aria-hidden="true"> *</b>
                </span>
              </label>
              {fieldErrors.terms && <p id="auth-terms-err" className="qg-auth-err">{fieldErrors.terms}</p>}

              <label className={`qg-auth-check${fieldErrors.privacy ? ' is-invalid' : ''}`}>
                <input
                  id="auth-privacy"
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => { setAcceptPrivacy(e.target.checked); if (fieldErrors.privacy) setFieldErrors((f) => ({ ...f, privacy: null })); }}
                  aria-invalid={fieldErrors.privacy ? 'true' : undefined}
                  aria-describedby={fieldErrors.privacy ? 'auth-privacy-err' : undefined}
                />
                <span>
                  Даю{' '}
                  <a href="/consent" target="_blank" rel="noopener noreferrer">согласие на сбор и обработку персональных данных</a>
                  , в том числе на их передачу за рубеж, и ознакомлен(а) с{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">политикой конфиденциальности</a>
                  <b className="qg-auth-req" aria-hidden="true"> *</b>
                </span>
              </label>
              {fieldErrors.privacy && <p id="auth-privacy-err" className="qg-auth-err">{fieldErrors.privacy}</p>}

              <label className="qg-auth-check">
                <input
                  id="auth-marketing"
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                <span>Хочу получать новости и предложения по email, SMS и WhatsApp. Можно отказаться в любой момент.</span>
              </label>
              <p className="qg-auth-hint" style={{ margin: 0 }}><b className="qg-auth-req" aria-hidden="true">*</b> — обязательно для регистрации</p>
            </fieldset>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              background: 'linear-gradient(180deg, #f8d27a, #e5a03a)',
              border: 'none',
              borderRadius: '16px',
              padding: '1rem',
              color: '#1c1203',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 12px 30px -12px rgba(242, 184, 75, 0.75)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.4px'
            }}
          >
            {loading ? 'Обработка…' : activeTab === 'login' ? 'Войти в систему →' : 'Зарегистрироваться →'}
          </button>
        </form>
      </div>
    </div>
  );
}
