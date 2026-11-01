import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarPlus, X } from 'lucide-react';
import { localDateISO, parseLocalDate, addDaysISO } from '../api/syncCore';
import { EmptyState } from './ui/kit';

// Shared agenda calendar (engineer + executor): day / month views, local dates (UTC+5 safe).
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WD_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const mondayOf = (iso) => addDaysISO(iso, -((parseLocalDate(iso).getDay() + 6) % 7));

/**
 * items: records with {id, date, time}; renderItem(item) → card (compact, no stub);
 * onSchedule(itemId, date, time) — optional «назначить» sheet; scheduleLabel/itemLabel for the sheet.
 */
export default function AgendaCalendar({ items = [], renderItem, onSchedule, scheduleLabel = 'Назначить', itemLabel = (x) => x.title, emptyText = 'На эту дату ничего не запланировано.' }) {
  const todayStr = localDateISO();
  const [mode, setMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [sheet, setSheet] = useState(null); // { id, date, time }

  const byDate = useMemo(() => {
    const map = new Map();
    items.forEach(x => { if (x.date) map.set(x.date, [...(map.get(x.date) || []), x]); });
    return map;
  }, [items]);

  const selectDate = (iso) => {
    setSelectedDate(iso);
    const d = parseLocalDate(iso);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const shift = (dir) => {
    if (mode === 'day') { selectDate(addDaysISO(selectedDate, dir)); return; }
    let { y, m } = cursor;
    m += dir;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ y, m });
  };

  const week = Array.from({ length: 7 }, (_, i) => addDaysISO(mondayOf(selectedDate), i));
  const sel = parseLocalDate(selectedDate);
  const dayItems = [...(byDate.get(selectedDate) || [])].sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99')));

  const cell = (iso, outside = false) => {
    const d = parseLocalDate(iso);
    const n = (byDate.get(iso) || []).length;
    const cls = ['qz-day', iso === todayStr ? 'is-today' : '', iso === selectedDate ? 'is-selected' : '', outside ? 'is-outside' : ''].join(' ');
    return (
      <button key={iso} type="button" className={cls} onClick={() => selectDate(iso)} aria-pressed={iso === selectedDate} aria-label={`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}: ${n || 'нет'} записей`}>
        {mode === 'day' && <small>{WD_SHORT[(d.getDay() + 6) % 7]}</small>}
        <b>{d.getDate()}</b>
        <span className="qz-day-dots">{Array.from({ length: Math.min(n, 3) }).map((_, i) => <i key={i} />)}</span>
      </button>
    );
  };

  const monthCells = (() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const start = addDaysISO(localDateISO(first), -lead);
    const total = Math.ceil((lead + new Date(cursor.y, cursor.m + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDaysISO(start, i));
  })();

  const openSheet = (id) => setSheet({ id: id || (items[0] && items[0].id) || '', date: selectedDate, time: '10:00' });

  return (
    <div className="qz-page">
      <div className="qz-segmented" role="tablist" aria-label="Вид календаря">
        {[['day', 'Неделя'], ['month', 'Месяц']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>{label}</button>
        ))}
      </div>

      <div className="qz-row" style={{ margin: 'var(--sp-3) 0' }}>
        <button type="button" className="qz-iconbtn" aria-label="Назад" onClick={() => shift(-1)}><ChevronLeft size={22} /></button>
        <h2 className="qz-h2 qz-grow" style={{ textAlign: 'center' }}>
          {mode === 'month' ? `${MONTHS[cursor.m]} ${cursor.y}` : `${sel.getDate()} ${MONTHS_GEN[sel.getMonth()]}, ${WD_LONG[(sel.getDay() + 6) % 7]}`}
        </h2>
        <button type="button" className="qz-iconbtn" aria-label="Вперёд" onClick={() => shift(1)}><ChevronRight size={22} /></button>
      </div>

      {mode === 'day'
        ? <div className="qz-week" style={{ marginBottom: 'var(--sp-3)' }}>{week.map(iso => cell(iso))}</div>
        : (
          <>
            <div className="qz-weekdays">{WD_SHORT.map(w => <span key={w}>{w}</span>)}</div>
            <div className="qz-month" style={{ marginBottom: 'var(--sp-3)' }}>{monthCells.map(iso => cell(iso, parseLocalDate(iso).getMonth() !== cursor.m))}</div>
          </>
        )}

      <div className="qz-row" style={{ justifyContent: 'space-between', margin: 'var(--sp-2) 0' }}>
        <span className={`qz-agenda-group${selectedDate === todayStr ? ' is-today' : ''}`} style={{ margin: 0 }}>
          {selectedDate === todayStr ? 'Сегодня' : `${sel.getDate()} ${MONTHS_GEN[sel.getMonth()]}`}: {dayItems.length || 'нет записей'}
        </span>
        <span className="qz-row" style={{ gap: 4 }}>
          {selectedDate !== todayStr && <button type="button" className="qz-btn is-ghost is-sm" onClick={() => selectDate(todayStr)}>К сегодня</button>}
          {onSchedule && items.length > 0 && <button type="button" className="qz-btn is-sm" onClick={() => openSheet()}><CalendarPlus size={16} /> {scheduleLabel}</button>}
        </span>
      </div>

      {dayItems.length === 0 ? (
        <div className="qz-card is-flat" style={{ borderStyle: 'dashed' }}>
          <EmptyState icon={<CalendarPlus size={28} />} title="Свободно" text={emptyText} />
        </div>
      ) : (
        <div className="qz-agenda">
          {dayItems.map(x => (
            <div className="qz-agenda-row" key={x.id}>
              <div className="qz-agenda-time">{x.time || '—'}</div>
              {renderItem(x)}
            </div>
          ))}
        </div>
      )}

      {sheet && (
        <div className="qz-scrim" onClick={() => setSheet(null)}>
          <form
            className="qz-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={scheduleLabel}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); if (sheet.id) { onSchedule(sheet.id, sheet.date, sheet.time); selectDate(sheet.date); setSheet(null); } }}
          >
            <div className="qz-sheet-head">
              <h2 className="qz-h2 qz-grow">{scheduleLabel}</h2>
              <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={() => setSheet(null)}><X size={22} /></button>
            </div>
            <div className="qz-sheet-body" style={{ display: 'grid', gap: 'var(--sp-3)' }}>
              <div className="qz-field">
                <label className="qz-label" htmlFor="sched-item">Объект</label>
                <select id="sched-item" className="qz-select" value={sheet.id} onChange={(e) => setSheet({ ...sheet, id: e.target.value })}>
                  {items.map(x => <option key={x.id} value={x.id}>{itemLabel(x)}</option>)}
                </select>
              </div>
              <div className="qz-grid-2">
                <div className="qz-field">
                  <label className="qz-label" htmlFor="sched-date">Дата</label>
                  <input id="sched-date" type="date" className="qz-input" value={sheet.date} onChange={(e) => setSheet({ ...sheet, date: e.target.value })} required />
                </div>
                <div className="qz-field">
                  <label className="qz-label" htmlFor="sched-time">Время</label>
                  <input id="sched-time" type="time" className="qz-input" value={sheet.time} onChange={(e) => setSheet({ ...sheet, time: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="qz-btn is-primary is-block">Сохранить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
