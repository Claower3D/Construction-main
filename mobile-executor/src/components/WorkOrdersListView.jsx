import React, { useState } from 'react';
import WorkOrderCard from './WorkOrderCard';
import { Hammer, Filter, CheckCircle2, Clock, Truck } from 'lucide-react';

export default function WorkOrdersListView({ orders = [], onSelectOrder, searchQuery }) {
  const [filterTab, setFilterTab] = useState('all'); // all | in_work | ready | completed

  const filterTabs = [
    { id: 'all', label: 'Все наряды' },
    { id: 'in_work', label: 'В работе' },
    { id: 'departure', label: 'К выезду' },
    { id: 'acceptance', label: 'Приёмка' },
    { id: 'completed', label: 'Сданы' }
  ];

  const filteredOrders = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (o.client || '').toLowerCase().includes(q) ||
        (o.title || '').toLowerCase().includes(q) ||
        (o.location || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q);
      if (!match) return false;
    }

    if (filterTab === 'in_work') {
      return o.status === 'В работе' || o.status === 'На объекте';
    }
    if (filterTab === 'departure') {
      return o.status === 'Новые' || o.status === 'Выезд назначен';
    }
    if (filterTab === 'acceptance') {
      return o.status === 'Приёмка';
    }
    if (filterTab === 'completed') {
      return o.status === 'Завершено';
    }
    return true;
  });

  const inWorkCount = orders.filter(o => o.status === 'В работе' || o.status === 'На объекте').length;
  const totalStagesDone = orders.reduce((sum, o) => sum + (o.stages || []).filter(s => s.done).length, 0);

  return (
    <div style={{ padding: '16px' }}>
      {/* Summary KPI Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.05) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#00e5ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Строймонтаж и объекты
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            {inWorkCount} нарядов в работе
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 229, 255, 0.12)',
          borderRadius: '12px',
          padding: '8px 12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00e5ff' }}>
            {totalStagesDone}
          </div>
          <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700 }}>
            этапов сдано
          </div>
        </div>
      </div>

      {/* Filter Tabs Scroll */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        scrollbarWidth: 'none'
      }}>
        {filterTabs.map(tab => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                background: isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#060b17' : '#94a3b8',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '7px 14px',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Hammer size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Нет нарядов в данной категории
            </div>
            <p style={{ fontSize: '0.76rem', margin: 0 }}>
              Выберите другую вкладку фильтра или сбросьте поиск
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <WorkOrderCard
              key={order.id}
              order={order}
              onSelectOrder={onSelectOrder}
            />
          ))
        )}
      </div>
    </div>
  );
}