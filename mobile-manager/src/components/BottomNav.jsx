import React from 'react';
import { LayoutDashboard, Columns3, Calendar, Users, Plus } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Сводка', icon: LayoutDashboard },
  { id: 'kanban', label: 'Воронка', icon: Columns3 },
  { id: 'calendar', label: 'Календарь', icon: Calendar },
  { id: 'clients', label: 'Клиенты', icon: Users }
];

export default function BottomNav({ activeTab, onTabChange, onOpenNewLead, unreadCount = 0, showFab = true }) {
  return (
    <>
      {showFab && onOpenNewLead && (
        <button type="button" className="qz-fab" onClick={onOpenNewLead} aria-label="Новый лид">
          <Plus size={22} strokeWidth={2.6} />
          <span>Новый лид</span>
        </button>
      )}
      <nav className="qz-nav" aria-label="Разделы">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const badge = id === 'kanban' && unreadCount > 0 ? unreadCount : 0;
          return (
            <button
              key={id}
              type="button"
              data-tab={id}
              className={`qz-nav-item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => onTabChange(id)}
            >
              <span className="qz-nav-icon"><Icon size={22} strokeWidth={active ? 2.4 : 2} /></span>
              <span className="qz-nav-label">{label}</span>
              {badge > 0 && <span className="qz-nav-badge" aria-label={`Новых: ${badge}`}>{badge > 99 ? '99+' : badge}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
}
