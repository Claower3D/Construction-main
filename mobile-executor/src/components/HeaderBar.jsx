import React, { useRef, useEffect } from 'react';
import { Search, RefreshCw, Settings, X } from 'lucide-react';

// Shared header layout (same markup in all three apps; this app controls search from App).
export default function HeaderBar({
  title = 'QazGost Исполнитель',
  executor,
  isOnline,
  onRefresh,
  onSync,
  isSyncing,
  onOpenSettings,
  searchOpen,
  onToggleSearch,
  searchQuery = '',
  onSearchChange,
  showSearch = true
}) {
  const inputRef = useRef(null);
  const name = (executor?.name || 'Бригадир').replace(/\s*\(.*\)\s*$/, '');
  const refresh = onRefresh || onSync;

  useEffect(() => { if (searchOpen && inputRef.current) inputRef.current.focus(); }, [searchOpen]);

  const toggle = () => {
    if (searchOpen && onSearchChange) onSearchChange('');
    if (onToggleSearch) onToggleSearch();
  };

  return (
    <header className="qz-header">
      <div className="qz-header-bar">
        <div className="qz-header-titles">
          <h1 className="qz-header-title">{title}</h1>
          <div className="qz-header-sub">
            <span className={`qz-net${isSyncing ? ' is-syncing' : (isOnline ? ' is-online' : '')}`} aria-hidden="true" />
            <span>{name}, {isSyncing ? 'синхронизация…' : (isOnline ? 'на связи с сервером' : 'офлайн, данные на телефоне')}</span>
          </div>
        </div>
        {showSearch && onToggleSearch && (
          <button type="button" className={`qz-iconbtn${searchOpen ? ' is-active' : ''}`} aria-label={searchOpen ? 'Закрыть поиск' : 'Поиск'} aria-expanded={!!searchOpen} onClick={toggle}>
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        )}
        <button type="button" className="qz-iconbtn" aria-label="Синхронизировать" onClick={refresh} disabled={isSyncing}>
          <RefreshCw size={20} className={isSyncing ? 'qz-spin' : ''} />
        </button>
        <button type="button" className="qz-iconbtn" aria-label="Настройки" onClick={onOpenSettings}>
          <Settings size={20} />
        </button>
      </div>
      {showSearch && searchOpen && onSearchChange && (
        <label className="qz-search">
          <Search size={18} aria-hidden="true" />
          <span className="qz-sr-only">Поиск</span>
          <input ref={inputRef} type="search" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Объект, клиент, адрес" />
        </label>
      )}
    </header>
  );
}
