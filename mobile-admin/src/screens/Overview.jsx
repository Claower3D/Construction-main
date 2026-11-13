import React, { useCallback, useEffect, useState } from 'react';
import { api, formatInt, formatMoney, roleLabel, ROLES, formatDate } from '../api/adminApi';
import { DayBars, HBars, Tile } from '../components/Charts';
import { LoadError, Skeleton, PageHead } from '../components/kit';

const PERIODS = [7, 30, 90];

export default function Overview({ go, refreshKey }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.overview(days).then(setData).catch((e) => setError(e.message));
  }, [days]);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (error && !data) return <div className="qz-page"><LoadError error={error} onRetry={load} /></div>;
  if (!data) return <div className="qz-page"><Skeleton lines={4} /></div>;

  const u = data.users; const o = data.orders; const m = data.market;
  const roleRows = ROLES.map((r) => ({ key: r.id, label: r.plural, value: u.byRole[r.id] || 0 })).filter((r) => r.value > 0);
  const statusRows = Object.entries(o.byStatus).map(([k, v]) => ({ key: k, label: k, value: v })).sort((a, b) => b.value - a.value);
  const extraRoles = Object.keys(u.byRole).filter((k) => !ROLES.some((r) => r.id === k));
  extraRoles.forEach((k) => roleRows.push({ key: k, label: roleLabel(k), value: u.byRole[k] }));

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Обзор платформы" sub={`Данные сервера на ${formatDate(data.generatedAt, true)}`} />

      <div className="qz-segmented" role="tablist" aria-label="Период графиков">
        {PERIODS.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={days === p} onClick={() => setDays(p)}>{p} дней</button>
        ))}
      </div>

      <div className="qga-tiles">
        <Tile label="Пользователи" value={formatInt(u.total)} hint={`+${formatInt(u.new7)} за 7 дней`} onClick={() => go('users')} />
        <Tile label="Заказы" value={formatInt(o.total)} hint={`+${formatInt(o.new7)} за 7 дней`} onClick={() => go('orders')} />
        <Tile label="Сумма заказов" value={formatMoney(o.sumTotal)} hint={o.avgSum ? `в среднем ${formatMoney(o.avgSum)}` : 'сумм пока нет'} tone="gold" />
        <Tile label="Ждут проверки" value={formatInt(u.unverified)} hint="специалистов не подтверждено" tone={u.unverified ? 'warn' : undefined} onClick={() => go('moderation')} />
      </div>

      <section className="qz-card qz-stack">
        <DayBars data={u.perDay} title="Регистрации по дням" />
      </section>
      <section className="qz-card qz-stack">
        <DayBars data={o.perDay} title="Новые заказы по дням" />
      </section>

      <section className="qz-card qz-stack">
        <div className="qz-section-head" style={{ margin: 0 }}><h3 className="qz-h3">Заказы по статусам</h3><span className="qz-xs qz-faint">всего {formatInt(o.total)}</span></div>
        {statusRows.length ? <HBars rows={statusRows} total={o.total} onPick={(r) => go('orders', { status: r.key })} /> : <p className="qz-small qz-muted" style={{ margin: 0 }}>Заказов пока нет.</p>}
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>С назначенным технадзором: {formatInt(o.withEngineer)} из {formatInt(o.total)}</p>
      </section>

      <section className="qz-card qz-stack">
        <div className="qz-section-head" style={{ margin: 0 }}><h3 className="qz-h3">Пользователи по ролям</h3><span className="qz-xs qz-faint">всего {formatInt(u.total)}</span></div>
        <HBars rows={roleRows} total={u.total} onPick={(r) => go('users', { role: r.key })} />
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>
          Сменили пароль: {formatInt(u.passwordChanged)} · согласились на рассылку: {formatInt(u.marketingOptIn)}
        </p>
      </section>

      <section className="qz-card qz-stack">
        <h3 className="qz-h3">Маркетплейс и споры</h3>
        <div className="qga-tiles">
          <Tile label="Объявления техники" value={formatInt(m.equipment)} onClick={() => go('market')} />
          <Tile label="Брони техники" value={formatInt(m.bookings)} hint={m.bookingsSum ? formatMoney(m.bookingsSum) : undefined} onClick={() => go('market')} />
          <Tile label="Предложения материалов" value={formatInt(m.materialOffers)} onClick={() => go('market')} />
          <Tile label="Открытые споры" value={formatInt(data.disputes.open)} hint={`всего ${formatInt(data.disputes.total)}`} tone={data.disputes.open ? 'warn' : undefined} onClick={() => go('disputes')} />
        </div>
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>Бригад в каталоге: {formatInt(m.brigades)} · сообщений в чатах заказов за 7 дней: {formatInt(data.chat.messages7)}</p>
      </section>
    </div>
  );
}
