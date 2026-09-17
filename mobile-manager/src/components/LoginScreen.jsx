import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { loginManager, testServerPing, getSavedLogin, setSavedLogin } from '../api/crmApi';

export default function LoginScreen({ serverUrl, onUpdateServerUrl, onLoginSuccess }) {
  const initialLogin = getSavedLogin();
  const [loginInput, setLoginInput] = useState(initialLogin);
  const [password, setPassword] = useState('Sasha2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState((serverUrl && !serverUrl.includes('qazgost-backend')) ? serverUrl : 'https://construction-main-production.up.railway.app');
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [pingLatency, setPingLatency] = useState(null);

  const loginInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Sync saved login on mount
  useEffect(() => {
    const saved = getSavedLogin();
    if (saved) {
      setLoginInput(saved);
      if (loginInputRef.current) {
        loginInputRef.current.value = saved;
      }
    }
  }, []);

  // Connectivity check on mount or when server URL changes
  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      setServerStatus('checking');
      const res = await testServerPing(customServerUrl);
      if (isMounted) {
        if (res.ok) {
          setServerStatus('online');
          setPingLatency(res.latency);
        } else {
          setServerStatus('offline');
          setPingLatency(null);
        }
      }
    };
    checkPing();
    return () => { isMounted = false; };
  }, [customServerUrl]);

  const handleLoginSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Read directly from DOM input elements to eliminate any Android Autofill / React state desync!
    const domLogin = (loginInputRef.current ? loginInputRef.current.value : '') || loginInput || '';
    const domPass = (passwordInputRef.current ? passwordInputRef.current.value : '') || password || '';

    const cleanLogin = domLogin.trim();
    const cleanPass = domPass.trim();

    if (!cleanLogin) {
      setErrorMsg('Пожалуйста, введите ваш логин, email или телефон');
      if (loginInputRef.current) loginInputRef.current.focus();
      return;
    }

    // Always remember login
    setSavedLogin(cleanLogin);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginManager(customServerUrl, cleanLogin, cleanPass);
      if (res.success && res.authData) {
        if (onUpdateServerUrl && customServerUrl !== serverUrl) {
          onUpdateServerUrl(customServerUrl);
        }
        onLoginSuccess(res.authData);
      } else {
        setErrorMsg(res.error || 'Ошибка авторизации. Проверьте логин и пароль.');
      }
    } catch (err) {
      setErrorMsg('Не удалось выполнить вход: ' + (err.message || 'Сбой сети'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: '100dvh',
      background: 'radial-gradient(circle at 50% 12%, #152445 0%, #060913 85%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      maxWidth: '460px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow circles */}
      <div style={{
        position: 'absolute',
        top: '-8%',
        left: '20%',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '66px',
          height: '66px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 229, 255, 0.45)',
          color: '#060913',
          fontWeight: 900,
          fontSize: '1.9rem'
        }}>
          🏗️
        </div>

        <span style={{
          fontSize: '0.72rem',
          background: 'rgba(0, 229, 255, 0.15)',
          color: '#00e5ff',
          padding: '4px 12px',
          borderRadius: '999px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          QazGost • Мобильная CRM v1.6
        </span>

        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 6px',
          letterSpacing: '-0.02em'
        }}>
          Вход для менеджера
        </h1>

        <p style={{
          fontSize: '0.84rem',
          color: '#94a3b8',
          margin: 0
        }}>
          Управление объектами, сметами и сделками
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '24px 20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        position: 'relative',
        zIndex: 2
      }}>
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '11px 13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
            fontSize: '0.82rem',
            lineHeight: 1.35
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          {/* Login / Email / Phone Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Логин, Email или Телефон
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <User size={18} color="#00e5ff" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                ref={loginInputRef}
                type="text"
                defaultValue={initialLogin}
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setErrorMsg(null);
                }}
                onInput={(e) => {
                  setLoginInput(e.target.value);
                  setErrorMsg(null);
                }}
                onBlur={(e) => {
                  setLoginInput(e.target.value);
                  setSavedLogin(e.target.value);
                }}
                placeholder="sasha.manager@qazgost.kz"
                required
                autoComplete="username"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  padding: '13px 0'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Пароль
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <Lock size={18} color="#00e5ff" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                onInput={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  padding: '13px 0'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            fontSize: '0.78rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#cbd5e1',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#00e5ff',
                  width: '15px',
                  height: '15px'
                }}
              />
              <span>Запомнить данные для входа</span>
            </label>
          </div>

          {/* Railway Connection Status Indicator */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: serverStatus === 'online' ? '#10b981' : serverStatus === 'checking' ? '#f59e0b' : '#94a3b8',
                  boxShadow: serverStatus === 'online' ? '0 0 8px #10b981' : 'none'
                }} />
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                  {serverStatus === 'online' ? 'Railway Cloud онлайн' : serverStatus === 'checking' ? 'Проверка связи...' : 'Офлайн / Локальный режим'}
                </span>
                {pingLatency && (
                  <span style={{ color: '#10b981', fontSize: '0.7rem' }}>
                    ({pingLatency} мс)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showServerConfig ? 'Скрыть' : 'Сервер'}
              </button>
            </div>

            {/* Collapsible Server Settings */}
            {showServerConfig && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  АДРЕС БЭКЕНДА:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="https://construction-main-production.up.railway.app"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      color: '#00e5ff',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setServerStatus('checking');
                      const res = await testServerPing(customServerUrl);
                      if (res.ok) {
                        setServerStatus('online');
                        setPingLatency(res.latency);
                      } else {
                        setServerStatus('offline');
                      }
                    }}
                    style={{
                      background: 'rgba(0, 229, 255, 0.15)',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                      color: '#00e5ff',
                      borderRadius: '8px',
                      padding: '0 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    Пинг
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="glow-btn"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '0.98rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
              color: '#060913',
              border: 'none',
              cursor: isLoading ? 'default' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 8px 25px rgba(0, 229, 255, 0.35)'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s infinite linear' }} />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <span>Войти в аккаунт</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div style={{ textAlign: 'center', marginTop: '24px', position: 'relative', zIndex: 2 }}>
        <p style={{
          fontSize: '0.74rem',
          color: '#64748b',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Shield size={13} color="#10b981" />
          Защищённая CRM-система • QazGost KZ © 2026
        </p>
      </div>
    </div>
  );
}
