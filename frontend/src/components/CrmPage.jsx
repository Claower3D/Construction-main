import React, { useState, useEffect } from 'react';
import DealCardModal from './DealCardModal';
import LeadCreateModal from './LeadCreateModal';
import AnimatedBackground from './AnimatedBackground';
import WorkflowDiagramSection from './WorkflowDiagramSection';
import '../index.css';

const DEFAULT_CRM_DEALS = {
  "14": [
    { id: '1084', title: 'Оценка стоимости монолитного фундамента', status: 'Новые', type: 'request', time: '+7 (701) 555-12-34', contractor: 'ИП "Астана-Строй"', location: 'г. Астана, ул. Кабанбай Батыра 42', budget: '1 250 000 ₸' },
    { id: '1085', title: 'Разработка ПСД: Монолитный 5-этажный блок', status: 'В работе', type: 'active_project', time: '+7 (777) 888-99-00', contractor: 'ТОО "GostBuild"', location: 'г. Алматы, пр. Аль-Фараби 77', budget: '3 450 000 ₸' }
  ],
  "15": [
    { id: '1086', title: 'Монтаж HVAC системы и электрики 2-этаж', status: 'Дожим', type: 'work_stage', time: '+7 (705) 111-22-33', contractor: 'ИП "Инженер-Сервис"', location: 'г. Шымкент, ул. Тауке Хана 15', budget: '850 000 ₸' },
    { id: '1087', title: 'Техническая экспертиза несущих конструкций', status: 'Дожим', type: 'request_engineering', time: '+7 (702) 444-55-66', contractor: 'ООО "ТехЭксперт"', location: 'г. Караганда, пр. Бухар Жырау 10', budget: '450 000 ₸' }
  ],
  "16": [
    { id: '1088', title: 'Проверка финансовых смет и актов ВВР', status: 'Дожим', type: 'request', time: '+7 (701) 888-00-11', contractor: 'ТОО "ФинансКонсалт"', location: 'г. Астана, ул. Достык 18', budget: '2 100 000 ₸' },
    { id: '1089', title: 'Согласование эскроу-транша 2-го этапа', status: 'Дожим', type: 'active_project', time: '+7 (775) 333-22-11', contractor: 'Банк ЦентрКредит', location: 'г. Алматы, ул. Желтоксан 115', budget: '5 000 000 ₸' },
    { id: '1090', title: 'Аренда 3 гусеничных экскаваторов CAT 320', status: 'Успешно', type: 'request_construction', time: '+7 (708) 999-00-11', contractor: 'ТОО "СпецТехКазахстан"', location: 'г. Актобе, промзона 4', budget: '1 800 000 ₸' }
  ]
};

export default function CrmPage({ onBackToHome, currentUser }) {
  const [events, setEvents] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'day' | 'week' | 'month' | 'all'
  const [selectedWorkType, setSelectedWorkType] = useState('all'); // 'all' | 'construction' | 'design' | 'engineering' | 'machinery'

  useEffect(() => {
    const saved = localStorage.getItem('qazgost_calendar_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const count = Object.values(parsed).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
        if (count >= 4) {
          setEvents(parsed);
        } else {
          setEvents({ ...DEFAULT_CRM_DEALS, ...parsed });
        }
      } catch (e) {
        setEvents(DEFAULT_CRM_DEALS);
      }
    } else {
      setEvents(DEFAULT_CRM_DEALS);
    }
  }, []);

  const saveEvents = (newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('qazgost_calendar_events', JSON.stringify(newEvents));
  };

  const allCardsRaw = Object.entries(events).flatMap(([day, dayEvents]) =>
    (dayEvents || []).map(evt => ({ ...evt, day }))
  );

  const uniqueCardsMap = new Map();
  allCardsRaw.forEach(card => {
    if (!uniqueCardsMap.has(card.id)) {
      uniqueCardsMap.set(card.id, card);
    }
  });

  const allCards = Array.from(uniqueCardsMap.values()).filter(card => {
    // Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        (card.title && card.title.toLowerCase().includes(q)) ||
        (card.contractor && card.contractor.toLowerCase().includes(q)) ||
        (card.location && card.location.toLowerCase().includes(q)) ||
        (card.time && card.time.toLowerCase().includes(q)) ||
        (card.id && String(card.id).toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;
    }

    // Work Type Filter
    if (selectedWorkType !== 'all') {
      if (selectedWorkType === 'construction' && !(card.type === 'request_construction' || (card.title && card.title.toLowerCase().includes('фундамент')))) return false;
      if (selectedWorkType === 'design' && !(card.type === 'active_project' || (card.title && card.title.toLowerCase().includes('псд')))) return false;
      if (selectedWorkType === 'engineering' && !(card.type === 'request_engineering' || card.type === 'work_stage' || (card.title && card.title.toLowerCase().includes('hvac')))) return false;
      if (selectedWorkType === 'machinery' && !(card.title && card.title.toLowerCase().includes('экскаватор'))) return false;
    }

    // Period Filter
    if (selectedPeriod === 'day' && card.day !== '16') return false;
    if (selectedPeriod === 'week' && (card.day !== '15' && card.day !== '16')) return false;

    return true;
  });

  const columns = [
    { id: 'Новые', title: 'Новые', color: '#ef4444' },
    { id: 'В работе', title: 'В работе', color: '#3b82f6' },
    { id: 'Дожим', title: 'Дожим', color: '#f59e0b' },
    { id: 'Успешно', title: 'Успешно', color: '#22c55e' },
    { id: 'Отказ', title: 'Отказ', color: '#ef4444' },
  ];

  const getColumnForStatus = (status) => {
    if (!status) return 'Новые';
    const s = status.toLowerCase();
    if (s.includes('нов') || s.includes('запланировано')) return 'Новые';
    if (s.includes('работ') || s.includes('процесс')) return 'В работе';
    if (s.includes('дожим') || s.includes('менедж') || s.includes('роп') || s.includes('финанс')) return 'Дожим';
    if (s.includes('успеш') || s.includes('завершено')) return 'Успешно';
    if (s.includes('отказ') || s.includes('отмен')) return 'Отказ';
    
    if (s.includes('ожидает') || s.includes('проверк')) return 'Дожим';
    
    return 'Новые';
  };

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    try {
      const cardData = JSON.parse(e.dataTransfer.getData('application/json'));
      const day = cardData.day || '14';
      
      const newEvents = { ...events };
      if (!newEvents[day]) newEvents[day] = [];
      
      newEvents[day] = newEvents[day].map(evt => {
        if (evt.id === cardData.id) {
          return { ...evt, status: targetColumnId };
        }
        return evt;
      });
      saveEvents(newEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const formatType = (type) => {
    if (type === 'active_project') return 'Проект';
    if (type === 'work_stage') return 'Этап работ';
    if (type === 'deadline') return 'Дедлайн';
    if (type === 'request') return 'Заявка из каталога';
    if (type === 'request_construction') return 'Заявка: Строительство';
    if (type === 'request_engineering') return 'Заявка: Инженерные решения';
    return type;
  };

  const handleWorkflowAction = (action, data) => {
    const today = new Date().toISOString().split('T')[0];
    const newEvents = { ...events };
    if (!newEvents[today]) newEvents[today] = [];

    // Find if we already created a dummy deal from workflow
    let workflowDealIdx = newEvents[today].findIndex(d => d.isWorkflowDemo);

    if (action === 'CREATE_LEAD') {
      const newDeal = {
        id: Date.now().toString().slice(-4),
        title: 'Установка септика (Лид)',
        status: 'Новые',
        type: 'request',
        time: data.phone || '+7 (999) 123-45-67',
        contractor: 'Не распределено',
        location: data.address || 'ул. Центральная, 123',
        budget: (data.budget || '1 250 000') + ' ₸',
        isWorkflowDemo: true,
        day: today
      };
      newEvents[today].push(newDeal);
      saveEvents(newEvents);
    } else if (workflowDealIdx !== -1) {
      if (action === 'APPROVE_ESTIMATE') {
        newEvents[today][workflowDealIdx].status = 'В работе';
        saveEvents(newEvents);
      } else if (action === 'DISPATCH_TASKS') {
        newEvents[today][workflowDealIdx].status = 'Дожим';
        saveEvents(newEvents);
      } else if (action === 'START_WORK') {
        newEvents[today][workflowDealIdx].status = 'В работе';
        saveEvents(newEvents);
      } else if (action === 'COMPLETE_WORK') {
        newEvents[today][workflowDealIdx].status = 'Успешно';
        saveEvents(newEvents);
      }
    }
  };

  const handleSaveCard = (updatedCard) => {
    const day = updatedCard.day || '14';
    const newEvents = { ...events };
    if (!newEvents[day]) {
      newEvents[day] = [];
    }
    
    const existingIndex = newEvents[day].findIndex(evt => evt.id === updatedCard.id);
    if (existingIndex >= 0) {
      newEvents[day][existingIndex] = updatedCard;
    } else {
      newEvents[day].push(updatedCard);
    }
    
    saveEvents(newEvents);
    setSelectedCard(null);
  };

  const handleDeleteCard = (cardId, day) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    const dayKey = day || '14';
    const newEvents = { ...events };
    if (newEvents[dayKey]) {
      newEvents[dayKey] = newEvents[dayKey].filter(evt => evt.id !== cardId);
      saveEvents(newEvents);
    }
  };

  const handleCreateAndSendLead = (leadData) => {
    const today = new Date().toISOString().split('T')[0];
    const newEvents = { ...events };
    if (!newEvents[today]) newEvents[today] = [];

    // Create a new lead card
    const newLead = {
      id: Date.now().toString().slice(-4),
      title: leadData.service || 'Новая заявка',
      status: 'Новые',
      type: 'request',
      time: leadData.phone || '+7 (999) 123-45-67',
      contractor: 'Не распределено',
      location: leadData.address || 'ул. Центральная, 123',
      budget: '0 ₸', // Default budget for a raw lead
      day: today,
      isLead: true
    };

    // Save to main CRM
    newEvents[today].push(newLead);
    saveEvents(newEvents);

    // Save to engineer's calendar to simulate "send to engineer"
    try {
      const storageKey = 'qazgost_calendar_events_engineer';
      const savedEvents = localStorage.getItem(storageKey);
      let engEvents = savedEvents ? JSON.parse(savedEvents) : {};
      
      if (!engEvents[today]) engEvents[today] = [];
      
      const engEvent = {
        ...newLead,
        status: 'На проверке у инженера',
        contractor: 'Отдел ПТО'
      };
      engEvents[today].push(engEvent);
      localStorage.setItem(storageKey, JSON.stringify(engEvents));
      
      // Update main status as well to show it was transferred
      newLead.status = 'В работе';
      newLead.contractor = 'Отдел ПТО';
      saveEvents({ ...newEvents });
      
      alert('✅ Лид успешно создан и передан Инженеру!');
    } catch (err) {
      console.error('Ошибка при передаче лида инженеру', err);
    }
    
    setShowLeadModal(false);
  };

  const computeBonus = (card) => {
    if (!card || !card.budget) return 0;
    const budgetNum = parseInt(card.budget.toString().replace(/\D/g, ''), 10) || 0;
    return Math.floor(budgetNum * 0.03);
  };

  const totalWallet = allCards.reduce((acc, card) => acc + computeBonus(card), 0);

  return (
    <div style={{ height: '100vh', width: '100%', color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <AnimatedBackground />
      
      {/* MAIN CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', zIndex: 2, overflow: 'hidden' }}>
        
        {/* COMPACT SINGLE-ROW TOP HEADER BAR */}
        <div style={{ 
          padding: '0.75rem 1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1.25rem',
          backgroundColor: 'rgba(18, 22, 38, 0.85)', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          backdropFilter: 'blur(20px)',
          zIndex: 10
        }}>
          {/* Left: Title + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.5px', color: '#fff', whiteSpace: 'nowrap' }}>
              ЗАЯВКИ И ЗАКАЗЫ
            </h1>

            {/* MANAGER WALLET */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'linear-gradient(90deg, rgba(34,197,94,0.15), rgba(16,185,129,0.25))', border: '1px solid rgba(34,197,94,0.35)', borderRadius: '12px', padding: '0.45rem 1rem' }}>
              <span style={{ fontSize: '1.3rem' }}>💰</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ваш кошелек (3%)</span>
                <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 900 }}>{totalWallet.toLocaleString()} ₸</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, maxWidth: '320px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.45rem 0.9rem' }}>
              <span style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Поиск по названию..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.86rem', width: '100%', outline: 'none', fontWeight: 600 }} 
              />
            </div>

            {/* WORK TYPE FILTER DROPDOWN */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.45rem 0.8rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 800 }}>🏗️ ВИД РАБОТ:</span>
              <select 
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
              >
                <option value="all" style={{ background: '#121626', color: '#fff' }}>Все виды работ</option>
                <option value="construction" style={{ background: '#121626', color: '#fff' }}>Строительство & Фундамент</option>
                <option value="design" style={{ background: '#121626', color: '#fff' }}>Проектирование & ПСД</option>
                <option value="engineering" style={{ background: '#121626', color: '#fff' }}>Инженерные решения & HVAC</option>
                <option value="machinery" style={{ background: '#121626', color: '#fff' }}>Аренда спецтехники</option>
              </select>
            </div>

            {/* PERIOD SEGMENT CONTROL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.25rem 0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 800, paddingLeft: '0.3rem' }}>📅</span>
              <button 
                onClick={() => setSelectedPeriod('day')}
                style={{ background: selectedPeriod === 'day' ? 'linear-gradient(90deg, #ec4899, #8b5cf6)' : 'transparent', border: 'none', color: '#fff', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                День
              </button>
              <button 
                onClick={() => setSelectedPeriod('week')}
                style={{ background: selectedPeriod === 'week' ? 'linear-gradient(90deg, #ec4899, #8b5cf6)' : 'transparent', border: 'none', color: '#fff', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Неделя
              </button>
              <button 
                onClick={() => setSelectedPeriod('month')}
                style={{ background: selectedPeriod === 'month' ? 'linear-gradient(90deg, #ec4899, #8b5cf6)' : 'transparent', border: 'none', color: '#fff', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Месяц
              </button>
              <button 
                onClick={() => setSelectedPeriod('all')}
                style={{ background: selectedPeriod === 'all' ? 'linear-gradient(90deg, #ec4899, #8b5cf6)' : 'transparent', border: 'none', color: '#fff', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Всё время
              </button>
            </div>
          </div>
          
          {/* Right: Analytics Toggle & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => setShowWorkflow(!showWorkflow)}
              style={{ 
                background: showWorkflow ? 'rgba(0, 163, 255, 0.2)' : 'rgba(255,255,255,0.06)', 
                border: showWorkflow ? '1px solid #00a3ff' : '1px solid rgba(255,255,255,0.12)', 
                color: showWorkflow ? '#00a3ff' : '#fff', 
                padding: '0.45rem 0.85rem', 
                borderRadius: '10px', 
                fontWeight: 800, 
                fontSize: '0.82rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Переключить схему бизнес-процесса"
            >
              🔄 Схема {showWorkflow ? '✓' : ''}
            </button>

            <button 
              onClick={() => setShowAnalytics(!showAnalytics)}
              style={{ 
                background: showAnalytics ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.06)', 
                border: showAnalytics ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.12)', 
                color: showAnalytics ? '#c084fc' : '#fff', 
                padding: '0.45rem 0.85rem', 
                borderRadius: '10px', 
                fontWeight: 800, 
                fontSize: '0.82rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Переключить панель аналитики"
            >
              📊 Аналитика {showAnalytics ? '✓' : ''}
            </button>

            <button 
              onClick={() => setShowLeadModal(true)} 
              style={{ background: 'linear-gradient(90deg, #0084ff, #0066cc)', color: '#fff', border: 'none', padding: '0.5rem 1.15rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 6px 18px rgba(0, 132, 255, 0.4)', whiteSpace: 'nowrap' }}
            >
               + Новый Лид
            </button>

            <button 
              onClick={() => setSelectedCard({
                id: Date.now().toString().slice(-4),
                title: 'Новая заявка на расчёт сметы',
                status: 'Новые',
                type: 'request',
                time: '+7 (707) 123-45-67',
                location: 'г. Астана, Левый берег',
                contractor: 'ИП "Строитель"',
                budget: '750 000 ₸',
                day: '14'
              })} 
              style={{ background: 'linear-gradient(90deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '0.5rem 1.15rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)', whiteSpace: 'nowrap' }}
            >
               + Добавить заявку
            </button>
          </div>
        </div>

        {/* WORKSPACE ROW: KANBAN BOARD + RIGHT ANALYTICS SIDEBAR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          
          {showWorkflow && (
            <div style={{ flexShrink: 0, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <WorkflowDiagramSection onAction={handleWorkflowAction} />
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
            
            {/* KANBAN BOARD CONTAINER */}
            <div 
            ref={(el) => { if (el) window.crmBoardRef = el; }}
            className="crm-kanban-board-container"
            style={{ 
              display: 'flex', 
              gap: '1.15rem', 
              padding: '1.25rem 1.5rem', 
              overflowX: 'auto', 
              overflowY: 'hidden',
              flex: 1, 
              alignItems: 'stretch',
              scrollBehavior: 'smooth'
            }}
          >
            {columns.map(col => {
              const colCards = allCards.filter(c => getColumnForStatus(c.status) === col.id);
              
              return (
                <div 
                  key={col.id} 
                  onDrop={(e) => handleDrop(e, col.id)}
                  onDragOver={allowDrop}
                  style={{
                    flex: '0 0 320px',
                    background: 'rgba(18, 22, 38, 0.75)',
                    backdropFilter: 'blur(24px)',
                    borderRadius: '22px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {/* Column Header */}
                  <div style={{ 
                    padding: '1.1rem 1.3rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color, boxShadow: `0 0 10px ${col.color}` }} />
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>{col.title}</span>
                    </div>
                    <div style={{ 
                      border: `1px solid ${col.color}50`, 
                      color: col.color, 
                      padding: '0.2rem 0.65rem', 
                      borderRadius: '10px', 
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      backgroundColor: `${col.color}18`
                    }}>
                      {colCards.length}
                    </div>
                  </div>
                  
                  {/* Cards Scrollable Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.1rem', flex: 1, overflowY: 'auto' }}>
                    {colCards.map(card => (
                      <div 
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onClick={() => setSelectedCard(card)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(16px)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          padding: '1.1rem',
                          cursor: 'grab',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                          position: 'relative',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {/* Top Row: ID & Type */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '0.65rem', fontWeight: 700 }}>
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>#{card.id}</span>
                          <span style={{ color: '#c084fc', fontWeight: 800 }}>{formatType(card.type)}</span>
                        </div>

                        {/* Title */}
                        <div style={{ fontWeight: 900, fontSize: '1.02rem', color: '#fff', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                          {card.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.85rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          📍 {card.location || 'Нет описания / локации'}
                        </div>

                        {/* Details Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.1rem', background: 'rgba(0,0,0,0.25)', padding: '0.65rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <span style={{ color: '#38bdf8' }}>📞</span> 
                            <span>{card.time || '+7 (700) 000-00-00'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                            <span style={{ color: '#c084fc' }}>👤</span> 
                            <span>{card.contractor || 'Без подрядчика'}</span>
                          </div>
                        </div>

                        {/* Bonus Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '10px', border: '1px dashed rgba(16, 185, 129, 0.3)', marginBottom: '0.85rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700 }}>🎁 Ваш бонус (3%)</span>
                          <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 900 }}>{computeBonus(card).toLocaleString()} ₸</span>
                        </div>

                        {/* Bottom Row: Amount & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                          <div style={{ color: '#34d399', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px' }}>
                            {card.budget || '0 ₸'}
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }} className="em-btn-glass-sm" style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                              ✎
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id, card.day); }} className="em-btn-glass-sm danger" style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }} title="Удалить заявку">
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Empty State Placeholder Drop Zone */}
                    {colCards.length === 0 && (
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        border: '2px dashed rgba(255,255,255,0.12)',
                        borderRadius: '16px',
                        padding: '2rem 1rem',
                        color: '#cbd5e1',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        margin: 'auto 0'
                      }}>
                        <span style={{ fontSize: '1.4rem', opacity: 0.7 }}>📥</span>
                        <span>Перетащите заявку сюда</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT ANALYTICS SIDEBAR PANEL (Gigantic 720px Wide Version) */}
          {showAnalytics && (
            <aside style={{
              width: '720px',
              flex: '0 0 720px',
              background: 'rgba(14, 18, 30, 0.94)',
              backdropFilter: 'blur(36px)',
              borderLeft: '1px solid rgba(255,255,255,0.18)',
              padding: '2.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
              overflowY: 'auto',
              zIndex: 5,
              boxShadow: '-20px 0 50px rgba(0,0,0,0.6)'
            }}>
              {/* Analytics Panel Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.85rem', letterSpacing: '0.6px' }}>
                  📈 АНАЛИТИКА И СТАТИСТИКА
                </h3>
                <button 
                  onClick={() => setShowAnalytics(false)} 
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#cbd5e1', borderRadius: '14px', width: '42px', height: '42px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Закрыть панель"
                >
                  ✕
                </button>
              </div>

              {/* Primary KPI Card: Total Budget */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(168, 85, 247, 0.28))', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '26px', padding: '2rem', boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ fontSize: '1.05rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.75rem' }}>
                  💰 Общий бюджет сделок в воронке
                </div>
                <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.5px', textShadow: '0 0 25px rgba(52, 211, 153, 0.4)', lineHeight: 1.1 }}>
                  14 880 000 ₸
                </div>
                <div style={{ fontSize: '1.05rem', color: '#34d399', fontWeight: 800, marginTop: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ background: 'rgba(52, 211, 153, 0.22)', padding: '0.4rem 0.9rem', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.45)', fontSize: '1.05rem' }}>▲ +18.4%</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>к прошлому месяцу</span>
                </div>
              </div>

              {/* Secondary KPI Grid (4 Columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '1.35rem' }}>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.45rem' }}>🎯 Конверсия воронки</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8' }}>78.2%</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.35rem' }}>7 из 9 сделок</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '1.35rem' }}>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.45rem' }}>⏱️ Средний цикл</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#c084fc' }}>3.2 дня</div>
                  <div style={{ fontSize: '0.82rem', color: '#34d399', marginTop: '0.35rem' }}>⚡ Быстрее на 0.8дн</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '1.35rem' }}>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.45rem' }}>💵 Средний чек</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f59e0b' }}>2.1M ₸</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.35rem' }}>на 1 объект</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '1.35rem' }}>
                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.45rem' }}>🏆 Закрыто</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#34d399' }}>1.8M ₸</div>
                  <div style={{ fontSize: '0.82rem', color: '#34d399', marginTop: '0.35rem' }}>Успешный этап</div>
                </div>
              </div>

              {/* SVG Donut Chart Section (Huge 200px Donut) */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '1.75rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🥧 Распределение воронки продаж</span>
                  <span style={{ fontSize: '0.92rem', color: '#c084fc', fontWeight: 800, background: 'rgba(192, 132, 252, 0.2)', padding: '0.35rem 1rem', borderRadius: '14px' }}>7 сделок</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '0.5rem' }}>
                  {/* Huge SVG Donut Chart (200px) */}
                  <div style={{ position: 'relative', width: '200px', height: '200px', flexShrink: 0 }}>
                    <svg width="200" height="200" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="0" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="14 86" strokeDashoffset="-28" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="43 57" strokeDashoffset="-42" />
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4.5" strokeDasharray="15 85" strokeDashoffset="-85" />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>14.8M</span>
                      <span style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 600 }}>₸ сум</span>
                    </div>
                  </div>

                  {/* Chart Legend (2 Columns Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', flex: 1, fontSize: '1.02rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.7rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
                        Новые
                      </span>
                      <span style={{ fontWeight: 900, color: '#fff' }}>2.1M ₸ (28%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.7rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                        В работе
                      </span>
                      <span style={{ fontWeight: 900, color: '#fff' }}>3.4M ₸ (23%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.7rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }} />
                        Дожим
                      </span>
                      <span style={{ fontWeight: 900, color: '#fff' }}>7.5M ₸ (34%)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '0.7rem 1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                        Успешно
                      </span>
                      <span style={{ fontWeight: 900, color: '#fff' }}>1.8M ₸ (15%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Revenue Bar Chart Section (Large 180px Height Bars) */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '1.75rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem' }}>
                  📊 Динамика выручки по месяцах (Май — Август)
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', height: '180px', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <span style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 800 }}>8.5M ₸</span>
                    <div style={{ width: '100%', height: '85px', background: 'linear-gradient(180deg, #6366f1, #4f46e5)', borderRadius: '12px 12px 6px 6px' }} />
                    <span style={{ fontSize: '0.92rem', color: '#94a3b8', fontWeight: 700 }}>Май</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <span style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 800 }}>11.2M ₸</span>
                    <div style={{ width: '100%', height: '115px', background: 'linear-gradient(180deg, #8b5cf6, #7c3aed)', borderRadius: '12px 12px 6px 6px' }} />
                    <span style={{ fontSize: '0.92rem', color: '#94a3b8', fontWeight: 700 }}>Июнь</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <span style={{ fontSize: '0.92rem', color: '#cbd5e1', fontWeight: 800 }}>12.6M ₸</span>
                    <div style={{ width: '100%', height: '135px', background: 'linear-gradient(180deg, #ec4899, #db2777)', borderRadius: '12px 12px 6px 6px' }} />
                    <span style={{ fontSize: '0.92rem', color: '#94a3b8', fontWeight: 700 }}>Июль</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <span style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 900 }}>14.8M ₸</span>
                    <div style={{ width: '100%', height: '160px', background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '12px 12px 6px 6px', boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)' }} />
                    <span style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 900 }}>Август ⚡</span>
                  </div>
                </div>
              </div>

              {/* Stage Progress Bars */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '1.75rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '1.25rem' }}>
                  🎯 Выполнение плана по этапам
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.02rem', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                      <span>Новые обращения клиентов</span>
                      <span style={{ fontWeight: 900, color: '#ef4444' }}>85% плана</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: '10px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.02rem', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                      <span>Подготовка ПСД & Инженерных смет</span>
                      <span style={{ fontWeight: 900, color: '#3b82f6' }}>92% плана</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '10px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.02rem', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                      <span>Заключение договоров (Дожим)</span>
                      <span style={{ fontWeight: 900, color: '#f59e0b' }}>68% плана</span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '10px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant Smart Insight Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))', border: '1px solid rgba(168, 85, 247, 0.6)', borderRadius: '26px', padding: '1.6rem', boxShadow: '0 12px 35px rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c084fc', fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.65rem' }}>
                  <span>✨ AI Smart Insight (ИИ Прогноз)</span>
                </div>
                <p style={{ margin: 0, fontSize: '1.02rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                  Сделка <strong>#1087 (Техэкспертиза)</strong> в стадии «Дожим» имеет <strong>89% вероятность</strong> успешной оплаты до конца текущей недели.
                </p>
              </div>

            </aside>
          )}

        </div>
        </div>
      </div>
      
      {selectedCard && (
        <DealCardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onSave={handleSaveCard} 
          currentUser={currentUser}
        />
      )}
      
      {showLeadModal && (
        <LeadCreateModal 
          onClose={() => setShowLeadModal(false)} 
          onSave={handleCreateAndSendLead} 
        />
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .crm-kanban-board-container::-webkit-scrollbar {
          height: 12px;
        }
        .crm-kanban-board-container::-webkit-scrollbar-track {
          background: rgba(18, 22, 38, 0.85);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin: 0 1.5rem;
        }
        .crm-kanban-board-container::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6);
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
          cursor: pointer;
        }
        .crm-kanban-board-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #f43f5e, #a855f7, #60a5fa);
          box-shadow: 0 0 16px rgba(236, 72, 153, 0.8);
        }
      `}} />
    </div>
  );
}
