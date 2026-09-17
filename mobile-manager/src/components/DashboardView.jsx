import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Plus, Mic, ArrowUpRight } from 'lucide-react';
import DealCard from './DealCard';
import { ROLE_CONFIG } from '../api/crmApi';

export default function DashboardView({ deals, onSelectDeal, onOpenNewLead, onOpenVoice }) {
  const activeDeals = deals.filter(d => d.status !== 'Успешно' && d.status !== 'Отказ');
  const urgentDeals = deals.filter(d => d.priority === 'urgent' && d.status !== 'Успешно' && d.status !== 'Отказ');
  const wonDeals = deals.filter(d => d.status === 'Успешно');

  const totalActiveBudget = activeDeals.reduce((acc, d) => acc + (d.budget || 0), 0);
  const totalWonBudget = wonDeals.reduce((acc, d) => acc + (d.budget || 0), 0);

  const formattedActiveBudget = new Intl.NumberFormat('ru-RU').format(totalActiveBudget) + ' ₸';
  const formattedWonBudget = new Intl.NumberFormat('ru-RU').format(totalWonBudget) + ' ₸';

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Quick Action Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 229, 255, 0.15)'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Быстрое действие
          </span>
          <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 900, marginTop: '2px' }}>
            Новая заявка в CRM
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenVoice}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Mic size={15} /> Голос
          </button>

          <button
            onClick={onOpenNewLead}
            style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 14px',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 229, 255, 0.35)'
            }}
          >
            <Plus size={15} /> Создать
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
            Показатели за месяц:
          </span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            +18.4% <ArrowUpRight size={14} />
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Active Deals */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', marginBottom: '6px' }}>
              <Clock size={16} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>В работе</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
              {activeDeals.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              на {formattedActiveBudget}
            </div>
          </div>

          {/* Won Deals */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginBottom: '6px' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Закрыто (Акты)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
              {wonDeals.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              на {formattedWonBudget}
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Tasks Block */}
      {urgentDeals.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertTriangle size={16} color="#f87171" />
            <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 900, textTransform: 'uppercase' }}>
              Требуют внимания сегодня ({urgentDeals.length})
            </span>
          </div>

          {urgentDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={onSelectDeal} />
          ))}
        </div>
      )}

      {/* Breakdown by Roles */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
          Распределение по направлениям:
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(ROLE_CONFIG).map(([roleKey, roleCfg]) => {
            const count = deals.filter(d => d.role === roleKey).length;
            const pct = deals.length > 0 ? Math.round((count / deals.length) * 100) : 0;
            return (
              <div key={roleKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{roleCfg.icon}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{roleCfg.badge}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '60px',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: roleCfg.border, borderRadius: '3px' }} />
                  </div>
                  <span style={{ color: '#94a3b8', fontWeight: 800, width: '22px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
