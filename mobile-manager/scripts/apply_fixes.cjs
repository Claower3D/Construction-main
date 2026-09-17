const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ────────────────────────────────────────────────────────────
// 1. Write LoginScreen.jsx (Clean Russian UTF-8, Direct Form, No Mock Accounts)
// ────────────────────────────────────────────────────────────
const loginScreenContent = `import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { loginManager, testServerPing } from '../api/crmApi';

export default function LoginScreen({ serverUrl, onUpdateServerUrl, onLoginSuccess }) {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl || 'https://construction-main-production.up.railway.app');
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [pingLatency, setPingLatency] = useState(null);

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
    if (e) e.preventDefault();
    const cleanLogin = loginInput.trim();
    const cleanPass = password.trim();

    if (!cleanLogin) {
      setErrorMsg('Пожалуйста, введите ваш логин, email или телефон');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Пожалуйста, введите пароль для входа');
      return;
    }

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
      <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 2 }}>
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
          QazGost • Мобильная CRM
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
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="manager@qazgost.kz"
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
          <div style={{ marginBottom: '18px' }}>
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
`;

fs.writeFileSync(path.join(rootDir, 'src/components/LoginScreen.jsx'), loginScreenContent, 'utf8');
console.log('✓ LoginScreen.jsx updated.');

// ────────────────────────────────────────────────────────────
// 2. Write SettingsModal.jsx (No Mock Accounts list, shows active user & logout)
// ────────────────────────────────────────────────────────────
const settingsModalContent = `import React, { useState } from 'react';
import { X, Check, Database, Globe, RefreshCw, LogOut, User } from 'lucide-react';
import { testServerPing } from '../api/crmApi';

export default function SettingsModal({ 
  settings, 
  currentUser,
  onLogout,
  onSaveSettings, 
  onClose, 
  onResetDemoData,
  lastSyncTime,
  syncLatency 
}) {
  const [serverUrl, setServerUrl] = useState(settings.serverUrl || 'https://construction-main-production.up.railway.app');
  const [autoSyncInterval, setAutoSyncInterval] = useState(settings.autoSyncInterval || 30);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const RAILWAY_PRESETS = [
    { label: 'Railway Cloud (Основной)', url: 'https://construction-main-production.up.railway.app' },
    { label: 'Эмулятор Android (10.0.2.2)', url: 'http://10.0.2.2:8080' },
    { label: 'Локальный ПК (localhost)', url: 'http://localhost:8080' }
  ];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testServerPing(serverUrl.trim());
    setIsTesting(false);
    if (res.ok) {
      setTestResult({ ok: true, msg: \`✓ Сервер Railway отвечает! Пинг: \${res.latency} мс\` });
    } else {
      setTestResult({ ok: false, msg: \`Сервер недоступен: \${res.error}. Включен офлайн-кэш.\` });
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      serverUrl: serverUrl.trim(),
      autoSyncInterval: Number(autoSyncInterval)
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 150,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div 
        className="bottom-sheet"
        style={{
          background: '#0d1527',
          borderTop: '1px solid rgba(0, 229, 255, 0.3)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px 20px 30px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
              Настройки и Синхронизация
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Связь с облаком Railway & Сервером
            </span>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Active User Profile */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
              ТЕКУЩИЙ АККАУНТ:
            </label>
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              background: 'rgba(0, 229, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  {currentUser?.avatar || '👨‍💼'}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem' }}>
                    {currentUser?.name || currentUser?.login || 'Менеджер'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    {currentUser?.email || 'manager@qazgost.kz'} • {currentUser?.role || 'Специалист'}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={13} />
                  <span>Выйти</span>
                </button>
              )}
            </div>
          </div>

          {/* Railway Cloud Server Endpoint */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={14} /> ОБЛАЧНЫЙ СЕРВЕР RAILWAY (URL):
              </label>
              {lastSyncTime && (
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                  Синхр: {lastSyncTime} {syncLatency ? \`(\${syncLatency}мс)\` : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://construction-main-production.up.railway.app"
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#00e5ff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  background: 'rgba(0, 229, 255, 0.2)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  color: '#00e5ff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {isTesting ? <RefreshCw size={15} style={{ animation: 'spin 1s infinite linear' }} /> : 'Пинг'}
              </button>
            </div>

            {/* Presets Row */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {RAILWAY_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setServerUrl(p.url)}
                  style={{
                    background: serverUrl === p.url ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: serverUrl === p.url ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: serverUrl === p.url ? '#00e5ff' : '#94a3b8',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {testResult && (
              <div style={{
                fontSize: '0.76rem',
                padding: '8px 12px',
                borderRadius: '8px',
                background: testResult.ok ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: testResult.ok ? '#4ade80' : '#f87171',
                border: testResult.ok ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: '10px'
              }}>
                {testResult.msg}
              </div>
            )}
          </div>

          {/* Auto Sync Interval */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
              ИНТЕРВАЛ АВТОСИНХРОНИЗАЦИИ:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: '15 сек', val: 15 },
                { label: '30 сек', val: 30 },
                { label: '60 сек', val: 60 }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setAutoSyncInterval(item.val)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: autoSyncInterval === item.val ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: autoSyncInterval === item.val ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: autoSyncInterval === item.val ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Сбросить базу сделок до демонстрационного набора?')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '11px',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Database size={15} /> Восстановить демо-сделки
            </button>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="glow-btn"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            <Check size={18} /> Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(rootDir, 'src/components/SettingsModal.jsx'), settingsModalContent, 'utf8');
console.log('✓ SettingsModal.jsx updated.');

// ────────────────────────────────────────────────────────────
// 3. Update HeaderBar.jsx (Clean manager fallback, no MANAGERS_LIST)
// ────────────────────────────────────────────────────────────
const headerBarContent = `import React, { useState } from 'react';
import { Settings, RefreshCw, LogOut, Search, X } from 'lucide-react';
import { DEFAULT_MANAGER } from '../api/crmApi';

export default function HeaderBar({ 
  currentUser,
  onLogout,
  onOpenSettings, 
  isOnline, 
  onSync, 
  isSyncing,
  searchQuery,
  onSearchChange 
}) {
  const [showSearch, setShowSearch] = useState(false);
  const manager = currentUser || DEFAULT_MANAGER;

  return (
    <header style={{
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      paddingTop: 'calc(10px + var(--safe-top))',
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingBottom: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand & Manager info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 229, 255, 0.35)',
            fontSize: '1.2rem',
          }}>
            {manager.avatar || '👨‍💼'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                {(manager.name || 'Менеджер').split(' ')[0]}
              </span>
              <span style={{
                fontSize: '0.65rem',
                background: 'rgba(0, 229, 255, 0.15)',
                color: '#00e5ff',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                border: '1px solid rgba(0, 229, 255, 0.3)'
              }}>
                CRM PRO
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {manager.role || 'Ведущий специалист'}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Toggle */}
          <button 
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: showSearch ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: showSearch ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showSearch ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            {showSearch ? <X size={17} /> : <Search size={17} />}
          </button>

          {/* Sync Button */}
          <button 
            onClick={onSync}
            disabled={isSyncing}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOnline ? '#10b981' : '#f59e0b',
              cursor: 'pointer'
            }}
            title={isOnline ? "Онлайн. Нажмите для синхронизации" : "Офлайн-режим"}
          >
            <RefreshCw size={17} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          {/* Settings Button */}
          <button 
            onClick={onOpenSettings}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Settings size={17} />
          </button>

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              cursor: 'pointer'
            }}
            title="Выйти из аккаунта"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div style={{ marginTop: '10px', animation: 'fadeIn 0.2s ease' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            padding: '6px 12px',
            gap: '8px'
          }}>
            <Search size={15} color="#38bdf8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по клиенту, адресу, телефону..."
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
`;

fs.writeFileSync(path.join(rootDir, 'src/components/HeaderBar.jsx'), headerBarContent, 'utf8');
console.log('✓ HeaderBar.jsx updated.');

// ────────────────────────────────────────────────────────────
// 4. Update crmApi.js (Clean DEFAULT_MANAGER, dynamic loginManager, clean notes)
// ────────────────────────────────────────────────────────────
const crmApiContent = `// QazGost Manager CRM — Data Layer & API Client (Online/Offline Sync & Auth)

const STORAGE_KEY_DEALS = 'qazgost_manager_crm_deals_v1';
const STORAGE_KEY_SETTINGS = 'qazgost_manager_crm_settings_v1';
const STORAGE_KEY_AUTH = 'qazgost_manager_crm_auth_v1';

export const DEFAULT_MANAGER = { 
  id: 'mgr_default', 
  name: 'Менеджер QazGost', 
  email: 'manager@qazgost.kz',
  role: 'Ведущий специалист ПТО', 
  phone: '+7 (701) 999-00-00', 
  avatar: '👨‍💼'
};

// Exported for backwards compatibility
export const MANAGERS_LIST = [DEFAULT_MANAGER];

export const ROLE_CONFIG = {
  engineer: {
    badge: 'ИНЖЕНЕР',
    subBadge: 'Выезд / ПТО',
    icon: '👷',
    color: '#f59e0b',
    border: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    glow: 'rgba(245, 158, 11, 0.3)'
  },
  executor: {
    badge: 'ИСПОЛНИТЕЛЬ',
    subBadge: 'Строймонтаж',
    icon: '🔨',
    color: '#00e5ff',
    border: '#00e5ff',
    bg: 'rgba(0, 229, 255, 0.15)',
    glow: 'rgba(0, 229, 255, 0.3)'
  },
  lead: {
    badge: 'ЛИД',
    subBadge: 'Новая заявка',
    icon: '📝',
    color: '#8b5cf6',
    border: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  machinery: {
    badge: 'СПЕЦТЕХНИКА',
    subBadge: 'Аренда крана/экскаватора',
    icon: '🚜',
    color: '#ec4899',
    border: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    glow: 'rgba(236, 72, 153, 0.3)'
  },
  deadline: {
    badge: 'СРОКИ',
    subBadge: 'Контроль графика',
    icon: '⏳',
    color: '#ef4444',
    border: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    glow: 'rgba(239, 68, 68, 0.3)'
  }
};

export const PIPELINE_STAGES = [
  'Новые заявки',
  'В работе',
  'КП / Смета',
  'Договор',
  'Дожим',
  'Оплачено / В работе'
];

export const STAGES = PIPELINE_STAGES;

export const INITIAL_DEALS = [
  {
    id: 'deal-101',
    leadNum: '101',
    title: 'Техническое обследование несущих конструкций БЦ "Алматы Тауэрс"',
    client: 'ТОО "Premier Development"',
    phone: '+7 (777) 123-45-67',
    location: 'г. Алматы, пр. Достык, 180',
    budget: 8500000,
    status: 'КП / Смета',
    role: 'engineer',
    date: '2026-09-18',
    time: '11:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Заказчик запросил выездную группу со сканером LiDAR.', time: '17 сен', author: 'Менеджер' },
      { text: 'Подготовлен предварительный расчёт сметы.', time: '17 сен', author: 'Инженер ПТО' }
    ]
  },
  {
    id: 'deal-102',
    leadNum: '102',
    title: 'Монолитные работы и армирование фундаментной плиты (Блок Б)',
    client: 'BI Group Almaty',
    phone: '+7 (701) 987-65-43',
    location: 'г. Алматы, р-н Наурызбайский',
    budget: 42000000,
    status: 'В работе',
    role: 'executor',
    date: '2026-09-18',
    time: '14:30',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Бригада из 14 человек на объекте. Бетононасос заказан.', time: '16 сен', author: 'Прораб' }
    ]
  },
  {
    id: 'deal-103',
    leadNum: '103',
    title: 'Усиление перекрытий углеволокном и инъектирование трещин',
    client: 'ЖК "Apple City"',
    phone: '+7 (705) 555-44-33',
    location: 'г. Алматы, ул. Сатпаева, 45',
    budget: 3200000,
    status: 'Новые заявки',
    role: 'lead',
    date: '2026-09-19',
    time: '10:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Новая входящая заявка с сайта через ИИ-анализ трещин.', time: '17 сен', author: 'Система' }
    ]
  },
  {
    id: 'deal-104',
    leadNum: '104',
    title: 'Поставка бетона М350 B25 с противоморозной добавкой (450 м³)',
    client: 'ТОО "BAZIS Construction"',
    phone: '+7 (702) 333-22-11',
    location: 'г. Астана, левый берег',
    budget: 11250000,
    status: 'Договор',
    role: 'executor',
    date: '2026-09-20',
    time: '09:00',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Договор подписан со стороны заказчика. Ждём предоплату 30%.', time: '16 сен', author: 'Менеджер' }
    ]
  },
  {
    id: 'deal-105',
    leadNum: '105',
    title: 'Аренда автобетононасоса 42м со сменой оператора',
    client: 'ИП "СтройСнаб KZ"',
    phone: '+7 (771) 400-50-60',
    location: 'г. Алматы, Капчагайская трасса',
    budget: 650000,
    status: 'Оплачено / В работе',
    role: 'machinery',
    date: '2026-09-18',
    time: '16:00',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [
      { text: 'Оплата поступила. Выезд назначен на 18 сентября.', time: '17 сен', author: 'Менеджер' }
    ]
  },
  {
    id: 'deal-106',
    leadNum: '106',
    title: 'Экспертиза прочности бетона склерометром и ультразвуком',
    client: 'ТОО "КазСтройЭксперт"',
    phone: '+7 (707) 777-88-99',
    location: 'г. Алматы, пр. Аль-Фараби, 77',
    budget: 1800000,
    status: 'КП / Смета',
    role: 'engineer',
    date: '2026-09-21',
    time: '12:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Запланирован выезд с георадаром.', time: '14 сен', author: 'Инженер ПТО' }]
  },
  {
    id: 'deal-107',
    leadNum: '107',
    title: 'Монтаж сэндвич-панелей складского комплекса',
    client: 'ТОО "КазЛогистик"',
    phone: '+7 (701) 111-22-33',
    location: 'г. Шымкент, индустриальная зона',
    budget: 14500000,
    status: 'В работе',
    role: 'executor',
    date: '2026-09-22',
    time: '10:00',
    priority: 'high',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Доставка панелей 1-й партии завершена.', time: '16 сен', author: 'Менеджер' }]
  },
  {
    id: 'deal-108',
    leadNum: '108',
    title: 'Аренда башенного крана 8 тонн',
    client: 'ТОО "MegaBuild KZ"',
    phone: '+7 (778) 999-00-11',
    location: 'г. Алматы, ул. Розыбакиева',
    budget: 2800000,
    status: 'Дожим',
    role: 'machinery',
    date: '2026-09-25',
    time: '08:30',
    priority: 'normal',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Договор на согласовании у юриста заказчика.', time: '15 сен', author: 'Менеджер' }]
  },
  {
    id: 'deal-109',
    leadNum: '109',
    title: 'Госприёмка и подписание акта ввода в эксплуатацию',
    client: 'Акимат г. Алматы (подрядчик)',
    phone: '+7 (727) 222-33-44',
    location: 'г. Алматы, мкр. Нуркент',
    budget: 24000000,
    status: 'В работе',
    role: 'deadline',
    date: '2026-09-28',
    time: '15:00',
    priority: 'urgent',
    updated_at: new Date().toISOString(),
    notes: [{ text: 'Подготовка исполнительной документации.', time: '12 сен', author: 'Менеджер' }]
  }
];

export function getStoredDeals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(INITIAL_DEALS));
  return INITIAL_DEALS;
}

export function saveStoredDeals(deals) {
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
  } catch (e) {
    console.error('Failed to save deals:', e);
  }
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    serverUrl: 'https://construction-main-production.up.railway.app',
    offlineMode: true,
    lastSyncTime: null,
    autoSyncInterval: 30
  };
}

export function saveStoredSettings(settings) {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
}

// ── Auth Management ──

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveStoredAuth(authData) {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export async function loginManager(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin || !cleanPass) {
    return { success: false, error: 'Заполните логин и пароль' };
  }

  // 1. First attempt online authentication with Railway backend
  if (serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(\`\${cleanUrl}/api/v1/auth/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanLogin, 
          login: cleanLogin, 
          password: cleanPass 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const displayName = data.user?.name || (cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin);
        const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        const authData = {
          user: {
            id: data.user?.id || 'usr_' + Date.now(),
            name: capitalizedName,
            login: cleanLogin,
            email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
            role: data.user?.role || 'Менеджер проектов',
            phone: data.user?.phone || '+7 (701) 000-00-00',
            avatar: '👨‍💼'
          },
          token: data.token || 'jwt_railway_token',
          isOnline: true,
          serverType: 'railway',
          loginTime: new Date().toISOString()
        };
        saveStoredAuth(authData);
        return { success: true, authData };
      }
    } catch (err) {
      console.warn('Backend login unreachable, falling back to local auth:', err.message);
    }
  }

  // 2. Seamless offline / local authentication fallback
  const displayName = cleanLogin.includes('@') ? cleanLogin.split('@')[0] : cleanLogin;
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  const authData = {
    user: {
      id: 'local_' + Date.now(),
      name: capitalizedName,
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@qazgost.kz\`,
      role: 'Менеджер проектов',
      phone: '+7 (701) 000-00-00',
      avatar: '👨‍💼'
    },
    token: \`token_offline_\${Date.now()}\`,
    isOnline: false,
    serverType: 'offline',
    loginTime: new Date().toISOString()
  };
  saveStoredAuth(authData);
  return { success: true, authData };
}

// ── Two-Way Synchronization with Railway Server ──

export async function testServerPing(serverUrl) {
  if (!serverUrl) return { ok: false, error: 'Адрес сервера не указан' };
  const cleanUrl = serverUrl.replace(/\\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(\`\${cleanUrl}/health\`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      return { ok: true, latency };
    }
    return { ok: false, error: \`HTTP \${res.status}\` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

export async function twoWaySyncWithRailway(serverUrl, localDeals) {
  if (!serverUrl) return { success: false, error: 'URL сервера не настроен' };
  const cleanUrl = serverUrl.replace(/\\/+$/, '');
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(\`\${cleanUrl}/api/v1/crm/events/sync\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        source: 'android-manager-crm',
        timestamp: new Date().toISOString(),
        deals: localDeals
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      let merged = localDeals;
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        const remoteMap = new Map();
        data.events.forEach(e => {
          if (e.id) remoteMap.set(e.id, e);
        });
        localDeals.forEach(d => {
          if (!remoteMap.has(d.id)) {
            remoteMap.set(d.id, d);
          }
        });
        merged = Array.from(remoteMap.values());
      }
      return {
        success: true,
        latencyMs: latency,
        lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mergedDeals: merged
      };
    }
    return { success: false, error: \`Ошибка сервера: \${res.status}\` };
  } catch (err) {
    return { success: false, error: err.message || 'Сбой сети' };
  }
}
`;

fs.writeFileSync(path.join(rootDir, 'src/api/crmApi.js'), crmApiContent, 'utf8');
console.log('✓ crmApi.js updated.');

// ────────────────────────────────────────────────────────────
// 5. Update App.jsx (Pass currentUser and onLogout to SettingsModal & clean LoginScreen props)
// ────────────────────────────────────────────────────────────
const appPath = path.join(rootDir, 'src/App.jsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// Replace SettingsModal invocation
appCode = appCode.replace(
  /<SettingsModal[\s\S]*?\/>/,
  `<SettingsModal
          settings={settings}
          currentUser={auth?.user}
          onLogout={handleLogout}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          onResetDemoData={handleResetDemo}
          lastSyncTime={lastSyncTime}
          syncLatency={syncLatency}
        />`
);

// Replace LoginScreen invocation
appCode = appCode.replace(
  /<LoginScreen[\s\S]*?\/>/,
  `<LoginScreen 
        serverUrl={settings.serverUrl}
        onUpdateServerUrl={(newUrl) => handleSaveSettings({ ...settings, serverUrl: newUrl })}
        onLoginSuccess={handleLoginSuccess} 
      />`
);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('✓ App.jsx updated.');
console.log('ALL FILES UPDATED SUCCESSFULLY IN 100% CLEAN UTF-8!');
