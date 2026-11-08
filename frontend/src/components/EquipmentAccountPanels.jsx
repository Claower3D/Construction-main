import React, { useCallback, useEffect, useState } from 'react';
import { authHeaders, jsonAuthHeaders, getAuthToken, responseError } from '../services/platformUtils';

// Статусы объявления (совпадают с go-backend/pkg/handlers/equipment.go)
export const EQ_STATUSES = ['Доступен', 'В аренде', 'На ремонте', 'Снят с публикации'];

const BOOKING_LABEL = {
  pending: { text: 'Ждёт подтверждения', cls: 'pending' },
  confirmed: { text: 'Подтверждена', cls: 'active' },
  completed: { text: 'Завершена', cls: 'done' },
  cancelled: { text: 'Отменена', cls: 'cancelled' },
};

const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₸`;
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '');

// Фото по категории, если владелец не загрузил своё
export function equipmentPlaceholder(category = '') {
  const c = String(category).toLowerCase();
  if (c.includes('кран') || c.includes('грузоподъ')) return '/assets/machinery/xcmg_mobile_crane.jpg';
  if (c.includes('погруз')) return '/assets/machinery/xcmg_wheel_loader.jpg';
  if (c.includes('бетон')) return '/assets/machinery/concrete_pump.jpg';
  if (c.includes('самосвал') || c.includes('тягач') || c.includes('транспорт')) return '/assets/machinery/shacman_dump_truck.jpg';
  if (c.includes('бур')) return '/assets/machinery/auger_drilling_truck.jpg';
  if (c.includes('дорож') || c.includes('каток') || c.includes('грейдер')) return '/assets/machinery/road_roller_bomag.jpg';
  if (c.includes('энерг') || c.includes('генератор') || c.includes('компрессор')) return '/assets/machinery/diesel_generator_sdmo.jpg';
  return '/assets/machinery/hitachi_excavator.jpg';
}

function useApi(url, deps) {
  const [state, setState] = useState({ status: 'idle', items: [], error: null });
  const load = useCallback(() => {
    if (!getAuthToken()) { setState({ status: 'noauth', items: [], error: null }); return; }
    setState(s => ({ ...s, status: 'loading', error: null }));
    fetch(url, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res));
        const data = await res.json();
        setState({ status: 'ready', items: Array.isArray(data) ? data : [], error: null });
      })
      .catch(e => setState({ status: 'error', items: [], error: e.message || 'Сеть недоступна' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return [state, load];
}

function NoAuth({ text }) {
  return (
    <div className="em-empty-state">
      <div className="em-empty-icon">🔐</div>
      <h3>Нужен вход</h3>
      <p>{text}</p>
    </div>
  );
}

function Empty({ icon, title, text, action }) {
  return (
    <div className="em-empty-state">
      <div className="em-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function LoadError({ error, onRetry }) {
  return (
    <div className="em-empty-state">
      <div className="em-empty-icon">⚠️</div>
      <h3>Не удалось загрузить</h3>
      <p>{error}</p>
      <button className="em-btn-glass-sm" onClick={onRetry}>Повторить</button>
    </div>
  );
}

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: jsonAuthHeaders(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(await responseError(res));
  return res.json().catch(() => ({}));
}

/** «Мой парк»: объявления владельца — статус, цена, снятие с публикации, удаление */
export function FleetPanel({ reloadKey, onAdd, showToast }) {
  const [state, reload] = useApi('/api/v1/equipment?owner=me', [reloadKey]);
  const [editing, setEditing] = useState(null); // { id, pricePerDay, pricePerHour }
  const [busyId, setBusyId] = useState(null);

  const patch = async (eq, body, okText) => {
    setBusyId(eq.id);
    try {
      await send(`/api/v1/equipment/${encodeURIComponent(eq.id)}`, 'PATCH', body);
      showToast(okText);
      setEditing(null);
      reload();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (eq) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Удалить объявление «${eq.name}»? Будущие брони будут отменены.`)) return;
    setBusyId(eq.id);
    try {
      await send(`/api/v1/equipment/${encodeURIComponent(eq.id)}`, 'DELETE');
      showToast('🗑️ Объявление удалено');
      reload();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const items = state.items;
  const count = (s) => items.filter(e => e.status === s).length;

  return (
    <div className="em-tab-view-container">
      <div className="em-view-header-bar">
        <div className="em-header-left">
          <h2 className="em-view-title">🚜 Мой парк спецтехники</h2>
          <p className="em-view-subtitle">Ваши объявления в маркетплейсе: статус, цены и публикация</p>
        </div>
        <div className="em-header-metrics">
          <div className="em-metric-pill"><span className="metric-val">{items.length}</span><span className="metric-lbl">Всего машин</span></div>
          <div className="em-metric-pill success"><span className="metric-val">{count('Доступен')}</span><span className="metric-lbl">Свободно</span></div>
          <div className="em-metric-pill info"><span className="metric-val">{count('В аренде')}</span><span className="metric-lbl">В аренде</span></div>
          <button className="em-btn-action-primary" onClick={onAdd}>+ Добавить технику</button>
        </div>
      </div>

      {state.status === 'noauth' && <NoAuth text="Войдите под серверной учётной записью, чтобы управлять своей техникой." />}
      {state.status === 'loading' && <p className="em-loading-line">Загрузка парка…</p>}
      {state.status === 'error' && <LoadError error={state.error} onRetry={reload} />}
      {state.status === 'ready' && items.length === 0 && (
        <Empty icon="🚜" title="В парке пока нет техники" text="Разместите первую машину — она появится в каталоге и начнёт получать заявки."
          action={<button className="em-btn-action-primary" onClick={onAdd}>+ Разместить технику</button>} />
      )}

      {items.length > 0 && (
        <div className="em-fleet-grid">
          {items.map(eq => {
            const isEditing = editing?.id === eq.id;
            const busy = busyId === eq.id;
            return (
              <div className="em-fleet-card-luxury" key={eq.id}>
                <div className="em-fleet-card-top">
                  <img className="em-fleet-thumb" src={eq.image || equipmentPlaceholder(eq.category)} alt="" loading="lazy"
                    onError={e => { e.currentTarget.src = equipmentPlaceholder(eq.category); }} />
                  <div className="em-fleet-main-info">
                    <div className="em-fleet-title-row">
                      <h3>{eq.name}</h3>
                      <span className={`em-tag-status ${eq.status === 'Доступен' ? 'active' : eq.status === 'В аренде' ? 'info' : 'muted'}`}>{eq.status}</span>
                    </div>
                    <p className="em-fleet-subtext">
                      {[eq.category, eq.city, eq.capacity, eq.plateNumber].filter(Boolean).join(' • ')}
                    </p>
                    {!isEditing ? (
                      <div className="em-fleet-spec-pills">
                        <span className="spec-pill">💰 {fmt(eq.pricePerDay)} / смена</span>
                        {eq.pricePerHour > 0 && <span className="spec-pill">⏱️ {fmt(eq.pricePerHour)} / час</span>}
                        <span className="spec-pill">{eq.withOperator ? '👷 С оператором' : 'Без оператора'}</span>
                        <span className="spec-pill">{eq.delivery ? '🚚 Доставка' : 'Самовывоз'}</span>
                      </div>
                    ) : (
                      <div className="em-fleet-edit-row">
                        <label>Смена, ₸
                          <input type="number" min="1" step="1000" value={editing.pricePerDay}
                            onChange={e => setEditing(s => ({ ...s, pricePerDay: e.target.value }))} />
                        </label>
                        <label>Час, ₸
                          <input type="number" min="0" step="500" value={editing.pricePerHour}
                            onChange={e => setEditing(s => ({ ...s, pricePerHour: e.target.value }))} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="em-fleet-card-footer">
                  <label className="em-fleet-status-select">
                    <span>Статус:</span>
                    <select value={eq.status} disabled={busy}
                      onChange={e => patch(eq, { status: e.target.value }, `✅ Статус: ${e.target.value}`)}>
                      {EQ_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <div className="em-fleet-actions-row">
                    {isEditing ? (
                      <>
                        <button className="em-btn-glass-sm" disabled={busy} onClick={() => setEditing(null)}>Отмена</button>
                        <button className="em-btn-glass-sm primary" disabled={busy}
                          onClick={() => {
                            const day = Number(editing.pricePerDay);
                            const hour = Number(editing.pricePerHour || 0);
                            if (!(day > 0) || hour < 0) { showToast('⚠️ Цена за смену должна быть больше 0'); return; }
                            patch(eq, { pricePerDay: day, pricePerHour: hour }, '💾 Цены обновлены');
                          }}>Сохранить</button>
                      </>
                    ) : (
                      <>
                        <button className="em-btn-glass-sm" disabled={busy}
                          onClick={() => setEditing({ id: eq.id, pricePerDay: eq.pricePerDay, pricePerHour: eq.pricePerHour || 0 })}>✏️ Цены</button>
                        <button className="em-btn-glass-sm danger" disabled={busy} onClick={() => remove(eq)}>🗑️ Удалить</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookingCard({ b, role, busy, onStatus }) {
  const st = BOOKING_LABEL[b.status] || { text: b.status, cls: 'muted' };
  const isOwner = role === 'owner';
  return (
    <div className="em-rental-card-luxury">
      <div className="em-rental-card-header">
        <div className="rental-contract-badge">
          <span>Бронь №{String(b.id).replace(/^bk_/, '').slice(-6)}</span>
          <span className={`em-tag-status ${st.cls}`}>{st.text}</span>
        </div>
        <span className="rental-date">{fmtDate(b.dateFrom)}{b.dateTo !== b.dateFrom ? ` — ${fmtDate(b.dateTo)}` : ''}</span>
      </div>
      <div className="em-rental-main">
        <div className="em-fleet-icon-aura">🏗️</div>
        <div className="em-rental-details">
          <h3>{b.equipmentName}</h3>
          <p>
            {isOwner ? <>Заказчик: <strong>{b.renterName || 'без имени'}</strong> • </> : null}
            Объект: <strong>{b.address}</strong>
          </p>
          <div className="em-rental-stats-pills">
            <span>💰 {fmt(b.total)} ({b.shifts} см. × {fmt(b.pricePerShift)})</span>
            {b.paymentMethod ? <span>💳 {b.paymentMethod}</span> : null}
            {isOwner && b.renterPhone ? <span>📞 <a href={`tel:${b.renterPhone.replace(/[^\d+]/g, '')}`}>{b.renterPhone}</a></span> : null}
          </div>
        </div>
      </div>
      <div className="em-fleet-card-footer">
        <span className="footer-status-text">
          {b.status === 'pending' && (isOwner ? 'Подтвердите заявку или отклоните её' : 'Владелец техники подтвердит бронь')}
          {b.status === 'confirmed' && (isOwner ? 'После выполнения работ отметьте бронь завершённой' : 'Техника будет подана в указанную дату')}
          {b.status === 'completed' && 'Работы выполнены'}
          {b.status === 'cancelled' && 'Бронь отменена, даты освобождены'}
        </span>
        <div className="em-fleet-actions-row">
          {isOwner && b.status === 'pending' && (
            <button className="em-btn-glass-sm primary" disabled={busy} onClick={() => onStatus(b, 'confirmed')}>✅ Подтвердить</button>
          )}
          {isOwner && b.status === 'confirmed' && (
            <button className="em-btn-glass-sm primary" disabled={busy} onClick={() => onStatus(b, 'completed')}>🏁 Завершить</button>
          )}
          {(b.status === 'pending' || b.status === 'confirmed') && (
            <button className="em-btn-glass-sm danger" disabled={busy} onClick={() => onStatus(b, 'cancelled')}>
              {isOwner && b.status === 'pending' ? 'Отклонить' : 'Отменить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Брони: role="renter" — «Мои аренды», role="owner" — заявки на мою технику */
export function BookingsPanel({ role, reloadKey, onBrowse, showToast }) {
  const [state, reload] = useApi(`/api/v1/equipment-bookings?role=${role}`, [role, reloadKey]);
  const [busyId, setBusyId] = useState(null);
  const isOwner = role === 'owner';

  const onStatus = async (b, status) => {
    if (status === 'cancelled') {
      // eslint-disable-next-line no-alert
      if (!window.confirm('Отменить бронь? Даты освободятся для других заказчиков.')) return;
    }
    setBusyId(b.id);
    try {
      await send(`/api/v1/equipment-bookings/${encodeURIComponent(b.id)}`, 'PATCH', { status });
      showToast(status === 'confirmed' ? '✅ Бронь подтверждена' : status === 'completed' ? '🏁 Бронь завершена' : '↩️ Бронь отменена');
      reload();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const active = state.items.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const sum = active.reduce((s, b) => s + (Number(b.total) || 0), 0);

  return (
    <div className="em-tab-view-container">
      <div className="em-view-header-bar">
        <div className="em-header-left">
          <h2 className="em-view-title">{isOwner ? '📥 Заявки на мою технику' : '📦 Мои аренды'}</h2>
          <p className="em-view-subtitle">
            {isOwner ? 'Брони заказчиков: подтверждайте, завершайте или отклоняйте' : 'Ваши брони спецтехники и их статус у владельца'}
          </p>
        </div>
        <div className="em-header-metrics">
          <div className="em-metric-pill"><span className="metric-val">{active.length}</span><span className="metric-lbl">Активных</span></div>
          <div className="em-metric-pill success"><span className="metric-val">{fmt(sum)}</span><span className="metric-lbl">{isOwner ? 'К получению' : 'К оплате'}</span></div>
          {!isOwner && <button className="em-btn-action-primary" onClick={onBrowse}>🔍 Найти технику</button>}
        </div>
      </div>

      {state.status === 'noauth' && <NoAuth text={isOwner ? 'Войдите, чтобы видеть заявки на свою технику.' : 'Войдите, чтобы видеть свои брони.'} />}
      {state.status === 'loading' && <p className="em-loading-line">Загрузка…</p>}
      {state.status === 'error' && <LoadError error={state.error} onRetry={reload} />}
      {state.status === 'ready' && state.items.length === 0 && (
        <Empty icon={isOwner ? '📭' : '📦'} title={isOwner ? 'Заявок пока нет' : 'Броней пока нет'}
          text={isOwner ? 'Когда заказчик забронирует вашу технику, заявка появится здесь.' : 'Выберите технику в каталоге и забронируйте нужные даты.'}
          action={!isOwner ? <button className="em-btn-action-primary" onClick={onBrowse}>Перейти в каталог</button> : null} />
      )}
      {state.items.length > 0 && (
        <div className="em-rentals-list">
          {state.items.map(b => <BookingCard key={b.id} b={b} role={role} busy={busyId === b.id} onStatus={onStatus} />)}
        </div>
      )}
    </div>
  );
}
