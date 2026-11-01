import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import InspectionCard from './InspectionCard';
import { EmptyState } from './ui/kit';
import { localDateISO } from '../api/syncCore';

const FILTERS = [
  { id: 'all', label: 'Все', test: () => true },
  { id: 'need_departure', label: 'К выезду', test: d => ['Новые', 'Выезд назначен', 'Инженер выехал'].includes(d.status) },
  { id: 'inspecting', label: 'На объекте', test: d => d.status === 'На объекте' },
  { id: 'measured', label: 'Замер готов', test: d => ['Замер выполнен', 'Смета готова'].includes(d.status) },
  { id: 'in_work', label: 'В работе', test: d => d.status === 'В работе' },
  { id: 'completed', label: 'Завершены', test: d => d.status === 'Завершено' }
];

export default function InspectionListView({ deals, onSelectDeal, searchQuery }) {
  const [filterTab, setFilterTab] = useState('all');
  const today = localDateISO();
  const q = (searchQuery || '').trim().toLowerCase();

  const searched = deals.filter(d => !q || [d.client, d.title, d.location, d.phone].some(v => String(v || '').toLowerCase().includes(q)));
  const active = FILTERS.find(f => f.id === filterTab) || FILTERS[0];
  const list = searched
    .filter(active.test)
    .sort((a, b) => {
      // today first, then upcoming by date/time, undated last
      const ka = a.date ? (a.date < today ? `2${a.date}` : `1${a.date}`) : '3';
      const kb = b.date ? (b.date < today ? `2${b.date}` : `1${b.date}`) : '3';
      return ka.localeCompare(kb) || String(a.time || '').localeCompare(String(b.time || ''));
    });
  const todayCount = deals.filter(d => d.date === today && d.status !== 'Завершено').length;

  return (
    <div className="qz-page">
      <div className="qz-section-head">
        <h2 className="qz-h2">{todayCount ? `Сегодня выездов: ${todayCount}` : 'Сегодня выездов нет'}</h2>
        <span className="qz-small qz-faint num">всего {deals.length}</span>
      </div>

      <div className="qz-chips" role="tablist" aria-label="Фильтр объектов">
        {FILTERS.map(f => {
          const n = searched.filter(f.test).length;
          const on = filterTab === f.id;
          return (
            <button key={f.id} type="button" role="tab" aria-selected={on} className={`qz-chip${on ? ' is-active' : ''}`} onClick={() => setFilterTab(f.id)}>
              {f.label} <span className="qz-count">{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title={q ? 'Ничего не найдено' : 'Здесь пусто'}
          text={q ? 'Проверьте клиента, адрес или телефон.' : 'Объекты с таким статусом появятся после синхронизации.'}
        />
      ) : (
        <div className="qz-stack" style={{ marginTop: 'var(--sp-2)' }}>
          {list.map(deal => <InspectionCard key={deal.id} deal={deal} onSelect={onSelectDeal} />)}
        </div>
      )}
    </div>
  );
}
