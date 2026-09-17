import React, { useState } from 'react';
import { X, Server, User, RefreshCw, Check, AlertCircle, Info, Database, Globe, Zap, Clock } from 'lucide-react';
import { MANAGERS_LIST, testServerPing } from '../api/crmApi';

export default function SettingsModal({ 
  settings, 
  onSaveSettings, 
  onClose, 
  onResetDemoData,
  lastSyncTime,
  syncLatency 
}) {
  const [serverUrl, setServerUrl] = useState(settings.serverUrl || 'https://qazgost-backend.up.railway.app');
  const [activeManagerId, setActiveManagerId] = useState(settings.activeManagerId || 'm1');
  const [autoSyncInterval, setAutoSyncInterval] = useState(settings.autoSyncInterval || 30);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const RAILWAY_PRESETS = [
    { label: 'Railway Cloud (Основной)', url: 'https://qazgost-backend.up.railway.app' },
    { label: 'Эмулятор Android (10.0.2.2)', url: 'http://10.0.2.2:8080' },
    { label: 'Локальный ПК (localhost)', url: 'http://localhost:8080' }
  ];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testServerPing(serverUrl.trim());
    setIsTesting(false);
    if (res.ok) {
      setTestResult({ ok: true, msg: `✓ Сервер Railway отвечает! Пинг: ${res.latency} мс` });
    } else {
      setTestResult({ ok: false, msg: `Сервер недоступен: ${res.error}. Включен офлайн-кэш.` });
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      serverUrl: serverUrl.trim(),
      activeManagerId,
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
              Связь с облаком Railway & GitHub
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
          {/* Active Manager Picker */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
              АКТИВНЫЙ МЕНЕДЖЕР:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MANAGERS_LIST.map((m) => {
                const isSelected = activeManagerId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveManagerId(m.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem' }}>{m.avatar}</span>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>{m.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{m.role} • {m.phone}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="#00e5ff" />}
                  </div>
                );
              })}
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
                  Синхр: {lastSyncTime} {syncLatency ? `(${syncLatency}мс)` : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://qazgost-backend.up.railway.app"
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
