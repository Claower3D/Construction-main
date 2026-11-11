import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Pause, Play, Plus, Minus, Flashlight, Trash2, Share2, RotateCcw, X, Check } from 'lucide-react';
import { createCrackDetector, MODEL_INFO } from '../../services/crackVision';
import { SURFACES, surfaceById, loadCatalogPrices, calcRepair, crackLengthM } from '../../services/crackRepairCalc';
import './LiveDefectScanner.css';

// Сканер трещин: камера телефона → рамки поверх картинки → длина → материалы и работа.
// Распознавание идёт на устройстве; без камеры (или без разрешения) работает по фото.

const DISTANCES = [0.3, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
const num = (n, d = 1) => (Number(n) || 0).toLocaleString('ru-RU', { maximumFractionDigits: d });
// расход: мелкие количества — с сотыми (0,03 л), остальное — с десятыми
const qty = (n) => num(n, n < 1 ? 2 : 1);
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU')} ₸`;
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100; const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};
const cracksWord = (n) => plural(n, 'трещина', 'трещины', 'трещин');
const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

function cameraErrorText(err) {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Доступ к камере запрещён. Разрешите камеру для этого сайта в настройках браузера или выберите фото.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Камера не найдена. Выберите фото трещины.';
  if (name === 'NotReadableError') return 'Камера занята другим приложением. Закройте его или выберите фото.';
  return 'Не удалось включить камеру. Выберите фото трещины.';
}

export default function LiveDefectScanner() {
  const [mode, setMode] = useState('idle'); // idle | live | photo
  const [model, setModel] = useState({ state: 'loading', progress: 0, error: '' });
  const [cameraError, setCameraError] = useState('');
  const [paused, setPaused] = useState(false);
  const [scan, setScan] = useState({ boxes: [], w: 0, h: 0, ms: 0, seen: false });
  const [liveLength, setLiveLength] = useState(0);
  const [distanceIdx, setDistanceIdx] = useState(3);
  const [surface, setSurface] = useState('plaster');
  const [zones, setZones] = useState([]);
  const [prices, setPrices] = useState(null); // null — ещё грузим, {} — каталог недоступен
  const [photoUrl, setPhotoUrl] = useState('');
  const [torch, setTorch] = useState({ can: false, on: false });
  const [note, setNote] = useState('');

  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const pausedRef = useRef(false);
  const lengthsRef = useRef([]);
  const noteTimer = useRef(null);

  const distance = DISTANCES[distanceIdx];
  const city = useMemo(() => { try { return localStorage.getItem('qazgost_city') || ''; } catch (e) { return ''; } }, []);

  const say = (msg) => { setNote(msg); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 3500); };

  // модель грузится сразу, пока человек читает подсказку
  useEffect(() => {
    let alive = true;
    const det = createCrackDetector({ onProgress: (p) => { if (alive) setModel((m) => (m.state === 'loading' ? { ...m, progress: p } : m)); } });
    detectorRef.current = det;
    det.ready.then(() => { if (alive) setModel({ state: 'ready', progress: 1, error: '' }); })
      .catch((e) => { if (alive) setModel({ state: 'error', progress: 0, error: e.message || 'Не удалось загрузить распознавание' }); });
    loadCatalogPrices(city).then((p) => { if (alive) setPrices(p); });
    return () => { alive = false; det.dispose(); clearTimeout(noteTimer.current); };
  }, [city]);

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setTorch({ can: false, on: false });
  };
  useEffect(() => stopCamera, []);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const resetScan = () => { setScan({ boxes: [], w: 0, h: 0, ms: 0, seen: false }); lengthsRef.current = []; setLiveLength(0); };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Камера доступна только по защищённому адресу (https) и в современном браузере. Выберите фото трещины.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track && track.getCapabilities ? track.getCapabilities() : {};
      setTorch({ can: !!caps.torch, on: false });
      resetScan();
      pausedRef.current = false; setPaused(false);
      setMode('live');
    } catch (err) {
      setCameraError(cameraErrorText(err));
    }
  };

  // поток подключаем после того, как <video> появился в разметке
  useEffect(() => {
    if (mode !== 'live') return undefined;
    const v = videoRef.current;
    if (v && streamRef.current) { v.srcObject = streamRef.current; v.play().catch(() => {}); }
    return undefined;
  }, [mode]);

  // цикл распознавания по живому видео
  useEffect(() => {
    if (mode !== 'live' || model.state !== 'ready') return undefined;
    let alive = true;
    (async () => {
      while (alive) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && !document.hidden && !pausedRef.current) {
          try {
            const r = await detectorRef.current.detect(v);
            if (!alive) break;
            if (!pausedRef.current) setScan({ boxes: r.boxes, w: r.width, h: r.height, ms: r.ms, seen: true });
          } catch (e) {
            if (alive) setModel({ state: 'error', progress: 0, error: e.message || 'Распознавание остановилось' });
            break;
          }
        }
        await new Promise((res) => setTimeout(res, 120));
      }
    })();
    return () => { alive = false; };
  }, [mode, model.state]);

  // длина в кадре: медиана последних кадров, чтобы цифры не прыгали
  useEffect(() => {
    if (!scan.seen) return;
    const total = scan.boxes.reduce((s, b) => s + crackLengthM(b, scan.w, scan.h, distance), 0);
    if (mode === 'photo' || paused) { setLiveLength(total); return; }
    lengthsRef.current = [...lengthsRef.current.slice(-4), total];
    setLiveLength(median(lengthsRef.current));
  }, [scan, distance, mode, paused]);

  const togglePause = () => {
    const v = videoRef.current;
    const next = !paused;
    pausedRef.current = next; setPaused(next);
    if (v) { if (next) v.pause(); else v.play().catch(() => {}); }
    if (!next) lengthsRef.current = [];
  };

  const toggleTorch = async () => {
    const track = streamRef.current && streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch.on }] }); setTorch({ can: true, on: !torch.on }); } catch (e) { say('Фонарик на этом устройстве не включается'); }
  };

  const onPickPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { say('Нужен файл с фотографией'); return; }
    stopCamera();
    resetScan();
    setCameraError('');
    setPhotoUrl(URL.createObjectURL(file));
    setMode('photo');
  };

  const onPhotoLoaded = async () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      const r = await detectorRef.current.detect(img);
      setScan({ boxes: r.boxes, w: r.width, h: r.height, ms: r.ms, seen: true });
    } catch (e) {
      setModel({ state: 'error', progress: 0, error: e.message || 'Не удалось распознать фото' });
    }
  };

  const closeViewer = () => { stopCamera(); setMode('idle'); resetScan(); setPhotoUrl(''); };

  const addZone = () => {
    if (!scan.boxes.length) return;
    const src = mode === 'photo' ? imgRef.current : videoRef.current;
    let thumb = '';
    try {
      const c = document.createElement('canvas');
      const k = 320 / scan.w;
      c.width = 320; c.height = Math.round(scan.h * k);
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0, c.width, c.height);
      g.strokeStyle = '#ff5c8a'; g.lineWidth = 3;
      scan.boxes.forEach((b) => g.strokeRect(b.x * c.width, b.y * c.height, b.w * c.width, b.h * c.height));
      thumb = c.toDataURL('image/jpeg', 0.7);
    } catch (e) { /* без миниатюры */ }
    const lengthM = scan.boxes.reduce((s, b) => s + crackLengthM(b, scan.w, scan.h, distance), 0);
    setZones((z) => [...z, { id: `${Date.now()}-${z.length}`, thumb, count: scan.boxes.length, lengthM, surface, distance }]);
    say(`Участок добавлен: ${scan.boxes.length} ${cracksWord(scan.boxes.length)}, ≈ ${num(lengthM)} м`);
    if (mode === 'live' && paused) togglePause();
  };

  const byZones = useMemo(() => {
    const map = {};
    zones.forEach((z) => { map[z.surface] = (map[z.surface] || 0) + z.lengthM; });
    return map;
  }, [zones]);
  const total = useMemo(() => calcRepair(byZones, prices || {}), [byZones, prices]);
  const live = useMemo(() => calcRepair({ [surface]: liveLength }, prices || {}), [surface, liveLength, prices]);
  const zonesCracks = zones.reduce((s, z) => s + z.count, 0);
  const snapshotPrices = prices !== null && Object.keys(prices).length === 0;

  const shareTotal = async () => {
    const lines = [
      'QazGost AI — расчёт ремонта трещин',
      `Участков: ${zones.length}, трещин: ${zonesCracks}, длина ≈ ${num(total.lengthM)} м`,
      '',
      'Материалы:',
      ...total.materials.map((m) => `• ${m.name}: ${qty(m.need)} ${m.unit} — ${m.packs} × ${m.packName}, ${money(m.cost)}`),
      '',
      'Работа:',
      ...total.works.map((w) => `• ${w.name}: ${num(w.qty)} м × ${money(w.price)} = ${money(w.cost)}`),
      '',
      `Итого ≈ ${money(total.total)}${city ? ` (цены: ${city})` : ''}`,
      'Расчёт предварительный: длина оценена по камере (±20%), требуется осмотр специалистом.',
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share) { await navigator.share({ title: 'Расчёт ремонта трещин', text }); return; }
      await navigator.clipboard.writeText(text);
      say('Расчёт скопирован — вставьте его в сообщение');
    } catch (e) {
      if (e && e.name !== 'AbortError') say('Не получилось отправить. Попробуйте ещё раз');
    }
  };

  const viewing = mode !== 'idle';
  const aspect = scan.w && scan.h ? scan.w / scan.h : (mode === 'live' ? 16 / 9 : 4 / 3);
  const statusText = model.state === 'loading'
    ? (model.progress >= 0.999 ? 'Запускаю распознавание…' : `Загружаю распознавание… ${Math.round(model.progress * 100)}%`)
    : model.state === 'error' ? 'Распознавание недоступно'
      : !scan.seen ? 'Ищу трещины…'
        : scan.boxes.length ? `${scan.boxes.length} ${cracksWord(scan.boxes.length)} в кадре` : 'Трещин не видно';

  return (
    <div className="ls">
      <header className="ls-panel ls-head">
        <div>
          <h2 className="ls-title">Наведите камеру на трещину</h2>
          <p className="ls-sub">Трещины подсветятся рамкой прямо в кадре, а ниже появится расчёт материалов и работы. Подойдут стена, перекрытие, стяжка.</p>
        </div>
        <p className="ls-model" data-state={model.state}>
          {model.state === 'ready' && <><Check size={15} strokeWidth={3} aria-hidden="true" />Распознавание готово, работает на устройстве</>}
          {model.state === 'loading' && (model.progress >= 0.999 ? 'Запускаю распознавание…' : `Загружаю распознавание: ${Math.round(model.progress * 100)}% из 10 МБ`)}
          {model.state === 'error' && `Распознавание не загрузилось: ${model.error}`}
        </p>
      </header>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="ls-file" onChange={onPickPhoto} aria-label="Фото трещины" />

      <div className="ls-body">
        <div className="ls-main">
          {/* камера или фото */}
          {!viewing ? (
            <div className="ls-panel ls-start">
              <div className="ls-start-frame" aria-hidden="true"><i /><i /><i /><i /><Camera size={44} /></div>
              <p className="ls-start-text">Держите телефон прямо перед поверхностью, без наклона. Чем точнее указано расстояние, тем точнее длина.</p>
              <div className="ls-start-actions">
                <button type="button" className="ls-btn ls-btn--gold" onClick={startCamera}><Camera size={18} aria-hidden="true" />Включить камеру</button>
                <button type="button" className="ls-btn ls-btn--ghost" onClick={() => fileRef.current && fileRef.current.click()}><ImagePlus size={18} aria-hidden="true" />Выбрать фото</button>
              </div>
              {cameraError && <p className="ls-alert" role="alert">{cameraError}</p>}
            </div>
          ) : (
            <div className="ls-panel ls-viewer">
              <div className="ls-stage" style={{ aspectRatio: String(aspect), '--ls-ar': aspect }} data-ms={scan.ms}>
                {mode === 'live'
                  ? <video ref={videoRef} className="ls-media" playsInline muted autoPlay />
                  : <img ref={imgRef} className="ls-media" src={photoUrl} alt="Фото для проверки на трещины" onLoad={onPhotoLoaded} />}
                {scan.boxes.map((b, i) => (
                  <div key={i} className="ls-box" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}>
                    <span className={b.y < 0.08 ? 'is-inside' : ''}>{`Трещина ${Math.round(b.conf * 100)}% · ≈ ${num(crackLengthM(b, scan.w, scan.h, distance))} м`}</span>
                  </div>
                ))}
                <p className="ls-status" role="status" data-found={scan.boxes.length > 0}>{statusText}</p>
                <div className="ls-stage-tools">
                  {mode === 'live' && torch.can && (
                    <button type="button" className={`ls-round${torch.on ? ' is-on' : ''}`} onClick={toggleTorch} aria-pressed={torch.on} aria-label="Фонарик"><Flashlight size={18} aria-hidden="true" /></button>
                  )}
                  {mode === 'live' && (
                    <button type="button" className={`ls-round${paused ? ' is-on' : ''}`} onClick={togglePause} aria-pressed={paused} aria-label={paused ? 'Продолжить' : 'Стоп-кадр'}>
                      {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
                    </button>
                  )}
                  <button type="button" className="ls-round" onClick={closeViewer} aria-label={mode === 'live' ? 'Выключить камеру' : 'Закрыть фото'}><X size={18} aria-hidden="true" /></button>
                </div>
              </div>

              <div className="ls-controls">
                <div className="ls-field">
                  <span className="ls-label" id="ls-dist-label">Расстояние до поверхности</span>
                  <div className="ls-stepper" role="group" aria-labelledby="ls-dist-label">
                    <button type="button" onClick={() => setDistanceIdx((i) => Math.max(0, i - 1))} disabled={distanceIdx === 0} aria-label="Ближе"><Minus size={18} aria-hidden="true" /></button>
                    <output aria-live="polite">{num(distance, 2)} м</output>
                    <button type="button" onClick={() => setDistanceIdx((i) => Math.min(DISTANCES.length - 1, i + 1))} disabled={distanceIdx === DISTANCES.length - 1} aria-label="Дальше"><Plus size={18} aria-hidden="true" /></button>
                  </div>
                </div>
                <div className="ls-field">
                  <span className="ls-label" id="ls-surf-label">Поверхность</span>
                  <div className="ls-seg" role="group" aria-labelledby="ls-surf-label">
                    {SURFACES.map((s) => (
                      <button key={s.id} type="button" aria-pressed={surface === s.id} className={surface === s.id ? 'is-active' : ''} onClick={() => setSurface(s.id)}>{s.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ls-live">
                <div className="ls-live-head">
                  <p className="ls-live-num"><b>≈ {num(liveLength)} м</b><span>трещин в кадре: {scan.boxes.length}</span></p>
                  <p className="ls-live-sum"><span>материалы и работа</span><b>{liveLength > 0 ? `≈ ${money(live.total)}` : '—'}</b></p>
                </div>
                {liveLength > 0 && (
                  <ul className="ls-live-list">
                    {live.materials.map((m) => <li key={m.code}><span>{m.name}</span><b>{qty(m.need)} {m.unit}</b></li>)}
                  </ul>
                )}
                <p className="ls-method">{surfaceById(surface).method}</p>
                <div className="ls-live-actions">
                  <button type="button" className="ls-btn ls-btn--gold" onClick={addZone} disabled={!scan.boxes.length}><Plus size={18} aria-hidden="true" />Добавить участок в расчёт</button>
                  {mode === 'photo' && <button type="button" className="ls-btn ls-btn--ghost" onClick={() => fileRef.current && fileRef.current.click()}><ImagePlus size={18} aria-hidden="true" />Другое фото</button>}
                  {mode === 'photo' && <button type="button" className="ls-btn ls-btn--ghost" onClick={() => { setPhotoUrl(''); setMode('idle'); startCamera(); }}><Camera size={18} aria-hidden="true" />Камера</button>}
                </div>
              </div>
            </div>
          )}

          <p className="ls-honest">
            Распознаются только трещины ({MODEL_INFO.name}: точность {num(MODEL_INFO.precision * 100, 0)}%, полнота {num(MODEL_INFO.recall * 100, 0)}% на проверочных фото).
            Длина оценивается по расстоянию с погрешностью около ±20%, ширину раскрытия измерьте линейкой или щупом.
            Кадры обрабатываются на устройстве и никуда не отправляются.
          </p>
        </div>

        {/* расчёт */}
        <aside className="ls-panel ls-total" aria-labelledby="ls-total-title">
          <div className="ls-total-head">
            <h3 id="ls-total-title">Расчёт ремонта</h3>
            {zones.length > 0 && (
              <button type="button" className="ls-link" onClick={() => setZones([])}><RotateCcw size={14} aria-hidden="true" />Сбросить</button>
            )}
          </div>

          {zones.length === 0 ? (
            <p className="ls-empty">Добавьте участки с трещинами — здесь сложатся материалы по упаковкам и стоимость работы.</p>
          ) : (
            <>
              <p className="ls-total-sum">{zones.length} {plural(zones.length, 'участок', 'участка', 'участков')}, {zonesCracks} {cracksWord(zonesCracks)}, ≈ {num(total.lengthM)} м</p>
              <ul className="ls-zones">
                {zones.map((z, i) => (
                  <li key={z.id}>
                    {z.thumb ? <img src={z.thumb} alt="" /> : <span className="ls-zone-ph" aria-hidden="true" />}
                    <div>
                      <b>Участок {i + 1}: ≈ {num(z.lengthM)} м</b>
                      <span>{surfaceById(z.surface).label}, {z.count} {cracksWord(z.count)}, с {num(z.distance, 2)} м</span>
                    </div>
                    <button type="button" className="ls-icon" onClick={() => setZones((arr) => arr.filter((x) => x.id !== z.id))} aria-label={`Убрать участок ${i + 1}`}><Trash2 size={15} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>

              <table className="ls-table">
                <caption>Материалы</caption>
                <thead><tr><th scope="col">Позиция</th><th scope="col">Нужно</th><th scope="col">Купить</th><th scope="col">Сумма</th></tr></thead>
                <tbody>
                  {total.materials.map((m) => (
                    <tr key={m.code}><th scope="row">{m.name}</th><td data-label="Нужно">{qty(m.need)} {m.unit}</td><td data-label="Купить">{m.packs} × {m.packName}</td><td>{money(m.cost)}</td></tr>
                  ))}
                </tbody>
              </table>
              <table className="ls-table">
                <caption>Работа</caption>
                <tbody>
                  {total.works.map((w) => (
                    <tr key={w.code}><th scope="row">{w.name}</th><td data-label="Длина">{num(w.qty)} м</td><td data-label="Цена">{money(w.price)} за м</td><td>{money(w.cost)}</td></tr>
                  ))}
                </tbody>
              </table>

              <dl className="ls-totals">
                <div><dt>Материалы</dt><dd>{money(total.materialsCost)}</dd></div>
                <div><dt>Работа</dt><dd>{money(total.worksCost)}</dd></div>
                <div className="is-grand"><dt>Итого</dt><dd>≈ {money(total.total)}</dd></div>
              </dl>
              <p className="ls-price-note">
                {snapshotPrices
                  ? 'Каталог цен сейчас недоступен — использованы цены на ноябрь 2026 без поправки на город.'
                  : `Цены из каталога QazGost${city ? `, ${city}` : ''}. Материалы посчитаны целыми упаковками.`}
              </p>
              <button type="button" className="ls-btn ls-btn--ghost ls-btn--block" onClick={shareTotal}><Share2 size={17} aria-hidden="true" />Отправить расчёт</button>
            </>
          )}
        </aside>
      </div>

      <div className={`ls-toast${note ? ' is-on' : ''}`} role="status" aria-live="polite">{note}</div>
    </div>
  );
}
