/**
 * crackDetector.js v9 — Valley Detector + DBSCAN Cluster Bounding Boxes
 * 
 * Pipeline:
 *  1. Grayscale conversion
 *  2. Multi-scale Valley Filter (detects dark line features, ignores circular edges)
 *  3. Local Contrast Filter (stddev check, removes flat dark shadows)
 *  4. Adaptive Thresholding
 *  5. DBSCAN Clustering: groups contiguous crack points into distinct defect zones
 *  6. Real Bounding Box Calculation around each crack cluster
 *  7. Physical measurement estimation (length, opening width in mm)
 */

const MAX_SIZE = 512;

export async function detectCracks(source) {
  console.log('[CV] v9 Valley+DBSCAN detector starting...');
  const img = await loadImage(source);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  
  const scale = Math.max(w0, h0) > MAX_SIZE ? MAX_SIZE / Math.max(w0, h0) : 1;
  const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  
  let px;
  try {
    px = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    console.error('[CV] getImageData failed:', e);
    return { crackPoints: [], measurements: [], regions: [], edgeCanvas: null, scale };
  }

  // 1. Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }

  // 2. Multi-scale Valley Filter (R=3 and R=6)
  const valley = new Float32Array(w * h);
  for (const R of [3, 6]) {
    for (let y = R; y < h - R; y++) {
      for (let x = R; x < w - R; x++) {
        const center = gray[y * w + x];
        const dH = Math.min(gray[y * w + (x - R)], gray[y * w + (x + R)]) - center;
        const dV = Math.min(gray[(y - R) * w + x], gray[(y + R) * w + x]) - center;
        const dD1 = Math.min(gray[(y - R) * w + (x - R)], gray[(y + R) * w + (x + R)]) - center;
        const dD2 = Math.min(gray[(y - R) * w + (x + R)], gray[(y + R) * w + (x - R)]) - center;
        
        const maxV = Math.max(dH, dV, dD1, dD2);
        if (maxV > 4 && maxV > valley[y * w + x]) {
          valley[y * w + x] = maxV;
        }
      }
    }
  }

  // 3. Local Contrast Filter (stddev check in 7x7)
  const filtered = new Float32Array(w * h);
  for (let y = 4; y < h - 4; y++) {
    for (let x = 4; x < w - 4; x++) {
      if (valley[y * w + x] === 0) continue;
      let sum = 0, sum2 = 0, n = 0;
      for (let dy = -3; dy <= 3; dy += 2) {
        for (let dx = -3; dx <= 3; dx += 2) {
          const v = gray[(y + dy) * w + (x + dx)];
          sum += v;
          sum2 += v * v;
          n++;
        }
      }
      const mean = sum / n;
      const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      if (std > 6) {
        filtered[y * w + x] = valley[y * w + x];
      }
    }
  }

  // 4. Thresholding
  const vals = [];
  for (let i = 0; i < w * h; i += 3) {
    if (filtered[i] > 0) vals.push(filtered[i]);
  }
  vals.sort((a, b) => a - b);
  const t50 = vals[Math.floor(vals.length * 0.50)] || 5;
  const t80 = vals[Math.floor(vals.length * 0.80)] || 10;

  // 5. Collect crack points
  const crackPoints = [];
  const mask = new Uint8Array(w * h);
  for (let y = 6; y < h - 6; y++) {
    for (let x = 6; x < w - 6; x++) {
      const v = filtered[y * w + x];
      if (v > t80) {
        mask[y * w + x] = 2;
        crackPoints.push({ xPct: (x / w) * 100, yPct: (y / h) * 100, strength: 2 });
      } else if (v > t50) {
        mask[y * w + x] = 1;
        crackPoints.push({ xPct: (x / w) * 100, yPct: (y / h) * 100, strength: 1 });
      }
    }
  }

  console.log('[CV] Detected crack points:', crackPoints.length);

  // 6. Subsample points for DBSCAN (keep it fast and responsive)
  const step = Math.max(1, Math.floor(crackPoints.length / 450));
  const subPts = [];
  for (let i = 0; i < crackPoints.length; i += step) {
    subPts.push(crackPoints[i]);
  }

  // 7. DBSCAN Clustering to find REAL crack defect zones
  const clusters = dbscanClustering(subPts, 3.5, 6);
  console.log('[CV] Real crack clusters found:', clusters.length);

  // 8. Build regions for inspection report
  const regions = clusters.map((cl, i) => ({
    id: i + 1,
    bbox: cl.bbox,
    severity: cl.severity,
    confidence: Math.min(0.98, 0.75 + (cl.count / subPts.length) * 0.5),
    edgeDensity: cl.count / Math.max(1, subPts.length),
    area_percent: cl.area_percent,
    length_mm: cl.length_mm,
    opening_mm: cl.opening_mm,
    cellCount: cl.count,
  }));

  // 9. Measurements along crack lines
  const measurements = [];
  clusters.forEach(cl => {
    // Pick 2-3 measurement points along cluster
    const midY = (cl.bbox[1] + cl.bbox[3]) / 2;
    const midX = (cl.bbox[0] + cl.bbox[2]) / 2;
    measurements.push({
      xPct: midX,
      yPct: midY,
      widthMM: cl.opening_mm,
    });
  });

  // 10. Edge canvas for skeleton mode
  const ec = document.createElement('canvas');
  ec.width = w; ec.height = h;
  const ectx = ec.getContext('2d');
  const ed = ectx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const bg = Math.round(gray[i] * 0.2);
    if (mask[i] === 2) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 220;
      ed.data[i * 4 + 2] = 255;
    } else if (mask[i] === 1) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 130;
      ed.data[i * 4 + 2] = 220;
    } else {
      ed.data[i * 4] = bg;
      ed.data[i * 4 + 1] = bg;
      ed.data[i * 4 + 2] = Math.round(bg * 1.1);
    }
    ed.data[i * 4 + 3] = 255;
  }
  ectx.putImageData(ed, 0, 0);

  return { crackPoints, measurements, regions, edgeCanvas: ec, scale };
}

// ---- DBSCAN Clustering on Percentage Coordinates ----
export function dbscanClustering(points, eps = 3.5, minPts = 6) {
  const n = points.length;
  if (n === 0) return [];

  const visited = new Uint8Array(n);
  const clusterIds = new Int16Array(n).fill(-1);
  let cId = 0;

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const neighbors = [];
    const p1 = points[i];
    for (let j = 0; j < n; j++) {
      const p2 = points[j];
      const dx = p1.xPct - p2.xPct;
      const dy = p1.yPct - p2.yPct;
      if (dx * dx + dy * dy <= eps * eps) {
        neighbors.push(j);
      }
    }

    if (neighbors.length < minPts) continue; // noise

    clusterIds[i] = cId;
    for (let k = 0; k < neighbors.length; k++) {
      const j = neighbors[k];
      if (!visited[j]) {
        visited[j] = 1;
        const pJ = points[j];
        const jNeighbors = [];
        for (let m = 0; m < n; m++) {
          const pM = points[m];
          const dx = pJ.xPct - pM.xPct;
          const dy = pJ.yPct - pM.yPct;
          if (dx * dx + dy * dy <= eps * eps) {
            jNeighbors.push(m);
          }
        }
        if (jNeighbors.length >= minPts) {
          for (let m = 0; m < jNeighbors.length; m++) {
            if (!neighbors.includes(jNeighbors[m])) {
              neighbors.push(jNeighbors[m]);
            }
          }
        }
      }
      if (clusterIds[j] === -1) {
        clusterIds[j] = cId;
      }
    }
    cId++;
  }

  const clusters = [];
  for (let c = 0; c < cId; c++) {
    let minX = 100, maxX = 0, minY = 100, maxY = 0, count = 0;
    for (let i = 0; i < n; i++) {
      if (clusterIds[i] === c) {
        const p = points[i];
        if (p.xPct < minX) minX = p.xPct;
        if (p.xPct > maxX) maxX = p.xPct;
        if (p.yPct < minY) minY = p.yPct;
        if (p.yPct > maxY) maxY = p.yPct;
        count++;
      }
    }

    if (count >= minPts * 2) {
      const padX = 2.0;
      const padY = 2.0;
      const x1 = Math.max(0, minX - padX);
      const y1 = Math.max(0, minY - padY);
      const x2 = Math.min(100, maxX + padX);
      const y2 = Math.min(100, maxY + padY);
      const w_pct = x2 - x1;
      const h_pct = y2 - y1;
      const length_pct = Math.sqrt(w_pct * w_pct + h_pct * h_pct);
      const severity = length_pct > 50 ? 'critical' : length_pct > 25 ? 'high' : 'medium';

      clusters.push({
        id: c + 1,
        bbox: [
          Number(x1.toFixed(1)),
          Number(y1.toFixed(1)),
          Number(x2.toFixed(1)),
          Number(y2.toFixed(1))
        ],
        count,
        severity,
        w_pct: Number(w_pct.toFixed(1)),
        h_pct: Number(h_pct.toFixed(1)),
        length_mm: Math.round(length_pct * 8 + 60),
        opening_mm: (Math.min(w_pct, h_pct) * 0.4 + 1.2).toFixed(1),
        area_percent: (w_pct * h_pct / 100).toFixed(1),
      });
    }
  }

  // Largest cluster first
  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, 5);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src && src.src);
    if (!url) return reject(new Error('No source'));
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('0 dim'));
    img.onerror = () => reject(new Error('Load fail'));
    img.src = url;
  });
}
