import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Users as UsersIcon, Search, ShieldCheck } from 'lucide-react';
import { api, ROLES, roleLabel, formatDate, formatInt } from '../api/adminApi';
import { Empty, LoadError, Skeleton, Sheet, Kv, PageHead } from '../components/kit';

const SPECIALIST = ['engineer', 'company', 'executor'];

export function UserRow({ u, onOpen }) {
  return (
    <button type="button" className="qga-row" onClick={() => onOpen(u)}>
      <span className="qga-avatar" aria-hidden="true">{(u.name || u.email || '?').trim().charAt(0).toUpperCase()}</span>
      <span className="qz-grow" style={{ textAlign: 'left' }}>
        <span className="qga-row-title">{u.name || 'Без имени'}</span>
        <span className="qga-row-sub">{u.email}</span>
      </span>
      <span className="qga-row-side">
        <span className={`qz-tag${u.role === 'admin' ? ' is-accent' : ''}`}>{roleLabel(u.role)}</span>
        {SPECIALIST.includes(u.role) && (u.verifiedAt
          ? <span className="qz-xs" style={{ color: 'var(--ok)' }}>подтверждён</span>
          : <span className="qz-xs" style={{ color: 'var(--warn)' }}>не проверен</span>)}
      </span>
    </button>
  );
}

export function UserSheet({ user, me, onClose, onChanged, toast }) {
  const [u, setU] = useState(user);
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const [confirmRole, setConfirmRole] = useState(false);
  const isMe = me && me.id === u.id;

  const patch = async (body, okText) => {
    setBusy(true);
    try {
      const next = await api.updateUser(u.id, body);
      setU(next); setRole(next.role); setConfirmRole(false);
      onChanged(next); toast(okText);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Sheet title={u.name || u.email} sub={`${roleLabel(u.role)} · с ${formatDate(u.createdAt)}`} onClose={onClose}>
      <div className="qz-stack">
        <Kv rows={[
          ['Почта', u.email ? <a href={`mailto:${u.email}`}>{u.email}</a> : ''],
          ['Телефон', u.phone ? <a href={`tel:${u.phone.replace(/[^+\d]/g, '')}`}>{u.phone}</a> : ''],
          ['Город', u.city],
          ['Компания', u.company],
          ['Регистрация', formatDate(u.createdAt, true)],
          ['Пароль', u.passwordChanged ? 'менял после регистрации' : 'не менял'],
          ['Рассылка', u.marketingOptIn ? 'согласен' : 'нет'],
          SPECIALIST.includes(u.role) ? ['Проверка', u.verifiedAt ? `подтверждён ${formatDate(u.verifiedAt)}` : 'не подтверждён'] : null,
        ]} />

        {SPECIALIST.includes(u.role) && (
          <button type="button" className={`qz-btn is-block${u.verifiedAt ? '' : ' is-ok'}`} disabled={busy}
            onClick={() => patch({ verified: !u.verifiedAt }, u.verifiedAt ? 'Отметка о проверке снята' : 'Специалист подтверждён')}>
            <ShieldCheck size={18} />{u.verifiedAt ? 'Снять отметку о проверке' : 'Подтвердить специалиста'}
          </button>
        )}

        <hr className="qz-divider" />
        <label className="qz-field">
          <span className="qz-label">Роль</span>
          <select className="qz-select" value={role} disabled={busy || isMe} onChange={(e) => { setRole(e.target.value); setConfirmRole(e.target.value !== u.role); }}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        {isMe && <p className="qz-xs qz-faint" style={{ margin: 0 }}>Свою роль сменить нельзя — это защищает от потери доступа к админке.</p>}
        {confirmRole && (
          <div className="qz-card is-warn qz-stack">
            <p className="qz-small" style={{ margin: 0 }}>
              Сменить роль «{roleLabel(u.role)}» на «{roleLabel(role)}»? Пользователя выкинет из аккаунта на всех устройствах, и он войдёт заново уже с новыми правами.
            </p>
            <div className="qga-actions">
              <button type="button" className="qz-btn is-sm is-ghost" onClick={() => { setRole(u.role); setConfirmRole(false); }}>Отмена</button>
              <button type="button" className="qz-btn is-sm is-primary" disabled={busy} onClick={() => patch({ role }, 'Роль изменена')}>Сменить роль</button>
            </div>
          </div>
        )}
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>Пароли пользователей администратор не видит и не меняет.</p>
      </div>
    </Sheet>
  );
}

export default function Users({ me, preset, toast, refreshKey }) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState(preset?.role || '');
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [more, setMore] = useState(false);
  const timer = useRef(null);

  useEffect(() => { if (preset?.role !== undefined) setRole(preset.role); }, [preset]);

  const load = useCallback((offset = 0) => {
    setError('');
    if (offset) setMore(true);
    return api.users({ q, role, limit: 50, offset })
      .then((res) => { setItems((prev) => (offset ? [...(prev || []), ...res.items] : res.items)); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setMore(false));
  }, [q, role]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(0), q ? 300 : 0);
    return () => clearTimeout(timer.current);
  }, [load, q, refreshKey]);

  const onChanged = (nu) => setItems((list) => (list || []).map((x) => (x.id === nu.id ? nu : x)));

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Пользователи" sub={items ? `${formatInt(total)} ${role ? `· ${roleLabel(role).toLowerCase()}` : 'всего'}` : ''} />
      <label className="qz-search" style={{ margin: 0 }}>
        <Search size={18} aria-hidden="true" />
        <span className="qz-sr-only">Поиск пользователей</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, почта, телефон, компания" />
      </label>
      <div className="qz-chips" role="tablist" aria-label="Роль">
        <button type="button" role="tab" aria-selected={!role} className={`qz-chip${!role ? ' is-active' : ''}`} onClick={() => setRole('')}>Все</button>
        {ROLES.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={role === r.id} className={`qz-chip${role === r.id ? ' is-active' : ''}`} onClick={() => setRole(r.id)}>{r.plural}</button>
        ))}
      </div>
      {error && <LoadError error={error} onRetry={() => load(0)} />}
      {!items && !error && <Skeleton lines={5} />}
      {items && items.length === 0 && <Empty icon={UsersIcon} title="Никого не нашли" text={q ? 'Попробуйте другую часть имени, почты или телефона.' : 'В этой роли пока нет пользователей.'} />}
      {items && items.length > 0 && (
        <div className="qga-list">
          {items.map((u) => <UserRow key={u.id} u={u} onOpen={setOpen} />)}
        </div>
      )}
      {items && items.length < total && (
        <button type="button" className="qz-btn is-block" disabled={more} onClick={() => load(items.length)}>
          {more ? 'Загружаем…' : `Показать ещё (${formatInt(total - items.length)})`}
        </button>
      )}
      {open && <UserSheet user={open} me={me} onClose={() => setOpen(null)} onChanged={onChanged} toast={toast} />}
    </div>
  );
}
