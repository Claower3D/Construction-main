import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import { jsonAuthHeaders } from '../services/platformUtils';
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
  const [activeGroup, setActiveGroup] = useState('Комплекс');
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
  const slipRef = useRef(null);
  const ctaRef = useRef(null);
  const measureRef = useRef(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  // Нижняя панель на телефоне прячется, когда основная кнопка расчёта уже на экране
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
      id: cx.id, group: 'Комплекс', title: cx.title, parts: cx.parts,
      count: `${cx.parts.length} ${plural(cx.parts.length, 'раздел', 'раздела', 'разделов')}`, isComplex: true,
    })),
  ], [techmaps, complexes]);

  // Поиск идёт по всем видам работ, вкладка — только когда строка поиска пуста
  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) => (query
    ? cat.title.toLowerCase().includes(query)
    : (activeGroup === 'Все' || cat.group === activeGroup)));
  const groupCounts = useMemo(() => {
    const c = { 'Все': categories.length };
    categories.forEach((cat) => { c[cat.group] = (c[cat.group] || 0) + 1; });
    return c;
  }, [categories]);

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

  const num = (v) => Number(v || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const wallArea = Math.max(0, geo.perimeter * geo.height - geo.doors * 0.9 * 2.1 - geo.windows * 1.5 * 1.5);
  const hasGeo = geo.area > 0 && geo.perimeter > 0;
  const modeInfo = MODES.find((m) => m.id === smetaMode) || MODES[1];
  const missing = [
    !catalog && 'справочник загружается',
    !selection && (isCategorySkipped ? 'опишите задачу в шаге 4' : 'выберите вид работ'),
    !hasGeo && 'обмерьте помещение',
  ].filter(Boolean);
  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const calcFromBar = () => {
    handleCalculate();
    setTimeout(() => slipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
  };
  const tileImage = (cat) => {
    if (!cat.isComplex) return [`/assets/categories/cat_${cat.id}.jpg`];
    return (cat.parts || []).slice(0, 4).map((part) => `/assets/categories/cat_${part}.jpg`);
  };

  return (
    <div className="spe-container">
      {toastMessage && <div className="spe-toast" role="status">{toastMessage}</div>}

      {!hideHeader && (
        <div className="spe-header-bar">
          <button className="spe-back-btn" onClick={onBack} title="Назад" aria-label="Назад">←</button>
          <h2 className="spe-header-title">Оценка стоимости</h2>
        </div>
      )}

      <div className="spe-intro">
        <p className="spe-intro-lead">
          Смета по технологической карте: объём каждой позиции — из ваших размеров, цена — из прайсов и объявлений с источником в каждой строке.
        </p>
        <div className="spe-intro-meta">
          <span className={`spe-chip ${catalog ? 'is-live' : ''}`}>
            <i aria-hidden="true" />
            {catalog ? `Цены на ${catalog.priceDate}` : (catalogError ? 'Справочник недоступен' : 'Загрузка справочника…')}
          </span>
          {catalog && <span className="spe-chip">{catalog.techmaps.length} видов работ и {complexes.length} комплексов</span>}
          {catalog && <span className="spe-chip">{regions.length} {plural(regions.length, 'город', 'города', 'городов')}</span>}
        </div>
      </div>

      <div className="spe-layout">
        <div className="spe-flow">
          {/* ШАГ 1: ВИД РАБОТ */}
          <section className="spe-step" aria-labelledby="spe-step-1">
            <div className="spe-step-head">
              <span className="spe-num" aria-hidden="true">1</span>
              <h3 id="spe-step-1">Что делаем</h3>
              {!isCategorySkipped && (
                <label className="spe-search">
                  <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                  <input
                    type="search"
                    placeholder="Поиск вида работ"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="spe-search-field"
                    aria-label="Поиск вида работ"
                  />
                </label>
              )}
            </div>

            {!isCategorySkipped ? (
              <>
                {!query && (
                  <div className="spe-tabs" role="group" aria-label="Группы работ">
                    {['Комплекс', 'Общестрой', 'Отделка', 'Инженерия', 'Прочее', 'Все'].map(group => (
                      <button key={group} type="button" aria-pressed={activeGroup === group}
                        className={`spe-tab ${activeGroup === group ? 'is-on' : ''}`} onClick={() => setActiveGroup(group)}>
                        {group === 'Комплекс' ? 'Комплексы' : group}
                        <small>{groupCounts[group] || 0}</small>
                      </button>
                    ))}
                  </div>
                )}

                <div className="spe-tiles">
                  {filteredCategories.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    const imgs = tileImage(cat);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`spe-tile ${isSelected ? 'is-on' : ''} ${cat.isComplex ? 'is-complex' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                        aria-pressed={isSelected}
                        data-testid={`cat-${cat.id}`}
                      >
                        <span className={`spe-tile-img n${imgs.length}`} aria-hidden="true">
                          {imgs.map((src) => <span key={src} style={{ backgroundImage: `url(${src})` }} />)}
                        </span>
                        <span className="spe-tile-text">
                          <span className="spe-tile-name">{cat.title}</span>
                          {cat.count && <span className="spe-tile-meta">{cat.count}</span>}
                        </span>
                        <span className="spe-tile-check" aria-hidden="true">
                          <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" /></svg>
                        </span>
                      </button>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <p className="spe-tiles-empty">
                      По запросу «{searchQuery}» ничего нет. Попробуйте другое слово или опишите задачу — вид работ определится по описанию.
                    </p>
                  )}
                </div>

                <button type="button" className="spe-btn-skip" onClick={() => setIsCategorySkipped(true)}>
                  Не знаю, что выбрать — определить по описанию
                </button>
              </>
            ) : (
              <div className="spe-category-skipped-banner">
                <strong>
                  {detected
                    ? `По описанию: ${selectionTitle} (слово «${detected.word}»)`
                    : 'Опишите задачу в шаге 4 — вид работ определится по словам'}
                </strong>
                <button type="button" className="spe-btn-manual-select" onClick={() => setIsCategorySkipped(false)}>
                  Выбрать вручную
                </button>
              </div>
            )}
          </section>

          {/* ШАГ 2: ОБМЕР */}
          <section className="spe-step" aria-labelledby="spe-step-2" ref={measureRef}>
            <div className="spe-step-head">
              <span className="spe-num" aria-hidden="true">2</span>
              <h3 id="spe-step-2">Обмер</h3>
              {selection && techmaps[selection.id] && (
                <span className="spe-step-optional">контур: {techmaps[selection.id].baseLabel.toLowerCase()}</span>
              )}
            </div>
            <ContourMeasure photos={photos} geo={geo} setGeo={setGeo} showToast={showToast} />
          </section>

          {/* ШАГ 3: ПАРАМЕТРЫ */}
          {selection && catalog && (
            <section className="spe-step" aria-labelledby="spe-step-3">
              <div className="spe-step-head">
                <span className="spe-num" aria-hidden="true">3</span>
                <h3 id="spe-step-3">Как делаем</h3>
              </div>
              <SmetaParams techmaps={techmaps} selection={selection} complexes={complexes} values={paramValues} setValues={setParamValues} />
            </section>
          )}

          {/* ШАГ 4: ФОТО И ОПИСАНИЕ */}
          <section className="spe-step" aria-labelledby="spe-step-4">
            <div className="spe-step-head">
              <span className="spe-num" aria-hidden="true">{selection && catalog ? 4 : 3}</span>
              <h3 id="spe-step-4">Фото и описание</h3>
              <span className="spe-step-optional">необязательно</span>
            </div>
            <div className="spe-media">
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
                <svg className="spe-drop-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
                </svg>
                <span className="spe-drop-main">{isDraggingOver ? 'Отпустите файлы' : 'Добавить фото объекта или плана'}</span>
                <span className="spe-drop-sub">до 10 фото · план можно обвести в шаге 2, в режимах «Детальный» и «Полный» фото разберёт ИИ</span>
              </label>
              <div className="spe-desc">
                <label htmlFor="spe-description" className="spe-desc-label">Описание задачи</label>
                <textarea
                  id="spe-description"
                  rows="4"
                  className="spe-description-textarea"
                  placeholder={'Например: ванная 2×2 м, снять старую плитку, положить керамогранит, поставить душевую кабину'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

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
          </section>
        </div>

        {/* СМЕТА: сводка, город, режим и расчёт — закреплена справа на компьютере */}
        <aside className="spe-slip" aria-labelledby="spe-slip-title" ref={slipRef}>
          <div className="spe-slip-card">
            <div className="spe-slip-head">
              <h3 id="spe-slip-title">Смета</h3>
              {catalog && <span>на {catalog.priceDate}</span>}
            </div>

            <dl className="spe-slip-rows">
              <div>
                <dt>Вид работ</dt>
                <dd>{selectionTitle || <span className="spe-slip-miss">{isCategorySkipped ? 'по описанию' : 'не выбран'}</span>}</dd>
              </div>
              <div>
                <dt>Площадь</dt>
                <dd>
                  {hasGeo ? `${num(geo.area)} м²` : (
                    <button type="button" className="spe-slip-link" onClick={() => scrollTo(measureRef)}>обмерить</button>
                  )}
                </dd>
              </div>
              {hasGeo && (
                <div>
                  <dt>Периметр · стены</dt>
                  <dd>{num(geo.perimeter)} м · {num(wallArea)} м²</dd>
                </div>
              )}
              <div>
                <dt>Фото</dt>
                <dd>{photos.length ? `${photos.length} из 10` : 'нет'}</dd>
              </div>
            </dl>

            <div className="spe-slip-field">
              <label htmlFor="spe-region">Город</label>
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
              <small>цены Алматы × {Number((catalog?.regions || {})[city] || 1).toFixed(2)}</small>
            </div>

            <div className="spe-slip-field">
              <span className="spe-slip-label" id="spe-mode-label">Режим анализа</span>
              <div className="spe-modes" role="radiogroup" aria-labelledby="spe-mode-label">
                {MODES.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={smetaMode === m.id}
                    className={`spe-mode ${smetaMode === m.id ? 'is-on' : ''}`} data-testid={`mode-${m.id}`}
                    onClick={() => { setSmetaMode(m.id); try { localStorage.setItem('qazgost_smeta_mode', m.id); } catch { /* приватный режим */ } }}>
                    {m.title}
                  </button>
                ))}
              </div>
              <ul className="spe-mode-points">{modeInfo.points.map((p) => <li key={p}>{p}</li>)}</ul>
              {smetaMode !== 'fast' && (
                <div className="spe-slip-ai">
                  <span>
                    {userGptKey || userGptAccount
                      ? 'Ключ OpenAI подключён — фото разберёт ИИ.'
                      : 'ИИ-разбор фото — по ключу OpenAI сервера или вашему.'}
                  </span>
                  <button type="button" onClick={() => setShowGptModal(true)}>Ключ OpenAI</button>
                </div>
              )}
            </div>

            {result && currentScenario && (
              <div className="spe-slip-total">
                <span>Итого · {currentScenario.name}</span>
                <b className="qg-price-tag">{fmt(currentScenario.subtotal)} ₸</b>
                <button type="button" className="spe-slip-link" onClick={() => scrollTo(resultRef)}>Открыть смету</button>
              </div>
            )}

            {missing.length > 0 && !calcError && (
              <p className="spe-slip-todo">Осталось: {missing.join(', ')}.</p>
            )}

            <button ref={ctaRef} className="spe-cta" onClick={handleCalculate} disabled={isScanning} data-testid="smeta-calc">
              {isScanning ? (
                <span className="spe-cta-scanning"><span className="spe-spinner" aria-hidden="true" />{scanStep}</span>
              ) : (
                <span>{result ? 'Пересчитать смету' : 'Рассчитать смету'}</span>
              )}
            </button>

            {calcError && (
              <div className="sm-error" role="alert" data-testid="smeta-error">
                <span>{calcError}</span>
                {!isScanning && selection && geo.area > 0 && <button type="button" className="sm-btn" onClick={handleCalculate}>Повторить</button>}
              </div>
            )}

            <p className="spe-cta-note">Расчёт идёт на сервере QazGost по технологическим картам; ничего не выдумывается и не подставляется «примерно».</p>
          </div>

          {estimateHistory.length > 0 && (
            <details className="spe-history">
              <summary>Недавние расчёты <small>{estimateHistory.length}</small></summary>
              <ul>
                {estimateHistory.map((h, i) => (
                  <li key={h.id || i}>
                    <span className="spe-history-name">{h.category}</span>
                    <span className="spe-history-meta">{h.date} · {h.region}{h.area > 0 ? ` · ${h.area} м²` : ''}</span>
                    <b className="spe-history-total">{(h.total || 0).toLocaleString('ru-RU')} ₸</b>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </aside>
      </div>

      {result && (
        <div ref={resultRef} className="spe-result-wrap">
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

      {/* Телефон и планшет: итог и кнопка расчёта всегда под рукой */}
      <div className={`spe-bar ${ctaVisible ? 'is-hidden' : ''}`} aria-hidden={ctaVisible}>
        <div className="spe-bar-info">
          <strong>{selectionTitle || 'Вид работ не выбран'}</strong>
          <span>
            {result && currentScenario
              ? `${fmt(currentScenario.subtotal)} ₸ · ${currentScenario.name}`
              : (hasGeo ? `${num(geo.area)} м² · ${city}` : 'нет размеров')}
          </span>
        </div>
        <button type="button" className="spe-cta spe-cta-sm" onClick={calcFromBar} disabled={isScanning} tabIndex={ctaVisible ? -1 : 0}>
          {isScanning ? 'Считаем…' : (result ? 'Пересчитать' : 'Рассчитать')}
        </button>
      </div>

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

    </div>
  );
}
