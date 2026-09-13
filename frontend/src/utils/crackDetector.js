/**
 * crackDetector.js v3 — Grid Heatmap approach
 * 
 * Instead of connected components (which merge into one blob on textured images),
 * divide image into grid cells, score each cell for "crack-likeness",
 * then cluster high-scoring cells into defect regions.
 * 
 * Scoring per cell:
 *  - Dark Line Score: pixels significantly darker than local neighborhood
 *  - Edge Density: Sobel gradient strength
 *  - Linearity: variance of edge directions (cracks have consistent direction)
 *  - Contrast: local max-min brightness difference
 */

const MAX_SIZE = 600;
const GRID = 12; // 12x12 = 144 cells

export async function detectCracks(source) {
  const img = await loadImage(source);
  const { canvas, ctx } = createCanvas(img);
  const w = canvas.width;
  const h = canvas.height;
  const pixels = ctx.getImageData(0, 0, w, h).data;

  const gray = toGrayscale(pixels, w, h);
  const blurred = blur5x5(gray, w, h);
  const { magnitude, direction } = sobel(blurred, w, h);

  // ---- Grid-based analysis ----
  const cellW = Math.floor(w / GRID);
  const cellH = Math.floor(h / GRID);
  const scores = new Float32Array(GRID * GRID);
  const cellData = [];

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x0 = gx * cellW;
      const y0 = gy * cellH;
      const x1 = Math.min(x0 + cellW, w);
      const y1 = Math.min(y0 + cellH, h);
      const area = (x1 - x0) * (y1 - y0);

      let edgeSum = 0;
      let darkLinePixels = 0;
      let contrastSum = 0;
      let dirSinSum = 0, dirCosSum = 0;
      let count = 0;

      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const i = py * w + px;
          const m = magnitude[i];
          edgeSum += m;
          count++;

          // Dark line detection: is pixel much darker than 11x11 neighborhood?
          if (py > 5 && py < h - 5 && px > 5 && px < w - 5) {
            let neighborSum = 0, nc = 0;
            for (let dy = -5; dy <= 5; dy += 2) {
              for (let dx = -5; dx <= 5; dx += 2) {
                neighborSum += blurred[(py + dy) * w + (px + dx)];
                nc++;
              }
            }
            const neighborAvg = neighborSum / nc;
            const darkness = neighborAvg - blurred[i];
            if (darkness > 25) darkLinePixels++; // 25+ levels darker = potential crack
          }

          // Local contrast (5x5)
          if (py > 2 && py < h - 2 && px > 2 && px < w - 2) {
            let lo = 255, hi = 0;
            for (let dy = -2; dy <= 2; dy += 2) {
              for (let dx = -2; dx <= 2; dx += 2) {
                const v = blurred[(py + dy) * w + (px + dx)];
                if (v < lo) lo = v;
                if (v > hi) hi = v;
              }
            }
            contrastSum += (hi - lo);
          }

          // Edge direction coherence
          if (m > 20) {
            dirSinSum += Math.sin(2 * direction[i]);
            dirCosSum += Math.cos(2 * direction[i]);
          }
        }
      }

      const edgeDensity = edgeSum / (count * 255); // normalized
      const darkRatio = darkLinePixels / Math.max(count, 1);
      const avgContrast = contrastSum / Math.max(count, 1);
      const dirCoherence = Math.sqrt(dirSinSum * dirSinSum + dirCosSum * dirCosSum) / Math.max(count * 0.1, 1);

      // Combined score: weighted sum of crack indicators
      const score = (darkRatio * 4.0) +         // Dark lines are strongest indicator
                    (edgeDensity * 2.0) +        // Edge density
                    (avgContrast / 128 * 1.5) +  // High contrast zones
                    (dirCoherence * 0.5);         // Directional coherence bonus

      scores[gy * GRID + gx] = score;
      cellData.push({ gx, gy, x0, y0, x1, y1, score, edgeDensity, darkRatio, avgContrast, dirCoherence });
    }
  }

  // ---- Find hot cells (score > mean + 0.5 * std) ----
  const allScores = Array.from(scores);
  const mean = allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const std = Math.sqrt(allScores.reduce((s, v) => s + (v - mean) ** 2, 0) / allScores.length);
  const hotThreshold = mean + std * 0.4; // cells above this are "hot"

  const hotCells = cellData.filter(c => c.score > hotThreshold);

  if (hotCells.length === 0) {
    return { regions: [], edgeCanvas: createEdgeVis(magnitude, blurred, w, h), scale: 1 };
  }

  // ---- Cluster adjacent hot cells into regions ----
  const visited = new Set();
  const clusters = [];

  for (const cell of hotCells) {
    const key = `${cell.gx},${cell.gy}`;
    if (visited.has(key)) continue;
    
    // BFS to find connected hot cells
    const cluster = [];
    const queue = [cell];
    visited.add(key);

    while (queue.length > 0) {
      const c = queue.shift();
      cluster.push(c);

      // Check 8 neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = c.gx + dx, ny = c.gy + dy;
          const nKey = `${nx},${ny}`;
          if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !visited.has(nKey)) {
            const neighbor = hotCells.find(h => h.gx === nx && h.gy === ny);
            if (neighbor) {
              visited.add(nKey);
              queue.push(neighbor);
            }
          }
        }
      }
    }

    if (cluster.length >= 1) {
      clusters.push(cluster);
    }
  }

  // ---- Convert clusters to regions ----
  const regions = clusters.map((cluster, idx) => {
    const minX = Math.min(...cluster.map(c => c.x0));
    const minY = Math.min(...cluster.map(c => c.y0));
    const maxX = Math.max(...cluster.map(c => c.x1));
    const maxY = Math.max(...cluster.map(c => c.y1));
    const avgScore = cluster.reduce((s, c) => s + c.score, 0) / cluster.length;
    const maxDark = Math.max(...cluster.map(c => c.darkRatio));
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const aspectRatio = Math.max(bboxW, bboxH) / Math.max(1, Math.min(bboxW, bboxH));
    const relSize = (bboxW * bboxH) / (w * h);

    // Skip if region is too large (>50% of image) — probably background
    if (relSize > 0.5) return null;

    const severity =
      (maxDark > 0.15 || (avgScore > mean + std * 2 && aspectRatio > 1.5)) ? 'critical' :
      (maxDark > 0.08 || avgScore > mean + std * 1.5) ? 'high' :
      (avgScore > mean + std) ? 'medium' : 'low';

    return {
      id: idx + 1,
      bbox: [(minX / w) * 100, (minY / h) * 100, (maxX / w) * 100, (maxY / h) * 100],
      severity,
      confidence: Math.min(0.99, 0.5 + avgScore * 0.3),
      edgeDensity: cluster.reduce((s, c) => s + c.edgeDensity, 0) / cluster.length,
      area_percent: (relSize * 100).toFixed(1),
      pixelCount: cluster.length,
      avgContrast: cluster.reduce((s, c) => s + c.avgContrast, 0) / cluster.length,
      aspectRatio,
      cellCount: cluster.length,
    };
  }).filter(Boolean);

  // Sort by score (best first), take top 8
  regions.sort((a, b) => b.confidence - a.confidence);
  const topRegions = regions.slice(0, 8);

  return {
    regions: topRegions,
    edgeCanvas: createEdgeVis(magnitude, blurred, w, h),
    scale: 1,
  };
}

// ========== Utilities ==========

function loadImage(source) {
  return new Promise((resolve) => {
    if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
      return resolve(source);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = typeof source === 'string' ? source : source.src;
  });
}

function createCanvas(img) {
  const canvas = document.createElement('canvas');
  let w = img.naturalWidth || img.width || 400;
  let h = img.naturalHeight || img.height || 300;
  if (Math.max(w, h) > MAX_SIZE) {
    const s = MAX_SIZE / Math.max(w, h);
    w = Math.round(w * s);
    h = Math.round(h * s);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx };
}

function toGrayscale(px, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  return g;
}

function blur5x5(gray, w, h) {
  const k = [1,4,7,4,1, 4,16,26,16,4, 7,26,41,26,7, 4,16,26,16,4, 1,4,7,4,1];
  const out = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      let s = 0, ki = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += gray[(y+dy)*w+(x+dx)] * k[ki++];
      out[y*w+x] = s / 273;
    }
  }
  for (let y = 0; y < 2; y++) for (let x = 0; x < w; x++) out[y*w+x] = gray[y*w+x];
  for (let y = h-2; y < h; y++) for (let x = 0; x < w; x++) out[y*w+x] = gray[y*w+x];
  return out;
}

function sobel(gray, w, h) {
  const sx = [-1,0,1,-2,0,2,-1,0,1], sy = [-1,-2,-1,0,0,0,1,2,1];
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const v = gray[(y+dy)*w+(x+dx)];
        gx += v * sx[ki]; gy += v * sy[ki]; ki++;
      }
      magnitude[y*w+x] = Math.sqrt(gx*gx + gy*gy);
      direction[y*w+x] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, direction };
}

function createEdgeVis(mag, gray, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const d = ctx.createImageData(w, h);
  
  // Find 95th percentile for normalization
  const sorted = Array.from(mag).filter(v => v > 0).sort((a,b) => a-b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;
  
  for (let i = 0; i < w * h; i++) {
    const bg = Math.round((gray[i] / 255) * 80); // dim background from grayscale
    const edge = Math.min(255, (mag[i] / p95) * 255);
    
    if (edge > 80) {
      // Strong edge — cyan
      d.data[i*4] = 0;
      d.data[i*4+1] = Math.round(Math.max(bg, edge * 0.7));
      d.data[i*4+2] = Math.round(Math.min(255, edge * 1.2));
      d.data[i*4+3] = 255;
    } else {
      // Background
      d.data[i*4] = bg;
      d.data[i*4+1] = bg;
      d.data[i*4+2] = Math.round(bg * 1.15);
      d.data[i*4+3] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);
  return canvas;
}
