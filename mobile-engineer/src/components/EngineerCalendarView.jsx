import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import { STATUS_CONFIG } from '../api/engineerApi';

export default function EngineerCalendarView({ deals, onSelectDeal }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  // Generate next 7 days for the date strip
  const daysList = [];
  for (let i = -2; i < 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    daysList.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0
    });
  }

  const selectedDeals = deals.filter(d => {
    return d.date === selectedDate || (!d.date && selectedDate === today.toISOString().split('T')[0]);
  });

  return (
    <div style={{ padding: '16px' }}>
      {/* Calendar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
          График выездов инженера
        </div>
        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
          {new Date(selectedDate).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Date Carousel Strip */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        scrollbarWidth: 'none'
      }}>
        {daysList.map(d => {
          const isSelected = selectedDate === d.dateStr;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              style={{
                flex: '0 0 auto',
                width: '54px',
                padding: '10px 0',
                borderRadius: '14px',
                background: isSelected ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255, 255, 255, 0.05)',
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#070a13' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 15px rgba(245, 158, 11, 0.35)' : 'none'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>
                {d.dayName}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                {d.dayNum}
              </span>
              {d.isToday && (
                <span style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isSelected ? '#070a13' : '#f59e0b',
                  marginTop: '2px'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline List of Deals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {selectedDeals.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '14px',
            padding: '30px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <CalendarIcon size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.88rem' }}>На этот день выезды не запланированы</div>
          </div>
        ) : (
          selectedDeals.map((deal) => {
            const conf = STATUS_CONFIG[deal.status] || { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '📌' };
            return (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                style={{
                  background: 'rgba(13, 21, 39, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer'
                }}
              >
                {/* Time badge on left */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px',
                  borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <Clock size={16} color="#f59e0b" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    {deal.time || '10:00'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: conf.color, fontWeight: 700 }}>
                      {conf.icon} {deal.status}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                      {Number(deal.budget || 0).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>

                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                    {deal.title}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px' }}>
                    👤 {deal.client} ({deal.phone})
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#94a3b8' }}>
                    <MapPin size={13} color="#f59e0b" />
                    <span>{deal.location}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
