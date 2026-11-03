import React, { useState } from 'react';
import { LogIn, UserPlus, LogOut, MapPin, Server, MessageCircle, Globe, ShieldCheck } from 'lucide-react';
import { CITIES, login, register, logout, getServerUrl, setServerUrl, DEFAULT_SERVER, SUPPORT_WA } from '../api/clientApi';

export default function ProfileScreen({ auth, city, onCity, onAuth, toast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [server, setServer] = useState(getServerUrl());
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Введите email, например name@mail.kz');
    if (form.password.length < 6) return setError('Пароль — не короче 6 символов.');
    if (mode === 'register' && form.name.trim().length < 2) return setError('Как вас зовут?');
    setBusy(true);
    try {
      const a = mode === 'login' ? await login(form.email, form.password) : await register(form);
      onAuth(a);
      toast(mode === 'login' ? 'Вы вошли' : 'Аккаунт создан');
    } catch (err) {
      setError(err.message || 'Не получилось. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const user = auth?.user;

  return (
    <div className="qz-page qz-stack">
      {user ? (
        <section className="qz-card qz-stack">
          <div className="cl-profile">
            <span className="cl-avatar" aria-hidden="true">{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>
            <div className="qz-grow">
              <h2 className="qz-h2">{user.name || 'Заказчик'}</h2>
              <p className="qz-small qz-muted cl-ellipsis">{user.email}</p>
              {user.phone && <p className="qz-small qz-muted">{user.phone}</p>}
            </div>
          </div>
          <button type="button" className="qz-btn is-sm" onClick={() => { logout(); onAuth(null); toast('Вы вышли'); }}><LogOut size={16} /> Выйти из аккаунта</button>
        </section>
      ) : (
        <section className="qz-card">
          <div className="qz-segmented" role="tablist" style={{ marginBottom: 14 }}>
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Вход</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Регистрация</button>
          </div>
          <form className="qz-stack" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <label className="qz-field"><span className="qz-label">Имя</span><input className="qz-input" value={form.name} onChange={set('name')} autoComplete="name" /></label>
            )}
            <label className="qz-field"><span className="qz-label">Email</span><input className="qz-input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" autoCapitalize="none" /></label>
            <label className="qz-field"><span className="qz-label">Пароль</span><input className="qz-input" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            {mode === 'register' && (
              <label className="qz-field"><span className="qz-label">Телефон</span><input className="qz-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+7 7__ ___ __ __" autoComplete="tel" /></label>
            )}
            {error && <p className="cl-error" role="alert">{error}</p>}
            <button type="submit" className="qz-btn is-primary is-block" disabled={busy}>
              {mode === 'login' ? <><LogIn size={18} /> {busy ? 'Входим…' : 'Войти'}</> : <><UserPlus size={18} /> {busy ? 'Создаём…' : 'Создать аккаунт'}</>}
            </button>
            <p className="qz-xs qz-faint">Тот же аккаунт работает на сайте QazGost.</p>
          </form>
        </section>
      )}

      <section className="qz-card qz-stack">
        <label className="qz-field">
          <span className="qz-label"><MapPin size={14} /> Мой город — цены и бригады</span>
          <select className="qz-select" value={city} onChange={(e) => onCity(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
      </section>

      <section className="qz-card qz-stack">
        <a className="cl-menu-row" href={SUPPORT_WA} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Поддержка в WhatsApp</a>
        <a className="cl-menu-row" href={DEFAULT_SERVER} target="_blank" rel="noopener noreferrer"><Globe size={18} /> Сайт QazGost</a>
        <div className="cl-menu-row is-static"><ShieldCheck size={18} /> Оплата через эскроу: деньги уходят бригаде после приёмки</div>
      </section>

      <details className="qz-card cl-adv">
        <summary><Server size={16} /> Сервер</summary>
        <div className="qz-stack" style={{ marginTop: 12 }}>
          <input className="qz-input" value={server} onChange={(e) => setServer(e.target.value)} inputMode="url" autoCapitalize="none" />
          <button type="button" className="qz-btn is-sm" onClick={() => { setServerUrl(server); setServer(getServerUrl()); toast('Адрес сервера сохранён'); }}>Сохранить</button>
        </div>
      </details>
      <p className="qz-xs qz-faint" style={{ textAlign: 'center' }}>QazGost Клиент 1.0</p>
    </div>
  );
}
