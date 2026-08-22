import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DealCardModal from './DealCardModal';
import LeadCreateModal from './LeadCreateModal';
import AnimatedBackground from './AnimatedBackground';
import '../index.css';

/* ═══════════════════════════════════════════════════════════════
   QAZGOST AI — CRM КАЛЕНДАРЬ
   Уникальная CRM-система с видами: Месяц / Неделя / День
   Drag-and-drop заявок между датами, стекломорфизм-дизайн
   ═══════════════════════════════════════════════════════════════ */

const STATUS_COLORS = {
  'Новые':    { bg: 'rgba(139,92,246,0.2)',  border: '#8b5cf6', dot: '#8b5cf6',  text: '#c4b5fd' },
  'В работе': { bg: 'rgba(59,130,246,0.2)',  border: '#3b82f6', dot: '#3b82f6',  text: '#93c5fd' },
  'Дожим':    { bg: 'rgba(245,158,11,0.2)',  border: '#f59e0b', dot: '#f59e0b',  text: '#fcd34d' },
  'Успешно':  { bg: 'rgba(34,197,94,0.2)',   border: '#22c55e', dot: '#22c55e',  text: '#86efac' },
  'Отказ':    { bg: 'rgba(239,68,68,0.2)',   border: '#ef4444', dot: '#ef4444',  text: '#fca5a5' },
};

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const DAYS_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

const DEFAULT_CRM_DEALS = {
  "2026-08-12": [
    { id: '1084', title: 'Оценка монолитного фундамента', status: 'Новые', type: 'request', time: '09:00', phone: '+7 (701) 555-12-34', contractor: 'ИП "Астана-Строй"', location: 'г. Астана', budget: '1 250 000 ₸' },
  ],
  "2026-08-14": [
    { id: '1085', title: 'ПСД: 5-этажный монолитный блок', status: 'В работе', type: 'active_project', time: '10:00', phone: '+7 (777) 888-99-00', contractor: 'ТОО "GostBuild"', location: 'г. Алматы', budget: '3 450 000 ₸' },
    { id: '1086', title: 'Монтаж HVAC 2-этаж', status: 'Дожим', type: 'work_stage', time: '14:00', phone: '+7 (705) 111-22-33', contractor: 'ИП "Инженер-Сервис"', location: 'г. Шымкент', budget: '850 000 ₸' },
  ],
  "2026-08-18": [
    { id: '1087', title: 'Экспертиза несущих конструкций', status: 'В работе', type: 'request_engineering', time: '11:00', phone: '+7 (702) 444-55-66', contractor: 'ООО "ТехЭксперт"', location: 'г. Караганда', budget: '450 000 ₸' },
  ],
  "2026-08-20": [
    { id: '1088', title: 'Проверка смет и актов ВВР', status: 'Дожим', type: 'request', time: '09:30', phone: '+7 (701) 888-00-11', contractor: 'ТОО "ФинансКонсалт"', location: 'г. Астана', budget: '2 100 000 ₸' },
    { id: '1089', title: 'Эскроу-транш 2-го этапа', status: 'Дожим', type: 'active_project', time: '15:00', phone: '+7 (775) 333-22-11', contractor: 'Банк ЦентрКредит', location: 'г. Алматы', budget: '5 000 000 ₸' },
  ],
  "2026-08-22": [
    { id: '1090', title: 'Аренда 3 экскаваторов CAT 320', status: 'Успешно', type: 'request_construction', time: '08:00', phone: '+7 (708) 999-00-11', contractor: 'ТОО "СпецТехКЗ"', location: 'г. Актобе', budget: '1 800 000 ₸' },
    { id: '1091', title: 'Ремонт кровли ТЦ "МегаМаркет"', status: 'Новые', type: 'request', time: '13:00', phone: '+7 (7172) 55-44-33', contractor: 'ТОО "МегаМаркет"', location: 'г. Астана', budget: '6 700 000 ₸' },
  ],
  "2026-08-25": [
    { id: '1092', title: 'Монтаж забора и ворот', status: 'Новые', type: 'request_construction', time: '10:00', phone: '+7 (700) 123-45-67', contractor: 'Марат С.', location: 'г. Караганда', budget: '1 850 000 ₸' },
  ],
  "2026-08-28": [
    { id: '1093', title: 'Утепление фасада 5-этажки', status: 'В работе', type: 'active_project', time: '09:00', phone: '+7 (771) 900-88-77', contractor: 'КСК "Ботанический"', location: 'г. Астана', budget: '8 900 000 ₸' },
  ],
};

// ─── Утилиты ───
function getMonday(d) { const dt = new Date(d); const day = dt.getDay(); const diff = (day === 0 ? -6 : 1) - day; dt.setDate(dt.getDate() + diff); return dt; }
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isToday(dateStr) { return dateStr === fmtDate(new Date()); }
function parseBudget(s) { if (!s) return 0; return parseInt(s.replace(/[^\d]/g, ''), 10) || 0; }

export default function CrmPage({ onBackToHome, currentUser, sidebarToggleNode }) {
  const [events, setEvents] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState(null);

  // ─── localStorage ───
  useEffect(() => {
    const saved = localStorage.getItem('qazgost_crm_calendar');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = Object.values(parsed).reduce((a,b) => a + (b?.length || 0), 0);
        setEvents(count >= 3 ? parsed : { ...DEFAULT_CRM_DEALS, ...parsed });
      } catch { setEvents(DEFAULT_CRM_DEALS); }
    } else {
      setEvents(DEFAULT_CRM_DEALS);
    }
  }, []);

  const saveEvents = useCallback((newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('qazgost_crm_calendar', JSON.stringify(newEvents));
  }, []);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  // ─── Все карточки (с фильтрами) ───
  const allCards = useMemo(() => {
    const cards = [];
    Object.entries(events).forEach(([date, list]) => {
      (list || []).forEach(evt => cards.push({ ...evt, date }));
    });
    return cards.filter(card => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(card.title?.toLowerCase().includes(q) || card.contractor?.toLowerCase().includes(q) || card.location?.toLowerCase().includes(q))) return false;
      }
      if (statusFilter !== 'all' && card.status !== statusFilter) return false;
      return true;
    });
  }, [events, searchQuery, statusFilter]);

  // ─── Статистика ───
  const stats = useMemo(() => {
    const s = { total: allCards.length, budget: 0, byStatus: {} };
    allCards.forEach(c => {
      s.budget += parseBudget(c.budget);
      s.byStatus[c.status] = (s.byStatus[c.status] || 0) + 1;
    });
    return s;
  }, [allCards]);

  // ─── Drag & Drop ───
  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = useCallback((e, targetDate) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const card = JSON.parse(e.dataTransfer.getData('application/json'));
      if (card.date === targetDate) return;
      const newEvents = { ...events };
      // Remove from old date
      if (newEvents[card.date]) {
        newEvents[card.date] = newEvents[card.date].filter(evt => evt.id !== card.id);
        if (newEvents[card.date].length === 0) delete newEvents[card.date];
      }
      // Add to new date
      if (!newEvents[targetDate]) newEvents[targetDate] = [];
      const { date: _, ...cardWithoutDate } = card;
      newEvents[targetDate].push(cardWithoutDate);
      saveEvents(newEvents);
      showToast(`📅 Заявка «${card.title}» перенесена на ${targetDate}`);
    } catch (err) { console.error(err); }
  }, [events, saveEvents]);

  const handleStatusChange = useCallback((cardId, cardDate, newStatus) => {
    const newEvents = { ...events };
    if (newEvents[cardDate]) {
      newEvents[cardDate] = newEvents[cardDate].map(evt => evt.id === cardId ? { ...evt, status: newStatus } : evt);
      saveEvents(newEvents);
      showToast(`✅ Статус изменён → ${newStatus}`);
    }
  }, [events, saveEvents]);

  // ─── Навигация ───
  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const handleSaveCard = (updatedCard) => {
    const date = updatedCard.date || fmtDate(new Date());
    const newEvents = { ...events };
    if (!newEvents[date]) newEvents[date] = [];
    const idx = newEvents[date].findIndex(e => e.id === updatedCard.id);
    if (idx >= 0) newEvents[date][idx] = { ...updatedCard, date: undefined };
    saveEvents(newEvents);
    setSelectedCard(null);
    showToast('💾 Карточка сохранена');
  };

  const handleNewLead = (leadPayload) => {
    const date = fmtDate(new Date());
    const newEvents = { ...events };
    if (!newEvents[date]) newEvents[date] = [];
    newEvents[date].push({
      id: Date.now().toString().slice(-5),
      title: leadPayload.title || 'Новая заявка',
      status: 'Новые',
      type: 'request',
      time: new Date().toLocaleTimeString().slice(0,5),
      phone: leadPayload.phone || '',
      contractor: leadPayload.contractor || 'Не указан',
      location: leadPayload.location || '',
      budget: leadPayload.budget || '0 ₸',
    });
    saveEvents(newEvents);
    setShowLeadModal(false);
    showToast('🎉 Новая заявка создана!');
  };

  // ═══════════════════════════
  // RENDER: Мини-карточка заявки
  // ═══════════════════════════
  const renderEventChip = (card, dateStr, compact = false) => {
    const sc = STATUS_COLORS[card.status] || STATUS_COLORS['Новые'];
    return (
      <div
        key={card.id}
        draggable
        onDragStart={e => handleDragStart(e, { ...card, date: dateStr })}
        onClick={(e) => { e.stopPropagation(); setSelectedCard({ ...card, date: dateStr, day: dateStr }); }}
        style={{
          background: sc.bg, border: `1px solid ${sc.border}40`, borderLeft: `3px solid ${sc.dot}`,
          borderRadius: '8px', padding: compact ? '3px 6px' : '6px 10px', cursor: 'grab',
          marginBottom: '4px', transition: 'all 0.2s', fontSize: compact ? '0.65rem' : '0.75rem',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 4px 16px ${sc.dot}40`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        title={`${card.title}\n${card.contractor}\n${card.budget}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {compact ? card.title.slice(0, 20) : card.title}
          </span>
        </div>
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', color: '#94a3b8', fontSize: '0.68rem' }}>
            <span>⏱ {card.time || '—'}</span>
            <span style={{ color: sc.text, fontWeight: 700 }}>{card.budget}</span>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════
  // RENDER: ВИД МЕСЯЦ
  // ═══════════════════════════
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    // Empty cells before month starts
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete last week
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {/* Day headers */}
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px', fontWeight: 800, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {d}
          </div>
        ))}
        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} style={{ minHeight: '100px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }} />;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents = (events[dateStr] || []).filter(c => {
            if (statusFilter !== 'all' && c.status !== statusFilter) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              if (!(c.title?.toLowerCase().includes(q) || c.contractor?.toLowerCase().includes(q))) return false;
            }
            return true;
          });
          const today = isToday(dateStr);
          const isOver = dragOverDate === dateStr;
          return (
            <div
              key={dateStr}
              onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => handleDrop(e, dateStr)}
              onClick={() => { setCurrentDate(new Date(year, month, day)); setView('day'); }}
              style={{
                minHeight: '110px', padding: '6px', borderRadius: '10px', cursor: 'pointer',
                background: today ? 'rgba(0,229,255,0.08)' : isOver ? 'rgba(245,158,11,0.12)' : 'rgba(15,23,42,0.5)',
                border: today ? '2px solid rgba(0,229,255,0.5)' : isOver ? '2px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{
                  fontWeight: 800, fontSize: today ? '1rem' : '0.85rem',
                  color: today ? '#00e5ff' : '#e2e8f0',
                  background: today ? 'rgba(0,229,255,0.2)' : 'transparent',
                  borderRadius: '50%', width: today ? '28px' : 'auto', height: today ? '28px' : 'auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,229,255,0.2)', color: '#00e5ff', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div style={{ overflow: 'hidden', maxHeight: '80px' }}>
                {dayEvents.slice(0, 3).map(evt => renderEventChip(evt, dateStr, true))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.6rem', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                    +{dayEvents.length - 3} ещё
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════
  // RENDER: ВИД НЕДЕЛЯ
  // ═══════════════════════════
  const renderWeekView = () => {
    const monday = getMonday(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '1px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {/* Header row */}
        <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }} />
        {days.map(d => {
          const dateStr = fmtDate(d);
          const today = isToday(dateStr);
          return (
            <div key={dateStr} style={{
              textAlign: 'center', padding: '10px 4px', borderRadius: '8px',
              background: today ? 'rgba(0,229,255,0.1)' : 'rgba(15,23,42,0.6)',
              border: today ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {DAYS_RU[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: today ? '#00e5ff' : '#e2e8f0' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
        {/* Time rows */}
        {hours.map(h => (
          <React.Fragment key={h}>
            <div style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map(d => {
              const dateStr = fmtDate(d);
              const dayEvents = (events[dateStr] || []).filter(evt => {
                const evtHour = parseInt(evt.time?.split(':')[0], 10);
                return evtHour === h;
              });
              const isOver = dragOverDate === `${dateStr}-${h}`;
              return (
                <div
                  key={`${dateStr}-${h}`}
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr)}
                  style={{
                    minHeight: '48px', padding: '2px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isOver ? 'rgba(245,158,11,0.1)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {dayEvents.map(evt => renderEventChip(evt, dateStr, false))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ═══════════════════════════
  // RENDER: ВИД ДЕНЬ
  // ═══════════════════════════
  const renderDayView = () => {
    const dateStr = fmtDate(currentDate);
    const dayEvents = (events[dateStr] || []).filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(c.title?.toLowerCase().includes(q) || c.contractor?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 - 21:00
    const dow = currentDate.getDay();

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f1f5f9' }}>
            {DAYS_FULL[dow === 0 ? 6 : dow - 1]}, {currentDate.getDate()} {MONTHS_RU[currentDate.getMonth()]}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
            {dayEvents.length} заявок на этот день • {dayEvents.reduce((a, c) => a + parseBudget(c.budget), 0).toLocaleString('ru-RU')} ₸
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '1px', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          {hours.map(h => {
            const hourEvents = dayEvents.filter(evt => parseInt(evt.time?.split(':')[0], 10) === h);
            return (
              <React.Fragment key={h}>
                <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#64748b', fontWeight: 700, textAlign: 'right', borderRight: '2px solid rgba(0,229,255,0.15)' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr)}
                  style={{
                    minHeight: '56px', padding: '4px 8px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: dragOverDate === `${dateStr}-${h}` ? 'rgba(0,229,255,0.06)' : 'transparent',
                  }}
                >
                  {hourEvents.map(evt => {
                    const sc = STATUS_COLORS[evt.status] || STATUS_COLORS['Новые'];
                    return (
                      <div
                        key={evt.id}
                        draggable
                        onDragStart={e => handleDragStart(e, { ...evt, date: dateStr })}
                        onClick={() => setSelectedCard({ ...evt, date: dateStr, day: dateStr })}
                        style={{
                          display: 'flex', gap: '12px', padding: '12px 16px', marginBottom: '6px',
                          background: sc.bg, border: `1px solid ${sc.border}50`,
                          borderLeft: `4px solid ${sc.dot}`, borderRadius: '12px',
                          cursor: 'grab', transition: 'all 0.2s',
                          backdropFilter: 'blur(12px)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 24px ${sc.dot}30`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9', marginBottom: '4px' }}>{evt.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            🏢 {evt.contractor} • 📍 {evt.location}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                            📞 {evt.phone || evt.time}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffd700' }}>{evt.budget}</div>
                          <div style={{
                            marginTop: '6px', padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, display: 'inline-block'
                          }}>
                            {evt.status}
                          </div>
                          {/* Quick status change */}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                            {['Новые', 'В работе', 'Дожим', 'Успешно'].filter(s => s !== evt.status).slice(0, 2).map(s => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(evt.id, dateStr, s); }}
                                style={{
                                  fontSize: '0.62rem', padding: '2px 6px', borderRadius: '6px',
                                  background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}50`,
                                  color: STATUS_COLORS[s].text, cursor: 'pointer', fontWeight: 700,
                                }}
                              >
                                → {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════
  const headerLabel = view === 'month'
    ? `${MONTHS_RU[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'week'
    ? (() => { const m = getMonday(currentDate); const s = new Date(m); s.setDate(s.getDate() + 6); return `${m.getDate()} – ${s.getDate()} ${MONTHS_RU[s.getMonth()]} ${s.getFullYear()}`; })()
    : `${currentDate.getDate()} ${MONTHS_RU[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '0' }}>
      <AnimatedBackground />
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10002,
          background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)',
          backdropFilter: 'blur(20px)', borderRadius: '12px', padding: '14px 24px',
          color: '#00e5ff', fontWeight: 700, fontSize: '0.9rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px',
        background: 'rgba(10,22,40,0.85)', borderBottom: '1px solid rgba(0,229,255,0.15)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
        flexWrap: 'wrap',
      }}>
        {/* Left: Back + Title */}
        <button onClick={onBackToHome} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#94a3b8', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
          fontWeight: 700, fontSize: '0.85rem',
        }}>← На сайт</button>

        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 CRM КАЛЕНДАРЬ
        </h1>

        {/* KPI badges */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <div style={{ padding: '5px 12px', borderRadius: '10px', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', fontSize: '0.78rem', fontWeight: 800 }}>
            📊 {stats.total} заявок
          </div>
          <div style={{ padding: '5px 12px', borderRadius: '10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700', fontSize: '0.78rem', fontWeight: 800 }}>
            💰 {stats.budget.toLocaleString('ru-RU')} ₸
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem' }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', padding: '8px 12px 8px 32px', color: '#e2e8f0',
              fontSize: '0.85rem', width: '200px', outline: 'none',
            }}
          />
        </div>

        {/* New Lead */}
        <button onClick={() => setShowLeadModal(true)} style={{
          background: 'linear-gradient(135deg, #00e5ff, #0284c7)', border: 'none',
          borderRadius: '10px', padding: '8px 18px', color: '#fff', fontWeight: 800,
          fontSize: '0.85rem', cursor: 'pointer',
        }}>
          ➕ Новая заявка
        </button>
      </div>

      {/* ═══ NAVIGATION BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px',
        background: 'rgba(10,22,40,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)', flexWrap: 'wrap',
      }}>
        {/* View switcher */}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '3px' }}>
          {[
            { key: 'day', label: 'День' },
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem',
                background: view === v.key ? 'rgba(0,229,255,0.2)' : 'transparent',
                color: view === v.key ? '#00e5ff' : '#64748b',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: '1.1rem' }}>‹</button>
        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#f1f5f9', minWidth: '200px', textAlign: 'center' }}>
          {headerLabel}
        </span>
        <button onClick={() => navigate(1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: '1.1rem' }}>›</button>

        <button onClick={() => setCurrentDate(new Date())} style={{
          padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(0,229,255,0.3)',
          background: 'rgba(0,229,255,0.08)', color: '#00e5ff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
        }}>
          Сегодня
        </button>

        <div style={{ flex: 1 }} />

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('all')} style={{
            padding: '4px 12px', borderRadius: '8px', border: statusFilter === 'all' ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
            background: statusFilter === 'all' ? 'rgba(0,229,255,0.15)' : 'transparent',
            color: statusFilter === 'all' ? '#00e5ff' : '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
          }}>Все</button>
          {Object.keys(STATUS_COLORS).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '4px 12px', borderRadius: '8px',
              border: statusFilter === s ? `1px solid ${STATUS_COLORS[s].border}` : '1px solid rgba(255,255,255,0.1)',
              background: statusFilter === s ? STATUS_COLORS[s].bg : 'transparent',
              color: statusFilter === s ? STATUS_COLORS[s].text : '#64748b',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CALENDAR CONTENT ═══ */}
      <div style={{ padding: '16px 24px', position: 'relative', zIndex: 1 }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* ═══ STATUS LEGEND (bottom) ═══ */}
      <div style={{
        display: 'flex', gap: '16px', padding: '12px 24px', justifyContent: 'center',
        background: 'rgba(10,22,40,0.6)', borderTop: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}>
        {Object.entries(STATUS_COLORS).map(([status, sc]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sc.dot }} />
            <span>{status}</span>
            <span style={{ color: sc.text, fontWeight: 800 }}>{stats.byStatus[status] || 0}</span>
          </div>
        ))}
      </div>

      {/* ═══ MODALS ═══ */}
      {selectedCard && (
        <DealCardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
        />
      )}
      {showLeadModal && (
        <LeadCreateModal
          onClose={() => setShowLeadModal(false)}
          onSave={handleNewLead}
        />
      )}
    </div>
  );
}
