import React from 'react';
import { ClipboardList, ListChecks, Truck, Calendar, ShoppingBag } from 'lucide-react';

const TABS = [
  { id: 'orders', label: 'Наряды', icon: ClipboardList, counted: true },
  { id: 'stages', label: 'Этапы', icon: ListChecks },
  { id: 'machinery', label: 'Техника', icon: Truck },
  { id: 'calendar', label: 'График', icon: Calendar },
  { id: 'market', label: 'Снабжение', icon: ShoppingBag }
];

export default function BottomNav({ activeTab, onSelectTab, onChangeTab, activeCount = 0 }) {
  const select = (id) => {
    if (typeof onSelectTab === 'function') onSelectTab(id);
    else if (typeof onChangeTab === 'function') onChangeTab(id);
  };
  return (
    <nav className="qz-nav" aria-label="Разделы">
      {TABS.map(({ id, label, icon: Icon, counted }) => {
        const active = activeTab === id;
        const badge = counted ? activeCount : 0;
        return (
          <button
            key={id}
            type="button"
            data-tab={id}
            className={`qz-nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => select(id)}
          >
            <span className="qz-nav-icon"><Icon size={22} strokeWidth={active ? 2.4 : 2} /></span>
            <span className="qz-nav-label">{label}</span>
            {badge > 0 && <span className="qz-nav-badge" aria-label={`В работе: ${badge}`}>{badge > 99 ? '99+' : badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
