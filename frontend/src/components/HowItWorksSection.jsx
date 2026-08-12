import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      badge: 'ШАГ 01',
      color: 'gold',
      icon: '📸',
      title: 'Загрузите фото объекта',
      desc: 'Сфотографируйте объект ремонта — комнату, стену, потолок или фасад. AI распознает тип работ и объёмы автоматически.',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      pills: ['⚡ 1 клик', '📱 Со смартфона', '🔍 Авто-детекция'],
    },
    {
      num: '02',
      badge: 'ШАГ 02',
      color: 'purple',
      icon: '🧠',
      title: 'AI Нейросеть анализирует',
      desc: '8 нейросетей за 2–15 секунд определяют материалы, объёмы работ, дефекты и рассчитывают стоимость по актуальным ценам РК.',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      pills: ['🤖 8 нейросетей', '⏱️ 2-15 секунд', '📊 СНиП РК 2026'],
    },
    {
      num: '03',
      badge: 'ШАГ 03',
      color: 'emerald',
      icon: '📄',
      title: 'Получите готовую смету',
      desc: 'Готовая смета с BOM-ведомостью материалов, 3 сценариями цены и экспортом в PDF. Публикуйте заказ и выбирайте мастера.',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      pills: ['📥 Экспорт PDF / Excel', '💰 3 цены', '🤝 Прямой заказ'],
    },
  ];

  return (
    <section className="how-it-works-v2" id="how-it-works">
      <div className="container">
        <div className="section-header-center">
          <span className="section-pill-badge">🚀 3 Простых Шага</span>
          <h2 className="section-title">Как работает QazGost AI</h2>
          <p className="section-subtitle">
            От фотографии помещения до детальной сметы и подряда — быстро, точно и прозрачно
          </p>
        </div>

        {/* Timeline Process Grid */}
        <div className="how-v2-grid">
          {steps.map((step, idx) => (
            <div className={`how-v2-card card-${step.color}`} key={idx}>
              {/* Image Header with Step Badge */}
              <div className="how-v2-img-banner">
                <img src={step.image} alt={step.title} />
                <div className="how-v2-overlay"></div>
                <div className="how-v2-num-badge">{step.num}</div>
                <div className="how-v2-step-tag">{step.badge}</div>
              </div>

              {/* Card Body */}
              <div className="how-v2-body">
                <div className="how-v2-icon">{step.icon}</div>
                <h3 className="how-v2-title">{step.title}</h3>
                <p className="how-v2-desc">{step.desc}</p>

                {/* Feature Pills */}
                <div className="how-v2-pills-row">
                  {step.pills.map((pill, pIdx) => (
                    <span className="how-v2-pill" key={pIdx}>
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

