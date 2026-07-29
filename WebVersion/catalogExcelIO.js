// ================================================================
// CATALOG EXCEL I/O — Экспорт/Импорт каталогов Работ, Материалов, Техники
// Формат: .xlsx (SheetJS/xlsx)
// Позволяет выгрузить каталог, отредактировать цены в Excel,
// и загрузить обратно с колонкой "Новая цена (₸)"
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════
    const LS_KEY_WRK = 'PRICE_OVERRIDES_WRK';
    const LS_KEY_MAT = 'PRICE_OVERRIDES_MAT';
    const LS_KEY_EQ  = 'PRICE_OVERRIDES_EQ';

    const SHEET_WORKS     = 'Работы';
    const SHEET_MATERIALS = 'Материалы';
    const SHEET_EQUIPMENT = 'Техника';

    // Column headers
    const HEADERS = ['ID', 'Название', 'Ед. изм.', 'Цена (₸)', 'Новая цена (₸)', 'Категория', 'Источник'];

    // ═══════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════
    function getOverrides(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch { return {}; }
    }

    function saveOverrides(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function fmt(n) {
        return Math.round(n).toLocaleString('ru-RU');
    }

    /** Collect all items from window[prefix_*] globals */
    function collectCatalog(prefixes) {
        const items = [];
        for (const key of Object.keys(window)) {
            if (!prefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;

            for (const [id, item] of Object.entries(catalog)) {
                if (!item || typeof item !== 'object' || !item.name) continue;
                items.push({
                    id,
                    name: item.name,
                    unit: item.unit || '—',
                    price: item.price || 0,
                    category: (item.category || '').toLowerCase().trim(),
                    source: key,
                });
            }
        }
        return items;
    }

    // ═══════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════

    function buildSheet(items, overridesKey) {
        const overrides = getOverrides(overridesKey);
        const rows = items.map(it => [
            it.id,
            it.name,
            it.unit,
            it.price,
            overrides[it.id] !== undefined ? overrides[it.id] : '',  // Новая цена — пустая если не менялась
            it.category,
            it.source,
        ]);

        const data = [HEADERS, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Column widths
        ws['!cols'] = [
            { wch: 28 }, // ID
            { wch: 55 }, // Название
            { wch: 10 }, // Ед. изм.
            { wch: 14 }, // Цена
            { wch: 16 }, // Новая цена
            { wch: 20 }, // Категория
            { wch: 25 }, // Источник
        ];

        return ws;
    }

    /**
     * Экспорт всех каталогов в один Excel-файл с 3 листами
     */
    function exportAll() {
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Библиотека XLSX не загружена. Перезагрузите страницу.');
            return;
        }

        const works     = collectCatalog(['AI_WRK_', 'AI_WORK_']);
        const materials = collectCatalog(['AI_MAT_']);
        const equipment = collectCatalog(['AI_EQ_']);

        if (!works.length && !materials.length && !equipment.length) {
            alert('⚠️ Каталоги пусты. Дождитесь загрузки данных.');
            return;
        }

        const wb = XLSX.utils.book_new();

        if (works.length)     XLSX.utils.book_append_sheet(wb, buildSheet(works, LS_KEY_WRK), SHEET_WORKS);
        if (materials.length) XLSX.utils.book_append_sheet(wb, buildSheet(materials, LS_KEY_MAT), SHEET_MATERIALS);
        if (equipment.length) XLSX.utils.book_append_sheet(wb, buildSheet(equipment, LS_KEY_EQ), SHEET_EQUIPMENT);

        const date = new Date().toISOString().slice(0, 10);
        const filename = `QazGost_Каталог_${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        showToast(`✅ Экспорт завершён: ${filename}`, 'success');
        console.log(`[CatalogExcelIO] Exported: ${works.length} работ, ${materials.length} материалов, ${equipment.length} техники`);
    }

    /**
     * Экспорт только работ
     */
    function exportWorks() {
        if (typeof XLSX === 'undefined') { alert('⚠️ XLSX не загружена'); return; }
        const works = collectCatalog(['AI_WRK_', 'AI_WORK_']);
        if (!works.length) { alert('⚠️ Каталог работ пуст'); return; }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, buildSheet(works, LS_KEY_WRK), SHEET_WORKS);
        XLSX.writeFile(wb, `QazGost_Работы_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast(`✅ Экспортировано ${works.length} работ`, 'success');
    }

    /**
     * Экспорт только материалов
     */
    function exportMaterials() {
        if (typeof XLSX === 'undefined') { alert('⚠️ XLSX не загружена'); return; }
        const materials = collectCatalog(['AI_MAT_']);
        if (!materials.length) { alert('⚠️ Каталог материалов пуст'); return; }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, buildSheet(materials, LS_KEY_MAT), SHEET_MATERIALS);
        XLSX.writeFile(wb, `QazGost_Материалы_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast(`✅ Экспортировано ${materials.length} материалов`, 'success');
    }

    /**
     * Экспорт только техники
     */
    function exportEquipment() {
        if (typeof XLSX === 'undefined') { alert('⚠️ XLSX не загружена'); return; }
        const equipment = collectCatalog(['AI_EQ_']);
        if (!equipment.length) { alert('⚠️ Каталог техники пуст'); return; }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, buildSheet(equipment, LS_KEY_EQ), SHEET_EQUIPMENT);
        XLSX.writeFile(wb, `QazGost_Техника_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast(`✅ Экспортировано ${equipment.length} позиций техники`, 'success');
    }

    // ═══════════════════════════════════════════════════════
    // IMPORT
    // ═══════════════════════════════════════════════════════

    /**
     * Импорт Excel-файла с обновлёнными ценами
     * @param {File} file - .xlsx файл
     */
    function importFromExcel(file) {
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Библиотека XLSX не загружена');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                let totalUpdated = 0;
                let totalSkipped = 0;
                const log = [];

                // Process each sheet
                for (const sheetName of wb.SheetNames) {
                    const ws = wb.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

                    if (rows.length < 2) continue; // Only header

                    // Determine which catalog this is
                    let lsKey, catalogPrefixes;
                    const normalizedName = sheetName.trim().toLowerCase();

                    if (normalizedName.includes('работ') || normalizedName === SHEET_WORKS.toLowerCase()) {
                        lsKey = LS_KEY_WRK;
                        catalogPrefixes = ['AI_WRK_', 'AI_WORK_'];
                    } else if (normalizedName.includes('материал') || normalizedName === SHEET_MATERIALS.toLowerCase()) {
                        lsKey = LS_KEY_MAT;
                        catalogPrefixes = ['AI_MAT_'];
                    } else if (normalizedName.includes('техни') || normalizedName.includes('оборуд') || normalizedName === SHEET_EQUIPMENT.toLowerCase()) {
                        lsKey = LS_KEY_EQ;
                        catalogPrefixes = ['AI_EQ_'];
                    } else {
                        log.push(`⚠️ Лист "${sheetName}" — не распознан, пропущен`);
                        continue;
                    }

                    // Find column indices from header row
                    const header = rows[0].map(h => (h || '').toString().trim().toLowerCase());
                    const idCol = header.findIndex(h => h === 'id');
                    const newPriceCol = header.findIndex(h => h.includes('новая') && h.includes('цена'));

                    if (idCol === -1 || newPriceCol === -1) {
                        log.push(`⚠️ Лист "${sheetName}" — не найдены колонки ID / Новая цена`);
                        continue;
                    }

                    const overrides = getOverrides(lsKey);
                    let sheetUpdated = 0;

                    // Process data rows
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[idCol]) continue;

                        const itemId = row[idCol].toString().trim();
                        const newPriceRaw = row[newPriceCol];

                        // Skip empty "Новая цена" cells
                        if (newPriceRaw === undefined || newPriceRaw === null || newPriceRaw === '') {
                            continue;
                        }

                        const newPrice = parseFloat(newPriceRaw);
                        if (isNaN(newPrice) || newPrice < 0) {
                            totalSkipped++;
                            continue;
                        }

                        // Verify item exists in catalog
                        let found = false;
                        for (const key of Object.keys(window)) {
                            if (!catalogPrefixes.some(p => key.startsWith(p))) continue;
                            const cat = window[key];
                            if (cat && cat[itemId]) {
                                found = true;
                                // Apply override to runtime object
                                cat[itemId].price = newPrice;
                                break;
                            }
                        }

                        if (found) {
                            overrides[itemId] = newPrice;
                            sheetUpdated++;
                        } else {
                            totalSkipped++;
                        }
                    }

                    saveOverrides(lsKey, overrides);
                    totalUpdated += sheetUpdated;
                    log.push(`✅ Лист "${sheetName}": обновлено ${sheetUpdated} цен`);
                }

                // Invalidate WorkRegistry cache
                if (window.WorkRegistry && window.WorkRegistry.invalidateCache) {
                    window.WorkRegistry.invalidateCache();
                }

                // Refresh prices UI
                if (window.PricesCatalog) {
                    window.PricesCatalog.reset();
                    window.PricesCatalog.init();
                }

                // Show result
                const message = log.join('\n') +
                    `\n\n📊 Итого обновлено: ${totalUpdated}` +
                    (totalSkipped > 0 ? `\n⚠️ Пропущено: ${totalSkipped}` : '');

                showImportResult(totalUpdated, totalSkipped, log);
                console.log(`[CatalogExcelIO] Import complete:`, message);

            } catch (err) {
                console.error('[CatalogExcelIO] Import error:', err);
                alert('❌ Ошибка при чтении файла: ' + err.message);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    // ═══════════════════════════════════════════════════════
    // APPLY OVERRIDES ON LOAD
    // ═══════════════════════════════════════════════════════

    /**
     * Apply stored price overrides to runtime catalogs.
     * Called on page load after catalogs are loaded.
     */
    function applyStoredOverrides() {
        const configs = [
            { key: LS_KEY_WRK, prefixes: ['AI_WRK_', 'AI_WORK_'] },
            { key: LS_KEY_MAT, prefixes: ['AI_MAT_'] },
            { key: LS_KEY_EQ,  prefixes: ['AI_EQ_'] },
        ];

        let totalApplied = 0;

        for (const cfg of configs) {
            const overrides = getOverrides(cfg.key);
            const ids = Object.keys(overrides);
            if (!ids.length) continue;

            for (const key of Object.keys(window)) {
                if (!cfg.prefixes.some(p => key.startsWith(p))) continue;
                const cat = window[key];
                if (!cat || typeof cat !== 'object') continue;

                for (const id of ids) {
                    if (cat[id] && typeof cat[id] === 'object') {
                        cat[id].price = overrides[id];
                        totalApplied++;
                    }
                }
            }
        }

        if (totalApplied > 0) {
            console.log(`[CatalogExcelIO] Applied ${totalApplied} stored price overrides`);
            if (window.WorkRegistry && window.WorkRegistry.invalidateCache) {
                window.WorkRegistry.invalidateCache();
            }
        }
    }

    /**
     * Reset all price overrides
     */
    function resetOverrides() {
        if (!confirm('⚠️ Вы уверены? Все пользовательские цены будут сброшены к оригинальным.')) return;

        localStorage.removeItem(LS_KEY_WRK);
        localStorage.removeItem(LS_KEY_MAT);
        localStorage.removeItem(LS_KEY_EQ);

        showToast('🔄 Цены сброшены. Перезагрузите страницу для применения.', 'info');
    }

    /**
     * Get count of active overrides
     */
    function getOverrideStats() {
        const wrk = Object.keys(getOverrides(LS_KEY_WRK)).length;
        const mat = Object.keys(getOverrides(LS_KEY_MAT)).length;
        const eq  = Object.keys(getOverrides(LS_KEY_EQ)).length;
        return { works: wrk, materials: mat, equipment: eq, total: wrk + mat + eq };
    }

    // ═══════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════

    function showToast(msg, type) {
        if (window.QazUI && window.QazUI.toast) {
            window.QazUI.toast(msg, type);
        } else if (window.showToast) {
            window.showToast(msg, type);
        } else {
            console.log(msg);
        }
    }

    function showImportResult(updated, skipped, log) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';

        const total = updated + skipped;
        overlay.innerHTML = `
            <div style="background:#1e1b2e;border:1px solid rgba(139,92,246,.4);border-radius:20px;padding:2rem;max-width:500px;width:90%;color:#f8fafc;box-shadow:0 20px 60px rgba(0,0,0,.5)">
                <div style="text-align:center;margin-bottom:1.5rem">
                    <div style="font-size:3rem;margin-bottom:.5rem">${updated > 0 ? '✅' : '⚠️'}</div>
                    <h3 style="margin:0;font-size:1.3rem">Импорт завершён</h3>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
                    <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:12px;padding:1rem;text-align:center">
                        <div style="font-size:1.8rem;font-weight:800;color:#22c55e">${updated}</div>
                        <div style="font-size:.85rem;color:#94a3b8">Обновлено</div>
                    </div>
                    <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:1rem;text-align:center">
                        <div style="font-size:1.8rem;font-weight:800;color:#f59e0b">${skipped}</div>
                        <div style="font-size:.85rem;color:#94a3b8">Пропущено</div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,.05);border-radius:10px;padding:.75rem 1rem;margin-bottom:1.5rem;font-size:.85rem;max-height:150px;overflow-y:auto;white-space:pre-line;color:#94a3b8">${log.join('\n')}</div>
                <button onclick="this.closest('div[style*=fixed]').remove()" 
                    style="width:100%;padding:.75rem;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer">
                    Закрыть
                </button>
            </div>`;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    /**
     * Render Excel action buttons into a container
     */
    function renderButtons(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stats = getOverrideStats();
        const overrideBadge = stats.total > 0
            ? `<span style="background:#f59e0b;color:#000;font-size:.7rem;padding:2px 6px;border-radius:8px;margin-left:6px;font-weight:700">${stats.total} изм.</span>`
            : '';

        container.innerHTML = `
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;padding:.75rem 0">
                <button onclick="CatalogExcelIO.exportAll()" id="btnExcelExportAll"
                    style="display:flex;align-items:center;gap:.4rem;padding:.5rem 1rem;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:10px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s">
                    📥 Выгрузить Excel
                </button>
                <label id="btnExcelImport"
                    style="display:flex;align-items:center;gap:.4rem;padding:.5rem 1rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;border-radius:10px;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s">
                    📤 Загрузить Excel${overrideBadge}
                    <input type="file" accept=".xlsx,.xls" hidden id="excelImportInput"
                        onchange="CatalogExcelIO.handleFileInput(this)">
                </label>
                ${stats.total > 0 ? `
                <button onclick="CatalogExcelIO.resetOverrides()" id="btnResetPrices"
                    style="display:flex;align-items:center;gap:.4rem;padding:.5rem .75rem;background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:.8rem;cursor:pointer;transition:all .2s"
                    title="Сбросить все пользовательские цены">
                    🔄 Сбросить цены
                </button>` : ''}
            </div>`;
    }

    /**
     * Handle file input change event
     */
    function handleFileInput(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];

        if (!file.name.match(/\.xlsx?$/i)) {
            alert('⚠️ Пожалуйста, загрузите файл формата .xlsx');
            input.value = '';
            return;
        }

        importFromExcel(file);
        input.value = ''; // Reset for re-upload
    }

    // ═══════════════════════════════════════════════════════
    // AUTO-APPLY ON LOAD
    // ═══════════════════════════════════════════════════════
    function init() {
        // Apply stored overrides after catalogs are loaded
        // Delay to ensure AI_WRK_* catalogs are loaded
        setTimeout(applyStoredOverrides, 2000);

        // Also listen for catalog load events
        document.addEventListener('catalogsLoaded', applyStoredOverrides);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ═══════════════════════════════════════════════════════
    // EXPORT API
    // ═══════════════════════════════════════════════════════
    window.CatalogExcelIO = {
        exportAll,
        exportWorks,
        exportMaterials,
        exportEquipment,
        importFromExcel,
        handleFileInput,
        renderButtons,
        resetOverrides,
        getOverrideStats,
        applyStoredOverrides,
    };

    console.log('✅ [CatalogExcelIO] Module loaded — Excel export/import for catalogs');
})();
