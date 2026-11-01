import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, Navigation, MapPin, UserRound, Camera, Truck, Package } from 'lucide-react';
import { STATUS_CONFIG, defaultStages } from '../api/executorApi';
import { compressImage } from '../utils/image';
import { Status, StepProgress, EmptyState, statusTone } from './ui/kit';
import StageChecklist from './StageChecklist';
import MachineryForm from './MachineryForm';

const PHOTO_TAGS = ['Скрытые работы', 'Котлован', 'Монтаж ЖБИ', 'Сдача'];
const MACH_STATUS = { ordered: 'заказана', confirmed: 'подтверждена', completed: 'отработала', cancelled: 'отменена' };

export default function WorkOrderDetailModal({ order, onClose, onUpdateStatus, onToggleStage, onAddPhoto, onRequestMachinery }) {
  const [tab, setTab] = useState('stages'); // stages | photos | materials | machinery | status
  const [selectedStatus, setSelectedStatus] = useState(order.status || 'В работе');
  const [comment, setComment] = useState('');
  const [photoTag, setPhotoTag] = useState(PHOTO_TAGS[0]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);

  const stages = order.stages && order.stages.length ? order.stages : defaultStages();
  const phone = String(order.phone || '');
  const tel = phone.replace(/[^\d+]/g, '');
  const photos = order.photos || [];
  const machinery = order.machinery || [];
  const materials = order.materials || [];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      // compress (~1280px, JPEG 0.7) before storing on the phone / uploading
      const { dataUrl, blob } = await compressImage(file, 1280, 0.7);
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      await onAddPhoto(order.id, { id: `photo_${Date.now()}`, url: dataUrl, blob, tag: photoTag, caption: `${photoTag} (${time})`, time });
    } catch (err) {
      setPhotoError('Не удалось сохранить фото: ' + (err.message || 'ошибка'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const applyStatus = () => {
    onUpdateStatus(order.id, selectedStatus, comment.trim() || `Статус изменён на «${selectedStatus}»`);
    onClose();
  };

  const TABS = [
    ['stages', `Этапы ${stages.filter(s => s.done).length}/${stages.length}`],
    ['photos', `Фото ${photos.length || ''}`.trim()],
    ['machinery', 'Техника'],
    ['materials', 'Материалы'],
    ['status', 'Статус']
  ];

  return (
    <div className="qz-scrim" onClick={onClose}>
      <div className="qz-sheet" role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={(e) => e.stopPropagation()} style={{ height: 'calc(100dvh - var(--safe-top) - 24px)' }}>
        <div className="qz-sheet-head">
          <div className="qz-grow">
            <div className="qz-row" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <Status status={order.status} />
              {order.leadNum && <span className="qz-ticket-no">№ {order.leadNum}</span>}
              {order._dirty && <span className="qz-tag is-warn">Не отправлено</span>}
            </div>
            <h2 id="order-title" className="qz-h2" style={{ fontSize: 'var(--fs-xl)' }}>{order.title}</h2>
            <div className="qz-small qz-muted" style={{ marginTop: 6, display: 'grid', gap: 2 }}>
              {order.client && <span className="qz-row" style={{ gap: 6 }}><UserRound size={14} />{order.client}</span>}
              {order.location && <span className="qz-row" style={{ gap: 6 }}><MapPin size={14} />{order.location}</span>}
            </div>
          </div>
          <button type="button" className="qz-iconbtn" aria-label="Закрыть" onClick={onClose}><X size={22} /></button>
        </div>

        <div style={{ padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--line)', display: 'grid', gap: 'var(--sp-3)' }}>
          <StepProgress stages={stages} />
          {(tel || order.location) && (
            <div className="qz-row" style={{ gap: 8 }}>
              {tel && <a className="qz-btn is-ok is-sm qz-grow" href={`tel:${tel}`}><Phone size={16} /> Позвонить</a>}
              {order.location && (
                <button type="button" className="qz-btn is-sm qz-grow" onClick={() => window.open(`https://2gis.kz/search/${encodeURIComponent(order.location)}`, '_blank')}>
                  <Navigation size={16} /> Маршрут
                </button>
              )}
            </div>
          )}
        </div>

        <div className="qz-sheet-tabs" role="tablist" aria-label="Разделы наряда">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <div className="qz-sheet-body">
          {tab === 'stages' && (
            <>
              <p className="qz-small qz-muted" style={{ marginBottom: 'var(--sp-3)' }}>Отмечайте этапы по мере выполнения. Отметка с временем уходит менеджеру.</p>
              <StageChecklist order={order} onToggleStage={onToggleStage} withNotes />
            </>
          )}

          {tab === 'photos' && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <div className="qz-label">Что на фото</div>
              <div className="qz-chips" style={{ marginTop: 6 }}>
                {PHOTO_TAGS.map(t => (
                  <button key={t} type="button" className={`qz-chip${photoTag === t ? ' is-active' : ''}`} onClick={() => setPhotoTag(t)}>{t}</button>
                ))}
              </div>
              <button type="button" className="qz-btn is-primary is-block" onClick={() => fileInputRef.current?.click()} disabled={photoBusy}>
                <Camera size={18} /> {photoBusy ? 'Сохраняем фото…' : 'Сфотографировать'}
              </button>
              {photoError && <div className="qz-small" role="alert" style={{ color: 'var(--danger)', marginTop: 8 }}>{photoError}</div>}
              {photos.length === 0 ? (
                <EmptyState icon={<Camera size={28} />} title="Фото пока нет" text="Снимите скрытые работы до засыпки: это главный аргумент при приёмке." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 'var(--sp-3)' }}>
                  {photos.map((p, i) => (
                    <figure key={p.id || i} className="qz-card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
                      {(p.url || p.serverUrl)
                        ? <img src={p.url || p.serverUrl} alt={p.tag || 'Фото работ'} loading="lazy" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />
                        : <div style={{ aspectRatio: '4 / 3', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}><Camera size={24} /></div>}
                      <figcaption style={{ padding: '6px 8px' }}>
                        <div className="qz-small" style={{ fontWeight: 600 }}>{p.tag || 'Фото'}</div>
                        <div className="qz-xs qz-faint">{p.time || ''}{p.localOnly ? ', только на телефоне' : (p.serverUrl ? ', на сервере' : '')}</div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'machinery' && (
            <>
              <MachineryForm orderId={order.id} onSubmit={onRequestMachinery} />
              <div className="qz-section-head" style={{ marginTop: 'var(--sp-6)' }}>
                <h3 className="qz-h3">Заявки по объекту</h3>
                <span className="qz-xs qz-faint num">{machinery.length}</span>
              </div>
              {machinery.length === 0 ? (
                <div className="qz-small qz-faint">Заявок на технику ещё не было.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {machinery.map((m, i) => (
                    <div key={m.id || i} className="qz-card" style={{ padding: 'var(--sp-3)', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Truck size={20} className="qz-faint" style={{ flexShrink: 0 }} />
                      <div className="qz-grow">
                        <div className="qz-h3">{m.type}</div>
                        <div className="qz-xs qz-faint num">{m.date} в {m.time}{m.comment ? `, ${m.comment}` : ''}</div>
                      </div>
                      <span className={`qz-status is-st-${m.status === 'completed' ? 'done' : (m.status === 'cancelled' ? 'lost' : 'progress')}`}>{MACH_STATUS[m.status] || m.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'materials' && (
            materials.length === 0 ? (
              <EmptyState icon={<Package size={28} />} title="Список материалов не заполнен" text="Нужное можно найти и добавить в разделе «Снабжение»." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {materials.map((m, i) => (
                  <div key={i} className="qz-card" style={{ padding: 'var(--sp-3)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span className="qz-grow">{m.name}</span>
                    <span className="num qz-muted">{m.qty} {m.unit}</span>
                    <span className={`qz-status is-st-${m.status === 'delivered' ? 'done' : 'attention'}`}>{m.status === 'delivered' ? 'на объекте' : 'ждём'}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === 'status' && (
            <>
              <div role="radiogroup" aria-label="Статус наряда" style={{ display: 'grid', gap: 6 }}>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const on = selectedStatus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSelectedStatus(key)}
                      style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderRadius: 'var(--r-md)', border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}`, background: on ? 'var(--accent-soft)' : 'var(--surface)', color: 'var(--text)' }}
                    >
                      <span className={`qz-status is-st-${statusTone(key)}`} style={{ fontSize: 'var(--fs-md)' }}>{cfg.label}</span>
                      {order.status === key && <span className="qz-xs qz-faint">сейчас</span>}
                    </button>
                  );
                })}
              </div>
              <div className="qz-field" style={{ marginTop: 'var(--sp-3)' }}>
                <label className="qz-label" htmlFor="status-comment">Комментарий</label>
                <input id="status-comment" className="qz-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что сделано, что мешает" />
              </div>
              <button type="button" className="qz-btn is-primary is-block" style={{ marginTop: 'var(--sp-3)' }} onClick={applyStatus} disabled={selectedStatus === order.status && !comment.trim()}>
                Сохранить статус
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
