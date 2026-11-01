import React from 'react';
import { ClipboardList, Calendar, ScanSearch, Calculator, ShoppingBag, Ruler } from 'lucide-react';

const TABS = [
  { id: 'inspections', label: 'Объекты', icon: ClipboardList, countKey: 'activeCount' },
  { id: 'calendar', label: 'Выезды', icon: Calendar, countKey: 'todayCount' },
  { id: 'defects', label: 'Дефекты', icon: ScanSearch },
  { id: 'estimates', label: 'Смета', icon: Calculator },
  { id: 'marketplace', label: 'Маркет', icon: ShoppingBag },
  { id: 'tools', label: 'СНиП', icon: Ruler }
];

export default function BottomNav({ activeTab, onSelectTab, activeCount = 0, todayCount = 0 }) {
  const counts = { activeCount, todayCount };
  return (
    <nav className="qz-nav" aria-label="Разделы">
      {TABS.map(({ id, label, icon: Icon, countKey }) => {
        const active = activeTab === id;
        const badge = countKey ? counts[countKey] : 0;
        return (
          <button
            key={id}
            type="button"
            data-tab={id}
            className={`qz-nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelectTab(id)}
          >
            <span className="qz-nav-icon"><Icon size={22} strokeWidth={active ? 2.4 : 2} /></span>
            <span className="qz-nav-label">{label}</span>
            {badge > 0 && <span className="qz-nav-badge">{badge > 99 ? '99+' : badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
