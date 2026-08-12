import React from 'react';

export default function FeatureHighlights() {
  const highlights = [
    {
      icon: '📊',
      title: 'Прозрачные цены',
      badge: '23,884 ПОЗИЦИЙ',
      badgeColor: 'gold',
      text: 'Единый классификатор цен по Казахстану. Автоматический расчёт объёмов и материалов с нормативным запасом 10–15%.',
      metrics: ['🏷️ Актуальность 2026', '📈 Смета за 2 сек', '📋 ГЭСН/СНиП РК'],
      linkText: 'Рассчитать смету',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    },
    {
      icon: '🧠',
      title: 'AI Дефектоскопия',
      badge: '8 НЕЙРОСЕТЕЙ',
      badgeColor: 'pink',
      text: 'Сканирование фото объекта за 2 секунды. Точность детекции трещин, влаги и брака до 95% с планом устранения.',
      metrics: ['🔍 Сканер трещин', '⚡ 95% Точность', '📝 Экспертный отчёт'],
      linkText: 'Проверить дефекты',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
    {
      icon: '⭐',
      title: 'Проверенные мастера',
      badge: 'ТОП ИСПОЛНИТЕЛИ',
      badgeColor: 'cyan',
      text: 'Рейтинг, портфолио выполненных работ и отзывы. Сравнивайте предложения по цене и выбирайте лучших специалистов.',
      metrics: ['🛡️ Проверка ИИН/БИН', '⭐️ Рейтинг 4.9+', '🤝 Безопасная сделка'],
      linkText: 'Найти мастера',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section className="highlights-section">
      <div className="container">
        <div className="highlights-grid">
          {highlights.map((item, idx) => (
            <div className="highlight-card-v2" key={idx}>
              {/* Card Image Header with Overlays */}
              <div className="card-v2-img-wrap">
                <img src={item.image} alt={item.title} />
                <div className="card-v2-gradient-overlay"></div>
                <div className={`card-v2-top-badge badge-${item.badgeColor}`}>
                  <span className="badge-dot"></span>
                  {item.badge}
                </div>
                <div className="card-v2-icon-floating">{item.icon}</div>
              </div>

              {/* Card Body Content */}
              <div className="card-v2-body">
                <h3 className="card-v2-title">{item.title}</h3>
                <p className="card-v2-desc">{item.text}</p>

                {/* Metrics Chips */}
                <div className="card-v2-metrics-row">
                  {item.metrics.map((m, mIdx) => (
                    <span className="metric-chip" key={mIdx}>
                      {m}
                    </span>
                  ))}
                </div>

                {/* Action Link Button */}
                <button
                  className="card-v2-action-btn"
                  onClick={() => alert(`Переход к разделу: ${item.title}`)}
                >
                  <span>{item.linkText}</span>
                  <span className="action-btn-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

