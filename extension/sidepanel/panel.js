/**
 * QazGost AI — Side Panel Script: panel.js
 *
 * Полноценный AI-чат ассистент для строительного помощника.
 * Поддерживает отправку запросов к API, офлайн-справочник,
 * форматирование ответов и быстрые подсказки.
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
    AI_API_BASE: 'http://localhost:8001',
    MAX_MESSAGES: 100,
  };

  // =====================================================
  // ОФЛАЙН СПРАВОЧНИК — Казахстанские строительные данные
  // =====================================================

  const OFFLINE_DATA = {
    /** Средние цены на материалы (тенге) */
    materials: {
      'бетон М350':       { price: 22000, unit: 'м³',   category: 'бетон' },
      'бетон М200':       { price: 18000, unit: 'м³',   category: 'бетон' },
      'бетон М400':       { price: 25000, unit: 'м³',   category: 'бетон' },
      'кирпич М150':      { price: 4500,  unit: 'м²',   category: 'кладка' },
      'кирпич М100':      { price: 3800,  unit: 'м²',   category: 'кладка' },
      'арматура А500С':   { price: 420,   unit: 'кг',   category: 'металл' },
      'арматура А400':    { price: 380,   unit: 'кг',   category: 'металл' },
      'цемент М500':      { price: 2800,  unit: 'мешок (50 кг)', category: 'вяжущие' },
      'цемент М400':      { price: 2400,  unit: 'мешок (50 кг)', category: 'вяжущие' },
      'песок':            { price: 5000,  unit: 'т',    category: 'инертные' },
      'щебень':           { price: 7000,  unit: 'т',    category: 'инертные' },
      'гипсокартон':      { price: 2200,  unit: 'лист', category: 'отделка' },
      'штукатурка':       { price: 1800,  unit: 'мешок (25 кг)', category: 'отделка' },
      'плитка керамическая': { price: 3500, unit: 'м²', category: 'отделка' },
      'утеплитель минвата': { price: 1200, unit: 'м²',  category: 'изоляция' },
      'пеноплекс 50мм':   { price: 1800,  unit: 'м²',  category: 'изоляция' },
      'труба ПП 25мм':    { price: 350,   unit: 'м.п.', category: 'инженерия' },
      'кабель ВВГнг 3x2.5': { price: 250, unit: 'м.п.', category: 'инженерия' },
      'профнастил С8':    { price: 2800,  unit: 'м²',   category: 'кровля' },
      'металлочерепица':  { price: 3200,  unit: 'м²',   category: 'кровля' },
    },

    /** Строительные формулы */
    formulas: {
      'объём бетона': 'V = Длина × Ширина × Толщина (м³). Фундамент ленточный: V = Периметр × Ширина × Глубина.',
      'вес арматуры': 'Масса = Длина × Плотность стали (7850 кг/м³) × Площадь сечения. d12: 0.888 кг/м.п., d16: 1.58 кг/м.п.',
      'количество кирпича': 'На 1 м² кладки в 1 кирпич: ~52 шт. В 1.5 кирпича: ~78 шт. В 2 кирпича: ~104 шт.',
      'расход краски': 'На 1 м² гладкой стены: 100-150 г. На фактурную: 200-300 г. 1 л краски ≈ 7-10 м².',
      'расход штукатурки': 'На 1 м² при толщине 10мм: ~8.5 кг. При 20мм: ~17 кг.',
      'расход цемента': 'На 1 м³ бетона М200: ~300 кг цемента, 600 кг песка, 1200 кг щебня, 150 л воды.',
    },

    /** Нормы СНиП для утепления по климатическим зонам */
    snip: {
      'Алматы': { zone: 'III', wallR: 3.05, roofR: 4.2, description: 'Юг Казахстана, умеренно-континентальный' },
      'Нур-Султан': { zone: 'I', wallR: 3.56, roofR: 5.0, description: 'Центр Казахстана, резко-континентальный' },
      'Астана': { zone: 'I', wallR: 3.56, roofR: 5.0, description: 'Центр Казахстана, резко-континентальный' },
      'Караганда': { zone: 'I', wallR: 3.45, roofR: 4.8, description: 'Центр Казахстана' },
      'Актау': { zone: 'IV', wallR: 2.55, roofR: 3.5, description: 'Запад Казахстана, аридный' },
      'Усть-Каменогорск': { zone: 'I', wallR: 3.60, roofR: 5.1, description: 'Восток Казахстана, резко-континентальный' },
      'Шымкент': { zone: 'IV', wallR: 2.60, roofR: 3.6, description: 'Юг Казахстана' },
    },
  };

  /** Предопределённые быстрые подсказки */
  const QUICK_PROMPTS = {
    estimate:  'Помогите рассчитать смету. Укажите тип работ и площадь.',
    defects:   'Какие типы строительных дефектов вы хотите проверить?',
    gost:      'По какому строительному стандарту нужна консультация?',
    materials: 'Какие строительные материалы вас интересуют?',
  };

  // =====================================================
  // СОСТОЯНИЕ
  // =====================================================

  const state = {
    messages: [],
    isProcessing: false,
    apiOnline: true,
  };

  // =====================================================
  // DOM-ЭЛЕМЕНТЫ
  // =====================================================

  const els = {
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn:      document.getElementById('sendBtn'),
    clearChat:    document.getElementById('clearChat'),
    quickPrompts: document.getElementById('quickPrompts'),
    typingIndicator: document.getElementById('typingIndicator'),
    statusDot:    document.querySelector('.status-dot'),
    statusLabel:  document.getElementById('statusLabel'),
  };

  // =====================================================
  // ИНИЦИАЛИЗАЦИЯ
  // =====================================================

  async function init() {
    // Загружаем настройки
    try {
      const settings = await chrome.storage.sync.get({
        apiUrl: CONFIG.API_BASE,
        aiApiUrl: CONFIG.AI_API_BASE,
      });
      CONFIG.API_BASE = settings.apiUrl || CONFIG.API_BASE;
      CONFIG.AI_API_BASE = settings.aiApiUrl || CONFIG.AI_API_BASE;
    } catch (e) {
      console.warn('[QazGost Panel] Ошибка загрузки настроек:', e);
    }

    // Загружаем историю чата
    loadChatHistory();

    // Привязываем события
    bindEvents();

    // Проверяем связь с API
    checkApiStatus();

    console.log('[QazGost AI] Панель ассистента инициализирована');
  }

  // =====================================================
  // СОБЫТИЯ
  // =====================================================

  function bindEvents() {
    // Отправка сообщения
    els.sendBtn.addEventListener('click', handleSend);

    // Клавиши в textarea
    els.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Авторесайз textarea
    els.messageInput.addEventListener('input', () => {
      autoResizeTextarea();
      els.sendBtn.disabled = !els.messageInput.value.trim();
    });

    // Очистка чата
    els.clearChat.addEventListener('click', clearChat);

    // Быстрые подсказки
    els.quickPrompts.addEventListener('click', (e) => {
      const chip = e.target.closest('.quick-prompt-chip');
      if (!chip) return;
      const promptKey = chip.dataset.prompt;
      const promptText = QUICK_PROMPTS[promptKey];
      if (promptText) {
        addMessage('assistant', promptText);
      }
    });

    // Сообщения от service worker / контент-скрипта
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleIncomingMessage(message);
      sendResponse({ received: true });
      return true;
    });
  }

  // =====================================================
  // ОБРАБОТКА СООБЩЕНИЙ
  // =====================================================

  /** Обработка нажатия кнопки отправки */
  async function handleSend() {
    const text = els.messageInput.value.trim();
    if (!text || state.isProcessing) return;

    // Показать сообщение пользователя
    addMessage('user', text);
    els.messageInput.value = '';
    autoResizeTextarea();
    els.sendBtn.disabled = true;

    // Обработать запрос
    await processQuery(text);
  }

  /**
   * Обрабатывает пользовательский запрос
   * @param {string} query
   */
  async function processQuery(query) {
    state.isProcessing = true;
    showTypingIndicator(true);

    try {
      // 1. Пробуем отправить на AI API
      let response = await sendToAI(query);

      // 2. Если AI не ответил, пробуем поиск цен
      if (!response) {
        response = await searchPrices(query);
      }

      // 3. Если API недоступен — используем офлайн-справочник
      if (!response) {
        response = getOfflineResponse(query);
      }

      // 4. Отображаем ответ
      if (response) {
        addMessage('assistant', response.text, response.cards);
      } else {
        addMessage('assistant', 'Извините, не удалось обработать запрос. Попробуйте уточнить вопрос или проверьте подключение к серверу.');
      }
    } catch (err) {
      console.error('[QazGost Panel] Ошибка обработки:', err);
      addMessage('assistant', `⚠️ Произошла ошибка: ${err.message}. Попробуйте ещё раз.`);
    } finally {
      state.isProcessing = false;
      showTypingIndicator(false);
    }
  }

  // =====================================================
  // API ЗАПРОСЫ
  // =====================================================

  /**
   * Отправляет запрос к AI сервису
   * @param {string} query
   * @returns {Promise<object|null>}
   */
  async function sendToAI(query) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        baseUrl: CONFIG.AI_API_BASE,
        endpoint: '/api/v1/ai/estimate',
        method: 'POST',
        body: { description: query },
      });

      if (response && response.success && response.data) {
        setApiStatus(true);
        return formatAIResponse(response.data);
      }
    } catch (err) {
      console.warn('[QazGost Panel] AI API недоступен:', err.message);
    }
    return null;
  }

  /**
   * Ищет цены на материалы/работы
   * @param {string} query
   * @returns {Promise<object|null>}
   */
  async function searchPrices(query) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        endpoint: `/api/v1/prices?q=${encodeURIComponent(query)}`,
        method: 'GET',
      });

      if (response && response.success && response.data) {
        const items = Array.isArray(response.data) ? response.data : [response.data];
        if (items.length > 0) {
          setApiStatus(true);
          return formatPriceResponse(items, query);
        }
      }
    } catch (err) {
      console.warn('[QazGost Panel] Price API недоступен:', err.message);
    }
    return null;
  }

  // =====================================================
  // ФОРМАТИРОВАНИЕ ОТВЕТОВ
  // =====================================================

  /**
   * Форматирует ответ AI сервиса
   * @param {object} data
   * @returns {object}
   */
  function formatAIResponse(data) {
    const result = { text: '', cards: [] };

    // Если есть смета
    if (data.estimate || data.items || data.total) {
      const items = data.items || data.estimate?.items || [];
      const total = data.total || data.estimate?.total || 0;

      result.text = '📐 <strong>Результат расчёта сметы:</strong>';
      result.cards.push({
        type: 'estimate',
        title: 'Смета',
        items: items.map(item => ({
          name: item.name || item.material || 'Позиция',
          quantity: item.quantity || item.amount || '-',
          unit: item.unit || 'шт',
          price: item.price || item.unit_price || 0,
          total: item.total || (item.quantity || 0) * (item.price || 0),
        })),
        total,
      });
      return result;
    }

    // Если есть дефекты
    if (data.defects || data.severity) {
      result.text = '🔍 <strong>Результат анализа:</strong>';
      const defects = data.defects || [data];
      for (const defect of defects) {
        result.cards.push({
          type: 'defect',
          title: defect.name || defect.type || 'Дефект',
          severity: defect.severity || 'info',
          description: defect.description || defect.recommendation || '',
        });
      }
      return result;
    }

    // Обычный текстовый ответ
    result.text = data.response || data.message || data.text || JSON.stringify(data);
    return result;
  }

  /**
   * Форматирует ответ поиска цен
   * @param {Array} items
   * @param {string} query
   * @returns {object}
   */
  function formatPriceResponse(items, query) {
    return {
      text: `🏷️ <strong>Найдены цены по запросу «${escapeHtml(query)}»:</strong>`,
      cards: [{
        type: 'prices',
        title: 'Цены на материалы',
        items: items.map(item => ({
          name: item.name || item.material || query,
          price: item.price || item.avg_price || 0,
          unit: item.unit || 'шт',
          source: item.source || 'QazGost DB',
        })),
      }],
    };
  }

  // =====================================================
  // ОФЛАЙН ОТВЕТЫ
  // =====================================================

  /**
   * Генерирует ответ из офлайн-справочника
   * @param {string} query
   * @returns {object|null}
   */
  function getOfflineResponse(query) {
    const lowerQuery = query.toLowerCase();
    const result = { text: '', cards: [] };

    // Поиск по материалам
    const matchedMaterials = [];
    for (const [name, data] of Object.entries(OFFLINE_DATA.materials)) {
      if (lowerQuery.includes(name.split(' ')[0].toLowerCase()) ||
          name.toLowerCase().includes(lowerQuery.split(' ')[0])) {
        matchedMaterials.push({ name, ...data });
      }
    }

    if (matchedMaterials.length > 0) {
      setApiStatus(false);
      result.text = '🧱 <strong>Справочные цены (офлайн):</strong>';
      result.cards.push({
        type: 'prices',
        title: 'Средние цены в Казахстане',
        items: matchedMaterials.map(m => ({
          name: m.name,
          price: m.price,
          unit: m.unit,
          source: 'Справочник QazGost',
        })),
      });
      return result;
    }

    // Поиск по формулам
    for (const [key, formula] of Object.entries(OFFLINE_DATA.formulas)) {
      if (lowerQuery.includes(key.split(' ')[0]) ||
          key.toLowerCase().includes(lowerQuery.split(' ')[0])) {
        setApiStatus(false);
        result.text = `📏 <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong><br>${formula}`;
        return result;
      }
    }

    // Поиск по СНиП
    for (const [city, data] of Object.entries(OFFLINE_DATA.snip)) {
      if (lowerQuery.includes(city.toLowerCase())) {
        setApiStatus(false);
        result.text = `📜 <strong>Нормы утепления для г. ${city}:</strong>`;
        result.text += `<br>Климатическая зона: <strong>${data.zone}</strong>`;
        result.text += `<br>R стен: <strong>${data.wallR} м²·°C/Вт</strong>`;
        result.text += `<br>R кровли: <strong>${data.roofR} м²·°C/Вт</strong>`;
        result.text += `<br><em>${data.description}</em>`;
        return result;
      }
    }

    // Если в запросе есть смета / расчёт
    if (lowerQuery.includes('смет') || lowerQuery.includes('расчёт') || lowerQuery.includes('расчет')) {
      result.text = '📐 Для расчёта сметы укажите:';
      result.text += '<ul><li>Тип работ (фундамент, кладка, отделка и т.д.)</li>';
      result.text += '<li>Площадь или объём</li>';
      result.text += '<li>Город (для учёта региональных цен)</li></ul>';
      result.text += '<em>Пример: «Рассчитай смету на штукатурку 120 м² в Алматы»</em>';
      return result;
    }

    // Если ничего не найдено — покажем общий справочник
    if (lowerQuery.includes('материал') || lowerQuery.includes('цен')) {
      result.text = '🧱 <strong>Справочник средних цен в Казахстане:</strong>';
      const allMaterials = Object.entries(OFFLINE_DATA.materials).slice(0, 10);
      result.cards.push({
        type: 'prices',
        title: 'Популярные строительные материалы',
        items: allMaterials.map(([name, data]) => ({
          name,
          price: data.price,
          unit: data.unit,
          source: 'Справочник',
        })),
      });
      return result;
    }

    return null;
  }

  // =====================================================
  // ОТРИСОВКА СООБЩЕНИЙ
  // =====================================================

  /**
   * Добавляет сообщение в чат
   * @param {'user'|'assistant'} role
   * @param {string} text — HTML-текст сообщения
   * @param {Array} cards — структурированные карточки
   */
  function addMessage(role, text, cards = []) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Сохраняем в state
    state.messages.push({ role, text, cards, time: now.toISOString() });
    if (state.messages.length > CONFIG.MAX_MESSAGES) {
      state.messages.shift();
    }
    saveChatHistory();

    // Создаём DOM-элемент
    const msgEl = document.createElement('div');
    msgEl.className = `message message-${role}`;

    const avatar = role === 'user' ? '👤' : '🤖';

    let bubbleContent = `<p>${text}</p>`;

    // Рендерим карточки
    for (const card of cards) {
      bubbleContent += renderCard(card);
    }

    msgEl.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-bubble">${bubbleContent}</div>
        <span class="message-time">${timeStr}</span>
      </div>
    `;

    els.chatMessages.appendChild(msgEl);
    scrollToBottom();
  }

  /**
   * Рендерит структурированную карточку
   * @param {object} card
   * @returns {string} HTML
   */
  function renderCard(card) {
    switch (card.type) {
      case 'prices':
        return renderPriceCard(card);
      case 'estimate':
        return renderEstimateCard(card);
      case 'defect':
        return renderDefectCard(card);
      default:
        return '';
    }
  }

  /** Карточка с ценами */
  function renderPriceCard(card) {
    let rows = '';
    for (const item of card.items) {
      rows += `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td class="price-value">${formatPrice(item.price)}</td>
        <td>${escapeHtml(item.unit)}</td>
      </tr>`;
    }
    return `
      <div class="msg-card">
        <div class="msg-card-title">🏷️ ${escapeHtml(card.title)}</div>
        <table class="msg-price-table">
          <thead><tr><th>Материал</th><th>Цена</th><th>Ед.</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  /** Карточка со сметой */
  function renderEstimateCard(card) {
    let rows = '';
    for (const item of card.items) {
      rows += `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.quantity} ${escapeHtml(item.unit)}</td>
        <td class="price-value">${formatPrice(item.price)}</td>
        <td class="price-value">${formatPrice(item.total)}</td>
      </tr>`;
    }
    return `
      <div class="msg-card">
        <div class="msg-card-title">📐 ${escapeHtml(card.title)}</div>
        <table class="msg-price-table">
          <thead><tr><th>Позиция</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="msg-estimate-total">Итого: ${formatPrice(card.total)}</div>
      </div>
    `;
  }

  /** Карточка дефекта */
  function renderDefectCard(card) {
    const severityClass = {
      critical: 'msg-severity-critical',
      warning:  'msg-severity-warning',
      info:     'msg-severity-info',
    }[card.severity] || 'msg-severity-info';

    const severityLabel = {
      critical: 'Критический',
      warning:  'Предупреждение',
      info:     'Информация',
    }[card.severity] || 'Информация';

    return `
      <div class="msg-card">
        <div class="msg-card-title">🔍 ${escapeHtml(card.title)}</div>
        <span class="msg-severity ${severityClass}">${severityLabel}</span>
        <p style="margin-top: 6px; font-size: 12px; color: #b0bec5;">
          ${escapeHtml(card.description)}
        </p>
      </div>
    `;
  }

  // =====================================================
  // ВХОДЯЩИЕ СООБЩЕНИЯ ОТ РАСШИРЕНИЯ
  // =====================================================

  /**
   * Обрабатывает сообщения от service worker
   * @param {object} message
   */
  function handleIncomingMessage(message) {
    switch (message.type) {
      case 'PHOTO_ANALYSIS_RESULT':
        addMessage('assistant', '📸 <strong>Результат анализа фото:</strong>', [
          {
            type: 'defect',
            title: message.data?.defect_type || 'Анализ изображения',
            severity: message.data?.severity || 'info',
            description: message.data?.description || 'Анализ завершён.',
          },
        ]);
        break;

      case 'PRICE_SEARCH_RESULT':
        if (message.data && message.data.length > 0) {
          addMessage('assistant', '🏷️ <strong>Результаты поиска цен:</strong>', [{
            type: 'prices',
            title: 'Найденные цены',
            items: message.data.map(item => ({
              name: item.name || item.material,
              price: item.price || item.avg_price,
              unit: item.unit || 'шт',
              source: item.source || 'QazGost',
            })),
          }]);
        }
        break;

      case 'ESTIMATION_RESULT':
        if (message.data) {
          const formatted = formatAIResponse(message.data);
          addMessage('assistant', formatted.text, formatted.cards);
        }
        break;

      default:
        break;
    }
  }

  // =====================================================
  // УТИЛИТЫ
  // =====================================================

  /** Авторесайз textarea */
  function autoResizeTextarea() {
    const ta = els.messageInput;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  /** Прокрутка к последнему сообщению */
  function scrollToBottom() {
    requestAnimationFrame(() => {
      els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    });
  }

  /** Показывает/скрывает индикатор набора */
  function showTypingIndicator(show) {
    els.typingIndicator.style.display = show ? 'flex' : 'none';
    if (show) scrollToBottom();
  }

  /** Форматирует цену */
  function formatPrice(price) {
    if (!price && price !== 0) return '—';
    return Number(price).toLocaleString('ru-RU') + ' ₸';
  }

  /** Экранирует HTML */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Обновляет статус подключения */
  function setApiStatus(online) {
    state.apiOnline = online;
    els.statusDot.className = `status-dot ${online ? 'status-online' : 'status-offline'}`;
    els.statusLabel.textContent = online ? 'Онлайн' : 'Офлайн';
  }

  /** Проверяет доступность API */
  async function checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        endpoint: '/api/v1/health',
        method: 'GET',
      });
      setApiStatus(response && response.success);
    } catch {
      setApiStatus(false);
    }
  }

  // =====================================================
  // ХРАНЕНИЕ ИСТОРИИ ЧАТА
  // =====================================================

  /** Сохраняет историю чата */
  function saveChatHistory() {
    try {
      const toSave = state.messages.slice(-50); // Последние 50 сообщений
      chrome.storage.local.set({ chatHistory: toSave });
    } catch (e) {
      console.warn('[QazGost Panel] Ошибка сохранения истории:', e);
    }
  }

  /** Загружает историю чата */
  async function loadChatHistory() {
    try {
      const data = await chrome.storage.local.get('chatHistory');
      if (data.chatHistory && Array.isArray(data.chatHistory)) {
        for (const msg of data.chatHistory) {
          addMessage(msg.role, msg.text, msg.cards || []);
        }
      }
    } catch (e) {
      console.warn('[QazGost Panel] Ошибка загрузки истории:', e);
    }
  }

  /** Очищает чат */
  function clearChat() {
    state.messages = [];
    chrome.storage.local.remove('chatHistory');

    // Удаляем все сообщения из DOM, кроме первого (приветственного)
    const messages = els.chatMessages.querySelectorAll('.message');
    messages.forEach((msg, i) => {
      if (i > 0) msg.remove();
    });
  }

  // =====================================================
  // ЗАПУСК
  // =====================================================

  init();
})();
