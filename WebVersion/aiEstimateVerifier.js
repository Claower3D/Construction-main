// ============================================================
// aiEstimateVerifier.js — ИИ-Верификатор сметы v1.0
// QAZGOST AI — Цифровой инженер-сметчик
//
// Проверяет смету на:
//   1. Полноту (все обязательные работы)
//   2. Дубликаты
//   3. Логические противоречия
//   4. Реалистичность объёмов
//   5. Совместимость материалов
//   6. Автоматическое исправление
// ============================================================

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 1. MANDATORY WORKS — обязательные работы по типу объекта
    // ═══════════════════════════════════════════════════════════

    const MANDATORY_WORKS = {
        foundation_strip: {
            label: 'Ленточный фундамент',
            stages: [
                { id: 'markup', name: 'Разметка и планировка участка', stage: 'Подготовительные', critical: true },
                { id: 'excavation', name: 'Разработка (выемка) грунта', stage: 'Земляные работы', critical: true },
                { id: 'base_prep', name: 'Подготовка основания (подушка)', stage: 'Земляные работы', critical: true },
                { id: 'formwork', name: 'Устройство опалубки', stage: 'Бетонные работы', critical: true },
                { id: 'rebar', name: 'Армирование фундамента', stage: 'Бетонные работы', critical: true },
                { id: 'concreting', name: 'Заливка бетона', stage: 'Бетонные работы', critical: true },
                { id: 'vibration', name: 'Виброуплотнение бетона', stage: 'Бетонные работы', critical: false },
                { id: 'curing', name: 'Уход за бетоном (7 дней)', stage: 'Бетонные работы', critical: false },
                { id: 'formwork_rem', name: 'Демонтаж опалубки', stage: 'Бетонные работы', critical: true },
                { id: 'waterproof', name: 'Гидроизоляция фундамента', stage: 'Изоляционные', critical: true },
                { id: 'backfill', name: 'Обратная засыпка грунтом', stage: 'Земляные работы', critical: true },
                { id: 'cleanup', name: 'Вывоз строительного мусора', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                markup: /размет|планиров|геодез/i,
                excavation: /разработка грунт|выемк|копк|экскав|котлован|траншея/i,
                base_prep: /подготовк.*основан|подушк|трамбовк|щебён|щебень.*подсып/i,
                formwork: /опалубк/i,
                rebar: /армиров|арматур/i,
                concreting: /залив|бетониров|бетон.*М[2-5]/i,
                vibration: /вибро.*уплотн|виброуплот|вибратор/i,
                curing: /уход за бетон|набор прочност|полив/i,
                formwork_rem: /демонтаж опалуб/i,
                waterproof: /гидроизол|ГИ фундамент/i,
                backfill: /обратн.*засыпк|засыпка пазух/i,
                cleanup: /вывоз.*мусор|уборк/i,
            },
        },
        foundation_slab: {
            label: 'Плитный фундамент',
            stages: [
                { id: 'markup', name: 'Разметка площадки', stage: 'Подготовительные', critical: true },
                { id: 'excavation', name: 'Планировка и выемка грунта', stage: 'Земляные работы', critical: true },
                { id: 'geotextile', name: 'Укладка геотекстиля', stage: 'Подготовительные', critical: false },
                { id: 'base_prep', name: 'Щебёночная подушка + уплотнение', stage: 'Земляные работы', critical: true },
                { id: 'waterproof', name: 'Гидроизоляция (мембрана)', stage: 'Изоляционные', critical: true },
                { id: 'insulation', name: 'Утепление ЭППС', stage: 'Изоляционные', critical: false },
                { id: 'formwork', name: 'Опалубка по периметру', stage: 'Бетонные работы', critical: true },
                { id: 'rebar', name: 'Армирование плиты (2 сетки)', stage: 'Бетонные работы', critical: true },
                { id: 'concreting', name: 'Заливка бетона с виброуплотнением', stage: 'Бетонные работы', critical: true },
                { id: 'curing', name: 'Уход за бетоном', stage: 'Бетонные работы', critical: false },
                { id: 'cleanup', name: 'Вывоз мусора и грунта', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                markup: /размет|планиров/i,
                excavation: /разработка грунт|выемк|планировка грунт/i,
                geotextile: /геотекстил/i,
                base_prep: /подушк|уплотнен|трамбовк|щебён/i,
                waterproof: /гидроизол|мембран/i,
                insulation: /утепл|ЭППС|пеноплекс/i,
                formwork: /опалубк/i,
                rebar: /армиров|арматур/i,
                concreting: /залив|бетониров|фундаментная плит/i,
                curing: /уход за бетон/i,
                cleanup: /вывоз.*мусор/i,
            },
        },
        wall_brick: {
            label: 'Кирпичная стена',
            stages: [
                { id: 'markup', name: 'Разметка осей стен', stage: 'Подготовительные', critical: true },
                { id: 'waterproof', name: 'Гидроизоляция основания', stage: 'Подготовительные', critical: true },
                { id: 'masonry', name: 'Кладка кирпича', stage: 'Основные работы', critical: true },
                { id: 'mesh', name: 'Армирование кладочной сеткой', stage: 'Основные работы', critical: false },
                { id: 'lintels', name: 'Устройство перемычек над проёмами', stage: 'Основные работы', critical: true },
                { id: 'jointing', name: 'Расшивка швов', stage: 'Отделочные', critical: false },
                { id: 'plaster', name: 'Штукатурка стен', stage: 'Отделочные', critical: false },
                { id: 'cleanup', name: 'Уборка и вывоз мусора', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                markup: /размет|ос.*стен/i,
                waterproof: /гидроизол.*основан/i,
                masonry: /кладк.*кирпич|кирпич.*кладк/i,
                mesh: /армиров.*кладк|сетк.*кладоч/i,
                lintels: /перемычк/i,
                jointing: /расшивк/i,
                plaster: /штукатурк/i,
                cleanup: /вывоз|уборк/i,
            },
        },
        wall_block: {
            label: 'Стена из блоков',
            stages: [
                { id: 'markup', name: 'Разметка осей', stage: 'Подготовительные', critical: true },
                { id: 'waterproof', name: 'Горизонтальная гидроизоляция', stage: 'Подготовительные', critical: true },
                { id: 'masonry', name: 'Кладка блоков на клей', stage: 'Основные работы', critical: true },
                { id: 'lintels', name: 'Устройство перемычек', stage: 'Основные работы', critical: true },
                { id: 'armbelt', name: 'Армопояс по периметру', stage: 'Основные работы', critical: true },
                { id: 'plaster', name: 'Штукатурка стен', stage: 'Отделочные', critical: false },
                { id: 'cleanup', name: 'Уборка и вывоз мусора', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                markup: /размет/i,
                waterproof: /гидроизол/i,
                masonry: /кладк.*газобет|газобет.*кладк|блок.*кладк/i,
                lintels: /перемычк/i,
                armbelt: /армопояс|монолитн.*пояс/i,
                plaster: /штукатурк/i,
                cleanup: /вывоз|уборк/i,
            },
        },
        floor_screed: {
            label: 'Стяжка пола',
            stages: [
                { id: 'demolition', name: 'Демонтаж старого покрытия', stage: 'Подготовительные', critical: false },
                { id: 'priming', name: 'Грунтовка основания', stage: 'Подготовительные', critical: true },
                { id: 'waterproof', name: 'Гидроизоляция (мокрые зоны)', stage: 'Изоляционные', critical: false },
                { id: 'beacons', name: 'Установка маяков', stage: 'Подготовительные', critical: true },
                { id: 'screed', name: 'Заливка стяжки', stage: 'Основные работы', critical: true },
                { id: 'curing', name: 'Уход за стяжкой (7 дней)', stage: 'Основные работы', critical: false },
                { id: 'cleanup', name: 'Уборка', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                demolition: /демонтаж.*покрыт|демонтаж.*стяжк/i,
                priming: /грунтовк/i,
                waterproof: /гидроизол/i,
                beacons: /маяк/i,
                screed: /стяжк|залив/i,
                curing: /уход/i,
                cleanup: /убор|вывоз/i,
            },
        },
        roof_gable: {
            label: 'Двускатная кровля',
            stages: [
                { id: 'mauerlat', name: 'Монтаж мауэрлата', stage: 'Каркас', critical: true },
                { id: 'rafters', name: 'Монтаж стропильной системы', stage: 'Каркас', critical: true },
                { id: 'vapor', name: 'Пароизоляция', stage: 'Изоляционные', critical: true },
                { id: 'insulation', name: 'Утепление кровли', stage: 'Изоляционные', critical: false },
                { id: 'sheathing', name: 'Обрешётка', stage: 'Каркас', critical: true },
                { id: 'roofing', name: 'Монтаж кровельного покрытия', stage: 'Основные работы', critical: true },
                { id: 'gutter', name: 'Водосточная система', stage: 'Завершающие', critical: true },
                { id: 'soffits', name: 'Подшивка свесов', stage: 'Завершающие', critical: false },
                { id: 'cleanup', name: 'Уборка и вывоз мусора', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                mauerlat: /мауэрлат/i,
                rafters: /стропил/i,
                vapor: /пароизоляц/i,
                insulation: /утепл.*кровл|минват|утеплител/i,
                sheathing: /обрешётк|обрешетк/i,
                roofing: /металлочереп|проф.*настил|кровельн.*покрыт|монтаж.*кровл/i,
                gutter: /водосточ|желоб|водосток/i,
                soffits: /подшивк.*свес|софит/i,
                cleanup: /убор|вывоз/i,
            },
        },
        roof_flat: {
            label: 'Плоская кровля',
            stages: [
                { id: 'base_prep', name: 'Подготовка основания', stage: 'Подготовительные', critical: true },
                { id: 'slope', name: 'Разуклонка (создание уклона)', stage: 'Подготовительные', critical: true },
                { id: 'vapor', name: 'Пароизоляция', stage: 'Изоляционные', critical: true },
                { id: 'insulation', name: 'Утепление', stage: 'Изоляционные', critical: true },
                { id: 'waterproof', name: 'Гидроизоляция кровли', stage: 'Основные работы', critical: true },
                { id: 'drainage', name: 'Водоприёмные воронки', stage: 'Завершающие', critical: true },
                { id: 'cleanup', name: 'Уборка', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                base_prep: /подготовк.*основан/i,
                slope: /разуклонк|уклон/i,
                vapor: /пароизоляц/i,
                insulation: /утепл/i,
                waterproof: /гидроизол|мембран|наплавл|рубероид/i,
                drainage: /воронк|водоприём/i,
                cleanup: /убор|вывоз/i,
            },
        },
        generic: {
            label: 'Общие работы',
            stages: [
                { id: 'prep', name: 'Подготовительные работы', stage: 'Подготовительные', critical: true },
                { id: 'main', name: 'Основные работы', stage: 'Основные работы', critical: true },
                { id: 'finish', name: 'Финишные работы', stage: 'Отделочные', critical: false },
                { id: 'cleanup', name: 'Уборка и вывоз мусора', stage: 'Завершающие', critical: false },
            ],
            matchPatterns: {
                prep: /подготовит|разметк|планировк/i,
                main: /основн|монтаж|кладк|залив/i,
                finish: /финиш|отделк|штукатурк|покраск/i,
                cleanup: /убор|вывоз/i,
            },
        },
    };

    // ═══════════════════════════════════════════════════════════
    // 2. LOGICAL RULES — правила зависимостей
    // ═══════════════════════════════════════════════════════════

    const DEPENDENCY_RULES = [
        { needs: /покраск|окраск/i, requires: /грунтовк/i, message: 'Покраска без грунтовки — нарушение технологии (адгезия)' },
        { needs: /плитк.*укладк|укладк.*плитк/i, requires: /стяжк|выравн/i, message: 'Укладка плитки требует ровного основания (стяжка)' },
        { needs: /обои|поклейк/i, requires: /шпаклёвк|шпатлёвк/i, message: 'Поклейка обоев требует финишной шпаклёвки' },
        { needs: /ламинат|паркет/i, requires: /стяжк|выравниван/i, message: 'Ламинат/паркет требует ровного основания' },
        { needs: /кладк.*кирпич/i, requires: /гидроизол/i, message: 'Кладка на фундамент без горизонтальной гидроизоляции' },
        { needs: /штукатурк/i, requires: /грунтовк|бетоноконтакт/i, message: 'Штукатурка без грунтовки — плохая адгезия (СП 71.13330)' },
        { needs: /залив.*бетон|бетониров/i, requires: /опалубк/i, message: 'Бетонирование без опалубки невозможно (кроме плитных)' },
        { needs: /армиров/i, requires: /опалубк/i, message: 'Армирование обычно требует опалубки' },
    ];

    // ═══════════════════════════════════════════════════════════
    // 3. MATERIAL COMPATIBILITY — несовместимые материалы
    // ═══════════════════════════════════════════════════════════

    const INCOMPATIBLE_MATERIALS = [
        { a: /цемент.*раствор|ЦПС/i, b: /гипсов.*штукатурк/i, reason: 'Цементный раствор несовместим с гипсовой штукатуркой — трещины, разрушение' },
        { a: /пеноплекс|ЭППС/i, b: /ацетон|растворител/i, reason: 'ЭППС разрушается от органических растворителей' },
        { a: /битумн.*мастик/i, b: /пеноплекс|ЭППС/i, reason: 'Горячая битумная мастика оплавляет ЭППС (использовать холодную)' },
        { a: /оцинков.*сталь/i, b: /медн/i, reason: 'Гальваническая коррозия при контакте оцинковки с медью' },
        { a: /силикатн.*кирпич/i, b: /влажн.*помещ|ванн|подвал/i, reason: 'Силикатный кирпич не рекомендуется во влажных помещениях' },
    ];

    // ═══════════════════════════════════════════════════════════
    // 4. VOLUME SANITY CHECKS — проверка реалистичности объёмов
    // ═══════════════════════════════════════════════════════════

    const VOLUME_CHECKS = {
        foundation_strip: [
            { param: 'volume_m3', min: 3, max: 300, label: 'Объём бетона фундамента' },
            { param: 'rebar_kg', ratioTo: 'volume_m3', min: 60, max: 150, label: 'Армирование (кг/м³ бетона)' },
            { param: 'area_m2', min: 10, max: 500, label: 'Площадь фундамента' },
        ],
        foundation_slab: [
            { param: 'volume_m3', min: 5, max: 500, label: 'Объём бетона плиты' },
            { param: 'area_m2', min: 20, max: 1000, label: 'Площадь плиты' },
        ],
        wall_brick: [
            { param: 'area_m2', min: 5, max: 1000, label: 'Площадь стен' },
        ],
        wall_block: [
            { param: 'area_m2', min: 5, max: 1000, label: 'Площадь стен' },
        ],
        floor_screed: [
            { param: 'area_m2', min: 3, max: 500, label: 'Площадь стяжки' },
        ],
        roof_gable: [
            { param: 'area_m2', min: 20, max: 1000, label: 'Площадь кровли' },
        ],
        roof_flat: [
            { param: 'area_m2', min: 20, max: 2000, label: 'Площадь кровли' },
        ],
    };

    // ═══════════════════════════════════════════════════════════
    // AUTO-ADD ITEMS — позиции для автоматического добавления
    // ═══════════════════════════════════════════════════════════

    const AUTO_ADD_ITEMS = {
        foundation_strip: {
            markup: { name: 'Разметка и планировка участка', unit: 'компл.', qtyFixed: 1, priceBase: 25000, stage: 'Подготовительные', description: 'Геодезическая разбивка осей, установка обносок' },
            vibration: { name: 'Виброуплотнение бетона', unit: 'M3', qtyKey: 'volume_m3', priceBase: 1500, stage: 'Бетонные работы', description: 'Глубинный вибратор для удаления воздуха' },
            curing: { name: 'Уход за бетоном (7 дней)', unit: 'M2', qtyKey: 'area_m2', priceBase: 350, stage: 'Бетонные работы', description: 'Полив, укрытие плёнкой, набор прочности' },
            formwork_rem: { name: 'Демонтаж опалубки', unit: 'M2', qtyKey: 'area_m2', qtyMult: 0.5, priceBase: 1200, stage: 'Бетонные работы', description: 'Аккуратный разбор после набора 70% прочности' },
            backfill: { name: 'Обратная засыпка грунтом', unit: 'M3', qtyKey: 'volume_m3', qtyMult: 0.4, priceBase: 4500, stage: 'Земляные работы', description: 'Засыпка пазух с послойным уплотнением' },
            cleanup: { name: 'Вывоз строительного мусора', unit: 'рейс', qtyFixed: 3, priceBase: 25000, stage: 'Завершающие', description: 'Контейнер 8м³ + вывоз на полигон' },
        },
        foundation_slab: {
            markup: { name: 'Разметка площадки', unit: 'компл.', qtyFixed: 1, priceBase: 20000, stage: 'Подготовительные', description: 'Геодезическая разбивка, реперные точки' },
            geotextile: { name: 'Укладка геотекстиля', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.1, priceBase: 350, stage: 'Подготовительные', description: 'Разделительный слой под щебень' },
            curing: { name: 'Уход за бетоном', unit: 'M2', qtyKey: 'area_m2', priceBase: 300, stage: 'Бетонные работы', description: 'Полив, укрытие, контроль температуры' },
            cleanup: { name: 'Вывоз грунта и мусора', unit: 'рейс', qtyFixed: 4, priceBase: 25000, stage: 'Завершающие', description: 'Вывоз извлечённого грунта' },
        },
        wall_brick: {
            markup: { name: 'Разметка осей стен', unit: 'компл.', qtyFixed: 1, priceBase: 15000, stage: 'Подготовительные', description: 'Разметка первого ряда по уровню' },
            waterproof: { name: 'Горизонтальная гидроизоляция', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 800, stage: 'Подготовительные', description: 'Рубероид/мембрана на основание' },
            lintels: { name: 'Устройство перемычек', unit: 'шт', qtyFixed: 4, priceBase: 15000, stage: 'Основные работы', description: 'Ж/б или металлические перемычки над проёмами' },
            cleanup: { name: 'Уборка и вывоз мусора', unit: 'рейс', qtyFixed: 2, priceBase: 25000, stage: 'Завершающие', description: 'Вывоз боя кирпича и раствора' },
        },
        wall_block: {
            markup: { name: 'Разметка осей стен', unit: 'компл.', qtyFixed: 1, priceBase: 15000, stage: 'Подготовительные', description: 'Разметка + уровень первого ряда' },
            waterproof: { name: 'Горизонтальная гидроизоляция', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 800, stage: 'Подготовительные', description: 'Мембрана по верху фундамента' },
            armbelt: { name: 'Монолитный армопояс', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 8500, stage: 'Основные работы', description: 'Ж/б пояс для распределения нагрузки от перекрытий' },
            cleanup: { name: 'Уборка и вывоз мусора', unit: 'рейс', qtyFixed: 2, priceBase: 25000, stage: 'Завершающие', description: 'Вывоз обрезков блоков' },
        },
        floor_screed: {
            priming: { name: 'Грунтовка основания', unit: 'M2', qtyKey: 'area_m2', priceBase: 400, stage: 'Подготовительные', description: 'Бетоноконтакт для адгезии стяжки' },
            beacons: { name: 'Установка маяков', unit: 'M2', qtyKey: 'area_m2', priceBase: 600, stage: 'Подготовительные', description: 'Металлические направляющие по уровню' },
            curing: { name: 'Уход за стяжкой (7 дней)', unit: 'M2', qtyKey: 'area_m2', priceBase: 200, stage: 'Основные работы', description: 'Укрытие плёнкой, контроль высыхания' },
            cleanup: { name: 'Уборка помещения', unit: 'M2', qtyKey: 'area_m2', priceBase: 150, stage: 'Завершающие', description: 'Финишная уборка' },
        },
        roof_gable: {
            mauerlat: { name: 'Монтаж мауэрлата', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 2500, stage: 'Каркас', description: 'Брус 150×150 по периметру на анкерах' },
            vapor: { name: 'Пароизоляция', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.1, priceBase: 400, stage: 'Изоляционные', description: 'Плёнка под утеплитель изнутри' },
            sheathing: { name: 'Обрешётка кровли', unit: 'M2', qtyKey: 'area_m2', priceBase: 1800, stage: 'Каркас', description: 'Доска 25×150 или OSB под покрытие' },
            gutter: { name: 'Водосточная система', unit: 'компл.', qtyFixed: 1, priceBase: 85000, stage: 'Завершающие', description: 'Желоба, воронки, трубы — полный комплект' },
            soffits: { name: 'Подшивка карнизных свесов', unit: 'п.м.', qtyKey: 'perimeter_m', qtyMult: 0.5, priceBase: 3500, stage: 'Завершающие', description: 'Софиты или вагонка' },
            cleanup: { name: 'Уборка', unit: 'компл.', qtyFixed: 1, priceBase: 15000, stage: 'Завершающие', description: 'Уборка территории от обрезков и упаковки' },
        },
        roof_flat: {
            base_prep: { name: 'Подготовка основания', unit: 'M2', qtyKey: 'area_m2', priceBase: 800, stage: 'Подготовительные', description: 'Выравнивание, уборка пыли, грунтовка' },
            slope: { name: 'Разуклонка керамзитом', unit: 'M3', qtyKey: 'volume_m3', qtyMult: 0.15, priceBase: 6500, stage: 'Подготовительные', description: 'Создание уклона для стока воды (СП 17.13330)' },
            drainage: { name: 'Водоприёмные воронки', unit: 'шт', qtyFixed: 3, priceBase: 12000, stage: 'Завершающие', description: 'Внутренний водосток с обогревом' },
            cleanup: { name: 'Уборка', unit: 'компл.', qtyFixed: 1, priceBase: 10000, stage: 'Завершающие', description: 'Уборка кровли от мусора' },
        },
        generic: {
            prep: { name: 'Подготовительные работы', unit: 'компл.', qtyFixed: 1, priceBase: 35000, stage: 'Подготовительные', description: 'Разметка, ограждение, подключение' },
            cleanup: { name: 'Уборка и вывоз мусора', unit: 'рейс', qtyFixed: 2, priceBase: 25000, stage: 'Завершающие', description: 'Контейнер + вывоз на полигон' },
        },
    };

    // ═══════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Проверка полноты сметы — все ли обязательные работы включены.
     */
    function checkCompleteness(objectType, estimateItems) {
        const rules = MANDATORY_WORKS[objectType] || MANDATORY_WORKS.generic;
        const results = [];

        for (const stage of rules.stages) {
            const pattern = rules.matchPatterns[stage.id];
            if (!pattern) continue;

            const found = estimateItems.some(item => {
                const name = (item.name || item.work_name || '').toLowerCase();
                return pattern.test(name);
            });

            results.push({
                id: stage.id,
                name: stage.name,
                stage: stage.stage,
                critical: stage.critical,
                found,
                status: found ? 'ok' : (stage.critical ? 'error' : 'warning'),
            });
        }

        return results;
    }

    /**
     * Поиск дубликатов (fuzzy match по названиям).
     */
    function checkDuplicates(estimateItems) {
        const duplicates = [];
        const names = estimateItems.map(it => (it.name || it.work_name || '').toLowerCase());

        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const similarity = _fuzzyScore(names[i], names[j]);
                if (similarity > 0.75) {
                    duplicates.push({
                        indexA: i,
                        indexB: j,
                        nameA: estimateItems[i].name || estimateItems[i].work_name,
                        nameB: estimateItems[j].name || estimateItems[j].work_name,
                        similarity: Math.round(similarity * 100),
                        suggestion: 'Объединить позиции или удалить дубликат',
                    });
                }
            }
        }
        return duplicates;
    }

    /**
     * Проверка логических зависимостей.
     */
    function checkContradictions(estimateItems) {
        const issues = [];
        const allNames = estimateItems.map(it => (it.name || it.work_name || '')).join(' | ');

        for (const rule of DEPENDENCY_RULES) {
            const hasNeed = rule.needs.test(allNames);
            const hasReq = rule.requires.test(allNames);

            if (hasNeed && !hasReq) {
                issues.push({
                    type: 'missing_dependency',
                    message: rule.message,
                    severity: 'warning',
                });
            }
        }
        return issues;
    }

    /**
     * Проверка реалистичности объёмов.
     */
    function checkVolumes(objectType, dimensions) {
        const checks = VOLUME_CHECKS[objectType] || [];
        const issues = [];

        for (const check of checks) {
            let value = dimensions[check.param];
            if (value === undefined || value === null) continue;

            if (check.ratioTo && dimensions[check.ratioTo]) {
                value = value / dimensions[check.ratioTo];
            }

            if (value < check.min) {
                issues.push({
                    type: 'volume_too_low',
                    param: check.param,
                    value: Math.round(value * 100) / 100,
                    expected: `${check.min}–${check.max}`,
                    label: check.label,
                    severity: value < check.min * 0.5 ? 'error' : 'warning',
                    message: `${check.label}: ${value} — аномально мало (ожидается ${check.min}–${check.max})`,
                });
            } else if (value > check.max) {
                issues.push({
                    type: 'volume_too_high',
                    param: check.param,
                    value: Math.round(value * 100) / 100,
                    expected: `${check.min}–${check.max}`,
                    label: check.label,
                    severity: value > check.max * 2 ? 'error' : 'warning',
                    message: `${check.label}: ${value} — аномально много (ожидается ${check.min}–${check.max})`,
                });
            }
        }
        return issues;
    }

    /**
     * Проверка совместимости материалов.
     */
    function checkMaterialCompatibility(estimateItems) {
        const issues = [];
        const allMaterials = estimateItems
            .map(it => (it.name || it.work_name || '') + ' ' + (it.material_name || ''))
            .join(' | ');

        for (const rule of INCOMPATIBLE_MATERIALS) {
            if (rule.a.test(allMaterials) && rule.b.test(allMaterials)) {
                issues.push({
                    type: 'material_incompatibility',
                    reason: rule.reason,
                    severity: 'warning',
                });
            }
        }
        return issues;
    }

    /**
     * Автоматическое исправление — добавляет пропущенные позиции.
     */
    function autoFix(objectType, estimateItems, dimensions, regCoef) {
        const completeness = checkCompleteness(objectType, estimateItems);
        const missing = completeness.filter(c => !c.found);
        const autoItems = AUTO_ADD_ITEMS[objectType] || AUTO_ADD_ITEMS.generic;
        const coef = regCoef || 1.0;
        const added = [];

        for (const miss of missing) {
            const spec = autoItems[miss.id];
            if (!spec) continue;

            // Рассчитать количество
            let qty;
            if (spec.qtyFixed) {
                qty = spec.qtyFixed;
            } else if (spec.qtyKey && dimensions[spec.qtyKey]) {
                qty = dimensions[spec.qtyKey] * (spec.qtyMult || 1.0);
            } else {
                qty = 1;
            }
            qty = Math.round(qty * 100) / 100;

            const price = Math.round(spec.priceBase * coef);
            const subtotal = Math.round(qty * price);

            added.push({
                name: spec.name,
                unit: spec.unit,
                qty,
                price,
                subtotal,
                section: miss.stage,
                stage: miss.stage,
                description: spec.description,
                aiComment: `Автоматически добавлено ИИ: ${miss.name} — обязательный этап для ${(MANDATORY_WORKS[objectType] || MANDATORY_WORKS.generic).label}`,
                addedByAI: true,
                assumption: miss.critical ? null : 'Объём рассчитан по нормативным допущениям',
                hidden: true,
                critical: miss.critical,
            });
        }

        return added;
    }

    /**
     * Полная верификация — объединяет все проверки.
     */
    function verify(objectType, estimateItems, dimensions, regCoef) {
        const completeness = checkCompleteness(objectType, estimateItems);
        const duplicates = checkDuplicates(estimateItems);
        const contradictions = checkContradictions(estimateItems);
        const volumeIssues = checkVolumes(objectType, dimensions || {});
        const materialIssues = checkMaterialCompatibility(estimateItems);

        const missingCritical = completeness.filter(c => !c.found && c.critical);
        const missingOptional = completeness.filter(c => !c.found && !c.critical);

        // Auto-fix: добавить пропущенные работы
        const autoFixItems = autoFix(objectType, estimateItems, dimensions || {}, regCoef);

        // Собрать все проблемы
        const errors = [];
        const warnings = [];
        const aiComments = [];

        missingCritical.forEach(m => errors.push(`❌ Пропущена обязательная работа: ${m.name}`));
        missingOptional.forEach(m => warnings.push(`⚠️ Рекомендуется добавить: ${m.name}`));
        duplicates.forEach(d => warnings.push(`🔄 Возможный дубликат: «${d.nameA}» ≈ «${d.nameB}» (${d.similarity}%)`));
        contradictions.forEach(c => warnings.push(`⚡ ${c.message}`));
        volumeIssues.forEach(v => (v.severity === 'error' ? errors : warnings).push(`📊 ${v.message}`));
        materialIssues.forEach(m => warnings.push(`🧪 ${m.reason}`));

        if (autoFixItems.length > 0) {
            aiComments.push(`🤖 ИИ автоматически добавил ${autoFixItems.length} позиций для полноты сметы`);
        }

        const completenessScore = completeness.length > 0
            ? Math.round(completeness.filter(c => c.found).length / completeness.length * 100)
            : 100;

        const passed = errors.length === 0;

        return {
            passed,
            completenessScore,
            completeness,
            duplicates,
            contradictions,
            volumeIssues,
            materialIssues,
            autoFixItems,
            errors,
            warnings,
            aiComments,
            summary: passed
                ? `✅ Смета прошла верификацию (${completenessScore}% полнота, ${warnings.length} замечаний)`
                : `❌ Обнаружены проблемы: ${errors.length} ошибок, ${warnings.length} предупреждений`,
        };
    }

    // ── UTILS ──────────────────────────────────────────────────

    function _fuzzyScore(a, b) {
        if (!a || !b) return 0;
        const wordsA = a.split(/\s+/).filter(Boolean);
        const wordsB = b.split(/\s+/).filter(Boolean);
        if (wordsA.length === 0 || wordsB.length === 0) return 0;
        let matches = 0;
        for (const wa of wordsA) {
            if (wordsB.some(wb => wb.includes(wa) || wa.includes(wb))) matches++;
        }
        return matches / Math.max(wordsA.length, wordsB.length);
    }

    // ── PUBLIC API ─────────────────────────────────────────────

    window.AIEstimateVerifier = {
        verify,
        checkCompleteness,
        checkDuplicates,
        checkContradictions,
        checkVolumes,
        checkMaterialCompatibility,
        autoFix,
        MANDATORY_WORKS,
        DEPENDENCY_RULES,
        INCOMPATIBLE_MATERIALS,
        AUTO_ADD_ITEMS,
    };

    console.log('[AIEstimateVerifier] ✅ ИИ-верификатор сметы загружен');

})();
