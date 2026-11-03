import React, { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { SERVICES, GROUPS } from '../data/services';
import { EmptyState } from './ui/kit';

export default function ServicesScreen({ onOpenService }) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const counts = useMemo(() => {
    const c = { all: SERVICES.length };
    SERVICES.forEach((s) => { c[s.group] = (c[s.group] || 0) + 1; });
    return c;
  }, []);
  const query = q.trim().toLowerCase();
  const list = SERVICES.filter((s) => (group === 'all' || s.group === group) && (!query || s.name.toLowerCase().includes(query)));

  return (
    <div className="qz-page">
      <label className="qz-search cl-search">
        <Search size={18} aria-hidden="true" />
        <span className="qz-sr-only">Поиск услуги</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Плитка, кровля, электрика" />
      </label>
      <div className="qz-chips" role="group" aria-label="Группы работ" style={{ margin: '12px -16px 14px', padding: '0 16px' }}>
        {GROUPS.map((g) => (
          <button key={g.id} type="button" className={`qz-chip${group === g.id ? ' is-active' : ''}`} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
            {g.name} <span className="qz-count">{counts[g.id] || 0}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Search size={28} />} title="Ничего не нашли" text="Попробуйте другое слово или опишите работу в заказе — бригада уточнит." />
      ) : (
        <ul className="cl-svc-list">
          {list.map((s) => (
            <li key={s.slug}>
              <button type="button" className="cl-svc-row" onClick={() => onOpenService(s)}>
                <img src={s.image} alt="" loading="lazy" />
                <span className="qz-grow">
                  <strong>{s.name}</strong>
                  <span className="qz-xs qz-faint">{s.count} работ в базе</span>
                  <span className="cl-svc-price">{s.priceRange}</span>
                </span>
                <ChevronRight size={18} className="qz-faint" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
