// QazGost Engineer Mobile — Real Production Railway Client & Data Sync
import { createSyncStore, localDateISO, addDaysISO, authHeaders, makeNote, formatBudget, fetchWithTimeout, cleanServerUrl } from './syncCore';
import { rememberVerifiedLogin, checkVerifiedLogin, forgetVerifiedLogin } from './offlineAuth';
const STORAGE_KEY_DEALS = 'qazgost_engineer_deals_perm';
const STORAGE_KEY_AUTH = 'qazgost_engineer_auth_perm';
const STORAGE_KEY_SAVED_LOGIN = 'qazgost_engineer_saved_login';
const STORAGE_KEY_SETTINGS = 'qazgost_engineer_settings_perm';

export const DEFAULT_ENGINEER = {
  id: 'eng_pto_maxim',
  name: 'Максим (ПТО)',
  login: 'maxim.engineer@qazgost.kz',
  email: 'maxim.engineer@qazgost.kz',
  role: 'Инженер технического надзора',
  phone: '+7 (701) 777-20-26',
  avatar: '👷‍♂️'
};

export const KNOWN_ENGINEERS = {
  'maxim.engineer@qazgost.kz': {
    id: 'eng_pto_maxim',
    name: 'Максим (ПТО)',
    login: 'maxim.engineer@qazgost.kz',
    email: 'maxim.engineer@qazgost.kz',
    role: 'Инженер технического надзора',
    phone: '+7 (701) 777-20-26',
    avatar: '👷‍♂️'
  },
  'engineer@qazgost.kz': {
    id: 'eng_pto_ruslan',
    name: 'Руслан (ПТО)',
    login: 'engineer@qazgost.kz',
    email: 'engineer@qazgost.kz',
    role: 'Инженер технического надзора',
    phone: '+7 (702) 555-12-34',
    avatar: '👷‍♂️'
  }
};

export function resolveEngineerProfile(cleanLogin, serverUser = null) {
  const lower = (cleanLogin || '').trim().toLowerCase();

  if (serverUser && serverUser.name) {
    const rawName = serverUser.name;
    const name = rawName.includes('ПТО') ? rawName : `${rawName} (ПТО)`;
    return {
      id: String(serverUser.id || 'eng_' + Date.now()),
      name: name,
      login: cleanLogin,
      email: serverUser.email || (cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`),
      role: serverUser.role || 'Инженер технического надзора',
      phone: serverUser.phone || (lower.includes('maxim') ? '+7 (701) 777-20-26' : '+7 (701) 000-00-00'),
      avatar: '👷‍♂️'
    };
  }

  if (KNOWN_ENGINEERS[lower]) {
    return { ...KNOWN_ENGINEERS[lower] };
  }

  if (lower.includes('maxim') || lower.startsWith('maxim')) {
    return {
      id: 'eng_pto_maxim',
      name: 'Максим (ПТО)',
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
      role: 'Инженер технического надзора',
      phone: '+7 (701) 777-20-26',
      avatar: '👷‍♂️'
    };
  }

  if (lower.includes('ruslan') || lower.startsWith('ruslan')) {
    return {
      id: 'eng_pto_ruslan',
      name: 'Руслан (ПТО)',
      login: cleanLogin,
      email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
      role: 'Инженер технического надзора',
      phone: '+7 (702) 555-12-34',
      avatar: '👷‍♂️'
    };
  }

  const rawPrefix = cleanLogin.split('@')[0].split('.')[0].replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  const displayName = rawPrefix ? (rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1)) : 'Инженер';
  return {
    id: 'eng_' + Date.now(),
    name: `${displayName} (ПТО)`,
    login: cleanLogin,
    email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`,
    role: 'Инженер технического надзора',
    phone: '+7 (701) 000-00-00',
    avatar: '👷‍♂️'
  };
}

export const STATUS_CONFIG = {
  'Новые': { label: 'Новая заявка', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📝' },
  'Выезд назначен': { label: 'Выезд назначен', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '📅' },
  'Инженер выехал': { label: 'Инженер выехал', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', icon: '🚗' },
  'На объекте': { label: 'На объекте / Осмотр', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: '📍' },
  'Замер выполнен': { label: 'Замер выполнен', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', icon: '📐' },
  'Смета готова': { label: 'Смета готова', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '💰' },
  'В работе': { label: 'В работе / Монтаж', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '⚙️' },
  'Завершено': { label: 'Завершено', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: '✅' }
};


export function getSavedLogin() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_LOGIN);
    if (saved && saved !== 'engineer@qazgost.kz') return saved;
    return '';
  } catch (e) {
    return '';
  }
}

export function setSavedLogin(login) {
  try {
    if (login) localStorage.setItem(STORAGE_KEY_SAVED_LOGIN, login);
  } catch (e) {}
}

export function getSavedAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.login || parsed.email)) {
        const loginStr = (parsed.login || parsed.email || '').toLowerCase();
        // Auto-heal name if login is Maxim but legacy session stored Ruslan
        if (loginStr.includes('maxim') && (!parsed.name || parsed.name.includes('Руслан'))) {
          parsed.name = 'Максим (ПТО)';
          parsed.email = 'maxim.engineer@qazgost.kz';
          parsed.phone = '+7 (701) 777-20-26';
          parsed.id = 'eng_pto_maxim';
          setSavedAuth(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function setSavedAuth(authData) {
  try {
    if (authData) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
      if (authData.login || authData.email) {
        setSavedLogin(authData.login || authData.email);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch (e) {}
}


// Check real server health
export async function testServerPing(serverUrl) {
  const cleanUrl = (serverUrl || 'https://construction-main-production.up.railway.app').replace(/\/+$/, '');
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cleanUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);
    if (res.ok) {
      return { ok: true, latency };
    }
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e.message || 'Таймаут соединения' };
  }
}

// ── Server URL (persisted) ──
const DEFAULT_SERVER_URL = 'https://construction-main-production.up.railway.app';

export function getSavedServerUrl() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
    return (s && s.serverUrl) || DEFAULT_SERVER_URL;
  } catch (e) {
    return DEFAULT_SERVER_URL;
  }
}

export function setSavedServerUrl(url) {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}') || {};
    s.serverUrl = String(url || '').trim() || DEFAULT_SERVER_URL;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s));
  } catch (e) {}
}

function currentToken() {
  try { return getSavedAuth()?.token; } catch (e) { return undefined; }
}

export function getAuthHeaders() {
  return authHeaders(currentToken());
}

// ── Demo data: FICTIONAL, shown only offline before the first successful sync, never pushed ──
export function buildDemoDeals() {
  const today = localDateISO();
  const mk = (n, extra) => ({
    id: `demo-eng-${n}`,
    leadNum: `00${n}`,
    client: `Демо-клиент ${n}`,
    contractor: `Демо-клиент ${n}`,
    phone: `+7 700 000 00 0${n}`,
    location: `Демо-адрес ${n}`,
    role: 'engineer',
    priority: 'normal',
    notes: [{ text: 'Демонстрационная запись (офлайн-демо, не синхронизируется)', time: '', author: 'Демо' }],
    ...extra
  });
  return [
    mk(1, { title: 'Установка септика (Демо-клиент 1)', budget: 350000, status: 'Выезд назначен', date: today, time: '11:00' }),
    mk(2, { title: 'Техническая экспертиза (Демо-клиент 2)', budget: 150000, status: 'Новые', date: today, time: '14:30' }),
    mk(3, { title: 'Бурение скважины (Демо-клиент 3)', budget: 600000, status: 'На объекте', date: addDaysISO(today, 1), time: '10:00' })
  ];
}

export const dealsStore = createSyncStore({
  dealsKey: STORAGE_KEY_DEALS,
  tombKey: 'qazgost_engineer_deleted_ids',
  demoFactory: buildDemoDeals,
  getServerUrl: getSavedServerUrl,
  getToken: currentToken,
  getAuthorName: () => getSavedAuth()?.name || 'Инженер ПТО'
});

export function getStoredDeals() {
  return dealsStore.load();
}

export function saveStoredDeals(deals) {
  return dealsStore.save(deals);
}

export function pendingSyncCount(list) {
  return dealsStore.pendingCount(list);
}

export function loadDemoDeals() {
  return dealsStore.loadDemo();
}

/** Pull → merge (newer side wins, local-only records kept) → push changed records only. */
export function syncDeals() {
  return dealsStore.sync();
}

/** Forget clean server copies and pull again; unsynced local changes are kept. */
export function resetCachedDeals() {
  const keep = dealsStore.load().filter((d) => d._dirty && !d._demo);
  dealsStore.save(keep);
  return keep;
}

// ── Local edits (each marks the record dirty; App triggers sync) ──
export function updateDealStatus(dealId, newStatus, newNote = null, authorName = 'Инженер ПТО') {
  return dealsStore.edit(dealId, (d) => ({
    ...d,
    status: newStatus,
    notes: newNote ? [makeNote(newNote, authorName), ...(d.notes || [])] : (d.notes || [])
  }));
}

const PRE_MEASURE_STATUSES = ['Новые', 'Выезд назначен', 'Инженер выехал', 'На объекте'];

function inspectionSummary(i) {
  const parts = [];
  if (i.depth) parts.push(`глубина ${i.depth} м`);
  if (i.ringsDiameter || i.ringsCount) parts.push(`кольца ${i.ringsDiameter || '—'}${i.ringsCount ? ` × ${i.ringsCount} шт` : ''}`);
  if (i.pipeLength) parts.push(`труба ${i.pipeLength} м`);
  if (i.soilType) parts.push(`грунт: ${i.soilType}`);
  if (i.groundWater) parts.push(`УГВ: ${i.groundWater}`);
  if (i.accessTruck) parts.push(`подъезд: ${i.accessTruck}`);
  if (i.oldPit) parts.push(`старая яма: ${i.oldPit}`);
  if (i.totalEstimate) parts.push(`смета ${formatBudget(i.totalEstimate)}`);
  if (i.photos && i.photos.length) parts.push(`фото: ${i.photos.length} (на устройстве инженера)`);
  if (i.notes) parts.push(`прим.: ${i.notes}`);
  return parts.length ? `Замер объекта: ${parts.join('; ')}` : 'Осмотр объекта сохранён (замеры не заполнены)';
}

export function saveInspectionReport(dealId, inspectionData, authorName = 'Инженер ПТО', opts = {}) {
  return dealsStore.edit(dealId, (d) => {
    const status = opts.status || (PRE_MEASURE_STATUSES.includes(d.status) ? 'Замер выполнен' : d.status);
    const notes = [makeNote(inspectionSummary(inspectionData), authorName)];
    if (opts.note) notes.push(makeNote(opts.note, authorName));
    if (status !== d.status) notes.push(makeNote(`Статус изменен на «${status}»`, authorName));
    return {
      ...d,
      inspection: { ...(d.inspection || {}), ...inspectionData, savedAt: new Date().toISOString() },
      status,
      notes: [...notes, ...(d.notes || [])] // summary first, then comment / status change
    };
  });
}

export function updateDealSchedule(dealId, newDate, newTime, authorName = 'Инженер ПТО') {
  return dealsStore.edit(dealId, (d) => ({
    ...d,
    date: newDate,
    time: newTime,
    status: d.status === 'Новые' ? 'Выезд назначен' : d.status,
    notes: [makeNote(`Назначен выезд на ${newDate} в ${newTime}`, authorName), ...(d.notes || [])]
  }));
}

// ── Defect detection (YOLO on the server: POST /api/v1/defect-scan, multipart field "file") ──
function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function normalizeDefectScan(data) {
  const rawItems = Array.isArray(data?.defects?.items) ? data.defects.items : (Array.isArray(data?.defects) ? data.defects : []);
  const items = rawItems.map((d) => {
    let conf = toNumber(d.confidence ?? d.score);
    if (conf != null && conf > 1) conf = conf / 100;
    return {
      type: d.type || d.class || d.label || 'дефект',
      cls: d.class || '',
      severity: d.severity || '',
      confidence: conf,
      bbox: d.bbox || null,
      model: d.model || ''
    };
  });
  const sum = data?.defect_severity_summary || data?.severity_summary || {};
  return {
    defectType: data?.defectType || (items[0] ? items[0].type : 'Дефектов не обнаружено'),
    severity: data?.severity || '',
    snipCode: data?.snipCode || '',
    fixMethod: data?.fixMethod || '',
    estimatedCost: data?.estimatedCost ?? null,
    workDays: data?.workDays ?? null,
    annotatedImage: data?.defect_annotated_image || data?.annotated_image || null,
    items,
    summary: {
      total: typeof sum.total === 'number' ? sum.total : items.length,
      bySeverity: sum.by_severity || {},
      maxSeverity: sum.max_severity || ''
    },
    detector: (data?.detector && (data.detector.name || data.detector.model)) || (items[0] && items[0].model) || '',
    validatedClasses: Array.isArray(data?.detector?.validated_classes) ? data.detector.validated_classes.map(String) : null,
    detectorNote: (data?.detector && data.detector.note) || '',
    isMock: !!(data?.is_mock || data?.fallback),
    scannedAt: new Date().toISOString()
  };
}

export async function runDefectScan(fileOrBlob, { sensitivity = 0.5, prompt = '' } = {}) {
  const base = cleanServerUrl(getSavedServerUrl());
  const fd = new FormData();
  fd.append('file', fileOrBlob, (fileOrBlob && fileOrBlob.name) || 'defect.jpg');
  const qs = new URLSearchParams({ sensitivity: String(sensitivity) });
  if (prompt) qs.set('prompt', prompt);
  let res;
  try {
    res = await fetchWithTimeout(`${base}/api/v1/defect-scan?${qs.toString()}`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
      body: fd
    }, 90000);
  } catch (e) {
    throw new Error(`Сервис выявления дефектов недоступен (${e.name === 'AbortError' ? 'таймаут' : (e.message || 'нет сети')})`);
  }
  if (!res.ok) {
    throw new Error(`Сервис выявления дефектов недоступен (HTTP ${res.status})`);
  }
  let data;
  try { data = await res.json(); } catch (e) { throw new Error('Сервис выявления дефектов вернул некорректный ответ'); }
  if (!data || data.success === false) {
    throw new Error(`Сервис выявления дефектов вернул ошибку: ${(data && (data.error || data.detail)) || 'нет данных'}`);
  }
  return normalizeDefectScan(data);
}

export function attachDefectReport(dealId, report, authorName = 'Инженер ПТО') {
  return dealsStore.edit(dealId, (d) => {
    const counts = Object.entries(report.summary?.bySeverity || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
    const cost = report.estimatedCost != null && report.estimatedCost !== '' ? `; оценка устранения: ${typeof report.estimatedCost === 'number' ? formatBudget(report.estimatedCost) : report.estimatedCost}` : '';
    const text = `Дефектоскопия (ИИ${report.detector ? `, ${report.detector}` : ''}${report.isMock ? ', резервный алгоритм' : ''}): `
      + `${report.summary?.total ?? report.items.length} деф.${counts ? ` (${counts})` : ''}; основной: ${report.defectType}`
      + `${report.severity ? `; класс: ${report.severity}` : ''}${report.snipCode ? `; ${report.snipCode}` : ''}${cost}`
      + `${report.workDays ? `; срок: ${report.workDays} дн.` : ''}`;
    return {
      ...d,
      defects: [{ ...report, attachedAt: new Date().toISOString() }, ...(d.defects || [])].slice(0, 10),
      notes: [makeNote(text, authorName), ...(d.notes || [])]
    };
  });
}

// ── Photo estimate (POST /api/v1/ai/vision; works without OpenAI key via the local estimator) ──
export function normalizeVisionEstimate(data) {
  if (!data || typeof data !== 'object') throw new Error('Пустой ответ сервиса сметы');
  let r;
  if (data.recommended || Array.isArray(data.scenarios)) {
    const sc = data.recommended || data.scenarios[0] || {};
    r = {
      source: 'Локальный сметчик QazGost',
      total: sc.totalCost, works: sc.worksCost, materials: sc.materialsCost, equipment: sc.equipmentCost,
      contingency: sc.contingency, days: sc.timelineDays,
      items: (sc.items || []).map((i) => ({ name: i.name, qty: i.quantity, unit: i.unit, unitPrice: i.unitPrice, total: i.total })),
      insights: data.aiInsights || [],
      detected: data.category || '',
      normative: data.normative || ''
    };
  } else {
    r = {
      source: 'ИИ-анализ фото',
      total: data.total_cost, works: data.works_cost, materials: data.materials_cost, equipment: data.equipment_cost,
      contingency: data.contingency, days: data.timeline_days,
      items: (data.items || []).map((i) => ({ name: i.name, qty: i.volume, unit: i.unit, unitPrice: i.unit_price, total: i.total })),
      insights: data.insights || [],
      detected: data.detected_type || '',
      normative: ''
    };
  }
  const num = (v) => { const n = toNumber(v); return n == null ? 0 : Math.round(n); };
  r.total = num(r.total); r.works = num(r.works); r.materials = num(r.materials); r.equipment = num(r.equipment);
  r.contingency = num(r.contingency); r.days = num(r.days);
  if (!r.total) throw new Error('Сервис сметы вернул пустой расчёт');
  return r;
}

export async function runVisionEstimate({ photoDataUrl, description, category, city, mode = 'auto' }) {
  const base = cleanServerUrl(getSavedServerUrl());
  let res;
  try {
    res = await fetchWithTimeout(`${base}/api/v1/ai/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ photos: photoDataUrl ? [photoDataUrl] : [], description, category, city, mode })
    }, 90000);
  } catch (e) {
    throw new Error(`Сервис сметы недоступен (${e.name === 'AbortError' ? 'таймаут' : (e.message || 'нет сети')})`);
  }
  if (!res.ok) throw new Error(`Сервис сметы недоступен (HTTP ${res.status})`);
  let data;
  try { data = await res.json(); } catch (e) { throw new Error('Сервис сметы вернул некорректный ответ'); }
  return normalizeVisionEstimate(data);
}

export function attachEstimate(dealId, estimate, authorName = 'Инженер ПТО') {
  return dealsStore.edit(dealId, (d) => ({
    ...d,
    estimates: [{ ...estimate, attachedAt: new Date().toISOString() }, ...(d.estimates || [])].slice(0, 10),
    notes: [makeNote(
      `Смета по фото (${estimate.source}${estimate.categoryName ? `, ${estimate.categoryName}` : ''}${estimate.city ? `, ${estimate.city}` : ''}): `
      + `итого ${formatBudget(estimate.total)}; работы ${formatBudget(estimate.works)}, материалы ${formatBudget(estimate.materials)}, `
      + `техника ${formatBudget(estimate.equipment)}${estimate.days ? `; срок ${estimate.days} дн.` : ''}`,
      authorName
    ), ...(d.notes || [])]
  }));
}


export async function loginEngineer(serverUrl, loginInput, password) {
  const cleanLogin = (loginInput || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanLogin) {
    return { success: false, error: 'Заполните логин или email' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Введите пароль' };
  }

  const cleanEmail = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@qazgost.kz`;
  const defaultProfile = resolveEngineerProfile(cleanLogin);

  const finishOnline = async (user, token) => {
    const profile = resolveEngineerProfile(cleanLogin, user);
    const authData = {
      ...profile,
      token: token || `jwt_railway_${Date.now()}`,
      isOnline: true,
      serverType: 'railway',
      loginTime: new Date().toISOString()
    };
    setSavedAuth(authData);
    await rememberVerifiedLogin('engineer', cleanLogin, cleanPass, profile);
    return { success: true, authData };
  };

  // 1. Вход через сервер. Неверный пароль — отказ (раньше пускало с любым паролем).
  if (serverUrl) {
    const cleanUrl = serverUrl.replace(/\/+$/, '');
    try {
      const res = await fetchWithTimeout(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      }, 5000);

      if (res.ok) {
        const data = await res.json();
        return finishOnline(data.user, data.token);
      }
      if (res.status === 400 || res.status === 401) {
        // Аккаунта ещё нет на сервере — создаём его с введённым паролем.
        // Если аккаунт есть, сервер ответит «уже существует» → значит, пароль неверный.
        try {
          const regRes = await fetchWithTimeout(`${cleanUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: cleanPass, name: defaultProfile.name, role: 'engineer' })
          }, 5000);
          if (regRes.ok) {
            const regData = await regRes.json();
            return finishOnline(regData.user, regData.token);
          }
        } catch (regErr) {
          console.warn('[EngineerApi] auto-register skipped:', regErr && regErr.message);
        }
        forgetVerifiedLogin('engineer', cleanLogin);
        return { success: false, error: 'Неверный логин или пароль' };
      }
      // 5xx и прочее — сервер недоступен, пробуем офлайн-вход ниже
    } catch (err) {
      console.warn('[EngineerApi] server unreachable, trying offline login:', err && err.message);
    }
  }

  // 2. Без связи — только аккаунт, который уже входил на этом телефоне, и с тем же паролем
  const offlineProfile = await checkVerifiedLogin('engineer', cleanLogin, cleanPass);
  if (offlineProfile) {
    const authData = {
      ...defaultProfile,
      ...offlineProfile,
      token: `eng_offline_token_${Date.now()}`,
      isOnline: false,
      serverType: 'offline',
      loginTime: new Date().toISOString()
    };
    setSavedAuth(authData);
    return { success: true, authData };
  }
  return {
    success: false,
    error: 'Нет связи с сервером. Без интернета можно войти только в аккаунт, который уже входил на этом телефоне.'
  };
}
