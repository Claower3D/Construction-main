import React, { useState, useEffect } from 'react';
import { ClipboardList, HardHat, Check, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../services/api';
import { KZ_CITIES } from './Header';
import { LEGAL_VERSION } from '../data/legal';
import { localPhoneDigits, formatLocalPhone, isFullKzPhone, normalizedPhone } from '../utils/phone';
import './RegisterPage.css';

const ROLES = [
  { id: 'customer', title: 'Заказчик', desc: 'Считаю сметы, ищу мастеров', Icon: ClipboardList },
  { id: 'executor', title: 'Исполнитель', desc: 'Беру заказы, сдаю технику', Icon: HardHat },
];

const BENEFITS = {
  customer: [
    'Смета по фото и размерам — с источником цены в каждой строке',
    'Проверка дефектов по нормативам СНиП и ГОСТ РК',
    'Подрядчики, стройматериалы и спецтехника в одном кабинете',
  ],
  executor: [
    'Лента заказов по всему Казахстану',
    'Отклик с ценой и сроками прямо в карточке заказа',
    'Своя техника в маркетплейсе — арендаторы находят вас сами',
  ],
};

const EQUIPMENT_CATEGORIES = [
  ['Землеройная техника', 'Экскаватор / землеройная'],
  ['Грузоподъемная техника', 'Автокран / манипулятор'],
  ['Бетонное оборудование', 'Бетононасос / миксер'],
  ['Самосвалы и тягачи', 'Самосвал / трал'],
  ['Погрузчики', 'Погрузчик / Bobcat'],
  ['Буровое оборудование', 'Буровая установка'],
];

// Отдельная страница регистрации (/register): компактная форма, помещается в экран при масштабе 100%
export default function RegisterPage({ currentUser, onRegistered, onOpenLogin, onOpenDashboard }) {
  const [role, setRole] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(() => {
    try { return localStorage.getItem('qazgost_city') || ''; } catch { return ''; }
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentCategory, setEquipmentCategory] = useState('Землеройная техника');
  const [equipmentName, setEquipmentName] = useState('');
  const [pricePerDay, setPricePerDay] = useState('95000');
  const [plateNumber, setPlateNumber] = useState('');

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Регистрация — QazGost AI';
    return () => { document.title = prev; };
  }, []);

  const clearError = (key) => { if (errors[key]) setErrors((e) => ({ ...e, [key]: null })); };

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.name = 'Укажите имя или название организации';
    if (!isFullKzPhone(phone)) e.phone = 'Нужно 10 цифр после +7';
    if (!city) e.city = 'Выберите город';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Проверьте email';
    if (password.length < 6) e.password = 'Не меньше 6 символов';
    if (!acceptTerms) e.terms = 'Нужно принять соглашение';
    if (!acceptPrivacy) e.privacy = 'Нужно согласие на обработку данных';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    const order = ['name', 'phone', 'city', 'email', 'password', 'terms', 'privacy'];
    const first = order.find((k) => e[k]);
    if (first) {
      const el = document.getElementById(`reg-${first}`);
      if (el) el.focus();
      setFormError(Object.keys(e).every((k) => k === 'terms' || k === 'privacy')
        ? 'Чтобы создать аккаунт, примите соглашение и дайте согласие на обработку персональных данных'
        : 'Проверьте отмеченные поля');
      return;
    }

    setLoading(true);
    try {
      const withEquipment = role === 'executor' && hasEquipment;
      const res = await registerUser({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        name: fullName.trim(),
        role,
        city,
        phone: normalizedPhone(phone),
        acceptTerms,
        acceptPrivacy,
        marketingOptIn,
        consentVersion: LEGAL_VERSION,
        hasEquipment: withEquipment,
        equipmentName: withEquipment ? equipmentName : '',
        equipmentCategory: withEquipment ? equipmentCategory : '',
        pricePerDay: withEquipment ? (Number(pricePerDay) || 95000) : 0,
        plateNumber: withEquipment ? plateNumber : '',
      });

      // техника сразу видна в маркетплейсе этого браузера, не дожидаясь обновления каталога
      if (withEquipment) {
        try {
          const list = JSON.parse(localStorage.getItem('qazgost_custom_equipment') || '[]');
          localStorage.setItem('qazgost_custom_equipment', JSON.stringify([{
            id: `eq_${Date.now()}`,
            name: equipmentName || `Спецтехника (${fullName.trim()})`,
            category: equipmentCategory,
            pricePerDay: Number(pricePerDay) || 95000,
            pricePerHour: Math.round((Number(pricePerDay) || 95000) / 8),
            city,
            status: 'Доступен',
            image: '',
            ownerName: fullName.trim(),
            ownerPhone: normalizedPhone(phone),
            plateNumber,
            rating: 5.0,
            reviewsCount: 0,
          }, ...list]));
        } catch { /* хранилище недоступно — техника появится после обновления каталога */ }
      }

      if (onRegistered && res.user) onRegistered(res.user);
    } catch (err) {
      setFormError(err.message || 'Не удалось создать аккаунт');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && currentUser.role) {
    return (
      <div className="rg-page">
        <div className="rg-done">
          <h1>Вы уже вошли</h1>
          <p>Аккаунт: {currentUser.name || currentUser.email}. Чтобы создать другой, сначала выйдите из этого.</p>
          <button type="button" className="rg-submit" onClick={() => onOpenDashboard && onOpenDashboard(currentUser.role)}>Перейти в кабинет →</button>
        </div>
      </div>
    );
  }

  const fieldProps = (key) => ({
    id: `reg-${key}`,
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `reg-${key}-err` : undefined,
    className: `rg-input${errors[key] ? ' is-invalid' : ''}`,
  });
  const err = (key) => (errors[key] ? <p id={`reg-${key}-err`} className="rg-err">{errors[key]}</p> : null);

  return (
    <div className="rg-page">
      <div className="rg-grid">
        <aside className="rg-aside">
          <p className="rg-pill"><span aria-hidden="true" />Бесплатно, займёт минуту</p>
          <h1>Регистрация в&nbsp;QazGost&nbsp;AI</h1>
          <p className="rg-lead">Сметы по фото, проверка дефектов и заказы для бригад — в одном кабинете.</p>
          <ul className="rg-benefits">
            {BENEFITS[role].map((b) => (
              <li key={b}><Check size={18} aria-hidden="true" />{b}</li>
            ))}
          </ul>
        </aside>

        <form className="rg-card" onSubmit={handleSubmit} noValidate aria-labelledby="rg-form-title">
          <h2 id="rg-form-title" className="rg-card-title">Новый аккаунт</h2>

          {formError && <div className="rg-alert" role="alert">{formError}</div>}

          <div className="rg-roles" role="radiogroup" aria-label="Кто вы">
            {ROLES.map(({ id, title, desc, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={role === id}
                className="rg-role"
                onClick={() => setRole(id)}
              >
                <Icon size={20} aria-hidden="true" />
                <span><b>{title}</b><small>{desc}</small></span>
              </button>
            ))}
          </div>

          <div className="rg-field rg-span">
            <label htmlFor="reg-name">{role === 'executor' ? 'Имя или название бригады / компании' : 'Имя или название компании'}</label>
            <input
              {...fieldProps('name')}
              type="text"
              autoComplete="name"
              placeholder={role === 'executor' ? 'Бригада «Мастер» или Айдос Ким' : 'Айгерим Сапарова'}
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearError('name'); }}
            />
            {err('name')}
          </div>

          <div className="rg-field">
            <label htmlFor="reg-phone">Телефон</label>
            <div className="rg-phone">
              <span aria-hidden="true">+7</span>
              <input
                {...fieldProps('phone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(701) 555-44-33"
                value={formatLocalPhone(phone)}
                onChange={(e) => { const v = e.target.value; setPhone((prev) => localPhoneDigits(v, prev)); clearError('phone'); }}
              />
            </div>
            {err('phone')}
          </div>

          <div className="rg-field">
            <label htmlFor="reg-city">Город</label>
            <select
              {...fieldProps('city')}
              value={city}
              onChange={(e) => { setCity(e.target.value); clearError('city'); }}
            >
              <option value="" disabled>Выберите город</option>
              {KZ_CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {err('city')}
          </div>

          <div className="rg-field">
            <label htmlFor="reg-email">Email</label>
            <input
              {...fieldProps('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.kz"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
            />
            {err('email')}
          </div>

          <div className="rg-field">
            <label htmlFor="reg-password">Пароль</label>
            <div className="rg-password">
              <input
                {...fieldProps('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Не меньше 6 символов"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
              />
              <button
                type="button"
                className="rg-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {err('password')}
          </div>

          {role === 'executor' && (
            <div className="rg-span rg-equip">
              <label className="rg-check">
                <input type="checkbox" checked={hasEquipment} onChange={(e) => setHasEquipment(e.target.checked)} />
                <span>Есть своя спецтехника — добавить в маркетплейс</span>
              </label>
              {hasEquipment && (
                <div className="rg-equip-grid">
                  <div className="rg-field">
                    <label htmlFor="reg-eq-cat">Вид техники</label>
                    <select id="reg-eq-cat" className="rg-input" value={equipmentCategory} onChange={(e) => setEquipmentCategory(e.target.value)}>
                      {EQUIPMENT_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="rg-field">
                    <label htmlFor="reg-eq-name">Марка и модель</label>
                    <input id="reg-eq-name" className="rg-input" type="text" placeholder="CAT 320D, КамАЗ 6520" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
                  </div>
                  <div className="rg-field">
                    <label htmlFor="reg-eq-price">Аренда, ₸ за смену</label>
                    <input id="reg-eq-price" className="rg-input" type="number" inputMode="numeric" min="0" placeholder="95000" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} />
                  </div>
                  <div className="rg-field">
                    <label htmlFor="reg-eq-plate">Госномер</label>
                    <input id="reg-eq-plate" className="rg-input" type="text" placeholder="01 777 KZ 02" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          <fieldset className="rg-span rg-consents">
            <legend className="rg-sr">Согласия</legend>
            <label className={`rg-check${errors.terms ? ' is-invalid' : ''}`}>
              <input
                id="reg-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); clearError('terms'); }}
                aria-invalid={errors.terms ? 'true' : undefined}
                aria-describedby={errors.terms ? 'reg-terms-err' : undefined}
              />
              <span>
                Мне есть 18 лет, принимаю{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer">пользовательское соглашение</a>
              </span>
            </label>
            {err('terms')}
            <label className={`rg-check${errors.privacy ? ' is-invalid' : ''}`}>
              <input
                id="reg-privacy"
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => { setAcceptPrivacy(e.target.checked); clearError('privacy'); }}
                aria-invalid={errors.privacy ? 'true' : undefined}
                aria-describedby={errors.privacy ? 'reg-privacy-err' : undefined}
              />
              <span>
                Даю <a href="/consent" target="_blank" rel="noopener noreferrer">согласие на обработку персональных данных</a>,
                {' '}в том числе передачу за рубеж, по <a href="/privacy" target="_blank" rel="noopener noreferrer">политике конфиденциальности</a>
              </span>
            </label>
            {err('privacy')}
            <label className="rg-check rg-check--opt">
              <input id="reg-marketing" type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} />
              <span>Присылать новости и предложения по email, SMS и WhatsApp (необязательно)</span>
            </label>
          </fieldset>

          <button type="submit" className="rg-submit rg-span" disabled={loading}>
            {loading ? 'Создаём аккаунт…' : 'Создать аккаунт'}
          </button>

          <p className="rg-switch rg-span">
            Уже есть аккаунт?{' '}
            <button type="button" className="rg-link" onClick={onOpenLogin}>Войти</button>
          </p>
        </form>
      </div>
    </div>
  );
}
