import React from 'react';
import { Zap, Droplets, Flame, Gauge, LayoutPanelTop } from 'lucide-react';

/*
 * Дом на первом экране: 3D-рендер (Blender Cycles), правая половина
 * переходит в светящийся чертёж той же камеры с рентгеном инженерных
 * систем (электрика, вода, отопление, канализация, газ, счётчики).
 * Исходники — tools/hero-render (house_scene.py + compose.py).
 * Координаты — проекция точек дома камерой (hero-house.json).
 */

const ASPECT = 1.6241; // ширина / высота кадра
const VB_W = 1000;
const VB_H = Math.round(VB_W / ASPECT);

// at — точка на доме, box — левый край и центр подписи (доли кадра)
const CALLOUTS = [
  { id: 'bom', label: 'Точный BOM-расчёт', at: [0.7416, 0.3549], box: [0.74, 0.12] },
  { id: 'price', label: 'Прозрачные цены 2026', at: [0.3131, 0.1033], box: [0.02, 0.03] },
  { id: 'defect', label: 'Детекция дефектов', at: [0.3142, 0.6706], box: [0.03, 0.88] },
  { id: 'export', label: 'Экспорт в PDF / Excel', at: [0.7611, 0.554], box: [0.69, 0.45] },
];
const LABEL_W = 0.2;

// узлы учёта и оборудование: точка на доме и куда вынести метку
const METERS = [
  { id: 'm_el', icon: Zap, label: 'Электросчётчик', at: [0.7649, 0.672], tag: [0.8, 0.585], sys: 'el' },
  { id: 'm_gas', icon: Flame, label: 'Газовый счётчик', at: [0.7346, 0.6942], tag: [0.8, 0.675], sys: 'gs' },
  { id: 'm_water', icon: Droplets, label: 'Водомер', at: [0.8114, 0.8278], tag: [0.83, 0.81], sys: 'cw' },
  { id: 'boiler', icon: Gauge, label: 'Котёл и коллектор', at: [0.5624, 0.6844], tag: [0.38, 0.955], sys: 'ht' },
  { id: 'panel', icon: LayoutPanelTop, label: 'Электрощит', at: [0.6099, 0.6779], tag: [0.6, 0.955], sys: 'el' },
];

export const SYSTEMS = [
  { id: 'el', name: 'Электрика', color: '#FFC34D' },
  { id: 'cw', name: 'Холодная вода', color: '#4FC3FF' },
  { id: 'hw', name: 'Горячая вода', color: '#FF5C7A' },
  { id: 'ht', name: 'Отопление и тёплый пол', color: '#FF8A3D' },
  { id: 'sw', name: 'Канализация', color: '#2EE6C5' },
  { id: 'gs', name: 'Газ', color: '#D4F25A' },
];
const COLOR = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.color]));

function leader({ at, box }) {
  const [ax, ay] = at;
  const [bx, by] = box;
  const x = ax * VB_W;
  const y = ay * VB_H;
  const ly = by * VB_H;
  if (ax >= bx && ax <= bx + LABEL_W) {
    const edge = (by + (ay > by ? 0.035 : -0.035)) * VB_H;
    return `${x},${y} ${x},${edge}`;
  }
  const ex = (ax < bx ? bx : bx + LABEL_W) * VB_W;
  return `${x},${y} ${x},${ly} ${ex},${ly}`;
}

// выноска метки счётчика: горизонтально к метке, затем по вертикали
function meterLeader({ at, tag }) {
  const x = at[0] * VB_W;
  const y = at[1] * VB_H;
  const tx = tag[0] * VB_W;
  const ty = tag[1] * VB_H;
  return `${x},${y} ${x + (tx - x) * 0.5},${y} ${x + (tx - x) * 0.5},${ty} ${tx},${ty}`;
}

export default function HeroHouse() {
  return (
    <figure className="hh" aria-label="Дом: левая половина — фотореалистичный рендер, правая — чертёж с инженерными системами: электрика, водоснабжение, отопление, канализация, газ и узлы учёта">
      <div className="hh-frame">
        <picture>
          <source media="(max-width: 700px)" srcSet="/assets/landing/hero-house-m.webp" />
          <img
            className="hh-img"
            src="/assets/landing/hero-house.webp"
            alt=""
            width="1728"
            height="1064"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
        <svg className="hh-lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
          {METERS.map((m) => (
            <g key={m.id} className="hh-meter-line">
              <polyline points={meterLeader(m)} fill="none" stroke={COLOR[m.sys]} strokeOpacity="0.75" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              <circle cx={m.at[0] * VB_W} cy={m.at[1] * VB_H} r="3.5" fill={COLOR[m.sys]} />
            </g>
          ))}
          {CALLOUTS.map((c) => (
            <g key={c.id} className="hh-callout-line">
              <polyline points={leader(c)} fill="none" stroke="#c9b6ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              <circle cx={c.at[0] * VB_W} cy={c.at[1] * VB_H} r="5" fill="#f2b84b" />
              <circle className="hh-pulse" cx={c.at[0] * VB_W} cy={c.at[1] * VB_H} r="11" fill="none" stroke="#f2b84b" strokeOpacity="0.6" />
            </g>
          ))}
        </svg>
        {CALLOUTS.map((c) => (
          <span key={c.id} className="hh-label" style={{ left: `${c.box[0] * 100}%`, top: `${c.box[1] * 100}%` }}>
            <i aria-hidden="true" />{c.label}
          </span>
        ))}
        {METERS.map(({ id, icon: Icon, label, tag, sys }) => (
          <span key={id} className="hh-tag" style={{ left: `${tag[0] * 100}%`, top: `${tag[1] * 100}%`, '--c': COLOR[sys] }}>
            <Icon size={13} aria-hidden="true" />{label}
          </span>
        ))}
      </div>
      <figcaption className="hh-legend">
        <span className="hh-legend-title">Инженерные системы</span>
        {SYSTEMS.map((s) => (
          <span key={s.id} className="hh-legend-item"><i style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} aria-hidden="true" />{s.name}</span>
        ))}
      </figcaption>
    </figure>
  );
}
