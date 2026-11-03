import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Calculator, Hammer, Clock } from 'lucide-react';
import { Sheet } from './Shell';
import { SERVICES } from '../data/services';
import { CITIES, estimateByPhoto, normalizeEstimate } from '../api/clientApi';
import { compressImage } from '../utils/image';
import { formatMoney } from './ui/kit';

const MAX_PHOTOS = 6;

/** Смета по фото: снимки + площадь → позиции, итог, срок → «Заказать по смете». */
export default function EstimateSheet({ city, initialService = '', onClose, onOrder }) {
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [service, setService] = useState(initialService);
  const [area, setArea] = useState('');
  const [place, setPlace] = useState(city || 'Алматы');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const addFiles = async (files) => {
    setError('');
    const list = Array.from(files || []).slice(0, MAX_PHOTOS - photos.length);
    const out = [];
    for (const f of list) {
      try { out.push((await compressImage(f, 1280, 0.72)).dataUrl); } catch { /* пропускаем не-картинки */ }
    }
    setPhotos((p) => [...p, ...out].slice(0, MAX_PHOTOS));
  };

  const run = async () => {
    if (!photos.length && !note.trim()) return setError('Добавьте хотя бы одно фото или опишите работу словами.');
    setBusy(true);
    setError('');
    try {
      const raw = await estimateByPhoto({ photos, description: [service, note].filter(Boolean).join('. '), category: service, city: place, area });
      const est = normalizeEstimate(raw);
      if (!est.items.length && !est.total) throw new Error('Сервис не смог посчитать смету по этим данным. Добавьте фото поближе или укажите площадь.');
      setResult(est);
    } catch (e) {
      setError(e.message || 'Не удалось получить смету.');
    } finally {
      setBusy(false);
    }
  };

  const order = () => onOrder({
    service: service || result?.type || 'Работы по смете',
    area,
    budget: result?.total || '',
    description: note,
    estimateItems: result?.items || []
  });

  return (
    <Sheet title="Смета по фото" sub="Объёмы и цены по базе ГЭСН РК с поправкой на город" onClose={onClose}>
      {!result ? (
        <div className="qz-stack">
          <div className="cl-photos">
            {photos.map((p, i) => (
              <span key={i} className="cl-photo">
                <img src={p} alt={`Фото ${i + 1}`} />
                <button type="button" aria-label="Убрать фото" onClick={() => setPhotos((x) => x.filter((_, j) => j !== i))}><X size={14} /></button>
              </span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <>
                <button type="button" className="cl-photo-add" onClick={() => camRef.current?.click()}><Camera size={22} /><span>Снять</span></button>
                <button type="button" className="cl-photo-add" onClick={() => fileRef.current?.click()}><ImagePlus size={22} /><span>Галерея</span></button>
              </>
            )}
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <p className="qz-xs qz-faint">Снимайте при дневном свете, всю стену или комнату целиком. До {MAX_PHOTOS} фото.</p>

          <label className="qz-field">
            <span className="qz-label">Вид работ</span>
            <input className="qz-input" list="cl-services-e" value={service} onChange={(e) => setService(e.target.value)} placeholder="Например, штукатурка стен" />
            <datalist id="cl-services-e">{SERVICES.map((s) => <option key={s.slug} value={s.name} />)}</datalist>
          </label>
          <div className="qz-grid-2">
            <label className="qz-field">
              <span className="qz-label">Площадь, м²</span>
              <input className="qz-input" type="number" inputMode="decimal" min="0" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Например, 42" />
            </label>
            <label className="qz-field">
              <span className="qz-label">Город</span>
              <select className="qz-select" value={place} onChange={(e) => setPlace(e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
          </div>
          <label className="qz-field">
            <span className="qz-label">Комментарий</span>
            <textarea className="qz-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Что хотите сделать, какие материалы" />
          </label>
          {error && <p className="cl-error" role="alert">{error}</p>}
          <button type="button" className="qz-btn is-primary is-block" onClick={run} disabled={busy}>
            <Calculator size={18} aria-hidden="true" /> {busy ? 'Считаем смету…' : 'Рассчитать смету'}
          </button>
        </div>
      ) : (
        <div className="qz-stack">
          <div className="cl-total">
            <span className="qz-small qz-muted">{result.type || service || 'Итого по смете'}</span>
            <strong>{formatMoney(result.total)}</strong>
            <span className="qz-row qz-small qz-muted">
              {result.days > 0 && <><Clock size={14} aria-hidden="true" /> около {result.days} дн.</>}
              {area && <span>· {area} м² · {place}</span>}
            </span>
          </div>
          {(result.works > 0 || result.materials > 0) && (
            <dl className="qz-kv qz-card">
              {result.works > 0 && <><dt>Работы</dt><dd>{formatMoney(result.works)}</dd></>}
              {result.materials > 0 && <><dt>Материалы</dt><dd>{formatMoney(result.materials)}</dd></>}
            </dl>
          )}
          <ul className="cl-items">
            {result.items.map((it, i) => (
              <li key={i}>
                <span className="qz-grow"><strong>{it.name}</strong><span className="qz-xs qz-faint">{it.volume.toLocaleString('ru-RU')} {it.unit} × {formatMoney(it.unit_price)}</span></span>
                <span className="cl-item-sum">{formatMoney(it.total)}</span>
              </li>
            ))}
          </ul>
          {result.insights.length > 0 && (
            <div className="qz-card">
              <h3 className="qz-h3" style={{ marginBottom: 8 }}>Рекомендации</h3>
              <ul className="cl-bullets">{result.insights.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
          <p className="qz-xs qz-faint">Предварительная смета. Точную цену бригада назовёт после осмотра.</p>
          <button type="button" className="qz-btn is-primary is-block" onClick={order}><Hammer size={18} aria-hidden="true" /> Заказать по этой смете</button>
          <button type="button" className="qz-btn is-block" onClick={() => setResult(null)}>Изменить данные</button>
        </div>
      )}
    </Sheet>
  );
}
