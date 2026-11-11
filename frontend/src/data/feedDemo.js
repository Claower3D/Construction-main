// Демо-данные ленты заказов и техники рядом (раньше были вписаны прямо в разметку
// FeaturePageModule, причём блок техники — дважды). На карточках стоит метка «Демо».

export const DEMO_FEED_ORDERS = [
  {
    id: 'ORD-901',
    title: 'Капитальный ремонт бизнес-центра 1200 м²',
    city: 'Алматы',
    budget: 42000000,
    category: 'Коммерческая отделка',
    tone: 'amber',
    minutesAgo: 5,
    contractor: '',
    stages: [
      {
        name: 'Демонтаж и вывоз строительного мусора',
        machinery: [
          { name: 'Самосвал Shacman F3000 (25 т)', photo: '/assets/machinery/shacman_dump_truck.jpg', rate: '18 000 ₸/час', dist: '1,4 км' },
          { name: 'Мини-погрузчик Bobcat S530', photo: '/assets/machinery/bobcat_skid_steer.jpg', rate: '14 000 ₸/час', dist: '1,6 км' },
        ],
      },
      {
        name: 'Монтаж фасадных панелей и остекление',
        machinery: [
          { name: 'Автовышка Hyundai HD78 (28 м)', photo: '/assets/machinery/hyundai_cherry_picker.jpg', rate: '18 000 ₸/час', dist: '2,0 км' },
          { name: 'Телескопический погрузчик Manitou MT 1840', photo: '/assets/machinery/manitou_telehandler.jpg', rate: '24 000 ₸/час', dist: '2,3 км' },
        ],
      },
    ],
  },
  {
    id: 'ORD-902',
    title: 'Строительство монолитного каркаса коттеджа 320 м²',
    city: 'Астана',
    budget: 14800000,
    category: 'Монолит',
    tone: 'cyan',
    minutesAgo: 18,
    contractor: '',
    stages: [
      {
        name: 'Земляные работы и разработка котлована',
        machinery: [
          { name: 'Гусеничный экскаватор Hitachi ZX240', photo: '/assets/machinery/hitachi_excavator.jpg', rate: '25 000 ₸/час', dist: '1,8 км' },
          { name: 'Бульдозер CAT D6R', photo: '/assets/machinery/cat_bulldozer.jpg', rate: '32 000 ₸/час', dist: '2,2 км' },
        ],
      },
      {
        name: 'Заливка монолитного фундамента и плиты',
        machinery: [
          { name: 'Автобетононасос Putzmeister 38 м', photo: '/assets/machinery/concrete_pump.jpg', rate: '40 000 ₸/час', dist: '1,9 км' },
          { name: 'Автобетоносмеситель КАМАЗ 6520', photo: '/assets/machinery/kamaz_concrete_mixer.jpg', rate: '15 000 ₸/рейс', dist: '1,4 км' },
        ],
      },
    ],
  },
  {
    id: 'ORD-903',
    title: 'Монтаж приточно-вытяжной вентиляции (HVAC)',
    city: 'Караганда',
    budget: 8500000,
    category: 'Инженерия',
    tone: 'violet',
    minutesAgo: 45,
    contractor: 'ТОО «ВентСтрой KZ»',
    stages: [
      {
        name: 'Доставка и подъём вентиляционных установок',
        machinery: [
          { name: 'Кран-манипулятор КАМАЗ 65117 (КМУ 7 т)', photo: '/assets/machinery/kamaz_manipulator.jpg', rate: '20 000 ₸/час', dist: '1,8 км' },
          { name: 'Дизель-генератор SDMO 100 кВт', photo: '/assets/machinery/diesel_generator_sdmo.jpg', rate: '12 000 ₸/час', dist: '1,5 км' },
        ],
      },
    ],
  },
  {
    id: 'ORD-904',
    title: 'Асфальтирование и благоустройство территории ЖК',
    city: 'Шымкент',
    budget: 7200000,
    category: 'Дорожные работы',
    tone: 'orange',
    minutesAgo: 60,
    contractor: '',
    stages: [
      {
        name: 'Планировка основания и укладка асфальта',
        machinery: [
          { name: 'Асфальтоукладчик Vogele Super 1800-3', photo: '/assets/machinery/asphalt_paver_vogele.jpg', rate: '48 000 ₸/час', dist: '2,5 км' },
          { name: 'Каток дорожный Bomag 14 т', photo: '/assets/machinery/road_roller_bomag.jpg', rate: '18 000 ₸/час', dist: '1,9 км' },
          { name: 'Автогрейдер XCMG GR215', photo: '/assets/machinery/motor_grader_xcmg.jpg', rate: '22 000 ₸/час', dist: '2,7 км' },
        ],
      },
    ],
  },
];

export const DEMO_NEARBY_EQUIPMENT = [
  { id: 1, title: 'Гусеничный экскаватор Hitachi ZX240', price: 25000, unit: 'час', dist: '1,8 км', image: '/assets/machinery/hitachi_excavator.jpg', crew: 'С оператором' },
  { id: 5, title: 'Автокран XCMG QY25K5, 25 т', price: 28000, unit: 'час', dist: '2,4 км', image: '/assets/machinery/xcmg_mobile_crane.jpg', crew: 'С крановщиком' },
  { id: 18, title: 'Самосвал Shacman F3000, 25 т', price: 18000, unit: 'час', dist: '3,1 км', image: '/assets/machinery/shacman_dump_truck.jpg', crew: 'С водителем' },
  { id: 10, title: 'Экскаватор-погрузчик JCB 3CX Super', price: 18000, unit: 'час', dist: '1,4 км', image: '/assets/machinery/jcb_backhoe_loader.jpg', crew: 'С оператором' },
];
