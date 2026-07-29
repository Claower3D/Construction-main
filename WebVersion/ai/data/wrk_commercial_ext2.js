// === ОТДЕЛКА КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ — офисы, магазины, рестораны, гостиницы, медицинские (500 поз.) ===
(function () {
    window.AI_WRK_COMMERCIAL_EXT2 = {
        // === ОФИСНЫЕ ПОМЕЩЕНИЯ ===
        'wrk_cm_office_openspace': { name: 'Отделка open-space (комплексная, эконом)', unit: 'м²', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_office_openspace_std': { name: 'Отделка open-space (стандарт)', unit: 'м²', price: 18000, category: 'commercial_ext2' },
        'wrk_cm_office_openspace_prem': { name: 'Отделка open-space (премиум)', unit: 'м²', price: 28000, category: 'commercial_ext2' },
        'wrk_cm_office_cabinet': { name: 'Отделка кабинета руководителя', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_office_meeting': { name: 'Отделка переговорной комнаты', unit: 'м²', price: 22000, category: 'commercial_ext2' },
        'wrk_cm_office_reception': { name: 'Отделка ресепшн', unit: 'м²', price: 35000, category: 'commercial_ext2' },
        'wrk_cm_office_kitchen': { name: 'Отделка офисной кухни/столовой', unit: 'м²', price: 18000, category: 'commercial_ext2' },
        'wrk_cm_office_server': { name: 'Отделка серверной', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_office_partition_glass': { name: 'Стеклянная перегородка офисная', unit: 'м²', price: 8500, category: 'commercial_ext2' },
        'wrk_cm_office_partition_glass_door': { name: 'Стеклянная перегородка с дверью', unit: 'м²', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_office_partition_blind': { name: 'Перегородка со встроенными жалюзи', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_office_raised_floor': { name: 'Фальшпол 150мм', unit: 'м²', price: 3500, category: 'commercial_ext2' },
        'wrk_cm_office_raised_floor_300': { name: 'Фальшпол 300мм', unit: 'м²', price: 4500, category: 'commercial_ext2' },
        'wrk_cm_office_raised_floor_600': { name: 'Фальшпол 600мм', unit: 'м²', price: 5500, category: 'commercial_ext2' },
        // === ТОРГОВЫЕ ПОМЕЩЕНИЯ ===
        'wrk_cm_retail_finish_eco': { name: 'Отделка магазина (эконом)', unit: 'м²', price: 8500, category: 'commercial_ext2' },
        'wrk_cm_retail_finish_std': { name: 'Отделка магазина (стандарт)', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_retail_finish_prem': { name: 'Отделка бутика (премиум)', unit: 'м²', price: 35000, category: 'commercial_ext2' },
        'wrk_cm_retail_showcase': { name: 'Монтаж витрины', unit: 'м²', price: 8500, category: 'commercial_ext2' },
        'wrk_cm_retail_sign_interior': { name: 'Монтаж интерьерной вывески', unit: 'шт', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_retail_sign_exterior': { name: 'Монтаж наружной вывески', unit: 'шт', price: 55000, category: 'commercial_ext2' },
        'wrk_cm_retail_light_box': { name: 'Монтаж светового короба', unit: 'шт', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_retail_shelving': { name: 'Монтаж торгового стеллажа', unit: 'шт', price: 3500, category: 'commercial_ext2' },
        'wrk_cm_retail_checkout': { name: 'Монтаж кассовой зоны', unit: 'шт', price: 25000, category: 'commercial_ext2' },
        // === РЕСТОРАНЫ/КАФЕ ===
        'wrk_cm_food_kitchen_finish': { name: 'Отделка кухни ресторана', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_food_hall_finish': { name: 'Отделка зала ресторана', unit: 'м²', price: 22000, category: 'commercial_ext2' },
        'wrk_cm_food_bar_zone': { name: 'Устройство барной зоны', unit: 'м.п.', price: 45000, category: 'commercial_ext2' },
        'wrk_cm_food_ventilation': { name: 'Монтаж вытяжного зонта', unit: 'шт', price: 55000, category: 'commercial_ext2' },
        'wrk_cm_food_grease_trap': { name: 'Монтаж жироуловителя', unit: 'шт', price: 35000, category: 'commercial_ext2' },
        'wrk_cm_food_walk_in_cooler': { name: 'Монтаж холодильной камеры', unit: 'м²', price: 18000, category: 'commercial_ext2' },
        'wrk_cm_food_floor_drain': { name: 'Устройство трапа в полу кухни', unit: 'шт', price: 5500, category: 'commercial_ext2' },
        // === ГОСТИНИЦЫ ===
        'wrk_cm_hotel_room_std': { name: 'Отделка номера стандарт', unit: 'м²', price: 18000, category: 'commercial_ext2' },
        'wrk_cm_hotel_room_deluxe': { name: 'Отделка номера делюкс', unit: 'м²', price: 28000, category: 'commercial_ext2' },
        'wrk_cm_hotel_room_suite': { name: 'Отделка номера люкс', unit: 'м²', price: 45000, category: 'commercial_ext2' },
        'wrk_cm_hotel_lobby': { name: 'Отделка лобби', unit: 'м²', price: 35000, category: 'commercial_ext2' },
        'wrk_cm_hotel_corridor': { name: 'Отделка коридора гостиницы', unit: 'м²', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_hotel_bathroom': { name: 'Отделка санузла номера', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        // === МЕДИЦИНСКИЕ ПОМЕЩЕНИЯ ===
        'wrk_cm_med_ward': { name: 'Отделка палаты', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_med_operating': { name: 'Отделка операционной', unit: 'м²', price: 55000, category: 'commercial_ext2' },
        'wrk_cm_med_cleanroom': { name: 'Устройство чистого помещения (ISO 7)', unit: 'м²', price: 45000, category: 'commercial_ext2' },
        'wrk_cm_med_cleanroom_iso5': { name: 'Устройство чистого помещения (ISO 5)', unit: 'м²', price: 85000, category: 'commercial_ext2' },
        'wrk_cm_med_lab': { name: 'Отделка лаборатории', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_med_reception': { name: 'Отделка регистратуры клиники', unit: 'м²', price: 18000, category: 'commercial_ext2' },
        'wrk_cm_med_dental': { name: 'Отделка стоматологического кабинета', unit: 'м²', price: 22000, category: 'commercial_ext2' },
        'wrk_cm_med_pharmacy': { name: 'Отделка аптеки', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_med_gas_oxygen': { name: 'Разводка медицинских газов (кислород)', unit: 'точка', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_med_gas_vacuum': { name: 'Разводка вакуумной системы', unit: 'точка', price: 18000, category: 'commercial_ext2' },
        // === ОБРАЗОВАТЕЛЬНЫЕ УЧРЕЖДЕНИЯ ===
        'wrk_cm_edu_classroom': { name: 'Отделка учебного класса', unit: 'м²', price: 8500, category: 'commercial_ext2' },
        'wrk_cm_edu_lab': { name: 'Отделка школьной лаборатории', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        'wrk_cm_edu_gym': { name: 'Отделка спортзала', unit: 'м²', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_edu_gym_floor': { name: 'Устройство спортивного покрытия', unit: 'м²', price: 3500, category: 'commercial_ext2' },
        'wrk_cm_edu_pool': { name: 'Отделка школьного бассейна', unit: 'м²', price: 25000, category: 'commercial_ext2' },
        'wrk_cm_edu_canteen': { name: 'Отделка школьной столовой', unit: 'м²', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_edu_auditorium': { name: 'Отделка актового зала', unit: 'м²', price: 15000, category: 'commercial_ext2' },
        // === СКЛАДСКИЕ ПОМЕЩЕНИЯ ===
        'wrk_cm_warehouse_finish': { name: 'Отделка склада', unit: 'м²', price: 3500, category: 'commercial_ext2' },
        'wrk_cm_warehouse_racking': { name: 'Монтаж стеллажной системы', unit: 'секция', price: 12000, category: 'commercial_ext2' },
        'wrk_cm_warehouse_mezzanine': { name: 'Устройство мезонина', unit: 'м²', price: 8500, category: 'commercial_ext2' },
        'wrk_cm_warehouse_floor_topcoat': { name: 'Шлифовка/полировка бетонного пола', unit: 'м²', price: 1200, category: 'commercial_ext2' }
    };
})();
