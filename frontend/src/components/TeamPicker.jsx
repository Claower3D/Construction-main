import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { authHeaders } from '../services/platformUtils';
import './WorkPicker.css';
import './TeamPicker.css';

// Выбор мастеров и бригад деревом: фирма → бригады и работники, отдельно — одиночки.
// entries: [{ type: 'person' | 'brigade' | 'custom', id, name, companyId, companyName }]
// Список команды приходит с сервера (/api/v1/crm/team); фирмы и работников заводит администратор.

const ROLE_RU = { executor: 'исполнитель', engineer: 'инженер', company: 'подрядчик' };
const keyOf = (e) => `${e.type}:${e.id || e.name}`;
const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е').trim();

let teamCache = null; // { at, data }
export async function loadTeam(force = false) {
  if (!force && teamCache && Date.now() - teamCache.at < 60000) return teamCache.data;
  const res = await fetch('/api/v1/crm/team', { headers: authHeaders() });
  if (!res.ok) {
    let msg = `сервер ответил ${res.status}`;
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch { /* не JSON */ }
    throw new Error(msg);
  }
  const data = await res.json();
  teamCache = { at: Date.now(), data };
  return data;
}

// Старые карточки хранят мастеров одной строкой — превращаем её в список «своих» записей.
export function entriesFromCard(card) {
  if (Array.isArray(card.assignedTeam)) return card.assignedTeam.filter((e) => e && e.name);
  return String(card.assignedWorkers || '').split(',').map((s) => s.trim()).filter(Boolean)
    .map((name) => ({ type: 'custom', id: '', name, companyId: '', companyName: '' }));
}

// Поля карточки, которые выводятся из выбора (ими пользуются календарь исполнителя и старые экраны).
export function teamFields(entries) {
  const uniq = (a) => Array.from(new Set(a.filter(Boolean)));
  return {
    assignedTeam: entries,
    assignedWorkers: entries.map((e) => e.name).join(', '),
    assignedWorkerIds: uniq(entries.filter((e) => e.type === 'person').map((e) => e.id)),
    assignedBrigadeIds: uniq(entries.filter((e) => e.type === 'brigade').map((e) => e.id)),
    assignedCompanyIds: uniq(entries.map((e) => e.companyId)),
  };
}

export default function TeamPicker({ entries, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState({});
  const [draft, setDraft] = useState(entries);
  const [custom, setCustom] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setDraft(entries);
    setQuery('');
    setCustom('');
    setError('');
    let alive = true;
    loadTeam().then((d) => { if (alive) setTeam(d); }).catch((e) => { if (alive) setError(e.message); });
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('keydown', onKey, true);
    return () => { alive = false; clearTimeout(t); document.removeEventListener('keydown', onKey, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const picked = useMemo(() => new Set(draft.map(keyOf)), [draft]);
  const toggle = (entry) => setDraft((prev) => (prev.some((e) => keyOf(e) === keyOf(entry)) ? prev.filter((e) => keyOf(e) !== keyOf(entry)) : [...prev, entry]));

  const q = norm(query);
  const groups = useMemo(() => {
    if (!team) return [];
    const match = (s) => !q || norm(s).includes(q);
    const list = (team.companies || []).map((c) => {
      const whole = match(c.name) || match(c.city);
      return {
        id: c.id, name: c.name, sub: [c.type, c.city].filter(Boolean).join(' · '),
        brigades: (c.brigades || []).filter((b) => whole || match(b.name) || match(b.foreman) || match(b.skills)),
        people: (c.people || []).filter((p) => whole || match(p.name)),
      };
    }).filter((g) => !q || g.brigades.length || g.people.length);
    const solo = (team.solo || []).filter((p) => match(p.name));
    if (solo.length) list.push({ id: '', name: 'Без фирмы', sub: 'работают сами', brigades: [], people: solo });
    return list;
  }, [team, q]);

  const personEntry = (p, g) => ({ type: 'person', id: p.id, name: p.name || 'Без имени', companyId: g.id, companyName: g.id ? g.name : '' });
  const brigadeEntry = (b, g) => ({ type: 'brigade', id: b.id, name: `Бригада «${b.name}»`, companyId: g.id, companyName: g.name });
  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (!draft.some((e) => norm(e.name) === norm(name))) setDraft((prev) => [...prev, { type: 'custom', id: '', name, companyId: '', companyName: '' }]);
    setCustom('');
  };
  const done = () => { onChange(draft); setOpen(false); };

  const check = (entry, title, sub, badge) => {
    const on = picked.has(keyOf(entry));
    return (
      <button type="button" key={keyOf(entry)} className={`tp-item${on ? ' is-on' : ''}`} role="checkbox" aria-checked={on} onClick={() => toggle(entry)}>
        <span className="tp-box" aria-hidden="true">{on ? '✓' : ''}</span>
        <span className="tp-item-text">
          <span className="tp-item-name">{title}</span>
          {sub && <span className="tp-item-sub">{sub}</span>}
        </span>
        {badge && <span className="tp-badge">{badge}</span>}
      </button>
    );
  };

  const sheet = open && createPortal(
    <div className="wp-overlay" onClick={() => setOpen(false)}>
      <div className="wp-sheet" role="dialog" aria-modal="true" aria-label="Мастера и бригады" onClick={(e) => e.stopPropagation()}>
        <div className="wp-head">
          <div className="wp-title">Мастера и бригады</div>
          <button type="button" className="wp-close" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
        </div>
        <div className="wp-search">
          <span aria-hidden="true">🔎</span>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени, бригаде, фирме…" aria-label="Поиск мастера или бригады" />
          {query && <button type="button" className="wp-clear" onClick={() => setQuery('')} aria-label="Очистить поиск">✕</button>}
        </div>

        <div className="wp-body">
          {error && <div className="tp-error">Список команды не загрузился: {error}. Можно добавить мастера вручную ниже.</div>}
          {!team && !error && <div className="wp-empty">Загружаю список команды…</div>}
          {team && groups.length === 0 && <div className="wp-empty">{q ? 'Никого не нашлось. Можно добавить вручную ниже.' : 'Фирм и работников пока нет — их добавляет администратор в разделе «Пользователи».'}</div>}
          {groups.map((g) => {
            const opened = q ? true : (openIds[g.id || 'solo'] ?? (groups.length <= 3));
            const count = g.people.filter((p) => picked.has(keyOf(personEntry(p, g)))).length + g.brigades.filter((b) => picked.has(keyOf(brigadeEntry(b, g)))).length;
            return (
              <div className="tp-group" key={g.id || 'solo'}>
                <button type="button" className="tp-group-head" aria-expanded={opened} onClick={() => setOpenIds((o) => ({ ...o, [g.id || 'solo']: !opened }))}>
                  <span className="tp-caret" aria-hidden="true">{opened ? '▾' : '▸'}</span>
                  <span className="tp-group-name">{g.id ? '🏢' : '👤'} {g.name}</span>
                  <span className="tp-group-sub">{[g.sub, `${g.people.length} чел.`, g.brigades.length ? `${g.brigades.length} бриг.` : ''].filter(Boolean).join(' · ')}</span>
                  {count > 0 && <span className="tp-count">{count}</span>}
                </button>
                {opened && (
                  <div className="tp-branch">
                    {g.brigades.map((b) => check(brigadeEntry(b, g), `Бригада «${b.name}»`, [b.foreman && `бригадир ${b.foreman}`, b.size ? `${b.size} чел.` : '', b.skills].filter(Boolean).join(' · ')))}
                    {g.people.map((p) => check(personEntry(p, g), p.name || 'Без имени', [ROLE_RU[p.role] || p.role, p.phone].filter(Boolean).join(' · '), p.invited ? 'ещё не входил' : ''))}
                    {g.brigades.length + g.people.length === 0 && <div className="wp-empty">В этой фирме пока никого нет.</div>}
                  </div>
                )}
              </div>
            );
          })}

          <div className="tp-custom">
            <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Добавить вручную: имя мастера, которого нет в списке" aria-label="Добавить мастера вручную" />
            <button type="button" onClick={addCustom} disabled={!custom.trim()}>Добавить</button>
          </div>
        </div>

        <div className="tp-foot">
          <div className="tp-chips">
            {draft.length === 0 && <span className="tp-none">Никто не выбран</span>}
            {draft.map((e) => (
              <span className="tp-chip" key={keyOf(e)}>
                {e.name}
                <button type="button" onClick={() => toggle(e)} aria-label={`Убрать: ${e.name}`}>✕</button>
              </span>
            ))}
          </div>
          <button type="button" className="tp-done" onClick={done}>Готово{draft.length ? ` (${draft.length})` : ''}</button>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button type="button" className="tp-trigger" onClick={() => !disabled && setOpen(true)} disabled={disabled} aria-haspopup="dialog">
        {entries.length ? (
          <span className="tp-trigger-list">{entries.map((e) => <span className="tp-chip tp-chip--small" key={keyOf(e)}>{e.name}</span>)}</span>
        ) : (
          <span className="tp-none">Выбрать мастеров и бригады</span>
        )}
        <span className="wp-trigger-caret" aria-hidden="true">▾</span>
      </button>
      {sheet}
    </>
  );
}
