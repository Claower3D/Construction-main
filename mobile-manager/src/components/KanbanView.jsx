import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import DealCard from './DealCard';
import { STAGES, ROLE_CONFIG } from '../api/crmApi';
import { EmptyState, formatMoney } from './ui/kit';

// Deals with statuses from other apps (engineer/executor/web calendar) go to «Прочие» instead of vanishing
const OTHER_STAGE = 'Прочие';
const inStage = (d, st) => (st === OTHER_STAGE ? !STAGES.includes(d.status) : d.status === st);

export default function KanbanView({ deals, onSelectDeal, searchQuery }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [roleFilter, setRoleFilter] = useState('all');
  const boardRef = useRef(null);
  const tabsRef = useRef(null);

  const stages = useMemo(
    () => [...STAGES, ...(deals.some(d => inStage(d, OTHER_STAGE)) ? [OTHER_STAGE] : [])],
    [deals]
  );

  const visibleDeals = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return deals.filter(d => {
      if (roleFilter !== 'all' && d.role !== roleFilter) return false;
      if (!q) return true;
      return [d.title, d.client, d.location, d.phone].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [deals, roleFilter, searchQuery]);

  const columns = stages.map(st => {
    const items = visibleDeals
      .filter(d => inStage(d, st))
      .sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999')) || String(a.time || '').localeCompare(String(b.time || '')));
    return { stage: st, items, sum: items.reduce((s, d) => s + (Number(d.budget) || 0), 0) };
  });

  const roleCounts = Object.keys(ROLE_CONFIG)
    .map(k => ({ key: k, label: ROLE_CONFIG[k].subBadge ? ROLE_CONFIG[k].badge.charAt(0) + ROLE_CONFIG[k].badge.slice(1).toLowerCase() : k, count: deals.filter(d => d.role === k).length }))
    .filter(r => r.count > 0);

  // keep the active stage tab in sync with the swiped column
  const onScroll = useCallback(() => {
    const el = boardRef.current;
    if (!el || !el.firstElementChild) return;
    const colW = el.firstElementChild.getBoundingClientRect().width + 12;
    const idx = Math.max(0, Math.min(stages.length - 1, Math.round(el.scrollLeft / colW)));
    setActiveIdx(prev => (prev === idx ? prev : idx));
  }, [stages.length]);

  useEffect(() => {
    const tab = tabsRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeIdx]);

  const goTo = (idx) => {
    const el = boardRef.current;
    const col = el?.children[idx];
    if (el && col) el.scrollTo({ left: col.offsetLeft - 16, behavior: 'smooth' });
    setActiveIdx(idx);
  };

  return (
    <div style={{ paddingTop: 'var(--sp-3)' }}>
      {/* Stage tabs (also a summary of the pipeline) */}
      <div className="qz-chips" ref={tabsRef} role="tablist" aria-label="Этапы воронки" style={{ margin: 0 }}>
        {columns.map((c, i) => (
          <button
            key={c.stage}
            type="button"
            role="tab"
            data-idx={i}
            aria-selected={activeIdx === i}
            className={`qz-chip${activeIdx === i ? ' is-active' : ''}`}
            onClick={() => goTo(i)}
          >
            {c.stage} <span className="qz-count">{c.items.length}</span>
          </button>
        ))}
      </div>

      {roleCounts.length > 1 && (
        <div className="qz-chips" style={{ margin: 0 }} aria-label="Направление">
          <button type="button" className={`qz-chip${roleFilter === 'all' ? ' is-active' : ''}`} onClick={() => setRoleFilter('all')} style={{ minHeight: 36 }}>
            Все направления
          </button>
          {roleCounts.map(r => (
            <button key={r.key} type="button" className={`qz-chip${roleFilter === r.key ? ' is-active' : ''}`} onClick={() => setRoleFilter(roleFilter === r.key ? 'all' : r.key)} style={{ minHeight: 36 }}>
              {r.label} <span className="qz-count">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="qz-dots" aria-hidden="true">
        {columns.map((c, i) => <i key={c.stage} className={i === activeIdx ? 'is-active' : ''} />)}
      </div>

      {/* Swipeable columns */}
      <div className="qz-board" ref={boardRef} onScroll={onScroll}>
        {columns.map(c => (
          <section key={c.stage} className="qz-col" aria-label={`${c.stage}: ${c.items.length}`}>
            <div className="qz-col-head">
              <h2 className="qz-h2">{c.stage} <span className="qz-faint num" style={{ fontWeight: 500 }}>{c.items.length}</span></h2>
              <span className="qz-col-sum">{c.sum > 0 ? formatMoney(c.sum) : ''}</span>
            </div>
            {c.items.length === 0 ? (
              <div className="qz-card is-flat" style={{ borderStyle: 'dashed' }}>
                <EmptyState
                  icon={<Inbox size={26} />}
                  title={searchQuery ? 'Ничего не найдено' : 'Пока пусто'}
                  text={searchQuery ? 'Измените запрос или направление.' : 'Сделки с этим статусом появятся здесь.'}
                />
              </div>
            ) : (
              c.items.map(deal => <DealCard key={deal.id} deal={deal} onClick={onSelectDeal} />)
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
