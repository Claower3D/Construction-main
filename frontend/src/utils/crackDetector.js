/**
 * crackDetector.js v4 — Direct edge overlay + grid scoring
 * 
 * Two outputs:
 * 1. Annotated image: original photo + bright colored edges overlaid
 * 2. Regions: top-scoring grid cells clustered into defect zones
 * 
 * Key fix: ALWAYS returns results. No filtering that removes everything.
 */

const MAX_SIZE = 640;
const GRID = 10;

export async function detectCracks(source) {
  const img = await loadImage(source);
  const { canvas, ctx } = createCanvas(img);
  const w = canvas.width;
  const h = canvas.height;
  const pixels = ctx.getImageData(0, 0, w, h).data;

  const gray = toGrayscale(pixels, w, h);
  const blurred = blur5x5(gray, w, h);
  const { magnitude, direction } = sobel(blurred, w, h);

  // ---- Create annotated image: original + edge overlay ----
  const annotatedCanvas = document.createElement('canvas');
  annotatedCanvas.width = w;
  annotatedCanvas.height = h;
  const aCtx = annotatedCanvas.getContext('2d');
  aCtx.drawImage(img, 0, 0, w, h);
  
  // Get the original pixels to blend with
  const origData = aCtx.getImageData(0, 0, w, h);
  const out = origData.data;
  
  // Find edge threshold (top 15% of edges)
  const sorted = Array.from(magnitude).filter(v => v > 0).sort((a, b) => a - b);
  const strongThreshold = sorted[Math.floor(sorted.length * 0.85)] || 30;
  const mediumThreshold = sorted[Math.floor(sorted.length * 0.75)] || 20;
  
  // Overlay edges on original image
  for (let i = 0; i < w * h; i++) {
    const m = magnitude[i];
    if (m > strongThreshold) {
      // Strong edge — bright cyan/blue line
      const alpha = Math.min(1.0, (m - strongThreshold) / (strongThreshold * 0.5 + 1));
      out[i * 4]     = Math.round(out[i * 4] * (1 - alpha * 0.7) + 30 * alpha * 0.7);   // R
      out[i * 4 + 1] = Math.round(out[i * 4 + 1] * (1 - alpha * 0.5) + 200 * alpha * 0.5); // G
      out[i * 4 + 2] = Math.round(out[i * 4 + 2] * (1 - alpha * 0.3) + 255 * alpha * 0.3); // B
    } else if (m > mediumThreshold) {
      // Medium edge — subtle highlight
      const alpha = 0.15;
      out[i * 4 + 1] = Math.min(255, out[i * 4 + 1] + Math.round(40 * alpha));
      out[i * 4 + 2] = Math.min(255, out[i * 4 + 2] + Math.round(80 * alpha));
    }
  }
  aCtx.putImageData(origData, 0, 0);
  
  const annotatedDataUrl = annotatedCanvas.toDataURL('image/jpeg', 0.92);

  // ---- Grid scoring for bounding box regions ----
  const cellW = Math.floor(w / GRID);
  const cellH = Math.floor(h / GRID);
  const cellScores = [];

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x0 = gx * cellW, y0 = gy * cellH;
      const x1 = Math.min(x0 + cellW, w), y1 = Math.min(y0 + cellH, h);
      
      let strongEdges = 0, darkPixels = 0, count = 0;
      
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          count++;
          if (magnitude[py * w + px] > strongThreshold) strongEdges++;
          
          // Dark line: pixel darker than 11x11 neighborhood
          if (py > 5 && py < h - 5 && px > 5 && px < w - 5) {
            let nSum = 0, nc = 0;
            for (let dy = -5; dy <= 5; dy += 3) {
              for (let dx = -5; dx <= 5; dx += 3) {
                nSum += blurred[(py+dy)*w+(px+dx)]; nc++;
              }
            }
            if ((nSum / nc) - blurred[py*w+px] > 20) darkPixels++;
          }
        }
      }
      
      const edgeRatio = strongEdges / Math.max(count, 1);
      const darkRatio = darkPixels / Math.max(count, 1);
      const score = edgeRatio * 2 + darkRatio * 3;
      
      cellScores.push({ gx, gy, x0, y0, x1, y1, score, edgeRatio, darkRatio });
    }
  }

  // Sort cells by score, take top 25% as "hot"
  const sortedCells = [...cellScores].sort((a, b) => b.score - a.score);
  const hotCount = Math.max(3, Math.ceil(sortedCells.length * 0.25));
  const hotSet = new Set(sortedCells.slice(0, hotCount).map(c => `${c.gx},${c.gy}`));
  const hotCells = cellScores.filter(c => hotSet.has(`${c.gx},${c.gy}`));

  // Cluster adjacent hot cells
  const visited = new Set();
  const clusters = [];
  
  for (const cell of hotCells) {
    const key = `${cell.gx},${cell.gy}`;
    if (visited.has(key)) continue;
    
    const cluster = [];
    const queue = [cell];
    visited.add(key);
    
    while (queue.length > 0) {
      const c = queue.shift();
      cluster.push(c);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nk = `${c.gx+dx},${c.gy+dy}`;
          if (!visited.has(nk) && hotSet.has(nk)) {
            visited.add(nk);
            const n = hotCells.find(h => h.gx === c.gx+dx && h.gy === c.gy+dy);
            if (n) queue.push(n);
          }
        }
      }
    }
    clusters.push(cluster);
  }

  // Convert clusters to regions (NO filtering by size — always show results)
  const regions = clusters
    .filter(c => c.length >= 1)
    .map((cluster, idx) => {
      const minX = Math.min(...cluster.map(c => c.x0));
      const minY = Math.min(...cluster.map(c => c.y0));
      const maxX = Math.max(...cluster.map(c => c.x1));
      const maxY = Math.max(...cluster.map(c => c.y1));
      const avgScore = cluster.reduce((s, c) => s + c.score, 0) / cluster.length;
      const maxDark = Math.max(...cluster.map(c => c.darkRatio));
      const maxEdge = Math.max(...cluster.map(c => c.edgeRatio));
      const bw = maxX - minX, bh = maxY - minY;
      const relSize = (bw * bh) / (w * h);

      const severity =
        (maxDark > 0.12 || maxEdge > 0.25) ? 'critical' :
        (maxDark > 0.06 || maxEdge > 0.15) ? 'high' :
        (avgScore > 0.1) ? 'medium' : 'low';

      return {
        id: idx + 1,
        bbox: [(minX/w)*100, (minY/h)*100, (maxX/w)*100, (maxY/h)*100],
        severity,
        confidence: Math.min(0.99, 0.5 + avgScore * 2),
        edgeDensity: maxEdge,
        area_percent: (relSize * 100).toFixed(1),
        avgContrast: maxDark * 100,
        cellCount: cluster.length,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  // Edge map for skeleton view
  const edgeCanvas = createEdgeVis(magnitude, gray, w, h, strongThreshold);

  return { regions, edgeCanvas, annotatedDataUrl, scale: 1 };
}

// ========== Utils ==========

function loadImage(src) {
  return new Promise(resolve => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = typeof src === 'string' ? src : src.src;
  });
}

function createCanvas(img) {
  const c = document.createElement('canvas');
  let w = img.naturalWidth || img.width || 400, h = img.naturalHeight || img.height || 300;
  if (Math.max(w,h) > MAX_SIZE) { const s = MAX_SIZE/Math.max(w,h); w = Math.round(w*s); h = Math.round(h*s); }
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas: c, ctx };
}

function toGrayscale(px, w, h) {
  const g = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) g[i] = 0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2];
  return g;
}

function blur5x5(g, w, h) {
  const k = [1,4,7,4,1, 4,16,26,16,4, 7,26,41,26,7, 4,16,26,16,4, 1,4,7,4,1];
  const o = new Float32Array(w*h);
  for (let y = 2; y < h-2; y++) for (let x = 2; x < w-2; x++) {
    let s = 0, ki = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += g[(y+dy)*w+(x+dx)] * k[ki++];
    o[y*w+x] = s / 273;
  }
  for (let y = 0; y < 2; y++) for (let x = 0; x < w; x++) o[y*w+x] = g[y*w+x];
  for (let y = h-2; y < h; y++) for (let x = 0; x < w; x++) o[y*w+x] = g[y*w+x];
  return o;
}

function sobel(g, w, h) {
  const sx = [-1,0,1,-2,0,2,-1,0,1], sy = [-1,-2,-1,0,0,0,1,2,1];
  const mag = new Float32Array(w*h), dir = new Float32Array(w*h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let gx = 0, gy = 0, ki = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const v = g[(y+dy)*w+(x+dx)]; gx += v*sx[ki]; gy += v*sy[ki]; ki++;
    }
    mag[y*w+x] = Math.sqrt(gx*gx+gy*gy);
    dir[y*w+x] = Math.atan2(gy, gx);
  }
  return { magnitude: mag, direction: dir };
}

function createEdgeVis(mag, gray, w, h, threshold) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const d = ctx.createImageData(w, h);
  for (let i = 0; i < w*h; i++) {
    const bg = Math.round((gray[i]/255)*60);
    const m = mag[i];
    if (m > threshold) {
      const a = Math.min(1, m / (threshold * 2));
      d.data[i*4] = 0;
      d.data[i*4+1] = Math.round(180 * a);
      d.data[i*4+2] = 255;
    } else {
      d.data[i*4] = bg; d.data[i*4+1] = bg; d.data[i*4+2] = Math.round(bg*1.1);
    }
    d.data[i*4+3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  return c;
}
