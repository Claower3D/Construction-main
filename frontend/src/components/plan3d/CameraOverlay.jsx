import React, { useEffect, useRef, useState } from 'react';
import { X, Move, Layers, Camera, Maximize, RotateCcw, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlertTriangle, Compass } from 'lucide-react';
import { fmt } from './Plan3DPanels';

const LAYERS = [['wall', 'Стены'], ['slab', 'Перекрытия'], ['glass', 'Остекление']];

function scaleLabel(scale) {
  if (Math.abs(scale - 1) < 0.005) return 'Натуральная величина';
  return scale < 1 ? `Уменьшено в ${fmt(1 / scale, 1)} раза` : `Увеличено в ${fmt(scale, 1)} раза`;
}

/** Модель поверх живой картинки с камеры. Занимает весь экран; закрывается крестиком. */
export default function CameraOverlay({ project, name, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctrl = useRef(null);
  const gesture = useRef({ pointers: new Map() });
  const hold = useRef(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(null); // 'move' | 'layers' | null
  const [flash, setFlash] = useState('');

  useEffect(() => {
    let alive = true;
    let controller = null;
    (async () => {
      try {
        const { startCameraOverlay } = await import('../../plan3d/cameraOverlay.js');
        controller = await startCameraOverlay({ project, video: videoRef.current, canvas: canvasRef.current, onState: (s) => { if (alive) setState(s); }, cancelled: () => !alive });
        if (!alive) { controller.dispose(); return; }
        ctrl.current = controller;
        setState(controller.getState());
      } catch (e) {
        if (!alive || e?.name === 'AbortError') return;
        const n = e?.name;
        setError(
          n === 'NotAllowedError' || n === 'SecurityError' ? 'Нет доступа к камере. Разрешите камеру для этого сайта в настройках браузера и откройте режим снова.'
            : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'На этом устройстве не нашлось камеры.'
              : n === 'NotReadableError' ? 'Камера занята другим приложением. Закройте его и откройте режим снова.'
                : n === 'NotSupportedError' ? 'Браузер не даёт доступ к камере. Откройте сайт по защищённому адресу https в Chrome или Safari.'
                  : 'Не удалось включить камеру. Попробуйте ещё раз.',
        );
      }
    })();
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      clearInterval(hold.current);
      controller?.dispose();
      ctrl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── жесты: один палец двигает модель, два — масштаб и поворот ──────────────
  const onPointerDown = (e) => {
    const g = gesture.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      g.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    setPanel(null);
  };
  const onPointerMove = (e) => {
    const g = gesture.current;
    const prev = g.pointers.get(e.pointerId);
    if (!prev || !ctrl.current) return;
    const cur = { x: e.clientX, y: e.clientY };
    g.pointers.set(e.pointerId, cur);
    if (g.pointers.size === 1) {
      ctrl.current.drag(cur.x - prev.x, cur.y - prev.y);
    } else if (g.pointers.size === 2 && g.pinch) {
      const [a, b] = [...g.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (g.pinch.dist > 0) ctrl.current.zoom(dist / g.pinch.dist);
      ctrl.current.rotate((-(angle - g.pinch.angle) * 180) / Math.PI);
      g.pinch = { dist, angle };
    }
  };
  const onPointerEnd = (e) => {
    const g = gesture.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size < 2) g.pinch = null;
  };
  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => { e.preventDefault(); ctrl.current?.zoom(Math.exp(-e.deltaY * 0.001)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const repeat = (fn) => ({
    onPointerDown: (e) => { e.preventDefault(); fn(); clearInterval(hold.current); hold.current = setInterval(fn, 110); },
    onPointerUp: () => clearInterval(hold.current),
    onPointerLeave: () => clearInterval(hold.current),
    onPointerCancel: () => clearInterval(hold.current),
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } },
  });

  const c = ctrl.current;
  const step = state ? Math.max(0.1, Math.round(state.distance * 2) / 100) : 0.2; // шаг сдвига растёт с дальностью

  const enableMotion = async () => {
    const res = await c.enableMotion();
    if (res === 'denied') setFlash('Доступ к датчикам запрещён. Модель можно двигать пальцем.');
    else if (res !== 'on') setFlash('Датчики поворота пока молчат. Поверните телефон — если модель не поедет, двигайте её пальцем.');
    setTimeout(() => setFlash(''), 5000);
  };

  const takeShot = async () => {
    try {
      const blob = await c.snapshot();
      const { download, fileSlug } = await import('../../plan3d/exporters3d.js');
      download(blob, `${fileSlug(name)}_на_площадке.jpg`);
      setFlash('Снимок сохранён в загрузки.');
    } catch {
      setFlash('Не удалось сделать снимок.');
    }
    setTimeout(() => setFlash(''), 4000);
  };

  return (
    <div className="p3-cam" role="dialog" aria-modal="true" aria-label="Модель поверх камеры" data-ready={state?.ready ? '1' : '0'} data-motion={state?.motion || 'off'}
      data-scale={state ? state.scale.toFixed(4) : ''} data-distance={state ? state.distance.toFixed(2) : ''}>
      <video ref={videoRef} className="p3-cam-video" playsInline muted aria-hidden="true" />
      <canvas
        ref={canvasRef} className="p3-cam-canvas"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
        aria-label="Модель здания поверх изображения с камеры. Двигайте пальцем; двумя пальцами — масштаб и поворот." role="img"
      />

      <div className="p3-cam-top">
        <div className="p3-cam-msg" role="status">
          {error ? (
            <p><AlertTriangle size={18} aria-hidden="true" /> {error}</p>
          ) : !state?.ready ? (
            <p>Включаем камеру…</p>
          ) : (
            <>
              <p className="p3-cam-title">{scaleLabel(state.scale)} · до модели {fmt(state.distance, 1)} м</p>
              <p>{flash || (state.motion === 'on' ? 'Поворачивайте телефон — модель стоит на месте. Пальцем её можно подвинуть, двумя — повернуть и изменить размер.' : 'Двигайте модель пальцем; двумя пальцами — поворот и размер.')}</p>
            </>
          )}
        </div>
        <button type="button" className="p3-cam-round" onClick={onClose} aria-label="Закрыть камеру"><X size={22} aria-hidden="true" /></button>
      </div>

      {state?.ready && !error && (
        <div className="p3-cam-bottom">
          {panel === 'move' && (
            <div className="p3-cam-panel" role="group" aria-label="Положение модели">
              <div className="p3-cam-row">
                <button type="button" className="p3-cam-key" aria-label="Повернуть влево" {...repeat(() => c.rotate(3))}><RotateCcw size={20} aria-hidden="true" /></button>
                <button type="button" className="p3-cam-key" aria-label="Сдвинуть влево" {...repeat(() => c.nudge(-step, 0))}><ArrowLeft size={20} aria-hidden="true" /></button>
                <button type="button" className="p3-cam-key" aria-label="Дальше от себя" {...repeat(() => c.nudge(0, step * 2))}><ArrowUp size={20} aria-hidden="true" /></button>
                <button type="button" className="p3-cam-key" aria-label="Ближе к себе" {...repeat(() => c.nudge(0, -step * 2))}><ArrowDown size={20} aria-hidden="true" /></button>
                <button type="button" className="p3-cam-key" aria-label="Сдвинуть вправо" {...repeat(() => c.nudge(step, 0))}><ArrowRight size={20} aria-hidden="true" /></button>
                <button type="button" className="p3-cam-key" aria-label="Повернуть вправо" {...repeat(() => c.rotate(-3))}><RotateCw size={20} aria-hidden="true" /></button>
              </div>
              <div className="p3-cam-row">
                <button type="button" className="p3-cam-key" {...repeat(() => c.lift(0.1))}>Выше</button>
                <button type="button" className="p3-cam-key" {...repeat(() => c.lift(-0.1))}>Ниже</button>
                <button type="button" className="p3-cam-key" aria-label="Уменьшить модель" {...repeat(() => c.zoom(0.95))}>−</button>
                <button type="button" className="p3-cam-key" aria-pressed={Math.abs(state.scale - 1) < 0.005} onClick={() => c.setScale(1)}>1:1</button>
                <button type="button" className="p3-cam-key" aria-label="Увеличить модель" {...repeat(() => c.zoom(1.05))}>+</button>
              </div>
              {state.motion !== 'on' && (
                <button type="button" className="p3-cam-key p3-cam-key--wide" onClick={enableMotion}><Compass size={20} aria-hidden="true" />Держать модель на месте при повороте телефона</button>
              )}
            </div>
          )}
          {panel === 'layers' && (
            <div className="p3-cam-panel" role="group" aria-label="Слои модели">
              <div className="p3-cam-row">
                {LAYERS.map(([k, label]) => (
                  <button key={k} type="button" className="p3-cam-key" aria-pressed={state.layers[k]} onClick={() => c.setLayers({ [k]: !state.layers[k] })}>{label}</button>
                ))}
              </div>
              {project.floors.length > 1 && (
                <div className="p3-cam-row">
                  <button type="button" className="p3-cam-key" aria-label="Показать на этаж меньше" disabled={state.levels <= 1} onClick={() => c.setLevels(state.levels - 1)}>−</button>
                  <span className="p3-cam-label">Этажей: {state.levels} из {project.floors.length}</span>
                  <button type="button" className="p3-cam-key" aria-label="Показать на этаж больше" disabled={state.levels >= project.floors.length} onClick={() => c.setLevels(state.levels + 1)}>+</button>
                </div>
              )}
              <label className="p3-cam-slider">
                <span>Прозрачность</span>
                <input type="range" min="0.1" max="1" step="0.05" value={state.opacity} onChange={(e) => c.setOpacity(Number(e.target.value))} aria-label="Плотность заливки модели" />
              </label>
            </div>
          )}
          <div className="p3-cam-bar" role="toolbar" aria-label="Управление моделью">
            <button type="button" className="p3-cam-tool" aria-pressed={panel === 'move'} onClick={() => setPanel(panel === 'move' ? null : 'move')}><Move size={22} aria-hidden="true" /><span>Положение</span></button>
            <button type="button" className="p3-cam-tool" aria-pressed={panel === 'layers'} onClick={() => setPanel(panel === 'layers' ? null : 'layers')}><Layers size={22} aria-hidden="true" /><span>Слои</span></button>
            <button type="button" className="p3-cam-tool" onClick={takeShot}><Camera size={22} aria-hidden="true" /><span>Снимок</span></button>
            <button type="button" className="p3-cam-tool" onClick={() => { c.fit(); setPanel(null); }}><Maximize size={22} aria-hidden="true" /><span>Вписать</span></button>
          </div>
        </div>
      )}
    </div>
  );
}
