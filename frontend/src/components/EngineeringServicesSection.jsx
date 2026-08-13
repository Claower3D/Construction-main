import React from 'react';

export default function EngineeringServicesSection() {
  const engServices = [
    {
      id: 'geo-lab',
      icon: '🏔️',
      badge: 'ГОСТ РК • AI-анализ',
      badgeColor: 'gold',
      title: 'Инженерно-геологические изыскания',
      linkText: 'Подробнее об изысканиях',
      desc: 'Комплексные геологические изыскания с автоматической декомпозицией грунтовых пластов по СП РК.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Бурение изыскательских скважин',
        'Описание грунтового массива',
        'Отбор монолитов и проб вод',
        'Изучение опасных процессов',
      ],
    },
    {
      id: 'geodesy',
      icon: '📐',
      badge: 'Топосъемка 1:500',
      badgeColor: 'cyan',
      title: 'Геодезия и топосъемка',
      linkText: 'Подробнее о геодезии',
      desc: 'Высокоточная привязка осей зданий, лазерное 3D-сканирование и исполнительная съемка.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Топосъемка масштабов 1:500',
        'Съемка подземных коммуникаций',
        'Вынос главных осей в натуру',
        'Лазерное 3D-сканирование',
      ],
    },
    {
      id: 'cpt',
      icon: '⚡',
      badge: 'CPT Зондирование',
      badgeColor: 'purple',
      title: 'CPT Зондирование',
      linkText: 'Подробнее о CPT',
      desc: 'Статическое зондирование грунтов непрерывным вдавливанием конуса с тензодатчиками.',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Вдавливание конуса с датчиками',
        'Измерение сопротивления',
        'Непрерывное расчленение разреза',
        'Оценка несущей способности',
      ],
    },
    {
      id: 'pile-test',
      icon: '🏗️',
      badge: 'Испытания свай',
      badgeColor: 'pink',
      title: 'Испытания свай',
      linkText: 'Подробнее об испытаниях',
      desc: 'Полевые испытания свай статическими и динамическими нагрузками до 500 тонн.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Статическая нагрузка до 500 т',
        'Выдерживающая нагрузка',
        'Динамические испытания (PDA)',
        'Сейсмоакустический контроль',
      ],
    },
    {
      id: 'stamp-test',
      icon: '🧱',
      badge: 'Модуль деформации',
      badgeColor: 'gold',
      title: 'Штамповые испытания',
      linkText: 'Подробнее о штампах',
      desc: 'Определение деформационных характеристик грунтов плоскими круглыми штампами в шурфах.',
      image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Плоские круглые штампы',
        'Испытания в скважинах и шурфах',
        'Модуль деформации E (МПа)',
        'Оценка просадочности грунтов',
      ],
    },
    {
      id: 'soil-lab',
      icon: '🧪',
      badge: 'Аккредитованная лаборатория',
      badgeColor: 'cyan',
      title: 'Лаборатория грунтов',
      linkText: 'Подробнее о лаборатории',
      desc: 'Полный физико-механический и химический анализ образцов грунтов и подземных вод.',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
      bullets: [
        'Физико-механические свойства',
        'Коррозионная агрессивность',
        'Химический анализ воды',
        'Компрессионное сжатие',
      ],
    },
  ];

  return (
    <section className="engineering-section-v2" id="engineering">
      <div className="container">
        <div className="section-header-center">
          <span className="section-pill-badge">⚙️ Сертифицированные Лаборатории</span>
          <h2 className="section-title">Инженерные изыскания и лабораторный контроль</h2>
          <p className="section-subtitle">
            Полевые и лабораторные испытания на аккредитованном оборудовании. Экспертные заключения по стандартам СНиП РК.
          </p>
        </div>

        <div className="eng-v2-grid">
          {engServices.map((eng) => (
            <div className="eng-v2-card" key={eng.id}>
              {/* Top Image Banner */}
              <div className="eng-v2-img-banner">
                <img 
                  src={eng.image} 
                  alt={eng.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} 
                />
                <div className="eng-v2-overlay"></div>
                <div className={`eng-v2-tag tag-${eng.badgeColor}`}>
                  <span className="tag-spark-dot"></span>
                  {eng.badge}
                </div>
                <div className="eng-v2-icon-box">{eng.icon}</div>
              </div>

              {/* Card Body */}
              <div className="eng-v2-body">
                <h3 className="eng-v2-title">{eng.title}</h3>
                <p className="eng-v2-desc">{eng.desc}</p>

                {/* Bullets List with Styled Checkmarks */}
                <div className="eng-v2-bullets-grid">
                  {eng.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="eng-v2-bullet-chip">
                      <span className="check-badge">✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Card Action Footer */}
                <div className="eng-v2-footer">
                  <button
                    className="eng-v2-link-btn"
                    onClick={() => alert(`Информация: ${eng.title}`)}
                  >
                    <span>{eng.linkText}</span>
                    <span className="link-arrow">➔</span>
                  </button>
                  <button
                    className={`eng-v2-action-circle action-circle-${eng.badgeColor}`}
                    onClick={() => alert(`Заказ услуги: ${eng.title}`)}
                    title="Заказать услугу"
                  >
                    ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


