import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import { jsonAuthHeaders } from '../services/platformUtils';
import { COMPLEX_TEMPLATES } from '../data/estimateTemplates';
import ContourMeasure from './smeta/ContourMeasure';
import SmetaParams, { buildParams } from './smeta/SmetaParams';
import SmetaResultView from './smeta/SmetaResultView';
import { loadTechmaps, calcSmeta, detectCategory, smetaToCSV, downloadText, fmt } from './smeta/smetaApi';
import './SmartPhotoEstimatePage.css';
import './smeta/smeta.css';

const isRealOpenAIKey = (k) => typeof k === 'string' && /^sk-[A-Za-z0-9_-]{10,}/.test(k.trim());

const SYSTEM_OPENAI_PRESETS = {
  KEY_1_VISION_DEFECT: 'system-key-1-vision',
  KEY_2_DETAILED_ESTIMATE: 'system-key-2-detailed'
};

// Старые идентификаторы регионов (сохранены у пользователей в localStorage) → название города
const LEGACY_REGION_IDS = {
  almaty: 'Алматы', astana: 'Астана', shymkent: 'Шымкент', atyrau: 'Атырау', aktau: 'Актау', karaganda: 'Караганда',
  aktobe: 'Актобе', pavlodar: 'Павлодар', 'ust-kamenogorsk': 'Усть-Каменогорск', semey: 'Семей', kostanay: 'Костанай',
  petropavlovsk: 'Петропавловск', uralsk: 'Уральск', taldykorgan: 'Талдыкорган', turkestan: 'Туркестан',
  kyzylorda: 'Кызылорда', taraz: 'Тараз',
};

const MODES = [
  { id: 'fast', title: 'Быстрый', points: ['объёмы по обмеру и нормам расхода', 'цена и источник в каждой строке', 'три сценария с разным составом работ'] },
  { id: 'detailed', title: 'Детальный', points: ['всё из быстрого', 'проверка геометрии и рыночного ориентира', 'сверка цен с базой QazGost', 'ИИ-разбор фото, если подключён ключ OpenAI'] },
  { id: 'full', title: 'Полный', points: ['всё из детального', 'график работ по этапам с перерывами', 'ведомость закупки материалов', 'CSV со всеми разделами'] },
];

const CATEGORY_CARDS = [
  { id: 'earth', group: 'Общестрой', icon: '🔨', title: 'Земляные работы' },
  { id: 'foundation', group: 'Общестрой', icon: '🏗️', title: 'Фундамент' },
  { id: 'concrete', group: 'Общестрой', icon: '🧱', title: 'Бетон и монолит' },
  { id: 'masonry', group: 'Общестрой', icon: '🧱', title: 'Кладка' },
  { id: 'metal', group: 'Общестрой', icon: '🔩', title: 'Металлоконструкции' },
  { id: 'roof', group: 'Общестрой', icon: '🏠', title: 'Кровля' },
  { id: 'facade', group: 'Общестрой', icon: '🏢', title: 'Фасад' },
  { id: 'windows', group: 'Общестрой', icon: '🪟', title: 'Окна' },
  { id: 'insulation', group: 'Общестрой', icon: '🧶', title: 'Утепление фасада' },
  { id: 'demolition', group: 'Общестрой', icon: '💥', title: 'Демонтаж' },
  { id: 'wall_finish', group: 'Отделка', icon: '🎨', title: 'Отделка стен' },
  { id: 'floors', group: 'Отделка', icon: '🟫', title: 'Полы и плитка' },
  { id: 'ceilings', group: 'Отделка', icon: '💡', title: 'Потолки' },
  { id: 'stairs', group: 'Отделка', icon: '🪜', title: 'Лестницы' },
  { id: 'electric', group: 'Инженерия', icon: '⚡', title: 'Электрика' },
  { id: 'plumbing', group: 'Инженерия', icon: '🚿', title: 'Сантехника' },
  { id: 'heating', group: 'Инженерия', icon: '🔥', title: 'Отопление' },
  { id: 'hvac', group: 'Инженерия', icon: '❄️', title: 'Кондиционирование' },
  { id: 'gas', group: 'Инженерия', icon: '🔵', title: 'Газоснабжение' },
  { id: 'automation', group: 'Инженерия', icon: '📡', title: 'Видеонаблюдение' },
  { id: 'fire_safety', group: 'Инженерия', icon: '🧯', title: 'Пожарная сигнализация' },
  { id: 'external_nets', group: 'Инженерия', icon: '🔌', title: 'Наружный водопровод' },
  { id: 'landscaping', group: 'Прочее', icon: '🌳', title: 'Брусчатка' },
  { id: 'roads', group: 'Общестрой', icon: '🛣️', title: 'Асфальтирование' },
  { id: 'wood', group: 'Общестрой', icon: '🪵', title: 'Деревянный настил' },
  { id: 'interior', group: 'Отделка', icon: '🛋️', title: 'Двери и мебель' },
  { id: 'design', group: 'Прочее', icon: '📐', title: 'Дизайн-проект' },
  { id: 'special', group: 'Прочее', icon: '🏭', title: 'Специальные работы' },
  { id: 'other', group: 'Прочее', icon: '📦', title: 'Прочие работы' },
];

const plural = (n, one, few, many) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

export default function SmartPhotoEstimatePage({ onBack, hideHeader = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('Все');
  const [selectedCategory, setSelectedCategory] = useState('apartment_renovation');
  const [isCategorySkipped, setIsCategorySkipped] = useState(false);
  const [city, setCity] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_estimate_city');
      if (saved) return saved;
      return LEGACY_REGION_IDS[localStorage.getItem('qazgost_estimate_region')] || 'Алматы';
    } catch { return 'Алматы'; }
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [estimateHistory, setEstimateHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('qazgost_estimate_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Справочник технологических карт с сервера
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');

  // Обмер и параметры
  const [geo, setGeo] = useState({ area: 0, perimeter: 0, height: 2.7, doors: 1, windows: 1, source: '' });
  const [paramValues, setParamValues] = useState({});

  // Photo & Uploads State
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');

  // Режим анализа и результат
  const [smetaMode, setSmetaMode] = useState(() => {
    try { return localStorage.getItem('qazgost_smeta_mode') || 'detailed'; } catch { return 'detailed'; }
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState(null);
  const [scenarioId, setScenarioId] = useState('std');
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [createdOrderInfo, setCreatedOrderInfo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const resultRef = useRef(null);

  // User Custom ChatGPT / OpenAI Account State
  const [showGptModal, setShowGptModal] = useState(false);
  const [gptAuthTab, setGptAuthTab] = useState('apikey'); // only 'apikey' tab (login removed)

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

  // Только настоящий пользовательский ключ OpenAI (sk-…); заглушки system-key-* больше не подставляются и не отправляются
  const [userGptKey, setUserGptKey] = useState(() => {
    const key = (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_key')) || '';
    return isRealOpenAIKey(key) ? key : '';
  });

  const [inputGptKey, setInputGptKey] = useState(userGptKey || '');
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

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  useEffect(() => {
    let alive = true;
    loadTechmaps()
      .then((data) => { if (alive) { setCatalog(data); setCatalogError(''); } })
      .catch((err) => { if (alive) setCatalogError(err.message); });
    return () => { alive = false; };
  }, []);

  const techmaps = useMemo(() => {
    const m = {};
    (catalog?.techmaps || []).forEach((t) => { m[t.id] = t; });
    return m;
  }, [catalog]);
  const complexes = catalog?.complexes || [];

  const regions = useMemo(() => {
    const r = catalog?.regions || { 'Алматы': 1 };
    return Object.entries(r).sort((a, b) => (a[0] === 'Алматы' ? -1 : b[0] === 'Алматы' ? 1 : a[0].localeCompare(b[0], 'ru')));
  }, [catalog]);

  const categories = useMemo(() => [
    ...CATEGORY_CARDS.map((c) => {
      const n = techmaps[c.id]?.stages?.length || 0;
      return { ...c, count: n ? `${n} ${plural(n, 'этап', 'этапа', 'этапов')}` : '' };
    }),
    ...complexes.map((cx) => ({
      id: cx.id, group: 'Комплекс', icon: COMPLEX_TEMPLATES[cx.id]?.icon || '🏗️', title: cx.title,
      count: `${cx.parts.length} ${plural(cx.parts.length, 'раздел', 'раздела', 'разделов')}`, isComplex: true,
    })),
  ], [techmaps, complexes]);

  const filteredCategories = categories.filter(cat =>
    (activeGroup === 'Все' || cat.group === activeGroup) &&
    cat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Что считаем: выбранная категория или определённая по описанию
  const detected = isCategorySkipped ? detectCategory(description) : null;
  const selectionId = isCategorySkipped ? detected?.id : selectedCategory;
  const selection = selectionId
    ? (complexes.some((c) => c.id === selectionId) ? { type: 'complex', id: selectionId } : { type: 'cat', id: selectionId })
    : null;
  const selectionTitle = selection
    ? (selection.type === 'complex' ? complexes.find((c) => c.id === selection.id)?.title : techmaps[selection.id]?.title) || ''
    : '';

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

    showToast(`📸 Загружено фото: ${files.length}`);
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
    if (!cleanKey || !isRealOpenAIKey(cleanKey)) {
      // Пресеты system-key-* — это выбор серверного ключа: в браузере ничего не храним и не отправляем
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

  const saveToHistory = useCallback((res) => {
    const sc = res.scenarios.find((s) => s.id === 'std') || res.scenarios[0];
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toLocaleString('ru-RU'),
      category: res.title,
      total: sc.subtotal,
      region: res.city,
      area: res.geometry.area,
      itemCount: sc.items.length,
    };
    setEstimateHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      try { localStorage.setItem('qazgost_estimate_history', JSON.stringify(updated)); } catch { /* квота */ }
      return updated;
    });
  }, []);

  // ИИ-разбор фото: только подсказка (тип работ, дефекты), цены и объёмы — из обмера и справочника
  const runPhotoAnalysis = async () => {
    const photosBase64 = photos.slice(0, 5).map(p => p.base64).filter(b => typeof b === 'string' && b.startsWith('data:'));
    if (!photosBase64.length) return null;
    const headers = jsonAuthHeaders();
    const customGptKey = userGptKey || (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_key')) || '';
    if (isRealOpenAIKey(customGptKey)) {
      headers['X-OpenAI-Key'] = customGptKey.trim();
      headers['X-OpenAI-Model'] = gptModel || 'gpt-4o';
    }
    try {
      const res = await fetch('/api/v1/ai/vision', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          photos: photosBase64,
          description: description || selectionTitle,
          category: selectionTitle,
          city,
          mode: 'detailed',
        }),
      });
      const parsed = await res.json().catch(() => null);
      if (!res.ok) {
        return { status: 'error', message: `ИИ-разбор фото не выполнен: сервер ответил ${res.status}${parsed?.error ? ` (${parsed.error})` : ''}.` };
      }
      const isQto = parsed && parsed.recommended && Array.isArray(parsed.scenarios);
      if (!parsed || isQto) {
        return { status: 'nokey', message: 'ИИ-разбор фото не выполнен: к серверу не подключён ключ OpenAI. Подключите свой ключ кнопкой «Ключ OpenAI» — смета от этого не зависит.' };
      }
      const insights = (Array.isArray(parsed.insights) ? parsed.insights : []).map(String).slice(0, 8);
      return {
        status: 'ok',
        photos: photosBase64.length,
        detected: parsed.detected_type || '',
        area: Number(parsed.dimensions?.area_m2) || 0,
        insights,
      };
    } catch {
      return { status: 'error', message: 'ИИ-разбор фото не выполнен: нет связи с сервером.' };
    }
  };

  const handleCalculate = async () => {
    setCalcError('');
    if (!catalog) {
      setCalcError(catalogError || 'Справочник ещё загружается — подождите пару секунд.');
      return;
    }
    if (!selection) {
      setCalcError(isCategorySkipped
        ? 'По описанию не удалось определить вид работ. Опишите задачу подробнее или выберите категорию вручную.'
        : 'Выберите вид работ.');
      return;
    }
    if (!(geo.area > 0 && geo.perimeter > 0)) {
      setCalcError('Нет размеров: обведите помещение на сетке, на плане или введите длину и ширину.');
      return;
    }

    setIsScanning(true);
    setResult(null);
    setPhotoAnalysis(null);
    setCreatedOrderInfo(null);
    const withPhotos = smetaMode !== 'fast' && photos.length > 0;
    setScanStep(withPhotos ? 'Считаем смету и разбираем фото…' : 'Считаем смету по технологической карте…');

    const body = {
      ...(selection.type === 'complex' ? { complex: selection.id } : { category: selection.id }),
      geometry: { area: geo.area, perimeter: geo.perimeter, height: geo.height, doors: geo.doors, windows: geo.windows },
      params: buildParams(techmaps, selection, complexes, paramValues),
      city,
      mode: smetaMode,
    };
    try {
      const [res, pa] = await Promise.all([calcSmeta(body), withPhotos ? runPhotoAnalysis() : Promise.resolve(null)]);
      setResult(res);
      setPhotoAnalysis(pa);
      setScenarioId('std');
      saveToHistory(res);
      const std = res.scenarios.find((s) => s.id === 'std');
      showToast(`Смета готова: ${std.items.length} позиций, ${fmt(std.subtotal)} ₸`);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (err) {
      setCalcError(err.message || 'Не удалось рассчитать смету.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const currentScenario = result ? (result.scenarios.find((s) => s.id === scenarioId) || result.scenarios[1]) : null;

  const resultActions = result && currentScenario ? (
    <div className="sm-actions">
      {createdOrderInfo ? (
        <div style={{ gridColumn: '1 / -1', background: 'rgba(16,185,129,0.14)', border: '1px solid #10b981', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <strong style={{ color: '#6ee7b7' }}>Заявка #{createdOrderInfo.id} отправлена менеджеру.</strong>
            <div className="sm-hint">Инженер свяжется, чтобы приехать на замер и уточнить смету.</div>
          </div>
          <button type="button" onClick={() => (onBack ? onBack() : showToast('Откройте раздел «Мои заказы»'))}>Открыть «Мои заказы»</button>
        </div>
      ) : (
        <button type="button" className="sm-act-main" onClick={() => {
          const sc = currentScenario;
          const newOrder = createPlatformOrder({
            title: `Работы по смете (${sc.name}): ${result.title}`,
            category: result.title,
            amount: sc.subtotal,
            budget: `${fmt(sc.subtotal)} ₸`,
            description: `Смета QazGost [${sc.name}], ${result.city}, ${result.geometry.area} м². Работы ${fmt(sc.works)} ₸, материалы ${fmt(sc.materials)} ₸, резерв ${fmt(sc.reserve)} ₸.`,
            type: 'estimate',
            status: 'new',
            estimateData: { title: result.title, city: result.city, geometry: result.geometry, scenario: sc, priceDate: result.priceDate },
          });
          setCreatedOrderInfo(newOrder);
          showToast(`Заявка ${newOrder.id} отправлена менеджеру`);
        }}>Оформить заказ по смете</button>
      )}
      <button type="button" onClick={() => {
        downloadText(smetaToCSV(result, currentScenario.id), `smeta_${result.parts.join('_')}_${currentScenario.id}_${Date.now()}.csv`);
        showToast('Смета сохранена в CSV');
      }} data-testid="smeta-csv">Скачать CSV</button>
      <button type="button" onClick={() => {
        const sc = currentScenario;
        window.open(`https://wa.me/?text=${encodeURIComponent(
          `Смета QazGost: ${result.title} (${sc.name})\n${result.city}, ${result.geometry.area} м²\n` +
          `Работы: ${fmt(sc.works)} ₸\nМатериалы: ${fmt(sc.materials)} ₸\nИтого: ${fmt(sc.subtotal)} ₸\nС резервом 10%: ${fmt(sc.total)} ₸\nЦены на ${result.priceDate}`,
        )}`, '_blank', 'noopener');
      }}>Отправить в WhatsApp</button>
    </div>
  ) : null;

  return (
    <div className="spe-container">
      {toastMessage && <div className="spe-toast" role="status">{toastMessage}</div>}

      {!hideHeader && (
        <div className="spe-header-bar">
          <button className="spe-back-btn" onClick={onBack} title="Назад" aria-label="Назад">←</button>
          <div className="spe-title-flex">
            <span className="spe-header-icon">📐</span>
            <h2>Оценка стоимости</h2>
          </div>
        </div>
      )}

      <div className="spe-hero-card">
        <div className="spe-hero-icon">📐</div>
        <h3>Оценка стоимости работ</h3>
        <p>Выберите вид работ и обмерьте помещение — смета посчитается по технологической карте: объём каждой позиции из ваших размеров, цена из прайсов и объявлений с источником.</p>
        <div className="spe-hero-badge">
          <span className="spe-pulse"></span>
          <span>{catalog ? `Цены на ${catalog.priceDate}` : (catalogError ? 'Справочник недоступен' : 'Загрузка справочника…')}</span>
        </div>
      </div>

      {/* ШАГ 1: ВИД РАБОТ */}
      {!isCategorySkipped ? (
        <>
          <div className="spe-step-title-row">
            <div className="spe-step-badge">
              <span className="spe-num">1</span>
              <h3>Что делаем</h3>
            </div>
            <input
              type="text"
              placeholder="🔎 Поиск вида работ…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="spe-search-field"
              aria-label="Поиск вида работ"
            />
          </div>

          <div className="spe-filter-tabs">
            {['Все', 'Комплекс', 'Общестрой', 'Инженерия', 'Отделка', 'Прочее'].map(group => (
              <button key={group} type="button" className={`spe-filter-tab ${activeGroup === group ? 'active' : ''}`} onClick={() => setActiveGroup(group)}>
                {group}
              </button>
            ))}
          </div>

          <div className="spe-categories-grid">
            {filteredCategories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  role="button"
                  tabIndex={0}
                  className={`spe-cat-box ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCategory(cat.id); } }}
                  aria-pressed={isSelected}
                  data-testid={`cat-${cat.id}`}
                >
                  <div className="spe-cat-bg" style={cat.isComplex ? undefined : { backgroundImage: `url(/assets/categories/cat_${cat.id}.jpg)` }}></div>
                  <div className="spe-cat-content">
                    <div className="spe-cat-icon">{cat.icon}</div>
                    <div className="spe-cat-name">{cat.title}</div>
                    <div className="spe-cat-count">{cat.count}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="spe-skip-row">
            <button type="button" className="spe-btn-skip" onClick={() => setIsCategorySkipped(true)}>
              Не знаю, что выбрать — определить по описанию
            </button>
          </div>
        </>
      ) : (
        <div className="spe-category-skipped-banner">
          <div className="spe-skipped-left">
            <span className="spe-check-green">{detected ? '✅' : '✍️'}</span>
            <strong>
              {detected
                ? `По описанию: ${selectionTitle} (слово «${detected.word}»)`
                : 'Опишите задачу в шаге 4 — вид работ определится по словам'}
            </strong>
          </div>
          <button type="button" className="spe-btn-manual-select" onClick={() => setIsCategorySkipped(false)}>
            Выбрать вручную
          </button>
        </div>
      )}

      {/* ШАГ 2: ОБМЕР */}
      <div className="spe-step-title-row mt-4">
        <div className="spe-step-badge">
          <span className="spe-num">2</span>
          <h3>Обмер</h3>
        </div>
        {selection && techmaps[selection.id] && (
          <span className="spe-step-optional">контур: {techmaps[selection.id].baseLabel.toLowerCase()}</span>
        )}
      </div>
      <ContourMeasure photos={photos} geo={geo} setGeo={setGeo} showToast={showToast} />

      {/* ШАГ 3: ПАРАМЕТРЫ */}
      {selection && catalog && (
        <>
          <div className="spe-step-title-row mt-4">
            <div className="spe-step-badge">
              <span className="spe-num">3</span>
              <h3>Как делаем</h3>
            </div>
          </div>
          <SmetaParams techmaps={techmaps} selection={selection} complexes={complexes} values={paramValues} setValues={setParamValues} />
        </>
      )}

      {/* ШАГ 4: ФОТО И ОПИСАНИЕ */}
      <div className="spe-step-title-row mt-4">
        <div className="spe-step-badge">
          <span className="spe-num">4</span>
          <h3>Фото и описание</h3>
        </div>
        <span className="spe-step-optional">необязательно · фото {photos.length}/10</span>
      </div>

      <label
        htmlFor="spe-file-picker"
        className={`spe-dropzone ${isDraggingOver ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          const dt = e.dataTransfer;
          if (dt?.files?.length > 0) handleFileUpload({ target: { files: dt.files } });
        }}
      >
        <input type="file" id="spe-file-picker" multiple accept="image/*" className="qg-visually-hidden" aria-label="Выбрать фото объекта" onChange={handleFileUpload} />
        <div className="spe-drop-icon">{isDraggingOver ? '📥' : '📸'}</div>
        <p className="spe-drop-main">{isDraggingOver ? 'Отпустите файлы' : 'Фото объекта или плана'}</p>
        <p className="spe-drop-sub">План можно обвести в шаге 2 («Контур на плане»); в режимах «Детальный» и «Полный» фото разберёт ИИ</p>
      </label>

      {photos.length > 0 && (
        <div className="spe-thumbs-wrap">
          {photos.map(p => (
            <div key={p.id} className="spe-thumb-box">
              <img src={p.url} alt={p.name} />
              <button type="button" className="spe-thumb-remove" aria-label={`Удалить ${p.name}`} onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <label htmlFor="spe-description" className="qg-visually-hidden">Описание задачи</label>
      <textarea
        id="spe-description"
        rows="3"
        className="spe-description-textarea"
        placeholder={'Например: ванная 2×2 м, снять старую плитку, положить керамогранит, поставить душевую кабину'}
        value={description}
        onChange={e => setDescription(e.target.value)}
      ></textarea>

      <div className="spe-region-row">
        <label className="spe-region-label" htmlFor="spe-region">Город</label>
        <select
          id="spe-region"
          className="spe-region-select"
          value={city}
          onChange={e => {
            setCity(e.target.value);
            try { localStorage.setItem('qazgost_estimate_city', e.target.value); } catch { /* приватный режим */ }
          }}
        >
          {regions.map(([name, k]) => (
            <option key={name} value={name}>{name} {k !== 1 ? `(×${Number(k).toFixed(2)})` : '(базовые цены)'}</option>
          ))}
        </select>
        <span className="spe-region-coeff">цены Алматы × {Number((catalog?.regions || {})[city] || 1).toFixed(2)}</span>
      </div>

      {/* РЕЖИМ АНАЛИЗА */}
      <div className="spe-engine-header">
        <span className="spe-engine-icon">🧮</span>
        <h3>Режим анализа</h3>
      </div>
      <div className="sm-modes" role="radiogroup" aria-label="Режим анализа">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={smetaMode === m.id}
            className={`sm-mode ${smetaMode === m.id ? 'is-on' : ''}`} data-testid={`mode-${m.id}`}
            onClick={() => { setSmetaMode(m.id); try { localStorage.setItem('qazgost_smeta_mode', m.id); } catch { /* приватный режим */ } }}>
            <strong>{m.title}</strong>
            <ul>{m.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </button>
        ))}
      </div>
      <div className="sm-key-row">
        <span>
          {userGptKey || userGptAccount
            ? 'Ключ OpenAI подключён — в детальном и полном режиме фото разберёт ИИ.'
            : 'ИИ-разбор фото работает с ключом OpenAI на сервере или вашим собственным.'}
        </span>
        <button type="button" onClick={() => setShowGptModal(true)}>Ключ OpenAI</button>
      </div>

      <div className="spe-cta-wrap">
        <button className="spe-btn-cta-glow" onClick={handleCalculate} disabled={isScanning} data-testid="smeta-calc">
          {isScanning ? (
            <span className="spe-cta-scanning"><span className="spe-spinner">⚙️</span>{scanStep}</span>
          ) : (
            <span>Рассчитать смету{selectionTitle ? ` · ${selectionTitle}` : ''}{geo.area > 0 ? ` · ${geo.area.toLocaleString('ru-RU')} м²` : ''}</span>
          )}
        </button>
        <p className="spe-cta-note">Расчёт идёт на сервере QazGost по технологическим картам; ничего не выдумывается и не подставляется «примерно».</p>
      </div>

      {calcError && (
        <div className="sm-error" role="alert" data-testid="smeta-error">
          <span>{calcError}</span>
          {!isScanning && selection && geo.area > 0 && <button type="button" className="sm-btn" onClick={handleCalculate}>Повторить</button>}
        </div>
      )}

      {result && (
        <div ref={resultRef}>
          <SmetaResultView
            result={result}
            scenarioId={scenarioId}
            setScenarioId={setScenarioId}
            photoAnalysis={photoAnalysis}
            techmaps={techmaps}
            actions={resultActions}
          />
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
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#a39cc2' }}>
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

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#cbc5e3', lineHeight: 1.4 }}>
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
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbc5e3', marginBottom: '0.4rem', fontWeight: 700 }}>
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
                              background: inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_1_VISION_DEFECT ? 'rgba(185, 164, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${inputGptKey === SYSTEM_OPENAI_PRESETS.KEY_1_VISION_DEFECT ? '#b9a4ff' : 'rgba(255, 255, 255, 0.15)'}`,
                              borderRadius: '10px',
                              padding: '8px 10px',
                              color: '#fff',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#b9a4ff' }}>🔵 Ключ №1 (Vision)</div>
                            <div style={{ fontSize: '0.7rem', color: '#a39cc2' }}>Дефекты & Базовый</div>
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
                            <div style={{ fontSize: '0.7rem', color: '#a39cc2' }}>Детальный расчёт GPT-4o</div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbc5e3', marginBottom: '0.4rem', fontWeight: 700 }}>
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
                            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: '#a39cc2', cursor: 'pointer', fontSize: '1rem' }}
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
                            style={{ color: '#b9a4ff', textDecoration: 'none', fontWeight: 600 }}
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

      {estimateHistory.length > 0 && (
        <div className="spe-history-section">
          <div className="spe-history-title">История расчётов (последние {estimateHistory.length})</div>
          {estimateHistory.map((h, i) => (
            <div key={h.id || i} className="spe-history-item">
              <div>
                <div className="spe-history-category">{h.category}</div>
                <div className="spe-history-meta">
                  {h.date} • {h.region}
                  {h.area > 0 && ` • ${h.area} м²`}
                  {h.itemCount > 0 && ` • ${h.itemCount} поз.`}
                </div>
              </div>
              <div className="spe-history-total">{(h.total || 0).toLocaleString('ru-RU')} ₸</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
