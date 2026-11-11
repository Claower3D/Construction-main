import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { getAuthToken } from '../services/platformUtils';
import './RegisterPage.css';

/**
 * Смена пароля — страница /password.
 *
 * До этой страницы пароль нельзя было сменить нигде: ни на сайте, ни в приложениях. Сервер
 * проверяет текущий пароль, не принимает короткие и общеизвестные, а после смены закрывает
 * все остальные сессии этого аккаунта.
 */
export default function ChangePasswordPage({ currentUser, onOpenLogin, onOpenDashboard }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Смена пароля — QazGost AI';
    return () => { document.title = prev; };
  }, []);

  const token = getAuthToken();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) { setError('Новый пароль должен быть не короче 8 символов.'); return; }
    if (next !== repeat) { setError('Новый пароль и его повтор не совпадают.'); return; }
    if (next === current) { setError('Новый пароль совпадает с текущим.'); return; }
    setLoading(true);
    try {
      let res;
      try {
        res = await fetch('/api/v1/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
      } catch (err) {
        throw new Error('Нет связи с сервером. Пароль не изменён — попробуйте ещё раз.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if ([502, 503, 504].includes(res.status)) throw new Error('Сервер временно недоступен. Пароль не изменён — попробуйте через минуту.');
        throw new Error(data.error || 'Не удалось изменить пароль.');
      }
      // сервер закрыл прежние сессии и выдал новую для этого устройства
      if (data.token) { try { localStorage.setItem('auth_token', data.token); } catch (err) { /* хранилище недоступно */ } }
      setCurrent(''); setNext(''); setRepeat('');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Без серверной сессии менять нечего: гость или общий аккаунт команды
  if (!currentUser || !token) {
    return (
      <div className="rg-page">
        <div className="rg-done">
          <h1>Смена пароля</h1>
          <p>
            {currentUser
              ? 'Этот аккаунт входит по общему списку команды, без личного пароля на сервере. Чтобы сменить пароль, обратитесь к администратору.'
              : 'Чтобы сменить пароль, сначала войдите в аккаунт.'}
          </p>
          {currentUser
            ? <button type="button" className="rg-submit" onClick={() => onOpenDashboard && onOpenDashboard(currentUser.role)}>Вернуться в кабинет</button>
            : <button type="button" className="rg-submit" onClick={onOpenLogin}>Войти</button>}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rg-page">
        <div className="rg-done" role="status" data-testid="password-changed">
          <h1>Пароль изменён</h1>
          <p>На этом устройстве вы остаётесь в аккаунте. На других устройствах и в приложениях нужно войти заново с новым паролем.</p>
          <button type="button" className="rg-submit" onClick={() => onOpenDashboard && onOpenDashboard(currentUser.role)}>Вернуться в кабинет</button>
        </div>
      </div>
    );
  }

  const field = (id, label, value, onChange, autoComplete, placeholder) => (
    <div className="rg-field">
      <label htmlFor={id}>{label}</label>
      <div className="rg-password">
        <input
          id={id}
          className="rg-input"
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="rg-eye"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={show}
        >
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="rg-page">
      <div className="rg-grid">
        <aside className="rg-aside">
          <h1>Смена пароля</h1>
          <p className="rg-lead">{`Аккаунт: ${currentUser.email || currentUser.name}.`}</p>
          <ul className="rg-benefits">
            <li><Check size={18} aria-hidden="true" />Не короче 8 символов</li>
            <li><Check size={18} aria-hidden="true" />Не тот, что используется на других сайтах</li>
            <li><Check size={18} aria-hidden="true" />После смены остальные устройства выйдут из аккаунта</li>
          </ul>
        </aside>

        <form className="rg-card rg-card--single" onSubmit={submit} aria-labelledby="pw-form-title">
          <h2 id="pw-form-title" className="rg-card-title">Новый пароль</h2>
          {error && <div className="rg-alert" role="alert">{error}</div>}
          {field('pw-current', 'Текущий пароль', current, setCurrent, 'current-password', 'Пароль, с которым вы входите сейчас')}
          {field('pw-new', 'Новый пароль', next, setNext, 'new-password', 'Не короче 8 символов')}
          {field('pw-repeat', 'Повторите новый пароль', repeat, setRepeat, 'new-password', 'Ещё раз, чтобы не ошибиться')}
          <button type="submit" className="rg-submit" disabled={loading}>
            {loading ? 'Сохраняем…' : 'Сменить пароль'}
          </button>
          <p className="rg-switch">
            <button type="button" className="rg-link" onClick={() => onOpenDashboard && onOpenDashboard(currentUser.role)}>Вернуться в кабинет</button>
          </p>
        </form>
      </div>
    </div>
  );
}
