// QazGost UI kit (identical file in all three apps). Visual rules live in styles/ui.css.
import React from 'react';
import { localDateISO, parseLocalDate } from '../../api/syncCore';

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** Status strings from all three apps and the web → one of six tones. */
export function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (!s) return 'muted';
  if (/отказ|отмен|брак/.test(s)) return 'lost';
  if (/успешно|заверш|сдан|выполн|готов/.test(s)) return 'done';
  if (/дожим|приёмк|приемк|ожида|срок/.test(s)) return 'attention';
  if (/нов/.test(s)) return 'new';
  if (/работ|объект|выезд|выехал|замер|смета|пути|назнач|подтвер/.test(s)) return 'progress';
  return 'muted';
}

export function formatMoney(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('ru-RU')} ₸`;
}

export function Status({ status, label }) {
  return <span className={`qz-status is-st-${statusTone(status)}`}>{label || status || 'Без статуса'}</span>;
}

/** Perforated stub with the visit date (big day number) and time. */
export function TicketStub({ date, time }) {
  if (!date) {
    return (
      <div className="qz-ticket-stub" aria-label="Дата не назначена">
        <span className="qz-stub-month">без даты</span>
        {time && <span className="qz-stub-time">{time}</span>}
      </div>
    );
  }
  const today = localDateISO();
  const d = parseLocalDate(date);
  const cls = date === today ? ' is-today' : (date < today ? ' is-overdue' : '');
  return (
    <div className={`qz-ticket-stub${cls}`} aria-label={`${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${time ? `, ${time}` : ''}`}>
      <span className="qz-stub-day">{d.getDate()}</span>
      <span className="qz-stub-month">{date === today ? 'сегодня' : MONTHS_SHORT[d.getMonth()]}</span>
      {time && <span className="qz-stub-time">{time}</span>}
    </div>
  );
}

/**
 * Work-ticket card used for deals, objects and work orders.
 * meta: [{ icon: <Icon/>, text }]; actions: nodes rendered next to the amount (clicks don't open the card).
 */
export function Ticket({ status, statusLabel, number, title, meta = [], amount, amountLabel, date, time, onOpen, actions, children, tag, compact = false }) {
  const open = (e) => { if (onOpen) onOpen(e); };
  const onKey = (e) => { if ((e.key === 'Enter' || e.key === ' ') && onOpen) { e.preventDefault(); onOpen(e); } };
  return (
    <article
      className={`qz-ticket is-st-${statusTone(status)}`}
      style={{ '--st': `var(--st-${statusTone(status)})`, ...(compact ? { gridTemplateColumns: 'minmax(0, 1fr)' } : null) }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={open}
      onKeyDown={onKey}
    >
      <div className="qz-ticket-main">
        <div className="qz-ticket-top">
          <Status status={status} label={statusLabel} />
          <span className="qz-row" style={{ gap: 6 }}>
            {tag}
            {number && <span className="qz-ticket-no">№ {number}</span>}
          </span>
        </div>
        <h3 className="qz-ticket-title">{title}</h3>
        {meta.filter(m => m && m.text).length > 0 && (
          <div className="qz-ticket-meta">
            {meta.filter(m => m && m.text).map((m, i) => (
              <span key={i}>{m.icon}<em>{m.text}</em></span>
            ))}
          </div>
        )}
        {children}
        {(amount !== undefined || actions) && (
          <div className="qz-ticket-foot">
            {amount !== undefined && (
              Number(amount) > 0
                ? <span className="qz-amount">{formatMoney(amount)}</span>
                : <span className="qz-amount is-empty">{amountLabel || 'Сумма не указана'}</span>
            )}
            {actions && <div className="qz-ticket-actions" onClick={(e) => e.stopPropagation()}>{actions}</div>}
          </div>
        )}
      </div>
      {!compact && <TicketStub date={date} time={time} />}
    </article>
  );
}

/** 7-step work progress (the stages really are a sequence). */
export function StepProgress({ stages = [], total }) {
  const count = total || stages.length || 7;
  const done = stages.filter(s => s.done).length;
  const nextIdx = stages.findIndex(s => !s.done);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 4 }}>
      <div className="qz-steps" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <i key={i} className={stages[i]?.done ? 'is-done' : (i === nextIdx ? 'is-next' : '')} />
        ))}
      </div>
      <div className="qz-steps-label">
        <span>{done === count ? 'Все этапы выполнены' : `Этап ${Math.min(done + 1, count)} из ${count}${nextIdx >= 0 && stages[nextIdx] ? `: ${stages[nextIdx].title}` : ''}`}</span>
        <span>{done}/{count}</span>
      </div>
    </div>
  );
}

export function Toast({ message, withFab = false }) {
  if (!message) return null;
  return <div className={`qz-toast${withFab ? ' has-fab' : ''}`} role="status" aria-live="polite">{message}</div>;
}

export function SkeletonList({ count = 3, height = 132 }) {
  return (
    <div className="qz-stack" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: count }).map((_, i) => <div key={i} className="qz-skeleton" style={{ height }} />)}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="qz-empty">
      {icon}
      {title && <div className="qz-h3">{title}</div>}
      {text && <div>{text}</div>}
      {action}
    </div>
  );
}

export function SyncBanner({ pending, error, onRetry }) {
  if (!(pending > 0) && !error) return null;
  return (
    <button type="button" className="qz-banner" onClick={onRetry}>
      <span className="qz-grow">
        {pending > 0 && <b>Не отправлено на сервер: {pending}. </b>}
        {error ? `${error}. ` : ''}Нажмите, чтобы повторить
      </span>
    </button>
  );
}
