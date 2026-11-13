// Графики админки: одна серия, один цвет (--accent), значения — в цвете текста.
// Столбики по дням: касание показывает дату и число (повторное — прячет), мышь — при наведении; для программ чтения с экрана —
// скрытая таблица с теми же данными.
import React, { useMemo, useState } from 'react';
import { formatInt } from '../api/adminApi';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
function dayLabel(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
function niceMax(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= v) return k * p;
  return v;
}

export function DayBars({ data, title, unit = '' }) {
  const [sel, setSel] = useState(null);
  const W = 340; const H = 132; const top = 10; const bottom = 22;
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.count))), [data]);
  const total = data.reduce((s, d) => s + d.count, 0);
  const n = data.length || 1;
  const step = W / n;
  const gap = n > 45 ? 1 : 2;
  const bw = Math.max(1, step - gap);
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  const picked = sel != null ? data[sel] : null;
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <figure className="qga-chart" style={{ margin: 0 }}>
      <figcaption className="qga-chart-head">
        <span className="qz-small qz-muted">{title}</span>
        <span className="qga-chart-readout num" aria-live="polite">
          {picked ? <>{dayLabel(picked.date)}: <b>{formatInt(picked.count)}</b>{unit}</> : <>за период: <b>{formatInt(total)}</b>{unit}</>}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title}: всего ${total}${unit}`} onPointerLeave={(e) => { if (e.pointerType === 'mouse') setSel(null); }}>
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} className="qga-grid" />
            <text x={W} y={y(max * f) - 3} textAnchor="end" className="qga-axis">{formatInt(max * f)}</text>
          </g>
        ))}
        <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="qga-baseline" />
        {data.map((d, i) => {
          const x = i * step + gap / 2;
          const h = Math.max(0, y(0) - y(d.count));
          const r = Math.min(4, bw / 2, h);
          const active = sel === i;
          return (
            <g key={d.date}>
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + bw - r} Q${x + bw},${y(0) - h} ${x + bw},${y(0) - h + r} V${y(0)} Z`}
                  className={`qga-bar${active ? ' is-active' : ''}${sel != null && !active ? ' is-dim' : ''}`}
                />
              )}
              {/* зона касания шире и выше столбика */}
              <rect x={i * step} y={0} width={step} height={H - bottom + 6} fill="transparent"
                onClick={() => setSel(active ? null : i)}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setSel(i); }} />
            </g>
          );
        })}
        {ticks.filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={Math.min(W - 2, Math.max(2, i * step + step / 2))} y={H - 6}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="qga-axis">{data[i] && dayLabel(data[i].date)}</text>
        ))}
      </svg>
      <table className="qz-sr-only">
        <caption>{title}</caption>
        <tbody>{data.map((d) => <tr key={d.date}><th scope="row">{dayLabel(d.date)}</th><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Горизонтальные полосы «категория — число»: подпись и значение текстом, полоса — величина */
export function HBars({ rows, total, onPick, format = formatInt }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="qga-hbars">
      {rows.map((r) => {
        const content = (
          <>
            <span className="qga-hbar-label">{r.label}</span>
            <span className="qga-hbar-value num">{format(r.value)}{total ? <span className="qz-faint"> · {Math.round((r.value / total) * 100)}%</span> : null}</span>
            <span className="qga-hbar-track" aria-hidden="true"><span style={{ width: `${(r.value / max) * 100}%` }} /></span>
          </>
        );
        return (
          <li key={r.key || r.label}>
            {onPick ? <button type="button" className="qga-hbar is-button" onClick={() => onPick(r)}>{content}</button> : <div className="qga-hbar">{content}</div>}
          </li>
        );
      })}
    </ul>
  );
}

/** Плитка с одним числом */
export function Tile({ label, value, hint, tone, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`qga-tile${tone ? ` is-${tone}` : ''}${onClick ? ' is-button' : ''}`} onClick={onClick}>
      <span className="qga-tile-label">{label}</span>
      <span className="qga-tile-value num">{value}</span>
      {hint && <span className="qga-tile-hint">{hint}</span>}
    </Tag>
  );
}
