// ========== PHOTO ESTIMATE VOICE ADAPTER ==========
// Голосовой адаптер для модуля фото-оценки стоимости
// Регистрируется в CommandRouter как adapter 'photoEstimate'
// Зависимости: commandRouter.js, photoEstimateModule.js

(function () {
    'use strict';

    // Field mapping: voice field name → DOM selector
    const FIELD_MAP = {
        description: {
            selectors: ['#estimateDescription', '[data-testid="estimate-description"]', 'textarea[name="description"]'],
            label: 'Описание'
        },
        area: {
            selectors: ['#estimateArea', '[data-testid="estimate-area"]', 'input[name="area"]'],
            label: 'Площадь'
        },
        roomType: {
            selectors: ['#estimateRoomType', '[data-testid="estimate-room-type"]', 'select[name="roomType"]'],
            label: 'Тип помещения'
        },
        material: {
            selectors: ['#estimateMaterial', '[data-testid="estimate-material"]', 'select[name="material"]', 'input[name="material"]'],
            label: 'Материал'
        },
        urgency: {
            selectors: ['#estimateUrgency', '[data-testid="estimate-urgency"]', 'select[name="urgency"]'],
            label: 'Срочность'
        },
        address: {
            selectors: ['#estimateAddress', '[data-testid="estimate-address"]', 'input[name="address"]'],
            label: 'Адрес'
        },
        budget: {
            selectors: ['#estimateBudget', '[data-testid="estimate-budget"]', 'input[name="budget"]'],
            label: 'Бюджет'
        }
    };

    // Room type normalizations
    const ROOM_TYPE_MAP = {
        'ванная': 'bathroom', 'ванную': 'bathroom', 'ванна': 'bathroom',
        'кухня': 'kitchen', 'кухню': 'kitchen',
        'спальня': 'bedroom', 'спальню': 'bedroom',
        'гостиная': 'living_room', 'гостиную': 'living_room', 'зал': 'living_room',
        'прихожая': 'hallway', 'коридор': 'hallway',
        'туалет': 'toilet', 'санузел': 'toilet', 'санузл': 'toilet',
        'балкон': 'balcony', 'лоджия': 'balcony',
        'офис': 'office',
        'склад': 'warehouse',
        'гараж': 'garage',
        'подвал': 'basement',
        'фасад': 'facade',
        'кровля': 'roof', 'крыша': 'roof'
    };

    // Urgency normalizations
    const URGENCY_MAP = {
        'высокая': 'urgent', 'высок': 'urgent', 'срочно': 'urgent', 'urgent': 'urgent',
        'средняя': 'normal', 'средн': 'normal', 'нормальн': 'normal', 'normal': 'normal',
        'низкая': 'low', 'низк': 'low', 'несрочн': 'low', 'low': 'low'
    };

    // ========== ADAPTER ==========

    const PhotoEstimateVoiceAdapter = {
        /**
         * Execute a photo estimate voice command
         * @param {object} cmd - Parsed command from CommandRouter
         * @returns {object} { success, message }
         */
        async execute(cmd) {
            switch (cmd.command) {
                case 'fillField':
                    return this._fillField(cmd.field, cmd.entities);
                case 'createOrder':
                    return this._createOrder();
                default:
                    return { success: false, message: `Неизвестная команда оценки: ${cmd.command}` };
            }
        },

        // ── Fill Field ──
        _fillField(fieldName, entities) {
            const fieldDef = FIELD_MAP[fieldName];
            if (!fieldDef) {
                return { success: false, message: `Поле «${fieldName}» не найдено` };
            }

            // Find the DOM element
            let el = null;
            for (const selector of fieldDef.selectors) {
                el = document.querySelector(selector);
                if (el) break;
            }

            if (!el) {
                return { success: false, message: `Элемент для «${fieldDef.label}» не найден на странице` };
            }

            // Get the value
            let value = entities.value;

            // Normalize special values
            if (fieldName === 'roomType') {
                value = this._normalizeRoomType(String(value));
            } else if (fieldName === 'urgency') {
                value = this._normalizeUrgency(String(value));
            }

            // Set the value based on element type
            if (el.tagName === 'SELECT') {
                // Try to find matching option
                const options = Array.from(el.options);
                const match = options.find(opt =>
                    opt.value === value ||
                    opt.textContent.toLowerCase().includes(String(value).toLowerCase())
                );

                if (match) {
                    el.value = match.value;
                } else {
                    // Try first option containing the word
                    el.value = value;
                }
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = String(value);
            }

            // Dispatch events for reactivity
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));

            // Visual feedback
            el.style.outline = '2px solid #22c55e';
            el.style.outlineOffset = '2px';
            setTimeout(() => {
                el.style.outline = '';
                el.style.outlineOffset = '';
            }, 2000);

            const displayValue = typeof value === 'number' ? value : `«${value}»`;
            return {
                success: true,
                message: `✅ ${fieldDef.label}: ${displayValue}${entities.unit ? ' ' + entities.unit : ''}`
            };
        },

        // ── Create Order ──
        _createOrder() {
            // Try to find the "Create Order" button
            const selectors = [
                '[data-testid="create-order-btn"]',
                '#createOrderBtn',
                '.btn-create-order',
                'button:has(> span:contains("Создать заказ"))'
            ];

            for (const selector of selectors) {
                try {
                    const btn = document.querySelector(selector);
                    if (btn) {
                        btn.click();
                        return { success: true, message: '📋 Заказ создаётся...' };
                    }
                } catch {}
            }

            // Fallback: try to use the module directly
            if (window.PhotoEstimateModule?.createOrder) {
                window.PhotoEstimateModule.createOrder();
                return { success: true, message: '📋 Заказ создаётся...' };
            }

            // Last resort: dispatch event
            document.dispatchEvent(new CustomEvent('voiceCreateOrder', { detail: {} }));
            return { success: true, message: '📋 Запрос на создание заказа отправлен' };
        },

        // ── Normalizers ──

        _normalizeRoomType(value) {
            const lower = value.toLowerCase().trim();
            for (const [key, normalized] of Object.entries(ROOM_TYPE_MAP)) {
                if (lower.includes(key)) return normalized;
            }
            return value;
        },

        _normalizeUrgency(value) {
            const lower = value.toLowerCase().trim();
            for (const [key, normalized] of Object.entries(URGENCY_MAP)) {
                if (lower.includes(key)) return normalized;
            }
            return value;
        },

        /**
         * Get the current state of the photo estimate form
         * @returns {object} Field values
         */
        getFormState() {
            const state = {};
            for (const [fieldName, fieldDef] of Object.entries(FIELD_MAP)) {
                for (const selector of fieldDef.selectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        state[fieldName] = {
                            value: el.value,
                            label: fieldDef.label,
                            filled: !!el.value
                        };
                        break;
                    }
                }
            }
            return state;
        },

        /**
         * Get list of empty fields that need filling
         * @returns {Array} [{fieldName, label}]
         */
        getEmptyFields() {
            const formState = this.getFormState();
            return Object.entries(formState)
                .filter(([_, info]) => !info.filled)
                .map(([fieldName, info]) => ({ fieldName, label: info.label }));
        }
    };

    // ========== REGISTER ADAPTER ==========

    if (window.CommandRouter) {
        window.CommandRouter.registerAdapter('photoEstimate', PhotoEstimateVoiceAdapter);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.CommandRouter) {
                window.CommandRouter.registerAdapter('photoEstimate', PhotoEstimateVoiceAdapter);
            }
        });
    }

    // Export for testing
    window.PhotoEstimateVoiceAdapter = PhotoEstimateVoiceAdapter;

    console.log('✅ PhotoEstimateVoiceAdapter loaded');
})();
