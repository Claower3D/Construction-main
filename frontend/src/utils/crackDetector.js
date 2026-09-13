/**
 * crackDetector.js — Client-side crack/defect detection via Canvas pixel analysis
 * 
 * Algorithm: Grayscale -> Gaussian Blur -> Sobel Edge Detection -> 
 *            Multi-pass Adaptive Threshold -> Thin edges -> Connected Components -> BBox
 * 
 * No dependencies, runs entirely in browser.
 */

const MAX_ANALYSIS_SIZE = 600;

/**
 * Main entry point
 * @param {HTMLImageElement|string} source
 * @returns {Promise<{regions: Array, edgeCanvas: HTMLCanvasElement}>}
 */
export async function detectCracks(source) {
  const img = await loadImage(source);
  const { canvas, ctx, scale } = createAnalysisCanvas(img);
  const w = canvas.width;
  const h = canvas.height;
  const pixels = ctx.getImageData(0, 0, w, h).data;

  // Step 1: Grayscale
  const gray = toGrayscale(pixels, w, h);
  
  // Step 2: Gaussian Blur
  const blurred = gaussianBlur5x5(gray, w, h);
  
  // Step 3: Sobel Edge Detection
  const { magnitude, direction } = sobelEdgeDetection(blurred, w, h);
  
  // Step 4: Non-Maximum Suppression (thin edges to 1px width)
  const thinned = nonMaxSuppression(magnitude, direction, w, h);
  
  // Step 5: Multi-pass detection — try strict first, then relax
  let regions = [];
  const thresholds = [0.35, 0.25, 0.18];
  
  for (const threshFactor of thresholds) {
    const maxMag = findPercentile(thinned, 99); // Use 99th percentile, not max (avoids outliers)
    const threshold = maxMag * threshFactor;
    
    const binary = new Uint8Array(w * h);
    for (let i = 0; i < thinned.length; i++) {
      binary[i] = thinned[i] > threshold ? 1 : 0;
    }
    
    // Single dilation to connect nearby thin edges
    const dilated = dilate(binary, w, h);
    
    // Connected Components
    const { labels, count } = connectedComponents(dilated, w, h);
    
    // Compute properties
    const components = computeComponentProps(labels, magnitude, gray, w, h, count);
    
    // Filter
    const minPixels = w * h * 0.001;  // At least 0.1% of image in edge pixels
    const maxBboxArea = w * h * 0.6;  // BBox can be up to 60% of image
    const minBboxArea = w * h * 0.002; // BBox at least 0.2% of image
    
    const significant = components.filter(c =>
      c.pixelCount >= minPixels &&
      c.bboxArea >= minBboxArea &&
      c.bboxArea <= maxBboxArea &&
      c.edgeDensity >= 0.02 && // At least 2% of bbox is edges
      (c.aspectRatio >= 1.3 || c.pixelCount > w * h * 0.01) // Elongated OR large
    );
    
    if (significant.length >= 1) {
      // Sort: prefer elongated high-density regions (crack-like)
      significant.sort((a, b) => {
        const scoreA = a.edgeDensity * a.aspectRatio * Math.sqrt(a.pixelCount);
        const scoreB = b.edgeDensity * b.aspectRatio * Math.sqrt(b.pixelCount);
        return scoreB - scoreA;
      });
      
      regions = significant.slice(0, 10);
      
      // Merge overlapping
      regions = mergeOverlapping(regions);
      break;
    }
  }
  
  // Convert to percentage coords
  const result = regions.map((c, idx) => {
    const xPct = (c.minX / w) * 100;
    const yPct = (c.minY / h) * 100;
    const wPct = ((c.maxX - c.minX) / w) * 100;
    const hPct = ((c.maxY - c.minY) / h) * 100;
    const relSize = c.bboxArea / (w * h);
    
    const severity =
      (c.edgeDensity > 0.15 && c.aspectRatio > 2) ? 'critical' :
      (c.edgeDensity > 0.08 || relSize > 0.1) ? 'high' :
      (c.edgeDensity > 0.04) ? 'medium' : 'low';

    return {
      id: idx + 1,
      bbox: [xPct, yPct, xPct + wPct, yPct + hPct],
      severity,
      confidence: Math.min(0.99, 0.55 + c.edgeDensity * 2 + (c.aspectRatio > 2 ? 0.15 : 0)),
      edgeDensity: c.edgeDensity,
      area_percent: (relSize * 100).toFixed(1),
      pixelCount: c.pixelCount,
      avgContrast: c.avgContrast,
      aspectRatio: c.aspectRatio,
    };
  });

  // Edge visualization
  const edgeCanvas = createEdgeVisualization(magnitude, thinned, w, h);

  return { regions: result, edgeCanvas, scale };
}

// ========== Helpers ==========

function loadImage(source) {
  return new Promise((resolve) => {
    if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
      resolve(source);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = typeof source === 'string' ? source : source.src;
  });
}

function createAnalysisCanvas(img) {
  const canvas = document.createElement('canvas');
  let w = img.naturalWidth || img.width || 400;
  let h = img.naturalHeight || img.height || 300;
  let scale = 1;
  if (Math.max(w, h) > MAX_ANALYSIS_SIZE) {
    scale = MAX_ANALYSIS_SIZE / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, scale };
}

function toGrayscale(pixels, w, h) {
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  }
  return gray;
}

function gaussianBlur5x5(gray, w, h) {
  // 5x5 Gaussian kernel sigma=1.4
  const k = [
    1, 4, 7, 4, 1,
    4, 16, 26, 16, 4,
    7, 26, 41, 26, 7,
    4, 16, 26, 16, 4,
    1, 4, 7, 4, 1
  ];
  const kSum = 273;
  const out = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      let sum = 0, ki = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          sum += gray[(y + dy) * w + (x + dx)] * k[ki++];
        }
      }
      out[y * w + x] = sum / kSum;
    }
  }
  // Copy edges
  for (let y = 0; y < 2; y++) for (let x = 0; x < w; x++) out[y * w + x] = gray[y * w + x];
  for (let y = h - 2; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = gray[y * w + x];
  for (let y = 0; y < h; y++) { out[y * w] = gray[y * w]; out[y * w + 1] = gray[y * w + 1]; out[y * w + w - 1] = gray[y * w + w - 1]; out[y * w + w - 2] = gray[y * w + w - 2]; }
  return out;
}

function sobelEdgeDetection(gray, w, h) {
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sumX = 0, sumY = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const val = gray[(y + dy) * w + (x + dx)];
          sumX += val * gx[ki];
          sumY += val * gy[ki];
          ki++;
        }
      }
      magnitude[y * w + x] = Math.sqrt(sumX * sumX + sumY * sumY);
      direction[y * w + x] = Math.atan2(sumY, sumX);
    }
  }
  return { magnitude, direction };
}

/** Non-Maximum Suppression — thin edges to 1px lines (Canny step) */
function nonMaxSuppression(mag, dir, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const m = mag[i];
      if (m === 0) continue;
      
      // Quantize direction to 4 angles
      let angle = dir[i] * (180 / Math.PI);
      if (angle < 0) angle += 180;
      
      let n1 = 0, n2 = 0;
      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
        n1 = mag[i - 1]; n2 = mag[i + 1]; // horizontal
      } else if (angle >= 22.5 && angle < 67.5) {
        n1 = mag[(y - 1) * w + (x + 1)]; n2 = mag[(y + 1) * w + (x - 1)]; // diagonal
      } else if (angle >= 67.5 && angle < 112.5) {
        n1 = mag[(y - 1) * w + x]; n2 = mag[(y + 1) * w + x]; // vertical
      } else {
        n1 = mag[(y - 1) * w + (x - 1)]; n2 = mag[(y + 1) * w + (x + 1)]; // other diagonal
      }
      
      out[i] = (m >= n1 && m >= n2) ? m : 0;
    }
  }
  return out;
}

function findPercentile(arr, pct) {
  const sorted = Array.from(arr).filter(v => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 1;
  const idx = Math.floor(sorted.length * pct / 100);
  return sorted[Math.min(idx, sorted.length - 1)];
}

function dilate(binary, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (binary[y * w + x]) { out[y * w + x] = 1; continue; }
      outer: for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (binary[(y + dy) * w + (x + dx)]) { out[y * w + x] = 1; break outer; }
        }
      }
    }
  }
  return out;
}

function connectedComponents(binary, w, h) {
  const labels = new Int32Array(w * h);
  let currentLabel = 0;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (binary[y * w + x] && !labels[y * w + x]) {
        currentLabel++;
        const queue = [x + y * w]; // Use flat indices for speed
        labels[y * w + x] = currentLabel;
        let head = 0;
        
        while (head < queue.length) {
          const ci = queue[head++];
          const cx = ci % w;
          const cy = (ci - cx) / w;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx, ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const ni = ny * w + nx;
                if (binary[ni] && !labels[ni]) {
                  labels[ni] = currentLabel;
                  queue.push(ni);
                }
              }
            }
          }
        }
      }
    }
  }
  return { labels, count: currentLabel };
}

function computeComponentProps(labels, mag, gray, w, h, count) {
  const components = [];
  const data = new Array(count + 1);
  for (let i = 1; i <= count; i++) {
    data[i] = { minX: w, minY: h, maxX: 0, maxY: 0, px: 0, edgeSum: 0, contrastSum: 0 };
  }
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = labels[y * w + x];
      if (!l) continue;
      const d = data[l];
      d.px++;
      if (x < d.minX) d.minX = x;
      if (y < d.minY) d.minY = y;
      if (x > d.maxX) d.maxX = x;
      if (y > d.maxY) d.maxY = y;
      d.edgeSum += mag[y * w + x];
      
      // Local contrast (3x3)
      let lo = 255, hi = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            const v = gray[ny * w + nx];
            if (v < lo) lo = v;
            if (v > hi) hi = v;
          }
        }
      }
      d.contrastSum += (hi - lo);
    }
  }
  
  for (let l = 1; l <= count; l++) {
    const d = data[l];
    if (d.px === 0) continue;
    
    const pad = 3;
    const minX = Math.max(0, d.minX - pad);
    const minY = Math.max(0, d.minY - pad);
    const maxX = Math.min(w - 1, d.maxX + pad);
    const maxY = Math.min(h - 1, d.maxY + pad);
    const bw = maxX - minX;
    const bh = maxY - minY;
    const bboxArea = bw * bh;
    const aspectRatio = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
    
    components.push({
      label: l, minX, minY, maxX, maxY,
      pixelCount: d.px,
      bboxArea,
      edgeDensity: d.px / Math.max(bboxArea, 1),
      avgEdge: d.edgeSum / d.px,
      avgContrast: d.contrastSum / d.px,
      aspectRatio,
    });
  }
  return components;
}

function mergeOverlapping(regions) {
  if (regions.length <= 1) return regions;
  const merged = [...regions];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const a = merged[i], b = merged[j];
        const ox = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
        const oy = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
        const oa = ox * oy;
        if (oa > Math.min(a.bboxArea, b.bboxArea) * 0.5) {
          const minX = Math.min(a.minX, b.minX), minY = Math.min(a.minY, b.minY);
          const maxX = Math.max(a.maxX, b.maxX), maxY = Math.max(a.maxY, b.maxY);
          merged[i] = {
            minX, minY, maxX, maxY,
            pixelCount: a.pixelCount + b.pixelCount,
            bboxArea: (maxX - minX) * (maxY - minY),
            edgeDensity: Math.max(a.edgeDensity, b.edgeDensity),
            avgEdge: (a.avgEdge + b.avgEdge) / 2,
            avgContrast: Math.max(a.avgContrast, b.avgContrast),
            aspectRatio: Math.max(maxX - minX, maxY - minY) / Math.max(1, Math.min(maxX - minX, maxY - minY)),
          };
          merged.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return merged;
}

function createEdgeVisualization(mag, thinned, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(w, h);
  
  const maxMag = findPercentile(mag, 99);
  
  for (let i = 0; i < w * h; i++) {
    const edgeVal = Math.min(255, (mag[i] / maxMag) * 255);
    const isThin = thinned[i] > maxMag * 0.15;
    
    if (isThin) {
      // Strong thin edge — bright cyan
      const intensity = Math.min(255, edgeVal * 1.5);
      imgData.data[i * 4] = 0;
      imgData.data[i * 4 + 1] = Math.round(intensity * 0.85);
      imgData.data[i * 4 + 2] = 255;
      imgData.data[i * 4 + 3] = 255;
    } else {
      // Background — subtle gradient
      const bg = Math.round(edgeVal * 0.3);
      imgData.data[i * 4] = bg;
      imgData.data[i * 4 + 1] = bg;
      imgData.data[i * 4 + 2] = Math.round(bg * 1.2);
      imgData.data[i * 4 + 3] = 255;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
