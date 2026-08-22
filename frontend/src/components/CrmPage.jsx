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
  'Новые':    { bg: 'rgba(139,92,246,0.4)',  border: '#a78bfa', dot: '#a78bfa',  text: '#ffffff' },
  'В работе': { bg: 'rgba(59,130,246,0.4)',  border: '#60a5fa', dot: '#60a5fa',  text: '#ffffff' },
  'Дожим':    { bg: 'rgba(245,158,11,0.4)',  border: '#fbbf24', dot: '#fbbf24',  text: '#ffffff' },
  'Успешно':  { bg: 'rgba(34,197,94,0.4)',   border: '#4ade80', dot: '#4ade80',  text: '#ffffff' },
  'Отказ':    { bg: 'rgba(239,68,68,0.4)',   border: '#f87171', dot: '#f87171',  text: '#ffffff' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {/* Day headers */}
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '10px 4px', fontWeight: 900, fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {d}
          </div>
        ))}
        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} style={{ minHeight: '110px', background: 'rgba(10, 16, 30, 0.75)', borderRadius: '10px', border: '1px dashed rgba(255, 255, 255, 0.06)' }} />;
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
                minHeight: '115px', padding: '8px', borderRadius: '12px', cursor: 'pointer',
                background: today ? 'rgba(0, 229, 255, 0.18)' : isOver ? 'rgba(245, 158, 11, 0.22)' : 'rgba(18, 27, 48, 0.94)',
                border: today ? '2px solid #00e5ff' : isOver ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: today ? '0 0 20px rgba(0, 229, 255, 0.3)' : '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.2s',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontWeight: 900, fontSize: today ? '1rem' : '0.88rem',
                  color: today ? '#00e5ff' : '#ffffff',
                  background: today ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '2px 8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span style={{ fontSize: '0.68rem', background: 'rgba(0,229,255,0.25)', border: '1px solid rgba(0,229,255,0.5)', color: '#00e5ff', padding: '1px 7px', borderRadius: '10px', fontWeight: 800 }}>
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div style={{ overflow: 'hidden', maxHeight: '82px' }}>
                {dayEvents.slice(0, 3).map(evt => renderEventChip(evt, dateStr, true))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', marginTop: '2px', fontWeight: 700 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: '2px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', background: 'rgba(10, 16, 30, 0.8)', padding: '6px', borderRadius: '14px' }}>
        {/* Header row */}
        <div style={{ padding: '8px', background: 'rgba(18, 27, 48, 0.95)', borderRadius: '8px' }} />
        {days.map(d => {
          const dateStr = fmtDate(d);
          const today = isToday(dateStr);
          return (
            <div key={dateStr} style={{
              textAlign: 'center', padding: '12px 6px', borderRadius: '10px',
              background: today ? 'rgba(0, 229, 255, 0.2)' : 'rgba(18, 27, 48, 0.95)',
              border: today ? '2px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.14)',
            }}>
              <div style={{ fontSize: '0.75rem', color: today ? '#00e5ff' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                {DAYS_RU[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: today ? '#00e5ff' : '#ffffff' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
        {/* Time rows */}
        {hours.map(h => (
          <React.Fragment key={h}>
            <div style={{ padding: '8px 10px', fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 800, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', background: 'rgba(10, 16, 30, 0.95)', borderRadius: '6px' }}>
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
                    minHeight: '52px', padding: '4px', borderRadius: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: isOver ? 'rgba(245,158,11,0.2)' : 'rgba(15, 22, 40, 0.92)',
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
      <div style={{ background: 'rgba(10, 16, 30, 0.85)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>
            {DAYS_FULL[dow === 0 ? 6 : dow - 1]}, {currentDate.getDate()} {MONTHS_RU[currentDate.getMonth()]}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#00e5ff', marginTop: '4px', fontWeight: 800 }}>
            {dayEvents.length} заявок на этот день • {dayEvents.reduce((a, c) => a + parseBudget(c.budget), 0).toLocaleString('ru-RU')} ₸
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          {hours.map(h => {
            const hourEvents = dayEvents.filter(evt => parseInt(evt.time?.split(':')[0], 10) === h);
            return (
              <React.Fragment key={h}>
                <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 800, textAlign: 'right', background: 'rgba(15, 22, 40, 0.95)', borderRadius: '8px', borderRight: '2px solid rgba(0,229,255,0.3)' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr)}
                  style={{
                    minHeight: '60px', padding: '6px 10px', borderRadius: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: dragOverDate === `${dateStr}-${h}` ? 'rgba(0,229,255,0.12)' : 'rgba(15, 22, 40, 0.92)',
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
                          display: 'flex', gap: '12px', padding: '14px 18px', marginBottom: '8px',
                          background: 'rgba(20, 30, 55, 0.95)', border: `1.5px solid ${sc.border}`,
                          borderLeft: `5px solid ${sc.dot}`, borderRadius: '14px',
                          cursor: 'grab', transition: 'all 0.2s',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 30px ${sc.dot}40`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>{evt.title}</div>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                            🏢 {evt.contractor} • 📍 {evt.location}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                            📞 {evt.phone || evt.time}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffd700' }}>{evt.budget}</div>
                          <div style={{
                            marginTop: '6px', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, display: 'inline-block'
                          }}>
                            {evt.status}
                          </div>
                          {/* Quick status change */}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
                            {['Новые', 'В работе', 'Дожим', 'Успешно'].filter(s => s !== evt.status).slice(0, 2).map(s => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(evt.id, dateStr, s); }}
                                style={{
                                  fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px',
                                  background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}`,
                                  color: '#ffffff', cursor: 'pointer', fontWeight: 800,
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
    <div style={{ position: 'relative', minHeight: '100vh', padding: '0', background: '#070b16' }}>
      <AnimatedBackground />
      {/* Dimming backdrop overlay so background panorama is subtle and high-contrast */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6, 10, 22, 0.88)', zIndex: 0, pointerEvents: 'none' }} />

      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10002,
          background: 'rgba(0,229,255,0.2)', border: '1px solid rgba(0,229,255,0.5)',
          backdropFilter: 'blur(20px)', borderRadius: '12px', padding: '14px 24px',
          color: '#00e5ff', fontWeight: 800, fontSize: '0.92rem',
          boxShadow: '0 8px 30px rgba(0,229,255,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px',
        background: 'rgba(10, 16, 32, 0.98)', borderBottom: '1px solid rgba(0,229,255,0.25)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
        flexWrap: 'wrap',
      }}>
        {/* Left: Back + Title */}
        <button onClick={onBackToHome} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
          fontWeight: 800, fontSize: '0.88rem',
        }}>← На сайт</button>

        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 CRM КАЛЕНДАРЬ
        </h1>

        {/* KPI badges */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <div style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', color: '#00e5ff', fontSize: '0.82rem', fontWeight: 900 }}>
            📊 {stats.total} заявок
          </div>
          <div style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', color: '#ffd700', fontSize: '0.82rem', fontWeight: 900 }}>
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
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '10px', padding: '8px 12px 8px 32px', color: '#ffffff',
              fontSize: '0.88rem', width: '220px', outline: 'none', fontWeight: 600,
            }}
          />
        </div>

        {/* New Lead */}
        <button onClick={() => setShowLeadModal(true)} style={{
          background: 'linear-gradient(135deg, #00e5ff, #0284c7)', border: 'none',
          borderRadius: '10px', padding: '9px 20px', color: '#fff', fontWeight: 900,
          fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0, 229, 255, 0.4)',
        }}>
          ➕ Новая заявка
        </button>
      </div>

      {/* ═══ NAVIGATION BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px',
        background: 'rgba(13, 20, 38, 0.96)', borderBottom: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)', flexWrap: 'wrap', position: 'relative', zIndex: 10,
      }}>
        {/* View switcher */}
        <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px' }}>
          {[
            { key: 'day', label: 'День' },
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '0.84rem',
                background: view === v.key ? 'linear-gradient(135deg, #00e5ff, #0284c7)' : 'transparent',
                color: view === v.key ? '#ffffff' : '#94a3b8',
                boxShadow: view === v.key ? '0 2px 10px rgba(0,229,255,0.4)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '8px', padding: '6px 14px', color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem' }}>‹</button>
        <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#ffffff', minWidth: '220px', textAlign: 'center' }}>
          {headerLabel}
        </span>
        <button onClick={() => navigate(1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '8px', padding: '6px 14px', color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem' }}>›</button>

        <button onClick={() => setCurrentDate(new Date())} style={{
          padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(0,229,255,0.4)',
          background: 'rgba(0,229,255,0.12)', color: '#00e5ff', cursor: 'pointer', fontWeight: 800, fontSize: '0.84rem',
        }}>
          Сегодня
        </button>

        <div style={{ flex: 1 }} />

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('all')} style={{
            padding: '5px 14px', borderRadius: '8px', border: statusFilter === 'all' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.12)',
            background: statusFilter === 'all' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)',
            color: statusFilter === 'all' ? '#00e5ff' : '#94a3b8', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
          }}>Все</button>
          {Object.keys(STATUS_COLORS).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 14px', borderRadius: '8px',
              border: statusFilter === s ? `1px solid ${STATUS_COLORS[s].border}` : '1px solid rgba(255,255,255,0.12)',
              background: statusFilter === s ? STATUS_COLORS[s].bg : 'rgba(255,255,255,0.04)',
              color: statusFilter === s ? '#ffffff' : '#94a3b8',
              cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ CALENDAR CONTENT CONTAINER (Solid Glass Card) ═══ */}
      <div style={{
        margin: '20px 24px', padding: '24px', position: 'relative', zIndex: 1,
        background: 'rgba(12, 18, 36, 0.95)',
        border: '1.5px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 229, 255, 0.12)',
        backdropFilter: 'blur(24px)',
      }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* ═══ STATUS LEGEND (bottom) ═══ */}
      <div style={{
        display: 'flex', gap: '20px', padding: '14px 24px', justifyContent: 'center',
        background: 'rgba(10,16,32,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap', position: 'relative', zIndex: 10,
      }}>
        {Object.entries(STATUS_COLORS).map(([status, sc]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sc.dot, boxShadow: `0 0 8px ${sc.dot}` }} />
            <span>{status}</span>
            <span style={{ color: '#00e5ff', fontWeight: 900, background: 'rgba(0,229,255,0.15)', padding: '1px 7px', borderRadius: '6px' }}>{stats.byStatus[status] || 0}</span>
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
