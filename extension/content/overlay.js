/**
 * QazGost AI — Content Script: overlay.js
 * 
 * Запускается на OLX.kz, Krisha.kz, Satu.kz, Kolesa.kz.
 * Сканирует DOM на наличие цен и строительных терминов,
 * внедряет бейджи с рыночными ценами и аналитикой.
 * 
 * @author QazGost AI Team
 */

(function () {
  'use strict';

  // =====================================================
  // КОНФИГУРАЦИЯ
  // =====================================================

  const CONFIG = {
    API_BASE: 'http://localhost:8080',
    CACHE_PREFIX: 'qazgost_price_',
    CACHE_TTL: 30 * 60 * 1000, // 30 минут
    BADGE_CLASS: 'qazgost-overlay-badge',
    PROCESSED_ATTR: 'data-qazgost-processed',
    SCAN_DEBOUNCE: 500,
  };

  /** Строительные ключевые слова для поиска */
  const CONSTRUCTION_KEYWORDS = [
    'экскаватор', 'бульдозер', 'кран', 'бетон', 'цемент',
    'кирпич', 'арматура', 'щебень', 'песок', 'штукатурка',
    'плитка', 'гипсокартон', 'утеплитель', 'труба', 'кабель',
    'перфоратор', 'сварка', 'опалубка', 'фундамент', 'кровля',
    'фасад', 'окна пвх', 'двери', 'ламинат', 'линолеум',
    'профнастил', 'сайдинг', 'черепица', 'шпаклёвка', 'грунтовка',
  ];

  /** Селекторы для различных площадок */
  const SITE_SELECTORS = {
    'olx.kz': {
      price: ['.css-10b0gli', '[data-cy="ad-price"]', '[data-testid="ad-price"]'],
      title: ['.css-1venrmu', '[data-cy="ad-title"]', 'h4.css-1s3qyje'],
      listing: ['.css-1sw7q4x', '[data-cy="l-card"]', '.offer-wrapper'],
    },
    'krisha.kz': {
      price: ['.offer__price', '.a-card__price', '.price'],
      title: ['.offer__title', '.a-card__header-left', '.a-card__title'],
      listing: ['.a-card', '.offer', '.a-list__item'],
    },
    'satu.kz': {
      price: ['.product-price', '.qkVIb', '[data-qaid="product_price"]'],
      title: ['.product-title', '.x4dAH', '[data-qaid="product_name"]'],
      listing: ['.product-card', '.dtList', '.product-snippet'],
    },
    'kolesa.kz': {
      price: ['.a-card__price', '.price', '[data-role="price"]'],
      title: ['.a-card__title', '.a-card__header', '[data-role="name"]'],
      listing: ['.a-card', '.a-list-item', '.listing-item'],
    },
  };

  // =====================================================
  // СОСТОЯНИЕ
  // =====================================================

  let overlayEnabled = true;
  let badgeCount = 0;
  let scanTimer = null;
  const currentHost = window.location.hostname.replace('www.', '');

  // =====================================================
  // УТИЛИТЫ
  // =====================================================

  /**
   * Определяет текущую площадку по hostname
   * @returns {object|null} конфигурация селекторов
   */
  function getSiteConfig() {
    for (const [domain, selectors] of Object.entries(SITE_SELECTORS)) {
      if (currentHost.includes(domain.replace('.kz', ''))) {
        return selectors;
      }
    }
    return null;
  }

  /**
   * Извлекает числовую цену из текста
   * @param {string} text — строка с ценой
   * @returns {number|null} — числовое значение цены
   */
  function extractPrice(text) {
    if (!text) return null;
    const cleaned = text.replace(/\s+/g, '').replace(/[₸тгТГ.]/gi, '').replace(/,/g, '');
    const match = cleaned.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Форматирует цену с разделителями разрядов
   * @param {number} price
   * @returns {string}
   */
  function formatPrice(price) {
    return price.toLocaleString('ru-RU') + ' ₸';
  }

  /**
   * Находит строительные ключевые слова в тексте
   * @param {string} text
   * @returns {string[]} — найденные ключевые слова
   */
  function findKeywords(text) {
    if (!text) return [];
    const lowerText = text.toLowerCase();
    return CONSTRUCTION_KEYWORDS.filter(kw => lowerText.includes(kw));
  }

  /**
   * Получает/сохраняет кэш из sessionStorage
   * @param {string} key
   * @param {*} value — если указано, сохраняет
   * @returns {*|null}
   */
  function cache(key, value) {
    const cacheKey = CONFIG.CACHE_PREFIX + key;
    if (value !== undefined) {
      const entry = { data: value, ts: Date.now() };
      try { sessionStorage.setItem(cacheKey, JSON.stringify(entry)); } catch (e) { /* квота */ }
      return value;
    }
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CONFIG.CACHE_TTL) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  // =====================================================
  // API ЗАПРОСЫ (через Service Worker)
  // =====================================================

  /**
   * Запрашивает рыночную цену через service worker
   * @param {string} keyword — ключевое слово
   * @returns {Promise<object|null>} — данные о цене
   */
  async function fetchMarketPrice(keyword) {
    // Проверяем кэш
    const cached = cache(keyword);
    if (cached) return cached;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        endpoint: `/api/v1/prices?q=${encodeURIComponent(keyword)}&limit=1`,
        method: 'GET',
      });

      if (response && response.success && response.data) {
        const result = Array.isArray(response.data)
          ? response.data[0] || null
          : response.data;
        cache(keyword, result);
        return result;
      }
    } catch (err) {
      console.warn('[QazGost] Ошибка запроса цены:', err.message);
    }
    return null;
  }

  // =====================================================
  // СОЗДАНИЕ БЕЙДЖЕЙ
  // =====================================================

  /**
   * Вычисляет статус цены относительно рыночной
   * @param {number} actual — фактическая цена
   * @param {number} market — средняя рыночная цена
   * @returns {{status: string, label: string, diff: number}}
   */
  function getPriceStatus(actual, market) {
    if (!actual || !market || market === 0) {
      return { status: 'unknown', label: '❓ Нет данных', diff: 0 };
    }
    const diff = ((actual - market) / market) * 100;
    if (Math.abs(diff) <= 10) {
      return { status: 'ok', label: '✅ Цена в рынке', diff: Math.round(diff) };
    } else if (diff > 10) {
      return { status: 'high', label: `⚠️ Выше рынка на ${Math.round(diff)}%`, diff: Math.round(diff) };
    } else {
      return { status: 'low', label: `💡 Ниже рынка на ${Math.abs(Math.round(diff))}%`, diff: Math.round(diff) };
    }
  }

  /**
   * Создаёт DOM-элемент бейджа QazGost
   * @param {number} marketPrice — средняя рыночная цена
   * @param {number} actualPrice — цена в объявлении
   * @param {string} keyword — найденное ключевое слово
   * @returns {HTMLElement}
   */
  function createBadge(marketPrice, actualPrice, keyword) {
    const priceInfo = getPriceStatus(actualPrice, marketPrice);
    const badge = document.createElement('div');
    badge.className = CONFIG.BADGE_CLASS;
    badge.setAttribute('data-qazgost-keyword', keyword);

    const iconURL = chrome.runtime.getURL('icons/icon-16.png');

    badge.innerHTML = `
      <div class="qazgost-badge-header">
        <img src="${iconURL}" alt="QG" width="14" height="14" />
        <span>QazGost AI</span>
        <button class="qazgost-badge-close" title="Закрыть">✕</button>
      </div>
      <div class="qazgost-badge-body">
        <span class="qazgost-market-price">Средняя цена: ${formatPrice(marketPrice)}</span>
        <span class="qazgost-price-status qazgost-status-${priceInfo.status}">${priceInfo.label}</span>
      </div>
      <button class="qazgost-badge-btn" data-keyword="${keyword}">🚜 Открыть в QazGost →</button>
    `;

    // Закрытие бейджа
    badge.querySelector('.qazgost-badge-close').addEventListener('click', (e) => {
      e.stopPropagation();
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 200);
    });

    // Кнопка "Открыть в QazGost"
    badge.querySelector('.qazgost-badge-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({
        type: 'OPEN_POPUP',
        query: keyword,
        price: actualPrice,
      });
    });

    return badge;
  }

  // =====================================================
  // СКАНИРОВАНИЕ DOM
  // =====================================================

  /**
   * Ищет элементы по массиву селекторов
   * @param {string[]} selectors — CSS-селекторы
   * @param {Element} root — корневой элемент для поиска
   * @returns {Element[]} — найденные элементы
   */
  function querySelectors(selectors, root = document) {
    for (const selector of selectors) {
      try {
        const elements = root.querySelectorAll(selector);
        if (elements.length > 0) return Array.from(elements);
      } catch (e) { /* невалидный селектор */ }
    }
    return [];
  }

  /**
   * Главная функция сканирования страницы
   * Находит цены и строительные термины, внедряет бейджи
   */
  async function scanPage() {
    if (!overlayEnabled) return;

    const siteConfig = getSiteConfig();
    if (!siteConfig) {
      // Общий сканер для неизвестных площадок — ищем ₸ / тг в тексте
      scanGenericPage();
      return;
    }

    const listings = querySelectors(siteConfig.listing);
    if (listings.length === 0) {
      // Попробуем общий сканер
      scanGenericPage();
      return;
    }

    for (const listing of listings) {
      if (listing.hasAttribute(CONFIG.PROCESSED_ATTR)) continue;
      listing.setAttribute(CONFIG.PROCESSED_ATTR, 'true');

      // Извлекаем цену
      const priceElements = querySelectors(siteConfig.price, listing);
      const titleElements = querySelectors(siteConfig.title, listing);

      const priceText = priceElements[0]?.textContent || '';
      const titleText = titleElements[0]?.textContent || '';
      const actualPrice = extractPrice(priceText);

      // Ищем строительные ключевые слова
      const fullText = `${titleText} ${priceText}`.toLowerCase();
      const keywords = findKeywords(fullText);

      if (keywords.length === 0 || !actualPrice) continue;

      // Берём первое ключевое слово для запроса
      const keyword = keywords[0];

      try {
        const marketData = await fetchMarketPrice(keyword);
        const marketPrice = marketData?.avg_price || marketData?.price || actualPrice * 0.95;
        const badge = createBadge(marketPrice, actualPrice, keyword);

        // Внедряем бейдж рядом с ценой
        const anchor = priceElements[0] || listing;
        anchor.style.position = anchor.style.position || 'relative';
        anchor.parentElement?.insertBefore(badge, anchor.nextSibling);
        badgeCount++;
      } catch (err) {
        console.warn('[QazGost] Ошибка внедрения бейджа:', err);
      }
    }

    updateToggleCounter();
  }

  /**
   * Общий сканер для страниц без известных селекторов
   * Ищет элементы, содержащие ₸ или тг
   */
  function scanGenericPage() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const text = node.textContent.toLowerCase();
          const hasPrice = text.includes('₸') || text.includes('тг');
          const hasKeyword = CONSTRUCTION_KEYWORDS.some(kw => text.includes(kw));
          return (hasPrice && hasKeyword) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      },
    );

    let node;
    let genericCount = 0;
    while ((node = walker.nextNode()) && genericCount < 20) {
      const parentEl = node.parentElement;
      if (!parentEl || parentEl.hasAttribute(CONFIG.PROCESSED_ATTR)) continue;
      parentEl.setAttribute(CONFIG.PROCESSED_ATTR, 'true');

      const text = node.textContent;
      const keywords = findKeywords(text);
      const price = extractPrice(text);

      if (keywords.length > 0 && price) {
        // Создаём бейдж с примерными данными
        const badge = createBadge(price, price, keywords[0]);
        parentEl.style.position = parentEl.style.position || 'relative';
        parentEl.appendChild(badge);
        badgeCount++;
        genericCount++;
      }
    }
    updateToggleCounter();
  }

  // =====================================================
  // ПЛАВАЮЩАЯ КНОПКА ПЕРЕКЛЮЧЕНИЯ
  // =====================================================

  /** Создаёт кнопку-переключатель в правом нижнем углу */
  function createToggleButton() {
    if (document.getElementById('qazgost-toggle-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'qazgost-toggle-btn';
    btn.className = 'qazgost-toggle-btn';
    btn.innerHTML = `
      <img src="${chrome.runtime.getURL('icons/icon-32.png')}" alt="QG" width="24" height="24" />
      <span class="qazgost-toggle-count">0</span>
    `;
    btn.title = 'QazGost AI — показать/скрыть бейджи';

    btn.addEventListener('click', () => {
      overlayEnabled = !overlayEnabled;
      toggleAllBadges(overlayEnabled);
      btn.classList.toggle('qazgost-toggle-off', !overlayEnabled);
    });

    document.body.appendChild(btn);
  }

  /** Обновляет счётчик на кнопке */
  function updateToggleCounter() {
    const counter = document.querySelector('.qazgost-toggle-count');
    if (counter) counter.textContent = badgeCount.toString();
  }

  /** Показывает или скрывает все бейджи */
  function toggleAllBadges(visible) {
    document.querySelectorAll(`.${CONFIG.BADGE_CLASS}`).forEach(badge => {
      badge.style.display = visible ? '' : 'none';
    });
  }

  // =====================================================
  // MUTATION OBSERVER (бесконечная прокрутка)
  // =====================================================

  /** Устанавливает наблюдатель за изменениями DOM */
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        debouncedScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /** Дебаунсированный вызов сканирования */
  function debouncedScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scanPage(), CONFIG.SCAN_DEBOUNCE);
  }

  // =====================================================
  // ОБРАБОТКА СООБЩЕНИЙ
  // =====================================================

  /** Слушаем сообщения от service worker */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'TOGGLE_OVERLAY':
        overlayEnabled = message.enabled !== undefined ? message.enabled : !overlayEnabled;
        toggleAllBadges(overlayEnabled);
        const toggleBtn = document.getElementById('qazgost-toggle-btn');
        if (toggleBtn) toggleBtn.classList.toggle('qazgost-toggle-off', !overlayEnabled);
        sendResponse({ success: true, enabled: overlayEnabled });
        break;

      case 'RESCAN_PAGE':
        // Сброс обработанных элементов и повторное сканирование
        document.querySelectorAll(`[${CONFIG.PROCESSED_ATTR}]`).forEach(el => {
          el.removeAttribute(CONFIG.PROCESSED_ATTR);
        });
        document.querySelectorAll(`.${CONFIG.BADGE_CLASS}`).forEach(el => el.remove());
        badgeCount = 0;
        scanPage();
        sendResponse({ success: true });
        break;

      case 'GET_PAGE_INFO':
        sendResponse({
          url: window.location.href,
          title: document.title,
          badgeCount,
          overlayEnabled,
          host: currentHost,
        });
        break;

      default:
        break;
    }
    return true; // async response
  });

  // =====================================================
  // ИНИЦИАЛИЗАЦИЯ
  // =====================================================

  async function init() {
    // Проверяем настройки — включён ли оверлей
    try {
      const settings = await chrome.storage.sync.get({
        overlayEnabled: true,
        apiUrl: CONFIG.API_BASE,
      });
      overlayEnabled = settings.overlayEnabled;
      CONFIG.API_BASE = settings.apiUrl || CONFIG.API_BASE;
    } catch (e) {
      console.warn('[QazGost] Не удалось прочитать настройки:', e);
    }

    if (!overlayEnabled) return;

    // Создаём кнопку-переключатель
    createToggleButton();

    // Первое сканирование
    await scanPage();

    // Устанавливаем наблюдатель за изменениями
    setupMutationObserver();

    console.log(`[QazGost AI] Оверлей инициализирован на ${currentHost} — найдено ${badgeCount} бейджей`);
  }

  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
