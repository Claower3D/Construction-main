import React, { useEffect } from 'react';
import { Home, LayoutGrid, ClipboardList, ShoppingBag, UserRound, X } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'services', label: 'Услуги', icon: LayoutGrid },
  { id: 'orders', label: 'Заказы', icon: ClipboardList, counted: true },
  { id: 'market', label: 'Маркет', icon: ShoppingBag },
  { id: 'profile', label: 'Профиль', icon: UserRound }
];

export function BottomNav({ active, onSelect, activeCount = 0 }) {
  return (
    <nav className="qz-nav" aria-label="Разделы">
      {TABS.map(({ id, label, icon: Icon, counted }) => {
        const on = active === id;
        const badge = counted ? activeCount : 0;
        return (
          <button key={id} type="button" className={`qz-nav-item${on ? ' is-active' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => onSelect(id)}>
            <span className="qz-nav-icon"><Icon size={22} strokeWidth={on ? 2.4 : 2} /></span>
            <span className="qz-nav-label">{label}</span>
            {badge > 0 && <span className="qz-nav-badge" aria-label={`Активных заказов: ${badge}`}>{badge > 99 ? '99+' : badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}

export function TopBar({ title, sub, right }) {
  return (
    <header className="qz-header cl-header">
      <div className="qz-header-bar">
        <div className="qz-header-titles">
          <h1 className="qz-header-title">{title}</h1>
          {sub && <div className="qz-header-sub"><span>{sub}</span></div>}
        </div>
        {right}
      </div>
    </header>
  );
}

/** Нижняя шторка с заголовком; закрывается кнопкой, фоном или «Назад» на Android. */
export function Sheet({ title, sub, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="qz-scrim" onClick={onClose} role="presentation">
      <section className="qz-sheet cl-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="qz-sheet-head">
          <div className="qz-grow">
            <h2 className="qz-h2">{title}</h2>
            {sub && <p className="qz-small qz-muted" style={{ marginTop: 4 }}>{sub}</p>}
          </div>
          <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="qz-sheet-body">{children}</div>
        {footer && <div className="cl-sheet-foot">{footer}</div>}
      </section>
    </div>
  );
}
