import React, { useState } from 'react';
import './DefectInspectorPage.css';

export default function DefectInspectorPage({ onBack, hideHeader = false }) {
  const [photos, setPhotos] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [aiDescription, setAiDescription] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [report, setReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      showToast('⚠️ Максимальное количество фото: 10 штук');
      return;
    }

    const newPhotos = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      url: URL.createObjectURL(file)
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    showToast(`📸 Добавлено ${files.length} фото`);
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const applyPresetPrompt = (promptText) => {
    setAiDescription(prev => prev ? `${prev}. ${promptText}` : promptText);
  };

  const handleRunInspection = (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      showToast('⚠️ Пожалуйста, загрузите хотя бы 1 фото дефекта');
      return;
    }

    setIsScanning(true);
    setReport(null);

    const steps = [
      '📸 Обработка снимков компьютером зрания...',
      '📐 Анализ раскрытия трещин и геометрии...',
      '📜 Сопоставление со стандартами СНиП РК 2026...',
      '✨ Генерация заключения и расчета сметы...'
    ];

    let currentStep = 0;
    setScanStepMessage(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanStepMessage(steps[currentStep]);
      } else {
        clearInterval(interval);
        setIsScanning(false);

        // Generated mock defect report based on user description or standard scan
        const defectTypes = [
          'Усадочная вертикальная трещина кладки газоблока',
          'Отслоение выравнивающего слоя штукатурки и микротрещины',
          'Нарушение гидроизоляции примыканий (сырость / плесень)',
          'Прогиб плиты перекрытия и горизонтальный скол'
        ];
        const randomDefect = defectTypes[Math.floor(Math.random() * defectTypes.length)];

        setReport({
          id: `DEF-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleString('ru-RU'),
          defectType: randomDefect,
          severity: 'Средний класс риска (Требует локального ремонта)',
          snipCode: 'СНиП РК 3.02-04-2009 (Раздел 5.4.1)',
          fixMethod: 'Расшивка трещины под углом 45°, антисептическая обработка, армирование стеклосеткой 160 г/м² и заделка безусадочной штукатурной смесью.',
          estimatedCost: '140 000 - 180 000 ₸',
          workDays: '3-4 рабочих дня',
          clientName: clientName || 'Заказчик',
          clientPhone: clientPhone || '+7 (707) ***-**-**',
          address: clientAddress || 'г. Алматы'
        });

        showToast('✅ Экспертиза дефекта успешно завершена!');
      }
    }, 900);
  };

  return (
    <div className="di-container">
      {toastMessage && <div className="di-toast">{toastMessage}</div>}

      {/* Header Bar */}
      {!hideHeader && (
        <div className="di-header-bar">
          <button className="di-back-btn" onClick={onBack} title="Назад">←</button>
          <div className="di-title-flex">
            <span className="di-header-icon">🔍</span>
            <h2>Проверка дефектов</h2>
          </div>
        </div>
      )}

      {/* Main Glass Card */}
      <div className="di-main-card">
        
        {/* SECTION 1: 📸 Загрузите фото */}
        <div className="di-section">
          <div className="di-section-title">
            <span className="di-sec-icon">📸</span>
            <h3>Загрузите фото</h3>
          </div>

          <div 
            className="di-dropzone"
            onClick={() => document.getElementById('di-file-input').click()}
          >
            <input 
              type="file" 
              id="di-file-input"
              multiple 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            <div className="di-drop-content">
              <span className="di-drop-icon">🔍</span>
              <p className="di-drop-main">Перетащите или нажмите для загрузки</p>
              <p className="di-drop-sub">До 10 фото со смартфона или камеры</p>
            </div>
          </div>

          {/* Photos Thumbnails Grid */}
          {photos.length > 0 && (
            <div className="di-thumbs-grid">
              {photos.map(p => (
                <div key={p.id} className="di-thumb-item">
                  <img src={p.url} alt={p.name} />
                  <button 
                    type="button" 
                    className="di-thumb-remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(p.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: 📞 Контактные данные клиента */}
        <div className="di-section mt-4">
          <div className="di-section-title">
            <span className="di-sec-icon">📞</span>
            <h3>Контактные данные клиента</h3>
          </div>

          <div className="di-form-stack">
            <input 
              type="text" 
              placeholder="Имя клиента"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="di-input"
            />

            <input 
              type="text" 
              placeholder="Телефон (+7...)"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="di-input"
            />

            <input 
              type="text" 
              placeholder="Адрес объекта (необязательно)"
              value={clientAddress}
              onChange={e => setClientAddress(e.target.value)}
              className="di-input"
            />
          </div>
        </div>

        {/* SECTION 3: 🤖 Описание для ИИ */}
        <div className="di-section mt-4">
          <div className="di-section-title">
            <span className="di-sec-icon">🤖</span>
            <h3>Описание для ИИ</h3>
          </div>

          <textarea 
            rows="4"
            placeholder="Опишите проблему или что нужно проверить (например: 'Трещина на стене в углу комнаты, появилась после зимы')"
            value={aiDescription}
            onChange={e => setAiDescription(e.target.value)}
            className="di-textarea"
          ></textarea>

          {/* Quick Preset Prompt Chips */}
          <div className="di-preset-chips">
            <span className="di-chips-label">Быстрые подсказки:</span>
            <button type="button" onClick={() => applyPresetPrompt('Трещина в стене')}>🧱 Трещина в стене</button>
            <button type="button" onClick={() => applyPresetPrompt('Протечка / сырость')}>💧 Протечка / сырость</button>
            <button type="button" onClick={() => applyPresetPrompt('Перепад пола / потолка')}>📐 Перепад пола / потолка</button>
            <button type="button" onClick={() => applyPresetPrompt('Брак штукатурки')}>🔨 Брак штукатурки</button>
          </div>
        </div>

        {/* Submit Coral Gradient CTA Button */}
        <button 
          className="di-btn-submit"
          onClick={handleRunInspection}
          disabled={isScanning}
        >
          {isScanning ? (
            <span className="di-scanning-flex">
              <span className="di-spinner">⚙️</span>
              {scanStepMessage}
            </span>
          ) : (
            <span>🔍 Проверить и сформировать отчёт</span>
          )}
        </button>

      </div>

      {/* AI Scanner Result Card */}
      {report && (
        <div className="di-report-card">
          <div className="di-report-header">
            <span className="di-report-badge">📋 Экспертное заключение AI-Дефектоскопии</span>
            <span className="di-report-id">Акт № {report.id}</span>
          </div>

          <div className="di-report-grid">
            <div className="di-r-item">
              <span className="label">Обнаруженный дефект:</span>
              <strong className="val pink">{report.defectType}</strong>
            </div>

            <div className="di-r-item">
              <span className="label">Класс риска по СНиП:</span>
              <strong className="val warning">{report.severity}</strong>
            </div>

            <div className="di-r-item">
              <span className="label">Нормативный код СНиП РК:</span>
              <code className="val-code">{report.snipCode}</code>
            </div>

            <div className="di-r-item">
              <span className="label">Рекомендуемый метод устранения:</span>
              <p className="val-desc">{report.fixMethod}</p>
            </div>

            <div className="di-r-item highlight">
              <span className="label">Ориентировочная стоимость ремонта:</span>
              <strong className="val-price">{report.estimatedCost}</strong>
            </div>
          </div>

          <div className="di-report-actions">
            <button 
              className="di-btn-pdf"
              onClick={() => showToast('📄 PDF-Отчёт скачан на устройство')}
            >
              📥 Скачать PDF Отчёт
            </button>

            <button 
              className="di-btn-wa"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Отчет дефектоскопии № ${report.id}: ${report.defectType}, Стоимость: ${report.estimatedCost}`)}`, '_blank')}
            >
              💬 Отправить в WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
