import React, { lazy, Suspense, useMemo, useState } from 'react';
import {
  STATUS, todayIso, formatDay, formatRange, isOverdue, projectSummary, budgetSummary, money,
  workKind, workPicture, HANGAR, WORK_SHAPES, projectPlaces,
} from './vipSchedule';
import { WorkArt, Avatar } from './VipVisuals';

// Карточка рабочего объекта на вкладке «Мои объекты»: сводка, модель ангара и список работ.
// Нажатие на работу подсвечивает на модели место, где она выполняется.

const Hangar3D = lazy(() => import('./Hangar3D')); // three.js грузится только когда модель на экране
const shapeLabel = (id) => (WORK_SHAPES.find((x) => x.id === id) || WORK_SHAPES[WORK_SHAPES.length - 1]).label;

export default function VipObjectView({ project, onOpen }) {
  const today = todayIso();
  const summary = useMemo(() => projectSummary(project, today), [project, today]);
  const budget = useMemo(() => budgetSummary(project), [project]);
  const works = useMemo(() => {
    const rank = { progress: 0, plan: 1, hold: 2, done: 3 };
    return [...(project.works || [])].sort((a, b) => (rank[a.status] - rank[b.status]) || String(a.start).localeCompare(String(b.start)));
  }, [project]);
  // что и где показать на модели для каждой работы
  const places = useMemo(() => projectPlaces(project.works), [project]);
  const items = useMemo(() => works.map((w) => ({ id: w.id, title: w.title, status: w.status, ...places.get(w.id) })), [works, places]);
  const [picked, setPicked] = useState(null);
  const [skin, setSkin] = useState(true); // обшивка стен и кровли; без неё виден один каркас
  const current = works.find((w) => w.id === picked) || null;
  const running = works.filter((w) => w.status === 'progress');

  return (
    <div className="vob">
      <div className="vob-head">
        <div>
          <span className="vob-tag">🏭 Ваш объект</span>
          <h3 translate="no">{project.name}</h3>
          <p>{[project.object, project.address].filter(Boolean).join(' · ') || 'Адрес не указан'}</p>
        </div>
        <div className="vob-actions">
          <button type="button" className="vip-primary-btn" onClick={() => onOpen('schedule')}>📅 График работ</button>
          <button type="button" className="vip-secondary-btn" onClick={() => onOpen('team')}>👷 Штат и техника</button>
          <button type="button" className="vip-secondary-btn" onClick={() => onOpen('docs')}>📄 Документы</button>
        </div>
      </div>

      <div className="vob-progress">
        <div className="vob-progress-top"><span>Выполнено работ</span><b>{`${summary.done} из ${summary.total} · ${summary.donePct}%`}</b></div>
        <div className="vob-track"><i style={{ width: `${summary.donePct}%` }} /></div>
      </div>

      <div className="vob-stats">
        <div><span>В работе</span><b>{summary.progress}</b></div>
        <div className={summary.overdue ? 'bad' : ''}><span>Срок вышел</span><b>{summary.overdue}</b></div>
        <div><span>Люди</span><b>{(project.staff || []).length}</b></div>
        <div><span>Техника</span><b>{(project.equipment || []).length}</b></div>
        <div><span>Бюджет</span><b>{budget.budget ? money(budget.budget) : '—'}</b></div>
        <div><span>Сроки</span><b>{summary.first ? `${formatDay(summary.first, true)} — ${formatDay(summary.last, true)}` : '—'}</b></div>
      </div>

      {running.length > 0 && (
        <div className="vob-now">
          <span className="vwb-label">{`Сейчас в работе: ${running.length}`}</span>
          <div className="vob-now-list">
            {running.map((w) => (
              <button type="button" key={w.id} className={picked === w.id ? 'active' : ''} onClick={() => setPicked(w.id)}>
                {workPicture(w) ? <img src={workPicture(w)} alt="" loading="lazy" /> : <span className="art"><WorkArt kind={workKind(w)} /></span>}
                <b translate="no">{w.title}</b>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vob-model">
        <div className="vob-model-3d">
          <div className="vob-model-cap">
            <div className="vwb-seg vob-skin" role="group" aria-label="Вид модели">
              <button type="button" className={skin ? 'active' : ''} aria-pressed={skin} onClick={() => setSkin(true)}>С обшивкой</button>
              <button type="button" className={!skin ? 'active' : ''} aria-pressed={!skin} onClick={() => setSkin(false)}>Каркас</button>
            </div>
            <b>{`Ангар ${HANGAR.width} × ${HANGAR.length} м`}</b>
            <span>{`стены ${HANGAR.eave} м · конёк ${HANGAR.ridge} м · стальной каркас`}</span>
          </div>
          <Suspense fallback={<div className="vob-3d vob-3d-wait" style={{ height: 440 }} role="status">Загружаем модель ангара…</div>}>
            <Hangar3D items={items} selected={current ? current.id : ''} skin={skin} height={440} />
          </Suspense>
          <div className="vob-legend">
            <span><i className="s-progress" />в работе</span><span><i className="s-done" />выполнена</span><span><i className="s-plan" />запланирована</span><span><i className="pick" />выбранная работа</span>
          </div>
          <p className="vob-model-note">Расположение внутри здания (второй этаж, лестницы, оборудование) показано схемой. Точное место работы задаётся в её карточке, на плане.</p>
          <p className="vob-model-hint" role="status">
            {current ? <><span>Подсвечено:</span> <b translate="no">{current.title}</b> — <span>{shapeLabel(places.get(current.id).shape)}</span>, <span>{places.get(current.id).label}</span></> : 'На модели показаны все работы объекта. Выберите работу в списке — она подсветится, и камера повернётся к ней. Модель вращается пальцем или мышью.'}
          </p>
        </div>
        <div className="vob-works" aria-label="Работы по объекту">
          <div className="vob-works-head"><b>Работы по объекту</b><span>{works.length}</span></div>
          {works.length === 0 && <p className="vwb-muted">Работ пока нет — добавьте их в графике.</p>}
          <ul>
            {works.map((w) => {
              const over = isOverdue(w, today);
              return (
                <li key={w.id}>
                  <button type="button" className={picked === w.id ? 'active' : ''} aria-pressed={picked === w.id} onClick={() => setPicked(picked === w.id ? null : w.id)}>
                    {workPicture(w) ? <img src={workPicture(w)} alt="" loading="lazy" /> : <span className={`art s-${w.status}`}><WorkArt kind={workKind(w)} /></span>}
                    <span className="t">
                      <b translate="no">{w.title}</b>
                      <small>{formatRange(w.start, w.end)} · <span>{places.get(w.id).label}</span></small>
                    </span>
                    <em className={`s-${w.status}${over ? ' over' : ''}`}>{over ? 'Срок вышел' : STATUS[w.status].short}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {(project.staff || []).length > 0 && (
        <div className="vob-people">
          <span className="vwb-label">Люди на объекте</span>
          <div>{project.staff.slice(0, 14).map((p) => <span key={p.id} title={p.role || ''}><Avatar person={p} size={44} /><small translate="no">{p.name.split(/\s+/)[0]}</small></span>)}
            {project.staff.length > 14 && <button type="button" className="vwb-link" onClick={() => onOpen('team')}>{`ещё ${project.staff.length - 14}`}</button>}
          </div>
        </div>
      )}
    </div>
  );
}
