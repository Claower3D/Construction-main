import React, { useCallback, useEffect, useState } from 'react';
import { authHeaders, jsonAuthHeaders, getAuthToken, responseError } from '../services/platformUtils';

// Категории предложений поставщиков = чипы каталога материалов
export const OFFER_CATEGORIES = [
  ['zhbi', 'ЖБИ, кольца, люки'], ['cement', 'Цемент и смеси'], ['blocks', 'Кирпич и блоки'],
  ['metal', 'Арматура и металл'], ['bulk', 'Песок, щебень, бетон'], ['insulation', 'Тепло- и гидроизоляция'],
  ['roofing', 'Кровля и фасад'], ['drywall', 'Гипсокартон и отделка'], ['electric', 'Электрика и кабель'],
  ['plumbing', 'Сантехника и трубы'], ['sewer', 'Канализация'], ['water', 'Водоснабжение'], ['heating', 'Отопление'],
  ['tools', 'Инструменты'], ['fasteners', 'Крепёж и метизы'], ['paint', 'ЛКМ и краски'], ['flooring', 'Напольные покрытия'],
];
const OFFER_UNITS = ['шт', 'мешок', 'м²', 'м³', 'м.п.', 'т', 'кг', 'л', 'лист', 'рулон', 'уп.', 'компл.', 'бухта', 'поддон'];
const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Атырау', 'Актау', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Костанай', 'Тараз', 'Кызылорда', 'Уральск', 'Петропавловск', 'Туркестан', 'Талдыкорган', 'Кокшетау'];

const fmt = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₸`;

/** Приводит предложение поставщика к форме карточки каталога */
export function mapOffer({ offer: o, referencePrice }) {
  const notes = [];
  if (o.wholesalePrice > 0) notes.push(`от ${o.wholesaleFrom} ${o.unit} — ${fmt(o.wholesalePrice)}`);
  return {
    id: `offer-${o.id}`,
    offerId: o.id,
    isOffer: true,
    title: o.name,
    supplier: o.supplierName || 'Поставщик',
    supplierPhone: o.supplierPhone || '',
    city: o.city,
    price: Math.round(Number(o.price) || 0),
    wholesalePrice: Number(o.wholesalePrice) || 0,
    wholesaleFrom: Number(o.wholesaleFrom) || 0,
    unit: o.unit,
    category: o.category,
    gost: o.gost || '',
    inStock: Number(o.stock) || 0,
    delivery: o.delivery !== false,
    pickup: o.pickup !== false,
    wholesaleNote: notes.join(' · '),
    referencePrice: Number(referencePrice) || 0,
    image: o.image || null,
    description: o.description || '',
  };
}

/** Загрузка предложений поставщиков для витрины */
export function useMaterialOffers({ q, category, city, reloadKey }) {
  const [state, setState] = useState({ status: 'loading', items: [] });
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'all') params.set('category', category);
    if (city && city !== 'all') params.set('city', city);
    fetch(`/api/v1/materials${params.toString() ? `?${params}` : ''}`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res));
        const data = await res.json();
        if (!cancelled) setState({ status: 'ready', items: (data.items || []).map(mapOffer) });
      })
      .catch(() => { if (!cancelled) setState({ status: 'error', items: [] }); });
    return () => { cancelled = true; };
  }, [q, category, city, reloadKey]);
  return state;
}

const EMPTY_FORM = {
  name: '', category: 'cement', unit: 'мешок', price: '', wholesalePrice: '', wholesaleFrom: '', city: 'Алматы',
  stock: '', gost: '', delivery: true, pickup: true, description: '', supplierPhone: '', priceCode: '', refPrice: 0,
};

/** Кабинет поставщика: свои предложения — добавить, изменить, скрыть, удалить */
export function SupplierPanel({ showToast, onChanged }) {
  const [state, setState] = useState({ status: 'loading', items: [], error: null });
  const [form, setForm] = useState(null); // null | { ...EMPTY_FORM, id? }
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refQuery, setRefQuery] = useState('');
  const [refHits, setRefHits] = useState([]);

  const load = useCallback(() => {
    if (!getAuthToken()) { setState({ status: 'noauth', items: [], error: null }); return; }
    setState(s => ({ ...s, status: 'loading' }));
    fetch('/api/v1/materials?supplier=me', { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res));
        const data = await res.json();
        setState({ status: 'ready', items: data.items || [], error: null });
      })
      .catch(e => setState({ status: 'error', items: [], error: e.message }));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Подсказка справочной цены из прайс-базы: поставщик видит ориентир рынка и связывает позицию
  useEffect(() => {
    if (!form || refQuery.trim().length < 3) { setRefHits([]); return undefined; }
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q: refQuery.trim(), type: 'material', unique: '1', limit: '6' });
      fetch(`/api/v1/prices?${p}`).then(r => (r.ok ? r.json() : null)).then(d => setRefHits(d?.items || [])).catch(() => setRefHits([]));
    }, 350);
    return () => clearTimeout(t);
  }, [refQuery, form]);

  const edit = (o) => {
    setError(null);
    setRefQuery('');
    setForm(o ? {
      ...EMPTY_FORM, ...o, price: o.price, wholesalePrice: o.wholesalePrice || '', wholesaleFrom: o.wholesaleFrom || '',
      stock: o.stock || '', refPrice: 0,
    } : { ...EMPTY_FORM });
  };

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(String(v).replace(',', '.')));
    const body = {
      name: form.name.trim(), category: form.category, unit: form.unit, price: num(form.price),
      wholesalePrice: num(form.wholesalePrice), wholesaleFrom: num(form.wholesaleFrom), city: form.city,
      stock: num(form.stock), gost: form.gost.trim(), delivery: form.delivery, pickup: form.pickup,
      description: form.description.trim(), supplierPhone: form.supplierPhone.trim() || undefined, priceCode: form.priceCode,
    };
    if (!body.name) { setError('Укажите наименование'); return; }
    if (!(body.price > 0)) { setError('Цена должна быть больше 0'); return; }
    if (body.wholesalePrice > 0 && body.wholesalePrice >= body.price) { setError('Оптовая цена должна быть ниже розничной'); return; }
    if (body.wholesalePrice > 0 && !(body.wholesaleFrom > 0)) { setError('Укажите, от какого количества действует опт'); return; }
    setSaving(true);
    try {
      const url = form.id ? `/api/v1/materials/${encodeURIComponent(form.id)}` : '/api/v1/materials';
      const res = await fetch(url, { method: form.id ? 'PATCH' : 'POST', headers: jsonAuthHeaders(), body: JSON.stringify(body) });
      if (!res.ok) { setError(await responseError(res)); return; }
      showToast(form.id ? '💾 Предложение обновлено' : '✅ Предложение опубликовано');
      setForm(null);
      load();
      onChanged?.();
    } catch (err) {
      setError(`Сервер недоступен: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (o, body, text) => {
    try {
      const res = await fetch(`/api/v1/materials/${encodeURIComponent(o.id)}`, { method: 'PATCH', headers: jsonAuthHeaders(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await responseError(res));
      showToast(text); load(); onChanged?.();
    } catch (e) { showToast(`⚠️ ${e.message}`); }
  };
  const remove = async (o) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Удалить «${o.name}»?`)) return;
    try {
      const res = await fetch(`/api/v1/materials/${encodeURIComponent(o.id)}`, { method: 'DELETE', headers: jsonAuthHeaders() });
      if (!res.ok) throw new Error(await responseError(res));
      showToast('🗑️ Предложение удалено'); load(); onChanged?.();
    } catch (e) { showToast(`⚠️ ${e.message}`); }
  };

  const catLabel = (id) => OFFER_CATEGORIES.find(([k]) => k === id)?.[1] || id || '—';

  return (
    <div className="mmp-content mmp-supplier">
      <div className="mmp-supplier-head">
        <div>
          <h2>🏭 Мои предложения</h2>
          <p>Ваши материалы в витрине: цена, склад, опт и условия доставки. Покупатели видят их выше справочного каталога.</p>
        </div>
        {state.status !== 'noauth' && <button type="button" className="mkt-btn-primary" onClick={() => edit(null)}>+ Добавить материал</button>}
      </div>

      {state.status === 'noauth' && <div className="mkt-empty"><h3>Нужен вход</h3><p>Размещать материалы могут поставщики, компании и исполнители с серверной учётной записью.</p></div>}
      {state.status === 'error' && <div className="mkt-empty"><h3>Не удалось загрузить</h3><p>{state.error}</p><button type="button" className="mkt-btn-secondary" onClick={load}>Повторить</button></div>}
      {state.status === 'ready' && state.items.length === 0 && (
        <div className="mkt-empty"><h3>Предложений пока нет</h3><p>Добавьте первый материал — он сразу появится в каталоге.</p></div>
      )}

      {state.items.length > 0 && (
        <div className="mmp-supplier-table" role="table">
          <div className="mmp-supplier-row head" role="row">
            <span>Материал</span><span>Цена</span><span>Склад</span><span>Город</span><span>Статус</span><span />
          </div>
          {state.items.map(({ offer: o, referencePrice }) => (
            <div className="mmp-supplier-row" role="row" key={o.id}>
              <span><strong>{o.name}</strong><small>{catLabel(o.category)}{o.gost ? ` · ${o.gost}` : ''}</small></span>
              <span>
                {fmt(o.price)} / {o.unit}
                {referencePrice ? <small>справочно {fmt(referencePrice)}</small> : null}
              </span>
              <span>{Number(o.stock || 0).toLocaleString('ru-RU')} {o.unit}</span>
              <span>{o.city}</span>
              <span className={o.status === 'active' ? 'ok' : 'muted'}>{o.status === 'active' ? 'В витрине' : 'Скрыто'}</span>
              <span className="mmp-supplier-actions">
                <button type="button" className="mkt-btn-secondary" onClick={() => edit(o)}>✏️</button>
                <button type="button" className="mkt-btn-secondary" onClick={() => patch(o, { status: o.status === 'active' ? 'hidden' : 'active' }, o.status === 'active' ? '🙈 Скрыто из витрины' : '👁️ Снова в витрине')}>
                  {o.status === 'active' ? 'Скрыть' : 'Показать'}
                </button>
                <button type="button" className="mkt-btn-secondary" onClick={() => remove(o)}>🗑️</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="em-modal-overlay mkt-modal-overlay" onClick={() => setForm(null)}>
          <form className="mkt-modal" role="dialog" aria-modal="true" aria-labelledby="offer-title" onClick={e => e.stopPropagation()} onSubmit={save} noValidate>
            <div className="mkt-modal-head">
              <h3 id="offer-title">{form.id ? 'Изменить предложение' : 'Новое предложение'}</h3>
              <button type="button" className="mkt-icon-btn" aria-label="Закрыть" onClick={() => setForm(null)}>✕</button>
            </div>
            <label className="mkt-field">
              <span>Наименование *</span>
              <input required value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setRefQuery(e.target.value); }} placeholder="Цемент ПЦ-400 Д20, мешок 50 кг" />
            </label>
            {refHits.length > 0 && (
              <div className="mmp-ref-hits">
                <span>Справочная цена QazGost — свяжите позицию, чтобы покупатель видел сравнение:</span>
                {refHits.map(h => (
                  <button type="button" key={h.code} className={form.priceCode === h.code ? 'active' : ''}
                    onClick={() => setForm(f => ({ ...f, priceCode: f.priceCode === h.code ? '' : h.code, refPrice: h.price, unit: f.unit || h.unit }))}>
                    {h.name} — {fmt(h.price)} / {h.unit}
                  </button>
                ))}
              </div>
            )}
            <div className="mkt-field-row">
              <label className="mkt-field"><span>Категория</span>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {OFFER_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              <label className="mkt-field"><span>Единица</span>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {OFFER_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-field"><span>Цена за единицу, ₸ *</span>
                <input type="number" inputMode="decimal" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </label>
              <label className="mkt-field"><span>Остаток на складе</span>
                <input type="number" inputMode="decimal" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-field"><span>Оптовая цена, ₸</span>
                <input type="number" inputMode="decimal" min="0" value={form.wholesalePrice} onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} />
              </label>
              <label className="mkt-field"><span>Опт от (кол-во)</span>
                <input type="number" inputMode="decimal" min="0" value={form.wholesaleFrom} onChange={e => setForm(f => ({ ...f, wholesaleFrom: e.target.value }))} />
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-field"><span>Город склада</span>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="mkt-field"><span>ГОСТ / СТ РК</span>
                <input value={form.gost} onChange={e => setForm(f => ({ ...f, gost: e.target.value }))} placeholder="ГОСТ 31108-2020" />
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-check"><input type="checkbox" checked={form.delivery} onChange={e => setForm(f => ({ ...f, delivery: e.target.checked }))} /><span>Доставка</span></label>
              <label className="mkt-check"><input type="checkbox" checked={form.pickup} onChange={e => setForm(f => ({ ...f, pickup: e.target.checked }))} /><span>Самовывоз</span></label>
            </div>
            <label className="mkt-field"><span>Телефон отдела продаж</span>
              <input type="tel" value={form.supplierPhone} onChange={e => setForm(f => ({ ...f, supplierPhone: e.target.value }))} placeholder="+7 7__ ___ __ __" />
            </label>
            <label className="mkt-field"><span>Описание</span>
              <textarea rows={2} maxLength={2000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </label>
            {form.refPrice > 0 && Number(form.price) > 0 && (
              <p className="mkt-notice">Справочная цена: {fmt(form.refPrice)} — ваша цена {Number(form.price) > form.refPrice ? 'выше' : 'ниже'} на {Math.abs(Math.round((Number(form.price) / form.refPrice - 1) * 100))}%.</p>
            )}
            {error && <p className="mkt-form-error" role="alert">{error}</p>}
            <div className="mkt-modal-actions">
              <button type="button" className="mkt-btn-secondary" onClick={() => setForm(null)}>Отмена</button>
              <button type="submit" className="mkt-btn-primary" disabled={saving}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
