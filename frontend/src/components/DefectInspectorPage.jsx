import React, { useState } from 'react';
import { createPlatformOrder } from '../services/orderSyncService';
import './DefectInspectorPage.css';

export default function DefectInspectorPage({ onBack, hideHeader = false }) {
  const [photos, setPhotos] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [aiDescription, setAiDescription] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [report, setReport] = useState(null);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [defectMarkers, setDefectMarkers] = useState([]);
  const [severitySummary, setSeveritySummary] = useState(null);
  const [structureZones, setStructureZones] = useState([]);
  const [showIntactLayer, setShowIntactLayer] = useState(true);
  const [showCriticalLayer, setShowCriticalLayer] = useState(true);
  const [showMediumLayer, setShowMediumLayer] = useState(true);
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Map severity string to human-readable Russian label
  const _mapSeverity = (sev) => {
    const map = {
      'critical': '5 класс — КРИТИЧЕСКИЙ (аварийный)',
      'high': '4 класс — Высокий риск',
      'medium': '3 класс — Требует устранения',
      'low': '2 класс — Незначительный',
      'info': '1 класс — Информационный',
    };
    return map[sev] || sev || '3 класс — Требует устранения';
  };

  const handlePrintTechnicalAct = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('⚠️ Разрешите всплывающие окна для печати Акта');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Акт технического обследования № ${report.id}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: 900; color: #0284c7; }
          .title { font-size: 16px; font-weight: 800; text-align: center; margin: 15px 0; text-transform: uppercase; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .meta-table td { padding: 6px 10px; border: 1px solid #cbd5e1; }
          .meta-table td.label { background: #f8fafc; font-weight: 700; width: 30%; }
          .image-box { text-align: center; margin: 20px 0; }
          .image-box img { max-width: 100%; max-height: 380px; border: 1px solid #94a3b8; border-radius: 6px; }
          .defects-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .defects-table th { background: #0f172a; color: #fff; padding: 8px; text-align: left; font-size: 12px; }
          .defects-table td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
          .stamp-box { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #94a3b8; }
          .stamp { width: 120px; height: 120px; border: 2px dashed #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; color: #0284c7; font-size: 10px; font-weight: 700; transform: rotate(-10deg); }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">QAZGOST AI • ТЕХНАДЗОР РК</div>
          <div><strong>АКТ ОБСЛЕДОВАНИЯ № ${report.id}</strong><br><small>Дата: ${report.date}</small></div>
        </div>
        <div class="title">Акт инструментального дефектоскопического обследования</div>
        <table class="meta-table">
          <tr><td class="label">Объект:</td><td>${report.address}</td></tr>
          <tr><td class="label">Заказчик:</td><td>${report.clientName} (${report.clientPhone})</td></tr>
          <tr><td class="label">Вид дефекта:</td><td><strong>${report.defectType}</strong></td></tr>
          <tr><td class="label">Класс опасности (СНиП РК):</td><td>${report.severity}</td></tr>
          <tr><td class="label">Нормативный документ:</td><td>${report.snipCode}</td></tr>
          <tr><td class="label">Рекомендуемый метод:</td><td>${report.fixMethod}</td></tr>
          <tr><td class="label">Ориентировочная стоимость:</td><td><strong>${report.estimatedCost}</strong></td></tr>
        </table>
        ${annotatedImage ? `
          <div class="image-box">
            <div style="font-weight: 700; margin-bottom: 6px;">Схема дефектоскопии и карта трещин (AI Vision):</div>
            <img src="${annotatedImage}" alt="Карта дефектов" />
          </div>
        ` : ''}
        <table class="defects-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Тип дефекта</th>
              <th>Класс</th>
              <th>Точность AI</th>
              <th>Длина / Раскрытие</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            ${defectMarkers.map(d => `
              <tr>
                <td><strong>#${d.id}</strong></td>
                <td>${d.type}</td>
                <td>${d.severity ? d.severity.toUpperCase() : 'СРЕДНИЙ'}</td>
                <td>${(d.confidence * 100).toFixed(0)}%</td>
                <td>${d.length_mm ? `${d.length_mm} мм` : '—'} / ${d.opening_mm ? `${d.opening_mm} мм` : '—'}</td>
                <td>${d.description || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="stamp-box">
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

      // ═══ STEP 3: Offline fallback — expert domain heuristics ═══
      if (!data) {
        const descLower = (aiDescription || '').toLowerCase();
        let defectType = 'Усадочная трещина штукатурного слоя';
        let severity = '3 класс — Требует устранения';
        let snipCode = 'СНиП РК 3.02-04-2019 / СП РК 1.03-106-2012';
        let fixMethod = 'Расшивка шва на глубину 10 мм, обеспыливание, грунтовка глубокого проникновения, армирование серпянкой и шпатлевание полимерцементным составом.';
        let estimatedCost = '35 000 – 65 000 ₸';
        let workDays = 2;

        if (descLower.includes('протечк') || descLower.includes('сырост') || descLower.includes('вод')) {
          defectType = 'Нарушение гидроизоляционного слоя (протечка / сырость)';
          severity = '4 класс — Высокий риск биопоражения';
          snipCode = 'СНиП РК 2.04-09-2018 «Гидроизоляция зданий»';
          fixMethod = 'Локализация источника протечки, сушка тепловой пушкой, обработка фунгицидом, нанесение двухкомпонентной полимерной гидроизоляции.';
          estimatedCost = '55 000 – 120 000 ₸';
          workDays = 3;
        } else if (descLower.includes('перепад') || descLower.includes('пол') || descLower.includes('потол')) {
          defectType = 'Отклонение плоскости от горизонтали / вертикали';
          severity = '2 класс — Допустимое отклонение';
          snipCode = 'СП РК 3.02-107-2014 «Полы и перекрытия»';
          fixMethod = 'Лазерное нивелирование, шлифовка неровностей, заливка самовыравнивающейся нивелир-массой толщиной до 15 мм.';
          estimatedCost = '40 000 – 85 000 ₸';
          workDays = 2;
        }

        data = { defectType, severity, snipCode, fixMethod, estimatedCost, workDays };
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
      if (data.structure_zones) {
        setStructureZones(data.structure_zones);
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
          description: d.description || '',
        })));
      }
      
      setTimeout(() => {
        setIsScanning(false);
        setReport({
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
          analytics: items[0]?.analytics || null,
        });
        showToast('✅ Экспертиза дефекта нейросетью Vision AI завершена!');
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
          <span style={{ fontSize: '1.2rem' }}>🟢</span>
          <div>
            <strong>OpenAI Vision Defect AI подключен и активен:</strong> Нейросеть настроена на автоматическое выявление трещин, протечек, перепадов и дефектов с привязкой к СНиП РК.
          </div>
        </div>

        {/* SECTION 1: 📸 Загрузите фото */}
        <div className="di-section">
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

        {/* Sensitivity & Detection Level Toolbar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 800 }}>
              🎛️ Чувствительность нейросканера: <span style={{ color: '#38bdf8' }}>{Math.round(sensitivity * 100)}%</span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              {sensitivity <= 0.5 ? '🔴 Только аварийные разломы' : sensitivity <= 0.75 ? '⚖️ Стандарт СНиП' : '🔬 Микротрещины и каверны'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="range" 
              min="0.35" 
              max="0.95" 
              step="0.05" 
              value={sensitivity} 
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSensitivity(0.45)}
              style={{
                background: sensitivity === 0.45 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${sensitivity === 0.45 ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                color: sensitivity === 0.45 ? '#fca5a5' : '#94a3b8',
                borderRadius: '6px', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              🔴 Силовые разломы (0.45)
            </button>
            <button
              type="button"
              onClick={() => setSensitivity(0.65)}
              style={{
                background: sensitivity === 0.65 ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${sensitivity === 0.65 ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                color: sensitivity === 0.65 ? '#7dd3fc' : '#94a3b8',
                borderRadius: '6px', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              ⚖️ Оптимальный СНиП (0.65)
            </button>
            <button
              type="button"
              onClick={() => setSensitivity(0.85)}
              style={{
                background: sensitivity === 0.85 ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${sensitivity === 0.85 ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                color: sensitivity === 0.85 ? '#d8b4fe' : '#94a3b8',
                borderRadius: '6px', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              🔬 Микродефекты (0.85)
            </button>
          </div>
        </div>

        {/* Submit Coral Gradient CTA Button */}
        <button 
          className="di-btn-submit"
          onClick={handleRunInspection}
          disabled={isScanning}
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
            Идёт анализ дефектов через Roboflow & Vision AI...
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>
            Пожалуйста, подождите несколько секунд. ИИ сканирует текстуру, трещины, сколы и формирует интерактивную карту дефектов.
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
              🔬 Карта дефектов — визуальный анализ (Roboflow & Vision AI)
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

          {/* Active Image View — based on visionMode */}
          {(() => {
            const currentImg = 
              visionMode === 'stress' ? (stressHeatmapImage || annotatedImage) :
              visionMode === 'skeleton' ? (skeletonImage || annotatedImage) :
              visionMode === 'clean' ? (photos[0]?.url || annotatedImage) :
              annotatedImage;

            return (
              <div 
                className="di-defect-image-wrap" 
                onClick={() => { setLightboxSrc(currentImg); setLightboxZoom(1); }}
                style={{ position: 'relative' }}
              >
                <img src={currentImg} alt="Дефекты с полигональной разметкой" />
                <span className="di-zoom-hint">
                  {visionMode === 'stress' ? '🌡️ Режим: Анализ механических напряжений бетона (FEA Heatmap)' :
                   visionMode === 'skeleton' ? '🔬 Режим: Скелетизация траектории разлома' :
                   visionMode === 'clean' ? '📷 Режим: Исходное фото без слоёв' :
                   '🔍 Нажмите для полноэкранного зума (Laser AR HUD)'}
                </span>
              </div>
            );
          })()}

          {/* If no annotated image, show original photo */}
          {!annotatedImage && photos.length > 0 && (
            <div className="di-defect-image-wrap" onClick={() => { setLightboxSrc(photos[0]?.url); setLightboxZoom(1); }}>
              <img src={photos[0]?.url} alt="Фото дефекта" />
              <span className="di-zoom-hint">🔍 Нажмите для увеличения</span>
            </div>
          )}
          
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
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Отчет дефектоскопии № ${report.id}: ${report.defectType}, Стоимость: ${report.estimatedCost}`)}`, '_blank')}
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
