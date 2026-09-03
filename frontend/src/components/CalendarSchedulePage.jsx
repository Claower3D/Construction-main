import React, { useState, useEffect } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';

export default function CalendarSchedulePage({ onBack, hideHeader = false, role = 'executor' }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState('inspection'); // 'inspection' | 'concrete' | 'machinery' | 'handover'
  const [newEventLocation, setNewEventLocation] = useState('г. Алматы, объект Самал-2');
  const [newEventEngineer, setNewEventEngineer] = useState('Куаныш Жумагулов (ГИП)');

  // Initial rich schedule events
  const [events, setEvents] = useState([
    {
      id: 'ev-1',
      title: '🔍 Выезд инженера ПТО на лазерные замеры',
      type: 'inspection',
      date: '2026-08-23',
      time: '10:00 - 12:30',
      location: 'г. Астана, ЖК Highvill Park, блок С',
      specialist: 'Куаныш Жумагулов (ГСЛ №0049182)',
      status: 'Подтверждено',
      badgeColor: '#38bdf8'
    },
    {
      id: 'ev-2',
      title: '🚜 Подача экскаватора Hitachi ZX240 и 2 самосвалов',
      type: 'machinery',
      date: '2026-08-24',
      time: '08:00 - 18:00',
      location: 'г. Алматы, коттеджный городок Ремизовка',
      specialist: 'Касымбек Жолдасов (Машинист 6 разряда)',
      status: 'В пути по GPS',
      badgeColor: '#f59e0b'
    },
    {
      id: 'ev-3',
      title: '🧱 Заливка монолитной плиты (Бетон М350, 48 м³)',
      type: 'concrete',
      date: '2026-08-26',
      time: '09:00 - 16:00',
      location: 'г. Караганда, ул. Ленина 42',
      specialist: 'Бригада №1 — Фундаменты (Ерлан Кусаинов)',
      status: 'Подготовка опалубки',
      badgeColor: '#10b981'
    },
    {
      id: 'ev-4',
      title: '📋 Освидетельствование скрытых работ (Акт АСР армирования)',
      type: 'inspection',
      date: '2026-08-27',
      time: '14:00 - 15:30',
      location: 'г. Астана, объект Батыс-2',
      specialist: 'Алексей Мельников (Технадзор)',
      status: 'Запланировано',
      badgeColor: '#8b5cf6'
    },
    {
      id: 'ev-5',
      title: '✍️ Финальная сдача этапа и подписание Акта КС-2',
      type: 'handover',
      date: '2026-08-29',
      time: '16:00 - 17:00',
      location: 'г. Алматы, строительный объект',
      specialist: 'Заказчик & Главный инженер',
      status: 'Ожидает приёмки',
      badgeColor: '#ec4899'
    }
  ]);

  // ── SERVER SYNC: Загрузка событий с сервера для кросс-устройственной синхронизации ──
  useEffect(() => {
    const fetchCalendarEvents = () => {
      fetch('/api/v1/crm/events')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.items && data.items.length > 0) {
            const calEvents = data.items
              .filter(e => e.type === 'request_engineering' || e.role === 'engineer' || e.type === 'work_stage')
              .map(e => ({
                id: e.id || `ev-${Date.now()}`,
                title: e.title || 'Событие',
                type: e.type === 'request_engineering' ? 'inspection' : (e.role === 'machinery' ? 'machinery' : 'concrete'),
                date: e.date || new Date().toISOString().split('T')[0],
                time: e.time ? `${e.time} - ${String(parseInt(e.time) + 2).padStart(2, '0')}:00` : '10:00 - 12:00',
                location: e.location || 'г. Алматы',
                specialist: e.contractor || e.assignedEngineer || 'Специалист',
                status: e.status === 'Новые' ? 'Запланировано' : (e.status === 'В работе' ? 'В пути' : e.status || 'Запланировано'),
                badgeColor: e.type === 'request_engineering' ? '#38bdf8' : (e.role === 'machinery' ? '#f59e0b' : '#10b981')
              }));
            if (calEvents.length > 0) {
              setEvents(prev => {
                const merged = [...prev];
                calEvents.forEach(ce => {
                  if (!merged.some(m => m.id === ce.id)) merged.push(ce);
                });
                return merged;
              });
            }
          }
        })
        .catch(() => {});
    };

    fetchCalendarEvents();

    // Поллинг каждые 5 секунд для синхронизации между устройствами
    const poll = setInterval(fetchCalendarEvents, 5000);
    return () => clearInterval(poll);
  }, []);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv = {
      id: `ev-${Date.now()}`,
      title: newEventTitle,
      type: newEventType,
      date: newEventDate,
      time: '10:00 - 12:00',
      location: newEventLocation,
      specialist: newEventEngineer,
      status: 'Запланировано',
      badgeColor: newEventType === 'concrete' ? '#10b981' : newEventType === 'machinery' ? '#f59e0b' : '#38bdf8'
    };

    setEvents([newEv, ...events]);

    // Отправка на сервер для синхронизации между устройствами
    fetch('/api/v1/crm/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newEv.id,
        title: newEv.title,
        date: newEv.date,
        time: '10:00',
        type: 'request_engineering',
        role: 'engineer',
        status: 'Новые',
        location: newEv.location,
        contractor: newEv.specialist,
        budget: '0 ₸'
      })
    }).catch(() => {});

    setShowAddModal(false);
    setNewEventTitle('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: hideHeader ? '0' : '1.5rem', color: '#fff' }}>
      {/* Top Header */}
      {!hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
              📅 Календарь выездов и график производства работ
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Синхронизированное расписание инспекций технадзора, подачи спецтехники и сдачи этапов СМР
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(90deg, #10b981, #059669)',
                border: 'none',
                color: '#fff',
                padding: '0.65rem 1.2rem',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              ➕ Запланировать выезд
            </button>
            {onBack && (
              <button 
                onClick={onBack}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.65rem 1.2rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700 }}
              >
                ← Назад
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Events Timeline & Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Timeline List */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '20px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Ближайшие выезды и события
            </h3>
            <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: 700 }}>
              {events.length} событий
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((ev) => (
              <div 
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                style={{
                  background: selectedEvent?.id === ev.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderLeft: `4px solid ${ev.badgeColor}`,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{ev.title}</strong>
                  <span style={{ fontSize: '0.72rem', background: `${ev.badgeColor}25`, color: ev.badgeColor, padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
                    {ev.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  <span>📅 {ev.date}</span>
                  <span>⏱️ {ev.time}</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                  📍 {ev.location}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem', fontWeight: 600 }}>
                  👷 {ev.specialist}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Event Details & Calendar Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Selected Event Card */}
          {selectedEvent ? (
            <div style={{ background: 'linear-gradient(145deg, rgba(20, 26, 48, 0.95), rgba(12, 16, 32, 0.98))', border: '1px solid rgba(246, 196, 83, 0.3)', borderRadius: '20px', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#f59e0b' }}>
                📌 Детали запланированного выезда
              </h3>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1.05rem', color: '#fff' }}>{selectedEvent.title}</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem', color: '#cbd5e1' }}>
                <div><strong>Дата и время:</strong> {selectedEvent.date} ({selectedEvent.time})</div>
                <div><strong>Адрес объекта:</strong> {selectedEvent.location}</div>
                <div><strong>Ответственный инженер / бригада:</strong> {selectedEvent.specialist}</div>
                <div><strong>Текущий статус:</strong> <span style={{ color: selectedEvent.badgeColor, fontWeight: 700 }}>{selectedEvent.status}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                <button
                  onClick={() => alert(`📞 Вызов диспетчера по объекту "${selectedEvent.location}"`)}
                  style={{ flex: 1, background: 'linear-gradient(90deg, #38bdf8, #2563eb)', border: 'none', color: '#fff', padding: '0.7rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  📞 Связаться с инженером
                </button>
                <button
                  onClick={() => alert(`🗺️ Маршрут к объекту передан в навигатор!`)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.7rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🗺️ Маршрут
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '20px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>👆</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Выберите событие из списка слева, чтобы просмотреть подробные данные или проложить маршрут</p>
            </div>
          )}

          {/* Quick Schedule Tips */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#34d399', fontSize: '0.95rem' }}>
              ⚡ Автоматические правила выездов QazGost:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <li>Инженер ПТО выезжает в течение 24 часов после заморозки Эскроу.</li>
              <li>Спецтехника прибывает на объект строго в выбранный интервал времени с GPS-маяком.</li>
              <li>Акт скрытых работ (АСР) подписывается в день заливки бетона или закрытия штроб.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Modal: Add New Visit / Inspection */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'linear-gradient(145deg, rgba(20, 26, 48, 0.98), rgba(12, 16, 32, 0.98))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '24px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 800 }}>➕ Запланировать выезд / этап</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Название события / работы:
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="например, Выезд технадзора на замеры фундамента"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    Дата проведения:
                  </label>
                  <input 
                    type="date" 
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    Тип события:
                  </label>
                  <select 
                    value={newEventType}
                    onChange={e => setNewEventType(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.88rem' }}
                  >
                    <option value="inspection">🔍 Инспекция / Замеры</option>
                    <option value="concrete">🧱 Бетонные работы</option>
                    <option value="machinery">🚜 Спецтехника</option>
                    <option value="handover">✍️ Сдача этапа (КС-2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Адрес объекта:
                </label>
                <input 
                  type="text" 
                  value={newEventLocation}
                  onChange={e => setNewEventLocation(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Ответственный специалист:
                </label>
                <input 
                  type="text" 
                  value={newEventEngineer}
                  onChange={e => setNewEventEngineer(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.7rem', color: '#fff', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Сохранить в график
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
