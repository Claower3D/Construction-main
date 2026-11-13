import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ClipboardList } from 'lucide-react';
import { api, formatInt, formatDate, roleLabel } from '../api/adminApi';
import { Empty, LoadError, Skeleton, PageHead, Honest } from '../components/kit';
import { UserSheet } from './Users';

export default function Moderation({ me, toast, go, refreshKey, onPending }) {
  const [list, setList] = useState(null);
  const [total, setTotal] = useState(0);
  const [newOrders, setNewOrders] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setError('');
    api.users({ unverified: true, limit: 100 }).then((r) => { setList(r.items); setTotal(r.total); }).catch((e) => setError(e.message));
    api.orders().then((o) => setNewOrders((Array.isArray(o) ? o : []).filter((x) => (x.status || '') === 'Новые'))).catch(() => setNewOrders([]));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  // число на значке вкладки «Проверка» — то же, что в списке
  useEffect(() => { if (list && onPending) onPending(total); }, [list, total, onPending]);

  const verify = async (u) => {
    setBusyId(u.id);
    try {
      await api.updateUser(u.id, { verified: true });
      setList((l) => l.filter((x) => x.id !== u.id)); setTotal((t) => t - 1);
      toast(`${u.name || u.email} подтверждён`);
    } catch (e) { toast(e.message, 'error'); } finally { setBusyId(''); }
  };

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Модерация" sub="Проверка специалистов и новых заказов" />
      <Honest>
        Инженеры, компании и исполнители регистрируются сами. Отметка «подтверждён» показывает, что вы проверили человека; права на сервере она пока не меняет. Если роль выбрана неверно — смените её в карточке.
      </Honest>

      <div className="qz-section-head"><h3 className="qz-h3">Ждут проверки</h3><span className="qz-xs qz-faint">{list ? formatInt(total) : ''}</span></div>
      {error && <LoadError error={error} onRetry={load} />}
      {!list && !error && <Skeleton lines={3} />}
      {list && list.length === 0 && <Empty icon={ShieldCheck} title="Все специалисты проверены" text="Новые инженеры, компании и исполнители появятся здесь после регистрации." />}
      <div className="qga-list">
        {(list || []).map((u) => (
          <div key={u.id} className="qga-mod">
            <button type="button" className="qga-mod-main" onClick={() => setOpen(u)}>
              <span className="qga-row-title">{u.name || 'Без имени'}</span>
              <span className="qga-row-sub">{roleLabel(u.role)} · {u.email}</span>
              <span className="qz-xs qz-faint">{[u.company, u.phone, u.city].filter(Boolean).join(' · ') || 'контактов нет'} · {formatDate(u.createdAt)}</span>
            </button>
            <button type="button" className="qz-btn is-sm is-ok" disabled={busyId === u.id} onClick={() => verify(u)} aria-label={`Подтвердить ${u.name || u.email}`}>
              <ShieldCheck size={16} />Подтвердить
            </button>
          </div>
        ))}
      </div>

      <div className="qz-section-head"><h3 className="qz-h3">Новые заказы</h3><span className="qz-xs qz-faint">{newOrders ? formatInt(newOrders.length) : ''}</span></div>
      {newOrders && newOrders.length === 0 && <p className="qz-small qz-muted" style={{ margin: 0 }}>Новых заказов нет.</p>}
      {newOrders && newOrders.length > 0 && (
        <button type="button" className="qz-btn is-block" onClick={() => go('orders', { status: 'Новые' })}>
          <ClipboardList size={18} />Открыть новые заказы ({formatInt(newOrders.length)})
        </button>
      )}

      {open && (
        <UserSheet user={open} me={me} toast={toast} onClose={() => setOpen(null)}
          onChanged={(nu) => {
            const still = ['engineer', 'company', 'executor'].includes(nu.role) && !nu.verifiedAt;
            setList((l) => (still ? l.map((x) => (x.id === nu.id ? nu : x)) : l.filter((x) => x.id !== nu.id)));
            if (!still) setTotal((t) => t - 1);
          }} />
      )}
    </div>
  );
}
