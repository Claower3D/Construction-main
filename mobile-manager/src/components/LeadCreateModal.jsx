import React, { useState } from 'react';
import { X, Mic, PlusCircle } from 'lucide-react';
import { ROLE_CONFIG } from '../api/crmApi';

export default function LeadCreateModal({ onClose, onCreateDeal, onOpenVoice }) {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [phone, setPhone] = useState('+7 ');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [role, setRole] = useState('lead');
  const [priority, setPriority] = useState('normal');
  const [time, setTime] = useState('11:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !client.trim()) {
      alert('Пожалуйста, заполните название заявки и имя клиента');
      return;
    }

    const numBudget = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 500000;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newDeal = {
      id: `deal-${Date.now().toString().slice(-4)}`,
      leadNum: Math.floor(100 + Math.random() * 900).toString(),
      title: title.trim(),
      client: client.trim(),
      phone: phone.trim(),
      location: location.trim() || 'г. Алматы',
      budget: numBudget,
      status: 'Новые',
      role,
      date: dateStr,
      time,
      priority,
      notes: [
        { text: 'Заявка создана через мобильное приложение менеджера', time: 'Только что', author: 'Менеджер' }
      ]
    };

    onCreateDeal(newDeal);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 110,
      background: 'rgba(0, 0, 0, 0.8)',
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
          borderTop: '1px solid rgba(0, 229, 255, 0.3)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>
              Новая заявка / Сделка
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Быстрое добавление в воронку менеджера
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onOpenVoice}
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                padding: '6px 10px',
                color: '#c4b5fd',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Mic size={14} /> Голосом
            </button>

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
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 30px' }}>
          {/* Role selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              ТИП ЗАЯВКИ / НАПРАВЛЕНИЕ:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(ROLE_CONFIG).map(([key, info]) => {
                const isSelected = role === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setRole(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: isSelected ? `1.5px solid ${info.border}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? info.bg : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#fff' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{info.icon}</span>
                    <span>{info.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Название работ / объект:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр., Заливка фундамента 150м²"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '11px 14px',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Client & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                ФИО Клиента:
              </label>
              <input
                type="text"
                required
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Имя заказчика"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Телефон:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Адрес / Локация объекта:
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="г. Алматы, мкр. Баганашил"
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '11px 14px',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Budget & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Бюджет (₸):
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1 500 000"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  color: '#00e5ff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Приоритет:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  color: priority === 'urgent' ? '#f87171' : '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="normal">Обычный</option>
                <option value="urgent">🔥 Срочный</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="glow-btn"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            <PlusCircle size={18} /> Создать и добавить в воронку
          </button>
        </form>
      </div>
    </div>
  );
}
