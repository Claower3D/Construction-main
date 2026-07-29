// ========== PE PDF SERVICE v1.0 ==========
// Профессиональный PDF для модуля "Оценка по фото"
// ✓ Кириллица (Roboto TTF)
// ✓ Встраивание фото объекта
// ✓ Секционные подитоги
// ✓ Брендированный дизайн QAZGOST AI
// Зависимости: jsPDF + autoTable

(function () {
    'use strict';

    // ═══════════════════════════════════════
    //  FONT MANAGEMENT
    // ═══════════════════════════════════════

    let _fontsReady = false;
    let _fontCache = {};

    function ab2b64(buffer) {
        let bin = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    async function loadFonts() {
        if (_fontsReady) return true;
        try {
            const urls = {
                regular: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
                bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf'
            };
            const keys = Object.keys(urls);
            const responses = await Promise.all(keys.map(k => fetch(urls[k])));
            for (const r of responses) { if (!r.ok) throw new Error(`HTTP ${r.status}`); }
            const buffers = await Promise.all(responses.map(r => r.arrayBuffer()));
            keys.forEach((k, i) => { _fontCache[k] = ab2b64(buffers[i]); });
            _fontsReady = true;
            console.log('✅ PE PDF: Cyrillic fonts loaded');
            return true;
        } catch (e) {
            console.warn('⚠️ PE PDF: Font load failed, using fallback Helvetica:', e.message);
            _fontsReady = false;
            return false;
        }
    }

    function registerFonts(doc) {
        if (!_fontsReady) return false;
        try {
            doc.addFileToVFS('Roboto-Regular.ttf', _fontCache.regular);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFileToVFS('Roboto-Medium.ttf', _fontCache.bold);
            doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
            doc.setFont('Roboto');
            return true;
        } catch (e) {
            console.warn('⚠️ Font registration failed:', e);
            return false;
        }
    }

    // ═══════════════════════════════════════
    //  FORMATTERS & COLORS
    // ═══════════════════════════════════════

    function fmt(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₸'; }
    function fmtNum(n) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n); }

    const CLR = {
        primary: [79, 70, 229], primaryDk: [55, 48, 163],
        accent: [16, 185, 129], accentDk: [5, 150, 105],
        warning: [245, 158, 11], dark: [30, 30, 46],
        text: [51, 51, 51], textLight: [120, 120, 140],
        lightBg: [248, 248, 255], white: [255, 255, 255],
        border: [220, 220, 235], rowAlt: [245, 245, 252],
        sectionBg: [235, 238, 255], subtotalBg: [230, 235, 250],
        photoBg: [250, 250, 255]
    };

    // ═══════════════════════════════════════
    //  DRAWING HELPERS
    // ═══════════════════════════════════════

    const sc = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
    const sf = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
    const sd = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);

    function rrect(doc, x, y, w, h, r, fill, stroke) {
        if (fill) sf(doc, fill);
        if (stroke) sd(doc, stroke);
        doc.roundedRect(x, y, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'S');
    }

    function gradient(doc, x, y, w, h) {
        const steps = 30, sw = w / steps;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            doc.setFillColor(
                Math.round(CLR.primary[0] * (1 - t) + CLR.primaryDk[0] * t),
                Math.round(CLR.primary[1] * (1 - t) + CLR.primaryDk[1] * t),
                Math.round(CLR.primary[2] * (1 - t) + CLR.primaryDk[2] * t)
            );
            doc.rect(x + i * sw, y, sw + 0.5, h, 'F');
        }
    }

    // ═══════════════════════════════════════
    //  MAIN GENERATE
    // ═══════════════════════════════════════

    const PeEstimatePDF = {
        preloadFonts: loadFonts,

        /**
         * @param {Object} data
         * @param {Array}  data.works             – [{id,name,unit,section,qty,hours,workPrice,materialPrice,price}]
         * @param {Object} data.detailedEstimate  – {sections:[{name,items:[...]}]} (fallback if works empty)
         * @param {string} data.category           – selected category name
         * @param {Object} data.categoryMeta       – {icon, color} from WBSCatalog
         * @param {Object} data.client             – {name, phone, address, notes}
         * @param {string} data.description        – AI description text
         * @param {Array}  data.photos             – [{dataUrl}]
         * @param {Object} data.plan               – {explanation, scenarios:{economy,standard,premium}, snipRefs:[], warnings:[], selectedScenario, confidence, objectType}
         * @param {Object} [data.defects]          – {defects:[], summary:{cracks,stains,rust,total}, max_severity, total_defect_area_pct}
         * @param {Object} [data.measurements3d]   – {area_m2, perimeter_m, height_m, volume_m3, confidence, method, num_points_3d}
         */
        async generate(data) {
            // Extract works from detailedEstimate if not provided directly
            if ((!data.works || !data.works.length) && data.detailedEstimate) {
                data.works = [];
                const est = data.detailedEstimate;
                if (est.sections) {
                    est.sections.forEach(sec => {
                        (sec.items || []).forEach(item => {
                            data.works.push({
                                ...item,
                                section: sec.name || sec.section || 'Общие',
                            });
                        });
                    });
                }
            }
            if (!data.works || !data.works.length) return null;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('jsPDF не загружен');
            }

            // Load Cyrillic fonts (non-blocking — fallback to Helvetica)
            await loadFonts();

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const fontsOk = registerFonts(doc);
            if (!fontsOk) {
                // Fallback: use Helvetica (no Cyrillic but PDF still generates)
                doc.setFont('Helvetica');
                console.warn('PE PDF: Using fallback Helvetica font (no Cyrillic support)');
            }

            const W = 210, H = 297, ML = 15, MR = 15, CW = W - ML - MR;

            // ── Compute totals ──
            const bySection = {};
            let totH = 0, totW = 0, totM = 0;
            data.works.forEach(w => {
                if (!bySection[w.section]) bySection[w.section] = [];
                bySection[w.section].push(w);
                totH += w.hours || 0;
                totW += w.workPrice || 0;
                totM += w.materialPrice || 0;
            });
            const grand = totW + totM;
            const workDays = Math.ceil(totH / 8);
            const secCount = Object.keys(bySection).length;

            const docNum = `QG-${Date.now().toString(36).toUpperCase().slice(-6)}`;
            const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

            let y = 0;

            // ══════════════════════════════
            //  PAGE 1 — HEADER
            // ══════════════════════════════

            // 1. Gradient header bar
            gradient(doc, 0, 0, W, 32);
            doc.setFontSize(20); doc.setFont(undefined, 'bold'); sc(doc, CLR.white);
            doc.text('QAZGOST AI', ML, 14);
            doc.setFontSize(8); doc.setFont(undefined, 'normal');
            doc.text('Construction Intelligence Platform', ML, 20);
            doc.setFontSize(9); doc.setFont(undefined, 'bold');
            doc.text(docNum, W - MR, 12, { align: 'right' });
            doc.setFont(undefined, 'normal'); doc.setFontSize(8);
            doc.text(dateStr, W - MR, 18, { align: 'right' });
            sf(doc, CLR.accent); doc.rect(0, 32, W, 1.5, 'F');

            // Multi-pass engine metadata badge (v4.0)
            if (data._multiPass) {
                doc.setFontSize(5.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.white);
                const modeLabels = { simple: 'Быстрый', complex: 'Детальный', vip: 'VIP' };
                const modeStr = modeLabels[data._multiPass.mode] || data._multiPass.mode;
                doc.text(`AI Engine: ${modeStr} | ${data._multiPass.passCount} passes`, W - MR, 27, { align: 'right' });
            }

            y = 38;

            // 2. Title
            doc.setFontSize(16); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
            doc.text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', W / 2, y, { align: 'center' });
            y += 6;
            doc.setFontSize(10); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
            doc.text('Оценка стоимости строительно-монтажных работ', W / 2, y, { align: 'center' });
            y += 4;
            sd(doc, CLR.border); doc.setLineWidth(0.3);
            doc.line(ML + 40, y, W - MR - 40, y);
            y += 6;

            // 3. Category badge
            const catIcon = data.categoryMeta ? data.categoryMeta.icon : '';
            rrect(doc, ML, y - 4, CW, 12, 3, CLR.lightBg, CLR.border);
            doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
            doc.text(`Категория:  ${catIcon} ${data.category}`, ML + 5, y + 2);
            doc.setFont(undefined, 'normal'); doc.setFontSize(8); sc(doc, CLR.textLight);
            doc.text(`${secCount} разделов  |  ${data.works.length} позиций`, W - MR - 5, y + 2, { align: 'right' });
            y += 14;

            // 4. Summary cards (4 KPI)
            const cW = (CW - 9) / 4, cH = 22;
            const cards = [
                { label: 'ЧЕЛОВЕКО-ЧАСЫ', val: `${fmtNum(totH)} ч/ч`, sub: `~${workDays} раб. дн.`, clr: CLR.primary },
                { label: 'СТОИМОСТЬ РАБОТ', val: fmt(totW), sub: `${data.works.length} позиций`, clr: [59, 130, 246] },
                { label: 'МАТЕРИАЛЫ', val: fmt(totM), sub: `${grand > 0 ? Math.round(totM / grand * 100) : 0}% от итого`, clr: CLR.warning },
                { label: 'ИТОГО', val: fmt(grand), sub: 'с учётом материалов', clr: CLR.accent }
            ];
            cards.forEach((c, i) => {
                const cx = ML + i * (cW + 3);
                rrect(doc, cx, y, cW, cH, 2.5, CLR.white, CLR.border);
                sf(doc, c.clr); doc.rect(cx, y + 2, 1.2, cH - 4, 'F');
                doc.setFontSize(6.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                doc.text(c.label, cx + 5, y + 5.5);
                doc.setFontSize(i === 3 ? 11 : 9.5); doc.setFont(undefined, 'bold');
                doc.setTextColor(c.clr[0], c.clr[1], c.clr[2]);
                doc.text(c.val, cx + 5, y + 12.5);
                doc.setFontSize(5.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                doc.text(c.sub, cx + 5, y + 17.5);
            });
            y += cH + 6;

            // 5. Client info
            if (data.client && (data.client.name || data.client.phone || data.client.address)) {
                rrect(doc, ML, y, CW, 20, 2.5, [252, 252, 255], CLR.border);
                doc.setFontSize(7); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
                doc.text('ДАННЫЕ ЗАКАЗЧИКА', ML + 5, y + 5);
                doc.setFontSize(8); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                const cl = [];
                if (data.client.name) cl.push(`Заказчик: ${data.client.name}`);
                if (data.client.phone) cl.push(`Телефон: ${data.client.phone}`);
                if (data.client.address) cl.push(`Адрес объекта: ${data.client.address}`);
                if (data.client.notes) cl.push(`Примечания: ${data.client.notes}`);
                cl.slice(0, 2).forEach((l, i) => doc.text(l, ML + 5, y + 10 + i * 4));
                cl.slice(2).forEach((l, i) => doc.text(l, ML + CW / 2 + 5, y + 10 + i * 4));
                y += 24;
            }

            // 6. Description
            if (data.description && data.description.trim()) {
                rrect(doc, ML, y, CW, 14, 2.5, [255, 251, 235], [253, 230, 138]);
                doc.setFontSize(7); doc.setFont(undefined, 'bold'); sc(doc, CLR.warning);
                doc.text('ОПИСАНИЕ ОБЪЕКТА', ML + 4, y + 5);
                doc.setFontSize(7.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                const dt = doc.splitTextToSize(data.description, CW - 10);
                doc.text(dt.slice(0, 2).join(' '), ML + 4, y + 10);
                y += 18;
            }

            // 7. Photos strip (NEW!)
            if (data.photos && data.photos.length > 0) {
                if (y + 45 > H - 20) { doc.addPage(); y = 16; }
                doc.setFontSize(8); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
                doc.text('ФОТОГРАФИИ ОБЪЕКТА', ML, y + 2);
                sf(doc, CLR.primary); doc.rect(ML, y + 4, 35, 0.5, 'F');
                y += 8;

                const maxP = Math.min(data.photos.length, 5);
                const pW = Math.min((CW - (maxP - 1) * 3 - 6) / maxP, 38);
                const pH = 30;
                rrect(doc, ML, y - 2, CW, pH + 6, 3, CLR.photoBg, CLR.border);

                data.photos.slice(0, maxP).forEach((photo, i) => {
                    const px = ML + 3 + i * (pW + 3);
                    try {
                        doc.addImage(photo.dataUrl, 'JPEG', px, y, pW, pH, undefined, 'MEDIUM');
                        sd(doc, CLR.border); doc.setLineWidth(0.3);
                        doc.roundedRect(px, y, pW, pH, 1.5, 1.5, 'S');
                        // Number badge
                        sf(doc, CLR.dark); doc.circle(px + pW - 3, y + 3, 3, 'F');
                        doc.setFontSize(5); doc.setFont(undefined, 'bold'); sc(doc, CLR.white);
                        doc.text(String(i + 1), px + pW - 3, y + 4, { align: 'center' });
                    } catch (e) {
                        rrect(doc, px, y, pW, pH, 1.5, [240, 240, 245], CLR.border);
                        doc.setFontSize(7); sc(doc, CLR.textLight);
                        doc.text('Фото ' + (i + 1), px + pW / 2, y + pH / 2 + 1, { align: 'center' });
                    }
                });
                y += pH + 8;
            }

            // ══════════════════════════════
            //  PLAN V3 — СЦЕНАРИИ + СНиП
            // ══════════════════════════════

            if (data.plan) {
                const plan = data.plan;

                // СНиП references
                if (plan.snipRefs && plan.snipRefs.length > 0) {
                    if (y + 15 > H - 20) { doc.addPage(); y = 16; }
                    rrect(doc, ML, y, CW, 10, 2, [240, 248, 255], [180, 210, 240]);
                    doc.setFontSize(7); doc.setFont(undefined, 'bold'); sc(doc, [30, 100, 180]);
                    doc.text('📖 НОРМАТИВНАЯ БАЗА', ML + 4, y + 4);
                    doc.setFontSize(7); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                    doc.text(plan.snipRefs.join(' | '), ML + 4, y + 8);
                    y += 14;
                }

                // Scenario comparison cards
                if (plan.scenarios) {
                    if (y + 35 > H - 20) { doc.addPage(); y = 16; }
                    doc.setFontSize(9); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                    doc.text('ВАРИАНТЫ РЕАЛИЗАЦИИ', ML, y + 2);
                    sf(doc, CLR.primary); doc.rect(ML, y + 4, 40, 0.5, 'F');
                    y += 8;

                    const scenKeys = Object.keys(plan.scenarios);
                    const scW = (CW - (scenKeys.length - 1) * 3) / scenKeys.length;
                    const scH = 25;
                    const scenColors = {
                        economy: [34, 197, 94],
                        standard: [79, 70, 229],
                        premium: [245, 158, 11],
                    };

                    scenKeys.forEach((key, i) => {
                        const sc2 = plan.scenarios[key];
                        const cx = ML + i * (scW + 3);
                        const isSelected = key === (plan.selectedScenario || 'standard');
                        const clr = scenColors[key] || CLR.primary;

                        rrect(doc, cx, y, scW, scH, 2.5, isSelected ? [clr[0], clr[1], clr[2]] : CLR.white, isSelected ? null : CLR.border);

                        const txtClr = isSelected ? CLR.white : CLR.text;
                        const headClr = isSelected ? CLR.white : clr;

                        doc.setFontSize(7); doc.setFont(undefined, 'bold');
                        sc(doc, headClr);
                        doc.text(`${sc2.emoji || ''} ${sc2.name || key}`, cx + 3, y + 5);

                        doc.setFontSize(11); doc.setFont(undefined, 'bold');
                        sc(doc, isSelected ? CLR.white : clr);
                        doc.text(fmt(sc2.total || 0), cx + 3, y + 13);

                        if (sc2.desc) {
                            doc.setFontSize(5.5); doc.setFont(undefined, 'normal');
                            sc(doc, isSelected ? [220, 220, 255] : CLR.textLight);
                            const descLines = doc.splitTextToSize(sc2.desc, scW - 6);
                            doc.text(descLines.slice(0, 2).join(' '), cx + 3, y + 18);
                        }

                        if (isSelected) {
                            doc.setFontSize(5); sc(doc, CLR.white);
                            doc.text('✓ ВЫБРАН', cx + scW - 3, y + 5, { align: 'right' });
                        }
                    });
                    y += scH + 6;
                }

                // Warnings
                if (plan.warnings && plan.warnings.length > 0) {
                    if (y + 12 > H - 20) { doc.addPage(); y = 16; }
                    rrect(doc, ML, y, CW, 4 + plan.warnings.length * 3.5, 2, [255, 251, 235], [253, 230, 138]);
                    doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); sc(doc, CLR.warning);
                    doc.text('⚠️ ПРЕДУПРЕЖДЕНИЯ', ML + 4, y + 3.5);
                    doc.setFontSize(6); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                    plan.warnings.forEach((w, i) => {
                        const msg = typeof w === 'string' ? w : (w.message || '');
                        doc.text(`• ${msg}`, ML + 4, y + 7 + i * 3.5);
                    });
                    y += 8 + plan.warnings.length * 3.5;
                }

                // Plan explanation
                if (plan.explanation && plan.explanation.trim()) {
                    if (y + 20 > H - 20) { doc.addPage(); y = 16; }
                    rrect(doc, ML, y, CW, 16, 2, [245, 248, 255], CLR.border);
                    doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
                    doc.text('📋 ОБОСНОВАНИЕ ПЛАНА', ML + 4, y + 4);
                    doc.setFontSize(6); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                    const expLines = doc.splitTextToSize(plan.explanation, CW - 10);
                    doc.text(expLines.slice(0, 4).join('\n'), ML + 4, y + 8);
                    y += 20;
                }
            }

            // ══════════════════════════════
            //  WORKS TABLE WITH SUBTOTALS
            // ══════════════════════════════

            doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
            doc.text('ВЕДОМОСТЬ ОБЪЁМОВ И СТОИМОСТИ РАБОТ', ML, y + 1);
            sf(doc, CLR.primary); doc.rect(ML, y + 3, 50, 0.8, 'F');
            sf(doc, CLR.accent); doc.rect(ML + 50, y + 3, 20, 0.8, 'F');
            y += 7;

            const tableHead = [['№', 'Наименование работ', 'Ед.', 'Объём', 'Ч/ч', 'Работа (₸)', 'Материалы (₸)', 'Итого (₸)']];
            const tableBody = [];
            let rowNum = 0;

            Object.entries(bySection).forEach(([section, works]) => {
                // Section header
                tableBody.push([{
                    content: `  ${section}`, colSpan: 8,
                    styles: {
                        fontStyle: 'bold', fillColor: CLR.sectionBg, textColor: CLR.primary, fontSize: 7.5,
                        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 1 }
                    }
                }]);

                let secH = 0, secW2 = 0, secM2 = 0;
                works.forEach(w => {
                    rowNum++;
                    const rt = (w.workPrice || 0) + (w.materialPrice || 0);
                    secH += w.hours || 0;
                    secW2 += w.workPrice || 0;
                    secM2 += w.materialPrice || 0;
                    tableBody.push([
                        { content: String(rowNum), styles: { halign: 'center', textColor: CLR.textLight, fontSize: 6.5 } },
                        w.name, w.unit || '—', fmtNum(w.qty), fmtNum(w.hours),
                        fmt(w.workPrice), fmt(w.materialPrice),
                        { content: fmt(rt), styles: { fontStyle: 'bold' } }
                    ]);
                });

                // Section subtotal (NEW!)
                tableBody.push([
                    { content: '', styles: { fillColor: CLR.subtotalBg } },
                    {
                        content: `Итого по разделу:`, colSpan: 3, styles: {
                            fontStyle: 'bold', fillColor: CLR.subtotalBg, textColor: CLR.primaryDk,
                            fontSize: 7, halign: 'right', cellPadding: { top: 2, bottom: 2, left: 1, right: 2 }
                        }
                    },
                    { content: fmtNum(secH), styles: { fontStyle: 'bold', fillColor: CLR.subtotalBg, textColor: CLR.primary, halign: 'center', fontSize: 7 } },
                    { content: fmt(secW2), styles: { fontStyle: 'bold', fillColor: CLR.subtotalBg, textColor: CLR.text, halign: 'right', fontSize: 7 } },
                    { content: fmt(secM2), styles: { fontStyle: 'bold', fillColor: CLR.subtotalBg, textColor: CLR.text, halign: 'right', fontSize: 7 } },
                    { content: fmt(secW2 + secM2), styles: { fontStyle: 'bold', fillColor: CLR.subtotalBg, textColor: CLR.primary, halign: 'right', fontSize: 7.5 } }
                ]);
            });

            // Grand total row
            tableBody.push([
                { content: '', styles: { fillColor: CLR.dark } },
                { content: 'ИТОГО ПО СМЕТЕ', colSpan: 3, styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.white, fontSize: 8 } },
                { content: fmtNum(totH), styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.accent, halign: 'center', fontSize: 8 } },
                { content: fmt(totW), styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.white, halign: 'right', fontSize: 8 } },
                { content: fmt(totM), styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.white, halign: 'right', fontSize: 8 } },
                { content: fmt(grand), styles: { fontStyle: 'bold', fillColor: CLR.accent, textColor: CLR.white, halign: 'right', fontSize: 9 } }
            ]);

            doc.autoTable({
                startY: y, head: tableHead, body: tableBody,
                styles: {
                    fontSize: 7, cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
                    lineColor: CLR.border, lineWidth: 0.2, textColor: CLR.text, font: _fontsReady ? 'Roboto' : undefined
                },
                headStyles: {
                    fillColor: CLR.primary, textColor: CLR.white, fontStyle: 'bold', fontSize: 7,
                    cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 }, halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 56 },
                    2: { cellWidth: 14, halign: 'center' }, 3: { cellWidth: 14, halign: 'center' },
                    4: { cellWidth: 14, halign: 'center' }, 5: { cellWidth: 24, halign: 'right' },
                    6: { cellWidth: 24, halign: 'right' }, 7: { cellWidth: 26, halign: 'right' }
                },
                margin: { left: ML, right: MR },
                alternateRowStyles: { fillColor: CLR.rowAlt },
                didDrawPage: function (d) {
                    if (d.pageNumber > 1) {
                        gradient(doc, 0, 0, W, 10);
                        doc.setFontSize(8); doc.setFont(undefined, 'bold'); sc(doc, CLR.white);
                        doc.text('QAZGOST AI', ML, 7);
                        doc.setFontSize(7); doc.setFont(undefined, 'normal');
                        doc.text(`${docNum}  |  ${data.category}`, W - MR, 7, { align: 'right' });
                        sf(doc, CLR.accent); doc.rect(0, 10, W, 0.5, 'F');
                    }
                }
            });

            y = doc.lastAutoTable.finalY + 6;

            // ══════════════════════════════
            //  MATERIALS TABLE (from catalog)
            // ══════════════════════════════

            const materialItems = (data.materials || []).filter(m => m && m.name);
            if (materialItems.length > 0) {
                if (y + 30 > H - 20) { doc.addPage(); y = 20; }

                doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                doc.text('ВЕДОМОСТЬ МАТЕРИАЛОВ', ML, y + 1);
                sf(doc, CLR.warning); doc.rect(ML, y + 3, 50, 0.8, 'F');
                sf(doc, CLR.accent); doc.rect(ML + 50, y + 3, 20, 0.8, 'F');
                y += 7;

                const matHead = [['№', 'Наименование материала', 'Ед.', 'Кол-во', 'Цена (₸)', 'Сумма (₸)']];
                let matTotal = 0;
                const matBody = materialItems.map((m, i) => {
                    const total = Math.round((m.quantity || 1) * (m.unitPrice || m.price || 0));
                    matTotal += total;
                    return [
                        { content: String(i + 1), styles: { halign: 'center', fontSize: 6.5 } },
                        m.name,
                        m.unit || 'шт',
                        fmtNum(m.quantity || 1),
                        fmt(m.unitPrice || m.price || 0),
                        { content: fmt(total), styles: { fontStyle: 'bold' } }
                    ];
                });
                // Total row
                matBody.push([
                    { content: '', styles: { fillColor: CLR.dark } },
                    { content: 'ИТОГО МАТЕРИАЛЫ', colSpan: 3, styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.white, fontSize: 8 } },
                    { content: '', styles: { fillColor: CLR.dark } },
                    { content: fmt(matTotal), styles: { fontStyle: 'bold', fillColor: CLR.warning, textColor: CLR.white, halign: 'right', fontSize: 9 } }
                ]);

                doc.autoTable({
                    startY: y, head: matHead, body: matBody,
                    styles: {
                        fontSize: 7, cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
                        lineColor: CLR.border, lineWidth: 0.2, textColor: CLR.text, font: _fontsReady ? 'Roboto' : undefined
                    },
                    headStyles: {
                        fillColor: CLR.warning, textColor: CLR.white, fontStyle: 'bold', fontSize: 7, halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 75 },
                        2: { cellWidth: 16, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' },
                        4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 30, halign: 'right' }
                    },
                    margin: { left: ML, right: MR },
                    alternateRowStyles: { fillColor: CLR.rowAlt },
                });
                y = doc.lastAutoTable.finalY + 6;
                totM += matTotal; // add to grand materials
            }

            // ══════════════════════════════
            //  EQUIPMENT TABLE (from catalog)
            // ══════════════════════════════

            const equipItems = (data.equipment || []).filter(e => e && e.name);
            if (equipItems.length > 0) {
                if (y + 30 > H - 20) { doc.addPage(); y = 20; }

                doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                doc.text('ВЕДОМОСТЬ ТЕХНИКИ И ОБОРУДОВАНИЯ', ML, y + 1);
                sf(doc, [59, 130, 246]); doc.rect(ML, y + 3, 50, 0.8, 'F');
                sf(doc, CLR.accent); doc.rect(ML + 50, y + 3, 20, 0.8, 'F');
                y += 7;

                const eqHead = [['№', 'Наименование техники', 'Ед.', 'Кол-во', 'Цена (₸/ч)', 'Сумма (₸)']];
                let eqTotal = 0;
                const eqBody = equipItems.map((e, i) => {
                    const total = Math.round((e.quantity || e.hours || 1) * (e.unitPrice || e.rentalRate || e.price || 0));
                    eqTotal += total;
                    return [
                        { content: String(i + 1), styles: { halign: 'center', fontSize: 6.5 } },
                        e.name,
                        e.unit || 'маш-ч',
                        fmtNum(e.quantity || e.hours || 1),
                        fmt(e.unitPrice || e.rentalRate || e.price || 0),
                        { content: fmt(total), styles: { fontStyle: 'bold' } }
                    ];
                });
                // Total row
                eqBody.push([
                    { content: '', styles: { fillColor: CLR.dark } },
                    { content: 'ИТОГО ТЕХНИКА', colSpan: 3, styles: { fontStyle: 'bold', fillColor: CLR.dark, textColor: CLR.white, fontSize: 8 } },
                    { content: '', styles: { fillColor: CLR.dark } },
                    { content: fmt(eqTotal), styles: { fontStyle: 'bold', fillColor: [59, 130, 246], textColor: CLR.white, halign: 'right', fontSize: 9 } }
                ]);

                doc.autoTable({
                    startY: y, head: eqHead, body: eqBody,
                    styles: {
                        fontSize: 7, cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
                        lineColor: CLR.border, lineWidth: 0.2, textColor: CLR.text, font: _fontsReady ? 'Roboto' : undefined
                    },
                    headStyles: {
                        fillColor: [59, 130, 246], textColor: CLR.white, fontStyle: 'bold', fontSize: 7, halign: 'center'
                    },
                    columnStyles: {
                        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 75 },
                        2: { cellWidth: 16, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' },
                        4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 30, halign: 'right' }
                    },
                    margin: { left: ML, right: MR },
                    alternateRowStyles: { fillColor: CLR.rowAlt },
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // ══════════════════════════════
            //  GRAND TOTAL BOX
            // ══════════════════════════════

            if (y + 50 > H - 20) { doc.addPage(); y = 20; }

            rrect(doc, ML, y, CW, 18, 3, CLR.dark, null);
            sf(doc, CLR.accent); doc.rect(ML, y, 4, 18, 'F');
            doc.setFontSize(9); doc.setFont(undefined, 'normal'); sc(doc, CLR.white);
            doc.text('Итоговая стоимость работ с материалами:', ML + 10, y + 7);
            doc.setFontSize(16); doc.setFont(undefined, 'bold');
            doc.setTextColor(CLR.accent[0], CLR.accent[1], CLR.accent[2]);
            doc.text(fmt(grand), W - MR - 8, y + 12, { align: 'right' });
            doc.setFontSize(7); doc.setFont(undefined, 'normal');
            sc(doc, [180, 180, 200]);
            doc.text(`Работы: ${fmt(totW)}  |  Материалы: ${fmt(totM)}  |  Человеко-часы: ${fmtNum(totH)} ч/ч (~${workDays} дн.)`, ML + 10, y + 14.5);
            y += 24;


            // ══════════════════════════════
            //  DEFECT REPORT (V3)
            // ══════════════════════════════

            const defects = data.defects;
            if (defects && defects.summary && defects.summary.total > 0) {
                if (y + 40 > H - 20) { doc.addPage(); y = 20; }

                doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                doc.text('ОТЧЁТ О ДЕФЕКТАХ', ML, y + 1);
                sf(doc, [220, 38, 38]); doc.rect(ML, y + 3, 50, 0.8, 'F');
                sf(doc, CLR.warning); doc.rect(ML + 50, y + 3, 20, 0.8, 'F');
                y += 7;

                const sevColors = { low: [34, 197, 94], medium: [245, 158, 11], high: [239, 68, 68], critical: [185, 28, 28] };
                const sevLabels = { low: 'Низкая', medium: 'Средняя', high: 'Высокая', critical: 'Критическая', none: '—' };

                // Summary box
                const sumH = 22;
                rrect(doc, ML, y, CW, sumH, 3, [254, 242, 242], [252, 165, 165]);

                doc.setFontSize(7); doc.setFont(undefined, 'bold'); sc(doc, [185, 28, 28]);
                doc.text('Обнаружено дефектов:', ML + 4, y + 5);
                doc.setFontSize(14); doc.text(String(defects.summary.total), ML + 50, y + 6);

                doc.setFontSize(6.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.text);
                const defSumParts = [];
                if (defects.summary.cracks) defSumParts.push(`Трещины: ${defects.summary.cracks}`);
                if (defects.summary.stains) defSumParts.push(`Пятна/плесень: ${defects.summary.stains}`);
                if (defects.summary.rust) defSumParts.push(`Ржавчина/коррозия: ${defects.summary.rust}`);
                doc.text(defSumParts.join('  |  '), ML + 4, y + 10);

                // Severity indicator
                const maxSev = defects.max_severity || 'none';
                const sevClr = sevColors[maxSev] || [150, 150, 150];
                sf(doc, sevClr); doc.circle(W - MR - 20, y + 8, 3, 'F');
                doc.setFontSize(6.5); doc.setFont(undefined, 'bold');
                doc.setTextColor(sevClr[0], sevClr[1], sevClr[2]);
                doc.text(`Макс. серьёзность: ${sevLabels[maxSev] || maxSev}`, W - MR - 16, y + 9);

                // Defect area %
                if (defects.total_defect_area_pct) {
                    doc.setFontSize(6); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                    doc.text(`Поражённая площадь: ~${defects.total_defect_area_pct.toFixed(1)}%`, ML + 4, y + 15);
                }

                // Recommendation
                doc.setFontSize(6); sc(doc, CLR.textLight);
                const recText = maxSev === 'critical' || maxSev === 'high'
                    ? 'Рекомендуется срочный осмотр специалиста перед началом работ.'
                    : 'Дефекты учтены при расчёте объёмов ремонтных работ.';
                doc.text(recText, ML + 4, y + 19);

                y += sumH + 4;
            }

            // ══════════════════════════════
            //  3D MEASUREMENTS (V3)
            // ══════════════════════════════

            const m3d = data.measurements3d;
            if (m3d && m3d.method && m3d.method !== 'mock') {
                if (y + 35 > H - 20) { doc.addPage(); y = 20; }

                doc.setFontSize(10); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                doc.text('3D ИЗМЕРЕНИЯ (ФОТОГРАММЕТРИЯ)', ML, y + 1);
                sf(doc, CLR.accent); doc.rect(ML, y + 3, 50, 0.8, 'F');
                sf(doc, CLR.primary); doc.rect(ML + 50, y + 3, 20, 0.8, 'F');
                y += 7;

                rrect(doc, ML, y, CW, 24, 3, [240, 253, 244], [187, 247, 208]);

                // Measurement values
                const metrics = [
                    { label: 'Площадь', value: `${(m3d.area_m2 || 0).toFixed(2)} м²`, x: ML + 4 },
                    { label: 'Периметр', value: `${(m3d.perimeter_m || 0).toFixed(2)} м`, x: ML + 48 },
                    { label: 'Высота', value: `${(m3d.height_m || 0).toFixed(2)} м`, x: ML + 92 },
                    { label: 'Объём', value: `${(m3d.volume_m3 || 0).toFixed(2)} м³`, x: ML + 136 },
                ];

                metrics.forEach(m => {
                    doc.setFontSize(6); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                    doc.text(m.label, m.x, y + 5);
                    doc.setFontSize(11); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
                    doc.text(m.value, m.x, y + 11);
                });

                // Confidence & method
                const conf = m3d.confidence || 0;
                const confPct = Math.round(conf * 100);
                const confColor = conf >= 0.7 ? CLR.accent : (conf >= 0.4 ? CLR.warning : [239, 68, 68]);
                doc.setFontSize(6); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                doc.text(`Метод: ${m3d.method || 'SfM'}  |  Точек: ${m3d.num_points_3d || '—'}`, ML + 4, y + 17);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(confColor[0], confColor[1], confColor[2]);
                doc.text(`Уверенность: ${confPct}%`, ML + 4, y + 21);

                // Confidence bar
                sf(doc, [230, 230, 230]); doc.rect(ML + 40, y + 19, 40, 2.5, 'F');
                sf(doc, confColor); doc.rect(ML + 40, y + 19, 40 * conf, 2.5, 'F');

                y += 28;
            }

            // ══════════════════════════════
            //  DISCLAIMER
            // ══════════════════════════════

            if (y + 20 > H - 20) { doc.addPage(); y = 20; }
            rrect(doc, ML, y, CW, 16, 2, [255, 251, 245], [253, 230, 180]);
            doc.setFontSize(6); doc.setFont(undefined, 'bold'); sc(doc, CLR.warning);
            doc.text('ВАЖНАЯ ИНФОРМАЦИЯ', ML + 4, y + 4);
            doc.setFontSize(5.8); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
            [
                '1. Настоящее предложение носит предварительный характер и не является публичной офертой (ст. 395 ГК РК).',
                '2. Окончательная стоимость определяется после выезда специалиста на объект и составления детальной сметы.',
                '3. Стоимость материалов указана ориентировочно. Фактическая стоимость зависит от выбранных брендов и поставщиков.',
                '4. Срок действия предложения — 30 календарных дней с даты формирования документа.'
            ].forEach((l, i) => doc.text(l, ML + 4, y + 8 + i * 2.2));
            y += 22;

            // ══════════════════════════════
            //  SIGNATURES
            // ══════════════════════════════

            if (y + 40 > H - 15) { doc.addPage(); y = 20; }

            doc.setFontSize(9); doc.setFont(undefined, 'bold'); sc(doc, CLR.dark);
            doc.text('ПОДПИСИ СТОРОН', ML, y + 2);
            sd(doc, CLR.border); doc.setLineWidth(0.3);
            doc.line(ML, y + 4, ML + 40, y + 4);
            y += 10;

            const sigW = (CW - 20) / 2;
            // Executor
            doc.setFontSize(7.5); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
            doc.text('ИСПОЛНИТЕЛЬ', ML, y);
            doc.setFont(undefined, 'normal'); doc.setFontSize(7); sc(doc, CLR.text);
            doc.text('QAZGOST AI', ML, y + 5);
            doc.text('ИП / ТОО ____________________', ML, y + 10);
            doc.text('БИН: ____________________', ML, y + 15);
            sd(doc, CLR.textLight); doc.setLineWidth(0.2);
            doc.line(ML, y + 25, ML + sigW, y + 25);
            doc.setFontSize(5.5); sc(doc, CLR.textLight);
            doc.text('Подпись / Печать', ML, y + 28);
            doc.text('Дата: ___.___.______', ML + sigW - 30, y + 28);

            // Client
            const rx = ML + sigW + 20;
            doc.setFontSize(7.5); doc.setFont(undefined, 'bold'); sc(doc, CLR.primary);
            doc.text('ЗАКАЗЧИК', rx, y);
            doc.setFont(undefined, 'normal'); doc.setFontSize(7); sc(doc, CLR.text);
            doc.text(data.client.name || '____________________', rx, y + 5);
            doc.text(`Тел: ${data.client.phone || '____________________'}`, rx, y + 10);
            doc.text(`Адрес: ${data.client.address || '____________________'}`, rx, y + 15);
            doc.line(rx, y + 25, rx + sigW, y + 25);
            doc.setFontSize(5.5); sc(doc, CLR.textLight);
            doc.text('Подпись', rx, y + 28);
            doc.text('Дата: ___.___.______', rx + sigW - 30, y + 28);

            // ══════════════════════════════
            //  FOOTER ON ALL PAGES
            // ══════════════════════════════

            const pageCount = doc.internal.getNumberOfPages();
            for (let p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                sd(doc, CLR.border); doc.setLineWidth(0.3);
                doc.line(ML, H - 10, W - MR, H - 10);
                doc.setFontSize(5.5); doc.setFont(undefined, 'normal'); sc(doc, CLR.textLight);
                doc.text(`QAZGOST AI  |  Construction Intelligence Platform  |  ${docNum}`, ML, H - 6);
                doc.text(`Страница ${p} из ${pageCount}`, W - MR, H - 6, { align: 'right' });
                sf(doc, CLR.primary); doc.rect(0, H - 2.5, W * 0.7, 2.5, 'F');
                sf(doc, CLR.accent); doc.rect(W * 0.7, H - 2.5, W * 0.3, 2.5, 'F');
            }

            // ── SAVE via Blob URL (reliable cross-origin download) ──
            const filename = `KP_${data.category.replace(/\s+/g, '_')}_${docNum}_${new Date().toISOString().slice(0, 10)}.pdf`;
            try {
                const blob = doc.output('blob');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 200);
            } catch (saveErr) {
                console.warn('Blob download failed, falling back to doc.save:', saveErr);
                doc.save(filename);
            }
            return filename;
        }
    };

    // ═══════════════════════════════════════
    //  EXPORT
    // ═══════════════════════════════════════

    window.PeEstimatePDF = PeEstimatePDF;

    // Preload fonts on module load
    loadFonts();

    console.log('✅ PeEstimatePDF v1.0 loaded');
})();
