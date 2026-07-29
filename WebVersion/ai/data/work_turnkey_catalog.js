// === КАТАЛОГ РАБОТ: РЕМОНТ «ПОД КЛЮЧ» + КОМПЛЕКСНЫЕ ПАКЕТЫ (70 позиций) ===
(function () {
    window.AI_WORK_TURNKEY_CATALOG = {
        // === РЕМОНТ КВАРТИРЫ «ПОД КЛЮЧ» ===
        'work_repair_apt_cosmetic': { name: 'Косметический ремонт квартиры', unit: 'м²', price: 3000, category: 'work_turnkey' },
        'work_repair_apt_standard': { name: 'Стандартный ремонт квартиры', unit: 'м²', price: 5000, category: 'work_turnkey' },
        'work_repair_apt_euro': { name: 'Евроремонт квартиры', unit: 'м²', price: 8000, category: 'work_turnkey' },
        'work_repair_apt_premium': { name: 'Премиум ремонт квартиры', unit: 'м²', price: 12000, category: 'work_turnkey' },
        'work_repair_apt_design': { name: 'Дизайнерский ремонт квартиры', unit: 'м²', price: 15000, category: 'work_turnkey' },
        // === РЕМОНТ КОМНАТ ===
        'work_repair_bathroom_std': { name: 'Ремонт ванной комнаты (стандарт)', unit: 'м²', price: 6000, category: 'work_turnkey' },
        'work_repair_bathroom_premium': { name: 'Ремонт ванной комнаты (премиум)', unit: 'м²', price: 10000, category: 'work_turnkey' },
        'work_repair_kitchen_std': { name: 'Ремонт кухни (стандарт)', unit: 'м²', price: 5000, category: 'work_turnkey' },
        'work_repair_kitchen_premium': { name: 'Ремонт кухни (премиум)', unit: 'м²', price: 9000, category: 'work_turnkey' },
        'work_repair_balcony': { name: 'Ремонт балкона / лоджии', unit: 'м²', price: 4000, category: 'work_turnkey' },
        'work_repair_corridor': { name: 'Ремонт прихожей / коридора', unit: 'м²', price: 4000, category: 'work_turnkey' },
        'work_repair_room': { name: 'Ремонт жилой комнаты', unit: 'м²', price: 3500, category: 'work_turnkey' },
        // === СТРОИТЕЛЬСТВО ДОМА «ПОД КЛЮЧ» ===
        'work_build_house_frame': { name: 'Строительство каркасного дома', unit: 'м²', price: 15000, category: 'work_turnkey' },
        'work_build_house_gas': { name: 'Строительство дома из газобетона', unit: 'м²', price: 20000, category: 'work_turnkey' },
        'work_build_house_brick': { name: 'Строительство дома из кирпича', unit: 'м²', price: 25000, category: 'work_turnkey' },
        'work_build_house_sip': { name: 'Строительство дома из SIP-панелей', unit: 'м²', price: 12000, category: 'work_turnkey' },
        'work_build_house_log': { name: 'Строительство дома из бревна', unit: 'м²', price: 18000, category: 'work_turnkey' },
        'work_build_house_timber': { name: 'Строительство дома из бруса', unit: 'м²', price: 16000, category: 'work_turnkey' },
        'work_build_house_monolith': { name: 'Строительство монолитного дома', unit: 'м²', price: 22000, category: 'work_turnkey' },
        'work_build_garage': { name: 'Строительство гаража', unit: 'м²', price: 10000, category: 'work_turnkey' },
        'work_build_bath': { name: 'Строительство бани', unit: 'м²', price: 15000, category: 'work_turnkey' },
        'work_build_extension': { name: 'Пристройка к дому', unit: 'м²', price: 12000, category: 'work_turnkey' },
        // === ЭТАПЫ СТРОИТЕЛЬСТВА ===
        'work_stage_zero_cycle': { name: 'Нулевой цикл (фундамент + подвал)', unit: 'м²', price: 5000, category: 'work_turnkey' },
        'work_stage_box': { name: 'Возведение коробки дома', unit: 'м²', price: 8000, category: 'work_turnkey' },
        'work_stage_roof': { name: 'Кровельные работы (этап)', unit: 'м²', price: 3000, category: 'work_turnkey' },
        'work_stage_facade': { name: 'Фасадные работы (этап)', unit: 'м²', price: 2500, category: 'work_turnkey' },
        'work_stage_engineering': { name: 'Инженерные системы (этап)', unit: 'м²', price: 3000, category: 'work_turnkey' },
        'work_stage_interior': { name: 'Внутренняя отделка (этап)', unit: 'м²', price: 4000, category: 'work_turnkey' },
        // === КОММЕРЧЕСКИЕ ПОМЕЩЕНИЯ ===
        'work_repair_office_std': { name: 'Ремонт офиса (стандарт)', unit: 'м²', price: 4000, category: 'work_turnkey' },
        'work_repair_office_premium': { name: 'Ремонт офиса (премиум)', unit: 'м²', price: 7000, category: 'work_turnkey' },
        'work_repair_shop': { name: 'Ремонт магазина / торговой площади', unit: 'м²', price: 5000, category: 'work_turnkey' },
        'work_repair_restaurant': { name: 'Ремонт ресторана / кафе', unit: 'м²', price: 8000, category: 'work_turnkey' },
        'work_repair_warehouse': { name: 'Ремонт склада / производства', unit: 'м²', price: 3000, category: 'work_turnkey' },
        // === ИНЖЕНЕРНЫЕ СИСТЕМЫ (ПАКЕТЫ) ===
        'work_pack_electric_apt': { name: 'Электрика «под ключ» (квартира)', unit: 'шт', price: 50000, category: 'work_turnkey' },
        'work_pack_electric_house': { name: 'Электрика «под ключ» (дом)', unit: 'шт', price: 100000, category: 'work_turnkey' },
        'work_pack_plumb_apt': { name: 'Сантехника «под ключ» (квартира)', unit: 'шт', price: 40000, category: 'work_turnkey' },
        'work_pack_plumb_house': { name: 'Сантехника «под ключ» (дом)', unit: 'шт', price: 80000, category: 'work_turnkey' },
        'work_pack_heat_house': { name: 'Отопление «под ключ» (дом)', unit: 'шт', price: 100000, category: 'work_turnkey' },
        'work_pack_vent_apt': { name: 'Вентиляция «под ключ» (квартира)', unit: 'шт', price: 30000, category: 'work_turnkey' },
        'work_pack_vent_house': { name: 'Вентиляция «под ключ» (дом)', unit: 'шт', price: 60000, category: 'work_turnkey' },
        // === БЛАГОУСТРОЙСТВО (ПАКЕТЫ) ===
        'work_pack_landscape': { name: 'Ландшафтный дизайн (проект + реализация)', unit: 'сотка', price: 30000, category: 'work_turnkey' },
        'work_pack_paving': { name: 'Мощение участка «под ключ»', unit: 'м²', price: 1500, category: 'work_turnkey' },
        'work_pack_fence': { name: 'Забор «под ключ» (профнастил)', unit: 'м.п.', price: 2000, category: 'work_turnkey' },
        'work_pack_fence_brick': { name: 'Забор «под ключ» (кирпич)', unit: 'м.п.', price: 5000, category: 'work_turnkey' },
        'work_pack_pool': { name: 'Бассейн «под ключ»', unit: 'м²', price: 15000, category: 'work_turnkey' },
        'work_pack_sauna': { name: 'Сауна / хаммам «под ключ»', unit: 'м²', price: 10000, category: 'work_turnkey' },
        // === ПЕРЕПЛАНИРОВКА ===
        'work_replanning_project': { name: 'Проект перепланировки', unit: 'шт', price: 15000, category: 'work_turnkey' },
        'work_replanning_agree': { name: 'Согласование перепланировки', unit: 'шт', price: 20000, category: 'work_turnkey' },
        'work_replanning_wall_new': { name: 'Возведение новых перегородок', unit: 'м²', price: 500, category: 'work_turnkey' },
        'work_replanning_wall_demo': { name: 'Демонтаж перегородок', unit: 'м²', price: 300, category: 'work_turnkey' },
        'work_replanning_opening': { name: 'Устройство проёма в несущей стене', unit: 'шт', price: 10000, category: 'work_turnkey' },
        // === НАДЗОР / УПРАВЛЕНИЕ ===
        'work_supervision_tech': { name: 'Технический надзор за строительством', unit: 'месяц', price: 30000, category: 'work_turnkey' },
        'work_supervision_design': { name: 'Авторский надзор', unit: 'месяц', price: 20000, category: 'work_turnkey' },
        'work_project_management': { name: 'Управление проектом (PМ)', unit: 'месяц', price: 40000, category: 'work_turnkey' },
        // === СДАЧА / ПРИЁМКА ===
        'work_acceptance_apt': { name: 'Приёмка квартиры от застройщика', unit: 'шт', price: 5000, category: 'work_turnkey' },
        'work_acceptance_house': { name: 'Приёмка дома (тех. экспертиза)', unit: 'шт', price: 10000, category: 'work_turnkey' },
        'work_thermal_imaging': { name: 'Тепловизионное обследование', unit: 'шт', price: 5000, category: 'work_turnkey' },
        'work_air_test': { name: 'Проверка герметичности (blower-door)', unit: 'шт', price: 10000, category: 'work_turnkey' }
    };
})();
