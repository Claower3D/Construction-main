// ========== VOLUME MODELS v2.0 ==========
// Модели данных для модуля "Расчёт объёмов"
// Полностью переписано с нуля

(function () {
    'use strict';

    // ===== STORAGE =====
    const STORAGE_KEY = 'VOLUME_CALCULATIONS';

    function getStorage() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function setStorage(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // ===== VOLUME CALCULATION =====
    class VolumeCalculation {
        constructor(data = {}) {
            this.id = data.id || 'vol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            this.userId = data.userId || 'guest';
            this.type = data.type || 'pile'; // pile | pit | quarry
            this.status = data.status || 'draft'; // draft | analyzed | calculated | archived

            // Фото
            this.photosBefore = data.photosBefore || [];
            this.photosAfter = data.photosAfter || [];

            // Пользовательский ввод
            this.comment = data.comment || '';
            this.location = data.location || '';

            // Распознанные данные
            this.parsedData = data.parsedData || {
                material: null,
                equipment: [],
                conditions: {},
                estimatedVolume: null
            };

            // Пользовательские корректировки
            this.userOverrides = data.userOverrides || {
                material: null,
                density: null,
                equipment: null,
                conditions: null
            };

            // Результаты расчёта
            this.results = data.results || null;

            // Метаданные
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
            this.calculatedAt = data.calculatedAt || null;
            this.pdfUrl = data.pdfUrl || null;
        }

        // Сохранить
        save() {
            this.updatedAt = new Date().toISOString();
            const all = getStorage();
            const idx = all.findIndex(c => c.id === this.id);

            if (idx >= 0) {
                all[idx] = this.toJSON();
            } else {
                all.push(this.toJSON());
            }

            setStorage(all);
            return this;
        }

        // Удалить
        delete() {
            const all = getStorage();
            setStorage(all.filter(c => c.id !== this.id));
        }

        // В JSON
        toJSON() {
            return {
                id: this.id,
                userId: this.userId,
                type: this.type,
                status: this.status,
                photosBefore: this.photosBefore,
                photosAfter: this.photosAfter,
                comment: this.comment,
                location: this.location,
                parsedData: this.parsedData,
                userOverrides: this.userOverrides,
                results: this.results,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                calculatedAt: this.calculatedAt,
                pdfUrl: this.pdfUrl
            };
        }

        // Уровень уверенности (0-100)
        getConfidence() {
            let confidence = 0;

            // Фото ДО (+30 max)
            if (this.photosBefore.length > 0) {
                confidence += Math.min(30, this.photosBefore.length * 10);
            }

            // Фото ПОСЛЕ (+30 max)
            if (this.photosAfter.length > 0) {
                confidence += Math.min(30, this.photosAfter.length * 10);
            }

            // Комментарий (+40 max)
            if (this.comment && this.comment.length > 10) {
                confidence += Math.min(40, Math.floor(this.comment.length / 5));
            }

            return Math.min(100, confidence);
        }

        // Статические методы
        static find(id) {
            const data = getStorage().find(c => c.id === id);
            return data ? new VolumeCalculation(data) : null;
        }

        static findByUser(userId = 'guest') {
            return getStorage()
                .filter(c => c.userId === userId)
                .map(c => new VolumeCalculation(c))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static getAll() {
            return getStorage().map(c => new VolumeCalculation(c));
        }

        static deleteAll() {
            setStorage([]);
        }
    }

    // ===== MATERIAL CATALOG =====
    const MaterialCatalog = {
        materials: {
            sand: {
                name: 'Песок',
                density: 1.5,
                loosening: 1.15,
                icon: '🏖️',
                keywords: ['песок', 'sand', 'песчаный']
            },
            gravel: {
                name: 'Щебень',
                density: 1.4,
                loosening: 1.25,
                icon: '🪨',
                keywords: ['щебень', 'гравий', 'gravel', 'щебёнка']
            },
            soil: {
                name: 'Грунт',
                density: 1.6,
                loosening: 1.20,
                icon: '🌍',
                keywords: ['грунт', 'земля', 'soil', 'почва']
            },
            clay: {
                name: 'Глина',
                density: 1.8,
                loosening: 1.30,
                icon: '🧱',
                keywords: ['глина', 'clay', 'суглинок']
            },
            rock: {
                name: 'Скальный грунт',
                density: 2.5,
                loosening: 1.50,
                icon: '⛰️',
                keywords: ['скала', 'rock', 'камень', 'скальный']
            },
            debris: {
                name: 'Строительный мусор',
                density: 1.3,
                loosening: 1.10,
                icon: '🧹',
                keywords: ['мусор', 'бой', 'отходы', 'debris']
            }
        },

        get(id) {
            return this.materials[id] || this.materials.soil;
        },

        getByName(name) {
            if (!name) return this.materials.soil;
            const lower = name.toLowerCase();
            for (const [id, mat] of Object.entries(this.materials)) {
                if (mat.keywords.some(k => lower.includes(k))) {
                    return { id, ...mat };
                }
            }
            return { id: 'soil', ...this.materials.soil };
        },

        getAll() {
            return Object.entries(this.materials).map(([id, mat]) => ({ id, ...mat }));
        }
    };

    // ===== EQUIPMENT CATALOG =====
    const EquipmentCatalog = {
        excavators: [
            { id: 'exc_small', name: 'Мини-экскаватор', bucket: 0.3, cycle: 0.3, icon: '🚜' },
            { id: 'exc_medium', name: 'Экскаватор средний', bucket: 1.0, cycle: 0.5, icon: '🚜' },
            { id: 'exc_large', name: 'Экскаватор большой', bucket: 2.0, cycle: 0.6, icon: '🚜' },
            { id: 'exc_huge', name: 'Карьерный экскаватор', bucket: 5.0, cycle: 0.8, icon: '🚜' }
        ],

        trucks: [
            { id: 'truck_10t', name: 'Самосвал 10т', capacity: 10, bodyM3: 6, speed: 40, icon: '🚛' },
            { id: 'truck_20t', name: 'КамАЗ 20т', capacity: 20, bodyM3: 12, speed: 40, icon: '🚛' },
            { id: 'truck_30t', name: 'Самосвал 30т', capacity: 30, bodyM3: 18, speed: 35, icon: '🚛' },
            { id: 'truck_45t', name: 'Белаз 45т', capacity: 45, bodyM3: 25, speed: 30, icon: '🚛' }
        ],

        loaders: [
            { id: 'loader_small', name: 'Погрузчик малый', bucket: 1.5, cycle: 0.4, icon: '🏗️' },
            { id: 'loader_medium', name: 'Погрузчик средний', bucket: 3.0, cycle: 0.5, icon: '🏗️' },
            { id: 'loader_large', name: 'Погрузчик большой', bucket: 5.0, cycle: 0.6, icon: '🏗️' }
        ],

        getExcavator(id) {
            return this.excavators.find(e => e.id === id) || this.excavators[1];
        },

        getTruck(id) {
            return this.trucks.find(t => t.id === id) || this.trucks[1];
        },

        getLoader(id) {
            return this.loaders.find(l => l.id === id) || this.loaders[1];
        }
    };

    // ===== EXPORT =====
    window.VolumeModels = {
        VolumeCalculation,
        MaterialCatalog,
        EquipmentCatalog
    };

    console.log('✅ VolumeModels v2.0 loaded');
})();
