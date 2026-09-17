import React from 'react';
import { ClipboardList, CheckSquare, Truck, Calendar, ShoppingBag } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab, activeCount = 0 }) {
  const tabs = [
    { id: 'orders', label: 'Наряды', icon: ClipboardList, count: activeCount },
    { id: 'stages', label: 'Этапы СМР', icon: CheckSquare },
    { id: 'machinery', label: 'Техника', icon: Truck },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'market', label: 'Снабжение', icon: ShoppingBag }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(6, 11, 23, 0.96)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 229, 255, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '6px 8px calc(6px + var(--safe-bottom))',
      zIndex: 50
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: isActive ? '#00e5ff' : '#64748b',
              cursor: 'pointer',
              position: 'relative',
              padding: '4px 8px',
              flex: 1,
              minWidth: 0
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              {tab.count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#00e5ff',
                  color: '#060b17',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  borderRadius: '999px',
                  padding: '1px 4px',
                  minWidth: '14px',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              )}
            </div>
            <span style={{ 
              fontSize: '0.64rem', 
              fontWeight: isActive ? 800 : 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}