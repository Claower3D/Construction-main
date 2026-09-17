import React from 'react';
import { RefreshCw, Search, HardHat, Bell, ShieldCheck } from 'lucide-react';

export default function HeaderBar({ engineer, isOnline, onRefresh, isSyncing, onOpenSettings, searchOpen, onToggleSearch, searchQuery, onSearchChange }) {
  return (
    <div style={{
      background: 'rgba(13, 21, 39, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: 'calc(10px + var(--safe-top)) 16px 10px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Avatar & Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={onOpenSettings}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
          }}>
            👷‍♂️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                {engineer?.name || 'Инженер ПТО'}
              </span>
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e0b'
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: isOnline ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              {isOnline ? '🟢 Сервер онлайн • Railway' : '🟡 Подключение к Railway...'}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onToggleSearch}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: searchOpen ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: searchOpen ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
              color: searchOpen ? '#f59e0b' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Search size={18} />
          </button>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSyncing ? 'default' : 'pointer'
            }}
          >
            <RefreshCw size={18} style={{ animation: isSyncing ? 'spin 1s infinite linear' : 'none' }} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по клиенту, адресу или телефону..."
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>
      )}
    </div>
  );
}
