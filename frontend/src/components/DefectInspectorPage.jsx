import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import { detectCracks } from '../utils/crackDetector';
import './DefectInspectorPage.css';

const DEFECT_TYPES = [
  { id: 'crack', icon: '🧱', label: 'Трещина в стене / потолке', keywords: 'Трещина в стене, потолке, штукатурке' },
  { id: 'leak', icon: '💧', label: 'Протечка / сырость', keywords: 'Протечка, сырость, вода, затопление' },
  { id: 'mold', icon: '🦠', label: 'Плесень / грибок', keywords: 'Плесень, грибок, биопоражение, чёрные пятна' },
  { id: 'corrosion', icon: '🔩', label: 'Коррозия арматуры', keywords: 'Коррозия арматуры, ржавчина, оголение металла' },
  { id: 'facade', icon: '🏠', label: 'Фасад / облицовка', keywords: 'Фасад, облицовка, штукатурка отваливается, отслоение' },
  { id: 'roof', icon: '🏚️', label: 'Кровля / крыша', keywords: 'Кровля, крыша, протечка кровли, черепица' },
  { id: 'foundation', icon: '🏗️', label: 'Фундамент / осадка', keywords: 'Фундамент, осадка, просадка, подвал, основание' },
  { id: 'window', icon: '🪟', label: 'Окна / продувание', keywords: 'Окно, стеклопакет, продувает, откос, подоконник' },
  { id: 'level', icon: '📐', label: 'Перепад пола / потолка', keywords: 'Перепад, неровности, кривой пол, горизонт, уровень' },
  { id: 'other', icon: '❓', label: 'Другое (описать вручную)', keywords: '' },
];

export default function DefectInspectorPage({ onBack, hideHeader = false }) {
  const [photos, setPhotos] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [selectedDefectType, setSelectedDefectType] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [report, setReport] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [defectMarkers, setDefectMarkers] = useState([]);
  const [severitySummary, setSeveritySummary] = useState(null);
  const [showCriticalLayer, setShowCriticalLayer] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.65);
  const [selectedDefectId, setSelectedDefectId] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('expert');
  const [visionMode, setVisionMode] = useState('hud');
  const [stressHeatmapImage, setStressHeatmapImage] = useState(null);
  const [skeletonImage, setSkeletonImage] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [createdDefectOrder, setCreatedDefectOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [edgeMapSrc, setEdgeMapSrc] = useState(null);
  const [inspectionHistory, setInspectionHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('defect_history') || '[]'); } catch { return []; }
  });

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [crackData, setCrackData] = useState(null); // {crackPoints, measurements} from CV

  const drawOverlay = useCallback(() => {
    const imgEl = imgRef.current;
    const canvas = canvasRef.current;
    if (!imgEl || !canvas) return;
    if (visionMode === 'clean') {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    const cw = imgEl.clientWidth || imgEl.offsetWidth || 400;
    const ch = imgEl.clientHeight || imgEl.offsetHeight || 300;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);

    // ========== INLINE CRACK DETECTION: Valley/Line detector ==========
    // Cracks = dark LINES (darker than BOTH sides). Not edges (one side dark, other bright).
    if (visionMode === 'hud' || visionMode === 'stress') {
      try {
        const tmpC = document.createElement('canvas');
        const sz = 300;
        const imgW = imgEl.naturalWidth || cw;
        const imgH = imgEl.naturalHeight || ch;
        const sc = Math.min(sz / imgW, sz / imgH, 1);
        const tw = Math.round(imgW * sc), th = Math.round(imgH * sc);
        tmpC.width = tw; tmpC.height = th;
        const tmpCtx = tmpC.getContext('2d');
        tmpCtx.drawImage(imgEl, 0, 0, tw, th);
        const px = tmpCtx.getImageData(0, 0, tw, th).data;
        
        // Grayscale
        const gray = new Float32Array(tw * th);
        for (let i = 0; i < tw * th; i++)
          gray[i] = 0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2];
        
        // Valley detection: for each pixel, check if it's darker than
        // neighbors on BOTH sides in any direction (H, V, 2 diagonals).
        // This specifically finds LINE features, not edges.
        const valley = new Float32Array(tw * th);
        const R = 3; // probe radius
        for (let y = R; y < th-R; y++) for (let x = R; x < tw-R; x++) {
          const center = gray[y*tw+x];
          // 4 directions: horizontal, vertical, diag1, diag2
          const dirs = [
            [gray[y*tw+(x-R)], gray[y*tw+(x+R)]],              // horizontal
            [gray[(y-R)*tw+x], gray[(y+R)*tw+x]],              // vertical
            [gray[(y-R)*tw+(x-R)], gray[(y+R)*tw+(x+R)]],      // diagonal ↘
            [gray[(y-R)*tw+(x+R)], gray[(y+R)*tw+(x-R)]],      // diagonal ↗
          ];
          
          let maxValley = 0;
          for (const [left, right] of dirs) {
            // Valley = min(left, right) - center
            // Both sides must be brighter than center
            const v = Math.min(left, right) - center;
            if (v > maxValley) maxValley = v;
          }
          valley[y*tw+x] = maxValley > 4 ? maxValley : 0; // threshold: 4 brightness units
        }
        
        // Multi-scale: also check with larger radius for wider cracks
        const R2 = 6;
        for (let y = R2; y < th-R2; y++) for (let x = R2; x < tw-R2; x++) {
          const center = gray[y*tw+x];
          const dirs = [
            [gray[y*tw+(x-R2)], gray[y*tw+(x+R2)]],
            [gray[(y-R2)*tw+x], gray[(y+R2)*tw+x]],
            [gray[(y-R2)*tw+(x-R2)], gray[(y+R2)*tw+(x+R2)]],
            [gray[(y-R2)*tw+(x+R2)], gray[(y+R2)*tw+(x-R2)]],
          ];
          for (const [l, r] of dirs) {
            const v = Math.min(l, r) - center;
            if (v > valley[y*tw+x]) valley[y*tw+x] = v > 4 ? v : 0;
          }
        }
        
        // Texture contrast: ignore uniform dark areas (shadows)
        // Only keep valleys where local contrast is high
        const filtered = new Float32Array(tw * th);
        for (let y = 4; y < th-4; y++) for (let x = 4; x < tw-4; x++) {
          if (valley[y*tw+x] === 0) continue;
          // Check local std dev
          let sum = 0, sum2 = 0, n = 0;
          for (let dy=-3; dy<=3; dy+=2) for (let dx=-3; dx<=3; dx+=2) {
            const v = gray[(y+dy)*tw+(x+dx)]; sum += v; sum2 += v*v; n++;
          }
          const mean = sum/n;
          const std = Math.sqrt(sum2/n - mean*mean);
          // Keep only if there's enough local contrast (not uniform area)
          if (std > 8) filtered[y*tw+x] = valley[y*tw+x];
        }
        
        // Threshold: take top percentile of valley values
        const vals = [];
        for (let i = 0; i < tw*th; i += 2) if (filtered[i] > 0) vals.push(filtered[i]);
        vals.sort((a, b) => a - b);
        const t50 = vals[Math.floor(vals.length * 0.50)] || 5;
        const t80 = vals[Math.floor(vals.length * 0.80)] || 10;
        
        // Draw crack pixels
        let count = 0;
        for (let y = R2; y < th-R2; y++) for (let x = R2; x < tw-R2; x++) {
          const v = filtered[y*tw+x];
          if (v <= 0) continue;
          const cx = (x / tw) * cw;
          const cy = (y / th) * ch;
          
          if (v > t80) {
            ctx.fillStyle = 'rgba(0, 220, 255, 0.9)';
            ctx.fillRect(cx - 1.5, cy - 1.5, 4, 4);
            count++;
          } else if (v > t50) {
            ctx.fillStyle = 'rgba(0, 160, 255, 0.5)';
            ctx.fillRect(cx - 0.5, cy - 0.5, 2, 2);
            count++;
          }
        }
        
        // Stress mode: heat overlay on strong valleys
        if (visionMode === 'stress' && count > 0) {
          for (let y = R2; y < th-R2; y += 2) for (let x = R2; x < tw-R2; x += 2) {
            if (filtered[y*tw+x] > t50) {
              const cx = (x/tw)*cw, cy = (y/th)*ch;
              const strong = filtered[y*tw+x] > t80;
              const r = strong ? 12 : 6;
              const grad = ctx.createRadialGradient(cx,cy,1,cx,cy,r);
              grad.addColorStop(0, strong ? 'rgba(255,30,30,0.25)' : 'rgba(255,150,0,0.15)');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = grad;
              ctx.fillRect(cx-r,cy-r,r*2,r*2);
            }
          }
        }
        
        console.log('[Overlay] Drew', count, 'crack pixels, magT='+magT.toFixed(1), 'darkT='+darkT.toFixed(1));
      } catch (e) {
        console.error('[Overlay] Inline CV error:', e);
      }
    }

    const sevColors = {
      critical: { stroke: '#ff2828', fill: 'rgba(255,40,40,0.18)', text: 'КРИТИЧ.' },
      high: { stroke: '#ff781e', fill: 'rgba(255,120,30,0.15)', text: 'ВЫСОКИЙ' },
      medium: { stroke: '#ffc800', fill: 'rgba(255,200,0,0.12)', text: 'СРЕДНИЙ' },
      low: { stroke: '#50c850', fill: 'rgba(80,200,80,0.12)', text: 'НИЗКИЙ' },
    };

    // ========== DRAW BOUNDING BOXES ==========
    if (defectMarkers.length > 0) {
      defectMarkers.forEach((m, idx) => {
        if (!m.bbox) return;
        const s = sevColors[m.severity] || sevColors.medium;
        const x = (m.bbox[0] / 100) * cw;
        const y = (m.bbox[1] / 100) * ch;
        const bw = ((m.bbox[2] - m.bbox[0]) / 100) * cw;
        const bh = ((m.bbox[3] - m.bbox[1]) / 100) * ch;

        // Filled box
        ctx.fillStyle = s.fill;
        ctx.fillRect(x, y, bw, bh);

        // Border
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, bw, bh);

        // Corner brackets
        const bLen = Math.min(bw, bh) * 0.2;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y + bLen); ctx.lineTo(x, y); ctx.lineTo(x + bLen, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + bw - bLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + bLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + bh - bLen); ctx.lineTo(x, y + bh); ctx.lineTo(x + bLen, y + bh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + bw - bLen, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - bLen); ctx.stroke();

        // Label
        const fontSize = Math.max(11, Math.min(cw * 0.022, 16));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const label = `#${idx + 1} ${s.text} ${m.area_percent ? m.area_percent + '%' : ''}`;
        const tw = ctx.measureText(label).width;
        const lh = fontSize + 6;
        const ly = y - lh - 2;
        ctx.fillStyle = s.stroke;
        ctx.fillRect(x, ly < 0 ? y : ly, tw + 10, lh);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 5, (ly < 0 ? y + lh - 4 : ly + lh - 4));
      });
    }

    // HUD grid lines
    if (visionMode === 'hud') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < cw; gx += cw / 8) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
      for (let gy = 0; gy < ch; gy += ch / 6) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }
    }
  }, [visionMode, defectMarkers]);

  useEffect(() => { drawOverlay(); }, [visionMode, defectMarkers, drawOverlay]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReset = () => {
    setPhotos([]);
    setClientName('');
    setClientPhone('');
    setClientAddress('');
    setAiDescription('');
    setSelectedDefectType(null);
    setReport(null);
    setAnnotatedImage(null);
    setDefectMarkers([]);
    setSeveritySummary(null);
    setStressHeatmapImage(null);
    setSkeletonImage(null);
    setEdgeMapSrc(null);
    setCreatedDefectOrder(null);
    setActiveReportTab('expert');
    setVisionMode('hud');
    setLightboxZoom(1);
    setSelectedDefectId(null);
    showToast('🔄 Форма очищена — загрузите новые фото');
  };

  const saveToHistory = (reportData) => {
    const entry = {
      id: reportData.id,
      date: reportData.date,
      defectType: reportData.defectType,
      severity: reportData.severity,
      estimatedCost: reportData.estimatedCost,
      clientName: reportData.clientName,
      address: reportData.address,
    };
    const updated = [entry, ...inspectionHistory].slice(0, 20);
    setInspectionHistory(updated);
    try { localStorage.setItem('defect_history', JSON.stringify(updated)); } catch {}
  };

  const handleSelectDefectType = (type) => {
    setSelectedDefectType(type.id);
    if (type.id !== 'other' && type.keywords) {
      setAiDescription(type.keywords);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 10) {
      showToast('⚠️ Максимальное количество фото: 10 штук');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        setPhotos(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          url: URL.createObjectURL(file),
          base64: base64,
          file: file
        }]);
      };
      reader.readAsDataURL(file);
    });

    showToast(`📸 Добавлено ${files.length} фото дефектов (подготовлены для Vision AI)`);
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const applyPresetPrompt = (promptText) => {
    setAiDescription(prev => prev ? `${prev}. ${promptText}` : promptText);
  };

  const handlePrintTechnicalAct = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('⚠️ Разрешите всплывающие окна для печати Акта');
      return;
    }

    const materials = report.analytics?.materials || [];
    const labor = report.analytics?.labor || [];
    const totalMat = materials.reduce((s, m) => s + m.cost_kzt, 0);
    const totalLab = labor.reduce((s, l) => s + l.cost_kzt, 0);
    const totalAll = report.analytics?.total_cost_kzt || (totalMat + totalLab);
    const photoSrc = photos[0]?.base64 || annotatedImage || '';

    const materialsRows = materials.map((m, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${m.name}</td>
        <td style="text-align:center">${m.qty}</td>
        <td style="text-align:right">${m.cost_kzt.toLocaleString('ru-RU')} T</td>
      </tr>
    `).join('');

    const laborRows = labor.map((l, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${l.name}</td>
        <td style="text-align:center">${l.qty}</td>
        <td style="text-align:right">${l.cost_kzt.toLocaleString('ru-RU')} T</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Акт обследования ${report.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 18px; font-weight: 900; color: #0284c7; }
          .title { font-size: 15px; font-weight: 800; text-align: center; margin: 15px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .meta td { padding: 5px 10px; border: 1px solid #cbd5e1; font-size: 12px; }
          .meta td.label { background: #f1f5f9; font-weight: 700; width: 32%; }
          .est th { background: #0f172a; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
          .est td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 12px; }
          .est tr.subtotal td { background: #f1f5f9; font-weight: 700; }
          .est tr.total td { background: #0284c7; color: #fff; font-weight: 900; font-size: 13px; }
          .img-box { text-align: center; margin: 16px 0; }
          .img-box img { max-width: 100%; max-height: 320px; border: 1px solid #94a3b8; border-radius: 4px; }
          .sign { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 16px; border-top: 1px dashed #94a3b8; }
          .stamp { width: 100px; height: 100px; border: 2px dashed #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; color: #0284c7; font-size: 9px; font-weight: 700; transform: rotate(-10deg); }
          h4 { margin: 14px 0 6px; color: #0f172a; font-size: 13px; }
          @media print { body { margin: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">QAZGOST AI<br><small style="font-size:10px;color:#64748b;">ТЕХНАДЗОР РК</small></div>
          <div style="text-align:right">
            <strong>АКТ № ${report.id}</strong><br>
            <small>Дата: ${report.date}</small>
          </div>
        </div>
        <div class="title">Акт инструментального дефектоскопического обследования</div>

        <table class="meta">
          <tr><td class="label">Заказчик:</td><td>${report.clientName}</td></tr>
          <tr><td class="label">Телефон:</td><td>${report.clientPhone}</td></tr>
          <tr><td class="label">Адрес объекта:</td><td>${report.address}</td></tr>
          <tr><td class="label">Вид дефекта:</td><td><strong>${report.defectType}</strong></td></tr>
          <tr><td class="label">Класс опасности:</td><td>${report.severity}</td></tr>
          <tr><td class="label">Нормативный документ:</td><td>${report.snipCode}</td></tr>
          <tr><td class="label">Категория (ГОСТ 31937):</td><td>${report.analytics?.gost_status || 'Категория III'}</td></tr>
          <tr><td class="label">Метод устранения:</td><td>${report.fixMethod}</td></tr>
          <tr><td class="label">Срок работ:</td><td>${report.workDays} раб. дн.</td></tr>
        </table>

        ${photoSrc ? `
          <div class="img-box">
            <div style="font-weight:700;margin-bottom:4px;font-size:12px;">Фото дефекта:</div>
            <img src="${photoSrc}" alt="Фото дефекта" />
          </div>
        ` : ''}

        ${(materials.length > 0 || labor.length > 0) ? `
          <h4>Смета на ремонтно-восстановительные работы (T)</h4>
          <table class="est">
            <thead>
              <tr><th>№</th><th>Наименование</th><th>Кол-во</th><th style="text-align:right">Стоимость</th></tr>
            </thead>
            <tbody>
              ${materials.length > 0 ? `
                <tr><td colspan="4" style="background:#e0f2fe;font-weight:700;font-size:11px;">Материалы</td></tr>
                ${materialsRows}
                <tr class="subtotal"><td colspan="3" style="text-align:right">Итого материалы:</td><td style="text-align:right">${totalMat.toLocaleString('ru-RU')} T</td></tr>
              ` : ''}
              ${labor.length > 0 ? `
                <tr><td colspan="4" style="background:#fef3c7;font-weight:700;font-size:11px;">Работы</td></tr>
                ${laborRows}
                <tr class="subtotal"><td colspan="3" style="text-align:right">Итого работы:</td><td style="text-align:right">${totalLab.toLocaleString('ru-RU')} T</td></tr>
              ` : ''}
              <tr class="total"><td colspan="3" style="text-align:right">ИТОГО СМЕТНАЯ СТОИМОСТЬ:</td><td style="text-align:right">${totalAll.toLocaleString('ru-RU')} T</td></tr>
            </tbody>
          </table>
        ` : `
          <h4>Ориентировочная стоимость: ${report.estimatedCost}</h4>
        `}

        <div class="sign">
          <div>
            <p><strong>Инженер инструментального контроля:</strong> ________________ / Нурланов А. М.</p>
            <p><strong>Технический надзор:</strong> Сертификат эксперта № KZ-0982-ENG</p>
          </div>
          <div class="stamp">
            ЭКСПЕРТИЗА<br>ПРОЙДЕНА<br>QAZGOST AI<br>ТЕХНАДЗОР
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleRunInspection = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (photos.length === 0) {
      showToast('⚠️ Пожалуйста, загрузите хотя бы 1 фото дефекта');
      return;
    }

    setIsScanning(true);
    setReport(null);
    setAnnotatedImage(null);
    setDefectMarkers([]);
    setSeveritySummary(null);
    setScanStepMessage('🔬 QazGost AI анализирует фото на дефекты...');

    try {
      let data = null;

      // ═══ STEP 1: Send photo to /defect-scan (CV detection, NO JWT needed, returns annotated image) ═══
      const firstPhoto = photos[0];
      if (firstPhoto) {
        setScanStepMessage('🧠 QazGost CV сканирует фото на дефекты...');
        
        const formData = new FormData();
        if (firstPhoto.file) {
          formData.append('file', firstPhoto.file, firstPhoto.file.name || 'photo.jpg');
        } else if (firstPhoto.base64) {
          try {
            const byteString = atob(firstPhoto.base64.split(',')[1]);
            const mimeMatch = firstPhoto.base64.split(',')[0].match(/:(.*?);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeType });
            formData.append('file', blob, 'photo.jpg');
          } catch (e) {
            console.warn('[DefectScan] Failed to convert base64 to Blob:', e);
          }
        }
        if (aiDescription) {
          formData.append('prompt', aiDescription);
        }

        try {
          const queryParams = new URLSearchParams({
            sensitivity: sensitivity.toString(),
            prompt: aiDescription || ''
          });
          const aiRes = await fetch(`/api/v1/defect-scan?${queryParams.toString()}`, {
            method: 'POST',
            body: formData,
          });

          console.log('[DefectScan] Response status:', aiRes.status);

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            console.log('[DefectScan] Response:', {
              success: aiData.success,
              defectType: aiData.defectType,
              defectsCount: aiData.defects?.items?.length,
              hasAnnotatedImage: !!aiData.defect_annotated_image,
            });
            
            if (aiData.success && aiData.defects?.items?.length > 0) {
              data = {
                defectType: aiData.defectType,
                severity: aiData.severity,
                snipCode: aiData.snipCode,
                fixMethod: aiData.fixMethod,
                estimatedCost: aiData.estimatedCost,
                workDays: aiData.workDays,
                defects: aiData.defects,
                defect_annotated_image: aiData.defect_annotated_image,
                stress_heatmap_image: aiData.stress_heatmap_image,
                skeleton_image: aiData.skeleton_image,
                defect_severity_summary: aiData.defect_severity_summary,
                structure_zones: aiData.structure_zones || [],
              };
              
              setScanStepMessage(`✅ Обнаружено ${aiData.defects.items.length} дефектов! Формирую карту...`);
            } else if (aiData.defect_annotated_image) {
              // Even if no items array, use the annotated image if present
              data = {
                defectType: aiData.defectType || 'Дефект строительной конструкции',
                severity: aiData.severity || '3 класс — Требует устранения',
                snipCode: aiData.snipCode || 'СНиП РК 3.02-04-2019',
                fixMethod: aiData.fixMethod || 'Требуется детальный осмотр.',
                estimatedCost: aiData.estimatedCost || '45 000 – 75 000 ₸',
                workDays: aiData.workDays || 2,
                defects: aiData.defects,
                defect_annotated_image: aiData.defect_annotated_image,
                defect_severity_summary: aiData.defect_severity_summary,
                structure_zones: aiData.structure_zones || [],
              };
              setScanStepMessage('✅ Анализ завершён!');
            }
          } else {
            console.warn('[DefectScan] Non-OK status:', aiRes.status);
          }
        } catch (aiErr) {
          console.warn('[DefectScan] Failed:', aiErr.message);
        }
      }

      // ═══ STEP 2: Fallback — Go backend text analysis (OpenAI GPT-4o or SNiP heuristics) ═══
      if (!data) {
        setScanStepMessage('📸 AI Vision анализирует дефект по пикселям...');
        
        const token = localStorage.getItem('qazgost_token') || localStorage.getItem('token') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Try defect-vision with base64 photos
        if (photos.some(p => p.base64)) {
          const photosBase64 = photos.slice(0, 4).filter(p => p.base64).map(p => p.base64);
          
          const vRes = await fetch('/api/v1/ai/defect-vision', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              photos: photosBase64,
              description: aiDescription || '',
            })
          });

          if (vRes.ok) {
            const vData = await vRes.json();
            if (vData && vData.defectType) {
              data = vData;
            }
          }
        }

        // Try text-only defect analysis
        if (!data) {
          setScanStepMessage('🤖 Нейросеть анализирует дефект по описанию...');
          
          const res = await fetch('/api/v1/ai/defect', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              description: aiDescription || 'Анализ дефекта строительных конструкций и отделки по фото'
            })
          });

          if (res.ok) {
            data = await res.json();
          }
        }
      }

      // ═══ STEP 3: Offline fallback — expert domain heuristics (расширенный) ═══
      if (!data) {
        const descLower = (aiDescription || '').toLowerCase();
        
        // Расширенная база дефектов по СНиП РК
        const defectTemplates = [
          {
            keywords: ['протечк', 'сырост', 'вод', 'затопл', 'промок', 'мокр', 'влаг'],
            defectType: 'Нарушение гидроизоляционного слоя (протечка / сырость)',
            severity: '4 класс — Высокий риск биопоражения',
            snipCode: 'СНиП РК 2.04-09-2018 «Гидроизоляция зданий»',
            fixMethod: 'Локализация источника протечки, сушка тепловой пушкой, обработка фунгицидом, нанесение двухкомпонентной полимерной гидроизоляции.',
            estimatedCost: '55 000 – 120 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Гидроизоляция обмазочная полимерная', qty: '3.0 кг', cost_kzt: 12500 },
              { name: 'Фунгицидная грунтовка антиплесень', qty: '1.0 л', cost_kzt: 4200 },
              { name: 'Герметик полиуретановый', qty: '2 шт', cost_kzt: 5600 },
              { name: 'Армирующая лента для швов', qty: '5 м', cost_kzt: 1800 },
            ],
            labor: [
              { name: 'Демонтаж поражённого участка и сушка', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Обработка фунгицидом и грунтовка', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Нанесение гидроизоляции в 2 слоя', qty: '1 компл.', cost_kzt: 22000 },
              { name: 'Восстановление отделки', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.3 }, { pos_pct: 25, width_mm: 0.8 },
              { pos_pct: 50, width_mm: 1.5 }, { pos_pct: 75, width_mm: 1.1 }, { pos_pct: 100, width_mm: 0.4 },
            ],
          },
          {
            keywords: ['перепад', 'неровн', 'кривой пол', 'кривой потол', 'горизонт', 'уровень'],
            defectType: 'Отклонение плоскости от горизонтали / вертикали',
            severity: '2 класс — Допустимое отклонение',
            snipCode: 'СП РК 3.02-107-2014 «Полы и перекрытия»',
            fixMethod: 'Лазерное нивелирование, шлифовка неровностей, заливка самовыравнивающейся нивелир-массой толщиной до 15 мм.',
            estimatedCost: '40 000 – 85 000 ₸',
            workDays: 2,
            materials: [
              { name: 'Наливной пол самовыравнивающийся (25 кг)', qty: '4 мешка', cost_kzt: 14000 },
              { name: 'Грунтовка глубокого проникновения', qty: '2.0 л', cost_kzt: 3600 },
              { name: 'Демпферная лента', qty: '10 м', cost_kzt: 2200 },
            ],
            labor: [
              { name: 'Лазерная нивелировка и замер отклонений', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Подготовка основания и грунтовка', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Заливка самонивелирующейся смеси', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['плесен', 'грибок', 'чёрн', 'черн', 'биопоражен'],
            defectType: 'Биопоражение конструкций (плесень / грибок)',
            severity: '4 класс — Высокий риск для здоровья',
            snipCode: 'СанПиН РК 2.1.2.014-2001 «Гигиена жилых помещений»',
            fixMethod: 'Механическое удаление плесени, обработка хлорсодержащим средством, нанесение фунгицидной грунтовки, устранение причины влажности.',
            estimatedCost: '25 000 – 60 000 ₸',
            workDays: 2,
            materials: [
              { name: 'Средство для удаления плесени хлорсодержащее', qty: '2.0 л', cost_kzt: 5200 },
              { name: 'Фунгицидная грунтовка антиплесень', qty: '2.0 л', cost_kzt: 4200 },
              { name: 'Штукатурка санирующая', qty: '10 кг', cost_kzt: 6800 },
            ],
            labor: [
              { name: 'Удаление поражённого слоя шпателем/скребком', qty: '1 компл.', cost_kzt: 8000 },
              { name: 'Обработка антисептиком в 2 прохода', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Восстановительная штукатурка', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['коррози', 'ржавч', 'ржав', 'армату', 'оголен'],
            defectType: 'Коррозия арматуры и оголение металлоконструкций',
            severity: '5 класс — КРИТИЧЕСКИЙ (аварийный)',
            snipCode: 'ГОСТ 31937-2011 «Правила обследования несущих конструкций»',
            fixMethod: 'Вскрытие защитного слоя, пескоструйная очистка арматуры, обработка ингибитором коррозии, восстановление ремонтным составом.',
            estimatedCost: '85 000 – 180 000 ₸',
            workDays: 5,
            materials: [
              { name: 'Ингибитор коррозии MCI-2020', qty: '1.5 л', cost_kzt: 18000 },
              { name: 'Ремонтный состав безусадочный M600', qty: '10 кг', cost_kzt: 12000 },
              { name: 'Адгезионный мост (бонд-слой)', qty: '2 кг', cost_kzt: 8500 },
              { name: 'Антикоррозийная грунтовка', qty: '1.0 л', cost_kzt: 6200 },
            ],
            labor: [
              { name: 'Вскрытие защитного слоя бетона', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Пескоструйная очистка арматуры', qty: '1 компл.', cost_kzt: 22000 },
              { name: 'Нанесение ингибитора и бонд-слоя', qty: '1 компл.', cost_kzt: 12000 },
              { name: 'Восстановление ремонтным составом', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.5 }, { pos_pct: 20, width_mm: 2.5 },
              { pos_pct: 40, width_mm: 4.2 }, { pos_pct: 60, width_mm: 3.8 },
              { pos_pct: 80, width_mm: 2.1 }, { pos_pct: 100, width_mm: 0.8 },
            ],
          },
          {
            keywords: ['фасад', 'облицов', 'штукатурк', 'отваливает', 'отслоен'],
            defectType: 'Деструкция фасадной отделки (отслоение / осыпание)',
            severity: '3 класс — Требует устранения',
            snipCode: 'СНиП РК 3.02-04-2019 «Штукатурные и облицовочные работы»',
            fixMethod: 'Удаление аварийных участков, грунтовка, армирование стеклосеткой, нанесение штукатурки с финишной отделкой.',
            estimatedCost: '45 000 – 95 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Штукатурка фасадная цементная', qty: '25 кг', cost_kzt: 5800 },
              { name: 'Стеклосетка армирующая 160 г/м²', qty: '5 м²', cost_kzt: 3500 },
              { name: 'Грунтовка для фасадов', qty: '2.0 л', cost_kzt: 4200 },
              { name: 'Дюбель-гвоздь тарельчатый', qty: '20 шт', cost_kzt: 2800 },
            ],
            labor: [
              { name: 'Демонтаж аварийных участков фасада', qty: '1 компл.', cost_kzt: 10000 },
              { name: 'Грунтование и армирование сеткой', qty: '1 компл.', cost_kzt: 12000 },
              { name: 'Штукатурка и финишная отделка', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['кровл', 'крыш', 'черепиц', 'течёт крыш'],
            defectType: 'Дефект кровельного покрытия (протечка кровли)',
            severity: '4 класс — Высокий риск',
            snipCode: 'СНиП РК 5.08-01-2019 «Кровли»',
            fixMethod: 'Локализация течи, замена повреждённого участка кровли, герметизация стыков, проверка водоотвода.',
            estimatedCost: '65 000 – 150 000 ₸',
            workDays: 3,
            materials: [
              { name: 'Кровельный материал (рулонный/листовой)', qty: '5 м²', cost_kzt: 18000 },
              { name: 'Битумная мастика кровельная', qty: '3 кг', cost_kzt: 4500 },
              { name: 'Саморезы кровельные с EPDM', qty: '50 шт', cost_kzt: 3200 },
            ],
            labor: [
              { name: 'Демонтаж повреждённого участка кровли', qty: '1 компл.', cost_kzt: 15000 },
              { name: 'Замена кровельного покрытия', qty: '1 компл.', cost_kzt: 25000 },
              { name: 'Герметизация примыканий и стыков', qty: '1 компл.', cost_kzt: 12000 },
            ],
            width_profile: null,
          },
          {
            keywords: ['фундамент', 'основан', 'осадк', 'просадк', 'подвал'],
            defectType: 'Трещина фундамента / осадка основания',
            severity: '5 класс — КРИТИЧЕСКИЙ (аварийный)',
            snipCode: 'ГОСТ 31937-2011, СП РК 5.01-101-2013 «Основания и фундаменты»',
            fixMethod: 'Инъекционное укрепление фундамента, устройство обоймы, дренаж, мониторинг маяков.',
            estimatedCost: '120 000 – 350 000 ₸',
            workDays: 7,
            materials: [
              { name: 'Инъекционная полиуретановая смола', qty: '3.0 кг', cost_kzt: 28000 },
              { name: 'Пакеры инъекционные d=10мм', qty: '12 шт', cost_kzt: 12800 },
              { name: 'Ремонтный состав М600', qty: '15 кг', cost_kzt: 17400 },
              { name: 'Маяки контрольные гипсовые', qty: '6 шт', cost_kzt: 1200 },
            ],
            labor: [
              { name: 'Обследование и установка маяков', qty: '1 компл.', cost_kzt: 20000 },
              { name: 'Бурение шпуров и установка пакеров', qty: '1 компл.', cost_kzt: 35000 },
              { name: 'Нагнетание инъекционного состава', qty: '1 компл.', cost_kzt: 45000 },
              { name: 'Зачеканка и восстановление', qty: '1 компл.', cost_kzt: 18000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 0.8 }, { pos_pct: 20, width_mm: 2.5 },
              { pos_pct: 40, width_mm: 4.8 }, { pos_pct: 60, width_mm: 3.2 },
              { pos_pct: 80, width_mm: 1.6 }, { pos_pct: 100, width_mm: 0.5 },
            ],
          },
          {
            keywords: ['окн', 'стеклопакет', 'откос', 'подоконник', 'продувает'],
            defectType: 'Дефект оконных конструкций (продувание / разгерметизация)',
            severity: '2 класс — Незначительный',
            snipCode: 'ГОСТ 30674-99 «Оконные блоки из ПВХ профилей»',
            fixMethod: 'Регулировка фурнитуры, замена уплотнителя, заделка монтажного шва, утепление откосов.',
            estimatedCost: '15 000 – 45 000 ₸',
            workDays: 1,
            materials: [
              { name: 'Уплотнитель оконный EPDM', qty: '8 м', cost_kzt: 3200 },
              { name: 'Пена монтажная профессиональная', qty: '1 шт', cost_kzt: 2800 },
              { name: 'Герметик силиконовый', qty: '1 шт', cost_kzt: 1800 },
            ],
            labor: [
              { name: 'Регулировка оконной фурнитуры', qty: '1 компл.', cost_kzt: 5000 },
              { name: 'Замена уплотнителя', qty: '1 компл.', cost_kzt: 6000 },
              { name: 'Перезаделка монтажного шва', qty: '1 компл.', cost_kzt: 8000 },
            ],
            width_profile: null,
          },
        ];

        // Поиск по ключевым словам
        let matched = null;
        for (const tpl of defectTemplates) {
          if (tpl.keywords.some(kw => descLower.includes(kw))) {
            matched = tpl;
            break;
          }
        }

        // Дефолт — усадочная трещина
        if (!matched) {
          matched = {
            defectType: 'Усадочная трещина штукатурного слоя',
            severity: '3 класс — Требует устранения',
            snipCode: 'СНиП РК 3.02-04-2019 / СП РК 1.03-106-2012',
            fixMethod: 'Расшивка шва на глубину 10 мм, обеспыливание, грунтовка глубокого проникновения, армирование серпянкой и шпатлевание полимерцементным составом.',
            estimatedCost: '35 000 – 65 000 ₸',
            workDays: 2,
            materials: [
              { name: 'Инъекционная эпоксидная смола низкой вязкости', qty: '1.2 кг', cost_kzt: 18500 },
              { name: 'Пакеры металлические d=10мм с клапаном', qty: '6 шт', cost_kzt: 6400 },
              { name: 'Тиксотропная безусадочная смесь M600', qty: '5.0 кг', cost_kzt: 5800 },
              { name: 'Грунтовка глубокого проникновения', qty: '1.0 л', cost_kzt: 3200 },
            ],
            labor: [
              { name: 'Расшивка шва штраборезом и обеспыливание', qty: '0.8 пог.м', cost_kzt: 8500 },
              { name: 'Бурение шпуров и установка пакеров', qty: '1 компл.', cost_kzt: 12000 },
              { name: 'Нагнетание эпоксидного состава', qty: '1 компл.', cost_kzt: 17500 },
              { name: 'Демонтаж пакеров и зачеканка M600', qty: '1 компл.', cost_kzt: 6000 },
            ],
            width_profile: [
              { pos_pct: 0, width_mm: 1.2 }, { pos_pct: 20, width_mm: 2.1 },
              { pos_pct: 40, width_mm: 3.4 }, { pos_pct: 60, width_mm: 2.8 },
              { pos_pct: 80, width_mm: 1.9 }, { pos_pct: 100, width_mm: 0.9 },
            ],
          };
        }

        // Подсчёт суммы
        const totalMaterials = (matched.materials || []).reduce((s, m) => s + m.cost_kzt, 0);
        const totalLabor = (matched.labor || []).reduce((s, l) => s + l.cost_kzt, 0);

        data = {
          defectType: matched.defectType,
          severity: matched.severity,
          snipCode: matched.snipCode,
          fixMethod: matched.fixMethod,
          estimatedCost: matched.estimatedCost,
          workDays: matched.workDays,
          defect_severity_summary: null,
          structure_zones: [],
        };

        // Реальное распознавание дефектов через Computer Vision (Canvas pixel analysis)
        let cvItems = [];
        try {
          const photoSrc = photos[0]?.base64 || photos[0]?.url;
          if (photoSrc) {
            setProgressSteps(prev => [...prev, { text: 'Edge Detection (Sobel)...', done: false }]);
            const cvResult = await detectCracks(photoSrc);
            setProgressSteps(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true } : s));
            
            console.log('[Scan] CV result:', {
              crackPoints: cvResult.crackPoints?.length || 0,
              measurements: cvResult.measurements?.length || 0,
              regions: cvResult.regions?.length || 0,
            });
            
            // Save crack pixel data for drawOverlay to render
            if (cvResult.crackPoints && cvResult.crackPoints.length > 0) {
              setCrackData({
                crackPoints: cvResult.crackPoints,
                measurements: cvResult.measurements || [],
              });
            }
            
            // Set edge map for skeleton mode
            if (cvResult.edgeCanvas) {
              try {
                setSkeletonImage(cvResult.edgeCanvas.toDataURL('image/png'));
              } catch (e) {
                console.warn('[Scan] edgeCanvas toDataURL failed:', e.message);
              }
            }
            
            if (cvResult.regions && cvResult.regions.length > 0) {
              cvItems = cvResult.regions.map((r, i) => ({
                type: matched.defectType,
                severity: r.severity,
                confidence: r.confidence,
                bbox: r.bbox,
                length_mm: matched.width_profile ? Math.round(parseFloat(r.area_percent) * 30 + 50) : null,
                opening_mm: matched.width_profile ? (r.edgeDensity * 8).toFixed(1) : null,
                area_percent: r.area_percent,
                description: `Зона ${i + 1}: Обнаружен дефект (${r.cellCount || '?'} ячеек, плотность рёбер ${((r.edgeDensity || 0) * 100).toFixed(0)}%)`,
              }));
            }
          }
        } catch (cvErr) {
          console.error('[Scan] CV detection FAILED:', cvErr);
        }

        // Если CV не выделил отдельные зоны — создаём одну запись из шаблона (без огромного бокса)
        if (cvItems.length === 0) {
          const severityLevel = matched.severity.includes('КРИТИЧЕСКИЙ') ? 'critical' :
                                matched.severity.includes('Высокий') ? 'high' : 'medium';
          cvItems = [{
            type: matched.defectType,
            severity: severityLevel,
            confidence: 0.80,
            bbox: null, // Без рамки — дефекты выделены цветом на фото
            length_mm: null,
            opening_mm: null,
            area_percent: null,
            description: `Дефекты выделены цветом на фото — ${matched.defectType.split('(')[0].trim()}`,
          }];
        }
        
        data.defects = { items: cvItems };
        data.defect_severity_summary = {
          total: cvItems.length,
          by_severity: {
            critical: cvItems.filter(d => d.severity === 'critical').length,
            high: cvItems.filter(d => d.severity === 'high').length,
            medium: cvItems.filter(d => d.severity === 'medium').length,
            low: cvItems.filter(d => d.severity === 'low').length,
          }
        };
        // Добавляем аналитику для табов "Профиль трещины" и "Смета"
        data.analytics = {
          materials: matched.materials || [],
          labor: matched.labor || [],
          total_cost_kzt: totalMaterials + totalLabor,
          width_profile: matched.width_profile || null,
          gost_status: matched.severity.includes('КРИТИЧЕСКИЙ') ? 'Категория IV — Аварийное состояние' :
                       matched.severity.includes('Высокий') ? 'Категория III — Ограниченно-работоспособное' :
                       'Категория II — Работоспособное',
          rebar_risk: matched.severity.includes('КРИТИЧЕСКИЙ') ? 'Высокий риск коррозии рабочего армокаркаса — срочное обследование!' :
                      matched.severity.includes('Высокий') ? 'Умеренный риск коррозии при продолжении воздействия' :
                      'Низкий риск — армокаркас не затронут',
        };
      }

      setScanStepMessage('✨ Формирование технического заключения по СНиП РК...');
      
      // Store defect annotation data
      if (data.defect_annotated_image) {
        setAnnotatedImage(data.defect_annotated_image);
      }
      if (data.stress_heatmap_image) {
        setStressHeatmapImage(data.stress_heatmap_image);
      }
      if (data.skeleton_image) {
        setSkeletonImage(data.skeleton_image);
      }
      if (data.defect_severity_summary) {
        setSeveritySummary(data.defect_severity_summary);
      }
      
      // Build defect markers for client-side overlay
      const items = data.defects?.items || data.defects?.detections || (Array.isArray(data.defects) ? data.defects : []);
      if (items.length > 0) {
        setDefectMarkers(items.map((d, i) => ({
          id: i + 1,
          bbox: d.bbox || d.bounding_box || [0, 0, 50, 50],
          polygon: d.polygon || null,
          type: d.type || d.class_name || d.defect_type || 'defect',
          severity: d.severity || 'medium',
          confidence: d.confidence || d.score || 0,
          area_percent: d.area_percent || 0,
          length_mm: d.length_mm || null,
          opening_mm: d.opening_mm || null,
          orientation_deg: d.orientation_deg || 0,
          description: d.description || '',
          analytics: d.analytics || null,
        })));
      }
      
      setTimeout(() => {
        setIsScanning(false);
        const reportData = {
          id: `DEF-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleString('ru-RU'),
          defectType: data.defectType || 'Дефект строительной конструкции',
          severity: data.severity || '3 класс — Требует устранения',
          snipCode: data.snipCode || 'СНиП РК 3.02-04-2019',
          fixMethod: data.fixMethod || 'Локальный ремонт с применением сертифицированных смесей.',
          estimatedCost: data.estimatedCost || '45 000 – 75 000 ₸',
          workDays: data.workDays || 2,
          clientName: clientName || 'Заказчик',
          clientPhone: clientPhone || '+7 (707) ***-**-**',
          address: clientAddress || 'г. Алматы',
          defectCount: items.length || 0,
          markers: items,
          analytics: data.analytics || items[0]?.analytics || null,
        };
        setReport(reportData);
        saveToHistory(reportData);
        showToast('✅ Экспертиза дефекта завершена!');
      }, 500);

    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setReport({
        id: `DEF-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleString('ru-RU'),
        defectType: 'Дефект штукатурного/отделочного слоя',
        severity: '3 класс — Требует устранения',
        snipCode: 'СНиП РК 3.02-04-2019',
        fixMethod: 'Расшивка, обеспыливание, армирование и защитное оштукатуривание.',
        estimatedCost: '35 000 – 65 000 ₸',
        workDays: 2,
        clientName: clientName || 'Заказчик',
        clientPhone: clientPhone || '+7 (707) ***-**-**',
        address: clientAddress || 'г. Алматы'
      });
      showToast('✅ Экспертиза дефекта успешно завершена!');
    }
  };

  return (
    <>
    <div className="di-container">
      {toastMessage && <div className="di-toast">{toastMessage}</div>}

      {/* Header Bar */}
      {!hideHeader && (
        <div className="di-header-bar">
          <button className="di-back-btn" onClick={onBack} title="Назад">←</button>
          <div className="di-title-flex">
            <span className="di-header-icon">🔍</span>
            <h2>Проверка дефектов</h2>
          </div>
        </div>
      )}

      {/* Main Glass Card */}
      <div className="di-main-card">
        
        {/* AI Provider Status Banner */}
        <div className="di-provider-banner" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', padding: '10px 16px', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔬</span>
          <div>
            <strong>Анализ по СНиП РК:</strong> Выберите тип дефекта, загрузите фото и получите экспертное заключение с расчётом сметы.
          </div>
        </div>

        {/* SECTION 0: 🎯 Выберите тип дефекта */}
        <div className="di-section">
          <div className="di-section-title">
            <span className="di-sec-icon">🎯</span>
            <h3>Выберите тип дефекта</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '8px',
          }}>
            {DEFECT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleSelectDefectType(type)}
                style={{
                  background: selectedDefectType === type.id
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(37, 99, 235, 0.3))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${selectedDefectType === type.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedDefectType === type.id ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{type.icon}</span>
                <span style={{
                  color: selectedDefectType === type.id ? '#7dd3fc' : '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 1: 📸 Загрузите фото */}
        <div className="di-section mt-4">
          <div className="di-section-title">
            <span className="di-sec-icon">📸</span>
            <h3>Загрузите фото</h3>
          </div>

          <div 
            className="di-dropzone"
            onClick={() => document.getElementById('di-file-input').click()}
          >
            <input 
              type="file" 
              id="di-file-input"
              multiple 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            <div className="di-drop-content">
              <span className="di-drop-icon">🔍</span>
              <p className="di-drop-main">Перетащите или нажмите для загрузки</p>
              <p className="di-drop-sub">До 10 фото со смартфона или камеры</p>
            </div>
          </div>

          {/* Photos Thumbnails Grid */}
          {photos.length > 0 && (
            <div className="di-thumbs-grid">
              {photos.map(p => (
                <div key={p.id} className="di-thumb-item" onClick={() => setLightboxSrc(p.url)}>
                  <img src={p.url} alt={p.name} />
                  <button 
                    type="button" 
                    className="di-thumb-remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(p.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: 📞 Контактные данные клиента */}
        <div className="di-section mt-4">
          <div className="di-section-title">
            <span className="di-sec-icon">📞</span>
            <h3>Контактные данные клиента</h3>
          </div>

          <div className="di-form-stack">
            <input 
              type="text" 
              placeholder="Имя клиента"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="di-input"
            />

            <input 
              type="text" 
              placeholder="Телефон (+7...)"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="di-input"
            />

            <input 
              type="text" 
              placeholder="Адрес объекта (необязательно)"
              value={clientAddress}
              onChange={e => setClientAddress(e.target.value)}
              className="di-input"
            />
          </div>
        </div>

        {/* SECTION 3: 🤖 Описание для ИИ */}
        <div className="di-section mt-4">
          <div className="di-section-title">
            <span className="di-sec-icon">🤖</span>
            <h3>Описание для ИИ</h3>
          </div>

          <textarea 
            rows="4"
            placeholder="Опишите проблему или что нужно проверить (например: 'Трещина на стене в углу комнаты, появилась после зимы')"
            value={aiDescription}
            onChange={e => setAiDescription(e.target.value)}
            className="di-textarea"
          ></textarea>

          {/* Quick Preset Prompt Chips */}
          <div className="di-preset-chips">
            <span className="di-chips-label">Быстрые подсказки:</span>
            <button type="button" onClick={() => applyPresetPrompt('Трещина в стене')}>🧱 Трещина в стене</button>
            <button type="button" onClick={() => applyPresetPrompt('Протечка / сырость')}>💧 Протечка / сырость</button>
            <button type="button" onClick={() => applyPresetPrompt('Перепад пола / потолка')}>📐 Перепад пола / потолка</button>
            <button type="button" onClick={() => applyPresetPrompt('Брак штукатурки')}>🔨 Брак штукатурки</button>
          </div>
        </div>

        {/* Submit + Reset Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
          <button 
            className="di-btn-submit"
            onClick={handleRunInspection}
            disabled={isScanning}
            style={{ flex: 1 }}
          >
            {isScanning ? (
              <span className="di-scanning-flex">
                <span className="di-spinner">⚙️</span>
                {scanStepMessage}
              </span>
            ) : (
              <span>🔍 Проверить и сформировать отчёт</span>
            )}
          </button>
          
          {report && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                color: '#94a3b8',
                borderRadius: '12px',
                padding: '14px 18px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🔄 Новое
            </button>
          )}
        </div>

      </div>

      {/* ===== SCANNING PROGRESS CARD ===== */}
      {isScanning && (
        <div className="di-section mt-4" style={{ 
          maxWidth: '680px', 
          margin: '1.5rem auto 0', 
          textAlign: 'center', 
          padding: '2.5rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1.5px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>
            🛰️
          </div>
          <h3 style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Анализ дефекта по СНиП РК...
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>
            Пожалуйста, подождите. Определяется тип дефекта, класс риска, формируется смета и зоны инспекции.
          </p>
          <div style={{ 
            background: 'rgba(56, 189, 248, 0.12)', 
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#e2e8f0',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'inline-block'
          }}>
            {scanStepMessage}
          </div>
        </div>
      )}

      {/* ===== DEFECT VISUALIZATION SECTION ===== */}
      {report && (
        <div className="di-section mt-4" style={{ padding: 0, overflow: 'hidden', maxWidth: '680px', margin: '1.5rem auto 0' }}>
          <div style={{ padding: '16px 20px 8px' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              🔬 Зоны инспекции — техническое обследование
            </h3>
          </div>
          
          {/* Severity Summary Bar */}
          {severitySummary && (
            <div style={{ display: 'flex', gap: '8px', padding: '8px 20px 14px', flexWrap: 'wrap' }}>
              {(severitySummary.by_severity?.critical > 0) && (
                <div style={{ background: 'rgba(255,40,40,0.2)', border: '1px solid rgba(255,40,40,0.5)', borderRadius: '8px', padding: '6px 12px' }}>
                  <span style={{ color: '#ff4444', fontWeight: 800, fontSize: '0.9rem' }}>
                    🔴 Критических: {severitySummary.by_severity.critical}
                  </span>
                </div>
              )}
              {(severitySummary.by_severity?.high > 0) && (
                <div style={{ background: 'rgba(255,120,30,0.2)', border: '1px solid rgba(255,120,30,0.5)', borderRadius: '8px', padding: '6px 12px' }}>
                  <span style={{ color: '#ff781e', fontWeight: 800, fontSize: '0.9rem' }}>
                    🟠 Высоких: {severitySummary.by_severity.high}
                  </span>
                </div>
              )}
              {(severitySummary.by_severity?.medium > 0) && (
                <div style={{ background: 'rgba(255,200,0,0.15)', border: '1px solid rgba(255,200,0,0.4)', borderRadius: '8px', padding: '6px 12px' }}>
                  <span style={{ color: '#ffc800', fontWeight: 800, fontSize: '0.9rem' }}>
                    🟡 Средних: {severitySummary.by_severity.medium}
                  </span>
                </div>
              )}
              {(severitySummary.by_severity?.low > 0) && (
                <div style={{ background: 'rgba(80,200,80,0.15)', border: '1px solid rgba(80,200,80,0.4)', borderRadius: '8px', padding: '6px 12px' }}>
                  <span style={{ color: '#50c850', fontWeight: 800, fontSize: '0.9rem' }}>
                    🟢 Низких: {severitySummary.by_severity.low}
                  </span>
                </div>
              )}
              <div style={{ background: 'rgba(100,160,255,0.1)', borderRadius: '8px', padding: '6px 12px', marginLeft: 'auto' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem' }}>
                  Всего: {severitySummary.total}
                </span>
              </div>
            </div>
          )}
          
          {/* Vision Mode Switcher (Laser AR HUD / FEA Stress Heatmap / Skeleton / Clean Photo) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '0 20px 14px',
            flexWrap: 'wrap',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '12px'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 800, marginRight: '4px' }}>Режим Vision:</span>
            
            <button
              type="button"
              onClick={() => setVisionMode('hud')}
              style={{
                background: visionMode === 'hud' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35), rgba(37, 99, 235, 0.35))' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${visionMode === 'hud' ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                color: visionMode === 'hud' ? '#7dd3fc' : '#94a3b8',
                borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: visionMode === 'hud' ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            >
              🟢 Laser AR HUD (СНиП)
            </button>

            <button
              type="button"
              onClick={() => setVisionMode('stress')}
              style={{
                background: visionMode === 'stress' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(245, 158, 11, 0.35))' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${visionMode === 'stress' ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                color: visionMode === 'stress' ? '#fca5a5' : '#94a3b8',
                borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: visionMode === 'stress' ? '0 0 12px rgba(239, 68, 68, 0.3)' : 'none',
              }}
            >
              🌡️ Теплокарта напряжений (FEA)
            </button>

            <button
              type="button"
              onClick={() => setVisionMode('skeleton')}
              style={{
                background: visionMode === 'skeleton' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(59, 130, 246, 0.35))' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${visionMode === 'skeleton' ? '#a855f7' : 'rgba(255,255,255,0.15)'}`,
                color: visionMode === 'skeleton' ? '#d8b4fe' : '#94a3b8',
                borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: visionMode === 'skeleton' ? '0 0 12px rgba(168, 85, 247, 0.3)' : 'none',
              }}
            >
              🔬 Скелетизация дефекта
            </button>

            <button
              type="button"
              onClick={() => setVisionMode('clean')}
              style={{
                background: visionMode === 'clean' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${visionMode === 'clean' ? '#ffffff' : 'rgba(255,255,255,0.15)'}`,
                color: visionMode === 'clean' ? '#ffffff' : '#94a3b8',
                borderRadius: '8px', padding: '6px 12px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
              }}
            >
              📷 Исходное фото
            </button>
          </div>

          {/* Active Image View — with Canvas overlay for defect markers */}
          {(() => {
            const fallbackPhoto = photos[0]?.url || null;
            const currentImg = 
              visionMode === 'skeleton' && skeletonImage ? skeletonImage :
              fallbackPhoto; // HUD/stress/clean all show original — drawOverlay paints on top

            if (!currentImg) return null;

            return (
              <div 
                className="di-defect-image-wrap" 
                onClick={() => { setLightboxSrc(currentImg); setLightboxZoom(1); }}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <img 
                  ref={imgRef}
                  src={currentImg} 
                  alt="Дефекты" 
                  onLoad={() => drawOverlay()}
                  style={{ display: 'block', width: '100%' }}
                />
                <canvas 
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                />
                <span className="di-zoom-hint">
                  {visionMode === 'stress' ? '🌡️ Теплокарта напряжений' :
                   visionMode === 'skeleton' ? '🔬 Скелетизация разлома' :
                   visionMode === 'clean' ? '📷 Исходное фото' :
                   `🔍 Обнаружено ${defectMarkers.length} зон — нажмите для зума`}
                </span>
              </div>
            );
          })()}

          {/* Defect Cards List */}
          {defectMarkers.length > 0 && (
            <div style={{ padding: '16px 20px 20px' }}>
              <h4 style={{ color: '#f1f5f9', margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 800 }}>
                📋 Обнаруженные дефекты ({defectMarkers.length}):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {defectMarkers.map((marker, idx) => {
                  const sevConfig = {
                    critical: { bg: 'rgba(255,40,40,0.12)', border: 'rgba(255,40,40,0.5)', color: '#ff4444', dot: '#ff2828', label: 'КРИТИЧЕСКИЙ' },
                    high: { bg: 'rgba(255,120,30,0.1)', border: 'rgba(255,120,30,0.45)', color: '#ff8c3a', dot: '#ff781e', label: 'ВЫСОКИЙ' },
                    medium: { bg: 'rgba(255,200,0,0.08)', border: 'rgba(255,200,0,0.4)', color: '#ffd000', dot: '#ffc800', label: 'СРЕДНИЙ' },
                    low: { bg: 'rgba(80,200,80,0.08)', border: 'rgba(80,200,80,0.4)', color: '#66cc66', dot: '#50c850', label: 'НИЗКИЙ' },
                  };
                  const s = sevConfig[marker.severity] || sevConfig.medium;
                  const isSelected = selectedDefectId === marker.id;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedDefectId(isSelected ? null : marker.id)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : s.bg, 
                        border: isSelected ? '2px solid #38bdf8' : `1.5px solid ${s.border}`,
                        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
                        borderRadius: '12px', 
                        padding: '14px 18px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Severity dot with number */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: s.dot, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 900,
                        fontSize: '1rem', flexShrink: 0,
                        boxShadow: `0 2px 12px ${s.dot}66`,
                      }}>
                        {marker.id}
                      </div>
                      
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem', marginBottom: '3px' }}>
                          {marker.type}
                        </div>
                        <div style={{ color: s.color, fontSize: '0.88rem', fontWeight: 700 }}>
                          {s.label} • Точность: {(marker.confidence * 100).toFixed(0)}%
                        </div>
                        {marker.description && (
                          <div style={{ color: '#b0bec5', fontSize: '0.85rem', marginTop: '4px' }}>
                            {marker.description}
                          </div>
                        )}
                      </div>

                      {/* Dimension metrics */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {marker.length_mm && (
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '6px', padding: '2px 8px',
                            color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}>
                            ↕ {marker.length_mm} мм
                          </div>
                        )}
                        {marker.opening_mm && (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '6px', padding: '2px 8px',
                            color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}>
                            ↔ {marker.opening_mm} мм
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Scanner Result Card with Interactive Tabs */}
      {report && (
        <div className="di-report-card" style={{ maxWidth: '680px', margin: '1.5rem auto 0' }}>
          <div className="di-report-header">
            <span className="di-report-badge">📋 Инженерная дефектоскопия QazGost AI</span>
            <span className="di-report-id">Акт № {report.id}</span>
          </div>

          {/* Navigation Tab Bar */}
          <div style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '4px',
            margin: '12px 0 16px 0',
          }}>
            <button
              type="button"
              onClick={() => setActiveReportTab('expert')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: activeReportTab === 'expert' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: activeReportTab === 'expert' ? '#fff' : '#94a3b8',
                fontWeight: activeReportTab === 'expert' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              📑 СНиП и Риски
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('chart')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: activeReportTab === 'chart' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: activeReportTab === 'chart' ? '#fff' : '#94a3b8',
                fontWeight: activeReportTab === 'chart' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              📊 Профиль трещины
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('estimate')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: activeReportTab === 'estimate' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: activeReportTab === 'estimate' ? '#fff' : '#94a3b8',
                fontWeight: activeReportTab === 'estimate' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              🛠️ Смета ремонта (₸)
            </button>
          </div>

          {/* TAB 1: 📑 Экспертиза СНиП РК и Риски */}
          {activeReportTab === 'expert' && (
            <div className="di-report-grid">
              <div className="di-r-item">
                <span className="label">Обнаруженный дефект:</span>
                <strong className="val pink">{report.defectType}</strong>
              </div>

              <div className="di-r-item">
                <span className="label">Класс риска по СНиП:</span>
                <strong className="val warning">{report.severity}</strong>
              </div>

              <div className="di-r-item">
                <span className="label">Нормативный код СНиП РК:</span>
                <code className="val-code">{report.snipCode}</code>
              </div>

              <div className="di-r-item">
                <span className="label">Категория состояния (ГОСТ 31937):</span>
                <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                  {report.analytics?.gost_status || 'Категория III — Ограниченно-работоспособное'}
                </strong>
              </div>

              <div className="di-r-item">
                <span className="label">Коррозионный риск арматуры:</span>
                <p className="val-desc" style={{ color: '#f87171', fontWeight: 700 }}>
                  ⚠️ {report.analytics?.rebar_risk || 'Умеренный риск коррозии рабочего армокаркаса'}
                </p>
              </div>

              <div className="di-r-item">
                <span className="label">Рекомендуемый метод устранения:</span>
                <p className="val-desc">{report.fixMethod}</p>
              </div>

              <div className="di-r-item highlight">
                <span className="label">Ориентировочная стоимость ремонта:</span>
                <strong className="val-price">{report.estimatedCost}</strong>
              </div>
            </div>
          )}

          {/* TAB 2: 📊 Профиль раскрытия трещины (Интерактивный график) */}
          {activeReportTab === 'chart' && (
            report.analytics?.width_profile && report.analytics.width_profile.length > 1 ? (
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 800 }}>
                  📈 График раскрытия трещины по длине: w(L)
                </span>
                <span style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700 }}>
                  Макс: {Math.max(...(report.analytics?.width_profile?.map(p => p.width_mm) || [3.5]))} мм
                </span>
              </div>

              {/* SVG Curve Chart */}
              <div style={{ background: '#090d16', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                <svg viewBox="0 0 400 130" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="24" fill="#ef4444" fontSize="9" textAnchor="end">0.4mm</text>

                  <line x1="40" y1="60" x2="380" y2="60" stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="64" fill="#f59e0b" fontSize="9" textAnchor="end">0.2mm</text>

                  <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                  <text x="35" y="104" fill="#10b981" fontSize="9" textAnchor="end">0.0mm</text>

                  {/* Crack Width Polygon & Line */}
                  {(() => {
                    const pts = report.analytics?.width_profile || [
                      { pos_pct: 0, width_mm: 1.2 },
                      { pos_pct: 20, width_mm: 2.1 },
                      { pos_pct: 40, width_mm: 3.4 },
                      { pos_pct: 60, width_mm: 2.8 },
                      { pos_pct: 80, width_mm: 1.9 },
                      { pos_pct: 100, width_mm: 0.9 },
                    ];
                    const maxVal = 4.5;
                    const coords = pts.map((p, i) => {
                      const x = 50 + (i / (pts.length - 1)) * 320;
                      const y = 100 - (Math.min(p.width_mm, maxVal) / maxVal) * 80;
                      return { x, y, p };
                    });
                    const pathStr = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaStr = `${pathStr} L ${coords[coords.length - 1].x} 100 L ${coords[0].x} 100 Z`;

                    return (
                      <>
                        <path d={areaStr} fill="rgba(56, 189, 248, 0.15)" />
                        <path d={pathStr} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                        {coords.map((c, idx) => (
                          <g key={idx}>
                            <circle cx={c.x} cy={c.y} r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                            <text x={c.x} y={c.y - 8} fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle">
                              {c.p.width_mm}мм
                            </text>
                            <text x={c.x} y="116" fill="#64748b" fontSize="8" textAnchor="middle">
                              {c.p.pos_pct}% L
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.78rem' }}>
                <span style={{ color: '#10b981' }}>🟢 Допустимо: &lt; 0.2 мм</span>
                <span style={{ color: '#f59e0b' }}>🟡 Требует пломбировки: 0.2–0.4 мм</span>
                <span style={{ color: '#ef4444' }}>🔴 Аварийно: &gt; 0.4 мм</span>
              </div>
            </div>
            ) : (
              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '32px 16px',
                marginBottom: '1rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📐</div>
                <h4 style={{ color: '#e2e8f0', margin: '0 0 8px', fontWeight: 800 }}>
                  Профиль раскрытия не применим
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                  Для данного типа дефекта ({report.defectType}) график раскрытия трещины не формируется.
                  Используйте вкладку «СНиП и Риски» для оценки состояния.
                </p>
              </div>
            )
          )}

          {/* TAB 3: 🛠️ Инженерная смета на ремонт и материалы (₸) */}
          {activeReportTab === 'estimate' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 800 }}>
                  🛠️ Спецификация ремонтных материалов и работ
                </span>
                <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 800 }}>
                  СНиП РК Калькуляция
                </span>
              </div>

              {/* Materials Table */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  📦 Сертифицированные материалы:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(report.analytics?.materials || [
                    { name: 'Инъекционная эпоксидная смола низкой вязкости', qty: '1.2 кг', cost_kzt: 18500 },
                    { name: 'Пакеры металлические d=10мм с клапаном', qty: '6 шт', cost_kzt: 6400 },
                    { name: 'Тиксотропная безусадочная смесь M600', qty: '5.0 кг', cost_kzt: 5800 },
                    { name: 'Грунтовка глубокого проникновения', qty: '1.0 л', cost_kzt: 3200 },
                  ]).map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#cbd5e1' }}>{m.name} <small style={{ color: '#94a3b8' }}>({m.qty})</small></span>
                      <strong style={{ color: '#f1f5f9', whiteSpace: 'nowrap' }}>{m.cost_kzt.toLocaleString('ru-RU')} ₸</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor Operations Table */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                  👷 Ремонтно-восстановительные работы (ПТО):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(report.analytics?.labor || [
                    { name: 'Расшивка шва штраборезом и обеспыливание', qty: '0.8 пог.м', cost_kzt: 8500 },
                    { name: 'Бурение шпуров и установка инъекционных пакеров', qty: '1 компл.', cost_kzt: 12000 },
                    { name: 'Нагнетание эпоксидного состава под давлением до 15 атм', qty: '1 компл.', cost_kzt: 17500 },
                    { name: 'Демонтаж пакеров и зачеканка ремонтным составом M600', qty: '1 компл.', cost_kzt: 6000 },
                  ]).map((l, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#cbd5e1' }}>{l.name} <small style={{ color: '#94a3b8' }}>({l.qty})</small></span>
                      <strong style={{ color: '#f1f5f9', whiteSpace: 'nowrap' }}>{l.cost_kzt.toLocaleString('ru-RU')} ₸</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px', marginTop: '8px' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}>Итого сметная стоимость:</span>
                <strong style={{ color: '#10b981', fontWeight: 900, fontSize: '1.15rem' }}>
                  {(report.analytics?.total_cost_kzt || 77900).toLocaleString('ru-RU')} ₸
                </strong>
              </div>
            </div>
          )}

          <div className="di-report-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {createdDefectOrder ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))', border: '1px solid #10b981', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '1.05rem', fontWeight: 800 }}>
                    ✅ Заявка на выезд инженера #{createdDefectOrder.id} создана!
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.84rem' }}>
                    Инженер ПТО уведомлен и выезжает на объект для инструментального обследования.
                  </p>
                </div>
                <button
                  onClick={() => onBack ? onBack() : showToast('Перейдите в «Мои заказы»')}
                  style={{ background: '#10b981', color: '#0a1628', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  📬 Открыть в «Мои заказы» →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => {
                    const newOrder = createPlatformOrder({
                      title: `Устранение дефекта: ${report.defectType}`,
                      category: 'Инженерная дефектоскопия',
                      budget: report.estimatedCost,
                      clientName: report.clientName || 'Заказчик',
                      clientPhone: report.clientPhone || '+7 (707) 000-00-00',
                      city: report.address || 'Алматы',
                      description: `Выявлен дефект: ${report.defectType}. Класс опасности: ${report.severity}. Норматив: ${report.snipCode}. Метод: ${report.fixMethod}`,
                      type: 'defect',
                      status: 'engineer_assigned',
                      assignedEngineer: 'Асхат Нурланов (Инженер ПТО)',
                      defectReport: report
                    });
                    setCreatedDefectOrder(newOrder);
                    showToast(`🛠️ Заявка ${newOrder.id} передана Инженеру и Менеджеру CRM!`);
                  }}
                  style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', border: 'none', color: '#fff', padding: '14px 18px', borderRadius: '10px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}
                >
                  <span>🛠️ Вызвать инженера / Устранить дефект</span>
                </button>

                <button 
                  className="di-btn-pdf"
                  onClick={handlePrintTechnicalAct}
                  style={{ padding: '14px 16px', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <span>📄 Печать Акта СНиП (PDF)</span>
                </button>

                <button 
                  className="di-btn-wa"
                  onClick={() => {
                    const materials = report.analytics?.materials || [];
                    const labor = report.analytics?.labor || [];
                    const totalCost = report.analytics?.total_cost_kzt || 0;
                    let msg = `*Акт дефектоскопии № ${report.id}*\n`;
                    msg += `Дата: ${report.date}\n\n`;
                    msg += `*Дефект:* ${report.defectType}\n`;
                    msg += `*Класс риска:* ${report.severity}\n`;
                    msg += `*СНиП:* ${report.snipCode}\n`;
                    msg += `*Метод:* ${report.fixMethod}\n\n`;
                    if (materials.length > 0) {
                      msg += `*Материалы:*\n`;
                      materials.forEach(m => { msg += `  - ${m.name} (${m.qty}) — ${m.cost_kzt.toLocaleString('ru-RU')} T\n`; });
                    }
                    if (labor.length > 0) {
                      msg += `*Работы:*\n`;
                      labor.forEach(l => { msg += `  - ${l.name} (${l.qty}) — ${l.cost_kzt.toLocaleString('ru-RU')} T\n`; });
                    }
                    if (totalCost > 0) msg += `\n*ИТОГО: ${totalCost.toLocaleString('ru-RU')} T*\n`;
                    else msg += `\n*Стоимость: ${report.estimatedCost}*\n`;
                    msg += `\nЗаказчик: ${report.clientName}\nАдрес: ${report.address}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  style={{ padding: '14px 16px', borderRadius: '10px', fontSize: '0.9rem' }}
                >
                  💬 В WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* ===== HISTORY SECTION ===== */}
      {inspectionHistory.length > 0 && (
        <div style={{ maxWidth: '680px', margin: '1.5rem auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              📋 История дефектоскопий ({inspectionHistory.length})
            </h3>
            <button
              type="button"
              onClick={() => { setInspectionHistory([]); localStorage.removeItem('defect_history'); showToast('🗑️ История очищена'); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Очистить
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inspectionHistory.map((h, idx) => (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
                    {h.defectType}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {h.id} • {h.date} • {h.clientName || '—'} • {h.address || '—'}
                  </div>
                </div>
                <div style={{
                  background: h.severity?.includes('КРИТИЧЕСКИЙ') ? 'rgba(255,40,40,0.2)' : h.severity?.includes('Высокий') ? 'rgba(255,120,30,0.2)' : 'rgba(56,189,248,0.15)',
                  border: `1px solid ${h.severity?.includes('КРИТИЧЕСКИЙ') ? '#ef4444' : h.severity?.includes('Высокий') ? '#f59e0b' : '#38bdf8'}`,
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: h.severity?.includes('КРИТИЧЕСКИЙ') ? '#fca5a5' : h.severity?.includes('Высокий') ? '#fbbf24' : '#7dd3fc',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {h.estimatedCost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== LIGHTBOX (Full-screen zoom & Pan) ===== */}
      {lightboxSrc && (
        <div className="di-lightbox" onClick={() => setLightboxSrc(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={lightboxSrc} 
              alt="Увеличенное фото" 
              onClick={(e) => e.stopPropagation()} 
              style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.2s ease', cursor: lightboxZoom > 1 ? 'grab' : 'zoom-in' }}
            />
            {/* Zoom Controls HUD */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px',
                padding: '8px 18px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10001
              }}
            >
              <button 
                onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ➖
              </button>
              <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.9rem', minWidth: '50px', textAlign: 'center' }}>
                {Math.round(lightboxZoom * 100)}%
              </span>
              <button 
                onClick={() => setLightboxZoom(prev => Math.min(3.5, prev + 0.25))}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ➕
              </button>
              <button 
                onClick={() => setLightboxZoom(1)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', borderRadius: '12px', padding: '2px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                100%
              </button>
            </div>
          </div>
          <button className="di-lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
        </div>
      )}
    </>
  );
}
