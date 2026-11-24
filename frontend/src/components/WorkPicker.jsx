import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WORK_GROUPS, searchWorks, findWork } from './workCatalog';
import './WorkPicker.css';

// Выбор вида работ: кнопка с текущим значением, по нажатию — окно с поиском и группами.
// Работает одинаково на сайте и в приложениях (на телефоне окно занимает весь экран).
// value — название работы; onChange(name, groupName). Можно ввести и свой вариант.
export default function WorkPicker({ value, onChange, placeholder = 'Выберите вид работ' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState(null);
  const inputRef = useRef(null);
  const current = findWork(value);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setGroupId(null);
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('keydown', onKey, true);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey, true); };
  }, [open]);

  const results = useMemo(() => searchWorks(query), [query]);
  const group = WORK_GROUPS.find((g) => g.id === groupId) || null;
  const q = query.trim();
  const exactExists = q && results.some((r) => r.name.toLowerCase() === q.toLowerCase());

  const pick = (name, groupName) => { onChange(name, groupName || ''); setOpen(false); };

  const row = (it, showGroup) => (
    <button type="button" key={`${it.groupId || ''}-${it.name}`} className={`wp-row${it.name === value ? ' is-current' : ''}`} onClick={() => pick(it.name, it.group)}>
      <span className="wp-row-icon" aria-hidden="true">{it.icon}</span>
      <span className="wp-row-text">
        <span className="wp-row-name">{it.name}</span>
        {showGroup && <span className="wp-row-group">{it.group}</span>}
      </span>
    </button>
  );

  const sheet = open && createPortal(
    <div className="wp-overlay" onClick={() => setOpen(false)}>
      <div className="wp-sheet" role="dialog" aria-modal="true" aria-label="Выбор вида работ" onClick={(e) => e.stopPropagation()}>
        <div className="wp-head">
          <div className="wp-title">Вид работ</div>
          <button type="button" className="wp-close" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
        </div>
        <div className="wp-search">
          <span aria-hidden="true">🔎</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: септик, кровля, электрика…"
            aria-label="Поиск вида работ"
          />
          {query && <button type="button" className="wp-clear" onClick={() => { setQuery(''); inputRef.current && inputRef.current.focus(); }} aria-label="Очистить поиск">✕</button>}
        </div>

        <div className="wp-body">
          {q ? (
            <>
              {results.length === 0 && <div className="wp-empty">В каталоге такого нет. Можно оставить свой вариант.</div>}
              {results.map((it) => row(it, true))}
              {!exactExists && (
                <button type="button" className="wp-row wp-row--custom" onClick={() => pick(q, '')}>
                  <span className="wp-row-icon" aria-hidden="true">✏️</span>
                  <span className="wp-row-text">
                    <span className="wp-row-name">Свой вариант: «{q}»</span>
                    <span className="wp-row-group">Записать так, как введено</span>
                  </span>
                </button>
              )}
            </>
          ) : group ? (
            <>
              <button type="button" className="wp-back" onClick={() => setGroupId(null)}>← Все группы</button>
              <div className="wp-group-title"><span aria-hidden="true">{group.icon}</span> {group.name}</div>
              {group.items.map((it) => row({ ...it, group: group.name, groupId: group.id, icon: group.icon }, false))}
            </>
          ) : (
            <div className="wp-tiles">
              {WORK_GROUPS.map((g) => (
                <button type="button" key={g.id} className="wp-tile" onClick={() => setGroupId(g.id)}>
                  <span className="wp-tile-icon" aria-hidden="true">{g.icon}</span>
                  <span className="wp-tile-name">{g.name}</span>
                  <span className="wp-tile-count">{g.items.length} видов работ</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button type="button" className="lead-modal-input wp-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className="wp-trigger-text">
          {value ? <><span aria-hidden="true">{current ? current.icon : '✏️'}</span> {value}</> : <span className="wp-placeholder">{placeholder}</span>}
        </span>
        <span className="wp-trigger-caret" aria-hidden="true">▾</span>
      </button>
      {sheet}
    </>
  );
}
