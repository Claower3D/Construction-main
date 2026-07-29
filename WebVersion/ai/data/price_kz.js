// =====================================================
// АКТУАЛЬНЫЕ ЦЕНЫ КЗ — Алматы/Астана 2024-2025 г.
// Применяет правильные рыночные цены ко всем AI_WRK_*, AI_MAT_*, AI_EQ_*
// Источник: рынок РК, порталы hh.kz, olx.kz, smetakz.kz
// =====================================================
(function () {
    'use strict';

    // Точные цены по паттернам имени (₸/ед) — приоритет 1
    const PRICE_PATTERNS = [
        // === ШТУКАТУРКА / ШПАКЛЁВКА ===
        { match: /штукатурка.*механизир/i, unit: 'м²', price: 1800 },
        { match: /штукатурка.*маяк|оштукатурив/i, unit: 'м²', price: 2200 },
        { match: /декоративная штукатурка/i, unit: 'м²', price: 5000 },
        { match: /венецианская штукатурка/i, unit: 'м²', price: 8000 },
        { match: /штукатурка/i, unit: 'м²', price: 2000 },
        { match: /финишн.*шпаклёвк|финишн.*шпатлёвк/i, unit: 'м²', price: 1200 },
        { match: /шпаклёвк|шпатлёвк/i, unit: 'м²', price: 1500 },
        { match: /шлифовка/i, unit: 'м²', price: 800 },

        // === ПОКРАСКА ===
        { match: /покраска.*2\s*слой/i, unit: 'м²', price: 1200 },
        { match: /покраска|окраска/i, unit: 'м²', price: 900 },
        { match: /грунтовк/i, unit: 'м²', price: 300 },

        // === ОБОИ ===
        { match: /поклейка.*флизелин/i, unit: 'м²', price: 1200 },
        { match: /поклейка.*обоев|поклеивание обоев/i, unit: 'м²', price: 1000 },
        { match: /жидкие обои/i, unit: 'м²', price: 1500 },

        // === ПЛИТКА / КЕРАМОГРАНИТ ===
        { match: /укладка.*120[xх×]260|укладка крупноформат/i, unit: 'м²', price: 8000 },
        { match: /укладка.*120[xх×]120/i, unit: 'м²', price: 6500 },
        { match: /укладка.*60[xх×]120/i, unit: 'м²', price: 5500 },
        { match: /укладка.*60[xх×]60/i, unit: 'м²', price: 4500 },
        { match: /укладка мозаик.*панн/i, unit: 'м²', price: 12000 },
        { match: /укладка мозаик/i, unit: 'м²', price: 7000 },
        { match: /укладка мрамора/i, unit: 'м²', price: 9000 },
        { match: /укладка гранита/i, unit: 'м²', price: 8000 },
        { match: /укладка оникса/i, unit: 'м²', price: 15000 },
        { match: /укладка.*ёлочк/i, unit: 'м²', price: 5000 },
        { match: /укладка.*диагонал/i, unit: 'м²', price: 4500 },
        { match: /укладка плитки|клейка плитк/i, unit: 'м²', price: 3500 },
        { match: /укладка керамогранит/i, unit: 'м²', price: 4000 },
        { match: /затирка.*эпоксид/i, unit: 'м²', price: 1200 },
        { match: /затирка швов/i, unit: 'м²', price: 500 },
        { match: /укладка трот.*плитки.*фигур/i, unit: 'м²', price: 2500 },
        { match: /укладка трот.*плитки/i, unit: 'м²', price: 2000 },
        { match: /укладка брусчатки/i, unit: 'м²', price: 4000 },

        // === НАПОЛЬНЫЕ ПОКРЫТИЯ ===
        { match: /укладка.*паркет.*художеств/i, unit: 'м²', price: 10000 },
        { match: /укладка.*«версаль»/i, unit: 'м²', price: 7000 },
        { match: /укладка.*паркет.*ёлочк/i, unit: 'м²', price: 5000 },
        { match: /штучный паркет/i, unit: 'м²', price: 5000 },
        { match: /укладка паркетной доски.*клеев/i, unit: 'м²', price: 2500 },
        { match: /укладка паркетной доски/i, unit: 'м²', price: 2000 },
        { match: /укладка массивной доски/i, unit: 'м²', price: 3000 },
        { match: /укладка ламината.*34кл|ламинат.*коммерч/i, unit: 'м²', price: 2000 },
        { match: /укладка ламината.*33кл|ламинат.*премиум/i, unit: 'м²', price: 1800 },
        { match: /укладка ламината/i, unit: 'м²', price: 1200 },
        { match: /эпоксидный.*3D-пол/i, unit: 'м²', price: 15000 },
        { match: /эпоксидный.*наливной/i, unit: 'м²', price: 5000 },
        { match: /наливной пол|самовыравнив/i, unit: 'м²', price: 2000 },
        { match: /стяжка пола|цементно-песч.*стяжка/i, unit: 'м²', price: 2000 },
        { match: /укладка ковролин/i, unit: 'м²', price: 700 },
        { match: /укладка линолеума/i, unit: 'м²', price: 600 },
        { match: /укладка SPC|укладка LVT|кварц-винил/i, unit: 'м²', price: 1200 },
        { match: /террасная доска|настил.*террас/i, unit: 'м²', price: 3000 },
        { match: /укладка пробков/i, unit: 'м²', price: 2000 },
        { match: /установка плинтуса|монтаж плинтуса/i, unit: 'м.п.', price: 400 },

        // === ГИПСОКАРТОН ===
        { match: /монтаж каркаса.*ГКЛ|каркас.*перегородк/i, unit: 'м²', price: 1500 },
        { match: /обшивка.*ГКЛ|гипсокартон/i, unit: 'м²', price: 2500 },
        { match: /перегородки.*монтаж/i, unit: 'м²', price: 3500 },
        { match: /натяжной потолок/i, unit: 'м²', price: 2500 },
        { match: /подвесной потолок|армстронг/i, unit: 'м²', price: 2000 },
        { match: /реечный потолок|кассетный потолок/i, unit: 'м²', price: 2500 },

        // === ОТОПЛЕНИЕ ===
        { match: /монтаж.*биметалл.*радиатор/i, unit: 'шт', price: 7000 },
        { match: /монтаж.*алюминиев.*радиатор/i, unit: 'шт', price: 6000 },
        { match: /монтаж.*стального радиатор/i, unit: 'шт', price: 6500 },
        { match: /монтаж.*чугунного радиатора/i, unit: 'шт', price: 9000 },
        { match: /монтаж.*дизайн-радиатора/i, unit: 'шт', price: 12000 },
        { match: /монтаж.*конденсационного котла/i, unit: 'шт', price: 40000 },
        { match: /монтаж.*напольного газового котла/i, unit: 'шт', price: 45000 },
        { match: /монтаж.*настенного газового котла/i, unit: 'шт', price: 28000 },
        { match: /монтаж.*электрического котла/i, unit: 'шт', price: 18000 },
        { match: /монтаж.*твердотопл.*котла/i, unit: 'шт', price: 30000 },
        { match: /монтаж.*пеллетного котла/i, unit: 'шт', price: 40000 },
        { match: /монтаж теплового насоса.*грунт/i, unit: 'шт', price: 200000 },
        { match: /монтаж теплового насоса/i, unit: 'шт', price: 100000 },
        { match: /труба отопления PPR|труба PEX.*Ø16|труба.*отоп.*Ø(16|20)/i, unit: 'м.п.', price: 350 },
        { match: /труба.*отоп.*Ø(25|32)/i, unit: 'м.п.', price: 450 },
        { match: /труба медная.*Ø15/i, unit: 'м.п.', price: 800 },
        { match: /труба медная/i, unit: 'м.п.', price: 1000 },
        { match: /труба стальная/i, unit: 'м.п.', price: 600 },
        { match: /монтаж бойлера накопит/i, unit: 'шт', price: 12000 },
        { match: /монтаж бойлера косв/i, unit: 'шт', price: 18000 },
        { match: /монтаж коллектора ТП/i, unit: 'шт', price: 15000 },
        { match: /укладка трубы тёплого пола/i, unit: 'м.п.', price: 200 },
        { match: /укладка кабельного мата|тёплый пол.*мат/i, unit: 'м²', price: 1500 },
        { match: /укладка ИК-плёнки/i, unit: 'м²', price: 1200 },
        { match: /дымоход.*кирпич/i, unit: 'м.п.', price: 12000 },
        { match: /дымоход.*сэндвич/i, unit: 'м.п.', price: 4000 },
        { match: /дымоход керамический/i, unit: 'м.п.', price: 8000 },
        { match: /гильзование дымохода/i, unit: 'м.п.', price: 5000 },
        { match: /установка радиатора|монтаж радиатора/i, unit: 'шт', price: 7000 },
        { match: /промывка радиатора/i, unit: 'шт', price: 2500 },
        { match: /монтаж полотенцесушителя.*водяной/i, unit: 'шт', price: 6000 },
        { match: /монтаж полотенцесушителя/i, unit: 'шт', price: 4500 },
        { match: /кран шаровый Ø15/i, unit: 'шт', price: 400 },
        { match: /кран шаровый Ø20/i, unit: 'шт', price: 500 },
        { match: /кран шаровый Ø25/i, unit: 'шт', price: 700 },
        { match: /кран шаровый Ø32/i, unit: 'шт', price: 1000 },
        { match: /монтаж циркуляц.*насоса/i, unit: 'шт', price: 7000 },
        { match: /монтаж расширительного бака/i, unit: 'шт', price: 3000 },
        { match: /пусконаладка отопления.*дом/i, unit: 'шт', price: 30000 },
        { match: /пусконаладка отопления/i, unit: 'шт', price: 18000 },
        { match: /опрессовка системы отопления/i, unit: 'шт', price: 12000 },
        { match: /облицовка камина плиткой/i, unit: 'м²', price: 8000 },
        { match: /кладка печи/i, unit: 'шт', price: 35000 },
        { match: /установка печи-камина/i, unit: 'шт', price: 18000 },

        // === САНТЕХНИКА ===
        { match: /установка унитаза/i, unit: 'шт', price: 8000 },
        { match: /установка ванны/i, unit: 'шт', price: 12000 },
        { match: /установка душевой кабин/i, unit: 'шт', price: 15000 },
        { match: /установка умывальника|раковина/i, unit: 'шт', price: 6000 },
        { match: /установка смесителя/i, unit: 'шт', price: 3500 },
        { match: /прокладка труб.*водоснабж|труба.*ХВС|труба.*ГВС/i, unit: 'м.п.', price: 500 },
        { match: /прокладка труб.*канализ/i, unit: 'м.п.', price: 600 },
        { match: /установка счётчика воды/i, unit: 'шт', price: 4000 },
        { match: /установка насосной станции/i, unit: 'шт', price: 20000 },
        { match: /монтаж септика/i, unit: 'шт', price: 50000 },

        // === ЭЛЕКТРИКА ===
        { match: /прокладка кабел.*Ø|прокладка кабеля/i, unit: 'м.п.', price: 400 },
        { match: /монтаж кабель-канала/i, unit: 'м.п.', price: 250 },
        { match: /монтаж гофры/i, unit: 'м.п.', price: 200 },
        { match: /штробление/i, unit: 'м.п.', price: 1500 },
        { match: /установка розетки/i, unit: 'шт', price: 1500 },
        { match: /установка выключателя/i, unit: 'шт', price: 1200 },
        { match: /монтаж щита|сборка щита/i, unit: 'шт', price: 20000 },
        { match: /установка автоматического выключателя/i, unit: 'шт', price: 800 },
        { match: /монтаж светильника/i, unit: 'шт', price: 2000 },
        { match: /монтаж люстры/i, unit: 'шт', price: 3500 },
        { match: /монтаж LED-ленты/i, unit: 'м.п.', price: 1000 },

        // === ОКНА ===
        { match: /установка ПВХ окна трёхстворч/i, unit: 'шт', price: 10000 },
        { match: /установка ПВХ окна двустворч/i, unit: 'шт', price: 8000 },
        { match: /установка ПВХ окна одностворч/i, unit: 'шт', price: 6000 },
        { match: /установка балконного блока/i, unit: 'шт', price: 12000 },
        { match: /установка панорамного окна/i, unit: 'м²', price: 8000 },
        { match: /установка деревянного евроокна/i, unit: 'шт', price: 14000 },
        { match: /установка алюминиевого окна/i, unit: 'шт', price: 12000 },
        { match: /установка подоконника/i, unit: 'м.п.', price: 1500 },
        { match: /откосы.*ПВХ|откосы из ГКЛ/i, unit: 'м.п.', price: 1200 },
        { match: /установка отлива/i, unit: 'м.п.', price: 600 },

        // === ДВЕРИ ===
        { match: /установка скрытой двери/i, unit: 'шт', price: 18000 },
        { match: /установка кассетной двери/i, unit: 'шт', price: 16000 },
        { match: /установка раздвижной двери/i, unit: 'шт', price: 12000 },
        { match: /установка стеклянной двери/i, unit: 'шт', price: 14000 },
        { match: /установка.*двустворчатой двери/i, unit: 'шт', price: 12000 },
        { match: /установка.*входной.*премиум/i, unit: 'шт', price: 18000 },
        { match: /установка.*входной стальной/i, unit: 'шт', price: 12000 },
        { match: /установка.*противопожарной двери/i, unit: 'шт', price: 15000 },
        { match: /установка.*межкомнатной двери/i, unit: 'шт', price: 8000 },
        { match: /установка секционных ворот/i, unit: 'шт', price: 25000 },
        { match: /установка роллетных ворот/i, unit: 'шт', price: 20000 },
        { match: /установка.*распашных ворот/i, unit: 'шт', price: 18000 },
        { match: /установка автоматики ворот/i, unit: 'шт', price: 20000 },
        { match: /установка калитки/i, unit: 'шт', price: 12000 },

        // === ФАСАД / САЙДИНГ ===
        { match: /монтаж фиброцементн.*сайдинга/i, unit: 'м²', price: 2200 },
        { match: /монтаж металлическ.*сайдинга/i, unit: 'м²', price: 1800 },
        { match: /монтаж виниловог.*сайдинга/i, unit: 'м²', price: 1500 },
        { match: /монтаж.*HPL-панел/i, unit: 'м²', price: 3500 },
        { match: /монтаж алюкобонда/i, unit: 'м²', price: 4000 },
        { match: /монтаж термопанелей/i, unit: 'м²', price: 2500 },
        { match: /утепление фасада/i, unit: 'м²', price: 2000 },
        { match: /облицовка цоколя натурал/i, unit: 'м²', price: 8000 },
        { match: /облицовка цоколя искусств/i, unit: 'м²', price: 4000 },
        { match: /монтаж вентилируемого фасада/i, unit: 'м²', price: 5000 },

        // === КРОВЛЯ ===
        { match: /монтаж металлочерепицы/i, unit: 'м²', price: 1800 },
        { match: /монтаж профнастила/i, unit: 'м²', price: 1400 },
        { match: /гибкая черепица|битумная черепица/i, unit: 'м²', price: 2500 },
        { match: /фальцевая кровля/i, unit: 'м²', price: 3500 },
        { match: /ПВХ мембрана|ТПО мембрана/i, unit: 'м²', price: 2200 },
        { match: /наплавляемая кровля|рубероид/i, unit: 'м²', price: 1500 },
        { match: /монтаж стропил/i, unit: 'м.п.', price: 1500 },
        { match: /монтаж мауэрлата/i, unit: 'м.п.', price: 2000 },
        { match: /монтаж водосток/i, unit: 'м.п.', price: 800 },
        { match: /монтаж снегозадержателей/i, unit: 'м.п.', price: 600 },

        // === ЛЕСТНИЦЫ ===
        { match: /деревянная лестница.*прямая/i, unit: 'шт', price: 180000 },
        { match: /деревянная лестница.*Г-образная/i, unit: 'шт', price: 250000 },
        { match: /деревянная лестница.*П-образная/i, unit: 'шт', price: 320000 },
        { match: /деревянная лестница.*винтовая/i, unit: 'шт', price: 350000 },
        { match: /металлическая лестница.*прямая/i, unit: 'шт', price: 150000 },
        { match: /металлическая лестница/i, unit: 'шт', price: 250000 },
        { match: /бетонная монолитная лестница/i, unit: 'шт', price: 350000 },
        { match: /облицовка лестницы/i, unit: 'ступень', price: 8000 },
        { match: /монтаж перил/i, unit: 'м.п.', price: 3500 },

        // === КЛАДКА ===
        { match: /кладка.*кирпич/i, unit: 'м²', price: 10000 },
        { match: /кладка.*газобетон|газоблок/i, unit: 'м²', price: 6000 },
        { match: /кладка.*пеноблок/i, unit: 'м²', price: 5500 },

        // === БЕТОН / ФУНДАМЕНТ ===
        { match: /бетонирование.*фундамент|заливка фундамент/i, unit: 'м³', price: 15000 },
        { match: /стяжки пола|бетон.*стяжка/i, unit: 'м²', price: 1800 },
        { match: /вязка арматур/i, unit: 'т', price: 80000 },
        { match: /монтаж опалубки/i, unit: 'м²', price: 3000 },

        // === ЗЕМЛЯНЫЕ РАБОТЫ ===
        { match: /разработка грунта.*экскаватор/i, unit: 'м³', price: 1500 },
        { match: /разработка грунта.*вручную/i, unit: 'м³', price: 8000 },
        { match: /укладка трот.*плитки/i, unit: 'м²', price: 2500 },

        // === ГАЗ ===
        { match: /газопровод стальной Ø15/i, unit: 'м.п.', price: 1500 },
        { match: /газопровод стальной Ø20/i, unit: 'м.п.', price: 1800 },
        { match: /газопровод стальной Ø25/i, unit: 'м.п.', price: 2200 },
        { match: /газопровод стальной Ø32/i, unit: 'м.п.', price: 2800 },
        { match: /газопровод ПЭ Ø32/i, unit: 'м.п.', price: 1200 },
        { match: /газопровод ПЭ Ø63/i, unit: 'м.п.', price: 2000 },
        { match: /газопровод гофра/i, unit: 'м.п.', price: 1200 },
        { match: /монтаж газового счётчика/i, unit: 'шт', price: 8000 },
        { match: /замена газового счётчика/i, unit: 'шт', price: 12000 },
        { match: /подключение газового котла/i, unit: 'шт', price: 25000 },
        { match: /подключение газового духового/i, unit: 'шт', price: 8000 },
        { match: /кран шаровый газовый Ø15/i, unit: 'шт', price: 800 },
        { match: /кран шаровый газовый Ø20/i, unit: 'шт', price: 1000 },
        { match: /кран шаровый газовый Ø25/i, unit: 'шт', price: 1400 },
        { match: /электромагнитный газовый клапан/i, unit: 'шт', price: 5000 },
        { match: /проект газоснабжения.*дом/i, unit: 'объект', price: 120000 },
        { match: /проект газоснабжения.*квартир/i, unit: 'объект', price: 60000 },
        { match: /согласование газоснабжения/i, unit: 'объект', price: 80000 },
        { match: /коаксиальный дымоход/i, unit: 'компл.', price: 15000 },

        // === ВЕНТИЛЯЦИЯ ===
        { match: /монтаж кондиционера/i, unit: 'шт', price: 25000 },
        { match: /монтаж воздуховода/i, unit: 'м.п.', price: 2000 },
        { match: /монтаж приточно-вытяжной/i, unit: 'шт', price: 50000 },
        { match: /монтаж рекуператора/i, unit: 'шт', price: 25000 },

        // === БАЛКОН ===
        { match: /утепление стен балкона.*100мм/i, unit: 'м²', price: 2000 },
        { match: /утепление стен балкона/i, unit: 'м²', price: 1500 },
        { match: /утепление пола балкона/i, unit: 'м²', price: 1500 },
        { match: /утепление PIR/i, unit: 'м²', price: 2500 },
        { match: /обшивка.*ПВХ вагонкой/i, unit: 'м²', price: 1500 },
        { match: /обшивка.*деревянной вагонкой/i, unit: 'м²', price: 2200 },
        { match: /обшивка.*МДФ панелями/i, unit: 'м²', price: 1800 },
        { match: /обшивка.*ГКЛВ/i, unit: 'м²', price: 2500 },
        { match: /штукатурка стен балкона/i, unit: 'м²', price: 2000 },
        { match: /стяжка пола балкона/i, unit: 'м²', price: 2000 },
        { match: /ламинат на балконе/i, unit: 'м²', price: 1200 },
        { match: /плитка на балконе/i, unit: 'м²', price: 3000 },
        { match: /вынос балкона по этаж/i, unit: 'м.п.', price: 20000 },
        { match: /вынос балкона по полу/i, unit: 'м.п.', price: 18000 },
        { match: /вынос балкона/i, unit: 'м.п.', price: 12000 },
        { match: /сварка каркаса расширения/i, unit: 'м.п.', price: 4000 },
        { match: /кладка парапета балкона/i, unit: 'м²', price: 5000 },
    ];

    // Коэффициенты по категориям (если нет точного паттерна)
    const CAT_COEFF = {
        heating: 4.5, plumbing: 4.0, electrical: 4.5,
        roofing: 5.0, facade: 4.5, windows: 4.5,
        doors: 4.5, stairs: 6.0, flooring: 5.0,
        ceiling: 5.0, painting: 4.5, tiling: 5.0,
        masonry: 5.0, concrete: 4.5, earthwork: 5.0,
        demolition: 4.0, hvac: 4.5, insulation: 5.0,
        waterproof: 5.0, drywall: 5.0, metalwork: 5.0,
        foundation: 5.0, design: 5.0, landscape: 5.0,
        automation: 5.0, gas: 5.0, fire: 5.0,
        balcony: 5.0, balcony_finish: 5.0,
    };

    function applyPrices() {
        let total = 0, byPattern = 0, byCoeff = 0;
        const prefixes = ['AI_WRK_', 'AI_WORK_', 'AI_MAT_', 'AI_EQ_'];

        for (const key of Object.keys(window)) {
            if (!prefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object') continue;

            const isEquipment = key.startsWith('AI_EQ_');
            const isMaterial = key.startsWith('AI_MAT_');

            for (const [, item] of Object.entries(catalog)) {
                if (!item || !item.name || !item.price) continue;
                total++;

                // Паттерн (работает для всех типов)
                let matched = false;
                for (const p of PRICE_PATTERNS) {
                    if (!p.match.test(item.name)) continue;
                    const unitOk = !p.unit || p.unit === item.unit ||
                        (p.unit === 'м.п.' && (item.unit === 'м' || item.unit === 'пм'));
                    if (unitOk) {
                        item.price = p.price;
                        byPattern++;
                        matched = true;
                        break;
                    }
                }
                if (matched) continue;

                // Категорийный коэффициент
                const cat = (item.category || '').toLowerCase();
                let coeff;
                if (isEquipment) {
                    // Техника: коэффициент аренды/смены
                    coeff = CAT_COEFF[cat] || 5.0;
                } else if (isMaterial) {
                    // Материалы: рыночная поправка
                    coeff = CAT_COEFF[cat] || 4.5;
                } else {
                    coeff = CAT_COEFF[cat] || 4.5;
                }
                item.price = Math.round(item.price * coeff / 100) * 100;
                byCoeff++;
            }
        }
        console.log(`[PriceKZ] ✅ ${total} поз. | по паттернам: ${byPattern} | по коэффициенту: ${byCoeff}`);
    }

    window.PriceKZ = { applyPrices };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(applyPrices, 50));
    } else {
        setTimeout(applyPrices, 50);
    }
})();
