import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import { jsonAuthHeaders } from '../services/platformUtils';
import ContourMeasure from './smeta/ContourMeasure';
import SmetaParams, { buildParams } from './smeta/SmetaParams';
import SmetaResultView from './smeta/SmetaResultView';
import { loadTechmaps, calcSmeta, detectCategory, smetaToCSV, downloadText, shrinkPhoto, fmt } from './smeta/smetaApi';
import { saveSmetaXlsx, openSmetaPrint, reservePercent } from './smeta/smetaDocs';
import { loadXlsx } from '../services/adminExcelIO';
import { translate, getLang, langLocale } from '../i18n';
import './SmartPhotoEstimatePage.css';
import './smeta/smeta.css';

const isRealOpenAIKey = (k) => typeof k === 'string' && /^sk-[A-Za-z0-9_-]{10,}/.test(k.trim());

// Черновик расчёта: выбор, размеры, параметры и последняя смета переживают обновление страницы.
// Фото в черновик не кладём — они большие; после обновления их нужно добавить заново.
const DRAFT_KEY = 'qazgost_estimate_draft';
const DRAFT_TTL_MS = 3 * 24 * 3600 * 1000;
const readDraft = () => {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d || d.v !== 1 || !(Date.now() - d.at < DRAFT_TTL_MS)) return null;
    const g = d.geo || {};
    const okGeo = [g.area, g.perimeter, g.height, g.doors, g.windows].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);
    const okResult = d.result && Array.isArray(d.result.scenarios) && d.result.scenarios.length > 0
      && d.result.scenarios.every((sc) => Array.isArray(sc.items) && typeof sc.subtotal === 'number') && d.result.geometry;
    return { ...d, geo: okGeo ? g : null, result: okResult ? d.result : null };
  } catch { return null; }
};
const EMPTY_GEO = { area: 0, perimeter: 0, height: 2.7, doors: 1, windows: 1, source: '' };

// Документы и сообщения пишутся на языке страницы: тем же словарём, что и экран
const tr = (text) => (getLang() === 'ru' ? text : (translate(text) ?? text));

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
  { id: 'full', title: 'Полный', points: ['всё из детального', 'график работ по этапам с перерывами', 'ведомость закупки материалов', 'Excel и PDF со всеми разделами'] },
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
  const [draft] = useState(readDraft);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState(draft?.activeGroup || 'Комплекс');
  const [selectedCategory, setSelectedCategory] = useState(draft?.selectedCategory || 'apartment_renovation');
  const [isCategorySkipped, setIsCategorySkipped] = useState(!!draft?.isCategorySkipped);
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
  const [geo, setGeo] = useState(() => (draft?.geo ? { ...EMPTY_GEO, ...draft.geo } : EMPTY_GEO));
  const [paramValues, setParamValues] = useState(() => (draft?.paramValues && typeof draft.paramValues === 'object' ? draft.paramValues : {}));
  // размеры, с которыми открывается обмер (из черновика); меняется только при сбросе расчёта
  const [measureSeed, setMeasureSeed] = useState(() => ({ n: 0, geo: draft?.geo?.area > 0 ? draft.geo : null }));

  // Photo & Uploads State
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState(() => (typeof draft?.description === 'string' ? draft.description : ''));

  // Режим анализа и результат
  const [smetaMode, setSmetaMode] = useState(() => {
    try { return localStorage.getItem('qazgost_smeta_mode') || 'detailed'; } catch { return 'detailed'; }
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState(() => draft?.result || null);
  const [scenarioId, setScenarioId] = useState(draft?.scenarioId || 'std');
  const [photoAnalysis, setPhotoAnalysis] = useState(() => (draft?.result && draft.photoAnalysis) || null);
  const [docBusy, setDocBusy] = useState('');
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

  // Свой ключ OpenAI для разбора фото (необязательно): хранится только в этом браузере
  const [showGptModal, setShowGptModal] = useState(false);

  // Только настоящий пользовательский ключ OpenAI (sk-…); заглушки system-key-* больше не подставляются и не отправляются
  const [userGptKey, setUserGptKey] = useState(() => {
    const key = (typeof window !== 'undefined' && localStorage.getItem('qazgost_user_openai_key')) || '';
    return isRealOpenAIKey(key) ? key : '';
  });

  const [inputGptKey, setInputGptKey] = useState(userGptKey || '');

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

  // Черновик: сохраняем с небольшой задержкой, чтобы не писать на каждое нажатие клавиши
  useEffect(() => {
    const id = setTimeout(() => {
      const base = { v: 1, at: Date.now(), activeGroup, selectedCategory, isCategorySkipped, geo, paramValues, description, scenarioId };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...base, result, photoAnalysis }));
      } catch {
        // места не хватило — сохраняем хотя бы введённое, без сметы
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(base)); } catch { /* приватный режим */ }
      }
    }, 400);
    return () => clearTimeout(id);
  }, [activeGroup, selectedCategory, isCategorySkipped, geo, paramValues, description, scenarioId, result, photoAnalysis]);

  // Справочник обновился после сохранения черновика: смета по старым ценам не показывается,
  // а вид работ, которого больше нет, заменяется на первый из списка
  useEffect(() => {
    if (!catalog) return;
    if (result && result.priceDate !== catalog.priceDate) { setResult(null); setPhotoAnalysis(null); }
    const known = (catalog.techmaps || []).some((t) => t.id === selectedCategory) || (catalog.complexes || []).some((c) => c.id === selectedCategory);
    if (!known) setSelectedCategory('apartment_renovation');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const resetAll = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* приватный режим */ }
    photos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setPhotos([]);
    setDescription('');
    setParamValues({});
    setGeo(EMPTY_GEO);
    setMeasureSeed((m) => ({ n: m.n + 1, geo: null }));
    setResult(null);
    setPhotoAnalysis(null);
    setCreatedOrderInfo(null);
    setCalcError('');
    setScenarioId('std');
    showToast('Расчёт очищен — можно начать заново');
  };

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
    ? (cat.title.toLowerCase().includes(query) || tr(cat.title).toLowerCase().includes(query)) // на английской версии ищут по-английски
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

  const handleSaveGptKey = (e) => {
    if (e) e.preventDefault();
    const cleanKey = inputGptKey.trim();
    if (!isRealOpenAIKey(cleanKey)) {
      setGptTestResult({ success: false, message: 'Это не похоже на ключ OpenAI: он начинается с «sk-».' });
      return;
    }
    try {
      localStorage.setItem('qazgost_user_openai_key', cleanKey);
      localStorage.setItem('qazgost_user_openai_model', gptModel);
    } catch { /* приватный режим: ключ действует до закрытия страницы */ }
    setUserGptKey(cleanKey);
    showToast('Ключ OpenAI сохранён в этом браузере');
    setShowGptModal(false);
  };

  const handleRemoveGptKey = () => {
    try {
      localStorage.removeItem('qazgost_user_openai_account');
      localStorage.removeItem('qazgost_user_openai_key');
    } catch { /* приватный режим */ }
    setUserGptKey('');
    setInputGptKey('');
    setGptTestResult(null);
    showToast('Ключ OpenAI удалён из этого браузера');
  };

  const handleTestGptKey = async () => {
    const keyToTest = inputGptKey.trim() || userGptKey;
    if (!keyToTest) {
      setGptTestResult({ success: false, message: 'Вставьте ключ, чтобы его проверить.' });
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
        setGptTestResult({ success: true, message: 'Ключ рабочий: сервис ИИ его принял.' });
      } else {
        const errData = await res.json().catch(() => ({}));
        setGptTestResult({ success: false, message: `Ключ не прошёл проверку (${res.status}): ${errData.error || 'сервис ИИ его не принял'}` });
      }
    } catch (err) {
      setGptTestResult({ success: false, message: 'Нет связи с сервером — ключ не проверен.' });
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

  // ИИ-разбор фото: только подсказка (что на снимке, подходит ли вид работ, дефекты);
  // цены и объёмы — из обмера и справочника. Сервер прямо говорит, если разбор не выполнен, и почему.
  const runPhotoAnalysis = async () => {
    const source = photos.slice(0, 5).map((p) => p.base64).filter((b) => typeof b === 'string' && b.startsWith('data:image/'));
    if (!source.length) return null;
    const headers = jsonAuthHeaders();
    if (isRealOpenAIKey(userGptKey)) {
      headers['X-OpenAI-Key'] = userGptKey.trim();
      headers['X-OpenAI-Model'] = gptModel || 'gpt-4o';
    }
    try {
      // снимки с телефона весят по 5–10 МБ: уменьшаем до 1600 px — ИИ этого хватает, а запрос уходит быстро
      const photosBase64 = await Promise.all(source.map((b) => shrinkPhoto(b)));
      const res = await fetch('/api/v1/estimate/photo-hint', {
        method: 'POST',
        headers,
        body: JSON.stringify({ photos: photosBase64, description: description || selectionTitle, category: selection?.id || '', city, lang: getLang() }),
      });
      const parsed = await res.json().catch(() => null);
      if (!res.ok) {
        // сервер посмотрел фото и увидел на нём не объект (например, человека)
        if (parsed?.code === 'photo_not_object' && parsed.error) return { status: 'error', message: parsed.error };
        if (res.status === 429) return { status: 'error', message: 'ИИ-разбор фото не выполнен: слишком много запросов подряд. Подождите минуту и пересчитайте смету.' };
        if (res.status === 413) return { status: 'error', message: 'ИИ-разбор фото не выполнен: фото слишком большие. Оставьте 1–3 снимка.' };
        return { status: 'error', message: `ИИ-разбор фото не выполнен: сервер ответил ${res.status}${parsed?.error ? ` (${parsed.error})` : ''}.` };
      }
      if (!parsed || parsed.status !== 'ok') {
        return {
          status: parsed?.reason || 'error',
          message: parsed?.message || 'ИИ-разбор фото не выполнен: сервер прислал непонятный ответ.',
          ownKey: !!headers['X-OpenAI-Key'],
        };
      }
      const list = (v, n) => (Array.isArray(v) ? v : []).map(String).filter(Boolean).slice(0, n);
      return {
        status: 'ok',
        photos: Number(parsed.photos) || photosBase64.length,
        detected: String(parsed.detected || ''),
        suggested: parsed.suggested?.id ? { id: String(parsed.suggested.id), title: String(parsed.suggested.title || '') } : null,
        mismatch: parsed.matches === false,
        area: Number(parsed.area_m2) || 0,
        condition: String(parsed.condition || ''),
        defects: list(parsed.defects, 6),
        insights: list(parsed.insights, 5),
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

  // Краткий итог сметы для заказа и WhatsApp: все три части сметы и настоящий процент резерва
  const summaryLines = (sc) => [
    `${tr('Работы')}: ${fmt(sc.works)} ₸`,
    `${tr('Материалы')}: ${fmt(sc.materials)} ₸`,
    ...(sc.equipment > 0 ? [`${tr('Техника')}: ${fmt(sc.equipment)} ₸`] : []),
    `${tr('Итого по смете')}: ${fmt(sc.subtotal)} ₸`,
    `${tr(`Резерв ${reservePercent(sc)}%`)}: ${fmt(sc.reserve)} ₸`,
    `${tr('Бюджет с резервом')}: ${fmt(sc.total)} ₸`,
  ];
  const partTitles = useMemo(() => {
    const t = {};
    (result?.parts || []).forEach((id) => { t[id] = techmaps[id]?.title || id; });
    return t;
  }, [result, techmaps]);
  const docInfo = () => ({ partTitles, description: description.trim(), lang: getLang(), locale: langLocale() });

  const downloadXlsx = async () => {
    setDocBusy('xlsx');
    try {
      const XLSX = await loadXlsx();
      saveSmetaXlsx(XLSX, result, currentScenario.id, docInfo(), tr);
      showToast('Смета сохранена в Excel');
    } catch {
      showToast('Не удалось собрать файл Excel — проверьте связь и попробуйте ещё раз');
    } finally {
      setDocBusy('');
    }
  };
  const printSmeta = () => {
    if (!openSmetaPrint(result, currentScenario.id, docInfo(), tr)) {
      showToast('Браузер не дал открыть окно печати — разрешите всплывающие окна для сайта');
    }
  };

  const resultActions = result && currentScenario ? (
    <div className="sm-actions">
      {createdOrderInfo ? (
        <div className="sm-order-done">
          <div>
            <strong>Заявка #{createdOrderInfo.id} отправлена менеджеру.</strong>
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
            description: `Смета QazGost [${sc.name}], ${result.city}, ${result.geometry.area} м². `
              + `Работы ${fmt(sc.works)} ₸, материалы ${fmt(sc.materials)} ₸${sc.equipment > 0 ? `, техника ${fmt(sc.equipment)} ₸` : ''}, `
              + `резерв ${reservePercent(sc)}% — ${fmt(sc.reserve)} ₸.${description.trim() ? ` Задача: ${description.trim()}` : ''}`,
            type: 'estimate',
            status: 'new',
            estimateData: { title: result.title, city: result.city, geometry: result.geometry, scenario: sc, priceDate: result.priceDate },
          });
          setCreatedOrderInfo(newOrder);
          showToast(`Заявка ${newOrder.id} отправлена менеджеру`);
        }}>Оформить заказ по смете</button>
      )}
      <button type="button" onClick={downloadXlsx} disabled={docBusy === 'xlsx'} data-testid="smeta-xlsx">
        {docBusy === 'xlsx' ? 'Собираем файл…' : 'Скачать Excel'}
      </button>
      <button type="button" onClick={printSmeta} data-testid="smeta-pdf">Печать / PDF</button>
      <button type="button" onClick={() => {
        const sc = currentScenario;
        window.open(`https://wa.me/?text=${encodeURIComponent(
          `${tr('Смета')} QazGost: ${tr(result.title)} (${tr(sc.name)})\n${tr(result.city)}, ${result.geometry.area} ${tr('м²')}\n`
          + `${summaryLines(sc).join('\n')}\n${tr('Цены на')} ${tr(result.priceDate)}`,
        )}`, '_blank', 'noopener');
      }} data-testid="smeta-wa">Отправить в WhatsApp</button>
      <button type="button" className="sm-act-quiet" onClick={() => {
        downloadText(smetaToCSV(result, currentScenario.id), `smeta_${result.parts.join('_')}_${currentScenario.id}_${Date.now()}.csv`);
        showToast('Смета сохранена в CSV');
      }} data-testid="smeta-csv">CSV</button>
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
            <ContourMeasure key={measureSeed.n} initialGeo={measureSeed.geo} photos={photos} geo={geo} setGeo={setGeo} showToast={showToast} />
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
                    {userGptKey
                      ? 'Ваш ключ OpenAI подключён — фото разберёт ИИ.'
                      : 'Фото разбирает ИИ; если он не подключён на сервере, можно указать свой ключ.'}
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
            {(result || hasGeo || description || photos.length > 0) && (
              <button type="button" className="spe-slip-link spe-slip-reset" onClick={resetAll} data-testid="smeta-reset">Начать заново</button>
            )}
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
            onPickSuggested={(id) => {
              setIsCategorySkipped(false);
              setSelectedCategory(id);
              setActiveGroup('Все');
              setPhotoAnalysis((pa) => (pa ? { ...pa, mismatch: false } : pa));
              showToast('Вид работ изменён — пересчитайте смету');
            }}
            onOpenKey={() => setShowGptModal(true)}
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

      {/* Свой ключ OpenAI для разбора фото */}
      {showGptModal && (
        <div className="spe-gpt-modal-backdrop" onClick={() => setShowGptModal(false)}>
          <div className="spe-gpt-modal-content" role="dialog" aria-modal="true" aria-labelledby="spe-key-title" onClick={(e) => e.stopPropagation()}>
            <div className="spe-gpt-modal-header">
              <div>
                <h3 id="spe-key-title">Свой ключ OpenAI</h3>
                <p>Нужен только для разбора фото. Смета считается и без него.</p>
              </div>
              <button type="button" className="spe-gpt-modal-close" aria-label="Закрыть" onClick={() => setShowGptModal(false)}>✕</button>
            </div>

            <form className="spe-gpt-modal-body" onSubmit={handleSaveGptKey}>
              {userGptKey && (
                <p className="spe-key-state" data-testid="key-state">
                  Сейчас подключён ключ <b translate="no">{userGptKey.slice(0, 7)}…{userGptKey.slice(-4)}</b>
                </p>
              )}
              <label className="spe-key-field">
                <span>Ключ OpenAI</span>
                <div className="spe-key-input">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    placeholder="sk-…"
                    value={inputGptKey}
                    onChange={(e) => { setInputGptKey(e.target.value); setGptTestResult(null); }}
                    className="spe-gpt-input"
                    autoComplete="off"
                    spellCheck="false"
                    data-testid="key-input"
                  />
                  <button type="button" onClick={() => setShowKeyText(!showKeyText)}>{showKeyText ? 'Скрыть' : 'Показать'}</button>
                </div>
              </label>
              <p className="spe-key-note">
                Ключ хранится только в этом браузере и уходит на сервер QazGost вместе с фото — для одного запроса к ИИ; на сервере он не сохраняется.
                Получить ключ: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" translate="no">platform.openai.com/api-keys</a>
              </p>
              {gptTestResult && (
                <p className={`spe-key-result ${gptTestResult.success ? 'is-ok' : 'is-bad'}`} role="status" data-testid="key-result">{gptTestResult.message}</p>
              )}
              <div className="spe-key-actions">
                <button type="submit" className="spe-gpt-btn-save" data-testid="key-save">Сохранить ключ</button>
                <button type="button" className="spe-gpt-btn-test" onClick={handleTestGptKey} disabled={isTestingGptKey}>
                  {isTestingGptKey ? 'Проверяем…' : 'Проверить ключ'}
                </button>
                {userGptKey && <button type="button" className="spe-key-remove" onClick={handleRemoveGptKey}>Удалить ключ</button>}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
