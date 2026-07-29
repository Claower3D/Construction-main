// === МОДУЛЬНЫЕ ЗДАНИЯ ПОЛН — контейнеры, ангары, тенты, вахтовые городки (48 поз.) ===
(function () {
    window.AI_WRK_MODULAR2 = {
        // === БЛОК-КОНТЕЙНЕРЫ === 1-10
        'wrk_mod2_container_6m': { name: 'Блок-контейнер 6м (базовый)', unit: 'шт', price: 350000, category: 'modular2' },
        'wrk_mod2_container_6m_ins': { name: 'Блок-контейнер 6м утеплённый', unit: 'шт', price: 550000, category: 'modular2' },
        'wrk_mod2_container_6m_san': { name: 'Блок-контейнер 6м санитарный', unit: 'шт', price: 650000, category: 'modular2' },
        'wrk_mod2_container_6m_off': { name: 'Блок-контейнер 6м офисный', unit: 'шт', price: 550000, category: 'modular2' },
        'wrk_mod2_container_9m': { name: 'Блок-контейнер 9м', unit: 'шт', price: 550000, category: 'modular2' },
        'wrk_mod2_container_12m': { name: 'Блок-контейнер 12м', unit: 'шт', price: 850000, category: 'modular2' },
        'wrk_mod2_container_deliver': { name: 'Доставка блок-контейнера', unit: 'шт', price: 35000, category: 'modular2' },
        'wrk_mod2_container_install': { name: 'Установка блок-контейнера', unit: 'шт', price: 15000, category: 'modular2' },
        'wrk_mod2_container_connect': { name: 'Подключение сетей к контейнеру', unit: 'шт', price: 25000, category: 'modular2' },
        'wrk_mod2_container_stack': { name: '2-этажная конфигурация', unit: 'шт', price: 25000, category: 'modular2' },
        // === МОДУЛЬНЫЕ ЗДАНИЯ === 11-18
        'wrk_mod2_bld_office_50': { name: 'Модульный офис 50м²', unit: 'шт', price: 2500000, category: 'modular2' },
        'wrk_mod2_bld_office_100': { name: 'Модульный офис 100м²', unit: 'шт', price: 4500000, category: 'modular2' },
        'wrk_mod2_bld_dormitory': { name: 'Модульное общежитие (20 чел)', unit: 'шт', price: 5500000, category: 'modular2' },
        'wrk_mod2_bld_canteen': { name: 'Модульная столовая (50 чел)', unit: 'шт', price: 4500000, category: 'modular2' },
        'wrk_mod2_bld_medical': { name: 'Модульный медпункт', unit: 'шт', price: 3500000, category: 'modular2' },
        'wrk_mod2_bld_kpp': { name: 'Модульный КПП', unit: 'шт', price: 1500000, category: 'modular2' },
        'wrk_mod2_bld_lab': { name: 'Модульная лаборатория', unit: 'шт', price: 5500000, category: 'modular2' },
        'wrk_mod2_bld_warehouse': { name: 'Модульный склад 100м²', unit: 'шт', price: 2500000, category: 'modular2' },
        // === АНГАРЫ === 19-28
        'wrk_mod2_hangar_arch_300': { name: 'Арочный ангар 300м²', unit: 'шт', price: 1500000, category: 'modular2' },
        'wrk_mod2_hangar_arch_600': { name: 'Арочный ангар 600м²', unit: 'шт', price: 2500000, category: 'modular2' },
        'wrk_mod2_hangar_arch_1000': { name: 'Арочный ангар 1000м²', unit: 'шт', price: 3500000, category: 'modular2' },
        'wrk_mod2_hangar_frame_500': { name: 'Каркасный ангар 500м²', unit: 'шт', price: 3500000, category: 'modular2' },
        'wrk_mod2_hangar_frame_1000': { name: 'Каркасный ангар 1000м²', unit: 'шт', price: 5500000, category: 'modular2' },
        'wrk_mod2_hangar_frame_2000': { name: 'Каркасный ангар 2000м²', unit: 'шт', price: 8500000, category: 'modular2' },
        'wrk_mod2_hangar_sandwich_w': { name: 'Обшивка стен сэндвич-панелями', unit: 'м²', price: 2500, category: 'modular2' },
        'wrk_mod2_hangar_sandwich_r': { name: 'Обшивка кровли сэндвич-панелями', unit: 'м²', price: 3500, category: 'modular2' },
        'wrk_mod2_hangar_gate': { name: 'Ворота ангара', unit: 'шт', price: 120000, category: 'modular2' },
        'wrk_mod2_hangar_found': { name: 'Фундамент ангара', unit: 'м.п.', price: 5500, category: 'modular2' },
        // === ТЕНТЫ === 29-34
        'wrk_mod2_tent_200': { name: 'Тентовое укрытие 200м²', unit: 'шт', price: 550000, category: 'modular2' },
        'wrk_mod2_tent_500': { name: 'Тентовое укрытие 500м²', unit: 'шт', price: 1200000, category: 'modular2' },
        'wrk_mod2_tent_1000': { name: 'Тентовое укрытие 1000м²', unit: 'шт', price: 2500000, category: 'modular2' },
        'wrk_mod2_tent_event': { name: 'Шатёр для мероприятий', unit: 'м²', price: 1500, category: 'modular2' },
        'wrk_mod2_tent_warehouse': { name: 'Тентовый склад', unit: 'м²', price: 2500, category: 'modular2' },
        // === ВАХТОВЫЕ ГОРОДКИ === 35-42
        'wrk_mod2_camp_plan': { name: 'Проектирование вахтового городка', unit: 'компл.', price: 350000, category: 'modular2' },
        'wrk_mod2_camp_ground': { name: 'Подготовка площадки', unit: 'м²', price: 550, category: 'modular2' },
        'wrk_mod2_camp_found': { name: 'Фундаменты под модули', unit: 'шт', price: 12000, category: 'modular2' },
        'wrk_mod2_camp_roads': { name: 'Временные дороги', unit: 'м²', price: 550, category: 'modular2' },
        'wrk_mod2_camp_power': { name: 'Электроснабжение городка', unit: 'компл.', price: 350000, category: 'modular2' },
        'wrk_mod2_camp_water': { name: 'Водоснабжение городка', unit: 'компл.', price: 250000, category: 'modular2' },
        'wrk_mod2_camp_sewer': { name: 'Канализация городка', unit: 'компл.', price: 250000, category: 'modular2' },
        'wrk_mod2_camp_fire': { name: 'Пожарная безопасность', unit: 'компл.', price: 120000, category: 'modular2' },
        // === СБОРНО-РАЗБОРНЫЕ === 43-48
        'wrk_mod2_prefab_garage': { name: 'Сборный гараж', unit: 'шт', price: 120000, category: 'modular2' },
        'wrk_mod2_prefab_shed': { name: 'Хозблок (сборный)', unit: 'шт', price: 55000, category: 'modular2' },
        'wrk_mod2_prefab_kiosk': { name: 'Торговый киоск', unit: 'шт', price: 250000, category: 'modular2' },
        'wrk_mod2_prefab_pavilion': { name: 'Торговый павильон', unit: 'шт', price: 550000, category: 'modular2' },
        'wrk_mod2_prefab_carwash': { name: 'Модульная автомойка', unit: 'шт', price: 2500000, category: 'modular2' },
        'wrk_mod2_prefab_gasstation': { name: 'Модульная АЗС', unit: 'компл.', price: 5500000, category: 'modular2' }
    };
})();
