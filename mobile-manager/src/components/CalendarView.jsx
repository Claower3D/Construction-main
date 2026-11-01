import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import DealCard from './DealCard';
import { localDateISO, parseLocalDate, addDaysISO } from '../api/syncCore';
import { EmptyState } from './ui/kit';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WD_LONG = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const mondayOf = (iso) => addDaysISO(iso, -((parseLocalDate(iso).getDay() + 6) % 7));

function Agenda({ items, onSelectDeal }) {
  const sorted = [...items].sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99')));
  return (
    <div className="qz-agenda">
      {sorted.map(d => (
        <div className="qz-agenda-row" key={d.id}>
          <div className="qz-agenda-time">{d.time || '—'}</div>
          <DealCard deal={d} onClick={onSelectDeal} compact />
        </div>
      ))}
    </div>
  );
}

export default function CalendarView({ deals, onSelectDeal, onOpenNewLead }) {
  const todayStr = localDateISO();
  const [mode, setMode] = useState('day'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const byDate = useMemo(() => {
    const map = new Map();
    deals.forEach(d => { if (d.date) map.set(d.date, [...(map.get(d.date) || []), d]); });
    return map;
  }, [deals]);

  const selectDate = (iso) => {
    setSelectedDate(iso);
    const d = parseLocalDate(iso);
    setMonthCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const monday = mondayOf(selectedDate);
  const week = Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
  const sel = parseLocalDate(selectedDate);

  const shift = (dir) => {
    if (mode === 'day') selectDate(addDaysISO(selectedDate, dir));
    else if (mode === 'week') selectDate(addDaysISO(selectedDate, dir * 7));
    else {
      let { y, m } = monthCursor;
      m += dir;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setMonthCursor({ y, m });
    }
  };

  const title = mode === 'month'
    ? `${MONTHS[monthCursor.m]} ${monthCursor.y}`
    : mode === 'week'
      ? weekTitle(week)
      : `${sel.getDate()} ${MONTHS_GEN[sel.getMonth()]}, ${WD_LONG[(sel.getDay() + 6) % 7].toLowerCase()}`;

  const dayCell = (iso, { outside = false } = {}) => {
    const d = parseLocalDate(iso);
    const n = (byDate.get(iso) || []).length;
    const cls = ['qz-day', iso === todayStr ? 'is-today' : '', iso === selectedDate ? 'is-selected' : '', outside ? 'is-outside' : ''].join(' ');
    return (
      <button key={iso} type="button" className={cls} onClick={() => { selectDate(iso); if (mode === 'week') setMode('day'); }} aria-pressed={iso === selectedDate} aria-label={`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}: ${n ? `${n} встреч` : 'свободно'}`}>
        {mode !== 'month' && <small>{WD_SHORT[(d.getDay() + 6) % 7]}</small>}
        <b>{d.getDate()}</b>
        <span className="qz-day-dots">{Array.from({ length: Math.min(n, 3) }).map((_, i) => <i key={i} />)}</span>
      </button>
    );
  };

  const monthCells = (() => {
    const first = new Date(monthCursor.y, monthCursor.m, 1);
    const start = addDaysISO(localDateISO(first), -((first.getDay() + 6) % 7));
    const daysInMonth = new Date(monthCursor.y, monthCursor.m + 1, 0).getDate();
    const total = Math.ceil((((first.getDay() + 6) % 7) + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDaysISO(start, i));
  })();

  const dayItems = byDate.get(selectedDate) || [];

  return (
    <div className="qz-page">
      <div className="qz-segmented" role="tablist" aria-label="Вид календаря">
        {[['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>{label}</button>
        ))}
      </div>

      <div className="qz-row" style={{ margin: 'var(--sp-3) 0' }}>
        <button type="button" className="qz-iconbtn" aria-label="Назад" onClick={() => shift(-1)}><ChevronLeft size={22} /></button>
        <h2 className="qz-h2 qz-grow" style={{ textAlign: 'center' }}>{title}</h2>
        <button type="button" className="qz-iconbtn" aria-label="Вперёд" onClick={() => shift(1)}><ChevronRight size={22} /></button>
      </div>
      {selectedDate !== todayStr && (
        <div style={{ textAlign: 'center', marginTop: -6, marginBottom: 'var(--sp-2)' }}>
          <button type="button" className="qz-btn is-ghost is-sm" onClick={() => selectDate(todayStr)}>Вернуться к сегодня</button>
        </div>
      )}

      {mode !== 'month' && <div className="qz-week" style={{ marginBottom: 'var(--sp-3)' }}>{week.map(iso => dayCell(iso))}</div>}

      {mode === 'month' && (
        <>
          <div className="qz-weekdays">{WD_SHORT.map(w => <span key={w}>{w}</span>)}</div>
          <div className="qz-month" style={{ marginBottom: 'var(--sp-4)' }}>
            {monthCells.map(iso => dayCell(iso, { outside: parseLocalDate(iso).getMonth() !== monthCursor.m }))}
          </div>
        </>
      )}

      {(mode === 'day' || mode === 'month') && (
        <>
          {mode === 'month' && <div className="qz-agenda-group">{sel.getDate()} {MONTHS_GEN[sel.getMonth()]}</div>}
          {dayItems.length === 0 ? (
            <div className="qz-card is-flat" style={{ borderStyle: 'dashed' }}>
              <EmptyState
                icon={<CalendarPlus size={28} />}
                title="Свободный день"
                text="Встреч и выездов на эту дату нет."
                action={onOpenNewLead && <button type="button" className="qz-btn" onClick={onOpenNewLead}>Записать лид</button>}
              />
            </div>
          ) : (
            <Agenda items={dayItems} onSelectDeal={onSelectDeal} />
          )}
        </>
      )}

      {mode === 'week' && week.map(iso => {
        const items = byDate.get(iso) || [];
        const d = parseLocalDate(iso);
        return (
          <section key={iso}>
            <div className={`qz-agenda-group${iso === todayStr ? ' is-today' : ''}`}>
              {WD_LONG[(d.getDay() + 6) % 7]}, {d.getDate()} {MONTHS_GEN[d.getMonth()]}{iso === todayStr ? ' (сегодня)' : ''}
            </div>
            {items.length ? <Agenda items={items} onSelectDeal={onSelectDeal} /> : <div className="qz-small qz-faint" style={{ paddingLeft: 60 }}>Встреч нет</div>}
          </section>
        );
      })}
    </div>
  );
}

function weekTitle(week) {
  const a = parseLocalDate(week[0]);
  const b = parseLocalDate(week[6]);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`;
}
