import React, { useState, useMemo, useEffect } from 'react';
import { getBalanceKZT, freezeEscrow, topupBalance } from '../services/walletEngine';
import { createPlatformOrder } from '../services/orderSyncService';
import './EquipmentMarketplace.css';

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
  
  // Interactive Modal state
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingDays, setBookingDays] = useState(1);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('escrow'); // 'escrow' | 'kaspi' | 'invoice'
  const [bookingClientName, setBookingClientName] = useState('Заказчик');
  const [bookingClientPhone, setBookingClientPhone] = useState('+7 (707) 888-99-00');
  const [bookingAddress, setBookingAddress] = useState('г. Алматы, строительный объект');
  const [walletBalance, setWalletBalance] = useState(() => getBalanceKZT());
  
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

  const combinedEquipment = useMemo(() => {
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
        distanceKm: c.distanceKm || 1.8,
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

    return [...formattedCustom, ...fullEquipmentList];
  }, [customList]);

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

      // 8. Price Slider Filter
      if (item.rawPrice > priceMax) {
        return false;
      }

      return true;
    });
  }, [searchQuery, category, tariff, location, freeToday, withOperator, delivery, priceMax]);

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
              placeholder="Искать по категории, модели или характеристикам (например: Hitachi, Погрузчик, 25т)..." 
            />
            <span className="search-results-count">Найдено: {filteredEquipment.length}</span>
          </div>

          <div className="em-main-layout">
            {/* Sidebar Controls */}
            <aside className="em-sidebar">
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
                    onClick={() => setCategory(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {filteredEquipment.length === 0 ? (
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
                    }}
                  >
                    🔄 Сбросить все фильтры
                  </button>
                </div>
              ) : (
                <div className="em-grid">
                  {filteredEquipment.map((item) => (
                    <div className="em-card luxury-em-card" key={item.id}>
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
                            src={item.image || item.backupImage || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80'} 
                            alt={item.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', filter: 'brightness(0.88) contrast(1.1)' }}
                            className="em-machine-photo"
                            onError={(e) => {
                              if (e.target.getAttribute('data-tried') !== 'true' && item.backupImage) {
                                e.target.setAttribute('data-tried', 'true');
                                e.target.src = item.backupImage;
                              }
                            }}
                          />
                          <div style={{ position: 'absolute', bottom: '8px', left: '10px', background: 'rgba(8, 12, 22, 0.85)', backdropFilter: 'blur(10px)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: '800', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            📍 GPS: {item.distanceKm ? `${item.distanceKm} км от вас` : '2.4 км'}
                          </div>
                        </div>

                        <div className="em-telemetry-badge-top">
                          {item.availableToday ? (
                            <span className="em-status-pill available">
                              <span className="pulse-green-dot"></span> Готов к выезду
                            </span>
                          ) : (
                            <span className="em-status-pill busy">
                              ● На объекте (с 18:00)
                            </span>
                          )}
                          <span className="em-rating-badge">★ 4.95</span>
                        </div>
                      </div>
                      
                      <div className="em-card-content luxury-content">
                        <div className="em-card-category-strip">
                          <span className="em-cat-tag">
                            {item.category === 'earth' && 'ЗЕМЛЕРОЙНАЯ ТЕХНИКА'}
                            {item.category === 'lift' && 'ПОДЪЁМНАЯ ТЕХНИКА'}
                            {item.category === 'loader' && 'ПОГРУЗОЧНАЯ ТЕХНИКА'}
                            {item.category === 'road' && 'ДОРОЖНОЕ СТРОИТЕЛЬСТВО'}
                            {item.category === 'concrete' && 'БЕТОННЫЕ РАБОТЫ'}
                            {item.category === 'transport' && 'ТРАНСПОРТ И ЛОГИСТИКА'}
                            {item.category === 'drill' && 'БУРОВЫЕ УСТАНОВКИ'}
                            {item.category === 'power' && 'ЭНЕРГОСНАБЖЕНИЕ'}
                          </span>
                          <span className="em-gps-tag">🛰️ GPS Online</span>
                        </div>

                        <h3 className="em-card-title">{item.title}</h3>
                        
                        <div className="em-price-cockpit">
                          <div className="em-main-price">
                            <span className="kzt-currency">₸</span>
                            <span className="kzt-value">{item.price}</span>
                            <span className="kzt-unit">/ {item.unit}</span>
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
                            className="em-btn-primary luxury-book-btn"
                            onClick={() => {
                              setBookingItem(item);
                            }}
                          >
                            <span>⚡ Забронировать</span>
                          </button>
                          <button 
                            className="em-btn-secondary luxury-compare-btn"
                            onClick={() => showToast(`⚖️ Модель "${item.title}" добавлена в сравнение`)}
                          >
                            ⚖️ Сравнить
                          </button>
                        </div>
                      </div>
                    </div>
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
              <button className="em-btn-action-primary" onClick={() => showToast('➕ Форма добавления техники в автопарк')}>
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
              <button className="em-btn-action-primary" onClick={() => showToast('📝 Форма публикации объявлений')}>
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
          <div className="em-modal-box" style={{ maxWidth: '560px', width: '100%', background: '#0b1329', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '20px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.85)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🚜</span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Аренда спецтехники с оператором</h3>
              </div>
              <button className="em-modal-close" onClick={() => setBookingItem(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <h4 style={{ color: '#38bdf8', margin: '0 0 1rem 0', fontSize: '1rem' }}>{bookingItem.title}</h4>
            
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '12px', marginBottom: '1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
              <div>Тариф: <strong style={{ color: '#fbbf24' }}>₸ {bookingItem.price} / {bookingItem.unit}</strong></div>
              <div>Город: <strong>{bookingItem.tags?.find(t => t.type === 'location')?.label || 'Алматы'}</strong></div>
              <div>📍 GPS дистанция: <strong style={{ color: '#34d399' }}>{bookingItem.distanceKm} км от вас</strong></div>
              <div>Статус: <strong style={{ color: '#10b981' }}>🟢 Готов к выезду</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="em-form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Дата подачи техники:</label>
                <input 
                  type="date" 
                  className="em-input" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>

              <div className="em-form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Кол-во смен / часов:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  value={bookingDays} 
                  onChange={e => setBookingDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Имя заказчика:</label>
                <input 
                  type="text" 
                  value={bookingClientName} 
                  onChange={e => setBookingClientName(e.target.value)}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Телефон:</label>
                <input 
                  type="text" 
                  value={bookingClientPhone} 
                  onChange={e => setBookingClientPhone(e.target.value)}
                  className="em-input"
                  style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Адрес строительного объекта (подача по GPS):</label>
              <input 
                type="text" 
                value={bookingAddress} 
                onChange={e => setBookingAddress(e.target.value)}
                className="em-input"
                style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
              />
            </div>

            {/* Financial / Wallet Escrow Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Итоговая стоимость аренды:</span>
                <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                  {((bookingItem.rawPrice || 25000) * bookingDays).toLocaleString()} ₸
                </strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>💳 Баланс вашего кошелька: <strong style={{ color: '#fff' }}>{walletBalance.toLocaleString()} ₸</strong></span>
                {walletBalance < ((bookingItem.rawPrice || 25000) * bookingDays) && (
                  <button
                    type="button"
                    onClick={() => {
                      const added = topupBalance(100000);
                      setWalletBalance(added);
                      showToast('🎉 Кошелёк пополнен на +100 000 ₸ через Kaspi Pay!');
                    }}
                    style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Пополнить на 100k ₸
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Способ оплаты:</label>
              <select 
                value={bookingPaymentMethod} 
                onChange={e => setBookingPaymentMethod(e.target.value)}
                style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
              >
                <option value="escrow">🛡️ Заморозить в Эскроу с Кошелька (Безопасная сделка)</option>
                <option value="kaspi">📱 Kaspi Pay QR / Перевод</option>
                <option value="invoice">📄 Безналичный расчет с НДС (для юрлиц)</option>
              </select>
            </div>

            <button 
              className="em-submit-btn w-100"
              style={{ background: 'linear-gradient(90deg, #0284c7, #10b981)', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
              onClick={() => {
                const totalCost = (bookingItem.rawPrice || 25000) * bookingDays;
                
                // 1. Freeze in Wallet if escrow
                let escrowInfo = null;
                if (bookingPaymentMethod === 'escrow') {
                  escrowInfo = freezeEscrow(totalCost, `Аренда: ${bookingItem.title} (${bookingDays} см.)`);
                  setWalletBalance(escrowInfo.newBalance);
                }

                // 2. Dispatch Order to Manager CRM and Executor
                const newOrder = createPlatformOrder({
                  title: `Аренда спецтехники: ${bookingItem.title}`,
                  category: 'Аренда спецтехники',
                  amount: totalCost,
                  budget: `${totalCost.toLocaleString()} ₸`,
                  clientName: bookingClientName,
                  clientPhone: bookingClientPhone,
                  city: bookingItem.tags?.find(t => t.type === 'location')?.label || 'Алматы',
                  description: `Аренда ${bookingItem.title} на ${bookingDays} смен/дней с ${bookingDate}. Доставка на объект: ${bookingAddress}. Оператор: ${bookingItem.hasOperator ? 'Да' : 'Нет'}. Оплата: ${bookingPaymentMethod === 'escrow' ? 'Эскроу заморожено' : 'Kaspi'}`,
                  type: 'machinery',
                  status: 'new',
                  paymentMethod: bookingPaymentMethod === 'escrow' ? 'Эскроу QazGost' : 'Kaspi Pay',
                  machinery: [
                    {
                      id: bookingItem.id,
                      name: bookingItem.title,
                      photo: bookingItem.image,
                      rate: `${bookingItem.price} ₸ / ${bookingItem.unit}`,
                      dist: `${bookingItem.distanceKm} км`,
                      status: '🟢 Назначен на объект (GPS Online)',
                      assigned: true
                    }
                  ]
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
    </div>
  );
}
