import React from 'react';

export default function PlatformServicesSection() {
  const card1 = {
    title: 'AI-Оценка стоимости объекта',
    bulletsCol1: ['Автоматический расчёт сметы', 'Анализ ТЗ и объёмов работ'],
    bulletsCol2: ['Расчёт спецификации BOM', '3 сценария цены по ГОСТ РК'],
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
  };

  const card2 = {
    title: 'AI Дефектоскопия & Контроль',
    bullets: ['Сканирование трещин по фото', 'Детекция следов влаги', 'Экспертный отчёт РК'],
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  };

  const row2Cards = [
    {
      title: 'Лента заказов LIVE',
      bullets: ['Отклики за 3 минуты', 'Прозрачные цены и сроки', 'Прямой чат с заказчиком'],
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Мои работы & Проекты',
      bullets: ['Контроль этапов и сроков', 'Чек-листы приемки работ', 'Сдача объекта онлайн'],
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Маркетплейс техники',
      bullets: ['Аренда спецтехники в РК', 'Бронирование смен online', 'Проверенные машинисты'],
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const card6Full = {
    title: 'Инжиниринг, ПСД & Строительство под ключ',
    bulletsCol1: ['Разработка ПСД и WBS-структура', 'Монолитные и фасадные работы под ключ'],
    bulletsCol2: ['Инженерные сети (ОВК, Электрика, Газ)', 'Технический и авторский надзор РК'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  };

  return (
    <section className="services-section-v2" id="services">
      <div className="container">
        <div className="section-header-center">
          <h2 className="section-title-purple">НАШИ УСЛУГИ</h2>
        </div>

        {/* 6-Card Exact Layout Grid (Matching Reference Screenshot) */}
        <div className="exact-ref-grid">
          {/* Row 1: Card 1 (Wide ~62%) + Card 2 (Medium ~38%) */}
          <div className="ref-row-1">
            {/* Card 1 */}
            <div className="ref-card card-wide-60">
              <div className="ref-card-text">
                <h3 className="ref-card-title">{card1.title}</h3>
                <div className="ref-bullets-2col">
                  <ul className="ref-bullets-list">
                    {card1.bulletsCol1.map((b, idx) => (
                      <li key={idx}>
                        <span className="ref-dot"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="ref-bullets-list">
                    {card1.bulletsCol2.map((b, idx) => (
                      <li key={idx}>
                        <span className="ref-dot"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="ref-card-img-side">
                <img src={card1.image} alt={card1.title} />
                <div className="ref-slanted-cut"></div>
                <button
                  className="ref-purple-circle"
                  onClick={() => alert(`Запуск: ${card1.title}`)}
                >
                  ↗
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="ref-card card-medium-40">
              <div className="ref-card-text">
                <h3 className="ref-card-title">{card2.title}</h3>
                <ul className="ref-bullets-list">
                  {card2.bullets.map((b, idx) => (
                    <li key={idx}>
                      <span className="ref-dot"></span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ref-card-img-side">
                <img src={card2.image} alt={card2.title} />
                <div className="ref-slanted-cut"></div>
                <button
                  className="ref-purple-circle"
                  onClick={() => alert(`Запуск: ${card2.title}`)}
                >
                  ↗
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Card 3, Card 4, Card 5 (Three equal 33% cards) */}
          <div className="ref-row-2">
            {row2Cards.map((item, idx) => (
              <div className="ref-card card-third-33" key={idx}>
                <div className="ref-card-text">
                  <h3 className="ref-card-title">{item.title}</h3>
                  <ul className="ref-bullets-list">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx}>
                        <span className="ref-dot"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ref-card-img-side">
                  <img src={item.image} alt={item.title} />
                  <div className="ref-slanted-cut"></div>
                  <button
                    className="ref-purple-circle"
                    onClick={() => alert(`Запуск: ${item.title}`)}
                  >
                    ↗
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Row 3: Card 6 (Full Width 100%) */}
          <div className="ref-row-3">
            <div className="ref-card card-full-100">
              <div className="ref-card-text hero-text">
                <h3 className="ref-card-title">{card6Full.title}</h3>
                <div className="ref-bullets-2col">
                  <ul className="ref-bullets-list">
                    {card6Full.bulletsCol1.map((b, idx) => (
                      <li key={idx}>
                        <span className="ref-dot"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="ref-bullets-list">
                    {card6Full.bulletsCol2.map((b, idx) => (
                      <li key={idx}>
                        <span className="ref-dot"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="ref-card-img-side hero-img-side">
                <img src={card6Full.image} alt={card6Full.title} />
                <div className="ref-slanted-cut"></div>
                <button
                  className="ref-purple-circle"
                  onClick={() => alert(`Запуск: ${card6Full.title}`)}
                >
                  ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


