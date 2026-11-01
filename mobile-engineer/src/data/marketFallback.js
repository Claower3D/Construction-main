// Offline fallback for the marketplace — DEMO positions with indicative prices.
// Shown only when the server is unreachable and always marked «ДЕМО» in the UI.
export const FALLBACK_MATERIALS = [
  { id: 'demo-m1', code: '', category: 'ЖБИ и люки', name: 'Кольцо ЖБИ КС-15.9 (1.5 м)', price: 28000, unit: 'шт' },
  { id: 'demo-m2', code: '', category: 'ЖБИ и люки', name: 'Кольцо ЖБИ КС-20.9 (2.0 м)', price: 42000, unit: 'шт' },
  { id: 'demo-m3', code: '', category: 'ЖБИ и люки', name: 'Плита перекрытия ПП-15', price: 26000, unit: 'шт' },
  { id: 'demo-m4', code: '', category: 'ЖБИ и люки', name: 'Плита перекрытия ПП-20', price: 38000, unit: 'шт' },
  { id: 'demo-m5', code: '', category: 'ЖБИ и люки', name: 'Люк полимерно-песчаный 6 т', price: 14000, unit: 'шт' },
  { id: 'demo-m6', code: '', category: 'ЖБИ и люки', name: 'Люк чугунный тип Т (25 т)', price: 32000, unit: 'шт' },
  { id: 'demo-m7', code: '', category: 'Трубы', name: 'Труба канализационная наружная 110 (2 м)', price: 4200, unit: 'шт' },
  { id: 'demo-m8', code: '', category: 'Трубы', name: 'Труба канализационная наружная 110 (3 м)', price: 6100, unit: 'шт' },
  { id: 'demo-m9', code: '', category: 'Трубы', name: 'Отвод ПВХ 110 / 45°', price: 1200, unit: 'шт' },
  { id: 'demo-m10', code: '', category: 'Трубы', name: 'Тройник ПВХ 110 / 110 / 45°', price: 2400, unit: 'шт' },
  { id: 'demo-m11', code: '', category: 'Инертные', name: 'Щебень фракция 20–40 (самосвал 10 т)', price: 45000, unit: 'рейс' },
  { id: 'demo-m12', code: '', category: 'Инертные', name: 'Песок мытый карьерный (10 т)', price: 38000, unit: 'рейс' },
  { id: 'demo-m13', code: '', category: 'Расходники', name: 'Мастика битумная гидроизоляционная (20 л)', price: 12500, unit: 'ведро' },
  { id: 'demo-m14', code: '', category: 'Расходники', name: 'Цемент М400 (мешок 50 кг)', price: 2800, unit: 'мешок' }
];

export const FALLBACK_EQUIPMENT = [
  { id: 'demo-e1', name: 'Экскаватор-погрузчик', category: 'Землеройная техника', city: 'Караганда', status: 'Доступен', pricePerHour: 12000, pricePerDay: 95000, ownerName: '', ownerPhone: '', plateNumber: '', capacity: 'ковш 1 м³', rating: 0, reviewsCount: 0, image: '' },
  { id: 'demo-e2', name: 'Манипулятор 10 т', category: 'Грузоподъёмная техника', city: 'Караганда', status: 'Доступен', pricePerHour: 15000, pricePerDay: 110000, ownerName: '', ownerPhone: '', plateNumber: '', capacity: '10 т', rating: 0, reviewsCount: 0, image: '' },
  { id: 'demo-e3', name: 'Самосвал 25 т', category: 'Грузовой транспорт', city: 'Астана', status: 'Доступен', pricePerHour: 10000, pricePerDay: 80000, ownerName: '', ownerPhone: '', plateNumber: '', capacity: '25 т', rating: 0, reviewsCount: 0, image: '' }
];
