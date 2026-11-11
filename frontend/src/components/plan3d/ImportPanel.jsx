import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { guessUnitToM, guessWallLayers, toMetres } from '../../plan3d/dxf.js';
import { guessWallWidths, ptToMetres } from '../../plan3d/pdfVector.js';
import { detectWalls, wallsFromAxes, rankLayersByRooms } from '../../plan3d/walls.js';
import { buildRooms } from '../../plan3d/rooms.js';

const UNITS = [
  { v: 0.001, label: 'миллиметры' },
  { v: 0.01, label: 'сантиметры' },
  { v: 1, label: 'метры' },
  { v: 0.0254, label: 'дюймы' },
];
const SCALES = [20, 50, 100, 200, 500];
const fmt = (v, d = 1) => v.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Какие слои отметить сразу: по названию, а если названия ничего не говорят — по тому, из каких получаются помещения. */
function initialLayers(source, unitToM) {
  const names = source.layers.map((l) => l.name);
  if (source.kind === 'dxf') {
    const g = guessWallLayers(source.layers);
    if (g.confident) return g.names;
  }
  const { segments } = toMetres(source.segments, unitToM);
  const rank = rankLayersByRooms(segments, names);
  if (rank[0]?.rooms > 0) {
    const best = rank[0].area;
    return rank.filter((r) => r.rooms > 0 && r.area >= best * 0.3).map((r) => r.name);
  }
  if (source.kind === 'pdf') return guessWallWidths(source.layers).names;
  return guessWallLayers(source.layers).names;
}

export default function ImportPanel({ source, replacing, onApply, onCancel, onPage }) {
  const isPdf = source.kind === 'pdf';
  const [unitToM, setUnitToM] = useState(() => (isPdf ? ptToMetres(100) : source.unitToM || guessUnitToM(source.segments)));
  const [scale, setScale] = useState(100);
  const [mode, setMode] = useState('double');
  const [axisT, setAxisT] = useState(200);
  const [picked, setPicked] = useState(() => new Set(initialLayers(source, isPdf ? ptToMetres(100) : source.unitToM || guessUnitToM(source.segments))));

  // новая страница PDF — новый набор линий
  useEffect(() => {
    const k = isPdf ? ptToMetres(scale) : source.unitToM || guessUnitToM(source.segments);
    setUnitToM(k);
    setPicked(new Set(initialLayers(source, k)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const metres = useMemo(() => toMetres(source.segments, unitToM), [source, unitToM]);
  const chosen = useMemo(() => metres.segments.filter((s) => picked.has(s.layer)), [metres, picked]);
  const result = useMemo(() => {
    if (!chosen.length) return { walls: [], openings: [], rooms: 0 };
    const r = mode === 'axes' ? wallsFromAxes(chosen, Math.max(0.03, axisT / 1000)) : detectWalls(chosen);
    return { ...r, rooms: r.walls.length <= 3000 ? buildRooms(r.walls).rooms.length : 0 };
  }, [chosen, mode, axisT]);

  const box = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // габарит — по наружным граням: к осям стен добавляем полтолщины
    const list = result.walls.length ? result.walls.map((w) => ({ x1: w.ax, y1: w.ay, x2: w.bx, y2: w.by, h: w.t / 2 })) : chosen;
    for (const s of list) {
      const h = s.h || 0;
      minX = Math.min(minX, s.x1 - h, s.x2 - h); maxX = Math.max(maxX, s.x1 + h, s.x2 + h);
      minY = Math.min(minY, s.y1 - h, s.y2 - h); maxY = Math.max(maxY, s.y1 + h, s.y2 + h);
    }
    if (!Number.isFinite(minX)) return null;
    return { minX, minY, maxX, maxY, w: Math.max(maxX - minX, 0.01), h: Math.max(maxY - minY, 0.01) };
  }, [result, chosen]);

  const toggle = (name) => {
    const next = new Set(picked);
    if (next.has(name)) next.delete(name); else next.add(name);
    setPicked(next);
  };
  const changeScale = (n) => {
    const v = Math.max(1, Math.min(5000, Math.round(Number(n) || 100)));
    setScale(v);
    setUnitToM(ptToMetres(v));
  };

  const apply = () => {
    // начало координат — в левом нижнем углу здания по наружным граням: так удобнее и на плане, и при выносе на площадку
    const dx = box ? Math.round(box.minX * 1000) / 1000 : 0;
    const dy = box ? Math.round(box.minY * 1000) / 1000 : 0;
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const walls = result.walls.map((w) => ({ ...w, ax: r3(w.ax - dx), ay: r3(w.ay - dy), bx: r3(w.bx - dx), by: r3(w.by - dy) }));
    let underlay = null;
    if (isPdf && source.image) {
      // лист целиком в тех же координатах, что и найденные стены
      underlay = {
        src: source.image,
        x: -metres.origin.x * unitToM - dx, y: -metres.origin.y * unitToM - dy,
        w: source.ptWidth * unitToM, h: source.ptHeight * unitToM,
        opacity: 0.45, visible: true,
      };
    }
    onApply({ walls, openings: result.openings, underlay });
  };

  // предпросмотр: линии выбранных слоёв серым, найденные стены золотом
  const VW = 640;
  const VH = 360;
  const view = box && (() => {
    const k = Math.min((VW - 40) / box.w, (VH - 40) / box.h);
    const ox = (VW - box.w * k) / 2;
    const oy = (VH - box.h * k) / 2;
    return { X: (x) => (ox + (x - box.minX) * k).toFixed(1), Y: (y) => (oy + (box.maxY - y) * k).toFixed(1), k };
  })();
  const rawShown = chosen.length > 6000 ? chosen.filter((_, i) => i % Math.ceil(chosen.length / 6000) === 0) : chosen;
  const wide = box && (box.w > 400 || box.h > 400);
  const tiny = box && result.walls.length > 0 && box.w < 2 && box.h < 2;

  return (
    <section className="p3-panel p3-import" aria-labelledby="p3-import-title">
      <header className="p3-import-head">
        <div>
          <h2 id="p3-import-title" className="p3-h3">Что считать стенами</h2>
          <p className="p3-muted">{source.name}{isPdf && source.pages > 1 ? ` · страница ${source.page} из ${source.pages}` : ''}</p>
        </div>
        {isPdf && source.pages > 1 && (
          <div className="p3-pager">
            <button type="button" className="p3-btn p3-btn--ghost" disabled={source.page <= 1} onClick={() => onPage(source.page - 1)}>Предыдущая</button>
            <button type="button" className="p3-btn p3-btn--ghost" disabled={source.page >= source.pages} onClick={() => onPage(source.page + 1)}>Следующая</button>
          </div>
        )}
      </header>

      <div className="p3-import-grid">
        <div className="p3-import-options">
          <fieldset className="p3-fieldset">
            <legend>{isPdf ? 'Линии по толщине' : 'Слои чертежа'}</legend>
            <ul className="p3-layers">
              {source.layers.map((l) => (
                <li key={l.name}>
                  <label className="p3-check">
                    <input type="checkbox" checked={picked.has(l.name)} onChange={() => toggle(l.name)} />
                    <span className="p3-check-name" translate="no">{l.name}</span>
                    <span className="p3-check-count">{l.count.toLocaleString('ru-RU')} лин.</span>
                  </label>
                </li>
              ))}
            </ul>
            {isPdf && <p className="p3-muted">В PDF нет слоёв, поэтому линии разделены по толщине: стены обычно начерчены толще размеров и штриховки.</p>}
          </fieldset>

          {isPdf ? (
            <div className="p3-field">
              <label htmlFor="p3-scale">Масштаб чертежа, 1 :</label>
              <div className="p3-inline">
                <input id="p3-scale" className="p3-input p3-input--num" type="number" min="1" max="5000" value={scale} onChange={(e) => changeScale(e.target.value)} />
                <div className="p3-chips" role="group" aria-label="Частые масштабы">
                  {SCALES.map((s) => <button key={s} type="button" className="p3-chip" aria-pressed={scale === s} onClick={() => changeScale(s)}>1:{s}</button>)}
                </div>
              </div>
              <p className="p3-muted">Масштаб указан в штампе чертежа. От него зависят все размеры модели.</p>
            </div>
          ) : (
            <div className="p3-field">
              <label htmlFor="p3-units">Единицы чертежа</label>
              <select id="p3-units" className="p3-input" value={unitToM} onChange={(e) => setUnitToM(Number(e.target.value))}>
                {UNITS.map((u) => <option key={u.v} value={u.v}>{u.label}</option>)}
              </select>
              <p className="p3-muted">{source.unit ? 'Единицы взяты из файла.' : 'В файле единицы не указаны — определили по габаритам, проверьте.'}</p>
            </div>
          )}

          <fieldset className="p3-fieldset">
            <legend>Как начерчены стены</legend>
            <label className="p3-check">
              <input type="radio" name="p3-mode" checked={mode === 'double'} onChange={() => setMode('double')} />
              <span className="p3-check-name">Двумя линиями (грани стены)</span>
            </label>
            <label className="p3-check">
              <input type="radio" name="p3-mode" checked={mode === 'axes'} onChange={() => setMode('axes')} />
              <span className="p3-check-name">Одной линией (ось стены)</span>
            </label>
            {mode === 'axes' && (
              <div className="p3-field p3-field--row">
                <label htmlFor="p3-axis-t">Толщина стен, мм</label>
                <input id="p3-axis-t" className="p3-input p3-input--num" type="number" min="30" max="2000" step="10" value={axisT} onChange={(e) => setAxisT(Number(e.target.value) || 200)} />
              </div>
            )}
          </fieldset>
        </div>

        <div className="p3-import-preview">
          <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label="Предпросмотр: найденные стены золотом и проёмы голубым поверх линий чертежа" translate="no">
            {view && rawShown.map((s, i) => <line key={i} className="p3-prev-raw" x1={view.X(s.x1)} y1={view.Y(s.y1)} x2={view.X(s.x2)} y2={view.Y(s.y2)} />)}
            {view && result.walls.map((w) => <line key={w.id} className="p3-prev-wall" x1={view.X(w.ax)} y1={view.Y(w.ay)} x2={view.X(w.bx)} y2={view.Y(w.by)} style={{ strokeWidth: Math.max(2, w.t * view.k) }} />)}
            {view && result.openings.map((o) => {
              const w = result.walls.find((x) => x.id === o.wallId);
              if (!w) return null;
              const len = Math.hypot(w.bx - w.ax, w.by - w.ay);
              const ux = (w.bx - w.ax) / len;
              const uy = (w.by - w.ay) / len;
              const a = o.at - o.w / 2;
              const b = o.at + o.w / 2;
              return <line key={o.id} className="p3-prev-opening" x1={view.X(w.ax + ux * a)} y1={view.Y(w.ay + uy * a)} x2={view.X(w.ax + ux * b)} y2={view.Y(w.ay + uy * b)} style={{ strokeWidth: Math.max(2, w.t * view.k) }} />;
            })}
            {!view && <text x={VW / 2} y={VH / 2} textAnchor="middle" className="p3-prev-empty">Отметьте хотя бы один слой</text>}
          </svg>
          <dl className="p3-import-stats" data-walls={result.walls.length} data-openings={result.openings.length} data-rooms={result.rooms}>
            <div><dt>Стен</dt><dd>{result.walls.length}</dd></div>
            <div><dt>Проёмов</dt><dd>{result.openings.length}</dd></div>
            <div><dt>Помещений</dt><dd>{result.rooms}</dd></div>
            <div><dt>Габарит</dt><dd>{box && result.walls.length ? `${fmt(box.w)} × ${fmt(box.h)} м` : '—'}</dd></div>
          </dl>
          {picked.size > 0 && result.walls.length === 0 && (
            <p className="p3-alert" role="status"><AlertTriangle size={18} aria-hidden="true" />Стены не нашлись. Отметьте другие слои, проверьте {isPdf ? 'масштаб' : 'единицы'} или переключите «Одной линией».</p>
          )}
          {wide && <p className="p3-alert" role="status"><AlertTriangle size={18} aria-hidden="true" />Габарит больше 400 м — похоже, {isPdf ? 'масштаб' : 'единицы'} выбраны неверно.</p>}
          {tiny && <p className="p3-alert" role="status"><AlertTriangle size={18} aria-hidden="true" />Габарит меньше 2 м — похоже, {isPdf ? 'масштаб' : 'единицы'} выбраны неверно.</p>}
          {source.skipped > 0 && <p className="p3-muted">Файл очень большой: прочитаны первые 200 000 линий.</p>}
        </div>
      </div>

      <footer className="p3-import-foot">
        <p className="p3-muted">Проёмы находим по разрывам стен: пустой разрыв — дверь, с линиями стекла внутри — окно. После переноса всё можно поправить вручную.</p>
        <div className="p3-actions">
          <button type="button" className="p3-btn p3-btn--ghost" onClick={onCancel}><X size={18} aria-hidden="true" />Отмена</button>
          <button type="button" className="p3-btn p3-btn--gold" onClick={apply} disabled={!result.walls.length}><Check size={18} aria-hidden="true" />{replacing ? 'Заменить стены этажа' : 'Перенести на этаж'}</button>
        </div>
      </footer>
    </section>
  );
}
