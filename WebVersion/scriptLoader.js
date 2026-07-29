// ========== QAZGOST SCRIPT LOADER v1.0 ==========
// Управление порядком загрузки ~40 скриптов
// Документация текущего порядка + динамическая загрузка

(function () {
    'use strict';

    /**
     * ScriptLoader — описывает порядок загрузки модулей и позволяет
     * загружать модули динамически (для ленивой загрузки / code splitting).
     * 
     * ТЕКУЩАЯ КАРТА ЗАГРУЗКИ (из index.html):
     * ──────────────────────────────────────────
     * ФАЗА 1: Ядро (синхронно, блокирует рендеринг)
     *   1. moduleRegistry.js    — Реестр модулей
     *   2. models.js            — Базовые модели данных (User, Order, etc.)
     *   3. statusMachine.js     — Машина состояний (зависит от Models)
     *   4. apiService.js        — HTTP-клиент + токены
     *   5. dataService.js       — Мост localStorage <-> API
     * 
     * ФАЗА 2: Модели данных модулей (синхронно)
     *   6. estimateModels.js    — Модели расчётов
     *   7. estimateService.js   — Сервис расчётов (зависит от EstimateModels)
     *   8. engineeringModels.js — Модели инженерных решений (зависит от Models)
     *   9. engineeringService.js — Сервис инженерных (зависит от Models, EngineeringModels)
     *  10. financeModels.js     — Финансовые модели (fallback для Models.Storage)
     *  11. financeService.js    — Финансовый сервис (зависит от FinanceModels)
     * 
     * ФАЗА 3: AI модули (синхронно)
     *  12. ai/aiEngineerValidator.js
     *  13. ai/aiEngineerModerator.js
     *  14. ai/aiPriceDatabase.js
     *  15. ai/aiEstimator.js
     *  16. ai/aiClient.js
     * 
     * ФАЗА 4: VIP модуль (синхронно)
     *  17. vip/vipModels.js
     *  18. vip/wbsGenerator.js
     *  19. vip/vipService.js
     *  20. vip/vipPdfService.js
     *  21. vip/vipUI.js
     *  22. vip/vipExecutorUI.js
     * 
     * ФАЗА 5: Volume модуль (синхронно)
     *  23. volume/volumeCatalogs.js
     *  24. volume/volumeModels.js
     *  25. volume/volumeParser.js
     *  26. volume/volumeService.js
     *  27. volume/volumePdfService.js
     *  28. volume/volumeUI.js
     * 
     * ФАЗА 6: Chat модуль (частично defer)
     *  29. chat/chatModels.js      (синхронно)
     *  30. chat/chatService.js     (синхронно)
     *  31. chat/chatUI.js          (defer)
     *  32. chat/chatIntegration.js (defer)
     * 
     * ФАЗА 7: Notifications (частично defer)
     *  33. notifications/notificationModels.js    (синхронно)
     *  34. notifications/notificationService.js   (синхронно)
     *  35. notifications/notificationUI.js        (defer)
     *  36. notifications/notificationIntegration.js (defer)
     * 
     * ФАЗА 8: UI слой (defer — загружается после DOM ready)
     *  37. modulesUI.js         (defer)
     *  38. financeUI.js         (defer)
     *  39. engineerUI.js        (defer)
     *  40. landing.js           (defer)
     *  41. services.js          (defer)
     *  42. ai/aiEngineerChat.js (defer)
     *  43. ai/aiAnalyzerUI.js   (defer)
     *  44. ai/aiIntegration.js  (defer)
     */

    const ScriptLoader = {

        /**
         * Динамически загрузить скрипт.
         * @param {string} src — URL скрипта
         * @param {Object} [options]
         * @param {boolean} [options.async=false] — Async загрузка
         * @param {boolean} [options.defer=false] — Deferred загрузка
         * @param {string} [options.moduleName] — Имя модуля для проверки загрузки
         * @returns {Promise<void>}
         */
        load(src, options = {}) {
            return new Promise((resolve, reject) => {
                // Проверяем, не загружен ли уже
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    console.log(`[ScriptLoader] Already loaded: ${src}`);
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.async = options.async || false;
                if (options.defer) script.defer = true;

                script.onload = () => {
                    console.log(`✅ [ScriptLoader] Loaded: ${src}`);
                    resolve();
                };

                script.onerror = () => {
                    const error = new Error(`[ScriptLoader] Failed to load: ${src}`);
                    console.error(error.message);
                    reject(error);
                };

                document.head.appendChild(script);
            });
        },

        /**
         * Загрузить серию скриптов последовательно (с гарантией порядка).
         * @param {string[]} sources — Массив URL скриптов
         * @returns {Promise<void>}
         */
        async loadSequence(sources) {
            for (const src of sources) {
                await this.load(src);
            }
        },

        /**
         * Загрузить серию скриптов параллельно (без гарантии порядка).
         * @param {string[]} sources
         * @returns {Promise<void[]>}
         */
        loadParallel(sources) {
            return Promise.all(sources.map(src => this.load(src, { async: true })));
        },

        /**
         * Проверить, загружен ли скрипт.
         * @param {string} src
         * @returns {boolean}
         */
        isLoaded(src) {
            return !!document.querySelector(`script[src="${src}"]`);
        },

        /**
         * Получить список всех загруженных скриптов на странице.
         * @returns {string[]}
         */
        getAllScripts() {
            return Array.from(document.querySelectorAll('script[src]'))
                .map(s => s.src)
                .filter(src => !src.includes('node_modules'));
        },

        /**
         * Показать диагностику загрузки скриптов.
         */
        diagnostics() {
            const scripts = this.getAllScripts();
            console.group('📜 Script Loader Diagnostics');
            console.log(`Total scripts on page: ${scripts.length}`);

            const syncScripts = Array.from(document.querySelectorAll('script[src]:not([defer]):not([async])'));
            const deferScripts = Array.from(document.querySelectorAll('script[src][defer]'));
            const asyncScripts = Array.from(document.querySelectorAll('script[src][async]'));

            console.log(`  Synchronous: ${syncScripts.length}`);
            console.log(`  Deferred:    ${deferScripts.length}`);
            console.log(`  Async:       ${asyncScripts.length}`);

            if (window.ModuleRegistry) {
                const registered = window.ModuleRegistry.listModules();
                console.log(`\nRegistered modules: ${registered.length}`);
                console.log(`  [${registered.join(', ')}]`);
            }

            console.groupEnd();
        }
    };

    // Экспорт
    window.ScriptLoader = ScriptLoader;

    console.log('📜 [ScriptLoader] Script Loader v1.0 initialized');
})();
