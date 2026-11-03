// Marketplace data from the Go backend (identical copy in mobile-engineer and mobile-executor).
//   GET /api/v1/equipment                         → Equipment[] (or {items})
//   GET /api/v1/prices?type=material&q=&limit=20  → {items:[{code,name,unit,price,category}], total}
//   GET /api/v1/contractors?city=&q=              → {total, items:[{id,name,companyName,companyPhone,foreman,size,skills[],city,rating}]}
import { cleanServerUrl } from './syncCore';

async function getJson(url, headers, signal, timeoutMs = 10000) {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json', ...(headers || {}) }, signal: controller.signal });
    if (!res.ok) throw new Error(`сервер ответил HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (signal && signal.aborted) throw Object.assign(new Error('aborted'), { aborted: true });
    throw new Error(e.name === 'AbortError' ? 'таймаут соединения' : (e.message || 'нет сети'));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function normalizeEquipment(e) {
  return {
    id: String(e.id ?? `${e.name}-${e.plateNumber || ''}`),
    name: e.name || 'Спецтехника',
    category: e.category || '',
    city: e.city || '',
    status: e.status || '',
    image: e.image || '',
    pricePerHour: num(e.pricePerHour),
    pricePerDay: num(e.pricePerDay),
    ownerName: e.ownerName || '',
    ownerPhone: e.ownerPhone || '',
    plateNumber: e.plateNumber || '',
    capacity: e.capacity || '',
    rating: num(e.rating),
    reviewsCount: Math.max(0, Math.round(num(e.reviewsCount)))
  };
}

export function normalizeMaterial(m) {
  return {
    id: String(m.code || m.id || m.name),
    code: m.code || '',
    name: m.name || m.title || 'Материал',
    unit: m.unit || 'шт',
    price: num(m.price),
    category: m.category || ''
  };
}

export async function fetchEquipment(serverUrl, headers, signal) {
  const data = await getJson(`${cleanServerUrl(serverUrl)}/api/v1/equipment`, headers, signal);
  const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  return list.map(normalizeEquipment);
}

export async function fetchMaterials(serverUrl, headers, query = '', signal, limit = 20) {
  const qs = new URLSearchParams({ type: 'material', q: query || '', limit: String(limit) });
  const data = await getJson(`${cleanServerUrl(serverUrl)}/api/v1/prices?${qs.toString()}`, headers, signal);
  const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const items = list.map(normalizeMaterial);
  return { items, total: typeof data?.total === 'number' ? data.total : items.length };
}

export function normalizeContractor(c) {
  return {
    id: String(c.id ?? c.name ?? Math.random()),
    name: c.name || c.companyName || 'Бригада',
    companyName: c.companyName || '',
    companyType: c.companyType || '',
    phone: c.companyPhone || c.phone || '',
    email: c.companyEmail || '',
    foreman: c.foreman || '',
    size: Math.max(0, Math.round(num(c.size))),
    skills: Array.isArray(c.skills) ? c.skills.map(String).filter(Boolean) : [],
    city: c.city || '',
    rating: num(c.rating)
  };
}

/** GET /api/v1/contractors?city=&q= → {total, items[]} (public) */
export async function fetchContractors(serverUrl, headers, { city = '', q = '' } = {}, signal) {
  const qs = new URLSearchParams({ city: city || '', q: q || '' });
  const data = await getJson(`${cleanServerUrl(serverUrl)}/api/v1/contractors?${qs.toString()}`, headers, signal);
  const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
  const items = list.map(normalizeContractor);
  return { items, total: typeof data?.total === 'number' ? data.total : items.length };
}

export function formatPrice(v) {
  return `${Math.round(num(v)).toLocaleString('ru-RU')} ₸`;
}

export function telHref(phone) {
  const clean = String(phone || '').replace(/[^\d+]/g, '');
  return clean ? `tel:${clean}` : '';
}
