import React from 'react';

export default function CategoryTemplatePage({ category, onBack }) {
  if (!category) return null;

  return (
    <div className="category-template-page">
      {/* Hero Section for the Category */}
      <section className="category-hero">
        <div className="container">
          <button className="back-to-catalog-btn" onClick={onBack}>
            ← Назад в каталог
          </button>
          
          <div className="cat-hero-content">
            <div className="cat-hero-icon">{category.icon}</div>
            <div className="cat-hero-text">
              <span className="cat-hero-badge">Категория работ</span>
              <h1 className="cat-hero-title">{category.name}</h1>
              <p className="cat-hero-subtitle">
                Базовый диапазон цен: <strong>{category.priceRange}</strong>
              </p>
              <div className="cat-hero-stats">
                <span className="stat-pill">
                  <span className="stat-dot"></span>
                  {category.count} видов расценок
                </span>
                <span className="stat-pill">
                  <span className="stat-dot green"></span>
                  Актуально на 2026 год
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="category-main-content">
        <div className="container">
          <div className="category-grid-layout">
            
            {/* Left Column: List of sub-services */}
            <div className="category-services-list">
              <h2 className="section-title">Популярные виды работ</h2>
              <div className="services-list-wrapper">
                {/* Mocked list for template */}
                {[
                  { title: 'Монтаж и подготовка поверхности', code: 'ГЭСН 08-01-002', price: 'от 2 800 ₸ / м²' },
                  { title: 'Укладка базового слоя & армирование', code: 'ГОСТ 28013-89', price: 'от 4 500 ₸ / м²' },
                  { title: 'Финишная обработка & герметизация', code: 'Высший класс качества B25', price: 'от 3 200 ₸ / м²' },
                  { title: 'Демонтаж старых покрытий', code: 'СНиП 3.02.01-87', price: 'от 1 200 ₸ / м²' },
                  { title: 'Вывоз строительного мусора', code: 'Транспортные расходы', price: 'от 15 000 ₸ / рейс' },
                ].map((svc, idx) => (
                  <div className="cat-service-row" key={idx}>
                    <div className="cat-svc-info">
                      <strong>{svc.title}</strong>
                      <small>{svc.code}</small>
                    </div>
                    <div className="cat-svc-price">
                      {svc.price}
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="view-all-services-btn">
                Смотреть все {category.count} расценок ↓
              </button>
            </div>

            {/* Right Column: AI Estimate Generator */}
            <div className="category-sidebar">
              <div className="ai-estimate-box">
                <div className="ai-box-header">
                  <span className="ai-icon">✨</span>
                  <h3>AI-Смета для {category.name}</h3>
                </div>
                <p>Опишите вашу задачу своими словами, и нейросеть подберет нужные расценки, рассчитает объемы и выдаст готовую смету.</p>
                
                <textarea 
                  className="ai-prompt-input" 
                  placeholder="Например: Нужно сделать фундамент 10х10 метров, ленточный, глубина 1.5м..."
                ></textarea>
                
                <button className="ai-generate-btn" onClick={() => alert('Генерация сметы в разработке!')}>
                  Сгенерировать смету ➔
                </button>
              </div>

              <div className="help-box">
                <h4>Нужна помощь инженера?</h4>
                <p>Наши ПТО-инженеры помогут составить точную смету с выездом на объект.</p>
                <button className="help-btn">Заказать аудит</button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
