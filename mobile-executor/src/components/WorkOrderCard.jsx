import React from 'react';
import { MapPin, Phone, Clock, ArrowRight, CheckCircle, Hammer, AlertTriangle, Navigation } from 'lucide-react';
import { STATUS_CONFIG } from '../api/executorApi';

export default function WorkOrderCard({ order, onSelectOrder }) {
  const conf = STATUS_CONFIG[order.status] || { color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '⚙️' };
  const stages = order.stages || [];
  const completedStages = stages.filter(s => s.done).length;
  const totalStages = stages.length || 7;
  const progressPercent = Math.round((completedStages / totalStages) * 100);

  const handleOpen2GIS = (e) => {
    e.stopPropagation();
    if (!order.location) return;
    window.open(`https://2gis.kz/search/${encodeURIComponent(order.location)}`, '_blank');
  };

  const handleCall = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onSelectOrder(order)}
      style={{
        background: 'rgba(13, 21, 39, 0.92)',
        border: order.priority === 'urgent' ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(0, 229, 255, 0.18)',
        borderRadius: '18px',
        padding: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease'
      }}
    >
      {/* Top Bar: Order ID, Status, Urgent Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 900,
            background: 'rgba(0, 229, 255, 0.12)',
            color: '#00e5ff',
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.04em'
          }}>
            #{order.leadNum || order.id}
          </span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: conf.color,
            background: conf.bg,
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            {conf.icon} {order.status}
          </span>
        </div>

        {order.priority === 'urgent' && (
          <span style={{
            fontSize: '0.66rem',
            fontWeight: 900,
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '2px 8px',
            borderRadius: '999px',
            textTransform: 'uppercase'
          }}>
            Срочно
          </span>
        )}
      </div>

      {/* Title & Client */}
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 800,
        color: '#ffffff',
        margin: '0 0 6px',
        lineHeight: 1.3
      }}>
        {order.title}
      </h3>

      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
        👤 <span style={{ fontWeight: 700 }}>{order.client}</span> {order.phone && <span style={{ color: '#94a3b8' }}>• {order.phone}</span>}
      </div>

      {/* Location */}
      {order.location && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.76rem',
          color: '#94a3b8',
          marginBottom: '12px'
        }}>
          <MapPin size={14} color="#00e5ff" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.location}
          </span>
        </div>
      )}

      {/* Progress Bar for Stages */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '10px 12px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hammer size={14} color="#00e5ff" />
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f1f5f9' }}>
              Этапы строймонтажа
            </span>
          </div>
          <span style={{ fontSize: '0.76rem', fontWeight: 900, color: '#00e5ff' }}>
            {completedStages}/{totalStages} ({progressPercent}%)
          </span>
        </div>

        {/* Progress track */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #00e5ff 0%, #0284c7 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '12px'
      }}>
        {order.phone && (
          <a
            href={`tel:${order.phone.replace(/[^\d+]/g, '')}`}
            onClick={handleCall}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '8px 0',
              color: '#ffffff',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <Phone size={14} color="#10b981" />
            <span>Звонок</span>
          </a>
        )}

        {order.location && (
          <button
            onClick={handleOpen2GIS}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '8px 0',
              color: '#ffffff',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Navigation size={14} color="#38bdf8" />
            <span>2GIS</span>
          </button>
        )}

        <button
          onClick={() => onSelectOrder(order)}
          style={{
            flex: 1.5,
            background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 0',
            color: '#060b17',
            fontSize: '0.78rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <span>Наряд и этапы</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}