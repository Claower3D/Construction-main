import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { MousePointer2, PenLine, DoorOpen, AppWindow, Ruler, Undo2, Redo2, Trash2, Maximize, ZoomIn, ZoomOut, Eye, EyeOff, Check, X } from 'lucide-react';
import { planPrimitives } from '../../plan3d/exporters.js';
import { OPENING_PRESETS, wallLength } from '../../plan3d/model.js';
import { uid } from '../../plan3d/walls.js';

const GRID = 0.05;
const snapGrid = (v) => Math.round(v / GRID) * GRID;
const r3 = (v) => Math.round(v * 1000) / 1000;
const fmtM = (v) => `${v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} м`;

const TOOLS = [
  { id: 'select', label: 'Выбор', icon: MousePointer2, hint: 'Нажмите на стену или проём, чтобы выбрать. Концы выбранной стены можно тянуть.' },
  { id: 'wall', label: 'Стена', icon: PenLine, hint: 'Нажмите в начале стены, затем в конце. Следующая стена продолжит цепочку; двойное нажатие — закончить.' },
  { id: 'door', label: 'Дверь', icon: DoorOpen, hint: 'Нажмите на стену в том месте, где дверь.' },
  { id: 'window', label: 'Окно', icon: AppWindow, hint: 'Нажмите на стену в том месте, где окно.' },
];
const SCALE_TOOL = { id: 'scale', label: 'Масштаб', icon: Ruler, hint: 'Отметьте на подложке две точки с известным расстоянием между ними, например концы размерной линии.' };

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return { d: Math.hypot(px - (ax + dx * t), py - (ay + dy * t)), t };
}

const PlanEditor = forwardRef(function PlanEditor({
  floor, onChange, tool, onToolChange, selection, onSelect, underlay, onUnderlayChange, onCalibrate,
  wallThickness, onUndo, onRedo, canUndo, canRedo, onDelete, anchors,
}, ref) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 420 });
  const [view, setView] = useState({ cx: 5, cy: 4, zoom: 40 });
  const [draft, setDraftState] = useState(null); // этаж на время перетаскивания
  const draftRef = useRef(null); // то же в ref: отпускание кнопки может прийти раньше, чем React перерисует состояние
  const setDraft = (d) => { draftRef.current = d; setDraftState(d); };
  const [chain, setChain] = useState(null); // начало чертимой стены
  const [cursor, setCursor] = useState(null); // точка под указателем с привязкой
  const [scalePts, setScalePts] = useState([]);
  const [scaleValue, setScaleValue] = useState('');
  const gesture = useRef({ pointers: new Map(), mode: null });
  const shown = draft || floor;

  const prim = useMemo(() => planPrimitives(shown), [shown]);
  const hasUnderlay = Boolean(underlay?.src);
  const tools = hasUnderlay ? [...TOOLS, SCALE_TOOL] : TOOLS;
  const activeTool = tools.find((t) => t.id === tool) || TOOLS[0];

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const w of floor.walls) {
      minX = Math.min(minX, w.ax, w.bx); maxX = Math.max(maxX, w.ax, w.bx);
      minY = Math.min(minY, w.ay, w.by); maxY = Math.max(maxY, w.ay, w.by);
    }
    if (!Number.isFinite(minX) && hasUnderlay) { minX = underlay.x; minY = underlay.y; maxX = underlay.x + underlay.w; maxY = underlay.y + underlay.h; }
    if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = 12; maxY = 9; }
    const el = boxRef.current;
    const w = el?.clientWidth || size.w;
    const h = el?.clientHeight || size.h;
    const zoom = Math.max(2, Math.min(400, Math.min(w / (maxX - minX + 2), h / (maxY - minY + 2))));
    setView({ cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, zoom });
  }, [floor.walls, hasUnderlay, underlay, size.w, size.h]);

  useImperativeHandle(ref, () => ({ fit }), [fit]);

  // сброс незаконченных действий при смене инструмента
  useEffect(() => { setChain(null); setScalePts([]); setScaleValue(''); setCursor(null); }, [tool]);

  const toWorld = useCallback((sx, sy) => ({ x: view.cx + (sx - size.w / 2) / view.zoom, y: view.cy - (sy - size.h / 2) / view.zoom }), [view, size]);
  const SX = (x) => (x - view.cx) * view.zoom + size.w / 2;
  const SY = (y) => (view.cy - y) * view.zoom + size.h / 2;
  const px = (n) => n / view.zoom; // пиксели → метры

  const localPoint = (e) => {
    const rect = boxRef.current.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  };

  // ── выбор объектов под указателем ──────────────────────────────────────────
  const pickWall = (p, list = floor.walls) => {
    let best = null;
    for (const w of list) {
      const { d, t } = distToSegment(p.x, p.y, w.ax, w.ay, w.bx, w.by);
      const reach = Math.max(w.t / 2 + px(4), px(12));
      if (d <= reach && (!best || d < best.d)) best = { wall: w, d, s: t * wallLength(w) };
    }
    return best;
  };
  const pickOpening = (p) => {
    const byId = new Map(floor.walls.map((w) => [w.id, w]));
    let best = null;
    for (const o of floor.openings) {
      const w = byId.get(o.wallId);
      if (!w) continue;
      const len = wallLength(w);
      const ux = (w.bx - w.ax) / len;
      const uy = (w.by - w.ay) / len;
      const a = { x: w.ax + ux * (o.at - o.w / 2), y: w.ay + uy * (o.at - o.w / 2) };
      const b = { x: w.ax + ux * (o.at + o.w / 2), y: w.ay + uy * (o.at + o.w / 2) };
      const { d } = distToSegment(p.x, p.y, a.x, a.y, b.x, b.y);
      if (d <= Math.max(w.t / 2 + px(4), px(12)) && (!best || d < best.d)) best = { opening: o, d };
    }
    return best;
  };
  const pickHandle = (p) => {
    if (selection?.kind !== 'wall') return null;
    const w = floor.walls.find((x) => x.id === selection.id);
    if (!w) return null;
    const reach = px(16);
    if (Math.hypot(p.x - w.ax, p.y - w.ay) <= reach) return { wallId: w.id, end: 'a' };
    if (Math.hypot(p.x - w.bx, p.y - w.by) <= reach) return { wallId: w.id, end: 'b' };
    return null;
  };

  // ── привязка: к концам стен, к осям, к прямому углу, к сетке 5 см ──────────
  const snapPoint = (p, anchor, skip) => {
    const reach = px(13);
    let best = null;
    for (const w of floor.walls) {
      for (const end of ['a', 'b']) {
        if (skip && skip.wallId === w.id && skip.end === end) continue;
        const x = end === 'a' ? w.ax : w.bx;
        const y = end === 'a' ? w.ay : w.by;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d <= reach && (!best || d < best.d)) best = { x, y, d, kind: 'end' };
      }
    }
    if (best) return { x: best.x, y: best.y, kind: 'end' };

    let q = { x: p.x, y: p.y };
    let ortho = null;
    if (anchor) {
      const dx = Math.abs(q.x - anchor.x);
      const dy = Math.abs(q.y - anchor.y);
      const tan = Math.tan((5 * Math.PI) / 180);
      if (dy <= dx * tan) { q.y = anchor.y; ortho = 'h'; } else if (dx <= dy * tan) { q.x = anchor.x; ortho = 'v'; }
    }
    // примыкание к оси другой стены
    let axis = null;
    for (const w of floor.walls) {
      if (skip && skip.wallId === w.id) continue;
      const { d, t } = distToSegment(q.x, q.y, w.ax, w.ay, w.bx, w.by);
      if (d <= px(10) && (!axis || d < axis.d)) axis = { d, w, t };
    }
    if (axis) {
      const { w } = axis;
      if (ortho === 'h' && Math.abs(w.by - w.ay) > 1e-6) {
        const k = (q.y - w.ay) / (w.by - w.ay);
        if (k >= 0 && k <= 1) return { x: r3(w.ax + (w.bx - w.ax) * k), y: q.y, kind: 'axis' };
      }
      if (ortho === 'v' && Math.abs(w.bx - w.ax) > 1e-6) {
        const k = (q.x - w.ax) / (w.bx - w.ax);
        if (k >= 0 && k <= 1) return { x: q.x, y: r3(w.ay + (w.by - w.ay) * k), kind: 'axis' };
      }
      return { x: r3(w.ax + (w.bx - w.ax) * axis.t), y: r3(w.ay + (w.by - w.ay) * axis.t), kind: 'axis' };
    }
    q = { x: ortho === 'v' ? q.x : snapGrid(q.x), y: ortho === 'h' ? q.y : snapGrid(q.y) };
    return { x: r3(q.x), y: r3(q.y), kind: ortho ? 'ortho' : 'grid' };
  };

  // ── действия ───────────────────────────────────────────────────────────────
  const addWall = (a, b) => {
    const wall = { id: uid('w'), ax: a.x, ay: a.y, bx: b.x, by: b.y, t: wallThickness };
    onChange({ ...floor, walls: [...floor.walls, wall] });
    onSelect({ kind: 'wall', id: wall.id });
  };
  const addOpening = (hit, type) => {
    const preset = OPENING_PRESETS[type];
    const len = wallLength(hit.wall);
    const w = Math.min(preset.w, Math.max(0.3, len - 0.1));
    const at = r3(Math.min(Math.max(snapGrid(hit.s), w / 2), len - w / 2));
    const opening = { id: uid('o'), wallId: hit.wall.id, type, at, w: r3(w), h: preset.h, sill: preset.sill };
    onChange({ ...floor, openings: [...floor.openings, opening] });
    onSelect({ kind: 'opening', id: opening.id });
  };

  const click = (p) => {
    if (tool === 'wall') {
      const q = snapPoint(p, chain);
      if (!chain) { setChain(q); return; }
      if (Math.hypot(q.x - chain.x, q.y - chain.y) < 0.05) { setChain(null); return; } // повторное нажатие в ту же точку — конец цепочки
      addWall(chain, q);
      setChain(q);
      return;
    }
    if (tool === 'door' || tool === 'window') {
      const hit = pickWall(p);
      if (hit) addOpening(hit, tool);
      return;
    }
    if (tool === 'scale') {
      if (scalePts.length >= 2) { setScalePts([p]); setScaleValue(''); } else setScalePts([...scalePts, p]);
      return;
    }
    const op = pickOpening(p);
    if (op) { onSelect({ kind: 'opening', id: op.opening.id }); return; }
    const hit = pickWall(p);
    onSelect(hit ? { kind: 'wall', id: hit.wall.id } : null);
  };

  // ── указатель: нажатие, перетаскивание, щипок ──────────────────────────────
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button > 1) return;
    const g = gesture.current;
    const pt = localPoint(e);
    g.pointers.set(e.pointerId, pt);
    boxRef.current.setPointerCapture?.(e.pointerId);
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      g.mode = 'pinch';
      g.pinch = { dist: Math.hypot(a.sx - b.sx, a.sy - b.sy), zoom: view.zoom, world: toWorld((a.sx + b.sx) / 2, (a.sy + b.sy) / 2) };
      setDraft(null);
      return;
    }
    const world = toWorld(pt.sx, pt.sy);
    g.start = pt;
    g.viewStart = view;
    g.moved = false;
    if (tool === 'select') {
      const handle = pickHandle(world);
      if (handle) { g.mode = 'handle'; g.handle = handle; return; }
      const op = selection?.kind === 'opening' ? pickOpening(world) : null;
      if (op && op.opening.id === selection.id) { g.mode = 'opening'; g.openingId = op.opening.id; return; }
    }
    g.mode = 'tap';
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    const pt = localPoint(e);
    if (g.pointers.has(e.pointerId)) g.pointers.set(e.pointerId, pt);
    if (g.mode === 'pinch' && g.pointers.size >= 2) {
      const [a, b] = [...g.pointers.values()];
      const dist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
      const zoom = Math.max(2, Math.min(600, g.pinch.zoom * (dist / Math.max(1, g.pinch.dist))));
      const mx = (a.sx + b.sx) / 2;
      const my = (a.sy + b.sy) / 2;
      setView({ zoom, cx: g.pinch.world.x - (mx - size.w / 2) / zoom, cy: g.pinch.world.y + (my - size.h / 2) / zoom });
      return;
    }
    const world = toWorld(pt.sx, pt.sy);
    if (!g.mode) {
      // просто движение мыши: показываем, куда встанет точка
      if (tool === 'wall') setCursor(snapPoint(world, chain));
      else if (tool === 'scale' && scalePts.length === 1) setCursor({ x: world.x, y: world.y, kind: 'free' });
      return;
    }
    const dx = pt.sx - g.start.sx;
    const dy = pt.sy - g.start.sy;
    if (!g.moved && Math.hypot(dx, dy) > 6) g.moved = true;
    if (!g.moved) return;
    if (g.mode === 'tap') g.mode = 'pan';
    if (g.mode === 'pan') {
      setView({ ...g.viewStart, cx: g.viewStart.cx - dx / g.viewStart.zoom, cy: g.viewStart.cy + dy / g.viewStart.zoom });
    } else if (g.mode === 'handle') {
      const w = floor.walls.find((x) => x.id === g.handle.wallId);
      if (!w) return;
      const anchor = g.handle.end === 'a' ? { x: w.bx, y: w.by } : { x: w.ax, y: w.ay };
      const q = snapPoint(world, anchor, g.handle);
      if (Math.hypot(q.x - anchor.x, q.y - anchor.y) < 0.05) return;
      const moved = g.handle.end === 'a' ? { ...w, ax: q.x, ay: q.y } : { ...w, bx: q.x, by: q.y };
      const len = wallLength(moved);
      // проёмы держатся на своём расстоянии от точки A; при укорочении стены прижимаем их внутрь
      const shift = g.handle.end === 'a' ? len - wallLength(w) : 0;
      const openings = floor.openings.map((o) => {
        if (o.wallId !== w.id) return o;
        const width = Math.min(o.w, Math.max(0.3, len));
        return { ...o, w: r3(width), at: r3(Math.min(Math.max(o.at + shift, width / 2), Math.max(width / 2, len - width / 2))) };
      });
      setDraft({ ...floor, walls: floor.walls.map((x) => (x.id === w.id ? moved : x)), openings });
      setCursor(q);
    } else if (g.mode === 'opening') {
      const o = floor.openings.find((x) => x.id === g.openingId);
      const w = o && floor.walls.find((x) => x.id === o.wallId);
      if (!w) return;
      const len = wallLength(w);
      const s = ((world.x - w.ax) * (w.bx - w.ax) + (world.y - w.ay) * (w.by - w.ay)) / len;
      const at = r3(Math.min(Math.max(snapGrid(s), o.w / 2), Math.max(o.w / 2, len - o.w / 2)));
      setDraft({ ...floor, openings: floor.openings.map((x) => (x.id === o.id ? { ...x, at } : x)) });
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    const had = g.pointers.has(e.pointerId);
    g.pointers.delete(e.pointerId);
    if (!had) return;
    if (g.mode === 'pinch') { if (g.pointers.size < 2) g.mode = g.pointers.size ? 'ignore' : null; return; }
    if (g.mode === 'ignore') { if (!g.pointers.size) g.mode = null; return; }
    const pt = localPoint(e);
    if (g.mode === 'tap' && !g.moved) click(toWorld(pt.sx, pt.sy));
    else if ((g.mode === 'handle' || g.mode === 'opening') && draftRef.current) onChange(draftRef.current);
    setDraft(null);
    if (g.mode === 'handle') setCursor(null);
    g.mode = null;
  };

  const onPointerCancel = (e) => {
    const g = gesture.current;
    g.pointers.delete(e.pointerId);
    if (!g.pointers.size) g.mode = null;
    setDraft(null);
  };

  // колесо: масштаб вокруг указателя. Слушатель не пассивный, иначе страница прокручивается вместе с планом
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      setView((v) => {
        const zoom = Math.max(2, Math.min(600, v.zoom * Math.exp(-e.deltaY * 0.0015)));
        const wx = v.cx + (sx - rect.width / 2) / v.zoom;
        const wy = v.cy - (sy - rect.height / 2) / v.zoom;
        return { zoom, cx: wx - (sx - rect.width / 2) / zoom, cy: wy + (sy - rect.height / 2) / zoom };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (k) => setView((v) => ({ ...v, zoom: Math.max(2, Math.min(600, v.zoom * k)) }));

  const onKeyDown = (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Escape') {
      if (chain || scalePts.length) { setChain(null); setScalePts([]); setCursor(null); } else if (tool !== 'select') onToolChange('select'); else onSelect(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection) { e.preventDefault(); onDelete(); }
    else if (mod && (e.key === 'z' || e.key === 'я') && !e.shiftKey) { e.preventDefault(); onUndo(); }
    else if (mod && (e.key === 'y' || e.key === 'н' || ((e.key === 'z' || e.key === 'Z' || e.key === 'Я') && e.shiftKey))) { e.preventDefault(); onRedo(); }
    else if (e.key === 'Enter' && chain) setChain(null);
    else if (e.key === 'ArrowLeft') setView((v) => ({ ...v, cx: v.cx - 60 / v.zoom }));
    else if (e.key === 'ArrowRight') setView((v) => ({ ...v, cx: v.cx + 60 / v.zoom }));
    else if (e.key === 'ArrowUp') { e.preventDefault(); setView((v) => ({ ...v, cy: v.cy + 60 / v.zoom })); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setView((v) => ({ ...v, cy: v.cy - 60 / v.zoom })); }
    else if (e.key === '+' || e.key === '=') zoomBy(1.25);
    else if (e.key === '-') zoomBy(0.8);
  };

  const applyScale = () => {
    const metres = parseFloat(String(scaleValue).replace(',', '.'));
    if (!(metres > 0) || scalePts.length < 2) return;
    onCalibrate(scalePts[0], scalePts[1], metres);
    setScalePts([]);
    setScaleValue('');
    onToolChange('select');
  };

  // ── сетка ──────────────────────────────────────────────────────────────────
  const grid = useMemo(() => {
    const step = [0.5, 1, 2, 5, 10, 20, 50, 100].find((s) => s * view.zoom >= 28) || 200;
    const x0 = Math.floor((view.cx - size.w / 2 / view.zoom) / step) * step;
    const x1 = view.cx + size.w / 2 / view.zoom;
    const y0 = Math.floor((view.cy - size.h / 2 / view.zoom) / step) * step;
    const y1 = view.cy + size.h / 2 / view.zoom;
    const xs = [];
    const ys = [];
    for (let x = x0; x <= x1 && xs.length < 200; x += step) xs.push(x);
    for (let y = y0; y <= y1 && ys.length < 200; y += step) ys.push(y);
    return { xs, ys, step };
  }, [view, size]);

  const selWall = selection?.kind === 'wall' ? shown.walls.find((w) => w.id === selection.id) : null;
  const selOpening = selection?.kind === 'opening' ? shown.openings.find((o) => o.id === selection.id) : null;
  const selOpeningWall = selOpening ? shown.walls.find((w) => w.id === selOpening.wallId) : null;
  const pts = (list) => list.map((p) => `${SX(p.x).toFixed(1)},${SY(p.y).toFixed(1)}`).join(' ');
  const rubber = tool === 'wall' && chain && cursor ? { a: chain, b: cursor, len: Math.hypot(cursor.x - chain.x, cursor.y - chain.y) } : null;
  const scaleLine = scalePts.length === 2 ? scalePts : scalePts.length === 1 && cursor ? [scalePts[0], cursor] : null;

  let hint = activeTool.hint;
  if (tool === 'wall' && chain) hint = 'Нажмите в конце стены. Чтобы закончить — нажмите ещё раз в ту же точку или Esc.';
  if (tool === 'scale' && scalePts.length === 1) hint = 'Теперь отметьте вторую точку.';
  if (tool === 'scale' && scalePts.length === 2) hint = 'Введите настоящее расстояние между отмеченными точками.';
  if (tool === 'select' && selWall) hint = `Стена ${fmtM(wallLength(selWall))}, толщина ${Math.round(selWall.t * 1000)} мм. Потяните за конец, чтобы изменить.`;
  if (tool === 'select' && selOpening) hint = 'Проём можно двигать вдоль стены. Размеры — в панели свойств.';

  return (
    <div className="p3-editor">
      <div className="p3-toolbar" role="toolbar" aria-label="Инструменты плана">
        <div className="p3-tools">
          {tools.map((t) => (
            <button key={t.id} type="button" className="p3-tool" aria-pressed={tool === t.id} aria-label={t.label} onClick={() => onToolChange(t.id)} title={t.hint}>
              <t.icon size={18} aria-hidden="true" /><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="p3-tools p3-tools--end">
          <button type="button" className="p3-icon-btn" onClick={onUndo} disabled={!canUndo} aria-label="Отменить" title="Отменить (Ctrl+Z)"><Undo2 size={18} aria-hidden="true" /></button>
          <button type="button" className="p3-icon-btn" onClick={onRedo} disabled={!canRedo} aria-label="Вернуть" title="Вернуть (Ctrl+Y)"><Redo2 size={18} aria-hidden="true" /></button>
          <button type="button" className="p3-icon-btn" onClick={onDelete} disabled={!selection} aria-label="Удалить выбранное" title="Удалить выбранное (Delete)"><Trash2 size={18} aria-hidden="true" /></button>
          {hasUnderlay && (
            <button type="button" className="p3-icon-btn" onClick={() => onUnderlayChange({ ...underlay, visible: !underlay.visible })} aria-pressed={underlay.visible} aria-label="Показать подложку" title="Подложка: показать или скрыть">
              {underlay.visible ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <div
        ref={boxRef}
        className="p3-canvas"
        data-tool={tool}
        data-underlay={hasUnderlay && underlay.visible ? '1' : undefined}
        data-walls={shown.walls.length}
        data-openings={shown.openings.length}
        data-zoom={view.zoom.toFixed(3)} data-cx={view.cx.toFixed(3)} data-cy={view.cy.toFixed(3)}
        tabIndex={0}
        role="application"
        aria-label="План этажа. Стрелки двигают план, плюс и минус меняют масштаб."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => { if (!gesture.current.mode) setCursor(null); }}
        onKeyDown={onKeyDown}
        translate="no"
      >
        <svg width={size.w} height={size.h} aria-hidden="true">
          {hasUnderlay && underlay.visible && (
            <image
              href={underlay.src}
              x={SX(underlay.x)} y={SY(underlay.y + underlay.h)}
              width={underlay.w * view.zoom} height={underlay.h * view.zoom}
              opacity={underlay.opacity} preserveAspectRatio="none"
            />
          )}
          <g className="p3-grid">
            {grid.xs.map((x) => <line key={`x${x}`} x1={SX(x)} y1={0} x2={SX(x)} y2={size.h} data-major={Math.abs(x / (grid.step * 5) - Math.round(x / (grid.step * 5))) < 1e-6 || undefined} />)}
            {grid.ys.map((y) => <line key={`y${y}`} x1={0} y1={SY(y)} x2={size.w} y2={SY(y)} data-major={Math.abs(y / (grid.step * 5) - Math.round(y / (grid.step * 5))) < 1e-6 || undefined} />)}
          </g>
          <g className="p3-rooms">
            {prim.rooms.map((r, i) => <polygon key={i} points={pts(r.polygon)} />)}
          </g>
          <g className="p3-walls">
            {prim.polys.map((poly, i) => <polygon key={i} points={pts(poly)} />)}
          </g>
          <g className="p3-openings">
            {prim.windows.map((w, i) => w.map(([a, b], k) => <line key={`${i}-${k}`} x1={SX(a.x)} y1={SY(a.y)} x2={SX(b.x)} y2={SY(b.y)} />))}
            {prim.doors.map((d, i) => {
              const end = { x: d.arc.cx + d.arc.r * Math.cos(d.arc.from), y: d.arc.cy + d.arc.r * Math.sin(d.arc.from) };
              const rr = d.arc.r * view.zoom;
              return (
                <g key={i}>
                  <line x1={SX(d.leaf[0].x)} y1={SY(d.leaf[0].y)} x2={SX(d.leaf[1].x)} y2={SY(d.leaf[1].y)} />
                  <path d={`M ${SX(end.x)} ${SY(end.y)} A ${rr} ${rr} 0 0 0 ${SX(d.leaf[1].x)} ${SY(d.leaf[1].y)}`} className="p3-door-arc" />
                </g>
              );
            })}
          </g>
          {prim.rooms.map((r, i) => (Math.sqrt(r.area) * view.zoom > 70 ? (
            <text key={i} className="p3-room-label" x={SX(r.center.x)} y={SY(r.center.y)} textAnchor="middle" dominantBaseline="middle">
              {r.netArea.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} м²
            </text>
          ) : null))}
          {anchors && [['A', anchors.a], ['B', anchors.b]].map(([name, p]) => (
            <g key={name} className="p3-anchor" data-point={name}>
              <circle cx={SX(p.x)} cy={SY(p.y)} r={9} />
              <text x={SX(p.x)} y={SY(p.y)} textAnchor="middle" dominantBaseline="central">{name}</text>
            </g>
          ))}
          {selWall && (
            <g className="p3-selected">
              <line x1={SX(selWall.ax)} y1={SY(selWall.ay)} x2={SX(selWall.bx)} y2={SY(selWall.by)} />
              <circle cx={SX(selWall.ax)} cy={SY(selWall.ay)} r={8} />
              <circle cx={SX(selWall.bx)} cy={SY(selWall.by)} r={8} />
              <text x={(SX(selWall.ax) + SX(selWall.bx)) / 2} y={(SY(selWall.ay) + SY(selWall.by)) / 2 - 12} textAnchor="middle">{fmtM(wallLength(selWall))}</text>
            </g>
          )}
          {selOpening && selOpeningWall && (() => {
            const len = wallLength(selOpeningWall);
            const ux = (selOpeningWall.bx - selOpeningWall.ax) / len;
            const uy = (selOpeningWall.by - selOpeningWall.ay) / len;
            const a = { x: selOpeningWall.ax + ux * (selOpening.at - selOpening.w / 2), y: selOpeningWall.ay + uy * (selOpening.at - selOpening.w / 2) };
            const b = { x: selOpeningWall.ax + ux * (selOpening.at + selOpening.w / 2), y: selOpeningWall.ay + uy * (selOpening.at + selOpening.w / 2) };
            return <g className="p3-selected p3-selected--opening"><line x1={SX(a.x)} y1={SY(a.y)} x2={SX(b.x)} y2={SY(b.y)} /></g>;
          })()}
          {rubber && (
            <g className="p3-rubber">
              <line x1={SX(rubber.a.x)} y1={SY(rubber.a.y)} x2={SX(rubber.b.x)} y2={SY(rubber.b.y)} style={{ strokeWidth: Math.max(2, wallThickness * view.zoom) }} />
              <text x={SX(rubber.b.x) + 14} y={SY(rubber.b.y) - 14}>{fmtM(rubber.len)}</text>
            </g>
          )}
          {tool === 'wall' && chain && <circle className="p3-chain-start" cx={SX(chain.x)} cy={SY(chain.y)} r={6} />}
          {cursor && (cursor.kind === 'end' || cursor.kind === 'axis') && <circle className="p3-snap" cx={SX(cursor.x)} cy={SY(cursor.y)} r={10} />}
          {scaleLine && (
            <g className="p3-scale-line">
              <line x1={SX(scaleLine[0].x)} y1={SY(scaleLine[0].y)} x2={SX(scaleLine[1].x)} y2={SY(scaleLine[1].y)} />
              {scaleLine.map((p, i) => <circle key={i} cx={SX(p.x)} cy={SY(p.y)} r={6} />)}
            </g>
          )}
        </svg>

        {floor.walls.length === 0 && tool !== 'wall' && !hasUnderlay && (
          <p className="p3-canvas-empty">На этом этаже пока нет стен. Выберите «Стена» и начертите их или загрузите чертёж.</p>
        )}

        <div className="p3-zoom" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className="p3-icon-btn" onClick={() => zoomBy(1.25)} aria-label="Крупнее"><ZoomIn size={18} aria-hidden="true" /></button>
          <button type="button" className="p3-icon-btn" onClick={() => zoomBy(0.8)} aria-label="Мельче"><ZoomOut size={18} aria-hidden="true" /></button>
          <button type="button" className="p3-icon-btn" onClick={fit} aria-label="Показать весь план"><Maximize size={18} aria-hidden="true" /></button>
        </div>

        {tool === 'scale' && scalePts.length === 2 && (
          <form className="p3-scale-form" onPointerDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); applyScale(); }}>
            <label htmlFor="p3-scale-input">Расстояние между точками, м</label>
            <input id="p3-scale-input" type="text" inputMode="decimal" autoFocus value={scaleValue} onChange={(e) => setScaleValue(e.target.value)} placeholder="например 6,4" />
            <button type="submit" className="p3-icon-btn p3-icon-btn--gold" aria-label="Применить масштаб" disabled={!(parseFloat(String(scaleValue).replace(',', '.')) > 0)}><Check size={18} aria-hidden="true" /></button>
            <button type="button" className="p3-icon-btn" aria-label="Отменить" onClick={() => { setScalePts([]); setScaleValue(''); }}><X size={18} aria-hidden="true" /></button>
          </form>
        )}
      </div>

      <div className="p3-status">
        <p className="p3-hint" aria-live="polite"><b>{activeTool.label}.</b> {hint}</p>
        {hasUnderlay && underlay.visible && (
          <label className="p3-opacity">
            <span>Подложка</span>
            <input type="range" min="0.15" max="1" step="0.05" value={underlay.opacity} onChange={(e) => onUnderlayChange({ ...underlay, opacity: Number(e.target.value) })} aria-label="Яркость подложки" />
          </label>
        )}
      </div>
    </div>
  );
});

export default PlanEditor;
