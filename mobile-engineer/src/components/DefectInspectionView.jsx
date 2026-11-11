import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Camera, AlertTriangle, ScanSearch, Share2, Paperclip, Maximize2, X, Info, RefreshCw, Video } from 'lucide-react';
import { runDefectScan } from '../api/engineerApi';
import { compressImage } from '../utils/image';
import { formatMoney } from './ui/kit';
import '../styles/live.css';

// распознавание в живом кадре тянет за собой модель и WebAssembly — грузим только по нажатию
const LiveCrackScanner = lazy(() => import('./LiveCrackScanner'));

// Severity scale of the detector (its own semantic colours, worst → mildest)
const SEVERITY = {
  critical: { color: '#f87171', label: 'Критический' },
  high: { color: '#fb923c', label: 'Высокий' },
  medium: { color: '#fbbf24', label: 'Средний' },
  low: { color: '#34d399', label: 'Низкий' }
};
const sev = (s) => SEVERITY[String(s || '').toLowerCase()] || { color: '#8b98a9', label: s || 'не указан' };

const TYPE_RU = {
  crack: 'Трещина',
  spalling: 'Скол, отслоение бетона',
  corrosion: 'Коррозия',
  exposed_rebar: 'Оголённая арматура',
  rebar: 'Оголённая арматура',
  efflorescence: 'Высолы',
  leak: 'Протечка',
  moisture: 'Намокание',
  mold: 'Плесень',
  hole: 'Раковина, пустота',
  deformation: 'Деформация'
};
const typeRu = (t) => TYPE_RU[String(t || '').toLowerCase()] || t || 'Дефект';

const LOOK_FOR = [
  { id: 'crack', label: 'Трещины' },
  { id: 'spalling', label: 'Сколы бетона' },
  { id: 'corrosion', label: 'Коррозия' },
  { id: 'leak', label: 'Протечки' },
  { id: 'ring', label: 'Кольца ЖБИ' }
];
const SENSITIVITY = [
  { v: 0.35, label: 'Только явные' },
  { v: 0.5, label: 'Обычная' },
  { v: 0.7, label: 'Всё подозрительное' }
];

function ZoomViewer({ src, onClose }) {
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const setLevel = (z) => {
    const st = stageRef.current;
    const cx = st ? (st.scrollLeft + st.clientWidth / 2) / (st.scrollWidth || 1) : 0.5;
    const cy = st ? (st.scrollTop + st.clientHeight / 2) / (st.scrollHeight || 1) : 0.5;
    setZoom(z);
    requestAnimationFrame(() => {
      if (!st) return;
      st.scrollLeft = cx * st.scrollWidth - st.clientWidth / 2;
      st.scrollTop = cy * st.scrollHeight - st.clientHeight / 2;
    });
  };
  return (
    <div className="qz-viewer" role="dialog" aria-modal="true" aria-label="Фото с разметкой дефектов">
      <div className="qz-viewer-bar">
        <span className="qz-grow qz-h3">Разметка дефектов</span>
        <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={onClose}><X size={22} /></button>
      </div>
      <div className="qz-viewer-stage" ref={stageRef} onDoubleClick={() => setLevel(zoom === 1 ? 2 : 1)}>
        <img src={src} alt="Фото с отмеченными дефектами" style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} />
      </div>
      <div className="qz-viewer-zoom" role="group" aria-label="Масштаб">
        {[1, 2, 3].map(z => (
          <button key={z} type="button" className={`qz-btn is-sm${zoom === z ? ' is-primary' : ''}`} aria-pressed={zoom === z} onClick={() => setLevel(z)} style={{ minWidth: 64 }}>
            {z}×
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DefectInspectionView({ deals = [], onAttachToDeal }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [lookFor, setLookFor] = useState('');
  const [sensitivity, setSensitivity] = useState(0.5);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [dealId, setDealId] = useState('');
  const [attachState, setAttachState] = useState(null); // { busy } | { ok, synced, error }
  const [viewerOpen, setViewerOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Живая камера открывается «шагом истории»: кнопка «Назад» на телефоне закрывает камеру, а не всё приложение
  const openLive = () => {
    try { window.history.pushState({ qzLive: true }, ''); } catch (e) { /* история недоступна — закроется крестиком */ }
    setLiveOpen(true);
  };
  const closeLive = () => {
    if (window.history.state && window.history.state.qzLive) window.history.back(); // дальше сработает popstate
    else setLiveOpen(false);
  };
  useEffect(() => {
    const onPop = () => setLiveOpen(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const realDeals = deals.filter(d => !d._demo);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setScanResult(null);
    setScanError(null);
    setAttachState(null);
    try {
      // the server downsizes to 1600px anyway — send a compact JPEG
      const { dataUrl, blob } = await compressImage(file, 1600, 0.85);
      if (!mountedRef.current) return;
      setPhotoUrl(dataUrl);
      setPhotoBlob(blob);
    } catch (err) {
      setScanError('Не удалось прочитать фото: ' + (err.message || 'ошибка'));
    }
  };

  const runAiScan = async () => {
    if (!photoBlob) {
      setScanError('Сначала сфотографируйте конструкцию');
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);
    setAttachState(null);
    try {
      const prompt = LOOK_FOR.find(t => t.id === lookFor)?.label || '';
      const result = await runDefectScan(photoBlob, { sensitivity, prompt });
      if (mountedRef.current) setScanResult(result);
    } catch (err) {
      // honest error — no fabricated results
      if (mountedRef.current) setScanError(err.message || 'Сервис выявления дефектов недоступен');
    } finally {
      if (mountedRef.current) setIsScanning(false);
    }
  };

  const handleAttach = async () => {
    if (!scanResult || !dealId || !onAttachToDeal) return;
    setAttachState({ busy: true });
    // keep a small preview of the annotated photo on the device (full image is not stored)
    let annotatedThumb = null;
    if (scanResult.annotatedImage) {
      try { annotatedThumb = (await compressImage(scanResult.annotatedImage, 640, 0.6)).dataUrl; } catch (e) { annotatedThumb = null; }
    }
    const { annotatedImage, ...rest } = scanResult;
    const res = await onAttachToDeal(dealId, { ...rest, annotatedThumb });
    if (mountedRef.current) setAttachState(res || { ok: false, error: 'нет ответа' });
  };

  const items = scanResult ? scanResult.items : [];
  const maxConf = items.reduce((m, d) => Math.max(m, d.confidence || 0), 0);
  const validated = scanResult?.validatedClasses;
  const isValidated = (d) => !validated || validated.includes(String(d.cls || d.type).toLowerCase());
  const unvalidated = items.filter(d => !isValidated(d));
  const maxSev = sev(scanResult?.summary?.maxSeverity);
  const shareText = scanResult
    ? `Акт дефектовки QazGost: найдено дефектов ${scanResult.summary.total}; основной — ${typeRu(scanResult.defectType)}`
      + `${scanResult.severity ? `; ${scanResult.severity}` : ''}${scanResult.snipCode ? `; ${scanResult.snipCode}` : ''}`
      + `${scanResult.estimatedCost != null ? `; оценка устранения ${typeof scanResult.estimatedCost === 'number' ? formatMoney(scanResult.estimatedCost) : scanResult.estimatedCost}` : ''}`
    : '';
  const shownImage = scanResult?.annotatedImage || photoUrl;

  return (
    <div className="qz-page">
      <button type="button" className="qz-live-entry" onClick={openLive} style={{ marginTop: 0, marginBottom: 'var(--sp-4)' }}>
        <span className="qz-live-entry-icon"><Video size={24} aria-hidden="true" /></span>
        <span className="qz-grow">
          <b>Живая камера</b>
          <span>Наведите телефон на стену — трещины подсветятся сразу, без фото. Тут же длина, материалы, смета и норматив.</span>
        </span>
      </button>

      <div className="qz-section-head" style={{ marginBottom: 'var(--sp-2)' }}>
        <h2 className="qz-h3">Проверка по фото</h2>
      </div>
      <div className="qz-field">
        <label className="qz-label" htmlFor="defect-object">Объект для акта</label>
        <select id="defect-object" className="qz-select" value={dealId} onChange={(e) => { setDealId(e.target.value); setAttachState(null); }}>
          <option value="">Выберите объект</option>
          {realDeals.map(d => (
            <option key={d.id} value={d.id}>{d.leadNum ? `№ ${d.leadNum}, ` : ''}{d.title}</option>
          ))}
        </select>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />

      {/* Photo, edge to edge */}
      <div style={{ margin: 'var(--sp-4) calc(-1 * var(--sp-4)) 0', position: 'relative', background: '#05080c', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        {shownImage ? (
          <>
            <button
              type="button"
              onClick={() => scanResult?.annotatedImage && setViewerOpen(true)}
              aria-label={scanResult?.annotatedImage ? 'Открыть фото с разметкой крупно' : 'Фото конструкции'}
              style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'none', cursor: scanResult?.annotatedImage ? 'zoom-in' : 'default' }}
            >
              <img src={shownImage} alt={scanResult ? 'Фото с отмеченными дефектами' : 'Фото конструкции'} style={{ display: 'block', width: '100%', maxHeight: '62vh', objectFit: 'contain' }} />
            </button>
            {isScanning && (
              <div role="status" style={{ position: 'absolute', inset: 0, background: 'rgba(5, 8, 12, 0.65)', display: 'grid', placeItems: 'center', alignContent: 'center', gap: 10, color: 'var(--text)' }}>
                <ScanSearch size={34} className="qz-spin" style={{ color: 'var(--accent)' }} />
                <span className="qz-h3">Модель ищет дефекты…</span>
              </div>
            )}
            <div className="qz-row" style={{ position: 'absolute', right: 10, bottom: 10, gap: 8 }}>
              {scanResult?.annotatedImage && (
                <button type="button" className="qz-btn is-sm" onClick={() => setViewerOpen(true)} style={{ background: 'rgba(15,21,29,0.86)' }}>
                  <Maximize2 size={16} /> Увеличить
                </button>
              )}
              <button type="button" className="qz-btn is-sm" onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(15,21,29,0.86)' }}>
                <Camera size={16} /> Переснять
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', minHeight: 220, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 10, border: 0, background: 'var(--surface)', color: 'var(--text-2)' }}
          >
            <Camera size={40} style={{ color: 'var(--accent)' }} />
            <span className="qz-h3" style={{ color: 'var(--text)' }}>Сфотографировать конструкцию</span>
            <span className="qz-small">Одно фото — одна проверка. Снимайте ровно, при дневном свете.</span>
          </button>
        )}
      </div>

      {/* Detector settings */}
      {!scanResult && (
        <>
          <div className="qz-label" style={{ marginTop: 'var(--sp-4)' }}>Что ищем</div>
          <div className="qz-chips" style={{ marginTop: 6 }}>
            <button type="button" className={`qz-chip${lookFor === '' ? ' is-active' : ''}`} onClick={() => setLookFor('')}>Все дефекты</button>
            {LOOK_FOR.map(t => (
              <button key={t.id} type="button" className={`qz-chip${lookFor === t.id ? ' is-active' : ''}`} onClick={() => setLookFor(lookFor === t.id ? '' : t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="qz-label" style={{ marginTop: 'var(--sp-2)' }}>Чувствительность</div>
          <div className="qz-segmented" role="radiogroup" aria-label="Чувствительность" style={{ marginTop: 6 }}>
            {SENSITIVITY.map(s => (
              <button key={s.v} type="button" role="radio" aria-selected={sensitivity === s.v} aria-checked={sensitivity === s.v} onClick={() => setSensitivity(s.v)}>{s.label}</button>
            ))}
          </div>
          <button type="button" className="qz-btn is-primary is-block" style={{ marginTop: 'var(--sp-4)' }} onClick={runAiScan} disabled={isScanning || !photoBlob}>
            <ScanSearch size={20} /> {isScanning ? 'Идёт анализ…' : 'Найти дефекты'}
          </button>
        </>
      )}

      {scanError && (
        <div className="qz-card is-danger" role="alert" style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 10 }}>
          <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div className="qz-grow">
            <div className="qz-h3">{scanError}</div>
            <div className="qz-small qz-muted" style={{ marginTop: 4 }}>Результат не сформирован. Проверьте связь и адрес сервера в настройках.</div>
            {photoBlob && <button type="button" className="qz-btn is-sm" style={{ marginTop: 10 }} onClick={runAiScan}><RefreshCw size={16} /> Повторить</button>}
          </div>
        </div>
      )}

      {scanResult && (
        <>
          {/* Model + summary */}
          <div className="qz-row" style={{ marginTop: 'var(--sp-4)', flexWrap: 'wrap', gap: 8 }}>
            {scanResult.detector && <span className="qz-tag is-accent">{scanResult.detector}</span>}
            {maxConf > 0 && <span className="qz-small qz-muted">уверенность до {Math.round(maxConf * 100)}%</span>}
            {scanResult.isMock && <span className="qz-tag is-warn">резервный алгоритм</span>}
          </div>
          {scanResult.detectorNote && !(validated && unvalidated.length > 0) && <div className="qz-xs qz-faint" style={{ marginTop: 4 }}>{scanResult.detectorNote}</div>}
          <div className="qz-row" style={{ alignItems: 'baseline', marginTop: 6 }}>
            <h2 className="qz-h2 qz-grow" style={{ fontSize: 'var(--fs-2xl)' }}>
              {scanResult.summary.total > 0 ? `${scanResult.summary.total} ${plural(scanResult.summary.total, 'дефект', 'дефекта', 'дефектов')}` : 'Дефектов не найдено'}
            </h2>
            {scanResult.summary.total > 0 && <span className="qz-small" style={{ color: maxSev.color, fontWeight: 650 }}>худший: {maxSev.label.toLowerCase()}</span>}
          </div>
          {scanResult.severity && <div className="qz-small qz-muted">{scanResult.severity}</div>}

          {validated && unvalidated.length > 0 && (
            <div className="qz-card is-flat" style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 10, borderColor: 'var(--line-strong)' }}>
              <Info size={18} className="qz-faint" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="qz-small qz-muted">
                Модель проверена на классе «{validated.map(typeRu).join(', ').toLowerCase()}». Остальные находки
                ({[...new Set(unvalidated.map(d => typeRu(d.type).toLowerCase()))].join(', ')}) — подсказка, подтвердите их на месте.
              </div>
            </div>
          )}

          {/* Defects */}
          {items.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginTop: 'var(--sp-3)' }}>
              {items.map((d, i) => {
                const s = sev(d.severity);
                const pct = d.confidence != null ? Math.round(d.confidence * 100) : null;
                return (
                  <div key={i} className="qz-card" style={{ padding: 'var(--sp-3)', boxShadow: `inset 3px 0 0 ${s.color}` }}>
                    <div className="qz-row" style={{ justifyContent: 'space-between' }}>
                      <span className="qz-h3">{typeRu(d.type)}</span>
                      <span className="qz-small" style={{ color: s.color, fontWeight: 650 }}>{s.label}</span>
                    </div>
                    <div className="qz-row" style={{ marginTop: 8, gap: 10 }}>
                      <span className="qz-meter qz-grow" style={{ '--st': s.color }} aria-hidden="true"><i style={{ width: `${pct || 0}%` }} /></span>
                      <span className="qz-small num qz-muted" style={{ minWidth: 92, textAlign: 'right' }}>{pct != null ? `уверенность ${pct}%` : '—'}</span>
                    </div>
                    {!isValidated(d) && <div className="qz-xs qz-faint" style={{ marginTop: 6 }}>класс не проверен на валидации — проверьте визуально</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* What to do, cost, norms */}
          {(scanResult.fixMethod || scanResult.estimatedCost != null || scanResult.snipCode) && (
            <div className="qz-card" style={{ marginTop: 'var(--sp-4)' }}>
              <h3 className="qz-h3">Что делать</h3>
              {scanResult.fixMethod && <p className="qz-small" style={{ marginTop: 6, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{scanResult.fixMethod}</p>}
              <hr className="qz-divider" />
              <dl className="qz-kv">
                <dt>Стоимость устранения</dt>
                <dd className="num">{scanResult.estimatedCost == null || scanResult.estimatedCost === '' ? '—' : (typeof scanResult.estimatedCost === 'number' ? formatMoney(scanResult.estimatedCost) : scanResult.estimatedCost)}</dd>
                <dt>Срок работ</dt>
                <dd className="num">{scanResult.workDays ? `${scanResult.workDays} ${plural(scanResult.workDays, 'день', 'дня', 'дней')}` : '—'}</dd>
                <dt>Нормативы</dt>
                <dd>{scanResult.snipCode || '—'}</dd>
              </dl>
            </div>
          )}

          <div className="qz-grid-2" style={{ marginTop: 'var(--sp-4)' }}>
            <button type="button" className="qz-btn is-primary" onClick={handleAttach} disabled={!dealId || attachState?.busy}>
              <Paperclip size={18} /> {attachState?.busy ? 'Сохраняем…' : 'В акт объекта'}
            </button>
            <button type="button" className="qz-btn" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_system')}>
              <Share2 size={18} /> Поделиться
            </button>
          </div>
          {!dealId && <div className="qz-xs qz-faint" style={{ marginTop: 6 }}>Чтобы приложить акт, выберите объект вверху экрана.</div>}
          {attachState && !attachState.busy && (
            <div role="status" className="qz-small" style={{ marginTop: 10, fontWeight: 600, color: attachState.ok && attachState.synced ? 'var(--ok)' : 'var(--warn)' }}>
              {!attachState.ok
                ? `Не сохранено: ${attachState.error}`
                : attachState.synced
                  ? 'Акт приложен к объекту и отправлен на сервер.'
                  : `Акт сохранён на телефоне, но не отправлен (${attachState.error}). Отправится при следующей синхронизации.`}
            </div>
          )}
          <button type="button" className="qz-btn is-ghost is-block" style={{ marginTop: 'var(--sp-3)' }} onClick={() => { setScanResult(null); setAttachState(null); fileInputRef.current?.click(); }}>
            <Camera size={18} /> Проверить другое фото
          </button>
        </>
      )}

      {viewerOpen && scanResult?.annotatedImage && <ZoomViewer src={scanResult.annotatedImage} onClose={() => setViewerOpen(false)} />}
      {liveOpen && (
        <Suspense fallback={<div className="qz-live" role="status"><div className="qz-live-wait"><p className="qz-h3">Открываю камеру…</p></div></div>}>
          <LiveCrackScanner
            deals={deals}
            dealId={dealId}
            onDealChange={(id) => { setDealId(id); setAttachState(null); }}
            onAttachToDeal={onAttachToDeal}
            onClose={closeLive}
          />
        </Suspense>
      )}
    </div>
  );
}

function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
