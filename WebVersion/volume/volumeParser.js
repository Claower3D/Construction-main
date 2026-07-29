// ========== VOLUME PARSER v2.0 ==========
// NLP-парсер комментариев для модуля "Расчёт объёмов"
// Извлекает материал, объём, технику, расстояние

(function () {
    'use strict';

    // ===== PATTERNS =====
    const PATTERNS = {
        // Объём: "500 м³", "~1000 кубов", "около 200 куб.м"
        volume: [
            /(?:около|примерно|~)?\s*(\d+(?:[.,]\d+)?)\s*(?:м³|м3|куб\.?(?:ов|а|\.м)?)/gi,
            /объ[её]м(?:ом)?\s*(?:около|примерно|~)?\s*(\d+(?:[.,]\d+)?)/gi
        ],

        // Расстояние: "15 км", "на 20 километров"
        distance: [
            /(?:на\s+)?(\d+(?:[.,]\d+)?)\s*(?:км|километр)/gi,
            /расстояни[ея]\s*(?:до)?\s*(\d+(?:[.,]\d+)?)/gi
        ],

        // Грузоподъёмность: "20 тонн", "30т"
        tonnage: [
            /(\d+)\s*(?:т|тонн)/gi
        ],

        // Размер ковша: "ковш 1.5 м³"
        bucket: [
            /ковш(?:ом)?\s*(\d+(?:[.,]\d+)?)\s*(?:м³|м3|куб)/gi
        ]
    };

    // ===== MATERIAL KEYWORDS =====
    const MATERIAL_MAP = {
        sand: {
            keywords: ['песок', 'песка', 'песком', 'песчаный', 'песчаной'],
            density: 1.5,
            name: 'Песок'
        },
        gravel: {
            keywords: ['щебень', 'щебня', 'щебнем', 'гравий', 'гравия', 'щебёнка'],
            density: 1.4,
            name: 'Щебень'
        },
        soil: {
            keywords: ['грунт', 'грунта', 'грунтом', 'земля', 'земли', 'землёй', 'почва'],
            density: 1.6,
            name: 'Грунт'
        },
        clay: {
            keywords: ['глина', 'глины', 'глиной', 'суглинок', 'суглинка'],
            density: 1.8,
            name: 'Глина'
        },
        rock: {
            keywords: ['скала', 'скалы', 'скальный', 'камень', 'камни', 'каменистый'],
            density: 2.5,
            name: 'Скальный грунт'
        },
        debris: {
            keywords: ['мусор', 'мусора', 'строймусор', 'отходы', 'бой', 'боем'],
            density: 1.3,
            name: 'Строительный мусор'
        },
        asphalt: {
            keywords: ['асфальт', 'асфальта', 'асфальтом'],
            density: 2.3,
            name: 'Асфальт'
        },
        concrete: {
            keywords: ['бетон', 'бетона', 'бетоном', 'железобетон'],
            density: 2.4,
            name: 'Бетон'
        }
    };

    // ===== EQUIPMENT KEYWORDS =====
    const EQUIPMENT_MAP = {
        // Самосвалы
        truck_10t: {
            keywords: ['10т', '10 тонн', 'зил', 'маз'],
            type: 'truck', capacity: 10
        },
        truck_20t: {
            keywords: ['20т', '20 тонн', 'камаз', 'камазы', 'kamaz'],
            type: 'truck', capacity: 20
        },
        truck_30t: {
            keywords: ['30т', '30 тонн', 'shacman', 'шакман'],
            type: 'truck', capacity: 30
        },
        truck_45t: {
            keywords: ['45т', '45 тонн', 'белаз', 'belaz', 'карьерный самосвал'],
            type: 'truck', capacity: 45
        },

        // Экскаваторы
        exc_small: {
            keywords: ['мини-экскаватор', 'мини экскаватор', 'маленький экскаватор'],
            type: 'excavator', bucket: 0.3
        },
        exc_medium: {
            keywords: ['экскаватор', 'эксковатор', 'эскаватор'],
            type: 'excavator', bucket: 1.0
        },
        exc_large: {
            keywords: ['большой экскаватор', 'jcb', 'hitachi', 'komatsu', 'cat 320'],
            type: 'excavator', bucket: 2.0
        },
        exc_huge: {
            keywords: ['карьерный экскаватор', 'экг', 'ek-5'],
            type: 'excavator', bucket: 5.0
        },

        // Погрузчики
        loader_small: {
            keywords: ['мини-погрузчик', 'bobcat', 'бобкэт'],
            type: 'loader', bucket: 1.5
        },
        loader_medium: {
            keywords: ['погрузчик', 'фронтальный погрузчик'],
            type: 'loader', bucket: 3.0
        }
    };

    // ===== PARSER =====
    const VolumeParser = {

        /**
         * Главный метод парсинга
         */
        parse(text) {
            if (!text || typeof text !== 'string') {
                return this.getDefault();
            }

            const lower = text.toLowerCase();

            return {
                material: this.extractMaterial(lower),
                estimatedVolume: this.extractVolume(text),
                equipment: this.extractEquipment(lower),
                conditions: {
                    distanceKm: this.extractDistance(text)
                },
                raw: text
            };
        },

        /**
         * Извлечь материал
         */
        extractMaterial(text) {
            for (const [id, mat] of Object.entries(MATERIAL_MAP)) {
                for (const keyword of mat.keywords) {
                    if (text.includes(keyword)) {
                        return {
                            id: id,
                            name: mat.name,
                            density: mat.density
                        };
                    }
                }
            }
            // По умолчанию - грунт
            return {
                id: 'soil',
                name: 'Грунт',
                density: 1.6
            };
        },

        /**
         * Извлечь объём
         */
        extractVolume(text) {
            for (const pattern of PATTERNS.volume) {
                const match = text.match(pattern);
                if (match) {
                    const value = parseFloat(match[1].replace(',', '.'));
                    if (value > 0 && value < 100000) {
                        return value;
                    }
                }
            }
            return null;
        },

        /**
         * Извлечь расстояние
         */
        extractDistance(text) {
            for (const pattern of PATTERNS.distance) {
                const match = text.match(pattern);
                if (match) {
                    const value = parseFloat(match[1].replace(',', '.'));
                    if (value > 0 && value < 500) {
                        return value;
                    }
                }
            }
            return 10; // По умолчанию 10 км
        },

        /**
         * Извлечь технику
         */
        extractEquipment(text) {
            const found = [];

            for (const [id, eq] of Object.entries(EQUIPMENT_MAP)) {
                for (const keyword of eq.keywords) {
                    if (text.includes(keyword)) {
                        // Определяем количество
                        const countMatch = text.match(new RegExp(`(\\d+)\\s*${keyword}`, 'i'));
                        const count = countMatch ? parseInt(countMatch[1]) : 1;

                        found.push({
                            id: id,
                            type: eq.type,
                            count: Math.min(count, 10) // Макс 10 единиц
                        });
                        break; // Одна единица за категорию
                    }
                }
            }

            return found;
        },

        /**
         * Результат по умолчанию
         */
        getDefault() {
            return {
                material: {
                    id: 'soil',
                    name: 'Грунт',
                    density: 1.6
                },
                estimatedVolume: null,
                equipment: [],
                conditions: {
                    distanceKm: 10
                },
                raw: ''
            };
        },

        /**
         * Сгенерировать описание на основе распознанных данных
         */
        generateSummary(parsed) {
            const parts = [];

            if (parsed.material) {
                parts.push(`${parsed.material.name} (${parsed.material.density} т/м³)`);
            }

            if (parsed.estimatedVolume) {
                parts.push(`~${parsed.estimatedVolume} м³`);
            }

            if (parsed.equipment.length > 0) {
                const eq = parsed.equipment.map(e => {
                    const def = EQUIPMENT_MAP[e.id];
                    return e.count > 1 ? `${e.count}× ${e.type}` : e.type;
                }).join(', ');
                parts.push(`Техника: ${eq}`);
            }

            if (parsed.conditions.distanceKm) {
                parts.push(`Вывоз: ${parsed.conditions.distanceKm} км`);
            }

            return parts.join(' | ') || 'Требуется уточнение';
        }
    };

    // ===== EXPORT =====
    window.VolumeParser = VolumeParser;

    console.log('✅ VolumeParser v2.0 loaded');
})();
