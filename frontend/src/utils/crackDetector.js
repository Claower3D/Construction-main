/**
 * crackDetector.js — Client-side crack/defect detection via Canvas pixel analysis
 * 
 * Algorithm: Grayscale -> Gaussian Blur -> Sobel Edge Detection -> 
 *            Adaptive Threshold -> Morphological Dilation -> Connected Components -> BBox
 * 
 * No dependencies, runs entirely in browser.
 */

const MAX_ANALYSIS_SIZE = 512; // Resize large images to this for speed

/**
 * Main entry point: detect cracks in an image element
 * @param {HTMLImageElement|string} source - img element or base64/url string
 * @returns {Promise<{regions: Array, edgeCanvas: HTMLCanvasElement}>}
 */
export async function detectCracks(source) {
  const img = await loadImage(source);
  
  // Create analysis canvas (downsized for performance)
  const { canvas, ctx, scale } = createAnalysisCanvas(img);
  const w = canvas.width;
  const h = canvas.height;
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  
  // Step 1: Grayscale
  const gray = toGrayscale(pixels, w, h);
  
  // Step 2: Gaussian Blur 3x3
  const blurred = gaussianBlur3x3(gray, w, h);
  
  // Step 3: Sobel Edge Detection
  const edges = sobelEdgeDetection(blurred, w, h);
  
  // Step 4: Adaptive Threshold
  const maxEdge = Math.max(...edges);
  const threshold = maxEdge * 0.25; // 25% of max gradient = significant edge
  const binary = new Uint8Array(w * h);
  for (let i = 0; i < edges.length; i++) {
    binary[i] = edges[i] > threshold ? 1 : 0;
  }
  
  // Step 5: Morphological Dilation (3x3) — connect nearby edge pixels
  const dilated = dilate(binary, w, h);
  const dilated2 = dilate(dilated, w, h); // Double dilation for better connectivity
  
  // Step 6: Connected Components via flood fill
  const { labels, count } = connectedComponents(dilated2, w, h);
  
  // Step 7: Compute bounding boxes and properties for each component
  const components = computeComponentProps(labels, edges, gray, w, h, count);
  
  // Step 8: Filter — remove too small (noise) and too large (background)
  const minArea = w * h * 0.003;  // At least 0.3% of image
  const maxArea = w * h * 0.45;   // No more than 45% of image
  const minEdgeDensity = 0.08;    // At least 8% of bbox should be edges
  
  const significant = components.filter(c => 
    c.pixelCount >= minArea * 0.1 &&  // pixel count threshold
    c.bboxArea >= minArea &&
    c.bboxArea <= maxArea &&
    c.edgeDensity >= minEdgeDensity
  );
  
  // Sort by edge density (strongest cracks first)
  significant.sort((a, b) => b.edgeDensity * b.pixelCount - a.edgeDensity * a.pixelCount);
  
  // Take top 8 max
  const topRegions = significant.slice(0, 8);
  
  // Merge overlapping regions
  const merged = mergeOverlapping(topRegions);
  
  // Convert to percentage coordinates and classify severity
  const regions = merged.map((c, idx) => {
    const xPct = (c.minX / w) * 100;
    const yPct = (c.minY / h) * 100;
    const wPct = ((c.maxX - c.minX) / w) * 100;
    const hPct = ((c.maxY - c.minY) / h) * 100;
    
    // Severity based on edge density and relative size
    const relSize = c.bboxArea / (w * h);
    const severity = 
      (c.edgeDensity > 0.3 && relSize > 0.05) ? 'critical' :
      (c.edgeDensity > 0.2 || relSize > 0.08) ? 'high' :
      (c.edgeDensity > 0.12) ? 'medium' : 'low';
    
    return {
      id: idx + 1,
      bbox: [xPct, yPct, xPct + wPct, yPct + hPct],
      severity,
      confidence: Math.min(0.99, 0.6 + c.edgeDensity),
      edgeDensity: c.edgeDensity,
      area_percent: (relSize * 100).toFixed(1),
      pixelCount: c.pixelCount,
      avgContrast: c.avgContrast,
    };
  });
  
  // Create edge visualization canvas
  const edgeCanvas = createEdgeVisualization(edges, binary, w, h);
  
  return { regions, edgeCanvas, scale };
}

// ========== Helper Functions ==========

function loadImage(source) {
  return new Promise((resolve) => {
    if (source instanceof HTMLImageElement && source.complete) {
      resolve(source);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof HTMLImageElement) {
      img.src = source.src;
    }
  });
}

function createAnalysisCanvas(img) {
  const canvas = document.createElement('canvas');
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
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
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

function gaussianBlur3x3(gray, w, h) {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;
  const out = new Float32Array(w * h);
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * w + (x + dx)] * kernel[ki++];
        }
      }
      out[y * w + x] = sum / kSum;
    }
  }
  return out;
}

function sobelEdgeDetection(gray, w, h) {
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const edges = new Float32Array(w * h);
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sumX = 0, sumY = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const val = gray[(y + dy) * w + (x + dx)];
          sumX += val * gx[ki];
          sumY += val * gy[ki];
          ki++;
        }
      }
      edges[y * w + x] = Math.sqrt(sumX * sumX + sumY * sumY);
    }
  }
  return edges;
}

function dilate(binary, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (binary[y * w + x]) { out[y * w + x] = 1; continue; }
      let found = false;
      for (let dy = -1; dy <= 1 && !found; dy++) {
        for (let dx = -1; dx <= 1 && !found; dx++) {
          if (binary[(y + dy) * w + (x + dx)]) found = true;
        }
      }
      out[y * w + x] = found ? 1 : 0;
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
        // BFS flood fill
        const queue = [[x, y]];
        labels[y * w + x] = currentLabel;
        let head = 0;
        
        while (head < queue.length) {
          const [cx, cy] = queue[head++];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const ni = ny * w + nx;
                if (binary[ni] && !labels[ni]) {
                  labels[ni] = currentLabel;
                  queue.push([nx, ny]);
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

function computeComponentProps(labels, edges, gray, w, h, count) {
  const components = [];
  
  // Pre-compute component bounds in single pass
  const minXs = new Int32Array(count + 1).fill(w);
  const minYs = new Int32Array(count + 1).fill(h);
  const maxXs = new Int32Array(count + 1).fill(0);
  const maxYs = new Int32Array(count + 1).fill(0);
  const pixelCounts = new Int32Array(count + 1);
  const edgeSums = new Float32Array(count + 1);
  const contrastSums = new Float32Array(count + 1);
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const label = labels[y * w + x];
      if (label === 0) continue;
      
      pixelCounts[label]++;
      if (x < minXs[label]) minXs[label] = x;
      if (y < minYs[label]) minYs[label] = y;
      if (x > maxXs[label]) maxXs[label] = x;
      if (y > maxYs[label]) maxYs[label] = y;
      edgeSums[label] += edges[y * w + x];
      
      // Local contrast
      let localMax = 0, localMin = 255;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            const v = gray[ny * w + nx];
            if (v > localMax) localMax = v;
            if (v < localMin) localMin = v;
          }
        }
      }
      contrastSums[label] += (localMax - localMin);
    }
  }
  
  for (let label = 1; label <= count; label++) {
    if (pixelCounts[label] === 0) continue;
    
    // Add padding
    const bw = maxXs[label] - minXs[label];
    const bh = maxYs[label] - minYs[label];
    const padX = Math.round(bw * 0.08);
    const padY = Math.round(bh * 0.08);
    const minX = Math.max(0, minXs[label] - padX);
    const minY = Math.max(0, minYs[label] - padY);
    const maxX = Math.min(w - 1, maxXs[label] + padX);
    const maxY = Math.min(h - 1, maxYs[label] + padY);
    const bboxArea = (maxX - minX) * (maxY - minY);
    
    components.push({
      label,
      minX, minY, maxX, maxY,
      pixelCount: pixelCounts[label],
      bboxArea,
      edgeDensity: pixelCounts[label] / Math.max(bboxArea, 1),
      avgEdge: edgeSums[label] / pixelCounts[label],
      avgContrast: contrastSums[label] / pixelCounts[label],
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
        const overlapX = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
        const overlapY = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
        const overlapArea = overlapX * overlapY;
        const smallerArea = Math.min(a.bboxArea, b.bboxArea);
        
        if (overlapArea > smallerArea * 0.4) {
          merged[i] = {
            minX: Math.min(a.minX, b.minX),
            minY: Math.min(a.minY, b.minY),
            maxX: Math.max(a.maxX, b.maxX),
            maxY: Math.max(a.maxY, b.maxY),
            pixelCount: a.pixelCount + b.pixelCount,
            bboxArea: (Math.max(a.maxX, b.maxX) - Math.min(a.minX, b.minX)) * (Math.max(a.maxY, b.maxY) - Math.min(a.minY, b.minY)),
            edgeDensity: Math.max(a.edgeDensity, b.edgeDensity),
            avgEdge: (a.avgEdge + b.avgEdge) / 2,
            avgContrast: Math.max(a.avgContrast, b.avgContrast),
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

function createEdgeVisualization(edges, binary, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(w, h);
  
  const maxEdge = Math.max(...edges);
  
  for (let i = 0; i < w * h; i++) {
    const edgeVal = Math.min(255, (edges[i] / maxEdge) * 255);
    if (binary[i]) {
      imgData.data[i * 4] = 0;
      imgData.data[i * 4 + 1] = Math.round(edgeVal);
      imgData.data[i * 4 + 2] = 255;
      imgData.data[i * 4 + 3] = 255;
    } else {
      imgData.data[i * 4] = Math.round(edgeVal * 0.15);
      imgData.data[i * 4 + 1] = Math.round(edgeVal * 0.15);
      imgData.data[i * 4 + 2] = Math.round(edgeVal * 0.2);
      imgData.data[i * 4 + 3] = 255;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
