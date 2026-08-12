import React from 'react';

export default function TestimonialsSection() {
  const reviews = [
    {
      name: 'Арман Касымов',
      role: 'Заказчик • г. Алматы',
      avatar: '👨‍💼',
      verified: '✓ Проверен через E-Gov',
      stars: 5,
      metric: '💰 Сэкономлено 350 000 ₸',
      quote:
        '«Сделал смету за 3 секунды по фото ванной. Раньше мастер приезжал на 2 дня, считал на глаз и завышал цену в 2 раза. Теперь я знаю справедливую стоимость.»',
    },
    {
      name: 'Айгерим Нурланова',
      role: 'Дизайнер интерьеров • г. Астана',
      avatar: '👩‍💼',
      verified: '✓ Студия интерьера «Aspan»',
      stars: 5,
      metric: '⚡ Смета за 4 секунды',
      quote:
        '«Использую для клиентов — загружаю фото, получаю смету и сразу показываю заказчику. AI-проверка дефектов помогает выявить проблемы до начала работ.»',
    },
    {
      name: 'Бауыржан Токтаров',
      role: 'Главный прораб • ТОО «СтройМарк»',
      avatar: '👷‍♂️',
      verified: '✓ Проверенный подрядчик РК',
      stars: 5,
      metric: '🏆 +14 выигранных тендеров',
      quote:
        '«Лента заказов — это прорыв. Получаю заявки каждый день, откликаюсь за минуту. Прозрачная система цен помогает выигрывать тендеры честно.»',
    },
  ];

  return (
    <section className="testimonials-v2-section" id="testimonials">
      <div className="container">
        <div className="section-header-center">
          <span className="section-pill-badge">⭐ Реальные Отзывы Пользователей</span>
          <h2 className="section-title">Что говорят наши клиенты в Казахстане</h2>
          <p className="section-subtitle">
            Отзывы заказчиков, дизайнеров и подрядчиков, которые уже ускорили свои проекты с QazGost AI
          </p>
        </div>

        <div className="testimonials-v2-grid">
          {reviews.map((rev, idx) => (
            <div className="testi-v2-card" key={idx}>
              {/* Header Row: Avatar, Name, Verified Tag */}
              <div className="testi-v2-header">
                <div className="testi-v2-avatar">{rev.avatar}</div>
                <div className="testi-v2-info">
                  <div className="testi-v2-name-row">
                    <h3 className="testi-v2-name">{rev.name}</h3>
                    <span className="testi-v2-verified">{rev.verified}</span>
                  </div>
                  <div className="testi-v2-role">{rev.role}</div>
                </div>
              </div>

              {/* Rating & Metric Chip */}
              <div className="testi-v2-rating-row">
                <div className="testi-v2-stars">
                  {'★'.repeat(rev.stars)}
                  <span className="rating-score">5.0</span>
                </div>
                <span className="testi-v2-metric">{rev.metric}</span>
              </div>

              {/* Quote text */}
              <p className="testi-v2-quote">{rev.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

