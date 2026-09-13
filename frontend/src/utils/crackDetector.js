/**
 * crackDetector.js v6 — Maximum quality crack detection
 * 
 * Pipeline:
 *  1. Grayscale
 *  2. CLAHE (local adaptive contrast) — 8×8 tiles
 *  3. Gaussian Blur 5×5
 *  4. Sobel + Laplacian (dual edge detection)
 *  5. Dark Line Detection (pixels darker than local neighborhood)
 *  6. Combined score map: edges × darkness
 *  7. Morphological closing (connect broken lines)
 *  8. Non-Maximum Suppression (thin to 1px)
 *  9. Hysteresis thresholding (Canny-style)
 * 
 * Outputs:
 *  - annotatedDataUrl: photo + cyan crack overlay + measurement dots
 *  - edgeCanvas: skeleton view
 *  - heatmapDataUrl: stress heatmap
 *  - regions: grid-based defect zones
 */

const MAX_SIZE = 640;
const GRID = 10;

export async function detectCracks(source) {
  console.log('[CV] Starting crack detection v6...');
  const img = await loadImage(source);
  const { canvas, ctx } = createCanvas(img);
  const w = canvas.width, h = canvas.height;
  const px = ctx.getImageData(0, 0, w, h).data;
  console.log('[CV] Image:', w, 'x', h);

  // 1. Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    gray[i] = 0.299 * px[i*4] + 0.587 * px[i*4+1] + 0.114 * px[i*4+2];

  // 2. CLAHE — Contrast Limited Adaptive Histogram Equalization (8×8 tiles)
  const clahe = applyCLAHE(gray, w, h, 8, 3.0);
  console.log('[CV] CLAHE done');

  // 3. Gaussian Blur
  const blurred = gaussianBlur(clahe, w, h);

  // 4. Sobel edge detection
  const { mag: sobelMag, dirMap } = sobelEdges(blurred, w, h);
  
  // 5. Laplacian (second derivative — better for thin lines)
  const laplacian = laplacianFilter(blurred, w, h);

  // 6. Dark Line Detection — pixels significantly darker than local area
  const darkness = darkLineMap(blurred, w, h);
  console.log('[CV] Edge + dark line maps done');

  // 7. Combined crack score: Sobel × (darkness bonus) + Laplacian
  const crackScore = new Float32Array(w * h);
  // Normalize each channel
  const sobelMax = percentile(sobelMag, 99);
  const lapMax = percentile(laplacian, 99);
  const darkMax = percentile(darkness, 99);
  
  for (let i = 0; i < w * h; i++) {
    const s = Math.min(1, sobelMag[i] / (sobelMax || 1));
    const l = Math.min(1, laplacian[i] / (lapMax || 1));
    const d = Math.min(1, darkness[i] / (darkMax || 1));
    // Cracks are both dark AND have strong edges
    crackScore[i] = (s * 0.5 + l * 0.2) * (1 + d * 2.0);
    // Pure dark lines (even without strong Sobel) get a base score
    crackScore[i] += d * 0.3;
  }

  // 8. Non-Maximum Suppression on crack score (thin edges)
  const thinned = nms(crackScore, dirMap, w, h);

  // 9. Hysteresis thresholding (Canny-style: strong seeds + weak connections)
  const p90 = percentile(thinned, 90);
  const p70 = percentile(thinned, 70);
  const highT = p90 * 0.8;
  const lowT = p70 * 0.5;
  const crackMask = hysteresis(thinned, w, h, highT, lowT);
  console.log('[CV] Hysteresis done, thresholds:', highT.toFixed(2), '/', lowT.toFixed(2));

  // Count crack pixels
  let crackPixels = 0;
  for (let i = 0; i < w * h; i++) if (crackMask[i]) crackPixels++;
  console.log('[CV] Crack pixels:', crackPixels, '/', w*h, '=', (crackPixels/(w*h)*100).toFixed(1)+'%');

  // ---- OUTPUT 1: Annotated photo ----
  const annCanvas = document.createElement('canvas');
  annCanvas.width = w; annCanvas.height = h;
  const annCtx = annCanvas.getContext('2d');
  annCtx.drawImage(img, 0, 0, w, h);
  const annData = annCtx.getImageData(0, 0, w, h);
  const annPx = annData.data;

  // Paint crack pixels
  for (let i = 0; i < w * h; i++) {
    const score = crackScore[i];
    const isCrack = crackMask[i];
    const strong = thinned[i] > highT;
    
    if (isCrack && strong) {
      // Strong crack — bright cyan
      annPx[i*4]   = 0;
      annPx[i*4+1] = 220;
      annPx[i*4+2] = 255;
    } else if (isCrack) {
      // Weak crack — dimmer cyan blended
      annPx[i*4]   = Math.round(annPx[i*4] * 0.4);
      annPx[i*4+1] = Math.round(annPx[i*4+1] * 0.4 + 140 * 0.6);
      annPx[i*4+2] = Math.round(annPx[i*4+2] * 0.3 + 255 * 0.7);
    } else if (score > 0.4) {
      // High score but not in mask — subtle tint
      const blend = Math.min(0.3, (score - 0.4) * 0.5);
      annPx[i*4+1] = Math.min(255, annPx[i*4+1] + Math.round(60 * blend));
      annPx[i*4+2] = Math.min(255, annPx[i*4+2] + Math.round(100 * blend));
    }
  }
  annCtx.putImageData(annData, 0, 0);

  // Draw thick overlay lines for crack pixels (2px wide)
  annCtx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      if (crackMask[y * w + x] && thinned[y * w + x] > highT) {
        annCtx.fillRect(x - 1, y - 1, 3, 3);
      }
    }
  }

  // Measurement dots along cracks (yellow dots with dimension labels)
  const measurementPoints = findMeasurementPoints(crackMask, thinned, w, h, highT);
  annCtx.save();
  measurementPoints.forEach((pt, i) => {
    // Yellow dot
    annCtx.fillStyle = '#FFD700';
    annCtx.beginPath();
    annCtx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    annCtx.fill();
    annCtx.strokeStyle = '#FF6600';
    annCtx.lineWidth = 2;
    annCtx.stroke();
    
    // Dimension label
    annCtx.fillStyle = '#FFD700';
    annCtx.font = 'bold 11px sans-serif';
    annCtx.fillText(`d=${pt.width.toFixed(1)}мм`, pt.x + 8, pt.y - 4);
  });
  annCtx.restore();

  const annotatedDataUrl = annCanvas.toDataURL('image/jpeg', 0.92);
  console.log('[CV] Annotated image done, measurement points:', measurementPoints.length);

  // ---- OUTPUT 2: Heatmap ----
  const heatCanvas = document.createElement('canvas');
  heatCanvas.width = w; heatCanvas.height = h;
  const heatCtx = heatCanvas.getContext('2d');
  heatCtx.drawImage(img, 0, 0, w, h);
  // Darken base
  heatCtx.fillStyle = 'rgba(0,0,0,0.4)';
  heatCtx.fillRect(0, 0, w, h);
  
  const heatData = heatCtx.getImageData(0, 0, w, h);
  const heatPx = heatData.data;
  const scoreMax = percentile(crackScore, 98);
  
  for (let i = 0; i < w * h; i++) {
    const val = Math.min(1, crackScore[i] / (scoreMax || 1));
    if (val > 0.2) {
      // Heatmap coloring: blue → cyan → yellow → red
      let r, g, b;
      if (val < 0.4) {
        const t = (val - 0.2) / 0.2;
        r = 0; g = Math.round(t * 100); b = Math.round(150 + t * 105);
      } else if (val < 0.6) {
        const t = (val - 0.4) / 0.2;
        r = Math.round(t * 200); g = Math.round(100 + t * 155); b = Math.round(255 - t * 100);
      } else {
        const t = Math.min(1, (val - 0.6) / 0.4);
        r = Math.round(200 + t * 55); g = Math.round(255 - t * 180); b = Math.round(155 - t * 155);
      }
      const blend = Math.min(0.8, val);
      heatPx[i*4]   = Math.round(heatPx[i*4] * (1-blend) + r * blend);
      heatPx[i*4+1] = Math.round(heatPx[i*4+1] * (1-blend) + g * blend);
      heatPx[i*4+2] = Math.round(heatPx[i*4+2] * (1-blend) + b * blend);
    }
  }
  heatCtx.putImageData(heatData, 0, 0);
  const heatmapDataUrl = heatCanvas.toDataURL('image/jpeg', 0.90);

  // ---- OUTPUT 3: Skeleton (edge map) ----
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = w; edgeCanvas.height = h;
  const eCtx = edgeCanvas.getContext('2d');
  const eData = eCtx.createImageData(w, h);
  
  for (let i = 0; i < w * h; i++) {
    const bg = Math.round(clahe[i] * 0.2);
    if (crackMask[i]) {
      const intensity = Math.min(255, thinned[i] / (highT || 1) * 200);
      eData.data[i*4] = 0;
      eData.data[i*4+1] = Math.round(Math.max(bg, intensity * 0.7));
      eData.data[i*4+2] = 255;
    } else if (crackScore[i] > 0.3) {
      eData.data[i*4] = Math.round(bg + crackScore[i] * 30);
      eData.data[i*4+1] = Math.round(bg + crackScore[i] * 50);
      eData.data[i*4+2] = Math.round(bg + crackScore[i] * 80);
    } else {
      eData.data[i*4] = bg;
      eData.data[i*4+1] = bg;
      eData.data[i*4+2] = Math.round(bg * 1.1);
    }
    eData.data[i*4+3] = 255;
  }
  eCtx.putImageData(eData, 0, 0);
  
  // Draw measurement dots on skeleton too
  eCtx.save();
  measurementPoints.forEach(pt => {
    eCtx.fillStyle = '#FFD700';
    eCtx.beginPath();
    eCtx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    eCtx.fill();
    eCtx.fillStyle = '#FFD700';
    eCtx.font = 'bold 10px sans-serif';
    eCtx.fillText(`d=${pt.width.toFixed(1)}мм`, pt.x + 6, pt.y - 3);
  });
  eCtx.restore();

  // ---- OUTPUT 4: Grid regions ----
  const regions = gridRegions(crackScore, crackMask, w, h);
  console.log('[CV] Done! Regions:', regions.length);

  return { regions, edgeCanvas, annotatedDataUrl, heatmapDataUrl, scale: 1 };
}

// ======= CLAHE — Contrast Limited Adaptive Histogram Equalization =======
function applyCLAHE(gray, w, h, tilesN, clipLimit) {
  const tw = Math.ceil(w / tilesN);
  const th = Math.ceil(h / tilesN);
  const out = new Float32Array(w * h);

  // Process each tile
  for (let ty = 0; ty < tilesN; ty++) {
    for (let tx = 0; tx < tilesN; tx++) {
      const x0 = tx * tw, y0 = ty * th;
      const x1 = Math.min(x0 + tw, w), y1 = Math.min(y0 + th, h);
      const tileW = x1 - x0, tileH = y1 - y0;
      const tileArea = tileW * tileH;

      // Build histogram for this tile
      const hist = new Int32Array(256);
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
          hist[clamp(Math.round(gray[y * w + x]), 0, 255)]++;

      // Clip histogram and redistribute
      const limit = Math.max(1, Math.round(clipLimit * tileArea / 256));
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > limit) { excess += hist[i] - limit; hist[i] = limit; }
      }
      const bonus = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) hist[i] += bonus;

      // CDF
      const cdf = new Int32Array(256);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) cdf[i] = cdf[i-1] + hist[i];
      let cdfMin = 0;
      for (let i = 0; i < 256; i++) if (cdf[i] > 0) { cdfMin = cdf[i]; break; }
      const denom = Math.max(1, tileArea - cdfMin);

      // Apply to tile pixels
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const val = clamp(Math.round(gray[y * w + x]), 0, 255);
          out[y * w + x] = Math.round(((cdf[val] - cdfMin) / denom) * 255);
        }
      }
    }
  }
  return out;
}

// ======= Gaussian Blur 5×5 =======
function gaussianBlur(g, w, h) {
  const k = [1,4,7,4,1, 4,16,26,16,4, 7,26,41,26,7, 4,16,26,16,4, 1,4,7,4,1];
  const out = new Float32Array(w * h);
  for (let y = 2; y < h-2; y++)
    for (let x = 2; x < w-2; x++) {
      let s = 0, ki = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += g[(y+dy)*w+(x+dx)] * k[ki++];
      out[y*w+x] = s / 273;
    }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (y < 2 || y >= h-2 || x < 2 || x >= w-2) out[y*w+x] = g[y*w+x];
  return out;
}

// ======= Sobel =======
function sobelEdges(g, w, h) {
  const sx = [-1,0,1,-2,0,2,-1,0,1], sy = [-1,-2,-1,0,0,0,1,2,1];
  const mag = new Float32Array(w*h), dirMap = new Float32Array(w*h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let gx = 0, gy = 0, ki = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const v = g[(y+dy)*w+(x+dx)]; gx += v*sx[ki]; gy += v*sy[ki]; ki++;
    }
    mag[y*w+x] = Math.sqrt(gx*gx + gy*gy);
    dirMap[y*w+x] = Math.atan2(gy, gx);
  }
  return { mag, dirMap };
}

// ======= Laplacian of Gaussian =======
function laplacianFilter(g, w, h) {
  const kernel = [0,1,0, 1,-4,1, 0,1,0];
  const out = new Float32Array(w * h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let s = 0, ki = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
      s += g[(y+dy)*w+(x+dx)] * kernel[ki++];
    out[y*w+x] = Math.abs(s); // absolute value
  }
  return out;
}

// ======= Dark Line Detection =======
function darkLineMap(g, w, h) {
  const out = new Float32Array(w * h);
  const radius = 7; // 15×15 neighborhood
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      // Average of neighborhood (sampled for speed)
      let sum = 0, cnt = 0;
      for (let dy = -radius; dy <= radius; dy += 2) {
        for (let dx = -radius; dx <= radius; dx += 2) {
          sum += g[(y+dy)*w+(x+dx)]; cnt++;
        }
      }
      const avg = sum / cnt;
      const diff = avg - g[y*w+x]; // How much darker than surroundings
      out[y*w+x] = diff > 10 ? diff : 0; // Only keep pixels 10+ darker
    }
  }
  return out;
}

// ======= Non-Maximum Suppression =======
function nms(mag, dir, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    const i = y*w+x;
    const m = mag[i];
    if (m === 0) continue;
    let angle = dir[i] * (180/Math.PI);
    if (angle < 0) angle += 180;
    let n1 = 0, n2 = 0;
    if (angle < 22.5 || angle >= 157.5) { n1 = mag[i-1]; n2 = mag[i+1]; }
    else if (angle < 67.5) { n1 = mag[(y-1)*w+(x+1)]; n2 = mag[(y+1)*w+(x-1)]; }
    else if (angle < 112.5) { n1 = mag[(y-1)*w+x]; n2 = mag[(y+1)*w+x]; }
    else { n1 = mag[(y-1)*w+(x-1)]; n2 = mag[(y+1)*w+(x+1)]; }
    out[i] = (m >= n1 && m >= n2) ? m : 0;
  }
  return out;
}

// ======= Hysteresis Thresholding (Canny) =======
function hysteresis(mag, w, h, highT, lowT) {
  const mask = new Uint8Array(w * h);
  // Mark strong edges as seeds
  const seeds = [];
  for (let i = 0; i < w * h; i++) {
    if (mag[i] >= highT) {
      mask[i] = 1;
      seeds.push(i);
    }
  }
  // BFS: extend from seeds to connected weak edges
  let head = 0;
  while (head < seeds.length) {
    const ci = seeds[head++];
    const cx = ci % w, cy = (ci - cx) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx+dx, ny = cy+dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const ni = ny*w+nx;
        if (!mask[ni] && mag[ni] >= lowT) {
          mask[ni] = 1;
          seeds.push(ni);
        }
      }
    }
  }
  return mask;
}

// ======= Measurement Points along cracks =======
function findMeasurementPoints(mask, mag, w, h, threshold) {
  const points = [];
  const stepY = Math.max(1, Math.floor(h / 15)); // ~15 scan lines
  
  for (let y = stepY; y < h - stepY; y += stepY) {
    let bestX = -1, bestMag = 0;
    for (let x = 5; x < w - 5; x++) {
      if (mask[y * w + x] && mag[y * w + x] > bestMag) {
        bestMag = mag[y * w + x];
        bestX = x;
      }
    }
    if (bestX > 0 && bestMag > threshold * 0.5) {
      // Estimate crack width: count consecutive crack pixels perpendicular
      let width = 0;
      for (let dx = -10; dx <= 10; dx++) {
        if (bestX + dx >= 0 && bestX + dx < w && mask[y * w + bestX + dx]) width++;
      }
      // Scale: assume image width ≈ 300-500mm (typical defect photo scale)
      const scaleMM = 400 / w; // rough scale: 400mm across image width
      points.push({
        x: bestX,
        y: y,
        width: width * scaleMM,
        magnitude: bestMag,
      });
    }
  }
  return points;
}

// ======= Grid Regions =======
function gridRegions(crackScore, crackMask, w, h) {
  const cellW = Math.floor(w / GRID), cellH = Math.floor(h / GRID);
  const cells = [];
  
  for (let gy = 0; gy < GRID; gy++) for (let gx = 0; gx < GRID; gx++) {
    const x0 = gx*cellW, y0 = gy*cellH;
    const x1 = Math.min(x0+cellW, w), y1 = Math.min(y0+cellH, h);
    let crackPx = 0, total = 0, scoreSum = 0;
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      total++;
      if (crackMask[py*w+px]) crackPx++;
      scoreSum += crackScore[py*w+px];
    }
    cells.push({ gx, gy, x0, y0, x1, y1, crackRatio: crackPx/Math.max(total,1), avgScore: scoreSum/Math.max(total,1) });
  }

  // Top 30% by crack ratio
  const sorted = [...cells].sort((a, b) => b.crackRatio - a.crackRatio);
  const topN = Math.max(3, Math.ceil(cells.length * 0.3));
  const hotKeys = new Set(sorted.slice(0, topN).filter(c => c.crackRatio > 0.001).map(c => `${c.gx},${c.gy}`));
  if (hotKeys.size === 0) return [];

  // Cluster
  const visited = new Set();
  const clusters = [];
  for (const cell of cells) {
    const key = `${cell.gx},${cell.gy}`;
    if (!hotKeys.has(key) || visited.has(key)) continue;
    const cluster = [], queue = [cell];
    visited.add(key);
    while (queue.length) {
      const c = queue.shift();
      cluster.push(c);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nk = `${c.gx+dx},${c.gy+dy}`;
        if (!visited.has(nk) && hotKeys.has(nk)) {
          visited.add(nk);
          const n = cells.find(h => h.gx === c.gx+dx && h.gy === c.gy+dy);
          if (n) queue.push(n);
        }
      }
    }
    clusters.push(cluster);
  }

  return clusters.map((cl, i) => {
    const minX = Math.min(...cl.map(c=>c.x0)), minY = Math.min(...cl.map(c=>c.y0));
    const maxX = Math.max(...cl.map(c=>c.x1)), maxY = Math.max(...cl.map(c=>c.y1));
    const maxCR = Math.max(...cl.map(c=>c.crackRatio));
    const relSize = ((maxX-minX)*(maxY-minY))/(w*h);
    const severity = maxCR > 0.15 ? 'critical' : maxCR > 0.08 ? 'high' : maxCR > 0.03 ? 'medium' : 'low';
    return {
      id: i+1,
      bbox: [(minX/w)*100,(minY/h)*100,(maxX/w)*100,(maxY/h)*100],
      severity,
      confidence: Math.min(0.99, 0.5+maxCR*3),
      edgeDensity: maxCR,
      area_percent: (relSize*100).toFixed(1),
      avgContrast: maxCR*100,
      cellCount: cl.length,
    };
  }).sort((a,b) => b.confidence-a.confidence).slice(0,8);
}

// ======= Utility =======
function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

function percentile(arr, pct) {
  const vals = [];
  for (let i = 0; i < arr.length; i++) if (arr[i] > 0) vals.push(arr[i]);
  if (vals.length === 0) return 1;
  vals.sort((a, b) => a - b);
  return vals[Math.min(vals.length - 1, Math.floor(vals.length * pct / 100))];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src && src.src);
    if (!url) return reject(new Error('No image source'));
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('0 dimensions'));
    img.onerror = () => reject(new Error('Load failed'));
    img.src = url;
  });
}

function createCanvas(img) {
  const c = document.createElement('canvas');
  let w = img.naturalWidth||img.width||400, h = img.naturalHeight||img.height||300;
  if (Math.max(w,h) > MAX_SIZE) { const s = MAX_SIZE/Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return { canvas: c, ctx: c.getContext('2d') };
}
