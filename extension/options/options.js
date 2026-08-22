/**
 * QazGost AI — Options Page Script: options.js
 *
 * Управление настройками расширения.
 * Сохраняет и загружает конфигурацию из chrome.storage.sync.
 *
 * @author QazGost AI Team
 */

(function () {
  'use strict';

  // =====================================================
  // ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
  // =====================================================

  const DEFAULTS = {
    apiUrl: 'http://localhost:8080',
    aiApiUrl: 'http://localhost:8001',
    jwtToken: '',
    city: 'Алматы',
    role: 'engineer',
    overlayEnabled: true,
    notificationsEnabled: true,
    autoScanEnabled: true,
    offlineMode: false,
  };

  // =====================================================
  // DOM-ЭЛЕМЕНТЫ
  // =====================================================

  const els = {
    apiUrl:               document.getElementById('apiUrl'),
    aiApiUrl:             document.getElementById('aiApiUrl'),
    jwtToken:             document.getElementById('jwtToken'),
    city:                 document.getElementById('city'),
    role:                 document.getElementById('role'),
    overlayEnabled:       document.getElementById('overlayEnabled'),
    notificationsEnabled: document.getElementById('notificationsEnabled'),
    autoScanEnabled:      document.getElementById('autoScanEnabled'),
    offlineMode:          document.getElementById('offlineMode'),
    saveBtn:              document.getElementById('saveBtn'),
    resetBtn:             document.getElementById('resetBtn'),
    testConnection:       document.getElementById('testConnection'),
    connectionStatus:     document.getElementById('connectionStatus'),
    connectionIcon:       document.getElementById('connectionIcon'),
    connectionText:       document.getElementById('connectionText'),
    saveToast:            document.getElementById('saveToast'),
  };

  // =====================================================
  // ЗАГРУЗКА НАСТРОЕК
  // =====================================================

  /**
   * Загружает сохранённые настройки и заполняет форму
   */
  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(DEFAULTS);

      els.apiUrl.value               = settings.apiUrl;
      els.aiApiUrl.value             = settings.aiApiUrl;
      els.jwtToken.value             = settings.jwtToken;
      els.city.value                 = settings.city;
      els.role.value                 = settings.role;
      els.overlayEnabled.checked     = settings.overlayEnabled;
      els.notificationsEnabled.checked = settings.notificationsEnabled;
      els.autoScanEnabled.checked    = settings.autoScanEnabled;
      els.offlineMode.checked        = settings.offlineMode;
    } catch (err) {
      console.error('[QazGost Options] Ошибка загрузки настроек:', err);
    }
  }

  // =====================================================
  // СОХРАНЕНИЕ НАСТРОЕК
  // =====================================================

  /**
   * Собирает значения формы и сохраняет в chrome.storage.sync
   */
  async function saveSettings() {
    const settings = {
      apiUrl:               els.apiUrl.value.trim() || DEFAULTS.apiUrl,
      aiApiUrl:             els.aiApiUrl.value.trim() || DEFAULTS.aiApiUrl,
      jwtToken:             els.jwtToken.value.trim(),
      city:                 els.city.value,
      role:                 els.role.value,
      overlayEnabled:       els.overlayEnabled.checked,
      notificationsEnabled: els.notificationsEnabled.checked,
      autoScanEnabled:      els.autoScanEnabled.checked,
      offlineMode:          els.offlineMode.checked,
    };

    try {
      await chrome.storage.sync.set(settings);
      showToast();
      console.log('[QazGost Options] Настройки сохранены:', settings);
    } catch (err) {
      console.error('[QazGost Options] Ошибка сохранения:', err);
      alert('Ошибка сохранения настроек: ' + err.message);
    }
  }

  // =====================================================
  // СБРОС НАСТРОЕК
  // =====================================================

  /**
   * Сбрасывает все настройки к значениям по умолчанию
   */
  async function resetSettings() {
    const confirmed = confirm('Вы уверены, что хотите сбросить все настройки?');
    if (!confirmed) return;

    try {
      await chrome.storage.sync.set(DEFAULTS);
      await loadSettings();
      showToast();
      hideConnectionStatus();
    } catch (err) {
      console.error('[QazGost Options] Ошибка сброса:', err);
    }
  }

  // =====================================================
  // ПРОВЕРКА ПОДКЛЮЧЕНИЯ
  // =====================================================

  /**
   * Тестирует подключение к API-серверу
   */
  async function testConnection() {
    const apiUrl = els.apiUrl.value.trim() || DEFAULTS.apiUrl;

    showConnectionStatus('loading', '🔄', 'Проверка подключения...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'API_REQUEST',
        baseUrl: apiUrl,
        endpoint: '/api/v1/health',
        method: 'GET',
      });

      if (response && response.success) {
        showConnectionStatus('success', '✅', `Подключено к ${apiUrl}`);
      } else {
        showConnectionStatus('error', '❌', `Сервер недоступен: ${response?.error || 'нет ответа'}`);
      }
    } catch (err) {
      showConnectionStatus('error', '❌', `Ошибка: ${err.message}`);
    }
  }

  // =====================================================
  // UI УТИЛИТЫ
  // =====================================================

  /**
   * Показывает статус подключения
   * @param {'success'|'error'|'loading'} type
   * @param {string} icon
   * @param {string} text
   */
  function showConnectionStatus(type, icon, text) {
    els.connectionStatus.className = `connection-status visible ${type}`;
    els.connectionIcon.textContent = icon;
    els.connectionText.textContent = text;
  }

  /** Скрывает статус подключения */
  function hideConnectionStatus() {
    els.connectionStatus.className = 'connection-status';
  }

  /** Показывает уведомление о сохранении */
  function showToast() {
    els.saveToast.classList.add('visible');
    setTimeout(() => {
      els.saveToast.classList.remove('visible');
    }, 2500);
  }

  // =====================================================
  // ПРИВЯЗКА СОБЫТИЙ
  // =====================================================

  els.saveBtn.addEventListener('click', saveSettings);
  els.resetBtn.addEventListener('click', resetSettings);
  els.testConnection.addEventListener('click', testConnection);

  // =====================================================
  // ИНИЦИАЛИЗАЦИЯ
  // =====================================================

  loadSettings();
})();
