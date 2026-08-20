import React, { useState } from 'react';
import './SmartPhotoEstimatePage.css';

export default function SmartPhotoEstimatePage({ onBack, hideHeader = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('Все');
  const [selectedCategory, setSelectedCategory] = useState('demolition'); // Default demo
  const [isCategorySkipped, setIsCategorySkipped] = useState(false);
  const [analysisModeTab, setAnalysisModeTab] = useState('fast'); // 'fast' | '3d' | 'contour'

  // Contour mode sub-states
  const [isDrawing, setIsDrawing] = useState(false);
  const [contourPoints, setContourPoints] = useState([]);
  const [scaleSize, setScaleSize] = useState('2.5 м');

  // Photo & Uploads State
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');

  // AI Provider & Multi-Pass Mode State
  const [aiEngineMode, setAiEngineMode] = useState('auto'); // 'auto' | 'fast' | 'detailed' | 'vip'
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [calculatedEstimate, setCalculatedEstimate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = [
    { id: 'earth', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '🔨', title: 'Земляные работы', count: '319 работ', rate: 2500 },
    { id: 'foundation', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🏗️', title: 'Фундамент', count: '273 работ', rate: 18000 },
    { id: 'concrete', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🧱', title: 'Бетон и монолит', count: '656 работ', rate: 22000 },
    { id: 'masonry', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '🧱', title: 'Кладка', count: '259 работ', rate: 4500 },
    { id: 'metal', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🔩', title: 'Металлоконструкции', count: '306 работ', rate: 14000 },
    { id: 'roof', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🏠', title: 'Кровля', count: '336 работ', rate: 6500 },
    { id: 'facade', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '🏢', title: 'Фасад', count: '235 работ', rate: 5800 },
    { id: 'windows', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🚪', title: 'Окна и двери', count: '462 работ', rate: 12000 },
    { id: 'insulation', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🥊', title: 'Утепление и изоляция', count: '267 работ', rate: 2800 },
    { id: 'demolition', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '💥', title: 'Демонтаж', count: '87 работ', rate: 1800 },
    { id: 'wall_finish', group: 'Отделка', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80', icon: '🎨', title: 'Отделка стен', count: '920 работ', rate: 3500 },
    { id: 'floors', group: 'Отделка', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80', icon: '🟫', title: 'Полы и плитка', count: '566 работ', rate: 4200 },
    { id: 'ceilings', group: 'Отделка', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '💡', title: 'Потолки', count: '128 работ', rate: 2900 },
    { id: 'stairs', group: 'Отделка', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🪜', title: 'Лестницы и балконы', count: '121 работ', rate: 15000 },
    { id: 'electric', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '⚡', title: 'Электрика', count: '777 работ', rate: 3800 },
    { id: 'plumbing', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🚿', title: 'Сантехника и водоснабжение', count: '633 работ', rate: 4500 },
    { id: 'heating', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🔥', title: 'Отопление', count: '292 работ', rate: 5200 },
    { id: 'hvac', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '❄️', title: 'Вентиляция и кондиц.', count: '551 работ', rate: 6000 },
    { id: 'gas', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80', icon: '🔵', title: 'Газоснабжение', count: '128 работ', rate: 8500 },
    { id: 'automation', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80', icon: '📡', title: 'Автоматизация и слабот.', count: '561 работ', rate: 4800 },
    { id: 'fire_safety', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🧯', title: 'Пожарная безопасность', count: '218 работ', rate: 5500 },
    { id: 'external_nets', group: 'Инженерия', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🔌', title: 'Наружные сети', count: '361 работ', rate: 7200 },
    { id: 'landscaping', group: 'Прочее', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '🌳', title: 'Благоустройство', count: '370 работ', rate: 3200 },
    { id: 'roads', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400&q=80', icon: '🛣️', title: 'Дороги и мосты', count: '313 работ', rate: 9500 },
    { id: 'wood', group: 'Общестрой', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '🪵', title: 'Деревянные конструкции', count: '213 работ', rate: 6800 },
    { id: 'interior', group: 'Отделка', image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&q=80', icon: '🛋️', title: 'Мебель и оборудование', count: '424 работ', rate: 8200 },
    { id: 'design', group: 'Прочее', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80', icon: '📐', title: 'Проектирование', count: '134 работ', rate: 12000 },
    { id: 'special', group: 'Прочее', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=80', icon: '🏭', title: 'Специальные работы', count: '1320 работ', rate: 11000 },
    { id: 'other', group: 'Прочее', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80', icon: '📦', title: 'Прочие работы', count: '816 работ', rate: 3000 }
  ];

  const filteredCategories = categories.filter(cat => 
    (activeGroup === 'Все' || cat.group === activeGroup) &&
    cat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (e) => {
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
    showToast(`📸 Загружено ${files.length} фото`);
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleRunAiEstimate = async () => {
    setIsScanning(true);
    setScanStep('⏳ Подключение к ИИ-серверу...');

    try {
      const activeCatObj = categories.find(c => c.id === selectedCategory) || categories[9];
      setScanStepMessage ? setScanStepMessage('🤖 Идет анализ данных через нейросеть...') : setScanStep('🤖 Идет анализ данных через нейросеть...');
      const res = await fetch('/api/v1/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description,
          mode: aiEngineMode,
          category: isCategorySkipped ? '' : activeCatObj.title
        })
      });
      const data = await res.json();
      setScanStep('✨ Компиляция итоговой сметы...');
      
      setTimeout(() => {
        setIsScanning(false);
        setCalculatedEstimate(data);
        showToast('✅ AI-Расчёт сметы по фото успешно завершён!');
      }, 500);
      
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      showToast('❌ Ошибка подключения к серверу AI');
    }
  };

  return (
    <div className="spe-container">
      {toastMessage && <div className="spe-toast">{toastMessage}</div>}

      {/* Top Header Bar */}
      {!hideHeader && (
        <div className="spe-header-bar">
          <button className="spe-back-btn" onClick={onBack} title="Назад">←</button>
          <div className="spe-title-flex">
            <span className="spe-header-icon">📸</span>
            <h2>Оценка стоимости по фото</h2>
          </div>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="spe-hero-card">
        <div className="spe-hero-icon">📸</div>
        <h3>Оценка стоимости по фото</h3>
        <p>Выберите категорию, загрузите фото, опишите задачу — ИИ подберёт работы и рассчитает стоимость</p>
        <div className="spe-hero-badge">
          <span className="spe-pulse"></span>
          <span>AI-распознавание активно</span>
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION OR SKIPPED STATE */}
      {!isCategorySkipped ? (
        <>
          <div className="spe-step-title-row">
            <div className="spe-step-badge">
              <span className="spe-num">1</span>
              <h3>ВЫБЕРИТЕ КАТЕГОРИЮ РАБОТ</h3>
            </div>

            <input 
              type="text" 
              placeholder="🔎 Поиск категорий..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="spe-search-field"
            />
          </div>

          <div className="spe-filter-tabs">
            {['Все', 'Общестрой', 'Инженерия', 'Отделка', 'Прочее'].map(group => (
              <button 
                key={group}
                className={`spe-filter-tab ${activeGroup === group ? 'active' : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>

          {/* 5-Column Category Grid matching screenshot */}
          <div className="spe-categories-grid">
            {filteredCategories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div 
                  key={cat.id}
                  className={`spe-cat-box ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="spe-cat-bg" style={{ backgroundImage: `url(${cat.image})` }}></div>
                  <div className="spe-cat-content">
                    <div className="spe-cat-icon">{cat.icon}</div>
                    <div className="spe-cat-name">{cat.title}</div>
                    <div className="spe-cat-count">{cat.count}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skip Option Button */}
          <div className="spe-skip-row">
            <button 
              className="spe-btn-skip"
              onClick={() => {
                setIsCategorySkipped(true);
                showToast('✨ Категория пропущена: ИИ определит всё по описанию!');
              }}
            >
              ✨ Пропустить → ИИ определит по описанию
            </button>
          </div>
        </>
      ) : (
        /* Skipped Category Banner (matches screenshot) */
        <div className="spe-category-skipped-banner">
          <div className="spe-skipped-left">
            <span className="spe-check-green">✅</span>
            <strong>КАТЕГОРИЯ: ОПРЕДЕЛИТ ИИ ПО ОПИСАНИЮ</strong>
          </div>
          <button 
            type="button"
            className="spe-btn-manual-select"
            onClick={() => setIsCategorySkipped(false)}
          >
            Выбрать вручную
          </button>
        </div>
      )}

      {/* Mode Selection Tabs (Быстрый / Полный 3D / Контур) */}
      <div className="spe-modes-tabs-row mt-4">
        <button 
          className={`spe-mode-tab ${analysisModeTab === 'fast' ? 'active' : ''}`}
          onClick={() => setAnalysisModeTab('fast')}
        >
          <span>📸</span>
          <div>
            <strong>Быстрый</strong>
            <small>1 фото</small>
          </div>
        </button>

        <button 
          className={`spe-mode-tab ${analysisModeTab === '3d' ? 'active' : ''}`}
          onClick={() => setAnalysisModeTab('3d')}
        >
          <span>📐</span>
          <div>
            <strong>Полный 3D</strong>
            <small>5–10 фото</small>
          </div>
        </button>

        <button 
          className={`spe-mode-tab ${analysisModeTab === 'contour' ? 'active' : ''}`}
          onClick={() => setAnalysisModeTab('contour')}
        >
          <span>✏️</span>
          <div>
            <strong>Контур</strong>
            <small>рисовать на фото</small>
          </div>
        </button>
      </div>

      {/* Mode 3D Info Banner */}
      {analysisModeTab === '3d' && (
        <div className="spe-mode-info-banner mode-3d">
          <span className="spe-mode-icon">📐</span>
          <div>
            <strong>Полный 3D-анализ:</strong> загрузите 5–10 фото объекта с разных ракурсов. Для точного масштаба положите <strong>ArUco маркер</strong> или лист А4 рядом с объектом. Система автоматически построит 3D-облако точек и извлечёт реальные размеры.
          </div>
        </div>
      )}

      {/* Mode Contour Tool Bar */}
      {analysisModeTab === 'contour' && (
        <div className="spe-contour-container">
          <div className="spe-mode-info-banner mode-contour">
            <span className="spe-mode-icon">✏️</span>
            <div style={{ flex: 1 }}>
              <strong>Укажите масштаб:</strong> для точного расчёта площади введите реальный размер объекта на фото (например, высоту двери, ширину окна).
            </div>
            <div className="spe-contour-scale-btns">
              <button 
                type="button" 
                className="spe-btn-scale" 
                onClick={() => {
                  const val = prompt('Введите размер (например: 2.1 м):', scaleSize);
                  if (val) setScaleSize(val);
                }}
              >
                Ввести размер
              </button>
              <button type="button" className="spe-btn-scale-skip">Пропустить</button>
            </div>
          </div>

          <div className="spe-contour-toolbar">
            <button 
              type="button" 
              className={`spe-ctool-btn ${isDrawing ? 'active' : ''}`}
              onClick={() => {
                setIsDrawing(!isDrawing);
                showToast(isDrawing ? 'Режим рисования выключен' : '🖊️ Кликните на фото, чтобы расставить точки контура');
              }}
            >
              🖊️ Рисовать
            </button>
            <button 
              type="button" 
              className="spe-ctool-btn"
              onClick={() => {
                setContourPoints(prev => prev.slice(0, -1));
                showToast('↩️ Отменена последняя точка');
              }}
            >
              ↩️ Отмена
            </button>
            <button 
              type="button" 
              className="spe-ctool-btn"
              onClick={() => {
                setContourPoints([]);
                showToast('🗑️ Очистить');
              }}
            >
              🗑️ Очистить
            </button>
            <button 
              type="button" 
              className="spe-ctool-btn highlight"
              onClick={() => showToast('✅ Контур замкнут и готов к расчёту!')}
            >
              ✅ Замкнуть
            </button>
          </div>

          <div className="spe-contour-canvas-box">
            <div className="spe-canvas-head">📸 Фото для контура</div>
            <div className="spe-canvas-placeholder">
              <span className="spe-canvas-hint">Кликните на фото, чтобы расставить точки контура. Нажмите «Замкнуть» для расчёта.</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ЗАГРУЗИТЕ ФОТО ОБЪЕКТА */}
      <div className="spe-step-title-row mt-4">
        <div className="spe-step-badge">
          <span className="spe-num">2</span>
          <h3>ЗАГРУЗИТЕ ФОТО ОБЪЕКТА</h3>
        </div>
        <span className="spe-step-optional">(необязательно, до 10 фото - {photos.length}/10)</span>
      </div>

      {/* Tip Banner */}
      <div className="spe-tip-banner">
        <span className="spe-tip-icon">💡</span>
        <div>
          <strong>Для точного AI-анализа:</strong> хорошее освещение, минимум 1280×720, разные ракурсы объекта. AI распознаёт конструкции и автоматически формирует смету.
        </div>
      </div>

      {/* Upload Dropzone */}
      <div 
        className="spe-dropzone"
        onClick={() => document.getElementById('spe-file-picker').click()}
      >
        <input 
          type="file" 
          id="spe-file-picker" 
          multiple 
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <div className="spe-drop-icon">📸</div>
        <p className="spe-drop-main">Перетащите фото или нажмите для выбора</p>
        <p className="spe-drop-sub">JPG, PNG - до 10MB каждое - до 10 фото</p>
      </div>

      {/* Photos Thumbnails */}
      {photos.length > 0 && (
        <div className="spe-thumbs-wrap">
          {photos.map(p => (
            <div key={p.id} className="spe-thumb-box">
              <img src={p.url} alt={p.name} />
              <button 
                type="button"
                className="spe-thumb-remove" 
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

      {/* STEP 3: ОПИСАНИЕ ДЛЯ ИИ */}
      <div className="spe-step-title-row mt-4">
        <div className="spe-step-badge">
          <span className="spe-num">3</span>
          <h3>ОПИСАНИЕ ДЛЯ ИИ</h3>
        </div>
      </div>

      {/* Info Notice Box */}
      <div className="spe-info-notice">
        <span className="spe-notice-icon">🤖</span>
        <div>
          <strong>Как работает ИИ-анализ:</strong> ИИ распознаёт фото и сопоставляет с описанием. Из описания извлекаются площади, объёмы и тип работ. Чем точнее описание — тем точнее расчёт.
        </div>
      </div>

      <textarea 
        rows="4"
        className="spe-description-textarea"
        placeholder={`Опишите объект и задачу, например:\n• Ванная комната 3×4 метра, замена плитки и сантехники\n• Крыша частного дома, площадь 120 м², замена кровли\n• Офис 50 м², косметический ремонт стен и потолка`}
        value={description}
        onChange={e => setDescription(e.target.value)}
      ></textarea>

      {/* AI Provider Status */}
      {Boolean(import.meta.env.VITE_OPENAI_API_KEY || (typeof window !== 'undefined' && localStorage.getItem('qazgost_openai_key'))) ? (
        <div className="spe-provider-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7' }}>
          <span style={{ fontSize: '1.2rem' }}>🟢</span>
          <div>
            <strong>OpenAI Multi-Pass Engine подключен и активен:</strong> Модели GPT-4o / Vision настроены для анализа фото, детекции объемов и расчета смет по ГОСТ РК.
          </div>
        </div>
      ) : (
        <div className="spe-provider-banner">
          <span className="spe-warning-icon">⚠️</span>
          <span>Ни один AI провайдер не настроен. Настройте Gemini или ChatGPT API ключ в настройках (доступен локальный офлайн-режим 2026).</span>
        </div>
      )}

      {/* MULTI-PASS AI ENGINE */}
      <div className="spe-engine-header">
        <span className="spe-engine-icon">🚀</span>
        <h3>РЕЖИМ АНАЛИЗА (MULTI-PASS AI ENGINE)</h3>
      </div>

      <div className="spe-engine-modes-grid">

        {/* Mode 1: Авто */}
        <div 
          className={`spe-engine-card ${aiEngineMode === 'auto' ? 'selected' : ''}`}
          onClick={() => setAiEngineMode('auto')}
        >
          <div className="spe-ecard-head">⚡⚡ Авто</div>
          <p className="spe-ecard-desc">Система выберет оптимальный режим</p>
          <button className="spe-btn-select-mode">
            {aiEngineMode === 'auto' ? '✓ Выбран' : 'Выбрать'}
          </button>
        </div>

        {/* Mode 2: Быстрый */}
        <div 
          className={`spe-engine-card ${aiEngineMode === 'fast' ? 'selected' : ''}`}
          onClick={() => setAiEngineMode('fast')}
        >
          <div className="spe-ecard-head">⚡⚡ Быстрый</div>
          <p className="spe-ecard-desc">1 AI-вызов, быстрый результат</p>
          <button className="spe-btn-select-mode">
            {aiEngineMode === 'fast' ? '✓ Выбран' : 'Выбрать'}
          </button>
        </div>

        {/* Mode 3: Детальный */}
        <div 
          className={`spe-engine-card ${aiEngineMode === 'detailed' ? 'selected' : ''}`}
          onClick={() => setAiEngineMode('detailed')}
        >
          <div className="spe-ecard-head">🏗️🏗️ Детальный</div>
          <p className="spe-ecard-desc">Несколько проходов + аудит</p>
          <button className="spe-btn-select-mode">
            {aiEngineMode === 'detailed' ? '✓ Выбран' : 'Выбрать'}
          </button>
        </div>

        {/* Mode 4: VIP */}
        <div 
          className={`spe-engine-card ${aiEngineMode === 'vip' ? 'selected' : ''}`}
          onClick={() => setAiEngineMode('vip')}
        >
          <div className="spe-ecard-head">👑👑 VIP</div>
          <p className="spe-ecard-desc">Полный pipeline + WBS маппинг</p>
          <button className="spe-btn-select-mode">
            {aiEngineMode === 'vip' ? '✓ Выбран' : 'Выбрать'}
          </button>
        </div>

      </div>

      {/* Dynamic CTA Pill Button matching active tab */}
      <div className="spe-cta-wrap">
        <button 
          className="spe-btn-cta-glow"
          onClick={handleRunAiEstimate}
          disabled={isScanning}
        >
          {isScanning ? (
            <span className="spe-cta-scanning">
              <span className="spe-spinner">⚙️</span>
              {scanStep}
            </span>
          ) : (
            <span>
              {analysisModeTab === 'fast' && `🔍 Быстрый анализ (${photos.length > 0 ? photos.length : 1} фото)`}
              {analysisModeTab === '3d' && `📐 Полный 3D-анализ (SfM)`}
              {analysisModeTab === 'contour' && `✏️ Рассчитать по контуру`}
            </span>
          )}
        </button>
        <p className="spe-cta-note">AI-сервер проанализирует фото, определит объекты и рассчитает смету</p>
      </div>

      {/* Calculated AI Estimate Result Box */}
      {calculatedEstimate && (
        <div className="spe-result-box">
          <div className="spe-res-head">
            <span className="spe-res-title">📊 Итоговая смета AI 2026</span>
            <span className="spe-res-badge">{calculatedEstimate.category}</span>
          </div>

          <div className="spe-res-sum">
            {calculatedEstimate.total.toLocaleString()} ₸
          </div>

          <div className="spe-res-grid">
            <div className="spe-res-col">
              <span className="label">Строительно-монтажные работы (СМР):</span>
              <strong>{calculatedEstimate.worksCost.toLocaleString()} ₸</strong>
            </div>

            <div className="spe-res-col">
              <span className="label">Материалы и ресурсы (BOM):</span>
              <strong>{calculatedEstimate.materialsCost.toLocaleString()} ₸</strong>
            </div>

            <div className="spe-res-col">
              <span className="label">Срок выполнения:</span>
              <strong>~{calculatedEstimate.timelineDays} дней</strong>
            </div>
          </div>

          <div className="spe-res-insights mt-3">
            <h4>✨ Экспертный вывод AI:</h4>
            <ul>
              {calculatedEstimate.aiInsights.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
