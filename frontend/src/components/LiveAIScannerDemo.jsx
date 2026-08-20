import React, { useState, useEffect } from 'react';
import './LiveAIScannerDemo.scss';

export default function LiveAIScannerDemo() {
  const [activeSample, setActiveSample] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  const samples = [
    {
      id: 0,
      title: 'Ленточный фундамент М300',
      region: 'Алматы (СНиП РК ×1.0)',
      category: 'БЕТОННЫЕ РАБОТЫ',
      icon: '🏗️',
      dims: '12.0м × 10.0м × 1.2м',
      vol: '28.8 м³',
      totalPrice: '2 359 200 ₸',
      duration: '14 дней',
      confidence: '99.4%',
      items: [
        { name: 'Бетон тяжелый М300 (W6, F150)', qty: '28.8 м³', price: '24 500 ₸', total: '705 600 ₸' },
        { name: 'Арматура рифленая А500С Ø12мм', qty: '2.4 т', price: '320 000 ₸', total: '768 000 ₸' },
        { name: 'Опалубка ламинированная щитовая', qty: '88.0 м²', price: '4 500 ₸', total: '396 000 ₸' },
        { name: 'Разработка грунта экскаватором', qty: '45.0 м³', price: '3 200 ₸', total: '144 000 ₸' },
        { name: 'Укладка и вибрирование смеси', qty: '28.8 м³', price: '12 000 ₸', total: '345 600 ₸' }
      ]
    },
    {
      id: 1,
      title: 'Кладка газоблока D500',
      region: 'Астана (СНиП РК ×1.18)',
      category: 'КАМЕННЫЕ РАБОТЫ',
      icon: '🧱',
      dims: '240 м² (толщина 300мм)',
      vol: '72.0 м³',
      totalPrice: '3 480 000 ₸',
      duration: '10 дней',
      confidence: '98.8%',
      items: [
        { name: 'Газоблок автоклавный D500 600×300×200', qty: '72.0 м³', price: '28 000 ₸', total: '2 016 000 ₸' },
        { name: 'Клей для ячеистого бетона (мешки 25кг)', qty: '65 шт', price: '2 400 ₸', total: '156 000 ₸' },
        { name: 'Арматурная сетка базальтовая', qty: '240 м²', price: '1 200 ₸', total: '288 000 ₸' },
        { name: 'Кладка наружных стен с армированием', qty: '72.0 м³', price: '14 200 ₸', total: '1 020 000 ₸' }
      ]
    },
    {
      id: 2,
      title: 'Кровля металлочерепица 0.5мм',
      region: 'Шымкент (СНиП РК ×0.95)',
      category: 'КРОВЕЛЬНЫЕ РАБОТЫ',
      icon: '🏠',
      dims: '180 м² (двускатная)',
      vol: '180.0 м²',
      totalPrice: '1 890 000 ₸',
      duration: '8 дней',
      confidence: '99.1%',
      items: [
        { name: 'Металлочерепица Монтеррей 0.5мм Ral 7024', qty: '210 м²', price: '3 800 ₸', total: '798 000 ₸' },
        { name: 'Брус хвойный 50×150мм (стропила)', qty: '4.2 м³', price: '95 000 ₸', total: '399 000 ₸' },
        { name: 'Мембрана супердиффузионная паро/гидро', qty: '240 м²', price: '650 ₸', total: '156 000 ₸' },
        { name: 'Монтаж стропильной системы и настила', qty: '180 м²', price: '2 980 ₸', total: '537 000 ₸' }
      ]
    },
    {
      id: 3,
      title: 'Полусухая стяжка пола с фиброй',
      region: 'Караганда (СНиП РК ×1.05)',
      category: 'ОТДЕЛОЧНЫЕ РАБОТЫ',
      icon: '📐',
      dims: '100 м² (толщина 60мм)',
      vol: '6.0 м³',
      totalPrice: '468 000 ₸',
      duration: '2 дня',
      confidence: '99.7%',
      items: [
        { name: 'Цемент ПЦ-500 Д0 + Песок мытый', qty: '6.0 м³', price: '26 000 ₸', total: '156 000 ₸' },
        { name: 'Фиброволокно полипропиленовое 12мм', qty: '8 кг', price: '3 500 ₸', total: '28 000 ₸' },
        { name: 'Пластификатор для теплых полов', qty: '10 л', price: '1 400 ₸', total: '14 000 ₸' },
        { name: 'Механизированная укладка с затиркой', qty: '100 м²', price: '2 700 ₸', total: '270 000 ₸' }
      ]
    }
  ];

  const handleSelectSample = (idx) => {
    if (idx === activeSample) return;
    setActiveSample(idx);
    setIsScanning(true);
    setScanProgress(0);
    if (window.sfx) window.sfx.playRadar();

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setIsScanning(false);
        if (window.sfx) window.sfx.playSuccess();
      }
      setScanProgress(p);
    }, 45);
  };

  const current = samples[activeSample];

  return (
    <div className="live-ai-scanner-cockpit">
      <div className="scanner-header-bar">
        <div className="scanner-title-group">
          <span className="live-pulse-indicator"></span>
          <h2 className="scanner-main-title">Интерактивный AI-сканер чертежей & QTO калькулятор</h2>
        </div>
        <span className="scanner-badge-kz">⚡ YOLOv8 + СНиП РК 2026 (&lt;1ms)</span>
      </div>

      <div className="scanner-tabs-row">
        {samples.map((s, idx) => (
          <button
            key={s.id}
            className={`scanner-tab-btn ${activeSample === idx ? 'active' : ''}`}
            onClick={() => handleSelectSample(idx)}
          >
            <span className="tab-icon">{s.icon}</span>
            <div className="tab-meta">
              <span className="tab-name">{s.title}</span>
              <span className="tab-region">{s.region}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="scanner-cockpit-grid">
        {/* Left Visual Blueprint Scanner */}
        <div className="scanner-visual-viewport">
          <div className="viewport-grid-bg"></div>
          {isScanning && <div className="viewport-laser-line" style={{ top: `${scanProgress}%` }}></div>}
          
          <div className="viewport-center-hud">
            <div className="hud-corner top-left"></div>
            <div className="hud-corner top-right"></div>
            <div className="hud-corner bottom-left"></div>
            <div className="hud-corner bottom-right"></div>

            <div className="hud-object-icon">{current.icon}</div>
            <div className="hud-bbox-tag">
              <span>{current.category}</span>
              <span className="conf-score">{current.confidence}</span>
            </div>
            <div className="hud-dimensions-label">{current.dims}</div>
          </div>

          <div className="viewport-telemetry-strip">
            <span>📐 Объём: <strong>{current.vol}</strong></span>
            <span>⏱️ Срок: <strong>{current.duration}</strong></span>
            <span>🛰️ AI Engine: <strong>Go 1.26 RAM</strong></span>
          </div>
        </div>

        {/* Right QTO Specification Table */}
        <div className="scanner-spec-panel">
          <div className="spec-header-row">
            <div>
              <div className="spec-subtitle">QTO ВЕДОМОСТЬ МАТЕРИАЛОВ И РАБОТ</div>
              <h3 className="spec-item-title">{current.title}</h3>
            </div>
            <div className="spec-total-pill">
              <span className="spec-total-label">ИТОГО ПО СМЕТЕ:</span>
              <span className="spec-total-sum">{current.totalPrice}</span>
            </div>
          </div>

          <div className="spec-table-container">
            <table className="spec-table">
              <thead>
                <tr>
                  <th>Наименование ресурса / работы</th>
                  <th>Объём</th>
                  <th>Цена за ед.</th>
                  <th style={{ textAlign: 'right' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="resource-name">{row.name}</td>
                    <td className="resource-qty">{row.qty}</td>
                    <td className="resource-price">{row.price}</td>
                    <td className="resource-total">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="spec-footer-actions">
            <button 
              className="spec-btn-export"
              onClick={() => {
                if (window.sfx) window.sfx.playClick();
                window.open('http://localhost:8080/api/v1/export/estimate.csv', '_blank');
              }}
            >
              📄 Скачать акт КС-2 (Excel / CSV)
            </button>
            <div className="spec-guarantee-note">
              🛡️ Расчёт соответствует нормам СН РК 8.02-05 и защищен эскроу-гарантией
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
