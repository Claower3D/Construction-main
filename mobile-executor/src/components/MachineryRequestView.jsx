import React, { useState } from 'react';
import { Truck, Calendar, Clock, CheckCircle2, AlertCircle, Plus, Phone } from 'lucide-react';

export default function MachineryRequestView({ orders = [], onRequestMachinery }) {
  const [selectedOrder, setSelectedOrder] = useState(orders[0]?.id || '');
  const [machType, setMachType] = useState('Манипулятор 10т');
  const [machDate, setMachDate] = useState(new Date().toISOString().split('T')[0]);
  const [machTime, setMachTime] = useState('10:00');
  const [machNote, setMachNote] = useState('');

  // Collect all machinery orders across all jobs
  const allMachinery = [];
  orders.forEach(o => {
    (o.machinery || []).forEach(m => {
      allMachinery.push({
        ...m,
        orderTitle: o.title,
        orderLocation: o.location,
        orderId: o.id
      });
    });
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      alert('Пожалуйста, выберите объект');
      return;
    }
    onRequestMachinery(selectedOrder, machType, machDate, machTime, machNote);
    setMachNote('');
    alert(`Заказ на ${machType} отправлен диспетчеру спецтехники!`);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.05) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#00e5ff', fontWeight: 800, textTransform: 'uppercase' }}>
            Спецтехника и автопарк
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            Заказ техники на объект
          </div>
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(0, 229, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00e5ff'
        }}>
          <Truck size={24} />
        </div>
      </div>

      {/* Order Form */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: '0 0 14px' }}>
          Новая заявка на подачу техники
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Объект назначения:
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              {orders.map(o => (
                <option key={o.id} value={o.id} style={{ background: '#060b17' }}>
                  #{o.leadNum || o.id} • {o.title} ({o.location || o.client})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Тип техники:
            </label>
            <select
              value={machType}
              onChange={(e) => setMachType(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px',
                color: '#00e5ff',
                fontSize: '0.84rem',
                fontWeight: 700,
                outline: 'none'
              }}
            >
              <option value="Манипулятор 10т">Манипулятор 10т (подача ЖБИ колец)</option>
              <option value="Экскаватор колесный">Экскаватор колесный (копка котлована)</option>
              <option value="Мини-экскаватор 3т">Мини-экскаватор 3т (стесненные условия)</option>
              <option value="Самосвал 20т (КамАЗ)">Самосвал 20т (вывоз грунта / щебень)</option>
              <option value="Ассенизатор 10м³">Ассенизатор 10м³ (откачка старых ям)</option>
              <option value="Гидромолот">Гидромолот (скала, бетон, асфальт)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Дата подачи:
              </label>
              <input
                type="date"
                value={machDate}
                onChange={(e) => setMachDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Время подачи:
              </label>
              <input
                type="time"
                value={machTime}
                onChange={(e) => setMachTime(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '9px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
              Комментарий для водителя / оператора:
            </label>
            <input
              type="text"
              placeholder="Узкий заезд, линии электропередач, заезд со двора..."
              value={machNote}
              onChange={(e) => setMachNote(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '10px',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            className="exec-glow-btn"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            <Plus size={16} />
            <span>Вызвать технику на объект</span>
          </button>
        </form>
      </div>

      {/* Active machinery orders */}
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
        Заказанная спецтехника ({allMachinery.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {allMachinery.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '14px',
            padding: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.84rem'
          }}>
            Техника пока не заказывалась
          </div>
        ) : (
          allMachinery.map((m, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(13, 21, 39, 0.85)',
                border: '1px solid rgba(0, 229, 255, 0.15)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                  {m.type}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#00e5ff', marginTop: '2px' }}>
                  📅 {m.date} в {m.time}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  📍 {m.orderTitle} ({m.orderLocation})
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                В графике
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}