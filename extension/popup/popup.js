/* ═══════════════════════════════════════════════════════════════
   QazGost AI — Chrome Extension Popup Logic v1.0
   Строительный AI-ассистент: расценки, калькулятор, уведомления
   ═══════════════════════════════════════════════════════════════ */

// ── Конфигурация ──
let API_BASE = 'http://localhost:8080';
let searchTimeout = null;

// ── Демо-данные (fallback если API недоступен) ──
const DEMO_NOTIFICATIONS = [
  { id: 1, icon: '📦', title: 'Новый заказ ORD-2026-081', text: 'Ремонт офиса 120м² — Алматы — 4 850 000 ₸', time: '5 мин назад', type: 'green' },
  { id: 2, icon: '✅', title: 'Статус обновлён', text: 'Заказ ORD-2026-074 перешёл в статус «В работе»', time: '30 мин назад', type: 'blue' },
  { id: 3, icon: '🚜', title: 'Свободная техника рядом', text: 'Экскаватор Hitachi ZX240 — 1.8 км — 25 000 ₸/час', time: '1 час назад', type: 'yellow' },
  { id: 4, icon: '💰', title: 'Зачисление на баланс', text: 'Поступило 50 000 ₸ на кошелёк (Kaspi Pay)', time: '2 часа назад', type: 'green' },
  { id: 5, icon: '⚠️', title: 'AI обнаружил дефект', text: 'Трещина класса B на объекте ЖК «Тауэр» — требуется инспекция', time: '3 часа назад', type: 'red' },
];

const DEMO_ORDERS = [
  { id: 'ORD-2026-081', title: 'Ремонт офисного помещения 120м²', status: 'pending', statusText: 'В обработке', amount: 4850000, city: 'Алматы', progress: 15 },
  { id: 'ORD-2026-074', title: 'Фундамент под коттедж', status: 'active', statusText: 'В работе', amount: 12500000, city: 'Астана', progress: 45 },
  { id: 'ORD-2026-062', title: 'Монтаж вентиляции 3 этаж', status: 'active', statusText: 'В работе', amount: 3200000, city: 'Шымкент', progress: 78 },
  { id: 'ORD-2026-055', title: 'Демонтаж перегородок', status: 'done', statusText: 'Завершён', amount: 850000, city: 'Караганда', progress: 100 },
];

// ── Утилиты ──
function formatPrice(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
}

function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fn(...args), ms);
  };
}

// ── Инициализация ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initTabs();
  initPriceSearch();
  initCalculator();
  initNotifications();
  initOrders();
  initSettingsUI();
});

// ═══════════════════════════════════════
// ►  СИСТЕМА ВКЛАДОК
// ═══════════════════════════════════════
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');
      try { chrome.storage.local.set({ activeTab: target }); } catch(e) {}
    });
  });

  // Восстанавливаем последнюю активную вкладку
  try {
    chrome.storage.local.get(['activeTab'], (r) => {
      if (r.activeTab) {
        const btn = document.querySelector(`[data-tab="${r.activeTab}"]`);
        if (btn) btn.click();
      }
    });
  } catch(e) {}
}

// ═══════════════════════════════════════
// ►  ВКЛАДКА 1: ПОИСК РАСЦЕНОК
// ═══════════════════════════════════════
function initPriceSearch() {
  const input = document.getElementById('priceSearch');
  const resultsDiv = document.getElementById('priceResults');

  // Загружаем недавние поиски
  loadRecentSearches();

  input.addEventListener('input', debounce(async () => {
    const query = input.value.trim();
    if (!query) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <p>Введите название работы или материала</p>
          <small>24 000+ позиций по ГОСТ/СНиП РК</small>
        </div>`;
      return;
    }

    resultsDiv.innerHTML = '<div style="text-align:center;padding:30px"><div class="loading-spinner"></div></div>';

    try {
      const resp = await fetch(`${API_BASE}/api/v1/prices?q=${encodeURIComponent(query)}&limit=8`, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      renderPriceResults(data.items || data || []);
    } catch (e) {
      // Fallback: mock поиск
      const q = query.toLowerCase();
      const mock = [
        { name: 'Бетон М350 (заливка)', unit: 'м³', price: 22000, category: 'Монолит' },
        { name: 'Кирпич керамический М150 (кладка)', unit: 'м²', price: 4500, category: 'Кладка' },
        { name: 'Штукатурка стен (гипсовая)', unit: 'м²', price: 2200, category: 'Отделка' },
        { name: 'Стяжка пола цементная', unit: 'м²', price: 3500, category: 'Полы' },
        { name: 'Арматура А500С d12', unit: 'кг', price: 420, category: 'Металл' },
        { name: 'Цемент М500 (Каратау)', unit: 'мешок', price: 2800, category: 'Сыпучие' },
        { name: 'Утеплитель Технониколь 50мм', unit: 'м²', price: 1800, category: 'Изоляция' },
        { name: 'Электропроводка (точка)', unit: 'точка', price: 1200, category: 'Электрика' },
        { name: 'Монтаж радиатора отопления', unit: 'шт', price: 8500, category: 'HVAC' },
        { name: 'Укладка ламината', unit: 'м²', price: 1500, category: 'Отделка' },
        { name: 'Монтаж гипсокартона', unit: 'м²', price: 2800, category: 'Отделка' },
        { name: 'Установка розетки/выключателя', unit: 'шт', price: 800, category: 'Электрика' },
      ].filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
      renderPriceResults(mock);
    }

    saveRecentSearch(query);
  }, 300));
}

function renderPriceResults(items) {
  const div = document.getElementById('priceResults');
  if (!items.length) {
    div.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span><p>Ничего не найдено</p></div>';
    return;
  }
  div.innerHTML = items.map(item => `
    <div class="result-card">
      <div class="result-name">${item.name}</div>
      <div class="result-meta">
        <div>
          <span class="result-price">${formatPrice(item.price)}</span>
          <span class="result-unit">/ ${item.unit}</span>
        </div>
        <span class="result-category">${item.category}</span>
      </div>
      <div class="result-actions">
        <button onclick="copyText('${item.name} — ${formatPrice(item.price)}/${item.unit}', this)">📋 Копировать</button>
        <button onclick="window.open('http://localhost:5173', '_blank')">🌐 В QazGost</button>
      </div>
    </div>
  `).join('');
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text);
  const orig = btn.textContent;
  btn.textContent = '✅ Скопировано!';
  btn.style.color = '#22c55e';
  setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
}

function saveRecentSearch(query) {
  try {
    chrome.storage.local.get({ recentSearches: [] }, (r) => {
      let list = r.recentSearches.filter(s => s !== query);
      list.unshift(query);
      if (list.length > 5) list = list.slice(0, 5);
      chrome.storage.local.set({ recentSearches: list });
    });
  } catch(e) {}
}

function loadRecentSearches() {
  try {
    chrome.storage.local.get({ recentSearches: [] }, (r) => {
      const div = document.getElementById('recentSearches');
      if (r.recentSearches.length > 0) {
        div.innerHTML = r.recentSearches.map(s =>
          `<span class="recent-chip" onclick="document.getElementById('priceSearch').value='${s}';document.getElementById('priceSearch').dispatchEvent(new Event('input'))">${s}</span>`
        ).join('');
      }
    });
  } catch(e) {}
}

// ═══════════════════════════════════════
// ►  ВКЛАДКА 2: КАЛЬКУЛЯТОР
// ═══════════════════════════════════════
const CALC_MODES = {
  concrete: {
    title: '📐 Объём бетона',
    inputs: [
      { id: 'length', label: 'Длина (м)', step: 0.1 },
      { id: 'width', label: 'Ширина (м)', step: 0.1 },
      { id: 'depth', label: 'Глубина (м)', step: 0.01 }
    ],
    calc: (v) => {
      const vol = v.length * v.width * v.depth;
      const volC = vol * 1.05;
      const mixers = Math.ceil(volC / 7);
      const cost = Math.round(volC * 22000);
      return [
        { label: '📦 Объём', value: vol.toFixed(2) + ' м³', cls: 'cyan' },
        { label: '📦 С уплотнением (×1.05)', value: volC.toFixed(2) + ' м³', cls: 'cyan' },
        { label: '🚛 Миксеров (по 7 м³)', value: mixers + ' рейсов' },
        { label: '💰 Стоимость (М350 @ 22 000 ₸/м³)', value: formatPrice(cost), cls: '' },
      ];
    }
  },
  brick: {
    title: '🧱 Кирпич',
    inputs: [
      { id: 'area', label: 'Площадь стены (м²)', step: 0.1 },
      { id: 'thickness', label: 'Толщина кладки (кирпичей)', type: 'select', options: [
        { value: '51', text: '0.5 кирпича (120 мм)' },
        { value: '102', text: '1 кирпич (250 мм)' },
        { value: '153', text: '1.5 кирпича (380 мм)' }
      ]}
    ],
    calc: (v) => {
      const count = Math.ceil(v.area * v.thickness);
      const pallets = Math.ceil(count / 480);
      return [
        { label: '🧱 Количество кирпича', value: count + ' шт', cls: 'cyan' },
        { label: '📦 Поддонов (480 шт/подд)', value: pallets + ' шт' },
      ];
    }
  },
  walls: {
    title: '🎨 Площадь стен',
    inputs: [
      { id: 'length', label: 'Длина комнаты (м)', step: 0.1 },
      { id: 'width', label: 'Ширина комнаты (м)', step: 0.1 },
      { id: 'height', label: 'Высота потолка (м)', step: 0.1 }
    ],
    calc: (v) => {
      const wallArea = 2 * (v.length + v.width) * v.height;
      const floorArea = v.length * v.width;
      return [
        { label: '🏠 Площадь стен', value: wallArea.toFixed(1) + ' м²', cls: 'cyan' },
        { label: '📐 Площадь пола', value: floorArea.toFixed(1) + ' м²' },
        { label: '📐 Площадь потолка', value: floorArea.toFixed(1) + ' м²' },
        { label: '📏 Периметр', value: (2 * (v.length + v.width)).toFixed(1) + ' м' },
      ];
    }
  },
  rebar: {
    title: '🏗️ Арматура',
    inputs: [
      { id: 'area', label: 'Площадь плиты (м²)', step: 0.1 },
      { id: 'step', label: 'Шаг сетки (мм)', type: 'select', options: [
        { value: '150', text: '150 мм' },
        { value: '200', text: '200 мм' },
        { value: '250', text: '250 мм' }
      ]}
    ],
    calc: (v) => {
      const side = Math.sqrt(v.area);
      const barsPerDir = Math.ceil((side * 1000) / v.step) + 1;
      const totalMeters = barsPerDir * side * 2;
      const weight = totalMeters * 0.617; // d10 А500С
      const cost = Math.round(weight * 420);
      return [
        { label: '📏 Погонных метров', value: totalMeters.toFixed(0) + ' п.м', cls: 'cyan' },
        { label: '⚖️ Масса (d10 А500С)', value: weight.toFixed(1) + ' кг' },
        { label: '💰 Стоимость (@ 420 ₸/кг)', value: formatPrice(cost) },
      ];
    }
  },
  screed: {
    title: '🚚 Стяжка пола',
    inputs: [
      { id: 'area', label: 'Площадь пола (м²)', step: 0.1 },
      { id: 'thickness', label: 'Толщина стяжки (мм)', step: 1 }
    ],
    calc: (v) => {
      const vol = v.area * (v.thickness / 1000);
      const cement = Math.ceil((vol * 300) / 50); // 300 кг/м³, мешки по 50 кг
      const cost = Math.round(v.area * 3500);
      return [
        { label: '📦 Объём раствора', value: vol.toFixed(2) + ' м³', cls: 'cyan' },
        { label: '🧱 Мешков цемента (50 кг)', value: cement + ' шт' },
        { label: '💰 Работа (@ 3 500 ₸/м²)', value: formatPrice(cost) },
      ];
    }
  },
  express: {
    title: '💰 Экспресс-смета',
    inputs: [
      { id: 'area', label: 'Площадь (м²)', step: 1 },
      { id: 'type', label: 'Тип объекта', type: 'select', options: [
        { value: '38000', text: 'Квартира — от 38 000 ₸/м²' },
        { value: '58000', text: 'Офис — от 58 000 ₸/м²' },
        { value: '105000', text: 'Коттедж — от 105 000 ₸/м²' },
        { value: '150000', text: 'Пром. объект — от 150 000 ₸/м²' },
      ]}
    ],
    calc: (v) => {
      const total = Math.round(v.area * v.type);
      const works = Math.round(total * 0.6);
      const materials = Math.round(total * 0.3);
      const ai = Math.round(total * 0.1);
      return [
        { label: '💰 Общая стоимость', value: formatPrice(total), cls: '' },
        { label: '🔧 Работы (60%)', value: formatPrice(works) },
        { label: '🧱 Материалы (30%)', value: formatPrice(materials) },
        { label: '🤖 AI-сервисы (10%)', value: formatPrice(ai) },
      ];
    }
  }
};

function initCalculator() {
  const modeSelect = document.getElementById('calcMode');
  const calcBtn = document.getElementById('calcBtn');

  modeSelect.addEventListener('change', () => renderCalcInputs());
  calcBtn.addEventListener('click', () => runCalc());
  renderCalcInputs();
}

function renderCalcInputs() {
  const mode = document.getElementById('calcMode').value;
  const config = CALC_MODES[mode];
  const div = document.getElementById('calcInputs');
  document.getElementById('calcResults').innerHTML = '';

  div.innerHTML = config.inputs.map(inp => {
    if (inp.type === 'select') {
      return `<div class="calc-input-group">
        <label>${inp.label}</label>
        <select id="ci_${inp.id}">${inp.options.map(o => `<option value="${o.value}">${o.text}</option>`).join('')}</select>
      </div>`;
    }
    return `<div class="calc-input-group">
      <label>${inp.label}</label>
      <input type="number" id="ci_${inp.id}" step="${inp.step || 1}" min="0" placeholder="0">
    </div>`;
  }).join('');
}

function runCalc() {
  const mode = document.getElementById('calcMode').value;
  const config = CALC_MODES[mode];
  const vals = {};
  let valid = true;

  config.inputs.forEach(inp => {
    const el = document.getElementById(`ci_${inp.id}`);
    const v = parseFloat(el.value);
    if (isNaN(v) || v <= 0) { valid = false; el.style.borderColor = '#ef4444'; }
    else { el.style.borderColor = ''; }
    vals[inp.id] = v;
  });

  if (!valid) return;

  const results = config.calc(vals);
  const div = document.getElementById('calcResults');
  div.innerHTML = `<div class="calc-result-card">${
    results.map(r => `
      <div class="calc-result-item">
        <span class="calc-result-label">${r.label}</span>
        <span class="calc-result-value ${r.cls || ''}">${r.value}</span>
      </div>
    `).join('')
  }</div>`;
}

// ═══════════════════════════════════════
// ►  ВКЛАДКА 3: УВЕДОМЛЕНИЯ
// ═══════════════════════════════════════
function initNotifications() {
  renderNotifications(DEMO_NOTIFICATIONS);

  const badge = document.getElementById('notifBadge');
  badge.textContent = DEMO_NOTIFICATIONS.length;
  badge.style.display = 'flex';

  document.getElementById('markAllRead').addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    badge.style.display = 'none';
  });
}

function renderNotifications(items) {
  const div = document.getElementById('notifList');
  if (!items.length) {
    div.innerHTML = '<div class="empty-state"><span class="empty-icon">🔕</span><p>Нет уведомлений</p></div>';
    return;
  }
  div.innerHTML = items.map(n => `
    <div class="notif-item unread">
      <span class="notif-icon">${n.icon}</span>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
      <span class="notif-dot ${n.type}"></span>
    </div>
  `).join('');
}

// ═══════════════════════════════════════
// ►  ВКЛАДКА 4: ЗАКАЗЫ
// ═══════════════════════════════════════
function initOrders() {
  renderOrders(DEMO_ORDERS);
  renderOrdersStats(DEMO_ORDERS);

  // Фильтры
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      const filtered = filter === 'all' ? DEMO_ORDERS : DEMO_ORDERS.filter(o => o.status === filter);
      renderOrders(filtered);
    });
  });
}

function renderOrdersStats(orders) {
  const div = document.getElementById('ordersStats');
  const total = orders.reduce((s, o) => s + o.amount, 0);
  div.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${orders.length}</div>
      <div class="stat-label">Всего заказов</div>
    </div>
    <div class="stat-card">
      <div class="stat-value gold">${formatPrice(total)}</div>
      <div class="stat-label">Общий объём</div>
    </div>
  `;
}

function renderOrders(orders) {
  const div = document.getElementById('ordersList');
  if (!orders.length) {
    div.innerHTML = '<div class="empty-state"><span class="empty-icon">📭</span><p>Нет заказов</p></div>';
    return;
  }
  div.innerHTML = orders.map(o => `
    <div class="order-card" onclick="window.open('http://localhost:5173/orders','_blank')">
      <div class="order-top">
        <span class="order-id">${o.id}</span>
        <span class="order-status ${o.status}">${o.statusText}</span>
      </div>
      <div class="order-title">${o.title}</div>
      <div class="order-bottom">
        <span class="order-amount">${formatPrice(o.amount)}</span>
        <span class="order-city">📍 ${o.city}</span>
      </div>
      <div class="order-progress"><div class="order-progress-bar" style="width:${o.progress}%"></div></div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════
// ►  ВКЛАДКА 5: НАСТРОЙКИ
// ═══════════════════════════════════════
async function loadSettings() {
  return new Promise(resolve => {
    try {
      chrome.storage.sync.get({
        apiUrl: 'http://localhost:8080',
        city: 'Алматы',
        role: 'customer',
        overlayEnabled: true,
        notifsEnabled: true,
        jwtToken: ''
      }, (items) => {
        API_BASE = items.apiUrl;
        resolve(items);
      });
    } catch(e) { resolve({}); }
  });
}

function initSettingsUI() {
  loadSettings().then(s => {
    if (s.apiUrl) document.getElementById('apiUrl').value = s.apiUrl;
    if (s.city) document.getElementById('settingsCity').value = s.city;
    if (s.role) document.getElementById('settingsRole').value = s.role;
    if (s.jwtToken) document.getElementById('settingsToken').value = s.jwtToken;
    if (s.overlayEnabled !== undefined) document.getElementById('toggleOverlay').checked = s.overlayEnabled;
    if (s.notifsEnabled !== undefined) document.getElementById('toggleNotifs').checked = s.notifsEnabled;
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    const settings = {
      apiUrl: document.getElementById('apiUrl').value,
      city: document.getElementById('settingsCity').value,
      role: document.getElementById('settingsRole').value,
      jwtToken: document.getElementById('settingsToken').value,
      overlayEnabled: document.getElementById('toggleOverlay').checked,
      notifsEnabled: document.getElementById('toggleNotifs').checked,
    };
    API_BASE = settings.apiUrl;
    try { chrome.storage.sync.set(settings); } catch(e) {}

    const btn = document.getElementById('saveSettings');
    btn.textContent = '✅ Сохранено!';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    setTimeout(() => {
      btn.textContent = '💾 Сохранить';
      btn.style.background = '';
    }, 2000);
  });

  document.getElementById('testConnection').addEventListener('click', async () => {
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.className = 'connection-status';
    statusDiv.textContent = '🔄 Проверяю подключение...';
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(255,255,255,0.06)';
    statusDiv.style.color = '#94a3b8';

    try {
      const url = document.getElementById('apiUrl').value;
      const resp = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        statusDiv.className = 'connection-status success';
        statusDiv.textContent = `✅ Подключено! Uptime: ${data.uptime || 'OK'}`;
      } else throw new Error('Not OK');
    } catch (e) {
      statusDiv.className = 'connection-status error';
      statusDiv.textContent = '❌ Не удалось подключиться к серверу';
    }
  });
}
