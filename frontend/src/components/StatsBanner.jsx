import React from 'react';

export default function StatsBanner() {
  const stats = [
    {
      id: 'stat-1',
      icon: '🤖',
      value: '12 840+',
      label: 'Проведённых AI-анализов & Смет',
      subtext: 'Обработанно проектов по ГОСТ РК',
      badge: 'ГОСТ РК',
      gradientClass: 'stat-gold',
    },
    {
      id: 'stat-2',
      icon: '⏱️',
      value: '50 – 98%',
      label: 'Экономия времени на сметы',
      subtext: 'Ускорение расчёта в 15 раз',
      badge: 'В 15 РАЗ БЫСТРЕЕ',
      gradientClass: 'stat-cyan',
    },
    {
      id: 'stat-3',
      icon: '⚡',
      value: '2 – 15 сек',
      label: 'Скорость AI-расчёта и BOM',
      subtext: 'Мгновенный результат по фото',
      badge: 'NEURAL ENGINE',
      gradientClass: 'stat-cyan',
    },
    {
      id: 'stat-4',
      icon: '🎯',
      value: '99.4%',
      label: 'Точность AI-дефектоскопии',
      subtext: 'Детекция микротрещин и влаги',
      badge: 'VISION AI 2.0',
      gradientClass: 'stat-gold',
    },
  ];

  return (
    <section className="stats-banner-v2">
      <div className="container">
        {/* Header Live Tag */}
        <div className="stats-live-header">
          <span className="live-status-pill">
            <span className="live-pulsing-dot"></span>
            LIVE METRICS QAZGOST AI 2026
          </span>
        </div>

        {/* 4 Bento Glass Stats Cards */}
        <div className="stats-v2-grid">
          {stats.map((item) => (
            <div className={`stat-v2-card ${item.gradientClass}`} key={item.id}>
              {/* Card Header Tag & Icon */}
              <div className="stat-v2-top">
                <span className="stat-v2-badge">{item.badge}</span>
                <div className="stat-v2-icon-box">{item.icon}</div>
              </div>

              {/* Number Value */}
              <div className="stat-v2-value">{item.value}</div>

              {/* Labels */}
              <div className="stat-v2-label">{item.label}</div>
              <div className="stat-v2-subtext">{item.subtext}</div>

              {/* Glowing Bottom Line Indicator */}
              <div className="stat-v2-line"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

