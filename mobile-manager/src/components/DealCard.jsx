import React from 'react';
import { Phone, MessageSquare, MapPin, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { ROLE_CONFIG } from '../api/crmApi';

export default function DealCard({ deal, onClick, onQuickStatusChange }) {
  const roleInfo = ROLE_CONFIG[deal.role] || ROLE_CONFIG.lead;

  const handleCall = (e) => {
    e.stopPropagation();
    const cleanPhone = deal.phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Здравствуйте, ${deal.client}! Пишу по вашей заявке «${deal.title}» в QazGost.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const formattedBudget = new Intl.NumberFormat('ru-RU').format(deal.budget) + ' ₸';

  return (
    <div 
      onClick={() => onClick(deal)}
      className="glass-panel"
      style={{
        padding: '14px 15px',
        marginBottom: '12px',
        borderLeft: `4px solid ${roleInfo.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header: Role badge, Date/Time, and Priority */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span 
            className="tag-badge"
            style={{ 
              background: roleInfo.bg, 
              color: roleInfo.color,
              border: `1px solid ${roleInfo.border}40`,
            }}
          >
            <span>{roleInfo.icon}</span>
            <span>{roleInfo.badge}</span>
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            #{deal.leadNum || deal.id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {deal.priority === 'urgent' && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <AlertCircle size={11} /> СРОЧНО
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={11} /> {deal.time || '10:00'}
          </span>
        </div>
      </div>

      {/* Deal Title */}
      <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.94rem', lineHeight: '1.3', marginBottom: '6px' }}>
        {deal.title}
      </div>

      {/* Client and Location */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
          👤 {deal.client}
        </div>
        {deal.location && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {deal.location}
          </div>
        )}
      </div>

      {/* Footer: Budget and Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>Бюджет:</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#00e5ff' }}>
            {formattedBudget}
          </span>
        </div>

        {/* Action Buttons: One-Tap Call & WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCall}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Позвонить клиенту"
          >
            <Phone size={15} />
          </button>

          <button
            onClick={handleWhatsApp}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Написать в WhatsApp"
          >
            <MessageSquare size={15} />
          </button>

          <div style={{ color: '#64748b', marginLeft: '2px' }}>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
