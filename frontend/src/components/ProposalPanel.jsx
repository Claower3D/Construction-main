import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './WorkPicker.css';
import './ProposalPanel.css';

// Коммерческое предложение, посчитанное сервером из заметки (POST /api/v1/ai/proposal):
// работы, материалы, техника, человеко-часы, итоги. Можно вставить текст в заметку, скопировать или распечатать.

const fmt = (v) => `${Math.round(Number(v) || 0).toLocaleString('ru-RU')} ₸`;
const qty = (v) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('ru-RU');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function requestProposal({ text, service, city, client }) {
  const res = await fetch('/api/v1/ai/proposal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, service, city, client }),
  });
  let data = null;
  try { data = await res.json(); } catch { /* не JSON */ }
  if (!res.ok) throw new Error((data && data.error) || `сервер ответил ${res.status}`);
  return data;
}

function printable(p) {
  const table = (title, rows) => (rows && rows.length ? `<h3>${esc(title)}</h3><table><thead><tr><th>№</th><th>Наименование</th><th>Ед.</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>${
    rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.unit)}</td><td class="n">${qty(r.qty)}</td><td class="n">${fmt(r.price)}</td><td class="n">${fmt(r.sum)}</td></tr>`).join('')
  }</tbody></table>` : '');
  const t = p.totals || {};
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Коммерческое предложение</title><style>
    body{font-family:Arial,sans-serif;color:#111;margin:28px;font-size:13px}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:0 0 14px;font-weight:600}
    h3{font-size:14px;margin:18px 0 6px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px 7px;text-align:left;vertical-align:top}
    th{background:#eee}.n{text-align:right;white-space:nowrap}.tot td{border:0;padding:3px 7px}.tot .b td{font-weight:700;font-size:15px}small{color:#555}
  </style></head><body><h1>Коммерческое предложение</h1><h2>${esc(p.title)}</h2>
  <div>${p.client ? `Заказчик: ${esc(p.client)} · ` : ''}Город: ${esc(p.city)} · Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
  ${table('Работы', p.works)}${table('Материалы', p.materials)}${table('Техника', p.equipment)}
  <h3>Трудозатраты</h3><div>${qty(p.labor.manHours)} чел.-ч (${qty(p.labor.manDays)} чел.-дн.), бригада ${p.labor.crew} чел., срок ${p.labor.days} дн.<br><small>${esc(p.labor.note)}</small></div>
  <h3>Итого</h3><table class="tot"><tbody>
  <tr><td>Работы</td><td class="n">${fmt(t.works)}</td></tr><tr><td>Материалы</td><td class="n">${fmt(t.materials)}</td></tr>
  ${t.equipment ? `<tr><td>Техника</td><td class="n">${fmt(t.equipment)}</td></tr>` : ''}
  <tr><td>Резерв на непредвиденное (5%)</td><td class="n">${fmt(t.contingency)}</td></tr><tr><td>Итого без НДС</td><td class="n">${fmt(t.total)}</td></tr>
  <tr><td>НДС ${Math.round((t.vatRate || 0) * 100)}%</td><td class="n">${fmt(t.vat)}</td></tr><tr class="b"><td>Итого с НДС</td><td class="n">${fmt(t.totalWithVat)}</td></tr></tbody></table>
  <h3>Условия расчёта</h3><ul>${(p.assumptions || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ul></body></html>`;
}

export default function ProposalPanel({ proposal, onClose, onInsert }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const p = proposal;
  const t = p.totals || {};
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const print = () => {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return;
    w.document.write(printable(p));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };
  const block = (title, rows) => (rows && rows.length > 0 ? (
    <div className="pp-block">
      <div className="pp-block-title">{title}</div>
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead><tr><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`}><td>{r.name}</td><td className="n">{qty(r.qty)} {r.unit}</td><td className="n">{fmt(r.price)}</td><td className="n">{fmt(r.sum)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null);

  return createPortal(
    <div className="wp-overlay" onClick={onClose}>
      <div className="wp-sheet pp-sheet" role="dialog" aria-modal="true" aria-label="Коммерческое предложение" onClick={(e) => e.stopPropagation()}>
        <div className="wp-head">
          <div>
            <div className="wp-title">Коммерческое предложение</div>
            <div className="pp-sub">{p.title} · {p.city}</div>
          </div>
          <button type="button" className="wp-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="wp-body">
          <div className={`pp-source pp-source--${p.source}`}>{p.sourceLabel}</div>
          {block('Работы', p.works)}
          {block('Материалы', p.materials)}
          {block('Техника', p.equipment)}
          <div className="pp-block">
            <div className="pp-block-title">Трудозатраты</div>
            <div className="pp-labor">
              <div><strong>{qty(p.labor.manHours)}</strong><span>человеко-часов</span></div>
              <div><strong>{qty(p.labor.manDays)}</strong><span>человеко-дней</span></div>
              <div><strong>{p.labor.crew}</strong><span>человек в бригаде</span></div>
              <div><strong>{p.labor.days}</strong><span>дней работы</span></div>
            </div>
            <div className="pp-note">{p.labor.note}</div>
          </div>
          <div className="pp-block pp-totals">
            <div><span>Работы</span><strong>{fmt(t.works)}</strong></div>
            <div><span>Материалы</span><strong>{fmt(t.materials)}</strong></div>
            {t.equipment > 0 && <div><span>Техника</span><strong>{fmt(t.equipment)}</strong></div>}
            <div><span>Резерв на непредвиденное (5%)</span><strong>{fmt(t.contingency)}</strong></div>
            <div><span>Итого без НДС</span><strong>{fmt(t.total)}</strong></div>
            <div><span>НДС {Math.round((t.vatRate || 0) * 100)}%</span><strong>{fmt(t.vat)}</strong></div>
            <div className="pp-grand"><span>Итого с НДС</span><strong>{fmt(t.totalWithVat)}</strong></div>
          </div>
          <ul className="pp-assumptions">{(p.assumptions || []).map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
        <div className="tp-foot pp-foot">
          <button type="button" className="pp-btn" onClick={print}>🖨 Печать / PDF</button>
          <button type="button" className="pp-btn" onClick={copy}>{copied ? '✓ Скопировано' : '📋 Скопировать текст'}</button>
          {onInsert && <button type="button" className="pp-btn pp-btn--main" onClick={() => onInsert(p)}>Прикрепить к заявке</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
