import React from 'react';
import { LayoutDashboard, Trello, Calendar, Users, Plus, Mic } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange, onOpenNewLead, onOpenVoiceLead, unreadCount = 2 }) {
  const tabs = [
    { id: 'dashboard', label: 'Сводка', icon: LayoutDashboard },
    { id: 'kanban', label: 'Воронка', icon: Trello },
    { id: 'add_center', label: '', isAction: true },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    { id: 'clients', label: 'Клиенты', icon: Users },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      maxWidth: '480px',
      margin: '0 auto',
      background: 'rgba(10, 15, 29, 0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingBottom: 'calc(8px + var(--safe-bottom))',
      paddingTop: '6px',
      paddingLeft: '12px',
      paddingRight: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 60,
    }}>
      {tabs.map((tab) => {
        if (tab.isAction) {
          return (
            <div key="action" style={{ position: 'relative', top: '-14px' }}>
              <button
                onClick={onOpenNewLead}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                  border: '3px solid #060913',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(0, 229, 255, 0.45)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Plus size={26} strokeWidth={2.8} />
              </button>
            </div>
          );
        }

        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              color: isActive ? '#00e5ff' : '#64748b',
              cursor: 'pointer',
              position: 'relative',
              transition: 'color 0.2s ease',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 800 : 500 }}>
              {tab.label}
            </span>
            {tab.id === 'kanban' && unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '10px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.6rem',
                fontWeight: 900,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
