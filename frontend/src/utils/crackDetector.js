/**
 * crackDetector.js v5 — Full image processing pipeline
 * 
 * Pipeline: Load → Grayscale → Histogram Equalization → Blur → Sobel → 
 *           Morphological Close → Overlay + Grid Regions
 * 
 * Key: Histogram equalization boosts low-contrast cracks to max visibility.
 */

const MAX_SIZE = 640;
const GRID = 10;

export async function detectCracks(source) {
  console.log('[CrackDetector] Starting analysis...');
  
  const img = await loadImage(source);
  console.log('[CrackDetector] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
  
  const { canvas, ctx } = createCanvas(img);
  const w = canvas.width;
  const h = canvas.height;
  console.log('[CrackDetector] Analysis size:', w, 'x', h);
  
  const pixels = ctx.getImageData(0, 0, w, h).data;
  console.log('[CrackDetector] Got pixel data, length:', pixels.length);

  // Step 1: Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  }

  // Step 2: Histogram Equalization — boost contrast of dim cracks
  const equalized = histogramEqualize(gray, w, h);
  console.log('[CrackDetector] Histogram equalization done');

  // Step 3: Gaussian Blur 5x5 (suppress texture noise)
  const blurred = gaussianBlur(equalized, w, h);

  // Step 4: Sobel Edge Detection
  const magnitude = new Float32Array(w * h);
  const sobelX = [-1,0,1,-2,0,2,-1,0,1];
  const sobelY = [-1,-2,-1,0,0,0,1,2,1];
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = blurred[(y + dy) * w + (x + dx)];
          gx += v * sobelX[ki];
          gy += v * sobelY[ki];
          ki++;
        }
      }
      magnitude[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Step 5: Find adaptive threshold using percentiles
  const nonZero = [];
  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] > 0) nonZero.push(magnitude[i]);
  }
  nonZero.sort((a, b) => a - b);
  
  const p70 = nonZero[Math.floor(nonZero.length * 0.70)] || 20;
  const p85 = nonZero[Math.floor(nonZero.length * 0.85)] || 40;
  const p95 = nonZero[Math.floor(nonZero.length * 0.95)] || 80;
  console.log('[CrackDetector] Edge thresholds: p70=', p70.toFixed(1), 'p85=', p85.toFixed(1), 'p95=', p95.toFixed(1));

  // Step 6: Morphological closing on strong edges (connect broken crack lines)
  const strongBinary = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    strongBinary[i] = magnitude[i] > p70 ? 1 : 0;
  }
  const closed = morphClose(strongBinary, w, h);

  // ---- OUTPUT 1: Annotated image (original + bright colored edge overlay) ----
  const annotatedCanvas = document.createElement('canvas');
  annotatedCanvas.width = w;
  annotatedCanvas.height = h;
  const aCtx = annotatedCanvas.getContext('2d');
  aCtx.drawImage(img, 0, 0, w, h);
  const imgData = aCtx.getImageData(0, 0, w, h);
  const px = imgData.data;

  let edgeCount = 0;
  for (let i = 0; i < w * h; i++) {
    const m = magnitude[i];
    const isClosed = closed[i];
    
    if (m > p95) {
      // Very strong edge → bright cyan, high opacity
      px[i * 4]     = 0;                          // R → dark
      px[i * 4 + 1] = Math.min(255, Math.round(px[i * 4 + 1] * 0.3 + 180)); // G → bright
      px[i * 4 + 2] = 255;                        // B → max
      edgeCount++;
    } else if (m > p85 || (isClosed && m > p70)) {
      // Strong edge → visible cyan overlay
      const blend = 0.55;
      px[i * 4]     = Math.round(px[i * 4] * (1 - blend) + 20 * blend);
      px[i * 4 + 1] = Math.round(px[i * 4 + 1] * (1 - blend) + 200 * blend);
      px[i * 4 + 2] = Math.round(px[i * 4 + 2] * (1 - blend) + 255 * blend);
      edgeCount++;
    } else if (m > p70) {
      // Medium edge → subtle tint
      const blend = 0.25;
      px[i * 4 + 1] = Math.min(255, Math.round(px[i * 4 + 1] + 40 * blend));
      px[i * 4 + 2] = Math.min(255, Math.round(px[i * 4 + 2] + 80 * blend));
    }
  }
  
  aCtx.putImageData(imgData, 0, 0);
  
  // Draw thick lines along strongest edges for extra visibility
  aCtx.strokeStyle = 'rgba(0, 180, 255, 0.6)';
  aCtx.lineWidth = 2;
  aCtx.beginPath();
  for (let y = 2; y < h - 2; y += 2) {
    for (let x = 2; x < w - 2; x += 2) {
      if (magnitude[y * w + x] > p95) {
        aCtx.rect(x - 1, y - 1, 3, 3);
      }
    }
  }
  aCtx.stroke();
  
  const annotatedDataUrl = annotatedCanvas.toDataURL('image/jpeg', 0.92);
  console.log('[CrackDetector] Annotated image created. Edge pixels:', edgeCount);

  // ---- OUTPUT 2: Grid-based regions ----
  const cellW = Math.floor(w / GRID);
  const cellH = Math.floor(h / GRID);
  const cells = [];
  
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x0 = gx * cellW, y0 = gy * cellH;
      const x1 = Math.min(x0 + cellW, w), y1 = Math.min(y0 + cellH, h);
      let strong = 0, total = 0;
      
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          total++;
          if (magnitude[py * w + px] > p85) strong++;
        }
      }
      
      cells.push({ gx, gy, x0, y0, x1, y1, ratio: strong / Math.max(total, 1) });
    }
  }
  
  // Top 30% of cells are "defect zones"
  const sortedCells = [...cells].sort((a, b) => b.ratio - a.ratio);
  const topN = Math.max(3, Math.ceil(cells.length * 0.3));
  const hotKeys = new Set(sortedCells.slice(0, topN).map(c => `${c.gx},${c.gy}`));

  // Cluster adjacent hot cells
  const visited = new Set();
  const clusters = [];
  
  for (const cell of cells) {
    const key = `${cell.gx},${cell.gy}`;
    if (!hotKeys.has(key) || visited.has(key)) continue;
    
    const cluster = [];
    const queue = [cell];
    visited.add(key);
    
    while (queue.length > 0) {
      const c = queue.shift();
      cluster.push(c);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nk = `${c.gx+dx},${c.gy+dy}`;
          if (!visited.has(nk) && hotKeys.has(nk)) {
            visited.add(nk);
            const n = cells.find(h => h.gx === c.gx+dx && h.gy === c.gy+dy);
            if (n) queue.push(n);
          }
        }
      }
    }
    clusters.push(cluster);
  }

  const regions = clusters.map((cluster, idx) => {
    const minX = Math.min(...cluster.map(c => c.x0));
    const minY = Math.min(...cluster.map(c => c.y0));
    const maxX = Math.max(...cluster.map(c => c.x1));
    const maxY = Math.max(...cluster.map(c => c.y1));
    const maxRatio = Math.max(...cluster.map(c => c.ratio));
    const relSize = ((maxX-minX) * (maxY-minY)) / (w * h);

    const severity =
      maxRatio > 0.20 ? 'critical' :
      maxRatio > 0.10 ? 'high' :
      maxRatio > 0.05 ? 'medium' : 'low';

    return {
      id: idx + 1,
      bbox: [(minX/w)*100, (minY/h)*100, (maxX/w)*100, (maxY/h)*100],
      severity,
      confidence: Math.min(0.99, 0.5 + maxRatio * 3),
      edgeDensity: maxRatio,
      area_percent: (relSize * 100).toFixed(1),
      avgContrast: maxRatio * 100,
      cellCount: cluster.length,
    };
  }).sort((a, b) => b.confidence - a.confidence).slice(0, 8);

  console.log('[CrackDetector] Found', regions.length, 'regions');

  // ---- OUTPUT 3: Edge map for skeleton view ----
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = w; edgeCanvas.height = h;
  const eCtx = edgeCanvas.getContext('2d');
  const eData = eCtx.createImageData(w, h);
  
  for (let i = 0; i < w * h; i++) {
    const m = magnitude[i];
    const bg = Math.round(equalized[i] * 0.25); // dimmed equalized as background
    
    if (m > p85) {
      eData.data[i*4] = 0;
      eData.data[i*4+1] = Math.min(255, Math.round((m / p95) * 200));
      eData.data[i*4+2] = 255;
    } else {
      eData.data[i*4] = bg;
      eData.data[i*4+1] = bg;
      eData.data[i*4+2] = Math.round(bg * 1.1);
    }
    eData.data[i*4+3] = 255;
  }
  eCtx.putImageData(eData, 0, 0);

  return { regions, edgeCanvas, annotatedDataUrl, scale: 1 };
}

// ========== Image Processing Functions ==========

function histogramEqualize(gray, w, h) {
  // Build histogram (256 bins)
  const hist = new Int32Array(256);
  for (let i = 0; i < w * h; i++) {
    hist[Math.min(255, Math.max(0, Math.round(gray[i])))]++;
  }
  
  // CDF
  const cdf = new Int32Array(256);
  cdf[0] = hist[0];
  for (let i = 1; i < 256; i++) cdf[i] = cdf[i-1] + hist[i];
  
  // Find cdf_min (first non-zero)
  let cdfMin = 0;
  for (let i = 0; i < 256; i++) { if (cdf[i] > 0) { cdfMin = cdf[i]; break; } }
  
  // Mapping
  const total = w * h;
  const map = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    map[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
  }
  
  // Apply
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    out[i] = map[Math.min(255, Math.max(0, Math.round(gray[i])))];
  }
  return out;
}

function gaussianBlur(gray, w, h) {
  const k = [1,4,7,4,1, 4,16,26,16,4, 7,26,41,26,7, 4,16,26,16,4, 1,4,7,4,1];
  const out = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      let s = 0, ki = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += gray[(y+dy)*w+(x+dx)] * k[ki++];
      out[y*w+x] = s / 273;
    }
  }
  // Copy borders
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (y < 2 || y >= h-2 || x < 2 || x >= w-2) out[y*w+x] = gray[y*w+x];
  }
  return out;
}

function morphClose(binary, w, h) {
  // Dilate then Erode (close small gaps in edges)
  const dilated = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (binary[y*w+x]) { dilated[y*w+x] = 1; continue; }
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (binary[(y+dy)*w+(x+dx)]) { dilated[y*w+x] = 1; dy = 2; break; }
        }
      }
    }
  }
  // Erode
  const eroded = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (!dilated[y*w+x]) continue;
      let allSet = true;
      for (let dy = -1; dy <= 1 && allSet; dy++) {
        for (let dx = -1; dx <= 1 && allSet; dx++) {
          if (!dilated[(y+dy)*w+(x+dx)]) allSet = false;
        }
      }
      eroded[y*w+x] = allSet ? 1 : 0;
    }
  }
  return eroded;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src && src.src);
    if (!url) return reject(new Error('No image source provided'));
    // Do NOT set crossOrigin for data: or blob: URLs — it taints the canvas!
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth > 0) resolve(img);
      else reject(new Error('Image has 0 dimensions'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

function createCanvas(img) {
  const c = document.createElement('canvas');
  let w = img.naturalWidth || img.width || 400;
  let h = img.naturalHeight || img.height || 300;
  if (Math.max(w,h) > MAX_SIZE) {
    const s = MAX_SIZE / Math.max(w,h);
    w = Math.round(w*s); h = Math.round(h*s);
  }
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return { canvas: c, ctx: c.getContext('2d') };
}
