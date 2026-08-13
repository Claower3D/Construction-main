import React, { useState, useEffect } from 'react';
import DealCardModal from './DealCardModal';
import AnimatedBackground from './AnimatedBackground';
import '../index.css';

const MOCK_AMOUNTS = {
  active_project: '1 250 000 ₸',
  work_stage: '450 000 ₸',
  deadline: '820 000 ₸',
  request: '120 000 ₸',
};

export default function CrmPage({ onBackToHome, currentUser }) {
  const [events, setEvents] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('qazgost_calendar_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse CRM events', e);
      }
    }
  }, []);

  const saveEvents = (newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('qazgost_calendar_events', JSON.stringify(newEvents));
  };

  const allCards = Object.entries(events).flatMap(([day, dayEvents]) =>
    dayEvents.map(evt => ({ ...evt, day }))
  ).filter(card => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (card.title && card.title.toLowerCase().includes(q)) ||
      (card.contractor && card.contractor.toLowerCase().includes(q)) ||
      (card.location && card.location.toLowerCase().includes(q)) ||
      (card.time && card.time.toLowerCase().includes(q)) ||
      (card.id && String(card.id).toLowerCase().includes(q))
    );
  });

  const columns = [
    { id: 'Новые', title: 'Новые', color: '#ef4444' },
    { id: 'В работе', title: 'В работе', color: '#3b82f6' },
    { id: 'Дожим', title: 'Дожим', color: '#f59e0b' },
    { id: 'Менеджер ОП', title: 'Менеджер ОП', color: '#38bdf8' },
    { id: 'РОП', title: 'РОП', color: '#a855f7' },
    { id: 'Финансист', title: 'Финансист', color: '#06b6d4' },
    { id: 'Успешно', title: 'Успешно', color: '#22c55e' },
    { id: 'Отказ', title: 'Отказ', color: '#ef4444' },
  ];

  const getColumnForStatus = (status) => {
    if (!status) return 'Новые';
    const s = status.toLowerCase();
    if (s.includes('нов') || s.includes('запланировано')) return 'Новые';
    if (s.includes('работ') || s.includes('процесс')) return 'В работе';
    if (s.includes('дожим')) return 'Дожим';
    if (s.includes('менедж')) return 'Менеджер ОП';
    if (s.includes('роп')) return 'РОП';
    if (s.includes('финанс')) return 'Финансист';
    if (s.includes('успеш') || s.includes('завершено')) return 'Успешно';
    if (s.includes('отказ') || s.includes('отмен')) return 'Отказ';
    
    // Mapping calendar specific statuses to the new columns if they don't match exactly
    if (s.includes('ожидает')) return 'Дожим';
    if (s.includes('проверк')) return 'РОП';
    
    return 'Новые';
  };

  const handleDragStart = (e, card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    try {
      const cardData = JSON.parse(e.dataTransfer.getData('application/json'));
      const day = cardData.day;
      
      const newEvents = { ...events };
      if (newEvents[day]) {
        newEvents[day] = newEvents[day].map(evt => {
          if (evt.id === cardData.id) {
            return { ...evt, status: targetColumnId }; // Update status to match column
          }
          return evt;
        });
        saveEvents(newEvents);
      }
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

  const handleSaveCard = (updatedCard) => {
    const day = updatedCard.day;
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

  return (
    <div style={{ minHeight: '100vh', color: '#fff', display: 'flex', position: 'relative', zIndex: 1, backgroundColor: '#05070a' }}>
      <AnimatedBackground />
      
      {/* SIDEBAR (Matches second screenshot) */}
      <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(11, 15, 25, 0.7)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', paddingTop: '2rem', zIndex: 2 }}>
        
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem', cursor: 'pointer' }} onClick={onBackToHome}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>←</span>
            <span>На главную</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>☷</span>
            <span>Главная панель</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>📊</span>
            <span>Аналитика и статистика</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#22c55e', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #22c55e', backgroundColor: 'rgba(34, 197, 94, 0.05)', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>📄</span>
            <span>Список заявок / заказов</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>👥</span>
            <span>Управление клиентами</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', cursor: 'pointer', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💬</span>
              <span>История переписки</span>
            </div>
            <span style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>2</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa', fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 1rem', borderRadius: '12px', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
            <span>Настройка пользователей</span>
          </div>
        </div>
      </div>

      {/* MAIN CRM AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2 }}>
        
        {/* HEADER SECTION (Top Title) */}
        <div style={{ padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'rgba(11, 15, 25, 0.4)', backdropFilter: 'blur(5px)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Заявки и заказы</h1>
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Управление поступающими обращениями клиентов, распределение задач и бюджетирование</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               📥 Экспорт CSV
            </button>
            <button 
              onClick={() => setSelectedCard({
                id: Date.now().toString().slice(-4),
                title: 'Новая заявка',
                status: 'Новые',
                type: 'request',
                time: '',
                location: '',
                contractor: '',
                budget: 0,
                day: new Date().getDate().toString()
              })} 
              style={{ background: '#22c55e', color: '#000', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
               + Добавить заявку
            </button>
          </div>
        </div>
        
        {/* FILTERS & SEARCH BAR */}
        <div style={{ padding: '0 2.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(24, 24, 27, 0.5)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.8rem 1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, color: '#71717a' }}>
              <span>🔍</span>
              <input 
                type="text" 
                placeholder="Поиск по имени, телефону, тексту..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', width: '100%', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#71717a', fontWeight: 600, letterSpacing: '0.5px' }}>СТАТУС:</span>
                <span style={{ color: '#fff', cursor: 'pointer' }}>Все статусы ▾</span>
              </div>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#71717a', fontWeight: 600, letterSpacing: '0.5px' }}>ИСТОЧНИК:</span>
                <span style={{ color: '#fff', cursor: 'pointer' }}>Все источники ▾</span>
              </div>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ☷ Канбан
                </button>
                <button style={{ background: 'transparent', color: '#71717a', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ☰ Таблица
                </button>
              </div>
            </div>

          </div>
        </div>

      {/* KANBAN BOARD */}
      <div style={{ 
        display: 'flex', gap: '1rem', padding: '2rem', overflowX: 'auto', flex: 1, 
        alignItems: 'flex-start'
      }}>
        {columns.map(col => {
          const colCards = allCards.filter(c => getColumnForStatus(c.status) === col.id);
          
          return (
            <div 
              key={col.id} 
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={allowDrop}
              style={{
                flex: '0 0 300px',
                background: 'rgba(15, 23, 42, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                minHeight: '70vh',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Column Header */}
              <div style={{ 
                padding: '1.2rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f4f4f5' }}>{col.title}</span>
                </div>
                <div style={{ 
                  border: `1px solid ${col.color}40`, 
                  color: col.color, 
                  padding: '1px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: `${col.color}10`
                }}>
                  {colCards.length}
                </div>
              </div>
              
              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1.2rem 1.2rem 1.2rem', flex: 1 }}>
                {colCards.map(card => (
                  <div 
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card)}
                    onClick={() => setSelectedCard(card)}
                    style={{
                      background: 'rgba(17, 24, 39, 0.7)',
                      backdropFilter: 'blur(5px)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '1.2rem',
                      cursor: 'grab',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: ID & Type */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#71717a', marginBottom: '0.8rem', fontWeight: 500 }}>
                      <span>#{card.id}</span>
                      <span>{formatType(card.type)}</span>
                    </div>

                    {/* Title & Subtitle */}
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {card.location || 'Нет описания / локации'}
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
                        <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>📞</span> 
                        <span>{card.time || '+7 (700) 000-00-00'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#a1a1aa' }}>
                        <span style={{ color: '#71717a', fontSize: '0.9rem' }}>👤</span> 
                        <span>{card.contractor || 'Без подрядчика'}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Amount & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ color: '#00ff66', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                        {MOCK_AMOUNTS[card.type] || '150 000 ₸'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}>
                           ✎
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); /* optional delete logic */ }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                           🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Empty State Placeholder */}
                {colCards.length === 0 && (
                  <div style={{ 
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    color: '#3f3f46', fontSize: '0.85rem', fontWeight: 500, pointerEvents: 'none'
                  }}>
                    Перетащите заявку сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
        {selectedCard && (
          <DealCardModal 
            card={selectedCard} 
            onClose={() => setSelectedCard(null)} 
            onSave={handleSaveCard} 
            currentUser={currentUser}
          />
        )}
      
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}} />
      </div>
    </div>
  );
}
