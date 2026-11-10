import React, { useState, useEffect } from 'react';
import { loginUser } from '../services/api';
import './AuthModal.css';

// Окно входа. Регистрация — отдельная страница /register (onRegister открывает её).
// Логика входа не менялась: loginUser(email, password) → onLogin(user).
export default function AuthModal({ mode, onClose, onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode) setError(null);
  }, [mode]);

  // Esc закрывает окно
  useEffect(() => {
    if (!mode) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);

  if (!mode) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(email, password);
      if (onLogin && res.user) onLogin(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const goRegister = () => { if (onRegister) onRegister(); };

  return (
    <div className="modal-overlay qg-auth-overlay" onClick={onClose}>
      <div
        className="modal-content-card qg-auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close-btn qg-auth-close" aria-label="Закрыть" onClick={onClose}>✕</button>

        <div className="qg-auth-tabs" role="group" aria-label="Вход или регистрация">
          <button type="button" className="qg-auth-tab" aria-pressed="true">Вход</button>
          <button type="button" className="qg-auth-tab" aria-pressed="false" onClick={goRegister}>Регистрация</button>
        </div>

        <div className="qg-auth-head">
          <h2 id="auth-title">Вход в QazGost AI</h2>
          <p>Введите email и пароль для доступа к платформе</p>
        </div>

        {error && (
          <div className="qg-auth-alert" role="alert"><span aria-hidden="true">⚠️</span> {error}</div>
        )}

        <form onSubmit={handleSubmit} className="qg-auth-form">
          <div>
            <label htmlFor="login-email" className="qg-auth-label">Email адрес</label>
            <input
              id="login-email"
              type="email"
              className="custom-input qg-auth-input"
              placeholder="example@qazgost.kz"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="qg-auth-label">Пароль</label>
            <input
              id="login-password"
              type="password"
              className="custom-input qg-auth-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Quick Demo Login Presets — только авторизованные аккаунты команды */}
          <div className="qg-auth-presets">
            <span>⚡ Быстрый вход (авторизованные):</span>
            <div>
              <button type="button" onClick={() => { setEmail('manager@qazgost.kz'); setPassword('manager123'); }}>
                💼 Менеджер Саша
              </button>
              <button type="button" onClick={() => { setEmail('admin@qazgost.kz'); setPassword('admin123'); }}>
                👑 Админ
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="qg-auth-submit">
            {loading ? 'Обработка…' : 'Войти в систему →'}
          </button>
        </form>

        <p className="qg-auth-switch">
          Нет аккаунта?{' '}
          <button type="button" className="qg-auth-link" onClick={goRegister}>Зарегистрироваться</button>
        </p>
      </div>
    </div>
  );
}
