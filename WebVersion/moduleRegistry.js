// ========== QAZGOST MODULE REGISTRY v1.0 ==========
// Централизованный реестр модулей с управлением зависимостями
// Заменяет хаотичное использование window.* паттерна
// Файл загружается ПЕРВЫМ в index.html

(function () {
    'use strict';

    /**
     * ModuleRegistry — центральное хранилище модулей.
     * 
     * Преимущества перед прямым window.*:
     * 1. Проверка зависимостей при регистрации
     * 2. Логирование загрузки и ошибок
     * 3. Метод waitFor() для асинхронного ожидания модуля
     * 4. Общий список всех зарегистрированных модулей
     * 5. Валидация — дублирующиеся регистрации ловятся сразу
     */
    const _modules = new Map();
    const _waiters = new Map(); // moduleName -> [resolve callbacks]
    const _loadOrder = [];
    const _startTime = performance.now();

    const ModuleRegistry = {

        /**
         * Зарегистрировать модуль в реестре.
         * @param {string} name - Уникальное имя модуля (напр. 'Models', 'StatusMachine')
         * @param {*} moduleExport - Экспортируемый объект модуля
         * @param {Object} [options] - Доп. параметры
         * @param {string[]} [options.depends] - Список зависимостей (имена модулей)
         * @param {string} [options.version] - Версия модуля
         */
        register(name, moduleExport, options = {}) {
            const { depends = [], version = '1.0' } = options;

            // Проверка дублирования
            if (_modules.has(name)) {
                console.warn(`⚠️ [Registry] Module "${name}" is already registered. Overwriting.`);
            }

            // Проверка зависимостей
            const missing = depends.filter(dep => !_modules.has(dep));
            if (missing.length > 0) {
                console.warn(
                    `⚠️ [Registry] Module "${name}" has unresolved dependencies: [${missing.join(', ')}]. ` +
                    `This may cause runtime errors.`
                );
            }

            // Регистрация
            _modules.set(name, moduleExport);
            _loadOrder.push({
                name,
                version,
                depends,
                time: Math.round(performance.now() - _startTime)
            });

            // Дублируем на window.* для обратной совместимости
            window[name] = moduleExport;

            // Разрешаем ожидающие промисы
            if (_waiters.has(name)) {
                _waiters.get(name).forEach(resolve => resolve(moduleExport));
                _waiters.delete(name);
            }

            console.log(
                `✅ [Registry] ${name} v${version} registered ` +
                `(+${Math.round(performance.now() - _startTime)}ms)` +
                (depends.length ? ` [deps: ${depends.join(', ')}]` : '')
            );
        },

        /**
         * Получить модуль по имени.
         * @param {string} name
         * @returns {*} модуль или undefined
         */
        get(name) {
            return _modules.get(name);
        },

        /**
         * Проверить, зарегистрирован ли модуль.
         * @param {string} name
         * @returns {boolean}
         */
        has(name) {
            return _modules.has(name);
        },

        /**
         * Получить модуль или fallback-значение (безопасная альтернатива).
         * @param {string} name
         * @param {*} fallback - Значение по умолчанию
         * @returns {*}
         */
        getOrDefault(name, fallback = {}) {
            return _modules.get(name) || fallback;
        },

        /**
         * Подождать загрузку модуля (для defer-скриптов).
         * @param {string} name - Имя модуля
         * @param {number} [timeoutMs=5000] - Таймаут ожидания в мс
         * @returns {Promise<*>} промис с модулем
         */
        waitFor(name, timeoutMs = 5000) {
            // Уже загружен
            if (_modules.has(name)) {
                return Promise.resolve(_modules.get(name));
            }

            return new Promise((resolve, reject) => {
                // Регистрируем waiter
                if (!_waiters.has(name)) {
                    _waiters.set(name, []);
                }
                _waiters.get(name).push(resolve);

                // Таймаут
                setTimeout(() => {
                    if (!_modules.has(name)) {
                        reject(new Error(`[Registry] Timeout waiting for module "${name}" (${timeoutMs}ms)`));
                    }
                }, timeoutMs);
            });
        },

        /**
         * Подождать загрузку нескольких модулей.
         * @param {string[]} names - Список модулей
         * @param {number} [timeoutMs=5000]
         * @returns {Promise<Object>} { ModuleName: moduleExport, ... }
         */
        waitForAll(names, timeoutMs = 5000) {
            const promises = names.map(name =>
                this.waitFor(name, timeoutMs).then(mod => [name, mod])
            );
            return Promise.all(promises).then(entries => Object.fromEntries(entries));
        },

        /**
         * Показать порядок загрузки модулей (для отладки).
         * @returns {Object[]}
         */
        getLoadOrder() {
            return [..._loadOrder];
        },

        /**
         * Показать все зарегистрированные модули.
         * @returns {string[]}
         */
        listModules() {
            return Array.from(_modules.keys());
        },

        /**
         * Показать ожидающие модули (ещё не загруженные).
         * @returns {string[]}
         */
        getPendingModules() {
            return Array.from(_waiters.keys());
        },

        /**
         * Вывести диагностику в консоль.
         */
        diagnostics() {
            console.group('📦 Module Registry Diagnostics');
            console.log(`Total modules: ${_modules.size}`);
            console.log(`Pending waiters: ${_waiters.size}`);
            console.table(_loadOrder);
            if (_waiters.size > 0) {
                console.warn('⏳ Pending modules:', Array.from(_waiters.keys()));
            }
            console.groupEnd();
        }
    };

    // Экспорт
    window.ModuleRegistry = ModuleRegistry;

    console.log('📦 [Registry] Module Registry v1.0 initialized');
})();
