import React from 'react';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import DealCard from './DealCard';
import { STAGES } from '../api/crmApi';
import { localDateISO, parseLocalDate } from '../api/syncCore';
import { EmptyState, formatMoney, statusTone } from './ui/kit';

const CLOSED = ['Успешно', 'Отказ'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export default function DashboardView({ deals, onSelectDeal, onOpenNewLead, onOpenTab }) {
  const today = localDateISO();
  const d = parseLocalDate(today);
  const open = deals.filter(x => !CLOSED.includes(x.status));
  const todays = open.filter(x => x.date === today).sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const attention = open
    .filter(x => x.date !== today && ((x.date && x.date < today) || x.priority === 'urgent'))
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const pipelineSum = open.reduce((s, x) => s + (Number(x.budget) || 0), 0);
  const wonSum = deals.filter(x => x.status === 'Успешно').reduce((s, x) => s + (Number(x.budget) || 0), 0);
  const maxStage = Math.max(1, ...STAGES.map(st => deals.filter(x => x.status === st).length));

  return (
    <div className="qz-page">
      {/* Money first: what is in the pipeline right now */}
      <section className="qz-card" aria-label="Итоги воронки">
        <div className="qz-muted qz-small">В работе сейчас</div>
        <div className="qz-amount num" style={{ fontSize: 'var(--fs-2xl)', marginTop: 2 }}>{formatMoney(pipelineSum)}</div>
        <div className="qz-small qz-muted" style={{ marginTop: 4 }}>
          {open.length} {plural(open.length, 'открытая сделка', 'открытые сделки', 'открытых сделок')}; закрыто успешно на {formatMoney(wonSum)}
        </div>

        <div style={{ display: 'grid', gap: 8, marginTop: 'var(--sp-4)' }}>
          {STAGES.map(st => {
            const list = deals.filter(x => x.status === st);
            const sum = list.reduce((s, x) => s + (Number(x.budget) || 0), 0);
            return (
              <button
                key={st}
                type="button"
                onClick={() => onOpenTab && onOpenTab('kanban')}
                aria-label={`${st}: ${list.length}, ${formatMoney(sum)}`}
                style={{ display: 'grid', gridTemplateColumns: '112px 1fr 104px', alignItems: 'center', gap: 10, minHeight: 36, background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'var(--text)' }}
              >
                <span className="qz-row" style={{ gap: 6 }}>
                  <span className={`qz-status is-st-${statusTone(st)}`}>{st}</span>
                  <span className="qz-faint qz-small num">{list.length}</span>
                </span>
                <span className="qz-meter" aria-hidden="true" style={{ '--st': `var(--st-${statusTone(st)})` }}>
                  <i style={{ width: `${list.length ? Math.max(6, Math.round((list.length / maxStage) * 100)) : 0}%` }} />
                </span>
                <span className="qz-small num qz-muted" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {sum > 0 ? formatMoney(sum) : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
        <h2 className="qz-h2">Сегодня, {d.getDate()} {MONTHS_GEN[d.getMonth()]}</h2>
        <span className="qz-small qz-faint">{WEEKDAYS[d.getDay()]}</span>
      </div>
      {todays.length === 0 ? (
        <div className="qz-card is-flat" style={{ borderStyle: 'dashed' }}>
          <EmptyState
            icon={<CalendarCheck size={28} />}
            title="На сегодня встреч нет"
            text="Запишите новый лид — дата встречи попадёт в календарь."
            action={<button type="button" className="qz-btn is-primary" onClick={onOpenNewLead}>Новый лид</button>}
          />
        </div>
      ) : (
        <div className="qz-stack">{todays.map(x => <DealCard key={x.id} deal={x} onClick={onSelectDeal} />)}</div>
      )}

      {attention.length > 0 && (
        <>
          <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
            <h2 className="qz-h2">Требуют внимания</h2>
            <span className="qz-small qz-faint">просрочены или срочные</span>
          </div>
          <div className="qz-stack">{attention.slice(0, 6).map(x => <DealCard key={x.id} deal={x} onClick={onSelectDeal} />)}</div>
          {attention.length > 6 && (
            <button type="button" className="qz-btn is-ghost is-block" onClick={() => onOpenTab && onOpenTab('kanban')} style={{ marginTop: 8 }}>
              Ещё {attention.length - 6} в воронке <ChevronRight size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
