import React, { useState } from 'react';
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
