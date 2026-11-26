import React, { useRef, useState } from 'react';
import { initials, nameHue } from './vipSchedule';
import { uploadMedia, mediaProblem } from '../../services/vipApi';

// Картинки модуля «Строительство зданий»: фото и кружок с инициалами у людей, рисунки техники
// по подгруппам, значки видов работ. Рисунки одноцветные и приглушённые: с телефона сразу видно,
// что это за машина или работа, читать подпись не нужно.

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const wheel = (cx, cy = 33, r = 4) => <><circle cx={cx} cy={cy} r={r} {...S} /><circle cx={cx} cy={cy} r={0.8} fill="currentColor" /></>;

const MACHINE_ART = {
  crane: (
    <>
      <path d="M6 29h42v-7H30v-6h-9l-4 6H6z" {...S} />
      <path d="M30 22 58 5" {...S} strokeWidth={3} />
      <path d="M58 5v12m-2 0h4m-2 0v3a2 2 0 1 1-2-2" {...S} strokeWidth={1.6} />
      <path d="M21 16v6" {...S} />
      {wheel(14)}{wheel(34)}{wheel(43)}
    </>
  ),
  manipulator: (
    <>
      <path d="M4 29h54v-5H22v-9h-9l-5 7H4z" {...S} />
      <path d="M26 24V9l16 6-6 9" {...S} strokeWidth={2.6} />
      <path d="M42 15v5m-2 0h4" {...S} strokeWidth={1.6} />
      <path d="M44 24v-6h12v6" {...S} strokeWidth={1.6} />
      {wheel(13)}{wheel(40)}{wheel(50)}
    </>
  ),
  lift: (
    <>
      <path d="M5 29h46v-7H24v-7h-9l-5 7H5z" {...S} />
      <path d="M30 22 50 8" {...S} strokeWidth={3} />
      <path d="M46 3h10v8H46z" {...S} />
      <path d="M51 3V0" {...S} strokeWidth={1.4} />
      {wheel(14)}{wheel(40)}
    </>
  ),
  truck: (
    <>
      <path d="M4 29h14V15h-8l-6 8z" {...S} />
      <path d="M20 29h38l-3-17H22z" {...S} />
      <path d="M8 22h6" {...S} strokeWidth={1.6} />
      {wheel(12)}{wheel(36)}{wheel(48)}
    </>
  ),
  earth: (
    <>
      <path d="M6 30h30a4 4 0 0 1 0 8H6a4 4 0 0 1 0-8z" {...S} />
      <path d="M10 30V18h14l4 12" {...S} />
      <path d="M24 20 40 6l12 12" {...S} strokeWidth={2.8} />
      <path d="M52 18l6 8-9 2z" {...S} />
      <circle cx="10" cy="34" r="1.4" fill="currentColor" /><circle cx="21" cy="34" r="1.4" fill="currentColor" /><circle cx="32" cy="34" r="1.4" fill="currentColor" />
    </>
  ),
  other: (
    <>
      <rect x="10" y="12" width="44" height="20" rx="3" {...S} />
      <path d="M18 32v5m28-5v5M14 37h36" {...S} />
      <path d="M33 16l-6 8h8l-5 6" {...S} strokeWidth={1.8} />
      <circle cx="46" cy="19" r="2" {...S} strokeWidth={1.6} />
    </>
  ),
};

/** Рисунок техники по подгруппе */
export function MachineArt({ group = 'other', className = '' }) {
  return <svg className={className} viewBox="0 0 64 40" aria-hidden="true" focusable="false">{MACHINE_ART[group] || MACHINE_ART.other}</svg>;
}

const WORK_ART = {
  steel: <><path d="M5 27V11l11-6 11 6v16" {...S} /><path d="M5 11h22M5 19h22M5 11l11 8 11-8" {...S} strokeWidth={1.4} /></>,
  roof: <><path d="M3 17 16 6l13 11" {...S} strokeWidth={2.6} /><path d="M7 15v11h18V15" {...S} /><path d="M11 12l-4 4m9-8-4 4m9 0-4 4" {...S} strokeWidth={1.2} /></>,
  walls: <><rect x="5" y="6" width="22" height="20" {...S} /><path d="M12.3 6v20M19.6 6v20" {...S} strokeWidth={1.4} /></>,
  concrete: <><path d="M4 22h24v5H4z" {...S} /><path d="M8 22v-6m5 6v-9m6 9v-9m5 9v-6M6 16h20" {...S} strokeWidth={1.4} /></>,
  floor: <><path d="M4 24 10 12h12l6 12z" {...S} /><path d="M7 18h18M16 12v12M11.5 12 9 24m11.5-12L23 24" {...S} strokeWidth={1.2} /></>,
  earth: <><path d="M3 26c4-8 8-10 12-4 3-5 7-5 14 4z" {...S} /><path d="M20 4v10m-3 0h6l-1 5h-4z" {...S} strokeWidth={1.6} /></>,
  drain: <><path d="M4 10h14a5 5 0 0 1 5 5v3" {...S} strokeWidth={3} /><path d="M23 21c-2 3-3 4-3 6a3 3 0 0 0 6 0c0-2-1-3-3-6z" {...S} strokeWidth={1.6} /></>,
  electric: <path d="M18 3 7 18h8l-2 11 12-16h-8z" {...S} />,
  vent: <><circle cx="16" cy="16" r="11" {...S} /><circle cx="16" cy="16" r="2" fill="currentColor" /><path d="M16 14c0-5 5-7 6-3s-3 4-6 5m0 0c-5 0-7 5-3 6s4-3 5-6m-2 0c-5-1-7-6-3-7s5 3 5 7" {...S} strokeWidth={1.3} /></>,
  cut: <><circle cx="14" cy="17" r="9" {...S} /><circle cx="14" cy="17" r="2" fill="currentColor" /><path d="M14 8l2-3m5 7 3-2m-1 9 4 1M5 27h22" {...S} strokeWidth={1.4} /></>,
  weld: <><path d="M4 26 17 13" {...S} strokeWidth={3} /><path d="M21 4v5m6 2h-5m3-6-3 3m5 9-4-2m-6-9 2 4" {...S} strokeWidth={1.5} /></>,
  paint: <><rect x="5" y="5" width="18" height="8" rx="2" {...S} /><path d="M23 9h4v7H15v4" {...S} strokeWidth={1.6} /><rect x="13" y="20" width="4" height="8" rx="1" {...S} /></>,
  doors: <><path d="M5 27V8a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v19" {...S} /><path d="M9 11h14M9 15h14M9 19h14M9 23h14" {...S} strokeWidth={1.3} /></>,
  lift: <><path d="M16 3v9" {...S} /><circle cx="16" cy="14" r="2.4" {...S} strokeWidth={1.6} /><path d="M16 17v3a5 5 0 1 1-5-5" {...S} strokeWidth={2.4} /></>,
  other: <><path d="M20 5a6 6 0 0 0-7 8L4 22l3 3 9-9a6 6 0 0 0 8-7l-4 4-3-3z" {...S} /></>,
};

/** Значок вида работ */
export function WorkArt({ kind = 'other', className = '' }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">{WORK_ART[kind] || WORK_ART.other}</svg>;
}

/** Фото человека; пока фото нет — кружок с инициалами постоянного цвета */
export function Avatar({ person, size = 36 }) {
  const name = (person && person.name) || '';
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (person && person.photo) return <img className="vv-avatar" style={style} src={person.photo} alt={name} loading="lazy" />;
  return <span className="vv-avatar vv-initials" translate="no" style={{ ...style, background: `hsl(${nameHue(name)} 42% 38%)` }} aria-hidden="true">{initials(name)}</span>;
}

/** Картинка техники: её фото или рисунок подгруппы */
export function MachinePic({ machine, group, className = '' }) {
  if (machine && machine.photo) return <img className={`vv-machine ${className}`} src={machine.photo} alt={machine.name || 'Техника'} loading="lazy" />;
  return <span className={`vv-machine vv-machine-art ${className}`}><MachineArt group={group} /></span>;
}

/**
 * Выбор одного фото с загрузкой на сервер. value — ссылка или '', onChange(url).
 * children — что показывать как текущую картинку (аватар или рисунок техники).
 */
export function PhotoPicker({ value, onChange, children, label = 'Фото' }) {
  const ref = useRef(null);
  const [state, setState] = useState({ busy: false, pct: 0, error: '' });
  const pick = async (file) => {
    if (!file) return;
    const problem = mediaProblem(file);
    if (problem || !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) { setState({ busy: false, pct: 0, error: problem || 'нужна фотография: JPG, PNG, WEBP или HEIC' }); return; }
    setState({ busy: true, pct: 0, error: '' });
    try {
      const res = await uploadMedia(file, (pct) => setState((s) => ({ ...s, pct })));
      onChange(res.url);
      setState({ busy: false, pct: 1, error: '' });
    } catch (e) {
      setState({ busy: false, pct: 0, error: e.message || 'не загрузилось' });
    }
  };
  return (
    <div className="vv-photo-pick">
      <div className="vv-photo-now">{children}</div>
      <div className="vv-photo-btns">
        <span className="vwb-label">{label}</span>
        <button type="button" className="vip-secondary-btn" disabled={state.busy} onClick={() => ref.current && ref.current.click()}>
          {state.busy ? `Загрузка ${Math.round(state.pct * 100)}%` : value ? 'Заменить фото' : 'Добавить фото'}
        </button>
        {value && !state.busy && <button type="button" className="vwb-link" onClick={() => onChange('')}>убрать фото</button>}
        {state.error && <span className="vwb-err" role="alert">Фото не загружено: {state.error}</span>}
        <input ref={ref} type="file" accept="image/*,.heic" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; pick(f); }} />
      </div>
    </div>
  );
}
