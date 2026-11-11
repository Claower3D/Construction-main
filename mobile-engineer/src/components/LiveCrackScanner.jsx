import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Pause, Play, Plus, Minus, Flashlight, Trash2, Share2, Paperclip, RefreshCw, AlertTriangle, Check, BookOpen } from 'lucide-react';
import { createCrackDetector, MODEL_INFO } from '../services/crackVision';
import { SURFACES, surfaceById, loadCatalogPrices, calcRepair, crackLengthM, CRACK_NORMS } from '../services/crackRepairCalc';
import { getSavedServerUrl } from '../api/engineerApi';
import { cleanServerUrl } from '../api/syncCore';
import { formatMoney } from './ui/kit';
import '../styles/live.css';

// Живая камера: наводишь телефон на конструкцию — трещины подсвечиваются в кадре,
// ниже сразу длина, материалы, работа и норматив. Распознавание идёт на телефоне, связь не нужна;
// по сети подтягиваются только цены каталога (без связи берутся цены из снимка).

const DISTANCES = [0.3, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5];
const CITIES = ['Алматы', 'Астана', 'Караганда', 'Атырау', 'Шымкент', 'Актобе'];
const CITY_KEY = 'qazgost_engineer_scan_city';
const num = (n, d = 1) => (Number(n) || 0).toLocaleString('ru-RU', { maximumFractionDigits: d });
const qty = (n) => num(n, n < 1 ? 2 : 1); // малые количества — с сотыми (0,03 л)
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
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Нет доступа к камере. Разрешите камеру для приложения в настройках телефона и нажмите «Повторить».';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Камера не найдена.';
  if (name === 'NotReadableError') return 'Камера занята другим приложением. Закройте его и нажмите «Повторить».';
  return 'Не удалось включить камеру.';
}

export default function LiveCrackScanner({ deals = [], dealId = '', onDealChange, onAttachToDeal, onClose }) {
  const [model, setModel] = useState({ state: 'loading', progress: 0, error: '' });
  const [camera, setCamera] = useState({ state: 'starting', error: '' }); // starting | on | error
  const [paused, setPaused] = useState(false);
  const [scan, setScan] = useState({ boxes: [], w: 0, h: 0, ms: 0, seen: false });
  const [liveLength, setLiveLength] = useState(0);
  const [distanceIdx, setDistanceIdx] = useState(3);
  const [surface, setSurface] = useState('plaster');
  const [zones, setZones] = useState([]);
  const [city, setCity] = useState(() => { try { return localStorage.getItem(CITY_KEY) || CITIES[0]; } catch (e) { return CITIES[0]; } });
  const [prices, setPrices] = useState(null); // null — ещё грузим, {} — каталог недоступен
  const [torch, setTorch] = useState({ can: false, on: false });
  const [note, setNote] = useState('');
  const [attach, setAttach] = useState(null); // { busy } | { ok, synced, error }

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const pausedRef = useRef(false);
  const lengthsRef = useRef([]);
  const noteTimer = useRef(null);
  const aliveRef = useRef(true);

  const distance = DISTANCES[distanceIdx];
  const say = (msg) => { setNote(msg); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 3500); };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  const startCamera = async () => {
    setCamera((c) => ({ ...c, state: c.state === 'on' ? 'on' : 'starting', error: '' }));
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamera({ state: 'error', error: 'Эта версия системы не даёт приложению доступ к камере в реальном времени. Проверьте дефект по фото.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (!aliveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      stopCamera();
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track && track.getCapabilities ? track.getCapabilities() : {};
      setTorch({ can: !!caps.torch, on: false });
      pausedRef.current = false; setPaused(false);
      lengthsRef.current = [];
      setCamera((c) => ({ state: 'on', error: '', ver: (c.ver || 0) + 1 }));
    } catch (err) {
      if (aliveRef.current) setCamera({ state: 'error', error: cameraErrorText(err) });
    }
  };

  // модель и камера запускаются сразу при открытии: человек уже нажал «Живая камера»
  useEffect(() => {
    aliveRef.current = true;
    const det = createCrackDetector({ onProgress: (p) => { if (aliveRef.current) setModel((m) => (m.state === 'loading' ? { ...m, progress: p } : m)); } });
    detectorRef.current = det;
    det.ready.then(() => { if (aliveRef.current) setModel({ state: 'ready', progress: 1, error: '' }); })
      .catch((e) => { if (aliveRef.current) setModel({ state: 'error', progress: 0, error: e.message || 'Не удалось запустить распознавание' }); });
    startCamera();
    // экран не должен гаснуть, пока человек водит телефоном по стене
    let lock = null;
    try { navigator.wakeLock?.request('screen').then((l) => { if (aliveRef.current) lock = l; else l.release(); }).catch(() => {}); } catch (e) { /* не поддерживается */ }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      aliveRef.current = false;
      det.dispose();
      stopCamera();
      clearTimeout(noteTimer.current);
      try { lock?.release(); } catch (e) { /* уже отпущен */ }
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // цены каталога для выбранного города
  useEffect(() => {
    let alive = true;
    setPrices(null);
    try { localStorage.setItem(CITY_KEY, city); } catch (e) { /* не критично */ }
    loadCatalogPrices(city, cleanServerUrl(getSavedServerUrl())).then((p) => { if (alive) setPrices(p); });
    return () => { alive = false; };
  }, [city]);

  // поток подключаем после того, как <video> появился в разметке
  useEffect(() => {
    if (camera.state !== 'on') return;
    const v = videoRef.current;
    if (v && streamRef.current && v.srcObject !== streamRef.current) { v.srcObject = streamRef.current; v.play().catch(() => {}); }
  }, [camera.state, camera.ver]);

  // цикл распознавания по живому видео
  useEffect(() => {
    if (camera.state !== 'on' || model.state !== 'ready') return undefined;
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
        await new Promise((res) => setTimeout(res, 100));
      }
    })();
    return () => { alive = false; };
  }, [camera.state, model.state]);

  // длина в кадре: медиана последних кадров, чтобы цифры не прыгали
  useEffect(() => {
    if (!scan.seen) return;
    const total = scan.boxes.reduce((s, b) => s + crackLengthM(b, scan.w, scan.h, distance), 0);
    if (paused) { setLiveLength(total); return; }
    lengthsRef.current = [...lengthsRef.current.slice(-4), total];
    setLiveLength(median(lengthsRef.current));
  }, [scan, distance, paused]);

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
    try { await track.applyConstraints({ advanced: [{ torch: !torch.on }] }); setTorch({ can: true, on: !torch.on }); } catch (e) { say('Фонарик на этом телефоне не включается'); }
  };

  const addZone = () => {
    if (!scan.boxes.length) return;
    let thumb = '';
    try {
      const c = document.createElement('canvas');
      const k = 320 / scan.w;
      c.width = 320; c.height = Math.round(scan.h * k);
      const g = c.getContext('2d');
      g.drawImage(videoRef.current, 0, 0, c.width, c.height);
      g.strokeStyle = '#f87171'; g.lineWidth = 3;
      scan.boxes.forEach((b) => g.strokeRect(b.x * c.width, b.y * c.height, b.w * c.width, b.h * c.height));
      thumb = c.toDataURL('image/jpeg', 0.7);
    } catch (e) { /* без миниатюры */ }
    const lengthM = scan.boxes.reduce((s, b) => s + crackLengthM(b, scan.w, scan.h, distance), 0);
    const conf = scan.boxes.reduce((m, b) => Math.max(m, b.conf), 0);
    setZones((z) => [...z, { id: `${Date.now()}-${z.length}`, thumb, count: scan.boxes.length, lengthM, surface, distance, conf }]);
    setAttach(null);
    say(`Участок добавлен: ${scan.boxes.length} ${cracksWord(scan.boxes.length)}, ≈ ${num(lengthM)} м`);
    if (paused) togglePause();
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
  const realDeals = deals.filter((d) => !d._demo);

  const summaryText = () => [
    'QazGost — осмотр живой камерой: трещины',
    `Участков: ${zones.length}, трещин: ${zonesCracks}, длина ≈ ${num(total.lengthM)} м`,
    `Норматив: ${CRACK_NORMS.code}`,
    '',
    'Материалы:',
    ...total.materials.map((m) => `• ${m.name}: ${qty(m.need)} ${m.unit} — ${m.packs} × ${m.packName}, ${formatMoney(m.cost)}`),
    '',
    'Работа:',
    ...total.works.map((w) => `• ${w.name}: ${num(w.qty)} м × ${formatMoney(w.price)} = ${formatMoney(w.cost)}`),
    '',
    `Итого ≈ ${formatMoney(total.total)} (цены: ${snapshotPrices ? 'на ноябрь 2026, без поправки на город' : city})`,
    'Расчёт предварительный: длина оценена по камере (±20%), раскрытие трещин измерьте щупом.',
  ].join('\n');

  const share = async () => {
    const text = summaryText();
    try {
      if (navigator.share) { await navigator.share({ title: 'Осмотр: трещины', text }); return; }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_system');
  };

  const attachToDeal = async () => {
    if (!zones.length || !dealId || !onAttachToDeal) return;
    setAttach({ busy: true });
    // тот же вид записи, что у проверки по фото, — объект и синхронизация работают с ней без изменений
    const report = {
      defectType: 'Трещина',
      severity: '',
      snipCode: CRACK_NORMS.code,
      fixMethod: [...new Set(zones.map((z) => surfaceById(z.surface).method))].join(' '),
      estimatedCost: total.total,
      workDays: null,
      annotatedThumb: zones[0].thumb || null,
      items: zones.map((z) => ({ type: 'crack', cls: 'crack', severity: '', confidence: z.conf, bbox: null, model: MODEL_INFO.name })),
      summary: { total: zonesCracks, bySeverity: {}, maxSeverity: '' },
      detector: `${MODEL_INFO.name}, живая камера`,
      validatedClasses: ['crack'],
      detectorNote: `Длина ≈ ${num(total.lengthM)} м по камере (±20%). Участков: ${zones.length}.`,
      isMock: false,
      scannedAt: new Date().toISOString(),
      live: {
        lengthM: total.lengthM,
        city: snapshotPrices ? null : city,
        zones: zones.map((z) => ({ lengthM: Math.round(z.lengthM * 100) / 100, count: z.count, surface: z.surface, distance: z.distance })),
        materials: total.materials.map((m) => ({ name: m.name, need: m.need, unit: m.unit, packs: m.packs, packName: m.packName, cost: m.cost })),
        works: total.works.map((w) => ({ name: w.name, qty: w.qty, price: w.price, cost: w.cost })),
        materialsCost: total.materialsCost,
        worksCost: total.worksCost,
      },
    };
    const res = await onAttachToDeal(dealId, report);
    if (aliveRef.current) setAttach(res || { ok: false, error: 'нет ответа' });
  };

  const aspect = scan.w && scan.h ? scan.w / scan.h : 9 / 16;
  const statusText = camera.state !== 'on' ? ''
    : model.state === 'loading' ? (model.progress >= 0.999 ? 'Запускаю распознавание…' : `Готовлю распознавание… ${Math.round(model.progress * 100)}%`)
      : model.state === 'error' ? 'Распознавание недоступно'
        : !scan.seen ? 'Ищу трещины…'
          : scan.boxes.length ? `${scan.boxes.length} ${cracksWord(scan.boxes.length)} в кадре` : 'Трещин не видно';

  return (
    <div className="qz-live" role="dialog" aria-modal="true" aria-label="Живая камера: поиск трещин" data-camera={camera.state} data-model={model.state} data-ms={scan.ms} data-boxes={scan.boxes.length}>
      <div className="qz-live-bar">
        <span className="qz-grow qz-h3">Живая камера</span>
        {model.state === 'ready' && <span className="qz-tag is-accent"><Check size={13} strokeWidth={3} aria-hidden="true" />работает без связи</span>}
        <button type="button" className="qz-iconbtn" aria-label="Закрыть камеру" onClick={onClose}><X size={22} /></button>
      </div>

      <div className="qz-live-scroll">
        {/* кадр */}
        <div className="qz-live-stagewrap">
          {camera.state === 'on' ? (
            <div className="qz-live-stage" style={{ '--ar': aspect }}>
              <video ref={videoRef} className="qz-live-video" playsInline muted autoPlay />
              {scan.boxes.map((b, i) => (
                <div key={i} className="qz-live-box" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}>
                  <span className={b.y < 0.09 ? 'is-inside' : ''}>{`Трещина ${Math.round(b.conf * 100)}% · ≈ ${num(crackLengthM(b, scan.w, scan.h, distance))} м`}</span>
                </div>
              ))}
              <p className="qz-live-status" role="status" data-found={scan.boxes.length > 0}>{statusText}</p>
              <div className="qz-live-tools">
                {torch.can && (
                  <button type="button" className={`qz-live-round${torch.on ? ' is-on' : ''}`} onClick={toggleTorch} aria-pressed={torch.on} aria-label="Фонарик"><Flashlight size={20} aria-hidden="true" /></button>
                )}
                <button type="button" className={`qz-live-round${paused ? ' is-on' : ''}`} onClick={togglePause} aria-pressed={paused} aria-label={paused ? 'Продолжить' : 'Стоп-кадр'}>
                  {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="qz-live-wait" role={camera.state === 'error' ? 'alert' : 'status'}>
              {camera.state === 'error' ? (
                <>
                  <AlertTriangle size={30} style={{ color: 'var(--danger)' }} aria-hidden="true" />
                  <p className="qz-h3">{camera.error}</p>
                  <button type="button" className="qz-btn is-sm" onClick={startCamera}><RefreshCw size={16} aria-hidden="true" />Повторить</button>
                </>
              ) : <p className="qz-h3">Включаю камеру…</p>}
            </div>
          )}
        </div>

        {model.state === 'error' && (
          <div className="qz-card is-danger" role="alert" style={{ margin: 'var(--sp-3) var(--sp-4) 0', display: 'flex', gap: 10 }}>
            <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden="true" />
            <div className="qz-small">Распознавание не запустилось: {model.error}. Закройте камеру и проверьте дефект по фото.</div>
          </div>
        )}

        <div className="qz-live-body">
          {/* что в кадре прямо сейчас */}
          <div className="qz-live-now">
            <div>
              <div className="qz-live-big num">≈ {num(liveLength)} м</div>
              <div className="qz-small qz-muted">трещин в кадре: {scan.boxes.length}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="qz-live-big num">{liveLength > 0 ? `≈ ${formatMoney(live.total)}` : '—'}</div>
              <div className="qz-small qz-muted">материалы и работа</div>
            </div>
          </div>

          <div className="qz-live-field">
            <span className="qz-label" id="live-dist">Расстояние до поверхности</span>
            <div className="qz-live-stepper" role="group" aria-labelledby="live-dist">
              <button type="button" onClick={() => setDistanceIdx((i) => Math.max(0, i - 1))} disabled={distanceIdx === 0} aria-label="Ближе"><Minus size={20} aria-hidden="true" /></button>
              <output aria-live="polite" className="num">{num(distance, 2)} м</output>
              <button type="button" onClick={() => setDistanceIdx((i) => Math.min(DISTANCES.length - 1, i + 1))} disabled={distanceIdx === DISTANCES.length - 1} aria-label="Дальше"><Plus size={20} aria-hidden="true" /></button>
            </div>
          </div>
          <div className="qz-live-field">
            <span className="qz-label" id="live-surf">Поверхность</span>
            <div className="qz-segmented" role="group" aria-labelledby="live-surf">
              {SURFACES.map((s) => (
                <button key={s.id} type="button" aria-pressed={surface === s.id} onClick={() => setSurface(s.id)}>{s.label}</button>
              ))}
            </div>
          </div>

          {liveLength > 0 && (
            <ul className="qz-live-list" aria-label="Материалы на трещины в кадре">
              {live.materials.map((m) => <li key={m.code}><span>{m.name}</span><b className="num">{qty(m.need)} {m.unit}</b></li>)}
            </ul>
          )}
          <p className="qz-small qz-muted" style={{ lineHeight: 1.45 }}>{surfaceById(surface).method}</p>

          <button type="button" className="qz-btn is-primary is-block" onClick={addZone} disabled={!scan.boxes.length}>
            <Plus size={20} aria-hidden="true" />Добавить участок в расчёт
          </button>

          {/* нормативы */}
          <div className="qz-card" style={{ padding: 'var(--sp-3)' }}>
            <div className="qz-row" style={{ gap: 8 }}>
              <BookOpen size={18} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <h3 className="qz-h3">Нормативы</h3>
            </div>
            <p className="qz-small" style={{ marginTop: 6, fontWeight: 650 }}>{CRACK_NORMS.code}</p>
            <p className="qz-small qz-muted" style={{ marginTop: 4, lineHeight: 1.45 }}>{CRACK_NORMS.fix}</p>
            <p className="qz-xs qz-faint" style={{ marginTop: 6 }}>Класс аварийности по живой картинке не ставится: измерьте раскрытие щупом и проверьте трещину по фото.</p>
          </div>

          {/* смета */}
          <section aria-labelledby="live-total-title">
            <div className="qz-row" style={{ justifyContent: 'space-between' }}>
              <h3 className="qz-h3" id="live-total-title">Смета ремонта</h3>
              {zones.length > 0 && <button type="button" className="qz-btn is-ghost is-sm" onClick={() => { setZones([]); setAttach(null); }}>Сбросить</button>}
            </div>

            {zones.length === 0 ? (
              <p className="qz-small qz-muted" style={{ marginTop: 6 }}>Добавляйте участки с трещинами — здесь сложатся материалы по упаковкам и стоимость работы.</p>
            ) : (
              <>
                <p className="qz-small qz-muted" style={{ marginTop: 4 }}>{zones.length} {plural(zones.length, 'участок', 'участка', 'участков')}, {zonesCracks} {cracksWord(zonesCracks)}, ≈ {num(total.lengthM)} м</p>
                <ul className="qz-live-zones">
                  {zones.map((z, i) => (
                    <li key={z.id}>
                      {z.thumb ? <img src={z.thumb} alt="" /> : <span className="qz-live-zone-ph" aria-hidden="true" />}
                      <div className="qz-grow">
                        <b>Участок {i + 1}: ≈ {num(z.lengthM)} м</b>
                        <span>{surfaceById(z.surface).label}, {z.count} {cracksWord(z.count)}, с {num(z.distance, 2)} м</span>
                      </div>
                      <button type="button" className="qz-iconbtn" onClick={() => { setZones((arr) => arr.filter((x) => x.id !== z.id)); setAttach(null); }} aria-label={`Убрать участок ${i + 1}`}><Trash2 size={18} aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>

                <div className="qz-card" style={{ padding: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
                  <div className="qz-label">Материалы</div>
                  <ul className="qz-live-rows">
                    {total.materials.map((m) => (
                      <li key={m.code}>
                        <div className="qz-grow"><b>{m.name}</b><span>нужно {qty(m.need)} {m.unit} · купить {m.packs} × {m.packName}</span></div>
                        <b className="num">{formatMoney(m.cost)}</b>
                      </li>
                    ))}
                  </ul>
                  <div className="qz-label" style={{ marginTop: 'var(--sp-3)' }}>Работа</div>
                  <ul className="qz-live-rows">
                    {total.works.map((w) => (
                      <li key={w.code}>
                        <div className="qz-grow"><b>{w.name}</b><span>{num(w.qty)} м × {formatMoney(w.price)}</span></div>
                        <b className="num">{formatMoney(w.cost)}</b>
                      </li>
                    ))}
                  </ul>
                  <hr className="qz-divider" />
                  <dl className="qz-kv">
                    <dt>Материалы</dt><dd className="num">{formatMoney(total.materialsCost)}</dd>
                    <dt>Работа</dt><dd className="num">{formatMoney(total.worksCost)}</dd>
                    <dt style={{ color: 'var(--text)', fontWeight: 700 }}>Итого</dt><dd className="num qz-live-grand">≈ {formatMoney(total.total)}</dd>
                  </dl>
                </div>

                <div className="qz-field" style={{ marginTop: 'var(--sp-3)' }}>
                  <label className="qz-label" htmlFor="live-city">Город для цен</label>
                  <select id="live-city" className="qz-select" value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <p className="qz-xs qz-faint" style={{ marginTop: 6 }} role="status">
                  {prices === null ? 'Загружаю цены каталога…'
                    : snapshotPrices ? 'Нет связи с каталогом — взяты цены на ноябрь 2026 без поправки на город.'
                      : `Цены из каталога QazGost, ${city}. Материалы посчитаны целыми упаковками.`}
                </p>

                <div className="qz-field" style={{ marginTop: 'var(--sp-3)' }}>
                  <label className="qz-label" htmlFor="live-object">Объект для акта</label>
                  <select id="live-object" className="qz-select" value={dealId} onChange={(e) => { onDealChange?.(e.target.value); setAttach(null); }}>
                    <option value="">Выберите объект</option>
                    {realDeals.map((d) => <option key={d.id} value={d.id}>{d.leadNum ? `№ ${d.leadNum}, ` : ''}{d.title}</option>)}
                  </select>
                </div>
                <div className="qz-grid-2" style={{ marginTop: 'var(--sp-3)' }}>
                  <button type="button" className="qz-btn is-primary" onClick={attachToDeal} disabled={!dealId || attach?.busy}>
                    <Paperclip size={18} aria-hidden="true" />{attach?.busy ? 'Сохраняем…' : 'В акт объекта'}
                  </button>
                  <button type="button" className="qz-btn" onClick={share}><Share2 size={18} aria-hidden="true" />Поделиться</button>
                </div>
                {attach && !attach.busy && (
                  <div role="status" className="qz-small" style={{ marginTop: 10, fontWeight: 600, color: attach.ok && attach.synced ? 'var(--ok)' : 'var(--warn)' }}>
                    {!attach.ok ? `Не сохранено: ${attach.error}`
                      : attach.synced ? 'Осмотр приложен к объекту и отправлен на сервер.'
                        : `Осмотр сохранён на телефоне, но не отправлен (${attach.error}). Отправится при следующей синхронизации.`}
                  </div>
                )}
              </>
            )}
          </section>

          <p className="qz-xs qz-faint" style={{ lineHeight: 1.5 }}>
            В живом режиме распознаются только трещины ({MODEL_INFO.name}: точность {num(MODEL_INFO.precision * 100, 0)}%, полнота {num(MODEL_INFO.recall * 100, 0)}% на проверочных фото).
            Протечки, коррозию и сколы проверяйте по фото. Длина считается по расстоянию с погрешностью около ±20%: держите телефон прямо перед поверхностью.
            Кадры обрабатываются на телефоне и никуда не отправляются.
          </p>
        </div>
      </div>

      <div className={`qz-live-toast${note ? ' is-on' : ''}`} role="status" aria-live="polite">{note}</div>
    </div>
  );
}
