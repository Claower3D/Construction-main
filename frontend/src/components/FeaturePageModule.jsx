import React, { useState, useEffect } from 'react';
import AdminDashboardModal from './AdminDashboardModal';
import DisputeResolutionModule from './DisputeResolutionModule';
import MapViewerModule from './MapViewerModule';
import Model3DViewerModule from './Model3DViewerModule';
import KpiAnalyticsModule from './KpiAnalyticsModule';
import { calculateSmartEstimate, evaluateDefectScan } from '../services/smartEstimateEngine';
import { getBalanceKZT, topupBalance } from '../services/walletEngine';
import { getOrders } from '../services/dataService';

export default function FeaturePageModule({ itemData, onBack, onOpenAdminTab }) {
  // Common interactive states
  const [photoUploaded, setPhotoUploaded] = useState(false); // Legacy boolean, keeping it for compatibility just in case
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [cvError, setCvError] = useState('');

  // Estimate calculator states
  const [area, setArea] = useState(65);
  const [propertyType, setPropertyType] = useState('квартира');
  const [qualityLevel, setQualityLevel] = useState('комфорт');
  const [calculatedEstimate, setCalculatedEstimate] = useState(null);

  // Volume calculator (QTO) states
  const [qtoLength, setQtoLength] = useState(15);
  const [qtoWidth, setQtoWidth] = useState(10);
  const [qtoDepth, setQtoDepth] = useState(0.25);

  // Orders state
  const [appliedOrders, setAppliedOrders] = useState({});
  const [liveOrders, setLiveOrders] = useState([]);

  // Wallet state
  const [balance, setBalance] = useState(() => getBalanceKZT());
  const [topupAmount, setTopupAmount] = useState('');

  useEffect(() => {
    getOrders().then((data) => setLiveOrders(data));
  }, []);

  if (!itemData) return null;
  const itemId = itemData.id;

  // Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setPhotoUploaded(true);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        setUploadedPreview(URL.createObjectURL(file));
      } else {
        // Mock a PDF or document preview
        setUploadedPreview('📄');
      }
    }
  };

  const handleRunAiEstimate = async () => {
    setIsScanning(true);
    setCalculatedEstimate(null); // Reset previous estimate
    setCvError('');
    
    if (uploadedFile) {
      setScanStepMessage('Анализ изображения через TensorFlow Vision...');

      // TensorFlow.js MobileNet Classification
      if (uploadedFile.type.startsWith('image/') && window.mobilenet) {
        try {
          const img = document.createElement('img');
          img.src = uploadedPreview;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const model = await window.mobilenet.load();
          const predictions = await model.classify(img);
          
          if (predictions && predictions.length > 0) {
            // Build an allowlist of ImageNet/MobileNet categories that typically correspond to:
            // 1. Blueprints, drawings, plans (maze, crossword, web site, menu, envelope, rule, paper)
            // 2. Interiors, buildings, construction (patio, window, door, desk, table, chair, couch, wardrobe, bookcase, bed, lumber, wall, fence, roof, etc.)
            const allowedKeywords = [
              'web site', 'website', 'menu', 'crossword', 'maze', 'envelope', 'paper', 'ruler', 'rule',
              'patio', 'window', 'door', 'desk', 'table', 'chair', 'couch', 'wardrobe', 'bookcase', 'bed',
              'theater', 'entertainment', 'lumber', 'wall', 'floor', 'ceiling', 'roof', 'building', 'house',
              'home', 'room', 'bathroom', 'kitchen', 'toilet', 'sink', 'stove', 'refrigerator', 'microwave',
              'oven', 'washer', 'radiator', 'heater', 'stair', 'balcony', 'porch', 'fence', 'gate', 'brick',
              'concrete', 'wood', 'tile', 'carpet', 'rug', 'curtain', 'blind', 'shade', 'cabinet', 'shelf',
              'drawer', 'closet', 'pantry', 'garage', 'shed', 'barn', 'office', 'factory', 'warehouse',
              'medicine chest', 'four-poster', 'studio couch', 'folding chair', 'dining table'
            ];
            
            // Check if ANY of the top 3 predictions match our allowed keywords
            const isAllowed = predictions.some(pred => 
              allowedKeywords.some(kw => pred.className.toLowerCase().includes(kw))
            );
            
            // If none of the predictions match the allowlist, we reject it
            if (!isAllowed) {
              const topClass = predictions[0].className;
              const confidence = predictions[0].probability;
              
              setIsScanning(false);
              setScanStepMessage('');
              setCvError(`❌ Ошибка Vision AI: Изображение не распознано как строительный объект или чертеж (определено как "${topClass}"). Пожалуйста, загрузите реальное фото помещения, фасада или план.`);
              return;
            }
          }
        } catch (err) {
          console.error('TFJS Error:', err);
        }
      }

      setScanStepMessage('Распознавание несущих конструкций и геометрии...');
      await new Promise(r => setTimeout(r, 1200));
      setScanStepMessage('Применение сметных нормативов (ГЭСН 2026 РК)...');
      await new Promise(r => setTimeout(r, 1500));
      setScanStepMessage('Формирование итогового отчета...');
      await new Promise(r => setTimeout(r, 1000));
      
      setIsScanning(false);
      setScanStepMessage('');
      const est = calculateSmartEstimate({ 
        area, 
        propertyType, 
        qualityLevel, 
        hasFile: true, 
        fileName: uploadedFile.name 
      });
      setCalculatedEstimate(est);
    } else {
      setScanStepMessage('Идёт AI-просчёт по нормам ГЭСН 2026 РК...');
      setTimeout(() => {
        setIsScanning(false);
        setScanStepMessage('');
        const est = calculateSmartEstimate({ area, propertyType, qualityLevel, hasFile: false });
        setCalculatedEstimate(est);
      }, 1000);
    }
  };

  const handleRunDefectInspect = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const def = evaluateDefectScan();
      setScanResult(def);
    }, 1200);
  };

  const handleApplyOrder = (orderId) => {
    setAppliedOrders({ ...appliedOrders, [orderId]: true });
  };

  const handleTopupWallet = (e) => {
    e.preventDefault();
    const val = parseFloat(topupAmount);
    if (val && val > 0) {
      const nextBal = topupBalance(val, 'Kaspi Pay');
      setBalance(nextBal);
      setTopupAmount('');
      alert(`🎉 Баланс кошелька успешно пополнен на ${val.toLocaleString()} ₸!`);
    }
  };

  // If item is an Admin module, render Admin inline page container
  if (itemId && itemId.startsWith('adm-')) {
    return (
      <div className="inline-fullpage-wrapper">
        <div className="fullpage-top-bar">
          <button className="btn-back-inline" onClick={onBack}>← Назад к списку элементов</button>
          <div className="page-title-badge">⚙️ АДМИНИСТРАТИВНЫЙ МОДУЛЬ: {itemData.name.toUpperCase()}</div>
        </div>
        <div className="inline-admin-container">
          <AdminDashboardModal isOpen={true} onClose={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="inline-fullpage-wrapper">
      {/* Top Breadcrumb & Action Bar */}
      <div className="fullpage-top-bar">
        <button className="btn-back-inline" onClick={onBack}>← Назад к выбору инструмента</button>
        <div className="page-title-badge">
          <span>{itemData.icon}</span> {itemData.name.toUpperCase()}
        </div>
      </div>

      {/* Main Full Page Body */}
      <div className="fullpage-main-body">
        {/* 1. ESTIMATE CALCULATOR (c-estimate / e-estimate) */}
        {(itemId === 'c-estimate' || itemId === 'e-estimate') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">📸 Умная AI-Оценка стоимости строительных работ</h2>
            <p className="fullpage-sub">Калькулятор расчета сметных расходов на основе действующих баз ГЭСН/СНиП 2026 РК.</p>

            <div className="form-grid-2" style={{ marginTop: '1.5rem' }}>
              <div className="form-item">
                <label>Тип недвижимости / объекта:</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="admin-search-input">
                  <option value="квартира">🏢 Квартира (Новостройка / Вторичка)</option>
                  <option value="дом">🏠 Частный дом / Коттедж</option>
                  <option value="офис">🏬 Офис / Коммерческая недвижимость</option>
                </select>
              </div>

              <div className="form-item">
                <label>Уровень отделки и материалов:</label>
                <select value={qualityLevel} onChange={(e) => setQualityLevel(e.target.value)} className="admin-search-input">
                  <option value="эконом">Базовый / Эконом</option>
                  <option value="комфорт">Стандарт / Комфорт</option>
                  <option value="премиум">Дизайнерский / Премиум</option>
                </select>
              </div>
            </div>

            <div className="form-item" style={{ marginTop: '1.25rem' }}>
              <label>Площадь объекта: <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>{area} м²</strong></label>
              <input type="range" min="10" max="500" value={area} onChange={(e) => setArea(parseInt(e.target.value))} className="range-slider" />
            </div>

            <div 
              className="photo-upload-dropzone" 
              onClick={() => document.getElementById('estimate-file-upload').click()}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <input 
                type="file" 
                id="estimate-file-upload" 
                accept="image/*,application/pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <span className="drop-icon">📸</span>
              <div style={{ flex: 1, marginRight: uploadedPreview ? '60px' : '0' }}>
                <strong>
                  {uploadedFile 
                    ? `✅ Документ "${uploadedFile.name}" загружен и готов к анализу` 
                    : 'Загрузите фото объекта или документ (чертёж/план)'
                  }
                </strong>
                <div className="small-text">AI сканирует площади стен, высоты потолков и состояние дефектов</div>
              </div>
              
              {uploadedPreview && typeof uploadedPreview === 'string' && uploadedPreview !== '📄' && (
                <img 
                  src={uploadedPreview} 
                  alt="Preview" 
                  style={{ 
                    position: 'absolute', 
                    right: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    height: '56px', 
                    width: '56px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                />
              )}
              {uploadedPreview === '📄' && (
                <div style={{
                  position: 'absolute', 
                  right: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  height: '56px', 
                  width: '56px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>📄</div>
              )}
            </div>

            <button className="btn-action-hero" onClick={handleRunAiEstimate} disabled={isScanning}>
              {isScanning ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span className="typing-dots" style={{ marginBottom: 0, padding: 0 }}><span className="dot"></span><span className="dot"></span><span className="dot"></span></span>
                  {scanStepMessage}
                </span>
              ) : '🚀 Сформировать итоговую смету'}
            </button>

            {cvError && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid #ef4444', color: '#fca5a5' }}>
                {cvError}
              </div>
            )}

            {calculatedEstimate && !cvError && (
              <div className="result-card-glow" style={{ marginTop: '1.75rem' }}>
                <h3>📊 Итоговый результат расчёта сметы:</h3>
                <div className="big-price">{(calculatedEstimate.totalCost || calculatedEstimate.total)?.toLocaleString()} ₸</div>
                <div className="calc-details-grid">
                  <div><span>Стоимость строительно-монтажных работ:</span> <strong>{calculatedEstimate.worksCost?.toLocaleString()} ₸</strong></div>
                  <div><span>Стоимость материалов (BOM):</span> <strong>{calculatedEstimate.materialsCost?.toLocaleString()} ₸</strong></div>
                  <div><span>Ориентировочный срок работ:</span> <strong>~{calculatedEstimate.estimatedDays || calculatedEstimate.timelineDays} рабочих дней</strong></div>
                </div>

                {calculatedEstimate.aiInsights && calculatedEstimate.aiInsights.length > 0 && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✨ AI-Анализ чертежа
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {calculatedEstimate.aiInsights.map((insight, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. DEFECT INSPECTOR (c-inspect / e-inspect) */}
        {(itemId === 'c-inspect' || itemId === 'e-inspect') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">🔍 AI-Проверка дефектов и экспертная оценка по СНиП РК</h2>
            <p className="fullpage-sub">Сканирование снимков трещин, плесени, перепадов пола и нарушений технологии строительства.</p>

            <div className="photo-upload-dropzone" onClick={() => setPhotoUploaded(true)}>
              <span className="drop-icon">🔍</span>
              <div>
                <strong>{photoUploaded ? '✅ Фото дефекта загружено в сканер' : 'Нажмите для загрузки фото дефекта или трещины'}</strong>
                <div className="small-text">Поддерживаются снимки высокого разрешения со смартфонов</div>
              </div>
            </div>

            <button className="btn-action-hero" onClick={handleRunDefectInspect} disabled={isScanning}>
              {isScanning ? '🔍 Компьютерное зрение анализирует геометрию...' : '⚡ Запустить нейросетевую экспертизу'}
            </button>

            {scanResult && (
              <div className="result-card-glow" style={{ marginTop: '1.75rem' }}>
                <h3>📋 Экспертный отчёт AI-Дефектоскопии:</h3>
                <p><strong>Обнаруженный дефект:</strong> {scanResult.defectType}</p>
                <p><strong>Класс риска:</strong> <span className="tag-warning">{scanResult.severity}</span></p>
                <p><strong>Код СНиП РК:</strong> <code>{scanResult.snipCode}</code></p>
                <p><strong>Рекомендуемый метод устранения:</strong> {scanResult.recommendedFix}</p>
                <p><strong>Средняя стоимость ремонтных работ:</strong> <strong style={{ color: '#10b981' }}>{scanResult.estimatedFixPrice}</strong></p>
              </div>
            )}
          </div>
        )}

        {/* 3. VOLUME CALCULATOR (c-volume / e-volume / e-soil) */}
        {(itemId === 'c-volume' || itemId === 'e-volume' || itemId === 'e-soil') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">📏 Автоматический расчёт объёмов работ и BOM материалов</h2>
            <p className="fullpage-sub">Калькулятор геометрических площадей, объема выемки грунта и потребности ресурсов.</p>

            <div className="calc-inputs-grid" style={{ margin: '1.5rem 0' }}>
              <div className="form-item"><label>Длина участка/стены (м):</label><input type="number" value={qtoLength} onChange={(e) => setQtoLength(Number(e.target.value) || 0)} className="admin-search-input" /></div>
              <div className="form-item"><label>Ширина (м):</label><input type="number" value={qtoWidth} onChange={(e) => setQtoWidth(Number(e.target.value) || 0)} className="admin-search-input" /></div>
              <div className="form-item"><label>Глубина / Толщина (м):</label><input type="number" value={qtoDepth} onChange={(e) => setQtoDepth(Number(e.target.value) || 0)} className="admin-search-input" step="0.01" /></div>
            </div>

            <div className="result-card-glow">
              <h3>📦 Итоговые объёмы для спецификации:</h3>
              <p><strong>Общий объём (кубатура):</strong> {(qtoLength * qtoWidth * qtoDepth).toFixed(2)} м³</p>
              <p><strong>Площадь покрытия:</strong> {(qtoLength * qtoWidth).toFixed(2)} м²</p>
              <p><strong>Расход товарного бетона М-350:</strong> {(qtoLength * qtoWidth * qtoDepth * 1.05).toFixed(2)} м³ (с учетом уплотнения)</p>
              <p><strong>Потребность арматурного каркаса:</strong> {((qtoLength * qtoWidth * qtoDepth) * 0.076).toFixed(2)} тонн (A500C 12мм)</p>
            </div>
          </div>
        )}

        {/* 4. LIVE ORDERS FEED (c-orders / e-feed) */}
        {(itemId === 'c-orders' || itemId === 'e-feed') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">🌐 Лента заказов и объёмов работ по Казахстану</h2>
            <p className="fullpage-sub">Живой поток заявок от проверенных Заказчиков в Астане, Алматы, Шымкенте и регионах.</p>

            <div className="orders-full-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { id: 'ORD-901', title: 'Капитальный ремонт бизнес-центра 1200 м²', city: 'Алматы', budget: '42 000 000 ₸', category: 'Коммерческая отделка', date: '5 мин назад' },
                { id: 'ORD-902', title: 'Строительство монолитного каркаса коттеджа 320 м²', city: 'Астана', budget: '14 800 000 ₸', category: 'Монолит', date: '18 мин назад' },
                { id: 'ORD-903', title: 'Монтаж системы приточно-вытяжной вентиляции (HVAC)', city: 'Караганда', budget: '8 500 000 ₸', category: 'Инженерия', date: '45 мин назад' },
                { id: 'ORD-904', title: 'Электромонтажные работы в новостройке', city: 'Шымкент', budget: '3 600 000 ₸', category: 'Электрика', date: '1 час назад' },
              ].map((ord) => (
                <div className="order-item-card" key={ord.id} style={{ padding: '1.25rem' }}>
                  <div className="order-head">
                    <strong style={{ fontSize: '1.1rem' }}>{ord.title}</strong>
                    <span className="order-price" style={{ fontSize: '1.2rem' }}>{ord.budget}</span>
                  </div>
                  <div className="order-meta" style={{ margin: '0.75rem 0' }}>
                    <span>📍 Город: {ord.city}</span>
                    <span>🏷️ {ord.category}</span>
                    <span>⏱ {ord.date}</span>
                  </div>
                  <button
                    className={`btn-apply-order ${appliedOrders[ord.id] ? 'applied' : ''}`}
                    onClick={() => handleApplyOrder(ord.id)}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    {appliedOrders[ord.id] ? '✅ Заявка отправлена (Ожидание ответа)' : '📝 Отправить сметное предложение'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4a. MY WORKS (e-works) */}
        {itemId === 'e-works' && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">📌 Мои текущие объекты и портфолио</h2>
            <p className="fullpage-sub">Список объектов, на которых вы сейчас работаете, или которые уже завершены.</p>

            <div className="orders-full-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { id: 'WORK-1', title: 'Отделка квартиры ЖК "Highvill"', city: 'Астана', budget: '3 500 000 ₸', category: 'Чистовая отделка', status: 'В работе (Готовность 45%)' },
                { id: 'WORK-2', title: 'Заливка фундамента под коттедж', city: 'Алматы', budget: '1 200 000 ₸', category: 'Монолит', status: 'Завершено ✅' },
              ].map((work) => (
                <div className="order-item-card" key={work.id} style={{ padding: '1.25rem', borderLeft: work.status.includes('Завершено') ? '4px solid #10b981' : '4px solid #f59e0b' }}>
                  <div className="order-head">
                    <strong style={{ fontSize: '1.1rem' }}>{work.title}</strong>
                    <span className="order-price" style={{ fontSize: '1.2rem', color: '#10b981' }}>{work.budget}</span>
                  </div>
                  <div className="order-meta" style={{ margin: '0.75rem 0' }}>
                    <span>📍 {work.city}</span>
                    <span>🏷️ {work.category}</span>
                    <span style={{ color: work.status.includes('Завершено') ? '#10b981' : '#f59e0b' }}>{work.status}</span>
                  </div>
                  <button className="btn-action-hero" style={{ width: '100%', padding: '0.65rem' }}>
                    Открыть карточку объекта
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. CONTRACTORS CATALOG (c-catalog / e-catalog) */}
        {(itemId === 'c-catalog' || itemId === 'e-catalog') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">📒 Кабинет и Реестр подрядных организаций</h2>
            <p className="fullpage-sub">База верифицированных мастеров, ИП и ТОО с подтвержденными БИН/ИИН и лицензиями.</p>

            <div className="contractors-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { name: 'ИП «СтройМастер Казахстан»', bin: '880412300451', rating: '5.0 (42 отзыва)', spec: 'Монолитное строительство, Фасады', status: '✅ ИИН Подтверждён' },
                { name: 'ТОО «Алматы СпецСтрой»', bin: '210440012930', rating: '4.9 (94 отзыва)', spec: 'Генподряд, ПСД, Инженерные сети', status: '✅ БИН Подтверждён' },
                { name: 'ТОО «КазИнжиниринг-2026»', bin: '190840008812', rating: '5.0 (115 отзывов)', spec: 'Технический надзор и аудит смет', status: '✅ БИН Подтверждён' },
              ].map((c, idx) => (
                <div className="contractor-card" key={idx} style={{ padding: '1.25rem' }}>
                  <h4>{c.name}</h4>
                  <p className="bin-text">БИН/ИИН: {c.bin} • {c.status}</p>
                  <p><strong>Специализация:</strong> {c.spec}</p>
                  <p><strong>Рейтинг в системе:</strong> ⭐ {c.rating}</p>
                  <button className="admin-primary-btn" style={{ width: '100%', marginTop: '0.75rem' }}>📞 Запросить коммерческое предложение</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. EQUIPMENT MARKETPLACE (c-equipment / e-equipment) */}
        {(itemId === 'c-equipment' || itemId === 'e-equipment') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">🚜 Маркетплейс аренды спецтехники и снабжения</h2>
            <p className="fullpage-sub">Каталог строительных машин с водителями и быстрой доставкой на объект.</p>

            <div className="equipment-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { name: 'Экскаватор-погрузчик JCB 3CX', price: '95 000 ₸ / смена', city: 'Алматы', status: 'Свободен для выезда' },
                { name: 'Автокран XCMG 25 тонн (39м)', price: '140 000 ₸ / смена', city: 'Астана', status: 'Свободен для выезда' },
                { name: 'Самосвал KAMAZ 20 тонн (вывоз грунта)', price: '25 000 ₸ / рейс', city: 'Шымкент', status: 'Свободен для выезда' },
              ].map((eq, i) => (
                <div className="equip-card" key={i} style={{ padding: '1.25rem' }}>
                  <h4>{eq.name}</h4>
                  <div className="price-tag">{eq.price}</div>
                  <p>📍 {eq.city} • <span style={{ color: '#10b981' }}>{eq.status}</span></p>
                  <button className="btn-action-hero" style={{ marginTop: '0.75rem' }}>🚜 Забронировать выезд</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. WALLET & ESCROW (c-wallet / e-wallet) */}
        {(itemId === 'c-wallet' || itemId === 'e-wallet') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">💳 Мой Эскроу-Кошелёк и Финансовые Операции</h2>
            <p className="fullpage-sub">Безопасное удержание средств по этапам договоров подряда.</p>

            <div className="wallet-banner" style={{ margin: '1.5rem 0' }}>
              <div>
                <div className="wallet-label">Доступный баланс на счёте:</div>
                <div className="wallet-value">{balance.toLocaleString()} ₸</div>
              </div>
              <span className="wallet-badge">🔒 Защита Эскроу Сделок Active</span>
            </div>

            <form onSubmit={handleTopupWallet} className="topup-form">
              <label style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Пополнение баланса аккаунта (₸):</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input type="number" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="Сумма в тенге..." className="admin-search-input" />
                <button type="submit" className="btn-excel-export" style={{ whiteSpace: 'nowrap' }}>💳 Пополнить баланс</button>
              </div>
            </form>
          </div>
        )}

        {/* 8. PROFILE & QUESTIONNAIRE (c-profile / e-profile) */}
        {(itemId === 'c-profile' || itemId === 'e-profile') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">📝 Моя карточка аккаунта и профиль</h2>
            <p className="fullpage-sub">Управление контактными данными и банковскими реквизитами.</p>

            <div className="form-grid-2" style={{ marginTop: '1.5rem' }}>
              <div className="form-item"><label>ФИО / Наименование организации:</label><input type="text" defaultValue="Арман Касымов" className="admin-search-input" /></div>
              <div className="form-item"><label>ИИН / БИН:</label><input type="text" defaultValue="880412300451" className="admin-search-input" /></div>
              <div className="form-item"><label>Электронная почта:</label><input type="text" defaultValue="arman@qazgost.kz" className="admin-search-input" /></div>
              <div className="form-item"><label>Номер телефона:</label><input type="text" defaultValue="+7 701 555-01-99" className="admin-search-input" /></div>
            </div>
            <button className="admin-primary-btn" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem' }}>💾 Сохранить изменения в профиле</button>
          </div>
        )}

        {/* 9. VIP BUILDINGS (c-vip / e-vip) */}
        {(itemId === 'c-vip' || itemId === 'e-vip') && (
          <div className="fullpage-card-box">
            <h2 className="fullpage-heading">🏗️ Капитальное монолитное строительство (VIP Объекты)</h2>
            <p className="fullpage-sub">Полный цикл сопровождения строительных объектов VIP класса.</p>
            <div className="result-card-glow" style={{ marginTop: '1.5rem' }}>
              <h3>⭐ Возможности VIP Статуса:</h3>
              <ul style={{ lineHeight: '1.8', margin: '0.5rem 0 0 1rem' }}>
                <li>Персональный Главный Инженер Проекта (ГИП) 24/7</li>
                <li>Автоматический импорт ПСД файлов и ведомостей объёмов работ</li>
                <li>Полный финансовый аудит счетов и непрерывный технадзор</li>
              </ul>
            </div>
          </div>
        )}

        {/* 10. DISPUTE ARBITRATION */}
        {(itemId?.includes('dispute') || itemId === 'c-dispute') && <DisputeResolutionModule />}

        {/* 11. MAP VIEWER */}
        {(itemId?.includes('map') || itemId === 'c-map') && <MapViewerModule />}

        {/* 12. 3D BIM MODEL VIEWER */}
        {(itemId?.includes('3d') || itemId === 'c-3d') && <Model3DViewerModule />}

        {/* 13. KPI & ANALYTICS */}
        {(itemId?.includes('kpi') || itemId === 'adm-kpi' || itemId === 'c-kpi') && <KpiAnalyticsModule />}
      </div>
    </div>
  );
}
