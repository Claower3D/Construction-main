// Хранение моделей «План → 3D».
// С настоящим входом на сервер модели лежат на сервере и открываются с любого устройства.
// Без него (гость, локальная учётная запись) — только в этом браузере, и мы прямо об этом говорим.

import { jsonAuthHeaders } from '../services/platformUtils';
import { sanitizeProject } from './model.js';

const API = '/api/v1/plan-models';
const LOCAL_KEY = 'qazgost_plan3d_models';
const DRAFT_KEY = 'qazgost_plan3d_draft';
const LOCAL_LIMIT = 20;

export const canUseServer = () => Boolean(jsonAuthHeaders().Authorization);

function readLocal() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(list) ? list.filter((m) => m && typeof m.id === 'string' && m.data) : [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, LOCAL_LIMIT)));
    return true;
  } catch {
    return false; // хранилище переполнено или запрещено
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers: jsonAuthHeaders() });
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и повторите.');
  }
  let body = {};
  try { body = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Сессия истекла — войдите заново, чтобы сохранять модели на сервере.');
    throw new Error(body?.error || `Сервер ответил ошибкой ${res.status}`);
  }
  return body;
}

const meta = (project, area) => ({
  name: project.name,
  floors: project.floors.length,
  walls: project.floors.reduce((s, f) => s + f.walls.length, 0),
  area: Math.round((area || 0) * 100) / 100,
});

/** @returns {Promise<{items: Array, serverError: string|null}>} серверные и локальные модели одним списком, новые сверху */
export async function listModels() {
  const local = readLocal().map((m) => ({ id: m.id, name: m.name, floors: m.floors, walls: m.walls, area: m.area, updatedAt: m.updatedAt, where: 'local' }));
  let server = [];
  let serverError = null;
  if (canUseServer()) {
    try {
      const data = await request('');
      server = (Array.isArray(data.items) ? data.items : []).map((m) => ({ ...m, where: 'server' }));
    } catch (e) {
      serverError = e.message;
    }
  }
  const items = [...server, ...local].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { items, serverError };
}

export async function loadModel(entry) {
  if (entry.where === 'server') {
    const data = await request(`/${encodeURIComponent(entry.id)}`);
    const project = sanitizeProject(data.data);
    project.id = data.id;
    return project;
  }
  const found = readLocal().find((m) => m.id === entry.id);
  if (!found) throw new Error('Модель не найдена в этом браузере');
  const project = sanitizeProject(found.data);
  project.id = found.id;
  return project;
}

/** @returns {Promise<{id:string, where:'server'|'local'}>} */
export async function saveModel(project, area) {
  const { id, ...data } = project;
  const isLocalId = typeof id === 'string' && id.startsWith('local-');
  if (canUseServer() && !isLocalId) {
    const body = JSON.stringify({ data, area });
    const saved = id ? await request(`/${encodeURIComponent(id)}`, { method: 'PUT', body }) : await request('', { method: 'POST', body });
    return { id: saved.id, where: 'server' };
  }
  const list = readLocal();
  const localId = isLocalId ? id : `local-${Date.now().toString(36)}`;
  const record = { id: localId, ...meta(project, area), updatedAt: new Date().toISOString(), data };
  const next = [record, ...list.filter((m) => m.id !== localId)];
  if (next.length > LOCAL_LIMIT) throw new Error(`В браузере помещается ${LOCAL_LIMIT} моделей — удалите ненужные или войдите, чтобы хранить на сервере.`);
  if (!writeLocal(next)) throw new Error('Браузер не дал сохранить модель: хранилище переполнено или отключено.');
  return { id: localId, where: 'local' };
}

export async function deleteModel(entry) {
  if (entry.where === 'server') {
    await request(`/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
    return;
  }
  writeLocal(readLocal().filter((m) => m.id !== entry.id));
}

// Черновик: чтобы случайное обновление страницы не стёрло работу
export function saveDraft(project) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(project)); } catch { /* не критично */ }
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const project = sanitizeProject(JSON.parse(raw));
    return project.floors.some((f) => f.walls.length) ? project : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* не критично */ }
}
