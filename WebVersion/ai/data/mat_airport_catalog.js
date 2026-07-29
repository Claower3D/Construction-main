// === АЭРОДРОМЫ — покрытия, светосигнальное, маркировка, метеооборудование (200 поз.) ===
(function () {
    window.AI_MAT_AIRPORT = {
        // === ПОКРЫТИЯ ===
        'mat_ap_concrete_vn': { name: 'Бетон аэродромный B35 F300 W8', unit: 'м³', price: 42000, category: 'airport' },
        'mat_ap_concrete_rv': { name: 'Бетон аэродромный B40 F400 W10', unit: 'м³', price: 48000, category: 'airport' },
        'mat_ap_asphalt_bn': { name: 'Асфальтобетон аэродромный БНД', unit: 'т', price: 12000, category: 'airport' },
        'mat_ap_asphalt_pma': { name: 'Асфальтобетон ПМА (полимерный)', unit: 'т', price: 18000, category: 'airport' },
        'mat_ap_slab_pag14': { name: 'Плита аэродромная ПАГ-14', unit: 'шт', price: 22000, category: 'airport' },
        'mat_ap_slab_pag18': { name: 'Плита аэродромная ПАГ-18', unit: 'шт', price: 28000, category: 'airport' },
        'mat_ap_slab_pag20': { name: 'Плита аэродромная ПАГ-20', unit: 'шт', price: 35000, category: 'airport' },
        'mat_ap_joint_sealant': { name: 'Герметик для швов ВПП (600мл)', unit: 'шт', price: 3500, category: 'airport' },
        'mat_ap_joint_filler': { name: 'Шнур уплотнительный для швов ВПП', unit: 'м.п.', price: 120, category: 'airport' },
        'mat_ap_dowel_bar': { name: 'Штырь-дюбель для плит ВПП Ø25', unit: 'шт', price: 350, category: 'airport' },
        // === СВЕТОСИГНАЛЬНОЕ ОБОРУДОВАНИЕ ===
        'mat_ap_light_approach': { name: 'Огонь приближения ALS (PAPI)', unit: 'шт', price: 450000, category: 'airport' },
        'mat_ap_light_threshold': { name: 'Огонь порога ВПП (зелёный)', unit: 'шт', price: 180000, category: 'airport' },
        'mat_ap_light_end': { name: 'Огонь конца ВПП (красный)', unit: 'шт', price: 180000, category: 'airport' },
        'mat_ap_light_edge_vpp': { name: 'Огонь кромки ВПП (белый)', unit: 'шт', price: 120000, category: 'airport' },
        'mat_ap_light_center_vpp': { name: 'Огонь осевой ВПП (врезной)', unit: 'шт', price: 250000, category: 'airport' },
        'mat_ap_light_taxiway': { name: 'Огонь рулёжной дорожки (синий)', unit: 'шт', price: 85000, category: 'airport' },
        'mat_ap_light_apron': { name: 'Прожектор перрона 400Вт', unit: 'шт', price: 65000, category: 'airport' },
        'mat_ap_light_apron_led': { name: 'Прожектор перрона LED 200Вт', unit: 'шт', price: 120000, category: 'airport' },
        'mat_ap_light_mast_15m': { name: 'Мачта освещения 15м (перрон)', unit: 'шт', price: 450000, category: 'airport' },
        'mat_ap_light_mast_25m': { name: 'Мачта освещения 25м (перрон)', unit: 'шт', price: 850000, category: 'airport' },
        'mat_ap_ccr_unit': { name: 'Регулятор яркости CCR 6.6A', unit: 'шт', price: 1500000, category: 'airport' },
        'mat_ap_isolation_transf': { name: 'Трансформатор изолирующий L-830', unit: 'шт', price: 85000, category: 'airport' },
        'mat_ap_cable_5kv': { name: 'Кабель аэродромный 5кВ 1×6', unit: 'м.п.', price: 450, category: 'airport' },
        'mat_ap_connector_plug': { name: 'Разъём аэродромный (штепсель)', unit: 'шт', price: 12000, category: 'airport' },
        // === МАРКИРОВКА ===
        'mat_ap_paint_white': { name: 'Краска для маркировки ВПП (белая, 25л)', unit: 'ведро', price: 35000, category: 'airport' },
        'mat_ap_paint_yellow': { name: 'Краска для маркировки РД (жёлтая, 25л)', unit: 'ведро', price: 35000, category: 'airport' },
        'mat_ap_paint_red': { name: 'Краска для маркировки (красная, 25л)', unit: 'ведро', price: 38000, category: 'airport' },
        'mat_ap_glass_beads': { name: 'Стеклошарики светоотражающие (25кг)', unit: 'мешок', price: 8500, category: 'airport' },
        'mat_ap_marker_retro': { name: 'Маркер ВПП светоотражающий', unit: 'шт', price: 3500, category: 'airport' },
        // === МЕТЕООБОРУДОВАНИЕ ===
        'mat_ap_anemometer': { name: 'Анемометр аэродромный', unit: 'шт', price: 250000, category: 'airport' },
        'mat_ap_rvr_system': { name: 'Система RVR (видимость на ВПП)', unit: 'комп.', price: 5500000, category: 'airport' },
        'mat_ap_meteo_station': { name: 'Метеостанция автоматическая', unit: 'шт', price: 3500000, category: 'airport' },
        'mat_ap_windsock': { name: 'Конус ветроуказателя (с подсветкой)', unit: 'шт', price: 85000, category: 'airport' },
        // === ОГРАЖДЕНИЕ ===
        'mat_ap_fence_2_4m': { name: 'Ограждение аэродрома H=2.4м', unit: 'м.п.', price: 8500, category: 'airport' },
        'mat_ap_fence_concertina': { name: 'Спираль Бруно (для забора)', unit: 'м.п.', price: 1200, category: 'airport' },
        'mat_ap_gate_auto_6m': { name: 'Ворота автоматические аэродромные 6м', unit: 'шт', price: 850000, category: 'airport' },
        'mat_ap_gate_sliding_12m': { name: 'Ворота откатные аэродромные 12м', unit: 'шт', price: 1500000, category: 'airport' }
    };
})();
