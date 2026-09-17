import React, { useState } from 'react';
import { X, Phone, MessageSquare, MapPin, Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ROLE_CONFIG, STAGES } from '../api/crmApi';

export default function DealDetailModal({ deal, onClose, onUpdateStatus, onAddNote, onDeleteDeal }) {
  const [newNote, setNewNote] = useState('');
  const roleInfo = ROLE_CONFIG[deal.role] || ROLE_CONFIG.lead;

  const handleCall = () => {
    const cleanPhone = deal.phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Здравствуйте, ${deal.client}! Пишу по объекту «${deal.title}» в QazGost.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleOpenMap = () => {
    const query = encodeURIComponent(deal.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(deal.id, newNote.trim());
    setNewNote('');
  };

  const formattedBudget = new Intl.NumberFormat('ru-RU').format(deal.budget) + ' ₸';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div 
        className="bottom-sheet"
        style={{
          background: '#0d1527',
          borderTop: '1px solid rgba(56, 189, 248, 0.3)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Modal Handle & Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '0 auto 12px'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                className="tag-badge"
                style={{ 
                  background: roleInfo.bg, 
                  color: roleInfo.color,
                  border: `1px solid ${roleInfo.border}40`,
                }}
              >
                {roleInfo.icon} {roleInfo.badge}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                #{deal.leadNum || deal.id}
              </span>
            </div>

            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, marginTop: '8px', lineHeight: '1.3' }}>
            {deal.title}
          </h3>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 30px' }}>
          {/* Status Changer Pills */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              СТАДИЯ СДЕЛКИ:
            </span>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {STAGES.map((st) => {
                const isActive = deal.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(deal.id, st)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      border: isActive ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.25), rgba(2, 132, 199, 0.25))' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#00e5ff' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 0 12px rgba(0, 229, 255, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action One-Tap Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <button
              onClick={handleCall}
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(22, 163, 74, 0.15))',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '14px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                color: '#4ade80',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.78rem'
              }}
            >
              <Phone size={22} />
              <span>Позвонить</span>
            </button>

            <button
              onClick={handleWhatsApp}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '14px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                color: '#34d399',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.78rem'
              }}
            >
              <MessageSquare size={22} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleOpenMap}
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.15))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '14px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.78rem'
              }}
            >
              <MapPin size={22} />
              <span>Карта 2GIS</span>
            </button>
          </div>

          {/* Details Card */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Клиент / Заказчик:</span>
              <strong style={{ color: '#fff', fontSize: '0.98rem' }}>{deal.client}</strong>
              <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '2px' }}>{deal.phone}</div>
            </div>

            {deal.location && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Адрес объекта:</span>
                <span style={{ color: '#e2e8f0', fontSize: '0.86rem' }}>{deal.location}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Дата / Время:</span>
                <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{deal.date} в {deal.time || '10:00'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Бюджет сделки:</span>
                <strong style={{ color: '#00e5ff', fontSize: '1.05rem' }}>{formattedBudget}</strong>
              </div>
            </div>
          </div>

          {/* Estimate breakdown if available */}
          {deal.estimateItems && deal.estimateItems.length > 0 && (
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Позиции сметы ГОСТ:
              </div>
              {deal.estimateItems.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: idx < deal.estimateItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{item.qty}</div>
                  </div>
                  <strong style={{ color: '#38bdf8' }}>
                    {new Intl.NumberFormat('ru-RU').format(item.sum)} ₸
                  </strong>
                </div>
              ))}
            </div>
          )}

          {/* Notes & History Timeline */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 800, display: 'block', marginBottom: '8px' }}>
              Заметки менеджера ({deal.notes?.length || 0}):
            </span>

            {/* Note input form */}
            <form onSubmit={handleAddNoteSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Добавить заметку о созвоне или встрече..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#00e5ff',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  padding: '0 14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Notes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deal.notes && deal.notes.map((n, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: '3px solid #38bdf8',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>{n.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>
                    <span>{n.author || 'Менеджер'}</span>
                    <span>{n.time || 'Недавно'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete action */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                if (window.confirm('Удалить эту сделку из CRM?')) {
                  onDeleteDeal(deal.id);
                  onClose();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: 0.8
              }}
            >
              <Trash2 size={14} /> Удалить сделку из базы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
