import React from 'react';

export default function EngineeringServicesSection() {
  const engServices = [
    {
      id: 'geo-lab',
      icon: '⛏️',
      badge: 'СНиП РК • Изыскания',
      badgeColor: 'amber',
      telemetry: '⛏ Бурение до -35м // Монолиты',
      title: 'Инженерно-геологические изыскания',
      linkText: 'Подробнее об изысканиях',
      desc: 'Комплексные геологические изыскания с автоматической декомпозицией грунтовых пластов и лабораторным анализом по СП РК.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '⚙️', text: 'Бурение изыскательских скважин' },
        { icon: '🪨', text: 'Описание грунтового массива' },
        { icon: '🧪', text: 'Отбор монолитов и проб вод' },
        { icon: '⚠️', text: 'Изучение опасных процессов' },
      ],
      themeGlow: 'rgba(245, 158, 11, 0.15)',
    },
    {
      id: 'geodesy',
      icon: '⌖',
      badge: 'Топосъемка 1:500 • 3D',
      badgeColor: 'cyan',
      telemetry: '📡 GNSS RTK // 3D-Сканирование',
      title: 'Геодезия и топосъемка',
      linkText: 'Подробнее о геодезии',
      desc: 'Высокоточная привязка осей зданий, лазерное 3D-сканирование и исполнительная съемка подземных коммуникаций.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '📐', text: 'Топосъемка масштабов 1:500' },
        { icon: '📡', text: 'Съемка подземных сетей' },
        { icon: '🎯', text: 'Вынос главных осей в натуру' },
        { icon: '🛰️', text: 'Лазерное 3D-сканирование' },
      ],
      themeGlow: 'rgba(6, 182, 212, 0.15)',
    },
    {
      id: 'cpt',
      icon: '⚡',
      badge: 'CPTu Тест • 200 кН',
      badgeColor: 'yellow',
      telemetry: '⚡ Давление qc = 18.4 МПа',
      title: 'CPT Зондирование',
      linkText: 'Подробнее о CPT',
      desc: 'Статическое зондирование грунтов непрерывным вдавливанием конуса с автоматическими тензодатчиками.',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '⚡', text: 'Вдавливание конуса с датчиками' },
        { icon: '📉', text: 'Измерение лобового сопротивления' },
        { icon: '📊', text: 'Непрерывное расчленение пластов' },
        { icon: '🏗️', text: 'Оценка несущей способности' },
      ],
      themeGlow: 'rgba(234, 179, 8, 0.15)',
    },
    {
      id: 'pile-test',
      icon: '🏗️',
      badge: 'Pmax = 500 т • PDA',
      badgeColor: 'purple',
      telemetry: '🏋️ Статика до 500 т // PDA',
      title: 'Испытания свай',
      linkText: 'Подробнее об испытаниях',
      desc: 'Полевые испытания свай статическими и динамическими нагрузками до 500 тонн с сейсмоакустическим контролем.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '🏋️', text: 'Статическая нагрузка до 500 т' },
        { icon: '⏱️', text: 'Выдерживающая нагрузка' },
        { icon: '🌊', text: 'Динамические испытания (PDA)' },
        { icon: '🔊', text: 'Сейсмоакустический контроль' },
      ],
      themeGlow: 'rgba(168, 85, 247, 0.15)',
    },
    {
      id: 'stamp-test',
      icon: '🧱',
      badge: 'Модуль E • Штамп',
      badgeColor: 'orange',
      telemetry: '📐 Eдеф = 38.5 МПа // Шурф',
      title: 'Штамповые испытания',
      linkText: 'Подробнее о штампах',
      desc: 'Определение деформационных характеристик грунтов плоскими круглыми штампами в шурфах и скважинах.',
      image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '⭕', text: 'Плоские круглые штампы' },
        { icon: '🕳️', text: 'Испытания в скважинах и шурфах' },
        { icon: '📐', text: 'Модуль деформации E (МПа)' },
        { icon: '🧱', text: 'Оценка просадочности грунтов' },
      ],
      themeGlow: 'rgba(249, 115, 22, 0.15)',
    },
    {
      id: 'soil-lab',
      icon: '🧪',
      badge: 'ИЛ ГОСТ РК • Лаборатория',
      badgeColor: 'emerald',
      telemetry: '🧪 Оедометр 0.8 МПа // Хим.анализ',
      title: 'Лаборатория грунтов',
      linkText: 'Подробнее о лаборатории',
      desc: 'Полный физико-механический и химический анализ образцов грунтов и подземных вод на аккредитованных стендах.',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
      bullets: [
        { icon: '⚖️', text: 'Физико-механические свойства' },
        { icon: '🛡️', text: 'Коррозионная агрессивность' },
        { icon: '💧', text: 'Химический анализ воды' },
        { icon: '🗜️', text: 'Компрессионное сжатие' },
      ],
      themeGlow: 'rgba(16, 185, 129, 0.15)',
    },
  ];

  return (
    <section className="engineering-section-v2" id="engineering">
      <div className="container">
        <div className="section-header-center">
          <span className="section-pill-badge">⚙️ Аккредитованные Изыскания & Лаборатории</span>
          <h2 className="section-title">Инженерные изыскания и геотехнический контроль</h2>
          <p className="section-subtitle">
            Полевые и лабораторные испытания на аккредитованном оборудовании. Официальные заключения по стандартам СНиП РК и СП РК.
          </p>
        </div>

        <div className="eng-v2-grid">
          {engServices.map((eng) => (
            <div className={`eng-v2-card theme-${eng.badgeColor}`} key={eng.id}>
              {/* Top Image Banner with Telemetry Badge */}
              <div className="eng-v2-img-banner">
                <img 
                  src={eng.image} 
                  alt={eng.title}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }} 
                />
                <div className="eng-v2-overlay"></div>
                
                {/* Standard Badge */}
                <div className={`eng-v2-tag tag-${eng.badgeColor}`}>
                  <span className="tag-spark-dot"></span>
                  {eng.badge}
                </div>

                {/* Live Telemetry Bar */}
                <div className="eng-v2-telemetry-chip">
                  {eng.telemetry}
                </div>

                {/* Domain Icon Box */}
                <div className={`eng-v2-icon-box icon-${eng.badgeColor}`}>{eng.icon}</div>
              </div>

              {/* Card Body */}
              <div className="eng-v2-body">
                <h3 className="eng-v2-title">{eng.title}</h3>
                <p className="eng-v2-desc">{eng.desc}</p>

                {/* Bullets List with Styled Domain Icons */}
                <div className="eng-v2-bullets-grid">
                  {eng.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="eng-v2-bullet-chip">
                      <span className="domain-bullet-icon">{b.icon}</span>
                      <span>{b.text}</span>
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


