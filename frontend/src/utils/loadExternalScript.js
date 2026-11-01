// Ленивая загрузка внешних <script> (CDN) по требованию.
// Раньше tfjs + mobilenet (~1,5 МБ) подключались синхронно в <head> index.html и блокировали
// первый рендер на каждой странице, хотя нужны только в одном сценарии фото-оценки.

const pending = new Map();

export function loadExternalScript(src, { timeoutMs = 15000 } = {}) {
  if (typeof document === 'undefined') return Promise.reject(new Error('no document'));
  if (pending.has(src)) return pending.get(src);
  const p = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-ext-src="${src}"]`);
    if (existing && existing.dataset.loaded === '1') { resolve(); return; }
    const el = existing || document.createElement('script');
    const timer = setTimeout(() => reject(new Error(`timeout: ${src}`)), timeoutMs);
    el.addEventListener('load', () => { clearTimeout(timer); el.dataset.loaded = '1'; resolve(); }, { once: true });
    el.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`failed: ${src}`)); }, { once: true });
    if (!existing) {
      el.src = src;
      el.async = true;
      el.crossOrigin = 'anonymous';
      el.dataset.extSrc = src;
      document.head.appendChild(el);
    }
  });
  // неудачную попытку не кешируем — можно повторить позже
  p.catch(() => pending.delete(src));
  pending.set(src, p);
  return p;
}

const TFJS_SRC = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0';
const MOBILENET_SRC = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1';

/** Возвращает window.mobilenet или null (нет сети / CDN недоступен) — никогда не бросает. */
export async function ensureMobilenet() {
  if (typeof window === 'undefined') return null;
  if (window.mobilenet) return window.mobilenet;
  try {
    await loadExternalScript(TFJS_SRC);
    await loadExternalScript(MOBILENET_SRC);
    return window.mobilenet || null;
  } catch (e) {
    console.warn('[mobilenet] не удалось загрузить:', e.message);
    return null;
  }
}
