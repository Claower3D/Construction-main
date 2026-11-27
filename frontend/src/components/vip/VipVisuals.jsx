import React, { useRef, useState } from 'react';
import { initials, nameHue } from './vipSchedule';
import { uploadMedia, mediaProblem, fileUrl } from '../../services/vipApi';

// Картинки модуля «Строительство зданий»: фото и кружок с инициалами у людей, рисунки техники
// по подгруппам, значки видов работ. Рисунки одноцветные и приглушённые: с телефона сразу видно,
// что это за машина или работа, читать подпись не нужно.

// Значки двухцветные: контур и полупрозрачная заливка того же цвета — читаются и мелко, и крупно.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const F = { ...S, fill: 'currentColor', fillOpacity: 0.2 }; // залитая деталь
const T = { ...S, strokeWidth: 1.3 }; // тонкая линия
const wheel = (cx, cy = 31.5, r = 4.3) => <g key={cx}><circle cx={cx} cy={cy} r={r} {...S} fill="currentColor" fillOpacity={0.35} /><circle cx={cx} cy={cy} r={1.1} fill="currentColor" /></g>;
const cab = <><path d="M5 26v-8a2 2 0 0 1 2-2h8l4 5v5z" {...F} /><path d="M8.5 18.5h5.6l2.4 3H8.5z" {...T} /></>;

const MACHINE_ART = {
  // автокран: шасси, поворотная платформа, телескопическая стрела с крюком, выносные опоры
  crane: (
    <>
      {cab}
      <path d="M19 22h39v4H19z" {...F} />
      <path d="M27 22v-6h9v6" {...F} />
      <path d="M31 17 59 4" {...S} strokeWidth={4.2} />
      <path d="M31 17 59 4" stroke="var(--vv-ink, #1b1330)" strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
      <path d="M59 4v10" {...T} />
      <path d="M59 14v2.2a2 2 0 1 1-2-2" {...S} strokeWidth={1.6} />
      <path d="M22 26v8m-3 0h6M54 26v8m-3 0h6" {...T} />
      {[12, 38, 47].map((x) => wheel(x))}
    </>
  ),
  // манипулятор: бортовая платформа и складная стрела за кабиной
  manipulator: (
    <>
      {cab}
      <path d="M21 26v-3h39v3z" {...F} />
      <path d="M21 23v-3M60 23v-4" {...S} />
      <path d="M25 22V9l15-4 9 9" {...S} strokeWidth={3} />
      <circle cx="25" cy="9" r="1.7" fill="currentColor" /><circle cx="40" cy="5" r="1.7" fill="currentColor" />
      <path d="M49 14v3" {...T} />
      <path d="M44.5 17h9v6h-9z" {...F} />
      <path d="M44.5 20h9" {...T} />
      {[12, 42, 52].map((x) => wheel(x))}
    </>
  ),
  // автовышка: стрела с люлькой
  lift: (
    <>
      {cab}
      <path d="M19 22h38v4H19z" {...F} />
      <path d="M26 22v-4h8v4" {...F} />
      <path d="M30 19 52 9" {...S} strokeWidth={3.6} />
      <path d="M49 2.5h10v7.5H49z" {...F} />
      <path d="M49 5.5h10M54 2.5v-1.5" {...T} />
      <circle cx="54" cy="1.6" r="1.4" fill="currentColor" />
      <path d="M22 26v8m-3 0h6M53 26v8m-3 0h6" {...T} />
      {[12, 44].map((x) => wheel(x))}
    </>
  ),
  // грузовой автомобиль с кузовом
  truck: (
    <>
      {cab}
      <path d="M21 10h38a1 1 0 0 1 1 1v15H21z" {...F} />
      <path d="M29 10v16M37 10v16M45 10v16M53 10v16" {...T} opacity={0.7} />
      <path d="M4 26h56" {...S} />
      {[12, 40, 50].map((x) => wheel(x))}
    </>
  ),
  // экскаватор: гусеницы, кабина, стрела с ковшом
  earth: (
    <>
      <path d="M8 28h30a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8z" {...F} />
      {[10, 17, 24, 31, 37].map((x) => <circle key={x} cx={x} cy={32} r={1.5} fill="currentColor" />)}
      <path d="M11 28V15h12l5 6v7z" {...F} />
      <path d="M14 17.5h7.5l3 3.5H14z" {...T} />
      <path d="M26 19 41 5l11 11" {...S} strokeWidth={3.4} />
      <circle cx="41" cy="5" r="1.8" fill="currentColor" />
      <path d="M52 14l7 5-3 6-8-3z" {...F} />
      <path d="M48 22l-1.5 3m4-2-1 3m4.5-2-.8 2.8" {...T} />
    </>
  ),
  // прочая техника: передвижной генератор или компрессор
  other: (
    <>
      <path d="M10 10h40a3 3 0 0 1 3 3v15H7V13a3 3 0 0 1 3-3z" {...F} />
      <path d="M53 24h8M61 22v4" {...S} />
      <path d="M31 13l-6 8h7l-4 6" {...S} />
      <path d="M12 14.5h8M12 18h8M42 14.5h7M42 18h7M42 21.5h7" {...T} />
      <path d="M5 28h50" {...S} />
      {[18, 42].map((x) => wheel(x, 32, 3.8))}
    </>
  ),
};

/** Рисунок техники по подгруппе */
export function MachineArt({ group = 'other', className = '' }) {
  return <svg className={className} viewBox="0 0 64 40" aria-hidden="true" focusable="false">{MACHINE_ART[group] || MACHINE_ART.other}</svg>;
}

// зубья пильного диска
const SAW = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, b = a + 0.2, c = a + 0.52;
  const pt = (ang, r) => `${(15 + Math.cos(ang) * r).toFixed(1)} ${(16 + Math.sin(ang) * r).toFixed(1)}`;
  return `${i ? 'L' : 'M'}${pt(a, 8.2)}L${pt(b, 11)}L${pt(c, 8.2)}`;
}).join('') + 'z';

const WORK_ART = {
  // рама ангара: колонны, стропила, затяжка
  steel: <><path d="M4 13 16 5l12 8" {...F} /><path d="M4 13v15M28 13v15M4 13h24M2 28h28" {...S} /><path d="M12 13v15M20 13v15M10 9v4M22 9v4M16 5v8" {...T} /></>,
  // лестничный марш с перилами
  stairs: <><path d="M3 28v-5h6v-5h6v-5h6V8h8v20z" {...F} /><path d="M5 16 22 3M5 16v7M13.5 9.5v6M22 3v5" {...T} /></>,
  // скатная кровля из профлиста
  roof: <><path d="M2 16 16 5l14 11-3 2.4L16 9.6 5 18.4z" {...F} /><path d="M7 17v10h18V17" {...S} /><path d="M9 12.5 16 7l7 5.5M13 27v-6h6v6" {...T} /></>,
  // стеновая панель
  walls: <><path d="M4 5h24v20H4z" {...F} /><path d="M10 5v20M16 5v20M22 5v20" {...T} /><path d="M2 28h28M4 25v3M28 25v3" {...S} /></>,
  // бадья льёт бетон в опалубку
  concrete: <><path d="M11 4h10l-2 8h-6z" {...F} /><path d="M9 4h14M16 12v2.5M13 15.5v1.5M19 15.5v1.5" {...S} /><path d="M4 20v8h24v-8" {...S} /><path d="M6.5 22.5h19V26h-19z" {...F} strokeWidth={0} /><path d="M10 20v8M16 20v8M22 20v8" {...T} opacity={0.75} /></>,
  // пол: плитка в перспективе
  floor: <><path d="M9 9h14l6 16H3z" {...F} /><path d="M7 14.3h18M5 19.7h22M16 9v16M12.3 9 9.5 25M19.7 9l2.8 16" {...T} /></>,
  // земляные работы: лопата и грунт
  earth: <><path d="M2 28c3-7 6-9 10-6 3-6 9-6 18 6z" {...F} /><path d="M25 3l4 4M27 5 17.5 14.5" {...S} /><path d="M15 12.5l4.5 4.5-3 3.2c-2.6.6-5.3-2-4.7-4.7z" {...F} /></>,
  // вода и канализация: колено трубы с фланцами, капли
  drain: <><path d="M3 5h13a10 10 0 0 1 10 10v4h-7v-4a3 3 0 0 0-3-3H3z" {...F} /><path d="M7 3.5v10M17.5 19h10" {...S} /><path d="M22.5 22c-1.7 2.3-2.5 3.4-2.5 4.6a2.5 2.5 0 0 0 5 0c0-1.2-.8-2.3-2.5-4.6z" {...F} /></>,
  electric: <path d="M18.5 2.5 6.5 18h7.5l-2 11.5L25.5 13H17z" {...F} />,
  // отопление: радиатор и тепло от него
  heat: <><path d="M6 12h20a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1z" {...F} /><path d="M9.4 12v15M13.8 12v15M18.2 12v15M22.6 12v15M2 15h3M27 24h3" {...T} /><path d="M10 8.5c-1.4-1.6 1.4-2.6 0-4.5M16 8.5c-1.4-1.6 1.4-2.6 0-4.5M22 8.5c-1.4-1.6 1.4-2.6 0-4.5" {...S} strokeWidth={1.5} /></>,
  // вентиляция: вентилятор в коробе
  vent: <><rect x="4" y="4" width="24" height="24" rx="4" {...F} /><circle cx="16" cy="16" r="2" fill="currentColor" />{[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a} 16 16)`} d="M16 14.2c-2.2-4.2-.6-7.8 2-7.8 2.8 0 2.6 4.6-2 7.8z" {...F} fillOpacity={0.45} strokeWidth={1.4} />)}</>,
  // резка: пильный диск и искры
  cut: <><path d={SAW} {...F} strokeWidth={1.4} /><circle cx="15" cy="16" r="2.4" {...S} strokeWidth={1.5} /><path d="M27 6l2.5-2.5M28 12h3M24 3.5V1" {...T} /><path d="M2 29h28" {...S} /></>,
  // сварка: держак и вспышка дуги
  weld: <><path d="M3 28 14 17" {...S} strokeWidth={3.6} /><path d="M14 17l3.5-3.5" {...S} /><path d="M21.5 2.5l1.7 5.1 5.3 1.9-5.3 1.9-1.7 5.1-1.7-5.1-5.3-1.9 5.3-1.9z" {...F} fillOpacity={0.5} strokeWidth={1.4} /><path d="M27 18l2 2M11 5 9 3M29 3l1-1" {...T} /></>,
  paint: <><rect x="4" y="4" width="19" height="9" rx="2.5" {...F} /><path d="M23 8.5h4.5v7.5H15v4" {...S} /><rect x="12.7" y="20" width="4.6" height="9" rx="1.5" {...F} /></>,
  // ворота секционные
  doors: <><path d="M4 28V7a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v21" {...S} /><path d="M7.5 9h17v19h-17z" {...F} /><path d="M7.5 13.7h17M7.5 18.4h17M7.5 23.1h17" {...T} /><path d="M14 25.6h4" {...S} /></>,
  // подъём: блок и крюк
  lift: <><rect x="11" y="2.5" width="10" height="6.5" rx="1.5" {...F} /><path d="M16 9v4.5" {...S} /><path d="M16 13.5a2.2 2.2 0 1 1 0 4.4v1.6a5.5 5.5 0 1 1-5.5 5" {...S} strokeWidth={2.7} /></>,
  // рельсовый путь
  rails: <><path d="M12 3 7 29M20 3l5 26" {...S} strokeWidth={2.4} /><path d="M10.5 8h11M9 15h14M7.3 22h17.4M6 27.5h20" {...T} /></>,
  // прочие работы: каска
  other: <><path d="M5 21a11 11 0 0 1 22 0z" {...F} /><path d="M2.5 21h27v3.2a1.3 1.3 0 0 1-1.3 1.3H3.8a1.3 1.3 0 0 1-1.3-1.3z" {...F} fillOpacity={0.4} /><path d="M16 10v6M11.3 11.6v5.4M20.7 11.6v5.4" {...T} /></>,
};

/** Значок вида работ */
export function WorkArt({ kind = 'other', className = '' }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">{WORK_ART[kind] || WORK_ART.other}</svg>;
}

/**
 * План здания 25 × 70 м сверху: нажатие ставит место работы. value — { x, z } в метрах
 * (x от западного торца, z от северной стены) или null; shown — точка, которую сейчас показывает модель.
 * second — вторая точка той же работы (вторая лестница): { value, shown, onChange, names: [первая, вторая] }.
 */
export function PlanPicker({ value, shown, second, objects = [], length = 70, width = 25, onChange }) {
  const ref = useRef(null);
  const [which, setWhich] = useState(1);
  const two = !!second;
  const pick = (e) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = -16 + ((e.clientX - r.left) / r.width) * 102, vz = -11 + ((e.clientY - r.top) / r.height) * 47;
    const pos = { x: Math.round(Math.max(-14, Math.min(length + 14, vx)) * 2) / 2, z: Math.round(Math.max(-9, Math.min(width + 9, vz)) * 2) / 2 };
    if (two && which === 2) second.onChange(pos); else onChange(pos);
  };
  const dots = [{ n: 1, value, p: value || shown }, ...(two ? [{ n: 2, value: second.value, p: second.value || second.shown }] : [])];
  return (
    <div className="vv-plan">
      {two && (
        <div className="vwb-seg vv-plan-which" role="group" aria-label="Какую часть работы ставим на план">
          {[1, 2].map((n) => <button type="button" key={n} className={which === n ? 'active' : ''} aria-pressed={which === n} onClick={() => setWhich(n)}><i>{n}</i><span>{second.names[n - 1]}</span></button>)}
        </div>
      )}
      <svg ref={ref} viewBox="-16 -11 102 47" role="img" aria-label="План здания сверху: нажмите, чтобы указать место работы" onClick={pick}>
        <rect x="-16" y="-11" width="102" height="47" className="vv-plan-site" />
        <rect x="0" y="0" width={length} height={width} className="vv-plan-house" />
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={(i + 1) * 7} y1="0" x2={(i + 1) * 7} y2={width} className="vv-plan-axis" />)}
        {/* что стоит в здании: выступ пола, второй этаж, оборудование, конвейер */}
        {objects.map((o, i) => (o.kind === 'line'
          ? <line key={i} x1={o.x} y1={o.z} x2={o.x + o.l} y2={o.z} className="vv-plan-line" />
          : <rect key={i} x={o.x} y={o.z} width={o.l} height={o.w} className={`vv-plan-${o.kind}`} />))}
        <text x={length / 2} y="-4" textAnchor="middle">Север</text>
        <text x={length / 2} y={width + 7.5} textAnchor="middle">Юг</text>
        <text x="-8" y={width / 2 + 1.2} textAnchor="middle">Запад</text>
        <text x={length + 8} y={width / 2 + 1.2} textAnchor="middle">Восток</text>
        {objects.filter((o) => o.label).map((o, i) => (
          <text key={i} x={o.x + o.l / 2} y={o.kind === 'f2' ? o.z + o.w / 2 + 1 : o.z - 1} textAnchor="middle" className={o.kind}>{o.label}</text>
        ))}
        <rect x="-0.9" y={width / 2 - 3} width="1.8" height="6" className="vv-plan-gate" />
        <text x="2.2" y={width / 2 + 1.2} className="gate">вход</text>
        {dots.filter((d) => d.p).map((d) => (
          <g key={d.n} className={`vv-plan-dot${d.value ? '' : ' auto'}${two && which === d.n ? ' on' : ''}`}>
            <circle cx={d.p.x} cy={d.p.z} r="2.6" /><circle cx={d.p.x} cy={d.p.z} r="0.9" />
            {two && <text x={d.p.x - 3.6} y={d.p.z + 1.3} textAnchor="middle" className="num" translate="no">{d.n}</text>}
          </g>
        ))}
      </svg>
      <div className="vv-plan-foot">
        {dots.map((d) => (
          <span key={d.n}>
            {two && <b translate="no">{d.n}. </b>}
            <span>{d.value ? `Место указано: ${d.value.x} м от западного торца, ${d.value.z} м от северной стены` : 'Место подобрано по названию работы. Нажмите на план, чтобы указать точнее.'}</span>
            {d.value && <> <button type="button" className="vwb-link" onClick={() => (d.n === 2 ? second.onChange(null) : onChange(null))}>подобрать автоматически</button></>}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Фото человека; пока фото нет — кружок с инициалами постоянного цвета */
export function Avatar({ person, size = 36 }) {
  const name = (person && person.name) || '';
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (person && person.photo) return <img className="vv-avatar" style={style} src={fileUrl(person.photo)} alt={name} loading="lazy" />;
  return <span className="vv-avatar vv-initials" translate="no" style={{ ...style, background: `hsl(${nameHue(name)} 42% 38%)` }} aria-hidden="true">{initials(name)}</span>;
}

/** Картинка техники: её фото или рисунок подгруппы */
export function MachinePic({ machine, group, className = '' }) {
  if (machine && machine.photo) return <img className={`vv-machine ${className}`} src={fileUrl(machine.photo)} alt={machine.name || 'Техника'} loading="lazy" />;
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
