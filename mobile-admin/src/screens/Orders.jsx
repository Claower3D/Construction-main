import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search, MapPin, User } from 'lucide-react';
import { api, formatMoney, formatDate, formatInt, ORDER_STATUSES } from '../api/adminApi';
import { Empty, LoadError, Skeleton, Sheet, Kv, Status, PageHead } from '../components/kit';

function OrderSheet({ order, onClose, onChanged, toast }) {
  const [o, setO] = useState(order);
  const [status, setStatus] = useState(order.status || '');
  const [busy, setBusy] = useState(false);
  const items = Array.isArray(o.estimateItems) ? o.estimateItems : [];
  const stages = Array.isArray(o.stages) ? o.stages : [];
  const statuses = ORDER_STATUSES.includes(o.status) || !o.status ? ORDER_STATUSES : [o.status, ...ORDER_STATUSES];

  const save = async () => {
    setBusy(true);
    try {
      const next = await api.updateOrder(o.id, { status });
      const merged = { ...o, ...(next && next.order ? next.order : {}), status };
      setO(merged); onChanged(merged); toast('Статус заказа изменён');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Sheet title={o.title || `Заказ ${o.id}`} sub={`№ ${o.id} · создан ${formatDate(o.createdAt)}`} onClose={onClose}>
      <div className="qz-stack">
        <div className="qz-row" style={{ justifyContent: 'space-between' }}>
          <Status status={o.status} />
          <span className="qz-amount" style={{ color: 'var(--gold)' }}>{o.totalSum ? formatMoney(o.totalSum) : 'сумма не указана'}</span>
        </div>
        <Kv rows={[
          ['Клиент', o.clientName],
          ['Телефон', o.clientPhone ? <a href={`tel:${o.clientPhone.replace(/[^+\d]/g, '')}`}>{o.clientPhone}</a> : ''],
          ['Адрес', o.location],
          ['Вид работ', o.jobType || o.type],
          ['Подрядчик', o.contractor],
          ['Срок', o.deadline || o.time],
          ['Технадзор', o.engineerId ? 'назначен' : 'не назначен'],
          ['Строк сметы', items.length ? formatInt(items.length) : ''],
          ['Этапов', stages.length ? formatInt(stages.length) : ''],
        ]} />
        {items.length > 0 && (
          <details className="qga-details">
            <summary>Смета ({items.length})</summary>
            <ul className="qga-plain">
              {items.slice(0, 60).map((it, i) => (
                <li key={i}><span>{it.name || 'Позиция'}</span><span className="num qz-muted">{it.qty ?? ''} {it.unit || ''} {it.sum ? `· ${formatMoney(it.sum)}` : ''}</span></li>
              ))}
            </ul>
          </details>
        )}
        <hr className="qz-divider" />
        <label className="qz-field">
          <span className="qz-label">Статус</span>
          <select className="qz-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="qz-btn is-primary is-block" disabled={busy || status === (o.status || '')} onClick={save}>Сохранить статус</button>
      </div>
    </Sheet>
  );
}

export default function Orders({ preset, toast, refreshKey }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(preset?.status || '');
  const [open, setOpen] = useState(null);

  useEffect(() => { if (preset?.status !== undefined) setStatus(preset.status); }, [preset]);
  const load = useCallback(() => {
    setError('');
    api.orders().then((list) => setItems(Array.isArray(list) ? list : [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const counts = useMemo(() => {
    const c = {};
    (items || []).forEach((o) => { c[o.status || '—'] = (c[o.status || '—'] || 0) + 1; });
    return c;
  }, [items]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || [])
      .filter((o) => !status || (o.status || '—') === status)
      .filter((o) => !s || [o.title, o.clientName, o.clientPhone, o.location, String(o.id)].some((v) => String(v || '').toLowerCase().includes(s)))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [items, q, status]);

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Заказы" sub={items ? `${formatInt(items.length)} всего · все заказы платформы` : ''} />
      <label className="qz-search" style={{ margin: 0 }}>
        <Search size={18} aria-hidden="true" />
        <span className="qz-sr-only">Поиск заказов</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название, клиент, телефон, адрес, №" />
      </label>
      {items && (
        <div className="qz-chips" role="tablist" aria-label="Статус">
          <button type="button" role="tab" aria-selected={!status} className={`qz-chip${!status ? ' is-active' : ''}`} onClick={() => setStatus('')}>Все <span className="qz-count">{items.length}</span></button>
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} className={`qz-chip${status === s ? ' is-active' : ''}`} onClick={() => setStatus(s)}>{s} <span className="qz-count">{n}</span></button>
          ))}
        </div>
      )}
      {error && <LoadError error={error} onRetry={load} />}
      {!items && !error && <Skeleton lines={5} />}
      {items && shown.length === 0 && <Empty icon={ClipboardList} title={items.length ? 'Ничего не нашли' : 'Заказов пока нет'} text={items.length ? 'Измените поиск или статус.' : 'Заказы появятся, когда клиенты оформят их на сайте или в приложении.'} />}
      <div className="qga-list">
        {shown.map((o) => (
          <button key={o.id} type="button" className="qga-order" onClick={() => setOpen(o)}>
            <span className="qz-row" style={{ justifyContent: 'space-between' }}>
              <Status status={o.status} />
              <span className="qz-xs qz-faint num">№ {o.id} · {formatDate(o.createdAt)}</span>
            </span>
            <span className="qga-row-title">{o.title || 'Без названия'}</span>
            <span className="qz-row qz-xs qz-muted" style={{ gap: 12, flexWrap: 'wrap' }}>
              {o.clientName && <span className="qz-row" style={{ gap: 4 }}><User size={14} />{o.clientName}</span>}
              {o.location && <span className="qz-row" style={{ gap: 4 }}><MapPin size={14} />{o.location}</span>}
            </span>
            <span className="qga-order-sum num">{o.totalSum ? formatMoney(o.totalSum) : '—'}</span>
          </button>
        ))}
      </div>
      {open && <OrderSheet order={open} onClose={() => setOpen(null)} onChanged={(n) => setItems((l) => l.map((x) => (x.id === n.id ? n : x)))} toast={toast} />}
    </div>
  );
}
