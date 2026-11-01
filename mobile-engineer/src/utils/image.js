// Image helpers: shrink camera photos before they are stored in localStorage or uploaded.

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Файл не является изображением'));
    img.src = src;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    else resolve(null);
  });
}

function dataUrlToBlob(dataUrl) {
  const [head, body] = String(dataUrl).split(',');
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const bin = atob(body || '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Downscale an image (File/Blob or data URL) to maxDim px on the longest side, JPEG `quality`.
 * Returns { dataUrl, blob, width, height }.
 */
export async function compressImage(source, maxDim = 1280, quality = 0.7) {
  let src;
  let objectUrl = null;
  if (typeof source === 'string') {
    src = source;
  } else {
    objectUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(source) : null;
    src = objectUrl || (await readFileAsDataURL(source));
  }
  try {
    const img = await loadImage(src);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(w0, h0 || 1));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas недоступен');
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = (await canvasToBlob(canvas, quality)) || dataUrlToBlob(dataUrl);
    return { dataUrl, blob, width: w, height: h };
  } catch (e) {
    // Fallback: keep the original (still usable, just bigger)
    if (typeof source === 'string') return { dataUrl: source, blob: dataUrlToBlob(source), width: 0, height: 0 };
    const dataUrl = await readFileAsDataURL(source);
    return { dataUrl, blob: source, width: 0, height: 0 };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
