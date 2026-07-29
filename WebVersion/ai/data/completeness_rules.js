// ================================================================
// COMPLETENESS RULES — Правила комплектности строительных работ
// QazGost AI v3.0
//
// Каждое правило: если в смете есть "trigger" работа,
// то автоматически добавить "required" сопутствующие.
// ================================================================
(function () {
    'use strict';

    /**
     * Формат правила:
     * {
     *   trigger: RegExp | string,        — паттерн имени основной работы
     *   triggerGroup: string,             — группа из WorkRegistry (опционально)
     *   required: [
     *     {
     *       name: string,                 — название сопутствующей работы
     *       searchQuery: string,          — запрос для поиска в WorkRegistry
     *       unit: string,                 — единица измерения
     *       quantityFactor: number,       — множитель от кол-ва основной работы (1.0 = такое же)
     *       fixedQuantity: number,        — фиксированное кол-во (вместо factor)
     *       condition: string|null,       — условие: 'always'|'wet_zone'|'repair'|'area>N'|'hidden_wiring'
     *       fallbackPrice: number,        — цена-заглушка если нет в справочнике
     *       priority: number,             — приоритет (чем выше, тем важнее) 1-10
     *     }
     *   ]
     * }
     */

    const COMPLETENESS_RULES = [
        // ════════════════════════════════════════════════════════
        // ШТУКАТУРКА / ШПАКЛЁВКА
        // ════════════════════════════════════════════════════════
        {
            trigger: /штукатурк|оштукатурив/i,
            triggerGroup: 'finishing_walls',
            required: [
                { name: 'Грунтовка глубокого проникновения', searchQuery: 'грунтовка глубок', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Установка маяков штукатурных', searchQuery: 'маяк штукатурн', unit: 'м²', quantityFactor: 1.0, condition: 'area>10', fallbackPrice: 200, priority: 7 },
                { name: 'Демонтаж старой штукатурки', searchQuery: 'демонтаж штукатурк', unit: 'м²', quantityFactor: 1.0, condition: 'repair', fallbackPrice: 500, priority: 6 },
            ]
        },
        {
            trigger: /шпаклёвк|шпатлёвк/i,
            triggerGroup: 'finishing_walls',
            required: [
                { name: 'Грунтовка перед шпаклёвкой', searchQuery: 'грунтовка', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Шлифовка поверхности', searchQuery: 'шлифовка поверхн', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 800, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ПОКРАСКА
        // ════════════════════════════════════════════════════════
        {
            trigger: /покраск|окраск|покрас/i,
            triggerGroup: 'finishing_walls',
            required: [
                { name: 'Грунтовка перед покраской', searchQuery: 'грунтовка', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Шпаклёвка финишная', searchQuery: 'шпаклёвка финишн', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 1200, priority: 8 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ПЛИТКА / КЕРАМОГРАНИТ
        // ════════════════════════════════════════════════════════
        {
            trigger: /укладка.*плитк|укладка.*керамогранит|укладка мозаик/i,
            triggerGroup: 'flooring',
            required: [
                { name: 'Затирка швов', searchQuery: 'затирка швов', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 500, priority: 9 },
                { name: 'Гидроизоляция пола', searchQuery: 'гидроизоляция пола', unit: 'м²', quantityFactor: 1.0, condition: 'wet_zone', fallbackPrice: 800, priority: 8 },
                { name: 'Грунтовка основания', searchQuery: 'грунтовка', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 7 },
                { name: 'Демонтаж старой плитки', searchQuery: 'демонтаж плитки', unit: 'м²', quantityFactor: 1.0, condition: 'repair', fallbackPrice: 600, priority: 6 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ЛАМИНАТ / ПАРКЕТ
        // ════════════════════════════════════════════════════════
        {
            trigger: /укладка.*ламинат|укладка.*паркет|укладка.*доск/i,
            triggerGroup: 'flooring',
            required: [
                { name: 'Подложка под ламинат', searchQuery: 'подложка ламинат', unit: 'м²', quantityFactor: 1.05, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Установка плинтуса', searchQuery: 'установка плинтус', unit: 'м.п.', quantityFactor: 0.4, condition: 'always', fallbackPrice: 400, priority: 8 },
                { name: 'Выравнивание пола (наливной)', searchQuery: 'наливной пол', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 2000, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ГИПСОКАРТОН
        // ════════════════════════════════════════════════════════
        {
            trigger: /гипсокартон|ГКЛ|перегородк.*монтаж|обшивка.*ГКЛ/i,
            triggerGroup: 'finishing_walls',
            required: [
                { name: 'Шпаклёвка стыков ГКЛ', searchQuery: 'шпаклёвка стыков', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 800, priority: 9 },
                { name: 'Грунтовка ГКЛ', searchQuery: 'грунтовка', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 8 },
                { name: 'Монтаж каркаса для ГКЛ', searchQuery: 'каркас ГКЛ', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 1500, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // СТЯЖКА ПОЛА
        // ════════════════════════════════════════════════════════
        {
            trigger: /стяжка пола|цементно.*стяжка/i,
            triggerGroup: 'flooring',
            required: [
                { name: 'Гидроизоляция пола', searchQuery: 'гидроизоляция пола', unit: 'м²', quantityFactor: 1.0, condition: 'wet_zone', fallbackPrice: 800, priority: 8 },
                { name: 'Демонтаж старого покрытия', searchQuery: 'демонтаж покрытия', unit: 'м²', quantityFactor: 1.0, condition: 'repair', fallbackPrice: 500, priority: 6 },
                { name: 'Грунтовка основания', searchQuery: 'грунтовка', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // КРОВЛЯ
        // ════════════════════════════════════════════════════════
        {
            trigger: /монтаж.*кровл|металлочерепиц|профнастил.*кровл|гибкая черепиц|фальцевая/i,
            triggerGroup: 'roofing',
            required: [
                { name: 'Монтаж обрешётки', searchQuery: 'монтаж обрешётк', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 600, priority: 9 },
                { name: 'Пароизоляция', searchQuery: 'пароизоляция', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 200, priority: 8 },
                { name: 'Гидроизоляция кровли', searchQuery: 'гидроизоляция кровл', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 400, priority: 8 },
                { name: 'Утепление кровли', searchQuery: 'утепление кровл', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 800, priority: 7 },
                { name: 'Монтаж водостоков', searchQuery: 'монтаж водосток', unit: 'м.п.', quantityFactor: 0.3, condition: 'area>50', fallbackPrice: 800, priority: 6 },
                { name: 'Монтаж снегозадержателей', searchQuery: 'снегозадержател', unit: 'м.п.', quantityFactor: 0.2, condition: 'area>50', fallbackPrice: 600, priority: 5 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ЭЛЕКТРИКА
        // ════════════════════════════════════════════════════════
        {
            trigger: /электрик|электромонтаж|прокладка кабел|розетк|выключател/i,
            triggerGroup: 'electrical',
            required: [
                { name: 'Штробление стен под проводку', searchQuery: 'штробление', unit: 'м.п.', quantityFactor: 2.0, condition: 'always', fallbackPrice: 1500, priority: 8 },
                { name: 'Монтаж электрического щита', searchQuery: 'монтаж щита', unit: 'шт', fixedQuantity: 1, condition: 'always', fallbackPrice: 20000, priority: 9 },
                { name: 'Прокладка кабеля', searchQuery: 'прокладка кабеля', unit: 'м.п.', quantityFactor: 3.0, condition: 'always', fallbackPrice: 400, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // САНТЕХНИКА
        // ════════════════════════════════════════════════════════
        {
            trigger: /сантехник|установка унитаз|установка ванн|установка раковин|установка смесител/i,
            triggerGroup: 'plumbing',
            required: [
                { name: 'Прокладка труб водоснабжения', searchQuery: 'прокладка труб водоснабж', unit: 'м.п.', quantityFactor: 5.0, condition: 'always', fallbackPrice: 500, priority: 8 },
                { name: 'Прокладка труб канализации', searchQuery: 'прокладка труб канализ', unit: 'м.п.', quantityFactor: 3.0, condition: 'always', fallbackPrice: 600, priority: 8 },
                { name: 'Установка счётчика воды', searchQuery: 'установка счётчик вод', unit: 'шт', fixedQuantity: 2, condition: 'always', fallbackPrice: 4000, priority: 6 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ФУНДАМЕНТ
        // ════════════════════════════════════════════════════════
        {
            trigger: /фундамент|ленточн.*фунд|плитн.*фунд|свайн|ростверк/i,
            triggerGroup: 'foundation',
            required: [
                { name: 'Земляные работы (котлован/траншея)', searchQuery: 'разработка грунта', unit: 'м³', quantityFactor: 0.5, condition: 'always', fallbackPrice: 1500, priority: 9 },
                { name: 'Гидроизоляция фундамента', searchQuery: 'гидроизоляция фундамент', unit: 'м²', quantityFactor: 1.2, condition: 'always', fallbackPrice: 250, priority: 8 },
                { name: 'Армирование фундамента', searchQuery: 'армирование фундамент', unit: 'м.п.', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Опалубка фундамента', searchQuery: 'опалубка', unit: 'м²', quantityFactor: 0.8, condition: 'always', fallbackPrice: 3000, priority: 8 },
                { name: 'Обратная засыпка', searchQuery: 'обратная засыпка', unit: 'м³', quantityFactor: 0.3, condition: 'always', fallbackPrice: 800, priority: 6 },
                { name: 'Утепление фундамента ЭППС', searchQuery: 'утепление фунд ЭППС', unit: 'м²', quantityFactor: 0.8, condition: 'always', fallbackPrice: 300, priority: 5 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // УТЕПЛЕНИЕ ФАСАДА
        // ════════════════════════════════════════════════════════
        {
            trigger: /утеплени.*фасад|мокрый фасад|СФТК/i,
            triggerGroup: 'facade',
            required: [
                { name: 'Дюбеление утеплителя', searchQuery: 'дюбеление утеплител', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 9 },
                { name: 'Армирующий слой (сетка + клей)', searchQuery: 'армирующ сетка клей', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 800, priority: 9 },
                { name: 'Декоративная штукатурка фасада', searchQuery: 'декоративная штукатурка фасад', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 1500, priority: 7 },
                { name: 'Грунтовка фасада', searchQuery: 'грунтовка фасад', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 300, priority: 7 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // КЛАДКА СТЕН
        // ════════════════════════════════════════════════════════
        {
            trigger: /кладка.*кирпич|кладка.*блок|газобетон|газоблок|пеноблок/i,
            triggerGroup: 'masonry',
            required: [
                { name: 'Кладочный раствор / клей', searchQuery: 'кладочный раствор', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 200, priority: 8 },
                { name: 'Армирование кладки', searchQuery: 'армирование кладки', unit: 'м.п.', quantityFactor: 0.5, condition: 'always', fallbackPrice: 150, priority: 7 },
                { name: 'Устройство перемычек', searchQuery: 'перемычки', unit: 'шт', fixedQuantity: 4, condition: 'always', fallbackPrice: 3000, priority: 6 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ДЕМОНТАЖ
        // ════════════════════════════════════════════════════════
        {
            trigger: /демонтаж/i,
            triggerGroup: 'demolition',
            required: [
                { name: 'Вывоз строительного мусора', searchQuery: 'вывоз мусор', unit: 'м³', quantityFactor: 0.3, condition: 'always', fallbackPrice: 3000, priority: 9 },
                { name: 'Уборка помещения после демонтажа', searchQuery: 'уборка помещен', unit: 'м²', quantityFactor: 1.0, condition: 'always', fallbackPrice: 200, priority: 5 },
            ]
        },

        // ════════════════════════════════════════════════════════
        // ОТОПЛЕНИЕ
        // ════════════════════════════════════════════════════════
        {
            trigger: /монтаж.*радиатор|установка.*радиатор|монтаж.*котл/i,
            triggerGroup: 'heating',
            required: [
                { name: 'Трубы отопления (прокладка)', searchQuery: 'труба отопления', unit: 'м.п.', quantityFactor: 5.0, condition: 'always', fallbackPrice: 350, priority: 8 },
                { name: 'Опрессовка системы отопления', searchQuery: 'опрессовка отопления', unit: 'шт', fixedQuantity: 1, condition: 'always', fallbackPrice: 12000, priority: 7 },
                { name: 'Пусконаладка отопления', searchQuery: 'пусконаладка отопления', unit: 'шт', fixedQuantity: 1, condition: 'always', fallbackPrice: 18000, priority: 6 },
            ]
        },
    ];

    window.COMPLETENESS_RULES = COMPLETENESS_RULES;
    console.log(`✅ [CompletenessRules] ${COMPLETENESS_RULES.length} правил комплектности загружено`);
})();
