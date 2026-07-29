// === КРАН-МОНТАЖ, ТАКЕЛАЖ, ГРУЗОПОДЪЁМНОЕ ОБОРУДОВАНИЕ (50 поз.) ===
(function () {
    window.AI_WRK_CRANEWORKS = {
        // === КРАНЫ БАШЕННЫЕ === 1-6
        'wrk_cr_tower_crane_install': { name: 'Монтаж башенного крана', unit: 'шт', price: 550000, category: 'craneworks' },
        'wrk_cr_tower_crane_dismantle': { name: 'Демонтаж башенного крана', unit: 'шт', price: 450000, category: 'craneworks' },
        'wrk_cr_tower_crane_rent_25': { name: 'Аренда башенного крана 25т (с оператором)', unit: 'смена', price: 85000, category: 'craneworks' },
        'wrk_cr_tower_crane_rent_50': { name: 'Аренда башенного крана 50т (с оператором)', unit: 'смена', price: 120000, category: 'craneworks' },
        'wrk_cr_tower_crane_found': { name: 'Устройство фундамента под кран', unit: 'компл.', price: 250000, category: 'craneworks' },
        'wrk_cr_tower_crane_rail': { name: 'Устройство подкрановых путей', unit: 'м.п.', price: 8500, category: 'craneworks' },
        // === АВТОКРАНЫ === 7-14
        'wrk_cr_mobile_25': { name: 'Работа автокрана 25т', unit: 'час', price: 5500, category: 'craneworks' },
        'wrk_cr_mobile_50': { name: 'Работа автокрана 50т', unit: 'час', price: 8500, category: 'craneworks' },
        'wrk_cr_mobile_100': { name: 'Работа автокрана 100т', unit: 'час', price: 15000, category: 'craneworks' },
        'wrk_cr_mobile_200': { name: 'Работа автокрана 200т', unit: 'час', price: 25000, category: 'craneworks' },
        'wrk_cr_mobile_350': { name: 'Работа автокрана 350т', unit: 'час', price: 55000, category: 'craneworks' },
        'wrk_cr_mobile_500': { name: 'Работа автокрана 500т', unit: 'час', price: 85000, category: 'craneworks' },
        'wrk_cr_mobile_deploy': { name: 'Доставка и развёртывание автокрана', unit: 'шт', price: 55000, category: 'craneworks' },
        'wrk_cr_mobile_outrigger': { name: 'Устройство площадки под аутригеры', unit: 'шт', price: 12000, category: 'craneworks' },
        // === ГУСЕНИЧНЫЕ КРАНЫ === 15-18
        'wrk_cr_crawler_50': { name: 'Работа гусеничного крана 50т', unit: 'час', price: 12000, category: 'craneworks' },
        'wrk_cr_crawler_100': { name: 'Работа гусеничного крана 100т', unit: 'час', price: 25000, category: 'craneworks' },
        'wrk_cr_crawler_250': { name: 'Работа гусеничного крана 250т', unit: 'час', price: 55000, category: 'craneworks' },
        'wrk_cr_crawler_400': { name: 'Работа гусеничного крана 400т', unit: 'час', price: 120000, category: 'craneworks' },
        // === ТАКЕЛАЖ === 19-28
        'wrk_cr_rigging_steel_1t': { name: 'Такелажные работы (до 1т)', unit: 'шт', price: 5500, category: 'craneworks' },
        'wrk_cr_rigging_steel_5t': { name: 'Такелажные работы (до 5т)', unit: 'шт', price: 15000, category: 'craneworks' },
        'wrk_cr_rigging_steel_10t': { name: 'Такелажные работы (до 10т)', unit: 'шт', price: 35000, category: 'craneworks' },
        'wrk_cr_rigging_steel_25t': { name: 'Такелажные работы (до 25т)', unit: 'шт', price: 85000, category: 'craneworks' },
        'wrk_cr_rigging_equipment': { name: 'Такелаж оборудования', unit: 'т', price: 8500, category: 'craneworks' },
        'wrk_cr_rigging_transformer': { name: 'Такелаж трансформатора', unit: 'шт', price: 120000, category: 'craneworks' },
        'wrk_cr_rigging_manual': { name: 'Ручной такелаж (стеснённые условия)', unit: 'т', price: 15000, category: 'craneworks' },
        'wrk_cr_rigging_skate': { name: 'Перемещение на такелажных скатах', unit: 'т', price: 3500, category: 'craneworks' },
        'wrk_cr_rigging_hydraulic_jack': { name: 'Подъём гидродомкратами', unit: 'т', price: 5500, category: 'craneworks' },
        'wrk_cr_rigging_strand_jack': { name: 'Подъём стренд-домкратами', unit: 'т', price: 12000, category: 'craneworks' },
        // === МОСТОВЫЕ КРАНЫ === 29-35
        'wrk_cr_overhead_5t': { name: 'Монтаж мостового крана 5т', unit: 'шт', price: 250000, category: 'craneworks' },
        'wrk_cr_overhead_10t': { name: 'Монтаж мостового крана 10т', unit: 'шт', price: 450000, category: 'craneworks' },
        'wrk_cr_overhead_20t': { name: 'Монтаж мостового крана 20т', unit: 'шт', price: 850000, category: 'craneworks' },
        'wrk_cr_overhead_50t': { name: 'Монтаж мостового крана 50т', unit: 'шт', price: 1500000, category: 'craneworks' },
        'wrk_cr_overhead_rail': { name: 'Монтаж подкрановых рельсов', unit: 'м.п.', price: 3500, category: 'craneworks' },
        'wrk_cr_overhead_beam': { name: 'Монтаж подкрановой балки', unit: 'т', price: 25000, category: 'craneworks' },
        'wrk_cr_overhead_commiss': { name: 'ПНР мостового крана', unit: 'шт', price: 55000, category: 'craneworks' },
        // === КОНСОЛЬНЫЕ / КОЗЛОВЫЕ === 36-40
        'wrk_cr_jib_2t': { name: 'Монтаж консольного крана 2т', unit: 'шт', price: 120000, category: 'craneworks' },
        'wrk_cr_jib_5t': { name: 'Монтаж консольного крана 5т', unit: 'шт', price: 250000, category: 'craneworks' },
        'wrk_cr_gantry_10t': { name: 'Монтаж козлового крана 10т', unit: 'шт', price: 850000, category: 'craneworks' },
        'wrk_cr_gantry_20t': { name: 'Монтаж козлового крана 20т', unit: 'шт', price: 1500000, category: 'craneworks' },
        'wrk_cr_gantry_rail': { name: 'Монтаж рельсового пути козлового крана', unit: 'м.п.', price: 5500, category: 'craneworks' },
        // === ТАЛИ / ЛЕБЁДКИ === 41-46
        'wrk_cr_hoist_elect_1t': { name: 'Монтаж электрической тали 1т', unit: 'шт', price: 25000, category: 'craneworks' },
        'wrk_cr_hoist_elect_3t': { name: 'Монтаж электрической тали 3т', unit: 'шт', price: 55000, category: 'craneworks' },
        'wrk_cr_hoist_elect_5t': { name: 'Монтаж электрической тали 5т', unit: 'шт', price: 85000, category: 'craneworks' },
        'wrk_cr_winch_manual_1t': { name: 'Монтаж ручной лебёдки 1т', unit: 'шт', price: 5500, category: 'craneworks' },
        'wrk_cr_winch_electric_3t': { name: 'Монтаж электрической лебёдки 3т', unit: 'шт', price: 35000, category: 'craneworks' },
        'wrk_cr_monorail': { name: 'Монтаж монорельса', unit: 'м.п.', price: 5500, category: 'craneworks' },
        // === СПЕЦТЕХНИКА === 47-50
        'wrk_cr_manipulator': { name: 'Работа манипулятора', unit: 'час', price: 3500, category: 'craneworks' },
        'wrk_cr_telehandler': { name: 'Работа телескопического погрузчика', unit: 'час', price: 3500, category: 'craneworks' },
        'wrk_cr_aerial_18': { name: 'Работа автовышки (h=18м)', unit: 'час', price: 2500, category: 'craneworks' },
        'wrk_cr_aerial_28': { name: 'Работа автовышки (h=28м)', unit: 'час', price: 3500, category: 'craneworks' }
    };
})();
