// Чтение PDF в браузере: картинка страницы для подложки и линии для поиска стен.
// pdf.js большой, поэтому подгружается только когда человек выбрал PDF.

import { segmentsFromOperatorList } from './pdfVector.js';

let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    }).catch((e) => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}

const MAX_SIDE_PX = 2600;

/**
 * @param {ArrayBuffer} buffer
 * @param {number} pageNumber с 1
 * @returns {Promise<{ pages:number, page:number, ptWidth:number, ptHeight:number, image:string,
 *                     segments:Array, layers:Array, skipped:number }>}
 */
export async function readPdfPage(buffer, pageNumber = 1) {
  const pdfjs = await loadPdfjs();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new Error('PDF защищён паролем — снимите защиту и загрузите снова.');
    throw new Error('Не удалось прочитать PDF: файл повреждён или это не PDF.');
  }
  try {
    const page = await doc.getPage(Math.min(Math.max(1, pageNumber), doc.numPages));
    // повёрнутые листы приводим к тому виду, как их видит человек
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(3, MAX_SIDE_PX / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const image = canvas.toDataURL('image/png');

    const vec = segmentsFromOperatorList(await page.getOperatorList(), pdfjs.OPS);
    // линии — в системе самого PDF; переводим в систему картинки (пункты, Y вверх от нижнего края повёрнутого листа)
    const t = base.transform; // [a, b, c, d, e, f]: PDF → экран (Y вниз)
    const map = (x, y) => [t[0] * x + t[2] * y + t[4], base.height - (t[1] * x + t[3] * y + t[5])];
    const segments = vec.segments.map((s) => {
      const [x1, y1] = map(s.x1, s.y1);
      const [x2, y2] = map(s.x2, s.y2);
      return { layer: s.layer, x1, y1, x2, y2 };
    });
    return { pages: doc.numPages, page: page.pageNumber, ptWidth: base.width, ptHeight: base.height, image, segments, layers: vec.layers, skipped: vec.skipped };
  } finally {
    doc.destroy();
  }
}

/** Картинку плана (JPG, PNG) читаем как подложку; большие уменьшаем, чтобы телефон не захлебнулся. */
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * k);
      canvas.height = Math.round(img.naturalHeight * k);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ image: canvas.toDataURL('image/jpeg', 0.9), width: canvas.width, height: canvas.height });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть картинку. Подойдут JPG и PNG.')); };
    img.src = url;
  });
}
