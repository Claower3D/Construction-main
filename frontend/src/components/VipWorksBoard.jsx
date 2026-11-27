import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './VipWorksBoard.css';
import {
  STATUS, STATUS_ORDER, BRIGADE_PEOPLE, BRIGADE_MACHINES,
  todayIso, isIso, durationDays, formatDay, formatRange, isOverdue, buildTimeline, barPosition,
  brigadeConflicts, brigadeIssues, assignmentReport, projectSummary, shortName, nextId, emptyProject, importProblem,
  WEEKDAY_NAMES, restDayOf, factRange, budgetSummary, money, MACHINE_GROUPS, machineGroup, guessMachineGroup,
  WORK_KINDS, workKind, guessWorkKind, workPicture, WORK_SHAPES, projectPlaces, hangarPlan, HANGAR,
} from './vip/vipSchedule';
import { Avatar, MachinePic, MachineArt, WorkArt, PhotoPicker, PlanPicker } from './vip/VipVisuals';
import {
  listProjects, getProject, createProject, saveProject, deleteProject,
  uploadMedia, mediaProblem, MEDIA_ACCEPT, MEDIA_LIMITS, fileUrl,
} from '../services/vipApi';

const pic = (w) => fileUrl(workPicture(w)); // картинка работы с адресом сервера (нужно в приложении)

// Рабочие проекты модуля «Строительство зданий и сооружений»: график работ (календарь с полосами),
// таблица работ, карточка работы с фото и видео, штат, техника и бригады подрядчика.
// Данные лежат на сервере (/api/v1/vip/*) и видны администратору и менеджеру с любого устройства.
// section: 'schedule' — график и таблица работ; 'team' — компания, бригады, штат и техника; 'docs' — документы проекта.

const CELL = 44; // ширина одного дня на графике, px
// На телефоне слева в графике только иконки, а название работы стоит на её полосе; не помещается — рядом с полосой.
const NAME_CHAR = 7.4; // средняя ширина буквы подписи, px
const nameFits = (title, width) => String(title || '').length * NAME_CHAR + 22 <= width;
/** Где поставить подпись рядом с полосой: справа от неё, а если там не хватает места до конца графика — слева */
const capStyle = (title, fromCell, toCell, days) => {
  const need = String(title || '').length * NAME_CHAR + 12;
  const toLeft = toCell * CELL + need > days * CELL && fromCell * CELL - need > 0;
  return toLeft ? { right: (days - fromCell) * CELL + 6 } : { left: toCell * CELL + 6 };
};
const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp';
const DOC_KINDS = ['Договор', 'Смета', 'Акт (КС-2)', 'Справка (КС-3)', 'Счёт', 'Чертёж', 'Отчёт', 'Другое'];
const cls = (...a) => a.filter(Boolean).join(' ');
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`);
const plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many; };

// ── Окно: закрывается клавишей Esc, нажатием мимо и кнопкой ──
const openModals = []; // окно поверх окна: клавиша Esc закрывает только верхнее

// Только просмотр: карточки открываются, но поля не правятся и кнопок записи нет
const ReadOnly = createContext(false);
const RO_NOTE = 'Только просмотр — изменения вносит администратор';

function Modal({ title, onClose, children, wide = false, footer = null }) {
  const ro = useContext(ReadOnly);
  const boxRef = useRef(null);
  // поля в режиме просмотра гасим после каждой отрисовки: карточки общие с режимом правки
  useEffect(() => {
    if (!ro || !boxRef.current) return;
    boxRef.current.querySelectorAll('.vwb-modal-body input, .vwb-modal-body select, .vwb-modal-body textarea').forEach((el) => { el.disabled = true; });
  });
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const me = {};
    openModals.push(me);
    const onKey = (e) => {
      if (e.key !== 'Escape' || openModals[openModals.length - 1] !== me) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      closeRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    const prev = document.activeElement;
    const first = boxRef.current && (boxRef.current.querySelector('.vwb-form input, .vwb-form select, .vwb-form textarea') || boxRef.current.querySelector('input:not([type=file]), select, textarea, button'));
    if (first) first.focus();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const i = openModals.indexOf(me);
      if (i >= 0) openModals.splice(i, 1);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return createPortal(
    <div className="vwb-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cls('vwb-modal', wide && 'wide')} role="dialog" aria-modal="true" aria-label={title} ref={boxRef}>
        <div className="vwb-modal-head">
          <h3>{title}</h3>
          <button type="button" className="vwb-x" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className={cls('vwb-modal-body', ro && 'vwb-ro')}>{children}</div>
        {footer && !ro && <div className="vwb-modal-foot">{footer}</div>}
        {footer && ro && <div className="vwb-modal-foot"><span className="vwb-ro-note">{RO_NOTE}</span><button type="button" className="vip-secondary-btn" onClick={onClose}>Закрыть</button></div>}
      </div>
    </div>,
    document.body,
  );
}

function Confirm({ title, text, yes = 'Удалить', onYes, onNo }) {
  return (
    <Modal title={title} onClose={onNo} footer={(
      <>
        <button type="button" className="vip-secondary-btn" onClick={onNo}>Отмена</button>
        <button type="button" className="vip-primary-btn vwb-danger" onClick={onYes}>{yes}</button>
      </>
    )}>
      <p className="vwb-confirm-text">{text}</p>
    </Modal>
  );
}

function Field({ label, children, hint, error, wide }) {
  return (
    <label className={cls('vwb-field', wide && 'wide', error && 'bad')}>
      <span className="vwb-label">{label}</span>
      {children}
      {error ? <span className="vwb-err" role="alert">{error}</span> : hint ? <span className="vwb-hint">{hint}</span> : null}
    </label>
  );
}

// ── Карточка работы ──
function WorkCard({ work, isNew, project, onSave, onDelete, onClose, userName }) {
  const today = todayIso();
  const [d, setD] = useState(() => ({ place: '', volume: '', note: '', check: '', brigadeId: '', media: [], factStart: '', factEnd: '', kind: '', zone: '', cost: 0, paid: 0, shape: '', floor: 0, pos: null, pos2: null, ...work }));
  const [errors, setErrors] = useState({});
  const [uploads, setUploads] = useState([]); // [{ key, name, pct, error }]
  const [askDelete, setAskDelete] = useState(false);
  const [viewer, setViewer] = useState(null);
  const fileRef = useRef(null);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  // Смена состояния сразу ставит отметки факта сегодняшним днём (их можно поправить): так «Календарь по факту»
  // строится сам, без отдельного ввода дат
  const setStatus = (status) => setD((p) => {
    const next = { ...p, status };
    if (status === 'progress' && !p.factStart) next.factStart = isIso(p.start) && p.start < today ? p.start : today;
    if (status === 'done') {
      if (!p.factStart) next.factStart = isIso(p.start) && p.start <= today ? p.start : today;
      if (!p.factEnd) next.factEnd = today < next.factStart ? next.factStart : today;
    }
    if (status === 'plan') { next.factStart = ''; next.factEnd = ''; }
    if (status === 'progress') next.factEnd = '';
    return next;
  });
  const brigade = (project.brigades || []).find((b) => b.id === d.brigadeId);
  const people = brigade ? (brigade.members || []).map((id) => (project.staff || []).find((p) => p.id === id)).filter(Boolean) : [];
  const machines = brigade ? (brigade.equipment || []).map((id) => (project.equipment || []).find((m) => m.id === id)).filter(Boolean) : [];
  const busy = uploads.some((u) => !u.error && u.pct < 1);
  // место черновика на модели — с учётом остальных работ проекта
  const place = useMemo(() => projectPlaces([...(project.works || []).filter((w) => w.id !== d.id), d]).get(d.id), [project.works, d]);

  // пересечение с другими работами той же бригады — считаем по черновику
  const clash = useMemo(() => {
    if (!d.brigadeId || !isIso(d.start) || !isIso(d.end) || d.status === 'hold') return [];
    return (project.works || []).filter((w) => w.id !== d.id && w.brigadeId === d.brigadeId && w.status !== 'hold' && w.start <= d.end && d.start <= w.end);
  }, [d.brigadeId, d.start, d.end, d.status, d.id, project.works]);

  const submit = () => {
    const e = {};
    if (!String(d.title || '').trim()) e.title = 'Напишите, что за работа';
    if (!isIso(d.start)) e.start = 'Укажите дату начала';
    if (!isIso(d.end)) e.end = 'Укажите дату окончания';
    if (isIso(d.start) && isIso(d.end) && d.end < d.start) e.end = 'Окончание раньше начала';
    if (d.factEnd && !d.factStart) e.factEnd = 'Сначала укажите, когда начали';
    if (d.factEnd && d.factStart && d.factEnd < d.factStart) e.factEnd = 'Закончили раньше, чем начали';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ ...d, title: d.title.trim(), cost: Number(d.cost) || 0, paid: Number(d.paid) || 0 });
  };

  const addFiles = async (files) => {
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      const problem = mediaProblem(file);
      if (problem) { setUploads((u) => [...u, { key, name: file.name, pct: 0, error: problem }]); continue; }
      setUploads((u) => [...u, { key, name: file.name, pct: 0, error: '' }]);
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadMedia(file, (pct) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct } : x))));
        setD((p) => ({ ...p, media: [...(p.media || []), { id: nextId('f', p.media), kind: res.kind, url: res.url, name: res.name, size: res.size, date: today, caption: '', addedAt: new Date().toISOString(), addedBy: userName || '' }] }));
        setUploads((u) => u.filter((x) => x.key !== key));
      } catch (err) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: err.message || 'не загрузилось' } : x)));
      }
    }
  };
  const setMedia = (id, patch) => setD((p) => ({ ...p, media: p.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  return (
    <Modal
      title={isNew ? 'Новая работа' : 'Работа'}
      onClose={onClose}
      wide
      footer={(
        <>
          {!isNew && <button type="button" className="vip-secondary-btn vwb-left" onClick={() => setAskDelete(true)}>Удалить работу</button>}
          <button type="button" className="vip-secondary-btn" onClick={onClose}>Отмена</button>
          <button type="button" className="vip-primary-btn" onClick={submit} disabled={busy}>{busy ? 'Идёт загрузка файлов…' : 'Сохранить'}</button>
        </>
      )}
    >
      <div className="vwb-form">
        <Field label="Работа" error={errors.title} wide>
          <input className="vip-input" value={d.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Например: ливневая система" maxLength={200} />
        </Field>
        <Field label="Место, этаж">
          <input className="vip-input" value={d.place || ''} onChange={(e) => set('place', e.target.value)} placeholder="2 этаж, ось А–Б" maxLength={200} />
        </Field>
        <Field label="Объём">
          <input className="vip-input" value={d.volume || ''} onChange={(e) => set('volume', e.target.value)} placeholder="101 м, колодец на 3 кольца" maxLength={200} />
        </Field>
        <Field label="Начало" error={errors.start}>
          <input className="vip-input" type="date" value={d.start || ''} onChange={(e) => set('start', e.target.value)} />
        </Field>
        <Field label="Окончание" error={errors.end} hint={isIso(d.start) && isIso(d.end) && d.end >= d.start ? `${durationDays(d.start, d.end)} ${plural(durationDays(d.start, d.end), 'день', 'дня', 'дней')}` : ''}>
          <input className="vip-input" type="date" value={d.end || ''} min={d.start || undefined} onChange={(e) => set('end', e.target.value)} />
        </Field>
        <Field label="Состояние">
          <select className="vip-input" value={d.status || 'plan'} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
        </Field>
        <Field label="Бригада" hint={!(project.brigades || []).length ? 'Бригады заводятся на вкладке «Штат и техника»' : ''}>
          <select className="vip-input" value={d.brigadeId || ''} onChange={(e) => set('brigadeId', e.target.value)}>
            <option value="">Не назначена</option>
            {(project.brigades || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        {brigade && (
          <div className="vwb-crew wide">
            <div><span className="vwb-label">Люди ({people.length})</span>{people.length ? people.map((p) => <span key={p.id} className="vwb-chip with-ava"><Avatar person={p} size={22} />{shortName(p.name)}{p.role ? ` · ${p.role}` : ''}</span>) : <span className="vwb-muted">в бригаде никого нет</span>}</div>
            <div><span className="vwb-label">Техника ({machines.length})</span>{machines.length ? machines.map((m) => <span key={m.id} className="vwb-chip gold">{m.name}{m.plate ? ` · ${m.plate}` : ''}</span>) : <span className="vwb-muted">техника не закреплена</span>}</div>
            {clash.length > 0 && <div className="vwb-warn" role="alert">В эти дни бригада занята: {clash.map((w) => `«${w.title}» (${formatRange(w.start, w.end)})`).join(', ')}</div>}
          </div>
        )}
        <Field label="Начали по факту" hint="Пусто — как в плане">
          <input className="vip-input" type="date" value={d.factStart || ''} onChange={(e) => set('factStart', e.target.value)} />
        </Field>
        <Field label="Закончили по факту" error={errors.factEnd} hint="Пусто — работа ещё идёт или закончена по плану">
          <input className="vip-input" type="date" value={d.factEnd || ''} min={d.factStart || undefined} onChange={(e) => set('factEnd', e.target.value)} />
        </Field>
        <Field label="Вид работ" hint="От него зависит картинка на графике">
          <span className="vwb-kind-pick">
            <WorkArt kind={d.kind || guessWorkKind(d.title)} className="vwb-kind-art" />
            <select className="vip-input" value={d.kind || ''} onChange={(e) => set('kind', e.target.value)}>
              <option value="">Подобрать по названию</option>
              {WORK_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </span>
        </Field>
        <Field label="Что показать на модели" hint={d.shape ? '' : `По названию: ${WORK_SHAPES.find((x) => x.id === place.shape).label}`}>
          <select className="vip-input" value={d.shape || ''} onChange={(e) => set('shape', e.target.value)}>
            <option value="">Подобрать по названию</option>
            {WORK_SHAPES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Этаж">
          <select className="vip-input" value={d.floor || 0} onChange={(e) => set('floor', Number(e.target.value))}>
            <option value={0}>Подобрать по названию</option>
            <option value={1}>1 этаж</option>
            <option value={2}>2 этаж</option>
          </select>
        </Field>
        {/* не <label>: нажатие внутри подписи браузер передаёт первой кнопке в ней, и выбор места тут же сбрасывался бы */}
        <div className="vwb-field wide">
          <span className="vwb-label">Место на плане здания</span>
          <PlanPicker
            value={d.pos || null}
            shown={{ x: place.x, z: place.z }}
            second={place.shape === 'stairs' && place.count >= 2 ? { value: d.pos2 || null, shown: { x: place.x2, z: place.z2 }, onChange: (pos) => set('pos2', pos), names: ['два марша у грохота', 'лестница двухэтажная, у входа'] } : null}
            objects={hangarPlan()}
            length={HANGAR.length}
            width={HANGAR.width}
            onChange={(pos) => set('pos', pos)}
          />
        </div>
        <Field label="Стоимость работы, ₸">
          <input className="vip-input" type="number" min="0" step="1000" inputMode="numeric" value={d.cost || ''} onChange={(e) => set('cost', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Оплачено, ₸">
          <input className="vip-input" type="number" min="0" step="1000" inputMode="numeric" value={d.paid || ''} onChange={(e) => set('paid', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Примечание" wide>
          <textarea className="vip-input vwb-area" value={d.note || ''} onChange={(e) => set('note', e.target.value)} maxLength={2000} rows={2} />
        </Field>
        <Field label="Что уточнить" hint="Если здесь есть текст, работа помечается значком ⚠" wide>
          <input className="vip-input" value={d.check || ''} onChange={(e) => set('check', e.target.value)} maxLength={300} placeholder="Пусто — всё ясно" />
        </Field>
      </div>

      <div className="vwb-media-head">
        <h4>Фото и видео <span className="vwb-muted">({(d.media || []).length})</span></h4>
        <button type="button" className="vip-secondary-btn" onClick={() => fileRef.current && fileRef.current.click()}>＋ Добавить фото или видео</button>
        <input ref={fileRef} type="file" accept={MEDIA_ACCEPT} multiple hidden onChange={(e) => { const f = [...e.target.files]; e.target.value = ''; addFiles(f); }} />
      </div>
      <p className="vwb-hint">Фото до {MEDIA_LIMITS.photo} МБ, видео до {MEDIA_LIMITS.video} МБ. Можно выбрать несколько файлов сразу.</p>
      {uploads.length > 0 && (
        <ul className="vwb-uploads">
          {uploads.map((u) => (
            <li key={u.key} className={u.error ? 'bad' : ''}>
              <span className="n">{u.name}</span>
              {u.error
                ? <><span className="e">не загружено: {u.error}</span><button type="button" className="vwb-link" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>убрать</button></>
                : <><span className="bar"><i style={{ width: `${Math.round(u.pct * 100)}%` }} /></span><span className="p">{Math.round(u.pct * 100)}%</span></>}
            </li>
          ))}
        </ul>
      )}
      {(d.media || []).length === 0 && uploads.length === 0
        ? <div className="vwb-empty small">Пока нет ни одного снимка. Добавляйте фото и видео по ходу работ — они сохранятся в этой работе с датой.</div>
        : (
          <div className="vwb-media-grid">
            {(d.media || []).map((m) => (
              <figure key={m.id} className="vwb-media">
                {m.kind === 'video'
                  ? <video src={fileUrl(m.url)} controls preload="metadata" />
                  : <button type="button" className="vwb-thumb" onClick={() => setViewer(m)} aria-label={`Открыть фото ${m.caption || m.name || ''}`}><img src={fileUrl(m.url)} alt={m.caption || m.name || 'Фото работы'} loading="lazy" /></button>}
                <figcaption>
                  <input className="vip-input" type="date" value={m.date || ''} onChange={(e) => setMedia(m.id, { date: e.target.value })} aria-label="Дата съёмки" />
                  <input className="vip-input" value={m.caption || ''} onChange={(e) => setMedia(m.id, { caption: e.target.value })} placeholder="Подпись" maxLength={300} aria-label="Подпись" />
                  <div className="vwb-media-meta"><span>{m.kind === 'video' ? 'Видео' : 'Фото'}{m.size ? ` · ${fmtSize(m.size)}` : ''}</span><button type="button" className="vwb-link" onClick={() => setD((p) => ({ ...p, media: p.media.filter((x) => x.id !== m.id) }))}>убрать</button></div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      {viewer && (
        <Modal title={viewer.caption || viewer.name || 'Фото'} onClose={() => setViewer(null)} wide>
          <img className="vwb-viewer" src={fileUrl(viewer.url)} alt={viewer.caption || viewer.name || 'Фото работы'} />
          <p className="vwb-hint">{viewer.date ? formatDay(viewer.date) : ''}</p>
        </Modal>
      )}
      {askDelete && <Confirm title="Удалить работу?" text={`Работа «${d.title}» исчезнет из графика вместе с её фото и видео. Отменить это нельзя.`} onYes={() => onDelete(d.id)} onNo={() => setAskDelete(false)} />}
    </Modal>
  );
}

// ── Окна справочников ──
function PersonCard({ person, isNew, onSave, onDelete, onClose }) {
  const [d, setD] = useState({ role: '', iin: '', phone: '', note: '', photo: '', ...person });
  const [err, setErr] = useState({});
  const submit = () => {
    const e = {};
    if (!String(d.name || '').trim()) e.name = 'Укажите фамилию и имя';
    if (d.iin && !/^\d{12}$/.test(d.iin)) e.iin = 'ИИН — 12 цифр';
    setErr(e);
    if (!Object.keys(e).length) onSave({ ...d, name: d.name.trim() });
  };
  return (
    <Modal title={isNew ? 'Новый работник' : 'Работник'} onClose={onClose} footer={(
      <>
        {!isNew && <button type="button" className="vip-secondary-btn vwb-left" onClick={() => onDelete(d.id)}>Убрать из штата</button>}
        <button type="button" className="vip-secondary-btn" onClick={onClose}>Отмена</button>
        <button type="button" className="vip-primary-btn" onClick={submit}>Сохранить</button>
      </>
    )}>
      <PhotoPicker value={d.photo} onChange={(url) => setD((p) => ({ ...p, photo: url }))} label="Фото работника">
        <Avatar person={d} size={84} />
      </PhotoPicker>
      <div className="vwb-form one">
        <Field label="Фамилия, имя, отчество" error={err.name}><input className="vip-input" value={d.name || ''} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={150} /></Field>
        <Field label="Должность"><input className="vip-input" value={d.role || ''} onChange={(e) => setD({ ...d, role: e.target.value })} maxLength={100} placeholder="Монтажник, водитель крана…" /></Field>
        <Field label="ИИН" error={err.iin} hint="Не обязательно. Виден только администратору и менеджеру"><input className="vip-input" inputMode="numeric" value={d.iin || ''} onChange={(e) => setD({ ...d, iin: e.target.value.replace(/\D/g, '').slice(0, 12) })} /></Field>
        <Field label="Телефон"><input className="vip-input" type="tel" value={d.phone || ''} onChange={(e) => setD({ ...d, phone: e.target.value })} maxLength={40} /></Field>
        <Field label="Примечание"><input className="vip-input" value={d.note || ''} onChange={(e) => setD({ ...d, note: e.target.value })} maxLength={500} /></Field>
      </div>
    </Modal>
  );
}

function MachineCard({ machine, isNew, staff, onSave, onDelete, onClose }) {
  const [d, setD] = useState({ plate: '', driverId: '', note: '', group: '', photo: '', ...machine });
  const [err, setErr] = useState('');
  const submit = () => { if (!String(d.name || '').trim()) { setErr('Укажите название техники'); return; } onSave({ ...d, name: d.name.trim() }); };
  return (
    <Modal title={isNew ? 'Новая техника' : 'Техника'} onClose={onClose} footer={(
      <>
        {!isNew && <button type="button" className="vip-secondary-btn vwb-left" onClick={() => onDelete(d.id)}>Убрать из списка</button>}
        <button type="button" className="vip-secondary-btn" onClick={onClose}>Отмена</button>
        <button type="button" className="vip-primary-btn" onClick={submit}>Сохранить</button>
      </>
    )}>
      <PhotoPicker value={d.photo} onChange={(url) => setD((p) => ({ ...p, photo: url }))} label="Фото техники">
        <MachinePic machine={d} group={machineGroup(d)} className="big" />
      </PhotoPicker>
      <div className="vwb-form one">
        <Field label="Техника, автомобиль" error={err}><input className="vip-input" value={d.name || ''} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={150} placeholder="Кран КАМАЗ, автовышка 33 м…" /></Field>
        <Field label="Подгруппа" hint={d.group ? '' : `По названию: ${MACHINE_GROUPS.find((g) => g.id === guessMachineGroup(d.name)).label}`}>
          <select className="vip-input" value={d.group || ''} onChange={(e) => setD({ ...d, group: e.target.value })}>
            <option value="">Подобрать по названию</option>
            {MACHINE_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="Госномер"><input className="vip-input" value={d.plate || ''} onChange={(e) => setD({ ...d, plate: e.target.value })} maxLength={30} /></Field>
        <Field label="Водитель">
          <select className="vip-input" value={d.driverId || ''} onChange={(e) => setD({ ...d, driverId: e.target.value })}>
            <option value="">Не закреплён</option>
            {staff.map((p) => <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Примечание"><input className="vip-input" value={d.note || ''} onChange={(e) => setD({ ...d, note: e.target.value })} maxLength={500} /></Field>
      </div>
    </Modal>
  );
}

function BrigadeCard({ brigade, isNew, project, onSave, onDelete, onClose }) {
  const [d, setD] = useState({ members: [], equipment: [], note: '', ...brigade });
  const [err, setErr] = useState('');
  const others = useMemo(() => assignmentReport({ ...project, brigades: (project.brigades || []).filter((b) => b.id !== d.id) }), [project, d.id]);
  const toggle = (key, id) => setD((p) => ({ ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));
  const issues = brigadeIssues(d);
  const submit = () => { if (!String(d.name || '').trim()) { setErr('Дайте бригаде название'); return; } onSave({ ...d, name: d.name.trim() }); };
  return (
    <Modal title={isNew ? 'Новая бригада' : 'Состав бригады'} onClose={onClose} wide footer={(
      <>
        {!isNew && <button type="button" className="vip-secondary-btn vwb-left" onClick={() => onDelete(d.id)}>Расформировать</button>}
        <button type="button" className="vip-secondary-btn" onClick={onClose}>Отмена</button>
        <button type="button" className="vip-primary-btn" onClick={submit}>Сохранить</button>
      </>
    )}>
      <div className="vwb-form one">
        <Field label="Название бригады" error={err}><input className="vip-input" value={d.name || ''} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={120} placeholder="Бригада 1 — монтаж" /></Field>
      </div>
      <div className={cls('vwb-rule', issues.length ? 'bad' : 'ok')} role="status">
        Правило: {BRIGADE_PEOPLE.min}–{BRIGADE_PEOPLE.max} человека и {BRIGADE_MACHINES.min}–{BRIGADE_MACHINES.max} единицы техники.
        {' '}Сейчас: {d.members.length} чел., {d.equipment.length} ед. техники{issues.length ? ` — ${issues.join('; ')}` : ' — состав в норме'}.
      </div>
      <div className="vwb-pick-cols">
        <fieldset className="vwb-pick">
          <legend>Люди</legend>
          {(project.staff || []).length === 0 && <p className="vwb-muted">Сначала добавьте работников в штат.</p>}
          {(project.staff || []).map((p) => {
            const other = others.brigadeOf.get(p.id);
            return (
              <label key={p.id} className="vwb-check">
                <input type="checkbox" checked={d.members.includes(p.id)} onChange={() => toggle('members', p.id)} />
                <Avatar person={p} size={30} />
                <span><b>{p.name}</b>{p.role ? ` — ${p.role}` : ''}{other ? <em> · уже в «{other.name}»</em> : null}</span>
              </label>
            );
          })}
        </fieldset>
        <fieldset className="vwb-pick">
          <legend>Техника</legend>
          {(project.equipment || []).length === 0 && <p className="vwb-muted">Сначала добавьте технику.</p>}
          {(project.equipment || []).map((m) => {
            const other = others.machineBrigade.get(m.id);
            return (
              <label key={m.id} className="vwb-check">
                <input type="checkbox" checked={d.equipment.includes(m.id)} onChange={() => toggle('equipment', m.id)} />
                <span><b>{m.name}</b>{m.plate ? ` · ${m.plate}` : ''}{other ? <em> · уже в «{other.name}»</em> : null}</span>
              </label>
            );
          })}
        </fieldset>
      </div>
    </Modal>
  );
}

const PARTY_FIELDS = [
  ['name', 'Название'], ['bin', 'БИН'], ['iin', 'ИИН'], ['address', 'Адрес'], ['bank', 'Банк'], ['bik', 'БИК'],
  ['account', 'Номер счёта (ИИК)'], ['kbe', 'КБе'], ['email', 'Эл. почта'], ['phone', 'Телефон'], ['signer', 'Подписант, основание'],
];

function ProjectCard({ data, isNew, onSave, onClose }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify({ object: '', address: '', startDate: '', endDate: '', note: '', client: {}, contractor: {}, invoice: {}, restDay: 0, budget: 0, ...data })));
  const [err, setErr] = useState({});
  const party = (key, title) => (
    <fieldset className="vwb-pick">
      <legend>{title}</legend>
      <div className="vwb-form one">
        {PARTY_FIELDS.map(([k, label]) => (
          <Field key={k} label={label}><input className="vip-input" value={(d[key] && d[key][k]) || ''} onChange={(e) => setD({ ...d, [key]: { ...d[key], [k]: e.target.value } })} maxLength={300} /></Field>
        ))}
      </div>
    </fieldset>
  );
  const submit = () => {
    const e = {};
    if (!String(d.name || '').trim()) e.name = 'Дайте проекту название';
    if (d.startDate && d.endDate && d.endDate < d.startDate) e.endDate = 'Окончание раньше начала';
    setErr(e);
    if (!Object.keys(e).length) onSave({ ...d, name: d.name.trim(), restDay: Number(d.restDay) || 0, budget: Number(d.budget) || 0, invoice: { ...d.invoice, amount: Number(d.invoice.amount) || 0 } });
  };
  return (
    <Modal title={isNew ? 'Новый проект' : 'Проект и реквизиты'} onClose={onClose} wide footer={(
      <>
        <button type="button" className="vip-secondary-btn" onClick={onClose}>Отмена</button>
        <button type="button" className="vip-primary-btn" onClick={submit}>{isNew ? 'Создать проект' : 'Сохранить'}</button>
      </>
    )}>
      <div className="vwb-form">
        <Field label="Название проекта" error={err.name} wide><input className="vip-input" value={d.name || ''} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={200} placeholder="Завод Power Silicon" /></Field>
        <Field label="Объект"><input className="vip-input" value={d.object || ''} onChange={(e) => setD({ ...d, object: e.target.value })} maxLength={300} /></Field>
        <Field label="Адрес объекта"><input className="vip-input" value={d.address || ''} onChange={(e) => setD({ ...d, address: e.target.value })} maxLength={300} /></Field>
        <Field label="Начало работ"><input className="vip-input" type="date" value={d.startDate || ''} onChange={(e) => setD({ ...d, startDate: e.target.value })} /></Field>
        <Field label="Плановое окончание" error={err.endDate}><input className="vip-input" type="date" value={d.endDate || ''} onChange={(e) => setD({ ...d, endDate: e.target.value })} /></Field>
        <Field label="Выходной день" hint="Один день в неделю — он выделен на графике">
          <select className="vip-input" value={Number(d.restDay) || 0} onChange={(e) => setD({ ...d, restDay: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 0].map((n) => <option key={n} value={n}>{WEEKDAY_NAMES[n][0].toUpperCase() + WEEKDAY_NAMES[n].slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Бюджет на строительство, ₸">
          <input className="vip-input" type="number" min="0" step="100000" inputMode="numeric" value={d.budget || ''} onChange={(e) => setD({ ...d, budget: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Счёт на оплату №"><input className="vip-input" value={(d.invoice && d.invoice.number) || ''} onChange={(e) => setD({ ...d, invoice: { ...d.invoice, number: e.target.value } })} maxLength={40} /></Field>
        <Field label="Дата счёта"><input className="vip-input" type="date" value={(d.invoice && d.invoice.date) || ''} onChange={(e) => setD({ ...d, invoice: { ...d.invoice, date: e.target.value } })} /></Field>
        <Field label="Примечание" wide><textarea className="vip-input vwb-area" rows={2} value={d.note || ''} onChange={(e) => setD({ ...d, note: e.target.value })} maxLength={2000} /></Field>
      </div>
      {!isNew && <div className="vwb-pick-cols">{party('contractor', 'Подрядчик')}{party('client', 'Заказчик')}</div>}
    </Modal>
  );
}

// ── Основной экран ──
export default function VipWorksBoard(props) {
  return <ReadOnly.Provider value={!!props.readOnly}><Board {...props} /></ReadOnly.Provider>;
}

function Board({ section = 'schedule', onToast, onProjects, readOnly = false }) {
  const today = todayIso();
  const [list, setList] = useState([]);
  const [load, setLoad] = useState({ state: 'loading', error: '' });
  const [cur, setCur] = useState(null); // { id, version, data, updatedAt }
  const [save, setSave] = useState({ state: 'idle', error: '', at: '' });
  const [view, setView] = useState('gantt');
  const [fact, setFact] = useState(false); // календарь по факту: как работы идут на самом деле
  const [mView, setMView] = useState(() => { try { return localStorage.getItem('qazgost_vip_machine_view') === 'list' ? 'list' : 'tiles'; } catch { return 'tiles'; } });
  const [mGroup, setMGroup] = useState('');
  const [docBusy, setDocBusy] = useState('');
  const docRef = useRef(null);
  const [fBrigade, setFBrigade] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [modal, setModal] = useState(null); // { type, item, isNew }
  const [confirm, setConfirm] = useState(null);
  const [showIin, setShowIin] = useState(false);
  const fileRef = useRef(null);
  const gridRef = useRef(null);
  const headRef = useRef(null); // строка с месяцами и числами: едет вбок вместе с календарём
  const queue = useRef({ timer: null, busy: false, pending: null });
  const curRef = useRef(null);
  curRef.current = cur;
  const toast = useCallback((m) => { if (onToast) onToast(m); }, [onToast]);
  const userName = useMemo(() => { try { return JSON.parse(localStorage.getItem('app_currentUser') || '{}').name || ''; } catch { return ''; } }, []);

  const open = useCallback(async (id) => {
    setLoad({ state: 'loading', error: '' });
    try {
      const p = await getProject(id);
      setCur({ id: p.id, version: p.version, data: p.data, updatedAt: p.updatedAt });
      setSave({ state: 'idle', error: '', at: '' });
      try { localStorage.setItem('qazgost_vip_project', id); } catch { /* хранилище недоступно */ }
      setLoad({ state: 'ready', error: '' });
    } catch (e) { setLoad({ state: 'error', error: e.message }); }
  }, []);

  const refresh = useCallback(async (preferId) => {
    setLoad({ state: 'loading', error: '' });
    try {
      const items = await listProjects();
      setList(items);
      if (onProjects) onProjects(items);
      let want = preferId;
      if (!want) { try { want = localStorage.getItem('qazgost_vip_project') || ''; } catch { want = ''; } }
      const pick = items.find((x) => x.id === want) || items[0];
      if (pick) await open(pick.id); else { setCur(null); setLoad({ state: 'ready', error: '' }); }
    } catch (e) { setLoad({ state: e.status === 403 ? 'forbidden' : 'error', error: e.message }); }
  }, [open, onProjects]);

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // сохранение: правки копятся и уходят на сервер одной записью; версия не даёт затереть чужую правку
  const flush = useCallback(async () => {
    const q = queue.current;
    if (q.busy || !q.pending) return;
    const { id, data } = q.pending;
    q.pending = null;
    q.busy = true;
    setSave({ state: 'saving', error: '', at: '' });
    try {
      const res = await saveProject(id, curRef.current && curRef.current.id === id ? curRef.current.version : 0, data);
      setCur((c) => (c && c.id === id ? { ...c, version: res.version, updatedAt: res.updatedAt } : c));
      curRef.current = curRef.current && curRef.current.id === id ? { ...curRef.current, version: res.version } : curRef.current;
      setList((l) => l.map((x) => (x.id === id ? { ...x, name: res.name, works: (data.works || []).length, staff: (data.staff || []).length, equipment: (data.equipment || []).length } : x)));
      setSave({ state: 'saved', error: '', at: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) });
    } catch (e) {
      q.pending = q.pending || (e.code === 'version_conflict' ? null : { id, data }); // при сбое связи правка не теряется
      setSave({ state: e.code === 'version_conflict' ? 'conflict' : 'error', error: e.message, at: '' });
      q.busy = false;
      return;
    }
    q.busy = false;
    if (q.pending) flush();
  }, []);

  const change = useCallback((mutate) => {
    if (readOnly) { toast(RO_NOTE); return; } // сервер запись тоже не примет
    setCur((c) => {
      if (!c) return c;
      const data = mutate(JSON.parse(JSON.stringify(c.data)));
      const q = queue.current;
      q.pending = { id: c.id, data };
      clearTimeout(q.timer);
      q.timer = setTimeout(flush, 600);
      return { ...c, data };
    });
    setSave((s) => (s.state === 'conflict' ? s : { state: 'pending', error: '', at: '' }));
  }, [flush, readOnly, toast]);

  useEffect(() => {
    const warn = (e) => { if (queue.current.pending || queue.current.busy) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); clearTimeout(queue.current.timer); if (queue.current.pending) flush(); };
  }, [flush]);

  const project = cur ? cur.data : null;
  const timeline = useMemo(() => (project ? buildTimeline(project, today) : null), [project, today]);
  const conflicts = useMemo(() => (project ? brigadeConflicts(project) : new Map()), [project]);
  const summary = useMemo(() => (project ? projectSummary(project, today) : null), [project, today]);
  const report = useMemo(() => (project ? assignmentReport(project) : null), [project]);
  const budget = useMemo(() => (project ? budgetSummary(project) : null), [project]);
  const machineGroups = useMemo(() => {
    const count = {};
    for (const m of (project && project.equipment) || []) { const g = machineGroup(m); count[g] = (count[g] || 0) + 1; }
    return MACHINE_GROUPS.filter((g) => count[g.id]).map((g) => ({ ...g, count: count[g.id] }));
  }, [project]);
  const brigadeName = useCallback((id) => ((project && project.brigades) || []).find((b) => b.id === id)?.name || '', [project]);
  const works = useMemo(() => {
    if (!project) return [];
    return [...(project.works || [])]
      .filter((w) => (!fBrigade || (fBrigade === '-' ? !w.brigadeId : w.brigadeId === fBrigade)) && (!fStatus || (fStatus === 'overdue' ? isOverdue(w, today) : fStatus === 'check' ? !!w.check : w.status === fStatus)))
      .sort((a, b) => (a.start === b.start ? a.end.localeCompare(b.end) : a.start.localeCompare(b.start)));
  }, [project, fBrigade, fStatus, today]);

  // при открытии графика показываем сегодняшний день
  useEffect(() => {
    if (section !== 'schedule' || view !== 'gantt' || !timeline || !gridRef.current) return;
    const i = timeline.days.findIndex((d) => d.iso === today);
    if (i >= 0) gridRef.current.scrollLeft = Math.max(0, i * CELL - gridRef.current.clientWidth / 2);
  }, [cur && cur.id, section, view, fact]); // eslint-disable-line react-hooks/exhaustive-deps

  // Где на календаре стоит полоса каждой работы (в пикселях от начала): по этому видно, какая ушла за край экрана.
  const barSpans = useMemo(() => {
    if (!timeline) return [];
    return works.map((w) => {
      const pos = barPosition(w, timeline);
      const fr = fact ? factRange(w, today) : null;
      const fpos = fr ? barPosition(fr, timeline) : null;
      const from = Math.min(pos ? pos.offset : Infinity, fpos ? fpos.offset : Infinity);
      const to = Math.max(pos ? pos.offset + pos.span : -Infinity, fpos ? fpos.offset + fpos.span : -Infinity);
      if (!Number.isFinite(from)) return null;
      const sp = { from: from * CELL, to: to * CELL, lo: from * CELL, hi: to * CELL }; // lo…hi — полоса вместе с подписью рядом с ней (на телефоне)
      if (fact || !nameFits(w.title, pos.span * CELL - 4)) {
        const need = Math.min(260, String(w.title || '').length * NAME_CHAR + 12);
        const st = capStyle(w.title, from, to, timeline.days.length);
        if ('right' in st) sp.lo = sp.from - need; else sp.hi = sp.to + need;
      }
      return sp;
    });
  }, [works, timeline, fact, today]);
  // По букве на строку: l — полоса левее видимой части, r — правее, «-» — видна. Строка меняется редко, поэтому прокрутка не перерисовывает график.
  const [edges, setEdges] = useState('');
  useEffect(() => {
    const el = gridRef.current;
    if (section !== 'schedule' || view !== 'gantt' || !el) return undefined;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const a = el.scrollLeft, b = a + el.clientWidth;
      const phone = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 720px)').matches; // на телефоне рядом с полосой стоит подпись — стрелка её не закрывает
      const sig = barSpans.map((sp) => (!sp ? '-' : (phone ? sp.hi : sp.to) <= a + 12 ? 'l' : (phone ? sp.lo : sp.from) >= b - 12 ? 'r' : '-')).join('');
      setEdges((prev) => (prev === sig ? prev : sig));
    };
    const sync = () => { if (headRef.current) headRef.current.scrollLeft = el.scrollLeft; };
    const onScroll = () => { sync(); if (!raf) raf = requestAnimationFrame(measure); };
    sync();
    measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    if (ro) ro.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); if (ro) ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [barSpans, section, view, cur && cur.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const scrollGrid = (left) => {
    const el = gridRef.current;
    if (!el) return;
    const x = Math.max(0, left);
    if (typeof el.scrollTo === 'function') el.scrollTo({ left: x, behavior: 'smooth' }); else el.scrollLeft = x;
  };
  const todayIdx = timeline ? timeline.days.findIndex((d) => d.iso === today) : -1;

  // ── действия ──
  const saveWork = (w) => {
    change((d) => { const i = d.works.findIndex((x) => x.id === w.id); if (i >= 0) d.works[i] = w; else d.works.push(w); return d; });
    setModal(null);
    toast(`✅ Работа «${w.title}» сохранена`);
  };
  const markDone = (w) => { change((d) => { const x = d.works.find((y) => y.id === w.id); if (x) { x.status = 'done'; if (!x.factStart) x.factStart = x.start; if (!x.factEnd) x.factEnd = today < x.factStart ? x.factStart : today; } return d; }); toast(`✅ «${w.title}» отмечена выполненной`); };
  const removeWork = (id) => { change((d) => { d.works = d.works.filter((x) => x.id !== id); return d; }); setModal(null); toast('🗑️ Работа удалена из графика'); };
  const upsert = (key, item) => { change((d) => { const i = d[key].findIndex((x) => x.id === item.id); if (i >= 0) d[key][i] = item; else d[key].push(item); return d; }); setModal(null); };
  const removePerson = (id) => { change((d) => { d.staff = d.staff.filter((x) => x.id !== id); d.brigades.forEach((b) => { b.members = b.members.filter((x) => x !== id); }); d.equipment.forEach((m) => { if (m.driverId === id) m.driverId = ''; }); return d; }); setModal(null); };
  const removeMachine = (id) => { change((d) => { d.equipment = d.equipment.filter((x) => x.id !== id); d.brigades.forEach((b) => { b.equipment = b.equipment.filter((x) => x !== id); }); return d; }); setModal(null); };
  const removeBrigade = (id) => { change((d) => { d.brigades = d.brigades.filter((x) => x.id !== id); d.works.forEach((w) => { if (w.brigadeId === id) w.brigadeId = ''; }); return d; }); setModal(null); };

  const pickMachineView = (v) => { setMView(v); try { localStorage.setItem('qazgost_vip_machine_view', v); } catch { /* нет хранилища */ } };
  const addDocs = async (files) => {
    if (readOnly) { toast(RO_NOTE); return; }
    for (const file of files) {
      if (!/\.(pdf|docx?|xlsx?|jpe?g|png|webp)$/i.test(file.name)) { toast(`⚠️ «${file.name}» не добавлен: подходят PDF, Word, Excel и фото`); continue; }
      if (file.size > 30 * 1048576) { toast(`⚠️ «${file.name}» больше 30 МБ`); continue; }
      setDocBusy(file.name);
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadMedia(file);
        const title = file.name.replace(/\.[^.]+$/, '');
        const kind = /смет/i.test(title) ? 'Смета' : /кс-?2|акт/i.test(title) ? 'Акт (КС-2)' : /кс-?3|справк/i.test(title) ? 'Справка (КС-3)' : /договор/i.test(title) ? 'Договор' : /сч[её]т/i.test(title) ? 'Счёт' : /черт[её]ж|план|схем/i.test(title) ? 'Чертёж' : 'Другое';
        change((d) => { d.docs = d.docs || []; d.docs.push({ id: nextId('d', d.docs), title, kind, url: res.url, name: res.name, size: res.size, date: today, addedAt: new Date().toISOString(), addedBy: userName || '' }); return d; });
      } catch (e) { toast(`⚠️ «${file.name}» не загружен: ${e.message}`); }
    }
    setDocBusy('');
  };
  const setDoc = (id, patch) => change((d) => { d.docs = (d.docs || []).map((x) => (x.id === id ? { ...x, ...patch } : x)); return d; });
  const downloadAllDocs = () => {
    (project.docs || []).forEach((doc, i) => setTimeout(() => {
      const a = document.createElement('a');
      a.href = fileUrl(doc.url); a.download = doc.name || doc.title || 'document';
      document.body.appendChild(a); a.click(); a.remove();
    }, i * 350));
  };

  const createNew = async (data) => {
    if (readOnly) { toast(RO_NOTE); return; }
    try {
      const p = await createProject({ ...emptyProject(data.name, today), ...data });
      setModal(null);
      toast(`🎉 Проект «${p.name}» создан`);
      await refresh(p.id);
    } catch (e) { toast(`⚠️ Проект не создан: ${e.message}`); }
  };
  const importFile = async (file) => {
    if (readOnly) { toast(RO_NOTE); return; }
    let doc;
    try { doc = JSON.parse(await file.text()); } catch { toast('⚠️ Файл не читается: нужен файл проекта .json'); return; }
    if (doc && doc.data && !doc.works) doc = doc.data; // файл, выгруженный вместе с номером версии
    const problem = importProblem(doc);
    if (problem) { toast(`⚠️ ${problem}`); return; }
    try {
      const p = await createProject(doc);
      toast(`🎉 Проект «${p.name}» загружен: работ ${(p.data.works || []).length}, людей ${(p.data.staff || []).length}, техники ${(p.data.equipment || []).length}`);
      await refresh(p.id);
    } catch (e) { toast(`⚠️ Проект не загружен: ${e.message}`); }
  };
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'project'}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const removeProject = async () => {
    if (readOnly) { setConfirm(null); toast(RO_NOTE); return; }
    const id = cur.id, name = project.name;
    setConfirm(null);
    try { queue.current.pending = null; await deleteProject(id); toast(`🗑️ Проект «${name}» удалён`); try { localStorage.removeItem('qazgost_vip_project'); } catch { /* нет хранилища */ } await refresh(); } catch (e) { toast(`⚠️ Проект не удалён: ${e.message}`); }
  };

  // ── состояния без проекта ──
  if (load.state === 'forbidden') {
    return <div className="vip-content-section"><div className="vwb-empty"><h3>Раздел ведут администратор и менеджер</h3><p>График работ, штат и техника рабочих проектов доступны сотрудникам офиса. Войдите под своей рабочей учётной записью.</p></div></div>;
  }
  if (load.state === 'error') {
    return <div className="vip-content-section"><div className="vwb-empty" role="alert"><h3>Не удалось открыть проекты</h3><p>{load.error}</p><button type="button" className="vip-primary-btn" onClick={() => refresh()}>Повторить</button></div></div>;
  }
  if (load.state === 'loading' && !cur) {
    return <div className="vip-content-section"><div className="vwb-empty" role="status"><div className="vwb-spinner" aria-hidden="true" /><p>Загружаем проекты…</p></div></div>;
  }

  const hiddenInput = <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); }} />;

  if (!cur) {
    return (
      <div className="vip-content-section">
        {hiddenInput}
        <div className="vwb-empty">
          <h3>Рабочих проектов пока нет</h3>
          <p>{readOnly ? 'Когда администратор добавит проект, он появится здесь. У вас просмотр без права менять.' : 'Загрузите готовый проект из файла — с работами, штатом и техникой — или создайте пустой и заполните его здесь.'}</p>
          <div className="vwb-actions" hidden={readOnly}>
            <button type="button" className="vip-primary-btn" onClick={() => fileRef.current.click()}>⬆ Загрузить проект из файла</button>
            <button type="button" className="vip-secondary-btn" onClick={() => setModal({ type: 'project', isNew: true, item: { name: '', startDate: today } })}>＋ Создать пустой проект</button>
          </div>
        </div>
        {modal && modal.type === 'project' && <ProjectCard data={modal.item} isNew onSave={createNew} onClose={() => setModal(null)} />}
      </div>
    );
  }

  const saveLabel = { idle: cur.updatedAt ? 'Сохранено на сервере' : '', pending: 'Есть несохранённые правки…', saving: 'Сохраняется…', saved: `Сохранено в ${save.at}`, error: 'Не сохранено', conflict: 'Не сохранено' }[save.state];

  return (
    <div className={cls('vip-content-section vwb', readOnly && 'vwb-ro')}>
      {hiddenInput}
      {readOnly && <div className="vwb-ro-banner" role="note"><b>Только просмотр.</b> Вы видите проект целиком; изменения вносят администратор и менеджер.</div>}
      {/* проект и действия */}
      <div className="vwb-bar">
        <label className="vwb-project">
          <span className="vwb-label">Проект</span>
          <select className="vip-input" value={cur.id} onChange={(e) => { if (queue.current.pending) flush(); open(e.target.value); }}>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="vwb-actions">
          <button type="button" className="vip-secondary-btn" onClick={() => setModal({ type: 'project', isNew: false, item: project })}>{readOnly ? 'Проект и реквизиты' : '✎ Проект и реквизиты'}</button>
          <button type="button" className="vip-secondary-btn vwb-edit" onClick={() => setModal({ type: 'project', isNew: true, item: { name: '', startDate: today } })}>＋ Новый проект</button>
          <button type="button" className="vip-secondary-btn vwb-edit" onClick={() => fileRef.current.click()}>⬆ Из файла</button>
          <button type="button" className="vip-secondary-btn" onClick={exportFile}>⬇ В файл</button>
          <button type="button" className="vip-secondary-btn vwb-edit" onClick={() => setConfirm({ title: 'Удалить проект?', text: `Проект «${project.name}» со всеми работами, штатом и техникой будет удалён с сервера. Отменить это нельзя — при необходимости сначала сохраните его в файл.`, onYes: removeProject })}>🗑 Удалить</button>
        </div>
        <span className={cls('vwb-save', save.state)} role="status">{saveLabel}</span>
      </div>
      {(save.state === 'error' || save.state === 'conflict') && (
        <div className="vwb-warn big" role="alert">
          {save.error}
          {save.state === 'error'
            ? <button type="button" className="vip-secondary-btn" onClick={flush}>Повторить сохранение</button>
            : <button type="button" className="vip-secondary-btn" onClick={() => { queue.current.pending = null; open(cur.id); }}>Открыть свежую версию</button>}
        </div>
      )}

      <div className="vwb-title">
        <div>
          <h2>{section === 'team' ? '👷 Штат и техника' : section === 'docs' ? '📄 Документы' : '📅 График работ'} — {project.name}</h2>
          <p>
            {[project.object, project.address].filter(Boolean).join(' · ') || 'Объект не указан'}
            {project.contractor && project.contractor.name ? ` · подрядчик ${project.contractor.name}` : ''}
            {project.client && project.client.name ? ` · заказчик ${project.client.name}` : ''}
          </p>
        </div>
      </div>

      {section === 'schedule' && <div className="vwb-stats">
        <div className="vwb-stat"><span>Работ</span><b>{summary.total}</b><small>{summary.first ? `${formatDay(summary.first, true)} — ${formatDay(summary.last, true)}` : 'нет дат'}</small></div>
        <div className="vwb-stat"><span>В работе</span><b>{summary.progress}</b><small>запланировано {summary.plan}</small></div>
        <div className="vwb-stat"><span>Выполнено</span><b>{summary.done}</b><small>{summary.donePct}% работ</small></div>
        <button type="button" className={cls('vwb-stat', 'btn', summary.overdue && 'bad')} onClick={() => { setFStatus(fStatus === 'overdue' ? '' : 'overdue'); }} aria-pressed={fStatus === 'overdue'}><span>Срок вышел</span><b>{summary.overdue}</b><small>нет отметки «выполнена»</small></button>
        <div className="vwb-stat"><span>Люди и техника</span><b>{(project.staff || []).length} / {(project.equipment || []).length}</b><small>бригад {(project.brigades || []).length}</small></div>
        <div className="vwb-stat"><span>Фото и видео</span><b>{summary.media}</b><small>{summary.check ? `уточнить: ${summary.check}` : 'вопросов нет'}</small></div>
      </div>}

      {section === 'schedule' && (
        <>
          <div className="vwb-toolbar">
            <div className="vwb-seg" role="group" aria-label="Вид">
              <button type="button" className={view === 'gantt' ? 'active' : ''} aria-pressed={view === 'gantt'} onClick={() => setView('gantt')}>Календарь</button>
              <button type="button" className={view === 'table' ? 'active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>Таблица</button>
            </div>
            <button type="button" className={cls('vwb-fact-btn', fact && 'active')} aria-pressed={fact} onClick={() => { setFact(!fact); setView('gantt'); }} title="Показать, как работы идут на самом деле: план остаётся бледной полосой">
              {fact ? '✓ Календарь по факту' : 'Календарь по факту'}
            </button>
            <select className="vip-input" value={fBrigade} onChange={(e) => setFBrigade(e.target.value)} aria-label="Бригада">
              <option value="">Все бригады</option>
              {(project.brigades || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              <option value="-">Без бригады</option>
            </select>
            <select className="vip-input" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Состояние">
              <option value="">Все состояния</option>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              <option value="overdue">Срок вышел</option>
              <option value="check">Нужно уточнить</option>
            </select>
            <button type="button" className="vip-primary-btn vwb-add" onClick={() => setModal({ type: 'work', isNew: true, item: { id: nextId('w', project.works), title: '', start: today, end: today, status: 'plan', brigadeId: fBrigade && fBrigade !== '-' ? fBrigade : '', media: [] } })}>＋ Добавить работу</button>
          </div>

          {works.length === 0 ? (
            <div className="vwb-empty small">{(project.works || []).length ? 'Под выбранные условия работ нет. Сбросьте отбор по бригаде и состоянию.' : 'В проекте пока нет работ. Нажмите «Добавить работу».'}</div>
          ) : view === 'gantt' ? (
            <div className="vwb-gantt" style={{ '--cell': `${CELL}px`, '--days': timeline.days.length }}>
              <div className="vwb-g-left">
                <div className="vwb-g-corner">
                  <span className="vwb-g-corner-t">Работа</span>
                  {todayIdx >= 0 && <button type="button" className="vwb-g-today" onClick={() => scrollGrid((todayIdx + 0.5) * CELL - gridRef.current.clientWidth / 2)} title="Показать сегодняшний день на календаре">Сегодня</button>}
                </div>
                {works.map((w) => (
                  <button type="button" key={w.id} className="vwb-g-name" onClick={() => setModal({ type: 'work', isNew: false, item: w })} title="Открыть работу">
                    <span className="vwb-g-ico">
                      {pic(w)
                        ? <img className="vwb-g-pic" src={pic(w)} alt="" loading="lazy" />
                        : <span className={cls('vwb-g-pic', 'art', `s-${w.status}`)}><WorkArt kind={workKind(w)} /></span>}
                      {w.check ? <i className="vwb-g-badge" aria-hidden="true">!</i> : null}
                    </span>
                    <span className="vwb-g-text">
                      <b translate="no">{w.check ? <i className="vwb-g-flag" title={w.check}>!</i> : null}{w.title}</b>
                      <small>{formatRange(w.start, w.end)}{brigadeName(w.brigadeId) ? ` · ${brigadeName(w.brigadeId)}` : ' · без бригады'}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="vwb-g-main">
              {/* месяцы и числа вынесены из прокручиваемой области: они остаются на виду, когда список работ листают вниз */}
              <div className="vwb-g-head" ref={headRef}>
                <div className="vwb-g-head-in">
                  <div className="vwb-g-months">{timeline.months.map((m) => <div key={m.key} style={{ width: m.span * CELL }}>{m.span >= 4 ? <span>{m.label}</span> : null}</div>)}</div>
                  <div className="vwb-g-days">{timeline.days.map((d) => <div key={d.iso} className={cls(d.rest && 'we', d.iso === today && 'today', d.monthStart && 'ms')}><b>{d.day}</b><small>{d.rest ? 'вых' : d.weekday}</small></div>)}</div>
                </div>
              </div>
              <div className="vwb-g-scroll" ref={gridRef} tabIndex={0} aria-label="Календарь работ, прокручивается вбок">
                <div className="vwb-g-inner">
                  <div className="vwb-g-rows">
                    <div className="vwb-g-bg" aria-hidden="true">{timeline.days.map((d) => <i key={d.iso} className={cls(d.rest && 'we', d.iso === today && 'today', d.monthStart && 'ms')} />)}</div>
                    {works.map((w) => {
                      const pos = barPosition(w, timeline);
                      const over = isOverdue(w, today);
                      if (fact) {
                        const fr = factRange(w, today);
                        const fpos = fr ? barPosition(fr, timeline) : null;
                        return (
                          <div className="vwb-g-row" key={w.id}>
                            {pos && <span className="vwb-bar-ghost" style={{ left: pos.offset * CELL + 2, width: pos.span * CELL - 4 }} aria-hidden="true" />}
                            {fpos ? (
                              <button
                                type="button"
                                className={cls('vwb-bar-item', 'fact', fr.running ? 's-progress' : 's-done', fr.shift > 0 && 'late')}
                                style={{ left: fpos.offset * CELL + 2, width: fpos.span * CELL - 4 }}
                                onClick={() => setModal({ type: 'work', isNew: false, item: w })}
                                title={`${w.title}. По плану: ${formatRange(w.start, w.end)}. По факту: ${formatRange(fr.start, fr.end)}${fr.running ? ' (идёт)' : ''}${fr.shift > 0 ? `, позже плана на ${fr.shift} дн.` : fr.shift < 0 ? `, раньше плана на ${-fr.shift} дн.` : ''}`}
                              >
                                <span>{fpos.span >= 2 ? (fr.shift > 0 ? `+${fr.shift} дн.` : fr.shift < 0 ? `−${-fr.shift} дн.` : fr.running ? 'идёт' : 'в срок') : ''}</span>
                              </button>
                            ) : pos && <span className="vwb-bar-wait" style={{ left: pos.offset * CELL + 8 }}>не начата</span>}
                            {(pos || fpos) && <span className="vwb-g-cap" translate="no" style={capStyle(w.title, Math.min(pos ? pos.offset : Infinity, fpos ? fpos.offset : Infinity), Math.max(pos ? pos.offset + pos.span : 0, fpos ? fpos.offset + fpos.span : 0), timeline.days.length)}>{w.title}</span>}
                          </div>
                        );
                      }
                      const named = pos ? nameFits(w.title, pos.span * CELL - 4) : false;
                      return (
                        <div className="vwb-g-row" key={w.id}>
                          {pos && (
                            <button
                              type="button"
                              className={cls('vwb-bar-item', `s-${w.status}`, over && 'over', conflicts.has(w.id) && 'clash')}
                              style={{ left: pos.offset * CELL + 2, width: pos.span * CELL - 4 }}
                              onClick={() => setModal({ type: 'work', isNew: false, item: w })}
                              title={`${w.title}: ${formatRange(w.start, w.end)}, ${durationDays(w.start, w.end)} дн. ${STATUS[w.status].label}${over ? ', срок вышел' : ''}${conflicts.has(w.id) ? `. Бригада занята: ${conflicts.get(w.id).join(', ')}` : ''}`}
                            >
                              <span className="vwb-bar-st">{pos.span >= 2 ? `${STATUS[w.status].short}${over && pos.span >= 4 ? ' · срок вышел' : ''}` : ''}</span>
                              {named && <span className="vwb-bar-nm" translate="no">{w.title}</span>}
                              {(w.media || []).length > 0 && pos.span >= 2 && <em>📷 {(w.media || []).length}</em>}
                            </button>
                          )}
                          {pos && !named && <span className="vwb-g-cap" translate="no" style={capStyle(w.title, pos.offset, pos.offset + pos.span, timeline.days.length)}>{w.title}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="vwb-g-edges">
                {works.map((w, n) => (
                  <div className="vwb-g-edge" key={w.id}>
                    {edges[n] === 'l' && <button type="button" className={cls('l', `s-${w.status}`)} onClick={() => scrollGrid(barSpans[n].from - 16)} aria-label="Полоса этой работы левее — показать" title="Полоса этой работы левее — показать">‹</button>}
                    {edges[n] === 'r' && <button type="button" className={cls('r', `s-${w.status}`)} onClick={() => scrollGrid(barSpans[n].from - 16)} aria-label="Полоса этой работы правее — показать" title="Полоса этой работы правее — показать">›</button>}
                  </div>
                ))}
              </div>
              </div>
            </div>
          ) : (
            <div className="vwb-table-wrap">
              <table className="vip-table vwb-table">
                <thead><tr><th>№</th><th>Работа</th><th>Место и объём</th><th>Начало</th><th>Окончание</th><th>Дней</th><th>Бригада</th><th>Состояние</th><th>Фото, видео</th></tr></thead>
                <tbody>
                  {works.map((w, i) => (
                    <tr key={w.id} onClick={() => setModal({ type: 'work', isNew: false, item: w })} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'work', isNew: false, item: w }); }}>
                      <td>{i + 1}</td>
                      <td><b>{w.title}</b>{w.check ? <span className="vwb-flag" title={w.check}>⚠ {w.check}</span> : null}</td>
                      <td>{[w.place, w.volume].filter(Boolean).join(' · ') || '—'}</td>
                      <td>{formatDay(w.start)}</td>
                      <td>{formatDay(w.end)}</td>
                      <td>{durationDays(w.start, w.end)}</td>
                      <td>{brigadeName(w.brigadeId) || <span className="vwb-muted">не назначена</span>}{conflicts.has(w.id) ? <span className="vwb-flag" title={`Пересекается: ${conflicts.get(w.id).join(', ')}`}>бригада занята</span> : null}</td>
                      <td>
                        <span className={cls('vwb-pill', `s-${w.status}`, isOverdue(w, today) && 'over')}>{STATUS[w.status].label}{isOverdue(w, today) ? ' · срок вышел' : ''}</span>
                        {isOverdue(w, today) && <button type="button" className="vwb-link vwb-done vwb-edit" onClick={(e) => { e.stopPropagation(); markDone(w); }}>✓ отметить выполненной</button>}
                      </td>
                      <td>{(w.media || []).length || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="vwb-legend">
            {STATUS_ORDER.map((s) => <span key={s}><i className={`s-${s}`} />{STATUS[s].label}</span>)}
            <span><i className="over" />Срок вышел, отметки нет</span>
            <span><i className="clash" />Бригада занята на другой работе</span>
            <span><i className="today" />Сегодня, {formatDay(today)}</span>
            <span><i className="we" /><span>Выходной:</span>&nbsp;<span>{WEEKDAY_NAMES[restDayOf(project)]}</span></span>
            {fact && <span><i className="ghost" />План</span>}
            {fact && <span><i className="late" />Позже плана</span>}
          </div>

          <div className="vwb-budget">
            <div className="vwb-budget-head">
              <h3>Бюджет на строительство</h3>
              <button type="button" className="vwb-link vwb-edit" onClick={() => setModal({ type: 'project', isNew: false, item: project })}>изменить бюджет</button>
            </div>
            {budget.budget > 0 ? (
              <>
                <div className="vwb-budget-nums">
                  <div><span>Бюджет</span><b>{money(budget.budget)}</b></div>
                  <div><span>Выполнено работ на</span><b>{money(budget.doneCost)}</b><small>{`${budget.donePct}% бюджета`}</small></div>
                  <div><span>Оплачено</span><b>{money(budget.paid)}</b><small>{`${budget.paidPct}% бюджета`}</small></div>
                  <div className={budget.left < 0 ? 'bad' : ''}><span>{budget.left < 0 ? 'Перерасход' : 'Остаток'}</span><b>{money(Math.abs(budget.left))}</b></div>
                </div>
                <div className="vwb-budget-track" role="img" aria-label={`Выполнено ${budget.donePct}%, оплачено ${budget.paidPct}%`}>
                  <i className="done" style={{ width: `${budget.donePct}%` }} />
                  <i className="paid" style={{ width: `${budget.paidPct}%` }} />
                </div>
                <p className="vwb-hint">Зелёная полоса — выполненные работы, золотая — оплата.{budget.unpriced ? ` Без стоимости работ: ${budget.unpriced} — укажите её в карточке работы.` : ''}</p>
              </>
            ) : <p className="vwb-muted">Бюджет не указан. Впишите его в «Проект и реквизиты», а стоимость и оплату — в карточках работ: здесь появятся остаток и доля выполненного.</p>}
          </div>
        </>
      )}

      {section === 'team' && (
        <>
          <details className="vwb-fold">
            <summary><span>Реквизиты подрядчика и заказчика</span><small>{[project.contractor && project.contractor.name, project.client && project.client.name].filter(Boolean).join(' · ') || 'не заполнены'}</small></summary>
          <div className="vwb-parties">
            {[['contractor', 'Подрядчик'], ['client', 'Заказчик']].map(([key, title]) => {
              const p = project[key] || {};
              const rows = PARTY_FIELDS.filter(([k]) => k !== 'name' && p[k]);
              return (
                <div className="vwb-party" key={key}>
                  <span className="vwb-label">{title}</span>
                  <h3>{p.name || 'Не указан'}</h3>
                  {rows.length ? <dl>{rows.map(([k, label]) => <React.Fragment key={k}><dt>{label}</dt><dd>{p[k]}</dd></React.Fragment>)}</dl> : <p className="vwb-muted">Реквизиты не заполнены.</p>}
                  {key === 'contractor' && project.invoice && project.invoice.number ? <p className="vwb-hint">Счёт на оплату № {project.invoice.number}{project.invoice.date ? ` от ${formatDay(project.invoice.date)} ${project.invoice.date.slice(0, 4)} г.` : ''}</p> : null}
                </div>
              );
            })}
          </div>
          </details>

          <div className="vwb-subhead">
            <h3>Бригады <span className="vwb-muted">({(project.brigades || []).length})</span></h3>
            <span className="vwb-hint">В бригаде {BRIGADE_PEOPLE.min}–{BRIGADE_PEOPLE.max} человека и {BRIGADE_MACHINES.min}–{BRIGADE_MACHINES.max} единицы техники</span>
            <button type="button" className="vip-primary-btn vwb-add" onClick={() => setModal({ type: 'brigade', isNew: true, item: { id: nextId('b', project.brigades), name: `Бригада ${(project.brigades || []).length + 1}`, members: [], equipment: [] } })}>＋ Новая бригада</button>
          </div>
          {(report.freePeople.length > 0 || report.freeMachines.length > 0 || report.peopleTwice.length > 0 || report.machinesTwice.length > 0) && (
            <div className="vwb-warn" role="status">
              {report.freePeople.length > 0 && <span>Без бригады: {report.freePeople.map((id) => shortName(project.staff.find((p) => p.id === id).name)).join(', ')}. </span>}
              {report.freeMachines.length > 0 && <span>Техника в резерве: {report.freeMachines.map((id) => { const m = project.equipment.find((x) => x.id === id); return `${m.name}${m.plate ? ` (${m.plate})` : ''}`; }).join(', ')}. </span>}
              {report.peopleTwice.length > 0 && <span>В двух бригадах сразу: {report.peopleTwice.map((id) => shortName(project.staff.find((p) => p.id === id).name)).join(', ')}. </span>}
              {report.machinesTwice.length > 0 && <span>Техника в двух бригадах: {report.machinesTwice.map((id) => project.equipment.find((x) => x.id === id).name).join(', ')}.</span>}
            </div>
          )}
          {(project.brigades || []).length === 0
            ? <div className="vwb-empty small">Бригад пока нет. Добавьте людей и технику ниже, затем соберите бригады.</div>
            : (
              <div className="vwb-brigades">
                {project.brigades.map((b) => {
                  const issues = brigadeIssues(b);
                  const bw = (project.works || []).filter((w) => w.brigadeId === b.id).sort((x, y) => x.start.localeCompare(y.start));
                  return (
                    <div className={cls('vwb-brigade', issues.length && 'bad')} key={b.id}>
                      <div className="vwb-brigade-head">
                        <h4>{b.name}</h4>
                        <button type="button" className="vwb-link" onClick={() => setModal({ type: 'brigade', isNew: false, item: b })}>{readOnly ? 'открыть состав' : 'изменить состав'}</button>
                      </div>
                      <span className={cls('vwb-pill', issues.length ? 'over' : 's-done')}>{b.members.length} чел. · {b.equipment.length} ед. техники{issues.length ? ` — ${issues.join('; ')}` : ''}</span>
                      <ul className="people">{b.members.map((id) => { const p = project.staff.find((x) => x.id === id); return p ? <li key={id}><Avatar person={p} size={40} /><span><b>{p.name}</b><small>{p.role || 'должность не указана'}</small></span></li> : null; })}</ul>
                      <ul className="m people">{b.equipment.map((id) => { const m = project.equipment.find((x) => x.id === id); return m ? <li key={id}><MachinePic machine={m} group={machineGroup(m)} className="mini" /><span><b>{m.name}</b><small>{m.plate || 'без номера'}</small></span></li> : null; })}</ul>
                      <div className="vwb-brigade-works">
                        <span className="vwb-label">Работы ({bw.length})</span>
                        {bw.length ? bw.map((w) => <button type="button" key={w.id} className={cls('vwb-work-link', conflicts.has(w.id) && 'clash')} onClick={() => setModal({ type: 'work', isNew: false, item: w })}>{w.title}<small>{formatRange(w.start, w.end)}</small></button>) : <span className="vwb-muted">работ не назначено</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          <div className="vwb-subhead">
            <h3>Штат <span className="vwb-muted">({(project.staff || []).length})</span></h3>
            <label className="vwb-check inline"><input type="checkbox" checked={showIin} onChange={(e) => setShowIin(e.target.checked)} /><span>Показать ИИН</span></label>
            <button type="button" className="vip-primary-btn vwb-add" onClick={() => setModal({ type: 'person', isNew: true, item: { id: nextId('p', project.staff), name: '' } })}>＋ Добавить работника</button>
          </div>
          <div className="vwb-table-wrap">
            <table className="vip-table vwb-table vwb-staff">
              <thead><tr><th>№</th><th>Фото</th><th>Фамилия, имя, отчество</th><th>Должность</th><th>ИИН</th><th>Бригада</th><th>Техника</th></tr></thead>
              <tbody>
                {(project.staff || []).length === 0 && <tr className="none"><td colSpan={7}>В штате пока никого нет.</td></tr>}
                {(project.staff || []).map((p, i) => (
                  <tr key={p.id} onClick={() => setModal({ type: 'person', isNew: false, item: p })} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'person', isNew: false, item: p }); }}>
                    <td className="num">{i + 1}</td><td className="ava"><Avatar person={p} size={44} /></td><td className="name"><b translate="no">{p.name}</b></td><td className={p.role ? 'role' : 'role empty'}>{p.role || '—'}</td>
                    <td className={p.iin ? 'iin' : 'iin empty'}>{p.iin ? (showIin ? p.iin : '•••• скрыт') : '—'}</td>
                    <td className="brig">{report.brigadeOf.get(p.id)?.name || <span className="vwb-muted">без бригады</span>}</td>
                    <td className={(project.equipment || []).some((m) => m.driverId === p.id) ? 'tech' : 'tech empty'}>{(project.equipment || []).filter((m) => m.driverId === p.id).map((m) => m.name).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="vwb-subhead">
            <h3>Техника <span className="vwb-muted">({(project.equipment || []).length})</span></h3>
            <button type="button" className="vip-primary-btn vwb-add" onClick={() => setModal({ type: 'machine', isNew: true, item: { id: nextId('m', project.equipment), name: '' } })}>＋ Добавить технику</button>
          </div>
          {(project.equipment || []).length > 0 && (
            <div className="vwb-toolbar">
              <div className="vwb-groups" role="group" aria-label="Подгруппа техники">
                <button type="button" className={cls('vwb-group', !mGroup && 'active')} aria-pressed={!mGroup} onClick={() => setMGroup('')}>Вся техника <b>{project.equipment.length}</b></button>
                {machineGroups.map((g) => (
                  <button type="button" key={g.id} className={cls('vwb-group', mGroup === g.id && 'active')} aria-pressed={mGroup === g.id} onClick={() => setMGroup(mGroup === g.id ? '' : g.id)}>
                    <MachineArt group={g.id} />{g.label} <b>{g.count}</b>
                  </button>
                ))}
              </div>
              <div className="vwb-seg" role="group" aria-label="Вид списка техники">
                <button type="button" className={mView === 'tiles' ? 'active' : ''} aria-pressed={mView === 'tiles'} onClick={() => pickMachineView('tiles')}>Плитки</button>
                <button type="button" className={mView === 'list' ? 'active' : ''} aria-pressed={mView === 'list'} onClick={() => pickMachineView('list')}>Список</button>
              </div>
            </div>
          )}
          {(project.equipment || []).length === 0 && <div className="vwb-empty small">Техника пока не добавлена.</div>}
          {(mGroup && machineGroups.some((g) => g.id === mGroup) ? machineGroups.filter((g) => g.id === mGroup) : machineGroups).map((g) => {
            const items = project.equipment.filter((m) => machineGroup(m) === g.id);
            return (
              <section className="vwb-mgroup" key={g.id} aria-label={g.label}>
                <h4><MachineArt group={g.id} />{g.label} <span className="vwb-muted">({items.length})</span></h4>
                {mView === 'tiles' ? (
                  <div className="vwb-tiles">
                    {items.map((m) => {
                      const driver = (project.staff || []).find((p) => p.id === m.driverId);
                      return (
                        <button type="button" className="vwb-tile" key={m.id} onClick={() => setModal({ type: 'machine', isNew: false, item: m })}>
                          <MachinePic machine={m} group={g.id} />
                          <b>{m.name}</b>
                          <span className="plate">{m.plate || 'без номера'}</span>
                          <small>{driver ? <><Avatar person={driver} size={20} />{shortName(driver.name)}</> : 'водитель не закреплён'}</small>
                          <small>{report.machineBrigade.get(m.id)?.name || 'резерв'}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="vwb-table-wrap">
                    <table className="vip-table vwb-table">
                      <thead><tr><th>Фото</th><th>Техника, автомобиль</th><th>Госномер</th><th>Водитель</th><th>Бригада</th></tr></thead>
                      <tbody>
                        {items.map((m) => (
                          <tr key={m.id} onClick={() => setModal({ type: 'machine', isNew: false, item: m })} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'machine', isNew: false, item: m }); }}>
                            <td className="ava"><MachinePic machine={m} group={g.id} className="mini" /></td><td><b>{m.name}</b></td><td>{m.plate || '—'}</td>
                            <td>{(project.staff || []).find((p) => p.id === m.driverId)?.name || '—'}</td>
                            <td>{report.machineBrigade.get(m.id)?.name || <span className="vwb-muted">резерв</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      {section === 'docs' && (
        <>
          <div className="vwb-subhead">
            <h3>Документы проекта <span className="vwb-muted">({(project.docs || []).length})</span></h3>
            <span className="vwb-hint">Договоры, сметы, акты КС-2 и КС-3, счета, чертежи: PDF, Word, Excel и фото до 30 МБ</span>
            {(project.docs || []).length > 1 && <button type="button" className="vip-secondary-btn" onClick={downloadAllDocs}>⬇ Скачать все</button>}
            <button type="button" className="vip-primary-btn vwb-add" disabled={!!docBusy} onClick={() => docRef.current && docRef.current.click()}>{docBusy ? 'Загружается…' : '＋ Добавить документы'}</button>
            <input ref={docRef} type="file" accept={DOC_ACCEPT} multiple hidden onChange={(e) => { const f = [...e.target.files]; e.target.value = ''; addDocs(f); }} />
          </div>
          {docBusy && <div className="vwb-warn" role="status"><span>Загружается файл:</span> {docBusy}</div>}
          {(project.docs || []).length === 0 ? (
            <div className="vwb-empty small">Документов пока нет. Нажмите «Добавить документы» и выберите сразу все файлы — они сохранятся в проекте и будут доступны с любого устройства.</div>
          ) : (
            <div className="vwb-table-wrap">
              <table className="vip-table vwb-table vwb-docs">
                <thead><tr><th>№</th><th>Документ</th><th>Вид</th><th>Дата</th><th>Размер</th><th>Кто добавил</th><th aria-label="Действия" /></tr></thead>
                <tbody>
                  {project.docs.map((doc, i) => (
                    <tr key={doc.id} className="plain">
                      <td>{i + 1}</td>
                      <td><input className="vip-input" value={doc.title || ''} onChange={(e) => setDoc(doc.id, { title: e.target.value })} maxLength={200} aria-label="Название документа" disabled={readOnly} /><small className="vwb-muted">{doc.name}</small></td>
                      <td><select className="vip-input" value={DOC_KINDS.includes(doc.kind) ? doc.kind : 'Другое'} onChange={(e) => setDoc(doc.id, { kind: e.target.value })} aria-label="Вид документа" disabled={readOnly}>{DOC_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></td>
                      <td>{doc.date ? `${formatDay(doc.date, true)} ${doc.date.slice(0, 4)}` : '—'}</td>
                      <td>{doc.size ? fmtSize(doc.size) : '—'}</td>
                      <td>{doc.addedBy || '—'}</td>
                      <td className="acts">
                        <a className="vip-secondary-btn" href={fileUrl(doc.url)} download={doc.name || doc.title} target="_blank" rel="noreferrer">⬇ Скачать</a>
                        <button type="button" className="vwb-link vwb-edit" onClick={() => setConfirm({ title: 'Убрать документ?', text: `Документ «${doc.title || doc.name}» исчезнет из проекта.`, yes: 'Убрать', onYes: () => { change((d) => { d.docs = (d.docs || []).filter((x) => x.id !== doc.id); return d; }); setConfirm(null); } })}>убрать</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal && modal.type === 'work' && <WorkCard work={modal.item} isNew={modal.isNew} project={project} onSave={saveWork} onDelete={removeWork} onClose={() => setModal(null)} userName={userName} />}
      {modal && modal.type === 'person' && <PersonCard person={modal.item} isNew={modal.isNew} onSave={(p) => upsert('staff', p)} onDelete={removePerson} onClose={() => setModal(null)} />}
      {modal && modal.type === 'machine' && <MachineCard machine={modal.item} isNew={modal.isNew} staff={project.staff || []} onSave={(m) => upsert('equipment', m)} onDelete={removeMachine} onClose={() => setModal(null)} />}
      {modal && modal.type === 'brigade' && <BrigadeCard brigade={modal.item} isNew={modal.isNew} project={project} onSave={(b) => upsert('brigades', b)} onDelete={removeBrigade} onClose={() => setModal(null)} />}
      {modal && modal.type === 'project' && <ProjectCard data={modal.item} isNew={modal.isNew} onSave={modal.isNew ? createNew : (d) => { change(() => d); setModal(null); toast('✅ Проект сохранён'); }} onClose={() => setModal(null)} />}
      {confirm && <Confirm title={confirm.title} text={confirm.text} yes={confirm.yes} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
    </div>
  );
}
