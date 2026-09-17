import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Navigation, ChevronLeft, ChevronRight, ArrowRight, User } from 'lucide-react';
import { STATUS_CONFIG } from '../api/executorApi';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function ExecutorCalendarView({ orders = [], onSelectOrder }) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const ordersForDate = useMemo(() => {
    return orders.filter(o => {
      if (o.date) return o.date === selectedDate;
      return selectedDate === todayStr;
    });
  }, [orders, selectedDate, todayStr]);

  // 14 days selector strip
  const dateStrip = useMemo(() => {
    const list = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = orders.filter(x => (x.date === dStr || (!x.date && dStr === todayStr))).length;
      list.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dStr === todayStr,
        count
      });
    }
    return list;
  }, [today, todayStr, orders]);

  // Month grid
  const monthGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
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
      const dayOrders = orders.filter(o => (o.date === dateStr || (!o.date && dateStr === todayStr)));
      cells.push({
        empty: false,
        dayNum: day,
        dateStr,
        isToday: dateStr === todayStr,
        orders: dayOrders
      });
    }
    return cells;
  }, [currentYear, currentMonth, orders, todayStr]);

  const shiftDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleOpen2GIS = (location) => {
    if (!location) return;
    window.open(`https://2gis.kz/search/${encodeURIComponent(location)}`, '_blank');
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} color="#00e5ff" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            График смен и монтажа
          </h2>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '3px' }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              background: viewMode === 'day' ? '#00e5ff' : 'none',
              color: viewMode === 'day' ? '#060b17' : '#94a3b8',
              border: 'none',
              borderRadius: '7px',
              padding: '5px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            День
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              background: viewMode === 'month' ? '#00e5ff' : 'none',
              color: viewMode === 'month' ? '#060b17' : '#94a3b8',
              border: 'none',
              borderRadius: '7px',
              padding: '5px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Date Navigator */}
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
            onClick={() => shiftDay(-1)}
            style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => shiftDay(1)}
            style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginLeft: '6px' }}>
            {selectedDate}
          </span>
        </div>

        <button
          onClick={() => setSelectedDate(todayStr)}
          style={{
            background: selectedDate === todayStr ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: selectedDate === todayStr ? '1px solid #00e5ff' : 'none',
            color: selectedDate === todayStr ? '#00e5ff' : '#94a3b8',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Сегодня
        </button>
      </div>

      {/* Date Strip */}
      {viewMode === 'day' && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', scrollbarWidth: 'none' }}>
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
                  background: isSelected ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : (d.isToday ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'),
                  border: isSelected ? 'none' : (d.isToday ? '1px solid rgba(0, 229, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'),
                  color: isSelected ? '#060b17' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 0.6 }}>{d.dayName}</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>{d.dayNum}</span>
                {d.count > 0 && (
                  <span style={{ minWidth: '16px', height: '16px', borderRadius: '8px', background: isSelected ? '#060b17' : '#00e5ff', color: isSelected ? '#00e5ff' : '#060b17', fontSize: '0.58rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
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
        <div style={{ background: 'rgba(13, 21, 39, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px' }}>
            {WEEK_DAYS.map((w, idx) => (
              <span key={w} style={{ fontSize: '0.72rem', fontWeight: 800, color: idx >= 5 ? '#00e5ff' : '#94a3b8' }}>{w}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {monthGrid.map((cell, idx) => {
              if (cell.empty) return <div key={idx} style={{ minHeight: '42px' }} />;
              const isSelected = selectedDate === cell.dateStr;
              const hasOrders = cell.orders && cell.orders.length > 0;
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => { setSelectedDate(cell.dateStr); setViewMode('day'); }}
                  style={{
                    minHeight: '42px',
                    borderRadius: '12px',
                    background: isSelected ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' : (cell.isToday ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)'),
                    border: isSelected ? 'none' : (cell.isToday ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)'),
                    color: isSelected ? '#060b17' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{cell.dayNum}</span>
                  {hasOrders && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#060b17' : '#00e5ff', marginTop: '2px' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders for selected date */}
      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
        Монтаж на {selectedDate} ({ordersForDate.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ordersForDate.length === 0 ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#64748b' }}>
            На выбранную дату выездов нет
          </div>
        ) : (
          ordersForDate.map(order => {
            const conf = STATUS_CONFIG[order.status] || { color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '⚙️' };
            return (
              <div
                key={order.id}
                style={{
                  background: 'rgba(13, 21, 39, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#00e5ff' }}>
                    ⏰ {order.time || '10:00'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: conf.color, background: conf.bg, padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                    {conf.icon} {order.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {order.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>
                  👤 {order.client} • 📍 {order.location}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {order.phone && (
                    <a
                      href={`tel:${order.phone.replace(/[^\d+]/g, '')}`}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={13} color="#10b981" />
                      <span>Звонок</span>
                    </a>
                  )}

                  {order.location && (
                    <button
                      onClick={() => handleOpen2GIS(order.location)}
                      style={{
                        flex: 1,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Navigation size={13} color="#38bdf8" />
                      <span>2GIS</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectOrder(order)}
                    style={{
                      flex: 1.4,
                      background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px',
                      color: '#060b17',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Открыть наряд
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}