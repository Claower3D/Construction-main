import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DealCardModal from './DealCardModal';
import LeadCreateModal from './LeadCreateModal';
import AnimatedBackground from './AnimatedBackground';
import '../index.css';

/* ═══════════════════════════════════════════════════════════════
   QAZGOST AI — CRM КАЛЕНДАРЬ (v2.5)
   Уникальная цветовая и ролевая дифференциация заявок:
   - 👷 ВЫЕЗД ИНЖЕНЕРА (Оранжево-янтарный неон)
   - 🔨 РАБОТЫ ИСПОЛНИТЕЛЯ (Цианово-изумрудный неон)
   - 📝 НОВЫЙ ЛИД / ЗАЯВКА (Фиолетово-пурпурный неон)
   - 🚜 СПЕЦТЕХНИКА GPS (Неоновый аквамарин)
   - ✅ СДАЧА И ДЕДЛАЙН (Изумрудно-зелёный)
   ═══════════════════════════════════════════════════════════════ */

const STATUS_COLORS = {
  'Новые':    { bg: 'rgba(139,92,246,0.25)', border: '#8b5cf6', dot: '#a78bfa', text: '#ffffff' },
  'В работе': { bg: 'rgba(59,130,246,0.25)',  border: '#3b82f6', dot: '#60a5fa', text: '#ffffff' },
  'Дожим':    { bg: 'rgba(245,158,11,0.25)',  border: '#f59e0b', dot: '#fbbf24', text: '#ffffff' },
  'Успешно':  { bg: 'rgba(34,197,94,0.25)',   border: '#22c55e', dot: '#4ade80', text: '#ffffff' },
  'Отказ':    { bg: 'rgba(239,68,68,0.25)',   border: '#ef4444', dot: '#f87171', text: '#ffffff' },
};

// Ролевые стили для мгновенного отличия заявок инженера, исполнителя и лидов
const ROLE_TYPE_CONFIG = {
  engineer: {
    badge: '👷 ИНЖЕНЕР',
    subBadge: '🚗 Выезд / ПТО',
    icon: '👷',
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(234, 88, 12, 0.18))',
    border: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    tagBg: 'rgba(245, 158, 11, 0.3)',
    tagText: '#fcd34d',
    barColor: '#f59e0b'
  },
  executor: {
    badge: '🔨 ИСПОЛНИТЕЛЬ',
    subBadge: '🏗️ Стройка',
    icon: '🔨',
    bg: 'linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(2, 132, 199, 0.15))',
    border: '#00e5ff',
    glow: 'rgba(0, 229, 255, 0.35)',
    tagBg: 'rgba(0, 229, 255, 0.25)',
    tagText: '#38bdf8',
    barColor: '#00e5ff'
  },
  lead: {
    badge: '📝 ЛИД',
    subBadge: '🆕 Заявка',
    icon: '📝',
    bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(99, 102, 241, 0.18))',
    border: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.35)',
    tagBg: 'rgba(139, 92, 246, 0.25)',
    tagText: '#c4b5fd',
    barColor: '#8b5cf6'
  },
  machinery: {
    badge: '🚜 ТЕХНИКА',
    subBadge: '📍 GPS Online',
    icon: '🚜',
    bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.16))',
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    tagBg: 'rgba(56, 189, 248, 0.25)',
    tagText: '#7dd3fc',
    barColor: '#38bdf8'
  },
  deadline: {
    badge: '✅ СДАЧА',
    subBadge: '🏁 Дедлайн',
    icon: '✅',
    bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.22), rgba(16, 185, 129, 0.18))',
    border: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.35)',
    tagBg: 'rgba(34, 197, 94, 0.25)',
    tagText: '#86efac',
    barColor: '#22c55e'
  }
};

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const DAYS_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

const DEFAULT_CRM_DEALS = {
  "2026-08-14": [
    { id: '1084', leadNum: '1', title: 'Оценка фундамента и замеры', status: 'Новые', type: 'request_engineering', role: 'engineer', time: '09:00', phone: '+7 (701) 555-12-34', contractor: 'ИП "Астана-Строй"', location: 'г. Астана', budget: '1 250 000 ₸' },
    { id: '1085', leadNum: '2', title: 'Монтаж 5-эт монолитного блока', status: 'В работе', type: 'work_stage', role: 'executor', time: '10:00', phone: '+7 (777) 888-99-00', contractor: 'ТОО "GostBuild"', location: 'г. Алматы', budget: '3 450 000 ₸' },
  ],
  "2026-08-18": [
    { id: '1087', leadNum: '3', title: 'Экспертиза несущих конструкций', status: 'В работе', type: 'request_engineering', role: 'engineer', time: '11:00', phone: '+7 (702) 444-55-66', contractor: 'ООО "ТехЭксперт"', location: 'г. Караганда', budget: '450 000 ₸' },
  ],
  "2026-08-20": [
    { id: '1088', leadNum: '4', title: 'Проверка смет и актов ВВР', status: 'Дожим', type: 'request_engineering', role: 'engineer', time: '09:30', phone: '+7 (701) 888-00-11', contractor: 'ТОО "ФинансКонсалт"', location: 'г. Астана', budget: '2 100 000 ₸' },
    { id: '1089', leadNum: '5', title: 'Эскроу-транш 2-го этапа', status: 'Дожим', type: 'work_stage', role: 'executor', time: '15:00', phone: '+7 (775) 333-22-11', contractor: 'Банк ЦентрКредит', location: 'г. Алматы', budget: '5 000 000 ₸' },
  ],
  "2026-08-22": [
    { id: '1090', leadNum: '6', title: 'Аренда 3 экскаваторов CAT 320', status: 'В работе', type: 'request_construction', role: 'machinery', time: '08:00', phone: '+7 (708) 999-00-11', contractor: 'ТОО "СпецТехКЗ"', location: 'г. Актобе', budget: '1 800 000 ₸' },
    { id: '1091', leadNum: '7', title: 'Ремонт кровли ТЦ "МегаМаркет"', status: 'Новые', type: 'request', role: 'lead', time: '13:00', phone: '+7 (7172) 55-44-33', contractor: 'ТОО "МегаМаркет"', location: 'г. Астана', budget: '6 700 000 ₸' },
  ],
  "2026-08-24": [
    { id: '1092', leadNum: '8', title: 'Выезд на объект: забор и ворота', status: 'Новые', type: 'request_engineering', role: 'engineer', time: '10:00', phone: '+7 (700) 123-45-67', contractor: 'Марат С.', location: 'г. Караганда', budget: '1 850 000 ₸' },
  ],
  "2026-08-28": [
    { id: '1093', leadNum: '9', title: 'Утепление фасада 5-этажки', status: 'В работе', type: 'work_stage', role: 'executor', time: '09:00', phone: '+7 (771) 900-88-77', contractor: 'КСК "Ботанический"', location: 'г. Астана', budget: '8 900 000 ₸' },
  ],
};

function getMonday(d) { const dt = new Date(d); const day = dt.getDay(); const diff = (day === 0 ? -6 : 1) - day; dt.setDate(dt.getDate() + diff); return dt; }
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isToday(dateStr) { return dateStr === fmtDate(new Date()); }
function parseBudget(s) { if (!s) return 0; return parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0; }

export default function CrmPage({ onBackToHome, currentUser, sidebarToggleNode }) {
  const [events, setEvents] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadModalDefaults, setLeadModalDefaults] = useState({ date: '', time: '' });
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'engineer' | 'executor' | 'lead'
  const [toastMsg, setToastMsg] = useState(null);

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

  // Определение типа карточки (Инженер, Исполнитель, Лид, Техника, Дедлайн)
  const getCardTypeKey = useCallback((card) => {
    if (!card) return 'lead';
    if (card.type === 'deadline' || (card.title && card.title.includes('СДАЧА'))) return 'deadline';
    if (card.type === 'request_construction' || (card.title && card.title.includes('Техника'))) return 'machinery';
    if (card.role === 'engineer' || card.type === 'request_engineering' || (card.title && (card.title.toLowerCase().includes('выезд') || card.title.toLowerCase().includes('экспертиз') || card.title.toLowerCase().includes('инженер') || card.title.toLowerCase().includes('смет')))) {
      return 'engineer';
    }
    if (card.role === 'executor' || card.type === 'work_stage' || card.type === 'active_project' || (card.title && (card.title.includes('НАЧАЛО') || card.title.toLowerCase().includes('монтаж') || card.title.toLowerCase().includes('строитель')))) {
      return 'executor';
    }
    return 'lead';
  }, []);

  const isEventVisible = useCallback((evt) => {
    if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
    if (roleFilter !== 'all') {
      const typeKey = getCardTypeKey(evt);
      if (typeKey !== roleFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = evt.title?.toLowerCase().includes(q);
      const contractorMatch = evt.contractor?.toLowerCase().includes(q);
      const locationMatch = evt.location?.toLowerCase().includes(q);
      const phoneMatch = evt.phone?.toLowerCase().includes(q);
      const idMatch = evt.id?.toLowerCase().includes(q);
      if (!titleMatch && !contractorMatch && !locationMatch && !phoneMatch && !idMatch) return false;
    }
    return true;
  }, [statusFilter, roleFilter, searchQuery, getCardTypeKey]);

  const allCards = useMemo(() => {
    const cards = [];
    Object.entries(events).forEach(([date, list]) => {
      (list || []).forEach(evt => cards.push({ ...evt, date }));
    });
    return cards.filter(isEventVisible);
  }, [events, isEventVisible]);

  const stats = useMemo(() => {
    const s = { total: allCards.length, budget: 0, byRole: { engineer: 0, executor: 0, lead: 0, machinery: 0 } };
    allCards.forEach(c => {
      s.budget += parseBudget(c.budget);
      const t = getCardTypeKey(c);
      s.byRole[t] = (s.byRole[t] || 0) + 1;
    });
    return s;
  }, [allCards, getCardTypeKey]);

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = useCallback((e, targetDate, targetTime = null) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const card = JSON.parse(e.dataTransfer.getData('application/json'));
      if (card.date === targetDate && (!targetTime || card.time === targetTime)) return;
      const newEvents = { ...events };
      if (newEvents[card.date]) {
        newEvents[card.date] = newEvents[card.date].filter(evt => evt.id !== card.id);
        if (newEvents[card.date].length === 0) delete newEvents[card.date];
      }
      if (!newEvents[targetDate]) newEvents[targetDate] = [];
      const { date: _, ...cardWithoutDate } = card;
      if (targetTime) cardWithoutDate.time = targetTime;
      newEvents[targetDate].push(cardWithoutDate);
      saveEvents(newEvents);
      showToast(`📅 Заявка #${card.id} перенесена на ${targetDate}`);
    } catch (err) { console.error(err); }
  }, [events, saveEvents]);

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
    const newId = Date.now().toString().slice(-4);
    newEvents[date].push({
      id: newId,
      leadNum: String(Math.floor(10 + Math.random() * 90)),
      title: leadPayload.clientName ? `Лид #${newId}: ${leadPayload.title || 'Строительный объект'}` : (leadPayload.title || 'Новая заявка'),
      status: 'Новые',
      type: 'request',
      role: 'lead',
      time: time,
      phone: leadPayload.phone || '',
      contractor: leadPayload.clientName || leadPayload.contractor || 'Заказчик',
      location: leadPayload.address || leadPayload.location || 'г. Астана',
      budget: leadPayload.budget || '1 500 000 ₸',
    });
    saveEvents(newEvents);
    setShowLeadModal(false);
    setLeadModalDefaults({ date: '', time: '' });
    showToast(`🎉 Лид #${newId} создан!`);
  };

  const openCreateModalForSlot = (dateStr, timeStr = '10:00') => {
    setLeadModalDefaults({ date: dateStr, time: timeStr });
    setShowLeadModal(true);
  };

  // ═══════════════════════════════════════════════════════════
  // РЕНДЕР: МИНИ-КАРТОЧКА ЗАЯВКИ С ЧЁТКОЙ РОЛЕВОЙ МАРКИРОВКОЙ
  // ═══════════════════════════════════════════════════════════
  const renderEventChip = (card, dateStr, compact = false) => {
    const typeKey = getCardTypeKey(card);
    const cfg = ROLE_TYPE_CONFIG[typeKey] || ROLE_TYPE_CONFIG.lead;

    return (
      <div
        key={card.id}
        draggable
        onDragStart={e => handleDragStart(e, { ...card, date: dateStr })}
        onClick={(e) => { e.stopPropagation(); setSelectedCard({ ...card, date: dateStr, day: dateStr }); }}
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderLeft: `4px solid ${cfg.barColor}`,
          borderRadius: '7px',
          padding: compact ? '3px 6px' : '5px 8px',
          cursor: 'grab',
          marginBottom: '4px',
          transition: 'all 0.15s ease',
          fontSize: compact ? '0.65rem' : '0.74rem',
          boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 10px ${cfg.glow}`,
          position: 'relative'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 6px 16px ${cfg.glow}, 0 0 14px ${cfg.border}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.4), 0 0 10px ${cfg.glow}`;
        }}
        title={`${cfg.badge} #${card.id || card.leadNum}
🏢 ${card.title}
👤 ${card.contractor}
📍 ${card.location || 'г. Астана'}
💰 ${card.budget || '—'}`}
      >
        {/* Верхняя строка: Ролевой бейдж + ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 900, padding: '1px 5px', borderRadius: '4px',
            background: cfg.tagBg, color: cfg.tagText, border: `1px solid ${cfg.border}60`,
            display: 'inline-flex', alignItems: 'center', gap: '3px', textTransform: 'uppercase', letterSpacing: '0.3px'
          }}>
            {cfg.badge}
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ffd700' }}>
            #{card.id || card.leadNum || '01'}
          </span>
        </div>

        {/* Название объекта */}
        <div style={{ fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
          {compact ? card.title.slice(0, 22) : card.title}
        </div>

        {/* Нижняя строка: Время и Бюджет */}
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', color: '#94a3b8', fontSize: '0.65rem' }}>
            <span>⏱ {card.time || '10:00'} • 📍 {card.location?.slice(0, 10) || 'Астана'}</span>
            <strong style={{ color: '#f8fafc', fontWeight: 800 }}>{card.budget}</strong>
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

    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '6px 2px', fontWeight: 900, fontSize: '0.75rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {d}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} style={{ minHeight: '92px', background: 'rgba(10, 16, 30, 0.75)', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.06)' }} />;
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
                minHeight: '94px', padding: '6px', borderRadius: '10px', cursor: 'pointer',
                background: today ? 'rgba(0, 229, 255, 0.15)' : isOver ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 24, 44, 0.94)',
                border: today ? '2px solid #00e5ff' : isOver ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: today ? '0 0 16px rgba(0, 229, 255, 0.3)' : '0 2px 6px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease', position: 'relative'
              }}
            >
              {/* Шапка дня */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{
                  fontWeight: 900, fontSize: today ? '0.85rem' : '0.78rem',
                  color: today ? '#00e5ff' : '#ffffff',
                  background: today ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '5px', padding: '1px 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {day}
                </span>

                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openCreateModalForSlot(dateStr); }}
                    style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', color: '#00e5ff', borderRadius: '4px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900 }}
                    title="Создать лид на этот день"
                  >+</button>
                  {dayEvents.length > 0 && (
                    <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      {dayEvents.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Список разноцветных карточек внутри ячейки */}
              <div style={{ overflow: 'hidden', maxHeight: '66px' }}>
                {dayEvents.slice(0, 2).map(evt => renderEventChip(evt, dateStr, true))}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: '0.62rem', color: '#38bdf8', textAlign: 'center', marginTop: '2px', fontWeight: 800 }}>
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
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '2px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)', background: 'rgba(10, 16, 30, 0.8)', padding: '4px', borderRadius: '12px' }}>
        <div style={{ padding: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px' }} />
        {days.map(d => {
          const dateStr = fmtDate(d);
          const today = isToday(dateStr);
          return (
            <div key={dateStr} style={{
              textAlign: 'center', padding: '6px 2px', borderRadius: '6px',
              background: today ? 'rgba(0,229,255,0.2)' : 'rgba(18, 27, 48, 0.95)',
              border: today ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800 }}>
                {DAYS_RU[d.getDay() === 0 ? 6 : d.getDay() - 1]}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: today ? '#00e5ff' : '#ffffff' }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}

        {hours.map(h => (
          <React.Fragment key={h}>
            <div style={{ padding: '2px 4px', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map(d => {
              const dateStr = fmtDate(d);
              const dayEvents = (events[dateStr] || []).filter(evt => {
                if (!isEventVisible(evt)) return false;
                const evtHour = parseInt(evt.time?.split(':')[0], 10);
                return evtHour === h;
              });
              const isOver = dragOverDate === `${dateStr}-${h}`;
              return (
                <div
                  key={`${dateStr}-${h}`}
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr, `${String(h).padStart(2,'0')}:00`)}
                  onClick={() => openCreateModalForSlot(dateStr, `${String(h).padStart(2,'0')}:00`)}
                  style={{
                    minHeight: '38px', padding: '2px 4px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: isOver ? 'rgba(245,158,11,0.2)' : 'transparent',
                    cursor: 'pointer'
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
    const dayEvents = (events[dateStr] || []).filter(isEventVisible);
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const dow = currentDate.getDay();

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '8px', padding: '6px', background: 'rgba(18,27,48,0.95)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
            {DAYS_FULL[dow === 0 ? 6 : dow - 1]}, {currentDate.getDate()} {MONTHS_RU[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1px' }}>
            {dayEvents.length} заявок • Бюджет: <strong style={{ color: '#ffd700' }}>{dayEvents.reduce((a, c) => a + parseBudget(c.budget), 0).toLocaleString('ru-RU')} ₸</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', background: 'rgba(10,16,30,0.8)', padding: '4px', borderRadius: '12px' }}>
          {hours.map(h => {
            const hourEvents = dayEvents.filter(evt => parseInt(evt.time?.split(':')[0], 10) === h);
            return (
              <React.Fragment key={h}>
                <div style={{ padding: '4px 6px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textAlign: 'right', borderRight: '2px solid rgba(0,229,255,0.3)' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverDate(`${dateStr}-${h}`); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => handleDrop(e, dateStr, `${String(h).padStart(2,'0')}:00`)}
                  onClick={() => openCreateModalForSlot(dateStr, `${String(h).padStart(2,'0')}:00`)}
                  style={{
                    minHeight: '44px', padding: '3px 6px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: dragOverDate === `${dateStr}-${h}` ? 'rgba(0,229,255,0.1)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {hourEvents.map(evt => renderEventChip(evt, dateStr, false))}
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
          position: 'fixed', top: '16px', right: '16px', zIndex: 10002,
          background: 'rgba(0,229,255,0.2)', border: '1px solid #00e5ff',
          backdropFilter: 'blur(20px)', borderRadius: '10px', padding: '10px 18px',
          color: '#00e5ff', fontWeight: 800, fontSize: '0.85rem',
        }}>
          {toastMsg}
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
        background: 'rgba(10, 16, 30, 0.94)', borderBottom: '1px solid rgba(0,229,255,0.25)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100,
        flexWrap: 'wrap',
      }}>
        <button onClick={onBackToHome} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          color: '#ffffff', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
          fontWeight: 800, fontSize: '0.76rem',
        }}>← На сайт</button>

        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📅 CRM КАЛЕНДАРЬ
        </h1>

        {/* Ролевые фильтры-табы */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {[
            { key: 'all', label: 'Все' },
            { key: 'engineer', label: '👷 Выезды инженера' },
            { key: 'executor', label: '🔨 Работы подрядчика' },
            { key: 'lead', label: '📝 Новые лиды' }
          ].map(rf => (
            <button
              key={rf.key}
              onClick={() => setRoleFilter(rf.key)}
              style={{
                padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                background: roleFilter === rf.key ? 'linear-gradient(135deg, #00e5ff, #0284c7)' : 'rgba(255,255,255,0.06)',
                color: roleFilter === rf.key ? '#0a1628' : '#cbd5e1',
                border: roleFilter === rf.key ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.12)'
              }}
            >
              {rf.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Поиск */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem' }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию / #ID..."
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '6px', padding: '5px 8px 5px 24px', color: '#ffffff',
              fontSize: '0.76rem', width: '170px', outline: 'none',
            }}
          />
        </div>

        {/* Создать заявку */}
        <button onClick={() => openCreateModalForSlot(fmtDate(currentDate))} style={{
          background: 'linear-gradient(135deg, #00e5ff, #0284c7)', border: 'none',
          borderRadius: '6px', padding: '5px 12px', color: '#0a1628', fontWeight: 900,
          fontSize: '0.76rem', cursor: 'pointer',
        }}>
          ➕ Новый лид
        </button>
      </div>

      {/* ═══ НАВИГАЦИОННАЯ ПАНЕЛЬ ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
        background: 'rgba(8, 14, 26, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}>
        {/* Переключатель вида */}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px' }}>
          {[
            { key: 'day', label: 'День' },
            { key: 'week', label: 'Неделя' },
            { key: 'month', label: 'Месяц' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: '4px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                fontWeight: 900, fontSize: '0.72rem',
                background: view === v.key ? '#00e5ff' : 'transparent',
                color: view === v.key ? '#0a1628' : '#94a3b8',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Навигация по датам */}
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '5px', padding: '3px 8px', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>‹</button>
        <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ffffff', minWidth: '150px', textAlign: 'center' }}>
          {headerLabel}
        </span>
        <button onClick={() => navigate(1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '5px', padding: '3px 8px', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>›</button>

        <button onClick={() => setCurrentDate(new Date())} style={{
          padding: '3px 10px', borderRadius: '5px', border: '1px solid rgba(0,229,255,0.4)',
          background: 'rgba(0,229,255,0.15)', color: '#00e5ff', cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem',
        }}>
          Сегодня
        </button>
      </div>

      {/* ═══ КАЛЕНДАРНАЯ СЕТКА ═══ */}
      <div style={{ padding: '8px 16px', position: 'relative', zIndex: 1 }}>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* ═══ ЛЕГЕНДА ТИПОВ ЗАЯВОК (ВНИЗУ) ═══ */}
      <div style={{
        display: 'flex', gap: '16px', padding: '8px 16px', justifyContent: 'center',
        background: 'rgba(8, 14, 26, 0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}>
        {Object.entries(ROLE_TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.border }} />
            <strong style={{ color: cfg.tagText }}>{cfg.badge}</strong>
            <span style={{ color: '#64748b' }}>({stats.byRole[key] || 0})</span>
          </div>
        ))}
      </div>

      {/* ═══ МОДАЛКИ ═══ */}
      {selectedCard && (
        <DealCardModal
          card={selectedCard}
          currentUser={currentUser}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
        />
      )}
      {showLeadModal && (
        <LeadCreateModal
          defaultDate={leadModalDefaults.date}
          defaultTime={leadModalDefaults.time}
          onClose={() => setShowLeadModal(false)}
          onSave={handleNewLead}
        />
      )}
    </div>
  );
}
