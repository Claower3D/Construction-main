import React, { useState, useRef, useEffect } from 'react';
import { Search, RefreshCw, Settings, X } from 'lucide-react';

export default function HeaderBar({
  title = 'QazGost CRM',
  currentUser,
  onOpenSettings,
  isOnline,
  onSync,
  isSyncing,
  searchQuery = '',
  onSearchChange,
  showSearch = true
}) {
  const [searchOpen, setSearchOpen] = useState(!!searchQuery);
  const inputRef = useRef(null);
  const manager = currentUser || {};
  const firstName = (manager.name || 'Менеджер').split(' ')[0];

  useEffect(() => { if (searchOpen && inputRef.current) inputRef.current.focus(); }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    if (onSearchChange) onSearchChange('');
  };

  return (
    <header className="qz-header">
      <div className="qz-header-bar">
        <div className="qz-header-titles">
          <h1 className="qz-header-title">{title}</h1>
          <div className="qz-header-sub">
            <span className={`qz-net${isSyncing ? ' is-syncing' : (isOnline ? ' is-online' : '')}`} aria-hidden="true" />
            <span>{firstName}, {isSyncing ? 'синхронизация…' : (isOnline ? 'на связи с сервером' : 'офлайн, данные на телефоне')}</span>
          </div>
        </div>
        {showSearch && onSearchChange && (
          <button
            type="button"
            className={`qz-iconbtn${searchOpen ? ' is-active' : ''}`}
            aria-label={searchOpen ? 'Закрыть поиск' : 'Поиск'}
            aria-expanded={searchOpen}
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        )}
        <button type="button" className="qz-iconbtn" aria-label="Синхронизировать" onClick={onSync} disabled={isSyncing}>
          <RefreshCw size={20} className={isSyncing ? 'qz-spin' : ''} />
        </button>
        <button type="button" className="qz-iconbtn" aria-label="Настройки" onClick={onOpenSettings}>
          <Settings size={20} />
        </button>
      </div>
      {searchOpen && onSearchChange && (
        <label className="qz-search">
          <Search size={18} aria-hidden="true" />
          <span className="qz-sr-only">Поиск по клиенту, телефону, адресу</span>
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Клиент, телефон, адрес"
          />
        </label>
      )}
    </header>
  );
}
