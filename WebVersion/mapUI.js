// ========================================
// CONSTRUCTION MAP v1.0
// Карта строек — найди работу рядом
// Leaflet.js based
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. STATE
    // =============================================

    let _map = null;
    let _container = null;
    let _markers = [];
    let _markerGroup = null;
    let _userMarker = null;
    let _currentFilter = { type: 'all', status: 'all', maxDistance: 100 };

    // =============================================
    // 2. DEMO ORDERS DATA
    // =============================================

    const DEMO_ORDERS = [
        { id: 'map_1', title: 'Фундамент ленточный 10×12', type: 'foundation', status: 'open', amount: 850000, lat: 43.238949, lng: 76.945669, city: 'Алматы', address: 'мкр. Алатау, ул. Абая 15', date: '2026-02-10', applicants: 3 },
        { id: 'map_2', title: 'Кладка стен газоблок 2 этажа', type: 'masonry', status: 'open', amount: 1200000, lat: 43.256270, lng: 76.928570, city: 'Алматы', address: 'Медеуский р-н, ул. Сейфуллина 42', date: '2026-02-12', applicants: 5 },
        { id: 'map_3', title: 'Монтаж кровли мягкой', type: 'roofing', status: 'open', amount: 650000, lat: 43.222015, lng: 76.851480, city: 'Алматы', address: 'Наурызбайский р-н, пос. Таусамалы', date: '2026-02-14', applicants: 1 },
        { id: 'map_4', title: 'Земляные работы — котлован', type: 'earthwork', status: 'in_progress', amount: 380000, lat: 43.270879, lng: 76.939987, city: 'Алматы', address: 'Бостандыкский р-н, ул. Тимирязева 5', date: '2026-02-08', applicants: 0 },
        { id: 'map_5', title: 'Устройство дренажа участка', type: 'earthwork', status: 'open', amount: 420000, lat: 43.315780, lng: 76.965310, city: 'Алматы', address: 'Турксибский р-н, ул. Рыскулова 87', date: '2026-02-13', applicants: 2 },
        // Астана
        { id: 'map_6', title: 'Фундамент плитный 200м²', type: 'foundation', status: 'open', amount: 3200000, lat: 51.128207, lng: 71.430411, city: 'Астана', address: 'р-н Есиль, пр. Кабанбай батыра 11', date: '2026-02-11', applicants: 4 },
        { id: 'map_7', title: 'Утепление фасада ЭППС', type: 'insulation', status: 'open', amount: 900000, lat: 51.089777, lng: 71.416857, city: 'Астана', address: 'р-н Сарыарка, ул. Иманова 19', date: '2026-02-09', applicants: 2 },
        { id: 'map_8', title: 'Бетонирование перекрытия', type: 'concrete', status: 'in_progress', amount: 1500000, lat: 51.145050, lng: 71.470700, city: 'Астана', address: 'р-н Байконыр, ул. Момышулы 3', date: '2026-02-07', applicants: 0 },
        // Караганда
        { id: 'map_9', title: 'Кладка из кирпича М150', type: 'masonry', status: 'open', amount: 750000, lat: 49.806406, lng: 73.109397, city: 'Караганда', address: 'ул. Бухар-Жырау 52', date: '2026-02-12', applicants: 1 },
        { id: 'map_10', title: 'Монтаж водопровода', type: 'plumbing', status: 'open', amount: 280000, lat: 49.798380, lng: 73.082690, city: 'Караганда', address: 'р-н Казыбек Би, ул. Ерубаева 8', date: '2026-02-14', applicants: 0 },
        // Шымкент
        { id: 'map_11', title: 'Строительство забора 120 п.м.', type: 'masonry', status: 'open', amount: 560000, lat: 42.317383, lng: 69.596796, city: 'Шымкент', address: 'р-н Аль-Фараби, ул. Жибек Жолы 15', date: '2026-02-13', applicants: 3 },
        { id: 'map_12', title: 'Штукатурка внутренняя 150м²', type: 'finishing', status: 'open', amount: 320000, lat: 42.340500, lng: 69.630100, city: 'Шымкент', address: 'р-н Абай, ул. Байтурсынова 28', date: '2026-02-10', applicants: 2 },
        // Актобе
        { id: 'map_13', title: 'Фундамент свайно-ростверковый', type: 'foundation', status: 'open', amount: 1800000, lat: 50.300406, lng: 57.154570, city: 'Актобе', address: 'м-он 12, ул. Маресьева 7', date: '2026-02-11', applicants: 1 },
        // Павлодар
        { id: 'map_14', title: 'Демонтаж старого здания', type: 'earthwork', status: 'open', amount: 450000, lat: 52.285577, lng: 76.940947, city: 'Павлодар', address: 'ул. Толстого 93', date: '2026-02-09', applicants: 0 },
        // Атырау
        { id: 'map_15', title: 'Монтаж металлоконструкций', type: 'steel', status: 'open', amount: 2400000, lat: 47.116687, lng: 51.920152, city: 'Атырау', address: 'Промышленная зона, ул. Индустриальная 5', date: '2026-02-08', applicants: 2 },
        // Усть-Каменогорск
        { id: 'map_16', title: 'Отделка коттеджа под ключ', type: 'finishing', status: 'open', amount: 4500000, lat: 49.948780, lng: 82.628466, city: 'Усть-Каменогорск', address: 'пос. Меновное, ул. Парковая 12', date: '2026-02-13', applicants: 0 },
        // Костанай
        { id: 'map_17', title: 'Устройство тёплого пола 80м²', type: 'plumbing', status: 'open', amount: 340000, lat: 53.214778, lng: 63.624767, city: 'Костанай', address: 'ул. Гоголя 33', date: '2026-02-14', applicants: 1 },
        // Тараз
        { id: 'map_18', title: 'Укладка тротуарной плитки', type: 'finishing', status: 'open', amount: 180000, lat: 42.900980, lng: 71.378320, city: 'Тараз', address: 'мкр. Мерей, ул. Жамбыла 18', date: '2026-02-12', applicants: 0 },
        // Семей
        { id: 'map_19', title: 'Ремонт кровли битумной', type: 'roofing', status: 'in_progress', amount: 290000, lat: 50.416540, lng: 80.227710, city: 'Семей', address: 'ул. Абая 55', date: '2026-02-06', applicants: 0 },
        // Петропавловск
        { id: 'map_20', title: 'Электромонтажные работы', type: 'electrical', status: 'open', amount: 520000, lat: 54.872560, lng: 69.152790, city: 'Петропавловск', address: 'ул. Конституции Казахстана 21', date: '2026-02-11', applicants: 2 }
    ];

    const TYPE_CONFIG = {
        foundation: { label: '🏗️ Фундамент', color: '#ef4444' },
        masonry: { label: '🧱 Кладка', color: '#f59e0b' },
        earthwork: { label: '⛏️ Земляные', color: '#8b6914' },
        concrete: { label: '🏗️ Бетон', color: '#6b7280' },
        roofing: { label: '🏠 Кровля', color: '#22c55e' },
        insulation: { label: '🧊 Утепление', color: '#3b82f6' },
        plumbing: { label: '🔧 Сантехника', color: '#06b6d4' },
        electrical: { label: '⚡ Электрика', color: '#eab308' },
        finishing: { label: '🎨 Отделка', color: '#a855f7' },
        steel: { label: '🏗️ Металло', color: '#64748b' },
        all: { label: 'Все типы', color: '#6366f1' }
    };

    // =============================================
    // 3. UTILITIES
    // =============================================

    function _formatMoney(amount) {
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + ' млн ₸';
        return new Intl.NumberFormat('ru-KZ').format(amount) + ' ₸';
    }

    function _formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' });
    }

    function _getDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // =============================================
    // 4. LOAD LEAFLET CDN
    // =============================================

    function _loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) { resolve(); return; }

            // CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            // JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet.js'));
            document.head.appendChild(script);
        });
    }

    // =============================================
    // 5. CREATE MARKERS
    // =============================================

    function _createMarkerIcon(type, status) {
        const config = TYPE_CONFIG[type] || TYPE_CONFIG.all;
        const isActive = status === 'open';
        const color = isActive ? config.color : '#374151';
        const size = isActive ? 30 : 24;

        return window.L.divIcon({
            className: 'map-custom-marker',
            html: `
                <div class="map-marker-pin" style="
                    background: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border: 3px solid rgba(255,255,255,0.9);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ${isActive ? `animation: map-pulse 2s ease-in-out infinite;` : ''}
                ">
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    }

    function _createPopup(order) {
        const tc = TYPE_CONFIG[order.type] || TYPE_CONFIG.all;
        return `
            <div class="map-popup">
                <div class="map-popup-header" style="border-left: 4px solid ${tc.color};">
                    <h4>${order.title}</h4>
                    <span class="map-popup-type">${tc.label}</span>
                </div>
                <div class="map-popup-body">
                    <div class="map-popup-row">
                        <span>💰</span>
                        <strong>${_formatMoney(order.amount)}</strong>
                    </div>
                    <div class="map-popup-row">
                        <span>📍</span>
                        <span>${order.city}, ${order.address}</span>
                    </div>
                    <div class="map-popup-row">
                        <span>📅</span>
                        <span>${_formatDate(order.date)}</span>
                    </div>
                    <div class="map-popup-row">
                        <span>👷</span>
                        <span>${order.applicants} откликов</span>
                    </div>
                </div>
                <div class="map-popup-footer">
                    <button class="map-popup-btn" onclick="window.ConstructionMap.openOrder('${order.id}')">
                        Подробнее →
                    </button>
                </div>
            </div>
        `;
    }

    // =============================================
    // 6. MAP INITIALIZATION
    // =============================================

    async function open(container) {
        _container = typeof container === 'string' ? document.getElementById(container) : container;
        if (!_container) { console.error('[Map] Container not found'); return; }

        // Render skeleton first
        _container.innerHTML = `
            <div class="map-wrapper">
                <div class="map-sidebar">
                    <div class="map-sidebar-header">
                        <h2>🗺️ Карта строек</h2>
                        <p class="map-subtitle">${DEMO_ORDERS.filter(o => o.status === 'open').length} открытых заказов</p>
                    </div>
                    <div class="map-filters">
                        <div class="map-filter-group">
                            <label>Тип работ</label>
                            <select id="map-filter-type" class="map-select" onchange="window.ConstructionMap.filterByType(this.value)">
                                <option value="all">Все типы</option>
                                ${Object.entries(TYPE_CONFIG)
                .filter(([k]) => k !== 'all')
                .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
                .join('')}
                            </select>
                        </div>
                        <div class="map-filter-group">
                            <label>Статус</label>
                            <select id="map-filter-status" class="map-select" onchange="window.ConstructionMap.filterByStatus(this.value)">
                                <option value="all">Все</option>
                                <option value="open">🟢 Открытые</option>
                                <option value="in_progress">🔵 В работе</option>
                            </select>
                        </div>
                        <button class="map-locate-btn" onclick="window.ConstructionMap.locateMe()">
                            📍 Моё местоположение
                        </button>
                    </div>
                    <div class="map-order-list" id="map-order-list">
                        <!-- Filled by _renderOrderList -->
                    </div>
                </div>
                <div class="map-container" id="map-leaflet-container">
                    <div class="map-loading">
                        <div class="map-loading-spinner"></div>
                        <span>Загрузка карты...</span>
                    </div>
                </div>
            </div>
        `;

        _renderOrderList(DEMO_ORDERS);

        // Load Leaflet and init
        try {
            await _loadLeaflet();
            _initMap();
        } catch (e) {
            console.error('[Map] Error loading Leaflet:', e);
            document.getElementById('map-leaflet-container').innerHTML = `
                <div class="map-error">
                    <span>⚠️</span>
                    <p>Не удалось загрузить карту. Проверьте интернет-соединение.</p>
                    <button class="map-popup-btn" onclick="window.ConstructionMap.open('${_container.id || ''}')">Повторить</button>
                </div>
            `;
        }
    }

    function _initMap() {
        const mapEl = document.getElementById('map-leaflet-container');
        if (!mapEl) return;
        mapEl.innerHTML = '';

        // Center on Kazakhstan
        _map = window.L.map(mapEl, {
            center: [48.0196, 66.9237],
            zoom: 5,
            zoomControl: true,
            attributionControl: true
        });

        // Dark tile layer
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://carto.com/">CARTO</a> | © <a href="https://osm.org/">OSM</a>',
            maxZoom: 19
        }).addTo(_map);

        // Add markers
        _updateMarkers();

        // Custom CSS for markers
        _injectMapStyles();
    }

    function _updateMarkers() {
        if (!_map) return;

        // Remove old markers
        _markers.forEach(m => _map.removeLayer(m));
        _markers = [];

        // Filter orders
        let orders = _getFilteredOrders();

        // Add markers
        orders.forEach(order => {
            const icon = _createMarkerIcon(order.type, order.status);
            const marker = window.L.marker([order.lat, order.lng], { icon })
                .addTo(_map)
                .bindPopup(_createPopup(order), {
                    maxWidth: 280,
                    className: 'map-custom-popup'
                });

            marker._orderId = order.id;
            _markers.push(marker);
        });

        // Fit bounds
        if (_markers.length > 0) {
            const group = window.L.featureGroup(_markers);
            _map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    function _getFilteredOrders() {
        let orders = [...DEMO_ORDERS];

        // Also add real orders from localStorage
        try {
            const realOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            realOrders.forEach(o => {
                if (o.latitude && o.longitude) {
                    orders.push({
                        id: o.id,
                        title: o.title || 'Заказ без названия',
                        type: o.category || 'earthwork',
                        status: o.status || 'open',
                        amount: o.contractAmountKZT || o.estimatedCost || 0,
                        lat: o.latitude,
                        lng: o.longitude,
                        city: o.city || '',
                        address: o.address || '',
                        date: o.createdAt || new Date().toISOString(),
                        applicants: (o.applications || []).length
                    });
                }
            });
        } catch (e) { /* ignore */ }

        // Apply filters
        if (_currentFilter.type !== 'all') {
            orders = orders.filter(o => o.type === _currentFilter.type);
        }
        if (_currentFilter.status !== 'all') {
            orders = orders.filter(o => o.status === _currentFilter.status);
        }

        return orders;
    }

    // =============================================
    // 7. ORDER LIST (sidebar)
    // =============================================

    function _renderOrderList(orders) {
        const list = document.getElementById('map-order-list');
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = '<div class="map-empty">Нет заказов по фильтру</div>';
            return;
        }

        list.innerHTML = orders.map(o => {
            const tc = TYPE_CONFIG[o.type] || TYPE_CONFIG.all;
            return `
                <div class="map-order-card ${o.status}" onclick="window.ConstructionMap.flyTo('${o.id}')" data-order="${o.id}">
                    <div class="map-order-top">
                        <span class="map-order-type" style="color:${tc.color}">${tc.label}</span>
                        <span class="map-order-status ${o.status}">${o.status === 'open' ? '🟢 Открыт' : '🔵 В работе'}</span>
                    </div>
                    <h4 class="map-order-title">${o.title}</h4>
                    <div class="map-order-meta">
                        <span>📍 ${o.city}</span>
                        <span>💰 ${_formatMoney(o.amount)}</span>
                    </div>
                    <div class="map-order-bottom">
                        <span>${_formatDate(o.date)}</span>
                        <span>👷 ${o.applicants} откликов</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // =============================================
    // 8. ACTIONS
    // =============================================

    function filterByType(type) {
        _currentFilter.type = type;
        _updateMarkers();
        _renderOrderList(_getFilteredOrders());
    }

    function filterByStatus(status) {
        _currentFilter.status = status;
        _updateMarkers();
        _renderOrderList(_getFilteredOrders());
    }

    function flyTo(orderId) {
        const order = DEMO_ORDERS.find(o => o.id === orderId);
        if (order && _map) {
            _map.flyTo([order.lat, order.lng], 14, { duration: 1.5 });
            // Open popup
            const marker = _markers.find(m => m._orderId === orderId);
            if (marker) setTimeout(() => marker.openPopup(), 1500);
        }
    }

    function locateMe() {
        if (!_map) return;

        if (!navigator.geolocation) {
            (window.QazUI?.alert || window.alert)('Геолокация недоступна', 'Ваш браузер не поддерживает геолокацию', { icon: '📍' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                _map.flyTo([latitude, longitude], 12, { duration: 1.5 });

                // Add user marker
                if (_userMarker) _map.removeLayer(_userMarker);
                _userMarker = window.L.marker([latitude, longitude], {
                    icon: window.L.divIcon({
                        className: 'map-user-marker',
                        html: '<div class="map-user-dot"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(_map).bindPopup('📍 Вы здесь');

                // Sort and update list by distance
                const ordersWithDist = _getFilteredOrders().map(o => ({
                    ...o,
                    distance: _getDistance(latitude, longitude, o.lat, o.lng)
                })).sort((a, b) => a.distance - b.distance);

                _renderOrderList(ordersWithDist);
            },
            (err) => {
                console.warn('[Map] Geolocation error:', err);
                (window.QazUI?.alert || window.alert)('Ошибка геолокации', 'Не удалось определить местоположение. Проверьте настройки GPS.', { icon: '📍' });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function openOrder(orderId) {
        // Try to navigate to order details if available
        if (window.location.hash) {
            window.location.hash = '#order-' + orderId;
        }
        console.log('[Map] Open order:', orderId);
    }

    // =============================================
    // 9. INJECT MAP MARKER STYLES
    // =============================================

    function _injectMapStyles() {
        if (document.getElementById('map-marker-styles')) return;
        const style = document.createElement('style');
        style.id = 'map-marker-styles';
        style.textContent = `
            @keyframes map-pulse {
                0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
                50% { box-shadow: 0 2px 16px rgba(0,0,0,0.5), 0 0 20px currentColor; }
            }
            .map-custom-marker {
                background: transparent !important;
                border: none !important;
            }
            .map-user-dot {
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
                animation: map-user-pulse 2s ease-in-out infinite;
            }
            @keyframes map-user-pulse {
                0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
                50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.1); }
            }
            .map-custom-popup .leaflet-popup-content-wrapper {
                background: #1e1e3a;
                color: #e5e5e5;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            }
            .map-custom-popup .leaflet-popup-tip {
                background: #1e1e3a;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .map-custom-popup .leaflet-popup-content {
                margin: 0;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================
    // 10. EXPORT
    // =============================================

    window.ConstructionMap = {
        open,
        filterByType,
        filterByStatus,
        flyTo,
        locateMe,
        openOrder,
        DEMO_ORDERS,
        TYPE_CONFIG
    };

    console.log('[ConstructionMap] ✅ Construction Map v1.0 loaded');

})();
