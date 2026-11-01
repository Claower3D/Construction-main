import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { localDateISO } from '../api/syncCore';

export const MACHINERY_TYPES = [
  { value: 'Манипулятор 10т', hint: 'подача колец ЖБИ' },
  { value: 'Экскаватор колесный', hint: 'копка котлована' },
  { value: 'Мини-экскаватор 3т', hint: 'стеснённые условия' },
  { value: 'Самосвал 20т', hint: 'вывоз грунта, щебень' },
  { value: 'Ассенизатор 10м³', hint: 'откачка старой ямы' },
  { value: 'Гидромолот', hint: 'скала, бетон, асфальт' }
];

/** Machinery request form. If `orders` is passed, the user picks the object; otherwise `orderId` is fixed. */
export default function MachineryForm({ orders, orderId, onSubmit }) {
  const [selectedOrder, setSelectedOrder] = useState(orderId || orders?.[0]?.id || '');
  const [type, setType] = useState(MACHINERY_TYPES[0].value);
  const [date, setDate] = useState(() => localDateISO());
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const target = orderId || selectedOrder;
  const submit = async (e) => {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    try { await onSubmit(target, type, date, time, note.trim()); setNote(''); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--sp-3)' }}>
      {orders && (
        <div className="qz-field">
          <label className="qz-label" htmlFor="mach-order">Объект</label>
          <select id="mach-order" className="qz-select" value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}>
            {orders.length === 0 && <option value="">Нет нарядов</option>}
            {orders.map(o => <option key={o.id} value={o.id}>{o.leadNum ? `№ ${o.leadNum}, ` : ''}{o.title}</option>)}
          </select>
        </div>
      )}
      <div className="qz-field">
        <span className="qz-label" id="mach-type-label">Техника</span>
        <div role="radiogroup" aria-labelledby="mach-type-label" style={{ display: 'grid', gap: 6 }}>
          {MACHINERY_TYPES.map(m => {
            const on = type === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setType(m.value)}
                style={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 'var(--r-md)', border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}`, background: on ? 'var(--accent-soft)' : 'var(--surface)', color: 'var(--text)', textAlign: 'left' }}
              >
                <Truck size={18} style={{ color: on ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }} />
                <span className="qz-grow"><b style={{ fontWeight: 600 }}>{m.value}</b> <span className="qz-small qz-faint">{m.hint}</span></span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="qz-grid-2">
        <div className="qz-field">
          <label className="qz-label" htmlFor="mach-date">Дата</label>
          <input id="mach-date" type="date" className="qz-input" value={date} min={localDateISO()} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="qz-field">
          <label className="qz-label" htmlFor="mach-time">Время подачи</label>
          <input id="mach-time" type="time" className="qz-input" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>
      <div className="qz-field">
        <label className="qz-label" htmlFor="mach-note">Комментарий для диспетчера</label>
        <input id="mach-note" className="qz-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Подъезд, объём работ, контакт на месте" />
      </div>
      <button type="submit" className="qz-btn is-primary is-block" disabled={busy || !target}>
        <Truck size={18} /> {busy ? 'Отправляем…' : 'Заказать технику'}
      </button>
    </form>
  );
}
