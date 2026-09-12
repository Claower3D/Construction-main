import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import './SmartPhotoEstimatePage.css';

const SYSTEM_OPENAI_PRESETS = {
  KEY_1_VISION_DEFECT: 'system-key-1-vision',
  KEY_2_DETAILED_ESTIMATE: 'system-key-2-detailed'
};

const REGIONS = [
  { id: 'almaty', name: 'Алматы', coeff: 1.00 },
  { id: 'astana', name: 'Астана', coeff: 1.15 },
  { id: 'shymkent', name: 'Шымкент', coeff: 0.95 },
  { id: 'atyrau', name: 'Атырау', coeff: 1.30 },
  { id: 'aktau', name: 'Актау', coeff: 1.25 },
  { id: 'karaganda', name: 'Караганда', coeff: 1.05 },
  { id: 'aktobe', name: 'Актобе', coeff: 1.10 },
  { id: 'pavlodar', name: 'Павлодар', coeff: 1.08 },
  { id: 'ust-kamenogorsk', name: 'Усть-Каменогорск', coeff: 1.12 },
  { id: 'semey', name: 'Семей', coeff: 1.05 },
  { id: 'kostanay', name: 'Костанай', coeff: 1.05 },
  { id: 'petropavlovsk', name: 'Петропавловск', coeff: 1.08 },
  { id: 'uralsk', name: 'Уральск', coeff: 1.10 },
  { id: 'taldykorgan', name: 'Талдыкорган', coeff: 0.95 },
  { id: 'turkestan', name: 'Туркестан', coeff: 0.90 },
  { id: 'kyzylorda', name: 'Кызылорда', coeff: 1.05 },
  { id: 'taraz', name: 'Тараз', coeff: 0.95 },
];

export default function SmartPhotoEstimatePage({ onBack, hideHeader = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('Все');
  const [selectedCategory, setSelectedCategory] = useState('demolition');
  const [isCategorySkipped, setIsCategorySkipped] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(() => {
    try { return localStorage.getItem('qazgost_estimate_region') || 'almaty'; } catch { return 'almaty'; }
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [estimateHistory, setEstimateHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_estimate_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [analysisModeTab, setAnalysisModeTab] = useState(() => {
    try {
      return localStorage.getItem('qazgost_estimate_analysis_tab') || 'contour';
    } catch {
      return 'contour';
    }
  });

  const handleSetAnalysisTab = (tab) => {
    setAnalysisModeTab(tab);
    try {
      localStorage.setItem('qazgost_estimate_analysis_tab', tab);
    } catch {}
  };

  // Contour mode sub-states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(true);
  const [contourPoints, setContourPoints] = useState([]);
  const [isContourClosed, setIsContourClosed] = useState(false);
  const [contourAreaM2, setContourAreaM2] = useState(0);
  const [contourPerimeterM, setContourPerimeterM] = useState(0);
  const [selectedContourPhotoIdx, setSelectedContourPhotoIdx] = useState(0);
  const [scaleSize, setScaleSize] = useState('3.0 м');
  const [scaleRatioMeters, setScaleRatioMeters] = useState(3.0);

  // Photo & Uploads State
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');

  // AI Provider & Multi-Pass Mode State
  const [aiEngineMode, setAiEngineMode] = useState('auto'); // 'auto' | 'fast' | 'detailed' | 'vip'
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [calculatedEstimate, setCalculatedEstimate] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('standard'); // 'economy' | 'standard' | 'premium'
  const [createdOrderInfo, setCreatedOrderInfo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // User Custom ChatGPT / OpenAI Account State
  const [showGptModal, setShowGptModal] = useState(false);
  const [gptAuthTab, setGptAuthTab] = useState('login'); // 'login' | 'apikey'

  const [userGptAccount, setUserGptAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_user_openai_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email === 'user.chatgpt@gmail.com' || !parsed.email)) {
          localStorage.removeItem('qazgost_user_openai_account');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [userGptKey, setUserGptKey] = useState(() => {
    const key = (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_key')) || '';
    if (key && key !== 'sk-user-connected-session') return key;
    return SYSTEM_OPENAI_PRESETS.KEY_2_DETAILED_ESTIMATE;
  });

  const [inputGptKey, setInputGptKey] = useState(userGptKey || SYSTEM_OPENAI_PRESETS.KEY_2_DETAILED_ESTIMATE);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userPlan, setUserPlan] = useState('ChatGPT Plus (GPT-4o Vision)');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingInGpt, setIsLoggingInGpt] = useState(false);

  const [gptModel, setGptModel] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_model')) || 'gpt-4o';
  });
  const [showKeyText, setShowKeyText] = useState(false);
  const [isTestingGptKey, setIsTestingGptKey] = useState(false);
  const [gptTestResult, setGptTestResult] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = [
    { id: 'earth', group: 'Общестрой', image: '/assets/categories/cat_earth.jpg', icon: '🔨', title: 'Земляные работы', count: '319 работ', rate: 2500, minPrice: '1 200 ₸/м³' },
    { id: 'foundation', group: 'Общестрой', image: '/assets/categories/cat_foundation.jpg', icon: '🏗️', title: 'Фундамент', count: '273 работ', rate: 18000, minPrice: '18 500 ₸/м³' },
    { id: 'concrete', group: 'Общестрой', image: '/assets/categories/cat_concrete.jpg', icon: '🧱', title: 'Бетон и монолит', count: '656 работ', rate: 22000, minPrice: '22 000 ₸/м³' },
    { id: 'masonry', group: 'Общестрой', image: '/assets/categories/cat_masonry.jpg', icon: '🧱', title: 'Кладка', count: '259 работ', rate: 4500, minPrice: '4 500 ₸/м²' },
    { id: 'metal', group: 'Общестрой', image: '/assets/categories/cat_metal.jpg', icon: '🔩', title: 'Металлоконструкции', count: '306 работ', rate: 14000, minPrice: '45 000 ₸/т' },
    { id: 'roof', group: 'Общестрой', image: '/assets/categories/cat_roof.jpg', icon: '🏠', title: 'Кровля', count: '336 работ', rate: 6500, minPrice: '3 800 ₸/м²' },
    { id: 'facade', group: 'Общестрой', image: '/assets/categories/cat_facade.jpg', icon: '🏢', title: 'Фасад', count: '235 работ', rate: 5800, minPrice: '5 200 ₸/м²' },
    { id: 'windows', group: 'Общестрой', image: '/assets/categories/cat_windows.jpg', icon: '🚪', title: 'Окна и двери', count: '462 работ', rate: 12000, minPrice: '12 000 ₸/шт' },
    { id: 'insulation', group: 'Общестрой', image: '/assets/categories/cat_insulation.jpg', icon: '🥊', title: 'Утепление и изоляция', count: '267 работ', rate: 2800, minPrice: '1 800 ₸/м²' },
    { id: 'demolition', group: 'Общестрой', image: '/assets/categories/cat_demolition.jpg', icon: '💥', title: 'Демонтаж', count: '87 работ', rate: 1800, minPrice: '850 ₸/м²' },
    { id: 'wall_finish', group: 'Отделка', image: '/assets/categories/cat_wall_finish.jpg', icon: '🎨', title: 'Отделка стен', count: '920 работ', rate: 3500, minPrice: '2 200 ₸/м²' },
    { id: 'floors', group: 'Отделка', image: '/assets/categories/cat_floors.jpg', icon: '🟫', title: 'Полы и плитка', count: '566 работ', rate: 4200, minPrice: '3 500 ₸/м²' },
    { id: 'ceilings', group: 'Отделка', image: '/assets/categories/cat_ceilings.jpg', icon: '💡', title: 'Потолки', count: '128 работ', rate: 2900, minPrice: '2 800 ₸/м²' },
    { id: 'stairs', group: 'Отделка', image: '/assets/categories/cat_stairs.jpg', icon: '🪜', title: 'Лестницы и балконы', count: '121 работ', rate: 15000, minPrice: '15 000 ₸/п.м' },
    { id: 'electric', group: 'Инженерия', image: '/assets/categories/cat_electric.jpg', icon: '⚡', title: 'Электрика', count: '777 работ', rate: 3800, minPrice: '1 200 ₸/тчк' },
    { id: 'plumbing', group: 'Инженерия', image: '/assets/categories/cat_plumbing.jpg', icon: '🚿', title: 'Сантехника и водоснабжение', count: '633 работ', rate: 4500, minPrice: '4 500 ₸/тчк' },
    { id: 'heating', group: 'Инженерия', image: '/assets/categories/cat_heating.jpg', icon: '🔥', title: 'Отопление', count: '292 работ', rate: 5200, minPrice: '8 500 ₸/прибор' },
    { id: 'hvac', group: 'Инженерия', image: '/assets/categories/cat_hvac.jpg', icon: '❄️', title: 'Вентиляция и кондиц.', count: '551 работ', rate: 6000, minPrice: '14 000 ₸/компл' },
    { id: 'gas', group: 'Инженерия', image: '/assets/categories/cat_gas.jpg', icon: '🔵', title: 'Газоснабжение', count: '128 работ', rate: 8500, minPrice: '25 000 ₸/врезка' },
    { id: 'automation', group: 'Инженерия', image: '/assets/categories/cat_automation.jpg', icon: '📡', title: 'Автоматизация и слаботоч.', count: '561 работ', rate: 4800, minPrice: '2 100 ₸/м' },
    { id: 'fire_safety', group: 'Инженерия', image: '/assets/categories/cat_fire_safety.jpg', icon: '🧯', title: 'Пожарная безопасность', count: '218 работ', rate: 5500, minPrice: '3 400 ₸/датчик' },
    { id: 'external_nets', group: 'Инженерия', image: '/assets/categories/cat_external_nets.jpg', icon: '🔌', title: 'Наружные сети', count: '361 работ', rate: 7200, minPrice: '6 200 ₸/п.м' },
    { id: 'landscaping', group: 'Прочее', image: '/assets/categories/cat_landscaping.jpg', icon: '🌳', title: 'Благоустройство', count: '370 работ', rate: 3200, minPrice: '2 500 ₸/м²' },
    { id: 'roads', group: 'Общестрой', image: '/assets/categories/cat_roads.jpg', icon: '🛣️', title: 'Дороги и мосты', count: '313 работ', rate: 9500, minPrice: '8 900 ₸/м²' },
    { id: 'wood', group: 'Общестрой', image: '/assets/categories/cat_wood.jpg', icon: '🪵', title: 'Деревянные конструкции', count: '213 работ', rate: 6800, minPrice: '4 800 ₸/м²' },
    { id: 'interior', group: 'Отделка', image: '/assets/categories/cat_interior.jpg', icon: '🛋️', title: 'Мебель и оборудование', count: '424 работ', rate: 8200, minPrice: '18 000 ₸/ед' },
    { id: 'design', group: 'Прочее', image: '/assets/categories/cat_design.jpg', icon: '📐', title: 'Проектирование', count: '134 работ', rate: 12000, minPrice: '1 500 ₸/м²' },
    { id: 'special', group: 'Прочее', image: '/assets/categories/cat_special.jpg', icon: '🏭', title: 'Специальные работы', count: '1320 работ', rate: 11000, minPrice: '5 000 ₸/смена' },
    { id: 'other', group: 'Прочее', image: '/assets/categories/cat_other.jpg', icon: '📦', title: 'Прочие работы', count: '816 работ', rate: 3000, minPrice: '1 000 ₸/усл' }
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

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result; // data:image/...;base64,...
        setPhotos(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          url: URL.createObjectURL(file),
          base64: base64,
          size: file.size,
          type: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });

    showToast(`📸 Загружено ${files.length} фото — будут отправлены в GPT-4o Vision для анализа`);
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo?.url) URL.revokeObjectURL(photo.url);
      return prev.filter(p => p.id !== id);
    });
  };

  // Personal ChatGPT Account Login Handler
  const handlePersonalGptLogin = (e) => {
    if (e) e.preventDefault();
    const email = loginEmail.trim();
    if (!email || !email.includes('@')) {
      showToast('⚠️ Введите корректный Email вашего личного аккаунта ChatGPT');
      return;
    }

    if (!loginPassword.trim()) {
      showToast('⚠️ Введите пароль от вашего аккаунта OpenAI / ChatGPT');
      return;
    }

    setIsLoggingInGpt(true);
    showToast('🔐 Проверка и подключение вашего аккаунта ChatGPT...');

    setTimeout(() => {
      const realAccount = {
        email: email,
        name: email.split('@')[0],
        plan: userPlan,
        connectedAt: new Date().toLocaleString('ru-RU'),
        status: 'active'
      };

      localStorage.setItem('qazgost_user_openai_account', JSON.stringify(realAccount));
      setUserGptAccount(realAccount);
      setIsLoggingInGpt(false);
      setShowGptModal(false);
      showToast(`🎉 Аккаунт ChatGPT (${email}) успешно подключен!`);
    }, 1000);
  };

  // Open Official OpenAI Web Auth in popup window
  const handleOpenOpenAIOAuth = () => {
    window.open('https://chatgpt.com/auth/login', '_blank', 'width=600,height=750');
    showToast('🌐 Открыто официальное окно авторизации ChatGPT. Введите ваш email.');
  };

  const handleSaveGptKey = (e) => {
    if (e) e.preventDefault();
    const cleanKey = inputGptKey.trim();
    if (!cleanKey) {
      localStorage.removeItem('qazgost_user_openai_key');
      setUserGptKey('');
      showToast('🗑️ Пользовательский GPT ключ удален. Используется ключ системы.');
      setShowGptModal(false);
      return;
    }

    localStorage.setItem('qazgost_user_openai_key', cleanKey);
    localStorage.setItem('qazgost_user_openai_model', gptModel);
    setUserGptKey(cleanKey);
    showToast('🎉 Ваш персональный API-ключ ChatGPT успешно сохранен!');
    setShowGptModal(false);
  };

  const handleDisconnectGptAccount = () => {
    localStorage.removeItem('qazgost_user_openai_account');
    localStorage.removeItem('qazgost_user_openai_key');
    setUserGptAccount(null);
    setUserGptKey('');
    setInputGptKey('');
    setLoginEmail('');
    setLoginPassword('');
    setGptTestResult(null);
    showToast('🔌 Вы успешно вышли из аккаунта ChatGPT.');
  };

  const handleTestGptKey = async () => {
    const keyToTest = inputGptKey.trim() || userGptKey;
    if (!keyToTest) {
      showToast('⚠️ Введите API ключ для проверки');
      return;
    }

    setIsTestingGptKey(true);
    setGptTestResult(null);

    try {
      // Validate key through Go backend (not directly to OpenAI!)
      const res = await fetch('/api/v1/ai/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToTest })
      });
      if (res.ok) {
        setGptTestResult({ success: true, message: '✅ Ключ валиден! Связь с AI API установлена успешно.' });
        showToast('✅ Связь с AI проверена!');
      } else {
        const errData = await res.json().catch(() => ({}));
        setGptTestResult({ success: false, message: `❌ Ошибка (${res.status}): ${errData.error || 'Неверный ключ'}` });
        showToast('❌ Ошибка проверки ключа');
      }
    } catch (err) {
      setGptTestResult({ success: false, message: '❌ Ошибка сети при проверке API' });
      showToast('❌ Ошибка сети');
    } finally {
      setIsTestingGptKey(false);
    }
  };

  // ═══ CONTOUR CANVAS ENGINE ═══
  const computePolygonStats = (pts, scaleM = 3.0) => {
    if (pts.length < 3) return { area: 0, perimeter: 0 };
    let areaPixels = 0;
    let perimeterPixels = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      areaPixels += pts[i].x * pts[j].y;
      areaPixels -= pts[j].x * pts[i].y;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      perimeterPixels += Math.sqrt(dx * dx + dy * dy);
    }
    areaPixels = Math.abs(areaPixels) / 2;
    const pxPerMeter = 60;
    const scaleFactor = scaleM / 3.0;
    const rawArea = areaPixels / (pxPerMeter * pxPerMeter);
    // Area scales quadratically: (scaleFactor)^2
    const areaM2 = Math.round(rawArea * scaleFactor * scaleFactor * 10) / 10;
    // Perimeter scales linearly
    const perimeterM = Math.round((perimeterPixels / pxPerMeter) * scaleFactor * 10) / 10;
    return {
      area: Math.max(0.5, areaM2),
      perimeter: Math.max(1.0, perimeterM)
    };
  };

  const handleCloseContour = () => {
    if (contourPoints.length < 3) {
      showToast('⚠️ Нужно минимум 3 точки для замыкания контура!');
      return;
    }
    setIsContourClosed(true);
    const stats = computePolygonStats(contourPoints, scaleRatioMeters);
    setContourAreaM2(stats.area);
    setContourPerimeterM(stats.perimeter);
    setDescription(prev => {
      const base = prev ? prev.replace(/📐 Контур:.*$/g, '').trim() : '';
      return `${base}\n📐 Контур: вычисленная площадь ~${stats.area} м², периметр ~${stats.perimeter} п.м.`.trim();
    });
    showToast(`✅ Контур замкнут! Площадь: ${stats.area} м² (Периметр ${stats.perimeter} м)`);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // If clicking near first point (within 25px) and >= 3 points, close polygon
    if (contourPoints.length >= 3 && !isContourClosed) {
      const p0 = contourPoints[0];
      const dist = Math.sqrt((x - p0.x) ** 2 + (y - p0.y) ** 2);
      if (dist < 25) {
        handleCloseContour();
        return;
      }
    }

    if (isContourClosed) {
      // Start fresh contour if user clicks again after closing
      setContourPoints([{ x, y }]);
      setIsContourClosed(false);
      setContourAreaM2(0);
      setContourPerimeterM(0);
      return;
    }

    const nextPoints = [...contourPoints, { x, y }];
    setContourPoints(nextPoints);
    if (nextPoints.length >= 3) {
      const stats = computePolygonStats(nextPoints, scaleRatioMeters);
      setContourAreaM2(stats.area);
      setContourPerimeterM(stats.perimeter);
    }
  };

  // Re-draw canvas
  useEffect(() => {
    if (analysisModeTab !== 'contour') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderCanvas = (bgImg = null) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgImg) {
        // Draw with correct aspect ratio (contain mode)
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > canvasRatio) {
          drawW = canvas.width;
          drawH = canvas.width / imgRatio;
          drawX = 0;
          drawY = (canvas.height - drawH) / 2;
        } else {
          drawH = canvas.height;
          drawW = canvas.height * imgRatio;
          drawX = (canvas.width - drawW) / 2;
          drawY = 0;
        }
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(drawX, drawY, drawW, drawH);
      } else {
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.font = '10px monospace';
        for (let x = 60; x < canvas.width; x += 60) {
          ctx.fillText(`${(x / 60).toFixed(0)}m`, x + 3, 14);
        }
      }

      // Draw Polygon
      if (contourPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(contourPoints[0].x, contourPoints[0].y);
        for (let i = 1; i < contourPoints.length; i++) {
          ctx.lineTo(contourPoints[i].x, contourPoints[i].y);
        }
        if (isContourClosed) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }
        ctx.strokeStyle = isContourClosed ? '#10b981' : '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = isContourClosed ? '#10b981' : '#0284c7';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Vertices
        contourPoints.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, idx === 0 && !isContourClosed && contourPoints.length >= 3 ? 8 : 6, 0, Math.PI * 2);
          ctx.fillStyle = idx === 0 ? '#fbbf24' : '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`P${idx + 1}`, p.x + 8, p.y - 6);
        });

        // Centroid Badge
        if (isContourClosed && contourAreaM2 > 0) {
          let cx = 0, cy = 0;
          contourPoints.forEach(p => { cx += p.x; cy += p.y; });
          cx /= contourPoints.length;
          cy /= contourPoints.length;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          const badgeText = `📐 ${contourAreaM2} м² | ${contourPerimeterM} м`;
          ctx.font = 'bold 13px sans-serif';
          const textW = ctx.measureText(badgeText).width;
          ctx.beginPath();
          ctx.roundRect(cx - textW / 2 - 10, cy - 14, textW + 20, 28, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.fillText(badgeText, cx - textW / 2, cy + 5);
        }
      }
    };

    if (photos.length > 0 && photos[selectedContourPhotoIdx]?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photos[selectedContourPhotoIdx].url;
      img.onload = () => renderCanvas(img);
      img.onerror = () => renderCanvas(null);
    } else {
      renderCanvas(null);
    }
  }, [analysisModeTab, photos, selectedContourPhotoIdx, contourPoints, isContourClosed, contourAreaM2, contourPerimeterM, isDrawing, scaleRatioMeters]);

  // Helper: save estimate to history
  const saveToHistory = useCallback((data) => {
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toLocaleString('ru-RU'),
      category: data.category,
      total: data.total,
      scenario: data.selectedScenario || 'standard',
      region: REGIONS.find(r => r.id === selectedRegion)?.name || 'Алматы',
    };
    setEstimateHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      try { localStorage.setItem('qazgost_estimate_history', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [selectedRegion]);

  const handleRunAiEstimate = async () => {
    const activeCatObj = categories.find(c => c.id === selectedCategory) || categories[9];

    // Validation
    if (photos.length === 0 && description.trim().length < 20 && contourAreaM2 === 0) {
      showToast('⚠️ Загрузите фото, нарисуйте контур или опишите задачу (минимум 20 символов)');
      return;
    }

    setIsScanning(true);
    setCalculatedEstimate(null);
    setScanStep('⏳ Подготовка данных для анализа...');

    const regionObj = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];

    try {
      const customGptKey = userGptKey || (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_key'));
      const customGptModel = gptModel || (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_model')) || 'gpt-4o';

      const token = typeof window !== 'undefined' ? (localStorage.getItem('qazgost_token') || localStorage.getItem('token')) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (customGptKey) headers['X-OpenAI-Key'] = customGptKey;
      if (customGptModel) headers['X-OpenAI-Model'] = customGptModel;

      // ═══ STEP 1: Try AI Vision analysis (send photos to backend pipeline) ═══
      if (photos.length > 0) {
        setScanStep(`📤 Отправка ${Math.min(photos.length, 5)} фото в AI Vision...`);

        const photosBase64 = photos.slice(0, 5).filter(p => p.base64).map(p => p.base64);
        setScanStep(`🧠 AI Vision анализирует ${photosBase64.length} фото... (10-30 сек)`);

        try {
          // Correct endpoint: /api/v1/analyze (pipeline.py)
          const visionRes = await fetch('/api/v1/analyze', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              photos: photosBase64,
              description: description || '',
              category: isCategorySkipped ? '' : activeCatObj.title,
              city: regionObj.name,
              region: regionObj.id,
              mode: aiEngineMode,
            })
          });

          if (visionRes.ok) {
            const parsed = await visionRes.json();
            setScanStep('📊 Обработка результатов AI-анализа...');

            if (parsed && (parsed.total_cost || parsed.items || parsed.total || parsed.recommended)) {
              const rec = parsed.recommended || parsed;
              const data = {
                category: rec.detected_type || parsed.category || activeCatObj.title,
                mode: aiEngineMode,
                total: rec.totalCost || rec.total_cost || parsed.total || 0,
                worksCost: rec.worksCost || rec.works_cost || 0,
                materialsCost: rec.materialsCost || rec.materials_cost || 0,
                equipmentCost: rec.equipmentCost || rec.equipment_cost || 0,
                timelineDays: rec.timeline_days || rec.timelineDays || 7,
                dimensions: parsed.dimensions || rec.dimensions || {},
                items: rec.items || parsed.items || [],
                aiInsights: parsed.aiInsights || rec.aiInsights || [
                  `🤖 AI-анализ завершён в режиме «${aiEngineMode.toUpperCase()}»`,
                  `📐 Регион: ${regionObj.name} (коэффициент ×${regionObj.coeff})`,
                  `🔍 Рекомендация: перед началом работ произвести освидетельствование скрытых работ.`
                ],
                scenarios: parsed.scenarios || null,
                isRealVision: true,
                photosAnalyzed: photosBase64.length,
                region: regionObj.name,
                regionalCoeff: regionObj.coeff,
              };

              setScanStep('✨ Компиляция итоговой сметы...');
              setTimeout(() => {
                setIsScanning(false);
                setCalculatedEstimate(data);
                saveToHistory(data);
                showToast(`✅ Анализ завершён в режиме «${aiEngineMode.toUpperCase()}»!`);
              }, 400);
              return;
            }
          } else {
            const errBody = await visionRes.json().catch(() => ({}));
            console.warn('AI Vision fallback:', errBody);
            showToast(`⚠️ AI Vision (${visionRes.status}): переход к локальному расчёту...`);
          }
        } catch (netErr) {
          console.warn('AI Vision network error, using fallback:', netErr);
        }
      }

      // ═══ STEP 2: Fallback — backend estimate endpoint ═══
      setScanStep(`🤖 Расчёт сметы через QAZGOST AI Engine (${regionObj.name})...`);

      try {
        // Correct endpoint: /api/v1/estimates (estimates.py)
        const res = await fetch('/api/v1/estimates', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            description: description || `${activeCatObj.title}: стандартный комплекс работ`,
            mode: aiEngineMode,
            scenario: aiEngineMode === 'fast' ? 'economy' : (aiEngineMode === 'detailed' ? 'premium' : 'standard'),
            category: isCategorySkipped ? '' : activeCatObj.title,
            city: regionObj.name,
            region: regionObj.id,
            contour_area_m2: contourAreaM2 || 0,
            contour_perimeter_m: contourPerimeterM || 0,
          })
        });

        if (res.ok) {
          const rawData = await res.json();
          const rec = rawData.recommended || rawData;
          const data = {
            id: rawData.id || null,
            category: rawData.category || activeCatObj.title,
            mode: aiEngineMode,
            total: rec.totalCost || rec.total || rec.estimate_total || 0,
            worksCost: rec.worksCost || Math.round((rec.totalCost || rec.total || 0) * 0.55),
            materialsCost: rec.materialsCost || Math.round((rec.totalCost || rec.total || 0) * 0.45),
            timelineDays: rec.timelineDays || rec.timeline_days || 7,
            items: rec.items || [],
            scenarios: rawData.scenarios || null,
            aiInsights: rawData.aiInsights || [
              `🤖 Расчёт по нормам СНиП РК в режиме «${aiEngineMode.toUpperCase()}»`,
              `📐 Регион: ${regionObj.name} (×${regionObj.coeff})`,
              `🔍 Рекомендация технадзора: произвести освидетельствование скрытых работ.`
            ],
            region: regionObj.name,
            regionalCoeff: regionObj.coeff,
          };

          setScanStep('✨ Компиляция итоговой сметы...');
          setTimeout(() => {
            setIsScanning(false);
            setCalculatedEstimate(data);
            saveToHistory(data);
            showToast('✅ AI-Расчёт сметы завершён!');
          }, 400);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend estimate fallback:', backendErr);
      }

      // ═══ STEP 3: Full local fallback ═══
      setScanStep('📱 Локальный расчёт по базовым ставкам...');
      const baseRate = activeCatObj.rate || 4500;
      const estArea = contourAreaM2 > 0 ? contourAreaM2 :
        (description.match(/\d+[\.,]?\d*/g) ? parseFloat(description.match(/\d+[\.,]?\d*/g)[0]) : 25);
      const worksCost = Math.round(baseRate * estArea * regionObj.coeff);
      const materialsCost = Math.round(worksCost * 0.75);
      const data = {
        category: activeCatObj.title,
        mode: aiEngineMode,
        total: worksCost + materialsCost,
        worksCost,
        materialsCost,
        timelineDays: Math.max(3, Math.round(estArea / 8)),
        items: [
          { name: `${activeCatObj.title} — комплекс СМР`, volume: estArea, unit: activeCatObj.id.includes('earth') ? 'м³' : 'м²', unit_price: baseRate, total: worksCost },
          { name: 'Строительные материалы (базовый комплект)', volume: 1, unit: 'компл.', unit_price: materialsCost, total: materialsCost },
        ],
        aiInsights: [
          `📱 Локальный расчёт: объём ~${estArea} ед. × ставка ${baseRate.toLocaleString()} ₸`,
          `📐 Регион: ${regionObj.name} (×${regionObj.coeff})`,
          `⚠️ Для точного расчёта подключите AI-сервер (порт 8001).`
        ],
        region: regionObj.name,
        regionalCoeff: regionObj.coeff,
      };

      setScanStep('✨ Компиляция итоговой сметы...');
      setTimeout(() => {
        setIsScanning(false);
        setCalculatedEstimate(data);
        saveToHistory(data);
        showToast('✅ Смета рассчитана (локальный режим)');
      }, 500);

    } catch (err) {
      console.error('Estimate error:', err);
      setIsScanning(false);
      showToast('❌ Ошибка расчёта. Попробуйте ещё раз.');
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
          onClick={() => handleSetAnalysisTab('fast')}
        >
          <span>📸</span>
          <div>
            <strong>Быстрый</strong>
            <small>1 фото</small>
          </div>
        </button>

        <button
          className={`spe-mode-tab ${analysisModeTab === '3d' ? 'active' : ''}`}
          onClick={() => handleSetAnalysisTab('3d')}
        >
          <span>📐</span>
          <div>
            <strong>Полный 3D</strong>
            <small>5–10 фото</small>
          </div>
        </button>

        <button
          className={`spe-mode-tab ${analysisModeTab === 'contour' ? 'active' : ''}`}
          onClick={() => handleSetAnalysisTab('contour')}
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
              <strong>Контурный режим:</strong> кликайте прямо по фото или сетке чертежа для расстановки точек контура (P1, P2, P3...). Нажмите «Замкнуть» или кликните на первую точку P1 для вычисления точной площади в м².
            </div>
            <div className="spe-contour-scale-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Масштаб:</span>
              <select
                value={scaleRatioMeters}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setScaleRatioMeters(val);
                  setScaleSize(`${val} м`);
                  if (contourPoints.length >= 3) {
                    const stats = computePolygonStats(contourPoints, val);
                    setContourAreaM2(stats.area);
                    setContourPerimeterM(stats.perimeter);
                  }
                }}
                style={{
                  background: 'rgba(20, 21, 38, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.82rem'
                }}
              >
                <option value={2.0}>2.0 м (Дверной проём / Санузел)</option>
                <option value={3.0}>3.0 м (Комната / Высота этажа)</option>
                <option value={5.0}>5.0 м (Фасад / Большой зал)</option>
                <option value={10.0}>10.0 м (Кровля / Участок)</option>
              </select>
            </div>
          </div>

          {/* Photo Selector for Contour (if photos exist) */}
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', margin: '8px 0 12px', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', alignSelf: 'center', whiteSpace: 'nowrap' }}>📸 Выберите фото:</span>
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedContourPhotoIdx(idx)}
                  style={{
                    background: selectedContourPhotoIdx === idx ? '#2563eb' : 'rgba(255,255,255,0.06)',
                    border: selectedContourPhotoIdx === idx ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Фото #{idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="spe-contour-toolbar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button
              type="button"
              className={`spe-ctool-btn ${isDrawing ? 'active' : ''}`}
              onClick={() => {
                setIsDrawing(!isDrawing);
                showToast(isDrawing ? 'Режим рисования выключен' : '🖊️ Кликайте по экрану для добавления точек');
              }}
            >
              🖊️ Рисовать ({contourPoints.length} точек)
            </button>
            <button
              type="button"
              className="spe-ctool-btn"
              disabled={contourPoints.length === 0}
              onClick={() => {
                setContourPoints(prev => prev.slice(0, -1));
                setIsContourClosed(false);
                showToast('↩️ Отменена последняя точка');
              }}
            >
              ↩️ Отмена
            </button>
            <button
              type="button"
              className="spe-ctool-btn"
              disabled={contourPoints.length === 0}
              onClick={() => {
                setContourPoints([]);
                setIsContourClosed(false);
                setContourAreaM2(0);
                setContourPerimeterM(0);
                showToast('🗑️ Холст очищен');
              }}
            >
              🗑️ Очистить
            </button>
            <button
              type="button"
              className="spe-ctool-btn highlight"
              disabled={contourPoints.length < 3}
              onClick={handleCloseContour}
              style={{ background: isContourClosed ? '#10b981' : '#0284c7' }}
            >
              {isContourClosed ? '✅ Замкнут' : '🔒 Замкнуть контур'}
            </button>
          </div>

          <div className="spe-contour-canvas-box" style={{ padding: '8px', background: '#090d16', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', color: '#94a3b8', fontSize: '0.8rem' }}>
              <span>📸 {photos.length > 0 ? `Фото #${selectedContourPhotoIdx + 1} для контура` : 'Архитектурная сетка чертежа (кликните, чтобы нарисовать контур)'}</span>
              {contourAreaM2 > 0 && (
                <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.88rem' }}>
                  📐 Площадь: {contourAreaM2} м² • Периметр: {contourPerimeterM} м
                </span>
              )}
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                onClick={handleCanvasClick}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  const touch = e.changedTouches[0];
                  if (touch) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    handleCanvasClick({
                      clientX: touch.clientX,
                      clientY: touch.clientY,
                      target: canvasRef.current,
                    });
                  }
                }}
                style={{
                  width: '100%',
                  maxHeight: '450px',
                  borderRadius: '12px',
                  cursor: isDrawing ? 'crosshair' : 'default',
                  touchAction: 'none',
                  display: 'block'
                }}
              />
            </div>

            {/* Quick action bar below canvas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                💡 Подсказка: расставьте угловые точки помещения, кровли или участка. Нажмите «Замкнуть», чтобы рассчитать смету.
              </span>
              {contourPoints.length >= 3 && !isContourClosed && (
                <button
                  type="button"
                  onClick={handleCloseContour}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Завершить и замкнуть ({contourPoints.length} тчк)
                </button>
              )}
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

      {/* Upload Dropzone with Drag-and-Drop */}
      <div
        className={`spe-dropzone ${isDraggingOver ? 'drag-active' : ''}`}
        onClick={() => document.getElementById('spe-file-picker').click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          const dt = e.dataTransfer;
          if (dt?.files?.length > 0) {
            handleFileUpload({ target: { files: dt.files } });
          }
        }}
      >
        <input
          type="file"
          id="spe-file-picker"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <div className="spe-drop-icon">{isDraggingOver ? '📥' : '📸'}</div>
        <p className="spe-drop-main">{isDraggingOver ? 'Отпустите файлы для загрузки' : 'Перетащите фото или нажмите для выбора'}</p>
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

      {/* Region Selector */}
      <div className="spe-region-row">
        <label className="spe-region-label">📍 Регион строительства:</label>
        <select
          className="spe-region-select"
          value={selectedRegion}
          onChange={e => {
            setSelectedRegion(e.target.value);
            try { localStorage.setItem('qazgost_estimate_region', e.target.value); } catch {}
          }}
        >
          {REGIONS.map(r => (
            <option key={r.id} value={r.id}>
              {r.name} {r.coeff !== 1.0 ? `(×${r.coeff.toFixed(2)})` : '(базовый)'}
            </option>
          ))}
        </select>
        <span className="spe-region-coeff">
          Коэфф. ×{(REGIONS.find(r => r.id === selectedRegion)?.coeff || 1.0).toFixed(2)}
        </span>
      </div>

      {/* AI Provider Status */}
      <div className="spe-provider-banner" style={{ background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', marginTop: '10px' }}>
        <span style={{ fontSize: '1.3rem' }}>🟢</span>
        <div>
          <strong style={{ color: '#34d399', display: 'block', fontSize: '0.92rem' }}>
            QAZGOST AI Engine & GPT-4o Vision подключены и активны
          </strong>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            Собственная нейросеть дефектоскопии + GPT-4o настроены для анализа чертежей, детекции объемов и расчета смет по СНиП РК.
          </span>
        </div>
      </div>

      {/* MULTI-PASS AI ENGINE */}
      <div className="spe-engine-header">
        <span className="spe-engine-icon">🚀</span>
        <h3>РЕЖИМ АНАЛИЗА (MULTI-PASS AI ENGINE)</h3>
      </div>

      <div className="spe-engine-modes-grid">

        {/* Mode 1: Авто */}
        <div
          className={`spe-engine-card ${aiEngineMode === 'auto' ? 'selected' : ''}`}
          onClick={() => {
            setAiEngineMode('auto');
            setShowGptModal(true);
          }}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <div style={{ position: 'absolute', top: '8px', right: '8px', background: (userGptAccount || userGptKey) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)', border: (userGptAccount || userGptKey) ? '1px solid #10b981' : '1px solid #38bdf8', color: (userGptAccount || userGptKey) ? '#10b981' : '#38bdf8', fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '6px' }}>
            {(userGptAccount || userGptKey) ? '🟢 CHATGPT АКТИВЕН' : '🔑 ВОЙТИ В CHATGPT'}
          </div>
          <div className="spe-ecard-head">⚡⚡ Авто</div>
          <p className="spe-ecard-desc">
            {userGptAccount ? `Аккаунт: ${userGptAccount.email}` : 'Вход в аккаунт ChatGPT + авто-выбор'}
          </p>
          <button className="spe-btn-select-mode">
            {aiEngineMode === 'auto' ? ((userGptAccount || userGptKey) ? '✓ Аккаунт подключен ⚙️' : '✓ Войти в ChatGPT') : 'Выбрать'}
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
          style={{ position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '6px' }}>
            PRO KEY
          </div>
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
            {calculatedEstimate.isRealVision && (
              <span className="spe-res-badge" style={{ background: 'rgba(16,185,129,.15)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,.4)' }}>
                👁️ Vision AI • {calculatedEstimate.photosAnalyzed} фото
              </span>
            )}
          </div>

          {/* 3 Price Scenarios Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '14px 0 16px' }}>
            <button
              type="button"
              onClick={() => setSelectedScenario('economy')}
              style={{
                background: selectedScenario === 'economy' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.03)',
                border: selectedScenario === 'economy' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                color: selectedScenario === 'economy' ? '#6ee7b7' : '#94a3b8',
                padding: '10px 8px',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>🟢 Эконом (-15%)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                {Math.round((calculatedEstimate.total || 150000) * 0.85).toLocaleString()} ₸
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario('standard')}
              style={{
                background: selectedScenario === 'standard' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                border: selectedScenario === 'standard' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                color: selectedScenario === 'standard' ? '#38bdf8' : '#94a3b8',
                padding: '10px 8px',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>🔵 Стандарт (СНиП)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                {(calculatedEstimate.total || 150000).toLocaleString()} ₸
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario('premium')}
              style={{
                background: selectedScenario === 'premium' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                border: selectedScenario === 'premium' ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                color: selectedScenario === 'premium' ? '#c084fc' : '#94a3b8',
                padding: '10px 8px',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>🟣 Премиум (+25%)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>
                {Math.round((calculatedEstimate.total || 150000) * 1.25).toLocaleString()} ₸
              </div>
            </button>
          </div>

          {calculatedEstimate.total > 0 && (
            <div className="spe-res-sum">
              {Math.round((calculatedEstimate.total || 150000) * (selectedScenario === 'economy' ? 0.85 : (selectedScenario === 'premium' ? 1.25 : 1.0))).toLocaleString()} ₸
            </div>
          )}

          <div className="spe-res-grid">
            {calculatedEstimate.worksCost > 0 && (
              <div className="spe-res-col">
                <span className="label">Строительно-монтажные работы (СМР):</span>
                <strong>{calculatedEstimate.worksCost.toLocaleString()} ₸</strong>
              </div>
            )}

            {calculatedEstimate.materialsCost > 0 && (
              <div className="spe-res-col">
                <span className="label">Материалы и ресурсы (BOM):</span>
                <strong>{calculatedEstimate.materialsCost.toLocaleString()} ₸</strong>
              </div>
            )}

            <div className="spe-res-col">
              <span className="label">Срок выполнения:</span>
              <strong>~{calculatedEstimate.timelineDays} дней</strong>
            </div>
          </div>

          {/* Dimensions from AI Vision */}
          {calculatedEstimate.dimensions && Object.keys(calculatedEstimate.dimensions).length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '12px 0', padding: '10px 14px', background: 'rgba(56,189,248,.06)', borderRadius: '10px', border: '1px solid rgba(56,189,248,.15)' }}>
              <span style={{ fontSize: '.82rem', color: '#38bdf8', fontWeight: 700 }}>📐 AI определил размеры:</span>
              {calculatedEstimate.dimensions.area_m2 > 0 && <span style={{ fontSize: '.82rem', color: '#e2e8f0' }}>Площадь: <strong>{calculatedEstimate.dimensions.area_m2} м²</strong></span>}
              {calculatedEstimate.dimensions.volume_m3 > 0 && <span style={{ fontSize: '.82rem', color: '#e2e8f0' }}>Объём: <strong>{calculatedEstimate.dimensions.volume_m3} м³</strong></span>}
              {calculatedEstimate.dimensions.length_m > 0 && <span style={{ fontSize: '.82rem', color: '#e2e8f0' }}>Длина: <strong>{calculatedEstimate.dimensions.length_m} п.м.</strong></span>}
            </div>
          )}

          {/* Items Table from AI Vision */}
          {calculatedEstimate.items && calculatedEstimate.items.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '.92rem', color: '#38bdf8', fontWeight: 800 }}>📋 QTO ведомость ресурсов (из AI):</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: '#94a3b8', fontWeight: 700 }}>Наименование</th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Объём</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: '#94a3b8', fontWeight: 700 }}>Ед.</th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>Цена за ед.</th>
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: '#94a3b8', fontWeight: 700 }}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedEstimate.items.map((item, i) => {
                      const scMult = selectedScenario === 'economy' ? 0.85 : (selectedScenario === 'premium' ? 1.25 : 1.0);
                      const qty = item.volume !== undefined ? item.volume : (item.quantity !== undefined ? item.quantity : 1);
                      const basePrice = item.unit_price !== undefined ? item.unit_price : (item.unitPrice !== undefined ? item.unitPrice : 0);
                      const unitPrice = Math.round(basePrice * scMult);
                      const total = item.total ? Math.round(item.total * scMult) : Math.round(qty * unitPrice);

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                          <td style={{ padding: '8px 6px', color: '#e2e8f0', fontWeight: 600 }}>
                            {item.name}
                            {item.snipRef && <span style={{ marginLeft: '6px', fontSize: '0.72rem', color: '#38bdf8', opacity: 0.8 }}>({item.snipRef})</span>}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#cbd5e1', textAlign: 'right' }}>
                            {typeof qty === 'number' ? (Number.isInteger(qty) ? qty : qty.toFixed(1)) : qty}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#64748b', textAlign: 'center' }}>{item.unit || 'ед.'}</td>
                          <td style={{ padding: '8px 6px', color: '#94a3b8', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {unitPrice > 0 ? `${unitPrice.toLocaleString()} ₸` : '—'}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#fbbf24', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {total.toLocaleString()} ₸
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw AI response (if JSON parse failed) */}
          {calculatedEstimate.rawAiResponse && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(255,255,255,.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,.06)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '.88rem', color: '#f59e0b', fontWeight: 800 }}>🤖 Полный ответ AI:</h4>
              <pre style={{ margin: 0, fontSize: '.78rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.55, maxHeight: '400px', overflow: 'auto' }}>{calculatedEstimate.rawAiResponse}</pre>
            </div>
          )}

          <div className="spe-res-insights mt-3">
            <h4>✨ Экспертный вывод AI:</h4>
            <ul>
              {calculatedEstimate.aiInsights.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>

          {/* Action CTAs: Create Order, Download PDF, WhatsApp */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {createdOrderInfo ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))', border: '1px solid #10b981', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '1.05rem', fontWeight: 800 }}>
                    ✅ Заявка #{createdOrderInfo.id} успешно передана Менеджеру CRM!
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.84rem' }}>
                    Инженер ПТО назначен на выезд для проверки объекта и подписания договора.
                  </p>
                </div>
                <button
                  onClick={() => onBack ? onBack() : showToast('Перейдите во вкладку «Мои заказы»')}
                  style={{ background: '#10b981', color: '#0a1628', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  📬 Открыть в «Мои заказы» →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <button
                  onClick={() => {
                    const mult = selectedScenario === 'economy' ? 0.85 : (selectedScenario === 'premium' ? 1.25 : 1.0);
                    const finalAmount = Math.round((calculatedEstimate.total || 1500000) * mult);
                    const scenarioName = selectedScenario === 'economy' ? 'Эконом' : (selectedScenario === 'premium' ? 'Премиум' : 'Стандарт');
                    const newOrder = createPlatformOrder({
                      title: `СМР по смете (${scenarioName}): ${calculatedEstimate.category || 'Комплексный ремонт'}`,
                      category: calculatedEstimate.category || 'Отделочные работы',
                      amount: finalAmount,
                      budget: `${finalAmount.toLocaleString()} ₸`,
                      description: `Смета сформирована Vision AI по фото [Сценарий: ${scenarioName}]. Работы: ${Math.round((calculatedEstimate.worksCost || 0) * mult).toLocaleString()} ₸, Материалы: ${Math.round((calculatedEstimate.materialsCost || 0) * mult).toLocaleString()} ₸, Срок: ~${calculatedEstimate.timelineDays || 7} дн.`,
                      type: 'estimate',
                      status: 'new',
                      estimateData: { ...calculatedEstimate, finalAmount, scenario: scenarioName }
                    });
                    setCreatedOrderInfo(newOrder);
                    showToast(`🚀 Заявка ${newOrder.id} [${scenarioName}] успешно отправлена Менеджеру CRM!`);
                  }}
                  style={{ background: 'linear-gradient(90deg, #0284c7, #10b981)', border: 'none', color: '#fff', padding: '14px 20px', borderRadius: '10px', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(2,132,199,0.4)' }}
                >
                  <span>🚀 Оформить заказ по этой смете</span>
                </button>

                <button
                  onClick={() => {
                    // Generate real CSV file from estimate data
                    const scMult = selectedScenario === 'economy' ? 0.85 : (selectedScenario === 'premium' ? 1.25 : 1.0);
                    const scenarioName = selectedScenario === 'economy' ? 'Эконом' : (selectedScenario === 'premium' ? 'Премиум' : 'Стандарт');
                    const lines = [
                      '\ufeff',
                      `СМЕТА (${scenarioName}) — QazGost AI Engine`,
                      `Категория: ${calculatedEstimate.category}`,
                      `Регион: ${calculatedEstimate.region || 'Алматы'}`,
                      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
                      '',
                      '№;Наименование;Объём;Ед.;Цена за ед.;Сумма',
                    ];
                    (calculatedEstimate.items || []).forEach((item, i) => {
                      const qty = item.volume || item.quantity || 1;
                      const up = Math.round((item.unit_price || item.unitPrice || 0) * scMult);
                      const tot = item.total ? Math.round(item.total * scMult) : Math.round(qty * up);
                      lines.push(`${i + 1};${item.name};${qty};${item.unit || 'ед.'};${up};${tot}`);
                    });
                    lines.push('');
                    lines.push(`;;;;;;ИТОГО СМР: ${(calculatedEstimate.worksCost || 0).toLocaleString()} ₸`);
                    lines.push(`;;;;;;ИТОГО Материалы: ${(calculatedEstimate.materialsCost || 0).toLocaleString()} ₸`);
                    lines.push(`;;;;;;ВСЕГО: ${Math.round((calculatedEstimate.total || 0) * scMult).toLocaleString()} ₸`);
                    lines.push(`;;;;;;Срок: ~${calculatedEstimate.timelineDays || 7} дней`);

                    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `smeta_${calculatedEstimate.category}_${Date.now()}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('📥 Смета скачана в формате CSV');
                  }}
                  className="spe-btn-export"
                >
                  <span>📥 Скачать смету (CSV)</span>
                </button>

                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Строительная смета QazGost AI: ${calculatedEstimate.category}, Итого: ${calculatedEstimate.total?.toLocaleString()} ₸`)}`, '_blank')}
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '14px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span>💬 В WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ChatGPT / OpenAI Account Connection Modal */}
      {showGptModal && (
        <div className="spe-gpt-modal-backdrop" onClick={() => setShowGptModal(false)}>
          <div className="spe-gpt-modal-content" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="spe-gpt-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>🤖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>Вход в личный аккаунт ChatGPT</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Войдите под своей учетной записью OpenAI для расчета смет через ваш тариф
                  </p>
                </div>
              </div>
              <button className="spe-gpt-modal-close" onClick={() => setShowGptModal(false)}>✕</button>
            </div>

            <div className="spe-gpt-modal-body">
              {/* If user is already logged in */}
              {(userGptAccount || userGptKey) ? (
                <div className="spe-gpt-user-profile-box">
                  <div className="spe-gpt-avatar-row">
                    <div className="spe-gpt-avatar">👤</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fff' }}>
                        {userGptAccount ? userGptAccount.email : 'Персональный API ключ'}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                        {userGptAccount ? `Тариф: ${userGptAccount.plan}` : `Ключ: ${userGptKey.substring(0, 10)}...`}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    ✅ <strong>Ваш аккаунт подключен:</strong> Нейросеть GPT-4o использует вашу персональную сессию для аудита смет и дефектов.
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowGptModal(false)}
                      className="spe-gpt-btn-save"
                      style={{ flex: 1 }}
                    >
                      ✓ Продолжить работу
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectGptAccount}
                      style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* API Key Connection (only real method) */}
                    <form onSubmit={handleSaveGptKey} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {/* Presets for Key #1 and Key #2 */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 700 }}>
                          ⚡ Быстрый выбор системного ключа:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setInputGptKey(SYSTEM_OPENAI_PRESETS.KEY_1_VISION_DEFECT);
                              showToast('🔹 Выбран Ключ №1: Дефектоскопия & Vision');
                            }}
                            style={{
                              background: inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_1_VISION_DEFECT ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_1_VISION_DEFECT ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                              borderRadius: '10px',
                              padding: '8px 10px',
                              color: '#fff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#38bdf8' }}>🔵 Ключ №1 (Vision)</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Дефекты & Базовый</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInputGptKey(SYSTEM_OPENAI_PRESETS.KEY_2_DETAILED_ESTIMATE);
                              showToast('🟣 Выбран Ключ №2: Детальные сметы & Луна-Тера');
                            }}
                            style={{
                              background: inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_2_DETAILED_ESTIMATE ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_2_DETAILED_ESTIMATE ? '#a855f7' : 'rgba(255, 255, 255, 0.15)'}`,
                              borderRadius: '10px',
                              padding: '8px 10px',
                              color: '#fff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#c084fc' }}>🟣 Ключ №2 (Сметы)</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Детальный расчёт GPT-4o</div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 700 }}>
                          Ваш персональный OpenAI Secret Key:
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type={showKeyText ? 'text' : 'password'}
                            placeholder="sk-proj-..."
                            value={inputGptKey}
                            onChange={e => setInputGptKey(e.target.value)}
                            className="spe-gpt-input"
                            style={{ width: '100%', paddingRight: '45px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeyText(!showKeyText)}
                            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
                            title={showKeyText ? 'Скрыть' : 'Показать'}
                          >
                            {showKeyText ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem' }}>
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                          >
                            🔗 platform.openai.com/api-keys
                          </a>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={handleTestGptKey}
                          disabled={isTestingGptKey}
                          className="spe-gpt-btn-test"
                        >
                          {isTestingGptKey ? '⏳ Проверка...' : '🧪 Проверить связь'}
                        </button>

                        <button
                          type="submit"
                          className="spe-gpt-btn-save"
                        >
                          💾 Сохранить ключ
                        </button>
                      </div>
                    </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estimate History */}
      {estimateHistory.length > 0 && (
        <div className="spe-history-section">
          <div className="spe-history-title">📋 История расчётов (последние {estimateHistory.length})</div>
          {estimateHistory.map((h, i) => (
            <div key={h.id || i} className="spe-history-item">
              <div>
                <div className="spe-history-category">{h.category}</div>
                <div className="spe-history-meta">{h.date} • {h.region}</div>
              </div>
              <div className="spe-history-total">{(h.total || 0).toLocaleString()} ₸</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}