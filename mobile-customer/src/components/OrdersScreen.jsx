import React, { useState } from 'react';
import { ClipboardList, MapPin, Phone, Hammer, CloudOff, Upload } from 'lucide-react';
import { Ticket, EmptyState, SkeletonList, formatMoney, Status, statusTone } from './ui/kit';
import { Sheet } from './Shell';

const FILTERS = [
  { id: 'active', label: 'Активные' },
  { id: 'done', label: 'Завершённые' },
  { id: 'all', label: 'Все' }
];

export default function OrdersScreen({ orders, loading, offline, error, loggedIn, pendingCount, onFlush, onNewOrder, onLogin, openOrder, setOpenOrder }) {
  const [f, setF] = useState('active');
  const list = orders.filter((o) => {
    const done = statusTone(o.status) === 'done' || statusTone(o.status) === 'lost';
    return f === 'all' || (f === 'done' ? done : !done);
  });

  return (
    <div className="qz-page">
      <div className="qz-segmented" role="tablist" aria-label="Фильтр заказов" style={{ marginBottom: 14 }}>
        {FILTERS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={f === x.id} onClick={() => setF(x.id)}>{x.label}</button>
        ))}
      </div>

      {!loggedIn && (
        <div className="qz-card cl-note" style={{ marginBottom: 12 }}>
          <CloudOff size={18} aria-hidden="true" />
          <span>Войдите, чтобы заказы отправлялись бригадам и были видны на сайте. <button type="button" className="cl-link" onClick={onLogin}>Войти</button></span>
        </div>
      )}
      {loggedIn && pendingCount > 0 && (
        <div className="qz-card cl-note" style={{ marginBottom: 12 }}>
          <Upload size={18} aria-hidden="true" />
          <span className="qz-grow">Не отправлено заказов: {pendingCount}.</span>
          <button type="button" className="qz-btn is-sm" onClick={onFlush}>Отправить</button>
        </div>
      )}
      {loggedIn && offline && error && <p className="qz-xs qz-faint" style={{ marginBottom: 10 }}>Показаны сохранённые данные: {error}</p>}

      {loading && !orders.length ? (
        <SkeletonList count={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={30} />}
          title={f === 'done' ? 'Завершённых заказов пока нет' : 'Здесь появятся ваши заказы'}
          text="Опишите работу или сделайте смету по фото — заявка уйдёт бригадам вашего города."
          action={<button type="button" className="qz-btn is-primary" onClick={onNewOrder}><Hammer size={18} /> Заказать работу</button>}
        />
      ) : (
        <div className="qz-stack">
          {list.map((o) => (
            <Ticket
              key={o.id}
              status={o.status}
              title={o.title}
              number={String(o.id).startsWith('local') ? null : o.id}
              meta={[{ icon: <MapPin size={14} />, text: o.location }, { icon: <Hammer size={14} />, text: o.contractor ? `Исполнитель: ${o.contractor}` : 'Ищем исполнителя' }]}
              amount={o.totalSum ? formatMoney(o.totalSum) : null}
              date={o.deadline}
              tag={o._pending ? <span className="qz-tag is-warn">Не отправлен</span> : null}
              onOpen={() => setOpenOrder(o)}
            />
          ))}
        </div>
      )}

      {openOrder && (
        <Sheet title={openOrder.title} sub={openOrder.location} onClose={() => setOpenOrder(null)}>
          <div className="qz-stack">
            <div className="qz-row"><Status status={openOrder.status} />{openOrder._pending && <span className="qz-tag is-warn">Ждёт отправки</span>}</div>
            <dl className="qz-kv qz-card">
              <dt>Начало работ</dt><dd>{openOrder.deadline || '—'}</dd>
              <dt>Бюджет</dt><dd>{openOrder.totalSum ? formatMoney(openOrder.totalSum) : 'по договорённости'}</dd>
              <dt>Исполнитель</dt><dd>{openOrder.contractor || 'ещё не выбран'}</dd>
              {openOrder.clientPhone && <><dt>Ваш телефон</dt><dd>{openOrder.clientPhone}</dd></>}
            </dl>
            {openOrder.estimateItems?.length > 0 && (
              <div className="qz-card">
                <h3 className="qz-h3" style={{ marginBottom: 8 }}>Смета</h3>
                <ul className="cl-items">
                  {openOrder.estimateItems.map((it, i) => (
                    <li key={i}><span className="qz-grow"><strong>{it.name}</strong><span className="qz-xs qz-faint">{(Math.round((Number(it.quantity) || 0) * 100) / 100).toLocaleString('ru-RU')} {it.unit}</span></span><span className="cl-item-sum">{formatMoney(it.total)}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {openOrder.stages?.length > 0 && (
              <div className="qz-card">
                <h3 className="qz-h3" style={{ marginBottom: 8 }}>Этапы</h3>
                <ul className="cl-bullets">{openOrder.stages.map((s, i) => <li key={i} className={s.done || s.status === 'done' ? 'is-done' : ''}>{s.title || s.name}</li>)}</ul>
              </div>
            )}
            <a className="qz-btn is-block" href="https://wa.me/77716983869" target="_blank" rel="noopener noreferrer"><Phone size={18} /> Написать в поддержку</a>
          </div>
        </Sheet>
      )}
    </div>
  );
}
