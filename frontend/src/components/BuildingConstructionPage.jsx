import React, { useState, useEffect, useRef } from 'react';
import './BuildingConstructionPage.css';
import Building3DViewer from './Building3DViewer';

// Initial preloaded VIP construction sites
const INITIAL_VIP_OBJECTS = [
  {
    id: 'OBJ-101',
    title: 'ЖК «Nomad Palace» - Блок А и Б',
    type: 'Жилой комплекс',
    typeIcon: '🏢',
    city: 'Астана',
    address: 'пр. Мангилик Ел, 58',
    floors: 16,
    area: 24500,
    builtArea: 1850,
    budget: 850000000,
    spent: 382500000,
    progress: 45,
    currentStage: 'Возведение монолитного каркаса (9-й этаж)',
    engineer: 'Касымов Б.А. (Главный инженер проекта)',
    engineerPhone: '+7 701 555-40-10',
    workers: 68,
    deadline: '2026-12-15',
    licenseReq: 'I Категория (Особо опасные и технически сложные объекты)',
    status: 'active',
    selectedWorks: ['monolith', 'walls', 'engineering'],
    lotsCount: 3,
    activeLots: [
      { id: 'LOT-901', title: 'Устройство монолитных перекрытий 10-14 этажи (3200 м³)', budget: 134400000, status: 'published', bidsCount: 4, deadline: '05.09.2026' },
      { id: 'LOT-902', title: 'Поставка и монтаж оконных блоков ПВХ 5-камерных', budget: 42000000, status: 'published', bidsCount: 2, deadline: '12.09.2026' },
      { id: 'LOT-903', title: 'Монтаж стояков канализации и водоснабжения', budget: 28500000, status: 'draft', bidsCount: 0, deadline: '20.09.2026' }
    ]
  },
  {
    id: 'OBJ-102',
    title: 'Бизнес-центр «Silk Way Towers»',
    type: 'Бизнес-центр',
    typeIcon: '🏬',
    city: 'Алматы',
    address: 'пр. Аль-Фараби, 140/3',
    floors: 12,
    area: 18200,
    builtArea: 1400,
    budget: 620000000,
    spent: 496000000,
    progress: 80,
    currentStage: 'Вентилируемый фасад и чистовая отделка лобби',
    engineer: 'Ахметов С.К. (Ведущий ГИП)',
    engineerPhone: '+7 777 222-33-44',
    workers: 45,
    deadline: '2026-10-30',
    licenseReq: 'I Категория (СМР)',
    status: 'active',
    selectedWorks: ['facade', 'finishing', 'landscaping'],
    lotsCount: 2,
    activeLots: [
      { id: 'LOT-881', title: 'Монтаж керамогранитного фасада NordFox (4200 м²)', budget: 92400000, status: 'published', bidsCount: 5, deadline: '28.08.2026' },
      { id: 'LOT-882', title: 'Благоустройство территории и асфальтирование парковки', budget: 35000000, status: 'published', bidsCount: 3, deadline: '10.09.2026' }
    ]
  },
  {
    id: 'OBJ-103',
    title: 'Коттеджный городок «Тау-Самал» (12 вилл)',
    type: 'Коттеджный городок',
    typeIcon: '🏡',
    city: 'Алматы',
    address: 'мкр. Ремизовка, ул. Горная',
    floors: 2,
    area: 5800,
    builtArea: 2200,
    budget: 340000000,
    spent: 98000000,
    progress: 28,
    currentStage: 'Кладка наружных стен из кирпича и монтаж кровли',
    engineer: 'Данияров М.Т. (Инженер технадзора)',
    engineerPhone: '+7 705 888-12-34',
    workers: 26,
    deadline: '2027-04-20',
    licenseReq: 'II Категория (СМР)',
    status: 'active',
    selectedWorks: ['earthworks', 'walls', 'roofing'],
    lotsCount: 1,
    activeLots: [
      { id: 'LOT-701', title: 'Кровельные работы гибкая черепица Shinglas (2400 м²)', budget: 48000000, status: 'draft', bidsCount: 0, deadline: '15.09.2026' }
    ]
  }
];

// Available Work Breakdown Structure (WBS) items
const WBS_WORKS_CATALOG = [
  {
    id: 'earthworks',
    title: '1. Земляные работы и нулевой цикл',
    icon: '🚜',
    desc: 'Разработка котлована, вывоз грунта, шпунтовое ограждение, водопонижение',
    basePricePerM2: 8500,
    laborHoursPerM2: 0.45,
    gesnCode: 'ГЭСН 01-01-002',
    items: ['Разработка грунта экскаватором', 'Устройство песчано-гравийной подушки', 'Шпунтовое ограждение Larsen IV']
  },
  {
    id: 'monolith',
    title: '2. Фундаменты и монолитный каркас',
    icon: '🏗️',
    desc: 'Буронабивные сваи Ø600-800, ростверк, плита, пилоны, перекрытия B25/B30',
    basePricePerM2: 24500,
    laborHoursPerM2: 1.85,
    gesnCode: 'ГЭСН 06-01-005',
    items: ['Устройство свайного поля', 'Армирование каркасов A500C', 'Заливка бетона B25/B30 бетононасосом', 'Опалубка DOKA/PERI']
  },
  {
    id: 'walls',
    title: '3. Кладка наружных и внутренних стен',
    icon: '🧱',
    desc: 'Газобетон D500/D600, кирпич керамический полнотелый, перегородки ПГП',
    basePricePerM2: 12800,
    laborHoursPerM2: 0.95,
    gesnCode: 'ГЭСН 08-02-001',
    items: ['Кладка наружных стен из газоблока', 'Облицовочный кирпич', 'Межквартирные перегородки 200мм']
  },
  {
    id: 'roofing',
    title: '4. Кровельные системы и гидроизоляция',
    icon: '🏠',
    desc: 'Мембранная ПВХ-кровля, утепление PIR/XPS, металлочерепица, водостоки',
    basePricePerM2: 9200,
    laborHoursPerM2: 0.65,
    gesnCode: 'ГЭСН 12-01-001',
    items: ['Мембранная гидроизоляция Технониколь', 'Утепление минеральной ватой 200мм', 'Устройство парапетов и воронок']
  },
  {
    id: 'facade',
    title: '5. Вентилируемые фасады и витражи',
    icon: '🏢',
    desc: 'Керамогранит, алюминиевые композитные панели, витражное остекление Alutech',
    basePricePerM2: 18500,
    laborHoursPerM2: 1.20,
    gesnCode: 'ГЭСН 15-01-010',
    items: ['Подсистема NordFox оцинкованная', 'Утеплитель фасадный Rockwool 150мм', 'Остекление витражей триплекс']
  },
  {
    id: 'engineering',
    title: '6. Инженерные сети (ЭОМ, ОВ, ВК, ИТП)',
    icon: '⚡',
    desc: 'Электроснабжение, отопление, приточно-вытяжная вентиляция, канализация',
    basePricePerM2: 16400,
    laborHoursPerM2: 1.10,
    gesnCode: 'ГЭСН 67-01-001',
    items: ['Прокладка кабелей ВВГнг-LS в лотках', 'Разводка труб Rehau/PPR', 'Монтаж шкафов ВРУ и автоматики', 'Установка чиллеров и фанкойлов']
  },
  {
    id: 'finishing',
    title: '7. Черновая и чистовая отделка МОП',
    icon: '🎨',
    desc: 'Полусухая стяжка, машинная штукатурка Knauf, керамогранит, дизайнерское лобби',
    basePricePerM2: 14200,
    laborHoursPerM2: 0.90,
    gesnCode: 'ГЭСН 15-02-005',
    items: ['Механизированная штукатурка стен', 'Стяжка с фиброволокном', 'Облицовка лестничных маршей и холлов']
  },
  {
    id: 'landscaping',
    title: '8. Благоустройство и наружные сети',
    icon: '🌳',
    desc: 'Асфальтирование, тротуарная плитка, освещение, детские площадки, шлагбаумы',
    basePricePerM2: 6800,
    laborHoursPerM2: 0.40,
    gesnCode: 'ГЭСН 27-01-001',
    items: ['Укладка брусчатки 60мм', 'Установка опор LED освещения', 'Озеленение и автополив']
  }
];

// Accredited Construction Companies Registry (GASK Licenses)
const ACCREDITED_CONTRACTORS = [
  {
    bin: '190340011293',
    name: 'ТОО «BI Group Engineering»',
    license: 'I Категория (ГАСК №001928)',
    rating: 5.0,
    completedProjects: 48,
    activeBrigades: 320,
    city: 'Астана / Алматы',
    specialization: 'Многоэтажные ЖК, Инфраструктура, Монолит',
    verified: true,
    contact: '+7 7172 58-00-58',
    email: 'tenders@bi.group'
  },
  {
    bin: '150840003412',
    name: 'ТОО «Базис-А МонолитСтрой»',
    license: 'I Категория (ГАСК №003411)',
    rating: 4.9,
    completedProjects: 42,
    activeBrigades: 280,
    city: 'Алматы / Астана',
    specialization: 'Бизнес-центры A-класса, Премиум ЖК, Фасады',
    verified: true,
    contact: '+7 727 277-77-77',
    email: 'tender@bazis.kz'
  },
  {
    bin: '210440012935',
    name: 'ТОО «Highvill Kazakhstan»',
    license: 'I Категория (ГАСК №005819)',
    rating: 4.9,
    completedProjects: 24,
    activeBrigades: 190,
    city: 'Астана',
    specialization: 'Умные дома, Высотное строительство, Инженерия',
    verified: true,
    contact: '+7 7172 79-79-79',
    email: 'contract@highvill.kz'
  },
  {
    bin: '180240009871',
    name: 'ТОО «Prime Development KZ»',
    license: 'II Категория (ГАСК №011920)',
    rating: 4.8,
    completedProjects: 18,
    activeBrigades: 95,
    city: 'Шымкент / Алматы',
    specialization: 'Коттеджные городки, Склады, Ангары',
    verified: true,
    contact: '+7 7252 40-50-60',
    email: 'info@primedev.kz'
  }
];

export default function BuildingConstructionPage({ onBack, hideHeader = false }) {
  // Navigation tabs matching flowchart:
  // 'objects' (Мои объекты) | 'create' (Создать объект) | 'works_calc' (Выбор СМР & Оценка) | 'ai_audit' (Проверка инженером) | 'lots' (Лоты / Заказы) | 'docs' (Документы & PDF) | 'contractors' (Допуск подрядчиков)
  const [activeTab, setActiveTab] = useState('objects');

  // Objects State
  const [objects, setObjects] = useState(() => {
    const saved = localStorage.getItem('qazgost_vip_objects_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_VIP_OBJECTS;
  });

  const [selectedObjectId, setSelectedObjectId] = useState('OBJ-101');
  const [toastMessage, setToastMessage] = useState(null);

  // Flow Step 1: Create Object Form State
  const [newObj, setNewObj] = useState({
    title: '',
    type: 'Жилой комплекс',
    typeIcon: '🏢',
    city: 'Алматы',
    address: '',
    floors: 9,
    area: 8500,
    builtArea: 950,
    budget: 350000000,
    deadline: '2027-06-30',
    licenseReq: 'I Категория (СМР)'
  });

  // Flow Step 2 & 3: Selected WBS Works & Cost Scenario
  const [selectedWbsIds, setSelectedWbsIds] = useState(['earthworks', 'monolith', 'walls', 'facade']);
  const [costScenario, setCostScenario] = useState('standard'); // 'economy' | 'standard' | 'premium'
  const [customArea, setCustomArea] = useState(12000);

  // Flow Step 4: AI Engineer Audit State
  const [auditPhotoUploaded, setAuditPhotoUploaded] = useState(false);
  const [auditScanning, setAuditScanning] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [engineerComment, setEngineerComment] = useState('');

  // Flow Step 5: Lot Creation Form
  const [lotTitle, setLotTitle] = useState('');
  const [lotBudget, setLotBudget] = useState(50000000);
  const [lotDeadline, setLotDeadline] = useState('2026-10-15');
  const [editingLot, setEditingLot] = useState(null);

  // Currently active object
  const currentObject = objects.find(o => o.id === selectedObjectId) || objects[0] || INITIAL_VIP_OBJECTS[0];

  useEffect(() => {
    localStorage.setItem('qazgost_vip_objects_v2', JSON.stringify(objects));
  }, [objects]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Handlers ──
  const handleCreateObjectSubmit = (e) => {
    e.preventDefault();
    if (!newObj.title.trim()) {
      showToast('⚠️ Укажите наименование объекта строительства');
      return;
    }

    const typeIcons = {
      'Жилой комплекс': '🏢',
      'Бизнес-центр': '🏬',
      'Коттеджный городок': '🏡',
      'Склад / Промбаза': '🏭',
      'Социальный объект': '🏥'
    };

    const created = {
      id: `OBJ-${Math.floor(200 + Math.random() * 800)}`,
      title: newObj.title,
      type: newObj.type,
      typeIcon: typeIcons[newObj.type] || '🏗️',
      city: newObj.city,
      address: newObj.address || `${newObj.city}, район новой застройки`,
      floors: Number(newObj.floors) || 5,
      area: Number(newObj.area) || 5000,
      builtArea: Math.round((Number(newObj.area) || 5000) / (Number(newObj.floors) || 5)),
      budget: Number(newObj.budget) || 100000000,
      spent: 0,
      progress: 5,
      currentStage: 'Нулевой цикл / Инженерные изыскания',
      engineer: 'Аттестованный ГИП назначен',
      engineerPhone: '+7 701 500-20-26',
      workers: 12,
      deadline: newObj.deadline || '2027-12-31',
      licenseReq: newObj.licenseReq,
      status: 'active',
      selectedWorks: ['earthworks', 'monolith'],
      lotsCount: 0,
      activeLots: []
    };

    setObjects([created, ...objects]);
    setSelectedObjectId(created.id);
    setActiveTab('works_calc');
    showToast(`🎉 Объект «${created.title}» успешно создан! Переход к расчету СМР...`);
  };

  const handleDeleteObject = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот строительный объект?')) {
      const remaining = objects.filter(o => o.id !== id);
      setObjects(remaining);
      if (remaining.length > 0) setSelectedObjectId(remaining[0].id);
      showToast('🗑️ Объект удален');
    }
  };

  const handleToggleWbsWork = (wbsId) => {
    setSelectedWbsIds(prev =>
      prev.includes(wbsId) ? prev.filter(id => id !== wbsId) : [...prev, wbsId]
    );
  };

  // Cost calculation based on selected WBS works and scenario
  const calculateTotalEstimate = () => {
    const scenarioMultiplier = costScenario === 'economy' ? 0.88 : costScenario === 'premium' ? 1.35 : 1.0;
    const selectedWorksList = WBS_WORKS_CATALOG.filter(w => selectedWbsIds.includes(w.id));
    const basePerM2 = selectedWorksList.reduce((sum, w) => sum + w.basePricePerM2, 0);
    const totalM2Price = Math.round(basePerM2 * scenarioMultiplier);
    const targetArea = currentObject ? currentObject.area : customArea;
    const totalEstimate = totalM2Price * targetArea;
    const materialCost = Math.round(totalEstimate * 0.58);
    const laborCost = Math.round(totalEstimate * 0.24);
    const machineryCost = Math.round(totalEstimate * 0.10);
    const overheadVat = totalEstimate - materialCost - laborCost - machineryCost;

    return {
      basePerM2,
      totalM2Price,
      totalEstimate,
      materialCost,
      laborCost,
      machineryCost,
      overheadVat,
      selectedWorksCount: selectedWorksList.length
    };
  };

  const estimate = calculateTotalEstimate();

  // Run AI photo / blueprint audit
  const handleStartAiAudit = () => {
    setAuditScanning(true);
    setAuditPhotoUploaded(true);

    setTimeout(() => {
      setAuditScanning(false);
      setAuditReport({
        score: '96% Соответствие СНиП РК',
        detectedWorks: ['Армирование монолитной плиты', 'Шаг стержней 200х200мм', 'Защитный слой бетона 35мм'],
        remarks: [
          '✅ Армирование ригелей соответствует проекту КЖ-2',
          '⚠️ Рекомендация: усилить фиксаторы защитного слоя по краю опалубки',
          '✅ Качество сварных швов закладных деталей ГОСТ 14098-2014 соблюдено'
        ],
        engineerApproved: true
      });
      showToast('🤖 AI Инженерный аудит завершен! Замечания зафиксированы в протоколе');
    }, 2000);
  };

  // Create Lot / Tender
  const handleCreateLotSubmit = (e) => {
    e.preventDefault();
    if (!lotTitle.trim()) {
      showToast('⚠️ Введите наименование строительного лота');
      return;
    }

    const newLot = {
      id: `LOT-${Math.floor(100 + Math.random() * 900)}`,
      title: lotTitle,
      budget: Number(lotBudget) || estimate.totalEstimate,
      status: 'published',
      bidsCount: 0,
      deadline: lotDeadline || '2026-11-30'
    };

    const updated = objects.map(o => {
      if (o.id === currentObject.id) {
        return {
          ...o,
          lotsCount: (o.lotsCount || 0) + 1,
          activeLots: [newLot, ...(o.activeLots || [])]
        };
      }
      return o;
    });

    setObjects(updated);
    setLotTitle('');
    setActiveTab('lots');
    showToast(`🚀 Лот «${newLot.title}» успешно сформирован и опубликован в "Мои Заказы Строительство"!`);
  };

  const handleDeleteLot = (lotId) => {
    const updated = objects.map(o => {
      if (o.id === currentObject.id) {
        return {
          ...o,
          lotsCount: Math.max(0, (o.lotsCount || 1) - 1),
          activeLots: (o.activeLots || []).filter(l => l.id !== lotId)
        };
      }
      return o;
    });
    setObjects(updated);
    showToast('🗑️ Лот удален из очереди');
  };

  return (
    <div className="vip-construction-module">
      {toastMessage && <div className="vip-toast">{toastMessage}</div>}

      {/* ── 1. MODULE HEADER & FLOW STATUS BAR ── */}
      {!hideHeader && (
        <div className="vip-header-wrapper">
          <div className="vip-header-left">
            <button className="vip-back-btn" onClick={onBack} title="Назад в панель">←</button>
            <div>
              <div className="vip-badge-row">
                <span className="vip-gold-badge">⭐ VIP ГЕНЕРАЛЬНЫЙ ПОДРЯД</span>
                <span className="vip-license-badge">Лицензия I Категории ГАСК РК</span>
                <span className="vip-iso-badge">ISO 9001 / СНиП 2026</span>
              </div>
              <h1 className="vip-main-title">Строительство Зданий и Сооружений</h1>
              <p className="vip-subtitle">
                Сквозное управление объектами: ПСД, WBS-декомпозиция СМР, AI-аудит, тендерные лоты и технадзор
              </p>
            </div>
          </div>

          <div className="vip-header-stats">
            <div className="v-stat-pill">
              <span className="label">Объектов в портфеле:</span>
              <strong className="val">{objects.length}</strong>
            </div>
            <div className="v-stat-pill">
              <span className="label">Суммарный бюджет:</span>
              <strong className="val gold">{objects.reduce((s, o) => s + o.budget, 0).toLocaleString()} ₸</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ARCHITECTURAL FLOWCHART STEP SELECTOR ── */}
      <div className="vip-flow-tabs-bar">
        <button
          className={`vip-tab-btn ${activeTab === 'objects' ? 'active' : ''}`}
          onClick={() => setActiveTab('objects')}
        >
          <span className="icon">🏢</span>
          <div className="tab-info">
            <span className="t-name">Мои объекты</span>
            <small className="t-sub">{objects.length} активных площадок</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <span className="icon">➕</span>
          <div className="tab-info">
            <span className="t-name">Создать объект</span>
            <small className="t-sub">Выбор типа & ГАСК допуск</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'works_calc' ? 'active' : ''}`}
          onClick={() => setActiveTab('works_calc')}
        >
          <span className="icon">📐</span>
          <div className="tab-info">
            <span className="t-name">Выбор СМР & Оценка</span>
            <small className="t-sub">WBS-норматив & СНиП</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'ai_audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_audit')}
        >
          <span className="icon">🔍</span>
          <div className="tab-info">
            <span className="t-name">Проверка инженером</span>
            <small className="t-sub">AI Фото-аудит & Правки</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'lots' ? 'active' : ''}`}
          onClick={() => setActiveTab('lots')}
        >
          <span className="icon">📦</span>
          <div className="tab-info">
            <span className="t-name">Лоты / Заказы</span>
            <small className="t-sub">Тендеры & Публикация</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span className="icon">📄</span>
          <div className="tab-info">
            <span className="t-name">Сметы & Документы</span>
            <small className="t-sub">PDF КС-2/КС-3 & Аналитика</small>
          </div>
        </button>

        <button
          className={`vip-tab-btn ${activeTab === 'contractors' ? 'active' : ''}`}
          onClick={() => setActiveTab('contractors')}
        >
          <span className="icon">🛡️</span>
          <div className="tab-info">
            <span className="t-name">Допуск компаний</span>
            <small className="t-sub">Реестр проверенных БИН</small>
          </div>
        </button>
      </div>

      {/* ── 3. TAB 1: МОИ ОБЪЕКТЫ (OBJECTS DASHBOARD + 3D BIM PREVIEW) ── */}
      {activeTab === 'objects' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <h2>🏢 Портфель строительных объектов</h2>
              <p>Текущий мониторинг строительства, освоение эскроу-бюджета и контроль этапов</p>
            </div>
            <button className="vip-primary-btn" onClick={() => setActiveTab('create')}>
              ➕ Добавить новый объект
            </button>
          </div>

          {/* Active Object Highlight Banner with 3D Preview */}
          {currentObject && (
            <div className="vip-current-object-bento">
              <div className="v-bento-left">
                <div className="v-tag-row">
                  <span className="v-type-tag">{currentObject.typeIcon} {currentObject.type}</span>
                  <span className="v-city-tag">📍 {currentObject.city}, {currentObject.address}</span>
                  <span className="v-id-tag">ID: {currentObject.id}</span>
                </div>

                <h3 className="v-current-title">{currentObject.title}</h3>
                
                <div className="v-progress-wrapper">
                  <div className="v-prog-labels">
                    <span>Готовность объекта:</span>
                    <strong className="text-cyan">{currentObject.progress}%</strong>
                  </div>
                  <div className="v-prog-track">
                    <div className="v-prog-bar" style={{ width: `${currentObject.progress}%` }}></div>
                  </div>
                  <div className="v-current-stage">
                    📍 Текущий этап: <strong>{currentObject.currentStage}</strong>
                  </div>
                </div>

                {/* Metrics 4 Grid */}
                <div className="v-metrics-grid">
                  <div className="v-metric-box">
                    <span className="lbl">Общая площадь</span>
                    <strong className="val">{currentObject.area.toLocaleString()} м²</strong>
                    <small>{currentObject.floors} этажей</small>
                  </div>
                  <div className="v-metric-box">
                    <span className="lbl">Плановый бюджет</span>
                    <strong className="val gold">{currentObject.budget.toLocaleString()} ₸</strong>
                    <small>Освоено: {currentObject.spent.toLocaleString()} ₸</small>
                  </div>
                  <div className="v-metric-box">
                    <span className="lbl">Ответственный ГИП</span>
                    <strong className="val">{currentObject.engineer}</strong>
                    <small>📞 {currentObject.engineerPhone}</small>
                  </div>
                  <div className="v-metric-box">
                    <span className="lbl">Рабочих / Лотов</span>
                    <strong className="val">👷 {currentObject.workers} чел.</strong>
                    <small>{currentObject.lotsCount} активных лотов</small>
                  </div>
                </div>

                {/* Object Action Controls */}
                <div className="v-object-actions-row">
                  <button
                    className="vip-btn-wbs"
                    onClick={() => {
                      setSelectedObjectId(currentObject.id);
                      setActiveTab('works_calc');
                    }}
                  >
                    📐 Рассчитать СМР для объекта ➔
                  </button>
                  <button
                    className="vip-btn-lots"
                    onClick={() => {
                      setSelectedObjectId(currentObject.id);
                      setActiveTab('lots');
                    }}
                  >
                    📦 Управление лотами ({currentObject.lotsCount})
                  </button>
                  <button
                    className="vip-btn-docs"
                    onClick={() => {
                      setSelectedObjectId(currentObject.id);
                      setActiveTab('docs');
                    }}
                  >
                    📑 Документы & PDF Смета
                  </button>
                </div>
              </div>

              {/* 3D BIM Viewer Card */}
              <div className="v-bento-right">
                <div className="v-3d-header">
                  <span>📐 Интерактивный 3D BIM Обзор</span>
                  <span className="live-pill">● LIVE</span>
                </div>
                <div className="v-3d-container">
                  <Building3DViewer sampleIndex={currentObject.floors > 10 ? 0 : 1} isScanning={false} />
                </div>
                <div className="v-3d-footer">
                  <span>Вращение 360° • Проверка монолитных осей • СНиП РК</span>
                </div>
              </div>
            </div>
          )}

          {/* Grid of All Objects */}
          <h3 className="vip-sec-subheading">Все объекты в работе ({objects.length})</h3>
          <div className="vip-objects-cards-grid">
            {objects.map((obj) => (
              <div
                key={obj.id}
                className={`vip-obj-card ${obj.id === selectedObjectId ? 'selected' : ''}`}
                onClick={() => setSelectedObjectId(obj.id)}
              >
                <div className="v-card-top">
                  <span className="v-card-type">{obj.typeIcon} {obj.type}</span>
                  <button
                    className="v-card-del"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObject(obj.id);
                    }}
                    title="Удалить объект"
                  >
                    ✕
                  </button>
                </div>

                <h4 className="v-card-title">{obj.title}</h4>
                <div className="v-card-loc">📍 {obj.city} • {obj.area.toLocaleString()} м²</div>

                <div className="v-card-prog-row">
                  <span>Готовность: <strong>{obj.progress}%</strong></span>
                  <div className="v-mini-bar">
                    <div className="fill" style={{ width: `${obj.progress}%` }}></div>
                  </div>
                </div>

                <div className="v-card-budget">
                  <span>Бюджет:</span>
                  <strong>{obj.budget.toLocaleString()} ₸</strong>
                </div>

                <div className="v-card-footer-btns">
                  <button
                    className="v-btn-select"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedObjectId(obj.id);
                      setActiveTab('works_calc');
                    }}
                  >
                    Выбрать объект ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. TAB 2: СОЗДАТЬ ОБЪЕКТ & ВЫБОР ТИПА ── */}
      {activeTab === 'create' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <h2>➕ Регистрация нового строительного объекта</h2>
              <p>Внесите проектные параметры для автоматической проверки допуска и расчета сметы</p>
            </div>
          </div>

          <div className="vip-create-layout">
            <form onSubmit={handleCreateObjectSubmit} className="vip-create-form">
              <div className="form-group">
                <label>Наименование объекта строительства *</label>
                <input
                  type="text"
                  className="vip-input"
                  placeholder="Например: ЖК «Панорама Towers» (Блок C) или Бизнес-центр"
                  value={newObj.title}
                  onChange={(e) => setNewObj({ ...newObj, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Тип строительного объекта</label>
                  <select
                    className="vip-input"
                    value={newObj.type}
                    onChange={(e) => setNewObj({ ...newObj, type: e.target.value })}
                  >
                    <option value="Жилой комплекс">🏢 Многоэтажный жилой комплекс (ЖК)</option>
                    <option value="Бизнес-центр">🏬 Бизнес-центр / Торговый комплекс</option>
                    <option value="Коттеджный городок">🏡 Коттеджный посёлок / Вилла</option>
                    <option value="Склад / Промбаза">🏭 Складской / Промышленный комплекс</option>
                    <option value="Социальный объект">🏥 Социальный объект (Школа, больница)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Город / Локация *</label>
                  <select
                    className="vip-input"
                    value={newObj.city}
                    onChange={(e) => setNewObj({ ...newObj, city: e.target.value })}
                  >
                    <option value="Алматы">Алматы (Южная столица / Сейсмика 9 баллов)</option>
                    <option value="Астана">Астана (Главная столица / Ветровая зона)</option>
                    <option value="Шымкент">Шымкент (Мегаполис Юг)</option>
                    <option value="Караганда">Караганда (Центральный регион)</option>
                    <option value="Атырау">Атырау (Западный промышленный)</option>
                    <option value="Актау">Актау (Мангистау / Морской)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Точный строительный адрес / Пятно застройки</label>
                <input
                  type="text"
                  className="vip-input"
                  placeholder="г. Алматы, Бостандыкский район, ул. Розыбакиева 289"
                  value={newObj.address}
                  onChange={(e) => setNewObj({ ...newObj, address: e.target.value })}
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Этажность (этажей)</label>
                  <input
                    type="number"
                    className="vip-input"
                    value={newObj.floors}
                    onChange={(e) => setNewObj({ ...newObj, floors: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Общая площадь (м²)</label>
                  <input
                    type="number"
                    className="vip-input"
                    value={newObj.area}
                    onChange={(e) => setNewObj({ ...newObj, area: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Плановый бюджет (₸)</label>
                  <input
                    type="number"
                    className="vip-input"
                    value={newObj.budget}
                    onChange={(e) => setNewObj({ ...newObj, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Требуемая категория лицензии подрядчика</label>
                  <select
                    className="vip-input"
                    value={newObj.licenseReq}
                    onChange={(e) => setNewObj({ ...newObj, licenseReq: e.target.value })}
                  >
                    <option value="I Категория (Особо опасные и технически сложные объекты)">I Категория (Особо опасные и технически сложные)</option>
                    <option value="II Категория (СМР стандартной сложности)">II Категория (СМР стандартной сложности)</option>
                    <option value="III Категория (Малоэтажное строительство)">III Категория (Малоэтажное строительство)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Плановый срок ввода в эксплуатацию</label>
                  <input
                    type="date"
                    className="vip-input"
                    value={newObj.deadline}
                    onChange={(e) => setNewObj({ ...newObj, deadline: e.target.value })}
                  />
                </div>
              </div>

              {/* License & Verification Assurance Box (Blue Box from Flowchart) */}
              <div className="vip-license-assurance-box">
                <div className="icon">🛡️</div>
                <div>
                  <h4>Автоматическая проверка допуска компаний и контакты исполнителей</h4>
                  <p>
                    При создании объекта система мгновенно проверяет реестр лицензий ГАСК РК, отбирает подрядчиков с подтвержденным опытом и подключает аккредитованного ГИП.
                  </p>
                </div>
              </div>

              <div className="vip-form-actions">
                <button type="button" className="vip-secondary-btn" onClick={() => setActiveTab('objects')}>
                  Отмена
                </button>
                <button type="submit" className="vip-primary-btn">
                  ✨ Создать объект и перейти к расчету СМР ➔
                </button>
              </div>
            </form>

            {/* Live 3D Preview of Selected Building Type */}
            <div className="vip-create-preview">
              <div className="preview-card">
                <h4>📐 3D Архитектурная модель: {newObj.type}</h4>
                <p>Предварительная визуализация габаритов ({newObj.floors} этажей, {Number(newObj.area).toLocaleString()} м²)</p>
                <div className="preview-3d-box">
                  <Building3DViewer sampleIndex={newObj.type === 'Жилой комплекс' ? 0 : newObj.type === 'Бизнес-центр' ? 1 : 2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TAB 3: ВЫБОР СМР & ОЦЕНКА СТОИМОСТИ (WBS + CALCULATOR) ── */}
      {activeTab === 'works_calc' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <span className="vip-badge-pill">Объект: {currentObject.title}</span>
              <h2>📐 Выбор из списка всех видов работ & Оценка стоимости</h2>
              <p>WBS-декомпозиция строительно-монтажных работ по сборникам ГЭСН-2026 и СНиП РК</p>
            </div>
            <div className="vip-obj-quick-switch">
              <label>Выбрать другой объект:</label>
              <select
                value={selectedObjectId}
                onChange={(e) => setSelectedObjectId(e.target.value)}
                className="vip-select-mini"
              >
                {objects.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
          </div>

          <div className="vip-wbs-calc-layout">
            {/* Left: WBS Works Selector */}
            <div className="vip-wbs-list">
              <h3 className="wbs-title">
                <span>📋</span> Выберите виды работ для включения в смету ({selectedWbsIds.length} из {WBS_WORKS_CATALOG.length}):
              </h3>

              <div className="wbs-cards-stack">
                {WBS_WORKS_CATALOG.map((w) => {
                  const isChecked = selectedWbsIds.includes(w.id);
                  return (
                    <div
                      key={w.id}
                      className={`wbs-item-card ${isChecked ? 'active' : ''}`}
                      onClick={() => handleToggleWbsWork(w.id)}
                    >
                      <div className="wbs-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        <span className="wbs-icon">{w.icon}</span>
                        <div>
                          <div className="wbs-name">{w.title}</div>
                          <div className="wbs-desc">{w.desc}</div>
                          <div className="wbs-tags-row">
                            <span className="gesn-tag">{w.gesnCode}</span>
                            <span className="rate-tag">{w.basePricePerM2.toLocaleString()} ₸/м²</span>
                            <span className="labor-tag">⏱ {w.laborHoursPerM2} ч-ч/м²</span>
                          </div>
                        </div>
                      </div>
                      <div className="wbs-right-price">
                        <strong>{(w.basePricePerM2 * (currentObject ? currentObject.area : customArea)).toLocaleString()} ₸</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: AI & SNiP Cost Estimation Engine (Green Hexagon in Flowchart) */}
            <div className="vip-cost-engine-card">
              <div className="engine-header">
                <span className="engine-icon">📊</span>
                <div>
                  <h4>Оценка Стоимости СМР</h4>
                  <small>Автоматический расчет по сметам СНиП РК</small>
                </div>
              </div>

              {/* Scenario Toggles */}
              <div className="scenario-toggles-row">
                <button
                  className={`sc-btn ${costScenario === 'economy' ? 'active eco' : ''}`}
                  onClick={() => setCostScenario('economy')}
                >
                  🟢 Эконом (-12%)
                </button>
                <button
                  className={`sc-btn ${costScenario === 'standard' ? 'active std' : ''}`}
                  onClick={() => setCostScenario('standard')}
                >
                  🟡 Стандарт (СНиП)
                </button>
                <button
                  className={`sc-btn ${costScenario === 'premium' ? 'active prm' : ''}`}
                  onClick={() => setCostScenario('premium')}
                >
                  🟣 Премиум (+35%)
                </button>
              </div>

              {/* Cost Summary Box */}
              <div className="cost-total-display">
                <div className="lbl">ИТОГОВАЯ СМЕТНАЯ СТОИМОСТЬ:</div>
                <div className="val">{estimate.totalEstimate.toLocaleString()} ₸</div>
                <div className="sub-val">В пересчете: <strong>{estimate.totalM2Price.toLocaleString()} ₸ / м²</strong></div>
              </div>

              {/* Detailed Cost Breakdown */}
              <div className="cost-breakdown-list">
                <div className="cost-row">
                  <span>🧱 Строительные материалы (58%):</span>
                  <strong>{estimate.materialCost.toLocaleString()} ₸</strong>
                </div>
                <div className="cost-row">
                  <span>👷 Фонд оплаты труда / Монтаж (24%):</span>
                  <strong>{estimate.laborCost.toLocaleString()} ₸</strong>
                </div>
                <div className="cost-row">
                  <span>🚜 Спецтехника и механизмы (10%):</span>
                  <strong>{estimate.machineryCost.toLocaleString()} ₸</strong>
                </div>
                <div className="cost-row">
                  <span>📑 Накладные расходы и НДС 12% (8%):</span>
                  <strong>{estimate.overheadVat.toLocaleString()} ₸</strong>
                </div>
              </div>

              {/* Next Steps Buttons from Flowchart */}
              <div className="engine-actions">
                <button
                  className="vip-btn-audit"
                  onClick={() => setActiveTab('ai_audit')}
                >
                  🔍 Проверка инженером / Фото-аудит ➔
                </button>

                <button
                  className="vip-btn-lot-create"
                  onClick={() => {
                    setLotTitle(`Комплекс СМР для «${currentObject.title}» (${selectedWbsIds.length} разделов)`);
                    setLotBudget(estimate.totalEstimate);
                    setActiveTab('lots');
                  }}
                >
                  📦 Сформировать Тендерный Лот ➔
                </button>

                <button
                  className="vip-btn-pdf-export"
                  onClick={() => setActiveTab('docs')}
                >
                  📄 Экспорт сметы в PDF / Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. TAB 4: ПРОВЕРКА ИНЖЕНЕРОМ / ФОТО-ПРАВКИ (PURPLE NODE) ── */}
      {activeTab === 'ai_audit' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <span className="vip-badge-pill">Объект: {currentObject.title}</span>
              <h2>🔍 Проверка инженером, фото-контроль и дефектовка</h2>
              <p>AI-верификация проектных чертежей, фотофиксация армирования и заключение ГИП</p>
            </div>
          </div>

          <div className="vip-audit-layout">
            {/* Upload / Scanner Box */}
            <div className="vip-audit-upload-box">
              <div className="audit-dropzone">
                <span className="drop-icon">📷</span>
                <h3>Загрузите чертежи КЖ/АР или фото со стройплощадки</h3>
                <p>Поддерживаются форматы: .dwg, .pdf, .png, .jpg для автоматического анализа СНиП</p>

                <button
                  className="vip-primary-btn"
                  onClick={handleStartAiAudit}
                  disabled={auditScanning}
                >
                  {auditScanning ? '⏳ Идет AI-сканирование монолита...' : '🚀 Запустить Инженерный AI-Аудит'}
                </button>
              </div>

              {/* Live Scan Preview */}
              {auditScanning && (
                <div className="audit-scanning-anim">
                  <div className="laser-line"></div>
                  <Building3DViewer isScanning={true} />
                </div>
              )}

              {/* Audit Findings Report */}
              {auditReport && (
                <div className="audit-report-box">
                  <div className="report-head">
                    <span className="score-badge">✅ {auditReport.score}</span>
                    <h4>Заключение технического надзора ГИП</h4>
                  </div>

                  <div className="report-items">
                    <div className="r-block">
                      <strong>Распознанные конструктивные элементы:</strong>
                      <ul>
                        {auditReport.detectedWorks.map((item, idx) => (
                          <li key={idx}>🔹 {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="r-block">
                      <strong>Предписания и замечания эксперта:</strong>
                      <ul>
                        {auditReport.remarks.map((rem, idx) => (
                          <li key={idx}>{rem}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="engineer-sign-box">
                    <span>Ответственный ГИП: <strong>{currentObject.engineer}</strong></span>
                    <span className="ecp-badge">🔐 Подписано ЭЦП НУЦ РК</span>
                  </div>
                </div>
              )}
            </div>

            {/* Engineer Remarks & Action Form */}
            <div className="vip-audit-side-form">
              <h3>📝 Инженерные правки & Согласование</h3>
              <p>Внесите корректировки в состав работ перед публикацией тендерного лота</p>

              <div className="form-group">
                <label>Комментарий ГИП / Заказчика к проекту:</label>
                <textarea
                  className="vip-textarea"
                  rows="4"
                  placeholder="Укажите особые требования к марке бетона, температурному режиму прогрева или типу опалубки..."
                  value={engineerComment}
                  onChange={(e) => setEngineerComment(e.target.value)}
                />
              </div>

              <div className="audit-actions-column">
                <button
                  className="vip-btn-approve-audit"
                  onClick={() => {
                    showToast('✅ Проект согласован главным инженером! Переход к созданию лота...');
                    setLotTitle(`Строительно-монтажные работы «${currentObject.title}» (ПСД согласовано)`);
                    setLotBudget(estimate.totalEstimate);
                    setActiveTab('lots');
                  }}
                >
                  ✅ Согласовать и создать Лот ➔
                </button>

                <button
                  className="vip-secondary-btn"
                  onClick={() => setActiveTab('works_calc')}
                >
                  ✏️ Вернуться к редактированию СМР
                </button>

                <button
                  className="vip-btn-contractors"
                  onClick={() => setActiveTab('contractors')}
                >
                  🏢 Проверить допуск подрядчиков для объекта
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. TAB 5: ЛОТЫ / ЗАКАЗЫ СТРОИТЕЛЬСТВА (RED & YELLOW NODES) ── */}
      {activeTab === 'lots' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <span className="vip-badge-pill">Объект: {currentObject.title}</span>
              <h2>📦 Управление Лотами & Мои Заказы Строительства</h2>
              <p>Публикация тендеров, сбор коммерческих предложений (КП) и выбор аккредитованных подрядчиков</p>
            </div>
            <button
              className="vip-primary-btn"
              onClick={() => {
                setLotTitle(`Лот: СМР для «${currentObject.title}»`);
                setLotBudget(estimate.totalEstimate);
              }}
            >
              ➕ Новый строительный лот
            </button>
          </div>

          {/* Create Lot Form */}
          <div className="vip-lot-create-box">
            <h4>📝 Создание / Редактирование Лота для объекта</h4>
            <form onSubmit={handleCreateLotSubmit} className="lot-form-row">
              <div className="form-group" style={{ flex: '2 1 300px' }}>
                <label>Наименование лота (Тендерной позиции):</label>
                <input
                  type="text"
                  className="vip-input"
                  placeholder="Например: Монтаж монолитного каркаса 1-12 этажи"
                  value={lotTitle}
                  onChange={(e) => setLotTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: '1 1 180px' }}>
                <label>Плановый бюджет (₸):</label>
                <input
                  type="number"
                  className="vip-input"
                  value={lotBudget}
                  onChange={(e) => setLotBudget(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: '1 1 150px' }}>
                <label>Срок подачи КП:</label>
                <input
                  type="date"
                  className="vip-input"
                  value={lotDeadline}
                  onChange={(e) => setLotDeadline(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button type="submit" className="vip-primary-btn" style={{ height: '42px' }}>
                  🚀 Опубликовать в Заказы
                </button>
              </div>
            </form>
          </div>

          {/* Active Lots Table / Feed */}
          <div className="vip-lots-table-box">
            <h3 className="sub-title">Текущие Лоты объекта «{currentObject.title}» ({(currentObject.activeLots || []).length})</h3>

            {(currentObject.activeLots || []).length === 0 ? (
              <div className="empty-lots-state">
                <span>📦</span>
                <p>У данного объекта пока нет сформированных строительных лотов. Создайте лот выше!</p>
              </div>
            ) : (
              <table className="vip-table">
                <thead>
                  <tr>
                    <th>№ Лота</th>
                    <th>Наименование строительного лота</th>
                    <th style={{ textAlign: 'right' }}>Бюджет лота (₸)</th>
                    <th style={{ textAlign: 'center' }}>Статус</th>
                    <th style={{ textAlign: 'center' }}>Откликов КП</th>
                    <th>Срок приема</th>
                    <th style={{ textAlign: 'center' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentObject.activeLots || []).map((lot) => (
                    <tr key={lot.id}>
                      <td><strong>{lot.id}</strong></td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{lot.title}</div>
                        <small style={{ color: '#94a3b8' }}>Лицензия: {currentObject.licenseReq}</small>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#fbbf24' }}>
                        {Number(lot.budget).toLocaleString()} ₸
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`lot-status-pill ${lot.status}`}>
                          {lot.status === 'published' ? '🟢 Опубликован' : '🟡 Черновик'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#38bdf8' }}>{lot.bidsCount} предложений</strong>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{lot.deadline}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="vip-btn-mini"
                            onClick={() => showToast(`📋 Вскрытие предложений по лоту ${lot.id} открыто`)}
                          >
                            👁️ Протокол
                          </button>
                          <button
                            className="vip-btn-mini-del"
                            onClick={() => handleDeleteLot(lot.id)}
                            title="Удалить с черновика"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── 8. TAB 6: ДОКУМЕНТЫ (СМЕТА PDF & ПРОГРЕСС АНАЛИТИКА) ── */}
      {activeTab === 'docs' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <span className="vip-badge-pill">Объект: {currentObject.title}</span>
              <h2>📄 Документооборот: Сметы, КС-2/КС-3 и PDF-Аналитика</h2>
              <p>Официальные формы отчетности для заказчика, банка и государственного технадзора ГАСК</p>
            </div>
          </div>

          <div className="vip-docs-cards-grid">
            {/* Doc Card 1: Local Estimate PDF */}
            <div className="vip-doc-card">
              <div className="d-icon">📑</div>
              <h3>Локальная Смета СНиП РК (PDF / Excel)</h3>
              <p>
                Сводный сметный расчет по нормам ГЭСН 2026: объемы материалов, трудоемкость (чел-часы), спецтехника, накладные расходы и НДС 12%.
              </p>
              <div className="d-meta">
                <span>Объект: {currentObject.title}</span>
                <span>Сумма: <strong>{estimate.totalEstimate.toLocaleString()} ₸</strong></span>
              </div>
              <button
                className="vip-primary-btn"
                onClick={() => showToast(`📥 Смета для "${currentObject.title}" успешно сгенерирована и скачана!`)}
              >
                📥 Скачать Смету (PDF / .xlsx)
              </button>
            </div>

            {/* Doc Card 2: Progress Analytics PDF */}
            <div className="vip-doc-card">
              <div className="d-icon">📊</div>
              <h3>Прогресс PDF Аналитика & График Ганта</h3>
              <p>
                Исполнительная документация: темпы монолитного литья, освоение эскроу-траншей, акты КС-2/КС-3 и план-фактный анализ сроков сдачи.
              </p>
              <div className="d-meta">
                <span>Текущая готовность: <strong>{currentObject.progress}%</strong></span>
                <span>Ответственный: {currentObject.engineer}</span>
              </div>
              <button
                className="vip-primary-btn"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={() => showToast(`📊 Отчет прогресса для "${currentObject.title}" выгружен!`)}
              >
                📥 Скачать Аналитику Прогресса (PDF)
              </button>
            </div>

            {/* Doc Card 3: Construction Diary */}
            <div className="vip-doc-card">
              <div className="d-icon">📘</div>
              <h3>Общий журнал работ (Форма ГАСК)</h3>
              <p>
                Электронный журнал учета выполненных работ с фиксацией погодных условий, прочности бетона на 7/28 сутки и подписями технадзора.
              </p>
              <div className="d-meta">
                <span>Записей в журнале: <strong>142 смены</strong></span>
                <span>Статус: <strong>Ведется ежедневно</strong></span>
              </div>
              <button
                className="vip-secondary-btn"
                onClick={() => showToast('📘 Журнал строительных работ открыт для инспекции')}
              >
                👁️ Открыть Журнал работ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. TAB 7: ДОПУСК КОМПАНИЙ & РЕЕСТР ЛИЦЕНЗИЙ (BLUE NODE) ── */}
      {activeTab === 'contractors' && (
        <div className="vip-content-section">
          <div className="vip-sec-head">
            <div>
              <h2>🛡️ Реестр проверенных подрядчиков & Лицензии ГАСК РК</h2>
              <p>Проверка допуска компаний, валидация БИН по базам eGov/КГД и прямые контакты исполнителей</p>
            </div>
          </div>

          <div className="vip-contractors-grid">
            {ACCREDITED_CONTRACTORS.map((c) => (
              <div key={c.bin} className="contractor-card">
                <div className="c-head">
                  <span className="c-name">{c.name}</span>
                  <span className="c-verified">✅ eGov / ГАСК Проверено</span>
                </div>

                <div className="c-meta-row">
                  <span>БИН: <strong>{c.bin}</strong></span>
                  <span>Лицензия: <strong style={{ color: '#38bdf8' }}>{c.license}</strong></span>
                </div>

                <div className="c-desc">
                  <strong>Специализация:</strong> {c.specialization}
                </div>

                <div className="c-stats-row">
                  <div className="stat">
                    <span>Рейтинг:</span>
                    <strong style={{ color: '#fbbf24' }}>⭐ {c.rating}</strong>
                  </div>
                  <div className="stat">
                    <span>Сдано объектов:</span>
                    <strong>{c.completedProjects} ЖК</strong>
                  </div>
                  <div className="stat">
                    <span>Строителей:</span>
                    <strong>{c.activeBrigades} чел.</strong>
                  </div>
                </div>

                <div className="c-footer">
                  <div className="c-contact-info">
                    <div>📞 {c.contact}</div>
                    <small>✉️ {c.email}</small>
                  </div>
                  <button
                    className="vip-primary-btn"
                    onClick={() => showToast(`📞 Запрос контактов для компании "${c.name}" отправлен!`)}
                  >
                    🤝 Пригласить на объект
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
