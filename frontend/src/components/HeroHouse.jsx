import React from 'react';

/*
 * Дом на первом экране: 3D-рендер (Blender Cycles), правая половина
 * переходит в светящийся чертёж той же камеры. Исходники сцены —
 * tools/hero-render (house_scene.py + compose.py).
 * Точки выносок — проекция углов дома камерой (hero-house.json).
 */

const ASPECT = 1.6234; // ширина / высота кадра
const VB_W = 1000;
const VB_H = Math.round(VB_W / ASPECT);

// at — точка на доме, box — где стоит подпись (доли кадра)
const CALLOUTS = [
  { id: 'bom', label: 'Точный BOM-расчёт', at: [0.7416, 0.3545], box: [0.74, 0.12] },
  { id: 'price', label: 'Прозрачные цены 2026', at: [0.3131, 0.1032], box: [0.02, 0.03] },
  { id: 'defect', label: 'Детекция дефектов', at: [0.3142, 0.6698], box: [0.03, 0.88] },
  { id: 'export', label: 'Экспорт в PDF / Excel', at: [0.7611, 0.5533], box: [0.70, 0.80] },
];
const LABEL_W = 0.22; // ширина подписи в долях кадра (для расчёта выноски)

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

export default function HeroHouse() {
  return (
    <figure className="hh" aria-label="Дом: левая половина — фотореалистичный рендер, правая — светящийся чертёж с подписями возможностей сервиса">
      <picture>
        <source media="(max-width: 700px)" srcSet="/assets/landing/hero-house-m.webp" />
        <img
          className="hh-img"
          src="/assets/landing/hero-house.webp"
          alt=""
          width="1440"
          height="887"
          fetchpriority="high"
          decoding="async"
        />
      </picture>
      <svg className="hh-lines" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
        {CALLOUTS.map((c) => (
          <g key={c.id}>
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
    </figure>
  );
}
