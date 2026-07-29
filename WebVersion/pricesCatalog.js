// ================================================================
// PRICES CATALOG MODULE — Standalone page with slide navigation
// Uses WorkRegistry for data (12 754+ works, 29 categories)
// ================================================================
(function () {
    'use strict';

    // ─── State ───
    let _activeGroup = null;
    let _searchQuery = '';
    let _page = 1;
    let _searchTimer = null;
    let _initialized = false;
    const PAGE_SIZE = 40;

    // ─── Helpers ───
    function esc(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function fmt(n) {
        return Math.round(n).toLocaleString('ru-RU');
    }

    function getRegistry() {
        return window.WorkRegistry || null;
    }

    // ─── Init (called when page-prices becomes active) ───
    function init() {
        if (_initialized) return;
        const reg = getRegistry();
        if (!reg) {
            setTimeout(init, 500);
            return;
        }

        _initialized = true;
        renderCategories();
        bindGlobalSearch();

        // Render Excel export/import buttons
        if (window.CatalogExcelIO) {
            CatalogExcelIO.renderButtons('pricesExcelButtons');
        }

        // Update stats
        const stats = reg.getStats();
        const badge = document.getElementById('pricesStatsBadge');
        if (badge) badge.textContent = `${fmt(stats.works)} работ • ${stats.categories} категорий`;

        console.log('[PricesCatalog] Initialized');
    }

    // Reset when navigating away
    function reset() {
        _activeGroup = null;
        _searchQuery = '';
        _page = 1;
        _initialized = false;
        const slides = document.getElementById('pricesSlides');
        if (slides) slides.classList.remove('show-works');
    }

    // ─── Slide 1: Category cards ───
    function renderCategories() {
        const container = document.getElementById('pricesCatGrid');
        if (!container) return;

        const reg = getRegistry();
        if (!reg) {
            container.innerHTML = '<div class="prices-empty"><span class="prices-empty-icon">📦</span>Загрузка каталога...</div>';
            return;
        }

        const cats = reg.getCategories();
        if (!cats.length) {
            container.innerHTML = '<div class="prices-empty"><span class="prices-empty-icon">🔍</span>Каталог пуст</div>';
            return;
        }

        container.innerHTML = cats.map(cat => {
            const colorRaw = cat.color || '#8b5cf6';
            return `
                <div class="prices-category-card"
                     style="--cat-color: ${colorRaw}22; --cat-color-border: ${colorRaw}44"
                     onclick="PricesCatalog.openCategory('${cat.key}')"
                     id="pricesCat_${cat.key}">
                    <span class="prices-cat-icon">${cat.icon}</span>
                    <div class="prices-cat-name">${esc(cat.name)}</div>
                    <div class="prices-cat-count"><b>${cat.workCount}</b> работ</div>
                </div>
            `;
        }).join('');
    }

    // ─── Open a category (slide to works) ───
    function openCategory(groupKey) {
        _activeGroup = groupKey;
        _searchQuery = '';
        _page = 1;

        const reg = getRegistry();
        if (!reg) return;

        // Find category meta
        const cats = reg.getCategories();
        const cat = cats.find(c => c.key === groupKey);

        // Update works header
        const titleEl = document.getElementById('pricesWorksTitle');
        if (titleEl && cat) {
            titleEl.innerHTML = `<span>${cat.icon}</span> ${esc(cat.name)}`;
        }

        const countBadge = document.getElementById('pricesWorksCountBadge');
        if (countBadge && cat) {
            countBadge.textContent = `${cat.workCount} работ`;
        }

        // Clear search
        const searchInput = document.getElementById('pricesWorksSearch');
        if (searchInput) searchInput.value = '';

        // Render works
        renderWorks();

        // Slide animation
        const slides = document.getElementById('pricesSlides');
        if (slides) slides.classList.add('show-works');

        // Bind works search
        bindWorksSearch();
    }

    // ─── Go back to categories ───
    function goBack() {
        _activeGroup = null;
        _searchQuery = '';
        _page = 1;

        const slides = document.getElementById('pricesSlides');
        if (slides) slides.classList.remove('show-works');
    }

    // ─── Render works for active group ───
    function renderWorks() {
        const listEl = document.getElementById('pricesWorksList');
        const paginEl = document.getElementById('pricesPagination');
        if (!listEl) return;

        const reg = getRegistry();
        if (!reg) {
            listEl.innerHTML = '<div class="prices-empty">Каталог загружается...</div>';
            return;
        }

        let works;
        if (_searchQuery && _searchQuery.length >= 2) {
            // Search within active group
            const allInGroup = reg.getWorksByGroup(_activeGroup);
            const q = _searchQuery.toLowerCase();
            works = allInGroup.filter(w => w.name.toLowerCase().includes(q));
        } else {
            works = reg.getWorksByGroup(_activeGroup);
        }

        const total = works.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        _page = Math.min(_page, totalPages);
        const start = (_page - 1) * PAGE_SIZE;
        const slice = works.slice(start, start + PAGE_SIZE);

        if (!slice.length) {
            listEl.innerHTML = '<div class="prices-empty">' +
                (_searchQuery ? `<span class="prices-empty-icon">🔍</span>Ничего не найдено по запросу «${esc(_searchQuery)}»`
                    : '<span class="prices-empty-icon">📦</span>Нет данных') +
                '</div>';
            if (paginEl) paginEl.innerHTML = '';
            return;
        }

        // Results info
        let html = `<div class="prices-results-info">
            <span>Найдено: <b style="color:#fff">${fmt(total)}</b> работ</span>
            ${totalPages > 1 ? `<span>Стр. ${_page} / ${totalPages}</span>` : ''}
        </div>`;

        // Group by rawCategory for accordion
        if (_searchQuery) {
            html += slice.map(w => renderRow(w)).join('');
        } else {
            const groups = {};
            slice.forEach(w => {
                const cat = w.rawCategory || 'other';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(w);
            });

            Object.entries(groups).forEach(([cat, items]) => {
                const displayName = cat.replace(/_/g, ' ');
                html += `<details class="prices-section" open>
                    <summary class="prices-section-header">
                        <span>
                            <span class="prices-section-name">${esc(displayName)}</span>
                            <span class="prices-section-count"> · ${items.length} работ</span>
                        </span>
                        <span class="prices-section-chevron">▶</span>
                    </summary>
                    <div>${items.map(w => renderRow(w)).join('')}</div>
                </details>`;
            });
        }

        listEl.innerHTML = html;

        // Pagination
        if (paginEl) {
            if (totalPages <= 1) {
                paginEl.innerHTML = '';
            } else {
                let btns = '';
                if (_page > 1) btns += pgBtn(_page - 1, '◀');
                const lo = Math.max(1, _page - 2);
                const hi = Math.min(totalPages, _page + 2);
                if (lo > 1) { btns += pgBtn(1); if (lo > 2) btns += '<span class="prices-page-dots">…</span>'; }
                for (let p = lo; p <= hi; p++) btns += pgBtn(p, p, p === _page);
                if (hi < totalPages) { if (hi < totalPages - 1) btns += '<span class="prices-page-dots">…</span>'; btns += pgBtn(totalPages); }
                if (_page < totalPages) btns += pgBtn(_page + 1, '▶');
                paginEl.innerHTML = btns;
            }
        }
    }

    function renderRow(w) {
        const priceStr = w.price ? fmt(w.price) + '\u00a0₸' : '—';
        const priceClass = w.price ? 'prices-work-price' : 'prices-work-price no-price';
        // Check if this item has a price override
        const overrides = (function () {
            try { return JSON.parse(localStorage.getItem('PRICE_OVERRIDES_WRK') || '{}'); } catch { return {}; }
        })();
        const isOverridden = overrides[w.id] !== undefined;
        const overrideStyle = isOverridden ? 'color:#22c55e;font-weight:700' : '';
        const overrideBadge = isOverridden ? '<span style="font-size:.65rem;background:rgba(34,197,94,.15);color:#22c55e;padding:1px 5px;border-radius:4px;margin-left:4px">✎</span>' : '';
        return `<div class="prices-work-row">
            <span class="prices-work-name" title="${esc(w.name)}">${esc(w.name)}</span>
            <span class="prices-work-unit">${esc(w.unit || '—')}</span>
            <span class="${priceClass}" style="${overrideStyle}">${priceStr}${overrideBadge}</span>
        </div>`;
    }

    function pgBtn(page, label, active) {
        label = label || page;
        return `<button class="prices-page-btn${active ? ' active' : ''}"
            onclick="PricesCatalog.setPage(${page})">${label}</button>`;
    }

    function setPage(p) {
        _page = Math.max(1, parseInt(p) || 1);
        renderWorks();
        const el = document.getElementById('pricesWorksList');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Global search (across all works) ───
    function bindGlobalSearch() {
        const input = document.getElementById('pricesGlobalSearch');
        if (!input) return;

        input.addEventListener('input', () => {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(() => {
                const q = input.value.trim();
                if (q.length >= 2) {
                    searchGlobal(q);
                } else if (q.length === 0) {
                    renderCategories();
                    // hide works slide
                    const slides = document.getElementById('pricesSlides');
                    if (slides) slides.classList.remove('show-works');
                }
            }, 300);
        });
    }

    function searchGlobal(query) {
        const reg = getRegistry();
        if (!reg) return;

        const results = reg.search(query);
        if (!results.length) {
            const grid = document.getElementById('pricesCatGrid');
            if (grid) grid.innerHTML = `<div class="prices-empty"><span class="prices-empty-icon">🔍</span>Ничего не найдено по запросу «${esc(query)}»</div>`;
            return;
        }

        // Group results by category and show as cards with counts
        const groupCounts = {};
        results.forEach(w => {
            groupCounts[w.group] = (groupCounts[w.group] || 0) + 1;
        });

        const cats = reg.getCategories().filter(c => groupCounts[c.key]);
        const grid = document.getElementById('pricesCatGrid');
        if (!grid) return;

        grid.innerHTML = `<div style="grid-column:1/-1;font-size:13px;color:rgba(255,255,255,.5);padding:4px 0">
            Найдено <b style="color:#fff">${results.length}</b> работ в ${cats.length} категориях по запросу «${esc(query)}»
        </div>` + cats.map(cat => {
            const colorRaw = cat.color || '#8b5cf6';
            const matchCount = groupCounts[cat.key] || 0;
            return `
                <div class="prices-category-card"
                     style="--cat-color: ${colorRaw}22; --cat-color-border: ${colorRaw}44"
                     onclick="PricesCatalog.openCategory('${cat.key}')"
                     id="pricesCat_${cat.key}">
                    <span class="prices-cat-icon">${cat.icon}</span>
                    <div class="prices-cat-name">${esc(cat.name)}</div>
                    <div class="prices-cat-count"><b>${matchCount}</b> совпадений</div>
                </div>
            `;
        }).join('');
    }

    // ─── Works search (within group) ───
    function bindWorksSearch() {
        const input = document.getElementById('pricesWorksSearch');
        if (!input) return;

        // Remove old listener by replacing
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        newInput.addEventListener('input', () => {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(() => {
                _searchQuery = newInput.value.trim();
                _page = 1;
                renderWorks();
            }, 300);
        });
    }

    // ─── Page lifecycle ───
    // Listen for page navigation
    function onPageShown(pageName) {
        if (pageName === 'prices') {
            init();
        } else {
            // Optional: reset state when leaving
        }
    }

    // Hook into showPage if available
    const origShowPage = window.showPage;
    if (typeof origShowPage === 'function') {
        window.showPage = function (page) {
            origShowPage.call(this, page);
            onPageShown(page);
        };
    }

    // Also init if page is already active
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const el = document.getElementById('page-prices');
                if (el && el.classList.contains('active')) init();
            }, 600);
        });
    }

    // ─── Export ───
    const PricesCatalog = {
        init,
        reset,
        openCategory,
        goBack,
        setPage,
        onPageShown,
    };

    window.PricesCatalog = PricesCatalog;

})();
