// Поиск трещин на кадре камеры или фото — прямо в браузере (см. workers/crackWorker.js).
// detect(source) принимает <video>, <img> или <canvas> и возвращает рамки в долях кадра (0…1).

const SIZE = 512;
// Порог уверенности: 0,4 — лучшая точка по F1 на проверочной выборке (точность 0,87, полнота 0,73)
export const DEFAULT_CONF = 0.4;
export const MODEL_INFO = { name: 'YOLO26n', precision: 0.87, recall: 0.73, classes: 'трещины' };

export function createCrackDetector({ onProgress } = {}) {
  const worker = new Worker(new URL('../workers/crackWorker.js', import.meta.url), { type: 'module' });
  const canvas = document.createElement('canvas');
  canvas.width = SIZE; canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const pending = new Map();
  let seq = 0;
  let readyResolve; let readyReject;
  const ready = new Promise((res, rej) => { readyResolve = res; readyReject = rej; });
  ready.catch(() => {});

  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'progress') { if (onProgress) onProgress(m.loaded / m.total); return; }
    if (m.type === 'ready') { readyResolve(m); return; }
    if (m.type === 'result') { const p = pending.get(m.id); if (p) { pending.delete(m.id); p.resolve(m); } return; }
    if (m.type === 'error') {
      const p = m.id != null ? pending.get(m.id) : null;
      if (p) { pending.delete(m.id); p.reject(new Error(m.message)); } else readyReject(new Error(m.message));
    }
  };
  worker.onerror = (e) => readyReject(new Error(e.message || 'Не удалось запустить распознавание'));
  worker.postMessage({ type: 'init', modelUrl: new URL('/models/crack-yolo26n.onnx', window.location.origin).href });

  async function detect(source, minConf = DEFAULT_CONF) {
    await ready;
    const sw = source.videoWidth || source.naturalWidth || source.width;
    const sh = source.videoHeight || source.naturalHeight || source.height;
    if (!sw || !sh) return { boxes: [], ms: 0, width: 0, height: 0 };
    // letterbox: вписываем кадр в квадрат 512 с серыми полями, как при обучении
    const r = Math.min(SIZE / sw, SIZE / sh);
    const nw = Math.round(sw * r); const nh = Math.round(sh * r);
    const dx = Math.floor((SIZE - nw) / 2); const dy = Math.floor((SIZE - nh) / 2);
    ctx.fillStyle = 'rgb(114,114,114)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(source, 0, 0, sw, sh, dx, dy, nw, nh);
    const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
    const plane = SIZE * SIZE;
    const input = new Float32Array(3 * plane);
    for (let i = 0, j = 0; i < plane; i++, j += 4) {
      input[i] = px[j] / 255;
      input[plane + i] = px[j + 1] / 255;
      input[2 * plane + i] = px[j + 2] / 255;
    }
    const id = ++seq;
    const res = await new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ type: 'run', id, input, minConf }, [input.buffer]);
    });
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const boxes = res.boxes.map((b) => {
      const x1 = clamp((b.x1 - dx) / nw); const y1 = clamp((b.y1 - dy) / nh);
      const x2 = clamp((b.x2 - dx) / nw); const y2 = clamp((b.y2 - dy) / nh);
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, conf: b.conf };
    }).filter((b) => b.w > 0.005 && b.h > 0.005);
    return { boxes, ms: res.ms, width: sw, height: sh };
  }

  return { ready, detect, dispose: () => { pending.clear(); worker.terminate(); } };
}
