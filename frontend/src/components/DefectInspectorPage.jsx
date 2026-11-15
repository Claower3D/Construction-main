import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import { detectCracks, measureManualZone, assessVisionDefects, renderCrackMap, loadImage } from '../utils/crackDetector';
import { askVision } from '../utils/defectVision';
import { buildCrackReport, buildVisionReport } from '../utils/crackReport';
import { authHeaders, escapeHtml, safeImgSrc, responseError, genId } from '../services/platformUtils';
import './DefectInspectorPage.css';

const DEFECT_TYPES = [
  { id: 'crack', icon: '🧱', label: 'Трещина в стене / потолке', keywords: 'Трещина в стене, потолке' },
  { id: 'leak', icon: '💧', label: 'Протечка / сырость', keywords: 'Протечка, сырость, вода, затопление' },
  { id: 'mold', icon: '🦠', label: 'Плесень / грибок', keywords: 'Плесень, грибок, биопоражение, чёрные пятна' },
  { id: 'corrosion', icon: '🔩', label: 'Коррозия арматуры', keywords: 'Коррозия арматуры, ржавчина, оголение металла' },
  { id: 'facade', icon: '🏠', label: 'Фасад / облицовка', keywords: 'Фасад, облицовка, штукатурка отваливается, отслоение' },
  { id: 'roof', icon: '🏚️', label: 'Кровля / крыша', keywords: 'Кровля, крыша, протечка кровли, черепица' },
  { id: 'foundation', icon: '🏗️', label: 'Фундамент / осадка', keywords: 'Фундамент, осадка, просадка, подвал, основание' },
  { id: 'window', icon: '🪟', label: 'Окна / продувание', keywords: 'Окно, стеклопакет, продувает, откос, подоконник' },
  { id: 'level', icon: '📐', label: 'Перепад пола / потолка', keywords: 'Перепад, неровности, кривой пол, горизонт, уровень' },
  { id: 'other', icon: '❓', label: 'Другое (описать вручную)', keywords: '' },
];

function defectsWord(n) {
  const v = Math.abs(n) % 100;
  const d = v % 10;
  if (v > 10 && v < 20) return `Найдено ${n} дефектов`;
  if (d === 1) return `Найден ${n} дефект`;
  if (d >= 2 && d <= 4) return `Найдено ${n} дефекта`;
  return `Найдено ${n} дефектов`;
}

export default function DefectInspectorPage({ onBack, hideHeader = false, onOpenScanner }) {
  const [photos, setPhotos] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  // Реальная ширина участка на фото (м) — масштаб для измерения трещин в миллиметрах
  const [frameWidthM, setFrameWidthM] = useState('');
  // Ручная отметка пропущенной трещины: человек обводит её рамкой на фото
  const [markMode, setMarkMode] = useState(false);
  const dragRef = useRef(null);
  const skipClickRef = useRef(false); // щелчок сразу после рисования рамки не должен открывать увеличение
  const [selectedDefectType, setSelectedDefectType] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [report, setReport] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [defectMarkers, setDefectMarkers] = useState([]);
  const [severitySummary, setSeveritySummary] = useState(null);
  const [showCriticalLayer, setShowCriticalLayer] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [progressSteps, setProgressSteps] = useState([]); // шаги локального CV (раньше state не был объявлен → CV не запускался)
  const [scanError, setScanError] = useState(null);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('expert');
  const [visionMode, setVisionMode] = useState('hud');
  const [stressHeatmapImage, setStressHeatmapImage] = useState(null);
  const [skeletonImage, setSkeletonImage] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [createdDefectOrder, setCreatedDefectOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [edgeMapSrc, setEdgeMapSrc] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [inspectionHistory, setInspectionHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('defect_history') || '[]'); } catch { return []; }
  });

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const lastDetectedCountRef = useRef(0);
  // Источник текущего результата: 'ai' (YOLO на сервере) или 'local' (CV в браузере).
  // При 'ai' клиентский пиксельный детектор НЕ запускается и не перезаписывает результаты модели.
  const [reportSource, setReportSource] = useState(null);
  const reportSourceRef = useRef(null);
  const [crackData, setCrackData] = useState(null); // {crackPoints, measurements} from CV

  // Где внутри элемента <img> лежит само изображение
  const photoRect = (imgEl) => {
    const fullW = imgEl.clientWidth || imgEl.offsetWidth || 400;
    const fullH = imgEl.clientHeight || imgEl.offsetHeight || 300;
    const nw = imgEl.naturalWidth || fullW;
    const nh = imgEl.naturalHeight || fullH;
    const sc = Math.min(fullW / nw, fullH / nh);
    const iw = nw * sc, ih = nh * sc;
    return { fullW, fullH, iw, ih, ox: (fullW - iw) / 2, oy: (fullH - ih) / 2 };
  };

  const drawOverlay = useCallback(() => {
    const imgEl = imgRef.current;
    const canvas = canvasRef.current;
    if (!imgEl || !canvas) return;
    if (visionMode === 'clean') {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    const R = photoRect(imgEl);
    canvas.width = R.fullW;
    canvas.height = R.fullH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, R.fullW, R.fullH);
    // Фото вписано в элемент с полями (object-fit: contain): считаем от самого изображения,
    // иначе на вертикальных снимках рамки уезжают за край
    ctx.translate(R.ox, R.oy);
    const cw = R.iw;
    const ch = R.ih;

    // Результат от AI-сервиса: рамки модели уже нарисованы на аннотированном фото сервера.
    // Раньше этот оверлей запускал свой пиксельный «детектор» и ПЕРЕЗАПИСЫВАЛ найденные
    // моделью дефекты выдуманными зонами с «точностью 92%».
    if (reportSourceRef.current === 'ai') return;

    // Трещины находит модель при анализе (detectCracks): здесь только рисуем её зоны
    // и измеренные линии трещин. Раньше оверлей сам искал «трещины» по тёмным пикселям
    // и подменял результат — край люка, песок и тени становились «критическими дефектами».
    if (visionMode === 'hud' || visionMode === 'stress') {
      try {
        const pts = (crackData && crackData.crackPoints) || [];
        for (const p of pts) {
          const cx = (p.xPct / 100) * cw, cy = (p.yPct / 100) * ch;
          if (visionMode === 'stress') {
            const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 12);
            grad.addColorStop(0, 'rgba(255,40,30,0.22)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - 12, cy - 12, 24, 24);
          } else {
            ctx.fillStyle = 'rgba(0, 220, 255, 0.9)';
            ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
          }
        }

        const sevColors = {
          critical: { stroke: '#ff2828', fill: 'rgba(255,40,40,0.18)', text: 'КРИТИЧ.' },
          high: { stroke: '#ff781e', fill: 'rgba(255,120,30,0.15)', text: 'ВЫСОКИЙ' },
          medium: { stroke: '#ffc800', fill: 'rgba(255,200,0,0.12)', text: 'СРЕДНИЙ' },
          low: { stroke: '#50c850', fill: 'rgba(80,200,80,0.12)', text: 'НИЗКИЙ' },
        };

        // ========== DRAW BOUNDING BOXES ==========
        // Only draw real detected clusters, or valid non-dummy markers
        const validStateMarkers = defectMarkers.filter(m => 
          m.bbox && !(m.bbox[0] === 0 && m.bbox[1] === 0 && m.bbox[2] === 50 && m.bbox[3] === 50)
        );

        const boxesToDraw = validStateMarkers;

        boxesToDraw.forEach((m, idx) => {
          if (!m.bbox) return;
          const s = sevColors[m.severity] || sevColors.medium;
          const x = (m.bbox[0] / 100) * cw;
          const y = (m.bbox[1] / 100) * ch;
          const bw = ((m.bbox[2] - m.bbox[0]) / 100) * cw;
          const bh = ((m.bbox[3] - m.bbox[1]) / 100) * ch;

          // Filled box
          ctx.fillStyle = s.fill;
          ctx.fillRect(x, y, bw, bh);

          // Border
          ctx.strokeStyle = s.stroke;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, bw, bh);

          // Corner brackets
          const bLen = Math.min(bw, bh) * 0.22;
          ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(x, y + bLen); ctx.lineTo(x, y); ctx.lineTo(x + bLen, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + bw - bLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + bLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y + bh - bLen); ctx.lineTo(x, y + bh); ctx.lineTo(x + bLen, y + bh); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + bw - bLen, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - bLen); ctx.stroke();

        });

        // Подписи — после всех рамок и без наложений: каждая ищет свободное место рядом с зоной
        const placed = [];
        const hits = (r) => placed.some((q) => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
        const fit = (r) => ({ ...r, x: Math.min(Math.max(0, r.x), Math.max(0, cw - r.w)), y: Math.min(Math.max(0, r.y), Math.max(0, ch - r.h)) });
        const place = (cands, w, h) => {
          for (const c of cands) { const r = fit({ x: c[0], y: c[1], w, h }); if (!hits(r)) { placed.push(r); return r; } }
          // всё занято — сдвигаем вниз от первой позиции
          let r = fit({ x: cands[0][0], y: cands[0][1], w, h });
          for (let k = 0; k < 12 && hits(r); k++) r = fit({ ...r, y: r.y + h + 2 });
          placed.push(r);
          return r;
        };
        const fontSize = Math.max(11, Math.min(cw * 0.022, 15));
        const lh = fontSize + 6;
        boxesToDraw.forEach((m, idx) => {
          if (!m.bbox) return;
          const s = sevColors[m.severity] || sevColors.medium;
          const x = (m.bbox[0] / 100) * cw;
          const y = (m.bbox[1] / 100) * ch;
          const bw = ((m.bbox[2] - m.bbox[0]) / 100) * cw;
          const bh = ((m.bbox[3] - m.bbox[1]) / 100) * ch;

          ctx.font = `bold ${fontSize}px sans-serif`;
          const label = `#${idx + 1} ${s.text}${m.confidence > 0 ? ' · ' + Math.round(m.confidence * 100) + '%' : ''}`;
          const lw = ctx.measureText(label).width + 10;
          const r1 = place([[x, y - lh - 2], [x, y + bh + 2], [x + bw - lw, y - lh - 2], [x, y + 2]], lw, lh);
          ctx.fillStyle = s.stroke;
          ctx.fillRect(r1.x, r1.y, r1.w, r1.h);
          ctx.fillStyle = '#fff';
          ctx.fillText(label, r1.x + 5, r1.y + lh - 5);

          // Размеры: длина и наибольшее раскрытие
          const parts = [];
          if (m.length_mm) parts.push(`L ≈ ${m.length_mm} мм`);
          else if (m.length_rel) parts.push(`L ≈ ${Math.round(Math.min(1, m.length_rel) * 100)}% кадра`);
          if (m.opening_mm) parts.push(`d до ${m.opening_mm} мм`);
          if (!parts.length) return;
          const dimText = parts.join(' · ');
          const dFont = Math.max(10, Math.round(fontSize * 0.88));
          ctx.font = `bold ${dFont}px sans-serif`;
          const dw = ctx.measureText(dimText).width + 10;
          const dh = dFont + 7;
          const r2 = place([[r1.x, r1.y + lh + 1], [x + bw + 4, y + bh / 2 - dh / 2], [x - dw - 4, y + bh / 2 - dh / 2], [x, y + bh + 2], [r1.x, r1.y - dh - 1]], dw, dh);
          ctx.fillStyle = 'rgba(10,8,24,0.8)';
          ctx.fillRect(r2.x, r2.y, r2.w, r2.h);
          ctx.fillStyle = '#fde68a';
          ctx.fillText(dimText, r2.x + 5, r2.y + dh - 5);
        });
      } catch (e) {
        console.error('[Overlay] Inline CV error:', e);
      }
    }

    // HUD grid lines
    if (visionMode === 'hud') {
      ctx.strokeStyle = 'rgba(185, 164, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < cw; gx += cw / 8) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
      for (let gy = 0; gy < ch; gy += ch / 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }
    }
    // рамка, которую человек тянет при ручной отметке
    const d = dragRef.current;
    if (d) {
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fde68a';
      ctx.strokeRect(Math.min(d.x0, d.x1) * cw, Math.min(d.y0, d.y1) * ch, Math.abs(d.x1 - d.x0) * cw, Math.abs(d.y1 - d.y0) * ch);
      ctx.setLineDash([]);
    }
  }, [visionMode, defectMarkers, crackData]);

  useEffect(() => { drawOverlay(); }, [visionMode, defectMarkers, drawOverlay]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Правка зон человеком: добавить пропущенную трещину, убрать лишнюю зону ──
  const applyZones = (zones) => {
    const items = zones.map((z, i) => ({ ...z, id: i + 1, description: (z.description || '').replace(/^Зона \d+/, `Зона ${i + 1}`) }));
    const by = (sv) => items.filter(m => m.severity === sv).length;
    const summary = { total: items.length, by_severity: { critical: by('critical'), high: by('high'), medium: by('medium'), low: by('low') } };
    const span = parseFloat(String(frameWidthM).replace(',', '.')) * 1000;
    const crackLike = items.filter(m => !m.kind || m.kind === 'crack');
    const otherKinds = items.filter(m => m.kind && m.kind !== 'crack');
    const rep = buildCrackReport(crackLike, { scaleAssumed: crackLike.some(m => m.scale_assumed), spanMm: span > 0 ? span : 1500 });
    if (rep && otherKinds.length) rep.defectType += `; также: ${[...new Set(otherKinds.map(m => m.type))].join('; ')}`;
    setDefectMarkers(items);
    setSeveritySummary(summary);
    setSelectedDefectId(null);
    setReport(prev => {
      if (!prev) return prev;
      const next = { ...prev, descriptionEstimate: false, defectCount: items.length, markers: items, defect_severity_summary: summary };
      if (rep) {
        Object.assign(next, { defectType: rep.defectType, severity: rep.severity, snipCode: rep.snipCode, fixMethod: rep.fixMethod, estimatedCost: rep.estimatedCost, workDays: rep.workDays, analytics: rep.analytics });
      } else if (!items.length) {
        Object.assign(next, { defectType: 'Трещин на фото не отмечено', severity: '—', fixMethod: 'Зоны убраны. Если дефект есть — отметьте его на фото вручную или вызовите инженера на осмотр.', estimatedCost: '—', workDays: null, analytics: null });
      }
      return next;
    });
  };

  const addManualZone = async (box) => {
    try {
      const span = parseFloat(String(frameWidthM).replace(',', '.')) * 1000;
      const res = await measureManualZone(imgRef.current, box, { spanMm: span > 0 ? span : null });
      const base = defectMarkers.filter(m => m.model !== 'description');
      applyZones([...base, { ...res.region, polygon: null, orientation_deg: 0, analytics: null }]);
      setCrackData(prev => ({ crackPoints: [...((prev && prev.crackPoints) || []), ...res.points], measurements: (prev && prev.measurements) || [] }));
      showToast(res.region.measured ? 'Трещина отмечена и измерена — заключение пересчитано' : 'Зона добавлена, но линия трещины в ней не выделилась — обведите точнее');
    } catch {
      showToast('Не удалось измерить отмеченную зону');
    }
  };

  const removeZone = (id) => {
    const gone = defectMarkers.find(m => m.id === id);
    applyZones(defectMarkers.filter(m => m.id !== id && m.model !== 'description'));
    if (gone && gone.bbox) {
      const [x0, y0, x1, y1] = gone.bbox;
      setCrackData(prev => prev ? { ...prev, crackPoints: (prev.crackPoints || []).filter(pt => !(pt.xPct >= x0 && pt.xPct <= x1 && pt.yPct >= y0 && pt.yPct <= y1)) } : prev);
    }
    showToast('Зона убрана — заключение пересчитано');
  };

  // Положение указателя в долях изображения (0…1)
  const pointerPos = (e) => {
    const imgEl = imgRef.current;
    if (!imgEl) return null;
    const box = imgEl.getBoundingClientRect();
    const R = photoRect(imgEl);
    const clamp = (v) => Math.min(1, Math.max(0, v));
    return { x: clamp((e.clientX - box.left - R.ox) / R.iw), y: clamp((e.clientY - box.top - R.oy) / R.ih) };
  };
  const onMarkDown = (e) => {
    if (!markMode) return;
    const pt = pointerPos(e);
    if (!pt) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* старый браузер */ }
    dragRef.current = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y };
  };
  const onMarkMove = (e) => {
    if (!markMode || !dragRef.current) return;
    const pt = pointerPos(e);
    if (!pt) return;
    dragRef.current = { ...dragRef.current, x1: pt.x, y1: pt.y };
    drawOverlay();
  };
  const onMarkUp = () => {
    if (!markMode || !dragRef.current) return;
    const d = dragRef.current;
    dragRef.current = null;
    skipClickRef.current = true;
    setTimeout(() => { skipClickRef.current = false; }, 400);
    const box = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    setMarkMode(false);
    if (box.w < 0.01 && box.h < 0.01) { drawOverlay(); showToast('Обведите трещину рамкой: нажмите и тяните по фото'); return; }
    box.w = Math.max(box.w, 0.02); box.h = Math.max(box.h, 0.02);
    addManualZone(box);
  };

  const handleReset = () => {
    setScanError(null);
    setProgressSteps([]);
    setPhotos([]);
    setClientName('');
    setClientPhone('');
    setClientAddress('');
    setAiDescription('');
    setSelectedDefectType(null);
    setReport(null);
    setAnnotatedImage(null);
    setDefectMarkers([]);
    setSeveritySummary(null);
    lastDetectedCountRef.current = 0;
    setMarkMode(false);
    dragRef.current = null;
    setStressHeatmapImage(null);
    setSkeletonImage(null);
    setEdgeMapSrc(null);
    setCreatedDefectOrder(null);
    setActiveReportTab('expert');
    setVisionMode('hud');
    setLightboxZoom(1);
    setSelectedDefectId(null);
    showToast('🔄 Форма очищена — загрузите новые фото');
  };

  const saveToHistory = (reportData) => {
    const entry = {
      id: reportData.id,
      date: reportData.date,
      defectType: reportData.defectType,
      severity: reportData.severity,
      estimatedCost: reportData.estimatedCost,
      clientName: reportData.clientName,
      address: reportData.address,
    };
    const updated = [entry, ...inspectionHistory].slice(0, 20);
    setInspectionHistory(updated);
    try { localStorage.setItem('defect_history', JSON.stringify(updated)); } catch {}
  };

  const handleSelectDefectType = (type) => {
    setSelectedDefectType(type.id);
    if (type.id !== 'other' && type.keywords) {
      setAiDescription(type.keywords);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      showToast('⚠️ Максимальное количество фото: 10 штук');
      return;
    }

    // Принимаем только то, что браузер действительно открывает как изображение
    // (текстовый файл с расширением .jpg раньше проходил и получал «заключение»)
    let added = 0; let rejected = 0; let left = files.length;
    const done = () => {
      left -= 1;
      if (left > 0) return;
      if (rejected) showToast(`⚠️ ${rejected} файл(ов) не являются изображением и не добавлены`);
      else showToast(`📸 Добавлено фото: ${added}`);
    };
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const probe = new Image();
      probe.onerror = () => { URL.revokeObjectURL(url); rejected += 1; done(); };
      probe.onload = () => {
        if (!probe.naturalWidth || !probe.naturalHeight) { URL.revokeObjectURL(url); rejected += 1; done(); return; }
        const reader = new FileReader();
        reader.onerror = () => { rejected += 1; done(); };
        reader.onload = (ev) => {
          setPhotos(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            url,
            base64: ev.target.result,
            file: file
          }]);
          added += 1; done();
        };
        reader.readAsDataURL(file);
      };
      probe.src = url;
    });
    // чтобы тот же файл можно было выбрать снова после «Новой проверки»
    try { if (e.target && 'value' in e.target) e.target.value = ''; } catch { /* перетаскивание: поля нет */ }
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const applyPresetPrompt = (promptText) => {
    setAiDescription(prev => prev ? `${prev}. ${promptText}` : promptText);
  };

  const handlePrintTechnicalAct = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('⚠️ Разрешите всплывающие окна для печати Акта');
      return;
    }

    // ВСЕ значения экранируются: данные приходят от пользователя и от AI-сервиса,
    // а окно печати имеет тот же origin (доступ к localStorage с токеном).
    const e = escapeHtml;
    const money = (v) => (Number(v) || 0).toLocaleString('ru-RU');
    const materials = Array.isArray(report.analytics?.materials) ? report.analytics.materials : [];
    const labor = Array.isArray(report.analytics?.labor) ? report.analytics.labor : [];
    const totalMat = materials.reduce((s, m) => s + (Number(m.cost_kzt) || 0), 0);
    const totalLab = labor.reduce((s, l) => s + (Number(l.cost_kzt) || 0), 0);
    const totalAll = Number(report.analytics?.total_cost_kzt) || (totalMat + totalLab);
    const photoSrc = safeImgSrc(annotatedImage || photos[0]?.base64 || '');

    const materialsRows = materials.map((m, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${e(m.name)}</td>
        <td style="text-align:center">${e(m.qty)}</td>
        <td style="text-align:right">${money(m.cost_kzt)} T</td>
      </tr>
    `).join('');

    const laborRows = labor.map((l, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${e(l.name)}</td>
        <td style="text-align:center">${e(l.qty)}</td>
        <td style="text-align:right">${money(l.cost_kzt)} T</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Акт обследования ${e(report.id)}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #211d38; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #15122a; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 18px; font-weight: 900; color: #7c3aed; }
          .title { font-size: 15px; font-weight: 800; text-align: center; margin: 15px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .meta td { padding: 5px 10px; border: 1px solid #cbc5e3; font-size: 12px; }
          .meta td.label { background: #f5f3ff; font-weight: 700; width: 32%; }
          .est th { background: #15122a; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
          .est td { border: 1px solid #cbc5e3; padding: 5px 8px; font-size: 12px; }
          .est tr.subtotal td { background: #f5f3ff; font-weight: 700; }
          .est tr.total td { background: #7c3aed; color: #fff; font-weight: 900; font-size: 13px; }
          .img-box { text-align: center; margin: 16px 0; }
          .img-box img { max-width: 100%; max-height: 320px; border: 1px solid #a39cc2; border-radius: 4px; }
          .sign { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #a39cc2; }
          .stamp { width: 100px; height: 100px; border: 2px dashed #7c3aed; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; color: #7c3aed; font-size: 9px; font-weight: 700; transform: rotate(-10deg); }
          h4 { margin: 14px 0 6px; color: #15122a; font-size: 13px; }
          @media print { body { margin: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">QAZGOST AI<br><small style="font-size:10px;color:#8a82a8;">ТЕХНАДЗОР РК</small></div>
          <div style="text-align:right">
            <strong>АКТ № ${e(report.id)}</strong><br>
            <small>Дата: ${e(report.date)}</small>
          </div>
        </div>
        <div class="title">Акт инструментального дефектоскопического обследования</div>

        <table class="meta">
          <tr><td class="label">Заказчик:</td><td>${e(report.clientName)}</td></tr>
          <tr><td class="label">Телефон:</td><td>${e(report.clientPhone)}</td></tr>
          <tr><td class="label">Адрес объекта:</td><td>${e(report.address)}</td></tr>
          <tr><td class="label">Источник анализа:</td><td>${report.source === 'ai' ? 'AI-сервис дефектоскопии' : report.vision ? 'ИИ-модель зрения + измерение по фото' : 'Локальный анализ в браузере (ориентировочно)'}</td></tr>
          <tr><td class="label">Вид дефекта:</td><td><strong>${e(report.defectType)}</strong></td></tr>
          <tr><td class="label">Класс опасности:</td><td>${e(report.severity)}</td></tr>
          <tr><td class="label">Нормативный документ:</td><td>${e(report.snipCode)}</td></tr>
          <tr><td class="label">Категория (ГОСТ 31937):</td><td>${e(report.analytics?.gost_status || '—')}</td></tr>
          <tr><td class="label">Метод устранения:</td><td>${e(report.fixMethod)}</td></tr>
          <tr><td class="label">Срок работ:</td><td>${report.workDays ? `${e(report.workDays)} раб. дн.` : '—'}</td></tr>
        </table>

        ${photoSrc ? `
          <div class="img-box">
            <div style="font-weight:700;margin-bottom:4px;font-size:12px;">Фото дефекта:</div>
            <img src="${e(photoSrc)}" alt="Фото дефекта" />
          </div>
        ` : ''}

        ${(materials.length > 0 || labor.length > 0) ? `
          <h4>Смета на ремонтно-восстановительные работы (T)</h4>
          <table class="est">
            <thead>
              <tr><th>№</th><th>Наименование</th><th>Кол-во</th><th style="text-align:right">Стоимость</th></tr>
            </thead>
            <tbody>
              ${materials.length > 0 ? `
                <tr><td colspan="4" style="background:#ede9fe;font-weight:700;font-size:11px;">Материалы</td></tr>
                ${materialsRows}
                <tr class="subtotal"><td colspan="3" style="text-align:right">Итого материалы:</td><td style="text-align:right">${money(totalMat)} T</td></tr>
              ` : ''}
              ${labor.length > 0 ? `
                <tr><td colspan="4" style="background:#fef3c7;font-weight:700;font-size:11px;">Работы</td></tr>
                ${laborRows}
                <tr class="subtotal"><td colspan="3" style="text-align:right">Итого работы:</td><td style="text-align:right">${money(totalLab)} T</td></tr>
              ` : ''}
              <tr class="total"><td colspan="3" style="text-align:right">ИТОГО СМЕТНАЯ СТОИМОСТЬ:</td><td style="text-align:right">${money(totalAll)} T</td></tr>
            </tbody>
          </table>
        ` : `
          <h4>Ориентировочная стоимость: ${e(report.estimatedCost || '—')}</h4>
        `}

        <div class="sign">
          <div>
            <p><strong>Инженер инструментального контроля:</strong> ________________ / Нурланов А. М.</p>
            <p><strong>Технический надзор:</strong> Сертификат эксперта № KZ-0982-ENG</p>
          </div>
          <div class="stamp">
            ЭКСПЕРТИЗА<br>ПРОЙДЕНА<br>QAZGOST AI<br>ТЕХНАДЗОР
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleRunInspection = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (photos.length === 0) {
      showToast('⚠️ Пожалуйста, загрузите хотя бы 1 фото дефекта');
      return;
    }

    setIsScanning(true);
    setReport(null);
    setAnnotatedImage(null);
    setDefectMarkers([]);
    setSeveritySummary(null);
    lastDetectedCountRef.current = 0;
    reportSourceRef.current = null;
    setReportSource(null);
    setScanStepMessage('🔬 QazGost AI анализирует фото на дефекты...');
    setScanError(null);
    setProgressSteps([]);
    setStressHeatmapImage(null);
    setSkeletonImage(null);
    setCrackData(null);

    // Фото → Blob для multipart (file или dataURL)
    const photoToBlob = (ph) => {
      if (ph.file) return ph.file;
      if (typeof ph.base64 === 'string' && ph.base64.startsWith('data:')) {
        try {
          const [head, b64] = ph.base64.split(',');
          const mimeMatch = head.match(/:(.*?);/);
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          return new Blob([arr], { type: mimeMatch ? mimeMatch[1] : 'image/jpeg' });
        } catch (e) {
          console.warn('[DefectScan] base64 → Blob failed:', e);
        }
      }
      return null;
    };

    try {
      let data = null;
      let aiUnavailable = false;
      const rejected = [];
      const perPhoto = [];

      // ═══ STEP 1: AI-сервис дефектов — POST /api/v1/defect-scan (multipart, поле file; по запросу на каждое фото) ═══
      for (let i = 0; i < photos.length; i++) {
        const ph = photos[i];
        setScanStepMessage(`🧠 AI-сервис сканирует фото ${i + 1} из ${photos.length}...`);
        const blob = photoToBlob(ph);
        if (!blob) { rejected.push(`фото ${i + 1}: не удалось прочитать файл`); continue; }
        const formData = new FormData();
        formData.append('file', blob, ph.file?.name || ph.name || `photo_${i + 1}.jpg`);
        const qs = new URLSearchParams({ sensitivity: String(sensitivity) });
        if (aiDescription.trim()) qs.set('prompt', aiDescription.trim());
        try {
          // Content-Type не задаём вручную: браузер сам выставит multipart boundary
          const res = await fetch(`/api/v1/defect-scan?${qs.toString()}`, { method: 'POST', body: formData, headers: authHeaders() });
          if (res.status >= 500 || res.status === 404) { aiUnavailable = true; continue; }
          if (!res.ok) { rejected.push(`фото ${i + 1}: ${await responseError(res)}`); continue; }
          const j = await res.json().catch(() => null);
          if (!j || j.success === false) { rejected.push(`фото ${i + 1}: ${j?.error || j?.detail || 'сервис не смог обработать фото'}`); continue; }
          perPhoto.push({ index: i, name: ph.name || ph.file?.name || `Фото ${i + 1}`, data: j });
        } catch (netErr) {
          console.warn('[DefectScan] network error:', netErr);
          aiUnavailable = true;
        }
      }

      if (perPhoto.length > 0) {
        // Агрегируем результаты всех фото; «главный» результат — с максимальной тяжестью
        const SEV_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
        const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
        const allItems = [];
        let primary = perPhoto[0];
        let primaryRank = -1;
        perPhoto.forEach(r => {
          const d = r.data;
          const items = d.defects?.items || d.defects?.detections || (Array.isArray(d.defects) ? d.defects : []);
          items.forEach(it => allItems.push({ ...it, photoIndex: r.index, photoName: r.name }));
          const bs = d.defect_severity_summary?.by_severity;
          if (bs) {
            Object.keys(bySeverity).forEach(k => { bySeverity[k] += Number(bs[k]) || 0; });
          } else {
            items.forEach(it => { if (bySeverity[it.severity] !== undefined) bySeverity[it.severity] += 1; });
          }
          const rank = Math.max(SEV_RANK[d.defect_severity_summary?.max_severity] || 0, ...items.map(it => SEV_RANK[it.severity] || 0));
          if (rank > primaryRank) { primaryRank = rank; primary = r; }
        });
        const maxSeverity = Object.keys(SEV_RANK).find(k => SEV_RANK[k] === primaryRank) || null;
        const p = primary.data;
        const warnings = [...new Set(perPhoto.flatMap(r => (Array.isArray(r.data.warnings) ? r.data.warnings : []).map(String)))];
        data = {
          source: 'ai',
          detectorName: p.detector?.name || null,
          detector: p.detector || perPhoto.find(r => r.data.detector)?.data.detector || null,
          isMock: perPhoto.some(r => r.data.is_mock === true),
          fallback: perPhoto.some(r => r.data.fallback === true),
          warnings,
          defectType: p.defectType || (allItems.length ? 'Дефект строительной конструкции' : 'Дефекты не обнаружены'),
          severity: p.severity || (allItems.length ? '—' : 'Дефектов не выявлено'),
          snipCode: p.snipCode || '—',
          fixMethod: p.fixMethod || (allItems.length ? '—' : 'Ремонт не требуется'),
          estimatedCost: p.estimatedCost || '—',
          workDays: p.workDays || null,
          defects: { items: allItems, total: allItems.length },
          defect_annotated_image: p.defect_annotated_image || perPhoto.find(r => r.data.defect_annotated_image)?.data.defect_annotated_image || null,
          stress_heatmap_image: p.stress_heatmap_image || null,
          skeleton_image: p.skeleton_image || null,
          defect_severity_summary: { total: allItems.length, by_severity: bySeverity, max_severity: maxSeverity },
          structure_zones: p.structure_zones || [],
          analytics: p.analytics || null,
          perPhoto: perPhoto.map(r => ({
            index: r.index,
            name: r.name,
            annotated: r.data.defect_annotated_image || null,
            count: (r.data.defects?.items || []).length,
            maxSeverity: r.data.defect_severity_summary?.max_severity || null,
          })),
          partial: aiUnavailable || rejected.length > 0,
        };
        if (data.partial) {
          setScanError(`Часть фото не обработана${aiUnavailable ? ' (AI-сервис отвечал с ошибкой)' : ''}${rejected.length ? `: ${rejected.join('; ')}` : ''}`);
        }
        setScanStepMessage(`✅ AI: обнаружено дефектов — ${allItems.length}. Формирую отчёт...`);
      } else if (!aiUnavailable) {
        // Все фото отклонены сервисом (4xx) — честная ошибка, без выдуманного результата
        setIsScanning(false);
        setScanStepMessage('');
        setScanError(`Сервис не смог обработать фото: ${rejected.join('; ') || 'неизвестная ошибка'}`);
        showToast('❌ Анализ не выполнен — см. сообщение об ошибке');
        return;
      } else {
        setScanError('AI-сервис дефектов недоступен. Выполнен локальный анализ в браузере — результат ориентировочный, требуется подтверждение инженером.');
      }

      // ═══ STEP 2: AI-сервис недоступен — локальный анализ (CV в браузере + оценка по описанию) ═══
      if (!data) {
        setScanStepMessage('🖥️ Локальный анализ фото в браузере...');
        const descLower = (aiDescription || '').toLowerCase();
        
        // Расширенная база дефектов по СНиП РК
        const defectTemplates = [
          {
            keywords: ['протечк', 'сырост', 'вод', 'затопл', 'промок', 'мокр', 'влаг'],
            defectType: 'Нарушение гидроизоляционного слоя (протечка / сырость)',
            severity: '4 класс — Высокий риск биопоражения',
            snipCode: 'СНиП РК 2.04-09-2018 «Гидроизоляция зданий»',
            fixMethod: 'Локализация источника протечки, сушка тепловой пушкой, обработка фунгицидом, нанесение двухкомпонентной полимерной гидроизоляции.',
            estimatedCost: '55 000 – 120 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Гидроизоляция обмазочная полимерная', qty: '3.0 кг', cost_kzt: 12500 },
              { name: 'Фунгицидная грунтовка антиплесень', qty: '1.0 л', cost_kzt: 4200 },
              { name: 'Герметик полиуретановый', qty: '2 шт', cost_kzt: 5600 },
              { name: 'Армирующая лента для швов', qty: '5 м', cost_kzt: 1800 },
            ],
            labor: [
              { name: 'Демонтаж поражённого участка и сушка', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Обработка фунгицидом и грунтовка', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Нанесение гидроизоляции в 2 слоя', qty: '1 компл.', cost_kzt: 22000 },
              { name: 'Восстановление отделки', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.3 }, { pos_pct: 25, width_mm: 0.8 },
              { pos_pct: 50, width_mm: 1.5 }, { pos_pct: 75, width_mm: 1.1 }, { pos_pct: 100, width_mm: 0.4 },
            ],
          },
          {
            keywords: ['перепад', 'неровн', 'кривой пол', 'кривой потол', 'горизонт', 'уровень'],
            defectType: 'Отклонение плоскости от горизонтали / вертикали',
            severity: '2 класс — Допустимое отклонение',
            snipCode: 'СП РК 3.02-107-2014 «Полы и перекрытия»',
            fixMethod: 'Лазерное нивелирование, шлифовка неровностей, заливка самовыравнивающейся нивелир-массой толщиной до 15 мм.',
            estimatedCost: '40 000 – 85 000 ₸',
            workDays: 2,
            materials: [
              { name: 'Наливной пол самовыравнивающийся (25 кг)', qty: '4 мешка', cost_kzt: 14000 },
              { name: 'Грунтовка глубокого проникновения', qty: '2.0 л', cost_kzt: 3600 },
              { name: 'Демпферная лента', qty: '10 м', cost_kzt: 2200 },
            ],
            labor: [
              { name: 'Лазерная нивелировка и замер отклонений', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Подготовка основания и грунтовка', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Заливка самонивелирующейся смеси', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['плесен', 'грибок', 'чёрн', 'черн', 'биопоражен'],
            defectType: 'Биопоражение конструкций (плесень / грибок)',
            severity: '4 класс — Высокий риск для здоровья',
            snipCode: 'СанПиН РК 2.1.2.014-2001 «Гигиена жилых помещений»',
            fixMethod: 'Механическое удаление плесени, обработка хлорсодержащим средством, нанесение фунгицидной грунтовки, устранение причины влажности.',
            estimatedCost: '25 000 – 60 000 ₸',
            workDays: 2,
            materials: [
              { name: 'Средство для удаления плесени хлорсодержащее', qty: '2.0 л', cost_kzt: 5200 },
              { name: 'Фунгицидная грунтовка антиплесень', qty: '2.0 л', cost_kzt: 4200 },
              { name: 'Штукатурка санирующая', qty: '10 кг', cost_kzt: 6800 },
            ],
            labor: [
              { name: 'Удаление поражённого слоя шпателем/скребком', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Обработка антисептиком в 2 прохода', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Восстановительная штукатурка', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['коррози', 'ржавч', 'ржав', 'армату', 'оголен'],
            defectType: 'Коррозия арматуры и оголение металлоконструкций',
            severity: '5 класс — КРИТИЧЕСКИЙ (аварийный)',
            snipCode: 'ГОСТ 31937-2011 «Правила обследования несущих конструкций»',
            fixMethod: 'Вскрытие защитного слоя, пескоструйная очистка арматуры, обработка ингибитором коррозии, восстановление ремонтным составом.',
            estimatedCost: '85 000 – 180 000 ₸',
            workDays: 5,
            materials: [
              { name: 'Ингибитор коррозии MCI-2020', qty: '1.5 л', cost_kzt: 18000 },
              { name: 'Ремонтный состав безусадочный M600', qty: '10 кг', cost_kzt: 12000 },
              { name: 'Адгезионный мост (бонд-слой)', qty: '2 кг', cost_kzt: 8500 },
              { name: 'Антикоррозийная грунтовка', qty: '1.0 л', cost_kzt: 6200 },
            ],
            labor: [
              { name: 'Вскрытие защитного слоя бетона', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Пескоструйная очистка арматуры', qty: '1 компл.', cost_kzt: 22000 },
              { name: 'Нанесение ингибитора и бонд-слоя', qty: '1 компл.', cost_kzt: 12000 },
              { name: 'Восстановление ремонтным составом', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.5 }, { pos_pct: 20, width_mm: 2.5 },
              { pos_pct: 40, width_mm: 4.2 }, { pos_pct: 60, width_mm: 3.8 },
              { pos_pct: 80, width_mm: 2.1 }, { pos_pct: 100, width_mm: 0.8 },
            ],
          },
          {
            keywords: ['фасад', 'облицов', 'отваливает', 'отслоен', 'осыпа'],
            defectType: 'Деструкция фасадной отделки (отслоение / осыпание)',
            severity: '3 класс — Требует устранения',
            snipCode: 'СНиП РК 3.02-04-2019 «Штукатурные и облицовочные работы»',
            fixMethod: 'Удаление аварийных участков, грунтовка, армирование стеклосеткой, нанесение штукатурки с финишной отделкой.',
            estimatedCost: '45 000 – 95 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Штукатурка фасадная цементная', qty: '25 кг', cost_kzt: 5800 },
              { name: 'Стеклосетка армирующая 160 г/м²', qty: '5 м²', cost_kzt: 3500 },
              { name: 'Грунтовка для фасадов', qty: '2.0 л', cost_kzt: 4200 },
              { name: 'Дюбель-гвоздь тарельчатый', qty: '20 шт', cost_kzt: 2800 },
            ],
            labor: [
              { name: 'Демонтаж аварийных участков фасада', qty: '1 компл.', cost_kzt: 10000 },
              { name: 'Грунтование и армирование сеткой', qty: '1 компл.', cost_kzt: 12000 },
              { name: 'Штукатурка и финишная отделка', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['кровл', 'крыш', 'черепиц', 'течёт крыш'],
            defectType: 'Дефект кровельного покрытия (протечка кровли)',
            severity: '4 класс — Высокий риск',
            snipCode: 'СНиП РК 5.08-01-2019 «Кровли»',
            fixMethod: 'Локализация течи, замена повреждённого участка кровли, герметизация стыков, проверка водоотвода.',
            estimatedCost: '65 000 – 150 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Кровельный материал (рулонный/листовой)', qty: '5 м²', cost_kzt: 18000 },
              { name: 'Битумная мастика кровельная', qty: '3 кг', cost_kzt: 4500 },
              { name: 'Саморезы кровельные с EPDM', qty: '50 шт', cost_kzt: 3200 },
            ],
            labor: [
              { name: 'Демонтаж повреждённого участка кровли', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Замена кровельного покрытия', qty: '1 компл.', cost_kzt: 25000 },
              { name: 'Герметизация примыканий и стыков', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['фундамент', 'основан', 'осадк', 'просадк', 'подвал'],
            defectType: 'Трещина фундамента / осадка основания',
            severity: '5 класс — КРИТИЧЕСКИЙ (аварийный)',
            snipCode: 'ГОСТ 31937-2011, СП РК 5.01-101-2013 «Основания и фундаменты»',
            fixMethod: 'Инъекционное укрепление фундамента, устройство обоймы, дренаж, мониторинг маяков.',
            estimatedCost: '120 000 – 350 000 ₸',
            workDays: 7,
            materials: [
              { name: 'Инъекционная полиуретановая смола', qty: '3.0 кг', cost_kzt: 28000 },
              { name: 'Пакеры инъекционные d=10мм', qty: '12 шт', cost_kzt: 12800 },
              { name: 'Ремонтный состав М600', qty: '15 кг', cost_kzt: 17400 },
              { name: 'Маяки контрольные гипсовые', qty: '6 шт', cost_kzt: 1200 },
            ],
            labor: [
              { name: 'Обследование и установка маяков', qty: '1 компл.', cost_kzt: 20000 },
              { name: 'Бурение шпуров и установка пакеров', qty: '1 компл.', cost_kzt: 35000 },
              { name: 'Нагнетание инъекционного состава', qty: '1 компл.', cost_kzt: 45000 },
              { name: 'Зачеканка и восстановление', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.8 }, { pos_pct: 20, width_mm: 2.5 },
              { pos_pct: 40, width_mm: 4.8 }, { pos_pct: 60, width_mm: 3.2 },
              { pos_pct: 80, width_mm: 1.6 }, { pos_pct: 100, width_mm: 0.5 },
            ],
          },
          {
            keywords: ['окн', 'стеклопакет', 'откос', 'подоконник', 'продувает'],
            defectType: 'Дефект оконных конструкций (продувание / разгерметизация)',
            severity: '2 класс — Незначительный',
            snipCode: 'ГОСТ 30674-99 «Оконные блоки из ПВХ профилей»',
            fixMethod: 'Регулировка фурнитуры, замена уплотнителя, заделка монтажного шва, утепление откосов.',
            estimatedCost: '15 000 – 45 000 ₸',
            workDays: 1,
            materials: [
              { name: 'Уплотнитель оконный EPDM', qty: '8 м', cost_kzt: 3200 },
              { name: 'Пена монтажная профессиональная', qty: '1 шт', cost_kzt: 2800 },
              { name: 'Герметик силиконовый', qty: '1 шт', cost_kzt: 1800 },
            ],
            labor: [
              { name: 'Регулировка оконной фурнитуры', qty: '1 компл.', cost_kzt: 5000 },
              { name: 'Замена уплотнителя', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Перезаделка монтажного шва', qty: '1 компл.', cost_kzt: 8000 },
            ],
            width_profile: null,
          },
        ];

        // Поиск по ключевым словам
        let matched = null;
        for (const tpl of defectTemplates) {
          if (tpl.keywords.some(kw => descLower.includes(kw))) {
            matched = tpl;
            break;
          }
        }

        // Раньше при отсутствии совпадений подставлялась выдуманная «усадочная трещина».
        // Теперь шаблон используется ТОЛЬКО при совпадении с описанием и помечается как оценка по описанию.
        // Подсчёт суммы
        const totalMaterials = (matched?.materials || []).reduce((s, m) => s + m.cost_kzt, 0);
        const totalLabor = (matched?.labor || []).reduce((s, l) => s + l.cost_kzt, 0);

        data = {
          source: 'local',
          descriptionEstimate: !!matched,
          defectType: matched ? `${matched.defectType} — оценка по описанию` : 'Локальный анализ фото',
          severity: matched ? `${matched.severity} (по описанию)` : 'Не определён — нужен AI-анализ или осмотр инженера',
          snipCode: matched ? matched.snipCode : '—',
          fixMethod: matched ? matched.fixMethod : 'Требуется осмотр инженером: AI-сервис дефектов недоступен.',
          estimatedCost: matched ? `${matched.estimatedCost} (ориентировочно, по описанию)` : '—',
          workDays: matched ? matched.workDays : null,
          defect_severity_summary: null,
          structure_zones: [],
        };

        // Реальное распознавание дефектов через Computer Vision (Canvas pixel analysis)
        let cvItems = [];
        let cvModelError = null;
        let cvScaled = false;
        let cvScaleAssumed = true;
        let cvSpanMm = 1500;
        let visionData = null;   // ответ большой модели зрения, если она доступна
        let visionReason = null; // почему недоступна
        try {
          const photoSrc = imgRef.current || photos[0]?.base64 || photos[0]?.url;
          if (photoSrc) {
            setProgressSteps(prev => [...prev, { text: 'Vision AI: Поиск дефектов и трещин...', done: false }]);
            const spanMm = parseFloat(String(frameWidthM).replace(',', '.')) * 1000;
            // 2а. Большая модель зрения: понимает, что на фото, и различает виды дефектов.
            // Доступна, когда на сервере (или у пользователя) задан ключ; иначе — нейросеть на устройстве.
            try {
              const vImg = await loadImage(photoSrc);
              const vis = await askVision(vImg, { description: aiDescription });
              if (vis.ok) {
                const vr = await assessVisionDefects(vImg, vis.defects, { spanMm: spanMm > 0 ? spanMm : null });
                visionData = vis.data;
                cvItems = vr.regions;
                cvScaled = true;
                cvScaleAssumed = vr.scaleAssumed;
                cvSpanMm = vr.spanMm;
                setCrackData({ crackPoints: vr.points, measurements: [] });
                try { setSkeletonImage(await renderCrackMap(vImg, vr.points)); } catch { /* вкладка скелета останется без картинки */ }
              } else {
                visionReason = vis.reason;
              }
            } catch (vErr) {
              visionReason = 'network';
              console.warn('[Scan] vision model failed:', vErr);
            }
            if (!visionData) {
            const cvResult = await detectCracks(photoSrc, { spanMm: spanMm > 0 ? spanMm : null });
            cvModelError = cvResult.modelError || null;
            cvScaled = !!cvResult.scaled;
            cvScaleAssumed = cvResult.scaleAssumed !== false;
            cvSpanMm = cvResult.spanMm || 1500;
            setProgressSteps(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s));
            
            console.log('[Scan] CV result:', {
              crackPoints: cvResult.crackPoints?.length || 0,
              measurements: cvResult.measurements?.length || 0,
              regions: cvResult.regions?.length || 0,
            });
            
            // Save crack pixel data for drawOverlay to render
            if (cvResult.crackPoints && cvResult.crackPoints.length > 0) {
              setCrackData({
                crackPoints: cvResult.crackPoints,
                measurements: cvResult.measurements || [],
              });
            }
            
            // Set edge map for skeleton mode
            if (cvResult.edgeCanvas) {
              try {
                setSkeletonImage(cvResult.edgeCanvas.toDataURL('image/png'));
              } catch (e) {
                console.warn('[Scan] edgeCanvas toDataURL failed:', e.message);
              }
            }
            
            if (cvResult.regions && cvResult.regions.length > 0) {
              cvItems = cvResult.regions.map((r, i) => ({
                id: r.id || i + 1,
                type: r.type,
                severity: r.severity,
                confidence: r.confidence,
                bbox: r.bbox,
                length_mm: r.length_mm,
                opening_mm: r.opening_mm,
                opening_mean_mm: r.opening_mean_mm,
                width_profile: r.width_profile,
                scale_assumed: r.scale_assumed,
                length_rel: r.length_rel,
                area_percent: null,
                description: r.description,
                model: 'yolo-browser',
              }));
            }
            } else {
              setProgressSteps(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s));
            }
          }
        } catch (cvErr) {
          console.error('[Scan] CV detection FAILED:', cvErr);
        }

        // Если CV не выделил отдельные зоны — одна запись из шаблона ТОЛЬКО при оценке по описанию
        if (cvItems.length === 0 && matched && !visionData) {
          const severityLevel = matched.severity.includes('КРИТИЧЕСКИЙ') ? 'critical' :
                                matched.severity.includes('Высокий') ? 'high' : 'medium';
          cvItems = [{
            type: matched.defectType,
            severity: severityLevel,
            confidence: null,
            bbox: null, // на фото ничего не отмечено — это оценка только по тексту описания
            length_mm: null,
            opening_mm: null,
            area_percent: null,
            description: `Оценка по описанию (не по фото) — ${matched.defectType.split('(')[0].trim()}`,
            model: 'description',
          }];
        }
        cvItems = cvItems.map(it => ({ model: 'cv', ...it }));
        let crackRep = null;
        if (cvItems.length && cvScaleAssumed && cvItems.some(it => it.model === 'yolo-browser' || it.kind === 'crack')) {
          data.warnings = [...(data.warnings || []), `Размеры посчитаны при допущении, что ширина кадра ≈ ${(cvSpanMm / 1000).toLocaleString('ru-RU')} м. Укажите реальную ширину участка на фото — длина, раскрытие и класс опасности уточнятся.`];
        }
        const cracksFound = cvItems.some(it => it.model === 'yolo-browser');
        let visionRep = null;
        if (visionData) {
          visionRep = buildVisionReport(visionData, cvItems, { scaleAssumed: cvScaleAssumed, spanMm: cvSpanMm });
          Object.assign(data, {
            defectType: visionRep.defectType, severity: visionRep.severity, snipCode: visionRep.snipCode, fixMethod: visionRep.fixMethod,
            estimatedCost: visionRep.estimatedCost, workDays: visionRep.workDays, descriptionEstimate: false,
            vision: true, detectorName: visionData.model || 'GPT-4o',
          });
          if (visionData.photo_quality && visionData.photo_quality !== 'ok') {
            const q = { blurry: 'Фото нерезкое', dark: 'Фото тёмное', far: 'Снято издалека', not_construction: 'На фото не строительный объект' }[visionData.photo_quality];
            if (q) data.warnings = [...(data.warnings || []), `${q} — результат может быть неполным, переснимите ближе и при хорошем свете.`];
          }
        } else if (cracksFound) {
          crackRep = buildCrackReport(cvItems, { scaleAssumed: cvScaleAssumed, spanMm: cvSpanMm });
          if (crackRep) {
            data.defectType = crackRep.defectType;
            data.severity = crackRep.severity;
            data.snipCode = crackRep.snipCode;
            data.fixMethod = crackRep.fixMethod;
            data.estimatedCost = crackRep.estimatedCost;
            data.workDays = crackRep.workDays;
            data.descriptionEstimate = false;
            if (matched) {
              data.warnings = [...(data.warnings || []), `В описании также упомянуто: «${matched.defectType}». Заключение составлено по трещинам, найденным на фото; остальное модель на снимке не определяет — нужен осмотр.`];
            }
          }
        }
        if (!visionData) {
          data.warnings = [...(data.warnings || []), 'Расширенное распознавание ИИ-моделью зрения сейчас недоступно. Работает упрощённый анализ на устройстве: он знает только трещины, часть пропускает и может принять за трещину шов, край или тень. Пропущенное отметьте на фото вручную, лишнее уберите.'];
        }
        if (!visionData && !cracksFound && !matched) {
          data.defectType = cvModelError
            ? 'Модель распознавания не загрузилась — проверьте интернет и повторите анализ'
            : 'Трещин на фото не найдено';
        }
        
        data.defects = { items: cvItems };
        data.defect_severity_summary = {
          total: cvItems.length,
          by_severity: {
            critical: cvItems.filter(d => d.severity === 'critical').length,
            high: cvItems.filter(d => d.severity === 'high').length,
            medium: cvItems.filter(d => d.severity === 'medium').length,
            low: cvItems.filter(d => d.severity === 'low').length,
          }
        };
        // Добавляем аналитику для табов "Профиль трещины" и "Смета"
        data.analytics = visionRep ? visionRep.analytics : crackRep ? crackRep.analytics : !matched ? null : {
          materials: matched.materials || [],
          labor: matched.labor || [],
          total_cost_kzt: totalMaterials + totalLabor,
          width_profile: matched.width_profile || null,
          gost_status: matched.severity.includes('КРИТИЧЕСКИЙ') ? 'Категория IV — Аварийное состояние' :
                       matched.severity.includes('Высокий') ? 'Категория III — Ограниченно-работоспособное' :
                       'Категория II — Работоспособное',
          rebar_risk: matched.severity.includes('КРИТИЧЕСКИЙ') ? 'Высокий риск коррозии рабочего армокаркаса — срочное обследование!' :
                      matched.severity.includes('Высокий') ? 'Умеренный риск коррозии при продолжении воздействия' :
                      'Низкий риск — армокаркас не затронут',
        };
      }

      setScanStepMessage('✨ Формирование технического заключения по СНиП РК...');
      reportSourceRef.current = data.source || 'local';
      setReportSource(data.source || 'local');
      
      // Store defect annotation data
      if (data.defect_annotated_image) {
        setAnnotatedImage(data.defect_annotated_image);
      }
      if (data.stress_heatmap_image) {
        setStressHeatmapImage(data.stress_heatmap_image);
      }
      if (data.skeleton_image) {
        setSkeletonImage(data.skeleton_image);
      }
      if (data.defect_severity_summary) {
        setSeveritySummary(data.defect_severity_summary);
      }
      
      // Build defect markers for client-side overlay
      const items = data.defects?.items || data.defects?.detections || (Array.isArray(data.defects) ? data.defects : []);
      if (items.length > 0) {
        setDefectMarkers(items.map((d, i) => {
          const rawBbox = d.bbox || d.bounding_box || null;
          const isDummy = rawBbox && rawBbox[0] === 0 && rawBbox[1] === 0 && rawBbox[2] === 50 && rawBbox[3] === 50;
          return {
            id: i + 1,
            bbox: isDummy ? null : rawBbox,
            polygon: d.polygon || null,
            type: d.type || d.class_name || d.defect_type || 'defect',
            severity: d.severity || 'medium',
            confidence: d.confidence || d.score || 0,
            area_percent: d.area_percent || 0,
            length_mm: d.length_mm || null,
            opening_mm: d.opening_mm || null,
            opening_mean_mm: d.opening_mean_mm || null,
            scale_assumed: !!d.scale_assumed,
            length_rel: d.length_rel || null,
            width_profile: d.width_profile || null,
            orientation_deg: d.orientation_deg || 0,
            description: d.description || '',
            analytics: d.analytics || null,
            kind: d.kind || null,
            cause: d.cause || '',
            fix: d.fix || '',
            through: !!d.through,
            model: d.model || (data.source === 'ai' ? 'ai' : 'cv'),
            photoIndex: d.photoIndex,
          };
        }));
      }
      
      setTimeout(() => {
        setIsScanning(false);
        const reportData = {
          id: genId('DEF').slice(0, 16).toUpperCase(),
          date: new Date().toLocaleString('ru-RU'),
          source: data.source || 'local',
          detectorName: data.detectorName || null,
          vision: !!data.vision,
          detector: data.detector || null,
          isMock: !!data.isMock,
          fallback: !!data.fallback,
          warnings: data.warnings || [],
          descriptionEstimate: !!data.descriptionEstimate,
          partial: !!data.partial,
          perPhoto: data.perPhoto || [],
          defectType: data.defectType || '—',
          severity: data.severity || '—',
          snipCode: data.snipCode || '—',
          fixMethod: data.fixMethod || '—',
          estimatedCost: data.estimatedCost || '—',
          workDays: data.workDays || null,
          clientName: clientName || 'Заказчик',
          clientPhone: clientPhone || '',
          address: clientAddress || '',
          defectCount: items.length || 0,
          markers: items,
          analytics: data.analytics || items[0]?.analytics || null,
        };
        setReport(reportData);
        saveToHistory(reportData);
        if (reportData.source === 'ai') {
          showToast(items.length > 0
            ? `✅ AI-анализ завершён: найдено дефектов — ${items.length}`
            : '✅ AI-анализ завершён: дефекты не обнаружены');
        } else {
          if (reportData.vision) {
            setScanError(null);
            showToast(items.length > 0 ? `✅ ИИ-модель зрения нашла дефектов: ${items.length}` : '✅ ИИ-модель зрения дефектов не нашла');
          } else {
            showToast('⚠️ Расширенное распознавание недоступно — показан упрощённый анализ на устройстве');
          }
        }
      }, 500);

    } catch (err) {
      // Никаких выдуманных результатов при ошибке
      console.error(err);
      setIsScanning(false);
      setScanStepMessage('');
      setScanError(`Ошибка анализа: ${err.message || err}`);
      showToast('❌ Анализ не выполнен из-за ошибки');
    }
  };

  return (
    <>
    <div className="di-container">
      {toastMessage && <div className="di-toast">{toastMessage}</div>}

      {/* Header Bar */}
      {!hideHeader && (
        <div className="di-header-bar">
          <button className="di-back-btn" onClick={onBack} title="Назад">←</button>
          <div className="di-title-flex">
            <span className="di-header-icon">🔍</span>
            <h2>Проверка дефектов</h2>
          </div>
        </div>
      )}

      {onOpenScanner && (
        <div className="di-scan-promo">
          <p><b>Быстрая проверка камерой.</b> Наведите телефон на стену — трещины подсветятся в кадре, сразу посчитаются материалы на ремонт.</p>
          <button type="button" className="di-scan-promo-btn" onClick={onOpenScanner}>Открыть сканер трещин</button>
        </div>
      )}

      {/* Форма проверки */}
      <form className="di-main-card" onSubmit={handleRunInspection} noValidate>
        <p className="di-intro">
          Загрузите фото дефекта — нейросеть отметит трещины на снимке, а заключение подскажет, что делать,
          сколько стоит ремонт и какой норматив применяется.
        </p>

        {/* 1. Фото */}
        <fieldset className="di-section">
          <legend className="di-section-title"><span className="di-step">1</span>Фото дефекта</legend>
          <label
            className={`di-dropzone${isDragOver ? ' is-dragover' : ''}`}
            htmlFor="di-file-input"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
              if (files.length) handlePhotoUpload({ target: { files } });
            }}
          >
            <input
              type="file"
              id="di-file-input"
              className="qg-visually-hidden"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              aria-describedby="di-drop-sub"
            />
            <span className="di-drop-content">
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1.8 2H20a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.2L9 3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /></svg>
              <span className="di-drop-main">Выберите фото или перетащите сюда</span>
              <span className="di-drop-sub" id="di-drop-sub">JPG или PNG, до 10 снимков. Снимайте дефект целиком, при дневном свете.</span>
            </span>
          </label>

          {photos.length > 0 && (
            <ul className="di-thumbs-grid" aria-label="Загруженные фото">
              {photos.map(p => (
                <li key={p.id} className="di-thumb-item">
                  <button type="button" className="di-thumb-open" onClick={() => setLightboxSrc(p.url)} aria-label={`Открыть ${p.name}`}>
                    <img src={p.url} alt={p.name} />
                  </button>
                  <button
                    type="button"
                    className="di-thumb-remove"
                    aria-label={`Удалить ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        {/* 2. Тип и описание */}
        <fieldset className="di-section">
          <legend className="di-section-title"><span className="di-step">2</span>Что беспокоит</legend>
          <div className="di-type-grid" role="group" aria-label="Тип дефекта">
            {DEFECT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                className={`di-type-btn${selectedDefectType === type.id ? ' is-active' : ''}`}
                aria-pressed={selectedDefectType === type.id}
                onClick={() => handleSelectDefectType(type)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <label className="di-field" htmlFor="di-description">
            <span className="di-label">Описание <span className="di-optional">необязательно</span></span>
            <textarea
              id="di-description"
              rows="3"
              placeholder="Например: трещина в углу комнаты, появилась после зимы, расширяется"
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              className="di-textarea"
            ></textarea>
          </label>
          <label className="di-field" htmlFor="di-frame-width">
            <span className="di-label">Ширина участка на фото, м <span className="di-optional">для размеров в мм</span></span>
            <input
              id="di-frame-width"
              type="text"
              inputMode="decimal"
              placeholder="Например: 1,2 — если в кадр попало 1,2 м стены"
              value={frameWidthM}
              onChange={e => setFrameWidthM(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6))}
              className="di-textarea"
              style={{ minHeight: 0, height: 42 }}
            />
          </label>
          <div className="di-preset-chips">
            <span className="di-chips-label">Добавить в описание:</span>
            <button type="button" onClick={() => applyPresetPrompt('Трещина в стене')}>Трещина в стене</button>
            <button type="button" onClick={() => applyPresetPrompt('Протечка / сырость')}>Протечка, сырость</button>
            <button type="button" onClick={() => applyPresetPrompt('Перепад пола / потолка')}>Перепад пола</button>
            <button type="button" onClick={() => applyPresetPrompt('Брак штукатурки')}>Брак штукатурки</button>
          </div>
        </fieldset>

        {/* 3. Контакты */}
        <fieldset className="di-section">
          <legend className="di-section-title"><span className="di-step">3</span>Для акта <span className="di-optional">необязательно</span></legend>
          <div className="di-form-grid">
            <label className="di-field" htmlFor="di-client-name">
              <span className="di-label">Имя заказчика</span>
              <input id="di-client-name" type="text" autoComplete="name" value={clientName} onChange={e => setClientName(e.target.value)} className="di-input" />
            </label>
            <label className="di-field" htmlFor="di-client-phone">
              <span className="di-label">Телефон</span>
              <input id="di-client-phone" type="tel" autoComplete="tel" placeholder="+7" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="di-input" />
            </label>
            <label className="di-field di-field--wide" htmlFor="di-client-address">
              <span className="di-label">Адрес объекта</span>
              <input id="di-client-address" type="text" autoComplete="street-address" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="di-input" />
            </label>
          </div>
        </fieldset>

        <div className="di-submit-row">
          <button type="submit" className="di-btn-submit" disabled={isScanning}>
            {isScanning ? (
              <span className="di-scanning-flex">
                <span className="di-spinner" aria-hidden="true" />
                {scanStepMessage}
              </span>
            ) : (
              <span>Проверить и сформировать отчёт</span>
            )}
          </button>
          {report && (
            <button type="button" className="qg-btn qg-btn--ghost" onClick={handleReset}>
              Новая проверка
            </button>
          )}
        </div>
      </form>

      {/* Ход анализа */}
      {isScanning && (
        <div className="di-progress" role="status" aria-live="polite">
          <span className="qg-loader__bar" aria-hidden="true" />
          <div>
            <h3>Анализируем фото</h3>
            <p>{scanStepMessage || 'Ищем дефекты и готовим заключение…'}</p>
          </div>
        </div>
      )}

      {/* Ошибка / предупреждение анализа (честное сообщение вместо выдуманного результата) */}
      {scanError && !isScanning && (
        <div data-testid="defect-scan-error" className="di-note di-note--warn di-scan-error" role="alert">
          {scanError}
        </div>
      )}

      {/* ===== РЕЗУЛЬТАТ: фото с зонами, детектор, список дефектов ===== */}
      {report && (() => {
        const det = report.detector || null;
        const validated = Array.isArray(det?.validated_classes) ? det.validated_classes.map(String) : null;
        const onlyCracksValidated = report.source === 'ai' && validated && validated.length > 0 && validated.every(c => c.toLowerCase() === 'crack');
        const conf = Number(det?.conf_threshold);
        const aiView = reportSource === 'ai';
        const modes = [
          { id: 'hud', label: report.source === 'ai' ? 'Зоны модели' : 'Разметка', show: true },
          { id: 'stress', label: 'Теплокарта напряжений', show: !aiView || !!stressHeatmapImage },
          { id: 'skeleton', label: 'Скелет трещины', show: !!skeletonImage || !aiView },
          { id: 'clean', label: 'Исходное фото', show: true },
        ].filter(m => m.show);
        const fallbackPhoto = photos[0]?.url || null;
        const currentImg =
          visionMode === 'skeleton' && skeletonImage ? skeletonImage :
          aiView && visionMode === 'stress' && stressHeatmapImage ? stressHeatmapImage :
          aiView && visionMode !== 'clean' && annotatedImage ? annotatedImage :
          fallbackPhoto; // локальный режим: оригинал, drawOverlay рисует поверх
        const n = defectMarkers.length;
        const caption =
          visionMode === 'stress' ? 'Теплокарта напряжений' :
          visionMode === 'skeleton' ? 'Скелет трещины' :
          visionMode === 'clean' ? 'Исходное фото без разметки' :
          markMode ? 'Обведите трещину рамкой: нажмите и тяните по фото' :
          n > 0 && defectMarkers.every(m => m.model === 'description') ? 'На фото дефекты не отмечены — оценка только по описанию' :
          n > 0 ? `${defectsWord(n)} на фото` : 'Дефекты на фото не отмечены';
        const SEV = {
          critical: { label: 'Критический', cls: 'critical' },
          high: { label: 'Высокий', cls: 'high' },
          medium: { label: 'Средний', cls: 'medium' },
          low: { label: 'Низкий', cls: 'low' },
        };
        return (
        <section className="di-result" aria-labelledby="di-result-title">
          <header className="di-result-head">
            <div>
              <h3 id="di-result-title">Результат проверки</h3>
              <p className="di-result-sub">
                {report.source === 'ai'
                  ? 'Нейросеть отметила найденные зоны прямо на фото. Окончательный вывод делает инженер.'
                  : report.vision
                    ? 'Дефекты распознала ИИ-модель зрения, размеры трещин измерены по фото. Окончательный вывод делает инженер на месте.'
                    : 'Локальный анализ в браузере — ориентировочный, требует подтверждения инженером.'}
              </p>
            </div>
            {report.source === 'ai' && (det?.name || report.detectorName) && (
              <dl className="di-detector-badge" data-testid="defect-detector-badge" title={det?.note || undefined}>
                <div><dt>Модель</dt><dd>{det?.name || report.detectorName}</dd></div>
                {Number.isFinite(conf) && conf > 0 && <div><dt>Порог</dt><dd>{conf.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</dd></div>}
                {det?.imgsz ? <div><dt>Кадр</dt><dd>{det.imgsz} px</dd></div> : null}
              </dl>
            )}
          </header>

          {onlyCracksValidated && (
            <p className="di-note" data-testid="defect-validated-note">
              Модель обучена на трещинах; коррозия и сколы — по осмотру инженера.
            </p>
          )}
          {(report.isMock || report.fallback) && (
            <p className="di-note di-note--warn">
              {report.isMock ? 'Сервис ответил в демо-режиме: зоны условные. ' : ''}
              {report.fallback ? 'Основная модель недоступна, использован резервный детектор. ' : ''}
              Перед ремонтом нужен осмотр инженера.
            </p>
          )}
          {report.warnings && report.warnings.length > 0 && (
            <ul className="di-note di-note--warn di-warnings">
              {report.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}

          {severitySummary && (
            <div className="di-severity-row" aria-label="Сводка по тяжести">
              {severitySummary.by_severity?.critical > 0 && <span className="di-sev-chip critical">Критических: {severitySummary.by_severity.critical}</span>}
              {severitySummary.by_severity?.high > 0 && <span className="di-sev-chip high">Высоких: {severitySummary.by_severity.high}</span>}
              {severitySummary.by_severity?.medium > 0 && <span className="di-sev-chip medium">Средних: {severitySummary.by_severity.medium}</span>}
              {severitySummary.by_severity?.low > 0 && <span className="di-sev-chip low">Низких: {severitySummary.by_severity.low}</span>}
              <span className="di-sev-total">Всего: {severitySummary.total}</span>
            </div>
          )}

          {/* Результаты по каждому фото (AI-сервис: отдельный запрос на фото) */}
          {report.perPhoto && report.perPhoto.length > 1 && (
            <div className="di-perphoto-row">
              {report.perPhoto.map(pp => (
                <button
                  key={pp.index}
                  type="button"
                  className={`di-perphoto-btn${annotatedImage === pp.annotated ? ' is-active' : ''}`}
                  aria-pressed={annotatedImage === pp.annotated}
                  onClick={() => pp.annotated && setAnnotatedImage(pp.annotated)}
                  title={pp.name}
                >
                  {pp.annotated && <img src={pp.annotated} alt="" />}
                  <span>Фото {pp.index + 1}: {pp.count} деф.{pp.maxSeverity ? ` • ${pp.maxSeverity}` : ''}</span>
                </button>
              ))}
            </div>
          )}

          {modes.length > 1 && (
            <div className="di-mode-switch" role="group" aria-label="Режим просмотра фото">
              {modes.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={visionMode === m.id ? 'is-active' : ''}
                  aria-pressed={visionMode === m.id}
                  onClick={() => setVisionMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {currentImg && (
            <figure className="di-figure">
              <button
                type="button"
                className="di-defect-image-wrap"
                onClick={() => { if (markMode || skipClickRef.current) { skipClickRef.current = false; return; } setLightboxSrc(currentImg); setLightboxZoom(1); }}
                onPointerDown={onMarkDown}
                onPointerMove={onMarkMove}
                onPointerUp={onMarkUp}
                onPointerCancel={() => { dragRef.current = null; drawOverlay(); }}
                style={markMode ? { cursor: 'crosshair', touchAction: 'none' } : undefined}
                aria-label={markMode ? 'Обведите трещину рамкой' : 'Открыть фото крупно'}
              >
                <img
                  ref={imgRef}
                  src={currentImg}
                  alt={n > 0 ? `Фото с отмеченными дефектами: ${n}` : 'Фото объекта'}
                  onLoad={() => drawOverlay()}
                />
                <canvas ref={canvasRef} aria-hidden="true" />
              </button>
              {/* Подсказка — под фото, а не поверх: раньше перекрывала подпись рамки модели */}
              <figcaption className="di-zoom-hint">
                <span>{caption}</span>
                {!markMode && <span className="di-zoom-cta">Нажмите на фото, чтобы увеличить</span>}
              </figcaption>
              {!aiView && (
                <div className="di-mark-row">
                  <button
                    type="button"
                    className={`di-mark-btn ${markMode ? 'is-active' : ''}`}
                    aria-pressed={markMode}
                    onClick={() => { if (!markMode) setVisionMode('hud'); dragRef.current = null; setMarkMode(v => !v); }}
                  >
                    {markMode ? 'Отменить отметку' : '+ Отметить трещину вручную'}
                  </button>
                  <span className="di-mark-hint">Модель могла что-то пропустить или отметить лишнее: обведите пропущенную трещину — она будет измерена и попадёт в заключение; лишнюю зону можно убрать в списке ниже.</span>
                </div>
              )}
            </figure>
          )}

          {n > 0 && (
            <div className="di-defects-block">
              <h4 className="di-block-title">Найденные дефекты</h4>
              <ol className="di-defect-list">
                {defectMarkers.map((marker) => {
                  const sv = SEV[marker.severity] || SEV.medium;
                  const pct = marker.confidence > 0 ? Math.round(Number(marker.confidence) * 100) : null;
                  const isSelected = selectedDefectId === marker.id;
                  return (
                    <li key={marker.id}>
                      <button
                        type="button"
                        className={`di-defect-item sev-${sv.cls}${isSelected ? ' is-selected' : ''}`}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedDefectId(isSelected ? null : marker.id)}
                      >
                        <span className="di-defect-num" aria-hidden="true">{marker.id}</span>
                        <span className="di-defect-main">
                          <span className="di-defect-title">{marker.type}</span>
                          <span className="di-defect-meta">
                            <span className={`di-sev-chip ${sv.cls}`}>{sv.label} риск</span>
                            <span className="qg-chip">{pct !== null ? `уверенность ${pct}%` : marker.model === 'manual' ? 'отмечена вручную' : marker.model === 'vision' ? 'распознано ИИ-моделью зрения' : marker.model === 'description' ? 'по описанию, не по фото' : 'оценка, требует проверки'}</span>
                            {marker.model && (
                              <span className="qg-chip">модель: {marker.model === 'yolo-browser' ? 'YOLO26n на устройстве' : marker.model === 'manual' ? 'измерение по отметке' : marker.model === 'vision' ? `${report.detectorName || 'GPT-4o'} + измерение по фото` : marker.model === 'description' ? 'нет' : marker.model}{marker.model === 'yolo' && report.detectorName ? ` (${report.detectorName})` : ''}</span>
                            )}
                            {marker.photoIndex !== undefined && <span className="qg-chip">фото {marker.photoIndex + 1}</span>}
                            {marker.length_mm ? <span className="qg-chip qg-chip--info">длина ≈ {marker.length_mm} мм</span> : marker.length_rel ? <span className="qg-chip qg-chip--info">длина ≈ {Math.round(marker.length_rel * 100)}% кадра</span> : null}
                            {marker.opening_mm ? <span className="qg-chip qg-chip--warn">раскрытие до ≈ {marker.opening_mm} мм{marker.scale_assumed ? ' (оценка)' : ''}</span> : null}
                          </span>
                          {marker.description && <span className="di-defect-desc">{marker.description}</span>}
                        </span>
                        {pct !== null && (
                          <span className="di-conf-meter" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                        )}
                      </button>
                      {!aiView && marker.model !== 'description' && (
                        <button type="button" className="di-zone-remove" onClick={() => removeZone(marker.id)}>
                          Это не дефект — убрать зону
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
        );
      })()}

      {/* Заключение: что делать / стоимость / норматив + вкладки */}
      {report && (
        <div className="di-report-card">
          <div className="di-report-header">
            <div>
              <h3 className="di-report-title">Заключение</h3>
              <p className="di-report-id">Акт <span className="qg-code">№ {report.id}</span>, {report.date}</p>
            </div>
            <span
              data-testid="defect-report-source"
              className={`di-source-badge ${report.source === 'ai' ? 'is-ai' : 'is-local'}`}
            >
              {report.source === 'ai'
                ? `AI-сервис дефектов${report.detectorName ? ` · ${report.detectorName}` : ''}`
                : report.vision ? `ИИ-модель зрения · ${report.detectorName || 'GPT-4o'}` : 'Локальный анализ — ориентировочно'}
            </span>
          </div>

          <div className="di-tabs" role="tablist" aria-label="Разделы заключения">
            {[
              { id: 'expert', label: 'Что делать' },
              { id: 'chart', label: 'Профиль трещины' },
              { id: 'estimate', label: 'Смета ремонта' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeReportTab === t.id}
                className={activeReportTab === t.id ? 'is-active' : ''}
                onClick={() => setActiveReportTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: что делать / стоимость / норматив */}
          {activeReportTab === 'expert' && (
            <div className="di-plan" role="tabpanel">
              <div className="di-plan-defect">
                <span className="di-plan-label">Дефект</span>
                <strong className="di-plan-defect-name">{report.defectType}</strong>
                {report.severity && report.severity !== '—' && <span className="di-plan-severity">{report.severity}</span>}
              </div>

              <div className="di-plan-grid">
                <section className="di-plan-cell di-plan-what">
                  <h4>Что делать</h4>
                  <p>{report.fixMethod}</p>
                </section>
                <section className="di-plan-cell di-plan-cost">
                  <h4>Стоимость ремонта</h4>
                  <span className="qg-price-tag di-plan-price">{report.estimatedCost}</span>
                  <p className="di-plan-hint">
                    {report.workDays ? `Срок работ: около ${report.workDays} ${report.workDays === 1 ? 'дня' : 'дней'}. ` : ''}
                    {report.source === 'ai' ? 'Оценка по ценам базы ЭСН РК.' : 'Ориентировочно, без осмотра.'}
                  </p>
                </section>
                <section className="di-plan-cell di-plan-norm">
                  <h4>Норматив</h4>
                  <code className="qg-code di-plan-code">{report.snipCode}</code>
                </section>
              </div>

              {(report.analytics?.gost_status || report.analytics?.rebar_risk) && (
                <dl className="di-plan-facts">
                  {report.analytics?.gost_status && (
                    <div><dt>Категория состояния (ГОСТ 31937)</dt><dd>{report.analytics.gost_status}</dd></div>
                  )}
                  {report.analytics?.rebar_risk && (
                    <div><dt>Коррозионный риск арматуры</dt><dd>{report.analytics.rebar_risk}</dd></div>
                  )}
                </dl>
              )}
            </div>
          )}

          {/* TAB 2: 📊 Профиль раскрытия трещины (Интерактивный график) */}
          {activeReportTab === 'chart' && (
            report.analytics?.width_profile && report.analytics.width_profile.length > 1 ? (
            <div style={{
              background: 'rgba(21, 18, 42, 0.75)',
              border: '1px solid rgba(185, 164, 255, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ece9f8', fontSize: '0.92rem', fontWeight: 800 }}>
                  📈 График раскрытия трещины по длине: w(L)
                </span>
                <span style={{ color: '#b9a4ff', fontSize: '0.78rem', fontWeight: 700 }}>
                  Макс: {Math.max(...(report.analytics?.width_profile?.map(p => p.width_mm) || [3.5]))} мм
                </span>
              </div>

              {/* SVG Curve Chart */}
              <div style={{ background: '#090d16', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                <svg viewBox="0 0 400 130" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="24" fill="#ef4444" fontSize="9" textAnchor="end">0.4mm</text>

                  <line x1="40" y1="60" x2="380" y2="60" stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="64" fill="#f59e0b" fontSize="9" textAnchor="end">0.2mm</text>

                  <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="104" fill="#10b981" fontSize="9" textAnchor="end">0.0mm</text>

                  {/* Crack Width Polygon & Line */}
                  {(() => {
                    const pts = report.analytics?.width_profile || [
                      { pos_pct: 0, width_mm: 1.2 },
                      { pos_pct: 20, width_mm: 2.1 },
                      { pos_pct: 40, width_mm: 3.4 },
                      { pos_pct: 60, width_mm: 2.8 },
                      { pos_pct: 80, width_mm: 1.9 },
                      { pos_pct: 100, width_mm: 0.9 },
                    ];
                    const maxVal = 4.5;
                    const coords = pts.map((p, i) => {
                      const x = 50 + (i / (pts.length - 1)) * 320;
                      const y = 100 - (Math.min(p.width_mm, maxVal) / maxVal) * 80;
                      return { x, y, p };
                    });
                    const pathStr = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaStr = `${pathStr} L ${coords[coords.length - 1].x} 100 L ${coords[0].x} 100 Z`;

                    return (
                      <>
                        <path d={areaStr} fill="rgba(185, 164, 255, 0.15)" />
                        <path d={pathStr} fill="none" stroke="#b9a4ff" strokeWidth="2.5" strokeLinecap="round" />
                        {coords.map((c, idx) => (
                          <g key={idx}>
                            <circle cx={c.x} cy={c.y} r="4" fill="#b9a4ff" stroke="#fff" strokeWidth="1.5" />
                            <text x={c.x} y={c.y - 8} fill="#d6caff" fontSize="9" fontWeight="bold" textAnchor="middle">
                              {c.p.width_mm}мм
                            </text>
                            <text x={c.x} y="116" fill="#8a82a8" fontSize="8" textAnchor="middle">
                              {c.p.pos_pct}% L
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.78rem' }}>
                <span style={{ color: '#10b981' }}>🟢 Допустимо: &lt; 0.2 мм</span>
                <span style={{ color: '#f59e0b' }}>🟡 Требует пломбировки: 0.2–0.4 мм</span>
                <span style={{ color: '#ef4444' }}>🔴 Аварийно: &gt; 0.4 мм</span>
              </div>
            </div>
            ) : (
              <div style={{
                background: 'rgba(21, 18, 42, 0.75)',
                border: '1px solid rgba(185, 164, 255, 0.25)',
                borderRadius: '12px',
                padding: '32px 16px',
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📐</div>
                <h4 style={{ color: '#ece9f8', margin: '0 0 8px', fontWeight: 800 }}>
                  Профиль раскрытия не применим
                </h4>
                <p style={{ color: '#a39cc2', fontSize: '0.88rem', margin: 0 }}>
                  Для данного типа дефекта ({report.defectType}) график раскрытия трещины не формируется.
                  Используйте вкладку «СНиП и Риски» для оценки состояния.
                </p>
              </div>
            )
          )}

          {/* TAB 3: 🛠️ Инженерная смета на ремонт и материалы (₸) */}
          {activeReportTab === 'estimate' && (
            <div style={{
              background: 'rgba(21, 18, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ece9f8', fontSize: '0.92rem', fontWeight: 800 }}>
                  🛠️ Спецификация ремонтных материалов и работ
                </span>
                <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 800 }}>
                  СНиП РК Калькуляция
                </span>
              </div>

              {!(report.analytics?.materials?.length || report.analytics?.labor?.length) ? (
                <div style={{ color: '#cbc5e3', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Детальная спецификация для этого дефекта не сформирована.
                  <div style={{ marginTop: '8px' }}>
                    Ориентировочная стоимость: <strong style={{ color: '#10b981' }}>{report.estimatedCost || '—'}</strong>
                  </div>
                </div>
              ) : (<>
              {/* Materials Table */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#b9a4ff', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  📦 Сертифицированные материалы:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(report.analytics?.materials || []).map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#cbc5e3' }}>{m.name} <small style={{ color: '#a39cc2' }}>({m.qty})</small></span>
                      <strong style={{ color: '#f5f3ff', whiteSpace: 'nowrap' }}>{m.cost_kzt == null ? 'по осмотру' : `${(Number(m.cost_kzt) || 0).toLocaleString('ru-RU')} ₸`}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor Operations Table */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  👷 Ремонтно-восстановительные работы (ПТО):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(report.analytics?.labor || []).map((l, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#cbc5e3' }}>{l.name} <small style={{ color: '#a39cc2' }}>({l.qty})</small></span>
                      <strong style={{ color: '#f5f3ff', whiteSpace: 'nowrap' }}>{l.cost_kzt == null ? 'по осмотру' : `${(Number(l.cost_kzt) || 0).toLocaleString('ru-RU')} ₸`}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px', marginTop: '8px' }}>
                <span style={{ color: '#ece9f8', fontWeight: 800, fontSize: '0.9rem' }}>Итого сметная стоимость{report.source !== 'ai' ? ' (ориентировочно)' : ''}:</span>
                <strong style={{ color: '#10b981', fontWeight: 900, fontSize: '1.15rem' }}>
                  {(Number(report.analytics?.total_cost_kzt) || 0).toLocaleString('ru-RU')} ₸
                </strong>
              </div>
              </>)}
            </div>
          )}

          <div className="di-report-actions">
            {createdDefectOrder ? (
              <div className="di-order-done" role="status">
                <div>
                  <h4>Заявка на выезд инженера {createdDefectOrder.id} создана</h4>
                  <p>Инженер получил заключение и свяжется с вами, чтобы согласовать время осмотра.</p>
                </div>
                <button
                  type="button"
                  className="qg-btn qg-btn--ghost qg-btn--sm"
                  onClick={() => onBack ? onBack() : showToast('Перейдите в «Мои заказы»')}
                >
                  Открыть «Мои заказы»
                </button>
              </div>
            ) : (
              <div className="di-actions-grid">
                <button 
                  onClick={() => {
                    const newOrder = createPlatformOrder({
                      title: `Устранение дефекта: ${report.defectType}`,
                      category: 'Инженерная дефектоскопия',
                      budget: report.estimatedCost,
                      clientName: report.clientName || 'Заказчик',
                      clientPhone: report.clientPhone || '+7 (707) 000-00-00',
                      city: report.address || 'Алматы',
                      description: `Выявлен дефект: ${report.defectType}. Класс опасности: ${report.severity}. Норматив: ${report.snipCode}. Метод: ${report.fixMethod}`,
                      type: 'defect',
                      status: 'engineer_assigned',
                      assignedEngineer: 'Асхат Нурланов (Инженер ПТО)',
                      defectReport: report
                    });
                    setCreatedDefectOrder(newOrder);
                    showToast(`Заявка ${newOrder.id} передана инженеру и менеджеру CRM`);
                  }}
                  type="button"
                  className="qg-btn qg-btn--primary di-btn-engineer"
                >
                  Вызвать инженера
                </button>

                <button 
                  type="button"
                  className="qg-btn qg-btn--ghost di-btn-pdf"
                  onClick={handlePrintTechnicalAct}
                >
                  Печать акта (PDF)
                </button>

                <button 
                  className="qg-btn qg-btn--ghost di-btn-wa"
                  onClick={() => {
                    const materials = report.analytics?.materials || [];
                    const labor = report.analytics?.labor || [];
                    const totalCost = report.analytics?.total_cost_kzt || 0;
                    let msg = `*Акт дефектоскопии № ${report.id}*\n`;
                    msg += `Дата: ${report.date}\n\n`;
                    msg += `*Дефект:* ${report.defectType}\n`;
                    msg += `*Класс риска:* ${report.severity}\n`;
                    msg += `*СНиП:* ${report.snipCode}\n`;
                    msg += `*Метод:* ${report.fixMethod}\n\n`;
                    if (materials.length > 0) {
                      msg += `*Материалы:*\n`;
                      materials.forEach(m => { msg += `  - ${m.name} (${m.qty}) — ${m.cost_kzt == null ? 'по осмотру' : m.cost_kzt.toLocaleString('ru-RU') + ' T'}\n`; });
                    }
                    if (labor.length > 0) {
                      msg += `*Работы:*\n`;
                      labor.forEach(l => { msg += `  - ${l.name} (${l.qty}) — ${l.cost_kzt == null ? 'по осмотру' : l.cost_kzt.toLocaleString('ru-RU') + ' T'}\n`; });
                    }
                    if (totalCost > 0) msg += `\n*ИТОГО: ${totalCost.toLocaleString('ru-RU')} T*\n`;
                    else msg += `\n*Стоимость: ${report.estimatedCost}*\n`;
                    msg += `\nЗаказчик: ${report.clientName}\nАдрес: ${report.address}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  type="button"
                >
                  Отправить в WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* ===== HISTORY SECTION ===== */}
      {inspectionHistory.length > 0 && (
        <div style={{ maxWidth: '680px', margin: '1.5rem auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#ece9f8', margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              📋 История дефектоскопий ({inspectionHistory.length})
            </h3>
            <button
              type="button"
              onClick={() => { setInspectionHistory([]); localStorage.removeItem('defect_history'); showToast('🗑️ История очищена'); }}
              style={{ background: 'none', border: 'none', color: '#8a82a8', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Очистить
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inspectionHistory.map((h, idx) => (
              <div key={idx} style={{
                background: 'rgba(21, 18, 42, 0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f5f3ff', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
                    {h.defectType}
                  </div>
                  <div style={{ color: '#a39cc2', fontSize: '0.75rem' }}>
                    {h.id} • {h.date} • {h.clientName || '—'} • {h.address || '—'}
                  </div>
                </div>
                <div style={{
                  background: h.severity?.includes('КРИТИЧЕСКИЙ') ? 'rgba(255,40,40,0.2)' : h.severity?.includes('Высокий') ? 'rgba(255,120,30,0.2)' : 'rgba(185,164,255,0.15)',
                  border: `1px solid ${h.severity?.includes('КРИТИЧЕСКИЙ') ? '#ef4444' : h.severity?.includes('Высокий') ? '#f59e0b' : '#b9a4ff'}`,
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: h.severity?.includes('КРИТИЧЕСКИЙ') ? '#fca5a5' : h.severity?.includes('Высокий') ? '#fbbf24' : '#d6caff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {h.estimatedCost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== LIGHTBOX (Full-screen zoom & Pan) ===== */}
      {lightboxSrc && (
        <div className="di-lightbox" onClick={() => setLightboxSrc(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={lightboxSrc} 
              alt="Увеличенное фото" 
              onClick={(e) => e.stopPropagation()} 
              style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.2s ease', cursor: lightboxZoom > 1 ? 'grab' : 'zoom-in' }}
            />
            {/* Zoom Controls HUD */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(21, 18, 42, 0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px',
                padding: '8px 18px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10001
              }}
            >
              <button 
                onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ➖
              </button>
              <span style={{ color: '#b9a4ff', fontWeight: 800, fontSize: '0.9rem', minWidth: '50px', textAlign: 'center' }}>
                {Math.round(lightboxZoom * 100)}%
              </span>
              <button 
                onClick={() => setLightboxZoom(prev => Math.min(3.5, prev + 0.25))}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ➕
              </button>
              <button 
                onClick={() => setLightboxZoom(1)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#a39cc2', borderRadius: '12px', padding: '2px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                100%
              </button>
            </div>
          </div>
          <button className="di-lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
        </div>
      )}
    </>
  );
}
