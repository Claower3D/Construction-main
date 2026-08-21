import React, { useState, useRef } from 'react';
import './LiveAIScannerDemo.scss';
import { exportPricesToExcel } from '../services/adminExcelIO';
import Building3DViewer from './Building3DViewer';

export default function LiveAIScannerDemo() {
  const [activeSample, setActiveSample] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [customBlueprint, setCustomBlueprint] = useState(null);
  const fileInputRef = useRef(null);

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

  const startScanningAnimation = () => {
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

  const handleSelectSample = (idx) => {
    setCustomBlueprint(null);
    if (idx === activeSample && !customBlueprint) return;
    setActiveSample(idx);
    startScanningAnimation();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

    const newCustomBlueprint = {
      id: 999,
      title: `Чертёж: ${fileNameWithoutExt}`,
      region: 'Светлое здание (СНиП РК ×1.0)',
      category: 'ЧЕРТЁЖ ПОЛЬЗОВАТЕЛЯ (DWG/PDF)',
      icon: isImage ? '🖼️' : '📐',
      previewUrl,
      fileName: file.name,
      dims: '15.5м × 12.0м × 3.2м',
      vol: '42.5 м³',
      totalPrice: '4 852 500 ₸',
      duration: '18 дней',
      confidence: '99.6% (YOLOv8 Vision)',
      items: [
        { name: `Монолитные конструкции (${fileNameWithoutExt})`, qty: '42.5 м³', price: '28 500 ₸', total: '1 211 250 ₸' },
        { name: 'Арматурный каркас A500C Ø14мм (ГОСТ 34028)', qty: '3.8 т', price: '335 000 ₸', total: '1 273 000 ₸' },
        { name: 'Опалубочные системы & Ламинированный щит', qty: '140.0 м²', price: '4 800 ₸', total: '672 000 ₸' },
        { name: 'Монтаж и бетонирование несущих узлов', qty: '42.5 м³', price: '22 500 ₸', total: '956 250 ₸' },
        { name: 'Гидроизоляция битумно-полимерная мембранная', qty: '185.0 м²', price: '4 000 ₸', total: '740 000 ₸' }
      ]
    };

    setCustomBlueprint(newCustomBlueprint);
    startScanningAnimation();
  };

  const current = customBlueprint || samples[activeSample];

  const handleExportEstimate = () => {
    if (window.sfx) window.sfx.playClick();
    
    // Map current specification items to Excel format
    const exportData = current.items.map((item, idx) => ({
      code: `POS-${idx + 101}`,
      name: item.name,
      category: current.category,
      unit: item.qty.split(' ')[1] || 'ед',
      laborNorm: 1.5,
      price: parseInt(item.total.replace(/[^\d]/g, ''), 10) || 0,
      region: current.region
    }));

    exportPricesToExcel(exportData, `Смета_${current.title.replace(/[^\wа-яА-Я0-9]/g, '_')}.xlsx`);
  };

  return (
    <div className="live-ai-scanner-cockpit">
      <div className="scanner-header-bar">
        <div className="scanner-title-group">
          <span className="live-pulse-indicator"></span>
          <h2 className="scanner-main-title">Интерактивный AI-сканер чертежей & QTO калькулятор</h2>
        </div>
        <div className="scanner-header-actions">
          <button
            className="scanner-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📤 Загрузить свой чертёж (.dwg, .pdf, .png)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".dwg,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <span className="scanner-badge-kz">⚡ YOLOv8 + СНиП РК 2026 (&lt;1ms)</span>
        </div>
      </div>

      {customBlueprint && (
        <div className="custom-blueprint-banner">
          <span>📁 Загружен ваш чертёж: <strong>{customBlueprint.fileName}</strong></span>
          <button className="reset-custom-btn" onClick={() => setCustomBlueprint(null)}>
            ✕ Вернуться к образцам
          </button>
        </div>
      )}

      <div className="scanner-tabs-row">
        {samples.map((s, idx) => (
          <button
            key={s.id}
            className={`scanner-tab-btn ${!customBlueprint && activeSample === idx ? 'active' : ''}`}
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
        {/* Left Visual Blueprint Scanner - 3D */}
        <div className="scanner-visual-viewport">
          <div className="viewport-grid-bg"></div>
          
          {/* Custom Image Preview Background if uploaded */}
          {current.previewUrl && (
            <img src={current.previewUrl} alt="Custom Blueprint" className="custom-blueprint-img-bg" />
          )}

          {/* 3D Building Viewer */}
          {!current.previewUrl && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
              <Building3DViewer sampleIndex={activeSample} isScanning={isScanning} />
            </div>
          )}

          {isScanning && <div className="viewport-laser-line" style={{ top: `${scanProgress}%` }}></div>}
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
              onClick={handleExportEstimate}
            >
              📄 Скачать акт КС-2 (Excel .xlsx)
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
