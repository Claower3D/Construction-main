import React, { useState } from 'react';
import InspectionCard from './InspectionCard';
import { Filter, Search, PlusCircle, CheckCircle, Clock } from 'lucide-react';

export default function InspectionListView({ deals, onSelectDeal, searchQuery }) {
  const [filterTab, setFilterTab] = useState('all'); // all | urgent | today | in_work | completed

  const filterTabs = [
    { id: 'all', label: 'Все' },
    { id: 'need_departure', label: 'К выезду' },
    { id: 'inspecting', label: 'На объекте' },
    { id: 'measured', label: 'Замер готов' },
    { id: 'in_work', label: 'В работе' },
    { id: 'completed', label: 'Завершены' }
  ];

  const filteredDeals = deals.filter(deal => {
    // Search query check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        (deal.client || '').toLowerCase().includes(q) ||
        (deal.title || '').toLowerCase().includes(q) ||
        (deal.location || '').toLowerCase().includes(q) ||
        (deal.phone || '').includes(q);
      if (!match) return false;
    }

    if (filterTab === 'need_departure') {
      return deal.status === 'Новые' || deal.status === 'Выезд назначен' || deal.status === 'Инженер выехал';
    }
    if (filterTab === 'inspecting') {
      return deal.status === 'На объекте';
    }
    if (filterTab === 'measured') {
      return deal.status === 'Замер выполнен' || deal.status === 'Смета готова';
    }
    if (filterTab === 'in_work') {
      return deal.status === 'В работе';
    }
    if (filterTab === 'completed') {
      return deal.status === 'Завершено';
    }
    return true;
  });

  const needDepartureCount = deals.filter(d => d.status === 'Новые' || d.status === 'Выезд назначен' || d.status === 'Инженер выехал').length;

  return (
    <div style={{ padding: '16px' }}>
      {/* Quick Summary Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Объекты инженера
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            {needDepartureCount} требуют выезда
          </div>
        </div>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem'
        }}>
          🚗
        </div>
      </div>

      {/* Filter Tabs Scroll */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '14px',
        scrollbarWidth: 'none'
      }}>
        {filterTabs.map(tab => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                background: isActive ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                color: isActive ? '#070a13' : '#94a3b8',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Deal List */}
      {filteredDeals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#64748b',
          fontSize: '0.9rem'
        }}>
          Нет объектов в этой категории
        </div>
      ) : (
        filteredDeals.map(deal => (
          <InspectionCard
            key={deal.id}
            deal={deal}
            onSelect={onSelectDeal}
          />
        ))
      )}
    </div>
  );
}
