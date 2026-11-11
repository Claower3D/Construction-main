import React, { useEffect, useRef, useState } from 'react';
import {
  Download, FileSpreadsheet, FileText, Box, Smartphone, Camera, AlertTriangle, Trash2, FolderOpen, RotateCcw, RotateCw,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Check, Layers, Eye,
} from 'lucide-react';

export const fmt = (v, d = 2) => Number(v || 0).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Числовое поле: принимает запятую и точку, применяет значение по Enter или при уходе из поля. */
export function NumField({ id, label, value, onCommit, min, max, unit, digits = 2, hint }) {
  const [text, setText] = useState(() => String(value).replace('.', ','));
  const [bad, setBad] = useState(false);
  useEffect(() => { setText(String(Math.round(value * 10 ** digits) / 10 ** digits).replace('.', ',')); setBad(false); }, [value, digits]);
  const commit = () => {
    const n = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) {
      setBad(true);
      return;
    }
    setBad(false);
    if (Math.abs(n - value) > 1e-9) onCommit(n);
  };
  return (
    <div className="p3-field">
      <label htmlFor={id}>{label}{unit ? `, ${unit}` : ''}</label>
      <input
        id={id} className="p3-input p3-input--num" type="text" inputMode="decimal" value={text}
        aria-invalid={bad || undefined} aria-describedby={bad || hint ? `${id}-hint` : undefined}
        onChange={(e) => setText(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      />
      {(bad || hint) && <p id={`${id}-hint`} className={bad ? 'p3-field-error' : 'p3-muted'}>{bad ? `Допустимо от ${String(min).replace('.', ',')} до ${String(max).replace('.', ',')}` : hint}</p>}
    </div>
  );
}

// ── Ведомость объёмов ─────────────────────────────────────────────────────────
export function QuantitiesPanel({ q, onExport, busy }) {
  const t = q.totals;
  return (
    <section className="p3-panel p3-qty" aria-labelledby="p3-qty-title">
      <header className="p3-section-head">
        <h2 id="p3-qty-title" className="p3-h3">Ведомость объёмов</h2>
        <button type="button" className="p3-btn p3-btn--ghost" onClick={onExport} disabled={busy}><FileSpreadsheet size={18} aria-hidden="true" />Выгрузить в Excel</button>
      </header>

      <dl className="p3-kpis">
        <div><dt>Стены, объём</dt><dd>{fmt(t.wallVolume)} м³</dd></div>
        <div><dt>Стены, площадь без проёмов</dt><dd>{fmt(t.wallArea)} м²</dd></div>
        <div><dt>Перекрытия, объём</dt><dd>{fmt(t.slabVolume)} м³</dd></div>
        <div><dt>Помещения в свету</dt><dd>{fmt(t.roomsNetArea)} м²</dd></div>
      </dl>

      {t.unclosedFloors > 0 && (
        <p className="p3-alert" role="status"><AlertTriangle size={18} aria-hidden="true" />Контур стен замкнут не на всех этажах: там не посчитаны помещения и перекрытие. Доведите стены до углов на плане.</p>
      )}

      {q.floors.map((f) => (
        <div key={f.id} className="p3-qty-floor">
          <h3 className="p3-h4">{f.name}</h3>
          <p className="p3-muted">Дверей: {f.doors} · окон: {f.windows} · помещений: {f.rooms.length}</p>
          {f.walls.length > 0 ? (
            <table className="p3-table">
              <caption className="p3-sr">Стены этажа по толщине</caption>
              <thead><tr><th scope="col">Толщина</th><th scope="col">Длина, м</th><th scope="col">Проёмы, м²</th><th scope="col">Площадь, м²</th><th scope="col">Объём, м³</th></tr></thead>
              <tbody>
                {f.walls.map((g) => (
                  <tr key={g.t}>
                    <th scope="row" data-label="Толщина">{Math.round(g.t * 1000)} мм</th>
                    <td data-label="Длина, м">{fmt(g.length)}</td>
                    <td data-label="Проёмы, м²">{fmt(g.openings)}</td>
                    <td data-label="Площадь, м²">{fmt(g.net)}</td>
                    <td data-label="Объём, м³">{fmt(g.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="p3-muted">На этаже нет стен.</p>}
          {f.rooms.length > 0 && (
            <table className="p3-table">
              <caption className="p3-sr">Помещения этажа</caption>
              <thead><tr><th scope="col">Помещение</th><th scope="col">В свету, м²</th><th scope="col">По осям, м²</th><th scope="col">Периметр, м</th></tr></thead>
              <tbody>
                {f.rooms.map((r) => (
                  <tr key={r.n}>
                    <th scope="row" data-label="Помещение">№ {r.n}</th>
                    <td data-label="В свету, м²">{fmt(r.netArea)}</td>
                    <td data-label="По осям, м²">{fmt(r.area)}</td>
                    <td data-label="Периметр, м">{fmt(r.perimeter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <div className="p3-qty-floor">
        <h3 className="p3-h4">Перекрытия</h3>
        <table className="p3-table">
          <caption className="p3-sr">Плиты перекрытия</caption>
          <thead><tr><th scope="col">Плита</th><th scope="col">Площадь, м²</th><th scope="col">Объём, м³</th></tr></thead>
          <tbody>
            {q.slabs.map((s) => (
              <tr key={s.name}><th scope="row" data-label="Плита">{s.name}</th><td data-label="Площадь, м²">{fmt(s.area)}</td><td data-label="Объём, м³">{fmt(s.volume)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="p3-note">
        Объёмы посчитаны по осям стен. Площадь «в свету» точна для помещений с прямыми углами, для остальных — приближённая.
        Перемычки, армирование, фундамент и кровля в модель не входят.
      </p>
    </section>
  );
}

// ── Выгрузка ──────────────────────────────────────────────────────────────────
export function ExportPanel({ floorName, onExport, busy, hasWalls }) {
  const items = [
    { id: 'svg', icon: FileText, title: `Чертёж плана: ${floorName}`, text: 'Лист А3 с размерами, площадями помещений и штампом. Формат SVG: откройте в браузере и напечатайте или сохраните как PDF.' },
    { id: 'dxf', icon: Layers, title: `План в DXF: ${floorName}`, text: 'Для AutoCAD, nanoCAD и Компаса. Слои: стены, окна, двери, оси, помещения. Единицы — миллиметры.' },
    { id: 'glb', icon: Box, title: '3D-модель (GLB)', text: 'Открывается в Blender, в просмотрщике Windows и в любом glTF-вьюере.' },
    { id: 'xlsx', icon: FileSpreadsheet, title: 'Ведомость объёмов (Excel)', text: 'Стены по толщинам, помещения, перекрытия — по этажам и итогом.' },
    { id: 'json', icon: Download, title: 'Файл проекта', text: 'Чтобы передать модель коллеге или открыть позже: кнопка «Открыть» на стартовом экране.' },
  ];
  return (
    <section className="p3-panel p3-export" aria-labelledby="p3-export-title">
      <h2 id="p3-export-title" className="p3-h3">Чертежи, модель и ведомость</h2>
      <ul className="p3-export-list">
        {items.map((it) => (
          <li key={it.id}>
            <it.icon size={22} aria-hidden="true" />
            <div>
              <p className="p3-export-title">{it.title}</p>
              <p className="p3-muted">{it.text}</p>
            </div>
            <button type="button" className="p3-btn p3-btn--ghost" onClick={() => onExport(it.id)} disabled={busy || !hasWalls} data-export={it.id}>
              <Download size={18} aria-hidden="true" />Скачать
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Мои модели ────────────────────────────────────────────────────────────────
export function ModelsList({ items, loading, error, onOpen, onDelete, serverMode }) {
  const [confirm, setConfirm] = useState(null);
  if (loading) return <p className="p3-muted" role="status">Загружаем список моделей…</p>;
  return (
    <div className="p3-models">
      {error && <p className="p3-alert" role="alert"><AlertTriangle size={18} aria-hidden="true" />{error}</p>}
      {!items.length && !error && (
        <p className="p3-muted">
          Сохранённых моделей пока нет. {serverMode ? 'Сохранённые модели откроются на любом устройстве после входа в аккаунт.' : 'Без входа в аккаунт модели хранятся только в этом браузере.'}
        </p>
      )}
      <ul className="p3-models-list">
        {items.map((m) => (
          <li key={`${m.where}-${m.id}`}>
            <div className="p3-models-info">
              <p className="p3-models-name" translate="no">{m.name}</p>
              <p className="p3-muted">
                Этажей: {m.floors} · стен: {m.walls}{m.area ? ` · ${fmt(m.area, 1)} м²` : ''} · {new Date(m.updatedAt).toLocaleDateString('ru-RU')}
                {' · '}{m.where === 'server' ? 'на сервере' : 'в этом браузере'}
              </p>
            </div>
            {confirm === m.id ? (
              <div className="p3-actions">
                <button type="button" className="p3-btn p3-btn--danger" onClick={() => { setConfirm(null); onDelete(m); }}>Удалить навсегда</button>
                <button type="button" className="p3-btn p3-btn--ghost" onClick={() => setConfirm(null)}>Оставить</button>
              </div>
            ) : (
              <div className="p3-actions">
                <button type="button" className="p3-btn p3-btn--ghost" onClick={() => onOpen(m)}><FolderOpen size={18} aria-hidden="true" />Открыть</button>
                <button type="button" className="p3-icon-btn" onClick={() => setConfirm(m.id)} aria-label={`Удалить модель ${m.name}`}><Trash2 size={18} aria-hidden="true" /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Камера: наложение модели на площадку ──────────────────────────────────────
export function ArPanel({ support, anchors, onStart, onQuickLook, busy, hasWalls, error }) {
  return (
    <section className="p3-panel p3-ar-panel" aria-labelledby="p3-ar-title">
      <h2 id="p3-ar-title" className="p3-h3">Навести камеру</h2>
      {support === 'checking' && <p className="p3-muted" role="status">Проверяем, что умеет это устройство…</p>}

      {support === 'webxr' && (
        <>
          <p className="p3-muted">Модель появится поверх картинки с камеры. Телефон должен видеть пол или землю: поводите им из стороны в сторону, пока не появится золотое кольцо.</p>
          <div className="p3-ar-modes">
            <div className="p3-ar-mode">
              <p className="p3-export-title">Макет</p>
              <p className="p3-muted">Уменьшенная модель на столе или на полу. Удобно показать заказчику и обойти здание вокруг.</p>
              <button type="button" className="p3-btn p3-btn--gold" onClick={() => onStart('table')} disabled={busy || !hasWalls}><Camera size={18} aria-hidden="true" />Показать макет</button>
            </div>
            <div className="p3-ar-mode">
              <p className="p3-export-title">На площадке, 1:1</p>
              <p className="p3-muted">
                Модель в натуральную величину. Встаньте у угла A, отметьте его, затем отметьте угол B
                {anchors ? ` — он в ${fmt(anchors.distance)} м от A` : ''}. Точки A и B показаны на плане.
              </p>
              <button type="button" className="p3-btn p3-btn--gold" onClick={() => onStart('site')} disabled={busy || !hasWalls}><Camera size={18} aria-hidden="true" />Поставить на площадку</button>
            </div>
          </div>
          <p className="p3-note">Телефон держит привязку по камере и датчикам: рядом с точкой A точность — сантиметры, в десятках метров от неё модель может уплыть. Для разбивки осей нужен геодезический прибор.</p>
        </>
      )}

      {support === 'quicklook' && (
        <>
          <p className="p3-muted">На iPhone и iPad модель открывается в «Быстром просмотре»: она встанет на пол в натуральную величину, её можно двигать, вращать и уменьшать пальцами. Привязки по точкам A и B в этом режиме нет.</p>
          <button type="button" className="p3-btn p3-btn--gold" onClick={onQuickLook} disabled={busy || !hasWalls}><Smartphone size={18} aria-hidden="true" />Открыть в AR</button>
        </>
      )}

      {support === 'none' && (
        <div className="p3-notice" role="status">
          <Smartphone size={18} aria-hidden="true" />
          <p>Этот браузер не умеет накладывать модель на камеру. Сохраните модель и откройте эту страницу на телефоне: в Chrome на Android с поддержкой ARCore или в Safari на iPhone.</p>
        </div>
      )}
      {error && <p className="p3-alert" role="alert"><AlertTriangle size={18} aria-hidden="true" />{error}</p>}
    </section>
  );
}

/** Экран поверх камеры. Корень должен существовать в DOM до запуска сеанса — браузер разворачивает именно его. */
export const ArOverlay = React.forwardRef(function ArOverlay({ active, state, controller, floors }, ref) {
  const fine = state?.mode === 'table' ? 0.01 : 0.05;
  const placed = state?.step === 'placed';
  const hold = useRef(null);
  useEffect(() => () => clearInterval(hold.current), []);
  // удержание кнопки повторяет действие
  const repeat = (fn) => ({
    onPointerDown: (e) => { e.preventDefault(); fn(); clearInterval(hold.current); hold.current = setInterval(fn, 120); },
    onPointerUp: () => clearInterval(hold.current),
    onPointerLeave: () => clearInterval(hold.current),
    onPointerCancel: () => clearInterval(hold.current),
  });

  let title = '';
  let text = '';
  if (state) {
    if (!state.hit && !placed) {
      title = 'Ищем поверхность';
      text = 'Медленно поводите телефоном, чтобы камера увидела пол или землю.';
    } else if (state.mode === 'table' && !placed) {
      title = 'Куда поставить макет';
      text = 'Наведите золотое кольцо на стол или пол и нажмите «Поставить».';
    } else if (state.step === 'A') {
      title = 'Точка A';
      text = 'Наведите кольцо на угол здания, отмеченный на плане буквой A.';
    } else if (state.step === 'B') {
      title = 'Точка B';
      text = `Перейдите ко второму углу — он в ${fmt(state.expected)} м от A — и наведите кольцо на него.`;
    } else if (state.mode === 'table') {
      title = `Макет 1:${state.ratio}`;
      text = 'Обойдите макет вокруг. Кнопками ниже его можно повернуть и подвинуть.';
    } else {
      title = 'Модель в натуральную величину';
      text = state.mismatch == null
        ? 'Поставлена по точке A. Доверните её кнопками, чтобы стены легли по разметке.'
        : `Расстояние A–B на площадке отличается от проектного на ${state.mismatch >= 0 ? '+' : '−'}${Math.round(Math.abs(state.mismatch) * 100)} см.`;
    }
  }
  const warn = placed && state.mode === 'site' && state.mismatch != null && Math.abs(state.mismatch) > 0.3;
  const placeLabel = state?.mode === 'table' ? 'Поставить' : state?.step === 'B' ? 'Отметить B' : 'Отметить A';

  return (
    <div ref={ref} className="p3-ar" data-active={active ? '1' : '0'} data-step={state?.step || ''} data-mode={state?.mode || ''}>
      {active && state && (
        <>
          <div className="p3-ar-top">
            <div className="p3-ar-msg" role="status" data-warn={warn || undefined}>
              <p className="p3-ar-title">{title}</p>
              <p>{text}</p>
              {warn && <p>Это много: проверьте, что отмечены именно углы A и B.</p>}
            </div>
            <button type="button" className="p3-ar-close" onClick={() => controller?.end()} aria-label="Закрыть камеру"><X size={22} aria-hidden="true" /></button>
          </div>

          <div className="p3-ar-bottom">
            {!placed && (
              <div className="p3-ar-row">
                <button type="button" className="p3-btn p3-btn--gold p3-ar-main" disabled={!state.hit} onClick={() => controller.place()}><Check size={20} aria-hidden="true" />{placeLabel}</button>
                {state.step === 'B' && <button type="button" className="p3-btn p3-btn--ghost" onClick={() => controller.skipSecondPoint()}>Без точки B</button>}
              </div>
            )}
            {placed && (
              <>
                <div className="p3-ar-row" role="group" aria-label="Поворот модели">
                  <button type="button" className="p3-ar-key" aria-label="Повернуть на 5 градусов влево" {...repeat(() => controller.rotate(5))}><RotateCcw size={20} aria-hidden="true" />5°</button>
                  <button type="button" className="p3-ar-key" aria-label="Повернуть на полградуса влево" {...repeat(() => controller.rotate(0.5))}><RotateCcw size={20} aria-hidden="true" />0,5°</button>
                  <button type="button" className="p3-ar-key" aria-label="Повернуть на полградуса вправо" {...repeat(() => controller.rotate(-0.5))}><RotateCw size={20} aria-hidden="true" />0,5°</button>
                  <button type="button" className="p3-ar-key" aria-label="Повернуть на 5 градусов вправо" {...repeat(() => controller.rotate(-5))}><RotateCw size={20} aria-hidden="true" />5°</button>
                </div>
                <div className="p3-ar-row" role="group" aria-label={`Сдвиг модели, шаг ${Math.round(fine * 100)} см`}>
                  <button type="button" className="p3-ar-key" aria-label="Сдвинуть влево" {...repeat(() => controller.nudge(-fine, 0))}><ArrowLeft size={20} aria-hidden="true" /></button>
                  <button type="button" className="p3-ar-key" aria-label="Сдвинуть от себя" {...repeat(() => controller.nudge(0, fine))}><ArrowUp size={20} aria-hidden="true" /></button>
                  <button type="button" className="p3-ar-key" aria-label="Сдвинуть к себе" {...repeat(() => controller.nudge(0, -fine))}><ArrowDown size={20} aria-hidden="true" /></button>
                  <button type="button" className="p3-ar-key" aria-label="Сдвинуть вправо" {...repeat(() => controller.nudge(fine, 0))}><ArrowRight size={20} aria-hidden="true" /></button>
                  <button type="button" className="p3-ar-key" aria-label="Поднять" {...repeat(() => controller.lift(0.02))}>↥</button>
                  <button type="button" className="p3-ar-key" aria-label="Опустить" {...repeat(() => controller.lift(-0.02))}>↧</button>
                </div>
                <div className="p3-ar-row">
                  {floors > 1 && (
                    <div className="p3-ar-levels" role="group" aria-label="Сколько этажей показывать">
                      <button type="button" className="p3-ar-key" aria-label="Показать на этаж меньше" disabled={state.levels <= 1} onClick={() => controller.setLevels(state.levels - 1)}>−</button>
                      <span>Этажей: {state.levels}</span>
                      <button type="button" className="p3-ar-key" aria-label="Показать на этаж больше" disabled={state.levels >= floors} onClick={() => controller.setLevels(state.levels + 1)}>+</button>
                    </div>
                  )}
                  <button type="button" className="p3-ar-key" aria-pressed={state.ghost} onClick={() => controller.setGhost(!state.ghost)}><Eye size={20} aria-hidden="true" />Прозрачно</button>
                  <button type="button" className="p3-ar-key" onClick={() => controller.reset()}>Переставить</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
});
