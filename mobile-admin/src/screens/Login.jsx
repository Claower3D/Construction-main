import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import mark from '../assets/mark.png';
import { login, plural } from '../api/adminApi';

export default function Login({ onLoggedIn, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Введите почту и пароль'); return; }
    setBusy(true); setError('');
    try { onLoggedIn(await login(email, password)); } catch (err) {
      // клавиатура телефона могла добавить пробел или заглавную букву — подскажем, что именно ушло
      let msg = err.message;
      if (err.status === 401) {
        const n = [...password].length;
        const hints = [`в пароле ${n} ${plural(n, 'символ', 'символа', 'символов')}`];
        if (/^[A-ZА-ЯЁ]/.test(password)) hints.push('первая буква заглавная');
        if (/[а-яё]/i.test(password)) hints.push('есть русские буквы — проверьте раскладку');
        msg += `. Проверьте: ${hints.join(', ')}.`;
      }
      setError(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="qga-login">
      <img src={mark} alt="" className="qga-login-mark" width="112" height="112" />
      <h1 className="qga-login-title">QazGost Админ</h1>
      <p className="qz-small qz-muted" style={{ margin: '0 0 24px', textAlign: 'center' }}>Управление платформой: аналитика, пользователи, заказы, модерация</p>
      {notice && <div className="qz-banner" role="status" style={{ marginBottom: 16 }}>{notice}</div>}
      <form className="qz-stack" onSubmit={submit} noValidate>
        <label className="qz-field">
          <span className="qz-label">Почта администратора</span>
          <input id="qga-email" className="qz-input" type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.kz" />
        </label>
        <label className="qz-field">
          <span className="qz-label">Пароль</span>
          <span className="qga-pass">
            <input id="qga-password" className="qz-input" type={show ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="qz-iconbtn" aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShow((v) => !v)}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </span>
        </label>
        {error && <p className="qga-error" role="alert">{error}</p>}
        <button type="submit" className="qz-btn is-primary is-block" disabled={busy}><LogIn size={18} />{busy ? 'Входим…' : 'Войти'}</button>
      </form>
      <p className="qz-xs qz-faint" style={{ marginTop: 20, textAlign: 'center' }}>Вход только для аккаунтов с ролью «администратор». Новые аккаунты здесь не создаются.</p>
    </div>
  );
}
