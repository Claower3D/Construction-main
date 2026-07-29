// ========== PRICE SEARCH WIDGET v1.0 ==========
// Компонент поиска по базе данных цен (23,864 позиции)
// Работает через AIService.searchPrices() → backend API
// Fallback на локальные AI_WRK_, AI_MAT_ каталоги
// =================================================

(function () {
    'use strict';

    let _overlay = null;
    let _searchTimeout = null;
    let _results = [];
    let _selectedIndex = -1;
    let _onSelect = null;
    let _filterType = 'all'; // 'all' | 'works' | 'materials' | 'equipment'

    // ─── Styles ──────────────────────────────────────────
    const STYLES = `
    .psw-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 8vh;
        animation: pswFadeIn 0.2s ease;
    }
    @keyframes pswFadeIn { from { opacity:0 } to { opacity:1 } }
    .psw-container {
        width: 90%; max-width: 680px;
        background: linear-gradient(135deg, #1a1d2e 0%, #141622 100%);
        border: 1px solid rgba(139,92,246,0.25);
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1);
        overflow: hidden;
        animation: pswSlideUp 0.25s ease;
    }
    @keyframes pswSlideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
    .psw-header {
        padding: 1.25rem 1.5rem 0.75rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .psw-title {
        font-size: 1.05rem; font-weight: 700; color: #fff;
        display: flex; align-items: center; gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    .psw-input-wrap {
        position: relative;
    }
    .psw-input {
        width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 10px; color: #fff; font-size: 0.95rem;
        outline: none; transition: border-color 0.2s;
        box-sizing: border-box;
    }
    .psw-input:focus {
        border-color: rgba(139,92,246,0.5);
        box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
    }
    .psw-input::placeholder { color: rgba(255,255,255,0.3); }
    .psw-search-icon {
        position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
        font-size: 1.05rem; opacity: 0.4;
    }
    .psw-filters {
        display: flex; gap: 0.35rem; padding: 0.5rem 1.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .psw-filter-btn {
        padding: 0.3rem 0.7rem; border-radius: 6px; border: none;
        font-size: 0.78rem; cursor: pointer; transition: all 0.15s;
        background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.45);
    }
    .psw-filter-btn.active {
        background: rgba(139,92,246,0.25); color: #fff; font-weight: 600;
    }
    .psw-filter-btn:hover:not(.active) {
        background: rgba(255,255,255,0.08);
    }
    .psw-results {
        max-height: 45vh; overflow-y: auto; padding: 0.25rem 0;
    }
    .psw-results::-webkit-scrollbar { width: 5px; }
    .psw-results::-webkit-scrollbar-track { background: transparent; }
    .psw-results::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
    .psw-item {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.6rem 1.5rem; cursor: pointer;
        transition: background 0.12s;
    }
    .psw-item:hover, .psw-item.selected {
        background: rgba(139,92,246,0.12);
    }
    .psw-item-icon {
        font-size: 1.2rem; min-width: 28px; text-align: center;
    }
    .psw-item-info { flex: 1; overflow: hidden; }
    .psw-item-name {
        font-size: 0.88rem; color: #fff; font-weight: 500;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .psw-item-meta {
        font-size: 0.72rem; color: rgba(255,255,255,0.35);
        display: flex; gap: 0.75rem; margin-top: 0.15rem;
    }
    .psw-item-price {
        font-weight: 700; font-size: 0.9rem; white-space: nowrap;
        min-width: 80px; text-align: right;
    }
    .psw-item-price.work { color: #22c55e; }
    .psw-item-price.material { color: #60a5fa; }
    .psw-item-price.equipment { color: #f59e0b; }
    .psw-badge {
        display: inline-block; font-size: 0.6rem; padding: 0.08rem 0.35rem;
        border-radius: 3px; font-weight: 500;
    }
    .psw-badge.work { background: rgba(34,197,94,0.12); color: #22c55e; }
    .psw-badge.material { background: rgba(59,130,246,0.12); color: #60a5fa; }
    .psw-badge.equipment { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .psw-empty {
        padding: 2.5rem 1.5rem; text-align: center;
        color: rgba(255,255,255,0.25); font-size: 0.9rem;
    }
    .psw-empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .psw-loading {
        padding: 2rem 1.5rem; text-align: center;
        color: rgba(255,255,255,0.3); font-size: 0.85rem;
    }
    .psw-footer {
        padding: 0.6rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.06);
        display: flex; justify-content: space-between; align-items: center;
        font-size: 0.72rem; color: rgba(255,255,255,0.25);
    }
    .psw-footer kbd {
        padding: 0.1rem 0.35rem; border: 1px solid rgba(255,255,255,0.1);
        border-radius: 3px; font-size: 0.65rem; background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.35);
    }
    `;

    function _injectStyles() {
        if (document.getElementById('psw-styles')) return;
        const style = document.createElement('style');
        style.id = 'psw-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    // ─── Local Fallback Search ───────────────────────────
    function _searchLocal(query, type, limit) {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        const results = [];

        const scanPrefix = (prefix, itemType) => {
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const catalog = window[key];
                if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
                for (const [code, item] of Object.entries(catalog)) {
                    if (!item || !item.name) continue;
                    const name = item.name.toLowerCase();
                    const codeL = code.toLowerCase();
                    if (name.includes(q) || codeL.includes(q)) {
                        // Simple scoring
                        let score = 0;
                        if (name.startsWith(q)) score = 1.0;
                        else if (name.includes(q)) score = 0.7;
                        else score = 0.4;
                        results.push({
                            code, name: item.name, unit: item.unit || '—',
                            price: item.price || 0, type: itemType,
                            category: item.category || '', score,
                            source: 'local'
                        });
                    }
                }
            }
        };

        if (type === 'all' || type === 'works') {
            scanPrefix('AI_WRK_', 'work');
            scanPrefix('AI_WORK_', 'work');
        }
        if (type === 'all' || type === 'materials') {
            scanPrefix('AI_MAT_', 'material');
        }
        if (type === 'all' || type === 'equipment') {
            scanPrefix('AI_EQ_', 'equipment');
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    // ─── Search (API + fallback) ─────────────────────────
    async function _search(query) {
        const inputEl = _overlay?.querySelector('.psw-input');
        const resultsEl = _overlay?.querySelector('.psw-results');
        if (!resultsEl) return;

        const q = (query || '').trim();
        if (q.length < 2) {
            _results = [];
            resultsEl.innerHTML = `
                <div class="psw-empty">
                    <div class="psw-empty-icon">🔍</div>
                    Введите минимум 2 символа для поиска
                </div>`;
            return;
        }

        resultsEl.innerHTML = `<div class="psw-loading">⏳ Поиск «${q}»...</div>`;

        try {
            // Try backend first
            let items = [];
            if (window.AIService && window.AIService.searchPrices) {
                items = await window.AIService.searchPrices(q, _filterType, 30);
            }

            // Fallback to local
            if (!items || items.length === 0) {
                items = _searchLocal(q, _filterType, 30);
            }

            _results = items;
            _selectedIndex = -1;
            _renderResults();
        } catch {
            _results = _searchLocal(q, _filterType, 30);
            _selectedIndex = -1;
            _renderResults();
        }
    }

    function _renderResults() {
        const resultsEl = _overlay?.querySelector('.psw-results');
        if (!resultsEl) return;

        if (_results.length === 0) {
            resultsEl.innerHTML = `
                <div class="psw-empty">
                    <div class="psw-empty-icon">📭</div>
                    Ничего не найдено
                    <div style="font-size:0.78rem;margin-top:0.3rem;opacity:0.5">Попробуйте другой запрос</div>
                </div>`;
            return;
        }

        resultsEl.innerHTML = _results.map((item, idx) => {
            const typeClass = item.type === 'work' ? 'work' :
                item.type === 'material' ? 'material' : 'equipment';
            const typeLabel = item.type === 'work' ? 'Работа' :
                item.type === 'material' ? 'Материал' : 'Техника';
            const typeIcon = item.type === 'work' ? '🔧' :
                item.type === 'material' ? '🧱' : '🚜';
            const priceFmt = item.price
                ? item.price.toLocaleString('ru-RU') + ' ₸'
                : '—';

            return `
                <div class="psw-item ${idx === _selectedIndex ? 'selected' : ''}"
                     data-idx="${idx}"
                     onclick="PriceSearchWidget._selectItem(${idx})">
                    <div class="psw-item-icon">${typeIcon}</div>
                    <div class="psw-item-info">
                        <div class="psw-item-name">${_esc(item.name)}</div>
                        <div class="psw-item-meta">
                            <span class="psw-badge ${typeClass}">${typeLabel}</span>
                            <span>${item.unit || '—'}</span>
                            ${item.code ? `<span style="opacity:0.5">${item.code}</span>` : ''}
                            ${item.source === 'local' ? '<span style="color:#f59e0b">📌 локальная</span>' : '<span style="color:#22c55e">🗄️ БД</span>'}
                        </div>
                    </div>
                    <div class="psw-item-price ${typeClass}">${priceFmt}</div>
                </div>`;
        }).join('');
    }

    function _esc(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ─── Open / Close ────────────────────────────────────
    function open(options = {}) {
        _injectStyles();
        _onSelect = options.onSelect || null;
        _filterType = options.type || 'all';
        _results = [];
        _selectedIndex = -1;

        _overlay = document.createElement('div');
        _overlay.className = 'psw-overlay';
        _overlay.onclick = (e) => { if (e.target === _overlay) close(); };

        _overlay.innerHTML = `
            <div class="psw-container">
                <div class="psw-header">
                    <div class="psw-title">
                        🔍 Поиск по базе данных цен
                        <span style="font-size:0.72rem;color:rgba(255,255,255,0.3);font-weight:400;margin-left:auto">
                            ~23,864 позиции
                        </span>
                    </div>
                    <div class="psw-input-wrap">
                        <span class="psw-search-icon">🔎</span>
                        <input class="psw-input" type="text"
                            placeholder="Бетон, арматура, штукатурка..."
                            autofocus>
                    </div>
                </div>
                <div class="psw-filters">
                    <button class="psw-filter-btn ${_filterType === 'all' ? 'active' : ''}"
                            onclick="PriceSearchWidget._setFilter('all')">📋 Все</button>
                    <button class="psw-filter-btn ${_filterType === 'works' ? 'active' : ''}"
                            onclick="PriceSearchWidget._setFilter('works')">🔧 Работы</button>
                    <button class="psw-filter-btn ${_filterType === 'materials' ? 'active' : ''}"
                            onclick="PriceSearchWidget._setFilter('materials')">🧱 Материалы</button>
                    <button class="psw-filter-btn ${_filterType === 'equipment' ? 'active' : ''}"
                            onclick="PriceSearchWidget._setFilter('equipment')">🚜 Техника</button>
                </div>
                <div class="psw-results">
                    <div class="psw-empty">
                        <div class="psw-empty-icon">🔍</div>
                        Начните вводить для поиска по базе
                        <div style="font-size:0.78rem;margin-top:0.3rem;opacity:0.5">
                            Работы, материалы и техника из ГЭСН, ФЕР, ТЕР
                        </div>
                    </div>
                </div>
                <div class="psw-footer">
                    <span>
                        <kbd>↑↓</kbd> навигация &nbsp;
                        <kbd>Enter</kbd> выбрать &nbsp;
                        <kbd>Esc</kbd> закрыть
                    </span>
                    <span>${options.hint || ''}</span>
                </div>
            </div>
        `;

        document.body.appendChild(_overlay);

        const input = _overlay.querySelector('.psw-input');
        input.focus();

        // Input handler with debounce
        input.addEventListener('input', () => {
            clearTimeout(_searchTimeout);
            _searchTimeout = setTimeout(() => _search(input.value), 250);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _selectedIndex = Math.min(_selectedIndex + 1, _results.length - 1);
                _renderResults();
                _scrollToSelected();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                _selectedIndex = Math.max(_selectedIndex - 1, 0);
                _renderResults();
                _scrollToSelected();
            } else if (e.key === 'Enter' && _selectedIndex >= 0) {
                e.preventDefault();
                _selectItem(_selectedIndex);
            } else if (e.key === 'Escape') {
                close();
            }
        });

        // Pre-populate if initial query provided
        if (options.query) {
            input.value = options.query;
            _search(options.query);
        }
    }

    function close() {
        if (_overlay) {
            _overlay.style.opacity = '0';
            setTimeout(() => {
                _overlay?.remove();
                _overlay = null;
            }, 150);
        }
        _results = [];
        _selectedIndex = -1;
    }

    function _scrollToSelected() {
        if (_selectedIndex < 0) return;
        const item = _overlay?.querySelector(`.psw-item[data-idx="${_selectedIndex}"]`);
        if (item) item.scrollIntoView({ block: 'nearest' });
    }

    function _selectItem(idx) {
        const item = _results[idx];
        if (!item) return;

        if (_onSelect) {
            _onSelect(item);
        }

        close();
    }

    function _setFilter(type) {
        _filterType = type;
        // Re-render filter buttons
        const btns = _overlay?.querySelectorAll('.psw-filter-btn');
        if (btns) {
            btns.forEach(btn => {
                const btnType = btn.textContent.includes('Все') ? 'all' :
                    btn.textContent.includes('Работы') ? 'works' :
                        btn.textContent.includes('Материалы') ? 'materials' : 'equipment';
                btn.classList.toggle('active', btnType === type);
            });
        }
        // Re-search with new filter
        const input = _overlay?.querySelector('.psw-input');
        if (input && input.value.trim().length >= 2) {
            _search(input.value);
        }
    }

    // ─── Export ───────────────────────────────────────────
    const PriceSearchWidget = {
        open,
        close,
        _selectItem,
        _setFilter,
    };

    window.PriceSearchWidget = PriceSearchWidget;
    console.log('[PriceSearchWidget] ✅ Price Search Widget v1.0 loaded');

})();
