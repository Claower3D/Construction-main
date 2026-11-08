import React, { useState } from 'react';
import { paramValue } from './smetaApi';

// Параметры технологической карты: что именно делаем (покрытие, слой, приборы…).
// Для комплекса — по разделам; значения, заданные комплексом, уже подставлены.

function ParamControl({ param, value, onChange, testId }) {
  if (param.options?.length) {
    if (param.options.length <= 3) {
      return (
        <div className="sm-seg" role="radiogroup" aria-label={param.label}>
          {param.options.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
              className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}
              data-testid={`${testId}-${o.value}`}>
              {o.label}
            </button>
          ))}
        </div>
      );
    }
    return (
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={param.label} data-testid={testId}>
        {param.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <div className="sm-num">
      <input type="number" value={value} min={param.min} max={param.max > param.min ? param.max : undefined}
        step={param.step || 1} onChange={(e) => onChange(e.target.value)} aria-label={param.label} data-testid={testId} />
      {param.unit && <span>{param.unit}</span>}
    </div>
  );
}

function ParamList({ tm, scope, part, values, setValues, overrides }) {
  if (!tm?.params?.length) return <p className="sm-hint">Параметров нет — объём считается по контуру.</p>;
  const set = (key, v) => setValues((prev) => ({ ...prev, [scope]: { ...(prev[scope] || {}), [key]: v } }));
  return (
    <div className="sm-params">
      {tm.params.map((p) => {
        const key = scope === part ? p.key : `${part}.${p.key}`;
        const v = paramValue(values, scope, part, p, overrides);
        return (
          <div className="sm-param" key={key}>
            <div className="sm-param-label">{p.label}</div>
            <ParamControl param={p} value={v} onChange={(nv) => set(key, nv)} testId={`param-${key}`} />
            {p.hint && <div className="sm-hint">{p.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function SmetaParams({ techmaps, selection, complexes, values, setValues }) {
  const [open, setOpen] = useState({});
  if (!techmaps || !selection) return null;

  if (selection.type === 'cat') {
    const tm = techmaps[selection.id];
    if (!tm) return null;
    return (
      <div className="sm-params-box">
        <div className="sm-params-head">
          <strong>{tm.title}</strong>
          <span className="sm-hint">контур: {tm.baseLabel.toLowerCase()}</span>
        </div>
        <ParamList tm={tm} scope={selection.id} part={selection.id} values={values} setValues={setValues} />
      </div>
    );
  }

  const cx = complexes?.find((c) => c.id === selection.id);
  if (!cx) return null;
  return (
    <div className="sm-params-box">
      <div className="sm-params-head">
        <strong>{cx.title}</strong>
        <span className="sm-hint">{cx.parts.length} разделов — откройте, чтобы уточнить</span>
      </div>
      {cx.parts.map((part) => {
        const tm = techmaps[part];
        if (!tm) return null;
        const isOpen = !!open[part];
        return (
          <div key={part} className={`sm-acc ${isOpen ? 'is-open' : ''}`}>
            <button type="button" className="sm-acc-head" aria-expanded={isOpen}
              onClick={() => setOpen((o) => ({ ...o, [part]: !o[part] }))}>
              <span>{tm.title}</span>
              <small>{tm.params?.length ? `${tm.params.length} парам.` : 'по контуру'}</small>
            </button>
            {isOpen && (
              <ParamList tm={tm} scope={cx.id} part={part} values={values} setValues={setValues} overrides={cx.overrides} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Параметры для запроса на сервер.
export function buildParams(techmaps, selection, complexes, values) {
  const out = {};
  if (!techmaps || !selection) return out;
  if (selection.type === 'cat') {
    const tm = techmaps[selection.id];
    (tm?.params || []).forEach((p) => { out[p.key] = paramValue(values, selection.id, selection.id, p); });
    return out;
  }
  const cx = complexes?.find((c) => c.id === selection.id);
  (cx?.parts || []).forEach((part) => {
    (techmaps[part]?.params || []).forEach((p) => {
      out[`${part}.${p.key}`] = paramValue(values, cx.id, part, p, cx.overrides);
    });
  });
  return out;
}
