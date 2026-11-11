import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MapPin, HardHat, Layers, ChevronDown, Search, Check, Plus, ArrowRight, Truck, X } from 'lucide-react';
import { DEMO_FEED_ORDERS, DEMO_NEARBY_EQUIPMENT } from '../../data/feedDemo';
import './OrderFeedPage.css';

// Лента заказов исполнителя в языке главной: стеклянные панели,
// цвет — вид работ, золото — только главное действие.
// children — раздел «Мои заказы» под лентой.

const money = (n) => `${(Number(n) || 0).toLocaleString('ru-RU')} ₸`;
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100; const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};
const ago = (min) => {
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  return `${h} ${plural(h, 'час', 'часа', 'часов')} назад`;
};
const shortSum = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₸`;
  return money(n);
};

export default function OrderFeedPage({ onOpenTool, children }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [sort, setSort] = useState('new');
  const [expanded, setExpanded] = useState({});
  const [applied, setApplied] = useState({});
  const [picked, setPicked] = useState({}); // техника, добавленная в отклик: `${orderId}-${stage}-${idx}`
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const say = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  };

  const cities = useMemo(() => [...new Set(DEMO_FEED_ORDERS.map((o) => o.city))], []);
  const orders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = DEMO_FEED_ORDERS.filter((o) => (city === 'all' || o.city === city)
      && (!q || `${o.title} ${o.category} ${o.city} ${o.id}`.toLowerCase().includes(q)));
    return [...list].sort((a, b) => (sort === 'budget' ? b.budget - a.budget : a.minutesAgo - b.minutesAgo));
  }, [query, city, sort]);

  const totalBudget = DEMO_FEED_ORDERS.reduce((s, o) => s + o.budget, 0);
  const pickedCount = (orderId) => Object.keys(picked).filter((k) => picked[k] && k.startsWith(`${orderId}-`)).length;
  const openEquipment = () => (onOpenTool ? onOpenTool('e-equipment') : null);

  const toggleApply = (o) => {
    const next = !applied[o.id];
    setApplied((p) => ({ ...p, [o.id]: next }));
    const n = pickedCount(o.id);
    say(next ? `Отклик на «${o.title}» отправлен${n ? `, техники в отклике: ${n}` : ''}` : 'Отклик отозван');
  };

  return (
    <div className="of">
      {/* шапка */}
      <header className="of-panel of-head">
        <div className="of-head-text">
          <h2 className="of-title">Открытые заказы</h2>
          <p className="of-sub">Заявки заказчиков из Астаны, Алматы, Шымкента и регионов. Откликнитесь с ценой — и добавьте технику под этапы.</p>
        </div>
        <dl className="of-stats">
          <div><dt>{plural(DEMO_FEED_ORDERS.length, 'заказ', 'заказа', 'заказов')}</dt><dd>{DEMO_FEED_ORDERS.length}</dd></div>
          <div><dt>общий бюджет</dt><dd>{shortSum(totalBudget)}</dd></div>
          <div><dt>{plural(cities.length, 'город', 'города', 'городов')}</dt><dd>{cities.length}</dd></div>
        </dl>
      </header>

      {/* фильтры ленты */}
      <div className="of-toolbar">
        <label className="of-search">
          <Search size={17} aria-hidden="true" />
          <span className="of-sr">Поиск по заказам</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Вид работ, город или номер заказа" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск"><X size={15} aria-hidden="true" /></button>}
        </label>
        <div className="of-chips" role="group" aria-label="Город">
          <button type="button" aria-pressed={city === 'all'} className={`of-chip${city === 'all' ? ' is-active' : ''}`} onClick={() => setCity('all')}>Все города</button>
          {cities.map((c) => (
            <button key={c} type="button" aria-pressed={city === c} className={`of-chip${city === c ? ' is-active' : ''}`} onClick={() => setCity(city === c ? 'all' : c)}>{c}</button>
          ))}
        </div>
        <label className="of-sort">
          <span>Сначала</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">новые</option>
            <option value="budget">с большим бюджетом</option>
          </select>
        </label>
      </div>

      <div className="of-body">
        {/* список */}
        <div className="of-list">
          {orders.length === 0 && (
            <div className="of-panel of-empty">
              <p>По этим условиям заказов нет</p>
              <button type="button" className="of-btn of-btn--ghost" onClick={() => { setQuery(''); setCity('all'); }}>Сбросить фильтры</button>
            </div>
          )}

          {orders.map((o) => {
            const isOpen = !!expanded[o.id];
            const isApplied = !!applied[o.id];
            const techCount = o.stages.reduce((s, st) => s + st.machinery.length, 0);
            const n = pickedCount(o.id);
            return (
              <article key={o.id} className={`of-panel of-card of-t-${o.tone}${isApplied ? ' is-applied' : ''}`}>
                <div className="of-card-main">
                  <div className="of-card-top">
                    <span className="of-kind"><i aria-hidden="true" />{o.category}</span>
                    <span className="of-demo" title="Пример заказа для знакомства с лентой">Демо</span>
                    <span className="of-ago">{ago(o.minutesAgo)}</span>
                  </div>
                  <h3 className="of-card-title">{o.title}</h3>
                  <ul className="of-meta">
                    <li><MapPin size={15} aria-hidden="true" />{o.city}</li>
                    <li><HardHat size={15} aria-hidden="true" />{o.contractor ? `Исполнитель: ${o.contractor}` : 'Исполнитель не назначен'}</li>
                    <li><Layers size={15} aria-hidden="true" />{o.stages.length} {plural(o.stages.length, 'этап', 'этапа', 'этапов')}, техники: {techCount}</li>
                  </ul>
                </div>

                <p className="of-budget"><span>Бюджет</span><b>{money(o.budget)}</b></p>

                <div className="of-actions">
                  {isApplied ? (
                    <>
                      <span className="of-applied"><Check size={16} strokeWidth={3} aria-hidden="true" />Отклик отправлен</span>
                      <button type="button" className="of-btn of-btn--ghost" onClick={() => toggleApply(o)}>Отозвать</button>
                    </>
                  ) : (
                    <button type="button" className="of-btn of-btn--gold" onClick={() => toggleApply(o)}>
                      Откликнуться{n > 0 ? ` · техника: ${n}` : ''}
                    </button>
                  )}
                  <button type="button" className="of-btn of-btn--ghost of-toggle" aria-expanded={isOpen} aria-controls={`of-stages-${o.id}`} onClick={() => setExpanded((p) => ({ ...p, [o.id]: !p[o.id] }))}>
                    <Truck size={16} aria-hidden="true" />Техника по этапам
                    <ChevronDown size={16} aria-hidden="true" className="of-caret" />
                  </button>
                </div>

                {isOpen && (
                  <ol className="of-stages" id={`of-stages-${o.id}`}>
                    {o.stages.map((st, si) => (
                      <li key={st.name} className="of-stage">
                        <p className="of-stage-name"><span>Этап {si + 1}</span>{st.name}</p>
                        <ul className="of-machines">
                          {st.machinery.map((m, mi) => {
                            const key = `${o.id}-${si}-${mi}`;
                            const on = !!picked[key];
                            return (
                              <li key={m.name} className={`of-machine${on ? ' is-on' : ''}`}>
                                <img src={m.photo} alt="" loading="lazy" />
                                <div className="of-machine-text">
                                  <b>{m.name}</b>
                                  <span><span>{m.dist} от объекта</span> · <span>{m.rate}</span></span>
                                </div>
                                <button type="button" className="of-pick" aria-pressed={on} onClick={() => setPicked((p) => ({ ...p, [key]: !p[key] }))} aria-label={on ? `Убрать из отклика: ${m.name}` : `Добавить в отклик: ${m.name}`}>
                                  {on ? <><Check size={14} strokeWidth={3} aria-hidden="true" />В отклике</> : <><Plus size={14} aria-hidden="true" />В отклик</>}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>

        {/* техника рядом */}
        <aside className="of-panel of-aside" aria-labelledby="of-aside-title">
          <div className="of-aside-head">
            <h3 id="of-aside-title">Свободная техника рядом</h3>
            <p>В радиусе 5 км от объектов, оплата по часам</p>
          </div>
          <ul className="of-equip">
            {DEMO_NEARBY_EQUIPMENT.map((m) => (
              <li key={m.id}>
                <img src={m.image} alt="" loading="lazy" />
                <div className="of-equip-text">
                  <b>{m.title}</b>
                  <span>{m.crew} · {m.dist}</span>
                  <span className="of-equip-price"><strong>{money(m.price)}</strong> / {m.unit}</span>
                </div>
                <button type="button" className="of-icon-btn" onClick={openEquipment} aria-label={`Открыть в маркетплейсе: ${m.title}`}>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="of-btn of-btn--ghost of-btn--block" onClick={openEquipment}>Весь маркетплейс техники</button>
        </aside>
      </div>

      {children}

      <div className={`of-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
