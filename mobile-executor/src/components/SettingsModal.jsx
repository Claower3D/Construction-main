import React, { useState } from 'react';
import { X, Server, RefreshCw, LogOut, Phone, Mail, Users, Hammer } from 'lucide-react';
import { testServerPing } from '../api/executorApi';

export default function SettingsModal({ executor, serverUrl, onUpdateServerUrl, onLogout, onClose, onResetCache }) {
  const [urlInput, setUrlInput] = useState(serverUrl || 'https://construction-main-production.up.railway.app');
  const [pingStatus, setPingStatus] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async () => {
    setIsPinging(true);
    const res = await testServerPing(urlInput);
    setPingStatus(res);
    setIsPinging(false);
  };

  const handleSave = () => {
    onUpdateServerUrl(urlInput);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: 'calc(14px + var(--safe-top)) 16px 14px',
        background: 'rgba(13, 21, 39, 0.98)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hammer size={22} color="#00e5ff" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Профиль бригадира СМР
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Profile Card */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '20px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 25px rgba(0, 229, 255, 0.35)'
          }}>
            🔨
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
            {executor?.name || 'Бригадир СМР'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#00e5ff', margin: '0 0 14px', fontWeight: 600 }}>
            {executor?.role || 'Бригадир строительно-монтажных работ'} • QazGost
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px' }}>
              <Phone size={15} color="#00e5ff" />
              <span>{executor?.phone || '+7 (705) 333-44-55'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px' }}>
              <Mail size={15} color="#00e5ff" />
              <span>{executor?.email || executor?.login || 'timur.executor@qazgost.kz'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '10px' }}>
              <Users size={15} color="#00e5ff" />
              <span>{executor?.crewSize || 'Бригада №3 (4 монтажника)'}</span>
            </div>
          </div>
        </div>

        {/* Server Config */}
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Server size={18} color="#00e5ff" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              Сервер синхронизации
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://construction-main-production.up.railway.app"
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#00e5ff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
            <button
              onClick={handlePing}
              disabled={isPinging}
              style={{
                background: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
                borderRadius: '10px',
                padding: '0 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isPinging ? '...' : 'Пинг'}
            </button>
          </div>

          {pingStatus && (
            <div style={{
              fontSize: '0.76rem',
              color: pingStatus.ok ? '#10b981' : '#ef4444',
              marginBottom: '10px'
            }}>
              {pingStatus.ok ? `Сервер доступен (${pingStatus.latency} мс)` : 'Ошибка соединения'}
            </div>
          )}

          <button
            onClick={handleSave}
            className="exec-glow-btn"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '0.85rem'
            }}
          >
            Сохранить настройки сервера
          </button>
        </div>

        {/* Clear cache & logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => {
              if (confirm('Сбросить локальные данные и заново загрузить с сервера?')) {
                onResetCache();
                onClose();
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px',
              color: '#94a3b8',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            <span>Перезагрузить наряды с сервера</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              color: '#f87171',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Выйти из аккаунта</span>
          </button>
        </div>

        {/* Version info */}
        <div style={{ textAlign: 'center', marginTop: '30px', color: '#64748b', fontSize: '0.74rem' }}>
          QazGost • Мобильный Исполнитель v1.0 • Сборка 2026
        </div>
      </div>
    </div>
  );
}