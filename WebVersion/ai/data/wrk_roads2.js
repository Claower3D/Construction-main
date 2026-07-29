// === АВТОДОРОЖНОЕ СТРОИТЕЛЬСТВО ПОЛНОЕ — земполотно, основание, покрытие, знаки (50 поз.) ===
(function () {
    window.AI_WRK_ROADS2 = {
        // === ЗЕМЛЯНОЕ ПОЛОТНО === 1-8
        'wrk_rd2_clearing': { name: 'Расчистка полосы отвода', unit: 'м²', price: 55, category: 'roads2' },
        'wrk_rd2_topsoil_rem': { name: 'Снятие растительного слоя (200мм)', unit: 'м²', price: 55, category: 'roads2' },
        'wrk_rd2_compact': { name: 'Уплотнение грунта (виброкаток)', unit: 'м²', price: 55, category: 'roads2' },
        'wrk_rd2_drain_pipe': { name: 'Дренаж дорожный', unit: 'м.п.', price: 550, category: 'roads2' },
        // === ОСНОВАНИЕ === 9-16
        'wrk_rd2_sand_200': { name: 'Песчаный слой 200мм', unit: 'м²', price: 120, category: 'roads2' },
        'wrk_rd2_sand_300': { name: 'Песчаный слой 300мм', unit: 'м²', price: 180, category: 'roads2' },
        'wrk_rd2_lean_conc': { name: 'Тощий бетон (основание)', unit: 'м²', price: 550, category: 'roads2' },
        'wrk_rd2_cement_stab': { name: 'Цементостабилизация грунта', unit: 'м²', price: 250, category: 'roads2' },
        'wrk_rd2_bitumen_stab': { name: 'Обработка вяжущим (основание)', unit: 'м²', price: 350, category: 'roads2' },
        'wrk_rd2_prime': { name: 'Подгрунтовка (праймер)', unit: 'м²', price: 25, category: 'roads2' },
        // === ПОКРЫТИЕ АСФАЛЬТ === 17-24
        'wrk_rd2_asph_low_50': { name: 'Асфальт нижний 50мм', unit: 'м²', price: 350, category: 'roads2' },
        'wrk_rd2_asph_low_80': { name: 'Асфальт нижний 80мм', unit: 'м²', price: 550, category: 'roads2' },
        'wrk_rd2_asph_up_40': { name: 'Асфальт верхний 40мм', unit: 'м²', price: 350, category: 'roads2' },
        'wrk_rd2_asph_up_50': { name: 'Асфальт верхний 50мм', unit: 'м²', price: 450, category: 'roads2' },
        'wrk_rd2_tack': { name: 'Розлив вяжущего между слоями', unit: 'м²', price: 25, category: 'roads2' },
        // === БОРДЮРЫ / ВОДООТВОД === 25-32
        'wrk_rd2_curb_100': { name: 'Бордюр дорожный 100×30', unit: 'м.п.', price: 550, category: 'roads2' },
        'wrk_rd2_gutter_conc': { name: 'Лоток водоотводный (бетон)', unit: 'м.п.', price: 1200, category: 'roads2' },
        'wrk_rd2_gutter_poly': { name: 'Лоток полимерный с решёткой', unit: 'м.п.', price: 850, category: 'roads2' },
        'wrk_rd2_culvert': { name: 'Водопропускная труба (ж/б)', unit: 'м.п.', price: 8500, category: 'roads2' },
        'wrk_rd2_ditch': { name: 'Кювет (водоотвод. канава)', unit: 'м.п.', price: 250, category: 'roads2' },
        // === РАЗМЕТКА / ЗНАКИ === 33-40
        'wrk_rd2_mark_paint': { name: 'Разметка краской', unit: 'м²', price: 120, category: 'roads2' },
        'wrk_rd2_mark_thermo': { name: 'Разметка термопластик', unit: 'м²', price: 350, category: 'roads2' },
        'wrk_rd2_mark_cold': { name: 'Разметка холодный пластик', unit: 'м²', price: 550, category: 'roads2' },
        'wrk_rd2_sign_post': { name: 'Опора дорожного знака', unit: 'шт', price: 2500, category: 'roads2' },
        'wrk_rd2_barrier_w': { name: 'Барьерное ограждение (W-beam)', unit: 'м.п.', price: 1500, category: 'roads2' },
        'wrk_rd2_barrier_nj': { name: 'Барьер «Нью-Джерси» (бетон)', unit: 'м.п.', price: 3500, category: 'roads2' },
        // === ТРОТУАРЫ === 41-46
        'wrk_rd2_sidewalk_conc': { name: 'Тротуар бетонный', unit: 'м²', price: 850, category: 'roads2' },
        'wrk_rd2_sidewalk_paver': { name: 'Тротуарная плитка', unit: 'м²', price: 1500, category: 'roads2' },
        'wrk_rd2_sidewalk_gran': { name: 'Гранитная плитка', unit: 'м²', price: 3500, category: 'roads2' },
        'wrk_rd2_ramp': { name: 'Понижение бордюра (доступная среда)', unit: 'шт', price: 3500, category: 'roads2' },
        'wrk_rd2_tactile': { name: 'Тактильная плитка', unit: 'м²', price: 850, category: 'roads2' },
        'wrk_rd2_bike': { name: 'Велодорожка', unit: 'м²', price: 1200, category: 'roads2' },
        // === РЕМОНТ === 47-50
        'wrk_rd2_patch': { name: 'Ямочный ремонт (горячий)', unit: 'м²', price: 850, category: 'roads2' },
        'wrk_rd2_crack_seal': { name: 'Заливка трещин (битум)', unit: 'м.п.', price: 55, category: 'roads2' },
        'wrk_rd2_slurry': { name: 'Защитный слой (слаккосил)', unit: 'м²', price: 120, category: 'roads2' }
    };
})();
