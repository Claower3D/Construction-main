// Общие элементы админки поверх стилей QazGost (styles/ui.css).
import React, { useEffect } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';

/** Статус → один из шести тонов (как в остальных приложениях) */
export function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (!s) return 'muted';
  if (/отказ|отмен|брак/.test(s)) return 'lost';
  if (/успешно|заверш|сдан|выполн|готов|принят/.test(s)) return 'done';
  if (/приёмк|приемк|ожида|срок|pending|открыт/.test(s)) return 'attention';
  if (/нов/.test(s)) return 'new';
  if (/работ|запланир|назнач|подтвер|confirmed/.test(s)) return 'progress';
  return 'muted';
}

export function Status({ status, label }) {
  return <span className={`qz-status is-st-${statusTone(status)}`}>{label || status || 'Без статуса'}</span>;
}

export function Sheet({ title, sub, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="qz-scrim" onClick={onClose} role="presentation">
      <section className="qz-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="qz-sheet-head">
          <div className="qz-grow">
            <h2 className="qz-h2">{title}</h2>
            {sub && <p className="qz-small qz-muted" style={{ margin: '4px 0 0' }}>{sub}</p>}
          </div>
          <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="qz-sheet-body">{children}</div>
        {footer && <div className="qga-sheet-foot">{footer}</div>}
      </section>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="qz-empty">
      {Icon && <Icon size={32} aria-hidden="true" />}
      <p className="qz-h3" style={{ margin: 0 }}>{title}</p>
      {text && <p className="qz-small qz-muted" style={{ margin: 0 }}>{text}</p>}
      {action}
    </div>
  );
}

export function LoadError({ error, onRetry }) {
  return (
    <div className="qz-card is-danger qz-stack" role="alert">
      <div className="qz-row"><AlertTriangle size={18} color="var(--danger)" /><b>Не удалось загрузить</b></div>
      <p className="qz-small qz-muted" style={{ margin: 0 }}>{error}</p>
      {onRetry && <button type="button" className="qz-btn is-sm" onClick={onRetry}><RefreshCw size={16} />Повторить</button>}
    </div>
  );
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="qz-stack" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: lines }, (_, i) => <div key={i} className="qz-skeleton" style={{ height: 72 }} />)}
    </div>
  );
}

/** Честная плашка «чего на сервере пока нет» */
export function Honest({ children }) {
  return <div className="qz-banner qga-honest">{children}</div>;
}

export function Kv({ rows }) {
  return (
    <dl className="qz-kv">
      {rows.filter(Boolean).map(([k, v]) => (
        <React.Fragment key={k}><dt>{k}</dt><dd>{v === '' || v == null ? '—' : v}</dd></React.Fragment>
      ))}
    </dl>
  );
}

// Название экрана уже стоит в шапке приложения, поэтому здесь только пояснение и кнопки
export function PageHead({ sub, right }) {
  if (!sub && !right) return null;
  return (
    <div className="qz-row" style={{ justifyContent: 'space-between', minHeight: right ? 44 : undefined }}>
      {sub ? <p className="qz-xs qz-faint" style={{ margin: 0 }}>{sub}</p> : <span />}
      {right}
    </div>
  );
}
