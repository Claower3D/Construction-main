import React from 'react';
import { Truck } from 'lucide-react';
import MachineryForm from './MachineryForm';
import { EmptyState } from './ui/kit';
import { localDateISO } from '../api/syncCore';

const MACH_STATUS = { ordered: 'заказана', confirmed: 'подтверждена', completed: 'отработала', cancelled: 'отменена' };

export default function MachineryRequestView({ orders = [], onRequestMachinery }) {
  const today = localDateISO();
  const activeOrders = orders.filter(o => o.status !== 'Завершено');
  const all = [];
  orders.forEach(o => (o.machinery || []).forEach(m => all.push({ ...m, orderTitle: o.title, orderLocation: o.location })));
  const upcoming = all.filter(m => (m.date || '') >= today).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const past = all.filter(m => (m.date || '') < today);

  const row = (m, i) => (
    <div key={m.id || i} className="qz-card" style={{ padding: 'var(--sp-3)', display: 'flex', gap: 10, alignItems: 'center' }}>
      <Truck size={20} className="qz-faint" style={{ flexShrink: 0 }} />
      <div className="qz-grow">
        <div className="qz-h3">{m.type}</div>
        <div className="qz-xs qz-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.orderTitle}</div>
        <div className="qz-xs qz-faint num">{m.date === today ? 'сегодня' : m.date} в {m.time}{m.comment ? `, ${m.comment}` : ''}</div>
      </div>
      <span className={`qz-status is-st-${m.status === 'completed' ? 'done' : (m.status === 'cancelled' ? 'lost' : 'progress')}`}>{MACH_STATUS[m.status] || m.status}</span>
    </div>
  );

  return (
    <div className="qz-page">
      <section className="qz-card">
        <h2 className="qz-h2" style={{ marginBottom: 'var(--sp-3)' }}>Заказать спецтехнику</h2>
        {activeOrders.length === 0
          ? <div className="qz-small qz-muted">Нет нарядов в работе — технику заказывают под конкретный объект.</div>
          : <MachineryForm orders={activeOrders} onSubmit={onRequestMachinery} />}
      </section>

      <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
        <h2 className="qz-h2">Ближайшие подачи</h2>
        <span className="qz-small qz-faint num">{upcoming.length}</span>
      </div>
      {upcoming.length === 0
        ? <EmptyState icon={<Truck size={28} />} title="Заявок нет" text="Заказанная техника появится здесь с датой и временем подачи." />
        : <div style={{ display: 'grid', gap: 8 }}>{upcoming.map(row)}</div>}

      {past.length > 0 && (
        <>
          <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
            <h2 className="qz-h3">Прошедшие</h2>
            <span className="qz-small qz-faint num">{past.length}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>{past.slice(0, 10).map(row)}</div>
        </>
      )}
    </div>
  );
}
