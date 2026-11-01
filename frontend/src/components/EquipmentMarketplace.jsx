import React, { useState, useMemo, useEffect } from 'react';
import { getBalanceKZT, freezeEscrow, topupBalance } from '../services/walletEngine';
import { createPlatformOrder } from '../services/orderSyncService';
import { localDateKey, authHeaders, jsonAuthHeaders, getAuthToken, responseError } from '../services/platformUtils';
import './EquipmentMarketplace.css';
import './marketplace-refresh.css';

// ── Спецтехника с сервера: GET /api/v1/equipment?category=&city=&q= ──
const EQ_CATEGORY_API = { earth: 'землерой', lift: 'грузоподъ', loader: 'погруз', road: 'дорож', concrete: 'бетон', transport: 'самосвал', drill: 'буров', power: 'энерг' };
const EQ_CITY_API = { almaty: 'Алматы', astana: 'Астана', shymkent: 'Шымкент', karaganda: 'Караганда' };
const EQ_CATEGORY_OPTIONS = [
  'Землеройная техника', 'Грузоподъемная техника', 'Погрузчики', 'Дорожная техника',
  'Бетонное оборудование', 'Самосвалы и тягачи', 'Буровое оборудование', 'Энергетика и генераторы',
];
const EQ_PLACEHOLDER_IMG = '/assets/machinery/hitachi_excavator.jpg';
function eqCategoryKey(name) {
  const c = String(name || '').toLowerCase();
  if (c.includes('грузо') || c.includes('кран')) return 'lift';
  if (c.includes('погруз')) return 'loader';
  if (c.includes('бетон')) return 'concrete';
  if (c.includes('самосвал') || c.includes('транспорт') || c.includes('тягач')) return 'transport';
  if (c.includes('бур')) return 'drill';
  if (c.includes('дорож')) return 'road';
  if (c.includes('энерг') || c.includes('генератор')) return 'power';
  return 'earth';
}
const EQ_CATEGORY_LABEL = { earth: 'Землеройная', lift: 'Подъёмная', loader: 'Погрузчик', road: 'Дорожная', concrete: 'Бетон и раствор', transport: 'Транспорт', drill: 'Буровая', power: 'Энергетика' };
function mapServerEquipment(e) {
  const price = Math.round(Number(e.pricePerDay) || 0);
  const city = e.city || '';
  const available = !e.status || /доступ|свобод/i.test(e.status);
  const tags = [];
  if (Number(e.pricePerHour) > 0) tags.push({ type: 'hourly', label: `${Math.round(e.pricePerHour).toLocaleString('ru-RU')} ₸ / час`, icon: '⏱️' });
  if (e.capacity) tags.push({ type: 'capacity', label: e.capacity, icon: '⚖️' });
  if (e.plateNumber) tags.push({ type: 'plate', label: e.plateNumber, icon: '🔖' });
  if (city) tags.push({ type: 'location', label: city });
  return {
    id: e.id,
    category: e.category ? eqCategoryKey(e.category) : 'other',
    categoryName: e.category || 'Без категории',
    image: e.image || EQ_PLACEHOLDER_IMG,
    backupImage: EQ_PLACEHOLDER_IMG,
    title: e.name,
    rawPrice: price,
    price: price ? price.toLocaleString('ru-RU') : '',
    unit: 'смена',
    tariffType: 'shift',
    city: city.toLowerCase(),
    cityName: city,
    status: e.status || '',
    availableToday: available,
    hasOperator: true,
    hasDelivery: true,
    ownerName: e.ownerName || '',
    ownerPhone: e.ownerPhone || '',
    plateNumber: e.plateNumber || '',
    rating: Number(e.rating) > 0 ? Number(e.rating) : null,
    reviewsCount: Number(e.reviewsCount) || 0,
    distanceKm: typeof e.distanceKm === 'number' && e.distanceKm > 0 ? e.distanceKm : null,
    isServer: true,
    tags,
  };
}

export default function EquipmentMarketplace({ onBack, hideHeader = false }) {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tariff, setTariff] = useState('all'); // 'all' | 'hourly' | 'shift' | 'trip'
  const [location, setLocation] = useState('all');
  const [radius, setRadius] = useState(100);
  const [freeToday, setFreeToday] = useState(false);
  const [withOperator, setWithOperator] = useState(false);
  const [delivery, setDelivery] = useState('all'); // 'all' | 'yes' | 'no'
  const [priceMax, setPriceMax] = useState(100000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Interactive Modal state
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingDays, setBookingDays] = useState(1);
  const [bookingDate, setBookingDate] = useState(() => localDateKey());
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('escrow'); // 'escrow' | 'kaspi' | 'invoice'
  const [bookingClientName, setBookingClientName] = useState('Заказчик');
  const [bookingClientPhone, setBookingClientPhone] = useState('+7 (707) 888-99-00');
  const [bookingAddress, setBookingAddress] = useState('г. Алматы, строительный объект');
  const [walletBalance, setWalletBalance] = useState(() => getBalanceKZT());
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price_asc' | 'price_desc' | 'rating_desc'
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [eqApi, setEqApi] = useState({ status: 'loading', items: [], error: null });
  const [eqReload, setEqReload] = useState(0);
  // Размещение техники (POST /api/v1/equipment, нужен серверный JWT)
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [placeForm, setPlaceForm] = useState({ name: '', category: EQ_CATEGORY_OPTIONS[0], pricePerDay: '', pricePerHour: '', city: 'Алматы', plateNumber: '', capacity: '', ownerPhone: '' });
  const [placeError, setPlaceError] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);
  
  useEffect(() => {
    setWalletBalance(getBalanceKZT());
  }, [bookingItem]);
  const [toastMessage, setToastMessage] = useState(null);

  const topTabs = [
    { id: 'marketplace', label: '🏪 Маркетплейс' },
    { id: 'fleet', label: '🚜 Мой парк' },
    { id: 'ads', label: '📄 Мои объявления' },
    { id: 'rentals', label: '📦 Мои аренды' }
  ];

  const categoryChips = [
    { id: 'all', label: '🪄 Все категории' },
    { id: 'earth', label: '⛏️ Землеройная' },
    { id: 'lift', label: '🏗️ Подъёмная' },
    { id: 'loader', label: '🚜 Погрузчики' },
    { id: 'road', label: '🛣️ Дорожная' },
    { id: 'concrete', label: '🧱 Бетон/раствор' },
    { id: 'transport', label: '🚚 Транспорт' },
    { id: 'drill', label: '⛑️ Буровая' },
    { id: 'power', label: '⚡ Энергетика' }
  ];

  const fullEquipmentList = [
    // Землеройная (earth)
    {
      id: 1,
      category: 'earth',
      image: '/assets/machinery/hitachi_excavator.jpg',
      backupImage: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80',
      distanceKm: 1.6,
      title: 'Гусеничный экскаватор Hitachi ZX240, 24 т, 1 м³, 6.7 м',
      rawPrice: 25000,
      price: '25 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 2,
      category: 'earth',
      image: '/assets/machinery/jcb_wheeled_excavator.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.0,
      title: 'Колёсный экскаватор JCB JS160W, 17 т, 0.9 м³',
      rawPrice: 22000,
      price: '22 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 3,
      category: 'earth',
      image: '/assets/machinery/kubota_mini_excavator.jpg',
      backupImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.4,
      title: 'Мини-экскаватор Kubota U-35, 3.5 т, ковш 0.15 м³',
      rawPrice: 12000,
      price: '12 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'shymkent',
      hasOperator: false,
      hasDelivery: false,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'delivery', label: 'Самовывоз', icon: '📦' },
        { type: 'location', label: 'Шымкент' }
      ]
    },
    {
      id: 4,
      category: 'earth',
      image: '/assets/machinery/cat_bulldozer.jpg',
      backupImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.8,
      title: 'Тяжелый бульдозер CAT D6R, 20 т, отвал 3.8 м',
      rawPrice: 32000,
      price: '32 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Караганда' }
      ]
    },

    // Подъёмная (lift)
    {
      id: 5,
      category: 'lift',
      image: '/assets/machinery/xcmg_mobile_crane.jpg',
      backupImage: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
      distanceKm: 3.2,
      title: 'Автокран XCMG QY25K5, 25 т, стрела 39.5 м + гусек',
      rawPrice: 28000,
      price: '28 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Бесплатная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 6,
      category: 'lift',
      image: '/assets/machinery/hyundai_cherry_picker.jpg',
      backupImage: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
      distanceKm: 3.6,
      title: 'Автовышка телескопическая Hyundai HD78, 28 м, 300 кг',
      rawPrice: 18000,
      price: '18 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 7,
      category: 'lift',
      image: '/assets/machinery/liebherr_tower_crane.jpg',
      backupImage: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.0,
      title: 'Башенный кран Liebherr 130 EC-B, 8 т, стрела 60 м',
      rawPrice: 55000,
      price: '55 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С крановщиком', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 8,
      category: 'lift',
      image: '/assets/machinery/kamaz_manipulator.jpg',
      backupImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.4,
      title: 'Кран-манипулятор КАМАЗ 65117 (КМУ 7 т, борт 12 т)',
      rawPrice: 20000,
      price: '20 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'shymkent',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С водитель-оператором', icon: '👷' },
        { type: 'location', label: 'Шымкент' }
      ]
    },

    // Погрузчики (loader)
    {
      id: 9,
      category: 'loader',
      image: '/assets/machinery/xcmg_wheel_loader.jpg',
      backupImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.8,
      title: 'Фронтальный погрузчик XCMG ZL50G, 5 т, 3.2 м³',
      rawPrice: 16000,
      price: '16 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 10,
      category: 'loader',
      image: '/assets/machinery/jcb_backhoe_loader.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
      distanceKm: 5.2,
      title: 'Экскаватор-погрузчик JCB 3CX Super, равноколёсный',
      rawPrice: 18000,
      price: '18 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 11,
      category: 'loader',
      image: '/assets/machinery/bobcat_skid_steer.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      distanceKm: 5.6,
      title: 'Мини-погрузчик Bobcat S530 + гидромолот / щётка',
      rawPrice: 14000,
      price: '14 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: false,
      hasDelivery: false,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'delivery', label: 'Самовывоз', icon: '📦' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 12,
      category: 'loader',
      image: '/assets/machinery/manitou_telehandler.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      distanceKm: 1.2,
      title: 'Телескопический погрузчик Manitou MT 1840 (18 м, 4 т)',
      rawPrice: 24000,
      price: '24 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Караганда' }
      ]
    },

    // Дорожная (road)
    {
      id: 13,
      category: 'road',
      image: '/assets/machinery/road_roller_bomag.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
      distanceKm: 1.6,
      title: 'Каток дорожный XCMG XS143J, 14 т, 2.1 м',
      rawPrice: 18000,
      price: '18 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Караганда' }
      ]
    },
    {
      id: 14,
      category: 'road',
      image: '/assets/machinery/motor_grader_xcmg.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.0,
      title: 'Грейдер XCMG GR215, 4.3 м, рыхлитель',
      rawPrice: 22000,
      price: '22 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 15,
      category: 'road',
      image: '/assets/machinery/asphalt_paver_vogele.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.4,
      title: 'Асфальтоукладчик Vogele Super 1800-3 (ширина 9 м)',
      rawPrice: 48000,
      price: '48 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С бригадой', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },

    // Бетон/раствор (concrete)
    {
      id: 16,
      category: 'concrete',
      image: '/assets/machinery/concrete_pump.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
      distanceKm: 2.8,
      title: 'Автобетононасос Putzmeister 38m, подача 160 м³/ч',
      rawPrice: 40000,
      price: '40 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 17,
      category: 'concrete',
      image: '/assets/machinery/kamaz_concrete_mixer.jpg',
      backupImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
      distanceKm: 3.2,
      title: 'Автобетоносмеситель КАМАЗ 6520 (миксер 10 м³)',
      rawPrice: 15000,
      price: '15 000',
      unit: 'рейс',
      tariffType: 'trip',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Рейс', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Транспорт (transport)
    {
      id: 18,
      category: 'transport',
      image: '/assets/machinery/shacman_dump_truck.jpg',
      backupImage: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
      distanceKm: 3.6,
      title: 'Самосвал Shacman F3000, 25 т, объём 20 м³',
      rawPrice: 18000,
      price: '18 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С водителем', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 19,
      category: 'transport',
      image: '/assets/machinery/heavy_lowbed_trailer.jpg',
      backupImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.0,
      title: 'Трал низкорамный FAYMONVILLE (60 т, аппарели)',
      rawPrice: 42000,
      price: '42 000',
      unit: 'рейс',
      tariffType: 'trip',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Рейс', icon: '🚚' },
        { type: 'operator', label: 'С водителем', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Буровая (drill)
    {
      id: 20,
      category: 'drill',
      image: '/assets/machinery/auger_drilling_truck.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.4,
      title: 'Ямобур / АБКМ на базе КАМАЗ 43114 (бурение до 12 м)',
      rawPrice: 28000,
      price: '28 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С бурильщиком', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 21,
      category: 'drill',
      image: '/assets/machinery/bauer_piling_rig.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80',
      distanceKm: 4.8,
      title: 'Буровая сваебойная установка Bauer BG 28 (сваи до 40 м)',
      rawPrice: 95000,
      price: '95 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'operator', label: 'С экипажем', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Энергетика (power)
    {
      id: 22,
      category: 'power',
      image: '/assets/machinery/diesel_generator_sdmo.jpg',
      backupImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
      distanceKm: 5.2,
      title: 'Генератор дизельный SDMO 100 кВт, шумозащитный',
      rawPrice: 12000,
      price: '12 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'almaty',
      hasOperator: false,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 23,
      category: 'power',
      image: '/assets/machinery/air_compressor_atlas.jpg',
      backupImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      distanceKm: 5.6,
      title: 'Компрессор дизельный Atlas Copco XAS 97 (5.3 м³/мин)',
      rawPrice: 14000,
      price: '14 000',
      unit: 'час',
      tariffType: 'hourly',
      city: 'astana',
      hasOperator: false,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: '1 час', icon: '🔄' },
        { type: 'delivery', label: 'Доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    }
  ];

  // Load custom registered equipment from executor registrations
  const [customList, setCustomList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qazgost_custom_equipment') || '[]');
    } catch(e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('qazgost_custom_equipment') || '[]');
      setCustomList(items);
    } catch (e) {}
  }, [activeTab]);

  // Загрузка каталога спецтехники с сервера (фильтры категории/города/поиска — на сервере)
  useEffect(() => {
    let cancelled = false;
    setEqApi(s => ({ ...s, status: 'loading', error: null }));
    const params = new URLSearchParams();
    if (EQ_CATEGORY_API[category]) params.set('category', EQ_CATEGORY_API[category]);
    if (EQ_CITY_API[location]) params.set('city', EQ_CITY_API[location]);
    if (debouncedQuery) params.set('q', debouncedQuery);
    fetch(`/api/v1/equipment${params.toString() ? `?${params}` : ''}`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(await responseError(res));
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : null);
        if (!list) throw new Error('Некорректный ответ сервера');
        if (!cancelled) setEqApi({ status: 'ready', items: list.filter(e => e && e.id && e.name).map(mapServerEquipment), error: null });
      })
      .catch((e) => { if (!cancelled) setEqApi({ status: 'error', items: [], error: e.message || 'Сеть недоступна' }); });
    return () => { cancelled = true; };
  }, [category, location, debouncedQuery, eqReload]);

  const eqApiMode = eqApi.status !== 'error';

  const combinedEquipment = useMemo(() => {
    // Сервер доступен → только реальные объявления; демо-список — лишь при недоступности API
    if (eqApiMode) return eqApi.items;
    const formattedCustom = customList.map(c => {
      let catKey = 'earth';
      const cCat = (c.category || '').toLowerCase();
      if (cCat.includes('грузо') || cCat.includes('кран')) catKey = 'lift';
      else if (cCat.includes('погруз')) catKey = 'loader';
      else if (cCat.includes('бетон')) catKey = 'concrete';
      else if (cCat.includes('самосвал') || cCat.includes('транспорт')) catKey = 'transport';
      else if (cCat.includes('бур')) catKey = 'drill';
      else if (cCat.includes('дорож')) catKey = 'road';

      return {
        id: c.id,
        category: catKey,
        image: c.image || '/assets/machinery/hitachi_excavator.jpg',
        backupImage: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80',
        distanceKm: null,
        isDemo: true,
        title: `${c.name} (${c.ownerName || 'Частный владелец'})`,
        rawPrice: c.pricePerDay || 95000,
        price: (c.pricePerDay || 95000).toLocaleString(),
        unit: 'смена',
        tariffType: 'shift',
        city: (c.city || 'almaty').toLowerCase(),
        hasOperator: true,
        hasDelivery: true,
        availableToday: true,
        isRegisteredExecutor: true,
        ownerPhone: c.ownerPhone,
        plateNumber: c.plateNumber,
        tags: [
          { type: 'shift', label: '1 смена', icon: '⏱️' },
          { type: 'operator', label: 'С водителем', icon: '👷' },
          { type: 'location', label: c.city || 'Алматы' }
        ]
      };
    });

    return [...formattedCustom, ...fullEquipmentList.map(e => ({ ...e, isDemo: true, distanceKm: null }))];
  }, [customList, eqApiMode, eqApi.items]);

  // Real-time Dynamic Filtering Engine
  const filteredEquipment = useMemo(() => {
    return combinedEquipment.filter(item => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      // 2. Category Filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }

      // 3. Tariff Filter
      if (tariff !== 'all' && item.tariffType !== tariff) {
        return false;
      }

      // 4. Location Filter
      if (location !== 'all' && item.city !== location) {
        return false;
      }

      // 5. Available Today Checkbox
      if (freeToday && !item.availableToday) {
        return false;
      }

      // 6. With Operator Checkbox
      if (withOperator && !item.hasOperator) {
        return false;
      }

      // 7. Delivery Radio Option
      if (delivery === 'yes' && !item.hasDelivery) return false;
      if (delivery === 'no' && item.hasDelivery) return false;

      // 8. Price Slider Filter (100 000 = «без лимита»; позиции «цена по запросу» не скрываем)
      if (priceMax < 100000 && item.rawPrice > priceMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.rawPrice || Infinity) - (b.rawPrice || Infinity);
      if (sortBy === 'price_desc') return (b.rawPrice || 0) - (a.rawPrice || 0);
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0) || (b.reviewsCount || 0) - (a.reviewsCount || 0);
      return 0;
    });
  }, [combinedEquipment, searchQuery, category, tariff, location, freeToday, withOperator, delivery, priceMax, sortBy]);

  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    setPlaceError(null);
    const name = placeForm.name.trim();
    const pricePerDay = Number(String(placeForm.pricePerDay).replace(/\s/g, ''));
    const pricePerHour = Number(String(placeForm.pricePerHour || 0).replace(/\s/g, ''));
    if (!name) { setPlaceError('Укажите марку и модель техники'); return; }
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) { setPlaceError('Укажите цену за смену больше 0'); return; }
    if (!Number.isFinite(pricePerHour) || pricePerHour < 0) { setPlaceError('Цена за час не может быть отрицательной'); return; }
    if (!getAuthToken()) {
      setPlaceError('Размещение доступно только с серверной учётной записью: войдите под серверной учёткой и повторите. Объявление не сохранено.');
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch('/api/v1/equipment', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          name,
          category: placeForm.category,
          pricePerDay: Math.round(pricePerDay),
          pricePerHour: Math.round(pricePerHour) || undefined,
          city: placeForm.city.trim(),
          plateNumber: placeForm.plateNumber.trim() || undefined,
          capacity: placeForm.capacity.trim() || undefined,
          ownerPhone: placeForm.ownerPhone.trim() || undefined,
          status: 'Доступен',
        }),
      });
      if (!res.ok) {
        const msg = await responseError(res);
        setPlaceError(res.status === 401 ? 'Сессия недействительна: войдите под серверной учёткой и повторите.' : `Сервер не принял объявление: ${msg}`);
        return;
      }
      setShowPlaceModal(false);
      setPlaceForm(f => ({ ...f, name: '', pricePerDay: '', pricePerHour: '', plateNumber: '', capacity: '' }));
      setEqReload(k => k + 1);
      setActiveTab('marketplace');
      showToast('✅ Объявление опубликовано в маркетплейсе');
    } catch (err) {
      setPlaceError(`Сервер недоступен: ${err.message}`);
    } finally {
      setPlacing(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="equipment-marketplace-container">
      {/* Toast */}
      {toastMessage && (
        <div className="em-toast">
          {toastMessage}
        </div>
      )}

      {!hideHeader && (
        <div className="em-header" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {onBack && (
            <button 
              onClick={onBack}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
              title="Назад"
            >
              ← Назад
            </button>
          )}
          <div className="em-tabs" style={{ margin: 0 }}>
            {topTabs.map(tab => (
              <button 
                key={tab.id}
                className={`em-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="em-content">
          {/* Search Bar */}
          <div className="em-search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Искать по спецтехнике, модели или характеристикам (например: Hitachi, 25т)..." 
            />
            <span className="search-results-count" aria-live="polite">{eqApi.status === 'loading' ? 'Поиск…' : `Найдено: ${filteredEquipment.length}`}</span>
          </div>

          {!eqApiMode && (
            <div className="mkt-notice mkt-notice--warn" role="status">
              <span>Каталог спецтехники недоступен ({eqApi.error}). Показаны демо-объявления: цены и статусы условные, бронирование недоступно.</span>
              <button type="button" className="mkt-notice-btn" onClick={() => setEqReload(k => k + 1)}>Повторить</button>
            </div>
          )}

          {/* WB / Ozon Quick Filter Strip */}
          <div className="wb-quick-filter-strip">
            <button 
              className={`wb-filter-chip ${isFilterOpen ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span>🎛️ Фильтры</span>
              {(category !== 'all' || tariff !== 'all' || location !== 'all' || freeToday || withOperator) && (
                <span className="wb-active-dot" style={{ color: '#b9a4ff' }}>●</span>
              )}
            </button>

            <div className="wb-quick-select-wrap">
              <span>📍</span>
              <select value={location} onChange={e => setLocation(e.target.value)}>
                <option value="all">Все города</option>
                <option value="almaty">Алматы</option>
                <option value="astana">Астана</option>
                <option value="shymkent">Шымкент</option>
                <option value="karaganda">Караганда</option>
              </select>
            </div>

            <div className="wb-quick-select-wrap">
              <span>⏱️</span>
              <select value={tariff} onChange={e => setTariff(e.target.value)}>
                <option value="all">Все тарифы</option>
                <option value="hourly">Почасовая</option>
                <option value="shift">Посменная</option>
                <option value="trip">За рейс</option>
              </select>
            </div>

            <div className="wb-quick-select-wrap">
              <span aria-hidden="true">⇅</span>
              <select aria-label="Сортировка" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="popular">Сначала новые</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
                <option value="rating_desc">По рейтингу</option>
              </select>
            </div>

            <button 
              className={`wb-filter-chip ${freeToday ? 'active' : ''}`}
              aria-pressed={freeToday}
              onClick={() => setFreeToday(!freeToday)}
            >
              <span>⚡ Свободны сегодня</span>
            </button>

            <button type="button" className="wb-filter-chip mkt-chip-accent" onClick={() => { setPlaceError(null); setShowPlaceModal(true); }}>
              <span>➕ Разместить технику</span>
            </button>
          </div>

          <div className="em-main-layout">
            {/* Sidebar Controls */}
            <aside className={`em-sidebar ${isFilterOpen ? 'open-mobile' : ''}`}>
              <div className="mmp-sidebar-mobile-header">
                <h3>🎛️ Фильтры спецтехники</h3>
                <button className="mmp-sidebar-close-btn" onClick={() => setIsFilterOpen(false)}>✕</button>
              </div>
              <div className="filter-group">
                <label>📁 Категория</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="em-select"
                >
                  <option value="all">Все категории</option>
                  <option value="earth">⛏️ Землеройная</option>
                  <option value="lift">🏗️ Подъёмная</option>
                  <option value="loader">🚜 Погрузчики</option>
                  <option value="road">🛣️ Дорожная</option>
                  <option value="concrete">🧱 Бетон/раствор</option>
                  <option value="transport">🚚 Транспорт</option>
                  <option value="drill">⛑️ Буровая</option>
                  <option value="power">⚡ Энергетика</option>
                </select>
              </div>

              <div className="filter-group">
                <label>📊 Тариф</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="tariff" checked={tariff === 'all'} onChange={() => setTariff('all')} />
                    <span className="custom-radio"></span> Все
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="tariff" checked={tariff === 'hourly'} onChange={() => setTariff('hourly')} />
                    <span className="custom-radio"></span> Почасовая
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="tariff" checked={tariff === 'shift'} onChange={() => setTariff('shift')} />
                    <span className="custom-radio"></span> Смена
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="tariff" checked={tariff === 'trip'} onChange={() => setTariff('trip')} />
                    <span className="custom-radio"></span> Рейс
                  </label>
                </div>
              </div>

              <div className="filter-group">
                <label>📍 Локация</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className="em-select">
                  <option value="all">Все города</option>
                  <option value="almaty">Алматы</option>
                  <option value="astana">Астана</option>
                  <option value="shymkent">Шымкент</option>
                  <option value="karaganda">Караганда</option>
                </select>
                
                <div className="slider-group">
                  <div className="slider-labels">
                    <span>Радиус поиска</span>
                    <span>{radius} км</span>
                  </div>
                  <input type="range" min="10" max="300" value={radius} onChange={e => setRadius(e.target.value)} className="em-slider" />
                </div>
              </div>

              <div className="filter-group checkbox-group">
                <label className="check-label">
                  <input type="checkbox" checked={freeToday} onChange={e => setFreeToday(e.target.checked)} />
                  <span className="custom-checkbox"></span> Только свободные сегодня
                </label>
                <label className="check-label">
                  <input type="checkbox" checked={withOperator} onChange={e => setWithOperator(e.target.checked)} />
                  <span className="custom-checkbox"></span> С оператором
                </label>
              </div>

              <div className="filter-group">
                <label>💰 Цена за смену</label>
                <div className="slider-group">
                  <div className="slider-labels">
                    <span>до</span>
                    <span>{priceMax >= 100000 ? 'Без лимита' : `${priceMax.toLocaleString()} ₸`}</span>
                  </div>
                  <input type="range" min="10000" max="100000" step="5000" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="em-slider" />
                </div>
              </div>

              <div className="filter-group">
                <label>🚚 Доставка</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="delivery" checked={delivery === 'all'} onChange={() => setDelivery('all')} />
                    <span className="custom-radio"></span> Все варианты
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="delivery" checked={delivery === 'yes'} onChange={() => setDelivery('yes')} />
                    <span className="custom-radio"></span> С доставкой
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="delivery" checked={delivery === 'no'} onChange={() => setDelivery('no')} />
                    <span className="custom-radio"></span> Самовывоз
                  </label>
                </div>
              </div>

              <button 
                className="em-submit-btn"
                onClick={() => showToast(`🔍 Найдено объявлений: ${filteredEquipment.length}`)}
              >
                Показать {filteredEquipment.length} объявлений
              </button>
            </aside>

            {/* Results Grid & Chips */}
            <div className="em-results">
              <div className="em-chips">
                {categoryChips.map(chip => (
                  <button 
                    key={chip.id} 
                    className={`em-chip ${category === chip.id ? 'active' : ''}`}
                    aria-pressed={category === chip.id}
                    onClick={() => setCategory(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {eqApi.status === 'loading' && eqApiMode ? (
                <div className="em-grid" aria-busy="true" aria-label="Загрузка спецтехники">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="mkt-skeleton-card" aria-hidden="true">
                      <div className="mkt-skel mkt-skel-img" />
                      <div className="mkt-skel mkt-skel-line" />
                      <div className="mkt-skel mkt-skel-line short" />
                      <div className="mkt-skel mkt-skel-price" />
                    </div>
                  ))}
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="em-empty-state">
                  <span className="empty-icon">🚜</span>
                  <h3>По вашему запросу техника не найдена</h3>
                  <p>Попробуйте ослабить фильтры или изменить категорию поиска.</p>
                  <button 
                    className="em-btn-secondary"
                    onClick={() => {
                      setCategory('all');
                      setSearchQuery('');
                      setTariff('all');
                      setLocation('all');
                      setFreeToday(false);
                      setWithOperator(false);
                      setDelivery('all');
                      setPriceMax(100000);
                      setSortBy('popular');
                    }}
                  >
                    🔄 Сбросить все фильтры
                  </button>
                  <button type="button" className="mkt-btn-secondary" onClick={() => { setPlaceError(null); setShowPlaceModal(true); }}>
                    Разместить свою технику
                  </button>
                </div>
              ) : (
                <div className="em-grid">
                  {filteredEquipment.map((item) => (
                    <article className={`em-card luxury-em-card ${item.isDemo ? 'is-demo' : ''}`} key={item.id}>
                      <div className="em-card-image luxury-image-container">
                        <div className="em-card-blueprint-grid"></div>
                        <div className="em-brand-watermark">
                          {item.category === 'earth' && 'HEAVY EXCAVATION CORP'}
                          {item.category === 'lift' && 'CRANE SYSTEMS PRO'}
                          {item.category === 'loader' && 'WHEEL & TELE LOADER'}
                          {item.category === 'road' && 'ROADWAY ROADBUILDING'}
                          {item.category === 'concrete' && 'CONCRETE PUMPING TECH'}
                          {item.category === 'transport' && 'HEAVY TRANSPORT LOGISTICS'}
                          {item.category === 'drill' && 'GEOTECH DRILLING RIG'}
                          {item.category === 'power' && 'GENERATOR & POWER GRID'}
                        </div>
                        
                        <div className="em-card-main-visual" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
                          <img 
                            src={item.image || item.backupImage || EQ_PLACEHOLDER_IMG} 
                            alt={item.title} 
                            loading="lazy" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', filter: 'brightness(0.88) contrast(1.1)' }}
                            className="em-machine-photo"
                            onError={(e) => {
                              if (e.target.getAttribute('data-tried') !== 'true' && item.backupImage) {
                                e.target.setAttribute('data-tried', 'true');
                                e.target.src = item.backupImage;
                              }
                            }}
                          />
                          {item.distanceKm ? (
                            <div className="em-gps-distance-pill" style={{ position: 'absolute', bottom: '8px', left: '10px', background: 'rgba(8, 12, 22, 0.85)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#b9a4ff', fontWeight: '800', border: '1px solid rgba(185, 164, 255, 0.3)' }}>
                              📍 {item.distanceKm} км от вас
                            </div>
                          ) : null}
                          {item.isDemo && <span className="mkt-badge mkt-badge--demo mkt-badge--corner">Демо</span>}
                        </div>

                        <div className="em-telemetry-badge-top">
                          {item.availableToday ? (
                            <span className="em-status-pill available">
                              <span className="pulse-green-dot" aria-hidden="true"></span> {item.status || 'Доступен'}
                            </span>
                          ) : (
                            <span className="em-status-pill busy">
                              ● {item.status || 'Занят'}
                            </span>
                          )}
                          {item.rating ? (
                            <span className="em-rating-badge" title={`${item.reviewsCount} отзывов`}>★ {item.rating.toFixed(1)}{item.reviewsCount ? ` (${item.reviewsCount})` : ''}</span>
                          ) : (
                            <span className="em-rating-badge muted">Нет отзывов</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="em-card-content luxury-content">
                        <div className="em-card-category-strip">
                          <span className="em-cat-tag">{item.categoryName || EQ_CATEGORY_LABEL[item.category] || 'Спецтехника'}</span>
                          {item.ownerName && <span className="em-gps-tag">{item.ownerName}</span>}
                        </div>

                        <h3 className="em-card-title" title={item.title}>{item.title}</h3>
                        
                        <div className="em-price-cockpit">
                          <div className="em-main-price mkt-price-tag">
                            {item.rawPrice > 0 ? (
                              <>
                                <span className="kzt-value">{item.rawPrice.toLocaleString('ru-RU')} ₸</span>
                                <span className="kzt-unit">за {item.unit}</span>
                              </>
                            ) : (
                              <span className="kzt-unit">Цена по запросу</span>
                            )}
                          </div>
                          <div className="em-escrow-guarantee">🛡️ Эскроу QazGost</div>
                        </div>
                        
                        <div className="em-card-tags">
                          {item.tags.map((tag, tIndex) => (
                            <span key={tIndex} className={`em-tag ${tag.type}`}>
                              {tag.icon ? `${tag.icon} ` : ''}{tag.label}
                            </span>
                          ))}
                        </div>

                        <div className="em-card-actions">
                          <button 
                            type="button"
                            className="em-btn-primary luxury-book-btn"
                            disabled={item.isDemo || !(item.rawPrice > 0) || !item.availableToday}
                            title={item.isDemo ? 'Демо-объявление: бронирование недоступно' : (!(item.rawPrice > 0) ? 'Цена не указана — свяжитесь с владельцем' : (!item.availableToday ? 'Техника занята' : ''))}
                            onClick={() => {
                              setBookingItem(item);
                            }}
                          >
                            <span>{item.availableToday ? '⚡ Забронировать' : 'Занята'}</span>
                          </button>
                          <button 
                            className="em-btn-secondary luxury-compare-btn"
                            onClick={() => showToast(`⚖️ Модель "${item.title}" добавлена в сравнение`)}
                          >
                            ⚖️ Сравнить
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLEET TAB */}
      {activeTab === 'fleet' && (
        <div className="em-tab-view-container">
          <div className="em-view-header-bar">
            <div className="em-header-left">
              <h2 className="em-view-title">🚜 Мой автопарк спецтехники</h2>
              <p className="em-view-subtitle">Мониторинг единиц в режиме реального времени, смены и GPS-телеметрия</p>
            </div>
            <div className="em-header-metrics">
              <div className="em-metric-pill">
                <span className="metric-val">6</span>
                <span className="metric-lbl">Всего машин</span>
              </div>
              <div className="em-metric-pill success">
                <span className="metric-val">4</span>
                <span className="metric-lbl">В работе</span>
              </div>
              <div className="em-metric-pill info">
                <span className="metric-val">2</span>
                <span className="metric-lbl">Свободно</span>
              </div>
              <button className="em-btn-action-primary" onClick={() => { setPlaceError(null); setShowPlaceModal(true); }}>
                + Добавить технику в парк
              </button>
            </div>
          </div>

          <div className="em-fleet-grid">
            <div className="em-fleet-card-luxury">
              <div className="em-fleet-card-top">
                <div className="em-fleet-icon-aura">🚜</div>
                <div className="em-fleet-main-info">
                  <div className="em-fleet-title-row">
                    <h3>Гусеничный экскаватор CAT 320D</h3>
                    <span className="em-tag-status active">🟢 В работе (Объект №4)</span>
                  </div>
                  <p className="em-fleet-subtext">2022 г.в. • Ковш 1.2 м³ • Заводской номер #CAT-99214</p>
                  
                  <div className="em-fleet-spec-pills">
                    <span className="spec-pill">⛽ Топливо: 85%</span>
                    <span className="spec-pill">📍 GPS: 🟢 Онлайн</span>
                    <span className="spec-pill">👨‍✈️ Машинист: Руслан Б.</span>
                    <span className="spec-pill">⌛ Наработка: 1 420 м/ч</span>
                  </div>
                </div>
              </div>

              <div className="em-fleet-progress-box">
                <div className="progress-labels">
                  <span>Текущая смена (Дневная)</span>
                  <span>6 из 8 часов (75%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="em-fleet-card-footer">
                <span className="footer-status-text">Занят на объекте ЖК «Capital Park» до 20 авг</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('📍 Карта GPS-трекинга открыта')}>📍 GPS Карта</button>
                  <button className="em-btn-glass-sm" onClick={() => showToast('📋 Журнал смен и ТО')}>📋 Журнал ТО</button>
                  <button className="em-btn-glass-sm primary" onClick={() => showToast('⚡ Управление сменой')}>⚡ Смена</button>
                </div>
              </div>
            </div>

            <div className="em-fleet-card-luxury">
              <div className="em-fleet-card-top">
                <div className="em-fleet-icon-aura">🏗️</div>
                <div className="em-fleet-main-info">
                  <div className="em-fleet-title-row">
                    <h3>Автокран Liebherr LTM 1050</h3>
                    <span className="em-tag-status free">⚡ Свободен на базе</span>
                  </div>
                  <p className="em-fleet-subtext">50 тонн • Стрела 38 м + гусек • Заводской номер #LBH-4402</p>
                  
                  <div className="em-fleet-spec-pills">
                    <span className="spec-pill">⛽ Топливо: 92%</span>
                    <span className="spec-pill">📍 База: Алматы Север</span>
                    <span className="spec-pill">👨‍✈️ Машинист: Алихан С.</span>
                  </div>
                </div>
              </div>

              <div className="em-fleet-card-footer">
                <span className="footer-status-text">Готов к моментальному выезду и сдаче в аренду</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('📍 Локация на базе подтверждена')}>📍 На базе</button>
                  <button className="em-btn-glass-sm primary" onClick={() => showToast('📢 Сдать в аренду на маркетплейсе')}>📢 Сдать в аренду</button>
                </div>
              </div>
            </div>

            <div className="em-fleet-card-luxury">
              <div className="em-fleet-card-top">
                <div className="em-fleet-icon-aura">🚚</div>
                <div className="em-fleet-main-info">
                  <div className="em-fleet-title-row">
                    <h3>Самосвал KAMAZ-6520 (20 тонн)</h3>
                    <span className="em-tag-status active">🟢 В рейсе</span>
                  </div>
                  <p className="em-fleet-subtext">2023 г.в. • Кузов 16 м³ • Перевозка инертных материалов</p>
                  
                  <div className="em-fleet-spec-pills">
                    <span className="spec-pill">⛽ Топливо: 60%</span>
                    <span className="spec-pill">📍 Маршрут: Карьер → Объект №2</span>
                    <span className="spec-pill">🚚 Рейсы: 8/10 сделано</span>
                  </div>
                </div>
              </div>

              <div className="em-fleet-card-footer">
                <span className="footer-status-text">Доставка щебня фракции 20-40</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('📍 Маршрут самосвала')}>📍 Рейсы</button>
                  <button className="em-btn-glass-sm primary" onClick={() => showToast('⚡ Управление выгрузкой')}>⚡ Детали</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADS TAB */}
      {activeTab === 'ads' && (
        <div className="em-tab-view-container">
          <div className="em-view-header-bar">
            <div className="em-header-left">
              <h2 className="em-view-title">📄 Мои объявления на маркетплейсе</h2>
              <p className="em-view-subtitle">Управление вашей рекламной витриной и входящими заявками от заказчиков</p>
            </div>
            <div className="em-header-metrics">
              <div className="em-metric-pill">
                <span className="metric-val">3</span>
                <span className="metric-lbl">Объявления</span>
              </div>
              <div className="em-metric-pill success">
                <span className="metric-val">348</span>
                <span className="metric-lbl">Просмотров</span>
              </div>
              <button className="em-btn-action-primary" onClick={() => { setPlaceError(null); setShowPlaceModal(true); }}>
                + Опубликовать объявление
              </button>
            </div>
          </div>

          <div className="em-ads-list">
            <div className="em-ad-item-card-luxury">
              <div className="em-ad-top">
                <div className="em-fleet-icon-aura">🚜</div>
                <div className="em-ad-body">
                  <div className="em-ad-header-row">
                    <div className="em-ad-title-group">
                      <h4>Аренда экскаватора CAT 320D с опытно машинистом</h4>
                      <span className="em-vip-badge">⭐ VIP Приоритет</span>
                    </div>
                    <span className="em-tag-status active">🟢 Активно</span>
                  </div>
                  <p className="em-ad-price-row">
                    <strong>28 000 ₸</strong> / смена (8 ч) • 📍 Алматы • 🚚 Доставка тралом
                  </p>
                  <div className="em-ad-stats-bar">
                    <span>👁️ 142 просмотра</span>
                    <span>📩 12 откликов</span>
                    <span>⭐ Рейтинг 4.9 (18 отзывов)</span>
                  </div>
                </div>
              </div>

              <div className="em-ad-actions-footer">
                <span className="ad-expiry">Действительно до 14 сен 2026</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('🚀 Объявление поднято в ТОП!')}>🚀 Поднять в ТОП</button>
                  <button className="em-btn-glass-sm" onClick={() => showToast('✏️ Редактирование объявления')}>✏️ Изменить</button>
                  <button className="em-btn-glass-sm danger" onClick={() => showToast('⏸️ Объявление временно остановлено')}>⏸️ Пауза</button>
                </div>
              </div>
            </div>

            <div className="em-ad-item-card-luxury">
              <div className="em-ad-top">
                <div className="em-fleet-icon-aura">🏗️</div>
                <div className="em-ad-body">
                  <div className="em-ad-header-row">
                    <div className="em-ad-title-group">
                      <h4>Услуги автокрана Liebherr 50т (Стрела 38м)</h4>
                      <span className="em-tag-status active">🟢 Активно</span>
                    </div>
                  </div>
                  <p className="em-ad-price-row">
                    <strong>55 000 ₸</strong> / смена • 📍 Астана и область
                  </p>
                  <div className="em-ad-stats-bar">
                    <span>👁️ 206 просмотров</span>
                    <span>📩 24 отклика</span>
                    <span>⭐ Рейтинг 5.0 (31 отзыв)</span>
                  </div>
                </div>
              </div>

              <div className="em-ad-actions-footer">
                <span className="ad-expiry">Действительно до 02 сен 2026</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('🚀 Объявление поднято в ТОП!')}>🚀 Поднять в ТОП</button>
                  <button className="em-btn-glass-sm" onClick={() => showToast('✏️ Редактирование объявления')}>✏️ Изменить</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENTALS TAB */}
      {activeTab === 'rentals' && (
        <div className="em-tab-view-container">
          <div className="em-view-header-bar">
            <div className="em-header-left">
              <h2 className="em-view-title">📦 Мои аренды и заказы</h2>
              <p className="em-view-subtitle">Текущие договоры бронирования, счета и электронные акты выполненных работ (ЭСФ)</p>
            </div>
            <button className="em-btn-action-primary" onClick={() => setActiveTab('marketplace')}>
              🔍 Найти технику в каталоге
            </button>
          </div>

          <div className="em-rentals-list">
            <div className="em-rental-card-luxury">
              <div className="em-rental-card-header">
                <div className="rental-contract-badge">
                  <span>Договор №AR-8842</span>
                  <span className="em-tag-status active">🟢 Активная аренда (Смена 3/7)</span>
                </div>
                <span className="rental-date">14 авг - 21 авг 2026</span>
              </div>

              <div className="em-rental-main">
                <div className="em-fleet-icon-aura">🏗️</div>
                <div className="em-rental-details">
                  <h3>Автокран XCMG QY25K5 (25 тонн)</h3>
                  <p>Исполнитель: <strong>ТОО «СпецТрансАлматы»</strong> • Объект: <strong>мкр. Самал-2, д.14</strong></p>
                  
                  <div className="em-rental-stats-pills">
                    <span>💰 Сумма договора: ₸ 196 000</span>
                    <span>💳 Оплачено: ₸ 196 000 (100% Предоплата)</span>
                    <span>👨‍✈️ Машинист: Бахтияр Н. (+7 777 221 4400)</span>
                  </div>
                </div>
              </div>

              <div className="em-fleet-card-footer">
                <span className="footer-status-text">Техника работает на объекте согласно графику</span>
                <div className="em-fleet-actions-row">
                  <button className="em-btn-glass-sm" onClick={() => showToast('📞 Звонок машинисту отправлен')}>📞 Позвонить водителю</button>
                  <button className="em-btn-glass-sm" onClick={() => showToast('📄 Акт ЭСФ скачан')}>📄 Акт выполненных работ</button>
                  <button className="em-btn-glass-sm primary" onClick={() => showToast('🔄 Заявка на продление отправлена')}>🔄 Продлить аренду</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal with Wallet & Escrow & Manager/Executor Dispatch */}
      {bookingItem && (
        <div className="em-modal-overlay" onClick={() => setBookingItem(null)}>
          <div className="em-modal-box" style={{ maxWidth: '560px', width: '100%', background: '#0b1329', border: '1px solid rgba(185, 164, 255, 0.4)', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.85)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🚜</span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Аренда спецтехники с оператором</h3>
              </div>
              <button className="em-modal-close" onClick={() => setBookingItem(null)} style={{ background: 'transparent', border: 'none', color: '#a39cc2', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <h4 style={{ color: '#b9a4ff', margin: '0 0 1rem 0', fontSize: '1rem' }}>{bookingItem.title}</h4>
            
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <div>Тариф: <strong style={{ color: '#fbbf24' }}>₸ {bookingItem.price} / {bookingItem.unit}</strong></div>
              <div>Город: <strong>{bookingItem.cityName || bookingItem.tags?.find(t => t.type === 'location')?.label || '—'}</strong></div>
              {bookingItem.distanceKm ? <div>📍 Расстояние: <strong style={{ color: '#34d399' }}>{bookingItem.distanceKm} км от вас</strong></div> : null}
              <div>Статус: <strong style={{ color: '#10b981' }}>{bookingItem.status || 'Доступен'}</strong></div>
              {bookingItem.ownerName ? <div>Владелец: <strong>{bookingItem.ownerName}</strong></div> : null}
              {bookingItem.ownerPhone ? <div>Телефон: <a href={`tel:${bookingItem.ownerPhone.replace(/[^\d+]/g, '')}`} style={{ color: '#d6caff' }}>{bookingItem.ownerPhone}</a></div> : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="em-form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Дата подачи техники:</label>
                <input 
                  type="date" 
                  className="em-input" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>

              <div className="em-form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Кол-во смен / часов:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={bookingDays} 
                  onChange={e => setBookingDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Имя заказчика:</label>
                <input 
                  type="text" 
                  value={bookingClientName} 
                  onChange={e => setBookingClientName(e.target.value)}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Телефон:</label>
                <input 
                  type="text" 
                  value={bookingClientPhone} 
                  onChange={e => setBookingClientPhone(e.target.value)}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Адрес строительного объекта (подача по GPS):</label>
              <input 
                type="text" 
                value={bookingAddress} 
                onChange={e => setBookingAddress(e.target.value)}
                className="em-input"
                style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
              />
            </div>

            {/* Financial / Wallet Escrow Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(167,139,250,0.08))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbc5e3' }}>Итоговая стоимость аренды:</span>
                <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                  {((bookingItem.rawPrice || 25000) * bookingDays).toLocaleString()} ₸
                </strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem' }}>
                <span style={{ color: '#a39cc2' }}>💳 Баланс вашего кошелька: <strong style={{ color: '#fff' }}>{walletBalance.toLocaleString()} ₸</strong></span>
                {walletBalance < ((bookingItem.rawPrice || 25000) * bookingDays) && (
                  <button
                    type="button"
                    onClick={() => {
                      const added = topupBalance(100000);
                      setWalletBalance(added);
                      showToast('🎉 Кошелёк пополнен на +100 000 ₸ через Kaspi Pay!');
                    }}
                    style={{ background: 'rgba(185,164,255,0.2)', border: '1px solid #b9a4ff', color: '#b9a4ff', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Пополнить на 100k ₸
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a39cc2', marginBottom: '4px' }}>Способ оплаты:</label>
              <select 
                value={bookingPaymentMethod} 
                onChange={e => setBookingPaymentMethod(e.target.value)}
                style={{ width: '100%', background: 'rgba(21,18,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
              >
                <option value="escrow">🛡️ Заморозить в Эскроу с Кошелька (Безопасная сделка)</option>
                <option value="kaspi">📱 Kaspi Pay QR / Перевод</option>
                <option value="invoice">📄 Безналичный расчет с НДС (для юрлиц)</option>
              </select>
            </div>

            <button 
              className="em-submit-btn w-100"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #10b981)', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
              onClick={() => {
                const totalCost = (bookingItem.rawPrice || 25000) * bookingDays;
                
                // 1. Freeze in Wallet if escrow
                let escrowInfo = null;
                if (bookingPaymentMethod === 'escrow') {
                  escrowInfo = freezeEscrow(totalCost, `Аренда: ${bookingItem.title} (${bookingDays} см.)`);
                  setWalletBalance(escrowInfo.newBalance);
                  if (!escrowInfo.ok) {
                    showToast(`⚠️ Недостаточно средств в кошельке: нужно ${totalCost.toLocaleString()} ₸, доступно ${escrowInfo.newBalance.toLocaleString()} ₸`);
                    return;
                  }
                }

                // 2. Dispatch Order to Manager CRM and Executor
                const newOrder = createPlatformOrder({
                  title: `Аренда спецтехники: ${bookingItem.title}`,
                  category: 'Аренда спецтехники',
                  amount: totalCost,
                  budget: `${totalCost.toLocaleString()} ₸`,
                  clientName: bookingClientName,
                  clientPhone: bookingClientPhone,
                  city: bookingItem.cityName || bookingItem.tags?.find(t => t.type === 'location')?.label || 'Алматы',
                  description: `Аренда ${bookingItem.title} на ${bookingDays} смен/дней с ${bookingDate}. Доставка на объект: ${bookingAddress}. Оператор: ${bookingItem.hasOperator ? 'Да' : 'Нет'}. Оплата: ${bookingPaymentMethod === 'escrow' ? 'Эскроу заморожено' : 'Kaspi'}`,
                  type: 'machinery',
                  status: 'in_progress',
                  paymentMethod: bookingPaymentMethod === 'escrow' ? 'Эскроу QazGost' : 'Kaspi Pay',
                  machinery: [
                    {
                      id: bookingItem.id,
                      name: bookingItem.title,
                      photo: bookingItem.image,
                      rate: `${bookingItem.price} ₸ / ${bookingItem.unit}`,
                      dist: bookingItem.distanceKm ? `${bookingItem.distanceKm} км` : '',
                      status: '🟢 Назначен на объект (GPS Online)',
                      assigned: true
                    }
                  ],
                  escrowTxId: escrowInfo?.txId || null,
                  escrowAmount: escrowInfo?.ok ? totalCost : 0
                });

                setBookingItem(null);
                showToast(`🎉 Заявка ${newOrder.id} успешно создана и передана Менеджеру CRM и Водителю! 🚜`);
              }}
            >
              🚀 Подтвердить бронирование и передать Менеджеру
            </button>
          </div>
        </div>
      )}

      {/* ── Размещение техники (POST /api/v1/equipment) ── */}
      {showPlaceModal && (
        <div className="em-modal-overlay mkt-modal-overlay" onClick={() => setShowPlaceModal(false)}>
          <form className="mkt-modal" role="dialog" aria-modal="true" aria-labelledby="place-eq-title" onClick={e => e.stopPropagation()} onSubmit={handlePlaceSubmit} noValidate>
            <div className="mkt-modal-head">
              <h3 id="place-eq-title">Разместить спецтехнику</h3>
              <button type="button" className="mkt-icon-btn" aria-label="Закрыть" onClick={() => setShowPlaceModal(false)}>✕</button>
            </div>
            {!getAuthToken() && (
              <p className="mkt-notice mkt-notice--warn">Для публикации нужна серверная учётная запись. Без неё объявление не будет сохранено.</p>
            )}
            <label className="mkt-field">
              <span>Марка и модель *</span>
              <input required value={placeForm.name} onChange={e => setPlaceForm(f => ({ ...f, name: e.target.value }))} placeholder="Например: CAT 320D, гусеничный" />
            </label>
            <label className="mkt-field">
              <span>Категория</span>
              <select value={placeForm.category} onChange={e => setPlaceForm(f => ({ ...f, category: e.target.value }))}>
                {EQ_CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="mkt-field-row">
              <label className="mkt-field">
                <span>Цена за смену, ₸ *</span>
                <input required type="number" inputMode="numeric" min="1" step="1000" value={placeForm.pricePerDay} onChange={e => setPlaceForm(f => ({ ...f, pricePerDay: e.target.value }))} />
              </label>
              <label className="mkt-field">
                <span>Цена за час, ₸</span>
                <input type="number" inputMode="numeric" min="0" step="500" value={placeForm.pricePerHour} onChange={e => setPlaceForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-field">
                <span>Город</span>
                <input value={placeForm.city} onChange={e => setPlaceForm(f => ({ ...f, city: e.target.value }))} />
              </label>
              <label className="mkt-field">
                <span>Госномер</span>
                <input value={placeForm.plateNumber} onChange={e => setPlaceForm(f => ({ ...f, plateNumber: e.target.value }))} placeholder="01 777 KZ 02" />
              </label>
            </div>
            <div className="mkt-field-row">
              <label className="mkt-field">
                <span>Грузоподъёмность / объём</span>
                <input value={placeForm.capacity} onChange={e => setPlaceForm(f => ({ ...f, capacity: e.target.value }))} placeholder="25 т, ковш 1 м³" />
              </label>
              <label className="mkt-field">
                <span>Телефон диспетчера</span>
                <input type="tel" value={placeForm.ownerPhone} onChange={e => setPlaceForm(f => ({ ...f, ownerPhone: e.target.value }))} placeholder="+7 7__ ___ __ __" />
              </label>
            </div>
            {placeError && <p className="mkt-form-error" role="alert">{placeError}</p>}
            <div className="mkt-modal-actions">
              <button type="button" className="mkt-btn-secondary" onClick={() => setShowPlaceModal(false)}>Отмена</button>
              <button type="submit" className="mkt-btn-primary" disabled={placing}>{placing ? 'Публикация…' : 'Опубликовать'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
