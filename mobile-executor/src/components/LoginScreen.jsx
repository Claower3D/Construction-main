import React, { useState, useEffect, useRef } from 'react';
import { Hammer, User, Lock, ArrowRight, Eye, EyeOff, RefreshCw, HardHat } from 'lucide-react';
import { loginExecutor, testServerPing, getSavedLogin, setSavedLogin } from '../api/executorApi';

export default function LoginScreen({ serverUrl, onUpdateServerUrl, onLoginSuccess }) {
  const initialLogin = getSavedLogin();
  const [loginInput, setLoginInput] = useState(initialLogin || 'timur.executor@qazgost.kz');
  const [password, setPassword] = useState('Master2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl || 'https://construction-main-production.up.railway.app');
  const [serverStatus, setServerStatus] = useState('checking');
  const [pingLatency, setPingLatency] = useState(null);

  const loginInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    const saved = getSavedLogin();
    if (saved) {
      setLoginInput(saved);
      if (loginInputRef.current) loginInputRef.current.value = saved;
    }
  }, []);

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
    const domLogin = (loginInputRef.current ? loginInputRef.current.value : '') || loginInput || '';
    const domPass = (passwordInputRef.current ? passwordInputRef.current.value : '') || password || '';
    const cleanLogin = domLogin.trim();
    const cleanPass = domPass.trim();

    if (!cleanLogin) {
      setErrorMsg('Пожалуйста, введите ваш логин бригадира / исполнителя');
      if (loginInputRef.current) loginInputRef.current.focus();
      return;
    }

    setSavedLogin(cleanLogin);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginExecutor(customServerUrl, cleanLogin, cleanPass);
      if (res.success && res.authData) {
        if (onUpdateServerUrl && customServerUrl !== serverUrl) {
          onUpdateServerUrl(customServerUrl);
        }
        onLoginSuccess(res.authData);
      } else {
        setErrorMsg(res.error || 'Ошибка входа бригадира. Проверьте логин и пароль.');
      }
    } catch (err) {
      setErrorMsg('Сбой сети: ' + (err.message || 'Проверьте соединение'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: '100dvh',
      background: 'radial-gradient(circle at 50% 12%, #082436 0%, #040814 85%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      maxWidth: '460px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.25) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 229, 255, 0.45)',
          color: '#060b17',
          fontWeight: 900,
          fontSize: '2.1rem'
        }}>
          🔨
        </div>

        <span style={{
          fontSize: '0.74rem',
          background: 'rgba(0, 229, 255, 0.15)',
          color: '#00e5ff',
          padding: '4px 14px',
          borderRadius: '999px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          QazGost • Исполнитель СМР v1.0
        </span>

        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 900,
          color: '#ffffff',
          margin: '0 0 6px',
          letterSpacing: '-0.02em'
        }}>
          Вход для бригадира
        </h1>

        <p style={{
          fontSize: '0.84rem',
          color: '#94a3b8',
          margin: 0
        }}>
          Управление монтажом, наряды, этапы СМР и спецтехника
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.92)',
        border: '1px solid rgba(0, 229, 255, 0.18)',
        borderRadius: '24px',
        padding: '24px 20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        zIndex: 2
      }}>
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          {/* Login input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              Логин или Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <User size={18} color="#00e5ff" />
              <input
                ref={loginInputRef}
                type="text"
                defaultValue={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="timur.executor@qazgost.kz"
                autoComplete="username"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '13px 12px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              Пароль
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '0 14px'
            }}>
              <Lock size={18} color="#00e5ff" />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                defaultValue={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '13px 12px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Connection status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: serverStatus === 'online' ? '#10b981' : (serverStatus === 'checking' ? '#f59e0b' : '#ef4444'),
                boxShadow: serverStatus === 'online' ? '0 0 8px #10b981' : 'none'
              }} />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {serverStatus === 'online' ? `Сервер онлайн (${pingLatency || 0}мс)` : (serverStatus === 'checking' ? 'Проверка связи...' : 'Автономный режим')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {showServerConfig ? 'Скрыть' : 'Сервер'}
            </button>
          </div>

          {showServerConfig && (
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  color: '#00e5ff',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="exec-glow-btn"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s infinite linear' }} />
                <span>Авторизация...</span>
              </>
            ) : (
              <>
                <span>Войти в систему</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}