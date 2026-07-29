// ========== VOLUME CATALOGS v2.0 ==========
// Каталоги материалов, техники и коэффициентов
// Упрощённая версия для совместимости

(function () {
    'use strict';

    // ===== МАТЕРИАЛЫ =====
    const Materials = {
        sand: {
            id: 'sand',
            name: 'Песок',
            nameShort: 'Песок',
            density: 1.5,
            loosening: 1.15,
            icon: '🏖️',
            color: '#fcd34d',
            categories: ['сыпучие', 'строительные']
        },
        gravel: {
            id: 'gravel',
            name: 'Щебень',
            nameShort: 'Щебень',
            density: 1.4,
            loosening: 1.25,
            icon: '🪨',
            color: '#9ca3af',
            categories: ['сыпучие', 'строительные']
        },
        soil: {
            id: 'soil',
            name: 'Грунт',
            nameShort: 'Грунт',
            density: 1.6,
            loosening: 1.20,
            icon: '🌍',
            color: '#854d0e',
            categories: ['земляные']
        },
        clay: {
            id: 'clay',
            name: 'Глина',
            nameShort: 'Глина',
            density: 1.8,
            loosening: 1.30,
            icon: '🧱',
            color: '#c2410c',
            categories: ['земляные']
        },
        rock: {
            id: 'rock',
            name: 'Скальный грунт',
            nameShort: 'Скала',
            density: 2.5,
            loosening: 1.50,
            icon: '⛰️',
            color: '#6b7280',
            categories: ['скальные']
        },
        debris: {
            id: 'debris',
            name: 'Строительный мусор',
            nameShort: 'Мусор',
            density: 1.3,
            loosening: 1.10,
            icon: '🧹',
            color: '#78716c',
            categories: ['отходы']
        }
    };

    // ===== ТЕХНИКА: ЭКСКАВАТОРЫ =====
    const Excavators = [
        {
            id: 'exc_mini',
            name: 'Мини-экскаватор',
            brand: 'Bobcat',
            bucketM3: 0.3,
            cycleMin: 0.3,
            icon: '🚜',
            pricePerHour: 15000
        },
        {
            id: 'exc_small',
            name: 'Экскаватор малый',
            brand: 'JCB',
            bucketM3: 0.6,
            cycleMin: 0.4,
            icon: '🚜',
            pricePerHour: 25000
        },
        {
            id: 'exc_medium',
            name: 'Экскаватор средний',
            brand: 'Hitachi',
            bucketM3: 1.0,
            cycleMin: 0.5,
            icon: '🚜',
            pricePerHour: 35000
        },
        {
            id: 'exc_large',
            name: 'Экскаватор большой',
            brand: 'CAT 320',
            bucketM3: 2.0,
            cycleMin: 0.6,
            icon: '🚜',
            pricePerHour: 50000
        },
        {
            id: 'exc_huge',
            name: 'Карьерный экскаватор',
            brand: 'Komatsu PC800',
            bucketM3: 5.0,
            cycleMin: 0.8,
            icon: '🚜',
            pricePerHour: 100000
        }
    ];

    // ===== ТЕХНИКА: САМОСВАЛЫ =====
    const Trucks = [
        {
            id: 'truck_10t',
            name: 'Самосвал 10т',
            brand: 'ЗИЛ',
            capacityTons: 10,
            bodyM3: 6,
            speedKmH: 45,
            icon: '🚛',
            pricePerHour: 8000
        },
        {
            id: 'truck_20t',
            name: 'КамАЗ 20т',
            brand: 'КамАЗ',
            capacityTons: 20,
            bodyM3: 12,
            speedKmH: 40,
            icon: '🚛',
            pricePerHour: 12000
        },
        {
            id: 'truck_25t',
            name: 'Scania 25т',
            brand: 'Scania',
            capacityTons: 25,
            bodyM3: 15,
            speedKmH: 45,
            icon: '🚛',
            pricePerHour: 15000
        },
        {
            id: 'truck_30t',
            name: 'Shacman 30т',
            brand: 'Shacman',
            capacityTons: 30,
            bodyM3: 18,
            speedKmH: 35,
            icon: '🚛',
            pricePerHour: 18000
        },
        {
            id: 'truck_45t',
            name: 'Белаз 45т',
            brand: 'Белаз',
            capacityTons: 45,
            bodyM3: 25,
            speedKmH: 30,
            icon: '🚛',
            pricePerHour: 35000
        }
    ];

    // ===== ТЕХНИКА: ПОГРУЗЧИКИ =====
    const Loaders = [
        {
            id: 'loader_small',
            name: 'Погрузчик малый',
            brand: 'Bobcat',
            bucketM3: 1.5,
            cycleMin: 0.4,
            icon: '🏗️',
            pricePerHour: 12000
        },
        {
            id: 'loader_medium',
            name: 'Погрузчик средний',
            brand: 'CAT 950',
            bucketM3: 3.0,
            cycleMin: 0.5,
            icon: '🏗️',
            pricePerHour: 20000
        },
        {
            id: 'loader_large',
            name: 'Погрузчик большой',
            brand: 'Komatsu WA500',
            bucketM3: 5.0,
            cycleMin: 0.6,
            icon: '🏗️',
            pricePerHour: 35000
        }
    ];

    // ===== КОЭФФИЦИЕНТЫ =====
    const Coefficients = {
        // Коэффициент заполнения ковша
        bucketFill: 0.85,

        // Коэффициент загрузки кузова
        truckLoad: 0.90,

        // Время на погрузку/разгрузку (мин)
        loadUnloadMin: 15,

        // Часов в смене
        hoursPerShift: 8,

        // Коэффициенты расстояния
        getDistanceFactor(km) {
            if (km <= 5) return 1.0;
            if (km <= 10) return 1.1;
            if (km <= 20) return 1.2;
            if (km <= 30) return 1.35;
            if (km <= 50) return 1.5;
            return 1.8;
        }
    };

    // ===== ГЛАВНЫЙ API =====
    const VolumeCatalogs = {
        // Материалы
        getMaterial(id) {
            return Materials[id] || Materials.soil;
        },

        getAllMaterials() {
            return Object.values(Materials);
        },

        // Экскаваторы
        getExcavator(id) {
            return Excavators.find(e => e.id === id) || Excavators[2];
        },

        getAllExcavators() {
            return [...Excavators];
        },

        // Самосвалы
        getTruck(id) {
            return Trucks.find(t => t.id === id) || Trucks[1];
        },

        getAllTrucks() {
            return [...Trucks];
        },

        // Погрузчики
        getLoader(id) {
            return Loaders.find(l => l.id === id) || Loaders[1];
        },

        getAllLoaders() {
            return [...Loaders];
        },

        // Коэффициенты
        getCoefficients() {
            return { ...Coefficients };
        },

        getDistanceFactor(km) {
            return Coefficients.getDistanceFactor(km);
        }
    };

    // ===== EXPORT =====
    window.VolumeCatalogs = VolumeCatalogs;

    console.log('✅ VolumeCatalogs v2.0 loaded');
})();
