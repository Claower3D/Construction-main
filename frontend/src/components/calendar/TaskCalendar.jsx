import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Pencil, Trash2, Eye, MapPin, Building2, Clock, ChevronDown, CalendarDays, Rows3, ListChecks } from 'lucide-react';
import './TaskCalendar.css';

// Календарь работ в духе Asana: месяц, неделя и список задач по срокам,
// галочка «выполнено», цвет — тип задачи, справа — задачи выбранного дня.
// Данные — тот же объект событий кабинета: ключи «YYYY-MM-DD» или номер дня (старый формат,
// такие события показываются в каждом месяце, как и раньше).

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WD_FULL = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

const KINDS = {
  project: { label: 'Проект', tone: 'cyan' },
  stage: { label: 'Этап работ', tone: 'violet' },
  review: { label: 'На проверке', tone: 'amber' },
  deadline: { label: 'Дедлайн', tone: 'rose' },
  lead: { label: 'Заявка', tone: 'orange' },
  done: { label: 'Выполнено', tone: 'mint' },
};
const KIND_ORDER = ['project', 'stage', 'review', 'deadline', 'lead', 'done'];

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const startOfDay = (dt) => { const x = new Date(dt); x.setHours(0, 0, 0, 0); return x; };
const dayIdx = (dt) => (dt.getDay() + 6) % 7; // понедельник = 0
const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };

export function kindOf(e) {
  const st = String(e.status || '').toLowerCase();
  if (e.type === 'completed' || st === 'завершено' || st === 'выполнено' || st === 'сдано') return 'done';
  if (e.type === 'deadline' || st === 'дедлайн' || st === 'просрочено') return 'deadline';
  if (e.type === 'in_review' || e.type === 'request' || st === 'на проверке' || st === 'ожидает приёмки') return 'review';
  if (e.type === 'work_stage') return 'stage';
  if (e.type === 'active_project' || e.type === 'object' || st === 'в работе') return 'project';
  return 'lead';
}

function whoOf(e) {
  const named = e.assignee || e.executorName || e.brigade || e.managerName;
  const t = String(e.title || '').toLowerCase();
  let label = 'Менеджер';
  if (e.role === 'engineer' || e.authorRole === 'engineer' || e.type === 'request_engineering' || /экспертиз|псд|инженер|выезд|инспекц/.test(t)) label = 'Инженер';
  else if (e.role === 'executor' || e.type === 'work_stage' || e.type === 'active_project' || /монтаж|стройк|бригад/.test(t)) label = 'Бригада';
  else if (e.type === 'request_construction' || /техник|экскаватор|кран|самосвал/.test(t)) label = 'Техника';
  const name = named ? String(named).replace(/^Бригада:\s*/, '') : label;
  const initials = name.split(/[\s«»"()]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';
  return { name, initials };
}

const startTime = (e) => String(e.time || '').split(/\s*[-–—]\s*/)[0] || '';

function eventsOn(events, y, m, d) {
  const list = [...(events[d] || []), ...(events[isoOf(y, m, d)] || [])];
  const seen = new Set();
  return list.filter((e) => {
    const k = String(e.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dueLabel(date, today) {
  const diff = Math.round((startOfDay(date) - today) / 86400000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  if (diff === -1) return 'Вчера';
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
}

function Checkbox({ done, disabled, title, onToggle, size = 'md' }) {
  return (
    <button
      type="button"
      className={`tc-check tc-check--${size}${done ? ' is-done' : ''}`}
      aria-pressed={done}
      aria-label={done ? `Вернуть в работу: ${title}` : `Отметить выполненной: ${title}`}
      disabled={disabled}
      onClick={(ev) => { ev.stopPropagation(); onToggle(); }}
    >
      <Check size={size === 'sm' ? 10 : 13} strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

export default function TaskCalendar({
  events = {},
  year,
  month,
  day,
  view = 'month',
  onViewChange,
  onNavigate,
  viewRole = 'engineer',
  currentUser,
  onBack,
  onOpen,
  onCreate,
  onToggleDone,
  onDelete,
}) {
  const [filter, setFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({ done: true });

  const today = startOfDay(new Date());
  const isAdmin = currentUser?.role === 'admin' || viewRole === 'admin';
  const canEdit = viewRole !== 'customer';
  const selected = new Date(year, month, day);
  const canAddOn = (dt) => canEdit && (isAdmin || startOfDay(dt) >= today);
  const canDelete = (e) => canEdit && (isAdmin || !e.createdBy || e.createdBy === currentUser?.id || e.assignedTo === currentUser?.id);
  const match = (e) => filter === 'all' || kindOf(e) === filter;

  const subtitle = {
    customer: 'Этапы, выезды и приёмки по вашим объектам',
    executor: 'Наряды, этапы и выезды бригады',
    engineer: 'Инспекции, приёмки и дедлайны',
    admin: 'Все работы на платформе',
    company: 'Работы и сроки по объектам компании',
  }[viewRole] || 'Задачи и сроки по объектам';

  // ── месячная сетка ─────────────────────────────────────────
  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -dayIdx(first));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeksNeeded = Math.ceil((dayIdx(first) + new Date(year, month + 1, 0).getDate()) / 7);
  const monthCells = cells.slice(0, weeksNeeded * 7);

  // события видимого месяца — для счётчиков фильтров
  const monthEvents = useMemo(() => {
    const out = [];
    const dim = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) eventsOn(events, year, month, d).forEach((e) => out.push(e));
    return out;
  }, [events, year, month]);
  const counts = useMemo(() => {
    const c = { all: monthEvents.length };
    monthEvents.forEach((e) => { const k = kindOf(e); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [monthEvents]);

  // ── список: все задачи с датой ─────────────────────────────
  const allDated = useMemo(() => {
    const out = [];
    const seen = new Set();
    Object.keys(events).forEach((key) => {
      let dt = null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) { const [y, m, d] = key.split('-').map(Number); dt = new Date(y, m - 1, d); }
      else if (/^\d{1,2}$/.test(key)) dt = new Date(year, month, Number(key));
      if (!dt) return;
      (events[key] || []).forEach((e) => {
        const k = `${e.id}|${dt.toDateString()}`;
        if (seen.has(k)) return;
        seen.add(k);
        out.push({ e, dt });
      });
    });
    return out.sort((a, b) => a.dt - b.dt || startTime(a.e).localeCompare(startTime(b.e)));
  }, [events, year, month]);

  const sections = useMemo(() => {
    const weekEnd = addDays(today, 7);
    const groups = { overdue: [], today: [], week: [], later: [], done: [] };
    allDated.filter(({ e }) => match(e)).forEach((it) => {
      const done = kindOf(it.e) === 'done';
      const d0 = startOfDay(it.dt);
      if (done) groups.done.push(it);
      else if (d0 < today) groups.overdue.push(it);
      else if (+d0 === +today) groups.today.push(it);
      else if (d0 <= weekEnd) groups.week.push(it);
      else groups.later.push(it);
    });
    return [
      { id: 'overdue', title: 'Просрочено', items: groups.overdue, tone: 'rose' },
      { id: 'today', title: 'Сегодня', items: groups.today, tone: 'amber' },
      { id: 'week', title: 'Ближайшие 7 дней', items: groups.week, tone: 'cyan' },
      { id: 'later', title: 'Позже', items: groups.later, tone: 'violet' },
      { id: 'done', title: 'Выполнено', items: groups.done, tone: 'mint' },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDated, filter]);

  // ── навигация ──────────────────────────────────────────────
  const go = (dt) => onNavigate(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const shift = (dir) => {
    if (view === 'week') { go(addDays(selected, dir * 7)); return; }
    const target = new Date(year, month + dir, 1);
    const dim = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    onNavigate(target.getFullYear(), target.getMonth(), Math.min(day, dim));
  };
  const weekStart = addDays(selected, -dayIdx(selected));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEndDt = weekDays[6];
  const navLabel = view === 'week'
    ? (weekStart.getMonth() === weekEndDt.getMonth()
      ? `${weekStart.getDate()}–${weekEndDt.getDate()} ${MONTHS_GEN[weekEndDt.getMonth()]} ${weekEndDt.getFullYear()}`
      : `${weekStart.getDate()} ${MONTHS_GEN[weekStart.getMonth()]} – ${weekEndDt.getDate()} ${MONTHS_GEN[weekEndDt.getMonth()]}`)
    : `${MONTHS[month]} ${year}`;

  const openTask = (e, dt) => { go(dt); onOpen(e); };
  const selectedEvents = eventsOn(events, year, month, day).filter(match);
  const isToday = (dt) => +startOfDay(dt) === +today;

  const views = [
    { id: 'month', label: 'Месяц', icon: CalendarDays },
    { id: 'week', label: 'Неделя', icon: Rows3 },
    { id: 'list', label: 'Список', icon: ListChecks },
  ];

  // ── элементы ───────────────────────────────────────────────
  // обычные функции, а не компоненты: иначе при каждой перерисовке элементы пересоздаются и теряют фокус
  const pill = (e, dt) => {
    const k = kindOf(e);
    const done = k === 'done';
    const title = e.stageName || e.title || 'Задача';
    return (
      <div key={e.id} className={`tc-pill tc-t-${KINDS[k].tone}${done ? ' is-done' : ''}`}>
        <Checkbox size="sm" done={done} disabled={!canEdit} title={title} onToggle={() => onToggleDone(e)} />
        <button type="button" className="tc-pill-text" onClick={(ev) => { ev.stopPropagation(); openTask(e, dt); }} title={`${title}${e.time ? ` · ${e.time}` : ''}`}>
          {startTime(e) && <span className="tc-pill-time">{startTime(e)}</span>}
          <span className="tc-pill-title">{title}</span>
        </button>
      </div>
    );
  };

  const taskCard = (e, dt) => {
    const k = kindOf(e);
    const done = k === 'done';
    const who = whoOf(e);
    const title = e.stageName || e.title || 'Задача';
    return (
      <article key={e.id} className={`tc-card tc-t-${KINDS[k].tone}${done ? ' is-done' : ''}`}>
        <div className="tc-card-top">
          <Checkbox done={done} disabled={!canEdit} title={title} onToggle={() => onToggleDone(e)} />
          <button type="button" className="tc-card-title" onClick={() => openTask(e, dt)}>{title}</button>
        </div>
        <div className="tc-card-meta">
          {e.time && <span><Clock size={13} aria-hidden="true" />{e.time}</span>}
          {e.location && <span><MapPin size={13} aria-hidden="true" />{e.location}</span>}
          {e.contractor && <span><Building2 size={13} aria-hidden="true" />{e.contractor}</span>}
        </div>
        <div className="tc-card-foot">
          <span className="tc-kind"><i aria-hidden="true" />{KINDS[k].label}</span>
          {e.status && kindOf({ status: e.status }) !== k && <span className="tc-status">{e.status}</span>}
          <span className="tc-card-actions">
            <span className="tc-avatar" title={who.name} aria-label={`Ответственный: ${who.name}`} role="img">{who.initials}</span>
            <button type="button" className="tc-icon-btn" onClick={() => openTask(e, dt)} aria-label={canEdit ? `Изменить: ${title}` : `Открыть: ${title}`}>
              {canEdit ? <Pencil size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            </button>
            {canDelete(e) && (
              <button type="button" className="tc-icon-btn tc-icon-btn--danger" onClick={() => onDelete(e.id)} aria-label={`Удалить: ${title}`}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>
      </article>
    );
  };

  return (
    <section className="tc" aria-labelledby="tc-title">
      {/* шапка */}
      <header className="tc-head tc-panel">
        <div className="tc-head-main">
          {onBack && (
            <button type="button" className="tc-icon-btn tc-back" onClick={onBack} aria-label="Назад">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          )}
          <div>
            <span className="tc-bar" aria-hidden="true" />
            <h2 id="tc-title" className="tc-title">Календарь работ</h2>
            <p className="tc-sub">{subtitle}</p>
          </div>
        </div>
        <div className="tc-head-tools">
          <div className="tc-seg" role="group" aria-label="Вид календаря">
            {views.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? 'is-active' : ''} onClick={() => onViewChange(id)}>
                <Icon size={15} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
          {view !== 'list' && (
            <div className="tc-nav">
              <button type="button" className="tc-icon-btn" onClick={() => shift(-1)} aria-label={view === 'week' ? 'Предыдущая неделя' : 'Предыдущий месяц'}><ChevronLeft size={18} aria-hidden="true" /></button>
              <span className="tc-nav-label" aria-live="polite">{navLabel}</span>
              <button type="button" className="tc-icon-btn" onClick={() => shift(1)} aria-label={view === 'week' ? 'Следующая неделя' : 'Следующий месяц'}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          )}
          {view !== 'list' && <button type="button" className="tc-btn tc-btn--ghost" onClick={() => go(new Date())}>Сегодня</button>}
          {canAddOn(selected) && (
            <button type="button" className="tc-btn tc-btn--gold" onClick={() => onCreate(year, month, day)}>
              <Plus size={17} aria-hidden="true" />Задача
            </button>
          )}
        </div>
      </header>

      {/* фильтры = легенда цветов */}
      <div className="tc-filters" role="group" aria-label="Фильтр по типу задач">
        <button type="button" aria-pressed={filter === 'all'} className={`tc-chip${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
          Все <b>{counts.all || 0}</b>
        </button>
        {KIND_ORDER.map((k) => (
          <button key={k} type="button" aria-pressed={filter === k} className={`tc-chip tc-t-${KINDS[k].tone}${filter === k ? ' is-active' : ''}`} onClick={() => setFilter(filter === k ? 'all' : k)}>
            <i aria-hidden="true" />{KINDS[k].label} <b>{counts[k] || 0}</b>
          </button>
        ))}
        {view !== 'list' && <span className="tc-filters-note">за {MONTHS[month].toLowerCase()}</span>}
      </div>

      <div className={`tc-body${view === 'list' ? ' tc-body--list' : ''}`}>
        {/* МЕСЯЦ */}
        {view === 'month' && (
          <div className="tc-panel tc-month">
            <div className="tc-wd" aria-hidden="true">{WD.map((w, i) => <span key={w} className={i > 4 ? 'is-weekend' : ''}>{w}</span>)}</div>
            <div className="tc-grid" style={{ gridTemplateRows: `repeat(${weeksNeeded}, minmax(0, 1fr))` }}>
              {monthCells.map((dt) => {
                const inMonth = dt.getMonth() === month;
                const list = inMonth ? eventsOn(events, year, month, dt.getDate()).filter(match) : [];
                const sel = inMonth && dt.getDate() === day;
                const label = `${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]}, ${WD_FULL[dayIdx(dt)]}: ${list.length ? `задач ${list.length}` : 'задач нет'}`;
                return (
                  <div key={dt.toDateString()} className={`tc-cell${inMonth ? '' : ' is-out'}${sel ? ' is-selected' : ''}${isToday(dt) ? ' is-today' : ''}${dayIdx(dt) > 4 ? ' is-weekend' : ''}`} onClick={() => go(dt)}>
                    <div className="tc-cell-head">
                      <button type="button" className="tc-daynum" onClick={(ev) => { ev.stopPropagation(); go(dt); }} aria-label={label} aria-current={isToday(dt) ? 'date' : undefined}>{dt.getDate()}</button>
                      {inMonth && canAddOn(dt) && (
                        <button type="button" className="tc-cell-add" onClick={(ev) => { ev.stopPropagation(); go(dt); onCreate(dt.getFullYear(), dt.getMonth(), dt.getDate()); }} aria-label={`Добавить задачу на ${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]}`}>
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {list.length > 0 && (
                      <div className="tc-cell-list">
                        {list.slice(0, 3).map((e) => pill(e, dt))}
                        {list.length > 3 && (
                          <button type="button" className="tc-more" onClick={(ev) => { ev.stopPropagation(); go(dt); }}>ещё {list.length - 3}</button>
                        )}
                      </div>
                    )}
                    {list.length > 0 && <span className="tc-dots" aria-hidden="true">{list.slice(0, 4).map((e) => <i key={e.id} className={`tc-t-${KINDS[kindOf(e)].tone}`} />)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* НЕДЕЛЯ */}
        {view === 'week' && (
          <div className="tc-panel tc-week">
            {weekDays.map((dt) => {
              const list = eventsOn(events, dt.getFullYear(), dt.getMonth(), dt.getDate()).filter(match);
              const sel = +startOfDay(dt) === +startOfDay(selected);
              return (
                <div key={dt.toDateString()} className={`tc-wcol${sel ? ' is-selected' : ''}${isToday(dt) ? ' is-today' : ''}`}>
                  <button type="button" className="tc-wcol-head" onClick={() => go(dt)} aria-current={isToday(dt) ? 'date' : undefined}>
                    <span>{WD[dayIdx(dt)]}</span>
                    <b>{dt.getDate()}</b>
                  </button>
                  <div className="tc-wcol-list">
                    {list.map((e) => pill(e, dt))}
                    {list.length === 0 && <span className="tc-wcol-empty">—</span>}
                    {canAddOn(dt) && (
                      <button type="button" className="tc-wcol-add" onClick={() => { go(dt); onCreate(dt.getFullYear(), dt.getMonth(), dt.getDate()); }} aria-label={`Добавить задачу на ${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]}`}>
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* СПИСОК */}
        {view === 'list' && (
          <div className="tc-panel tc-list">
            <div className="tc-list-head" aria-hidden="true">
              <span>Задача</span><span>Тип</span><span>Ответственный</span><span>Срок</span><span />
            </div>
            {sections.map((s) => (
              <div key={s.id} className={`tc-sec tc-t-${s.tone}`}>
                <button type="button" className="tc-sec-head" aria-expanded={!collapsed[s.id]} onClick={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}>
                  <ChevronDown size={16} aria-hidden="true" className="tc-sec-caret" />
                  {s.title}<b>{s.items.length}</b>
                </button>
                {!collapsed[s.id] && (
                  <div className="tc-sec-body">
                    {s.items.length === 0 && <p className="tc-sec-empty">Задач нет</p>}
                    {s.items.map(({ e, dt }) => {
                      const k = kindOf(e);
                      const done = k === 'done';
                      const title = e.stageName || e.title || 'Задача';
                      const who = whoOf(e);
                      const overdue = !done && startOfDay(dt) < today;
                      return (
                        <div key={`${e.id}-${dt.toDateString()}`} className={`tc-row tc-t-${KINDS[k].tone}${done ? ' is-done' : ''}`}>
                          <div className="tc-row-main">
                            <Checkbox done={done} disabled={!canEdit} title={title} onToggle={() => onToggleDone(e)} />
                            <button type="button" className="tc-row-title" onClick={() => openTask(e, dt)}>
                              {title}
                              {(e.location || e.contractor) && <small>{[e.location, e.contractor].filter(Boolean).join(' · ')}</small>}
                            </button>
                          </div>
                          <span className="tc-kind"><i aria-hidden="true" />{KINDS[k].label}</span>
                          <span className="tc-row-who"><span className="tc-avatar" aria-hidden="true">{who.initials}</span>{who.name}</span>
                          <span className={`tc-due${overdue ? ' is-overdue' : ''}${isToday(dt) && !done ? ' is-today' : ''}`}>{dueLabel(dt, today)}</span>
                          <span className="tc-row-actions">
                            {canDelete(e) && (
                              <button type="button" className="tc-icon-btn tc-icon-btn--danger" onClick={() => onDelete(e.id)} aria-label={`Удалить: ${title}`}>
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                    {s.id === 'today' && canAddOn(today) && (
                      <button type="button" className="tc-row-add" onClick={() => { go(today); onCreate(today.getFullYear(), today.getMonth(), today.getDate()); }}>
                        <Plus size={15} aria-hidden="true" />Добавить задачу на сегодня
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ДЕНЬ */}
        {view !== 'list' && (
          <aside className="tc-panel tc-day" aria-labelledby="tc-day-title">
            <div className="tc-day-head">
              <div>
                <p className="tc-day-wd">{isToday(selected) ? 'Сегодня' : WD_FULL[dayIdx(selected)]}</p>
                <h3 id="tc-day-title">{`Задачи на ${day} ${MONTHS_GEN[month]}`}</h3>
              </div>
              <span className="tc-day-count" aria-label={`Задач: ${selectedEvents.length}`}>{selectedEvents.length}</span>
            </div>
            {selectedEvents.length > 0 ? (
              <div className="tc-day-list">
                {selectedEvents.map((e) => taskCard(e, selected))}
              </div>
            ) : (
              <div className="tc-empty">
                <CalendarDays size={28} aria-hidden="true" />
                <p>{filter === 'all' ? 'На этот день задач нет' : 'Задач этого типа на день нет'}</p>
              </div>
            )}
            {canAddOn(selected) && (
              <button type="button" className="tc-row-add" onClick={() => onCreate(year, month, day)}>
                <Plus size={15} aria-hidden="true" />Добавить задачу на этот день
              </button>
            )}
          </aside>
        )}
      </div>
    </section>
  );
}
