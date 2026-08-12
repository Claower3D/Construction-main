import React, { useState } from 'react';

export default function PriceCatalogSection() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, general, finishing, engineering, special
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Estimator State
  const [area, setArea] = useState(65);
  const [projectType, setProjectType] = useState('renovation'); // renovation, office, house, industrial
  const [includeAiAudit, setIncludeAiAudit] = useState(true);
  const [includeBom, setIncludeBom] = useState(true);
  const [includeTechSupervision, setIncludeTechSupervision] = useState(false);

  // Calculation Logic
  const basePrices = {
    renovation: 38000,
    office: 58000,
    house: 105000,
    industrial: 150000,
  };

  const baseRate = basePrices[projectType] || 38000;
  let totalCostKzt = baseRate * area;

  if (includeBom) totalCostKzt *= 1.1; // +10% for full BOM spec
  if (includeTechSupervision) totalCostKzt *= 1.05; // +5% for technical supervision
  if (includeAiAudit) totalCostKzt += 15000; // Flat fee for AI scan report

  const totalCostUsd = Math.round(totalCostKzt / 465);
  const costPerM2 = Math.round(totalCostKzt / area);

  const categories = [
    { name: 'Земляные работы', count: 319, icon: '⛏️', group: 'general', priceRange: 'от 1 200 ₸/м³' },
    { name: 'Фундамент', count: 379, icon: '🏗️', group: 'general', priceRange: 'от 18 500 ₸/м³' },
    { name: 'Бетон и монолит', count: 658, icon: '🧱', group: 'general', priceRange: 'от 22 000 ₸/м³' },
    { name: 'Кладка', count: 259, icon: '🧱', group: 'general', priceRange: 'от 4 500 ₸/м²' },
    { name: 'Металлоконструкции', count: 309, icon: '⛓️', group: 'general', priceRange: 'от 45 000 ₸/т' },
    { name: 'Кровля', count: 398, icon: '🏠', group: 'general', priceRange: 'от 3 800 ₸/м²' },
    { name: 'Фасад', count: 236, icon: '🏢', group: 'general', priceRange: 'от 5 200 ₸/м²' },
    { name: 'Окна и двери', count: 462, icon: '🚪', group: 'finishing', priceRange: 'от 12 000 ₸/шт' },
    { name: 'Утепление и изоляция', count: 397, icon: '🧤', group: 'general', priceRange: 'от 1 800 ₸/м²' },
    { name: 'Демонтаж', count: 87, icon: '💥', group: 'general', priceRange: 'от 850 ₸/м²' },
    { name: 'Отделка стен', count: 920, icon: '🎨', group: 'finishing', priceRange: 'от 2 200 ₸/м²' },
    { name: 'Полы и плитка', count: 588, icon: '🔲', group: 'finishing', priceRange: 'от 3 500 ₸/м²' },
    { name: 'Потолки', count: 128, icon: '💡', group: 'finishing', priceRange: 'от 2 800 ₸/м²' },
    { name: 'Лестницы и балконы', count: 121, icon: '🪜', group: 'finishing', priceRange: 'от 15 000 ₸/п.м' },
    { name: 'Электрика', count: 777, icon: '⚡', group: 'engineering', priceRange: 'от 1 200 ₸/тчк' },
    { name: 'Сантехника и водоснабжение', count: 681, icon: '🚿', group: 'engineering', priceRange: 'от 4 500 ₸/тчк' },
    { name: 'Отопление', count: 282, icon: '🔥', group: 'engineering', priceRange: 'от 8 500 ₸/прибор' },
    { name: 'Вентиляция и кондиц.', count: 561, icon: '❄️', group: 'engineering', priceRange: 'от 14 000 ₸/компл' },
    { name: 'Газоснабжение', count: 124, icon: '🔵', group: 'engineering', priceRange: 'от 25 000 ₸/врезка' },
    { name: 'Автоматизация и слаботоч.', count: 545, icon: '📡', group: 'engineering', priceRange: 'от 2 100 ₸/м' },
    { name: 'Пожарная безопасность', count: 218, icon: '🧯', group: 'engineering', priceRange: 'от 3 400 ₸/датчик' },
    { name: 'Наружные сети', count: 381, icon: '🔌', group: 'engineering', priceRange: 'от 6 200 ₸/п.м' },
    { name: 'Благоустройство', count: 373, icon: '🌳', group: 'special', priceRange: 'от 2 500 ₸/м²' },
    { name: 'Дороги и мосты', count: 313, icon: '🛣️', group: 'special', priceRange: 'от 8 900 ₸/м²' },
    { name: 'Деревянные конструкции', count: 213, icon: '🪵', group: 'finishing', priceRange: 'от 4 800 ₸/м²' },
    { name: 'Мебель и оборудование', count: 424, icon: '🪑', group: 'finishing', priceRange: 'от 18 000 ₸/ед' },
    { name: 'Проектирование', count: 1244, icon: '📐', group: 'special', priceRange: 'от 1 500 ₸/м²' },
    { name: 'Специальные работы', count: 1051, icon: '🛠️', group: 'special', priceRange: 'от 5 000 ₸/смена' },
    { name: 'Прочие работы', count: 818, icon: '📦', group: 'special', priceRange: 'от 1 000 ₸/усл' },
  ];

  const filtered = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'all' || cat.group === activeFilter;
    return matchesSearch && matchesFilter;
  });


  return (
    <section className="catalog-section" id="prices">
      <div className="container">
        {/* Interactive Estimator Cockpit Box */}
        <div className="estimator-cockpit-box">
          <div className="estimator-header-row">
            <div className="estimator-title-group">
              <div className="cockpit-pill-tag">
                <span className="live-pulse"></span>
                <span>🧮 AI Калькулятор Смет v2.0 • ГОСТ РК</span>
              </div>
              <h3 className="estimator-main-title">Экспресс-расчёт стоимости объекта</h3>
              <p className="estimator-desc">
                Укажите площадь и параметры — алгоритмы QazGost AI мгновенно рассчитают ориентировочную смету с учётом цен 2026 года.
              </p>
            </div>

            {/* Glowing High-Tech Result Card */}
            <div className="estimator-neon-result">
              <div className="res-kzt-glow">{totalCostKzt.toLocaleString('ru-RU')} ₸</div>
              <div className="res-secondary-row">
                <span className="res-usd-badge">≈ ${totalCostUsd.toLocaleString('en-US')} USD</span>
                <span className="res-per-m2">{costPerM2.toLocaleString('ru-RU')} ₸/м²</span>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="breakdown-bar-track">
                <div className="bar-seg seg-work" style={{ width: '60%' }} title="Работы: 60%"></div>
                <div className="bar-seg seg-mat" style={{ width: '30%' }} title="Материалы: 30%"></div>
                <div className="bar-seg seg-ai" style={{ width: '10%' }} title="AI-сервисы: 10%"></div>
              </div>
              <div className="breakdown-legend">
                <span>● Работы 60%</span>
                <span>● Мат. 30%</span>
                <span>● AI 10%</span>
              </div>
            </div>
          </div>

          <div className="estimator-controls-grid">
            {/* Control 1: Area Range Slider */}
            <div className="cockpit-card">
              <div className="cockpit-card-header">
                <span className="card-icon">📐</span>
                <label className="cockpit-label">Площадь объекта</label>
                <span className="area-badge-highlight">{area} м²</span>
              </div>

              <div className="slider-container">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="cockpit-range-slider"
                />
                <div
                  className="slider-progress-bar"
                  style={{ width: `${((area - 10) / 490) * 100}%` }}
                ></div>
              </div>

              <div className="slider-ticks">
                <span>10 м²</span>
                <span>250 м²</span>
                <span>500 м²</span>
              </div>
            </div>

            {/* Control 2: Project Type Cards */}
            <div className="cockpit-card">
              <div className="cockpit-card-header">
                <span className="card-icon">🏢</span>
                <label className="cockpit-label">Тип объекта</label>
              </div>

              <div className="project-types-v2-grid">
                <button
                  type="button"
                  className={`type-v2-card ${projectType === 'renovation' ? 'active' : ''}`}
                  onClick={() => setProjectType('renovation')}
                >
                  <span className="type-icon">🏠</span>
                  <div className="type-meta">
                    <strong>Квартира</strong>
                    <small>от 38 000 ₸/м²</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`type-v2-card ${projectType === 'office' ? 'active' : ''}`}
                  onClick={() => setProjectType('office')}
                >
                  <span className="type-icon">🏢</span>
                  <div className="type-meta">
                    <strong>Офис</strong>
                    <small>от 58 000 ₸/м²</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`type-v2-card ${projectType === 'house' ? 'active' : ''}`}
                  onClick={() => setProjectType('house')}
                >
                  <span className="type-icon">🏡</span>
                  <div className="type-meta">
                    <strong>Коттедж</strong>
                    <small>от 105 000 ₸/м²</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`type-v2-card ${projectType === 'industrial' ? 'active' : ''}`}
                  onClick={() => setProjectType('industrial')}
                >
                  <span className="type-icon">🏭</span>
                  <div className="type-meta">
                    <strong>Пром. объект</strong>
                    <small>от 150 000 ₸/м²</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Control 3: AI Service Toggles */}
            <div className="cockpit-card">
              <div className="cockpit-card-header">
                <span className="card-icon">⚡</span>
                <label className="cockpit-label">Дополнительные AI-сервисы</label>
              </div>

              <div className="toggle-switches-v2">
                <div
                  className={`switch-v2-row ${includeAiAudit ? 'active' : ''}`}
                  onClick={() => setIncludeAiAudit(!includeAiAudit)}
                >
                  <div className="switch-v2-info">
                    <span className="sw-icon">🤖</span>
                    <div>
                      <strong>AI-дефектоскопия</strong>
                      <small>Сканирование трещин & брака</small>
                    </div>
                  </div>
                  <div className={`custom-switch ${includeAiAudit ? 'on' : ''}`}>
                    <span className="switch-handle"></span>
                  </div>
                </div>

                <div
                  className={`switch-v2-row ${includeBom ? 'active' : ''}`}
                  onClick={() => setIncludeBom(!includeBom)}
                >
                  <div className="switch-v2-info">
                    <span className="sw-icon">📦</span>
                    <div>
                      <strong>Расчёт материалов (BOM)</strong>
                      <small>+10-15% нормативный запас</small>
                    </div>
                  </div>
                  <div className={`custom-switch ${includeBom ? 'on' : ''}`}>
                    <span className="switch-handle"></span>
                  </div>
                </div>

                <div
                  className={`switch-v2-row ${includeTechSupervision ? 'active' : ''}`}
                  onClick={() => setIncludeTechSupervision(!includeTechSupervision)}
                >
                  <div className="switch-v2-info">
                    <span className="sw-icon">📋</span>
                    <div>
                      <strong>Технический надзор</strong>
                      <small>Контроль инженеров ГОСТ</small>
                    </div>
                  </div>
                  <div className={`custom-switch ${includeTechSupervision ? 'on' : ''}`}>
                    <span className="switch-handle"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Section Title, Filter Tabs & Search */}
        <div className="catalog-header-v2" style={{ marginTop: '4.5rem' }}>
          <div className="section-header-center">
            <span className="section-pill-badge">🏷️ Официальный справочник РК 2026</span>
            <h2 className="section-title">
              <span>💰</span>
              <span>Каталог строительных работ и цен</span>
            </h2>
            <p className="section-subtitle">
              12 089 проверенных расценок • 29 категорий • Фильтрация по типам работ
            </p>
          </div>

          {/* Interactive Category Filter Group Tabs */}
          <div className="category-filter-tabs">
            <button
              type="button"
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>🌐</span> Все категории ({categories.length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === 'general' ? 'active' : ''}`}
              onClick={() => setActiveFilter('general')}
            >
              <span>🏗️</span> Общестроительные ({categories.filter((c) => c.group === 'general').length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === 'finishing' ? 'active' : ''}`}
              onClick={() => setActiveFilter('finishing')}
            >
              <span>🎨</span> Отделка и ремонт ({categories.filter((c) => c.group === 'finishing').length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === 'engineering' ? 'active' : ''}`}
              onClick={() => setActiveFilter('engineering')}
            >
              <span>⚡</span> Инженерные сети ({categories.filter((c) => c.group === 'engineering').length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeFilter === 'special' ? 'active' : ''}`}
              onClick={() => setActiveFilter('special')}
            >
              <span>📐</span> Проектирование & Спец ({categories.filter((c) => c.group === 'special').length})
            </button>
          </div>

          {/* Sleek Search Bar */}
          <div className="search-box-v2-wrap">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              className="search-input-v2"
              placeholder="Поиск по 12 089 работам... (например: плитка, фасад, электрика, гидроизоляция)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
            <span className="search-results-counter">
              Найдено: <strong>{filtered.length}</strong> кат.
            </span>
          </div>
        </div>

        {/* High-End Category Cards Grid */}
        <div className="categories-v2-grid">
          {filtered.map((cat, idx) => (
            <div
              className="category-v2-card"
              key={idx}
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="cat-v2-header">
                <div className="cat-v2-icon-box">{cat.icon}</div>
                <span className="cat-v2-price-chip">{cat.priceRange}</span>
              </div>

              <div className="cat-v2-content">
                <h4 className="cat-v2-title">{cat.name}</h4>
                <div className="cat-v2-footer-meta">
                  <span className="cat-v2-count-badge">
                    <span className="count-dot"></span>
                    {cat.count} работ
                  </span>
                  <span className="cat-v2-open-btn">
                    Смета ➔
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal/Drawer preview of sub-services when category clicked */}
        {selectedCategory && (
          <div className="modal-overlay" onClick={() => setSelectedCategory(null)}>
            <div className="cat-detail-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setSelectedCategory(null)}>
                ✕
              </button>

              <div className="cat-detail-header">
                <div className="cat-detail-icon">{selectedCategory.icon}</div>
                <div>
                  <span className="cat-detail-badge">{selectedCategory.priceRange}</span>
                  <h3 className="cat-detail-title">{selectedCategory.name}</h3>
                  <p className="cat-detail-sub">
                    {selectedCategory.count} видов работ • Актуальные цены РК 2026
                  </p>
                </div>
              </div>

              <div className="sub-services-list">
                <h4 className="sub-services-heading">Популярные позиция в смете:</h4>

                <div className="sub-service-row">
                  <div>
                    <strong>Монтаж и подготовка поверхности</strong>
                    <small>ГЭСН 08-01-002 • СНиП РК</small>
                  </div>
                  <span className="sub-price-tag">2 800 ₸ / м²</span>
                </div>

                <div className="sub-service-row">
                  <div>
                    <strong>Укладка базового слоя & армирование</strong>
                    <small>ГОСТ 28013-89</small>
                  </div>
                  <span className="sub-price-tag">4 500 ₸ / м²</span>
                </div>

                <div className="sub-service-row">
                  <div>
                    <strong>Финишная обработка & герметизация</strong>
                    <small>Высший класс качества B25</small>
                  </div>
                  <span className="sub-price-tag">3 200 ₸ / м²</span>
                </div>
              </div>

              <div className="cat-detail-footer">
                <button
                  className="modal-submit-btn"
                  onClick={() => {
                    alert(`Смета по категории «${selectedCategory.name}» сгенерирована!`);
                    setSelectedCategory(null);
                  }}
                >
                  🚀 Рассчитать смету по «{selectedCategory.name}»
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


