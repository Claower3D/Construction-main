import React from 'react';
import { Phone, MessageCircle, Navigation, MapPin, Clock, ArrowRight, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { STATUS_CONFIG } from '../api/engineerApi';

export default function InspectionCard({ deal, onSelect, onQuickStatus }) {
  const statusInfo = STATUS_CONFIG[deal.status] || { label: deal.status, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '📌' };

  const handleCall = (e) => {
    e.stopPropagation();
    if (deal.phone) {
      window.open(`tel:${deal.phone.replace(/[^0-9+]/g, '')}`, '_system');
    }
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (deal.phone) {
      const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Здравствуйте, ${deal.client}! Я инженер компании QazGost по вашей заявке «${deal.title}». Подскажите, в какое время вам удобно принять специалиста для осмотра объекта?`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_system');
    }
  };

  const handleMapRoute = (e) => {
    e.stopPropagation();
    if (deal.location) {
      const q = encodeURIComponent(deal.location);
      // Opens 2GIS search or Google/Yandex maps
      window.open(`https://2gis.kz/search/${q}`, '_system');
    }
  };

  return (
    <div
      onClick={() => onSelect(deal)}
      style={{
        background: 'rgba(13, 21, 39, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Status & Lead Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: statusInfo.color,
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.color}33`,
            padding: '3px 8px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.label}</span>
          </span>
          {deal.priority === 'urgent' && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '2px 6px',
              borderRadius: '6px'
            }}>
              Срочно
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>
          #{deal.leadNum || deal.id.slice(-3)}
        </span>
      </div>

      {/* Title & Client */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', lineHeight: 1.3 }}>
        {deal.title}
      </h3>
      <div style={{ fontSize: '0.86rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
        👤 {deal.client}
      </div>

      {/* Address */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        fontSize: '0.8rem',
        color: '#94a3b8',
        marginBottom: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '6px 10px',
        borderRadius: '8px'
      }}>
        <MapPin size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ flex: 1 }}>{deal.location}</span>
      </div>

      {/* Date, Budget & Measurements hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
          <Clock size={14} />
          <span>{deal.date || 'Сегодня'} • {deal.time || '10:00'}</span>
        </div>
        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.88rem' }}>
          {Number(deal.budget || 0).toLocaleString('ru-RU')} ₸
        </span>
      </div>

      {/* Quick Actions Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '12px'
      }}>
        <button
          onClick={handleCall}
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '8px 0',
            color: '#10b981',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Phone size={14} />
          <span>Звонок</span>
        </button>

        <button
          onClick={handleWhatsApp}
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            padding: '8px 0',
            color: '#4ade80',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <MessageCircle size={14} />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleMapRoute}
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '8px 0',
            color: '#f59e0b',
            fontSize: '0.76rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Navigation size={14} />
          <span>2GIS</span>
        </button>
      </div>
    </div>
  );
}
