import React, { useMemo, useState } from 'react';
import { categoriesData } from '../data/categoriesData';
import { Home, Building2, Briefcase, Factory, Search, ArrowRight, Clock, Boxes } from 'lucide-react';
import { startFlow } from '../utils/navigate';
import { LightTrails, Sparkles, WaveMesh } from './LuxFx';

/*
 * Два блока: быстрый расчёт бюджета (ориентир по цене за м² для типа объекта)
 * и каталог категорий работ с ценами 2026 года.
 * В расчёте видна вся арифметика: база, запас материалов, надзор, отчёт.
 */

const TYPES = [
  { id: 'renovation', name: 'Квартира', rate: 38000, icon: Building2, days: 0.35 },
  { id: 'house', name: 'Дом', rate: 105000, icon: Home, days: 0.6 },
  { id: 'office', name: 'Офис', rate: 58000, icon: Briefcase, days: 0.3 },
  { id: 'industrial', name: 'Промобъект', rate: 150000, icon: Factory, days: 0.5 },
];

// Тонированная копия фото категории для тёмной темы (public/assets/landing), если есть
const toned = (src) => {
  const m = /\/assets\/categories\/cat_([a-z_]+)\.jpg$/.exec(src || '');
  return m ? `/assets/landing/cat-${m[1]}.webp` : src;
};

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
  const PREVIEW = 9;
  const shown = expanded || q || group !== 'all' ? list : list.slice(0, PREVIEW);

  const setAreaSafe = (v) => {
    const n = Math.round(Number(v));
    if (Number.isFinite(n)) setArea(Math.min(2000, Math.max(10, n)));
  };

  const t = TYPES.find((x) => x.id === type) || TYPES[0];
  const days = Math.max(3, Math.round(area * t.days));

  return (
    <>
      <section className="lux-section lux-budget" id="budget" aria-labelledby="lux-budget-title">
        <div className="lux-budget-photo" aria-hidden="true" />
        <LightTrails variant="sweep" />
        <Sparkles count={22} seed={31} />
        <div className="qg-container lux-budget-grid">
          <div className="lux-budget-form">
            <header className="lux-head">
              <h2 id="lux-budget-title">Прикиньте бюджет за минуту</h2>
              <p>Укажите параметры — получите ориентир по ценам 2026 года. Точную смету сервис соберёт по фото.</p>
            </header>

            <div className="lux-glass lux-form">
              <fieldset className="lux-field">
                <legend>Тип объекта</legend>
                <div className="lux-seg">
                  {TYPES.map(({ id, name, icon: Icon }) => (
                    <label key={id} className="lux-seg-item">
                      <input type="radio" name="lux-type" value={id} checked={type === id} onChange={() => setType(id)} />
                      <span><Icon size={17} aria-hidden="true" />{name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="lux-field">
                <div className="lux-field-row">
                  <label htmlFor="lux-area">Площадь, м²</label>
                  <input
                    className="lux-num-input"
                    type="number"
                    inputMode="numeric"
                    min="10"
                    max="2000"
                    value={area}
                    onChange={(e) => setAreaSafe(e.target.value)}
                    aria-label="Площадь, квадратных метров"
                  />
                </div>
                <input
                  id="lux-area"
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={Math.min(area, 500)}
                  onChange={(e) => setAreaSafe(e.target.value)}
                  className="lux-range"
                  style={{ '--fill': `${((Math.min(area, 500) - 10) / 490) * 100}%` }}
                />
              </div>

              <fieldset className="lux-field lux-opts">
                <legend>Что добавить</legend>
                <label className="lux-check"><input type="checkbox" checked={withBom} onChange={(e) => setWithBom(e.target.checked)} /><span>Запас материалов 10%</span></label>
                <label className="lux-check"><input type="checkbox" checked={withSupervision} onChange={(e) => setWithSupervision(e.target.checked)} /><span>Технадзор +5%</span></label>
                <label className="lux-check"><input type="checkbox" checked={withReport} onChange={(e) => setWithReport(e.target.checked)} /><span>Акт дефектов {fmt(AI_REPORT)} ₸</span></label>
              </fieldset>
            </div>
          </div>

          <aside className="lux-glass lux-glass--gold lux-result" aria-live="polite">
            <p className="lux-result-label">Ориентировочный бюджет</p>
            <p className="lux-result-sum qg-num">{fmt(total)} ₸</p>
            <p className="lux-result-range qg-num">Диапазон: {fmt(total * 0.93)} – {fmt(total * 1.08)} ₸</p>
            <dl className="lux-result-list">
              <div><dt><Clock size={18} aria-hidden="true" />Срок выполнения</dt><dd className="qg-num">≈ {days} дн.</dd></div>
              <div><dt><Boxes size={18} aria-hidden="true" />Объём работ</dt><dd className="qg-num">{area} м²</dd></div>
              <div><dt>Работы и материалы</dt><dd className="qg-num">{fmt(base)} ₸</dd></div>
              {withBom && <div><dt>Запас материалов</dt><dd className="qg-num">{fmt(bom)} ₸</dd></div>}
              {withSupervision && <div><dt>Технадзор</dt><dd className="qg-num">{fmt(supervision)} ₸</dd></div>}
              {withReport && <div><dt>Акт дефектов</dt><dd className="qg-num">{fmt(report)} ₸</dd></div>}
            </dl>
            <button type="button" className="qg-btn qg-btn--primary lux-btn-block" onClick={() => startFlow('register')}>
              Получить точную смету <ArrowRight size={18} aria-hidden="true" />
            </button>
          </aside>
        </div>
      </section>

      <section className="lux-section" id="prices" aria-labelledby="lux-catalog-title">
        <WaveMesh seed={9} lines={26} className="fx-mesh--catalog" />
        <div className="qg-container">
          <header className="lux-head lux-head--split">
            <div>
              <h2 id="lux-catalog-title">Каталог работ и цен</h2>
              <p>12 089 расценок в {categoriesData.length} категориях по ценам 2026 года.</p>
            </div>
            <div className="lux-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Поиск по категориям работ"
                placeholder="Найти работу или услугу"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </header>

          <div className="lux-chips" role="group" aria-label="Группы работ">
            {GROUPS.map((g) => (
              <button key={g.id} type="button" className="lux-chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
                {g.name}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="lux-empty">
              <p>По запросу «{search}» категорий нет. Попробуйте другое слово.</p>
              <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm" onClick={() => { setSearch(''); setGroup('all'); }}>Показать все</button>
            </div>
          ) : (
            <ul className="lux-cats">
              {shown.map((cat) => (
                <li key={cat.name}>
                  <button type="button" className="lux-cat" onClick={() => onOpenCategory && onOpenCategory(cat)}>
                    {cat.image && <img src={toned(cat.image)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <span className="lux-cat-text">
                      <span className="lux-cat-name">{cat.name}</span>
                      <span className="lux-cat-price qg-num">{cat.priceRange}</span>
                      <span className="lux-cat-count qg-num">{cat.count} работ</span>
                    </span>
                  </button>
                </li>
              ))}
              {shown.length < list.length && (
                <li>
                  <button type="button" className="lux-cat lux-cat--all" onClick={() => setExpanded(true)}>
                    <span className="lux-cat-text">
                      <span className="lux-cat-name">Весь каталог</span>
                      <span className="lux-cat-price qg-num">{list.length} категорий <ArrowRight size={16} aria-hidden="true" /></span>
                    </span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
