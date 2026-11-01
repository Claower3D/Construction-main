import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Plus, Check, Phone, Star, Truck, Package, RefreshCw, AlertTriangle, MapPin, X, HardHat, Users } from 'lucide-react';
import { fetchEquipment, fetchMaterials, fetchContractors, formatPrice, telHref } from '../api/marketApi';
import { EmptyState, SkeletonList } from './ui/kit';

// Shared marketplace screen (identical copy in mobile-engineer and mobile-executor).
// Live data from the server; built-in positions are only an offline fallback marked «Демо».

const TABS = [
  { id: 'materials', label: 'Материалы', icon: Package },
  { id: 'equipment', label: 'Техника', icon: Truck },
  { id: 'contractors', label: 'Бригады', icon: HardHat }
];
const PLACEHOLDER = {
  materials: 'Кольцо КС-15, труба 110, цемент',
  equipment: 'Экскаватор, кран, госномер',
  contractors: 'Септики, кровля, имя бригадира'
};

function DemoTag() {
  return <span className="qz-tag is-warn">Демо</span>;
}

function Rating({ value, count }) {
  if (!(value > 0)) return null;
  return (
    <span className="qz-row qz-small" style={{ gap: 4, color: 'var(--warn)', fontWeight: 650 }}>
      <Star size={13} fill="currentColor" aria-hidden="true" /> {value.toFixed(1)}
      {count > 0 && <span className="qz-faint" style={{ fontWeight: 500 }}>({count} отз.)</span>}
    </span>
  );
}

export default function MarketplaceView({
  serverUrl,
  authHeaders,
  addLabel = 'В заявку',
  onAddItem,
  fallbackMaterials = [],
  fallbackEquipment = [],
  defaultCity = ''
}) {
  const [tab, setTab] = useState('materials');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [category, setCategory] = useState('all');
  const [addedIds, setAddedIds] = useState(() => new Set());
  const timersRef = useRef([]);

  const [materials, setMaterials] = useState({ status: 'idle', items: [], total: 0, error: null, demo: false });
  const [equipment, setEquipment] = useState({ status: 'idle', items: [], error: null, demo: false });
  const [contractors, setContractors] = useState({ status: 'idle', items: [], total: 0, error: null, demo: false });

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => { setCategory('all'); }, [tab]);

  // Materials: server-side search
  useEffect(() => {
    if (tab !== 'materials') return undefined;
    const ac = new AbortController();
    setMaterials(prev => ({ ...prev, status: 'loading', error: null }));
    fetchMaterials(serverUrl, authHeaders, debounced, ac.signal)
      .then(({ items, total }) => setMaterials({ status: 'ready', items, total, error: null, demo: false }))
      .catch(err => {
        if (err.aborted) return;
        const q = debounced.toLowerCase();
        const items = fallbackMaterials.filter(m => !q || `${m.name} ${m.category}`.toLowerCase().includes(q));
        setMaterials({ status: 'error', items, total: items.length, error: err.message, demo: true });
      });
    return () => ac.abort();
  }, [tab, debounced, reloadKey, serverUrl, authHeaders, fallbackMaterials]);

  // Equipment: whole list, filtered on the device
  useEffect(() => {
    if (tab !== 'equipment') return undefined;
    const ac = new AbortController();
    setEquipment(prev => ({ ...prev, status: 'loading', error: null }));
    fetchEquipment(serverUrl, authHeaders, ac.signal)
      .then(items => setEquipment({ status: 'ready', items, error: null, demo: false }))
      .catch(err => {
        if (err.aborted) return;
        setEquipment({ status: 'error', items: fallbackEquipment, error: err.message, demo: true });
      });
    return () => ac.abort();
  }, [tab, reloadKey, serverUrl, authHeaders, fallbackEquipment]);

  // Contractors (brigades): server-side search, no offline demo — contacts must be real
  useEffect(() => {
    if (tab !== 'contractors') return undefined;
    const ac = new AbortController();
    setContractors(prev => ({ ...prev, status: 'loading', error: null }));
    fetchContractors(serverUrl, authHeaders, { city: defaultCity, q: debounced }, ac.signal)
      .then(({ items, total }) => setContractors({ status: 'ready', items, total, error: null, demo: false }))
      .catch(err => {
        if (err.aborted) return;
        setContractors({ status: 'error', items: [], total: 0, error: err.message, demo: false });
      });
    return () => ac.abort();
  }, [tab, debounced, reloadKey, serverUrl, authHeaders, defaultCity]);

  const source = tab === 'materials' ? materials : (tab === 'equipment' ? equipment : contractors);

  const categories = useMemo(() => {
    if (tab === 'contractors') return [];
    const counts = new Map();
    source.items.forEach(it => { if (it.category) counts.set(it.category, (counts.get(it.category) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c);
  }, [source.items, tab]);

  const visible = useMemo(() => {
    const q = debounced.toLowerCase();
    return source.items.filter(it => {
      if (category !== 'all' && it.category !== category) return false;
      if (tab === 'equipment' && q) {
        const hay = `${it.name} ${it.category} ${it.city} ${it.ownerName} ${it.plateNumber} ${it.capacity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [source.items, category, debounced, tab]);

  const handleAdd = useCallback((item) => {
    setAddedIds(prev => new Set(prev).add(item.id));
    if (onAddItem) onAddItem({ ...item, title: item.name });
    const t = setTimeout(() => {
      setAddedIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
    }, 1500);
    timersRef.current.push(t);
  }, [onAddItem]);

  return (
    <div className="qz-page">
      <div className="qz-segmented" role="tablist" aria-label="Раздел маркетплейса">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            <span className="qz-row" style={{ justifyContent: 'center', gap: 6 }}><Icon size={16} aria-hidden="true" />{label}</span>
          </button>
        ))}
      </div>

      <label className="qz-search" style={{ marginTop: 'var(--sp-3)' }}>
        <Search size={18} aria-hidden="true" />
        <span className="qz-sr-only">Поиск</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={PLACEHOLDER[tab]} />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск" className="qz-iconbtn" style={{ width: 36, height: 36 }}>
            <X size={16} />
          </button>
        )}
      </label>

      {categories.length > 1 && (
        <div className="qz-chips">
          {['all', ...categories].map(c => (
            <button key={c} type="button" className={`qz-chip${category === c ? ' is-active' : ''}`} onClick={() => setCategory(c)}>
              {c === 'all' ? 'Все' : c}
            </button>
          ))}
        </div>
      )}

      {source.status === 'error' && (
        <div className="qz-card is-warn" role="alert" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: 'var(--sp-2) 0 var(--sp-3)', padding: 'var(--sp-3)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 2 }} />
          <div className="qz-grow qz-small" style={{ color: 'var(--text-2)' }}>
            Сервер недоступен ({source.error}).{' '}
            {source.items.length ? 'Показаны демонстрационные позиции, цены условные.' : 'Подключитесь к сети, чтобы увидеть список.'}
          </div>
          <button type="button" className="qz-btn is-sm" onClick={() => setReloadKey(k => k + 1)}><RefreshCw size={15} /> Повторить</button>
        </div>
      )}

      {source.status === 'loading' && <SkeletonList count={3} height={tab === 'materials' ? 84 : 150} />}

      {source.status !== 'loading' && visible.length === 0 && source.status !== 'error' && (
        <EmptyState
          icon={tab === 'contractors' ? <Users size={28} /> : <Package size={28} />}
          title={debounced || category !== 'all' ? 'Ничего не найдено' : 'Список пуст'}
          text={debounced || category !== 'all' ? 'Измените запрос или категорию.' : 'Позиции появятся, когда их добавят на сервере.'}
        />
      )}

      {/* Materials */}
      {source.status !== 'loading' && tab === 'materials' && visible.length > 0 && (
        <>
          {!materials.demo && materials.total > visible.length && (
            <div className="qz-xs qz-faint" style={{ margin: '0 0 6px' }}>Показано {visible.length} из {materials.total.toLocaleString('ru-RU')}. Уточните поиск.</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {visible.map(item => {
              const added = addedIds.has(item.id);
              return (
                <div key={item.id} className="qz-card" style={{ padding: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                  <div className="qz-grow">
                    <div className="qz-row" style={{ alignItems: 'flex-start', gap: 6 }}>
                      <span className="qz-h3" style={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}>{item.name}</span>
                      {materials.demo && <DemoTag />}
                    </div>
                    {(item.code || item.category) && <div className="qz-xs qz-faint" style={{ marginTop: 2 }}>{[item.code, item.category].filter(Boolean).join(', ')}</div>}
                    <div className="qz-amount" style={{ fontSize: 'var(--fs-md)', marginTop: 4 }}>
                      {formatPrice(item.price)} <span className="qz-small qz-faint" style={{ fontWeight: 500 }}>за {item.unit}</span>
                    </div>
                  </div>
                  {onAddItem && (
                    <button type="button" className={`qz-btn is-sm${added ? ' is-ok' : ''}`} onClick={() => handleAdd(item)} aria-label={`${addLabel}: ${item.name}`}>
                      {added ? <Check size={16} /> : <Plus size={16} />} {added ? 'Добавлено' : addLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Equipment */}
      {source.status !== 'loading' && tab === 'equipment' && visible.length > 0 && (
        <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
          {visible.map(eq => {
            const tel = telHref(eq.ownerPhone);
            const free = /доступ|свобод|available/i.test(eq.status);
            return (
              <div key={eq.id} className="qz-card" style={{ padding: 'var(--sp-3)' }}>
                <div className="qz-row" style={{ alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                  {eq.image && !equipment.demo ? (
                    <img src={eq.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 60, height: 60, borderRadius: 'var(--r-md)', objectFit: 'cover', flexShrink: 0, background: 'var(--surface-2)' }} />
                  ) : (
                    <span style={{ width: 60, height: 60, borderRadius: 'var(--r-md)', flexShrink: 0, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }} aria-hidden="true"><Truck size={26} /></span>
                  )}
                  <div className="qz-grow">
                    <div className="qz-row" style={{ alignItems: 'flex-start', gap: 6 }}>
                      <span className="qz-h3" style={{ lineHeight: 1.25, overflowWrap: 'anywhere' }}>{eq.name}</span>
                      {equipment.demo && <DemoTag />}
                    </div>
                    <div className="qz-small qz-muted" style={{ marginTop: 2 }}>{[eq.category, eq.capacity].filter(Boolean).join(', ')}</div>
                    <div className="qz-row qz-small" style={{ flexWrap: 'wrap', gap: '2px 10px', marginTop: 4 }}>
                      {eq.city && <span className="qz-row qz-muted" style={{ gap: 3 }}><MapPin size={13} aria-hidden="true" />{eq.city}</span>}
                      {eq.plateNumber && <span className="num" style={{ fontWeight: 600 }}>{eq.plateNumber}</span>}
                      <Rating value={eq.rating} count={eq.reviewsCount} />
                    </div>
                    {eq.status && <span className={`qz-status ${free ? 'is-st-done' : 'is-st-attention'}`} style={{ marginTop: 6 }}>{eq.status}</span>}
                  </div>
                </div>
                <hr className="qz-divider" />
                <div className="qz-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    {eq.pricePerHour > 0 && <div className="qz-amount" style={{ fontSize: 'var(--fs-md)' }}>{formatPrice(eq.pricePerHour)} <span className="qz-small qz-faint" style={{ fontWeight: 500 }}>в час</span></div>}
                    {eq.pricePerDay > 0 && <div className="qz-small qz-muted num">{formatPrice(eq.pricePerDay)} за смену</div>}
                    {eq.ownerName && <div className="qz-xs qz-faint">Владелец: {eq.ownerName}</div>}
                  </div>
                  {tel && !equipment.demo
                    ? <a className="qz-btn is-ok is-sm" href={tel}><Phone size={16} /> Позвонить</a>
                    : <span className="qz-xs qz-faint">{equipment.demo ? 'В демо нет контактов' : 'Телефон не указан'}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contractors / brigades */}
      {source.status !== 'loading' && tab === 'contractors' && visible.length > 0 && (
        <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
          {contractors.total > visible.length && <div className="qz-xs qz-faint">Показано {visible.length} из {contractors.total}</div>}
          {visible.map(c => {
            const tel = telHref(c.phone);
            return (
              <div key={c.id} className="qz-card" style={{ padding: 'var(--sp-3)' }}>
                <div className="qz-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="qz-grow">
                    <div className="qz-h3" style={{ overflowWrap: 'anywhere' }}>{c.name}</div>
                    {c.companyName && c.companyName !== c.name && <div className="qz-small qz-muted">{c.companyName}</div>}
                  </div>
                  <Rating value={c.rating} />
                </div>
                <div className="qz-row qz-small qz-muted" style={{ flexWrap: 'wrap', gap: '2px 12px', marginTop: 6 }}>
                  {c.foreman && <span>Бригадир: {c.foreman}</span>}
                  {c.size > 0 && <span className="num">{c.size} чел.</span>}
                  {c.city && <span className="qz-row" style={{ gap: 3 }}><MapPin size={13} aria-hidden="true" />{c.city}</span>}
                </div>
                {c.skills.length > 0 && (
                  <div className="qz-row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {c.skills.slice(0, 6).map(s => <span key={s} className="qz-tag">{s}</span>)}
                  </div>
                )}
                {(tel || c.email) && (
                  <div className="qz-row" style={{ marginTop: 10, gap: 8 }}>
                    {tel && <a className="qz-btn is-ok is-sm" href={tel}><Phone size={16} /> Позвонить</a>}
                    {c.email && <a className="qz-btn is-sm" href={`mailto:${c.email}`}>Написать</a>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
