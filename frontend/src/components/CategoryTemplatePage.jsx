import React, { useState } from 'react';

export default function CategoryTemplatePage({ category, onBack }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  if (!category) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 2000);
  };

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
              <div className="category-services-bento-grid">
                {/* Mocked list for template with images */}
                {[
                  { title: 'Монтаж и подготовка поверхности', code: 'ГЭСН 08-01-002', price: 'от 2 800 ₸ / м²', image: 'https://images.unsplash.com/photo-1541888086925-ebca89bba4c9?auto=format&fit=crop&w=600&q=80', size: 'large' },
                  { title: 'Укладка базового слоя', code: 'ГОСТ 28013-89', price: 'от 4 500 ₸ / м²', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80', size: 'medium' },
                  { title: 'Финишная обработка', code: 'Высший класс качества', price: 'от 3 200 ₸ / м²', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', size: 'medium' },
                  { title: 'Демонтаж покрытий', code: 'СНиП 3.02.01-87', price: 'от 1 200 ₸ / м²', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=600&q=80', size: 'medium' },
                  { title: 'Вывоз мусора', code: 'Транспортные расходы', price: 'от 15 000 ₸', image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80', size: 'large' },
                ].map((svc, idx) => (
                  <div className={`ref-card ${svc.size === 'large' ? 'card-wide-60' : 'card-medium-40'} cat-bento-card`} key={idx}>
                    <div className="ref-card-text cat-bento-text">
                      <h3 className="ref-card-title">{svc.title}</h3>
                      <div className="cat-bento-price-tag">{svc.price}</div>
                      <small className="cat-bento-code">📑 {svc.code}</small>
                    </div>
                    <div className="ref-card-img-side">
                      <img src={svc.image} alt={svc.title} />
                      <button className="ref-purple-circle">➔</button>
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
                
                {!isGenerated ? (
                  <button 
                    className={`ai-generate-btn ${isGenerating ? 'loading' : ''}`} 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <><span className="spinner-icon">⏳</span> Анализируем...</>
                    ) : (
                      <>Сгенерировать смету ➔</>
                    )}
                  </button>
                ) : (
                  <div className="ai-success-msg">
                    <span className="success-icon">✅</span>
                    Смета успешно сгенерирована! 
                    <button className="view-estimate-btn">Открыть смету</button>
                  </div>
                )}
              </div>

              <div className="help-box bento-card">
                <div className="help-icon">👨‍💻</div>
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
