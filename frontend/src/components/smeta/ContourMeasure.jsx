import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { polyStats, homography, applyH, homW, isConvexQuad, fitSideScale } from './measureGeom';

// Обмер помещения: контур на сетке с заданным масштабом, контур на фото плана
// с калибровкой по эталону (линия известной длины или прямоугольник известного
// размера — он же исправляет перспективу), или размеры вручную. Отдаёт площадь
// и периметр в метрах. После замыкания контура масштаб комнаты можно уточнить
// по реальным длинам сторон (размерам, подписанным на плане).

const W = 800;
const H = 480;
const CELL = 40; // px в одной клетке сетки
const CELL_OPTIONS = [0.25, 0.5, 1, 2, 5];

const r2 = (v) => Math.round(v * 100) / 100;
const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const mStr = (v) => r2(v).toLocaleString('ru-RU');

function segIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function selfIntersects(pts) {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      if (segIntersect(a, b, pts[j], pts[(j + 1) % n])) return true;
    }
  }
  return false;
}

export default function ContourMeasure({ photos = [], geo, setGeo, showToast }) {
  const canvasRef = useRef(null);
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem('qazgost_measure_tab') || 'grid'; } catch { return 'grid'; }
  });
  const [cellM, setCellM] = useState(0.5);
  const [snap, setSnap] = useState(true);
  const [points, setPointsState] = useState([]);
  const [closed, setClosedState] = useState(false);
  // ref нужен для быстрых кликов: два клика до перерисовки не должны терять точку
  const pointsRef = useRef([]);
  const closedRef = useRef(false);
  const [sideFix, setSideFix] = useState({}); // номер стороны → реальная длина, м (строка из поля)
  const setPoints = useCallback((v) => {
    const next = typeof v === 'function' ? v(pointsRef.current) : v;
    pointsRef.current = next;
    setPointsState(next);
    setSideFix({});
  }, []);
  const setClosed = useCallback((v) => {
    closedRef.current = v;
    setClosedState(v);
  }, []);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [calibMode, setCalibModeState] = useState(() => {
    try { return localStorage.getItem('qazgost_measure_calib') === 'rect' ? 'rect' : 'line'; } catch { return 'line'; }
  });
  const [calibrating, setCalibrating] = useState(false);
  const [refPts, setRefPts] = useState([]);
  const refPtsRef = useRef([]);
  const [refMeters, setRefMeters] = useState('0.9');
  const [rectA, setRectA] = useState('0.6');
  const [rectB, setRectB] = useState('0.6');
  const [manual, setManual] = useState({ kind: 'rect', len: '', wid: '', area: '', per: '' });
  const [hover, setHover] = useState(null);

  const setRef = (pts) => { refPtsRef.current = pts; setRefPts(pts); };
  const resetContour = () => { setPoints([]); setClosed(false); };

  const pickTab = (t) => {
    setTab(t);
    resetContour();
    setCalibrating(false);
    setGeo((g) => ({ ...g, area: 0, perimeter: 0, source: '' }));
    try { localStorage.setItem('qazgost_measure_tab', t); } catch { /* приватный режим */ }
  };

  const pickCalibMode = (m) => {
    if (m === calibMode) return;
    setCalibModeState(m);
    setRef([]);
    setCalibrating(false);
    resetContour();
    try { localStorage.setItem('qazgost_measure_calib', m); } catch { /* приватный режим */ }
  };

  // ---- Калибровка: точка холста → метры ----
  const refLenPx = calibMode === 'line' && refPts.length === 2 ? Math.hypot(refPts[1].x - refPts[0].x, refPts[1].y - refPts[0].y) : 0;
  const mpp = tab === 'grid'
    ? cellM / CELL
    : (calibMode === 'line' && refLenPx > 0 && num(refMeters) > 0 ? num(refMeters) / refLenPx : 0);
  const rA = num(rectA);
  const rB = num(rectB);
  const Hm = useMemo(() => {
    if (tab !== 'photo' || calibMode !== 'rect' || refPts.length !== 4 || !(rA > 0) || !(rB > 0) || !isConvexQuad(refPts)) return null;
    return homography(refPts, [{ x: 0, y: 0 }, { x: rA, y: 0 }, { x: rA, y: rB }, { x: 0, y: rB }]);
  }, [tab, calibMode, refPts, rA, rB]);
  const calibrated = tab === 'grid' || (tab === 'photo' && (calibMode === 'line' ? mpp > 0 : !!Hm));
  const toM = useCallback((p) => (tab === 'photo' && calibMode === 'rect'
    ? applyH(Hm, p)
    : { x: p.x * mpp, y: p.y * mpp }), [tab, calibMode, Hm, mpp]);
  // точка по ту же сторону «горизонта», что и эталон (иначе проекция теряет смысл)
  const horizonSign = Hm ? Math.sign(homW(Hm, refPts[0])) : 0;
  const beyondHorizon = (p) => !!Hm && Math.sign(homW(Hm, p)) !== horizonSign;

  // контур в метрах по калибровке (до уточнения по сторонам)
  const rawM = useMemo(() => (calibrated && points.length ? points.map(toM) : []), [calibrated, points, toM]);
  const sideVecs = useMemo(() => rawM.map((a, i) => {
    const b = rawM[(i + 1) % rawM.length];
    return { x: b.x - a.x, y: b.y - a.y };
  }), [rawM]);
  const fit = useMemo(() => {
    if (tab !== 'photo' || !closed) return null;
    const fixes = Object.entries(sideFix).map(([i, v]) => ({ i: Number(i), len: num(v) })).filter((f) => f.len > 0 && f.i < sideVecs.length);
    return fitSideScale(sideVecs, fixes);
  }, [tab, closed, sideFix, sideVecs]);
  const finalM = useMemo(() => (fit ? rawM.map((p) => ({ x: p.x * fit.sx, y: p.y * fit.sy })) : rawM), [rawM, fit]);
  const sideLen = (i) => {
    const v = sideVecs[i];
    return v ? Math.hypot(v.x * (fit ? fit.sx : 1), v.y * (fit ? fit.sy : 1)) : 0;
  };

  // Итог контура → геометрия
  useEffect(() => {
    if (tab === 'manual') return;
    if (!closed || points.length < 3 || !calibrated) {
      if (geo.source === 'contour') setGeo((g) => ({ ...g, area: 0, perimeter: 0, source: '' }));
      return;
    }
    const { area, perimeter } = polyStats(finalM);
    setGeo((g) => ({ ...g, area: r2(area), perimeter: r2(perimeter), source: 'contour' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed, points, calibrated, finalM, tab]);

  // Ручной ввод → геометрия
  useEffect(() => {
    if (tab !== 'manual') return;
    let area = 0;
    let perimeter = 0;
    if (manual.kind === 'rect') {
      const l = num(manual.len);
      const w = num(manual.wid);
      if (l > 0 && w > 0) { area = r2(l * w); perimeter = r2(2 * (l + w)); }
    } else {
      area = r2(num(manual.area));
      perimeter = r2(num(manual.per));
    }
    setGeo((g) => ({ ...g, area, perimeter, source: area > 0 && perimeter > 0 ? 'manual' : '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, tab]);

  const toCanvas = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) * W) / rect.width;
    let y = ((e.clientY - rect.top) * H) / rect.height;
    if (tab === 'grid' && snap) {
      x = Math.round(x / CELL) * CELL;
      y = Math.round(y / CELL) * CELL;
    }
    return { x: Math.max(0, Math.min(W, x)), y: Math.max(0, Math.min(H, y)) };
  };

  const needCalibMsg = calibMode === 'rect'
    ? 'Сначала задайте масштаб: нажмите «Отметить 4 угла» и кликните по углам прямоугольника известного размера'
    : 'Сначала задайте масштаб: нажмите «Отметить эталон» и проведите линию по предмету известной длины';

  const closeContour = useCallback(() => {
    const pts = pointsRef.current;
    if (pts.length < 3) {
      showToast?.('Нужно минимум 3 точки, чтобы замкнуть контур');
      return;
    }
    if (selfIntersects(pts)) {
      showToast?.('Стороны контура пересекаются — уберите лишнюю точку кнопкой «Отменить точку»');
      return;
    }
    if (!calibrated) {
      showToast?.(needCalibMsg);
      return;
    }
    setClosed(true);
  }, [calibrated, needCalibMsg, showToast, setClosed]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const p = toCanvas(e);
    if (calibrating) {
      if (calibMode === 'rect') {
        const next = [...refPtsRef.current, p].slice(0, 4);
        setRef(next);
        if (next.length === 4) {
          setCalibrating(false);
          if (!isConvexQuad(next)) {
            setRef([]);
            showToast?.('Углы отмечены не по кругу или три угла на одной линии — отметьте 4 угла заново, обходя прямоугольник по краю');
            return;
          }
          showToast?.('Прямоугольник отмечен — проверьте его размеры: первое число — сторона от 1-го угла ко 2-му');
        }
        return;
      }
      const next = [...refPtsRef.current, p].slice(-2);
      setRef(next);
      if (next.length === 2) {
        setCalibrating(false);
        showToast?.('Эталон отмечен — укажите его реальную длину в метрах');
      }
      return;
    }
    if (tab === 'photo' && !calibrated) {
      showToast?.(needCalibMsg);
      return;
    }
    if (closedRef.current) {
      showToast?.('Контур замкнут. Чтобы начать заново, нажмите «Очистить»');
      return;
    }
    if (beyondHorizon(p)) {
      showToast?.('Эта точка за линией горизонта прямоугольника-эталона — её нельзя пересчитать в метры. Отмечайте только пол той же плоскости');
      return;
    }
    const pts = pointsRef.current;
    if (pts.length >= 3) {
      const p0 = pts[0];
      if (Math.hypot(p.x - p0.x, p.y - p0.y) < 18 * Math.min(2.2, Math.max(1, W / (canvasRef.current?.clientWidth || W)))) {
        closeContour();
        return;
      }
    }
    const last = pts[pts.length - 1];
    if (last && last.x === p.x && last.y === p.y) return;
    setPoints([...pts, p]);
  };

  const onPointerMove = (e) => {
    if (closed || tab === 'manual') { if (hover) setHover(null); return; }
    setHover(toCanvas(e));
  };

  // Рисование
  useEffect(() => {
    if (tab === 'manual') return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let cancelled = false;

    // на узком экране холст уменьшен — подписи и точки увеличиваем, чтобы читались
    const k = Math.min(2.2, Math.max(1, W / (c.clientWidth || W)));
    const tag = (label, x, y, bg = 'rgba(11,15,25,0.85)', fg = '#e9e4ff') => {
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = bg;
      ctx.fillRect(x - tw / 2 - 4, y - 9 * k, tw + 8, 18 * k);
      ctx.fillStyle = fg;
      ctx.fillText(label, x - tw / 2, y + 4 * k);
    };
    const draw = (img) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, W, H);
      if (img) {
        const s = Math.min(W / img.width, H / img.height);
        const dw = img.width * s;
        const dh = img.height * s;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.fillStyle = 'rgba(11,15,25,0.25)';
        ctx.fillRect(0, 0, W, H);
      }
      if (tab === 'grid') {
        for (let i = 0; i <= W / CELL; i++) {
          const x = i * CELL;
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(185,164,255,0.18)' : 'rgba(185,164,255,0.07)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
        }
        for (let j = 0; j <= H / CELL; j++) {
          const y = j * CELL;
          ctx.strokeStyle = j % 2 === 0 ? 'rgba(185,164,255,0.18)' : 'rgba(185,164,255,0.07)';
          ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(203,197,227,0.65)';
        ctx.font = `${Math.round(11 * k)}px Inter, sans-serif`;
        for (let i = 2; i < W / CELL; i += 2) ctx.fillText(`${mStr(i * cellM)} м`, i * CELL + 3, Math.round(12 * k));
        for (let j = 2; j < H / CELL; j += 2) ctx.fillText(`${mStr(j * cellM)} м`, 3, j * CELL - 3);
      }

      // эталон на фото: линия или прямоугольник
      if (tab === 'photo' && refPts.length) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(refPts[0].x, refPts[0].y);
        refPts.slice(1).forEach((q) => ctx.lineTo(q.x, q.y));
        if (calibMode === 'rect' && refPts.length === 4) ctx.closePath();
        else if (calibMode === 'rect' && calibrating && hover) ctx.lineTo(hover.x, hover.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `bold ${Math.round(12 * k)}px Inter, sans-serif`;
        refPts.forEach((q, i) => {
          ctx.beginPath(); ctx.arc(q.x, q.y, 5 * k, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill();
          if (calibMode === 'rect') tag(String(i + 1), q.x + 12 * k, q.y - 10 * k, '#fbbf24', '#1a1033');
        });
        if (calibMode === 'line' && refPts[1] && num(refMeters) > 0) {
          tag(`эталон ${mStr(num(refMeters))} м`, (refPts[0].x + refPts[1].x) / 2, (refPts[0].y + refPts[1].y) / 2 - 14 * k, 'rgba(11,15,25,0.85)', '#fde68a');
        }
        if (calibMode === 'rect' && refPts.length === 4 && rA > 0 && rB > 0) {
          const m01 = { x: (refPts[0].x + refPts[1].x) / 2, y: (refPts[0].y + refPts[1].y) / 2 };
          const m12 = { x: (refPts[1].x + refPts[2].x) / 2, y: (refPts[1].y + refPts[2].y) / 2 };
          tag(`${mStr(rA)} м`, m01.x, m01.y, 'rgba(11,15,25,0.85)', '#fde68a');
          tag(`${mStr(rB)} м`, m12.x, m12.y, 'rgba(11,15,25,0.85)', '#fde68a');
        }
      }

      if (points.length) {
        const path = [...points];
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.slice(1).forEach((q) => ctx.lineTo(q.x, q.y));
        if (closed) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(16,185,129,0.18)';
          ctx.fill();
        } else if (hover && !calibrating) {
          ctx.lineTo(hover.x, hover.y);
        }
        ctx.strokeStyle = closed ? '#10b981' : '#b9a4ff';
        ctx.lineWidth = 2.5 * k;
        ctx.stroke();

        // длины сторон (с номерами — по ним уточняют масштаб)
        if (calibrated) {
          ctx.font = `bold ${Math.round(12 * k)}px Inter, sans-serif`;
          const n = closed ? path.length : path.length - 1;
          for (let i = 0; i < n; i++) {
            const a = path[i];
            const b = path[(i + 1) % path.length];
            const fixed = closed && num(sideFix[i]) > 0;
            const label = `${tab === 'photo' && closed ? `${i + 1}: ` : ''}${mStr(sideLen(i))} м`;
            tag(label, (a.x + b.x) / 2, (a.y + b.y) / 2, fixed ? 'rgba(4,120,87,0.92)' : 'rgba(11,15,25,0.85)');
          }
        }
        points.forEach((q, i) => {
          ctx.beginPath();
          ctx.arc(q.x, q.y, (i === 0 && !closed && points.length >= 3 ? 8 : 5) * k, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? '#fbbf24' : '#b9a4ff';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }
    };

    const photo = photos[photoIdx];
    if (tab === 'photo' && photo?.url) {
      const img = new Image();
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = photo.url;
    } else {
      draw(null);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, points, closed, hover, cellM, refPts, refMeters, rA, rB, calibMode, calibrating, calibrated, sideVecs, fit, sideFix, photos, photoIdx]);

  const wallArea = Math.max(0, geo.perimeter * geo.height - geo.doors * 0.9 * 2.1 - geo.windows * 1.5 * 1.5);
  const setG = (k, v) => setGeo((g) => ({ ...g, [k]: v }));

  return (
    <div className="sm-measure">
      <div className="sm-tabs" role="tablist" aria-label="Способ обмера">
        {[
          ['grid', 'Контур на сетке', 'масштаб клетки задаёте вы'],
          ['photo', 'Контур на плане', 'фото плана + эталон длины'],
          ['manual', 'Размеры вручную', 'длина × ширина или площадь'],
        ].map(([id, title, sub]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={`sm-tab ${tab === id ? 'is-on' : ''}`} onClick={() => pickTab(id)}>
            <strong>{title}</strong><small>{sub}</small>
          </button>
        ))}
      </div>

      {tab !== 'manual' && (
        <>
          <div className="sm-toolbar">
            {tab === 'grid' ? (
              <>
                <label className="sm-field-inline">
                  <span>1 клетка =</span>
                  <select value={cellM} onChange={(e) => setCellM(parseFloat(e.target.value))} aria-label="Размер клетки сетки">
                    {CELL_OPTIONS.map((v) => <option key={v} value={v}>{mStr(v)} м</option>)}
                  </select>
                </label>
                <span className="sm-hint">поле {mStr((W / CELL) * cellM)} × {mStr((H / CELL) * cellM)} м</span>
                <label className="sm-check">
                  <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
                  привязка к сетке
                </label>
              </>
            ) : (
              <>
                {photos.length > 1 && (
                  <select value={photoIdx} onChange={(e) => { setPhotoIdx(Number(e.target.value)); resetContour(); setRef([]); }} aria-label="Фото для обмера">
                    {photos.map((p, i) => <option key={p.id} value={i}>Фото {i + 1}</option>)}
                  </select>
                )}
                <div className="sm-seg sm-seg-sm" role="radiogroup" aria-label="Эталон масштаба">
                  <button type="button" role="radio" aria-checked={calibMode === 'line'} className={calibMode === 'line' ? 'is-on' : ''}
                    onClick={() => pickCalibMode('line')}>Линия</button>
                  <button type="button" role="radio" aria-checked={calibMode === 'rect'} className={calibMode === 'rect' ? 'is-on' : ''}
                    onClick={() => pickCalibMode('rect')} data-testid="calib-rect">Прямоугольник (фото под углом)</button>
                </div>
                {calibMode === 'line' ? (
                  <>
                    <button type="button" className={`sm-btn ${calibrating ? 'is-on' : ''}`}
                      disabled={!photos.length}
                      onClick={() => { setCalibrating(true); setRef([]); resetContour(); }}>
                      {refPts.length === 2 ? 'Перемерить эталон' : 'Отметить эталон'}
                    </button>
                    <label className="sm-field-inline">
                      <span>длина эталона</span>
                      <input type="number" min="0.05" step="0.01" value={refMeters} onChange={(e) => setRefMeters(e.target.value)} aria-label="Длина эталона в метрах" />
                      <span>м</span>
                    </label>
                    <span className="sm-hint">дверь 0,9 м · лист А4 0,297 м · размерная линия на плане</span>
                  </>
                ) : (
                  <>
                    <button type="button" className={`sm-btn ${calibrating ? 'is-on' : ''}`}
                      disabled={!photos.length} data-testid="calib-rect-start"
                      onClick={() => { setCalibrating(true); setRef([]); resetContour(); }}>
                      {refPts.length === 4 ? 'Перемерить углы' : 'Отметить 4 угла'}
                    </button>
                    <label className="sm-field-inline">
                      <span>размер</span>
                      <input type="number" min="0.05" step="0.01" value={rectA} onChange={(e) => setRectA(e.target.value)} aria-label="Сторона прямоугольника от 1-го угла ко 2-му, м" data-testid="rect-a" />
                      <span>×</span>
                      <input type="number" min="0.05" step="0.01" value={rectB} onChange={(e) => setRectB(e.target.value)} aria-label="Сторона прямоугольника от 2-го угла к 3-му, м" data-testid="rect-b" />
                      <span>м</span>
                    </label>
                    <span className="sm-hint">плитка 0,6×0,6 · лист А4 0,21×0,297 · ковёр или комната с известными размерами — на том же полу</span>
                  </>
                )}
              </>
            )}
          </div>

          {tab === 'photo' && !photos.length ? (
            <div className="sm-empty">Загрузите фото плана, чертежа или снимок сверху в шаге 2 — и обведите помещение здесь.</div>
          ) : (
            <div className="sm-canvas-wrap">
              <canvas ref={canvasRef} width={W} height={H} className="sm-canvas"
                data-testid="contour-canvas"
                style={{ cursor: closed ? 'default' : 'crosshair' }}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerLeave={() => setHover(null)} />
              {calibrating && (
                <div className="sm-canvas-tip">
                  {calibMode === 'rect'
                    ? `Кликните по 4 углам прямоугольника по кругу — отмечено ${refPts.length} из 4`
                    : 'Кликните в начало и в конец предмета известной длины'}
                </div>
              )}
            </div>
          )}

          <div className="sm-toolbar">
            <button type="button" className="sm-btn" disabled={!points.length}
              onClick={() => { setPoints((p) => p.slice(0, -1)); setClosed(false); }}>Отменить точку</button>
            <button type="button" className="sm-btn" disabled={!points.length && !refPts.length}
              onClick={() => { setPoints([]); setClosed(false); }}>Очистить</button>
            <button type="button" className="sm-btn sm-btn-primary" disabled={points.length < 3 || closed} onClick={closeContour}>
              {closed ? 'Контур замкнут' : `Замкнуть контур (${points.length} точ.)`}
            </button>
            <span className="sm-hint">
              {tab === 'photo'
                ? (calibMode === 'rect'
                  ? 'Прямоугольник-эталон исправляет перспективу: обводите только пол в той же плоскости, что и эталон.'
                  : 'Линия-эталон точна для плана или снимка строго сверху. Снимок под углом — выберите эталон «Прямоугольник».')
                : 'Кликайте по углам помещения по часовой стрелке; клик по первой точке замыкает контур.'}
            </span>
          </div>

          {tab === 'photo' && closed && calibrated && (
            <div className="sm-sides" data-testid="side-fix">
              <div className="sm-sides-head">
                <strong>Уточнить масштаб этой комнаты</strong>
                <span className="sm-hint">Планировки часто нарисованы не в масштабе. Впишите реальную длину одной-двух сторон — например, размеры комнаты, подписанные на плане. Две стороны разного направления исправляют и растяжение плана по ширине и высоте.</span>
              </div>
              <div className="sm-sides-list">
                {sideVecs.map((v, i) => (
                  <label key={i} className="sm-side">
                    <span>Сторона {i + 1}: <b>{mStr(Math.hypot(v.x, v.y))} м</b> по эталону</span>
                    <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="реальная, м"
                      value={sideFix[i] ?? ''} aria-label={`Реальная длина стороны ${i + 1}, м`} data-testid={`side-fix-${i + 1}`}
                      onChange={(e) => setSideFix((f) => ({ ...f, [i]: e.target.value }))} />
                  </label>
                ))}
              </div>
              {fit && (
                <p className={`sm-sides-status ${fit.maxDev > 0.03 || fit.note ? 'is-warn' : ''}`} role="status">
                  {fit.kind === 'axes'
                    ? `Масштаб уточнён по ${fit.count} сторонам отдельно по ширине и высоте: ×${mStr(fit.sx)} и ×${mStr(fit.sy)}.`
                    : `Масштаб уточнён по ${fit.count === 1 ? 'одной стороне' : `${fit.count} сторонам`}: ×${mStr(fit.sx)}.`}
                  {fit.note === 'one' && ' Впишите ещё одну сторону другого направления: планы часто растянуты по одной оси, и одной стороны мало.'}
                  {fit.note === 'parallel' && ' Указанные стороны параллельны — растяжение по второй оси по ним не определить, нужна сторона другого направления.'}
                  {fit.note === 'stretch' && ' Длины противоречат друг другу так сильно, что масштаб по осям не подобрать — взят общий множитель.'}
                  {fit.maxDev > 0.03 && ` Введённые длины расходятся с формой контура на ${mStr(fit.maxDev * 100)} % — проверьте, те ли стороны указаны и нет ли ниш и шкафов внутри размера.`}
                </p>
              )}
              {Object.keys(sideFix).some((i) => num(sideFix[i]) > 0) && (
                <button type="button" className="sm-btn" onClick={() => setSideFix({})}>Сбросить уточнение</button>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'manual' && (
        <div className="sm-manual">
          <div className="sm-seg" role="radiogroup" aria-label="Форма помещения">
            <button type="button" className={manual.kind === 'rect' ? 'is-on' : ''} onClick={() => setManual((m) => ({ ...m, kind: 'rect' }))}>Прямоугольник</button>
            <button type="button" className={manual.kind === 'free' ? 'is-on' : ''} onClick={() => setManual((m) => ({ ...m, kind: 'free' }))}>Сложная форма</button>
          </div>
          {manual.kind === 'rect' ? (
            <div className="sm-grid2">
              <label className="sm-field"><span>Длина, м</span>
                <input type="number" min="0" step="0.01" value={manual.len} onChange={(e) => setManual((m) => ({ ...m, len: e.target.value }))} data-testid="manual-len" /></label>
              <label className="sm-field"><span>Ширина, м</span>
                <input type="number" min="0" step="0.01" value={manual.wid} onChange={(e) => setManual((m) => ({ ...m, wid: e.target.value }))} data-testid="manual-wid" /></label>
            </div>
          ) : (
            <div className="sm-grid2">
              <label className="sm-field"><span>Площадь пола, м²</span>
                <input type="number" min="0" step="0.1" value={manual.area} onChange={(e) => setManual((m) => ({ ...m, area: e.target.value }))} /></label>
              <label className="sm-field"><span>Периметр стен, м</span>
                <input type="number" min="0" step="0.1" value={manual.per} onChange={(e) => setManual((m) => ({ ...m, per: e.target.value }))} /></label>
            </div>
          )}
        </div>
      )}

      <div className="sm-geo">
        <div className="sm-geo-main" data-testid="geo-summary">
          {geo.area > 0 ? (
            <>
              <b>{mStr(geo.area)} м²</b> площадь · <b>{mStr(geo.perimeter)} м</b> периметр
              {geo.perimeter > 0 && <> · стены <b>{mStr(wallArea)} м²</b> за вычетом проёмов</>}
            </>
          ) : (
            <span className="sm-hint">Обведите помещение или введите размеры — без них смету не посчитать.</span>
          )}
        </div>
        <div className="sm-grid3">
          <label className="sm-field"><span>Высота стен, м</span>
            <input type="number" min="2" max="30" step="0.05" value={geo.height} onChange={(e) => setG('height', num(e.target.value))} data-testid="geo-height" /></label>
          <label className="sm-field"><span>Двери 0,9×2,1 м</span>
            <input type="number" min="0" max="200" step="1" value={geo.doors} onChange={(e) => setG('doors', Math.max(0, Math.round(num(e.target.value))))} data-testid="geo-doors" /></label>
          <label className="sm-field"><span>Окна 1,5×1,5 м</span>
            <input type="number" min="0" max="400" step="1" value={geo.windows} onChange={(e) => setG('windows', Math.max(0, Math.round(num(e.target.value))))} data-testid="geo-windows" /></label>
        </div>
      </div>
    </div>
  );
}
