import React, { useState, useEffect, lazy, Suspense } from 'react';
import PageLoader from './PageLoader';
import { ensureMobilenet } from '../utils/loadExternalScript';

// Модули грузятся по требованию: открыли «Проверку дефектов» — пришёл только её чанк
const AdminDashboardModal = lazy(() => import('./AdminDashboardModal'));
const DisputeResolutionModule = lazy(() => import('./DisputeResolutionModule'));
const MapViewerModule = lazy(() => import('./MapViewerModule'));
const Model3DViewerModule = lazy(() => import('./Model3DViewerModule'));
const KpiAnalyticsModule = lazy(() => import('./KpiAnalyticsModule'));
const EquipmentMarketplace = lazy(() => import('./EquipmentMarketplace'));
const ProfileQuestionnaire = lazy(() => import('./ProfileQuestionnaire'));
const UserWalletPage = lazy(() => import('./UserWalletPage'));
const ContractorsCatalogPage = lazy(() => import('./ContractorsCatalogPage'));
const UserOrdersPage = lazy(() => import('./UserOrdersPage'));
const EngineeringSolutionsPage = lazy(() => import('./EngineeringSolutionsPage'));
const DefectInspectorPage = lazy(() => import('./DefectInspectorPage'));
const SmartPhotoEstimatePage = lazy(() => import('./SmartPhotoEstimatePage'));
const BuildingConstructionPage = lazy(() => import('./BuildingConstructionPage'));
const MaterialsMarketplacePage = lazy(() => import('./MaterialsMarketplacePage'));
const RoleHierarchyTreePage = lazy(() => import('./RoleHierarchyTreePage'));
const AnalystDashboardPage = lazy(() => import('./AnalystDashboardPage'));
const EarthworkVolumesPage = lazy(() => import('./EarthworkVolumesPage'));
const CalendarSchedulePage = lazy(() => import('./CalendarSchedulePage'));
const OrderFeedPage = lazy(() => import('./feed/OrderFeedPage'));
const LiveDefectScanner = lazy(() => import('./scanner/LiveDefectScanner'));
const Plan3DPage = lazy(() => import('./plan3d/Plan3DPage'));
import { calculateSmartEstimate, evaluateDefectScan } from '../services/smartEstimateEngine';
import { localDateKey } from '../services/platformUtils';

export default function FeaturePageModule({ itemData, onBack, onOpenAdminTab, onOpenTool, currentUser }) {
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

  // Customer Orders Flow State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalType, setOrderModalType] = useState('construction'); // 'construction' | 'engineering'
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderDesc, setNewOrderDesc] = useState('');
  const [newOrderFiles, setNewOrderFiles] = useState([]);
  const [customerOrdersConst, setCustomerOrdersConst] = useState([
    { id: 'c-const-1', title: 'Строительство коттеджа 250м²', status: 'Передано менеджеру (В работе)', type: 'construction', date: 'Вчера' }
  ]);
  const [customerOrdersEng, setCustomerOrdersEng] = useState([
    { id: 'c-eng-1', title: 'Проверка проектной документации фундамента', status: 'Отправлено инженеру для проверки заказа', type: 'engineering', date: 'Только что' },
    { id: 'c-eng-2', title: 'Аудит сметы по кровле', status: 'Требует вашего подтверждения (Ответ инженера получен)', type: 'engineering', date: '2 часа назад' },
    { id: 'c-eng-3', title: 'Расчет теплопотерь здания', status: 'Передано менеджеру (Вы подтвердили)', type: 'engineering', date: 'Вчера' }
  ]);

  // Wallet state

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

      // TensorFlow.js MobileNet: скрипты с CDN подгружаются только здесь (раньше — синхронно в <head> на каждой странице)
      const mobilenet = uploadedFile.type.startsWith('image/') ? await ensureMobilenet() : null;
      if (mobilenet) {
        try {
          const img = document.createElement('img');
          img.src = uploadedPreview;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const model = await mobilenet.load();
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
      setScanStepMessage('Применение сметных нормативов (ЭСН РК)...');
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
      setScanStepMessage('Идёт AI-просчёт по нормам ЭСН РК...');
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

  const handleCreateCustomerOrder = (e) => {
    e.preventDefault();
    if (!newOrderTitle.trim()) return;
    
    // Add to local state (Customer View)
    if (orderModalType === 'construction') {
      const newOrder = {
        id: `c-const-${Date.now()}`,
        title: newOrderTitle,
        status: 'На модерации у менеджера (Новая заявка)',
        type: 'construction',
        date: 'Только что'
      };
      setCustomerOrdersConst([newOrder, ...customerOrdersConst]);
    } else {
      const newOrder = {
        id: `c-eng-${Date.now()}`,
        title: newOrderTitle,
        status: 'Отправлено инженеру для проверки заказа',
        type: 'engineering',
        date: 'Только что'
      };
      setCustomerOrdersEng([newOrder, ...customerOrdersEng]);
    }

    // Push to CRM (Manager View)
    try {
      const savedEvents = localStorage.getItem('qazgost_calendar_events');
      let crmEvents = savedEvents ? JSON.parse(savedEvents) : {};
      const today = localDateKey(); // YYYY-MM-DD (локальная дата, не UTC)
      if (!crmEvents[today]) crmEvents[today] = [];
      
      crmEvents[today].push({
        id: `crm-evt-${Date.now()}`,
        title: `Новая заявка от Заказчика: ${newOrderTitle}`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        type: orderModalType === 'construction' ? 'request_construction' : 'request_engineering',
        status: 'Новые',
        desc: newOrderDesc || 'Без описания',
        contractor: 'Не распределено'
      });
      
      localStorage.setItem('qazgost_calendar_events', JSON.stringify(crmEvents));
    } catch (err) {
      console.error('Failed to sync with CRM', err);
    }
    
    setNewOrderTitle('');
    setNewOrderDesc('');
    setNewOrderFiles([]);
    setShowOrderModal(false);
  };


  // Safely derive name and icon to prevent crashes if itemData properties are missing
  const displayName = itemData?.name || itemData?.title || itemData?.label || 'Модуль';

  // If item is an Admin module, render Admin inline page container
  if (itemId && itemId.startsWith('adm-')) {
    return (
      <div className="inline-fullpage-wrapper">
        <div className="fullpage-top-bar">
          <h1 className="page-title-badge">{displayName}</h1>
        </div>
        <div className="inline-admin-container">
          <Suspense fallback={<PageLoader label="Загружаем модуль…" />}>
            <AdminDashboardModal 
              isOpen={true} 
              inline={true} 
              startTab={itemId.replace('adm-', '')} 
              onClose={onBack} 
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-fullpage-wrapper">
      {/* Top Breadcrumb & Action Bar */}
      {/* «Назад» уже есть в липкой шапке кабинета — здесь только заголовок инструмента */}
      <div className="fullpage-top-bar">
        <h1 className="page-title-badge">{displayName}</h1>
      </div>

      {/* Main Full Page Body */}
      <div className="fullpage-main-body">
        <Suspense fallback={<PageLoader label="Загружаем инструмент…" />}>
        {/* 1. ESTIMATE CALCULATOR (c-estimate / e-estimate) */}
        {(itemId === 'c-estimate' || itemId === 'e-estimate') && (
          <SmartPhotoEstimatePage onBack={onBack} hideHeader={true} />
        )}

        {/* 2. DEFECT INSPECTOR (c-inspect / e-inspect) */}
        {(itemId === 'c-inspect' || itemId === 'e-inspect') && (
          <DefectInspectorPage
            onBack={onBack}
            hideHeader={true}
            onOpenScanner={onOpenTool ? () => onOpenTool(itemId === 'c-inspect' ? 'c-scan' : 'e-scan') : undefined}
          />
        )}

        {/* 2b. Сканер трещин с живой камерой (c-scan / e-scan / ing-scan) */}
        {itemId.endsWith('-scan') && <LiveDefectScanner />}

        {/* 2c. «План → 3D»: модель здания из 2D-чертежа (ing-plan) */}
        {itemId === 'ing-plan' && <Plan3DPage />}

        {/* 3. VOLUME & EARTHWORK CALCULATOR (c-volume / e-volume / e-soil) */}
        {(itemId === 'c-volume' || itemId === 'e-volume' || itemId === 'e-soil') && (
          <EarthworkVolumesPage onBack={onBack} hideHeader={true} />
        )}

        {/* 3a. CALENDAR & SCHEDULE (c-calendar / e-calendar / ing-calendar) */}
        {(itemId === 'c-calendar' || itemId === 'e-calendar' || itemId === 'ing-calendar') && (
          <CalendarSchedulePage onBack={onBack} hideHeader={true} role={itemId.startsWith('e-') ? 'executor' : 'customer'} />
        )}

        {/* 4. Лента заказов (e-feed): открытые заказы + техника рядом + мои заказы.
            «Мои работы» (e-works) открываются в кабинете инженера/бригады, не здесь. */}
        {itemId === 'e-feed' && (
          <OrderFeedPage onOpenTool={onOpenTool}>
            <UserOrdersPage
              embedded
              onBack={onBack}
              currentUser={{ ...(currentUser || {}), role: 'executor' }}
            />
          </OrderFeedPage>
        )}

        {/* 4c. ENGINEERING SOLUTIONS (c-engineering / e-engineering) */}
        {(itemId === 'c-engineering' || itemId === 'e-engineering') && (
          <EngineeringSolutionsPage onBack={onBack} hideHeader={true} />
        )}

        {/* CUSTOMER ORDER MODAL */}
        {showOrderModal && (
          <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: '#211d38', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid #3a3458' }}>
              <button 
                onClick={() => setShowOrderModal(false)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#a39cc2', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#3a3458'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >✕</button>
              <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Сформировать Заявку</h2>
              <form onSubmit={handleCreateCustomerOrder}>
                <div className="form-item" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#a39cc2', display: 'block', marginBottom: '0.5rem' }}>Тип заявки:</label>
                  <select 
                    value={orderModalType} 
                    onChange={(e) => setOrderModalType(e.target.value)} 
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#15122a', border: '1px solid #3a3458', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value="construction">🏗️ Строительство (Добавить в Мои Объекты)</option>
                    <option value="engineering">⚙️ Инженерные решения (Отправить инженеру на проверку)</option>
                  </select>
                </div>
                
                <div className="form-item" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#a39cc2', display: 'block', marginBottom: '0.5rem' }}>Название заявки / объекта:</label>
                  <input 
                    type="text" 
                    value={newOrderTitle} 
                    onChange={(e) => setNewOrderTitle(e.target.value)} 
                    placeholder="Например: Постройка бани 6х4" 
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#15122a', border: '1px solid #3a3458', color: '#fff', borderRadius: '6px' }}
                    required 
                  />
                </div>

                <div className="form-item" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#a39cc2', display: 'block', marginBottom: '0.5rem' }}>Описание (опционально):</label>
                  <textarea 
                    value={newOrderDesc} 
                    onChange={(e) => setNewOrderDesc(e.target.value)} 
                    placeholder="Укажите детали заказа..." 
                    className="admin-search-input"
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#15122a', border: '1px solid #3a3458', color: '#fff', borderRadius: '6px', minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <div className="form-item" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#a39cc2', display: 'block', marginBottom: '0.5rem' }}>Прикрепить файлы (чертежи, фото, документы):</label>
                  <input 
                    type="file" 
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setNewOrderFiles(Array.from(e.target.files));
                      }
                    }}
                    style={{ display: 'none' }}
                    id="order-files-upload"
                  />
                  <label 
                    htmlFor="order-files-upload"
                    style={{ display: 'inline-block', width: '100%', padding: '0.75rem', backgroundColor: '#15122a', border: '1px dashed #10b981', color: '#10b981', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    + Выбрать файлы
                  </label>
                  {newOrderFiles.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#a39cc2' }}>
                      Выбрано файлов: {newOrderFiles.length}
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.25rem', marginBottom: 0 }}>
                        {newOrderFiles.map((f, i) => (
                          <li key={i}>{f.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowOrderModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: '#a39cc2', border: '1px solid #3a3458', borderRadius: '6px', cursor: 'pointer' }}>
                    Отмена
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Сформировать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4b. Заказы заказчика (c-orders / e-orders) */}
        {(itemId === 'c-orders' || itemId === 'e-orders') && (
          <UserOrdersPage
            embedded
            onBack={onBack}
            currentUser={{ ...(currentUser || {}), role: itemId.startsWith('e-') ? 'executor' : 'customer' }}
          />
        )}

        {/* 5. CONTRACTORS CATALOG (c-catalog / e-catalog) */}
        {(itemId === 'c-catalog' || itemId === 'e-catalog') && (
          <ContractorsCatalogPage onBack={onBack} />
        )}

        {/* 6. EQUIPMENT MARKETPLACE (c-equipment / e-equipment) */}
        {(itemId === 'c-equipment' || itemId === 'e-equipment') && (
          <div style={{ padding: '0', background: 'transparent' }}>
            <EquipmentMarketplace />
          </div>
        )}

        {/* 6a. MATERIALS MARKETPLACE (c-materials / e-materials) */}
        {(itemId === 'c-materials' || itemId === 'e-materials') && (
          <MaterialsMarketplacePage onBack={onBack} hideHeader={true} />
        )}

        {/* 6b. ROLE HIERARCHY ORG TREE (comp-tree / adm-tree / tree) */}
        {(itemId === 'comp-tree' || itemId === 'adm-tree' || itemId?.includes('tree')) && (
          <RoleHierarchyTreePage onBack={onBack} hideHeader={true} />
        )}

        {/* 6c. ANALYST WORKSPACE (an-queue / an-reports / an-stats / an-files) */}
        {(itemId?.startsWith('an-')) && (
          <AnalystDashboardPage onBack={onBack} hideHeader={true} />
        )}

        {/* 7. WALLET & ESCROW (c-wallet / e-wallet) */}
        {(itemId === 'c-wallet' || itemId === 'e-wallet') && (
          <UserWalletPage onBack={onBack} currentUser={{ role: itemId === 'e-wallet' ? 'executor' : 'customer' }} />
        )}

        {/* 8. PROFILE & QUESTIONNAIRE (c-profile / e-profile) */}
        {(itemId === 'c-profile' || itemId === 'e-profile') && (
          <ProfileQuestionnaire onBack={onBack} />
        )}

        {/* 9. VIP BUILDINGS (c-vip / e-vip) */}
        {(itemId === 'c-vip' || itemId === 'e-vip') && (
          <BuildingConstructionPage onBack={onBack} hideHeader={true} />
        )}

        {/* 10. DISPUTE ARBITRATION */}
        {(itemId?.includes('dispute') || itemId === 'c-dispute') && <DisputeResolutionModule />}

        {/* 11. MAP VIEWER */}
        {(itemId?.includes('map') || itemId === 'c-map') && <MapViewerModule />}

        {/* 12. 3D BIM MODEL VIEWER */}
        {(itemId?.includes('3d') || itemId === 'c-3d') && <Model3DViewerModule />}

        {/* 13. KPI & ANALYTICS */}
        {(itemId?.includes('kpi') || itemId === 'adm-kpi' || itemId === 'c-kpi') && <KpiAnalyticsModule />}
        </Suspense>
      </div>
    </div>
  );
}
