// Проекты модуля «Строительство зданий и сооружений» на сервере (/api/v1/vip/*).
// Доступны администратору и менеджеру: остальным сервер отвечает 403.
import { authHeaders, jsonAuthHeaders } from './platformUtils';

// На сайте адреса относительные. В мобильном приложении сервер другой: его адрес задаётся при сборке (VITE_API_HOST).
const HOST = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_HOST) || '').replace(/\/+$/, '');
const BASE = `${HOST}/api/v1/vip`;
/** Адрес загруженного файла (фото, видео, документа): в приложении к нему добавляется адрес сервера */
export const fileUrl = (u) => (HOST && typeof u === 'string' && u.startsWith('/uploads/') ? HOST + u : u);
export const apiHost = () => HOST;

export class VipError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code || '';
  }
}

async function call(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, options);
  } catch {
    throw new VipError('Нет связи с сервером. Проверьте интернет и повторите', 0, 'offline');
  }
  let data = null;
  try { data = await res.json(); } catch { /* пустой или не JSON */ }
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Сессия закончилась — войдите заново'
      : res.status === 403 ? 'Проекты строительства ведут администратор и менеджер'
        : `Сервер ответил ошибкой ${res.status}`;
    throw new VipError((data && data.error) || fallback, res.status, data && data.code);
  }
  return data;
}

export const listProjects = () => call('/projects', { headers: authHeaders() }).then((d) => d.items || []);
export const getProject = (id) => call(`/projects/${encodeURIComponent(id)}`, { headers: authHeaders() });
export const createProject = (data) => call('/projects', { method: 'POST', headers: jsonAuthHeaders(), body: JSON.stringify({ data }) });
export const saveProject = (id, version, data) => call(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', headers: jsonAuthHeaders(), body: JSON.stringify({ version, data }) });
export const deleteProject = (id) => call(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() });

export const MEDIA_LIMITS = { photo: 20, video: 200 }; // МБ
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
const VIDEO_EXT = ['mp4', 'mov', 'm4v', 'webm'];
export const MEDIA_ACCEPT = [...PHOTO_EXT, ...VIDEO_EXT].map((e) => `.${e}`).join(',');

/** Тип файла по расширению и причина отказа до отправки (пустая строка — можно загружать) */
export function mediaProblem(file) {
  const ext = String(file.name || '').toLowerCase().split('.').pop();
  const kind = PHOTO_EXT.includes(ext) ? 'photo' : VIDEO_EXT.includes(ext) ? 'video' : '';
  if (!kind) return 'подходят фото (JPG, PNG, WEBP, HEIC) и видео (MP4, MOV, WEBM)';
  if (file.size === 0) return 'файл пустой';
  if (file.size > MEDIA_LIMITS[kind] * 1024 * 1024) return `${kind === 'photo' ? 'фото' : 'видео'} больше ${MEDIA_LIMITS[kind]} МБ`;
  return '';
}

/** Загрузка фото или видео с ходом выполнения: onProgress(доля 0…1). Возвращает { url, kind, name, size }. */
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/media`);
    const headers = authHeaders();
    Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, headers[k]));
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new VipError('Загрузка прервалась: нет связи с сервером', 0, 'offline'));
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* не JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && data && data.url) resolve(data);
      else reject(new VipError((data && data.error) || (xhr.status === 413 ? 'Файл слишком большой для сервера' : `Сервер ответил ошибкой ${xhr.status}`), xhr.status));
    };
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}
