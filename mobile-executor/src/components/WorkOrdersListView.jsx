import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import WorkOrderCard from './WorkOrderCard';
import { EmptyState } from './ui/kit';
import { localDateISO } from '../api/syncCore';

const FILTERS = [
  { id: 'all', label: 'Все', test: () => true },
  { id: 'in_work', label: 'В работе', test: o => o.status === 'В работе' || o.status === 'На объекте' },
  { id: 'departure', label: 'К выезду', test: o => o.status === 'Новые' || o.status === 'Выезд назначен' },
  { id: 'acceptance', label: 'Приёмка', test: o => o.status === 'Приёмка' },
  { id: 'completed', label: 'Сданы', test: o => o.status === 'Завершено' }
];

export default function WorkOrdersListView({ orders = [], onSelectOrder, searchQuery }) {
  const [filterTab, setFilterTab] = useState('all');
  const today = localDateISO();
  const q = (searchQuery || '').trim().toLowerCase();
  const searched = orders.filter(o => !q || [o.client, o.title, o.location, o.phone].some(v => String(v || '').toLowerCase().includes(q)));
  const active = FILTERS.find(f => f.id === filterTab) || FILTERS[0];
  const list = searched.filter(active.test).sort((a, b) => {
    const ka = a.date ? (a.date < today ? `2${a.date}` : `1${a.date}`) : '3';
    const kb = b.date ? (b.date < today ? `2${b.date}` : `1${b.date}`) : '3';
    return ka.localeCompare(kb) || String(a.time || '').localeCompare(String(b.time || ''));
  });
  const stagesDone = orders.reduce((s, o) => s + (o.stages || []).filter(x => x.done).length, 0);
  const inWork = orders.filter(FILTERS[1].test).length;

  return (
    <div className="qz-page">
      <div className="qz-section-head">
        <h2 className="qz-h2">{inWork ? `В работе: ${inWork}` : 'Нарядов в работе нет'}</h2>
        <span className="qz-small qz-faint num">этапов сдано: {stagesDone}</span>
      </div>

      <div className="qz-chips" role="tablist" aria-label="Фильтр нарядов">
        {FILTERS.map(f => {
          const on = filterTab === f.id;
          return (
            <button key={f.id} type="button" role="tab" aria-selected={on} className={`qz-chip${on ? ' is-active' : ''}`} onClick={() => setFilterTab(f.id)}>
              {f.label} <span className="qz-count">{searched.filter(f.test).length}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title={q ? 'Ничего не найдено' : 'Нарядов нет'}
          text={q ? 'Проверьте объект, клиента или адрес.' : 'Новые наряды появятся после синхронизации с сервером.'}
        />
      ) : (
        <div className="qz-stack" style={{ marginTop: 'var(--sp-2)' }}>
          {list.map(order => <WorkOrderCard key={order.id} order={order} onSelectOrder={onSelectOrder} />)}
        </div>
      )}
    </div>
  );
}
