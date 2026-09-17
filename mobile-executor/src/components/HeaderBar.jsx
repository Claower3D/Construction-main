import React from 'react';
import { RefreshCw, Search, Wrench, Hammer, Bell, ShieldCheck } from 'lucide-react';

export default function HeaderBar({ 
  executor, 
  isOnline, 
  onRefresh, 
  isSyncing, 
  onOpenSettings, 
  searchOpen, 
  onToggleSearch, 
  searchQuery, 
  onSearchChange 
}) {
  return (
    <div style={{
      background: 'rgba(6, 11, 23, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
      padding: 'calc(10px + var(--safe-top)) 16px 10px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Avatar & Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onOpenSettings}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: '0 4px 15px rgba(0, 229, 255, 0.35)'
          }}>
            🔨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                {executor?.name || 'Бригадир СМР'}
              </span>
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e0b',
                boxShadow: isOnline ? '0 0 8px #10b981' : 'none'
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: isOnline ? '#00e5ff' : '#f59e0b', fontWeight: 700 }}>
              {isOnline ? '🟢 Сервер онлайн • Railway' : '🟡 Подключение к серверу...'}
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
              background: searchOpen ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: searchOpen ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
              color: searchOpen ? '#00e5ff' : '#94a3b8',
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
              color: '#00e5ff',
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
            placeholder="Поиск по клиенту, адресу или наряду..."
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none'
            }}
          />
        </div>
      )}
    </div>
  );
}