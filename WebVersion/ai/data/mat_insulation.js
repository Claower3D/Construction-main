// === УТЕПЛИТЕЛИ И ТЕПЛОИЗОЛЯЦИЯ (60 позиций) ===
(function () {
    window.AI_MAT_INSULATION = {
        // Минеральная вата (плиты)
        'minvata_50_light': { name: 'Мин.вата ЛАЙТ 50мм (пл. 35кг/м³)', unit: 'м²', price: 350, category: 'insulation' },
        'minvata_100_light': { name: 'Мин.вата ЛАЙТ 100мм (пл. 35кг/м³)', unit: 'м²', price: 650, category: 'insulation' },
        'minvata_50_universal': { name: 'Мин.вата универсальная 50мм (пл. 50кг/м³)', unit: 'м²', price: 420, category: 'insulation' },
        'minvata_100_universal': { name: 'Мин.вата универсальная 100мм (пл. 50кг/м³)', unit: 'м²', price: 780, category: 'insulation' },
        'minvata_150_universal': { name: 'Мин.вата универсальная 150мм', unit: 'м²', price: 1100, category: 'insulation' },
        'minvata_200_universal': { name: 'Мин.вата универсальная 200мм', unit: 'м²', price: 1450, category: 'insulation' },
        'minvata_50_facade': { name: 'Мин.вата фасадная 50мм (пл. 135кг/м³)', unit: 'м²', price: 700, category: 'insulation' },
        'minvata_100_facade': { name: 'Мин.вата фасадная 100мм (пл. 135кг/м³)', unit: 'м²', price: 1300, category: 'insulation' },
        'minvata_150_facade': { name: 'Мин.вата фасадная 150мм (пл. 135кг/м³)', unit: 'м²', price: 1900, category: 'insulation' },
        'minvata_50_floor': { name: 'Мин.вата для пола 50мм (пл. 100кг/м³)', unit: 'м²', price: 550, category: 'insulation' },
        'minvata_100_floor': { name: 'Мин.вата для пола 100мм (пл. 100кг/м³)', unit: 'м²', price: 1000, category: 'insulation' },

        // Базальтовая изоляция (в рулонах)
        'basalt_roll_50': { name: 'Базальтовая вата рулон 50мм', unit: 'м²', price: 280, category: 'insulation' },
        'basalt_roll_100': { name: 'Базальтовая вата рулон 100мм', unit: 'м²', price: 500, category: 'insulation' },

        // Стекловата
        'glasswool_50': { name: 'Стекловата 50мм (рулон)', unit: 'м²', price: 200, category: 'insulation' },
        'glasswool_100': { name: 'Стекловата 100мм (рулон)', unit: 'м²', price: 380, category: 'insulation' },
        'glasswool_150': { name: 'Стекловата 150мм (рулон)', unit: 'м²', price: 550, category: 'insulation' },

        // Экструдированный пенополистирол (XPS)
        'xps_20': { name: 'XPS Пеноплекс 20мм', unit: 'м²', price: 280, category: 'insulation' },
        'xps_30': { name: 'XPS Пеноплекс 30мм', unit: 'м²', price: 380, category: 'insulation' },
        'xps_50': { name: 'XPS Пеноплекс 50мм', unit: 'м²', price: 550, category: 'insulation' },
        'xps_80': { name: 'XPS Пеноплекс 80мм', unit: 'м²', price: 850, category: 'insulation' },
        'xps_100': { name: 'XPS Пеноплекс 100мм', unit: 'м²', price: 1050, category: 'insulation' },
        'xps_150': { name: 'XPS Пеноплекс 150мм', unit: 'м²', price: 1500, category: 'insulation' },

        // Пенопласт (ПСБ-С)
        'psb_s_25_50': { name: 'Пенопласт ПСБ-С 25 50мм', unit: 'м²', price: 180, category: 'insulation' },
        'psb_s_25_100': { name: 'Пенопласт ПСБ-С 25 100мм', unit: 'м²', price: 350, category: 'insulation' },
        'psb_s_35_50': { name: 'Пенопласт ПСБ-С 35 50мм', unit: 'м²', price: 250, category: 'insulation' },
        'psb_s_35_100': { name: 'Пенопласт ПСБ-С 35 100мм', unit: 'м²', price: 480, category: 'insulation' },

        // PIR плиты
        'pir_30': { name: 'PIR плита 30мм (фольга)', unit: 'м²', price: 600, category: 'insulation' },
        'pir_50': { name: 'PIR плита 50мм (фольга)', unit: 'м²', price: 900, category: 'insulation' },
        'pir_80': { name: 'PIR плита 80мм (фольга)', unit: 'м²', price: 1350, category: 'insulation' },
        'pir_100': { name: 'PIR плита 100мм (фольга)', unit: 'м²', price: 1600, category: 'insulation' },

        // Пенофол (отражающая изоляция)
        'penofol_3': { name: 'Пенофол 3мм (фольга 1 сторона)', unit: 'м²', price: 100, category: 'insulation' },
        'penofol_5': { name: 'Пенофол 5мм (фольга 1 сторона)', unit: 'м²', price: 150, category: 'insulation' },
        'penofol_10': { name: 'Пенофол 10мм (фольга 1 сторона)', unit: 'м²', price: 250, category: 'insulation' },
        'penofol_5_2side': { name: 'Пенофол 5мм (фольга 2 стороны)', unit: 'м²', price: 200, category: 'insulation' },
        'penofol_10_2side': { name: 'Пенофол 10мм (фольга 2 стороны)', unit: 'м²', price: 350, category: 'insulation' },

        // Эковата
        'ecowool_loose': { name: 'Эковата (насыпная, мешок 15кг)', unit: 'мешок', price: 2200, category: 'insulation' },

        // Пеноизол (жидкий утеплитель)
        'penoizol': { name: 'Пеноизол (заливной утеплитель)', unit: 'м³', price: 3500, category: 'insulation' },

        // Трубная изоляция
        'pipe_insul_18_9': { name: 'Трубная изоляция Ø18×9мм (2м)', unit: 'шт', price: 80, category: 'insulation' },
        'pipe_insul_22_9': { name: 'Трубная изоляция Ø22×9мм (2м)', unit: 'шт', price: 90, category: 'insulation' },
        'pipe_insul_28_9': { name: 'Трубная изоляция Ø28×9мм (2м)', unit: 'шт', price: 100, category: 'insulation' },
        'pipe_insul_35_9': { name: 'Трубная изоляция Ø35×9мм (2м)', unit: 'шт', price: 120, category: 'insulation' },
        'pipe_insul_42_13': { name: 'Трубная изоляция Ø42×13мм (2м)', unit: 'шт', price: 160, category: 'insulation' },
        'pipe_insul_54_13': { name: 'Трубная изоляция Ø54×13мм (2м)', unit: 'шт', price: 200, category: 'insulation' },
        'pipe_insul_76_13': { name: 'Трубная изоляция Ø76×13мм (2м)', unit: 'шт', price: 280, category: 'insulation' },
        'pipe_insul_110_13': { name: 'Трубная изоляция Ø110×13мм (2м)', unit: 'шт', price: 380, category: 'insulation' },

        // Пароизоляция
        'vapor_barrier_b': { name: 'Пароизоляция тип B (60м²)', unit: 'рулон', price: 1800, category: 'insulation' },
        'vapor_barrier_c': { name: 'Пароизоляция тип C (60м²)', unit: 'рулон', price: 2500, category: 'insulation' },
        'vapor_barrier_d': { name: 'Пароизоляция тип D (60м²)', unit: 'рулон', price: 3500, category: 'insulation' },

        // Ветрозащита
        'wind_barrier_a': { name: 'Ветрозащитная мембрана тип A (60м²)', unit: 'рулон', price: 2200, category: 'insulation' },
        'wind_barrier_am': { name: 'Супердиффузионная мембрана AM (60м²)', unit: 'рулон', price: 4500, category: 'insulation' },
        'wind_barrier_as': { name: 'Супердиффузионная мембрана AS (60м²)', unit: 'рулон', price: 5500, category: 'insulation' },

        // Гидроизоляционная плёнка
        'hydro_film_d': { name: 'Гидроизоляционная плёнка D (60м²)', unit: 'рулон', price: 2800, category: 'insulation' },

        // Скотч для мембран
        'tape_vapor_50': { name: 'Скотч соединительный для пароизоляции (50м)', unit: 'шт', price: 450, category: 'insulation' },

        // Тарельчатые дюбели (для утеплителя)
        'dowel_insul_10x100': { name: 'Дюбель тарельчатый 10×100мм', unit: 'шт', price: 12, category: 'insulation' },
        'dowel_insul_10x140': { name: 'Дюбель тарельчатый 10×140мм', unit: 'шт', price: 15, category: 'insulation' },
        'dowel_insul_10x180': { name: 'Дюбель тарельчатый 10×180мм', unit: 'шт', price: 18, category: 'insulation' },
        'dowel_insul_10x220': { name: 'Дюбель тарельчатый 10×220мм', unit: 'шт', price: 22, category: 'insulation' }
    };
})();
