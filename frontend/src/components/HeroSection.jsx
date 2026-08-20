import React from 'react';

export default function HeroSection({ role }) {
  const isCustomer = role === 'customer';

  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-grid">
          {/* Hero Left Card */}
          <div className="hero-left-card">
            <div>
              <div className="hero-pill-tag">
                <span className="spark-dot"></span>
                <span>AI-оценка по фото за секунды • СНиП & ГОСТ РК • RU / KZ / EN</span>
              </div>

              <h1 className="hero-title">
                {isCustomer ? (
                  <>
                    <span className="hero-gradient-text">Стройте и ремонтируйте</span> без переплат и рисков
                  </>
                ) : (
                  <>
                    <span className="hero-gradient-text">Зарабатывайте на строительных заказах</span> — честно и прозрачно
                  </>
                )}
              </h1>

              <p className="hero-description">
                {isCustomer
                  ? 'Загружайте фото помещений или ТЗ. Нейросеть QazGost AI за 2 секунды рассчитает точную смету, выявит дефекты и предложит лучших мастеров с гарантией.'
                  : 'Открывайте живую ленту заказов по всему Казахстану, отправляйте предложения по цене и срокам, ведите проекты в «Моих работах» и сдавайте результат онлайн.'}
              </p>

              <div className="hero-cta-buttons">
                <button
                  className="cta-btn-gold"
                  onClick={() =>
                    alert(
                      isCustomer
                        ? 'Открыта форма создания заказа!'
                        : 'Открыта лента актуальных заказов!'
                    )
                  }
                >
                  <span>{isCustomer ? 'Разместить заказ' : 'Открыть ленту заказов'}</span>
                  <span className="cta-badge-kbd">OPEN</span>
                </button>

                <button
                  className="cta-btn-glass"
                  onClick={() => alert('Скачивание образца сметы по ГОСТ (PDF)')}
                >
                  <span>Пример сметы</span>
                  <span className="cta-badge-kbd">PDF</span>
                </button>

                <button
                  className="cta-btn-glass"
                  onClick={() => alert('Приложение QazGost AI доступно в App Store & Google Play')}
                >
                  <span>Скачать приложение</span>
                  <span className="cta-badge-kbd">iOS / Android</span>
                </button>
              </div>
            </div>

            <div className="feature-pills-row">
              <span className="pill-item">● Прозрачные цены 2026</span>
              <span className="pill-item">● Детекция дефектов</span>
              <span className="pill-item">● Точный BOM расчёт</span>
              <span className="pill-item">● Экспорт в PDF / Excel</span>
            </div>
          </div>

          {/* Hero Right Card: Live AI Scan Preview */}
          <div className="hero-right-card">
            <div>
              <div className="preview-header">
                <div className="preview-title-group">
                  <span className="live-status-dot"></span>
                  <h3 className="preview-title">Живой AI Сканер</h3>
                </div>
                <span className="preview-role-badge">
                  Режим: {isCustomer ? 'Заказчик' : 'Исполнитель'}
                </span>
              </div>

              <div className="preview-dashed-box">
                <div className="preview-image-box">
                  <img
                    src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80"
                    alt="Строительный объект QazGost AI"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="preview-scan-line"></div>
                  <div className="ai-overlay-tag">
                    <span className="ai-spark">✨</span> QazGost AI Engine 2.0
                  </div>
                </div>

                <div className="preview-stats-list">
                  <div className="preview-stat-row">
                    <span className="preview-stat-label">Расчёт сметы</span>
                    <span className="preview-stat-val val-cyan">
                      Готово за 2 сек • 85-95% точность
                    </span>
                  </div>
                  <div className="preview-stat-row">
                    <span className="preview-stat-label">Материалы (BOM)</span>
                    <span className="preview-stat-val val-gold">
                      + 10-15% нормативный запас
                    </span>
                  </div>
                  <div className="preview-stat-row">
                    <span className="preview-stat-label">Дефектоскопия</span>
                    <span className="preview-stat-val val-cyan">
                      Трещины • Влага • Перепады стен (СНиП РК)
                    </span>
                  </div>
                </div>

                <div className="preview-progress-track">
                  <div className="preview-progress-fill"></div>
                </div>

                <button
                  className="preview-cta-btn"
                  onClick={() =>
                    alert(
                      isCustomer
                        ? 'Переход к мгновенной оценке объекта по фото'
                        : 'Отклик на заказ отправлен заказчику!'
                    )
                  }
                >
                  <span>{isCustomer ? 'Оценить объект по фото' : 'Откликнуться на заказ'}</span>
                  <span className="cta-badge-kbd">LIVE</span>
                </button>
              </div>
            </div>

            <p className="preview-footer-note">
              ⚡ Расчёт выполняется через AI-нейросеть и официальную ценовую базу ГОСТ/ГЭСН Казахстана.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

