import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { ROLE_CONFIG } from '../api/crmApi';

export default function CalendarView({ deals, onSelectDeal, onOpenNewLead }) {
  const [calendarMode, setCalendarMode] = useState('day'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState('2026-09-18');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(8); // September (0-indexed 8)
  const [selectedYear, setSelectedYear] = useState(2026);

  const MONTHS_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // All days of current week (14-20 Sep)
  const weekDays = [
    { day: 'Пн', num: '14', date: '2026-09-14' },
    { day: 'Вт', num: '15', date: '2026-09-15' },
    { day: 'Ср', num: '16', date: '2026-09-16' },
    { day: 'Чт', num: '17', date: '2026-09-17' },
    { day: 'Пт', num: '18', date: '2026-09-18' },
    { day: 'Сб', num: '19', date: '2026-09-19' },
    { day: 'Вс', num: '20', date: '2026-09-20' },
  ];

  // Hours for day view
  const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Helper: get deals for specific date
  const getDealsForDate = (dateStr) => {
    return deals.filter(d => d.date === dateStr);
  };

  const currentDayDeals = getDealsForDate(selectedDate);

  // Helper to format date display in Day mode
  const formatDayTitle = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const mName = MONTHS_NAMES[parseInt(m, 10) - 1];
    return `${parseInt(d, 10)} ${mName} ${y}`;
  };

  // Switch day by offset
  const shiftDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Generate Month Grid (for September 2026)
  // September 2026 starts on Tuesday (day 2 in week, so 1 empty cell before 1st)
  const generateMonthDays = () => {
    const firstDay = new Date(selectedYear, selectedMonthIndex, 1);
    const totalDays = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    // In JS, Sunday is 0. Shift so Monday is 0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];
    // Leading empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ empty: true });
    }
    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(selectedMonthIndex + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDate = `${selectedYear}-${monthStr}-${dayStr}`;
      const dayDeals = deals.filter(d => d.date === fullDate);
      cells.push({
        empty: false,
        dayNum: day,
        date: fullDate,
        deals: dayDeals
      });
    }
    return cells;
  };

  return (
    <div style={{ padding: '14px 16px 24px' }}>
      {/* Top Bar: Mode Switcher (День / Неделя / Месяц) */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        padding: '4px',
        marginBottom: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button
          type="button"
          onClick={() => setCalendarMode('day')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            background: calendarMode === 'day' ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : 'transparent',
            color: calendarMode === 'day' ? '#000' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🕒 День
        </button>

        <button
          type="button"
          onClick={() => setCalendarMode('week')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            background: calendarMode === 'week' ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : 'transparent',
            color: calendarMode === 'week' ? '#000' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          📅 Неделя
        </button>

        <button
          type="button"
          onClick={() => setCalendarMode('month')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '10px',
            border: 'none',
            background: calendarMode === 'month' ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : 'transparent',
            color: calendarMode === 'month' ? '#000' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🗓️ Месяц
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODE 1: ДЕНЬ (Hourly Timeline View)
          ══════════════════════════════════════════════════════════ */}
      {calendarMode === 'day' && (
        <div>
          {/* Day Navigation Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14, 22, 38, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '8px 12px',
            marginBottom: '16px'
          }}>
            <button
              onClick={() => shiftDay(-1)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.94rem' }}>
                {formatDayTitle(selectedDate)}
              </div>
              <div style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700 }}>
                {currentDayDeals.length} запланированных задач
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSelectedDate('2026-09-18')}
                style={{
                  background: 'rgba(0, 229, 255, 0.15)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: '#00e5ff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Сегодня
              </button>

              <button
                onClick={() => shiftDay(1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Quick Date Pills Horizontal (Week at a glance) */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '14px' }}>
            {weekDays.map(w => {
              const isSel = selectedDate === w.date;
              const hasEvents = getDealsForDate(w.date).length > 0;
              return (
                <button
                  key={w.date}
                  onClick={() => setSelectedDate(w.date)}
                  style={{
                    flex: 1,
                    minWidth: '42px',
                    padding: '8px 4px',
                    borderRadius: '12px',
                    background: isSel ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSel ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isSel ? '#000' : '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{w.day}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{w.num}</span>
                  {hasEvents && (
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: isSel ? '#000' : '#00e5ff',
                      marginTop: '2px'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hourly Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {HOURS.map((hour) => {
              const matchedDeals = currentDayDeals.filter(d => (d.time || '').startsWith(hour.slice(0, 2)));

              return (
                <div key={hour} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Time label */}
                  <div style={{
                    width: '46px',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    paddingTop: '6px',
                    textAlign: 'right'
                  }}>
                    {hour}
                  </div>

                  {/* Slot content */}
                  <div style={{ flex: 1, minHeight: '48px' }}>
                    {matchedDeals.length > 0 ? (
                      matchedDeals.map(d => {
                        const rInfo = ROLE_CONFIG[d.role] || ROLE_CONFIG.lead;
                        return (
                          <div
                            key={d.id}
                            onClick={() => onSelectDeal(d)}
                            style={{
                              background: rInfo.bg,
                              borderLeft: `4px solid ${rInfo.border}`,
                              borderRadius: '10px',
                              padding: '10px 12px',
                              cursor: 'pointer',
                              marginBottom: '6px',
                              border: `1px solid ${rInfo.border}30`,
                              boxShadow: `0 4px 12px ${rInfo.glow}`
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ color: rInfo.color, fontSize: '0.72rem', fontWeight: 800 }}>
                                {rInfo.icon} {rInfo.badge} • {d.time}
                              </span>
                              <span style={{ color: '#00e5ff', fontWeight: 900, fontSize: '0.78rem' }}>
                                {new Intl.NumberFormat('ru-RU').format(d.budget)} ₸
                              </span>
                            </div>
                            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.86rem' }}>
                              {d.title}
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '2px' }}>
                              👤 {d.client}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        marginTop: '14px',
                        width: '100%'
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE 2: НЕДЕЛЯ (7-Day Overview Cards)
          ══════════════════════════════════════════════════════════ */}
      {calendarMode === 'week' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 900 }}>
              Неделя: 14 – 20 сентября 2026
            </h3>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              5 активных дней
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {weekDays.map(w => {
              const dayDeals = getDealsForDate(w.date);
              const isToday = w.date === '2026-09-18';

              return (
                <div
                  key={w.date}
                  className="glass-panel"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: isToday ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isToday ? 'rgba(0, 229, 255, 0.05)' : 'rgba(14, 22, 38, 0.7)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: dayDeals.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    paddingBottom: dayDeals.length > 0 ? '8px' : '0',
                    marginBottom: dayDeals.length > 0 ? '8px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: isToday ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)',
                        color: isToday ? '#000' : '#fff',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        padding: '3px 8px',
                        borderRadius: '8px'
                      }}>
                        {w.num} {w.day}
                      </span>
                      {isToday && (
                        <span style={{ color: '#00e5ff', fontSize: '0.72rem', fontWeight: 800 }}>
                          • Сегодня
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                      {dayDeals.length} {dayDeals.length === 1 ? 'событие' : 'событий'}
                    </span>
                  </div>

                  {dayDeals.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {dayDeals.map(d => {
                        const rInfo = ROLE_CONFIG[d.role] || ROLE_CONFIG.lead;
                        return (
                          <div
                            key={d.id}
                            onClick={() => onSelectDeal(d)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderLeft: `3px solid ${rInfo.border}`,
                              borderRadius: '8px',
                              padding: '6px 10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <div>
                              <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>
                                {d.title}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                {d.time} • 👤 {d.client}
                              </div>
                            </div>
                            <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: '0.78rem' }}>
                              {new Intl.NumberFormat('ru-RU').format(d.budget)} ₸
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.74rem', fontStyle: 'italic' }}>
                      Нет назначенных выездов
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODE 3: МЕСЯЦ (Full 7x5 Calendar Grid)
          ══════════════════════════════════════════════════════════ */}
      {calendarMode === 'month' && (
        <div>
          {/* Month Header & Switcher */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
              {MONTHS_NAMES[selectedMonthIndex]} {selectedYear}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setSelectedMonthIndex(prev => (prev === 0 ? 11 : prev - 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setSelectedMonthIndex(prev => (prev === 11 ? 0 : prev + 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px' }}>
            {/* Week days row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
              {WEEK_DAYS.map(w => (
                <div key={w} style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 800 }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Days cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {generateMonthDays().map((cell, idx) => {
                if (cell.empty) {
                  return <div key={`empty-${idx}`} style={{ height: '42px' }} />;
                }

                const isSelected = selectedDate === cell.date;
                const hasDeals = cell.deals.length > 0;

                return (
                  <div
                    key={cell.date}
                    onClick={() => setSelectedDate(cell.date)}
                    style={{
                      height: '46px',
                      borderRadius: '10px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                        : hasDeals 
                        ? 'rgba(255, 255, 255, 0.06)' 
                        : 'transparent',
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#000' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 900 : 700 }}>
                      {cell.dayNum}
                    </span>

                    {/* Dot indicators */}
                    {hasDeals && (
                      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                        {cell.deals.slice(0, 3).map((d, i) => (
                          <span
                            key={i}
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              background: isSelected ? '#000' : '#00e5ff'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Summary & Events */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                Задачи на {formatDayTitle(selectedDate)} ({currentDayDeals.length}):
              </span>
            </div>

            {currentDayDeals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentDayDeals.map(d => {
                  const rInfo = ROLE_CONFIG[d.role] || ROLE_CONFIG.lead;
                  return (
                    <div
                      key={d.id}
                      onClick={() => onSelectDeal(d)}
                      className="glass-panel"
                      style={{
                        padding: '12px 14px',
                        borderLeft: `4px solid ${rInfo.border}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: rInfo.color, fontSize: '0.72rem', fontWeight: 800 }}>
                          {rInfo.icon} {rInfo.badge} • {d.time}
                        </span>
                        <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: '0.82rem' }}>
                          {new Intl.NumberFormat('ru-RU').format(d.budget)} ₸
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>
                        {d.title}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '3px' }}>
                        👤 {d.client} {d.location && `• 📍 ${d.location}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  На выбранную дату нет назначенных событий
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
