// Детектор трещин в браузере: модель YOLO26n (та же, что на сервере в /defect-scan),
// экспортированная в ONNX, работает на телефоне через WebAssembly — кадры никуда не отправляются.
// Воркер нужен, чтобы расчёт (0,1–0,5 с на кадр) не подвешивал интерфейс.
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';

const SIZE = 512;        // вход модели
const CRACK_ROW = 4;     // выход [1, 4 + 6 классов, 5376]: строка 4 — «трещина», единственный класс с проверенной точностью
const IOU = 0.45;

ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
// Потоки доступны только на изолированной странице (COOP/COEP); иначе — один поток
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

let session = null;

async function fetchModel(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Модель не загрузилась (код ${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    self.postMessage({ type: 'progress', loaded: got, total });
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function iou(a, b) {
  const ix = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const iy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const inter = ix * iy;
  return inter / ((a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter + 1e-9);
}

// Рамки в пикселях входа 512×512 (с полями letterbox — их снимает основной поток)
function decode(data, dims, minConf) {
  const n = dims[2];
  const boxes = [];
  for (let i = 0; i < n; i++) {
    const conf = data[CRACK_ROW * n + i];
    if (conf < minConf) continue;
    const cx = data[i]; const cy = data[n + i]; const w = data[2 * n + i]; const h = data[3 * n + i];
    boxes.push({ x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, conf });
  }
  boxes.sort((a, b) => b.conf - a.conf);
  const keep = [];
  for (const b of boxes) {
    if (keep.every((k) => iou(b, k) < IOU)) keep.push(b);
    if (keep.length >= 30) break;
  }
  return keep;
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') {
      const bytes = await fetchModel(msg.modelUrl);
      session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      // прогрев: первый запуск заметно дольше остальных
      await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', new Float32Array(3 * SIZE * SIZE), [1, 3, SIZE, SIZE]) });
      self.postMessage({ type: 'ready', threads: ort.env.wasm.numThreads });
    } else if (msg.type === 'run') {
      if (!session) throw new Error('Модель ещё не загружена');
      const t0 = performance.now();
      const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', msg.input, [1, 3, SIZE, SIZE]) });
      const tensor = out[session.outputNames[0]];
      const boxes = decode(tensor.data, tensor.dims, msg.minConf);
      self.postMessage({ type: 'result', id: msg.id, boxes, ms: Math.round(performance.now() - t0) });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String((err && err.message) || err) });
  }
};
