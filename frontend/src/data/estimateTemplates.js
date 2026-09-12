/**
 * estimateTemplates.js v2.0
 * 
 * Полная база шаблонов смет для строительных работ (Казахстан 2025).
 * ИСПРАВЛЕНО: цены актуализированы, убраны двойные позиции, 
 * добавлен умный парсинг описания, комплексные объекты, связка с маркетплейсом.
 */

// ═══ Коэффициенты сценариев (синхронизированы с UI) ═══
export const SCENARIO_COEFFICIENTS = {
  economy:  { label: 'Эконом',   coeff: 0.80, mult: 0.85, description: 'Бюджетные материалы, минимальный состав работ' },
  standard: { label: 'Стандарт', coeff: 1.00, mult: 1.00, description: 'Оптимальное соотношение цена/качество' },
  premium:  { label: 'Премиум',  coeff: 1.35, mult: 1.25, description: 'Премиальные материалы, расширенный комплекс' },
};

// ═══ БАЗА ЦЕН ПО КАТЕГОРИЯМ (v2 — актуальные цены 2025) ═══
export const ESTIMATE_TEMPLATES = {

  // ──────────── ОБЩЕСТРОЙ ────────────
  earth: {
    title: 'Земляные работы',
    items: [
      { group: 'Подготовка', name: 'Снятие растительного слоя (h=200мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 500, isMaterial: false },
      { group: 'Подготовка', name: 'Планировка территории механизированная', unit: 'м²', baseQtyPer: 1.0, unitPrice: 420, isMaterial: false },
      { group: 'Разработка', name: 'Разработка грунта экскаватором (II гр.)', unit: 'м³', baseQtyPer: 0.35, unitPrice: 3200, isMaterial: false },
      { group: 'Разработка', name: 'Ручная доработка грунта', unit: 'м³', baseQtyPer: 0.08, unitPrice: 5000, isMaterial: false },
      { group: 'Транспорт', name: 'Вывоз грунта автосамосвалом до 10 км', unit: 'м³', baseQtyPer: 0.3, unitPrice: 4500, isMaterial: false },
      { group: 'Обратная засыпка', name: 'Обратная засыпка пазух с трамбовкой', unit: 'м³', baseQtyPer: 0.15, unitPrice: 2200, isMaterial: false },
      { group: 'Материалы', name: 'Песок строительный (подсыпка)', unit: 'м³', baseQtyPer: 0.05, unitPrice: 7500, isMaterial: true, marketplaceCategory: 'bulk', searchQuery: 'песок строительный' },
      { group: 'Материалы', name: 'Щебень фр. 20-40 (подготовка)', unit: 'м³', baseQtyPer: 0.04, unitPrice: 9500, isMaterial: true, marketplaceCategory: 'bulk', searchQuery: 'щебень' },
      { group: 'Спецтехника', name: 'Аренда экскаватора (смена)', unit: 'смена', baseQtyPer: 0.003, unitPrice: 140000, isMaterial: false },
    ]
  },

  foundation: {
    title: 'Фундамент',
    items: [
      { group: 'Земляные', name: 'Разработка траншей/котлована', unit: 'м³', baseQtyPer: 0.5, unitPrice: 3500, isMaterial: false },
      { group: 'Подготовка', name: 'Щебёночная подготовка (h=150мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2000, isMaterial: false },
      { group: 'Подготовка', name: 'Бетонная подготовка (h=100мм, B7.5)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 3200, isMaterial: false },
      { group: 'Опалубка', name: 'Устройство опалубки фундамента', unit: 'м²', baseQtyPer: 0.8, unitPrice: 4000, isMaterial: false },
      { group: 'Армирование', name: 'Армирование фундамента (80 кг/м³)', unit: 'т', baseQtyPer: 0.025, unitPrice: 430000, isMaterial: true, marketplaceCategory: 'metal', searchQuery: 'арматура' },
      { group: 'Бетонирование', name: 'Бетон М300 (В22.5) с доставкой', unit: 'м³', baseQtyPer: 0.35, unitPrice: 35000, isMaterial: true, marketplaceCategory: 'bulk', searchQuery: 'бетон' },
      { group: 'Бетонирование', name: 'Укладка бетона с вибрированием', unit: 'м³', baseQtyPer: 0.35, unitPrice: 9500, isMaterial: false },
      { group: 'Гидроизоляция', name: 'Обмазочная гидроизоляция (битумная)', unit: 'м²', baseQtyPer: 1.2, unitPrice: 1800, isMaterial: false },
      { group: 'Гидроизоляция', name: 'Мастика битумная', unit: 'кг', baseQtyPer: 0.4, unitPrice: 950, isMaterial: true, marketplaceCategory: 'insulation', searchQuery: 'мастика битумная' },
      { group: 'Утепление', name: 'Утепление фундамента ЭППС 50мм', unit: 'м²', baseQtyPer: 0.8, unitPrice: 2500, isMaterial: false },
      { group: 'Материалы', name: 'Пенополистирол ЭППС 50мм', unit: 'м²', baseQtyPer: 0.8, unitPrice: 2200, isMaterial: true, marketplaceCategory: 'insulation', searchQuery: 'пенополистирол' },
    ]
  },

  concrete: {
    title: 'Бетон и монолит',
    items: [
      { group: 'Опалубка', name: 'Устройство щитовой опалубки стен', unit: 'м²', baseQtyPer: 1.0, unitPrice: 4500, isMaterial: false },
      { group: 'Опалубка', name: 'Аренда опалубки (компл.)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1800, isMaterial: true },
      { group: 'Армирование', name: 'Арматура А500С d12-16', unit: 'т', baseQtyPer: 0.03, unitPrice: 400000, isMaterial: true, marketplaceCategory: 'metal', searchQuery: 'арматура' },
      { group: 'Армирование', name: 'Вязка арматурных каркасов', unit: 'т', baseQtyPer: 0.03, unitPrice: 50000, isMaterial: false },
      { group: 'Бетон', name: 'Бетон М300 (В22.5) доставка', unit: 'м³', baseQtyPer: 0.25, unitPrice: 35000, isMaterial: true, marketplaceCategory: 'bulk', searchQuery: 'бетон' },
      { group: 'Бетон', name: 'Укладка бетона автобетононасосом', unit: 'м³', baseQtyPer: 0.25, unitPrice: 6500, isMaterial: false },
      { group: 'Бетон', name: 'Вибрирование бетона', unit: 'м³', baseQtyPer: 0.25, unitPrice: 2500, isMaterial: false },
      { group: 'Уход', name: 'Уход за бетоном (укрытие, полив)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 400, isMaterial: false },
    ]
  },

  masonry: {
    title: 'Кладка',
    // NOTE: items разделены тегами — filterItemsByDescription выберет кирпич ИЛИ газоблок
    items: [
      // --- Газоблоки (по умолчанию) ---
      { group: 'Кладка', name: 'Кладка из газобетонных блоков D500', unit: 'м²', baseQtyPer: 1.0, unitPrice: 4800, isMaterial: false, tag: 'gazoblock' },
      { group: 'Материалы', name: 'Газобетонные блоки D500 (600x300x200)', unit: 'шт', baseQtyPer: 8, unitPrice: 1350, isMaterial: true, tag: 'gazoblock', marketplaceCategory: 'blocks', searchQuery: 'газобетон блок' },
      { group: 'Материалы', name: 'Клей для газоблоков (25 кг)', unit: 'мешок', baseQtyPer: 0.3, unitPrice: 2800, isMaterial: true, tag: 'gazoblock', marketplaceCategory: 'cement', searchQuery: 'клей газобетон' },
      // --- Кирпич (альтернатива) ---
      { group: 'Кладка', name: 'Кирпичная кладка стен (250мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 6000, isMaterial: false, tag: 'brick' },
      { group: 'Материалы', name: 'Кирпич облицовочный М150', unit: 'шт', baseQtyPer: 50, unitPrice: 160, isMaterial: true, tag: 'brick', marketplaceCategory: 'blocks', searchQuery: 'кирпич' },
      { group: 'Материалы', name: 'Раствор кладочный М100', unit: 'м³', baseQtyPer: 0.025, unitPrice: 32000, isMaterial: true, tag: 'brick', marketplaceCategory: 'cement', searchQuery: 'раствор кладочный' },
      // --- Общие (всегда) ---
      { group: 'Армирование', name: 'Армирование кладки сеткой', unit: 'м²', baseQtyPer: 0.3, unitPrice: 950, isMaterial: false },
      { group: 'Армирование', name: 'Устройство армопояса', unit: 'п.м', baseQtyPer: 0.15, unitPrice: 9500, isMaterial: false },
      { group: 'Перемычки', name: 'Установка перемычек', unit: 'шт', baseQtyPer: 0.02, unitPrice: 14000, isMaterial: false },
    ]
  },

  metal: {
    title: 'Металлоконструкции',
    items: [
      { group: 'Каркас', name: 'Монтаж металлоконструкций', unit: 'т', baseQtyPer: 0.015, unitPrice: 95000, isMaterial: false },
      { group: 'Каркас', name: 'Сварочные работы', unit: 'п.м', baseQtyPer: 0.5, unitPrice: 4000, isMaterial: false },
      { group: 'Материалы', name: 'Двутавр/швеллер конструкционный', unit: 'т', baseQtyPer: 0.015, unitPrice: 520000, isMaterial: true, marketplaceCategory: 'metal', searchQuery: 'двутавр швеллер' },
      { group: 'Материалы', name: 'Профильная труба', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 5200, isMaterial: true, marketplaceCategory: 'metal', searchQuery: 'профильная труба' },
      { group: 'Обработка', name: 'Антикоррозийная обработка', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2200, isMaterial: false },
      { group: 'Материалы', name: 'Грунт-эмаль по металлу', unit: 'кг', baseQtyPer: 0.15, unitPrice: 3200, isMaterial: true, marketplaceCategory: 'paint', searchQuery: 'грунт-эмаль' },
      { group: 'Крепёж', name: 'Болты высокопрочные + монтаж', unit: 'компл', baseQtyPer: 0.05, unitPrice: 9500, isMaterial: true, marketplaceCategory: 'fasteners', searchQuery: 'болты высокопрочные' },
    ]
  },

  roof: {
    title: 'Кровля',
    items: [
      { group: 'Стропила', name: 'Устройство стропильной системы', unit: 'м²', baseQtyPer: 1.0, unitPrice: 5000, isMaterial: false },
      { group: 'Стропила', name: 'Брус стропильный 50x200', unit: 'м³', baseQtyPer: 0.03, unitPrice: 95000, isMaterial: true },
      { group: 'Обрешётка', name: 'Устройство обрешётки', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1400, isMaterial: false },
      { group: 'Обрешётка', name: 'Доска обрезная 25x150', unit: 'м³', baseQtyPer: 0.012, unitPrice: 85000, isMaterial: true },
      { group: 'Гидроизоляция', name: 'Укладка гидроветрозащитной мембраны', unit: 'м²', baseQtyPer: 1.15, unitPrice: 400, isMaterial: false },
      { group: 'Гидроизоляция', name: 'Мембрана Тайвек/аналог', unit: 'м²', baseQtyPer: 1.15, unitPrice: 650, isMaterial: true, marketplaceCategory: 'roofing', searchQuery: 'мембрана' },
      { group: 'Покрытие', name: 'Монтаж металлочерепицы', unit: 'м²', baseQtyPer: 1.0, unitPrice: 3200, isMaterial: false },
      { group: 'Покрытие', name: 'Металлочерепица с покрытием', unit: 'м²', baseQtyPer: 1.1, unitPrice: 6500, isMaterial: true, marketplaceCategory: 'roofing', searchQuery: 'металлочерепица' },
      { group: 'Доборные', name: 'Конёк, ендова, планки', unit: 'п.м', baseQtyPer: 0.15, unitPrice: 3800, isMaterial: true, marketplaceCategory: 'roofing' },
      { group: 'Доборные', name: 'Водосточная система', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 6500, isMaterial: true, marketplaceCategory: 'roofing', searchQuery: 'водосток' },
      { group: 'Утепление', name: 'Утепление кровли минватой 200мм', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1800, isMaterial: false },
      { group: 'Утепление', name: 'Минвата базальтовая 200мм', unit: 'м²', baseQtyPer: 1.05, unitPrice: 3800, isMaterial: true, marketplaceCategory: 'insulation', searchQuery: 'минвата' },
    ]
  },

  facade: {
    title: 'Фасад',
    items: [
      { group: 'Подготовка', name: 'Очистка и грунтовка стен', unit: 'м²', baseQtyPer: 1.0, unitPrice: 500, isMaterial: false },
      { group: 'Утепление', name: 'Монтаж утеплителя (минвата 100мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2200, isMaterial: false },
      { group: 'Утепление', name: 'Минвата фасадная 100мм', unit: 'м²', baseQtyPer: 1.05, unitPrice: 3200, isMaterial: true, marketplaceCategory: 'insulation', searchQuery: 'минвата фасадная' },
      { group: 'Утепление', name: 'Дюбели тарельчатые', unit: 'шт', baseQtyPer: 6, unitPrice: 150, isMaterial: true, marketplaceCategory: 'fasteners', searchQuery: 'дюбель тарельчатый' },
      { group: 'Штукатурка', name: 'Армирование сеткой + клей', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1800, isMaterial: false },
      { group: 'Штукатурка', name: 'Декоративная штукатурка "короед"', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2200, isMaterial: false },
      { group: 'Материалы', name: 'Клей для утеплителя (25 кг)', unit: 'мешок', baseQtyPer: 0.12, unitPrice: 4200, isMaterial: true, marketplaceCategory: 'cement', searchQuery: 'клей для утеплителя' },
      { group: 'Материалы', name: 'Штукатурка декоративная (25 кг)', unit: 'мешок', baseQtyPer: 0.12, unitPrice: 5500, isMaterial: true, marketplaceCategory: 'cement', searchQuery: 'штукатурка декоративная' },
      { group: 'Покраска', name: 'Покраска фасада (2 слоя)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 950, isMaterial: false },
      { group: 'Покраска', name: 'Краска фасадная', unit: 'л', baseQtyPer: 0.2, unitPrice: 4200, isMaterial: true, marketplaceCategory: 'paint', searchQuery: 'краска фасадная' },
    ]
  },

  windows: {
    title: 'Окна и двери',
    items: [
      { group: 'Демонтаж', name: 'Демонтаж старых окон/дверей', unit: 'шт', baseQtyPer: 0.08, unitPrice: 6500, isMaterial: false, tag: 'demo' },
      { group: 'Окна', name: 'Установка ПВХ окон (2-камерный)', unit: 'шт', baseQtyPer: 0.06, unitPrice: 9500, isMaterial: false },
      { group: 'Окна', name: 'Окно ПВХ двухкамерное 1400x1300', unit: 'шт', baseQtyPer: 0.06, unitPrice: 85000, isMaterial: true },
      { group: 'Двери', name: 'Установка входной двери', unit: 'шт', baseQtyPer: 0.01, unitPrice: 18000, isMaterial: false },
      { group: 'Двери', name: 'Дверь входная металлическая', unit: 'шт', baseQtyPer: 0.01, unitPrice: 140000, isMaterial: true },
      { group: 'Двери', name: 'Установка межкомнатных дверей', unit: 'шт', baseQtyPer: 0.04, unitPrice: 9000, isMaterial: false },
      { group: 'Двери', name: 'Дверь межкомнатная с коробкой', unit: 'шт', baseQtyPer: 0.04, unitPrice: 52000, isMaterial: true },
      { group: 'Отделка', name: 'Устройство откосов', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 3000, isMaterial: false },
      { group: 'Отделка', name: 'Установка подоконников', unit: 'шт', baseQtyPer: 0.06, unitPrice: 4000, isMaterial: false },
      { group: 'Отделка', name: 'Подоконник ПВХ 300мм', unit: 'шт', baseQtyPer: 0.06, unitPrice: 9500, isMaterial: true },
      { group: 'Герметизация', name: 'Монтажная пена + герметизация', unit: 'шт', baseQtyPer: 0.08, unitPrice: 3500, isMaterial: true, marketplaceCategory: 'fasteners' },
    ]
  },

  insulation: {
    title: 'Утепление и изоляция',
    items: [
      { group: 'Подготовка', name: 'Очистка поверхности', unit: 'м²', baseQtyPer: 1.0, unitPrice: 320, isMaterial: false },
      { group: 'Утепление', name: 'Монтаж утеплителя 100мм', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2000, isMaterial: false },
      { group: 'Утепление', name: 'Минвата базальтовая 100мм', unit: 'м²', baseQtyPer: 1.05, unitPrice: 2600, isMaterial: true, marketplaceCategory: 'insulation', searchQuery: 'минвата' },
      { group: 'Пароизоляция', name: 'Пароизоляция', unit: 'м²', baseQtyPer: 1.1, unitPrice: 400, isMaterial: false },
      { group: 'Пароизоляция', name: 'Плёнка пароизоляционная', unit: 'м²', baseQtyPer: 1.15, unitPrice: 220, isMaterial: true, marketplaceCategory: 'insulation' },
      { group: 'Крепёж', name: 'Дюбели тарельчатые (6 шт/м2)', unit: 'шт', baseQtyPer: 6, unitPrice: 150, isMaterial: true, marketplaceCategory: 'fasteners' },
      { group: 'Гидроизоляция', name: 'Гидроизоляция обмазочная', unit: 'м²', baseQtyPer: 0.5, unitPrice: 1800, isMaterial: false },
    ]
  },

  demolition: {
    title: 'Демонтаж',
    items: [
      { group: 'Демонтаж', name: 'Демонтаж перегородок кирпичных', unit: 'м²', baseQtyPer: 0.3, unitPrice: 2200, isMaterial: false },
      { group: 'Демонтаж', name: 'Демонтаж штукатурки', unit: 'м²', baseQtyPer: 1.0, unitPrice: 750, isMaterial: false },
      { group: 'Демонтаж', name: 'Демонтаж стяжки пола', unit: 'м²', baseQtyPer: 0.5, unitPrice: 1400, isMaterial: false },
      { group: 'Демонтаж', name: 'Демонтаж плитки', unit: 'м²', baseQtyPer: 0.3, unitPrice: 950, isMaterial: false },
      { group: 'Демонтаж', name: 'Демонтаж электропроводки', unit: 'м²', baseQtyPer: 0.5, unitPrice: 500, isMaterial: false },
      { group: 'Демонтаж', name: 'Демонтаж сантехники (комплект)', unit: 'компл', baseQtyPer: 0.01, unitPrice: 28000, isMaterial: false },
      { group: 'Вывоз', name: 'Погрузка мусора', unit: 'м³', baseQtyPer: 0.15, unitPrice: 3000, isMaterial: false },
      { group: 'Вывоз', name: 'Вывоз строительного мусора', unit: 'м³', baseQtyPer: 0.15, unitPrice: 9000, isMaterial: false },
    ]
  },

  // ──────────── ОТДЕЛКА ────────────
  wall_finish: {
    title: 'Отделка стен',
    // NOTE: покраска ИЛИ обои — выбирается по описанию (по умолчанию покраска)
    items: [
      { group: 'Подготовка', name: 'Грунтовка стен (2 слоя)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 400, isMaterial: false },
      { group: 'Подготовка', name: 'Грунтовка глубокого проникновения', unit: 'л', baseQtyPer: 0.2, unitPrice: 1400, isMaterial: true, marketplaceCategory: 'paint', searchQuery: 'грунтовка' },
      { group: 'Штукатурка', name: 'Штукатурка стен по маякам (до 30мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 3800, isMaterial: false },
      { group: 'Штукатурка', name: 'Смесь штукатурная (Ротбанд/аналог)', unit: 'кг', baseQtyPer: 10, unitPrice: 210, isMaterial: true, marketplaceCategory: 'cement', searchQuery: 'штукатурка' },
      { group: 'Шпаклёвка', name: 'Шпаклёвка стен под покраску (2 слоя)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2200, isMaterial: false },
      { group: 'Шпаклёвка', name: 'Шпаклёвка финишная', unit: 'кг', baseQtyPer: 1.5, unitPrice: 380, isMaterial: true, marketplaceCategory: 'cement', searchQuery: 'шпаклёвка' },
      // --- Покраска (по умолчанию) ---
      { group: 'Финиш', name: 'Покраска стен (2 слоя)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1400, isMaterial: false, tag: 'paint' },
      { group: 'Финиш', name: 'Краска интерьерная', unit: 'л', baseQtyPer: 0.18, unitPrice: 5200, isMaterial: true, tag: 'paint', marketplaceCategory: 'paint', searchQuery: 'краска интерьерная' },
      // --- Обои (альтернатива) ---
      { group: 'Финиш', name: 'Поклейка обоев', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1800, isMaterial: false, tag: 'wallpaper' },
      { group: 'Финиш', name: 'Обои виниловые', unit: 'рул', baseQtyPer: 0.2, unitPrice: 6500, isMaterial: true, tag: 'wallpaper' },
    ]
  },

  floors: {
    title: 'Полы',
    // NOTE: плитка ИЛИ ламинат — выбирается по описанию (по умолчанию ламинат)
    items: [
      { group: 'Стяжка', name: 'Устройство стяжки пола (50мм)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 3200, isMaterial: false },
      { group: 'Стяжка', name: 'Смесь для стяжки (пескобетон)', unit: 'кг', baseQtyPer: 8, unitPrice: 95, isMaterial: true, marketplaceCategory: 'cement', searchQuery: 'пескобетон' },
      { group: 'Гидроизоляция', name: 'Гидроизоляция пола (мокрые зоны)', unit: 'м²', baseQtyPer: 0.2, unitPrice: 2500, isMaterial: false },
      // --- Ламинат (по умолчанию для жилых) ---
      { group: 'Покрытие', name: 'Укладка ламината', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2000, isMaterial: false, tag: 'laminate' },
      { group: 'Покрытие', name: 'Ламинат 33 класс', unit: 'м²', baseQtyPer: 1.08, unitPrice: 6200, isMaterial: true, tag: 'laminate', marketplaceCategory: 'flooring', searchQuery: 'ламинат' },
      { group: 'Покрытие', name: 'Подложка 3мм', unit: 'м²', baseQtyPer: 1.08, unitPrice: 500, isMaterial: true, tag: 'laminate', marketplaceCategory: 'flooring', searchQuery: 'подложка' },
      // --- Плитка (альтернатива для мокрых зон) ---
      { group: 'Покрытие', name: 'Укладка керамогранита', unit: 'м²', baseQtyPer: 1.0, unitPrice: 5000, isMaterial: false, tag: 'tile' },
      { group: 'Покрытие', name: 'Керамогранит 600x600', unit: 'м²', baseQtyPer: 1.08, unitPrice: 7500, isMaterial: true, tag: 'tile', marketplaceCategory: 'flooring', searchQuery: 'керамогранит' },
      { group: 'Покрытие', name: 'Плиточный клей', unit: 'кг', baseQtyPer: 4, unitPrice: 250, isMaterial: true, tag: 'tile', marketplaceCategory: 'cement', searchQuery: 'плиточный клей' },
      // --- Общее ---
      { group: 'Плинтус', name: 'Установка плинтуса', unit: 'п.м', baseQtyPer: 0.4, unitPrice: 750, isMaterial: false },
      { group: 'Плинтус', name: 'Плинтус ПВХ с кабель-каналом', unit: 'п.м', baseQtyPer: 0.42, unitPrice: 950, isMaterial: true },
    ]
  },

  ceilings: {
    title: 'Потолки',
    items: [
      { group: 'Подготовка', name: 'Очистка и грунтовка потолка', unit: 'м²', baseQtyPer: 1.0, unitPrice: 420, isMaterial: false },
      { group: 'Выравнивание', name: 'Штукатурка потолка по маякам', unit: 'м²', baseQtyPer: 0.5, unitPrice: 5000, isMaterial: false },
      { group: 'Выравнивание', name: 'Шпаклёвка потолка под покраску', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2500, isMaterial: false },
      { group: 'ГКЛ', name: 'Подвесной потолок из ГКЛ', unit: 'м²', baseQtyPer: 0.5, unitPrice: 4200, isMaterial: false },
      { group: 'ГКЛ', name: 'ГКЛ потолочный 9.5мм', unit: 'м²', baseQtyPer: 0.55, unitPrice: 2200, isMaterial: true, marketplaceCategory: 'drywall', searchQuery: 'гипсокартон потолочный' },
      { group: 'ГКЛ', name: 'Профиль UD/CD потолочный', unit: 'п.м', baseQtyPer: 1.5, unitPrice: 420, isMaterial: true, marketplaceCategory: 'drywall', searchQuery: 'профиль потолочный' },
      { group: 'Покраска', name: 'Покраска потолка (2 слоя)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1400, isMaterial: false },
      { group: 'Покраска', name: 'Краска потолочная', unit: 'л', baseQtyPer: 0.15, unitPrice: 4800, isMaterial: true, marketplaceCategory: 'paint', searchQuery: 'краска потолочная' },
    ]
  },

  stairs: {
    title: 'Лестницы и балконы',
    items: [
      { group: 'Лестница', name: 'Устройство бетонной лестницы', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 40000, isMaterial: false },
      { group: 'Лестница', name: 'Облицовка ступеней плиткой', unit: 'м²', baseQtyPer: 0.3, unitPrice: 6000, isMaterial: false },
      { group: 'Лестница', name: 'Керамогранит для ступеней', unit: 'м²', baseQtyPer: 0.33, unitPrice: 9500, isMaterial: true, marketplaceCategory: 'flooring' },
      { group: 'Ограждение', name: 'Установка перил', unit: 'п.м', baseQtyPer: 0.15, unitPrice: 14000, isMaterial: false },
      { group: 'Ограждение', name: 'Перила металлические', unit: 'п.м', baseQtyPer: 0.15, unitPrice: 28000, isMaterial: true, marketplaceCategory: 'metal' },
      { group: 'Балкон', name: 'Остекление балкона', unit: 'м²', baseQtyPer: 0.2, unitPrice: 20000, isMaterial: false },
      { group: 'Балкон', name: 'Утепление балкона', unit: 'м²', baseQtyPer: 0.2, unitPrice: 5000, isMaterial: false },
    ]
  },

  // ──────────── ИНЖЕНЕРИЯ ────────────
  electric: {
    title: 'Электрика',
    items: [
      { group: 'Проводка', name: 'Штробление стен под кабель', unit: 'п.м', baseQtyPer: 0.8, unitPrice: 750, isMaterial: false },
      { group: 'Проводка', name: 'Прокладка кабеля ВВГнг 3x2.5', unit: 'п.м', baseQtyPer: 1.2, unitPrice: 400, isMaterial: false },
      { group: 'Проводка', name: 'Кабель ВВГнг-LS 3x2.5', unit: 'п.м', baseQtyPer: 1.3, unitPrice: 480, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'ВВГнг 3x2.5' },
      { group: 'Розетки', name: 'Установка розеток', unit: 'шт', baseQtyPer: 0.12, unitPrice: 2000, isMaterial: false },
      { group: 'Розетки', name: 'Розетка встраиваемая', unit: 'шт', baseQtyPer: 0.12, unitPrice: 2800, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'розетка' },
      { group: 'Выключатели', name: 'Установка выключателей', unit: 'шт', baseQtyPer: 0.06, unitPrice: 1800, isMaterial: false },
      { group: 'Выключатели', name: 'Выключатель 1-клавишный', unit: 'шт', baseQtyPer: 0.06, unitPrice: 2500, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'выключатель' },
      { group: 'Щиток', name: 'Сборка и монтаж щитка', unit: 'шт', baseQtyPer: 0.005, unitPrice: 40000, isMaterial: false },
      { group: 'Щиток', name: 'Щит распределительный 24 мод.', unit: 'шт', baseQtyPer: 0.005, unitPrice: 22000, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'щит распределительный' },
      { group: 'Щиток', name: 'Автоматы ABB/Schneider', unit: 'шт', baseQtyPer: 0.04, unitPrice: 4200, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'автомат' },
      { group: 'Освещение', name: 'Установка точечного светильника', unit: 'шт', baseQtyPer: 0.08, unitPrice: 1800, isMaterial: false },
      { group: 'Освещение', name: 'Светильник встраиваемый LED', unit: 'шт', baseQtyPer: 0.08, unitPrice: 5200, isMaterial: true, marketplaceCategory: 'electric', searchQuery: 'светильник LED' },
    ]
  },

  plumbing: {
    title: 'Сантехника',
    items: [
      { group: 'Трубы', name: 'Разводка ХВС/ГВС (полипропилен)', unit: 'тчк', baseQtyPer: 0.06, unitPrice: 6500, isMaterial: false },
      { group: 'Трубы', name: 'Труба ПП d20-25', unit: 'п.м', baseQtyPer: 0.5, unitPrice: 750, isMaterial: true, marketplaceCategory: 'plumbing', searchQuery: 'труба полипропилен' },
      { group: 'Канализация', name: 'Разводка канализации', unit: 'тчк', baseQtyPer: 0.04, unitPrice: 7500, isMaterial: false },
      { group: 'Канализация', name: 'Труба канализационная d110', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 950, isMaterial: true, marketplaceCategory: 'sewer', searchQuery: 'труба канализационная' },
      { group: 'Приборы', name: 'Установка раковины', unit: 'шт', baseQtyPer: 0.015, unitPrice: 9500, isMaterial: false },
      { group: 'Приборы', name: 'Раковина с пьедесталом', unit: 'шт', baseQtyPer: 0.015, unitPrice: 28000, isMaterial: true, marketplaceCategory: 'plumbing', searchQuery: 'раковина' },
      { group: 'Приборы', name: 'Установка унитаза', unit: 'шт', baseQtyPer: 0.01, unitPrice: 9000, isMaterial: false },
      { group: 'Приборы', name: 'Унитаз-компакт', unit: 'шт', baseQtyPer: 0.01, unitPrice: 52000, isMaterial: true, marketplaceCategory: 'plumbing', searchQuery: 'унитаз' },
      { group: 'Приборы', name: 'Установка ванны/душ', unit: 'шт', baseQtyPer: 0.008, unitPrice: 14000, isMaterial: false },
      { group: 'Приборы', name: 'Ванна акриловая 170x70', unit: 'шт', baseQtyPer: 0.008, unitPrice: 95000, isMaterial: true, marketplaceCategory: 'plumbing', searchQuery: 'ванна' },
      { group: 'Смесители', name: 'Установка смесителя', unit: 'шт', baseQtyPer: 0.02, unitPrice: 4000, isMaterial: false },
      { group: 'Смесители', name: 'Смеситель для ванны/раковины', unit: 'шт', baseQtyPer: 0.02, unitPrice: 22000, isMaterial: true, marketplaceCategory: 'plumbing', searchQuery: 'смеситель' },
    ]
  },

  heating: {
    title: 'Отопление',
    items: [
      { group: 'Котёл', name: 'Монтаж газового котла', unit: 'шт', baseQtyPer: 0.005, unitPrice: 52000, isMaterial: false },
      { group: 'Котёл', name: 'Котёл газовый настенный 24кВт', unit: 'шт', baseQtyPer: 0.005, unitPrice: 320000, isMaterial: true, marketplaceCategory: 'heating', searchQuery: 'котёл газовый' },
      { group: 'Радиаторы', name: 'Установка радиатора', unit: 'шт', baseQtyPer: 0.04, unitPrice: 9500, isMaterial: false },
      { group: 'Радиаторы', name: 'Радиатор алюминиевый (10 секц.)', unit: 'шт', baseQtyPer: 0.04, unitPrice: 42000, isMaterial: true, marketplaceCategory: 'heating', searchQuery: 'радиатор' },
      { group: 'Трубы', name: 'Разводка труб отопления', unit: 'п.м', baseQtyPer: 0.6, unitPrice: 2200, isMaterial: false },
      { group: 'Трубы', name: 'Труба ПП армированная d25', unit: 'п.м', baseQtyPer: 0.65, unitPrice: 950, isMaterial: true, marketplaceCategory: 'heating', searchQuery: 'труба отопление' },
      { group: 'Тёплый пол', name: 'Устройство тёплого пола водяного', unit: 'м²', baseQtyPer: 0.3, unitPrice: 4000, isMaterial: false },
      { group: 'Тёплый пол', name: 'Труба для тёплого пола PEX 16мм', unit: 'п.м', baseQtyPer: 1.5, unitPrice: 320, isMaterial: true, marketplaceCategory: 'heating', searchQuery: 'труба тёплый пол' },
    ]
  },

  hvac: {
    title: 'Вентиляция и кондиционирование',
    items: [
      { group: 'Кондиционер', name: 'Монтаж сплит-системы', unit: 'шт', baseQtyPer: 0.02, unitPrice: 28000, isMaterial: false },
      { group: 'Кондиционер', name: 'Сплит-система 12000 BTU', unit: 'шт', baseQtyPer: 0.02, unitPrice: 210000, isMaterial: true },
      { group: 'Вентиляция', name: 'Монтаж воздуховодов', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 4000, isMaterial: false },
      { group: 'Вентиляция', name: 'Воздуховод оцинкованный', unit: 'п.м', baseQtyPer: 0.32, unitPrice: 5200, isMaterial: true },
      { group: 'Вентиляция', name: 'Установка вытяжного вентилятора', unit: 'шт', baseQtyPer: 0.02, unitPrice: 4000, isMaterial: false },
      { group: 'Вентиляция', name: 'Вентилятор вытяжной d100', unit: 'шт', baseQtyPer: 0.02, unitPrice: 9500, isMaterial: true },
    ]
  },

  gas: {
    title: 'Газоснабжение',
    items: [
      { group: 'Проект', name: 'Проектирование газоснабжения', unit: 'компл', baseQtyPer: 0.003, unitPrice: 210000, isMaterial: false },
      { group: 'Трубы', name: 'Прокладка газопровода', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 9500, isMaterial: false },
      { group: 'Трубы', name: 'Труба газовая стальная', unit: 'п.м', baseQtyPer: 0.32, unitPrice: 4200, isMaterial: true },
      { group: 'Оборудование', name: 'Установка газового счётчика', unit: 'шт', baseQtyPer: 0.005, unitPrice: 14000, isMaterial: false },
      { group: 'Оборудование', name: 'Счётчик газовый', unit: 'шт', baseQtyPer: 0.005, unitPrice: 42000, isMaterial: true },
      { group: 'Врезка', name: 'Врезка в газопровод', unit: 'шт', baseQtyPer: 0.003, unitPrice: 95000, isMaterial: false },
    ]
  },

  automation: {
    title: 'Автоматизация и слаботочные',
    items: [
      { group: 'СКС', name: 'Прокладка кабеля UTP Cat6', unit: 'п.м', baseQtyPer: 0.5, unitPrice: 400, isMaterial: false },
      { group: 'СКС', name: 'Кабель UTP Cat6', unit: 'п.м', baseQtyPer: 0.55, unitPrice: 300, isMaterial: true, marketplaceCategory: 'electric' },
      { group: 'Видеонаблюдение', name: 'Установка камеры', unit: 'шт', baseQtyPer: 0.02, unitPrice: 6500, isMaterial: false },
      { group: 'Видеонаблюдение', name: 'IP-камера 2Мп', unit: 'шт', baseQtyPer: 0.02, unitPrice: 28000, isMaterial: true },
      { group: 'Видеонаблюдение', name: 'Видеорегистратор 4-кан.', unit: 'шт', baseQtyPer: 0.003, unitPrice: 72000, isMaterial: true },
      { group: 'Домофон', name: 'Установка домофона', unit: 'компл', baseQtyPer: 0.005, unitPrice: 14000, isMaterial: false },
      { group: 'Домофон', name: 'Домофон видео', unit: 'компл', baseQtyPer: 0.005, unitPrice: 52000, isMaterial: true },
    ]
  },

  fire_safety: {
    title: 'Пожарная безопасность',
    items: [
      { group: 'Сигнализация', name: 'Монтаж пожарных извещателей', unit: 'шт', baseQtyPer: 0.04, unitPrice: 4000, isMaterial: false },
      { group: 'Сигнализация', name: 'Извещатель дымовой', unit: 'шт', baseQtyPer: 0.04, unitPrice: 5200, isMaterial: true },
      { group: 'Сигнализация', name: 'Монтаж приёмного прибора', unit: 'шт', baseQtyPer: 0.003, unitPrice: 18000, isMaterial: false },
      { group: 'Сигнализация', name: 'Прибор приёмно-контрольный', unit: 'шт', baseQtyPer: 0.003, unitPrice: 52000, isMaterial: true },
      { group: 'Кабель', name: 'Прокладка огнестойкого кабеля', unit: 'п.м', baseQtyPer: 0.5, unitPrice: 500, isMaterial: false },
      { group: 'Кабель', name: 'Кабель огнестойкий КПСнг', unit: 'п.м', baseQtyPer: 0.55, unitPrice: 450, isMaterial: true },
      { group: 'Средства', name: 'Огнетушитель ОП-5', unit: 'шт', baseQtyPer: 0.01, unitPrice: 9500, isMaterial: true },
    ]
  },

  external_nets: {
    title: 'Наружные сети',
    items: [
      { group: 'Водоснабжение', name: 'Прокладка водопровода ПЭ d32', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 7500, isMaterial: false },
      { group: 'Водоснабжение', name: 'Труба ПЭ 100 d32', unit: 'п.м', baseQtyPer: 0.32, unitPrice: 1400, isMaterial: true, marketplaceCategory: 'water' },
      { group: 'Канализация', name: 'Прокладка канализации d110', unit: 'п.м', baseQtyPer: 0.2, unitPrice: 9500, isMaterial: false },
      { group: 'Канализация', name: 'Труба канализ. наружная d110', unit: 'п.м', baseQtyPer: 0.22, unitPrice: 2200, isMaterial: true, marketplaceCategory: 'sewer' },
      { group: 'Колодцы', name: 'Устройство смотрового колодца', unit: 'шт', baseQtyPer: 0.003, unitPrice: 95000, isMaterial: false },
      { group: 'Электрика', name: 'Прокладка кабеля в траншее', unit: 'п.м', baseQtyPer: 0.2, unitPrice: 4000, isMaterial: false },
      { group: 'Электрика', name: 'Кабель ВВГнг 4x10', unit: 'п.м', baseQtyPer: 0.22, unitPrice: 3200, isMaterial: true, marketplaceCategory: 'electric' },
    ]
  },

  // ──────────── ПРОЧЕЕ ────────────
  landscaping: {
    title: 'Благоустройство',
    items: [
      { group: 'Планировка', name: 'Планировка территории', unit: 'м²', baseQtyPer: 1.0, unitPrice: 500, isMaterial: false },
      { group: 'Дорожки', name: 'Устройство пешеходных дорожек', unit: 'м²', baseQtyPer: 0.15, unitPrice: 5000, isMaterial: false },
      { group: 'Дорожки', name: 'Тротуарная плитка', unit: 'м²', baseQtyPer: 0.16, unitPrice: 4200, isMaterial: true },
      { group: 'Забор', name: 'Установка забора из профнастила', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 9500, isMaterial: false },
      { group: 'Забор', name: 'Профнастил С8 + столбы', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 14000, isMaterial: true, marketplaceCategory: 'roofing' },
      { group: 'Озеленение', name: 'Устройство газона', unit: 'м²', baseQtyPer: 0.3, unitPrice: 950, isMaterial: false },
      { group: 'Озеленение', name: 'Семена газонной травы', unit: 'кг', baseQtyPer: 0.01, unitPrice: 6500, isMaterial: true },
    ]
  },

  roads: {
    title: 'Дороги и мосты',
    items: [
      { group: 'Подготовка', name: 'Снятие грунта и планировка', unit: 'м²', baseQtyPer: 1.0, unitPrice: 750, isMaterial: false },
      { group: 'Основание', name: 'Устройство щебёночного основания', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2800, isMaterial: false },
      { group: 'Основание', name: 'Щебень фр. 20-40', unit: 'м³', baseQtyPer: 0.15, unitPrice: 9500, isMaterial: true, marketplaceCategory: 'bulk' },
      { group: 'Покрытие', name: 'Укладка асфальтобетона', unit: 'м²', baseQtyPer: 1.0, unitPrice: 4200, isMaterial: false },
      { group: 'Покрытие', name: 'Асфальтобетонная смесь', unit: 'т', baseQtyPer: 0.1, unitPrice: 25000, isMaterial: true },
      { group: 'Бордюры', name: 'Установка бордюрного камня', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 3200, isMaterial: false },
      { group: 'Бордюры', name: 'Бордюр бетонный БР100.30.15', unit: 'шт', baseQtyPer: 0.1, unitPrice: 2800, isMaterial: true },
    ]
  },

  wood: {
    title: 'Деревянные конструкции',
    items: [
      { group: 'Каркас', name: 'Устройство деревянного каркаса', unit: 'м²', baseQtyPer: 1.0, unitPrice: 5000, isMaterial: false },
      { group: 'Каркас', name: 'Брус строганый 100x150', unit: 'м³', baseQtyPer: 0.02, unitPrice: 105000, isMaterial: true },
      { group: 'Обшивка', name: 'Обшивка вагонкой/имитацией', unit: 'м²', baseQtyPer: 1.0, unitPrice: 2800, isMaterial: false },
      { group: 'Обшивка', name: 'Вагонка сосна сорт А', unit: 'м²', baseQtyPer: 1.1, unitPrice: 4500, isMaterial: true },
      { group: 'Обработка', name: 'Антисептирование древесины', unit: 'м²', baseQtyPer: 1.0, unitPrice: 750, isMaterial: false },
      { group: 'Обработка', name: 'Антисептик (Сенеж/аналог)', unit: 'л', baseQtyPer: 0.15, unitPrice: 3000, isMaterial: true, marketplaceCategory: 'paint' },
    ]
  },

  interior: {
    title: 'Мебель и оборудование',
    items: [
      { group: 'Кухня', name: 'Сборка и монтаж кухни', unit: 'п.м', baseQtyPer: 0.03, unitPrice: 18000, isMaterial: false },
      { group: 'Кухня', name: 'Кухонный гарнитур (модульный)', unit: 'п.м', baseQtyPer: 0.03, unitPrice: 95000, isMaterial: true },
      { group: 'Шкафы', name: 'Сборка встроенного шкафа', unit: 'шт', baseQtyPer: 0.01, unitPrice: 14000, isMaterial: false },
      { group: 'Шкафы', name: 'Шкаф-купе встроенный', unit: 'шт', baseQtyPer: 0.01, unitPrice: 210000, isMaterial: true },
      { group: 'Техника', name: 'Подключение бытовой техники', unit: 'шт', baseQtyPer: 0.03, unitPrice: 6500, isMaterial: false },
    ]
  },

  design: {
    title: 'Проектирование',
    items: [
      { group: 'АР', name: 'Архитектурный проект (АР)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1800, isMaterial: false },
      { group: 'КР', name: 'Конструктивные решения (КР)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 1400, isMaterial: false },
      { group: 'ИОС', name: 'Инженерные системы (ИОС)', unit: 'м²', baseQtyPer: 1.0, unitPrice: 950, isMaterial: false },
      { group: 'Сметы', name: 'Составление сметной документации', unit: 'м²', baseQtyPer: 1.0, unitPrice: 600, isMaterial: false },
      { group: 'Дизайн', name: 'Дизайн-проект интерьера', unit: 'м²', baseQtyPer: 1.0, unitPrice: 4200, isMaterial: false },
      { group: 'Согласование', name: 'Экспертиза и согласование', unit: 'компл', baseQtyPer: 0.005, unitPrice: 420000, isMaterial: false },
    ]
  },

  special: {
    title: 'Специальные работы',
    items: [
      { group: 'Высотные', name: 'Высотные работы (альпинизм)', unit: 'м²', baseQtyPer: 0.2, unitPrice: 6500, isMaterial: false },
      { group: 'Сварочные', name: 'Сварочные работы', unit: 'п.м', baseQtyPer: 0.3, unitPrice: 4000, isMaterial: false },
      { group: 'Буровые', name: 'Бурение скважин', unit: 'п.м', baseQtyPer: 0.05, unitPrice: 22000, isMaterial: false },
      { group: 'Гидроизоляция', name: 'Инъекционная гидроизоляция', unit: 'п.м', baseQtyPer: 0.1, unitPrice: 14000, isMaterial: false },
      { group: 'Усиление', name: 'Усиление конструкций углеволокном', unit: 'м²', baseQtyPer: 0.1, unitPrice: 18000, isMaterial: false },
      { group: 'Геодезия', name: 'Геодезическая съёмка', unit: 'компл', baseQtyPer: 0.003, unitPrice: 140000, isMaterial: false },
    ]
  },

  other: {
    title: 'Прочие работы',
    items: [
      { group: 'Уборка', name: 'Генеральная уборка после ремонта', unit: 'м²', baseQtyPer: 1.0, unitPrice: 950, isMaterial: false },
      { group: 'Доставка', name: 'Доставка материалов', unit: 'рейс', baseQtyPer: 0.005, unitPrice: 40000, isMaterial: false },
      { group: 'Подъём', name: 'Подъём материалов на этаж', unit: 'т', baseQtyPer: 0.01, unitPrice: 9500, isMaterial: false },
      { group: 'Техника', name: 'Аренда строительных лесов', unit: 'м²', baseQtyPer: 0.3, unitPrice: 500, isMaterial: true },
      { group: 'Прораб', name: 'Технический надзор', unit: 'мес', baseQtyPer: 0.005, unitPrice: 280000, isMaterial: false },
    ]
  },
};


// ═══ КОМПЛЕКСНЫЕ ОБЪЕКТЫ ═══
export const COMPLEX_TEMPLATES = {
  apartment_renovation: {
    title: 'Ремонт квартиры (комплексный)',
    icon: '🏠',
    includes: ['demolition', 'electric', 'plumbing', 'wall_finish', 'floors', 'ceilings'],
    description: 'Демонтаж + электрика + сантехника + стены + полы + потолки',
  },
  house_build: {
    title: 'Строительство дома (от грунта)',
    icon: '🏗️',
    includes: ['earth', 'foundation', 'masonry', 'concrete', 'roof', 'facade', 'windows', 'insulation', 'electric', 'plumbing', 'heating', 'wall_finish', 'floors', 'ceilings'],
    description: 'Полный цикл: грунт → фундамент → стены → крыша → инженерия → отделка',
  },
  facade_renovation: {
    title: 'Ремонт фасада',
    icon: '🏢',
    includes: ['facade', 'insulation'],
    description: 'Утепление + штукатурка + покраска фасада',
  },
  bathroom: {
    title: 'Ремонт санузла',
    icon: '🚿',
    includes: ['demolition', 'plumbing', 'electric', 'floors', 'wall_finish', 'ceilings'],
    description: 'Демонтаж + сантехника + электрика + плитка + потолок',
  },
  engineering: {
    title: 'Инженерные системы',
    icon: '⚡',
    includes: ['electric', 'plumbing', 'heating', 'hvac', 'gas'],
    description: 'Электрика + сантехника + отопление + вентиляция + газ',
  },
  turnkey: {
    title: 'Ремонт под ключ + мебель',
    icon: '🔑',
    includes: ['demolition', 'electric', 'plumbing', 'heating', 'wall_finish', 'floors', 'ceilings', 'windows', 'interior'],
    description: 'Полный ремонт квартиры с мебелью и техникой',
  },
};


// ═══ ПРАВИЛА ФИЛЬТРАЦИИ ПО ТЕГАМ ═══
const TAG_RULES = {
  masonry: {
    // По умолчанию газоблоки; при ключевых словах "кирпич" → кирпич
    default: 'gazoblock',
    keywords: {
      'кирпич': 'brick',
      'облицов': 'brick',
      'газобетон': 'gazoblock',
      'газоблок': 'gazoblock',
      'пеноблок': 'gazoblock',
    }
  },
  wall_finish: {
    default: 'paint',
    keywords: {
      'обои': 'wallpaper',
      'оклейк': 'wallpaper',
      'покрас': 'paint',
      'краск': 'paint',
    }
  },
  floors: {
    default: 'laminate',
    keywords: {
      'плитк': 'tile',
      'керамо': 'tile',
      'кафель': 'tile',
      'ванн': 'tile',
      'санузел': 'tile',
      'ламинат': 'laminate',
      'парке': 'laminate',
      'линоле': 'laminate',
    }
  },
  windows: {
    default: null, // все включены
    keywords: {
      'демонтаж': 'demo',
    }
  }
};


/**
 * Фильтрует позиции по тегам на основе описания
 */
function filterItemsByDescription(items, description, categoryId) {
  const rules = TAG_RULES[categoryId];
  if (!rules) return items; // нет правил → все позиции

  const lower = (description || '').toLowerCase();
  
  // Определяем какой тег активен
  let activeTag = rules.default;
  for (const [keyword, tag] of Object.entries(rules.keywords || {})) {
    if (lower.includes(keyword)) {
      activeTag = tag;
      break;
    }
  }

  if (!activeTag) return items; // null default = все включены

  // Фильтруем: оставляем позиции без тега + позиции с нужным тегом
  return items.filter(item => !item.tag || item.tag === activeTag);
}


/**
 * Генерирует детализированную смету v2
 */
export function generateDetailedEstimate({
  categoryId,
  area = 25,
  description = '',
  scenario = 'standard',
  regionCoeff = 1.0,
  perimeter = 0,
  categoryTitle = '',
}) {
  // Проверка: комплексный объект?
  const complexTemplate = COMPLEX_TEMPLATES[categoryId];
  if (complexTemplate) {
    return _generateComplexEstimate({
      complexId: categoryId,
      area, description, scenario, regionCoeff, perimeter,
    });
  }

  const template = ESTIMATE_TEMPLATES[categoryId];
  if (!template) {
    return _fallbackEstimate(categoryTitle || categoryId, area, scenario, regionCoeff);
  }

  const scenarioData = SCENARIO_COEFFICIENTS[scenario] || SCENARIO_COEFFICIENTS.standard;
  const sc = scenarioData.coeff;
  const lower = (description || '').toLowerCase();

  // Фильтруем позиции по описанию (убираем дубли кирпич/газоблок, покраска/обои)
  const filteredItems = filterItemsByDescription(template.items, description, categoryId);

  // Пропускаем демонтаж если не просили (кроме категории demolition)
  const needsDemo = /демонтаж|снос|разбор|убрать/i.test(lower);
  const estimatedArea = area > 0 ? area : _extractAreaFromText(lower) || 25;

  const items = [];
  let worksCost = 0;
  let materialsCost = 0;
  const groups = new Map();
  const marketplaceMaterials = []; // для связки с маркетплейсом

  for (const tpl of filteredItems) {
    if (tpl.group === 'Демонтаж' && !needsDemo && categoryId !== 'demolition') continue;
    if (tpl.tag === 'demo' && !needsDemo) continue;

    const qty = Math.max(0.1, Math.round(tpl.baseQtyPer * estimatedArea * 100) / 100);
    const price = Math.round(tpl.unitPrice * sc * regionCoeff);
    const total = Math.round(qty * price);

    const item = {
      name: tpl.name,
      group: tpl.group,
      unit: tpl.unit,
      volume: qty,
      unit_price: price,
      total: total,
      isMaterial: tpl.isMaterial || false,
    };
    items.push(item);

    if (tpl.isMaterial) {
      materialsCost += total;
      if (tpl.marketplaceCategory) {
        marketplaceMaterials.push({
          name: tpl.name,
          category: tpl.marketplaceCategory,
          searchQuery: tpl.searchQuery || tpl.name,
          qty,
          unit: tpl.unit,
          estimatedPrice: total,
        });
      }
    } else {
      worksCost += total;
    }

    if (!groups.has(tpl.group)) groups.set(tpl.group, []);
    groups.get(tpl.group).push(item);
  }

  // Непредвиденные (5%)
  const contingency = Math.round((worksCost + materialsCost) * 0.05);
  items.push({
    name: 'Непредвиденные расходы (5%)',
    group: 'Итого',
    unit: '₸',
    volume: 1,
    unit_price: contingency,
    total: contingency,
    isMaterial: false,
  });
  worksCost += contingency;

  const total = worksCost + materialsCost;
  const pricePerM2 = estimatedArea > 0 ? Math.round(total / estimatedArea) : 0;
  const worksPercent = total > 0 ? Math.round(worksCost / total * 100) : 0;
  const materialsPercent = total > 0 ? Math.round(materialsCost / total * 100) : 0;
  const timelineDays = Math.max(3, Math.round(estimatedArea / 5));

  const aiInsights = [
    `Расчёт по категории: ${template.title}, площадь ${estimatedArea} м²`,
    `Сценарий: ${scenarioData.label} (x${sc})`,
    `Региональный коэффициент: x${regionCoeff}`,
    `Работы: ${worksCost.toLocaleString('ru-RU')} | Материалы: ${materialsCost.toLocaleString('ru-RU')}`,
    `Ориентировочные сроки: ${timelineDays} раб. дней`,
    `Стоимость за 1 м²: ${pricePerM2.toLocaleString('ru-RU')} тг`,
  ];
  if (perimeter > 0) aiInsights.push(`Периметр контура: ${perimeter} м`);
  if (description.trim()) aiInsights.push(`Описание учтено (умный подбор позиций)`);

  return {
    items,
    worksCost,
    materialsCost,
    total,
    pricePerM2,
    worksPercent,
    materialsPercent,
    timelineDays,
    groups: Object.fromEntries(groups),
    aiInsights,
    scenarioLabel: scenarioData.label,
    itemCount: items.length,
    marketplaceMaterials,
    area: estimatedArea,
  };
}


/**
 * Генерирует комплексную смету (несколько категорий)
 */
function _generateComplexEstimate({ complexId, area, description, scenario, regionCoeff, perimeter }) {
  const complex = COMPLEX_TEMPLATES[complexId];
  if (!complex) return _fallbackEstimate(complexId, area, scenario, regionCoeff);

  let allItems = [];
  let totalWorks = 0;
  let totalMaterials = 0;
  let allMarketplace = [];

  for (const catId of complex.includes) {
    const sub = generateDetailedEstimate({
      categoryId: catId,
      area,
      description,
      scenario,
      regionCoeff,
      perimeter,
    });

    // Добавляем разделитель группы
    const sectionHeader = {
      name: `═══ ${ESTIMATE_TEMPLATES[catId]?.title || catId} ═══`,
      group: `${ESTIMATE_TEMPLATES[catId]?.title || catId}`,
      unit: '',
      volume: 0,
      unit_price: 0,
      total: 0,
      isMaterial: false,
      isSection: true,
    };
    allItems.push(sectionHeader);
    
    // Убираем "непредвиденные" из каждой подкатегории (добавим общие)
    const subItems = sub.items.filter(i => i.group !== 'Итого');
    allItems = allItems.concat(subItems);
    
    totalWorks += sub.worksCost;
    totalMaterials += sub.materialsCost;
    allMarketplace = allMarketplace.concat(sub.marketplaceMaterials || []);
  }

  // Общие непредвиденные (5%)
  const contingency = Math.round((totalWorks + totalMaterials) * 0.05);
  allItems.push({
    name: 'Непредвиденные расходы (5% от общей суммы)',
    group: 'ИТОГО',
    unit: '₸',
    volume: 1,
    unit_price: contingency,
    total: contingency,
    isMaterial: false,
  });
  totalWorks += contingency;

  const total = totalWorks + totalMaterials;
  const scenarioData = SCENARIO_COEFFICIENTS[scenario] || SCENARIO_COEFFICIENTS.standard;
  const pricePerM2 = area > 0 ? Math.round(total / area) : 0;

  return {
    items: allItems,
    worksCost: totalWorks,
    materialsCost: totalMaterials,
    total,
    pricePerM2,
    worksPercent: total > 0 ? Math.round(totalWorks / total * 100) : 0,
    materialsPercent: total > 0 ? Math.round(totalMaterials / total * 100) : 0,
    timelineDays: Math.max(7, Math.round(area / 3)),
    groups: {},
    aiInsights: [
      `Комплексный расчёт: ${complex.title}`,
      `${complex.includes.length} этапов: ${complex.description}`,
      `Сценарий: ${scenarioData.label} (x${scenarioData.coeff})`,
      `Региональный коэффициент: x${regionCoeff}`,
      `Работы: ${totalWorks.toLocaleString('ru-RU')} | Материалы: ${totalMaterials.toLocaleString('ru-RU')}`,
      `Стоимость за 1 м²: ${pricePerM2.toLocaleString('ru-RU')} тг`,
      `Ориентировочные сроки: ${Math.max(7, Math.round(area / 3))} раб. дней`,
    ],
    scenarioLabel: scenarioData.label,
    itemCount: allItems.length,
    marketplaceMaterials: allMarketplace,
    area,
    isComplex: true,
    complexTitle: complex.title,
  };
}


function _extractAreaFromText(text) {
  const m2Match = text.match(/(\d+[\.,]?\d*)\s*м[²2]/i);
  if (m2Match) return parseFloat(m2Match[1].replace(',', '.'));
  const dimMatch = text.match(/(\d+[\.,]?\d*)\s*[xXхна*]\s*(\d+[\.,]?\d*)/);
  if (dimMatch) return parseFloat(dimMatch[1].replace(',', '.')) * parseFloat(dimMatch[2].replace(',', '.'));
  const areaWord = text.match(/площад\w*\s+(\d+[\.,]?\d*)/);
  if (areaWord) return parseFloat(areaWord[1].replace(',', '.'));
  return null;
}

function _fallbackEstimate(title, area, scenario, regionCoeff) {
  const sc = (SCENARIO_COEFFICIENTS[scenario] || SCENARIO_COEFFICIENTS.standard).coeff;
  const baseRate = 5000;
  const worksCost = Math.round(baseRate * area * sc * regionCoeff);
  const materialsCost = Math.round(worksCost * 0.75);
  const total = worksCost + materialsCost;
  return {
    items: [
      { name: `${title} - комплекс СМР`, group: 'Работы', unit: 'м²', volume: area, unit_price: Math.round(baseRate * sc * regionCoeff), total: worksCost, isMaterial: false },
      { name: 'Материалы (базовый комплект)', group: 'Материалы', unit: 'компл', volume: 1, unit_price: materialsCost, total: materialsCost, isMaterial: true },
    ],
    worksCost, materialsCost, total,
    pricePerM2: area > 0 ? Math.round(total / area) : 0,
    worksPercent: 57, materialsPercent: 43,
    timelineDays: Math.max(3, Math.round(area / 8)),
    groups: {},
    aiInsights: [`Расчёт по базовой ставке ${baseRate.toLocaleString()} тг/м²`],
    scenarioLabel: 'Стандарт',
    itemCount: 2,
    marketplaceMaterials: [],
    area,
  };
}
