import React, { lazy, Suspense, useState } from 'react';
import { HANGAR } from './vipSchedule';
import '../VipWorksBoard.css';

// Модель нашего сооружения — ангара — без работ: для мест, где нужно показать само здание.
// HangarCap — общий заголовок модели (название, размеры, переключатель «с обшивкой / каркас»).

const Hangar3D = lazy(() => import('./Hangar3D')); // three.js грузится только когда модель на экране

export function HangarCap({ skin, onSkin }) {
  return (
    <div className="vob-model-cap">
      <div className="vwb-seg vob-skin" role="group" aria-label="Вид модели">
        <button type="button" className={skin ? 'active' : ''} aria-pressed={skin} onClick={() => onSkin(true)}>С обшивкой</button>
        <button type="button" className={!skin ? 'active' : ''} aria-pressed={!skin} onClick={() => onSkin(false)}>Каркас</button>
      </div>
      <b>{`Ангар ${HANGAR.width} × ${HANGAR.length} м`}</b>
      <span>{`стены ${HANGAR.eave} м · конёк ${HANGAR.ridge} м · выступ пола +${HANGAR.step.height} м · стальной каркас`}</span>
    </div>
  );
}

export default function HangarPreview({ height = 380 }) {
  const [skin, setSkin] = useState(true);
  return (
    <div className="vob-model-3d vob-preview">
      <HangarCap skin={skin} onSkin={setSkin} />
      <Suspense fallback={<div className="vob-3d vob-3d-wait" style={{ height }} role="status">Загружаем модель ангара…</div>}>
        <Hangar3D items={[]} skin={skin} height={height} />
      </Suspense>
      <p className="vob-model-note">Модель вращается пальцем или мышью. Расположение внутри здания показано схемой.</p>
    </div>
  );
}
