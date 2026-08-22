/**
 * ============================================================
 * QazGost AI — Service Worker (Manifest V3)
 * ============================================================
 * Фоновый скрипт расширения. Отвечает за:
 *  • Контекстное меню (поиск расценок, анализ фото, дефекты, смета)
 *  • Периодический опрос заказов (chrome.alarms)
 *  • Управление бейджем на иконке
 *  • Обработку сообщений от popup / sidepanel / content-script
 * ============================================================
 */

'use strict';

// ─── Настройки по умолчанию ─────────────────────────────────
const DEFAULT_API_BASE = 'http://localhost:8080';
const DEFAULT_AI_BASE  = 'http://localhost:8001';
const ORDERS_ALARM     = 'checkOrders';
const ORDERS_INTERVAL  = 5; // минуты

// ─── Утилиты ────────────────────────────────────────────────

/**
 * Получить базовый URL API из настроек (chrome.storage.sync).
 * @returns {Promise<string>}
 */
async function getApiBase() {
  try {
    const { apiBase } = await chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE });
    return apiBase;
  } catch (err) {
    console.warn('[QazGost] Ошибка чтения apiBase из storage:', err);
    return DEFAULT_API_BASE;
  }
}

/**
 * Получить базовый URL AI-сервиса из настроек.
 * @returns {Promise<string>}
 */
async function getAiBase() {
  try {
    const { aiBase } = await chrome.storage.sync.get({ aiBase: DEFAULT_AI_BASE });
    return aiBase;
  } catch (err) {
    console.warn('[QazGost] Ошибка чтения aiBase из storage:', err);
    return DEFAULT_AI_BASE;
  }
}

/**
 * fetch с таймаутом — предотвращает зависание запросов.
 * @param {string}  url
 * @param {object}  options  — стандартные параметры fetch
 * @param {number}  timeout  — мс (по умолчанию 5000)
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Загрузить изображение по URL и вернуть base64-строку (data URI).
 * @param {string} imageUrl
 * @returns {Promise<string>}
 */
async function imageUrlToBase64(imageUrl) {
  const response = await fetchWithTimeout(imageUrl, {}, 15000);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror   = () => reject(new Error('Не удалось прочитать изображение'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Показать системное уведомление Chrome.
 * @param {string} title
 * @param {string} message
 * @param {string} [iconUrl]
 */
function showNotification(title, message, iconUrl) {
  chrome.notifications.create({
    type:    'basic',
    iconUrl: iconUrl || chrome.runtime.getURL('icons/icon-128.png'),
    title,
    message,
    priority: 1,
  });
}

/**
 * Обновить бейдж расширения (счётчик непрочитанных).
 * @param {number} count
 */
function updateBadge(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

// ─── Контекстное меню ───────────────────────────────────────

/**
 * Регистрация пунктов контекстного меню при установке расширения.
 */
chrome.runtime.onInstalled.addListener(() => {
  // 1. Поиск расценки по выделенному тексту
  chrome.contextMenus.create({
    id:       'searchPrice',
    title:    '🔍 Найти расценку «%s» в QazGost',
    contexts: ['selection'],
  });

  // 2. Оценка стоимости по фото
  chrome.contextMenus.create({
    id:       'analyzePhoto',
    title:    '📸 Оценить стоимость через QazGost AI',
    contexts: ['image'],
  });

  // 3. Проверка дефекта по фото
  chrome.contextMenus.create({
    id:       'analyzeDefect',
    title:    '🔍 Проверить дефект через QazGost AI',
    contexts: ['image'],
  });

  // 4. Добавить выделенный текст в смету
  chrome.contextMenus.create({
    id:       'addToEstimate',
    title:    '📐 Добавить в смету QazGost',
    contexts: ['selection'],
  });

  // Запускаем периодический опрос заказов
  chrome.alarms.create(ORDERS_ALARM, { periodInMinutes: ORDERS_INTERVAL });

  console.log('[QazGost] Расширение установлено, контекстное меню создано.');
});

// ─── Обработчик кликов по контекстному меню ─────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {

      // ── Поиск расценки ──────────────────────────────────
      case 'searchPrice': {
        const text = info.selectionText?.trim();
        if (!text) return;

        const apiBase = await getApiBase();
        const url     = `${apiBase}/api/v1/prices?q=${encodeURIComponent(text)}&limit=5`;

        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Сохраняем результат для popup
        await chrome.storage.local.set({
          lastPriceSearch: {
            query:     text,
            results:   data,
            timestamp: Date.now(),
          },
        });

        // Уведомление с первой найденной расценкой
        if (data?.length > 0) {
          const top = data[0];
          const price = top.price != null
            ? `${Number(top.price).toLocaleString('ru-KZ')} ₸`
            : 'н/д';
          showNotification(
            `Расценка: ${top.title || text}`,
            `Цена: ${price} / ${top.unit || 'ед.'}`,
          );
        } else {
          showNotification('QazGost AI', `По запросу «${text}» расценок не найдено.`);
        }
        break;
      }

      // ── Анализ фото → оценка стоимости ──────────────────
      case 'analyzePhoto': {
        const srcUrl = info.srcUrl;
        if (!srcUrl) return;

        showNotification('QazGost AI', '⏳ Анализируем изображение…');

        const base64  = await imageUrlToBase64(srcUrl);
        const aiBase  = await getAiBase();
        const url     = `${aiBase}/api/v1/ai/estimate`;

        const response = await fetchWithTimeout(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image: base64, mode: 'fast' }),
        }, 30000); // 30 с на AI-обработку

        if (!response.ok) throw new Error(`AI HTTP ${response.status}`);

        const result = await response.json();

        // Сохраняем результат для боковой панели
        await chrome.storage.local.set({
          lastPhotoAnalysis: {
            type:      'estimate',
            result,
            imageUrl:  srcUrl,
            timestamp: Date.now(),
          },
        });

        const cost = result.estimatedCost != null
          ? `${Number(result.estimatedCost).toLocaleString('ru-KZ')} ₸`
          : 'не определена';
        showNotification(
          'Оценка стоимости',
          `Примерная стоимость: ${cost}\n${result.description || ''}`,
        );

        // Открываем боковую панель с результатами
        if (tab?.id) {
          chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
        }
        break;
      }

      // ── Анализ дефекта по фото ─────────────────────────
      case 'analyzeDefect': {
        const srcUrl = info.srcUrl;
        if (!srcUrl) return;

        showNotification('QazGost AI', '⏳ Анализируем дефект…');

        const base64  = await imageUrlToBase64(srcUrl);
        const aiBase  = await getAiBase();
        const url     = `${aiBase}/api/v1/ai/defect`;

        const response = await fetchWithTimeout(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image: base64 }),
        }, 30000);

        if (!response.ok) throw new Error(`AI HTTP ${response.status}`);

        const result = await response.json();

        // Сохраняем для боковой панели
        await chrome.storage.local.set({
          lastDefectAnalysis: {
            type:      'defect',
            result,
            imageUrl:  srcUrl,
            timestamp: Date.now(),
          },
        });

        const severity   = result.severity || 'не определена';
        const defectType = result.defectType || result.type || 'Неизвестный';
        showNotification(
          `Дефект: ${defectType}`,
          `Серьёзность: ${severity}\n${result.description || ''}`,
        );

        if (tab?.id) {
          chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
        }
        break;
      }

      // ── Добавить в смету ────────────────────────────────
      case 'addToEstimate': {
        const text = info.selectionText?.trim();
        if (!text) return;

        // Читаем текущий список сметы
        const { estimateItems = [] } = await chrome.storage.local.get({ estimateItems: [] });

        estimateItems.push({
          text,
          sourceUrl: tab?.url || '',
          addedAt:   Date.now(),
        });

        await chrome.storage.local.set({ estimateItems });

        showNotification(
          'Добавлено в смету',
          `«${text.substring(0, 80)}${text.length > 80 ? '…' : ''}»\nВсего позиций: ${estimateItems.length}`,
        );
        break;
      }

      default:
        console.warn('[QazGost] Неизвестный пункт меню:', info.menuItemId);
    }
  } catch (err) {
    console.error('[QazGost] Ошибка обработки контекстного меню:', err);
    showNotification('Ошибка QazGost AI', `Не удалось выполнить действие: ${err.message}`);
  }
});

// ─── Периодический опрос заказов (alarms) ────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ORDERS_ALARM) return;

  try {
    const apiBase  = await getApiBase();
    const url      = `${apiBase}/api/v1/orders`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.warn('[QazGost] Не удалось получить заказы:', response.status);
      return;
    }

    const orders = await response.json();

    // Получаем ранее сохранённые статусы
    const { orderStatuses = {} } = await chrome.storage.local.get({ orderStatuses: {} });
    let changedCount = 0;

    for (const order of (orders || [])) {
      const id     = order.id || order._id;
      const status = order.status;
      if (!id) continue;

      // Если статус изменился — показываем уведомление
      if (orderStatuses[id] && orderStatuses[id] !== status) {
        changedCount++;
        showNotification(
          `Заказ #${id}`,
          `Статус изменён: ${orderStatuses[id]} → ${status}`,
        );
      }

      orderStatuses[id] = status;
    }

    await chrome.storage.local.set({ orderStatuses });

    // Считаем активные заказы для бейджа
    const activeOrders = (orders || []).filter(o =>
      o.status && !['completed', 'cancelled', 'завершён', 'отменён'].includes(o.status.toLowerCase())
    );
    updateBadge(activeOrders.length);

  } catch (err) {
    console.warn('[QazGost] Ошибка опроса заказов:', err.message);
  }
});

// ─── Обработка сообщений от popup / sidepanel / content ──────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Оборачиваем в async IIFE, чтобы вернуть true для асинхронного ответа
  (async () => {
    try {
      switch (message.type) {

        // Обновить бейдж
        case 'updateBadge': {
          updateBadge(message.count || 0);
          sendResponse({ success: true });
          break;
        }

        // Проксировать поиск расценок из popup
        case 'fetchPrices': {
          const apiBase  = await getApiBase();
          const query    = encodeURIComponent(message.query || '');
          const limit    = message.limit || 10;
          const url      = `${apiBase}/api/v1/prices?q=${query}&limit=${limit}`;

          const response = await fetchWithTimeout(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          sendResponse({ success: true, data });
          break;
        }

        // Открыть боковую панель
        case 'openSidePanel': {
          if (sender.tab?.id) {
            await chrome.sidePanel.open({ tabId: sender.tab.id });
          }
          sendResponse({ success: true });
          break;
        }

        // Вернуть настройки
        case 'getSettings': {
          const settings = await chrome.storage.sync.get({
            apiBase:       DEFAULT_API_BASE,
            aiBase:        DEFAULT_AI_BASE,
            language:      'ru',
            notifications: true,
            pollInterval:  ORDERS_INTERVAL,
          });
          sendResponse({ success: true, data: settings });
          break;
        }

        // Сохранить настройки
        case 'saveSettings': {
          await chrome.storage.sync.set(message.settings || {});

          // Обновляем интервал опроса, если изменился
          if (message.settings?.pollInterval) {
            await chrome.alarms.clear(ORDERS_ALARM);
            chrome.alarms.create(ORDERS_ALARM, {
              periodInMinutes: message.settings.pollInterval,
            });
          }

          sendResponse({ success: true });
          break;
        }

        // Получить позиции сметы
        case 'getEstimate': {
          const { estimateItems = [] } = await chrome.storage.local.get({ estimateItems: [] });
          sendResponse({ success: true, data: estimateItems });
          break;
        }

        // Очистить смету
        case 'clearEstimate': {
          await chrome.storage.local.set({ estimateItems: [] });
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: `Неизвестный тип сообщения: ${message.type}` });
      }
    } catch (err) {
      console.error('[QazGost] Ошибка обработки сообщения:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  // Возвращаем true — ответ будет асинхронным
  return true;
});

// ─── Инициализация при запуске ────────────────────────────────

// Убеждаемся, что alarm создан (service worker может перезапуститься)
chrome.alarms.get(ORDERS_ALARM, (alarm) => {
  if (!alarm) {
    chrome.alarms.create(ORDERS_ALARM, { periodInMinutes: ORDERS_INTERVAL });
    console.log('[QazGost] Alarm для опроса заказов создан.');
  }
});

console.log('[QazGost] Service Worker запущен.');
