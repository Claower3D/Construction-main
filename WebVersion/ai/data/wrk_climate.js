// === КЛИМАТИЧЕСКОЕ ОБОРУДОВАНИЕ РАСШИРЕННОЕ — VRF, фанкойлы, приточные, рекуператоры (55 поз.) ===
(function () {
    window.AI_WRK_CLIMATE = {
        // === СПЛИТ-СИСТЕМЫ === 1-10
        'wrk_clim_split_07': { name: 'Монтаж сплит-системы 2кВт (07)', unit: 'шт', price: 8500, category: 'climate' },
        'wrk_clim_split_09': { name: 'Монтаж сплит-системы 2.5кВт (09)', unit: 'шт', price: 8500, category: 'climate' },
        'wrk_clim_split_12': { name: 'Монтаж сплит-системы 3.5кВт (12)', unit: 'шт', price: 12000, category: 'climate' },
        'wrk_clim_split_18': { name: 'Монтаж сплит-системы 5кВт (18)', unit: 'шт', price: 15000, category: 'climate' },
        'wrk_clim_split_24': { name: 'Монтаж сплит-системы 7кВт (24)', unit: 'шт', price: 18000, category: 'climate' },
        'wrk_clim_split_36': { name: 'Монтаж сплит-системы 10кВт (36)', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_cassette_24': { name: 'Монтаж кассетного блока 7кВт', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_cassette_36': { name: 'Монтаж кассетного блока 10кВт', unit: 'шт', price: 35000, category: 'climate' },
        'wrk_clim_duct_24': { name: 'Монтаж канального блока 7кВт', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_duct_36': { name: 'Монтаж канального блока 10кВт', unit: 'шт', price: 35000, category: 'climate' },
        // === VRF === 11-20
        'wrk_clim_vrf_outdoor_28': { name: 'Монтаж VRF наружного блока 28кВт', unit: 'шт', price: 85000, category: 'climate' },
        'wrk_clim_vrf_outdoor_56': { name: 'Монтаж VRF наружного блока 56кВт', unit: 'шт', price: 120000, category: 'climate' },
        'wrk_clim_vrf_outdoor_84': { name: 'Монтаж VRF наружного блока 84кВт', unit: 'шт', price: 150000, category: 'climate' },
        'wrk_clim_vrf_outdoor_140': { name: 'Монтаж VRF наружного блока 140кВт', unit: 'шт', price: 250000, category: 'climate' },
        'wrk_clim_vrf_wall': { name: 'Монтаж VRF настенн. блока', unit: 'шт', price: 12000, category: 'climate' },
        'wrk_clim_vrf_cassette': { name: 'Монтаж VRF кассетн. блока', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_vrf_duct': { name: 'Монтаж VRF канальн. блока', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_vrf_floor_ceil': { name: 'Монтаж VRF напольно-потолочного', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_vrf_refnet': { name: 'Монтаж рефнета VRF', unit: 'шт', price: 3500, category: 'climate' },
        'wrk_clim_vrf_controller': { name: 'Монтаж центрального контроллера VRF', unit: 'шт', price: 55000, category: 'climate' },
        // === ФАНКОЙЛЫ === 21-26
        'wrk_clim_fcu_wall_2': { name: 'Монтаж фанкойла настенного 2кВт', unit: 'шт', price: 8500, category: 'climate' },
        'wrk_clim_fcu_cassette_3': { name: 'Монтаж фанкойла кассетного 3кВт', unit: 'шт', price: 15000, category: 'climate' },
        'wrk_clim_fcu_cassette_5': { name: 'Монтаж фанкойла кассетного 5кВт', unit: 'шт', price: 18000, category: 'climate' },
        'wrk_clim_fcu_duct_3': { name: 'Монтаж фанкойла канального 3кВт', unit: 'шт', price: 12000, category: 'climate' },
        'wrk_clim_fcu_duct_7': { name: 'Монтаж фанкойла канального 7кВт', unit: 'шт', price: 18000, category: 'climate' },
        'wrk_clim_fcu_floor': { name: 'Монтаж фанкойла напольного', unit: 'шт', price: 8500, category: 'climate' },
        // === ПРИТОЧНЫЕ / РЕКУПЕРАТОРЫ === 27-36
        'wrk_clim_ventunit_150': { name: 'Приточная установка 150 м³/ч', unit: 'шт', price: 15000, category: 'climate' },
        'wrk_clim_ventunit_300': { name: 'Приточная установка 300 м³/ч', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_ventunit_500': { name: 'Приточная установка 500 м³/ч', unit: 'шт', price: 35000, category: 'climate' },
        'wrk_clim_ventunit_1000': { name: 'Приточная установка 1000 м³/ч', unit: 'шт', price: 55000, category: 'climate' },
        'wrk_clim_recup_plate_300': { name: 'Рекуператор пластинчатый 300 м³/ч', unit: 'шт', price: 25000, category: 'climate' },
        'wrk_clim_recup_plate_500': { name: 'Рекуператор пластинчатый 500 м³/ч', unit: 'шт', price: 35000, category: 'climate' },
        'wrk_clim_recup_rotary_1000': { name: 'Рекуператор роторный 1000 м³/ч', unit: 'шт', price: 85000, category: 'climate' },
        'wrk_clim_recup_rotary_3000': { name: 'Рекуператор роторный 3000 м³/ч', unit: 'шт', price: 150000, category: 'climate' },
        'wrk_clim_breather_wall': { name: 'Монтаж бризера стенового', unit: 'шт', price: 8500, category: 'climate' },
        'wrk_clim_breather_window': { name: 'Монтаж оконного клапана', unit: 'шт', price: 3500, category: 'climate' },
        // === ТЕПЛОВЫЕ НАСОСЫ === 37-42
        'wrk_clim_hp_air_5': { name: 'Тепловой насос воздух-воздух 5кВт', unit: 'шт', price: 55000, category: 'climate' },
        'wrk_clim_hp_air_10': { name: 'Тепловой насос воздух-воздух 10кВт', unit: 'шт', price: 85000, category: 'climate' },
        'wrk_clim_hp_air_water_10': { name: 'Тепловой насос воздух-вода 10кВт', unit: 'шт', price: 120000, category: 'climate' },
        'wrk_clim_hp_air_water_20': { name: 'Тепловой насос воздух-вода 20кВт', unit: 'шт', price: 250000, category: 'climate' },
        'wrk_clim_hp_ground_10': { name: 'Тепловой насос грунт-вода 10кВт', unit: 'шт', price: 350000, category: 'climate' },
        'wrk_clim_hp_ground_20': { name: 'Тепловой насос грунт-вода 20кВт', unit: 'шт', price: 550000, category: 'climate' },
        // === ТРУБОПРОВОДЫ ФРЕОН === 43-48
        'wrk_clim_freon_6': { name: 'Медная трасса 6/12 (сплит)', unit: 'м.п.', price: 550, category: 'climate' },
        'wrk_clim_freon_6_16': { name: 'Медная трасса 6/16 (сплит)', unit: 'м.п.', price: 650, category: 'climate' },
        'wrk_clim_freon_10_16': { name: 'Медная трасса 10/16 (VRF)', unit: 'м.п.', price: 850, category: 'climate' },
        'wrk_clim_freon_12_22': { name: 'Медная трасса 12/22 (VRF)', unit: 'м.п.', price: 1200, category: 'climate' },
        'wrk_clim_freon_insul': { name: 'Теплоизоляция фреонового трубопровода', unit: 'м.п.', price: 150, category: 'climate' },
        'wrk_clim_drain': { name: 'Дренажный трубопровод (конденсат)', unit: 'м.п.', price: 250, category: 'climate' },
        // === ДОПЫ === 49-52
        'wrk_clim_pump_drain': { name: 'Монтаж помпы дренажной', unit: 'шт', price: 3500, category: 'climate' },
        'wrk_clim_vibro_mount': { name: 'Монтаж антивибрационной опоры', unit: 'шт', price: 1500, category: 'climate' },
        'wrk_clim_outdoor_frame': { name: 'Монтаж кронштейна наружного блока', unit: 'шт', price: 3500, category: 'climate' },
        'wrk_clim_commissioning': { name: 'ПНР системы кондиционирования', unit: 'компл.', price: 25000, category: 'climate' }
    };
})();
