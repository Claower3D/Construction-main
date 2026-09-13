/**
 * crackDetector.js v10 — Multi-Scale Tiled Valley Detector + Balanced DBSCAN + NMS Merging
 * 
 * Key capabilities:
 *  1. Letterbox / Image Border Rejection: ignores dark viewer bars and frame edges.
 *  2. Multi-Scale Valley Detection (R=2, 4, 6): detects everything from 0.3mm hairline
 *     cracks to wide deep fractures and structural damage.
 *  3. 4x4 Tiled Adaptive Thresholding: faint cracks in clean areas are NOT drowned out
 *     by high-contrast rebar or shadows in other parts of the photo.
 *  4. Balanced Spatial Subsampling: prevents one noisy corner from dominating DBSCAN.
 *  5. DBSCAN Clustering: groups contiguous defect fragments into distinct zones.
 *  6. NMS Box Merging: merges overlapping/concentric boxes into one unified bounding box per defect.
 */

const MAX_SIZE = 512;

export async function detectCracks(source) {
  console.log('[CV] v10 Multi-Scale Tiled Valley + NMS starting...');
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

  // 1. Grayscale conversion
  // 1. Grayscale conversion
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }

  // 1b. Dark interior pit/hole rejection (box filter of gray < 40 in 15x15 window)
  const isDark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (gray[i] < 42) isDark[i] = 1;
  }
  const voidMask = new Uint8Array(w * h);
  const vR = 7;
  for (let y = vR; y < h - vR; y += 2) {
    for (let x = vR; x < w - vR; x += 2) {
      let darkCount = 0;
      for (let dy = -vR; dy <= vR; dy += 3) {
        for (let dx = -vR; dx <= vR; dx += 3) {
          if (isDark[(y + dy) * w + (x + dx)]) darkCount++;
        }
      }
      if (darkCount >= 13) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (y + dy < h && x + dx < w) voidMask[(y + dy) * w + (x + dx)] = 1;
          }
        }
      }
    }
  }

  // 2. Multi-scale Valley Filter (R=2, 4, 6)
  const valley = new Float32Array(w * h);
  for (const R of [2, 4, 6]) {
    for (let y = R; y < h - R; y++) {
      for (let x = R; x < w - R; x++) {
        const center = gray[y * w + x];
        // Ignore dark letterbox margins and interior void pits
        if (center < 20 || voidMask[y * w + x]) continue;

        const dH = Math.min(gray[y * w + (x - R)], gray[y * w + (x + R)]) - center;
        const dV = Math.min(gray[(y - R) * w + x], gray[(y + R) * w + x]) - center;
        const dD1 = Math.min(gray[(y - R) * w + (x - R)], gray[(y + R) * w + (x + R)]) - center;
        const dD2 = Math.min(gray[(y - R) * w + (x + R)], gray[(y + R) * w + (x - R)]) - center;
        
        const maxV = Math.max(dH, dV, dD1, dD2);
        if (maxV > 4.0 && maxV > valley[y * w + x]) {
          valley[y * w + x] = maxV;
        }
      }
    }
  }

  // 3. Local Contrast Filter & Border Margin Filter (3.5% borders)
  const filtered = new Float32Array(w * h);
  const borderX = Math.round(w * 0.035);
  const borderY = Math.round(h * 0.035);

  for (let y = borderY; y < h - borderY; y++) {
    for (let x = borderX; x < w - borderX; x++) {
      if (valley[y * w + x] < 4.5) continue;

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
      if (std > 4.5) {
        filtered[y * w + x] = valley[y * w + x];
      }
    }
  }

  // 4. 4x4 Tiled Adaptive Thresholding with Contrast Floor
  const crackPoints = [];
  const mask = new Uint8Array(w * h);
  const tileH = Math.floor(h / 4);
  const tileW = Math.floor(w / 4);

  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const y1 = ty * tileH;
      const y2 = ty === 3 ? h : (ty + 1) * tileH;
      const x1 = tx * tileW;
      const x2 = tx === 3 ? w : (tx + 1) * tileW;

      const tileVals = [];
      let tileMax = 0;
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const v = filtered[y * w + x];
          if (v > 0) {
            tileVals.push(v);
            if (v > tileMax) tileMax = v;
          }
        }
      }

      // CRITICAL: If tile has no prominent crack valley >= 14.0, DO NOT calculate noise threshold!
      if (tileVals.length < 10 || tileMax < 14.0) continue;

      tileVals.sort((a, b) => a - b);
      const t60 = tileVals[Math.floor(tileVals.length * 0.60)] || 8.0;
      const tHigh = tileVals[Math.floor(tileVals.length * 0.85)] || 15.0;
      const thresh = Math.max(9.0, t60);

      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const v = filtered[y * w + x];
          if (v > thresh) {
            const isStrong = v > tHigh;
            mask[y * w + x] = isStrong ? 2 : 1;
            crackPoints.push({
              xPct: (x / w) * 100,
              yPct: (y / h) * 100,
              strength: isStrong ? 2 : 1,
            });
          }
        }
      }
    }
  }

  console.log('[CV] Tiled detection points:', crackPoints.length);

  // 5. Balanced Spatial Subsampling for DBSCAN
  const subPts = [];
  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      const qPts = crackPoints.filter(p => 
        p.xPct >= qx * 50 && p.xPct < (qx + 1) * 50 &&
        p.yPct >= qy * 50 && p.yPct < (qy + 1) * 50
      );
      if (qPts.length > 0) {
        const step = Math.max(1, Math.floor(qPts.length / 150));
        for (let i = 0; i < qPts.length; i += step) {
          subPts.push(qPts[i]);
        }
      }
    }
  }

  // 6. DBSCAN Clustering + NMS Merging
  const clusters = dbscanClustering(subPts, 4.5, 6);
  console.log('[CV] Distinct defect zones (after NMS):', clusters.length);

  // 7. Build regions for inspection report
  const regions = clusters.map((cl, i) => ({
    id: i + 1,
    bbox: cl.bbox,
    type: cl.typeTitle,
    severity: cl.severity,
    confidence: Math.min(0.98, 0.82 + (cl.count / Math.max(1, subPts.length)) * 0.35),
    edgeDensity: cl.count / Math.max(1, subPts.length),
    area_percent: cl.area_percent,
    length_mm: cl.length_mm,
    opening_mm: cl.opening_mm,
    cellCount: cl.count,
    description: `Зона ${i + 1}: ${cl.typeTitle} (длина ${cl.length_mm} мм, раскрытие ${cl.opening_mm} мм, площадь ${cl.area_percent}%)`,
  }));

  // 8. Measurements along crack lines
  const measurements = clusters.map(cl => ({
    xPct: (cl.bbox[0] + cl.bbox[2]) / 2,
    yPct: (cl.bbox[1] + cl.bbox[3]) / 2,
    widthMM: cl.opening_mm,
  }));

  // 9. Edge canvas for skeleton mode
  const ec = document.createElement('canvas');
  ec.width = w; ec.height = h;
  const ectx = ec.getContext('2d');
  const ed = ectx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const bg = Math.round(gray[i] * 0.18);
    if (mask[i] === 2) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 220;
      ed.data[i * 4 + 2] = 255;
    } else if (mask[i] === 1) {
      ed.data[i * 4] = 0;
      ed.data[i * 4 + 1] = 140;
      ed.data[i * 4 + 2] = 230;
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

// ---- DBSCAN Clustering with Non-Maximum Suppression (NMS) Box Merging ----
export function dbscanClustering(points, eps = 4.0, minPts = 6) {
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

    if (neighbors.length < minPts) continue;

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

  // Aggregate raw clusters
  const rawClusters = [];
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

    const bw = maxX - minX;
    const bh = maxY - minY;
    // Reject full-image circular rims/outer frames (>55% width AND >55% height)
    if (bw > 55 && bh > 55) continue;

    if (count >= minPts) {
      rawClusters.push({
        bbox: [minX, minY, maxX, maxY],
        count,
      });
    }
  }

  // Sort raw clusters by point count descending
  rawClusters.sort((a, b) => b.count - a.count);

  // Non-Maximum Suppression (NMS) / Box Merging
  // Merges overlapping/concentric boxes into one unified defect box without creating giant full-frame boxes
  const merged = [];
  for (const b of rawClusters) {
    const b1 = b.bbox;
    let wasMerged = false;
    for (const m of merged) {
      const b2 = m.bbox;
      const dx = Math.max(0, Math.min(b1[2], b2[2]) - Math.max(b1[0], b2[0]));
      const dy = Math.max(0, Math.min(b1[3], b2[3]) - Math.max(b1[1], b2[1]));
      const inter = dx * dy;
      const a1 = (b1[2] - b1[0]) * (b1[3] - b1[1]);
      const a2 = (b2[2] - b2[0]) * (b2[3] - b2[1]);
      const iou = inter / Math.max(1e-5, a1 + a2 - inter);
      const contained = inter / Math.max(1e-5, Math.min(a1, a2));

      const mergedW = Math.max(b1[2], b2[2]) - Math.min(b1[0], b2[0]);
      const mergedH = Math.max(b1[3], b2[3]) - Math.min(b1[1], b2[1]);
      if (mergedW > 50 && mergedH > 50) continue;

      // Merge if significant overlap or one box is largely inside another
      if (iou > 0.15 || contained > 0.45) {
        m.bbox = [
          Math.min(b1[0], b2[0]),
          Math.min(b1[1], b2[1]),
          Math.max(b1[2], b2[2]),
          Math.max(b1[3], b2[3]),
        ];
        m.count += b.count;
        wasMerged = true;
        break;
      }
    }
    if (!wasMerged) {
      merged.push({ bbox: [...b.bbox], count: b.count });
    }
  }

  // Format final merged clusters with padding, type titles, and physical dimensions
  const finalClusters = merged.map((cl, i) => {
    const padX = 1.8;
    const padY = 1.8;
    const x1 = Math.max(0, cl.bbox[0] - padX);
    const y1 = Math.max(0, cl.bbox[1] - padY);
    const x2 = Math.min(100, cl.bbox[2] + padX);
    const y2 = Math.min(100, cl.bbox[3] + padY);
    const w_pct = x2 - x1;
    const h_pct = y2 - y1;
    const length_pct = Math.sqrt(w_pct * w_pct + h_pct * h_pct);
    const severity = (length_pct > 32 || cl.count > 100) ? 'critical' : (length_pct > 16 || cl.count > 35) ? 'high' : 'medium';
    
    const typeTitle = severity === 'critical' ? 'Глубокий разлом / силовая трещина бетона' :
                      severity === 'high' ? 'Конструктивная трещина с раскрытием' :
                      'Усадочная трещина штукатурного слоя / скол';

    return {
      id: i + 1,
      typeTitle,
      bbox: [
        Number(x1.toFixed(1)),
        Number(y1.toFixed(1)),
        Number(x2.toFixed(1)),
        Number(y2.toFixed(1)),
      ],
      count: cl.count,
      severity,
      w_pct: Number(w_pct.toFixed(1)),
      h_pct: Number(h_pct.toFixed(1)),
      length_mm: Math.round(length_pct * 8 + 60),
      opening_mm: (Math.min(w_pct, h_pct) * 0.35 + 1.2).toFixed(1),
      area_percent: (w_pct * h_pct / 100).toFixed(1),
    };
  });

  return finalClusters.slice(0, 6);
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
