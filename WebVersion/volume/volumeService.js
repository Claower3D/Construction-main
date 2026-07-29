// ========== VOLUME SERVICE v2.0 ==========
// Сервис расчётов для модуля "Расчёт объёмов"
// Полностью переписано с нуля

(function () {
    'use strict';

    // ===== CALCULATION ENGINE =====
    const CalculationEngine = {

        /**
         * Главный расчёт
         */
        calculate(calc, overrides = {}) {
            const Models = window.VolumeModels;
            if (!Models) {
                throw new Error('VolumeModels not loaded');
            }

            // Получаем материал
            const materialId = overrides.materialId || calc.parsedData?.material?.id || 'soil';
            const material = Models.MaterialCatalog.get(materialId);
            const density = overrides.density || material.density;
            const loosening = material.loosening;

            // Получаем технику
            const truckId = overrides.truckId || 'truck_20t';
            const excavatorId = overrides.excavatorId || 'exc_medium';
            const truck = Models.EquipmentCatalog.getTruck(truckId);
            const excavator = Models.EquipmentCatalog.getExcavator(excavatorId);

            // Количество техники
            const truckCount = overrides.truckCount || 2;
            const excavatorCount = overrides.excavatorCount || 1;

            // Условия
            const distanceKm = overrides.distanceKm || 10;

            // Симуляция объёмов (в реальности - из AI анализа фото)
            const volumes = this.simulateVolumes(calc.type,
                calc.photosBefore?.length || 0,
                calc.photosAfter?.length || 0,
                calc.comment
            );

            // Расчёт разницы
            const deltaVolume = Math.abs(volumes.volumeAfter - volumes.volumeBefore);

            // Масса с учётом разрыхления
            const mass = deltaVolume * density * loosening;

            // Расчёт ковшей
            const bucketVolume = excavator.bucket * 0.85; // Коэффициент заполнения
            const buckets = Math.ceil(deltaVolume / bucketVolume);

            // Расчёт рейсов
            const effectiveCapacity = truck.capacity * 0.9; // Коэффициент загрузки
            const trips = Math.ceil(mass / effectiveCapacity);

            // Расчёт времени
            // Время погрузки ковшей (мин)
            const loadingMinutes = buckets * excavator.cycle / excavatorCount;

            // Время на рейс (туда-обратно + погрузка-разгрузка)
            const tripTimeMin = (distanceKm * 2 / truck.speed * 60) + 15; // 15 мин на погрузку/разгрузку
            const haulingMinutes = trips * tripTimeMin / truckCount;

            // Общее время (часы)
            const totalMinutes = Math.max(loadingMinutes, haulingMinutes);
            const hours = Math.round(totalMinutes / 60 * 10) / 10;

            // Смены
            const shifts = Math.ceil(hours / 8);

            // Результаты
            return {
                volumeBefore: Math.round(volumes.volumeBefore),
                volumeAfter: Math.round(volumes.volumeAfter),
                deltaVolume: Math.round(deltaVolume),
                mass: Math.round(mass),
                buckets: buckets,
                trips: trips,
                hours: hours,
                shifts: shifts,
                confidence: calc.getConfidence(),
                equipment: {
                    excavator: { ...excavator, count: excavatorCount },
                    truck: { ...truck, count: truckCount }
                },
                material: { ...material, density: density },
                conditions: { distanceKm }
            };
        },

        /**
         * Симуляция объёмов на основе типа и фото
         */
        simulateVolumes(type, beforeCount, afterCount, comment = '') {
            // Базовые объёмы в зависимости от типа
            const baseVolumes = {
                pile: { before: 0, after: 400 },      // Куча - насыпали
                pit: { before: 600, after: 0 },       // Котлован - вынули
                quarry: { before: 1500, after: 300 }  // Карьер - разработка
            };

            const base = baseVolumes[type] || baseVolumes.pile;

            // Извлекаем число из комментария если есть
            const volumeMatch = comment.match(/(\d+)\s*(м³|м3|куб)/i);
            if (volumeMatch) {
                const mentioned = parseInt(volumeMatch[1]);
                if (mentioned > 0 && mentioned < 10000) {
                    return {
                        volumeBefore: type === 'pile' ? 0 : mentioned,
                        volumeAfter: type === 'pile' ? mentioned : 0
                    };
                }
            }

            // Коэффициент от количества фото
            const photoFactor = Math.min(1.5, 0.7 + (beforeCount + afterCount) * 0.15);

            // Случайный разброс ±10%
            const randomFactor = 0.9 + Math.random() * 0.2;

            return {
                volumeBefore: Math.round(base.before * photoFactor * randomFactor),
                volumeAfter: Math.round(base.after * photoFactor * randomFactor)
            };
        }
    };

    // ===== VOLUME SERVICE =====
    const VolumeService = {

        /**
         * Создать новый расчёт
         */
        create(data) {
            const Models = window.VolumeModels;
            if (!Models) {
                console.error('VolumeModels not available');
                return null;
            }

            const calc = new Models.VolumeCalculation({
                ...data,
                userId: window.currentUser?.uid || 'guest',
                status: 'draft'
            });

            calc.save();
            return calc;
        },

        /**
         * Получить расчёт по ID
         */
        get(id) {
            const Models = window.VolumeModels;
            return Models?.VolumeCalculation?.find(id);
        },

        /**
         * Получить все расчёты пользователя
         */
        getMyCalculations() {
            const Models = window.VolumeModels;
            const userId = window.currentUser?.uid || 'guest';
            return Models?.VolumeCalculation?.findByUser(userId) || [];
        },

        /**
         * Получить статистику
         */
        getStats() {
            const all = this.getMyCalculations();
            return {
                total: all.length,
                draft: all.filter(c => c.status === 'draft').length,
                calculated: all.filter(c => c.status === 'calculated').length,
                archived: all.filter(c => c.status === 'archived').length,
                totalVolume: all.reduce((sum, c) => sum + (c.results?.deltaVolume || 0), 0),
                totalMass: all.reduce((sum, c) => sum + (c.results?.mass || 0), 0)
            };
        },

        /**
         * Парсить комментарий
         */
        parseComment(comment) {
            const Models = window.VolumeModels;
            if (!comment || !Models) return {};

            const result = {
                material: null,
                estimatedVolume: null,
                equipment: [],
                distanceKm: null
            };

            // Определить материал
            result.material = Models.MaterialCatalog.getByName(comment);

            // Извлечь объём
            const volumeMatch = comment.match(/(\d+)\s*(м³|м3|куб)/i);
            if (volumeMatch) {
                result.estimatedVolume = parseInt(volumeMatch[1]);
            }

            // Извлечь расстояние
            const distMatch = comment.match(/(\d+)\s*км/i);
            if (distMatch) {
                result.distanceKm = parseInt(distMatch[1]);
            }

            // Найти технику
            if (/камаз|kamaz/i.test(comment)) {
                result.equipment.push({ type: 'truck', id: 'truck_20t' });
            }
            if (/белаз|belaz/i.test(comment)) {
                result.equipment.push({ type: 'truck', id: 'truck_45t' });
            }
            if (/экскаватор/i.test(comment)) {
                result.equipment.push({ type: 'excavator', id: 'exc_medium' });
            }
            if (/погрузчик/i.test(comment)) {
                result.equipment.push({ type: 'loader', id: 'loader_medium' });
            }

            return result;
        },

        /**
         * Выполнить расчёт
         */
        calculate(calcId, overrides = {}) {
            const calc = this.get(calcId);
            if (!calc) {
                throw new Error('Расчёт не найден');
            }

            // Парсим комментарий если ещё не
            if (!calc.parsedData.material) {
                calc.parsedData = this.parseComment(calc.comment);
            }

            // Выполняем расчёт
            calc.results = CalculationEngine.calculate(calc, overrides);
            calc.status = 'calculated';
            calc.calculatedAt = new Date().toISOString();
            calc.save();

            return calc;
        },

        /**
         * Пересчитать с новыми параметрами
         */
        recalculate(calcId, overrides) {
            const calc = this.get(calcId);
            if (!calc) {
                throw new Error('Расчёт не найден');
            }

            calc.userOverrides = { ...calc.userOverrides, ...overrides };
            calc.results = CalculationEngine.calculate(calc, overrides);
            calc.save();

            return calc;
        },

        /**
         * Добавить фото
         */
        addPhoto(calcId, photoData, type = 'before') {
            const calc = this.get(calcId);
            if (!calc) return null;

            const photo = {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                src: photoData,
                addedAt: new Date().toISOString()
            };

            if (type === 'before') {
                calc.photosBefore.push(photo);
            } else {
                calc.photosAfter.push(photo);
            }

            calc.save();
            return calc;
        },

        /**
         * Удалить фото
         */
        removePhoto(calcId, photoId, type = 'before') {
            const calc = this.get(calcId);
            if (!calc) return null;

            if (type === 'before') {
                calc.photosBefore = calc.photosBefore.filter(p => p.id !== photoId);
            } else {
                calc.photosAfter = calc.photosAfter.filter(p => p.id !== photoId);
            }

            calc.save();
            return calc;
        },

        /**
         * Удалить расчёт
         */
        delete(calcId) {
            const calc = this.get(calcId);
            if (calc) {
                calc.delete();
                return true;
            }
            return false;
        },

        /**
         * Генерация PDF
         */
        async generatePdf(calcId) {
            const calc = this.get(calcId);
            if (!calc || !calc.results) {
                throw new Error('Расчёт не готов для генерации PDF');
            }

            // Используем VolumePDF если доступен
            if (window.VolumePDF) {
                const pdfUrl = await window.VolumePDF.generate(calc);
                calc.pdfUrl = pdfUrl;
                calc.status = 'archived';
                calc.save();
                return pdfUrl;
            }

            throw new Error('PDF-сервис недоступен');
        }
    };

    // ===== EXPORT =====
    window.VolumeService = VolumeService;
    window.VolumeEngine = CalculationEngine;

    console.log('✅ VolumeService v2.0 loaded');
})();
