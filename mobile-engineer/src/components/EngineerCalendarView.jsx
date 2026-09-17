import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Navigation, 
  ChevronLeft, ChevronRight, Plus, CheckCircle2, AlertCircle, 
  X, Filter, CalendarCheck, ArrowRight, User
} from 'lucide-react';
import { STATUS_CONFIG } from '../api/engineerApi';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function EngineerCalendarView({ deals = [], onSelectDeal, onScheduleVisit }) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDealForSchedule, setSelectedDealForSchedule] = useState('');
  const [modalDate, setModalDate] = useState(todayStr);
  const [modalTime, setModalTime] = useState('11:00');

  // Filter deals for current selected date
  const dealsForSelectedDate = useMemo(() => {
    return deals.filter(d => {
      if (d.date) return d.date === selectedDate;
      return selectedDate === todayStr;
    });
  }, [deals, selectedDate, todayStr]);

  // Generate 14 days around today for fast date selector strip
  const dateStrip = useMemo(() => {
    const list = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = deals.filter(x => (x.date === dStr || (!x.date && dStr === todayStr))).length;
      list.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dStr === todayStr,
        count
      });
    }
    return list;
  }, [today, todayStr, deals]);

  // Generate calendar grid for month view
  const monthGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Day of week: 0=Sun, 1=Mon ... 6=Sat. Shift to Mon=0
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ empty: true });
    }

    for (let day = 1; day <= totalDays; day++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mStr}-${dStr}`;
      const dayDeals = deals.filter(d => (d.date === dateStr || (!d.date && dateStr === todayStr)));
      cells.push({
        empty: false,
        dayNum: day,
        dateStr,
        isToday: dateStr === todayStr,
        deals: dayDeals
      });
    }
    return cells;
  }, [currentYear, currentMonth, deals, todayStr]);

  // Navigation handlers
  const shiftSelectedDate = (deltaDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    const nextStr = d.toISOString().split('T')[0];
    setSelectedDate(nextStr);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const shiftMonth = (deltaMonth) => {
    let nextM = currentMonth + deltaMonth;
    let nextY = currentYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    } else if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setCurrentMonth(nextM);
    setCurrentYear(nextY);
  };

  const jumpToToday = () => {
    setSelectedDate(todayStr);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleOpenScheduleModal = (prefillDealId = null) => {
    if (prefillDealId) {
      setSelectedDealForSchedule(prefillDealId);
    } else if (deals.length > 0) {
      setSelectedDealForSchedule(deals[0].id);
    }
    setModalDate(selectedDate);
    setModalTime('11:00');
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedDealForSchedule) {
      alert('Пожалуйста, выберите объект для назначения выезда');
      return;
    }
    if (onScheduleVisit) {
      onScheduleVisit(selectedDealForSchedule, modalDate, modalTime);
    }
    setShowScheduleModal(false);
  };

  // Open 2GIS / Maps with location
  const handleOpenNavigation = (location) => {
    if (!location) return;
    const clean = encodeURIComponent(location);
    const url = `https://2gis.kz/search/${clean}`;
    window.open(url, '_blank');
  };

  // Format date display
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${MONTH_NAMES[m]} ${y}`;
    } catch (e) {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div style={{ padding: '14px 16px 28px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} color="#f59e0b" />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Календарь выездов
            </h1>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            План выездов, замеров и надзора инженера
          </span>
        </div>

        {/* View Switcher: День / Месяц */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              background: viewMode === 'day' ? '#f59e0b' : 'none',
              color: viewMode === 'day' ? '#070a13' : '#94a3b8',
              border: 'none',
              borderRadius: '9px',
              padding: '6px 12px',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            День
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              background: viewMode === 'month' ? '#f59e0b' : 'none',
              color: viewMode === 'month' ? '#070a13' : '#94a3b8',
              border: 'none',
              borderRadius: '9px',
              padding: '6px 12px',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Month & Day Navigator Bar */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '10px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => viewMode === 'day' ? shiftSelectedDate(-1) : shiftMonth(-1)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => viewMode === 'day' ? shiftSelectedDate(1) : shiftMonth(1)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={18} />
          </button>

          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginLeft: '6px' }}>
            {viewMode === 'day' ? formattedSelectedDate : `${MONTH_NAMES[currentMonth]} ${currentYear}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={jumpToToday}
            style={{
              background: selectedDate === todayStr ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: selectedDate === todayStr ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
              color: selectedDate === todayStr ? '#f59e0b' : '#94a3b8',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Сегодня
          </button>

          <button
            onClick={() => handleOpenScheduleModal()}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: '#070a13',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>Выезд</span>
          </button>
        </div>
      </div>

      {/* Date Strip (Available in Day mode) */}
      {viewMode === 'day' && (
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '16px',
          scrollbarWidth: 'none'
        }}>
          {dateStrip.map(d => {
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
                  background: isSelected 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : (d.isToday ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)'),
                  border: isSelected 
                    ? 'none' 
                    : (d.isToday ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
                  color: isSelected ? '#070a13' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isSelected ? '0 4px 15px rgba(245, 158, 11, 0.35)' : 'none'
                }}
              >
                <span style={{ 
                  fontSize: '0.66rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  opacity: isSelected ? 0.9 : 0.6 
                }}>
                  {d.dayName}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                  {d.dayNum}
                </span>
                
                {/* Event indicator badge */}
                {d.count > 0 && (
                  <span style={{
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    background: isSelected ? '#070a13' : '#f59e0b',
                    color: isSelected ? '#f59e0b' : '#070a13',
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px'
                  }}>
                    {d.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          {/* Weekday headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            {WEEK_DAYS.map((w, idx) => (
              <span key={w} style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: idx >= 5 ? '#f59e0b' : '#94a3b8'
              }}>
                {w}
              </span>
            ))}
          </div>

          {/* Month day cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px'
          }}>
            {monthGrid.map((cell, idx) => {
              if (cell.empty) {
                return <div key={`empty_${idx}`} style={{ minHeight: '44px' }} />;
              }

              const isSelected = selectedDate === cell.dateStr;
              const hasDeals = cell.deals && cell.deals.length > 0;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    setViewMode('day');
                  }}
                  style={{
                    minHeight: '44px',
                    borderRadius: '12px',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                      : (cell.isToday ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)'),
                    border: isSelected 
                      ? 'none' 
                      : (cell.isToday ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)'),
                    color: isSelected ? '#070a13' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '4px 2px',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: cell.isToday || isSelected ? 900 : 600 }}>
                    {cell.dayNum}
                  </span>
                  {hasDeals && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      {cell.deals.slice(0, 3).map((d, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            background: isSelected ? '#070a13' : (d.priority === 'urgent' ? '#ef4444' : '#f59e0b')
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Visits Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
          {selectedDate === todayStr ? 'Выезды на сегодня' : `Выезды на ${formattedSelectedDate}`}
        </div>
        <span style={{
          fontSize: '0.72rem',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          padding: '2px 10px',
          borderRadius: '999px',
          fontWeight: 800
        }}>
          {dealsForSelectedDate.length} объектов
        </span>
      </div>

      {/* Visits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dealsForSelectedDate.length === 0 ? (
          <div style={{
            background: 'rgba(13, 21, 39, 0.6)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <CalendarCheck size={38} color="#64748b" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Нет выездов на выбранную дату
            </div>
            <p style={{ fontSize: '0.78rem', margin: '0 0 16px', color: '#64748b' }}>
              Вы можете назначить замер или надзор любого объекта из базы
            </p>
            <button
              onClick={() => handleOpenScheduleModal()}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#f59e0b',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              + Назначить выезд на этот день
            </button>
          </div>
        ) : (
          dealsForSelectedDate.map((deal) => {
            const conf = STATUS_CONFIG[deal.status] || { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '📌' };
            const isUrgent = deal.priority === 'urgent';

            return (
              <div
                key={deal.id}
                style={{
                  background: 'rgba(13, 21, 39, 0.92)',
                  border: isUrgent ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  padding: '14px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Urgent top ribbon */}
                {isUrgent && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '2px 10px',
                    borderBottomLeftRadius: '10px',
                    textTransform: 'uppercase'
                  }}>
                    Срочно
                  </div>
                )}

                {/* Top: Time & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    color: '#f59e0b'
                  }}>
                    <Clock size={14} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>
                      {deal.time || '10:00'}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: conf.color,
                    background: conf.bg,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {conf.icon} {deal.status}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {deal.title}
                </div>

                {/* Client info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  color: '#cbd5e1',
                  marginBottom: '8px'
                }}>
                  <User size={14} color="#f59e0b" />
                  <span>{deal.client}</span>
                  {deal.phone && (
                    <span style={{ color: '#94a3b8' }}>• {deal.phone}</span>
                  )}
                </div>

                {/* Address */}
                {deal.location && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: '#94a3b8',
                    marginBottom: '12px'
                  }}>
                    <MapPin size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deal.location}
                    </span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '10px'
                }}>
                  {deal.phone && (
                    <a
                      href={`tel:${deal.phone.replace(/[^\d+]/g, '')}`}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '8px 0',
                        color: '#ffffff',
                        fontSize: '0.74rem',
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

                  {deal.location && (
                    <button
                      onClick={() => handleOpenNavigation(deal.location)}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '8px 0',
                        color: '#ffffff',
                        fontSize: '0.74rem',
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
                    onClick={() => onSelectDeal(deal)}
                    style={{
                      flex: 1.4,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 0',
                      color: '#070a13',
                      fontSize: '0.76rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Замеры / Смета</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Visit Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(13, 21, 39, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '20px',
            width: '100%',
            maxWidth: '380px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Назначить выезд инженера
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Select Object */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Выберите объект / заявку:
              </label>
              <select
                value={selectedDealForSchedule}
                onChange={(e) => setSelectedDealForSchedule(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                {deals.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#0d1527', color: '#ffffff' }}>
                    #{d.leadNum || d.id} • {d.title} ({d.client})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Дата выезда:
              </label>
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#f59e0b',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            {/* Time Slot Presets */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Время выезда:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {['09:00', '11:00', '14:00', '16:30'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModalTime(t)}
                    style={{
                      background: modalTime === t ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
                      color: modalTime === t ? '#070a13' : '#ffffff',
                      border: modalTime === t ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 0',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="time"
                value={modalTime}
                onChange={(e) => setModalTime(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleSaveSchedule}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#070a13',
                fontWeight: 900,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
              }}
            >
              Сохранить выезд в график
            </button>
          </div>
        </div>
      )}
    </div>
  );
}