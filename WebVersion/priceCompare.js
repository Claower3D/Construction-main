// ========================================
// INSTANT PRICE COMPARE v1.0
// Сравнение цен от разных поставщиков
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. SUPPLIERS DATABASE
    // =============================================

    const SUPPLIERS = {

        lerua: { name: 'Леруа Мерлен', icon: '🟢', color: '#78BE20', delivery: 'Доставка 2-3 дня', rating: 4.5 },
        obi: { name: 'OBI', icon: '🟠', color: '#FF6600', delivery: 'Самовывоз / 3-5 дней', rating: 4.3 },
        alma_stroy: { name: 'Алматы Строй', icon: '🔵', color: '#2563eb', delivery: 'Доставка 1 день', rating: 4.6 },
        bazis: { name: 'Базис Строй', icon: '🟤', color: '#8B4513', delivery: 'Самовывоз', rating: 4.2 },
        stroymag: { name: 'СтройМаг.kz', icon: '🟣', color: '#9333ea', delivery: 'Доставка 1-3 дня', rating: 4.4 }
    };

    // =============================================
    // 2. PRICE DATABASE (multi-supplier)
    // =============================================

    const PRICE_DATA = {
        // === Бетон ===
        'concrete_M200': {
            name: 'Бетон М200',
            unit: 'м³',
            category: 'concrete',
            prices: [
                { supplier: 'alma_stroy', price: 21500, available: true, lastUpdated: '2026-02-10' },
                { supplier: 'bazis', price: 22000, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'stroymag', price: 23500, available: true, lastUpdated: '2026-02-08' }
            ]
        },
        'concrete_M300': {
            name: 'Бетон М300',
            unit: 'м³',
            category: 'concrete',
            prices: [
                { supplier: 'alma_stroy', price: 26000, available: true, lastUpdated: '2026-02-10' },
                { supplier: 'bazis', price: 27500, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'stroymag', price: 28000, available: false, lastUpdated: '2026-02-05' }
            ]
        },
        // === Кирпич ===
        'brick_red_M150': {
            name: 'Кирпич красный М150',
            unit: 'шт',
            category: 'masonry',
            prices: [

                { supplier: 'lerua', price: 20, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'obi', price: 22, available: true, lastUpdated: '2026-02-11' },
                { supplier: 'alma_stroy', price: 17, available: true, lastUpdated: '2026-02-10' }
            ]
        },
        'brick_white': {
            name: 'Кирпич белый силикатный',
            unit: 'шт',
            category: 'masonry',
            prices: [

                { supplier: 'lerua', price: 25, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'alma_stroy', price: 21, available: true, lastUpdated: '2026-02-10' }
            ]
        },
        // === Блоки ===
        'gasblock_400': {
            name: 'Газоблок 400мм',
            unit: 'шт',
            category: 'masonry',
            prices: [

                { supplier: 'lerua', price: 480, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'obi', price: 500, available: true, lastUpdated: '2026-02-10' },
                { supplier: 'alma_stroy', price: 420, available: true, lastUpdated: '2026-02-11' },
                { supplier: 'bazis', price: 440, available: true, lastUpdated: '2026-02-09' }
            ]
        },
        // === Арматура ===
        'rebar_d12': {
            name: 'Арматура d12 A500C',
            unit: 'кг',
            category: 'rebar',
            prices: [
                { supplier: 'alma_stroy', price: 380, available: true, lastUpdated: '2026-02-14' },
                { supplier: 'bazis', price: 370, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'stroymag', price: 395, available: true, lastUpdated: '2026-02-10' }
            ]
        },
        'rebar_d16': {
            name: 'Арматура d16 A500C',
            unit: 'кг',
            category: 'rebar',
            prices: [
                { supplier: 'alma_stroy', price: 390, available: true, lastUpdated: '2026-02-14' },
                { supplier: 'bazis', price: 385, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'stroymag', price: 410, available: true, lastUpdated: '2026-02-08' }
            ]
        },
        // === Песок и щебень ===
        'sand_career': {
            name: 'Песок карьерный',
            unit: 'м³',
            category: 'aggregates',
            prices: [
                { supplier: 'alma_stroy', price: 3500, available: true, lastUpdated: '2026-02-14' },
                { supplier: 'bazis', price: 3200, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'stroymag', price: 3800, available: true, lastUpdated: '2026-02-10' }
            ]
        },
        'crushed_stone_20_40': {
            name: 'Щебень фр. 20-40',
            unit: 'м³',
            category: 'aggregates',
            prices: [
                { supplier: 'alma_stroy', price: 5500, available: true, lastUpdated: '2026-02-14' },
                { supplier: 'bazis', price: 5200, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'stroymag', price: 5800, available: true, lastUpdated: '2026-02-09' }
            ]
        },
        // === Цемент ===
        'cement_M500': {
            name: 'Цемент М500 50кг',
            unit: 'мешок',
            category: 'concrete',
            prices: [

                { supplier: 'lerua', price: 2400, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'obi', price: 2350, available: true, lastUpdated: '2026-02-11' },
                { supplier: 'alma_stroy', price: 2100, available: true, lastUpdated: '2026-02-10' },
                { supplier: 'bazis', price: 2150, available: true, lastUpdated: '2026-02-12' }
            ]
        },
        // === Утеплитель ===
        'penoplex_50': {
            name: 'Пеноплекс 50мм',
            unit: 'м²',
            category: 'insulation',
            prices: [

                { supplier: 'lerua', price: 920, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'obi', price: 880, available: true, lastUpdated: '2026-02-11' }
            ]
        },
        'minwool_100': {
            name: 'Минвата 100мм Knauf',
            unit: 'м²',
            category: 'insulation',
            prices: [

                { supplier: 'lerua', price: 550, available: true, lastUpdated: '2026-02-13' },
                { supplier: 'obi', price: 580, available: true, lastUpdated: '2026-02-10' }
            ]
        },
        // === Гидроизоляция ===
        'bitum_membrane': {
            name: 'Мембрана битумная',
            unit: 'м²',
            category: 'insulation',
            prices: [
                { supplier: 'lerua', price: 350, available: true, lastUpdated: '2026-02-12' },
                { supplier: 'obi', price: 380, available: true, lastUpdated: '2026-02-10' },
                { supplier: 'stroymag', price: 320, available: true, lastUpdated: '2026-02-08' }
            ]
        }
    };

    // =============================================
    // 3. UTILITIES
    // =============================================

    function _formatPrice(price) {
        return new Intl.NumberFormat('ru-KZ').format(price) + ' ₸';
    }

    function _formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' });
    }

    function _getSavingsPercent(cheapest, expensive) {
        return Math.round(((expensive - cheapest) / expensive) * 100);
    }

    // =============================================
    // 4. COMPARE API
    // =============================================

    function comparePrices(materialCode) {
        const item = PRICE_DATA[materialCode];
        if (!item) return null;

        const sorted = [...item.prices]
            .filter(p => p.available)
            .sort((a, b) => a.price - b.price);

        if (sorted.length === 0) return null;

        const cheapest = sorted[0];
        const mostExpensive = sorted[sorted.length - 1];
        const avgPrice = Math.round(sorted.reduce((s, p) => s + p.price, 0) / sorted.length);

        return {
            material: item.name,
            unit: item.unit,
            category: item.category,
            cheapest: { ...cheapest, supplier: SUPPLIERS[cheapest.supplier] },
            mostExpensive: { ...mostExpensive, supplier: SUPPLIERS[mostExpensive.supplier] },
            avgPrice,
            savings: _getSavingsPercent(cheapest.price, mostExpensive.price),
            allPrices: sorted.map(p => ({
                ...p,
                supplier: SUPPLIERS[p.supplier],
                isCheapest: p.price === cheapest.price
            }))
        };
    }

    function searchMaterials(query) {
        if (!query || query.length < 2) return Object.keys(PRICE_DATA);

        const lq = query.toLowerCase();
        return Object.entries(PRICE_DATA)
            .filter(([_, item]) => item.name.toLowerCase().includes(lq) || item.category.includes(lq))
            .map(([code]) => code);
    }

    function getAllCategories() {
        const cats = new Set();
        Object.values(PRICE_DATA).forEach(item => cats.add(item.category));
        return Array.from(cats);
    }

    function getMaterialsByCategory(category) {
        return Object.entries(PRICE_DATA)
            .filter(([_, item]) => item.category === category)
            .map(([code, item]) => ({ code, ...item }));
    }

    // =============================================
    // 5. RENDER — COMPARE CARD
    // =============================================

    function renderCompareCard(container, materialCode) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const result = comparePrices(materialCode);
        if (!result) {
            el.innerHTML = '<div class="pc-empty">Материал не найден</div>';
            return;
        }

        el.innerHTML = `
            <div class="pc-card">
                <div class="pc-card-header">
                    <div>
                        <h3 class="pc-material-name">${result.material}</h3>
                        <span class="pc-material-unit">за ${result.unit}</span>
                    </div>
                    ${result.savings > 0 ? `
                        <span class="pc-savings-badge">Экономия до ${result.savings}%</span>
                    ` : ''}
                </div>

                <div class="pc-prices-grid">
                    ${result.allPrices.map(p => `
                        <div class="pc-price-row ${p.isCheapest ? 'cheapest' : ''}">
                            <div class="pc-supplier">
                                <span class="pc-supplier-icon">${p.supplier.icon}</span>
                                <div class="pc-supplier-info">
                                    <span class="pc-supplier-name">${p.supplier.name}</span>
                                    <span class="pc-supplier-delivery">${p.supplier.delivery}</span>
                                </div>
                            </div>
                            <div class="pc-price-info">
                                <span class="pc-price ${p.isCheapest ? 'best' : ''}">${_formatPrice(p.price)}</span>
                                ${p.isCheapest ? '<span class="pc-best-label">Лучшая цена</span>' : ''}
                            </div>
                            <div class="pc-rating">⭐ ${p.supplier.rating}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="pc-card-footer">
                    <div class="pc-avg">
                        <span class="pc-avg-label">Средняя цена:</span>
                        <span class="pc-avg-value">${_formatPrice(result.avgPrice)}</span>
                    </div>
                    <span class="pc-updated">Обновлено: ${_formatDate(result.cheapest.lastUpdated)}</span>
                </div>
            </div>
        `;
    }

    // =============================================
    // 6. RENDER — FULL COMPARE PAGE
    // =============================================

    let _currentCategory = 'all';
    let _searchQuery = '';

    function renderComparePage(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const categories = getAllCategories();
        const categoryLabels = {
            concrete: '🏗️ Бетон и цемент',
            masonry: '🧱 Кладочные',
            rebar: '⚒️ Арматура',
            aggregates: '🪨 Песок и щебень',
            insulation: '🧊 Утеплитель и гидро'
        };

        let materialCodes = _currentCategory === 'all'
            ? Object.keys(PRICE_DATA)
            : Object.entries(PRICE_DATA).filter(([_, item]) => item.category === _currentCategory).map(([code]) => code);

        if (_searchQuery) {
            const lq = _searchQuery.toLowerCase();
            materialCodes = materialCodes.filter(code => PRICE_DATA[code].name.toLowerCase().includes(lq));
        }

        el.innerHTML = `
            <div class="pc-page">
                <div class="pc-page-header">
                    <h2>💰 Сравнение цен</h2>
                    <p class="pc-page-subtitle">Актуальные цены от ${Object.keys(SUPPLIERS).length} поставщиков Казахстана</p>
                </div>

                <div class="pc-controls">
                    <div class="pc-search">
                        <input type="text" placeholder="🔍 Поиск материала..." class="pc-search-input"
                            value="${_searchQuery}"
                            oninput="window.PriceCompare._onSearch(this.value)">
                    </div>
                    <div class="pc-categories">
                        <button class="pc-cat-btn ${_currentCategory === 'all' ? 'active' : ''}"
                            onclick="window.PriceCompare.setCategory('all')">Все</button>
                        ${categories.map(cat => `
                            <button class="pc-cat-btn ${_currentCategory === cat ? 'active' : ''}"
                                onclick="window.PriceCompare.setCategory('${cat}')">
                                ${categoryLabels[cat] || cat}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="pc-suppliers-banner">
                    ${Object.values(SUPPLIERS).map(s => `
                        <div class="pc-supplier-chip">
                            <span>${s.icon}</span>
                            <span>${s.name}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="pc-grid">
                    ${materialCodes.map(code => {
            const item = PRICE_DATA[code];
            const sorted = [...item.prices].filter(p => p.available).sort((a, b) => a.price - b.price);
            const cheapest = sorted[0];
            const expensive = sorted[sorted.length - 1];
            const savings = cheapest && expensive ? _getSavingsPercent(cheapest.price, expensive.price) : 0;
            return `
                            <div class="pc-grid-card" onclick="window.PriceCompare._showDetail('${code}')">
                                <div class="pc-grid-card-header">
                                    <h4>${item.name}</h4>
                                    ${savings > 5 ? `<span class="pc-savings-mini">-${savings}%</span>` : ''}
                                </div>
                                <div class="pc-grid-card-price">
                                    <span class="pc-grid-card-from">от</span>
                                    <span class="pc-grid-card-amount">${cheapest ? _formatPrice(cheapest.price) : '—'}</span>
                                    <span class="pc-grid-card-unit">/ ${item.unit}</span>
                                </div>
                                <div class="pc-grid-card-suppliers">
                                    ${sorted.slice(0, 3).map(p => `
                                        <span class="pc-grid-supplier-dot" style="background:${SUPPLIERS[p.supplier]?.color}"
                                            title="${SUPPLIERS[p.supplier]?.name}"></span>
                                    `).join('')}
                                    <span class="pc-grid-card-count">${sorted.length} предложений</span>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>

                ${materialCodes.length === 0 ? '<div class="pc-empty-search">🔍 Ничего не найдено</div>' : ''}

                <!-- Detail modal placeholder -->
                <div id="pc-detail-modal"></div>
            </div>
        `;
    }

    function _showDetail(materialCode) {
        const modal = document.getElementById('pc-detail-modal');
        if (!modal) return;

        const result = comparePrices(materialCode);
        if (!result) return;

        const overlay = document.createElement('div');
        overlay.className = 'pc-modal-overlay';
        overlay.innerHTML = `
            <div class="pc-modal">
                <div class="pc-modal-header">
                    <h3>${result.material}</h3>
                    <button class="pc-modal-close" onclick="this.closest('.pc-modal-overlay').remove()">✕</button>
                </div>
                <div class="pc-modal-body">
                    ${result.allPrices.map(p => `
                        <div class="pc-detail-row ${p.isCheapest ? 'cheapest' : ''}">
                            <div class="pc-detail-supplier">
                                <span class="pc-detail-icon">${p.supplier.icon}</span>
                                <div>
                                    <div class="pc-detail-name">${p.supplier.name}</div>
                                    <div class="pc-detail-delivery">${p.supplier.delivery}</div>
                                </div>
                            </div>
                            <div class="pc-detail-price-col">
                                <span class="pc-detail-price">${_formatPrice(p.price)}<span class="pc-detail-unit">/${result.unit}</span></span>
                                <span class="pc-detail-rating">⭐ ${p.supplier.rating}</span>
                            </div>
                            ${p.isCheapest ? '<div class="pc-detail-best">👑 ЛУЧШАЯ ЦЕНА</div>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="pc-modal-footer">
                    <div class="pc-detail-summary">
                        <span>Средняя: ${_formatPrice(result.avgPrice)}</span>
                        ${result.savings > 0 ? `<span class="pc-detail-savings">Экономия до ${result.savings}%</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    // =============================================
    // 7. CONTROLS
    // =============================================

    let _pageContainer = null;

    function _onSearch(query) {
        _searchQuery = query;
        if (_pageContainer) renderComparePage(_pageContainer);
    }

    function setCategory(cat) {
        _currentCategory = cat;
        if (_pageContainer) renderComparePage(_pageContainer);
    }

    function open(container) {
        _pageContainer = typeof container === 'string' ? document.getElementById(container) : container;
        renderComparePage(_pageContainer);
    }

    // =============================================
    // 8. INLINE WIDGET (for estimate result)
    // =============================================

    function renderEstimateWidget(container, materialCodes) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const results = materialCodes
            .map(code => ({ code, ...(comparePrices(code) || {}) }))
            .filter(r => r.cheapest);

        if (results.length === 0) {
            el.innerHTML = '';
            return;
        }

        const totalSavings = results.reduce((sum, r) => sum + (r.savings || 0), 0);
        const avgSavings = Math.round(totalSavings / results.length);

        el.innerHTML = `
            <div class="pc-widget">
                <div class="pc-widget-header">
                    <span>💰 Сравните цены</span>
                    ${avgSavings > 0 ? `<span class="pc-widget-savings">Экономия до ${avgSavings}%</span>` : ''}
                </div>
                <div class="pc-widget-items">
                    ${results.slice(0, 5).map(r => `
                        <div class="pc-widget-item" onclick="window.PriceCompare._showDetail('${r.code}')">
                            <span class="pc-widget-name">${r.material}</span>
                            <span class="pc-widget-price">от ${_formatPrice(r.cheapest.price)}/${r.unit}</span>
                        </div>
                    `).join('')}
                </div>
                ${results.length > 5 ? `<a class="pc-widget-more" href="#" onclick="event.preventDefault();">Ещё ${results.length - 5} материалов →</a>` : ''}
            </div>
        `;
    }

    // =============================================
    // 9. EXPORT
    // =============================================

    window.PriceCompare = {
        // API
        comparePrices,
        searchMaterials,
        getAllCategories,
        getMaterialsByCategory,

        // Renderers
        renderCompareCard,
        renderComparePage,
        renderEstimateWidget,
        open,

        // Controls
        setCategory,
        _onSearch,
        _showDetail,

        // Data access
        SUPPLIERS,
        PRICE_DATA
    };

    console.log('[PriceCompare] ✅ Instant Price Compare v1.0 loaded');

})();
