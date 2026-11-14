// Данные сервера, которых не было в первой версии админки:
// сделки CRM, клиенты/компании/бригады, брони техники, переписка по заказам, предложения материалов.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Briefcase, MessagesSquare, Truck, Package, Contact, Send } from 'lucide-react';
import { api, formatMoney, formatDate, formatInt } from '../api/adminApi';
import { Empty, LoadError, Skeleton, PageHead, Sheet, Kv, Status } from '../components/kit';

export const DEAL_STAGES = ['Новые', 'В работе', 'Дожим', 'Успешно', 'Отказ'];
const DEAL_ROLES = { engineer: 'Инженер', executor: 'Исполнитель', machinery: 'Спецтехника', customer: 'Заказчик', manager: 'Менеджер' };

function useData(fn, refreshKey) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); return fn().then(setData).catch((e) => setError(e.message)); }, [fn]);
  useEffect(() => { load(); }, [load, refreshKey]);
  return { data, setData, error, load };
}
const money = (v) => { const n = Number(String(v || '').replace(/[^\d.]/g, '')); return n ? formatMoney(n) : '—'; };
const notesText = (n) => {
  if (!n) return '';
  if (typeof n === 'string') return n;
  if (Array.isArray(n)) return n.map((x) => (typeof x === 'string' ? x : x.text || '')).filter(Boolean).join('\n');
  return n.text || '';
};

// ── Сделки CRM ───────────────────────────────────────────
function DealSheet({ deal, onClose, onSaved, toast }) {
  const [status, setStatus] = useState(deal.status || 'Новые');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const saved = await api.saveCrmEvent({ ...deal, status });
      onSaved({ ...deal, ...(saved && saved.id ? saved : {}), status }); toast('Этап сделки изменён');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  const notes = notesText(deal.notes);
  return (
    <Sheet title={deal.title || 'Сделка'} sub={`${deal.leadNum ? `№ ${deal.leadNum} · ` : ''}${formatDate(deal.date)}`} onClose={onClose}>
      <div className="qz-stack">
        <div className="qz-row" style={{ justifyContent: 'space-between' }}><Status status={deal.status} /><span className="qz-amount" style={{ color: 'var(--gold)' }}>{money(deal.budget)}</span></div>
        <Kv rows={[
          ['Направление', DEAL_ROLES[deal.role] || deal.role],
          ['Телефон', deal.phone ? <a href={`tel:${String(deal.phone).replace(/[^+\d]/g, '')}`}>{deal.phone}</a> : ''],
          ['Адрес', deal.location],
          ['Время', deal.time],
          ['Исполнитель', deal.contractor],
          ['Создал', deal.createdBy],
          ['Изменена', formatDate(deal.updatedAt, true)],
        ]} />
        {deal.description && <p className="qz-small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{deal.description}</p>}
        {notes && <div className="qz-card qz-small" style={{ whiteSpace: 'pre-wrap' }}>{notes}</div>}
        <hr className="qz-divider" />
        <label className="qz-field">
          <span className="qz-label">Этап воронки</span>
          <select className="qz-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
            {(DEAL_STAGES.includes(deal.status) || !deal.status ? DEAL_STAGES : [deal.status, ...DEAL_STAGES]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="qz-btn is-primary is-block" disabled={busy || status === deal.status} onClick={save}>Сохранить этап</button>
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>Изменение сразу видно менеджеру и в приложениях инженера и исполнителя.</p>
      </div>
    </Sheet>
  );
}

export function Deals({ toast, refreshKey }) {
  const fn = useCallback(() => api.crmEvents(), []);
  const { data, setData, error, load } = useData(fn, refreshKey);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [open, setOpen] = useState(null);
  const items = data?.items || null;
  const counts = useMemo(() => { const c = {}; (items || []).forEach((d) => { c[d.status || '—'] = (c[d.status || '—'] || 0) + 1; }); return c; }, [items]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter((d) => !stage || (d.status || '—') === stage)
      .filter((d) => !s || [d.title, d.phone, d.location, d.contractor, d.leadNum].some((v) => String(v || '').toLowerCase().includes(s)))
      .sort((a, b) => String(b.updatedAt || b.date || '').localeCompare(String(a.updatedAt || a.date || '')));
  }, [items, q, stage]);
  const sum = shown.reduce((s, d) => s + (Number(String(d.budget || '').replace(/[^\d.]/g, '')) || 0), 0);

  return (
    <div className="qz-page qz-stack">
      <PageHead sub={items ? `${formatInt(items.length)} сделок · в выборке на ${formatMoney(sum)}` : ''} />
      <label className="qz-search" style={{ margin: 0 }}><Search size={18} aria-hidden="true" /><span className="qz-sr-only">Поиск сделок</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название, телефон, адрес, исполнитель" /></label>
      {items && (
        <div className="qz-chips" role="tablist" aria-label="Этап">
          <button type="button" role="tab" aria-selected={!stage} className={`qz-chip${!stage ? ' is-active' : ''}`} onClick={() => setStage('')}>Все <span className="qz-count">{items.length}</span></button>
          {[...DEAL_STAGES, ...Object.keys(counts).filter((k) => !DEAL_STAGES.includes(k))].filter((k) => counts[k]).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={stage === k} className={`qz-chip${stage === k ? ' is-active' : ''}`} onClick={() => setStage(k)}>{k} <span className="qz-count">{counts[k]}</span></button>
          ))}
        </div>
      )}
      {error && <LoadError error={error} onRetry={load} />}
      {!items && !error && <Skeleton lines={4} />}
      {items && shown.length === 0 && <Empty icon={Briefcase} title={items.length ? 'Ничего не нашли' : 'Сделок пока нет'} text="Сделки создают менеджер и приложения инженера и исполнителя." />}
      <div className="qga-list">
        {shown.map((d) => (
          <button key={d.id} type="button" className="qga-order" onClick={() => setOpen(d)}>
            <span className="qz-row" style={{ justifyContent: 'space-between' }}><Status status={d.status} /><span className="qz-xs qz-faint">{formatDate(d.date)}</span></span>
            <span className="qga-row-title">{d.title || 'Без названия'}</span>
            <span className="qz-xs qz-muted">{[DEAL_ROLES[d.role] || d.role, d.location, d.phone].filter(Boolean).join(' · ') || '—'}</span>
            <span className="qga-order-sum num">{money(d.budget)}</span>
          </button>
        ))}
      </div>
      {open && <DealSheet deal={open} toast={toast} onClose={() => setOpen(null)}
        onSaved={(n) => { setOpen(n); setData((x) => ({ ...x, items: x.items.map((d) => (d.id === n.id ? n : d)) })); }} />}
    </div>
  );
}

// ── Клиенты, компании, бригады ─────────────────────────────
const DIR_TABS = [{ id: 'clients', label: 'Клиенты' }, { id: 'companies', label: 'Компании' }, { id: 'brigades', label: 'Бригады' }];
export function Directory({ refreshKey }) {
  const [tab, setTab] = useState('clients');
  const fn = useCallback(() => (tab === 'clients' ? api.crmClients() : tab === 'companies' ? api.crmCompanies() : api.crmBrigades()), [tab]);
  const { data, error, load } = useData(fn, refreshKey);
  const items = data ? (Array.isArray(data) ? data : data.items || []) : null;
  return (
    <div className="qz-page qz-stack">
      <div className="qz-segmented" role="tablist" aria-label="Справочник">
        {DIR_TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      {error && <LoadError error={error} onRetry={load} />}
      {!items && !error && <Skeleton lines={4} />}
      {items && items.length === 0 && <Empty icon={Contact} title="Список пуст" />}
      <div className="qga-list">
        {(items || []).map((x) => (
          <div key={x.id} className="qga-order">
            <span className="qz-row" style={{ justifyContent: 'space-between' }}>
              <span className="qga-row-title">{x.name || x.title || 'Без названия'}</span>
              {x.rating ? <span className="qz-tag num">★ {String(x.rating).replace('.', ',')}</span> : x.status ? <Status status={x.status} label={x.status === 'active' ? 'активен' : x.status} /> : null}
            </span>
            <span className="qz-xs qz-muted">{[x.phone && <a key="p" href={`tel:${String(x.phone).replace(/[^+\d]/g, '')}`}>{x.phone}</a>, x.email, x.city, x.bin && `БИН ${x.bin}`, x.type, x.source].filter(Boolean).reduce((acc, v, i) => (i ? [...acc, ' · ', v] : [v]), [])}</span>
            {(x.notes || x.foreman || x.size || x.skills || x.director || x.address) && (
              <span className="qz-xs qz-faint">{[x.director && `руководитель: ${x.director}`, x.address, x.foreman && `бригадир: ${x.foreman}`, x.size && `${x.size} чел.`, x.skills, typeof x.notes === 'string' && x.notes].filter(Boolean).join(' · ')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Брони техники ────────────────────────────────────────
const BOOKING_LABEL = { pending: 'Ждёт подтверждения', confirmed: 'Подтверждена', completed: 'Завершена', cancelled: 'Отменена' };
const BOOKING_NEXT = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] };
export function Bookings({ toast, refreshKey }) {
  const fn = useCallback(() => api.bookings(), []);
  const { data, setData, error, load } = useData(fn, refreshKey);
  const [busy, setBusy] = useState('');
  const list = Array.isArray(data) ? data : data?.items || null;
  const change = async (b, status) => {
    setBusy(b.id);
    try {
      const nb = await api.updateBooking(b.id, status);
      setData((arr) => (Array.isArray(arr) ? arr : arr.items).map((x) => (x.id === b.id ? { ...x, ...nb, status } : x)));
      toast(`Бронь: ${BOOKING_LABEL[status].toLowerCase()}`);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };
  return (
    <div className="qz-page qz-stack">
      <PageHead sub={list ? `${formatInt(list.length)} броней всех пользователей` : ''} />
      {error && <LoadError error={error} onRetry={load} />}
      {!list && !error && <Skeleton lines={3} />}
      {list && list.length === 0 && <Empty icon={Truck} title="Броней пока нет" text="Брони появляются, когда заказчики арендуют технику на сайте." />}
      <div className="qga-list">
        {(list || []).map((b) => (
          <div key={b.id} className="qga-order">
            <span className="qz-row" style={{ justifyContent: 'space-between' }}><Status status={BOOKING_LABEL[b.status] || b.status} /><span className="qz-xs qz-faint">{formatDate(b.createdAt)}</span></span>
            <span className="qga-row-title">{b.equipmentName || 'Техника'}</span>
            <span className="qz-xs qz-muted">{formatDate(b.dateFrom)} — {formatDate(b.dateTo)} · {b.shifts} смен · {b.renterName || '—'}{b.renterPhone ? ` · ${b.renterPhone}` : ''}</span>
            <span className="qga-order-sum num">{formatMoney(b.total)}</span>
            {BOOKING_NEXT[b.status] && (
              <span className="qga-actions" style={{ justifyContent: 'flex-start' }}>
                {BOOKING_NEXT[b.status].map((st) => (
                  <button key={st} type="button" disabled={busy === b.id} className={`qz-btn is-sm${st === 'cancelled' ? ' is-ghost' : ''}`} onClick={() => change(b, st)}>
                    {st === 'confirmed' ? 'Подтвердить' : st === 'completed' ? 'Завершить' : 'Отменить'}
                  </button>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Переписка по заказам ─────────────────────────────────
function Thread({ orderId, me, onClose, toast, refreshKey }) {
  const fn = useCallback(() => api.chat(orderId), [orderId]);
  const { data, setData, error, load } = useData(fn, refreshKey);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { if (end.current) end.current.scrollIntoView({ block: 'end' }); }, [data]);
  const send = async (e) => {
    e.preventDefault();
    const t = text.trim(); if (!t) return;
    setBusy(true);
    try { const m = await api.sendChat(orderId, t, me); setData((arr) => [...(arr || []), m && m.id ? m : { id: Date.now(), text: t, senderName: me?.name, senderRole: 'admin', createdAt: new Date().toISOString() }]); setText(''); } catch (er) { toast(er.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Sheet title={`Переписка · заказ № ${orderId}`} onClose={onClose}>
      <div className="qz-stack">
        {error && <LoadError error={error} onRetry={load} />}
        {(data || []).map((m) => (
          <div key={m.id} className={`qga-msg${m.senderRole === 'admin' || m.senderRole === 'manager' ? ' is-staff' : ''}`}>
            <span className="qz-xs qz-faint">{m.senderName || m.senderRole} · {formatDate(m.createdAt, true)}</span>
            <span className="qz-small" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
          </div>
        ))}
        {data && data.length === 0 && <p className="qz-small qz-muted" style={{ margin: 0 }}>Сообщений пока нет.</p>}
        <span ref={end} />
        <form className="qga-send" onSubmit={send}>
          <input className="qz-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение от администратора" aria-label="Сообщение" maxLength={2000} />
          <button type="submit" className="qz-btn is-primary" disabled={busy || !text.trim()} aria-label="Отправить"><Send size={18} /></button>
        </form>
      </div>
    </Sheet>
  );
}

export function Chats({ me, toast, refreshKey }) {
  const fn = useCallback(() => api.chat(''), []);
  const { data, error, load } = useData(fn, refreshKey);
  const [open, setOpen] = useState(null);
  const threads = useMemo(() => {
    const by = {};
    (data || []).forEach((m) => { const k = m.orderId || '—'; (by[k] = by[k] || []).push(m); });
    return Object.entries(by).map(([orderId, msgs]) => {
      msgs.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      return { orderId, count: msgs.length, last: msgs[msgs.length - 1] };
    }).sort((a, b) => String(b.last.createdAt).localeCompare(String(a.last.createdAt)));
  }, [data]);
  return (
    <div className="qz-page qz-stack">
      <PageHead sub={data ? `${formatInt(threads.length)} заказов с перепиской · ${formatInt(data.length)} сообщений` : ''} />
      {error && <LoadError error={error} onRetry={load} />}
      {!data && !error && <Skeleton lines={3} />}
      {data && threads.length === 0 && <Empty icon={MessagesSquare} title="Переписки пока нет" />}
      <div className="qga-list">
        {threads.map((t) => (
          <button key={t.orderId} type="button" className="qga-order" onClick={() => setOpen(t.orderId)}>
            <span className="qz-row" style={{ justifyContent: 'space-between' }}><b className="qz-small">Заказ № {t.orderId}</b><span className="qz-xs qz-faint">{formatDate(t.last.createdAt, true)}</span></span>
            <span className="qz-small qz-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last.senderName}: {t.last.text}</span>
            <span className="qz-xs qz-faint">{formatInt(t.count)} сообщ.</span>
          </button>
        ))}
      </div>
      {open && <Thread orderId={open} me={me} toast={toast} refreshKey={refreshKey} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}

// ── Предложения поставщиков материалов ───────────────────────
export function Offers({ refreshKey }) {
  const fn = useCallback(() => api.materials(), []);
  const { data, error, load } = useData(fn, refreshKey);
  const list = data ? (Array.isArray(data) ? data : data.items || []) : null;
  return (
    <div className="qz-page qz-stack">
      <PageHead sub={list ? `${formatInt(list.length)} предложений` : ''} />
      {error && <LoadError error={error} onRetry={load} />}
      {!list && !error && <Skeleton lines={3} />}
      {list && list.length === 0 && <Empty icon={Package} title="Предложений пока нет" text="Их публикуют компании-поставщики в разделе материалов на сайте." />}
      <div className="qga-list">
        {(list || []).map((m) => (
          <div key={m.id} className="qga-price">
            <span className="qz-grow"><span className="qga-row-title">{m.name}</span><span className="qga-row-sub">{[m.category, m.city, m.supplierName, m.stock ? `на складе ${formatInt(m.stock)} ${m.unit}` : ''].filter(Boolean).join(' · ')}</span></span>
            <span className="qga-price-val num">{formatMoney(m.price)}<span className="qz-xs qz-faint"> / {m.unit}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
