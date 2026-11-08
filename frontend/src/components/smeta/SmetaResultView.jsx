import React, { useMemo, useState } from 'react';
import { fmt, fmtQty } from './smetaApi';

const SCN = {
  eco: { name: 'Эконом', tone: 'eco' },
  std: { name: 'Стандарт', tone: 'std' },
  prem: { name: 'Премиум', tone: 'prem' },
};
const MODE_LABEL = { fast: 'Быстрый расчёт', detailed: 'Детальный: с проверкой', full: 'Полный: с графиком и закупкой' };

export function shortSource(src = '') {
  const q = src.match(/«([^»]+)»/);
  if (q) return q[1];
  return src.split(/[,:]/)[0].trim();
}

function SourceCell({ it }) {
  if (!it.verified) {
    return (
      <span className="sm-src sm-src-est" title={it.note || 'Расчётная оценка QazGost'}>
        оценка
        {it.note && <small>{it.note}</small>}
      </span>
    );
  }
  return (
    <span className="sm-src">
      {it.url ? <a href={it.url} target="_blank" rel="noopener noreferrer">{shortSource(it.source)}</a> : shortSource(it.source)}
      {it.note && <small>{it.note}</small>}
    </span>
  );
}

function ItemsTable({ sc, multiPart, partTitles }) {
  const rows = [];
  let lastPart = '';
  let lastStage = '';
  sc.items.forEach((it, i) => {
    if (multiPart && it.category !== lastPart) {
      lastPart = it.category;
      lastStage = '';
      const partTotal = sc.items.filter((x) => x.category === it.category).reduce((a, x) => a + x.total, 0);
      rows.push(
        <tr key={`p-${i}`} className="sm-row-part">
          <td colSpan={5}>{partTitles[it.category] || it.category}</td>
          <td className="sm-num-cell">{fmt(partTotal)} ₸</td>
        </tr>,
      );
    }
    if (it.stage !== lastStage) {
      lastStage = it.stage;
      rows.push(<tr key={`s-${i}`} className="sm-row-stage"><td colSpan={6}>{it.stage}</td></tr>);
    }
    rows.push(
      <tr key={i} className={`sm-row sm-kind-${it.kind}`}>
        <td>
          <span className="sm-item-name"><i aria-hidden="true" />{it.name}</span>
          <small className="sm-why">{it.why}</small>
        </td>
        <td className="sm-num-cell">{fmtQty(it.qty)}</td>
        <td>{it.unit}</td>
        <td className="sm-num-cell">{fmt(it.price)}</td>
        <td className="sm-num-cell sm-sum">{fmt(it.total)}</td>
        <td><SourceCell it={it} /></td>
      </tr>,
    );
  });
  return (
    <div className="sm-table-wrap">
      <table className="sm-table" data-testid="smeta-table">
        <thead>
          <tr>
            <th>Позиция и как посчитан объём</th>
            <th className="sm-num-cell">Кол-во</th>
            <th>Ед.</th>
            <th className="sm-num-cell">Цена, ₸</th>
            <th className="sm-num-cell">Сумма, ₸</th>
            <th>Источник цены</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>Итого по смете</td>
            <td className="sm-num-cell" data-testid="smeta-subtotal">{fmt(sc.subtotal)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Schedule({ sched }) {
  if (!sched?.stages?.length) return null;
  const total = Math.max(1, sched.days);
  return (
    <section className="sm-block">
      <h4>График работ · {fmtQty(sched.days)} дн.</h4>
      <p className="sm-hint">{sched.note}</p>
      <div className="sm-gantt" data-testid="smeta-schedule">
        {sched.stages.map((s, i) => (
          <div className="sm-gantt-row" key={i}>
            <div className="sm-gantt-label">
              <span>{s.stage}</span>
              <small>{s.category}</small>
            </div>
            <div className="sm-gantt-track">
              <div className="sm-gantt-bar" style={{ left: `${(s.start / total) * 100}%`, width: `${Math.max(1.2, (s.days / total) * 100)}%` }}
                title={`с ${fmtQty(s.start + 1)} дня, ${fmtQty(s.days)} дн.`} />
              {s.wait > 0 && (
                <div className="sm-gantt-wait" style={{ left: `${((s.start + s.days) / total) * 100}%`, width: `${(s.wait / total) * 100}%` }}
                  title={`${s.why}: ${s.wait} дн.`} />
              )}
            </div>
            <div className="sm-gantt-days">{fmtQty(s.days)}{s.wait > 0 ? ` + ${s.wait}` : ''}</div>
          </div>
        ))}
      </div>
      <p className="sm-hint">Штриховка — технологический перерыв: высыхание, набор прочности, опрессовка.</p>
    </section>
  );
}

function Purchases({ list }) {
  if (!list?.length) return null;
  const total = list.reduce((a, p) => a + p.total, 0);
  return (
    <section className="sm-block">
      <h4>Ведомость закупки материалов · {fmt(total)} ₸</h4>
      <div className="sm-table-wrap">
        <table className="sm-table sm-table-compact" data-testid="smeta-purchases">
          <thead><tr><th>Материал</th><th className="sm-num-cell">Кол-во</th><th>Ед.</th><th className="sm-num-cell">Цена</th><th className="sm-num-cell">Сумма</th><th>Где смотреть</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.key}>
                <td>{p.name}</td>
                <td className="sm-num-cell">{fmtQty(p.qty)}</td>
                <td>{p.unit}</td>
                <td className="sm-num-cell">{fmt(p.price)}</td>
                <td className="sm-num-cell sm-sum">{fmt(p.total)}</td>
                <td>{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{shortSource(p.source)}</a> : shortSource(p.source)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Audit({ audit }) {
  const [showDb, setShowDb] = useState(false);
  if (!audit) return null;
  const compared = (audit.db || []).filter((m) => m.status !== 'none');
  const label = { ok: 'совпадает', high: 'выше базы', low: 'ниже базы' };
  return (
    <section className="sm-block" data-testid="smeta-audit">
      <h4>Проверка сметы</h4>
      <ul className="sm-checks">
        {audit.checks.map((c, i) => (
          <li key={i} className={`sm-check-${c.level}`}><i aria-hidden="true" />{c.text}</li>
        ))}
      </ul>
      {compared.length > 0 && (
        <>
          <button type="button" className="sm-link-btn" onClick={() => setShowDb((v) => !v)} aria-expanded={showDb}>
            {showDb ? 'Скрыть сверку с базой' : `Показать сверку с базой QazGost (${compared.length} поз.)`}
          </button>
          {showDb && (
            <div className="sm-table-wrap">
              <table className="sm-table sm-table-compact">
                <thead><tr><th>Позиция</th><th className="sm-num-cell">В смете</th><th className="sm-num-cell">Медиана базы</th><th>Аналоги в базе</th><th>Итог</th></tr></thead>
                <tbody>
                  {compared.map((m) => (
                    <tr key={m.key} className={`sm-db-${m.status}`}>
                      <td>{m.name}<small className="sm-why">{m.unit}</small></td>
                      <td className="sm-num-cell">{fmt(m.our)}</td>
                      <td className="sm-num-cell">{fmt(m.dbMedian)}<small className="sm-why">{fmt(m.dbMin)}–{fmt(m.dbMax)}, {m.dbCount} поз.</small></td>
                      <td><small>{m.example}</small></td>
                      <td>{label[m.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PhotoAnalysis({ pa }) {
  if (!pa) return null;
  if (pa.status !== 'ok') {
    return (
      <section className="sm-block sm-block-muted">
        <h4>ИИ-разбор фото</h4>
        <p>{pa.message}</p>
      </section>
    );
  }
  return (
    <section className="sm-block">
      <h4>ИИ-разбор фото · {pa.photos} фото</h4>
      {pa.detected && <p>На фото: <b>{pa.detected}</b>{pa.mismatch ? ` — это не совпадает с выбранным видом работ, проверьте выбор.` : ''}</p>}
      {pa.area > 0 && <p>Оценка площади по фото: ~{fmtQty(pa.area)} м² (в смете — площадь вашего обмера).</p>}
      {pa.insights?.length > 0 && <ul className="sm-plain">{pa.insights.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      <p className="sm-hint">ИИ помогает увидеть дефекты и проверить выбор работ; цены и объёмы в смете — только из обмера и справочника.</p>
    </section>
  );
}

export default function SmetaResultView({ result, scenarioId, setScenarioId, photoAnalysis, techmaps, actions }) {
  const sc = result.scenarios.find((s) => s.id === scenarioId) || result.scenarios[1];
  const multiPart = (result.parts || []).length > 1;
  const partTitles = useMemo(() => {
    const t = {};
    (result.parts || []).forEach((id) => { t[id] = techmaps?.[id]?.title || id; });
    return t;
  }, [result.parts, techmaps]);
  const verifiedShare = sc.subtotal > 0 ? Math.round(((sc.subtotal - sc.unverified) / sc.subtotal) * 100) : 0;
  const g = result.geometry;

  return (
    <div className="sm-result" data-testid="smeta-result">
      <header className="sm-result-head">
        <div>
          <h3>{result.title}</h3>
          <p className="sm-hint">
            {fmtQty(g.area)} м² · периметр {fmtQty(g.perimeter)} м · высота {fmtQty(g.height)} м · стены {fmtQty(g.wallArea)} м² ·
            двери {g.doors}, окна {g.windows}
          </p>
        </div>
        <div className="sm-badges">
          <span className="sm-badge">{result.city}{result.regionCoef !== 1 ? ` ×${result.regionCoef}` : ''}</span>
          <span className="sm-badge">цены: {result.priceDate}</span>
          <span className="sm-badge">{MODE_LABEL[result.mode]}</span>
        </div>
      </header>

      <div className="sm-scn-grid" role="tablist" aria-label="Сценарий">
        {result.scenarios.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === sc.id}
            className={`sm-scn sm-scn-${SCN[s.id]?.tone} ${s.id === sc.id ? 'is-on' : ''}`}
            onClick={() => setScenarioId(s.id)} data-testid={`scn-${s.id}`}>
            <span className="sm-scn-name">{s.name}</span>
            <span className="sm-scn-sum">{fmt(s.subtotal)} ₸</span>
            <span className="sm-scn-m2">{fmt(s.perM2)} ₸/м²</span>
            <span className="sm-scn-note">{s.note}</span>
          </button>
        ))}
      </div>
      {sc.note && <p className="sm-scn-detail">{sc.name}: {sc.note}</p>}

      <div className="sm-totals">
        <div><span>Работы</span><b data-testid="tot-works">{fmt(sc.works)} ₸</b></div>
        <div><span>Материалы</span><b data-testid="tot-materials">{fmt(sc.materials)} ₸</b></div>
        {sc.equipment > 0 && <div><span>Техника</span><b>{fmt(sc.equipment)} ₸</b></div>}
        <div className="sm-tot-main"><span>Итого по смете</span><b data-testid="tot-subtotal">{fmt(sc.subtotal)} ₸</b></div>
        <div><span>Резерв 10%</span><b>{fmt(sc.reserve)} ₸</b></div>
        <div className="sm-tot-budget"><span>Бюджет с резервом</span><b data-testid="tot-total">{fmt(sc.total)} ₸</b></div>
      </div>
      <p className="sm-verified" data-testid="verified-share">
        <span style={{ width: `${verifiedShare}%` }} />
        {verifiedShare}% суммы — цены из открытых прайсов и объявлений; остальное помечено «оценка» с методикой.
      </p>

      <ItemsTable sc={sc} multiPart={multiPart} partTitles={partTitles} />

      <PhotoAnalysis pa={photoAnalysis} />
      <Audit audit={result.audit} />
      <Schedule sched={result.schedule?.[sc.id]} />
      <Purchases list={result.purchases?.[sc.id]} />

      <section className="sm-block">
        <h4>Допущения расчёта</h4>
        <ul className="sm-plain">{(result.assumptions || []).map((a, i) => <li key={i}>{a}</li>)}</ul>
        <p className="sm-hint">{result.method}</p>
      </section>

      <section className="sm-block">
        <h4>Источники цен</h4>
        <ul className="sm-sources">
          {(result.sources || []).map((s, i) => (
            <li key={i}>
              <span>
                {s.source}
                {(s.urls || []).length > 0 && (
                  <span className="sm-src-links">
                    {s.urls.map((u) => {
                      let label = u;
                      try { const x = new URL(u); label = x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.replace(/\.html$/, '') : ''); } catch { /* как есть */ }
                      return <a key={u} href={u} target="_blank" rel="noopener noreferrer">{label}</a>;
                    })}
                  </span>
                )}
              </span>
              <small>{s.count} поз.</small>
            </li>
          ))}
        </ul>
      </section>

      {actions}
    </div>
  );
}
