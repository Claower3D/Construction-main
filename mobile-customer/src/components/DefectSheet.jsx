import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, ScanSearch, HardHat, AlertTriangle } from 'lucide-react';
import { Sheet } from './Shell';
import { scanDefects, SEVERITY } from '../api/clientApi';
import { compressImage } from '../utils/image';

/** Проверка дефектов по фото (нейросеть YOLO26 на сервере) → акт → вызов инженера. */
export default function DefectSheet({ onClose, onOrder }) {
  const camRef = useRef(null);
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState(null);

  const pick = async (files) => {
    const f = files && files[0];
    if (!f) return;
    setError('');
    setRes(null);
    try { setPhoto(await compressImage(f, 1600, 0.82)); } catch { setError('Не удалось открыть фото.'); }
  };

  const run = async () => {
    if (!photo) return setError('Сначала сфотографируйте стену или конструкцию.');
    setBusy(true);
    setError('');
    try {
      setRes(await scanDefects(photo.blob, 'defect.jpg'));
    } catch (e) {
      setError(e.message || 'Не удалось проверить фото.');
    } finally {
      setBusy(false);
    }
  };

  const items = res?.defects?.items || [];
  const sev = res?.defect_severity_summary?.max_severity;
  const cost = res?.estimatedCostKzt;

  return (
    <Sheet title="Проверка дефектов" sub="Нейросеть отмечает трещины на фото. Коррозию, сколы и влагу подтверждает инженер." onClose={onClose}>
      <div className="qz-stack">
        <div className="cl-defect-view">
          {res?.defect_annotated_image ? (
            <img src={res.defect_annotated_image} alt="Фото с отмеченными дефектами" />
          ) : photo ? (
            <img src={photo.dataUrl} alt="Выбранное фото" />
          ) : (
            <div className="cl-defect-empty"><ScanSearch size={34} aria-hidden="true" /><span>Сфотографируйте стену, потолок или фундамент</span></div>
          )}
          {busy && <div className="cl-scanline" aria-hidden="true" />}
        </div>
        <div className="qz-grid-2">
          <button type="button" className="qz-btn" onClick={() => camRef.current?.click()}><Camera size={18} /> Снять</button>
          <button type="button" className="qz-btn" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /> Галерея</button>
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />

        {error && <p className="cl-error" role="alert">{error}</p>}
        {!res && (
          <button type="button" className="qz-btn is-primary is-block" onClick={run} disabled={busy || !photo}>
            <ScanSearch size={18} aria-hidden="true" /> {busy ? 'Проверяем…' : 'Проверить фото'}
          </button>
        )}

        {res && (
          <>
            {items.length === 0 ? (
              <div className="qz-card cl-note"><ScanSearch size={18} aria-hidden="true" /><span>Трещин на фото не найдено. Если дефект виден глазом, снимите его ближе или вызовите инженера.</span></div>
            ) : (
              <div className="qz-card">
                <div className="qz-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 className="qz-h3">{res.defectType || 'Найдены дефекты'}</h3>
                  {sev && <span className={`qz-status is-st-${SEVERITY[sev]?.tone || 'muted'}`}>{SEVERITY[sev]?.label || sev}</span>}
                </div>
                <ul className="cl-items">
                  {items.map((it, i) => (
                    <li key={i}>
                      <span className="qz-grow"><strong>{it.type || 'Трещина'}</strong><span className="qz-xs qz-faint">уверенность {Math.round((it.confidence || 0) * 100)}%</span></span>
                      <span className={`qz-status is-st-${SEVERITY[it.severity]?.tone || 'muted'}`}>{SEVERITY[it.severity]?.label || '—'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {res.fixMethod && (
              <div className="qz-card">
                <h3 className="qz-h3" style={{ marginBottom: 6 }}>Как устранить</h3>
                <p className="qz-small qz-muted" style={{ lineHeight: 1.5 }}>{res.fixMethod}</p>
              </div>
            )}
            {(res.snipCode || cost) && (
              <dl className="qz-kv qz-card">
                {res.snipCode && <><dt>Норматив</dt><dd>{res.snipCode}</dd></>}
                {cost && (cost.min || cost.max) ? <><dt>Ремонт</dt><dd className="cl-gold">{Math.round(cost.min).toLocaleString('ru-RU')} – {Math.round(cost.max).toLocaleString('ru-RU')} ₸</dd></> : null}
              </dl>
            )}
            {res.is_mock || res.fallback ? (
              <p className="qz-xs qz-faint"><AlertTriangle size={12} /> Сервис нейросети недоступен, показан упрощённый анализ.</p>
            ) : null}
            <button type="button" className="qz-btn is-primary is-block" onClick={() => onOrder({
              service: 'Осмотр инженера и ремонт дефектов',
              description: [res.defectType, res.fixMethod].filter(Boolean).join('. '),
              budget: cost?.max ? Math.round(cost.max) : ''
            })}>
              <HardHat size={18} aria-hidden="true" /> Вызвать инженера
            </button>
            <button type="button" className="qz-btn is-block" onClick={() => { setRes(null); setPhoto(null); }}>Проверить другое фото</button>
          </>
        )}
      </div>
    </Sheet>
  );
}
