// === КАТАЛОГ СИЗ И СПЕЦОДЕЖДЫ (50 позиций) ===
(function () {
    window.AI_MAT_PPE_CATALOG = {
        // Каски
        'ppe_helmet_basic': { name: 'Каска строительная базовая', unit: 'шт', price: 200, category: 'ppe' },
        'ppe_helmet_ratchet': { name: 'Каска с храповым механизмом', unit: 'шт', price: 500, category: 'ppe' },
        'ppe_helmet_visor': { name: 'Каска с козырьком и подшл.', unit: 'шт', price: 800, category: 'ppe' },
        // Очки / маски
        'ppe_glasses_clear': { name: 'Очки защитные прозрачные', unit: 'шт', price: 50, category: 'ppe' },
        'ppe_glasses_tinted': { name: 'Очки защитные затемнённые', unit: 'шт', price: 80, category: 'ppe' },
        'ppe_goggles_sealed': { name: 'Очки герметичные (закрытые)', unit: 'шт', price: 150, category: 'ppe' },
        'ppe_face_shield': { name: 'Щиток лицевой защитный', unit: 'шт', price: 200, category: 'ppe' },
        // Респираторы / маски
        'ppe_mask_ffp1': { name: 'Респиратор FFP1', unit: 'шт', price: 30, category: 'ppe' },
        'ppe_mask_ffp2': { name: 'Респиратор FFP2', unit: 'шт', price: 50, category: 'ppe' },
        'ppe_mask_ffp3': { name: 'Респиратор FFP3', unit: 'шт', price: 100, category: 'ppe' },
        'ppe_respirator_half': { name: 'Полумаска со сменными фильтрами', unit: 'шт', price: 500, category: 'ppe' },
        'ppe_filter_a1p1': { name: 'Фильтр сменный A1P1 (пара)', unit: 'пара', price: 200, category: 'ppe' },
        // Перчатки
        'ppe_gloves_cotton': { name: 'Перчатки х/б с ПВХ (12 пар)', unit: 'уп.', price: 100, category: 'ppe' },
        'ppe_gloves_nitrile': { name: 'Перчатки нитриловые (50 пар)', unit: 'уп.', price: 200, category: 'ppe' },
        'ppe_gloves_latex': { name: 'Перчатки латексные (50 пар)', unit: 'уп.', price: 150, category: 'ppe' },
        'ppe_gloves_leather': { name: 'Перчатки кожаные рабочие', unit: 'пара', price: 100, category: 'ppe' },
        'ppe_gloves_winter': { name: 'Перчатки утеплённые', unit: 'пара', price: 150, category: 'ppe' },
        'ppe_gloves_anticut_5': { name: 'Перчатки противопорезные кл.5', unit: 'пара', price: 200, category: 'ppe' },
        // Обувь
        'ppe_boots_pvc_42': { name: 'Сапоги ПВХ (резиновые)', unit: 'пара', price: 300, category: 'ppe' },
        'ppe_boots_safety_s3': { name: 'Ботинки рабочие S3 (метал. подносок)', unit: 'пара', price: 1500, category: 'ppe' },
        'ppe_boots_winter_s3': { name: 'Ботинки зимние S3', unit: 'пара', price: 2500, category: 'ppe' },
        'ppe_boots_high_s3': { name: 'Сапоги кожаные S3', unit: 'пара', price: 2000, category: 'ppe' },
        // Спецодежда
        'ppe_coverall_std': { name: 'Комбинезон рабочий (стандарт)', unit: 'шт', price: 1000, category: 'ppe' },
        'ppe_coverall_winter': { name: 'Комбинезон утеплённый', unit: 'шт', price: 3000, category: 'ppe' },
        'ppe_jacket_summer': { name: 'Куртка рабочая летняя', unit: 'шт', price: 500, category: 'ppe' },
        'ppe_jacket_winter': { name: 'Куртка рабочая зимняя', unit: 'шт', price: 2000, category: 'ppe' },
        'ppe_pants_summer': { name: 'Брюки рабочие летние', unit: 'шт', price: 400, category: 'ppe' },
        'ppe_pants_winter': { name: 'Брюки рабочие зимние', unit: 'шт', price: 1500, category: 'ppe' },
        'ppe_vest_signal': { name: 'Жилет сигнальный', unit: 'шт', price: 100, category: 'ppe' },
        'ppe_vest_signal_pockets': { name: 'Жилет сигнальный с карманами', unit: 'шт', price: 200, category: 'ppe' },
        'ppe_rain_suit': { name: 'Костюм от дождя (куртка+брюки)', unit: 'компл.', price: 800, category: 'ppe' },
        'ppe_disposable_coverall': { name: 'Комбинезон одноразовый Tyvek', unit: 'шт', price: 300, category: 'ppe' },
        // Защита слуха
        'ppe_earplugs_10pcs': { name: 'Беруши (10 пар)', unit: 'уп.', price: 50, category: 'ppe' },
        'ppe_earmuffs_std': { name: 'Наушники защитные стандартные', unit: 'шт', price: 300, category: 'ppe' },
        'ppe_earmuffs_helmet': { name: 'Наушники на каску', unit: 'шт', price: 500, category: 'ppe' },
        // Защита от падения
        'ppe_harness_full': { name: 'Привязь страховочная полная', unit: 'шт', price: 3000, category: 'ppe' },
        'ppe_lanyard_2m': { name: 'Строп с амортизатором (2м)', unit: 'шт', price: 1500, category: 'ppe' },
        'ppe_retractable_3m': { name: 'Блок самоспасения (3м)', unit: 'шт', price: 5000, category: 'ppe' },
        'ppe_anchor_sling_1m': { name: 'Петля анкерная (1м)', unit: 'шт', price: 500, category: 'ppe' },
        'ppe_carabiner_steel': { name: 'Карабин стальной автоматический', unit: 'шт', price: 300, category: 'ppe' },
        // Наколенники / пояса
        'ppe_knee_pads': { name: 'Наколенники строительные', unit: 'пара', price: 300, category: 'ppe' },
        'ppe_tool_belt': { name: 'Пояс монтажный для инструмента', unit: 'шт', price: 800, category: 'ppe' },
        // Аптечка
        'ppe_first_aid_kit': { name: 'Аптечка первой помощи на произв.', unit: 'шт', price: 500, category: 'ppe' },
        // Знаки безопасности
        'ppe_sign_helmet_required': { name: 'Знак «Работать в каске»', unit: 'шт', price: 50, category: 'ppe' },
        'ppe_sign_glasses_required': { name: 'Знак «Работать в очках»', unit: 'шт', price: 50, category: 'ppe' },
        'ppe_sign_danger': { name: 'Знак «Опасная зона»', unit: 'шт', price: 50, category: 'ppe' },
        'ppe_barrier_tape_200m': { name: 'Лента сигнальная (200м)', unit: 'рулон', price: 100, category: 'ppe' },
        'ppe_barrier_tape_og_100m': { name: 'Лента оградительная (100м)', unit: 'рулон', price: 200, category: 'ppe' }
    };
})();
