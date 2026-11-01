import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DealCardModal from './DealCardModal';
import LeadCreateModal from './LeadCreateModal';
import VoiceLeadInput from './VoiceLeadInput';
import './crm-refresh.css';
import { jsonAuthHeaders, authHeaders, genId, shortNum, parseMoney, crmStatusBucket, userKeyOf, responseError } from '../services/platformUtils';
import { upsertCrmEvent } from '../services/orderSyncService';

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
  'В работе': { bg: 'rgba(139,92,246,0.25)',  border: '#8b5cf6', dot: '#c4b5fd', text: '#ffffff' },
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
    tagText: '#b9a4ff',
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
    bg: 'linear-gradient(135deg, rgba(185, 164, 255, 0.2), rgba(167, 139, 250, 0.16))',
    border: '#b9a4ff',
    glow: 'rgba(185, 164, 255, 0.35)',
    tagBg: 'rgba(185, 164, 255, 0.25)',
    tagText: '#d6caff',
    barColor: '#b9a4ff'
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

function getMonday(d) { const dt = new Date(d); const day = dt.getDay(); const diff = (day === 0 ? -6 : 1) - day; dt.setDate(dt.getDate() + diff); return dt; }
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isToday(dateStr) { return dateStr === fmtDate(new Date()); }
// «55 000 – 120 000 ₸» → нижняя граница (раньше склейка цифр → 55 млрд)
function parseBudget(s) { return parseMoney(s, 'min'); }

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
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  // Sync CRM events from Go Backend Server
  const backendAliveRef = useRef(false);
  const pendingWritesRef = useRef(0); // пока идут записи — не перетираем локальное состояние ответом опроса
  const syncServerEvents = useCallback(async () => {
    if (pendingWritesRef.current > 0) return;
    try {
      const res = await fetch('/api/v1/crm/events', { headers: authHeaders() });
      if (!res.ok) { backendAliveRef.current = false; return; }
      backendAliveRef.current = true;
      const data = await res.json();
      if (pendingWritesRef.current > 0) return;
      if (data && data.grouped && typeof data.grouped === 'object') {
        // Демо-сделки в боевую БД больше НЕ заливаются: пустой сервер = пустой календарь
        setEvents(data.grouped);
        localStorage.setItem('qazgost_crm_calendar', JSON.stringify(data.grouped));
      }
    } catch (err) {
      backendAliveRef.current = false;
    }
  }, []);

  // Запись на сервер (upsert / delete) с учётом «висящих» записей и показом ошибок
  const pushEvent = useCallback(async (payload) => {
    pendingWritesRef.current += 1;
    try {
      const r = await upsertCrmEvent(payload);
      if (!r.ok) showToast(`⚠️ Не сохранено на сервере: ${r.error}`);
      return r.ok;
    } finally {
      pendingWritesRef.current -= 1;
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('qazgost_crm_calendar');
    if (saved) {
      try {
        setEvents(JSON.parse(saved) || {});
      } catch { setEvents({}); }
    }

    syncServerEvents();

    // Опрос сервера (если сервер был недоступен — продолжаем пробовать)
    const interval = setInterval(() => {
      syncServerEvents();
    }, 8000);

    return () => clearInterval(interval);
  }, [syncServerEvents]);

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

    // Синхронизация с общим календарём и инженером (локальные компоненты на этом же устройстве)
    try {
      const calEvents = JSON.parse(localStorage.getItem('qazgost_calendar_events') || '{}');
      const merged = { ...calEvents };
      for (const dateKey in newEvents) {
        merged[dateKey] = newEvents[dateKey];
      }
      localStorage.setItem('qazgost_calendar_events', JSON.stringify(merged));
      window.dispatchEvent(new Event('crm_calendar_updated'));
      window.dispatchEvent(new Event('engineer_requests_updated'));
    } catch (e) {}
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
    if (statusFilter !== 'all' && crmStatusBucket(evt.status) !== statusFilter) return false;
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
      const idMatch = String(evt.id ?? '').toLowerCase().includes(q);
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
    const s = {
      total: allCards.length,
      totalBudget: 0,
      byRole: { engineer: 0, executor: 0, lead: 0, machinery: 0 },
      byStatus: { 'Новые': 0, 'В работе': 0, 'Дожим': 0, 'Успешно': 0, 'Отказ': 0 }
    };
    allCards.forEach(c => {
      s.totalBudget += parseBudget(c.budget);
      const t = getCardTypeKey(c);
      s.byRole[t] = (s.byRole[t] || 0) + 1;
      const bucket = crmStatusBucket(c.status);
      s.byStatus[bucket] = (s.byStatus[bucket] || 0) + 1;
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
      newEvents[targetDate] = [...newEvents[targetDate], cardWithoutDate];
      saveEvents(newEvents);
      showToast(`📅 Заявка #${card.leadNum || card.id} перенесена на ${targetDate}`);
      // Перенос сохраняется на сервере (upsert по тому же id), иначе опрос откатывал его через 8 сек
      pushEvent({ ...cardWithoutDate, date: targetDate });
    } catch (err) { console.error(err); }
  }, [events, saveEvents, pushEvent]);

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const handleSaveCard = (updatedCard) => {
    const date = updatedCard.date || fmtDate(new Date());
    const { date: _d, ...cardData } = updatedCard;
    // Без мутации состояния: убираем карточку со всех дат (дата могла поменяться) и кладём на нужную
    const newEvents = {};
    for (const d in events) {
      const list = (events[d] || []).filter(e => String(e.id) !== String(updatedCard.id));
      if (list.length) newEvents[d] = list;
    }
    newEvents[date] = [...(newEvents[date] || []), cardData];
    saveEvents(newEvents);
    setSelectedCard(null);

    pushEvent({ ...cardData, date }).then(ok => { if (ok) showToast('💾 Карточка сохранена'); });
  };

  const handleDeleteCard = (cardId) => {
    if (!cardId) return;
    if (!window.confirm(`Вы уверены, что хотите полностью удалить заявку #${shortNum(cardId)} из CRM и у всех исполнителей?`)) {
      return;
    }

    const strId = String(cardId);

    // 1. Удаление из events текущего календаря CRM
    const newEvents = { ...events };
    // Только ТОЧНОЕ совпадение id (раньше includes() удалял чужие записи: "-108" ⊂ "REQ-1084")
    const relatedIds = new Set([strId, `REQ-${strId}`, `EVT-${strId}`, `OBJ-${strId}`]);
    const isRelated = (e) => e && (relatedIds.has(String(e.id)) || String(e.dealId) === strId || String(e.parentDealId) === strId);
    for (const d in newEvents) {
      newEvents[d] = (newEvents[d] || []).filter(e => String(e.id) !== strId);
    }
    saveEvents(newEvents);

    // Удаление с сервера БД для всех аккаунтов и устройств
    pendingWritesRef.current += 1;
    fetch(`/api/v1/crm/events?id=${encodeURIComponent(strId)}`, { method: 'DELETE', headers: authHeaders() })
      .then(async (res) => { if (!res.ok) showToast(`⚠️ Сервер не удалил заявку: ${await responseError(res)}`); })
      .catch((e) => showToast(`⚠️ Сервер недоступен, заявка удалена только локально: ${e.message}`))
      .finally(() => { pendingWritesRef.current -= 1; });

    // 2. Удаление из календарей (каждый календарь фильтруется отдельно, без перезаписи чужих)
    for (const calKey of ['qazgost_calendar_events', 'qazgost_calendar_events_executor', 'qazgost_calendar_events_engineer']) {
      try {
        const raw = localStorage.getItem(calKey);
        if (!raw) continue;
        const cal = JSON.parse(raw) || {};
        for (const d in cal) {
          cal[d] = (cal[d] || []).filter(e => !isRelated(e));
        }
        localStorage.setItem(calKey, JSON.stringify(cal));
      } catch(e) {}
    }

    // 3. Удаление из очереди заявок инженера
    try {
      const reqKey = 'qazgost_engineer_requests';
      const reqs = JSON.parse(localStorage.getItem(reqKey) || '[]');
      localStorage.setItem(reqKey, JSON.stringify(reqs.filter(r => !isRelated(r))));
    } catch(e) {}

    // 4. Удаление из реестра объектов исполнителя
    try {
      const objKey = 'qazgost_executor_objects';
      const objs = JSON.parse(localStorage.getItem(objKey) || '[]');
      localStorage.setItem(objKey, JSON.stringify(objs.filter(o => !isRelated(o))));
    } catch(e) {}

    setSelectedCard(null);

    // 5. Оповещение всех компонентов
    window.dispatchEvent(new Event('crm_calendar_updated'));
    window.dispatchEvent(new Event('engineer_requests_updated'));
    window.dispatchEvent(new Event('notifications_updated'));
    window.dispatchEvent(new Event('custom_events_updated'));

    // 6. Принудительная синхронизация с сервером для консистентности
    setTimeout(() => syncServerEvents(), 500);

    showToast(`🗑️ Заявка #${shortNum(cardId)} удалена из CRM и всех календарей`);
  };

  const handleNewLead = (leadPayload) => {
    const date = leadPayload.date || leadModalDefaults.date || fmtDate(currentDate);
    const time = leadPayload.time || leadModalDefaults.time || new Date().toLocaleTimeString().slice(0,5);
    const newEvents = { ...events };
    if (!newEvents[date]) newEvents[date] = [];
    const newId = genId('lead'); // было Date.now().slice(-4): повтор каждые 10 сек → перезапись чужих сделок на сервере
    const displayNum = shortNum(newId);
    
    const clientTitle = leadPayload.clientName || leadPayload.contractor || 'Заказчик';
    const serviceTitle = leadPayload.service || leadPayload.title || 'Выезд на объект и замеры';
    const fullTitle = `${serviceTitle} (${clientTitle})`;
    const assignedEng = leadPayload.assignedEngineer || 'Асхат Нурланов';
    const manager = currentUser?.name || 'Менеджер Саша';

    const newLeadItem = {
      id: newId,
      leadNum: displayNum,
      title: fullTitle,
      status: 'Новые',
      type: 'request_engineering',
      role: 'engineer',
      dealType: 'engineer',
      time: time,
      phone: leadPayload.phone || '+7 (701) 888-00-11',
      contractor: clientTitle,
      clientName: clientTitle,
      clientPhone: leadPayload.phone || '+7 (701) 888-00-11',
      location: leadPayload.address || leadPayload.location || 'г. Астана',
      budget: typeof leadPayload.budget === 'number' ? `${leadPayload.budget.toLocaleString('ru-RU')} ₸` : (leadPayload.budget || 'По смете'),
      service: serviceTitle,
      notes: leadPayload.notes || 'Заявка передана инженеру ПТО для проведения замеров и составления сметы.',
      assignedEngineer: assignedEng,
      engineerPosition: 'Ведущий инженер ПТО',
      managerName: manager,
      assignedWorkers: 'Мастер Владимир, Мастер Данил, Радион (Манипулятор)'
    };

    newEvents[date] = [...newEvents[date], newLeadItem];
    saveEvents(newEvents);

    // Отправка новой заявки на центральный сервер БД для всех устройств
    pushEvent({ ...newLeadItem, date, createdBy: userKeyOf(currentUser) || '' });

    // 1. Автоматическая передача в реестр заявок Инженера (qazgost_engineer_requests)
    try {
      const savedRequests = JSON.parse(localStorage.getItem('qazgost_engineer_requests') || '[]');
      const newEngineerReq = {
        id: `REQ-${newId}`,
        client: clientTitle,
        type: serviceTitle,
        address: leadPayload.address || leadPayload.location || 'г. Астана',
        phone: leadPayload.phone || '+7 (701) 888-00-11',
        status: 'Новая',
        time: `${date}, ${time}`,
        managerName: manager,
        budget: parseMoney(leadPayload.budget),
        notes: leadPayload.notes || ''
      };
      localStorage.setItem('qazgost_engineer_requests', JSON.stringify([newEngineerReq, ...savedRequests]));
    } catch (e) { console.error(e); }

    // 2. Автоматическая синхронизация с календарём инженера (qazgost_calendar_events)
    try {
      const calendarKey = 'qazgost_calendar_events';
      const calEvents = JSON.parse(localStorage.getItem(calendarKey) || '{}');
      // Ключ — полная дата YYYY-MM-DD (раньше номер дня → событие появлялось в каждом месяце)
      if (!calEvents[date]) calEvents[date] = [];
      calEvents[date].push({
        id: `EVT-${newId}`,
        title: fullTitle,
        client: clientTitle,
        location: leadPayload.address || leadPayload.location || 'г. Астана',
        time: time,
        type: 'request',
        status: 'Новые',
        contractor: clientTitle,
        deadline: 'Сегодня до 18:00',
        managerName: manager,
        assignedEngineer: assignedEng,
        budget: parseMoney(leadPayload.budget)
      });
      localStorage.setItem(calendarKey, JSON.stringify(calEvents));
    } catch (e) { console.error(e); }

    // 3. Отправка уведомления инженеру в колокольчик
    try {
      const notifsKey = 'engineer_notifications';
      const engNotifs = JSON.parse(localStorage.getItem(notifsKey) || '[]');
      const newNotif = {
        id: `NOT-${Date.now()}`,
        icon: '👷',
        title: `Новая заявка от ${manager}`,
        text: `Объект: ${fullTitle} (${leadPayload.address || 'г. Астана'}). Назначен выезд на ${date} ${time}.`,
        time: 'Только что',
        unread: true,
        target: 'engineer'
      };
      localStorage.setItem(notifsKey, JSON.stringify([newNotif, ...engNotifs]));
      window.dispatchEvent(new Event('notifications_updated'));
      window.dispatchEvent(new CustomEvent('engineer_requests_updated', { detail: { newId } }));
      window.dispatchEvent(new Event('crm_calendar_updated'));
    } catch (e) { console.error(e); }

    setShowLeadModal(false);
    setLeadModalDefaults({ date: '', time: '' });
    showToast(`🚀 Заявка #${displayNum} создана и автоматически передана инженеру ПТО (${assignedEng})!`);
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedCard({ ...card, date: dateStr, day: dateStr }); } }}
        className={`crm-event${compact ? ' is-compact' : ''}`}
        style={{
          background: cfg.bg,
          borderColor: cfg.border,
          borderLeftColor: cfg.barColor,
        }}
        title={`${cfg.badge} #${card.leadNum || card.id}
🏢 ${card.title}
👤 ${card.contractor}
📍 ${card.location || 'г. Астана'}
💰 ${card.budget || '—'}`}
      >
        {/* Верхняя строка: Ролевой бейдж + ID */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
          <span className="crm-event-tag" style={{ background: cfg.tagBg, color: cfg.tagText }}>
            {cfg.badge}
          </span>
          <span className="crm-event-num">
            #{card.leadNum || card.id || '01'}
          </span>
        </div>

        {/* Название объекта */}
        <div className="crm-event-title">
          {compact ? card.title.slice(0, 22) : card.title}
        </div>

        {/* Нижняя строка: Время и Бюджет */}
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px', color: '#a39cc2', fontSize: '0.65rem' }}>
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
      <div className="crm-month-scroll-wrapper">
        <div className="crm-month-grid">
          {DAYS_RU.map(d => (
            <div key={d} className="crm-dow">
              {d}
            </div>
          ))}

          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} className="crm-day is-empty" aria-hidden="true" />;
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
                className={`crm-day${today ? ' is-today' : ''}${isOver ? ' is-over' : ''}`}
              >
                {/* Шапка дня */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="crm-day-num">{day}</span>

                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="crm-day-add"
                      onClick={(e) => { e.stopPropagation(); openCreateModalForSlot(dateStr); }}
                      title="Создать заявку на этот день"
                      aria-label={`Создать заявку на ${day} число`}
                    >+</button>
                    {dayEvents.length > 0 && (
                      <span className="crm-day-count">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Список разноцветных карточек внутри ячейки */}
                <div style={{ overflow: 'hidden', maxHeight: '66px' }}>
                  {dayEvents.slice(0, 2).map(evt => renderEventChip(evt, dateStr, true))}
                  {dayEvents.length > 2 && (
                    <div style={{ fontSize: '0.62rem', color: '#b9a4ff', textAlign: 'center', marginTop: '2px', fontWeight: 800 }}>
                      +{dayEvents.length - 2} ещё
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
      <div className="crm-week-scroll-wrapper">
        <div className="crm-week-grid">
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
              <div style={{ fontSize: '0.65rem', color: '#a39cc2', fontWeight: 800 }}>
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
            <div style={{ padding: '2px 4px', fontSize: '0.65rem', color: '#a39cc2', fontWeight: 800, textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
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
          <div style={{ fontSize: '0.75rem', color: '#a39cc2', marginTop: '1px' }}>
            {dayEvents.length} заявок • Бюджет: <strong style={{ color: '#ffd700' }}>{dayEvents.reduce((a, c) => a + parseBudget(c.budget), 0).toLocaleString('ru-RU')} ₸</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', background: 'rgba(10,16,30,0.8)', padding: '4px', borderRadius: '12px' }}>
          {hours.map(h => {
            const hourEvents = dayEvents.filter(evt => parseInt(evt.time?.split(':')[0], 10) === h);
            return (
              <React.Fragment key={h}>
                <div style={{ padding: '4px 6px', fontSize: '0.72rem', color: '#a39cc2', fontWeight: 800, textAlign: 'right', borderRight: '2px solid rgba(0,229,255,0.3)' }}>
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
    <div className="crm-root">
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
      <div className="crm-top-bar">
        <div className="crm-top-group-1">
          <h1 className="crm-title">Календарь заявок</h1>

          {/* Ролевые фильтры-табы */}
          <div className="crm-role-tabs">
            {[
              { key: 'all', label: 'Все' },
              { key: 'engineer', label: 'Выезды инженера' },
              { key: 'executor', label: 'Работы подрядчика' },
              { key: 'lead', label: 'Новые лиды' }
            ].map(rf => (
              <button
                key={rf.key}
                type="button"
                onClick={() => setRoleFilter(rf.key)}
                aria-pressed={roleFilter === rf.key}
                className={`crm-chip${roleFilter === rf.key ? ' is-active' : ''}`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Навигация по датам и Переключатель вида */}
        <div className="crm-top-group-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" className="crm-nav-btn" onClick={() => navigate(-1)} aria-label="Предыдущий период">‹</button>
            <span className="crm-period" aria-live="polite">{headerLabel}</span>
            <button type="button" className="crm-nav-btn" onClick={() => navigate(1)} aria-label="Следующий период">›</button>
          </div>

          <div className="crm-view-switch" role="group" aria-label="Вид календаря">
            {[
              { key: 'day', label: 'День' },
              { key: 'week', label: 'Неделя' },
              { key: 'month', label: 'Месяц' },
            ].map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                aria-pressed={view === v.key}
                className={view === v.key ? 'is-active' : ''}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ГЛАВНЫЙ ДВУХКОЛОНОЧНЫЙ LAYOUT ═══ */}
      <div className="crm-main-layout">
        {/* ═══ ЛЕВАЯ ПАНЕЛЬ С УПРАВЛЕНИЕМ И ФИЛЬТРАМИ ═══ */}
        <div className="crm-sidebar-panel">
          {/* Кнопка Создать заявку */}
          <button
            type="button"
            className="qg-btn qg-btn--primary crm-create-btn"
            onClick={() => openCreateModalForSlot(fmtDate(currentDate))}
          >
            Создать заявку
          </button>

          {/* 🎙️ Голосовое создание лида */}
          <button
            type="button"
            className="qg-btn qg-btn--ghost crm-voice-btn"
            aria-expanded={showVoicePanel}
            onClick={() => setShowVoicePanel(!showVoicePanel)}
          >
            {showVoicePanel ? 'Скрыть голосовой ввод' : 'Надиктовать заявку'}
          </button>

          {showVoicePanel && (
            <VoiceLeadInput 
              onFieldsExtracted={(fields) => {
                console.log('[VOICE] Received fields, opening modal:', JSON.stringify(fields));
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                const payload = {
                  clientName: fields.clientName || '',
                  phone: fields.phone || '',
                  service: fields.service || 'Установка септика',
                  budget: fields.budget || 1500000,
                  address: fields.address || '',
                  date: fields.date || dateStr,
                  time: '10:00',
                  notes: fields.rawText ? `[Голос]: ${fields.rawText}` + (fields.notes ? `\n${fields.notes}` : '') : (fields.notes || ''),
                };
                // Открываем модалку создания лида с предзаполненными данными
                setLeadModalDefaults({ date: payload.date, time: payload.time });
                setShowLeadModal(true);
                // Заполняем поля формы через кастомный event
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('voice_lead_prefill', { detail: payload }));
                }, 200);
                showToast(`🎙️ Форма заполнена голосом — проверьте и нажмите «Создать»`);
              }}
              onCommand={(cmd) => {
                console.log('[VOICE CMD]', cmd);
                if (cmd.type === 'show_today') {
                  setCurrentDate(new Date());
                  showToast('📅 Показываю заявки за сегодня');
                } else if (cmd.type === 'filter_status') {
                  setStatusFilter(cmd.status === 'Новые' ? 'Новые' : cmd.status === 'В работе' ? 'В работе' : cmd.status === 'Закрыто' ? 'Закрыто' : 'all');
                  showToast(`🔍 Фильтр: ${cmd.status}`);
                } else if (cmd.type === 'show_all') {
                  setStatusFilter('all');
                  showToast('📋 Показываю все заявки');
                } else if (cmd.type === 'count_leads') {
                  const allEvents = events || {};
                  let total = 0;
                  Object.values(allEvents).forEach(arr => { total += (arr || []).length; });
                  showToast(`📊 Всего заявок в CRM: ${total}`);
                } else if (cmd.type === 'create_lead') {
                  showToast('🎤 Готов к созданию. Диктуйте данные клиента.');
                }
              }}
            />
          )}

          {/* Блок Поиск */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="crm-side-label" htmlFor="crm-search">Поиск заявки</label>
            <input
              id="crm-search"
              type="search"
              className="crm-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Клиент, объект, телефон"
            />
          </div>

          {/* Виджеты KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '10px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div className="crm-kpi-label">Всего</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {stats.total}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderRadius: '10px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div className="crm-kpi-label">Бюджет</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ffd700', marginTop: '4px', lineHeight: 1.1 }}>
                {(stats.totalBudget / 1000000).toFixed(1)}M ₸
              </div>
            </div>
          </div>

          {/* Фильтр по статусам */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="crm-side-label">Статус</span>
            <div className="crm-sidebar-status-filters">
              {[
                { key: 'all', label: 'Все заявки', color: '#00e5ff' },
                { key: 'Новые', label: 'Новые', color: '#a78bfa' },
                { key: 'В работе', label: 'В работе', color: '#c4b5fd' },
                { key: 'Дожим', label: 'Дожим', color: '#fbbf24' },
                { key: 'Успешно', label: 'Успешно', color: '#4ade80' },
                { key: 'Отказ', label: 'Отказ', color: '#f87171' },
              ].map(sf => {
                const count = sf.key === 'all' ? stats.total : (stats.byStatus[sf.key] || 0);
                const active = statusFilter === sf.key;
                return (
                  <button
                    key={sf.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(sf.key)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: active ? `1.5px solid ${sf.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: active ? `${sf.color}25` : 'rgba(255, 255, 255, 0.03)',
                      color: active ? '#ffffff' : '#cbc5e3',
                      fontSize: '0.78rem',
                      fontWeight: active ? 900 : 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sf.color }} />
                      <span>{sf.label}</span>
                    </div>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px',
                      background: active ? sf.color : 'rgba(255, 255, 255, 0.1)', color: active ? '#0a1628' : '#a39cc2'
                    }}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ ПРАВАЯ ПАНЕЛЬ С КАЛЕНДАРЁМ ═══ */}
        <div className="crm-calendar-container">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      </div>

      {/* ═══ ЛЕГЕНДА СТАТУСОВ (ВНИЗУ) ═══ */}
      <div style={{
        display: 'flex', gap: '20px', padding: '10px 20px', justifyContent: 'center', alignItems: 'center',
        background: 'rgba(8, 14, 26, 0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap', margin: '20px 0 0 0'
      }}>
        {[
          { key: 'Новые', label: 'Новые', color: '#a78bfa' },
          { key: 'В работе', label: 'В работе', color: '#c4b5fd' },
          { key: 'Дожим', label: 'Дожим', color: '#fbbf24' },
          { key: 'Успешно', label: 'Успешно', color: '#4ade80' },
          { key: 'Отказ', label: 'Отказ', color: '#f87171' },
        ].map(st => (
          <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#cbc5e3' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color }} />
            <span>{st.label}</span>
            <strong style={{ color: st.color }}>{stats.byStatus[st.key] || 0}</strong>
          </div>
        ))}
      </div>

      {/* ═══ ЛЕГЕНДА ТИПОВ ЗАЯВОК (ВНИЗУ) ═══ */}
      <div style={{
        display: 'flex', gap: '16px', padding: '8px 16px', justifyContent: 'center',
        background: 'rgba(8, 14, 26, 0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
      }}>
        {Object.entries(ROLE_TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbc5e3' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.border }} />
            <strong style={{ color: cfg.tagText }}>{cfg.badge}</strong>
            <span style={{ color: '#8a82a8' }}>({stats.byRole[key] || 0})</span>
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
          onDelete={handleDeleteCard}
        />
      )}
      {showLeadModal && (
        <LeadCreateModal
          initialDate={leadModalDefaults.date}
          initialTime={leadModalDefaults.time}
          onClose={() => setShowLeadModal(false)}
          onSave={handleNewLead}
        />
      )}
    </div>
  );
}
