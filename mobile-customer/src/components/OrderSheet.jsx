import React, { useState } from 'react';
import { Send, Info } from 'lucide-react';
import { Sheet } from './Shell';
import { SERVICES } from '../data/services';
import { CITIES, createOrder } from '../api/clientApi';
import { localDateISO, addDaysISO } from '../api/syncCore';
import { formatMoney } from './ui/kit';

/** Оформление заказа. prefill: { service, area, budget, description, estimateItems } */
export default function OrderSheet({ prefill = {}, user, city, onClose, onCreated, onNeedLogin }) {
  const [form, setForm] = useState({
    service: prefill.service || '',
    description: prefill.description || '',
    city: city || 'Алматы',
    location: '',
    date: addDaysISO(localDateISO(), 2),
    area: prefill.area || '',
    budget: prefill.budget || '',
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.service.trim()) return setError('Выберите или напишите, какая работа нужна.');
    if (!form.location.trim()) return setError('Укажите адрес объекта — бригаде нужно знать, куда ехать.');
    if (!/\d{7,}/.test(form.phone.replace(/\D/g, ''))) return setError('Укажите телефон для связи.');
    setBusy(true);
    try {
      const res = await createOrder({ ...form, estimateItems: prefill.estimateItems || [] });
      onCreated(res);
    } catch (err) {
      setError(err.message || 'Не удалось отправить заказ.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title="Заказ работы"
      sub="Заявка уйдёт бригадам вашего города. Они пришлют цену и сроки."
      onClose={onClose}
    >
      <form className="qz-stack" onSubmit={submit} noValidate>
        <label className="qz-field">
          <span className="qz-label">Какая работа нужна</span>
          <input className="qz-input" list="cl-services" value={form.service} onChange={set('service')} placeholder="Например, укладка плитки" />
          <datalist id="cl-services">{SERVICES.map((s) => <option key={s.slug} value={s.name} />)}</datalist>
        </label>
        <label className="qz-field">
          <span className="qz-label">Описание</span>
          <textarea className="qz-textarea" value={form.description} onChange={set('description')} placeholder="Что сделать, материалы, особенности объекта" />
        </label>
        <div className="qz-grid-2">
          <label className="qz-field">
            <span className="qz-label">Город</span>
            <select className="qz-select" value={form.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="qz-field">
            <span className="qz-label">Когда начать</span>
            <input className="qz-input" type="date" min={localDateISO()} value={form.date} onChange={set('date')} />
          </label>
        </div>
        <label className="qz-field">
          <span className="qz-label">Адрес объекта</span>
          <input className="qz-input" value={form.location} onChange={set('location')} placeholder="Улица, дом, квартира" autoComplete="street-address" />
        </label>
        <div className="qz-grid-2">
          <label className="qz-field">
            <span className="qz-label">Площадь, м²</span>
            <input className="qz-input" type="number" inputMode="decimal" min="0" value={form.area} onChange={set('area')} placeholder="0" />
          </label>
          <label className="qz-field">
            <span className="qz-label">Бюджет, ₸</span>
            <input className="qz-input" type="number" inputMode="numeric" min="0" value={form.budget} onChange={set('budget')} placeholder="Не знаю" />
          </label>
        </div>
        <div className="qz-grid-2">
          <label className="qz-field">
            <span className="qz-label">Имя</span>
            <input className="qz-input" value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
          <label className="qz-field">
            <span className="qz-label">Телефон</span>
            <input className="qz-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+7 7__ ___ __ __" autoComplete="tel" />
          </label>
        </div>

        {prefill.estimateItems?.length > 0 && (
          <div className="qz-card cl-note">
            <Info size={18} aria-hidden="true" />
            <span>К заказу приложена смета: {prefill.estimateItems.length} позиций на {formatMoney(prefill.budget)}.</span>
          </div>
        )}
        {!user && (
          <div className="qz-card cl-note">
            <Info size={18} aria-hidden="true" />
            <span>Вы не вошли в аккаунт: заказ сохранится на телефоне и отправится после входа. <button type="button" className="cl-link" onClick={onNeedLogin}>Войти</button></span>
          </div>
        )}
        {error && <p className="cl-error" role="alert">{error}</p>}
        <button type="submit" className="qz-btn is-primary is-block" disabled={busy}>
          <Send size={18} aria-hidden="true" /> {busy ? 'Отправляем…' : 'Отправить заказ'}
        </button>
      </form>
    </Sheet>
  );
}
