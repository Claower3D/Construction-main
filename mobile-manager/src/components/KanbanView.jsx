import React, { useState } from 'react';
import DealCard from './DealCard';
import { STAGES, ROLE_CONFIG } from '../api/crmApi';
import { Filter, Inbox } from 'lucide-react';

export default function KanbanView({ deals, onSelectDeal, searchQuery }) {
  const [activeStage, setActiveStage] = useState('Новые');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Filter deals by stage, search, and role
  const filteredDeals = deals.filter((d) => {
    if (d.status !== activeStage) return false;
    if (selectedRoleFilter !== 'all' && d.role !== selectedRoleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchClient = (d.client || '').toLowerCase().includes(q);
      const matchLocation = (d.location || '').toLowerCase().includes(q);
      const matchPhone = (d.phone || '').toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchLocation && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '12px 16px 20px' }}>
      {/* Stages Horizontal Scroller */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '10px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {STAGES.map((st) => {
          const isActive = activeStage === st;
          const count = deals.filter(d => d.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setActiveStage(st)}
              style={{
                flexShrink: 0,
                padding: '9px 14px',
                borderRadius: '12px',
                border: isActive ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(2, 132, 199, 0.25) 100%)' 
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#00e5ff' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(0, 229, 255, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{st}</span>
              <span style={{
                background: isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)',
                color: isActive ? '#000' : '#cbd5e1',
                fontSize: '0.7rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '8px',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Role Filter Pills */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '10px',
        scrollbarWidth: 'none'
      }}>
        <button
          onClick={() => setSelectedRoleFilter('all')}
          style={{
            flexShrink: 0,
            padding: '5px 10px',
            borderRadius: '8px',
            border: selectedRoleFilter === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
            background: selectedRoleFilter === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: selectedRoleFilter === 'all' ? '#38bdf8' : '#64748b',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Все ({deals.filter(d => d.status === activeStage).length})
        </button>

        {Object.entries(ROLE_CONFIG).map(([rKey, rCfg]) => {
          const isSelected = selectedRoleFilter === rKey;
          const count = deals.filter(d => d.status === activeStage && d.role === rKey).length;
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRoleFilter(rKey)}
              style={{
                flexShrink: 0,
                padding: '5px 10px',
                borderRadius: '8px',
                border: isSelected ? `1px solid ${rCfg.border}` : '1px solid rgba(255, 255, 255, 0.06)',
                background: isSelected ? rCfg.bg : 'transparent',
                color: isSelected ? rCfg.color : '#64748b',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{rCfg.icon}</span>
              <span>{rCfg.badge}</span>
              <span style={{ opacity: 0.8 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Deals List */}
      <div>
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={onSelectDeal}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            marginTop: '10px'
          }}>
            <Inbox size={40} color="#64748b" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
            <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}>
              Нет сделок в стадии «{activeStage}»
            </div>
            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px' }}>
              Переместите сделку из другого этапа или добавьте новую заявку через кнопку «+»
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
