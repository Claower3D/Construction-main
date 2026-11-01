import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, MapPin, Plus, Trash2, UserRound } from 'lucide-react';
import { ROLE_CONFIG, STAGES } from '../api/crmApi';
import { parseLocalDate } from '../api/syncCore';
import { Status, formatMoney, statusTone } from './ui/kit';

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export default function DealDetailModal({ deal, onClose, onUpdateStatus, onAddNote, onDeleteDeal }) {
  const [newNote, setNewNote] = useState('');
  const role = ROLE_CONFIG[deal.role];
  const phone = String(deal.phone || '');
  const tel = phone.replace(/[^0-9+]/g, '');
  const wa = phone.replace(/[^0-9]/g, '');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Здравствуйте, ${deal.client}! Пишу по объекту «${deal.title}» в QazGost.`);
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
  };
  const handleOpenMap = () => {
    window.open(`https://2gis.kz/search/${encodeURIComponent(deal.location || '')}`, '_blank');
  };
  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(deal.id, newNote.trim());
    setNewNote('');
  };

  const when = deal.date
    ? (() => { const d = parseLocalDate(deal.date); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}${deal.time ? `, ${deal.time}` : ''}`; })()
    : 'не назначена';

  return (
    <div className="qz-scrim" onClick={onClose}>
      <div className="qz-sheet" role="dialog" aria-modal="true" aria-labelledby="deal-title" onClick={(e) => e.stopPropagation()}>
        <div className="qz-sheet-head">
          <div className="qz-grow">
            <div className="qz-row" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <Status status={deal.status} />
              {role && <span className="qz-tag">{role.badge.charAt(0) + role.badge.slice(1).toLowerCase()}</span>}
              {deal.leadNum && <span className="qz-ticket-no">№ {deal.leadNum}</span>}
              {deal._dirty && <span className="qz-tag is-warn">Не отправлено</span>}
            </div>
            <h2 id="deal-title" className="qz-h2" style={{ fontSize: 'var(--fs-xl)' }}>{deal.title}</h2>
          </div>
          <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={onClose}><X size={22} /></button>
        </div>

        <div className="qz-sheet-body">
          {/* Money and time — the two things a manager checks first */}
          <div className="qz-grid-2">
            <div className="qz-card" style={{ padding: 'var(--sp-3)' }}>
              <div className="qz-xs qz-faint">Бюджет</div>
              <div className="qz-amount" style={{ marginTop: 2 }}>{Number(deal.budget) > 0 ? formatMoney(deal.budget) : '—'}</div>
            </div>
            <div className="qz-card" style={{ padding: 'var(--sp-3)' }}>
              <div className="qz-xs qz-faint">Встреча / выезд</div>
              <div className="qz-h3 num" style={{ marginTop: 4 }}>{when}</div>
            </div>
          </div>

          <div className="qz-card" style={{ marginTop: 'var(--sp-3)', display: 'grid', gap: 10 }}>
            <div className="qz-row"><UserRound size={18} className="qz-faint" /><span className="qz-grow">{deal.client || 'Клиент'}</span></div>
            {phone && <div className="qz-row"><Phone size={18} className="qz-faint" /><span className="qz-grow num">{phone}</span></div>}
            {deal.location && <div className="qz-row"><MapPin size={18} className="qz-faint" /><span className="qz-grow">{deal.location}</span></div>}
          </div>

          <div className="qz-row" style={{ marginTop: 'var(--sp-3)', gap: 8 }}>
            {tel && <a className="qz-btn is-ok qz-grow" href={`tel:${tel}`}><Phone size={18} />Позвонить</a>}
            {wa && <button type="button" className="qz-btn qz-grow" onClick={handleWhatsApp}><MessageCircle size={18} />WhatsApp</button>}
            {deal.location && <button type="button" className="qz-btn" aria-label="Открыть в 2GIS" onClick={handleOpenMap}><MapPin size={18} />2GIS</button>}
          </div>

          <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
            <h3 className="qz-h3">Этап сделки</h3>
          </div>
          <div className="qz-chips" role="radiogroup" aria-label="Этап сделки" style={{ margin: '0 calc(-1 * var(--sp-4))' }}>
            {STAGES.map(st => {
              const active = deal.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`qz-chip${active ? ' is-active' : ''}`}
                  onClick={() => !active && onUpdateStatus(deal.id, st)}
                >
                  <span className={`qz-status is-st-${statusTone(st)}`} style={{ fontSize: 'var(--fs-sm)', color: active ? 'var(--text)' : undefined }}>{st}</span>
                </button>
              );
            })}
          </div>

          <div className="qz-section-head" style={{ marginTop: 'var(--sp-5)' }}>
            <h3 className="qz-h3">Заметки</h3>
            <span className="qz-xs qz-faint num">{(deal.notes || []).length}</span>
          </div>
          <form onSubmit={handleAddNoteSubmit} className="qz-row" style={{ gap: 8 }}>
            <label className="qz-sr-only" htmlFor="deal-note">Новая заметка</label>
            <input id="deal-note" className="qz-input qz-grow" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Итог звонка или встречи" />
            <button type="submit" className="qz-btn is-primary" aria-label="Добавить заметку" disabled={!newNote.trim()} style={{ width: 48, padding: 0 }}><Plus size={22} /></button>
          </form>
          <div style={{ display: 'grid', gap: 8, marginTop: 'var(--sp-3)' }}>
            {(deal.notes || []).map((n, i) => (
              <div key={i} className="qz-card" style={{ padding: 'var(--sp-3)', boxShadow: 'inset 3px 0 0 var(--line-strong)' }}>
                <div className="qz-small" style={{ lineHeight: 1.4, overflowWrap: 'anywhere' }}>{n.text}</div>
                <div className="qz-row qz-xs qz-faint" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <span>{n.author || 'Менеджер'}</span>
                  <span className="num">{n.time || ''}</span>
                </div>
              </div>
            ))}
            {(deal.notes || []).length === 0 && <div className="qz-small qz-faint">Заметок пока нет.</div>}
          </div>

          <button
            type="button"
            className="qz-btn is-danger is-block"
            style={{ marginTop: 'var(--sp-8)' }}
            onClick={() => {
              if (window.confirm('Удалить эту сделку из CRM?')) {
                onDeleteDeal(deal.id);
                onClose();
              }
            }}
          >
            <Trash2 size={18} /> Удалить сделку
          </button>
        </div>
      </div>
    </div>
  );
}
