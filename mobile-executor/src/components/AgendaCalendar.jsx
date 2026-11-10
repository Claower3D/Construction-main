import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, CalendarPlus, X } from 'lucide-react';
import { localDateISO, parseLocalDate, addDaysISO } from '../api/syncCore';
import { EmptyState } from './ui/kit';
import '../styles/calendar.css';

// Календарь инженера и бригады: неделя, месяц и список по срокам (как «Мои задачи» в Asana).
// Даты локальные (UTC+5). Одинаковая копия — в mobile-engineer и mobile-executor.
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WD_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const wdIdx = (d) => (d.getDay() + 6) % 7;
const mondayOf = (iso) => addDaysISO(iso, -wdIdx(parseLocalDate(iso)));
const byTime = (a, b) => String(a.time || '99').localeCompare(String(b.time || '99'));

/**
 * items: записи {id, date, time, status}; renderItem(item) → карточка;
 * itemTone(item) → цвет метки (статус); isDone(item) → выполнено ли;
 * onSchedule(itemId, date, time) — необязательное окно «назначить».
 */
export default function AgendaCalendar({
  items = [],
  renderItem,
  onSchedule,
  scheduleLabel = 'Назначить',
  itemLabel = (x) => x.title,
  itemTone = () => null,
  isDone = (x) => x.status === 'Завершено',
  emptyText = 'На эту дату ничего не запланировано.',
}) {
  const todayStr = localDateISO();
  const [mode, setMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [sheet, setSheet] = useState(null); // { id, date, time }
  const [collapsed, setCollapsed] = useState({ done: true });

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
    if (mode === 'day') { selectDate(addDaysISO(selectedDate, dir * 7)); return; }
    let { y, m } = cursor;
    m += dir;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ y, m });
  };

  const week = Array.from({ length: 7 }, (_, i) => addDaysISO(mondayOf(selectedDate), i));
  const sel = parseLocalDate(selectedDate);
  const dayItems = [...(byDate.get(selectedDate) || [])].sort(byTime);

  // список: секции по срокам
  const sections = useMemo(() => {
    const tomorrow = addDaysISO(todayStr, 1);
    const weekEnd = addDaysISO(todayStr, 7);
    const g = { overdue: [], today: [], tomorrow: [], week: [], later: [], nodate: [], done: [] };
    items.forEach((x) => {
      if (isDone(x)) g.done.push(x);
      else if (!x.date) g.nodate.push(x);
      else if (x.date < todayStr) g.overdue.push(x);
      else if (x.date === todayStr) g.today.push(x);
      else if (x.date === tomorrow) g.tomorrow.push(x);
      else if (x.date <= weekEnd) g.week.push(x);
      else g.later.push(x);
    });
    const sortD = (arr) => arr.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || byTime(a, b));
    return [
      { id: 'overdue', title: 'Просрочено', items: sortD(g.overdue), cls: 'is-overdue' },
      { id: 'today', title: 'Сегодня', items: sortD(g.today), cls: 'is-today' },
      { id: 'tomorrow', title: 'Завтра', items: sortD(g.tomorrow) },
      { id: 'week', title: 'На неделе', items: sortD(g.week) },
      { id: 'later', title: 'Позже', items: sortD(g.later) },
      { id: 'nodate', title: 'Без даты', items: g.nodate, cls: 'is-nodate' },
      { id: 'done', title: 'Выполнено', items: sortD(g.done).reverse(), cls: 'is-done' },
    ].filter((s) => s.items.length > 0 || s.id === 'today');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, todayStr]);

  const dateChip = (iso) => {
    if (!iso) return 'без даты';
    if (iso === todayStr) return 'сегодня';
    if (iso === addDaysISO(todayStr, 1)) return 'завтра';
    if (iso === addDaysISO(todayStr, -1)) return 'вчера';
    const d = parseLocalDate(iso);
    return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  };

  const cell = (iso, outside = false) => {
    const d = parseLocalDate(iso);
    const list = byDate.get(iso) || [];
    const open = list.filter((x) => !isDone(x));
    const overdue = iso < todayStr && open.length > 0;
    const cls = ['qz-day', 'qc-day', iso === todayStr ? 'is-today' : '', iso === selectedDate ? 'is-selected' : '', outside ? 'is-outside' : '', wdIdx(d) > 4 ? 'is-weekend' : '', overdue ? 'is-overdue' : ''].join(' ');
    return (
      <button key={iso} type="button" className={cls} onClick={() => selectDate(iso)} aria-pressed={iso === selectedDate} aria-current={iso === todayStr ? 'date' : undefined} aria-label={`${d.getDate()} ${MONTHS_GEN[d.getMonth()]}: ${list.length ? `записей ${list.length}` : 'нет записей'}${overdue ? ', есть просроченные' : ''}`}>
        {mode === 'day' && <small>{WD_SHORT[wdIdx(d)]}</small>}
        <b>{d.getDate()}</b>
        <span className="qz-day-dots">
          {list.slice(0, 3).map((x) => <i key={x.id} style={itemTone(x) ? { background: itemTone(x) } : undefined} className={isDone(x) ? 'is-done' : ''} />)}
        </span>
      </button>
    );
  };

  const monthCells = (() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = wdIdx(first);
    const start = addDaysISO(localDateISO(first), -lead);
    const total = Math.ceil((lead + new Date(cursor.y, cursor.m + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDaysISO(start, i));
  })();

  const weekLabel = (() => {
    const a = parseLocalDate(week[0]); const b = parseLocalDate(week[6]);
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
      : `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`;
  })();

  const openSheet = (id) => setSheet({ id: id || (items[0] && items[0].id) || '', date: selectedDate, time: '10:00' });
  const nowD = new Date();
  const offMonth = mode === 'month' && (cursor.y !== nowD.getFullYear() || cursor.m !== nowD.getMonth());
  const notToday = mode !== 'list' && (selectedDate !== todayStr || offMonth);

  return (
    <div className="qz-page qc">
      <div className="qz-segmented" role="tablist" aria-label="Вид календаря">
        {[['day', 'Неделя'], ['month', 'Месяц'], ['list', 'Список']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}>{label}</button>
        ))}
      </div>

      {mode !== 'list' && (
        <div className="qc-nav">
          <button type="button" className="qz-iconbtn" aria-label={mode === 'day' ? 'Предыдущая неделя' : 'Предыдущий месяц'} onClick={() => shift(-1)}><ChevronLeft size={22} /></button>
          <h2 className="qz-h2 qz-grow qc-nav-title" aria-live="polite">{mode === 'month' ? `${MONTHS[cursor.m]} ${cursor.y}` : weekLabel}</h2>
          <button type="button" className="qz-iconbtn" aria-label={mode === 'day' ? 'Следующая неделя' : 'Следующий месяц'} onClick={() => shift(1)}><ChevronRight size={22} /></button>
        </div>
      )}

      {mode === 'day' && <div className="qz-week qc-week">{week.map(iso => cell(iso))}</div>}
      {mode === 'month' && (
        <>
          <div className="qz-weekdays qc-weekdays">{WD_SHORT.map((w, i) => <span key={w} className={i > 4 ? 'is-weekend' : ''}>{w}</span>)}</div>
          <div className="qz-month qc-month">{monthCells.map(iso => cell(iso, parseLocalDate(iso).getMonth() !== cursor.m))}</div>
        </>
      )}

      {mode !== 'list' && (
        <>
          <div className="qc-dayhead">
            <div className="qz-grow">
              <p className={`qc-dayhead-kicker${selectedDate === todayStr ? ' is-today' : ''}`}>{selectedDate === todayStr ? 'Сегодня' : WD_LONG[wdIdx(sel)]}</p>
              <h3 className="qc-dayhead-title">
                {`${sel.getDate()} ${MONTHS_GEN[sel.getMonth()]}`}
                <span className="qc-count" aria-label={`Записей: ${dayItems.length}`}>{dayItems.length}</span>
              </h3>
            </div>
            {notToday && <button type="button" className="qz-btn is-ghost is-sm" onClick={() => selectDate(todayStr)}>Сегодня</button>}
            {onSchedule && items.length > 0 && <button type="button" className="qz-btn is-sm" onClick={() => openSheet()}><CalendarPlus size={16} /> {scheduleLabel}</button>}
          </div>

          {dayItems.length === 0 ? (
            <div className="qz-card is-flat qc-empty">
              <EmptyState icon={<CalendarPlus size={28} />} title="Свободно" text={emptyText} />
            </div>
          ) : (
            <div className="qz-agenda">
              {dayItems.map(x => (
                <div className={`qz-agenda-row${isDone(x) ? ' qc-is-done' : ''}`} key={x.id}>
                  <div className="qz-agenda-time">{x.time || '—'}</div>
                  {renderItem(x)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'list' && (
        <div className="qc-list">
          {onSchedule && items.length > 0 && (
            <button type="button" className="qz-btn is-block qc-list-add" onClick={() => openSheet()}><CalendarPlus size={18} /> {scheduleLabel}</button>
          )}
          {sections.map((s) => (
            <section key={s.id} className={`qc-sec ${s.cls || ''}`}>
              <button type="button" className="qc-sec-head" aria-expanded={!collapsed[s.id]} onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}>
                <ChevronDown size={18} className="qc-caret" aria-hidden="true" />
                <span className="qz-grow">{s.title}</span>
                <span className="qc-count">{s.items.length}</span>
              </button>
              {!collapsed[s.id] && (
                s.items.length === 0
                  ? <p className="qc-sec-empty">{s.id === 'today' ? 'На сегодня ничего нет' : 'Пусто'}</p>
                  : (
                    <div className="qc-sec-body">
                      {s.items.map((x) => (
                        <div key={x.id} className={`qc-item${isDone(x) ? ' qc-is-done' : ''}`}>
                          <button type="button" className={`qc-when${s.id === 'overdue' ? ' is-overdue' : ''}${x.date === todayStr ? ' is-today' : ''}`} onClick={() => { if (x.date) { selectDate(x.date); setMode('day'); } else if (onSchedule) openSheet(x.id); }}>
                            {dateChip(x.date)}{x.time ? `, ${x.time}` : ''}
                          </button>
                          {renderItem(x)}
                        </div>
                      ))}
                    </div>
                  )
              )}
            </section>
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
