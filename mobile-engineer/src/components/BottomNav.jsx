import { ClipboardList, Calendar, ShieldAlert, Calculator, ShoppingBag, Wrench } from 'lucide-react';

export default function BottomNav({ activeTab, onSelectTab, activeCount = 0, todayCount = 0 }) {
  const tabs = [
    { id: 'inspections', label: 'Объекты', icon: ClipboardList, count: activeCount },
    { id: 'calendar', label: 'Календарь', icon: Calendar, count: todayCount },
    { id: 'defects', label: 'Дефекты', icon: ShieldAlert },
    { id: 'estimates', label: 'Смета AI', icon: Calculator },
    { id: 'marketplace', label: 'Маркет', icon: ShoppingBag },
    { id: 'tools', label: 'СНиП', icon: Wrench }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(10, 16, 31, 0.96)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '6px 4px calc(6px + var(--safe-bottom))',
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
              color: isActive ? '#f59e0b' : '#64748b',
              cursor: 'pointer',
              position: 'relative',
              padding: '4px 6px',
              flex: 1,
              minWidth: 0
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {tab.count > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#f59e0b',
                  color: '#070a13',
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
              fontSize: '0.62rem', 
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
