// === ТОННЕЛЬНЫЕ РАБОТЫ — щитовая проходка, НАТМ, микротоннелирование, обделка (50 поз.) ===
(function () {
    window.AI_WRK_TUNNELS = {
        // === ЩИТОВАЯ ПРОХОДКА === 1-10
        'wrk_tun_tbm_mobilize': { name: 'Мобилизация ТПМК', unit: 'компл.', price: 25000000, category: 'tunnels' },
        'wrk_tun_tbm_shaft_start': { name: 'Стартовая шахта', unit: 'шт', price: 5500000, category: 'tunnels' },
        'wrk_tun_tbm_shaft_finish': { name: 'Приёмная шахта', unit: 'шт', price: 3500000, category: 'tunnels' },
        'wrk_tun_tbm_segment_rc': { name: 'Тюбинг ж/б (обделка)', unit: 'кольцо', price: 250000, category: 'tunnels' },
        'wrk_tun_tbm_segment_steel': { name: 'Тюбинг чугунный/стальной', unit: 'кольцо', price: 550000, category: 'tunnels' },
        'wrk_tun_tbm_grout_annular': { name: 'Нагнетание за обделку', unit: 'кольцо', price: 8500, category: 'tunnels' },
        'wrk_tun_tbm_guidance': { name: 'Система навигации ТПМК', unit: 'компл.', price: 2500000, category: 'tunnels' },
        'wrk_tun_tbm_muck_removal': { name: 'Транспортировка грунта', unit: 'м³', price: 550, category: 'tunnels' },
        'wrk_tun_tbm_bentonite': { name: 'Бентонитовая суспензия (пригрузка)', unit: 'м³', price: 3500, category: 'tunnels' },
        'wrk_tun_tbm_foam': { name: 'Пенообразователь (кондиционирование)', unit: 'м³', price: 1500, category: 'tunnels' },
        // === НАТМ (горный способ) === 11-20
        'wrk_tun_natm_excavation': { name: 'Разработка забоя (НАТМ)', unit: 'м³', price: 5500, category: 'tunnels' },
        'wrk_tun_natm_shotcrete_50': { name: 'Набрызг-бетон 50мм', unit: 'м²', price: 1500, category: 'tunnels' },
        'wrk_tun_natm_shotcrete_100': { name: 'Набрызг-бетон 100мм', unit: 'м²', price: 2500, category: 'tunnels' },
        'wrk_tun_natm_shotcrete_150': { name: 'Набрызг-бетон 150мм', unit: 'м²', price: 3500, category: 'tunnels' },
        'wrk_tun_natm_lattice_girder': { name: 'Монтаж решётчатой арки', unit: 'шт', price: 25000, category: 'tunnels' },
        'wrk_tun_natm_steel_rib': { name: 'Монтаж стальной арки', unit: 'шт', price: 35000, category: 'tunnels' },
        'wrk_tun_natm_rock_bolt': { name: 'Анкерное крепление (SN-анкер)', unit: 'шт', price: 3500, category: 'tunnels' },
        'wrk_tun_natm_swellex': { name: 'Анкер Swellex', unit: 'шт', price: 5500, category: 'tunnels' },
        'wrk_tun_natm_mesh': { name: 'Армосетка (в набрызг-бетоне)', unit: 'м²', price: 350, category: 'tunnels' },
        // === МИКРОТОННЕЛИРОВАНИЕ === 21-26
        'wrk_tun_micro_d300': { name: 'Микротоннель Ø300мм', unit: 'м.п.', price: 25000, category: 'tunnels' },
        'wrk_tun_micro_d600': { name: 'Микротоннель Ø600мм', unit: 'м.п.', price: 55000, category: 'tunnels' },
        'wrk_tun_micro_d1200': { name: 'Микротоннель Ø1200мм', unit: 'м.п.', price: 120000, category: 'tunnels' },
        'wrk_tun_micro_d1800': { name: 'Микротоннель Ø1800мм', unit: 'м.п.', price: 250000, category: 'tunnels' },
        'wrk_tun_micro_shaft_sm': { name: 'Рабочий колодец (малый)', unit: 'шт', price: 250000, category: 'tunnels' },
        'wrk_tun_micro_shaft_lg': { name: 'Рабочий колодец (большой)', unit: 'шт', price: 550000, category: 'tunnels' },
        // === ОБДЕЛКА === 27-32
        'wrk_tun_lining_rc_300': { name: 'Монолитная обделка 300мм', unit: 'м.п.', price: 120000, category: 'tunnels' },
        'wrk_tun_lining_rc_500': { name: 'Монолитная обделка 500мм', unit: 'м.п.', price: 250000, category: 'tunnels' },
        'wrk_tun_lining_waterproof': { name: 'Гидроизоляция обделки (мембрана)', unit: 'м²', price: 1500, category: 'tunnels' },
        'wrk_tun_lining_waterproof_inject': { name: 'Инъекционная гидроизоляция', unit: 'м.п.', price: 3500, category: 'tunnels' },
        'wrk_tun_lining_drain': { name: 'Дренаж тоннеля', unit: 'м.п.', price: 2500, category: 'tunnels' },
        'wrk_tun_lining_invert': { name: 'Устройство лотка (инверта)', unit: 'м.п.', price: 25000, category: 'tunnels' },
        // === ВЕНТИЛЯЦИЯ ТОННЕЛЯ === 33-38
        'wrk_tun_vent_jet_fan': { name: 'Стрyйный вентилятор тоннельный', unit: 'шт', price: 250000, category: 'tunnels' },
        'wrk_tun_vent_shaft': { name: 'Вентиляционная шахта', unit: 'шт', price: 2500000, category: 'tunnels' },
        'wrk_tun_vent_duct_temp': { name: 'Временная вентиляция (строит.)', unit: 'м.п.', price: 1500, category: 'tunnels' },
        'wrk_tun_vent_co_sensor': { name: 'Датчик CO/NO₂ тоннельный', unit: 'шт', price: 25000, category: 'tunnels' },
        'wrk_tun_vent_visibility': { name: 'Датчик видимости тоннельный', unit: 'шт', price: 35000, category: 'tunnels' },
        'wrk_tun_vent_damper': { name: 'Клапан дымоудаления тоннельный', unit: 'шт', price: 55000, category: 'tunnels' },
        // === ИНЖЕНЕРНЫЕ СИСТЕМЫ === 39-44
        'wrk_tun_light_led': { name: 'Освещение тоннеля (LED)', unit: 'м.п.', price: 5500, category: 'tunnels' },
        'wrk_tun_fire_system': { name: 'Пожаротушение тоннеля', unit: 'м.п.', price: 3500, category: 'tunnels' },
        'wrk_tun_drainage_pump': { name: 'Насосная станция водоотлива', unit: 'компл.', price: 550000, category: 'tunnels' },
        'wrk_tun_scada': { name: 'АСУ ТП тоннеля', unit: 'компл.', price: 2500000, category: 'tunnels' },
        'wrk_tun_emergency_niche': { name: 'Аварийная ниша / камера', unit: 'шт', price: 550000, category: 'tunnels' },
        'wrk_tun_cable_tray': { name: 'Кабельные лотки тоннеля', unit: 'м.п.', price: 1500, category: 'tunnels' },
        // === МОНИТОРИНГ === 45-50
        'wrk_tun_monitor_convergence': { name: 'Мониторинг конвергенции', unit: 'сечение', price: 15000, category: 'tunnels' },
        'wrk_tun_monitor_settlement': { name: 'Мониторинг осадок поверхности', unit: 'точка', price: 5500, category: 'tunnels' },
        'wrk_tun_monitor_inclinometer': { name: 'Инклинометрический мониторинг', unit: 'скважина', price: 55000, category: 'tunnels' },
        'wrk_tun_monitor_piezometer': { name: 'Пьезометрический мониторинг', unit: 'скважина', price: 35000, category: 'tunnels' },
        'wrk_tun_monitor_extensometer': { name: 'Экстензометрический мониторинг', unit: 'точка', price: 25000, category: 'tunnels' },
        'wrk_tun_monitor_auto': { name: 'Автоматическая станция мониторинга', unit: 'компл.', price: 550000, category: 'tunnels' }
    };
})();
