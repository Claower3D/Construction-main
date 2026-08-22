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
  const [leadModalDefaults, setLeadModalDefaults] = useState({ date: '', time: '' });
  const [view, setView] = useState('week'); // Default to week view for best overview
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

  // Слушаем обновления из UserOrdersPage (автогенерация графика)
  useEffect(() => {
    const handleCalendarUpdate = () => {
      try {
        const saved = localStorage.getItem('qazgost_crm_calendar');
        if (saved) setEvents(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('crm_calendar_updated', handleCalendarUpdate);
    return () => window.removeEventListener('crm_calendar_updated', handleCalendarUpdate);
  }, []);

  const saveEvents = useCallback((newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('qazgost_crm_calendar', JSON.stringify(newEvents));
  }, []);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  const openCreateModalForSlot = (dateStr, timeStr = '') => {
    setLeadModalDefaults({ date: dateStr, time: timeStr });
    setShowLeadModal(true);
  };

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

  const handleDrop = useCallback((e, targetDate, targetTime = '') => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const card = JSON.parse(e.dataTransfer.getData('application/json'));
      const newEvents = { ...events };
      // Remove from old date
      if (newEvents[card.date]) {
        newEvents[card.date] = newEvents[card.date].filter(evt => evt.id !== card.id);
        if (newEvents[card.date].length === 0) delete newEvents[card.date];
      }
      // Add to new date
      if (!newEvents[targetDate]) newEvents[targetDate] = [];
      const { date: _, ...cardWithoutDate } = card;
      if (targetTime) cardWithoutDate.time = targetTime;
      newEvents[targetDate].push(cardWithoutDate);
      saveEvents(newEvents);
      showToast(`📅 Заявка «${card.title}» перенесена на ${targetDate} ${targetTime}`);
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
    const date = leadPayload.date || leadModalDefaults.date || fmtDate(currentDate);
    const time = leadPayload.time || leadModalDefaults.time || new Date().toLocaleTimeString().slice(0,5);
    const newEvents = { ...events };
    if (!newEvents[date]) newEvents[date] = [];
    newEvents[date].push({
      id: Date.now().toString().slice(-5),
      title: leadPayload.clientName ? `Заявка: ${leadPayload.clientName}` : (leadPayload.title || 'Новая заявка'),
      status: 'Новые',
      type: 'request',
      time: time,
      phone: leadPayload.phone || '',
      contractor: leadPayload.clientName || leadPayload.contractor || 'Не указан',
      location: leadPayload.address || leadPayload.location || '',
      budget: leadPayload.budget || '1 500 000 ₸',
    });
    saveEvents(newEvents);
    setShowLeadModal(false);
    setLeadModalDefaults({ date: '', time: '' });
    showToast('🎉 Новая заявка создана!');
  };

  const isEventVisible = useCallback((evt) => {
    if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = evt.title?.toLowerCase().includes(q);
      const contractorMatch = evt.contractor?.toLowerCase().includes(q);
      const locationMatch = evt.location?.toLowerCase().includes(q);
      const phoneMatch = evt.phone?.toLowerCase().includes(q);
      if (!titleMatch && !contractorMatch && !locationMatch && !phoneMatch) return false;
    }
    return true;
  }, [statusFilter, searchQuery]);

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
          background: sc.bg, border: `1px solid ${sc.border}60`, borderLeft: `3px solid ${sc.dot}`,
          borderRadius: '5px', padding: compact ? '1px 3px' : '3px 6px', cursor: 'grab',
          marginBottom: '2px', transition: 'all 0.15s', fontSize: compact ? '0.6rem' : '0.68rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 4px 10px ${sc.dot}50`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'; }}
        title={`📌 ${card.title}\n🏢 ${card.contractor}\n📍 ${card.location || 'Не указано'}\n📞 ${card.phone || 'Без телефона'}\n💰 ${card.budget}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.dot, flexShrink: 0, boxShadow: `0 0 4px ${sc.dot}` }} />
            <span style={{ fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {compact ? card.title.slice(0, 16) : card.title}
            </span>
          </div>
          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#ffd700', flexShrink: 0 }}>{card.budget}</span>
        </div>
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px', color: '#94a3b8', fontSize: '0.62rem' }}>
            <span>⏱ {card.time || '—'}</span>
            <span style={{ color: sc.text, fontWeight: 700 }}>{card.status}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {/* Day headers */}
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '4px 2px', fontWeight: 900, fontSize: '0.7rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {d}
          </div>
        ))}
        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} style={{ minHeight: '68px', background: 'rgba(10, 16, 30, 0.75)', borderRadius: '6px', border: '1px dashed rgba(255, 255, 255, 0.06)' }} />;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents = (events[dateStr] || []).filter(isEventVisible);
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
                minHeight: '70px', padding: '4px', borderRadius: '8px', cursor: 'pointer',
                background: today ? 'rgba(0, 229, 255, 0.18)' : isOver ? 'rgba(245, 158, 11, 0.22)' : 'rgba(18, 27, 48, 0.94)',
                border: today ? '2px solid #00e5ff' : isOver ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: today ? '0 0 12px rgba(0, 229, 255, 0.3)' : '0 2px 6px rgba(0,0,0,0.4)',
                transition: 'all 0.15s', position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{
                  fontWeight: 900, fontSize: today ? '0.82rem' : '0.76rem',
                  color: today ? '#00e5ff' : '#ffffff',
                  background: today ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '4px', padding: '0px 5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {day}
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreateModalForSlot(dateStr); }}
                    style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', color: '#00e5ff', borderRadius: '3px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900 }}
                    title="Создать заявку на этот день"
                  >+</button>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '0.6rem', background: 'rgba(0,229,255,0.25)', border: '1px solid rgba(0,229,255,0.5)', color: '#00e5ff', padding: '0px 4px', borderRadius: '6px', fontWeight: 800 }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ overflow: 'hidden', maxHeight: '48px' }}>
                {dayEvents.slice(0, 2).map(evt => renderEventChip(evt, dateStr, true))}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: '0.58rem', color: '#94a3b8', textAlign: 'center', marginTop: '1px', fontWeight: 700 }}>
                    +{dayEvents.length - 2} ещё
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
  // RENDER: ВИД НЕДЕЛЯ (Ultra-Compact)
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
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '1px', overflowY: 'auto', maxHeight: 'calc(100vh - 135px)', background: 'rgba(10, 16, 30, 0.8)', padding: '3px', borderRadius: '10px' }}>
        {/* STICKY HEADER ROW */}
        <div style={{ padding: '4px', background: 'rgba(18, 27, 48, 0.98)', borderRadius: '5px', position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(12px)' }} />
        {days.map(d => {
          const dateStr = fmtDate(d);
          const today = isToday(dateStr);
          return (
            <div key={dateStr} style={{
              textAlign: 'center', padding: '3px 2px', borderRadius: '6px',
              background: today ? 'rgba(0, 229, 255, 0.25)' : 'rgba(18, 27, 48, 0.98)',
              border: today ? '1.5px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.14)',
              position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(12px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: '0.65rem', color: today ? '#00e5ff' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                {DAYS_RU[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: today ? '#00e5ff' : '#ffffff' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
        {/* Time rows */}
        {hours.map(h => (
          <React.Fragment key={h}>
            <div style={{ padding: '2px 4px', fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'rgba(10, 16, 30, 0.95)', borderRadius: '3px' }}>
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map(d => {
              const dateStr = fmtDate(d);
              const timeStr = `${String(h).padStart(2, '0')}:00`;
              const dayEvents = (events[dateStr] || []).filter(evt => {
                const evtHour = parseInt(evt.time?.split(':')[0], 10);
                return evtHour === h && isEventVisible(evt);
              });
              const isOver = dragOverDate === `${dateStr}-${h}`;
              return (
                <div
                  key={`${dateStr}-${h}`}
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr, timeStr)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      openCreateModalForSlot(dateStr, timeStr);
                    }
                  }}
                  style={{
                    minHeight: '28px', padding: '1px 2px', borderRadius: '5px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: isOver ? 'rgba(245,158,11,0.25)' : 'rgba(15, 22, 40, 0.92)',
                    transition: 'background 0.15s', cursor: 'pointer',
                  }}
                  title="Кликните для создания заявки"
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
    const dayEvents = (events[dateStr] || []).filter(isEventVisible);
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 - 21:00
    const dow = currentDate.getDay();

    return (
      <div style={{ background: 'rgba(10, 16, 30, 0.85)', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
            {DAYS_FULL[dow === 0 ? 6 : dow - 1]}, {currentDate.getDate()} {MONTHS_RU[currentDate.getMonth()]}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#00e5ff', marginTop: '1px', fontWeight: 800 }}>
            {dayEvents.length} заявок на этот день • {dayEvents.reduce((a, c) => a + parseBudget(c.budget), 0).toLocaleString('ru-RU')} ₸
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '2px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          {hours.map(h => {
            const timeStr = `${String(h).padStart(2, '0')}:00`;
            const hourEvents = dayEvents.filter(evt => parseInt(evt.time?.split(':')[0], 10) === h);
            return (
              <React.Fragment key={h}>
                <div style={{ padding: '4px 6px', fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 800, textAlign: 'right', background: 'rgba(15, 22, 40, 0.95)', borderRadius: '4px', borderRight: '2px solid rgba(0,229,255,0.3)' }}>
                  {timeStr}
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr, timeStr)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      openCreateModalForSlot(dateStr, timeStr);
                    }
                  }}
                  style={{
                    minHeight: '34px', padding: '2px 4px', borderRadius: '5px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: dragOverDate === `${dateStr}-${h}` ? 'rgba(0,229,255,0.12)' : 'rgba(15, 22, 40, 0.92)',
                    cursor: 'pointer',
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
                          display: 'flex', gap: '8px', padding: '6px 10px', marginBottom: '4px',
                          background: 'rgba(20, 30, 55, 0.95)', border: `1.5px solid ${sc.border}`,
                          borderLeft: `4px solid ${sc.dot}`, borderRadius: '8px',
                          cursor: 'grab', transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 14px ${sc.dot}40`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#ffffff', marginBottom: '1px' }}>{evt.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                            🏢 {evt.contractor} • 📍 {evt.location}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>
                            📞 {evt.phone || evt.time}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ffd700' }}>{evt.budget}</div>
                          <div style={{
                            marginTop: '2px', padding: '1px 6px', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 800,
                            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, display: 'inline-block'
                          }}>
                            {evt.status}
                          </div>
                          {/* Quick status change */}
                          <div style={{ display: 'flex', gap: '2px', marginTop: '2px', justifyContent: 'flex-end' }}>
                            {['Новые', 'В работе', 'Дожим', 'Успешно'].filter(s => s !== evt.status).slice(0, 2).map(s => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(evt.id, dateStr, s); }}
                                style={{
                                  fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px',
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
          position: 'fixed', top: '12px', right: '12px', zIndex: 10002,
          background: 'rgba(0,229,255,0.2)', border: '1px solid rgba(0,229,255,0.5)',
          backdropFilter: 'blur(20px)', borderRadius: '8px', padding: '8px 14px',
          color: '#00e5ff', fontWeight: 800, fontSize: '0.8rem',
          boxShadow: '0 8px 24px rgba(0,229,255,0.3)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ UNIFIED HIGH-EFFICIENCY TOP BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px',
        background: 'rgba(10, 16, 32, 0.98)', borderBottom: '1px solid rgba(0,229,255,0.25)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button onClick={onBackToHome} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
          fontWeight: 800, fontSize: '0.76rem', flexShrink: 0
        }}>← На сайт</button>

        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📅 CRM КАЛЕНДАРЬ
        </h1>

        <div style={{ flex: 1 }} />

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '2px' }}>
          {[
            { key: 'day', label: 'День' },
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '3px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '0.76rem',
                background: view === v.key ? 'linear-gradient(135deg, #00e5ff, #0284c7)' : 'transparent',
                color: view === v.key ? '#ffffff' : '#94a3b8',
                boxShadow: view === v.key ? '0 2px 6px rgba(0,229,255,0.4)' : 'none',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Date Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '5px', padding: '2px 6px', color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem' }}>‹</button>
          <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#ffffff', minWidth: '160px', textAlign: 'center' }}>
            {headerLabel}
          </span>
          <button onClick={() => navigate(1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '5px', padding: '2px 6px', color: '#ffffff', cursor: 'pointer', fontWeight: 900, fontSize: '0.9rem' }}>›</button>

          <button onClick={() => setCurrentDate(new Date())} style={{
            padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(0,229,255,0.4)',
            background: 'rgba(0,229,255,0.12)', color: '#00e5ff', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
          }}>
            Сегодня
          </button>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE (LEFT SIDEBAR + CALENDAR GRID) ═══ */}
      <div style={{
        display: 'flex',
        gap: '12px',
        maxWidth: '1280px',
        margin: '10px auto',
        padding: '0 12px',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* ─── LEFT SIDEBAR PANEL ─── */}
        <div style={{
          width: '230px',
          flexShrink: 0,
          background: 'rgba(12, 18, 36, 0.95)',
          border: '1.5px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '14px',
          padding: '12px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Action: Create Lead */}
          <button
            onClick={() => openCreateModalForSlot(fmtDate(currentDate))}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #00e5ff, #0284c7)',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 12px',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 229, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>➕</span> Создать заявку
          </button>

          {/* Search Input */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔍 Поиск заявки
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '6px',
                  padding: '5px 8px 5px 26px',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  outline: 'none',
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          {/* KPI Summary Widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={{ padding: '6px', background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 800 }}>ВСЕГО</div>
              <div style={{ fontSize: '1rem', color: '#00e5ff', fontWeight: 900 }}>{stats.total}</div>
            </div>
            <div style={{ padding: '6px', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 800 }}>БЮДЖЕТ</div>
              <div style={{ fontSize: '0.72rem', color: '#ffd700', fontWeight: 900, marginTop: '2px' }}>{stats.budget.toLocaleString('ru-RU')} ₸</div>
            </div>
          </div>

          {/* Status Filters Stack */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🏷️ Фильтр по статусам
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
                  border: statusFilter === 'all' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                  background: statusFilter === 'all' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)',
                  color: statusFilter === 'all' ? '#00e5ff' : '#94a3b8',
                }}
              >
                <span>Все заявки</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>({allCards.length})</span>
              </button>
              {Object.entries(STATUS_COLORS).map(([s, sc]) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
                    border: statusFilter === s ? `1px solid ${sc.border}` : '1px solid rgba(255,255,255,0.08)',
                    background: statusFilter === s ? sc.bg : 'rgba(255,255,255,0.03)',
                    color: statusFilter === s ? '#ffffff' : '#94a3b8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                    <span>{s}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: sc.text, fontWeight: 900 }}>{stats.byStatus[s] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT CALENDAR GRID CONTAINER ─── */}
        <div style={{
          flex: 1,
          minWidth: 0,
          background: 'rgba(12, 18, 36, 0.95)',
          border: '1.5px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '14px',
          padding: '8px 10px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 229, 255, 0.12)',
        }}>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      </div>

      {/* ═══ STATUS LEGEND (bottom) ═══ */}
      <div style={{
        display: 'flex', gap: '14px', padding: '6px 12px', justifyContent: 'center',
        background: 'rgba(10,16,32,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap', position: 'relative', zIndex: 10,
      }}>
        {Object.entries(STATUS_COLORS).map(([status, sc]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc.dot, boxShadow: `0 0 5px ${sc.dot}` }} />
            <span>{status}</span>
            <span style={{ color: '#00e5ff', fontWeight: 900, background: 'rgba(0,229,255,0.15)', padding: '1px 5px', borderRadius: '4px' }}>{stats.byStatus[status] || 0}</span>
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
          initialDate={leadModalDefaults.date}
          initialTime={leadModalDefaults.time}
          onClose={() => { setShowLeadModal(false); setLeadModalDefaults({ date: '', time: '' }); }}
          onSave={handleNewLead}
        />
      )}
    </div>
  );
}
