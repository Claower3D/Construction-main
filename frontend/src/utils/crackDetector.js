/**
 * crackDetector.js v7 — Returns crack PIXEL data for drawing in component
 * 
 * KEY CHANGE: Instead of generating annotated images (which breaks due to
 * canvas taint with data URLs), we return raw crack data:
 *   - crackPoints: array of {x, y, strength} for every detected crack pixel
 *   - measurements: array of {x, y, width} for measurement annotations
 *   - regions: grid-based defect zones with bounding boxes
 * 
 * The COMPONENT's drawOverlay() draws these on the visible canvas.
 * This avoids all canvas taint / toDataURL issues.
 */

const MAX_SIZE = 640;
const GRID = 10;

export async function detectCracks(source) {
  console.log('[CV] v7 starting...');
  
  const img = await loadImage(source);
  const w0 = img.naturalWidth || img.width || 400;
  const h0 = img.naturalHeight || img.height || 300;
  
  // Create offscreen canvas at reduced size
  const scale = Math.max(w0, h0) > MAX_SIZE ? MAX_SIZE / Math.max(w0, h0) : 1;
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  
  let pixels;
  try {
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch (e) {
    console.error('[CV] getImageData failed (CORS?):', e.message);
    // Fallback: draw image without crossOrigin restrictions
    const canvas2 = document.createElement('canvas');
    canvas2.width = w; canvas2.height = h;
    const ctx2 = canvas2.getContext('2d');
    // Re-load image without crossOrigin
    const img2 = await loadImageNoCORS(source);
    ctx2.drawImage(img2, 0, 0, w, h);
    try {
      pixels = ctx2.getImageData(0, 0, w, h).data;
    } catch (e2) {
      console.error('[CV] getImageData still failed:', e2.message);
      return { crackPoints: [], measurements: [], regions: [], scale };
    }
  }
  
  console.log('[CV] Pixels obtained:', w, 'x', h, '=', pixels.length, 'bytes');

  // 1. Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    gray[i] = 0.299 * pixels[i*4] + 0.587 * pixels[i*4+1] + 0.114 * pixels[i*4+2];

  // 2. CLAHE (8 tiles, clip=3.0)
  const eq = clahe(gray, w, h, 8, 3.0);

  // 3. Gaussian blur
  const blur = gaussBlur(eq, w, h);

  // 4. Sobel
  const mag = new Float32Array(w * h);
  const dir = new Float32Array(w * h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    let gx = -blur[(y-1)*w+(x-1)] + blur[(y-1)*w+(x+1)]
             -2*blur[y*w+(x-1)]   + 2*blur[y*w+(x+1)]
             -blur[(y+1)*w+(x-1)] + blur[(y+1)*w+(x+1)];
    let gy = -blur[(y-1)*w+(x-1)] - 2*blur[(y-1)*w+x] - blur[(y-1)*w+(x+1)]
             +blur[(y+1)*w+(x-1)] + 2*blur[(y+1)*w+x] + blur[(y+1)*w+(x+1)];
    mag[y*w+x] = Math.sqrt(gx*gx + gy*gy);
    dir[y*w+x] = Math.atan2(gy, gx);
  }

  // 5. Dark line map
  const dark = new Float32Array(w * h);
  for (let y = 6; y < h-6; y++) for (let x = 6; x < w-6; x++) {
    let sum = 0, n = 0;
    for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) {
      sum += blur[(y+dy)*w+(x+dx)]; n++;
    }
    const diff = (sum/n) - blur[y*w+x];
    dark[y*w+x] = diff > 8 ? diff : 0;
  }

  // 6. Combined score
  const score = new Float32Array(w * h);
  const magP99 = pct(mag, 99);
  const darkP99 = pct(dark, 99);
  for (let i = 0; i < w*h; i++) {
    const s = Math.min(1, mag[i] / (magP99||1));
    const d = Math.min(1, dark[i] / (darkP99||1));
    score[i] = s * 0.5 + s * d * 1.5 + d * 0.3;
  }

  // 7. NMS
  const thin = new Float32Array(w * h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    const i = y*w+x, m = score[i];
    if (m === 0) continue;
    let a = dir[i] * 57.2958; if (a < 0) a += 180;
    let n1=0, n2=0;
    if (a < 22.5 || a >= 157.5) { n1=score[i-1]; n2=score[i+1]; }
    else if (a < 67.5) { n1=score[(y-1)*w+x+1]; n2=score[(y+1)*w+x-1]; }
    else if (a < 112.5) { n1=score[(y-1)*w+x]; n2=score[(y+1)*w+x]; }
    else { n1=score[(y-1)*w+x-1]; n2=score[(y+1)*w+x+1]; }
    thin[i] = (m >= n1 && m >= n2) ? m : 0;
  }

  // 8. Hysteresis
  const hiT = pct(thin, 88) * 0.7;
  const loT = pct(thin, 65) * 0.4;
  const mask = new Uint8Array(w * h);
  const seeds = [];
  for (let i = 0; i < w*h; i++) if (thin[i] >= hiT) { mask[i] = 2; seeds.push(i); }
  let head = 0;
  while (head < seeds.length) {
    const ci = seeds[head++];
    const cx = ci % w, cy = (ci - cx) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx+dx, ny = cy+dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const ni = ny*w+nx;
        if (!mask[ni] && thin[ni] >= loT) { mask[ni] = 1; seeds.push(ni); }
      }
    }
  }

  // 9. Collect crack points (in PERCENTAGE coordinates so component can draw)
  const crackPoints = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (mask[y*w+x]) {
      crackPoints.push({
        xPct: (x / w) * 100,
        yPct: (y / h) * 100,
        strength: mask[y*w+x], // 2=strong, 1=weak
      });
    }
  }

  // 10. Measurement points
  const measurements = [];
  const stepY = Math.max(1, Math.floor(h / 12));
  for (let y = stepY; y < h - stepY; y += stepY) {
    let bestX = -1, bestS = 0;
    for (let x = 3; x < w-3; x++) {
      if (mask[y*w+x] === 2 && thin[y*w+x] > bestS) { bestS = thin[y*w+x]; bestX = x; }
    }
    if (bestX > 0) {
      let widthPx = 0;
      for (let dx = -12; dx <= 12; dx++) {
        if (bestX+dx >= 0 && bestX+dx < w && mask[y*w+bestX+dx]) widthPx++;
      }
      measurements.push({
        xPct: (bestX / w) * 100,
        yPct: (y / h) * 100,
        widthMM: (widthPx / w * 400).toFixed(1), // rough scale
      });
    }
  }

  // 11. Grid regions
  const regions = buildRegions(score, mask, w, h);

  console.log('[CV] Done! Cracks:', crackPoints.length, 'px, Measurements:', measurements.length, ', Regions:', regions.length);

  // 12. Edge map canvas for skeleton
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = w; edgeCanvas.height = h;
  const eCtx = edgeCanvas.getContext('2d');
  const eData = eCtx.createImageData(w, h);
  for (let i = 0; i < w*h; i++) {
    const bg = Math.round(eq[i] * 0.2);
    if (mask[i]) {
      eData.data[i*4] = 0;
      eData.data[i*4+1] = mask[i] === 2 ? 220 : 120;
      eData.data[i*4+2] = 255;
    } else {
      eData.data[i*4] = bg; eData.data[i*4+1] = bg; eData.data[i*4+2] = Math.round(bg*1.1);
    }
    eData.data[i*4+3] = 255;
  }
  eCtx.putImageData(eData, 0, 0);
  // Draw measurement dots on edge map
  measurements.forEach(m => {
    eCtx.fillStyle = '#FFD700';
    eCtx.beginPath();
    eCtx.arc(m.xPct/100*w, m.yPct/100*h, 4, 0, Math.PI*2);
    eCtx.fill();
    eCtx.font = 'bold 10px sans-serif';
    eCtx.fillText(`d=${m.widthMM}мм`, m.xPct/100*w+6, m.yPct/100*h-3);
  });

  return { crackPoints, measurements, regions, edgeCanvas, scale };
}

// ======= Helpers =======

function clahe(gray, w, h, tiles, clip) {
  const tw = Math.ceil(w/tiles), th = Math.ceil(h/tiles);
  const out = new Float32Array(w*h);
  for (let ty = 0; ty < tiles; ty++) for (let tx = 0; tx < tiles; tx++) {
    const x0 = tx*tw, y0 = ty*th, x1 = Math.min(x0+tw,w), y1 = Math.min(y0+th,h);
    const area = (x1-x0)*(y1-y0);
    const hist = new Int32Array(256);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
      hist[Math.min(255, Math.max(0, Math.round(gray[y*w+x])))]++;
    const lim = Math.max(1, Math.round(clip * area / 256));
    let exc = 0;
    for (let i = 0; i < 256; i++) { if (hist[i] > lim) { exc += hist[i]-lim; hist[i] = lim; } }
    const bon = Math.floor(exc/256);
    for (let i = 0; i < 256; i++) hist[i] += bon;
    const cdf = new Int32Array(256);
    cdf[0] = hist[0]; for (let i = 1; i < 256; i++) cdf[i] = cdf[i-1]+hist[i];
    let cMin = 0; for (let i = 0; i < 256; i++) if (cdf[i]>0) { cMin=cdf[i]; break; }
    const den = Math.max(1, area-cMin);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const v = Math.min(255, Math.max(0, Math.round(gray[y*w+x])));
      out[y*w+x] = Math.round(((cdf[v]-cMin)/den)*255);
    }
  }
  return out;
}

function gaussBlur(g, w, h) {
  const k=[1,4,7,4,1,4,16,26,16,4,7,26,41,26,7,4,16,26,16,4,1,4,7,4,1];
  const o=new Float32Array(w*h);
  for (let y=2;y<h-2;y++) for (let x=2;x<w-2;x++) {
    let s=0,ki=0;
    for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) s+=g[(y+dy)*w+(x+dx)]*k[ki++];
    o[y*w+x]=s/273;
  }
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) if(y<2||y>=h-2||x<2||x>=w-2) o[y*w+x]=g[y*w+x];
  return o;
}

function pct(a, p) {
  const v=[]; for (let i=0;i<a.length;i++) if(a[i]>0) v.push(a[i]);
  if(!v.length) return 1;
  v.sort((a,b)=>a-b);
  return v[Math.min(v.length-1, Math.floor(v.length*p/100))];
}

function buildRegions(score, mask, w, h) {
  const cw=Math.floor(w/GRID), ch=Math.floor(h/GRID);
  const cells=[];
  for (let gy=0;gy<GRID;gy++) for (let gx=0;gx<GRID;gx++) {
    const x0=gx*cw, y0=gy*ch, x1=Math.min(x0+cw,w), y1=Math.min(y0+ch,h);
    let cp=0,tot=0;
    for (let py=y0;py<y1;py++) for (let px=x0;px<x1;px++) { tot++; if(mask[py*w+px]) cp++; }
    cells.push({gx,gy,x0,y0,x1,y1,r:cp/Math.max(tot,1)});
  }
  const sorted=[...cells].sort((a,b)=>b.r-a.r);
  const topN=Math.max(3,Math.ceil(cells.length*0.3));
  const hot=new Set(sorted.slice(0,topN).filter(c=>c.r>0.001).map(c=>`${c.gx},${c.gy}`));
  if(!hot.size) return [];
  const vis=new Set(), clusters=[];
  for (const c of cells) {
    const k=`${c.gx},${c.gy}`;
    if(!hot.has(k)||vis.has(k)) continue;
    const cl=[], q=[c]; vis.add(k);
    while(q.length) {
      const cur=q.shift(); cl.push(cur);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const nk=`${cur.gx+dx},${cur.gy+dy}`;
        if(!vis.has(nk)&&hot.has(nk)) { vis.add(nk); const n=cells.find(h=>h.gx===cur.gx+dx&&h.gy===cur.gy+dy); if(n) q.push(n); }
      }
    }
    clusters.push(cl);
  }
  return clusters.map((cl,i) => {
    const mnX=Math.min(...cl.map(c=>c.x0)), mnY=Math.min(...cl.map(c=>c.y0));
    const mxX=Math.max(...cl.map(c=>c.x1)), mxY=Math.max(...cl.map(c=>c.y1));
    const mxR=Math.max(...cl.map(c=>c.r));
    const rel=((mxX-mnX)*(mxY-mnY))/(w*h);
    return {
      id:i+1,
      bbox:[(mnX/w)*100,(mnY/h)*100,(mxX/w)*100,(mxY/h)*100],
      severity: mxR>0.15?'critical':mxR>0.08?'high':mxR>0.03?'medium':'low',
      confidence: Math.min(0.99,0.5+mxR*3),
      edgeDensity:mxR, area_percent:(rel*100).toFixed(1), cellCount:cl.length,
    };
  }).sort((a,b)=>b.confidence-a.confidence).slice(0,8);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src&&src.src);
    if (!url) return reject(new Error('No source'));
    // NO crossOrigin for data: and blob: URLs
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('0 dim'));
    img.onerror = () => reject(new Error('Load fail'));
    img.src = url;
  });
}

function loadImageNoCORS(src) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = typeof src === 'string' ? src : (src&&src.src);
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = url;
  });
}
