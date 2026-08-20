// ========== ESTIMATE MODELS v2.0 ==========
// Переработанные модели для автоматического расчёта объёмов по фото
// Минимум ручного ввода, максимум автоматизации

(function () {
    'use strict';

    const Storage = window.Models?.Storage || {
        get: (key) => {
            try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
        },
        set: (key, value) => {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
        },
        getAll: (prefix) => {
            const result = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(prefix)) {
                    try { result.push(JSON.parse(localStorage.getItem(key))); } catch { }
                }
            }
            return result;
        },
        remove: (key) => {
            try { localStorage.removeItem(key); } catch { }
        }
    };

    function generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ========== ENUMS ==========

    // Статус расчёта
    const EstimateStatus = {
        DRAFT: 'DRAFT',           // Создан, ждёт фото
        UPLOADING: 'UPLOADING',   // Загрузка фото
        PROCESSING: 'PROCESSING', // AI обрабатывает
        NEEDS_SCALE: 'NEEDS_SCALE', // Нужен масштаб от пользователя
        NEEDS_TYPE: 'NEEDS_TYPE',   // Нужен тип объекта
        READY: 'READY',           // Результат готов
        ERROR: 'ERROR',           // Ошибка обработки
        ARCHIVED: 'ARCHIVED'      // Архивирован
    };

    // Тип объекта (определяется автоматически или вручную)
    const ObjectType = {
        FOUNDATION_STRIP: 'FOUNDATION_STRIP',   // Ленточный фундамент
        FOUNDATION_SLAB: 'FOUNDATION_SLAB',     // Плитный фундамент
        FOUNDATION_PILES: 'FOUNDATION_PILES',   // Свайный фундамент
        WALL_BRICK: 'WALL_BRICK',               // Кирпичная стена
        WALL_BLOCK: 'WALL_BLOCK',               // Блочная стена
        WALL_CONCRETE: 'WALL_CONCRETE',         // Бетонная стена
        FLOOR_CONCRETE: 'FLOOR_CONCRETE',       // Бетонный пол
        FLOOR_SCREED: 'FLOOR_SCREED',           // Стяжка пола
        ROOF_FLAT: 'ROOF_FLAT',                 // Плоская кровля
        ROOF_PITCHED: 'ROOF_PITCHED',           // Скатная кровля
        OPENING_DOOR: 'OPENING_DOOR',           // Дверной проём
        OPENING_WINDOW: 'OPENING_WINDOW',       // Оконный проём
        UNKNOWN: 'UNKNOWN'                       // Не определён
    };

    const ObjectTypeLabels = {
        [ObjectType.FOUNDATION_STRIP]: '🧱 Ленточный фундамент',
        [ObjectType.FOUNDATION_SLAB]: '⬛ Плитный фундамент',
        [ObjectType.FOUNDATION_PILES]: '🔩 Свайный фундамент',
        [ObjectType.WALL_BRICK]: '🧱 Кирпичная стена',
        [ObjectType.WALL_BLOCK]: '⬜ Блочная стена',
        [ObjectType.WALL_CONCRETE]: '🏗️ Бетонная стена',
        [ObjectType.FLOOR_CONCRETE]: '⬛ Бетонный пол',
        [ObjectType.FLOOR_SCREED]: '📐 Стяжка пола',
        [ObjectType.ROOF_FLAT]: '🏠 Плоская кровля',
        [ObjectType.ROOF_PITCHED]: '🏡 Скатная кровля',
        [ObjectType.OPENING_DOOR]: '🚪 Дверной проём',
        [ObjectType.OPENING_WINDOW]: '🪟 Оконный проём',
        [ObjectType.UNKNOWN]: '❓ Не определён'
    };

    // Источник масштаба
    const ScaleSource = {
        AUTO_RULER: 'AUTO_RULER',       // Найдена рулетка/линейка
        AUTO_A4: 'AUTO_A4',             // Найден лист A4
        AUTO_REFERENCE: 'AUTO_REFERENCE', // Типовой объект (дверь, кирпич)
        USER_INPUT: 'USER_INPUT',       // Введено пользователем
        ESTIMATED: 'ESTIMATED',         // Приблизительная оценка
        UNKNOWN: 'UNKNOWN'              // Масштаб не определён
    };

    // Точность расчёта
    const AccuracyLevel = {
        HIGH: 'HIGH',       // ±5% - есть масштаб, хорошее фото
        MEDIUM: 'MEDIUM',   // ±15% - частичный масштаб или 1 фото
        LOW: 'LOW',         // ±30% - оценочный расчёт
        UNKNOWN: 'UNKNOWN'  // Точность не определена
    };

    const AccuracyLabels = {
        [AccuracyLevel.HIGH]: { label: 'Высокая', icon: '🎯', color: '#22c55e', range: '±5%' },
        [AccuracyLevel.MEDIUM]: { label: 'Средняя', icon: '📊', color: '#f59e0b', range: '±15%' },
        [AccuracyLevel.LOW]: { label: 'Низкая', icon: '⚠️', color: '#ef4444', range: '±30%' },
        [AccuracyLevel.UNKNOWN]: { label: 'Не определена', icon: '❓', color: '#6b7280', range: '?' }
    };

    // ========== MODEL: ESTIMATE PHOTO ==========
    class EstimatePhoto {
        constructor(data = {}) {
            this.id = data.id || generateId('photo_');
            this.estimateId = data.estimateId || '';
            this.originalSrc = data.originalSrc || '';   // Base64 оригинала
            this.processedSrc = data.processedSrc || ''; // После обработки
            this.thumbnailSrc = data.thumbnailSrc || ''; // Миниатюра
            this.width = data.width || 0;
            this.height = data.height || 0;
            this.status = data.status || 'pending'; // pending | processing | ready | error
            this.analysisResult = data.analysisResult || null; // Результат AI
            this.contours = data.contours || [];     // Найденные контуры
            this.issues = data.issues || [];         // Проблемы с фото
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        // Проверка качества фото
        checkQuality() {
            const issues = [];
            if (this.width < 800 || this.height < 600) {
                issues.push({ code: 'LOW_RES', message: 'Низкое разрешение фото' });
            }
            // Другие проверки добавляются при реальной обработке
            this.issues = issues;
            return issues.length === 0;
        }
    }

    // ========== MODEL: ESTIMATE (Расчёт объёмов) ==========
    class Estimate {
        constructor(data = {}) {
            this.id = data.id || generateId('est_');
            this.userId = data.userId || '';
            this.title = data.title || '';  // Автогенерируется
            this.status = data.status || EstimateStatus.DRAFT;

            // Фотографии
            this.photos = (data.photos || []).map(p => new EstimatePhoto(p));

            // Распознанный тип объекта
            this.objectType = data.objectType || ObjectType.UNKNOWN;
            this.objectTypeConfidence = data.objectTypeConfidence || 0; // 0-100%
            this.objectTypeSource = data.objectTypeSource || 'auto';    // auto | user

            // Масштаб
            this.scale = data.scale || null; // pixels per meter
            this.scaleSource = data.scaleSource || ScaleSource.UNKNOWN;
            this.scaleReference = data.scaleReference || null; // Опорный размер

            // Параметры объекта (специфичные для типа)
            this.objectParams = data.objectParams || {};
            // Для фундамента: { width, height, depth, pileCount, pileDiameter }
            // Для стены: { thickness, height }
            // Для пола: { thickness }

            // Результаты расчёта
            this.results = data.results || null;
            // { area: m², volume: m³, perimeter: m, items: [...], accuracy, accuracyReasons }

            // Точность
            this.accuracy = data.accuracy || AccuracyLevel.UNKNOWN;
            this.accuracyReasons = data.accuracyReasons || [];

            // Версии
            this.version = data.version || 1;
            this.versions = data.versions || []; // История версий

            // Метаданные
            this.city = data.city || '';
            this.address = data.address || '';
            this.comment = data.comment || '';

            // Timestamps
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
            this.processedAt = data.processedAt || null;
        }

        // Автогенерация названия
        generateTitle() {
            const typeName = ObjectTypeLabels[this.objectType]?.replace(/^[^\s]+\s/, '') || 'Объект';
            const area = this.results?.area ? `${Math.round(this.results.area)}м²` : '';
            const city = this.city || '';
            const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

            this.title = [typeName, area, city, date].filter(Boolean).join(' • ');
            return this.title;
        }

        // Добавить фото
        addPhoto(photoData) {
            const photo = new EstimatePhoto({
                ...photoData,
                estimateId: this.id
            });
            this.photos.push(photo);
            this.updatedAt = new Date().toISOString();
            return photo;
        }

        // Проверка готовности к обработке
        canProcess() {
            return this.photos.length > 0 &&
                this.photos.some(p => p.status !== 'error');
        }

        // Нужен ли ввод масштаба?
        needsScaleInput() {
            return this.scaleSource === ScaleSource.UNKNOWN ||
                this.scaleSource === ScaleSource.ESTIMATED;
        }

        // Нужен ли выбор типа объекта?
        needsTypeInput() {
            return this.objectType === ObjectType.UNKNOWN ||
                this.objectTypeConfidence < 70;
        }

        // Сохранить версию
        saveVersion() {
            this.versions.push({
                version: this.version,
                results: JSON.parse(JSON.stringify(this.results)),
                objectType: this.objectType,
                scale: this.scale,
                savedAt: new Date().toISOString()
            });
            this.version++;
        }

        // Рассчитать точность
        calculateAccuracy() {
            const reasons = [];
            let score = 100;

            // Масштаб
            if (this.scaleSource === ScaleSource.UNKNOWN) {
                score -= 50;
                reasons.push('Масштаб не определён');
            } else if (this.scaleSource === ScaleSource.ESTIMATED) {
                score -= 30;
                reasons.push('Масштаб приблизительный');
            } else if (this.scaleSource === ScaleSource.AUTO_REFERENCE) {
                score -= 15;
                reasons.push('Масштаб по типовому объекту');
            }

            // Количество фото
            if (this.photos.length === 1) {
                score -= 20;
                reasons.push('Только 1 фото');
            } else if (this.photos.length < 3) {
                score -= 10;
                reasons.push('Мало фото для точного расчёта');
            }

            // Тип объекта
            if (this.objectTypeConfidence < 80 && this.objectTypeSource === 'auto') {
                score -= 15;
                reasons.push('Тип объекта определён неточно');
            }

            // Качество фото
            const badPhotos = this.photos.filter(p => p.issues.length > 0).length;
            if (badPhotos > 0) {
                score -= badPhotos * 5;
                reasons.push(`${badPhotos} фото низкого качества`);
            }

            // Определяем уровень
            if (score >= 80) {
                this.accuracy = AccuracyLevel.HIGH;
            } else if (score >= 50) {
                this.accuracy = AccuracyLevel.MEDIUM;
            } else {
                this.accuracy = AccuracyLevel.LOW;
            }

            this.accuracyReasons = reasons;
            return { accuracy: this.accuracy, reasons, score };
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`estimate_v2_${this.id}`, this);
            return this;
        }

        delete() {
            Storage.remove(`estimate_v2_${this.id}`);
        }

        static find(id) {
            const data = Storage.get(`estimate_v2_${id}`);
            return data ? new Estimate(data) : null;
        }

        static findByUser(userId) {
            return Storage.getAll('estimate_v2_')
                .filter(e => e.userId === userId)
                .map(e => new Estimate(e))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static getAll() {
            return Storage.getAll('estimate_v2_').map(e => new Estimate(e));
        }
    }

    // ========== EXPORT ==========
    window.EstimateModels = {
        // Enums
        EstimateStatus,
        ObjectType,
        ObjectTypeLabels,
        ScaleSource,
        AccuracyLevel,
        AccuracyLabels,

        // Classes
        Estimate,
        EstimatePhoto,

        // Helpers
        generateId
    };

    console.log('✅ EstimateModels v2.0 loaded');

})();
