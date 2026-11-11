import React, { useState, useEffect } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../services/api';
import { LEGAL_OPERATOR } from '../data/legal';
import './RegisterPage.css';

// Страница входа /login — в той же стилистике, что и /register.
// loginUser(email, password) → onLogin(user). Поля входа всегда пустые: никаких вписанных аккаунтов.
export default function LoginPage({ currentUser, onLogin, onOpenRegister, onOpenDashboard }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Сюда приводит и истёкшая сессия (App.jsx): объясняем, почему снова нужен пароль
  // Отметку читаем без побочных действий (в режиме разработки React вызывает инициализатор дважды),
  // а снимаем её отдельным эффектом — чтобы после обновления страницы объяснение не повторялось.
  const [notice] = useState(() => {
    try {
      return sessionStorage.getItem('qazgost_session_expired')
        ? 'Сессия истекла. Войдите снова — так мы защищаем ваш аккаунт.'
        : null;
    } catch { return null; }
  });
  useEffect(() => {
    try { sessionStorage.removeItem('qazgost_session_expired'); } catch { /* хранилище недоступно */ }
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Вход — QazGost AI';
    return () => { document.title = prev; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(email, password);
      if (onLogin && res.user) onLogin(res.user);
    } catch (err) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && currentUser.role) {
    return (
      <div className="rg-page">
        <div className="rg-done">
          <h1>Вы уже вошли</h1>
          <p>{`Аккаунт: ${currentUser.name || currentUser.email}.`}</p>
          <button type="button" className="rg-submit" onClick={() => onOpenDashboard && onOpenDashboard(currentUser.role)}>Перейти в кабинет →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rg-page">
      <div className="rg-grid">
        <aside className="rg-aside">
          <h1>Вход в&nbsp;QazGost&nbsp;AI</h1>
          <p className="rg-lead">Сметы, заказы и техника — там, где вы остановились.</p>
          <ul className="rg-benefits">
            <li><Check size={18} aria-hidden="true" />Сохранённые сметы и акты о дефектах</li>
            <li><Check size={18} aria-hidden="true" />Заказы, отклики и календарь работ</li>
            <li><Check size={18} aria-hidden="true" />Анкета, каталоги и лента заказов</li>
          </ul>
        </aside>

        <form className="rg-card rg-card--single" onSubmit={handleSubmit} aria-labelledby="lg-form-title">
          <h2 id="lg-form-title" className="rg-card-title">Вход</h2>

          {notice && !error && <div className="rg-alert rg-alert--info" role="status" data-testid="session-expired">{notice}</div>}
          {error && <div className="rg-alert" role="alert">{error}</div>}

          <div className="rg-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="rg-input"
              type="email"
              autoComplete="email"
              placeholder="you@example.kz"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="rg-field">
            <label htmlFor="login-password">Пароль</label>
            <div className="rg-password">
              <input
                id="login-password"
                className="rg-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ваш пароль"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <p className="rg-forgot">
              Забыли пароль?{' '}
              <a href={LEGAL_OPERATOR.whatsappUrl} target="_blank" rel="noopener noreferrer">Напишите нам в WhatsApp</a>
            </p>
          </div>

          <button type="submit" className="rg-submit" disabled={loading}>
            {loading ? 'Входим…' : 'Войти'}
          </button>

          <p className="rg-switch">
            Нет аккаунта?{' '}
            <button type="button" className="rg-link" onClick={onOpenRegister}>Зарегистрироваться</button>
          </p>
        </form>
      </div>
    </div>
  );
}
