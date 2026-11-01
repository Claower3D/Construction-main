import React, { useMemo, useState } from 'react';
import { categoriesData } from '../data/categoriesData';
import { startFlow } from '../utils/navigate';

/*
 * Два блока: быстрый расчёт бюджета (ориентир по цене за м² для типа объекта)
 * и каталог категорий работ с ценами 2026 года.
 * В расчёте видна вся арифметика: база, запас материалов, надзор, отчёт.
 */

const TYPES = [
  { id: 'renovation', name: 'Квартира', rate: 38000 },
  { id: 'office', name: 'Офис', rate: 58000 },
  { id: 'house', name: 'Частный дом', rate: 105000 },
  { id: 'industrial', name: 'Промобъект', rate: 150000 },
];

const GROUPS = [
  { id: 'all', name: 'Все' },
  { id: 'general', name: 'Общестроительные' },
  { id: 'finishing', name: 'Отделка' },
  { id: 'engineering', name: 'Инженерные сети' },
  { id: 'special', name: 'Проект и спецработы' },
];

const AI_REPORT = 15000;
const fmt = (n) => Math.round(n).toLocaleString('ru-RU');

export default function PriceCatalogSection({ onOpenCategory }) {
  const [area, setArea] = useState(65);
  const [type, setType] = useState('renovation');
  const [withBom, setWithBom] = useState(true);
  const [withSupervision, setWithSupervision] = useState(false);
  const [withReport, setWithReport] = useState(true);

  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const rate = TYPES.find((t) => t.id === type)?.rate || 38000;
  const base = rate * area;
  const bom = withBom ? base * 0.1 : 0;
  const supervision = withSupervision ? (base + bom) * 0.05 : 0;
  const report = withReport ? AI_REPORT : 0;
  const total = base + bom + supervision + report;

  const counts = useMemo(() => {
    const c = { all: categoriesData.length };
    categoriesData.forEach((x) => { c[x.group] = (c[x.group] || 0) + 1; });
    return c;
  }, []);

  const q = search.trim().toLowerCase();
  const list = categoriesData.filter((c) => (group === 'all' || c.group === group) && (!q || c.name.toLowerCase().includes(q)));
  const PREVIEW = 8;
  const shown = expanded || q || group !== 'all' ? list : list.slice(0, PREVIEW);

  const setAreaSafe = (v) => {
    const n = Math.round(Number(v));
    if (Number.isFinite(n)) setArea(Math.min(2000, Math.max(10, n)));
  };

  return (
    <>
      <section className="pro-section pro-section--tint" id="budget" aria-labelledby="pro-budget-title">
        <div className="qg-container">
          <header className="pro-head">
            <h2 id="pro-budget-title">Прикиньте бюджет за минуту</h2>
            <p>Средняя цена за квадратный метр по типу объекта на 2026 год. Точную смету по фото и объёмам сервис сделает после загрузки снимков.</p>
          </header>

          <div className="pro-calc">
            <div className="pro-calc-form">
              <div className="pro-field">
                <div className="pro-field-row">
                  <label htmlFor="pro-area">Площадь</label>
                  <span className="pro-area-input">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="10"
                      max="2000"
                      value={area}
                      onChange={(e) => setAreaSafe(e.target.value)}
                      aria-label="Площадь, квадратных метров"
                    />
                    <span>м²</span>
                  </span>
                </div>
                <input
                  id="pro-area"
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={Math.min(area, 500)}
                  onChange={(e) => setAreaSafe(e.target.value)}
                  className="pro-range"
                  style={{ '--pro-fill': `${((Math.min(area, 500) - 10) / 490) * 100}%` }}
                />
                <div className="pro-range-scale" aria-hidden="true"><span>10</span><span>250</span><span>500 м²</span></div>
              </div>

              <fieldset className="pro-field">
                <legend>Тип объекта</legend>
                <div className="pro-segment">
                  {TYPES.map((t) => (
                    <label key={t.id} className="pro-segment-item">
                      <input type="radio" name="pro-type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} />
                      <span>
                        <strong>{t.name}</strong>
                        <small>от {fmt(t.rate)} ₸/м²</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="pro-field">
                <legend>Что добавить</legend>
                <label className="pro-check">
                  <input type="checkbox" checked={withBom} onChange={(e) => setWithBom(e.target.checked)} />
                  <span><strong>Ведомость материалов</strong><small>запас 10% по нормативу</small></span>
                </label>
                <label className="pro-check">
                  <input type="checkbox" checked={withSupervision} onChange={(e) => setWithSupervision(e.target.checked)} />
                  <span><strong>Технический надзор</strong><small>инженер на ключевых этапах, +5%</small></span>
                </label>
                <label className="pro-check">
                  <input type="checkbox" checked={withReport} onChange={(e) => setWithReport(e.target.checked)} />
                  <span><strong>Акт проверки дефектов</strong><small>фиксированно {fmt(AI_REPORT)} ₸</small></span>
                </label>
              </fieldset>
            </div>

            <aside className="pro-calc-result" aria-live="polite">
              <p className="pro-result-label">Ориентировочный бюджет</p>
              <p className="pro-result-sum qg-num">{fmt(total)} ₸</p>
              <p className="pro-result-unit qg-num">{fmt(total / area)} ₸ за м²</p>
              <dl className="pro-breakdown">
                <div><dt>Работы и материалы, {area} м² × {fmt(rate)} ₸</dt><dd className="qg-num">{fmt(base)}</dd></div>
                {withBom && <div><dt>Запас материалов 10%</dt><dd className="qg-num">{fmt(bom)}</dd></div>}
                {withSupervision && <div><dt>Технический надзор 5%</dt><dd className="qg-num">{fmt(supervision)}</dd></div>}
                {withReport && <div><dt>Акт проверки дефектов</dt><dd className="qg-num">{fmt(report)}</dd></div>}
              </dl>
              <button type="button" className="qg-btn qg-btn--primary pro-btn-block" onClick={() => startFlow('register')}>
                Получить точную смету
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section className="pro-section" id="prices" aria-labelledby="pro-catalog-title">
        <div className="qg-container">
          <header className="pro-head pro-head--split">
            <div>
              <h2 id="pro-catalog-title">Каталог работ и цен</h2>
              <p>12 089 расценок в {categoriesData.length} категориях по ценам 2026 года. Откройте категорию, чтобы собрать смету.</p>
            </div>
            <div className="pro-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input
                type="search"
                aria-label="Поиск по категориям работ"
                placeholder="Плитка, фасад, электрика"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </header>

          <div className="pro-chips" role="group" aria-label="Группы работ">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="pro-chip"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
              >
                {g.name} <span className="qg-num">{counts[g.id] || 0}</span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="pro-empty">
              <p>По запросу «{search}» категорий нет. Попробуйте другое слово или сбросьте фильтр.</p>
              <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm" onClick={() => { setSearch(''); setGroup('all'); }}>Показать все категории</button>
            </div>
          ) : (
            <ul className="pro-cats">
              {shown.map((cat) => (
                <li key={cat.name}>
                  <button type="button" className="pro-cat" onClick={() => onOpenCategory && onOpenCategory(cat)}>
                    <span className="pro-cat-img">
                      {cat.image && <img src={cat.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    </span>
                    <span className="pro-cat-body">
                      <span className="pro-cat-name">{cat.name}</span>
                      <span className="pro-cat-meta">
                        <span className="qg-num">{cat.count} работ</span>
                        <span className="pro-cat-price qg-num">{cat.priceRange}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shown.length < list.length && (
            <div className="pro-more">
              <button type="button" className="qg-btn qg-btn--ghost" onClick={() => setExpanded(true)}>
                Показать все категории ({list.length})
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
