import React, { useEffect, useRef, useState, useCallback } from 'react';

// Обмер помещения: контур на сетке с заданным масштабом, контур на фото плана
// с калибровкой по эталону, или размеры вручную. Отдаёт площадь и периметр в метрах.

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

function polyStats(pts) {
  let a = 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
  }
  return { areaPx: Math.abs(a) / 2, perPx: p };
}

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
  const setPoints = useCallback((v) => {
    const next = typeof v === 'function' ? v(pointsRef.current) : v;
    pointsRef.current = next;
    setPointsState(next);
  }, []);
  const setClosed = useCallback((v) => {
    closedRef.current = v;
    setClosedState(v);
  }, []);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [refPts, setRefPts] = useState([]);
  const [refMeters, setRefMeters] = useState('0.9');
  const [manual, setManual] = useState({ kind: 'rect', len: '', wid: '', area: '', per: '' });
  const [hover, setHover] = useState(null);

  const pickTab = (t) => {
    setTab(t);
    setPoints([]);
    setClosed(false);
    setCalibrating(false);
    setGeo((g) => ({ ...g, area: 0, perimeter: 0, source: '' }));
    try { localStorage.setItem('qazgost_measure_tab', t); } catch { /* приватный режим */ }
  };

  const refLenPx = refPts.length === 2 ? Math.hypot(refPts[1].x - refPts[0].x, refPts[1].y - refPts[0].y) : 0;
  const metersPerPx = tab === 'grid'
    ? cellM / CELL
    : (refLenPx > 0 && num(refMeters) > 0 ? num(refMeters) / refLenPx : 0);

  // Итог контура → геометрия
  useEffect(() => {
    if (tab === 'manual') return;
    if (!closed || points.length < 3 || !metersPerPx) {
      if (geo.source === 'contour') setGeo((g) => ({ ...g, area: 0, perimeter: 0, source: '' }));
      return;
    }
    const { areaPx, perPx } = polyStats(points);
    setGeo((g) => ({ ...g, area: r2(areaPx * metersPerPx * metersPerPx), perimeter: r2(perPx * metersPerPx), source: 'contour' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed, points, metersPerPx, tab]);

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

  const closeContour = useCallback(() => {
    const points = pointsRef.current;
    if (points.length < 3) {
      showToast?.('Нужно минимум 3 точки, чтобы замкнуть контур');
      return;
    }
    if (selfIntersects(points)) {
      showToast?.('Стороны контура пересекаются — уберите лишнюю точку кнопкой «Отменить точку»');
      return;
    }
    if (!metersPerPx) {
      showToast?.('Сначала задайте масштаб: отметьте эталон известной длины');
      return;
    }
    setClosed(true);
  }, [metersPerPx, showToast, setClosed]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const p = toCanvas(e);
    if (calibrating) {
      const next = [...refPts, p].slice(-2);
      setRefPts(next);
      if (next.length === 2) {
        setCalibrating(false);
        showToast?.('Эталон отмечен — укажите его реальную длину в метрах');
      }
      return;
    }
    if (tab === 'photo' && !metersPerPx) {
      showToast?.('Сначала задайте масштаб: нажмите «Отметить эталон» и проведите линию по предмету известной длины');
      return;
    }
    if (closedRef.current) {
      showToast?.('Контур замкнут. Чтобы начать заново, нажмите «Очистить»');
      return;
    }
    const points = pointsRef.current;
    if (points.length >= 3) {
      const p0 = points[0];
      if (Math.hypot(p.x - p0.x, p.y - p0.y) < 18 * Math.min(2.2, Math.max(1, W / (canvasRef.current?.clientWidth || W)))) {
        closeContour();
        return;
      }
    }
    const last = points[points.length - 1];
    if (last && last.x === p.x && last.y === p.y) return;
    setPoints([...points, p]);
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
    const draw = (img) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, W, H);
      if (img) {
        const k = Math.min(W / img.width, H / img.height);
        const dw = img.width * k;
        const dh = img.height * k;
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

      // эталон на фото
      if (refPts.length) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(refPts[0].x, refPts[0].y);
        if (refPts[1]) ctx.lineTo(refPts[1].x, refPts[1].y);
        ctx.stroke();
        ctx.setLineDash([]);
        refPts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#fbbf24'; ctx.fill(); });
        if (refPts[1] && num(refMeters) > 0) {
          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(`эталон ${mStr(num(refMeters))} м`, (refPts[0].x + refPts[1].x) / 2 + 6, (refPts[0].y + refPts[1].y) / 2 - 6);
        }
      }

      if (points.length) {
        const path = [...points];
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        if (closed) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(16,185,129,0.18)';
          ctx.fill();
        } else if (hover) {
          ctx.lineTo(hover.x, hover.y);
        }
        ctx.strokeStyle = closed ? '#10b981' : '#b9a4ff';
        ctx.lineWidth = 2.5 * k;
        ctx.stroke();

        // длины сторон
        if (metersPerPx) {
          ctx.font = `bold ${Math.round(12 * k)}px Inter, sans-serif`;
          const n = closed ? path.length : path.length - 1;
          for (let i = 0; i < n; i++) {
            const a = path[i];
            const b = path[(i + 1) % path.length];
            const len = Math.hypot(b.x - a.x, b.y - a.y) * metersPerPx;
            const label = `${mStr(len)} м`;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(11,15,25,0.85)';
            ctx.fillRect(mx - tw / 2 - 4, my - 9 * k, tw + 8, 18 * k);
            ctx.fillStyle = '#e9e4ff';
            ctx.fillText(label, mx - tw / 2, my + 4 * k);
          }
        }
        points.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, (i === 0 && !closed && points.length >= 3 ? 8 : 5) * k, 0, Math.PI * 2);
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
  }, [tab, points, closed, hover, cellM, refPts, refMeters, metersPerPx, photos, photoIdx]);

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
                  <select value={photoIdx} onChange={(e) => { setPhotoIdx(Number(e.target.value)); setPoints([]); setClosed(false); setRefPts([]); }} aria-label="Фото для обмера">
                    {photos.map((p, i) => <option key={p.id} value={i}>Фото {i + 1}</option>)}
                  </select>
                )}
                <button type="button" className={`sm-btn ${calibrating ? 'is-on' : ''}`}
                  disabled={!photos.length}
                  onClick={() => { setCalibrating(true); setRefPts([]); setPoints([]); setClosed(false); }}>
                  {refPts.length === 2 ? 'Перемерить эталон' : 'Отметить эталон'}
                </button>
                <label className="sm-field-inline">
                  <span>длина эталона</span>
                  <input type="number" min="0.05" step="0.01" value={refMeters} onChange={(e) => setRefMeters(e.target.value)} aria-label="Длина эталона в метрах" />
                  <span>м</span>
                </label>
                <span className="sm-hint">дверь 0,9 м · лист А4 0,297 м · размерная линия на плане</span>
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
              {calibrating && <div className="sm-canvas-tip">Кликните в начало и в конец предмета известной длины</div>}
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
                ? 'Точно только для плана или снимка строго сверху: на фото в перспективе размеры искажаются.'
                : 'Кликайте по углам помещения по часовой стрелке; клик по первой точке замыкает контур.'}
            </span>
          </div>
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
