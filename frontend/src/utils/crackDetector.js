/**
 * crackDetector.js v8 — SIMPLIFIED, aggressive detection
 * 
 * No NMS, no hysteresis — just: 
 *   pixel is edge (Sobel > p70) AND/OR dark line (darker than neighbors)
 *   = crack pixel
 * 
 * Returns percentage coordinates for canvas overlay drawing.
 */

const MAX_SIZE = 512;
const GRID = 10;

export async function detectCracks(source) {
  console.log('[CV] v8 start');
  const img = await loadImage(source);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  console.log('[CV] img:', w0, 'x', h0);
  
  const scale = Math.max(w0, h0) > MAX_SIZE ? MAX_SIZE / Math.max(w0, h0) : 1;
  const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  
  let px;
  try { px = ctx.getImageData(0, 0, w, h).data; }
  catch(e) {
    console.error('[CV] getImageData FAILED:', e);
    return empty();
  }
  
  // Verify pixels are real (not all zeros)
  let nonZeroCount = 0;
  for (let i = 0; i < Math.min(1000, px.length); i += 4) {
    if (px[i] > 0 || px[i+1] > 0 || px[i+2] > 0) nonZeroCount++;
  }
  console.log('[CV] pixel check: nonZero in first 250 =', nonZeroCount);
  if (nonZeroCount === 0) {
    console.error('[CV] All pixels zero — image not drawn to canvas');
    return empty();
  }

  // 1. Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    gray[i] = 0.299 * px[i*4] + 0.587 * px[i*4+1] + 0.114 * px[i*4+2];

  // 2. CLAHE 
  const eq = clahe(gray, w, h);

  // 3. Blur
  const bl = blur3(eq, w, h);

  // 4. Sobel
  const mag = new Float32Array(w * h);
  for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
    const gx = -bl[(y-1)*w+x-1] + bl[(y-1)*w+x+1]
               -2*bl[y*w+x-1] + 2*bl[y*w+x+1]
               -bl[(y+1)*w+x-1] + bl[(y+1)*w+x+1];
    const gy = -bl[(y-1)*w+x-1] - 2*bl[(y-1)*w+x] - bl[(y-1)*w+x+1]
               +bl[(y+1)*w+x-1] + 2*bl[(y+1)*w+x] + bl[(y+1)*w+x+1];
    mag[y*w+x] = Math.sqrt(gx*gx + gy*gy);
  }

  // 5. Dark line map (pixel darker than 7px neighborhood)
  const dark = new Float32Array(w * h);
  for (let y = 4; y < h-4; y++) for (let x = 4; x < w-4; x++) {
    let s = 0, n = 0;
    for (let dy = -4; dy <= 4; dy += 2) for (let dx = -4; dx <= 4; dx += 2) {
      s += bl[(y+dy)*w+x+dx]; n++;
    }
    const diff = (s/n) - bl[y*w+x];
    dark[y*w+x] = diff > 5 ? diff : 0;
  }

  // 6. Percentiles (loop-based, no huge sort)
  const magP = samplePercentile(mag, w, h, 0.70);
  const darkP = samplePercentile(dark, w, h, 0.80);
  console.log('[CV] thresholds: magP70=', magP.toFixed(1), 'darkP80=', darkP.toFixed(1));

  // 7. Build crack mask — AGGRESSIVE: edge OR dark line
  const crackPoints = [];
  const mask = new Uint8Array(w * h);
  
  for (let y = 2; y < h-2; y++) for (let x = 2; x < w-2; x++) {
    const i = y * w + x;
    const isEdge = mag[i] > magP;
    const isDark = dark[i] > darkP;
    const isStrong = mag[i] > magP * 1.5 && isDark;
    
    if (isStrong) {
      mask[i] = 2;
      crackPoints.push({ xPct: (x/w)*100, yPct: (y/h)*100, strength: 2 });
    } else if (isEdge && isDark) {
      mask[i] = 1;
      crackPoints.push({ xPct: (x/w)*100, yPct: (y/h)*100, strength: 1 });
    }
  }
  
  console.log('[CV] crack pixels:', crackPoints.length, '/', w*h, '=', (crackPoints.length/(w*h)*100).toFixed(1)+'%');

  // 8. Subsample if too many points (max ~15000 for perf)
  let finalPoints = crackPoints;
  if (crackPoints.length > 15000) {
    const step = Math.ceil(crackPoints.length / 15000);
    finalPoints = crackPoints.filter((_, i) => i % step === 0);
    console.log('[CV] subsampled to', finalPoints.length);
  }

  // 9. Measurements
  const measurements = [];
  const stepY = Math.max(1, Math.floor(h / 10));
  for (let y = stepY; y < h-stepY; y += stepY) {
    let bestX = -1, bestV = 0;
    for (let x = 3; x < w-3; x++) {
      if (mask[y*w+x] === 2 && mag[y*w+x] > bestV) { bestV = mag[y*w+x]; bestX = x; }
    }
    if (bestX > 0) {
      let wpx = 0;
      for (let dx = -10; dx <= 10; dx++) if (bestX+dx>=0 && bestX+dx<w && mask[y*w+bestX+dx]) wpx++;
      measurements.push({ xPct: (bestX/w)*100, yPct: (y/h)*100, widthMM: (wpx/w*350).toFixed(1) });
    }
  }

  // 10. Grid regions
  const regions = gridRegions(mag, mask, w, h);

  // 11. Edge canvas for skeleton
  const ec = document.createElement('canvas');
  ec.width = w; ec.height = h;
  const ectx = ec.getContext('2d');
  const ed = ectx.createImageData(w, h);
  for (let i = 0; i < w*h; i++) {
    const bg = Math.round(eq[i] * 0.15);
    if (mask[i] === 2) {
      ed.data[i*4]=0; ed.data[i*4+1]=220; ed.data[i*4+2]=255;
    } else if (mask[i] === 1) {
      ed.data[i*4]=0; ed.data[i*4+1]=100; ed.data[i*4+2]=200;
    } else {
      ed.data[i*4]=bg; ed.data[i*4+1]=bg; ed.data[i*4+2]=Math.round(bg*1.1);
    }
    ed.data[i*4+3]=255;
  }
  ectx.putImageData(ed, 0, 0);
  measurements.forEach(m => {
    ectx.fillStyle='#FFD700'; ectx.beginPath();
    ectx.arc(m.xPct/100*w, m.yPct/100*h, 4, 0, Math.PI*2); ectx.fill();
    ectx.font='bold 10px sans-serif';
    ectx.fillText(`d=${m.widthMM}мм`, m.xPct/100*w+6, m.yPct/100*h-3);
  });

  console.log('[CV] DONE! points:', finalPoints.length, 'meas:', measurements.length, 'regions:', regions.length);
  return { crackPoints: finalPoints, measurements, regions, edgeCanvas: ec, scale };
}

function empty() { return { crackPoints: [], measurements: [], regions: [], edgeCanvas: null, scale: 1 }; }

// ---- Sampled percentile (no huge array sort) ----
function samplePercentile(arr, w, h, pct) {
  // Sample every 4th pixel to keep sorting fast
  const samples = [];
  for (let i = 0; i < arr.length; i += 4) if (arr[i] > 0) samples.push(arr[i]);
  if (!samples.length) return 1;
  samples.sort((a, b) => a - b);
  return samples[Math.min(samples.length-1, Math.floor(samples.length * pct))];
}

// ---- CLAHE ----
function clahe(gray, w, h) {
  const T = 6, tw = Math.ceil(w/T), th = Math.ceil(h/T);
  const out = new Float32Array(w * h);
  for (let ty = 0; ty < T; ty++) for (let tx = 0; tx < T; tx++) {
    const x0=tx*tw, y0=ty*th, x1=Math.min(x0+tw,w), y1=Math.min(y0+th,h);
    const area=(x1-x0)*(y1-y0);
    const hist=new Int32Array(256);
    for (let y=y0;y<y1;y++) for (let x=x0;x<x1;x++) hist[clamp(Math.round(gray[y*w+x]))]++;
    const lim=Math.max(1,Math.round(3.0*area/256));
    let exc=0;
    for (let i=0;i<256;i++) if(hist[i]>lim){exc+=hist[i]-lim;hist[i]=lim;}
    const bon=Math.floor(exc/256);
    for(let i=0;i<256;i++) hist[i]+=bon;
    const cdf=new Int32Array(256);
    cdf[0]=hist[0]; for(let i=1;i<256;i++) cdf[i]=cdf[i-1]+hist[i];
    let cMin=0; for(let i=0;i<256;i++) if(cdf[i]>0){cMin=cdf[i];break;}
    const den=Math.max(1,area-cMin);
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
      const v=clamp(Math.round(gray[y*w+x]));
      out[y*w+x]=Math.round(((cdf[v]-cMin)/den)*255);
    }
  }
  return out;
}

// ---- Blur 3x3 (fast) ----
function blur3(g, w, h) {
  const o = new Float32Array(w*h);
  for (let y=1;y<h-1;y++) for (let x=1;x<w-1;x++) {
    o[y*w+x] = (g[(y-1)*w+x-1]+g[(y-1)*w+x]*2+g[(y-1)*w+x+1]+
                g[y*w+x-1]*2+g[y*w+x]*4+g[y*w+x+1]*2+
                g[(y+1)*w+x-1]+g[(y+1)*w+x]*2+g[(y+1)*w+x+1]) / 16;
  }
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(y<1||y>=h-1||x<1||x>=w-1) o[y*w+x]=g[y*w+x];
  return o;
}

function clamp(v) { return v<0?0:v>255?255:v; }

// ---- Grid regions ----
function gridRegions(mag, mask, w, h) {
  const cw=Math.floor(w/GRID), ch=Math.floor(h/GRID);
  const cells=[];
  for(let gy=0;gy<GRID;gy++) for(let gx=0;gx<GRID;gx++){
    const x0=gx*cw,y0=gy*ch,x1=Math.min(x0+cw,w),y1=Math.min(y0+ch,h);
    let cp=0,t=0;
    for(let py=y0;py<y1;py++) for(let px=x0;px<x1;px++){t++;if(mask[py*w+px])cp++;}
    cells.push({gx,gy,x0,y0,x1,y1,r:cp/Math.max(t,1)});
  }
  const sorted=[...cells].sort((a,b)=>b.r-a.r);
  const topN=Math.max(3,Math.ceil(cells.length*0.25));
  const hot=new Set(sorted.slice(0,topN).filter(c=>c.r>0).map(c=>`${c.gx},${c.gy}`));
  if(!hot.size) return[];
  const vis=new Set(),clusters=[];
  for(const c of cells){
    const k=`${c.gx},${c.gy}`;
    if(!hot.has(k)||vis.has(k))continue;
    const cl=[],q=[c];vis.add(k);
    while(q.length){
      const cur=q.shift();cl.push(cur);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        const nk=`${cur.gx+dx},${cur.gy+dy}`;
        if(!vis.has(nk)&&hot.has(nk)){vis.add(nk);const n=cells.find(h=>h.gx===cur.gx+dx&&h.gy===cur.gy+dy);if(n)q.push(n);}
      }
    }
    clusters.push(cl);
  }
  return clusters.map((cl,i)=>{
    const mnX=Math.min(...cl.map(c=>c.x0)),mnY=Math.min(...cl.map(c=>c.y0));
    const mxX=Math.max(...cl.map(c=>c.x1)),mxY=Math.max(...cl.map(c=>c.y1));
    const mxR=Math.max(...cl.map(c=>c.r));
    const rel=((mxX-mnX)*(mxY-mnY))/(w*h);
    return{id:i+1,bbox:[(mnX/w)*100,(mnY/h)*100,(mxX/w)*100,(mxY/h)*100],
      severity:mxR>0.15?'critical':mxR>0.08?'high':mxR>0.03?'medium':'low',
      confidence:Math.min(0.99,0.5+mxR*3),edgeDensity:mxR,area_percent:(rel*100).toFixed(1),cellCount:cl.length};
  }).sort((a,b)=>b.confidence-a.confidence).slice(0,8);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete && src.naturalWidth > 0) return resolve(src);
    const img = new Image();
    const url = typeof src === 'string' ? src : (src&&src.src);
    if (!url) return reject(new Error('No source'));
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => img.naturalWidth > 0 ? resolve(img) : reject(new Error('0 dim'));
    img.onerror = () => reject(new Error('Load fail'));
    img.src = url;
  });
}
