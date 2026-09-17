import React from 'react';
import { ClipboardList, CheckSquare, Truck, Calendar, ShoppingBag } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab, onChangeTab, activeCount = 0 }) {
  const tabs = [
    { id: 'orders', label: 'Наряды', icon: ClipboardList, count: activeCount },
    { id: 'stages', label: 'Этапы СМР', icon: CheckSquare },
    { id: 'machinery', label: 'Техника', icon: Truck },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'market', label: 'Снабжение', icon: ShoppingBag }
  ];

  const handleSelect = (id) => {
    if (typeof onSelectTab === 'function') onSelectTab(id);
    if (typeof onChangeTab === 'function') onChangeTab(id);
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(6, 11, 23, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 229, 255, 0.18)',
      boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 6px calc(10px + env(safe-area-inset-bottom, 8px))',
      zIndex: 90,
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelect(tab.id)}
            style={{
              background: isActive ? 'rgba(0, 229, 255, 0.08)' : 'none',
              border: 'none',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: isActive ? '#00e5ff' : '#64748b',
              cursor: 'pointer',
              position: 'relative',
              padding: '6px 4px',
              flex: 1,
              minWidth: 0,
              touchAction: 'manipulation',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.6 : 2}
                style={{
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.6))' : 'none',
                  transition: 'transform 0.15s ease'
                }}
              />
              {tab.count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-9px',
                  background: '#00e5ff',
                  color: '#060b17',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  borderRadius: '999px',
                  padding: '1px 5px',
                  minWidth: '15px',
                  textAlign: 'center',
                  boxShadow: '0 0 6px rgba(0, 229, 255, 0.8)'
                }}>
                  {tab.count}
                </span>
              )}
            </div>
            <span style={{ 
              fontSize: '0.66rem', 
              fontWeight: isActive ? 800 : 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: isActive ? '0.01em' : 'normal'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}