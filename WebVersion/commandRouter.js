// ========== COMMAND ROUTER ==========
// Слой текстовых команд для QazGost AI
// Принимает текст (от голоса или UI), разбирает в intent + entities,
// маршрутизирует в соответствующий адаптер.
// Этап 2 мастер-плана: текстовые команды (без микрофона).

(function () {
    'use strict';

    // ========== COMMAND DEFINITIONS ==========

    const COMMANDS = {
        // === NAVIGATION ===
        'nav.home': {
            patterns: [/^(?:домой|на\s*главн|открыть?\s*главн|go\s*home|home)/i],
            action: 'navigate',
            target: 'home',
            destructive: false,
            roles: null // all roles
        },
        'nav.orders': {
            patterns: [/^(?:открыть?\s*заказ|мои\s*заказ|заказы|orders)/i],
            action: 'navigate',
            target: 'orders',
            destructive: false,
            roles: null
        },
        'nav.calendar': {
            patterns: [/^(?:открыть?\s*календарь?|календарь?|calendar)/i],
            action: 'navigate',
            target: 'engineer',
            destructive: false,
            roles: ['engineer', 'admin']
        },
        'nav.wallet': {
            patterns: [/^(?:открыть?\s*кошел[её]к|кошел[её]к|баланс|wallet|balance)/i],
            action: 'navigate',
            target: 'wallet',
            destructive: false,
            roles: null
        },
        'nav.estimate': {
            patterns: [/^(?:открыть?\s*оценк|оценка?\s*стоимост|начать?\s*оценк|фото[- ]?оценк|estimate)/i],
            action: 'navigate',
            target: 'photo-estimate',
            destructive: false,
            roles: null
        },
        'nav.catalog': {
            patterns: [/^(?:открыть?\s*каталог|каталог|прайс|catalog|prices)/i],
            action: 'navigate',
            target: 'catalog',
            destructive: false,
            roles: null
        },
        'nav.disputes': {
            patterns: [/^(?:открыть?\s*спор|споры|disputes)/i],
            action: 'navigate',
            target: 'disputes',
            destructive: false,
            roles: null
        },

        // === FORM CONTROL ===
        'form.next': {
            patterns: [/^(?:далее|дальше|следующ|next)/i],
            action: 'form',
            command: 'next',
            destructive: false,
            roles: null
        },
        'form.prev': {
            patterns: [/^(?:назад|предыдущ|back|prev)/i],
            action: 'form',
            command: 'prev',
            destructive: false,
            roles: null
        },
        'form.save': {
            patterns: [/^(?:сохранить?|сохрани|save)/i],
            action: 'form',
            command: 'save',
            destructive: false,
            roles: null
        },
        'form.cancel': {
            patterns: [/^(?:отмена|отменить?|cancel)/i],
            action: 'form',
            command: 'cancel',
            destructive: true,
            roles: null
        },
        'form.clear': {
            patterns: [/^(?:очистить?\s*поле|очисти\s*поле|clear\s*field)/i],
            action: 'form',
            command: 'clearField',
            destructive: false,
            roles: null
        },

        // === VOICE CONTROL ===
        'voice.start': {
            patterns: [/^(?:начать?\s*запись|запись|start\s*recording)/i],
            action: 'voice',
            command: 'start',
            destructive: false,
            roles: null
        },
        'voice.stop': {
            patterns: [/^(?:остановить?\s*запись|стоп|stop\s*recording|stop)/i],
            action: 'voice',
            command: 'stop',
            destructive: false,
            roles: null
        },

        // === CALENDAR (Engineer) ===
        'calendar.create': {
            patterns: [
                /^(?:создать?\s*событи|новое?\s*событи|create\s*event)/i,
                /^(?:добавить?\s*(?:в\s*)?календарь?|add\s*(?:to\s*)?calendar)/i
            ],
            action: 'calendar',
            command: 'create',
            destructive: false,
            roles: ['engineer', 'admin'],
            extractors: {
                dateRelative: /(?:сегодня|завтра|послезавтра|в\s*понедельник|во\s*вторник|в\s*среду|в\s*четверг|в\s*пятницу|в\s*субботу|в\s*воскресенье|today|tomorrow)/i,
                time: /(?:в\s*)?(\d{1,2})[:\s](\d{2})/,
                title: /(?:событие|заметка|встреча|осмотр|приёмка|проверка)\s+[«"']?(.+?)[»"']?\s*$/i
            }
        },
        'calendar.move': {
            patterns: [/^(?:перенести?\s*(?:событие?\s*)?(?:на|в)|move\s*(?:event\s*)?to)/i],
            action: 'calendar',
            command: 'move',
            destructive: true,
            roles: ['engineer', 'admin'],
            extractors: {
                dateRelative: /(?:на\s+)?(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье|завтра|послезавтра)/i,
                time: /(\d{1,2})[:\s](\d{2})/
            }
        },
        'calendar.note': {
            patterns: [/^(?:добавить?\s*заметк|заметка?\s|note\s)/i],
            action: 'calendar',
            command: 'addNote',
            destructive: false,
            roles: ['engineer', 'admin'],
            extractors: {
                text: /(?:заметк[ауе]?\s+)(.*)/i
            }
        },
        'calendar.showWeek': {
            patterns: [/^(?:показать?\s*недел|неделя|week\s*view|show\s*week)/i],
            action: 'calendar',
            command: 'showWeek',
            destructive: false,
            roles: ['engineer', 'admin']
        },
        'calendar.showDay': {
            patterns: [/^(?:показать?\s*день|день|day\s*view|show\s*day)/i],
            action: 'calendar',
            command: 'showDay',
            destructive: false,
            roles: ['engineer', 'admin']
        },
        'calendar.openObject': {
            patterns: [/^(?:открыть?\s*объект\s*(?:номер\s*)?(\d+)|open\s*object\s*(\d+))/i],
            action: 'calendar',
            command: 'openObject',
            destructive: false,
            roles: ['engineer', 'admin'],
            extractors: {
                objectNumber: /(?:номер\s*|object\s*|#)(\d+)/i
            }
        },
        'calendar.delete': {
            patterns: [/^(?:удалить?\s*событи|delete\s*event)/i],
            action: 'calendar',
            command: 'delete',
            destructive: true,
            roles: ['engineer', 'admin']
        },

        // === PHOTO ESTIMATE ===
        'photoEstimate.fill.description': {
            patterns: [/^(?:описани[ея]?\s)/i],
            action: 'photoEstimate',
            command: 'fillField',
            field: 'description',
            destructive: false,
            roles: null,
            extractors: {
                value: /^описани[ея]?\s+(.*)/i
            }
        },
        'photoEstimate.fill.area': {
            patterns: [/^(?:площадь)\s+/i],
            action: 'photoEstimate',
            command: 'fillField',
            field: 'area',
            destructive: false,
            roles: null,
            extractors: {
                value: /(\d+[.,]?\d*)/,
                unit: /(квадрат|м[²2]|кв)/i
            }
        },
        'photoEstimate.fill.roomType': {
            patterns: [/^(?:тип\s*помещени[яе]?\s)/i],
            action: 'photoEstimate',
            command: 'fillField',
            field: 'roomType',
            destructive: false,
            roles: null,
            extractors: {
                value: /(?:тип\s*помещени[яе]?\s+)(.*)/i
            }
        },
        'photoEstimate.fill.material': {
            patterns: [/^(?:материал)\s+/i],
            action: 'photoEstimate',
            command: 'fillField',
            field: 'material',
            destructive: false,
            roles: null,
            extractors: {
                value: /(?:материал\s+)(.*)/i
            }
        },
        'photoEstimate.fill.urgency': {
            patterns: [/^(?:срочность)\s+/i],
            action: 'photoEstimate',
            command: 'fillField',
            field: 'urgency',
            destructive: false,
            roles: null,
            extractors: {
                value: /(?:срочность\s+)(высок|средн|низк|urgent|normal|low)/i
            }
        },
        'photoEstimate.createOrder': {
            patterns: [/^(?:создать?\s*заказ|оформить?\s*заказ|create\s*order)/i],
            action: 'photoEstimate',
            command: 'createOrder',
            destructive: true,
            roles: ['customer', 'admin']
        },

        // === ORDER MANAGEMENT ===
        'order.create': {
            patterns: [/^(?:новый?\s*заказ|создать?\s*заказ|create\s*order)/i],
            action: 'order',
            command: 'create',
            destructive: false,
            roles: ['customer', 'admin']
        },
        'order.publish': {
            patterns: [/^(?:опубликовать?\s*заказ|publish\s*order)/i],
            action: 'order',
            command: 'publish',
            destructive: true,
            roles: ['customer', 'admin']
        },
        'order.respond': {
            patterns: [/^(?:отправить?\s*отклик|откликнуться|send\s*(?:bid|response|proposal))/i],
            action: 'order',
            command: 'respond',
            destructive: false,
            roles: ['executor', 'admin']
        },

        // === DEFECT MANAGEMENT ===
        'defect.comment': {
            patterns: [/^(?:комментарий?\s*(?:к\s*)?дефект|defect\s*comment)/i],
            action: 'defect',
            command: 'addComment',
            destructive: false,
            roles: ['controller', 'engineer', 'admin'],
            extractors: {
                text: /(?:комментарий?\s*(?:к\s*дефекту?\s*)?)(.*)/i
            }
        },
        'defect.accept': {
            patterns: [/^(?:принять?\s*работ|работа\s*принят|accept\s*work)/i],
            action: 'defect',
            command: 'accept',
            destructive: true,
            roles: ['controller', 'customer', 'admin']
        },
        'defect.rework': {
            patterns: [/^(?:(?:отправить?\s*)?на\s*доработк|на\s*переделк|rework|send\s*back)/i],
            action: 'defect',
            command: 'rework',
            destructive: true,
            roles: ['controller', 'customer', 'admin']
        }
    };

    // ========== DATE PARSING ==========

    const DATE_RELATIVE_MAP = {
        'сегодня': 0, 'today': 0,
        'завтра': 1, 'tomorrow': 1,
        'послезавтра': 2,
        'понедельник': 'monday', 'в понедельник': 'monday',
        'вторник': 'tuesday', 'во вторник': 'tuesday',
        'среду': 'wednesday', 'в среду': 'wednesday',
        'четверг': 'thursday', 'в четверг': 'thursday',
        'пятницу': 'friday', 'в пятницу': 'friday',
        'субботу': 'saturday', 'в субботу': 'saturday',
        'воскресенье': 'sunday', 'в воскресенье': 'sunday'
    };

    function resolveRelativeDate(relStr) {
        if (!relStr) return null;
        const key = relStr.toLowerCase().trim();
        const val = DATE_RELATIVE_MAP[key];

        if (typeof val === 'number') {
            const d = new Date();
            d.setDate(d.getDate() + val);
            return d.toISOString().split('T')[0];
        }

        if (typeof val === 'string') {
            // Day of week
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = days.indexOf(val);
            if (targetDay === -1) return null;
            const now = new Date();
            const currentDay = now.getDay();
            let diff = targetDay - currentDay;
            if (diff <= 0) diff += 7;
            now.setDate(now.getDate() + diff);
            return now.toISOString().split('T')[0];
        }

        return null;
    }

    // ========== NORMALIZER ==========

    const UNIT_NORMALIZATIONS = {
        'квадратных метра': 'm2', 'квадратных метров': 'm2',
        'квадрат': 'm2', 'кв метр': 'm2', 'кв.м': 'm2', 'м2': 'm2', 'м²': 'm2',
        'куб': 'm3', 'кубов': 'm3', 'кубометр': 'm3', 'м3': 'm3', 'м³': 'm3',
        'штук': 'pcs', 'шт': 'pcs', 'штуки': 'pcs',
        'погонных метров': 'lm', 'п.м.': 'lm', 'п.м': 'lm',
        'тонн': 't', 'тонна': 't', 'тонны': 't',
        'кг': 'kg', 'килограмм': 'kg',
        'литр': 'l', 'литров': 'l'
    };

    function normalizeUnit(text) {
        const lower = text.toLowerCase();
        for (const [pattern, normalized] of Object.entries(UNIT_NORMALIZATIONS)) {
            if (lower.includes(pattern)) return normalized;
        }
        return null;
    }

    // ========== MAIN PARSER ==========

    /**
     * Parse text into a command intent
     * @param {string} text - Input text (from voice or manual input)
     * @param {object} context - Optional context { role, surface, focusedField }
     * @returns {object|null} { intent, action, command, entities, requiresConfirm, raw }
     */
    function parseCommand(text, context = {}) {
        if (!text || typeof text !== 'string') return null;

        const cleaned = text.trim();
        if (cleaned.length < 2) return null;

        const currentRole = context.role || window.RoleManager?.current?.() || 'customer';

        for (const [intent, def] of Object.entries(COMMANDS)) {
            // Check role access
            if (def.roles && !def.roles.includes(currentRole)) continue;

            // Try all patterns
            for (const pattern of def.patterns) {
                const match = cleaned.match(pattern);
                if (!match) continue;

                // Build result
                const result = {
                    intent,
                    action: def.action,
                    command: def.command || def.target,
                    field: def.field || null,
                    entities: {},
                    requiresConfirm: def.destructive,
                    raw: cleaned,
                    confidence: 1.0
                };

                // Extract entities using extractors
                if (def.extractors) {
                    for (const [entityName, extractor] of Object.entries(def.extractors)) {
                        const entityMatch = cleaned.match(extractor);
                        if (entityMatch) {
                            let value = entityMatch[1] || entityMatch[0];

                            // Post-process specific entities
                            if (entityName === 'dateRelative') {
                                result.entities.dateRelative = value;
                                result.entities.date = resolveRelativeDate(value);
                            } else if (entityName === 'time' && entityMatch[1] && entityMatch[2]) {
                                result.entities.time = `${entityMatch[1].padStart(2, '0')}:${entityMatch[2]}`;
                            } else if (entityName === 'value') {
                                // Try to parse number
                                const numMatch = value.match(/(\d+[.,]?\d*)/);
                                if (numMatch) {
                                    result.entities.value = parseFloat(numMatch[1].replace(',', '.'));
                                } else {
                                    result.entities.value = value.trim();
                                }
                            } else if (entityName === 'unit') {
                                result.entities.unit = normalizeUnit(value) || value;
                            } else {
                                result.entities[entityName] = value.trim();
                            }
                        }
                    }
                }

                return result;
            }
        }

        // No match found — could be free dictation
        return null;
    }

    /**
     * Get list of available commands for current role and context
     * @param {object} context - { role, surface }
     * @returns {Array} [{ intent, description, example }]
     */
    function getAvailableCommands(context = {}) {
        const currentRole = context.role || window.RoleManager?.current?.() || 'customer';
        const surface = context.surface || null;

        const COMMAND_DESCRIPTIONS = {
            'nav.home': { description: 'Открыть главную', example: '«домой»' },
            'nav.orders': { description: 'Открыть заказы', example: '«мои заказы»' },
            'nav.calendar': { description: 'Открыть календарь', example: '«календарь»' },
            'nav.wallet': { description: 'Открыть кошелёк', example: '«кошелёк»' },
            'nav.estimate': { description: 'Открыть оценку', example: '«оценка стоимости»' },
            'form.next': { description: 'Следующий шаг', example: '«далее»' },
            'form.prev': { description: 'Предыдущий шаг', example: '«назад»' },
            'form.save': { description: 'Сохранить', example: '«сохранить»' },
            'form.cancel': { description: 'Отменить', example: '«отмена»' },
            'voice.start': { description: 'Начать запись', example: '«начать запись»' },
            'voice.stop': { description: 'Остановить запись', example: '«стоп»' },
            'calendar.create': { description: 'Создать событие', example: '«создать событие завтра в 14:00»' },
            'calendar.move': { description: 'Перенести событие', example: '«перенести на пятницу 10:30»' },
            'calendar.note': { description: 'Добавить заметку', example: '«заметка осмотр фасада»' },
            'calendar.showWeek': { description: 'Показать неделю', example: '«показать неделю»' },
            'calendar.showDay': { description: 'Показать день', example: '«показать день»' },
            'calendar.delete': { description: 'Удалить событие', example: '«удалить событие»' },
            'photoEstimate.fill.description': { description: 'Описание объекта', example: '«описание ванная комната»' },
            'photoEstimate.fill.area': { description: 'Площадь', example: '«площадь 24 квадратных метра»' },
            'photoEstimate.fill.roomType': { description: 'Тип помещения', example: '«тип помещения ванная»' },
            'photoEstimate.fill.material': { description: 'Материал', example: '«материал керамогранит»' },
            'photoEstimate.fill.urgency': { description: 'Срочность', example: '«срочность высокая»' },
            'photoEstimate.createOrder': { description: 'Создать заказ', example: '«создать заказ»' },
            'order.create': { description: 'Новый заказ', example: '«новый заказ»' },
            'order.publish': { description: 'Опубликовать заказ', example: '«опубликовать заказ»' },
            'order.respond': { description: 'Откликнуться', example: '«отправить отклик»' },
            'defect.comment': { description: 'Комментарий к дефекту', example: '«комментарий трещина в стене»' },
            'defect.accept': { description: 'Принять работу', example: '«принять работу»' },
            'defect.rework': { description: 'На доработку', example: '«на доработку»' }
        };

        const available = [];
        for (const [intent, def] of Object.entries(COMMANDS)) {
            if (def.roles && !def.roles.includes(currentRole)) continue;
            if (surface && def.action !== surface && !['nav', 'form', 'voice'].includes(def.action)) continue;

            const desc = COMMAND_DESCRIPTIONS[intent];
            if (desc) {
                available.push({ intent, ...desc, destructive: def.destructive });
            }
        }

        return available;
    }

    // ========== ADAPTERS REGISTRY ==========

    const _adapters = {};

    /**
     * Register an adapter for a specific action type
     * @param {string} action - Action type ('calendar', 'photoEstimate', 'order', 'defect')
     * @param {object} adapter - Object with execute(command) method
     */
    function registerAdapter(action, adapter) {
        if (typeof adapter.execute !== 'function') {
            console.error(`[CommandRouter] Adapter for '${action}' must have an execute() method`);
            return;
        }
        _adapters[action] = adapter;
        console.log(`[CommandRouter] ✅ Adapter registered: ${action}`);
    }

    /**
     * Execute a parsed command
     * @param {object} parsedCommand - Result from parseCommand()
     * @param {object} options - { skipConfirm: false }
     * @returns {object} { success, result, error }
     */
    async function executeCommand(parsedCommand, options = {}) {
        if (!parsedCommand) {
            return { success: false, error: 'Команда не распознана' };
        }

        // Check confirmation for destructive actions
        if (parsedCommand.requiresConfirm && !options.skipConfirm) {
            return {
                success: false,
                needsConfirmation: true,
                command: parsedCommand,
                message: `Подтвердите: ${parsedCommand.intent} ?`
            };
        }

        const { action } = parsedCommand;

        // Built-in handlers
        if (action === 'navigate') {
            return _handleNavigation(parsedCommand);
        }
        if (action === 'form') {
            return _handleForm(parsedCommand);
        }
        if (action === 'voice') {
            return _handleVoice(parsedCommand);
        }

        // Adapter-based handlers
        const adapter = _adapters[action];
        if (!adapter) {
            return { success: false, error: `Адаптер '${action}' не зарегистрирован` };
        }

        try {
            const result = await adapter.execute(parsedCommand);
            
            // Audit log
            _auditCommand(parsedCommand, result);

            return { success: true, result };
        } catch (error) {
            console.error(`[CommandRouter] Error executing ${parsedCommand.intent}:`, error);
            return { success: false, error: error.message };
        }
    }

    // ========== BUILT-IN HANDLERS ==========

    function _handleNavigation(cmd) {
        const target = cmd.command;
        
        // Use existing navigation
        if (window.setPage) {
            window.setPage(target);
            return { success: true, result: { navigatedTo: target } };
        }

        // Fallback: find and click nav item
        const navItem = document.querySelector(`[data-role-page="${target}"]`);
        if (navItem) {
            navItem.click();
            return { success: true, result: { navigatedTo: target } };
        }

        return { success: false, error: `Страница '${target}' не найдена` };
    }

    function _handleForm(cmd) {
        switch (cmd.command) {
            case 'next': {
                const nextBtn = document.querySelector('[data-testid="btn-next"], .wizard-next, .btn-next');
                if (nextBtn) { nextBtn.click(); return { success: true }; }
                return { success: false, error: 'Кнопка «Далее» не найдена' };
            }
            case 'prev': {
                const prevBtn = document.querySelector('[data-testid="btn-prev"], .wizard-prev, .btn-prev');
                if (prevBtn) { prevBtn.click(); return { success: true }; }
                return { success: false, error: 'Кнопка «Назад» не найдена' };
            }
            case 'save': {
                const saveBtn = document.querySelector('[data-testid="btn-save"], .btn-save, button[type="submit"]');
                if (saveBtn) { saveBtn.click(); return { success: true }; }
                return { success: false, error: 'Кнопка «Сохранить» не найдена' };
            }
            case 'cancel': {
                const cancelBtn = document.querySelector('[data-testid="btn-cancel"], .btn-cancel');
                if (cancelBtn) { cancelBtn.click(); return { success: true }; }
                return { success: false, error: 'Кнопка «Отмена» не найдена' };
            }
            case 'clearField': {
                const focused = document.activeElement;
                if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) {
                    focused.value = '';
                    focused.dispatchEvent(new Event('input', { bubbles: true }));
                    return { success: true };
                }
                return { success: false, error: 'Нет фокуса на поле ввода' };
            }
            default:
                return { success: false, error: `Неизвестная команда формы: ${cmd.command}` };
        }
    }

    function _handleVoice(cmd) {
        switch (cmd.command) {
            case 'start':
                if (window.VoiceController?.start) {
                    window.VoiceController.start();
                    return { success: true };
                } else if (window.VoiceInput?.toggle) {
                    window.VoiceInput.toggle();
                    return { success: true };
                }
                return { success: false, error: 'Голосовой модуль не загружен' };
            case 'stop':
                if (window.VoiceController?.stop) {
                    window.VoiceController.stop();
                    return { success: true };
                } else if (window.VoiceInput?.toggle) {
                    window.VoiceInput.toggle();
                    return { success: true };
                }
                return { success: false, error: 'Голосовой модуль не загружен' };
            default:
                return { success: false, error: `Неизвестная голосовая команда: ${cmd.command}` };
        }
    }

    // ========== AUDIT ==========

    function _auditCommand(cmd, result) {
        try {
            if (window.Models?.AuditLog?.log) {
                window.Models.AuditLog.log('voice_command', cmd.intent, 'executed', {
                    meta: {
                        raw: cmd.raw,
                        entities: cmd.entities,
                        success: result?.success !== false,
                        action: cmd.action
                    }
                });
            }
        } catch (e) {
            // Non-critical
        }
    }

    // ========== PUBLIC API ==========

    window.CommandRouter = {
        parseCommand,
        executeCommand,
        getAvailableCommands,
        registerAdapter,

        // Convenience: parse and execute in one call
        async processText(text, context = {}, options = {}) {
            const parsed = parseCommand(text, context);
            if (!parsed) {
                return { success: false, error: 'Команда не распознана', raw: text };
            }
            return executeCommand(parsed, options);
        },

        // For testing without voice
        async testCommand(text) {
            console.log(`[CommandRouter] Testing: "${text}"`);
            const parsed = parseCommand(text);
            console.log('[CommandRouter] Parsed:', parsed);
            if (parsed) {
                const result = await executeCommand(parsed, { skipConfirm: true });
                console.log('[CommandRouter] Result:', result);
                return result;
            }
            return { success: false, error: 'Not recognized' };
        }
    };

    console.log(`✅ CommandRouter loaded (${Object.keys(COMMANDS).length} commands defined)`);
})();
