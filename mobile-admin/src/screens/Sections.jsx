// Разделы из «Ещё»: споры, цены, регионы, KPI, сервер, роли, журнал, маркетплейс, документы.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Scale, Search, ScrollText, Truck, FileText, Coins } from 'lucide-react';
import { api, formatInt, formatMoney, formatDate, roleLabel, ROLES } from '../api/adminApi';
import { Empty, LoadError, Skeleton, PageHead, Honest, Kv, Status } from '../components/kit';
import { HBars, Tile } from '../components/Charts';

function useLoad(fn, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { setError(''); fn().then(setData).catch((e) => setError(e.message)); }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, error, load };
}

export function Disputes({ refreshKey }) {
  const { data, error, load } = useLoad(() => api.disputes(), [refreshKey]);
  const list = Array.isArray(data) ? data : null;
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Споры и арбитраж" sub={list ? `${formatInt(list.length)} в базе` : ''} />
      {error && <LoadError error={error} onRetry={load} />}
      {!list && !error && <Skeleton lines={3} />}
      {list && list.length === 0 && (
        <Empty icon={Scale} title="Споров нет" text="Подать претензию через сайт или приложения пока нельзя, поэтому список пустой. Он заполнится, когда появится форма претензии по заказу." />
      )}
      <div className="qga-list">
        {(list || []).map((d) => (
          <div key={d.id} className="qga-order">
            <span className="qz-row" style={{ justifyContent: 'space-between' }}><Status status={d.status} /><span className="qz-xs qz-faint">{formatDate(d.createdAt)}</span></span>
            <span className="qga-row-title">{d.reason || 'Без описания'}</span>
            <span className="qz-xs qz-muted">Заказ № {d.orderId || '—'} · подал: {d.claimant || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TYPES = [{ id: '', label: 'Всё' }, { id: 'work', label: 'Работы' }, { id: 'material', label: 'Материалы' }, { id: 'equipment', label: 'Техника' }];

export function Prices() {
  const stats = useLoad(() => api.priceStats(), []);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setError('');
      api.prices({ q, type, limit: 40 }).then(setRes).catch((e) => setError(e.message));
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, type]);
  const s = stats.data;
  const topCats = useMemo(() => (s ? Object.entries(s.categories || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ key: k, label: k, value: v })) : []), [s]);

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Прайсы и база расценок" sub={s ? `версия ${s.version} · ${formatInt(s.totalItems)} позиций · ${s.regionsCount} регионов` : ''} />
      {s && (
        <Honest>
          Все позиции собраны нейросетью по рыночным ценам — это ориентир, а не официальные сметные нормы ЭСН. Последняя проверка цен {formatDate(s.audit?.date)}: исправлено {formatInt(s.audit?.itemsCorrected)}, под сомнением {formatInt(s.audit?.itemsSuspect)}.
        </Honest>
      )}
      <label className="qz-search" style={{ margin: 0 }}>
        <Search size={18} aria-hidden="true" />
        <span className="qz-sr-only">Поиск в базе цен</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например: бетон, штукатурка, экскаватор" />
      </label>
      <div className="qz-chips" role="tablist" aria-label="Тип позиции">
        {TYPES.map((t) => <button key={t.id || 'all'} type="button" role="tab" aria-selected={type === t.id} className={`qz-chip${type === t.id ? ' is-active' : ''}`} onClick={() => setType(t.id)}>{t.label}</button>)}
      </div>
      {error && <LoadError error={error} />}
      {res && <p className="qz-xs qz-faint" style={{ margin: 0 }}>Найдено {formatInt(res.filtered)}, показаны первые {Math.min(res.filtered, 40)}</p>}
      {res && res.items.length === 0 && <Empty icon={Coins} title="Ничего не нашли" text="Попробуйте другое слово." />}
      <div className="qga-list">
        {(res?.items || []).map((it) => (
          <div key={it.code} className="qga-price">
            <span className="qz-grow">
              <span className="qga-row-title">{it.name}</span>
              <span className="qga-row-sub">{it.code} · {it.category}</span>
            </span>
            <span className="qga-price-val num">{formatMoney(it.price)}<span className="qz-xs qz-faint"> / {it.unit}</span></span>
          </div>
        ))}
      </div>
      {topCats.length > 0 && (
        <section className="qz-card qz-stack">
          <h3 className="qz-h3">Крупнейшие разделы базы</h3>
          <HBars rows={topCats} total={s.totalItems} />
        </section>
      )}
    </div>
  );
}

export function Regions() {
  const { data, error, load } = useLoad(() => api.regions(), []);
  const rows = useMemo(() => (data?.regions ? Object.entries(data.regions).filter(([k]) => k !== 'default')
    .map(([k, v]) => ({ key: k, label: k, value: v })).sort((a, b) => b.value - a.value) : []), [data]);
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Региональные индексы" sub="Множитель к базовой цене (Алматы = 1,00)" />
      {error && <LoadError error={error} onRetry={load} />}
      {!data && !error && <Skeleton lines={4} />}
      {rows.length > 0 && (
        <section className="qz-card">
          <HBars rows={rows} format={(v) => v.toFixed(2).replace('.', ',')} />
        </section>
      )}
      <p className="qz-xs qz-faint" style={{ margin: 0 }}>Коэффициенты применяются в смете сайта при выборе города. Изменить их можно только в файле базы цен на сервере.</p>
    </div>
  );
}

export function Kpi({ refreshKey }) {
  const ov = useLoad(() => api.overview(30), [refreshKey]);
  const o = ov.data;
  if (ov.error) return <div className="qz-page"><LoadError error={ov.error} onRetry={ov.load} /></div>;
  if (!o) return <div className="qz-page"><Skeleton lines={4} /></div>;
  const customers = o.users.byRole.customer || 0;
  const done = Object.entries(o.orders.byStatus).filter(([k]) => /заверш|выполн|сдан/i.test(k)).reduce((s, [, v]) => s + v, 0);
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  return (
    <div className="qz-page qz-stack">
      <PageHead title="KPI платформы" sub="Считается по настоящим данным сервера" />
      <div className="qga-tiles">
        <Tile label="Заказов на клиента" value={customers ? (o.orders.total / customers).toFixed(2).replace('.', ',') : '—'} hint={`${formatInt(o.orders.total)} заказов / ${formatInt(customers)} клиентов`} />
        <Tile label="Доля завершённых" value={pct(done, o.orders.total)} hint={`${formatInt(done)} из ${formatInt(o.orders.total)}`} />
        <Tile label="Средний чек" value={o.orders.avgSum ? formatMoney(o.orders.avgSum) : '—'} tone="gold" />
        <Tile label="С технадзором" value={pct(o.orders.withEngineer, o.orders.total)} hint="заказов с назначенным инженером" />
        <Tile label="Рост за 30 дней" value={`+${formatInt(o.users.new30)}`} hint="новых пользователей" />
        <Tile label="Проверено специалистов" value={pct((o.users.byRole.engineer || 0) + (o.users.byRole.company || 0) + (o.users.byRole.executor || 0) - o.users.unverified, (o.users.byRole.engineer || 0) + (o.users.byRole.company || 0) + (o.users.byRole.executor || 0))} hint={`${formatInt(o.users.unverified)} ждут проверки`} />
      </div>
      <Honest>Скорость расчётов и точность ИИ сервер пока не замеряет — эти показатели появятся, когда начнётся запись метрик. Нагрузку сервера смотрите в разделе «Сервер и база данных».</Honest>
    </div>
  );
}

export function Server({ refreshKey }) {
  const { data, error, load } = useLoad(() => api.health(), [refreshKey]);
  const fmtUptime = (sec) => {
    const d = Math.floor(sec / 86400); const h = Math.floor((sec % 86400) / 3600); const m = Math.floor((sec % 3600) / 60);
    return [d && `${d} д`, h && `${h} ч`, `${m} мин`].filter(Boolean).join(' ');
  };
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Сервер и база данных" right={<button type="button" className="qz-btn is-sm" onClick={load}>Обновить</button>} />
      {error && <LoadError error={error} onRetry={load} />}
      {!data && !error && <Skeleton lines={3} />}
      {data && (
        <>
          <div className="qga-tiles">
            <Tile label="Сервер" value={data.status === 'ok' ? 'работает' : data.status} tone={data.status === 'ok' ? 'ok' : 'warn'} />
            <Tile label="База данных" value={data.database === 'ok' ? 'на связи' : data.database} tone={data.database === 'ok' ? 'ok' : 'warn'} hint={`${formatInt(data.dbTables)} таблиц`} />
            <Tile label="Без перезапуска" value={fmtUptime(data.uptimeSec || 0)} />
            <Tile label="Память" value={`${formatInt(data.memoryMB)} МБ`} hint={`${formatInt(data.goroutines)} потоков`} />
          </div>
          <section className="qz-card">
            <Kv rows={[['Версия API', data.version], ['Движок', data.engine], ['Процессоры', formatInt(data.cpus)], ['Система', `${data.os} / ${data.arch}`], ['Сборок мусора', formatInt(data.gcCycles)]]} />
          </section>
        </>
      )}
    </div>
  );
}

const ROLE_RIGHTS = {
  customer: 'Создаёт заказы и сметы, видит только свои заказы и переписку по ним.',
  executor: 'Видит все заказы с телефонами клиентов; правит те, где подрядчик — его компания.',
  engineer: 'Технадзор: видит и правит любые заказы, проверяет дефекты.',
  company: 'Видит все заказы с телефонами клиентов, публикует предложения материалов.',
  manager: 'Все заказы, споры, CRM; может назначать инженеров.',
  admin: 'Всё, что менеджер, плюс эта админка: пользователи, роли, журнал.',
};

export function Roles({ refreshKey, go }) {
  const { data, error, load } = useLoad(() => api.overview(7), [refreshKey]);
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Роли и древо прав" sub="Права заданы в коде сервера" />
      {error && <LoadError error={error} onRetry={load} />}
      <div className="qga-tree">
        {['admin', 'manager', 'engineer', 'company', 'executor', 'customer'].map((r, i) => (
          <button key={r} type="button" className="qga-tree-node" style={{ marginLeft: `${Math.min(i, 3) * 14}px` }} onClick={() => go('users', { role: r })}>
            <span className="qz-row" style={{ justifyContent: 'space-between' }}>
              <span className="qga-row-title">{roleLabel(r)}</span>
              <span className="qz-tag num">{data ? formatInt(data.users.byRole[r] || 0) : '…'}</span>
            </span>
            <span className="qga-row-sub">{ROLE_RIGHTS[r]}</span>
          </button>
        ))}
      </div>
      <Honest>Инженером может зарегистрироваться любой, и права инженера включаются сразу. Проверяйте новых инженеров в «Модерации» и меняйте роль, если она выбрана неверно.</Honest>
      <p className="qz-xs qz-faint" style={{ margin: 0 }}>Ролей на платформе: {ROLES.length}.</p>
    </div>
  );
}

const ACTIONS = { role: 'Смена роли', verify: 'Подтверждение специалиста', unverify: 'Снятие подтверждения' };

export function Audit({ refreshKey }) {
  const { data, error, load } = useLoad(() => api.audit(), [refreshKey]);
  const items = data?.items;
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Журнал действий" sub="Изменения, сделанные через админку" />
      {error && <LoadError error={error} onRetry={load} />}
      {!items && !error && <Skeleton lines={3} />}
      {items && items.length === 0 && <Empty icon={ScrollText} title="Журнал пуст" text="Здесь появятся смены ролей и подтверждения специалистов: кто, когда и что изменил." />}
      <div className="qga-list">
        {(items || []).map((e) => (
          <div key={e.id} className="qga-order">
            <span className="qz-row" style={{ justifyContent: 'space-between' }}><b className="qz-small">{ACTIONS[e.action] || e.action}</b><span className="qz-xs qz-faint">{formatDate(e.at, true)}</span></span>
            <span className="qz-small">{String(e.details || '').replace(/\b(customer|executor|engineer|company|manager|admin)\b/g, (r) => roleLabel(r).toLowerCase())}</span>
            <span className="qz-xs qz-faint">Администратор: {e.actorEmail || e.actorId}</span>
          </div>
        ))}
      </div>
      <Honest>Входы пользователей, правки смет и обращения к ИИ сервер пока не записывает — в журнале только действия администраторов.</Honest>
    </div>
  );
}

export function Market({ refreshKey }) {
  const eq = useLoad(() => api.equipment(), [refreshKey]);
  const mat = useLoad(() => api.materials(), [refreshKey]);
  const ov = useLoad(() => api.overview(30), [refreshKey]);
  const list = Array.isArray(eq.data) ? eq.data : null;
  const m = ov.data?.market;
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Маркетплейс" />
      {m && (
        <div className="qga-tiles">
          <Tile label="Объявления техники" value={formatInt(m.equipment)} />
          <Tile label="Брони техники" value={formatInt(m.bookings)} hint={m.bookingsSum ? formatMoney(m.bookingsSum) : 'на сумму 0 ₸'} />
          <Tile label="Предложения материалов" value={formatInt(m.materialOffers)} />
          <Tile label="Бригады в каталоге" value={formatInt(m.brigades)} />
        </div>
      )}
      {m && Object.keys(m.bookingsByStatus || {}).length > 0 && (
        <section className="qz-card qz-stack"><h3 className="qz-h3">Брони по статусам</h3>
          <HBars rows={Object.entries(m.bookingsByStatus).map(([k, v]) => ({ key: k, label: k, value: v }))} total={m.bookings} />
        </section>
      )}
      <div className="qz-section-head"><h3 className="qz-h3">Техника</h3><span className="qz-xs qz-faint">{list ? formatInt(list.length) : ''}</span></div>
      {eq.error && <LoadError error={eq.error} onRetry={eq.load} />}
      {list && list.length === 0 && <Empty icon={Truck} title="Объявлений техники нет" />}
      <div className="qga-list">
        {(list || []).slice(0, 50).map((e) => (
          <div key={e.id} className="qga-price">
            <span className="qz-grow"><span className="qga-row-title">{e.name}</span><span className="qga-row-sub">{[e.category, e.city, e.ownerName].filter(Boolean).join(' · ')}</span></span>
            <span className="qga-price-val num">{formatMoney(e.pricePerDay)}<span className="qz-xs qz-faint"> / смена</span></span>
          </div>
        ))}
      </div>
      <p className="qz-xs qz-faint" style={{ margin: 0 }}>Предложений материалов от поставщиков: {mat.data ? formatInt(mat.data.total ?? (mat.data.items || []).length) : '…'}</p>
    </div>
  );
}

export function Documents() {
  return (
    <div className="qz-page qz-stack">
      <PageHead title="Договоры и документы" />
      <Empty icon={FileText} title="На сервере документов пока нет"
        text="Шаблоны договоров подряда, подписание ЭЦП и реестр актов КС-2/КС-3 ещё не сделаны: в панели на сайте этот раздел — макет. Смету конкретного заказа можно выгрузить в Excel на сайте, в карточке заказа." />
    </div>
  );
}
