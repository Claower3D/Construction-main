import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './UserOrdersPage.css';

// ── Ключ для localStorage ──
function getOrdersKey(user) {
  const uid = user?.login || user?.email || user?.name || 'shared';
  return `qazgost_orders_${uid}`;
}

export default function UserOrdersPage({ currentUser, onBack, onSwitchRole }) {
  const [role, setRole] = useState(currentUser?.role || 'customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // {title, message, onConfirm}

  // ═══ СТАТУСЫ ПОТОКА ЗАЯВКИ ═══
  // new              → Менеджер создал заявку
  // engineer_assigned → Инженер назначен на выезд
  // engineer_visit   → Инженер на осмотре объекта
  // estimate_ready   → Осмотр завершён, смета готова → ищем исполнителя
  // pending_executor → Ожидает принятия исполнителем
  // in_progress      → Исполнитель работает
  // completed        → Заказ завершён

  const STATUS_CONFIG = {
    new:                { label: '🆕 Новая заявка',           color: '#8b5cf6' },
    engineer_assigned:  { label: '📋 Инженер назначен',       color: '#f59e0b' },
    engineer_visit:     { label: '🚗 Выезд инженера',         color: '#f97316' },
    estimate_ready:     { label: '📊 Смета готова',            color: '#06b6d4' },
    pending_executor:   { label: '⏳ Ждёт исполнителя',       color: '#eab308' },
    in_progress:        { label: '🟢 В работе',               color: '#10b981' },
    completed:          { label: '✅ Завершён',               color: '#22c55e' }
  };

  const getStatusLabel = (status) => STATUS_CONFIG[status]?.label || status;

  // Initial Sample Orders — показываем все этапы пайплайна
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-081',
      title: 'Ремонт офиса 120 м² "под ключ"',
      clientName: 'ТОО «КазИнвестГрупп»',
      clientPhone: '+7 (701) 555-44-33',
      amount: 4850000,
      status: 'in_progress',
      date: '12 авг 2026',
      city: 'Алматы',
      category: 'Отделочные работы',
      description: 'Комплексный ремонт офисного помещения: демонтаж, новая электрика, перегородки из ГКЛ, чистовая отделка.',
      assignedEngineer: 'Асхат Нурланов',
      engineerVisitDate: '13.08.2026 10:00',
      engineerReport: 'Осмотр проведён. Выявлены трещины в несущей стене, требуется усиление. Смета скорректирована.',
      acceptedBy: 'СтройМастер KZ',
      acceptedAt: '14.08.2026 16:30',
      stages: [
        {
          id: 'STG-1',
          name: '1. Демонтажные работы и вывоз мусора',
          status: 'completed', progress: 100,
          dateRange: '12.08 – 15.08.2026', budget: 650000,
          machinery: [
            { id: 18, name: 'Самосвал Shacman F3000 (25 т)', photo: '/assets/machinery/shacman_dump_truck.jpg', rate: '18 000 ₸ / час', dist: '1.4 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 11, name: 'Мини-погрузчик Bobcat S530', photo: '/assets/machinery/bobcat_skid_steer.jpg', rate: '14 000 ₸ / час', dist: '1.6 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-2',
          name: '2. Монтаж перегородок, потолков и электрики',
          status: 'in_progress', progress: 65,
          dateRange: '16.08 – 24.08.2026', budget: 1850000,
          machinery: [
            { id: 8, name: 'Кран-манипулятор КАМАЗ 65117 (КМУ 7 т)', photo: '/assets/machinery/kamaz_manipulator.jpg', rate: '20 000 ₸ / час', dist: '1.8 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-3',
          name: '3. Чистовая отделка, полы и освещение',
          status: 'pending', progress: 0,
          dateRange: '25.08 – 05.09.2026', budget: 2350000,
          machinery: [
            { id: 12, name: 'Телескопический погрузчик Manitou MT 1840', photo: '/assets/machinery/manitou_telehandler.jpg', rate: '24 000 ₸ / час', dist: '2.3 км от объекта', status: '🟢 Свободен', assigned: false }
          ]
        }
      ]
    },
    {
      id: 'ORD-2026-090',
      title: 'Установка вентиляции в ресторане',
      clientName: 'ИП «ДастарханГрупп»',
      clientPhone: '+7 (702) 311-22-44',
      amount: 2200000,
      status: 'new',
      date: '20 авг 2026',
      city: 'Алматы',
      category: 'Инженерные сети',
      description: 'Монтаж приточно-вытяжной вентиляции с рекуперацией для ресторана 180 м².',
      stages: []
    },
    {
      id: 'ORD-2026-088',
      title: 'Утепление фасада 5-этажного дома',
      clientName: 'КСК «Ботанический»',
      clientPhone: '+7 (771) 900-88-77',
      amount: 8900000,
      status: 'engineer_assigned',
      date: '18 авг 2026',
      city: 'Астана',
      category: 'Фасадные работы',
      description: 'Утепление фасада минватой 100мм, штукатурка, покраска. 5 этажей, 2 подъезда.',
      assignedEngineer: 'Тимур Каримов',
      engineerVisitDate: '22.08.2026 09:00',
      stages: []
    },
    {
      id: 'ORD-2026-085',
      title: 'Строительство забора и ворот',
      clientName: 'Марат Сулейменов',
      clientPhone: '+7 (700) 123-45-67',
      amount: 1850000,
      status: 'engineer_visit',
      date: '16 авг 2026',
      city: 'Караганда',
      category: 'Ограждения',
      description: 'Забор из профнастила 120 м, откатные ворота 4 м, калитка.',
      assignedEngineer: 'Даулет Жумабаев',
      engineerVisitDate: '22.08.2026 14:00',
      stages: []
    },
    {
      id: 'ORD-2026-082',
      title: 'Ремонт кровли торгового центра',
      clientName: 'ТОО «МегаМаркет»',
      clientPhone: '+7 (7172) 55-44-33',
      amount: 6700000,
      status: 'estimate_ready',
      date: '14 авг 2026',
      city: 'Астана',
      category: 'Кровельные работы',
      description: 'Замена мягкой кровли 800 м², ремонт парапетов, установка водостоков.',
      assignedEngineer: 'Асхат Нурланов',
      engineerVisitDate: '15.08.2026 11:00',
      engineerReport: 'Осмотр завершён. Кровля изношена на 70%. Требуется полная замена с гидроизоляцией.',
      stages: [
        {
          id: 'STG-1', name: '1. Демонтаж старого покрытия', status: 'pending', progress: 0,
          dateRange: '25.08 – 28.08.2026', budget: 1500000,
          machinery: [
            { id: 6, name: 'Автовышка телескопическая Hyundai HD78', photo: '/assets/machinery/hyundai_cherry_picker.jpg', rate: '18 000 ₸ / час', dist: '2.0 км', status: '🟢 Свободен', assigned: false }
          ]
        },
        {
          id: 'STG-2', name: '2. Гидроизоляция и укладка нового покрытия', status: 'pending', progress: 0,
          dateRange: '29.08 – 08.09.2026', budget: 4200000,
          machinery: [
            { id: 5, name: 'Автокран XCMG QY25K5', photo: '/assets/machinery/xcmg_mobile_crane.jpg', rate: '28 000 ₸ / час', dist: '2.1 км', status: '🟢 Свободен', assigned: false }
          ]
        },
        {
          id: 'STG-3', name: '3. Установка водостоков и парапетов', status: 'pending', progress: 0,
          dateRange: '09.09 – 12.09.2026', budget: 1000000,
          machinery: []
        }
      ]
    },
    {
      id: 'ORD-2026-074',
      title: 'Строительство монолитного коттеджа 320 м²',
      clientName: 'ИП «СтройСервис»',
      clientPhone: '+7 (705) 888-11-22',
      amount: 14800000,
      status: 'pending_executor',
      date: '05 авг 2026',
      city: 'Астана',
      category: 'Монолитные работы',
      description: 'Земляные работы, свайное поле, заливка фундаментной плиты и возведение монолитного каркаса.',
      assignedEngineer: 'Тимур Каримов',
      engineerVisitDate: '06.08.2026 10:00',
      engineerReport: 'Грунт скальный, рекомендую увеличить кол-во свай. Геодезическая разбивка выполнена.',
      stages: [
        {
          id: 'STG-1', name: '1. Земляные работы и разработка котлована', status: 'pending', progress: 0,
          dateRange: '25.08 – 02.09.2026', budget: 2800000,
          machinery: [
            { id: 1, name: 'Гусеничный экскаватор Hitachi ZX240', photo: '/assets/machinery/hitachi_excavator.jpg', rate: '25 000 ₸ / час', dist: '1.8 км', status: '🟢 Свободен', assigned: false },
            { id: 4, name: 'Тяжелый бульдозер CAT D6R', photo: '/assets/machinery/cat_bulldozer.jpg', rate: '32 000 ₸ / час', dist: '2.2 км', status: '🟢 Свободен', assigned: false }
          ]
        },
        {
          id: 'STG-2', name: '2. Устройство свайного поля и фундамента', status: 'pending', progress: 0,
          dateRange: '03.09 – 15.09.2026', budget: 5200000,
          machinery: [
            { id: 21, name: 'Буровая сваебойная установка Bauer BG 28', photo: '/assets/machinery/bauer_piling_rig.jpg', rate: '95 000 ₸ / час', dist: '3.1 км', status: '🟢 Свободен', assigned: false }
          ]
        },
        {
          id: 'STG-3', name: '3. Монтаж колонн, перекрытий и кровли', status: 'pending', progress: 0,
          dateRange: '16.09 – 10.10.2026', budget: 6800000,
          machinery: [
            { id: 5, name: 'Автокран XCMG QY25K5', photo: '/assets/machinery/xcmg_mobile_crane.jpg', rate: '28 000 ₸ / час', dist: '2.1 км', status: '🟢 Свободен', assigned: false }
          ]
        }
      ]
    }
  ]);


  // Form State
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderCity, setNewOrderCity] = useState('Алматы');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── localStorage: загрузка заказов при монтировании ──
  useEffect(() => {
    try {
      const key = getOrdersKey(currentUser);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      }
    } catch (e) { console.warn('Orders load error:', e); }
  }, [currentUser]);

  // ── localStorage: сохранение заказов при изменении ──
  useEffect(() => {
    try {
      const key = getOrdersKey(currentUser);
      localStorage.setItem(key, JSON.stringify(orders));
    } catch (e) { console.warn('Orders save error:', e); }
  }, [orders, currentUser]);

  // ── Обновить статус заказа на основе прогресса этапов ──
  const recalcOrderStatus = useCallback((order) => {
    if (!order.stages || order.stages.length === 0) return order;
    const allCompleted = order.stages.every(s => s.status === 'completed');
    const anyInProgress = order.stages.some(s => s.status === 'in_progress');
    const anyCompleted = order.stages.some(s => s.status === 'completed');
    
    if (allCompleted) {
      return { ...order, status: 'completed', statusLabel: '✅ Завершён' };
    } else if (anyInProgress || anyCompleted) {
      return { ...order, status: 'in_progress', statusLabel: '🟢 В работе' };
    }
    return order;
  }, []);

  // ═══════════════════════════════════════
  // ►  ПРОГРЕССИЯ ЭТАПОВ (Начать / Завершить)
  // ═══════════════════════════════════════
  const handleStartStage = useCallback((orderId, stageId) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      const updated = {
        ...ord,
        stages: ord.stages.map(stg => {
          if (stg.id !== stageId) return stg;
          return { ...stg, status: 'in_progress', progress: 10 };
        })
      };
      return recalcOrderStatus(updated);
    }));
    showToast(`🚀 Этап начат! Эскроу заморожен на сумму этапа`);
  }, [recalcOrderStatus]);

  const handleCompleteStage = useCallback((orderId, stageId) => {
    setConfirmAction({
      title: '✅ Завершить этап?',
      message: 'Подтвердите завершение этапа. Эскроу по этапу будет разморожен и переведён исполнителю.',
      onConfirm: () => {
        setOrders(prev => prev.map(ord => {
          if (ord.id !== orderId) return ord;
          const updated = {
            ...ord,
            stages: ord.stages.map(stg => {
              if (stg.id !== stageId) return stg;
              return { ...stg, status: 'completed', progress: 100 };
            })
          };
          return recalcOrderStatus(updated);
        }));
        // Обновляем selectedOrder тоже
        setSelectedOrder(prev => {
          if (!prev || prev.id !== orderId) return prev;
          const updated = {
            ...prev,
            stages: prev.stages.map(stg => {
              if (stg.id !== stageId) return stg;
              return { ...stg, status: 'completed', progress: 100 };
            })
          };
          return recalcOrderStatus(updated);
        });
        showToast(`✅ Этап завершён! Эскроу ${formatMoney(0)} разморожен → исполнителю`);
        setConfirmAction(null);
      }
    });
  }, [recalcOrderStatus]);

  const handleUpdateProgress = useCallback((orderId, stageId, newProgress) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        stages: ord.stages.map(stg => {
          if (stg.id !== stageId) return stg;
          return { ...stg, progress: Math.min(99, Math.max(1, newProgress)) };
        })
      };
    }));
    // Обновляем selectedOrder
    setSelectedOrder(prev => {
      if (!prev || prev.id !== orderId) return prev;
      return {
        ...prev,
        stages: prev.stages.map(stg => {
          if (stg.id !== stageId) return stg;
          return { ...stg, progress: Math.min(99, Math.max(1, newProgress)) };
        })
      };
    });
  }, []);

  // ═══════════════════════════════════════
  // ►  ПРИНЯТИЕ ЗАКАЗА ИСПОЛНИТЕЛЕМ
  //    + АВТОГЕНЕРАЦИЯ ГРАФИКА РАБОТ В CRM КАЛЕНДАРЬ
  // ═══════════════════════════════════════
  const handleAcceptOrder = useCallback((orderId) => {
    let acceptedOrder = null;
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      acceptedOrder = ord;
      return {
        ...ord,
        status: 'in_progress',
        acceptedBy: currentUser?.name || 'Исполнитель',
        acceptedAt: new Date().toLocaleString()
      };
    }));

    // ═══ АВТОГЕНЕРАЦИЯ ГРАФИКА В CRM-КАЛЕНДАРЬ ═══
    if (acceptedOrder && acceptedOrder.stages && acceptedOrder.stages.length > 0) {
      try {
        const calendarKey = 'qazgost_crm_calendar';
        const existing = JSON.parse(localStorage.getItem(calendarKey) || '{}');

        acceptedOrder.stages.forEach((stg, idx) => {
          // Парсим dateRange: "12.08 – 15.08.2026" или "25.08 – 02.09.2026"
          if (!stg.dateRange) return;
          const parts = stg.dateRange.split('–').map(s => s.trim());
          if (parts.length < 2) return;

          // Парсим дату начала (DD.MM) и конца (DD.MM.YYYY)
          const endMatch = parts[1].match(/(\d{2})\.(\d{2})\.(\d{4})/);
          const startMatch = parts[0].match(/(\d{2})\.(\d{2})/);
          if (!endMatch || !startMatch) return;

          const year = parseInt(endMatch[3]);
          const startDate = `${year}-${startMatch[2]}-${startMatch[1]}`;
          const endDate = `${year}-${endMatch[2]}-${endMatch[1]}`;

          // Создаём event на дату начала этапа
          if (!existing[startDate]) existing[startDate] = [];
          existing[startDate].push({
            id: `${acceptedOrder.id}-${stg.id}-start`,
            title: `🚀 НАЧАЛО: ${stg.name}`,
            status: idx === 0 ? 'В работе' : 'Новые',
            type: 'work_stage',
            time: '08:00',
            phone: acceptedOrder.clientPhone || '',
            contractor: acceptedOrder.clientName,
            location: `📍 ${acceptedOrder.city} • Заказ ${acceptedOrder.id}`,
            budget: `${(stg.budget || 0).toLocaleString('ru-RU')} ₸`,
            orderId: acceptedOrder.id,
            stageId: stg.id,
          });

          // Создаём event на дату окончания этапа
          if (startDate !== endDate) {
            if (!existing[endDate]) existing[endDate] = [];
            existing[endDate].push({
              id: `${acceptedOrder.id}-${stg.id}-end`,
              title: `✅ СДАЧА: ${stg.name}`,
              status: 'Дожим',
              type: 'deadline',
              time: '17:00',
              phone: acceptedOrder.clientPhone || '',
              contractor: acceptedOrder.clientName,
              location: `📍 ${acceptedOrder.city} • Заказ ${acceptedOrder.id}`,
              budget: `${(stg.budget || 0).toLocaleString('ru-RU')} ₸`,
              orderId: acceptedOrder.id,
              stageId: stg.id,
            });
          }

          // Техника — добавляем event на первый день
          if (stg.machinery && stg.machinery.length > 0) {
            const machineryNames = stg.machinery.filter(m => m.assigned).map(m => m.name).join(', ');
            if (machineryNames) {
              const nextDay = new Date(year, parseInt(startMatch[2]) - 1, parseInt(startMatch[1]) + 1);
              const techDate = `${nextDay.getFullYear()}-${String(nextDay.getMonth()+1).padStart(2,'0')}-${String(nextDay.getDate()).padStart(2,'0')}`;
              if (!existing[techDate]) existing[techDate] = [];
              existing[techDate].push({
                id: `${acceptedOrder.id}-${stg.id}-tech`,
                title: `🚜 Техника: ${machineryNames.slice(0, 60)}`,
                status: 'В работе',
                type: 'request_construction',
                time: '07:00',
                phone: '',
                contractor: acceptedOrder.clientName,
                location: `Этап: ${stg.name}`,
                budget: '',
                orderId: acceptedOrder.id,
                stageId: stg.id,
              });
            }
          }
        });

        localStorage.setItem(calendarKey, JSON.stringify(existing));
        // Уведомляем CRM-календарь об обновлении
        window.dispatchEvent(new CustomEvent('crm_calendar_updated'));
      } catch (e) { console.warn('Calendar auto-schedule error:', e); }
    }

    showToast(`✅ Заказ ${orderId} принят! График работ автоматически создан в CRM-календаре 📅`);
    setSelectedOrder(null);
  }, [currentUser]);

  // ═══════════════════════════════════════
  // ►  ЗАВЕРШЕНИЕ ЗАКАЗА (все этапы done)
  // ═══════════════════════════════════════
  // ═══════════════════════════════════════
  // ►  МЕНЕДЖЕР: Назначить инженера
  // ═══════════════════════════════════════
  const handleAssignEngineer = useCallback((orderId, engineerName) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: 'engineer_assigned',
        assignedEngineer: engineerName,
        engineerVisitDate: new Date(Date.now() + 86400000).toLocaleString()
      };
    }));
    showToast(`📋 Инженер «${engineerName}» назначен! Ожидает выезд на объект.`);
    setSelectedOrder(null);
  }, []);

  // ═══════════════════════════════════════
  // ►  ИНЖЕНЕР: Начать выезд на объект
  // ═══════════════════════════════════════
  const handleStartVisit = useCallback((orderId) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return { ...ord, status: 'engineer_visit' };
    }));
    showToast(`🚗 Выезд на объект начат! Инженер направляется.`);
    setSelectedOrder(null);
  }, []);

  // ═══════════════════════════════════════
  // ►  ИНЖЕНЕР: Завершить осмотр → смета готова
  // ═══════════════════════════════════════
  const handleCompleteInspection = useCallback((orderId, report) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: 'estimate_ready',
        engineerReport: report || 'Осмотр проведён. Смета сформирована на основании обследования.'
      };
    }));
    showToast(`📊 Осмотр завершён! Смета готова. Заявка передаётся на поиск исполнителя.`);
    setSelectedOrder(null);
  }, []);

  // ═══════════════════════════════════════
  // ►  МЕНЕДЖЕР: Отправить исполнителю
  // ═══════════════════════════════════════
  const handleSendToExecutor = useCallback((orderId) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return { ...ord, status: 'pending_executor' };
    }));
    showToast(`⏳ Заявка выставлена для исполнителей. Ожидаем принятие.`);
    setSelectedOrder(null);
  }, []);

  const handleCompleteOrder = useCallback((orderId) => {
    setConfirmAction({
      title: '🎉 Завершить заказ?',
      message: 'Все этапы выполнены. Подтвердите завершение заказа. Остатки эскроу будут разморожены. Заказчик получит уведомление.',
      onConfirm: () => {
        setOrders(prev => prev.map(ord => {
          if (ord.id !== orderId) return ord;
          return {
            ...ord,
            status: 'completed',
            completedAt: new Date().toLocaleString()
          };
        }));
        showToast(`🎉 Заказ ${orderId} завершён! Все средства разморожены.`);
        setSelectedOrder(null);
        setConfirmAction(null);
      }
    });
  }, []);

  // Dynamic Filtering (с учётом роли!)
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // ═══ РОЛЕВАЯ ФИЛЬТРАЦИЯ ═══
      // Исполнитель видит ТОЛЬКО: pending_executor, in_progress, completed
      if (role === 'engineer' || role === 'executor') {
        if (!['pending_executor', 'in_progress', 'completed'].includes(ord.status)) return false;
      }

      // Поиск
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ord.title.toLowerCase().includes(q);
        const matchesClient = ord.clientName.toLowerCase().includes(q);
        const matchesId = ord.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesId) return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'engineer_group') {
          if (!['engineer_assigned', 'engineer_visit', 'estimate_ready'].includes(ord.status)) return false;
        } else if (ord.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, role]);

  // Stats
  const totalCount = filteredOrders.length;
  const totalSum = filteredOrders.reduce((acc, o) => acc + o.amount, 0);
  const handleToggleMachinery = (orderId, stageId, machineId) => {
    setOrders(prevOrders => prevOrders.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        stages: ord.stages?.map(stg => {
          if (stg.id !== stageId) return stg;
          return {
            ...stg,
            machinery: stg.machinery?.map(m => {
              if (m.id !== machineId) return m;
              const newAssigned = !m.assigned;
              showToast(newAssigned ? `🚜 ${m.name} успешно забронирован на этап! (GPS Online)` : `Техника ${m.name} снята с этапа`);
              return { ...m, assigned: newAssigned };
            })
          };
        })
      };
    }));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({
        ...prev,
        stages: prev.stages?.map(stg => {
          if (stg.id !== stageId) return stg;
          return {
            ...stg,
            machinery: stg.machinery?.map(m => {
              if (m.id !== machineId) return m;
              return { ...m, assigned: !m.assigned };
            })
          };
        })
      }));
    }
  };

  const formatMoney = (sum) => {
    return sum.toLocaleString('ru-RU') + ' ₸';
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrderTitle || !newOrderClient || !newOrderAmount) return;

    const newOrd = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newOrderTitle,
      clientName: newOrderClient,
      clientPhone: '+7 (700) 000-00-00',
      amount: parseFloat(newOrderAmount),
      status: 'new',
      date: 'Сегодня',
      city: newOrderCity,
      category: 'Общее строительство',
      description: 'Новый созданный заказ.',
      stages: []
    };

    setOrders([newOrd, ...orders]);
    setShowCreateModal(false);
    setNewOrderTitle('');
    setNewOrderClient('');
    setNewOrderAmount('');
    showToast('🎉 Новый заказ успешно создан!');
  };

  return (
    <div className="uo-container">
      {toastMessage && <div className="uo-toast">{toastMessage}</div>}

      {/* Header Bar */}
      <div className="uo-header-bar">
        <button className="uo-back-btn" onClick={onBack} title="Вернуться">←</button>
        <div className="uo-title-flex">
          <span className="uo-header-icon">📋</span>
          <h2>Заказы</h2>
        </div>

        <button className="uo-btn-create" onClick={() => setShowCreateModal(true)}>
          ➕ Создать заказ
        </button>
      </div>

      <div className="uo-content">
        
        {/* User Role Card Header */}
        <div className="uo-role-card">
          <div className="uo-role-info">
            <div className="uo-avatar-box">👤</div>
            <div>
              <div className="uo-user-name">
                {currentUser?.name || 'Пользователь системы'}
              </div>
              <div className="uo-user-role">
                Текущая роль: {role === 'customer' ? 'Заказчик' : (role === 'engineer' ? 'Инженер' : 'Компания')}
              </div>
            </div>
          </div>

          <button className="uo-btn-switch-role" onClick={() => {
            const nextRole = role === 'customer' ? 'engineer' : 'customer';
            setRole(nextRole);
            if (onSwitchRole) onSwitchRole(nextRole);
            showToast(`🔄 Переключено на роль: ${nextRole === 'customer' ? 'Заказчик' : 'Инженер'}`);
          }}>
            🔄 Сменить роль
          </button>
        </div>

        {/* Total Summary KPI Container */}
        <div className="uo-summary-box">
          <div className="uo-kpi-item">
            <div className="uo-kpi-num">{totalCount}</div>
            <div className="uo-kpi-sub">ВСЕГО ЗАКАЗОВ</div>
          </div>

          <div className="uo-kpi-divider"></div>

          <div className="uo-kpi-item">
            <div className="uo-kpi-num pink">{formatMoney(totalSum)}</div>
            <div className="uo-kpi-sub">ОБЩАЯ СУММА</div>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="uo-list-card">
          <div className="uo-list-header">
            <div className="uo-list-title flex-align">
              <span>📋</span>
              <h3>Список заказов</h3>
            </div>

            {/* Filter Tabs (зависят от роли) */}
            <div className="uo-filter-tabs">
              {(role === 'engineer' || role === 'executor' ? [
                { key: 'all', label: 'Все' },
                { key: 'pending_executor', label: '⏳ Доступные заявки' },
                { key: 'in_progress', label: '🟢 Мои работы' },
                { key: 'completed', label: '✅ Завершённые' }
              ] : [
                { key: 'all', label: 'Все' },
                { key: 'new', label: '🆕 Новые' },
                { key: 'engineer_group', label: '🚗 Инженер' },
                { key: 'pending_executor', label: '⏳ Ждёт исполнителя' },
                { key: 'in_progress', label: '🟢 В работе' },
                { key: 'completed', label: '✅ Завершённые' }
              ]).map(tab => (
                <button 
                  key={tab.key}
                  className={`uo-tab ${statusFilter === tab.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="uo-search-wrap">
            <span className="uo-search-icon">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру заказа, названию объекта или клиенту..." 
            />
            {searchQuery && (
              <button className="uo-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* Table */}
          <div className="uo-table-wrap">
            <table className="uo-table">
              <thead>
                <tr>
                  <th>ЗАКАЗ</th>
                  <th>КЛИЕНТ</th>
                  <th>СУММА</th>
                  <th>СТАТУС</th>
                  <th style={{ textAlign: 'right' }}>ДЕЙСТВИЯ</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="uo-empty-td">
                      <div className="uo-empty">
                        <span>📭</span>
                        <p>Заказы не найдены</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(ord => (
                    <tr key={ord.id} onClick={() => setSelectedOrder(ord)} className="uo-tr-hover">
                      <td>
                        <div className="uo-ord-title">{ord.title}</div>
                        <div className="uo-ord-id">{ord.id} • 📍 {ord.city}</div>
                      </td>

                      <td>
                        <div className="uo-client-name">{ord.clientName}</div>
                        <div className="uo-client-phone">{ord.clientPhone}</div>
                      </td>

                      <td>
                        <div className="uo-amount">{formatMoney(ord.amount)}</div>
                      </td>

                      <td>
                        <span className={`uo-status-pill ${ord.status}`}>
                          {getStatusLabel(ord.status)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="uo-btn-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                        >
                          👁️ Детали
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="uo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="uo-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uo-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>

            <div className="uo-m-header">
              <span className="uo-m-badge">{selectedOrder.id}</span>
              <h2>{selectedOrder.title}</h2>
              <div className="uo-m-sub">📍 {selectedOrder.city} • {selectedOrder.date}</div>
            </div>

            <div className="uo-m-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="uo-m-row">
                <span className="label">Клиент:</span>
                <span className="val">{selectedOrder.clientName} ({selectedOrder.clientPhone})</span>
              </div>

              <div className="uo-m-row">
                <span className="label">Сумма заказа:</span>
                <span className="val highlight">{formatMoney(selectedOrder.amount)}</span>
              </div>

              <div className="uo-m-row">
                <span className="label">Текущий статус:</span>
                <span className={`uo-status-pill ${selectedOrder.status}`}>{getStatusLabel(selectedOrder.status)}</span>
              </div>

              <div className="uo-m-section mt-3">
                <h4>📋 Описание объекта</h4>
                <p>{selectedOrder.description}</p>
              </div>

              {/* ═══ ПАЙПЛАЙН: Информация об инженере ═══ */}
              {(selectedOrder.assignedEngineer || ['engineer_assigned','engineer_visit','estimate_ready','pending_executor','in_progress','completed'].includes(selectedOrder.status)) && (
                <div style={{ marginTop: '1.25rem', padding: '14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏗️ Выезд инженера
                  </h4>
                  {selectedOrder.assignedEngineer && (
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '6px' }}>
                      👷 Инженер: <strong>{selectedOrder.assignedEngineer}</strong>
                    </div>
                  )}
                  {selectedOrder.engineerVisitDate && (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                      📅 Дата выезда: <strong style={{ color: '#38bdf8' }}>{selectedOrder.engineerVisitDate}</strong>
                    </div>
                  )}
                  {selectedOrder.engineerReport && (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', lineHeight: 1.5 }}>
                      📝 <strong style={{ color: '#e2e8f0' }}>Отчёт инженера:</strong> {selectedOrder.engineerReport}
                    </div>
                  )}
                  {selectedOrder.acceptedBy && (
                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '6px' }}>
                      ✅ Принято исполнителем: <strong>{selectedOrder.acceptedBy}</strong> ({selectedOrder.acceptedAt})
                    </div>
                  )}
                </div>
              )}

              {/* ═══ ПАЙПЛАЙН: Кнопки действий по ролям ═══ */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Менеджер: Назначить инженера (new → engineer_assigned) */}
                {selectedOrder.status === 'new' && (role === 'manager' || role === 'admin' || role === 'customer') && (
                  <button onClick={() => handleAssignEngineer(selectedOrder.id, 'Асхат Нурланов')}
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    📋 Назначить инженера
                  </button>
                )}

                {/* Инженер: Начать выезд (engineer_assigned → engineer_visit) */}
                {selectedOrder.status === 'engineer_assigned' && (role === 'engineer' || role === 'manager' || role === 'admin') && (
                  <button onClick={() => handleStartVisit(selectedOrder.id)}
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    🚗 Начать выезд на объект
                  </button>
                )}

                {/* Инженер: Завершить осмотр (engineer_visit → estimate_ready) */}
                {selectedOrder.status === 'engineer_visit' && (role === 'engineer' || role === 'manager' || role === 'admin') && (
                  <button onClick={() => handleCompleteInspection(selectedOrder.id, 'Осмотр проведён. Замечания учтены. Смета сформирована.')}
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    📊 Завершить осмотр и сформировать смету
                  </button>
                )}

                {/* Менеджер: Отправить исполнителю (estimate_ready → pending_executor) */}
                {selectedOrder.status === 'estimate_ready' && (role === 'manager' || role === 'admin' || role === 'customer') && (
                  <button onClick={() => handleSendToExecutor(selectedOrder.id)}
                    style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    ⏳ Отправить на поиск исполнителя
                  </button>
                )}
              </div>

              {/* 🚜 SMART GPS MACHINERY DISPATCH FOR PROJECT STAGES */}
              {selectedOrder.stages && selectedOrder.stages.length > 0 && (
                <div className="uo-stages-container" style={{ marginTop: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏗️</span> График этапов работ и подбор спецтехники (GPS)
                    </h4>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      📍 Автоподбор ближайших машин
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedOrder.stages.map(stg => (
                      <div key={stg.id} style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{stg.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                              ⏱ Сроки: {stg.dateRange} • Бюджет этапа: <strong style={{ color: '#00ff88' }}>{formatMoney(stg.budget)}</strong>
                            </div>
                          </div>
                          <span className={`uo-status-pill ${stg.status}`} style={{ fontSize: '0.75rem' }}>
                            {stg.status === 'completed' && '✅ Выполнен'}
                            {stg.status === 'in_progress' && `🟢 В процессе (${stg.progress}%)`}
                            {stg.status === 'pending' && '⏳ Запланирован'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{
                            width: `${stg.progress}%`,
                            height: '100%',
                            background: stg.status === 'completed' ? '#10b981' : 'linear-gradient(90deg, #38bdf8, #00ff88)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>

                        {/* ═══ УПРАВЛЕНИЕ ЭТАПОМ ═══ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {/* Эскроу индикатор */}
                          <div style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                            background: stg.status === 'completed' ? 'rgba(16,185,129,0.15)' : stg.status === 'in_progress' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                            color: stg.status === 'completed' ? '#10b981' : stg.status === 'in_progress' ? '#f59e0b' : '#64748b',
                            border: `1px solid ${stg.status === 'completed' ? 'rgba(16,185,129,0.3)' : stg.status === 'in_progress' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`
                          }}>
                            {stg.status === 'completed' ? '🔓 Эскроу разморожен' : stg.status === 'in_progress' ? `🔒 Эскроу: ${formatMoney(stg.budget || 0)}` : '💤 Эскроу не активен'}
                          </div>

                          <div style={{ flex: 1 }} />

                          {/* Кнопка: Начать этап */}
                          {stg.status === 'pending' && (
                            <button
                              onClick={() => handleStartStage(selectedOrder.id, stg.id)}
                              style={{
                                background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff',
                                border: '1px solid rgba(56, 189, 248, 0.5)', padding: '6px 14px',
                                borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              🚀 Начать этап
                            </button>
                          )}

                          {/* Слайдер прогресса + Завершить */}
                          {stg.status === 'in_progress' && (
                            <>
                              <input
                                type="range"
                                min="1" max="99"
                                value={stg.progress}
                                onChange={(e) => handleUpdateProgress(selectedOrder.id, stg.id, parseInt(e.target.value))}
                                style={{ width: '100px', accentColor: '#00e5ff', cursor: 'pointer' }}
                                title={`Прогресс: ${stg.progress}%`}
                              />
                              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, minWidth: '35px' }}>{stg.progress}%</span>
                              <button
                                onClick={() => handleCompleteStage(selectedOrder.id, stg.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff',
                                  border: '1px solid rgba(16, 185, 129, 0.5)', padding: '6px 14px',
                                  borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer'
                                }}
                              >
                                ✅ Завершить этап
                              </button>
                            </>
                          )}

                          {/* Завершён */}
                          {stg.status === 'completed' && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>✓ Выполнено на 100%</span>
                          )}
                        </div>

                        {/* Needed Machinery for this stage */}
                        <div style={{ background: 'rgba(8, 12, 22, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🚜</span> Необходимая спецтехника для этого этапа (Подобрано с маркетплейса):
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                            {stg.machinery?.map(m => (
                              <div key={m.id} style={{
                                display: 'flex',
                                gap: '10px',
                                background: m.assigned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                border: m.assigned ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '8px',
                                alignItems: 'center'
                              }}>
                                <img
                                  src={m.photo}
                                  alt={m.name}
                                  style={{ width: '64px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '700' }}>
                                    📍 {m.dist} • {m.rate}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: m.assigned ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
                                    {m.assigned ? '✅ Закреплена за этапом' : '🟢 Свободна (GPS Online)'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMachinery(selectedOrder.id, stg.id, m.id)}
                                  style={{
                                    background: m.assigned ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                                    color: m.assigned ? '#f87171' : '#ffffff',
                                    border: m.assigned ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.5)',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {m.assigned ? '✕ Отвязать' : '⚡ В этап'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="uo-m-actions">
              {/* Кнопка: Взять заказ (для исполнителя, если pending_executor) */}
              {selectedOrder.status === 'pending_executor' && (role === 'engineer' || role === 'executor' || role === 'company') && (
                <button 
                  className="uo-btn-chat"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '1px solid rgba(245,158,11,0.5)' }}
                  onClick={() => handleAcceptOrder(selectedOrder.id)}
                >
                  ✋ Взять заказ
                </button>
              )}

              {/* Кнопка: Завершить заказ (если все этапы completed) */}
              {selectedOrder.stages && selectedOrder.stages.length > 0 && selectedOrder.stages.every(s => s.status === 'completed') && selectedOrder.status !== 'completed' && (
                <button 
                  className="uo-btn-chat"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid rgba(16,185,129,0.5)' }}
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                >
                  🎉 Завершить заказ
                </button>
              )}

              <button 
                className="uo-btn-chat"
                onClick={() => showToast(`💬 Чат по заказу ${selectedOrder.id} открыт`)}
              >
                💬 Написать в чат
              </button>

              <button 
                className="uo-btn-close-m"
                onClick={() => setSelectedOrder(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="uo-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="uo-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uo-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            
            <h3>➕ Создать новый заказ</h3>
            <p className="uo-modal-sub-text">Введите параметры нового строительного объекта</p>

            <form onSubmit={handleCreateOrder}>
              <div className="uo-form-group">
                <label>Название заказа / объекта <span>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newOrderTitle}
                  onChange={e => setNewOrderTitle(e.target.value)}
                  placeholder="например, Ремонт квартиры 85м²" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Клиент / Заказчик <span>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newOrderClient}
                  onChange={e => setNewOrderClient(e.target.value)}
                  placeholder="например, ТОО 'Астана Строй' или Имя" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Сумма заказа (₸) <span>*</span></label>
                <input 
                  type="number" 
                  required 
                  value={newOrderAmount}
                  onChange={e => setNewOrderAmount(e.target.value)}
                  placeholder="например, 2500000" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Город <span>*</span></label>
                <select 
                  value={newOrderCity} 
                  onChange={e => setNewOrderCity(e.target.value)}
                  className="uo-input"
                >
                  <option value="Алматы">Алматы</option>
                  <option value="Астана">Астана</option>
                  <option value="Шымкент">Шымкент</option>
                  <option value="Караганда">Караганда</option>
                  <option value="Актобе">Актобе</option>
                </select>
              </div>

              <button type="submit" className="uo-btn-submit mt-4">
                🚀 Сохранить и выставить заказ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Модалка подтверждения (Эскроу / Завершение) ═══ */}
      {confirmAction && (
        <div className="uo-modal-overlay" onClick={() => setConfirmAction(null)} style={{ zIndex: 10001 }}>
          <div className="uo-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>{confirmAction.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={confirmAction.onConfirm}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  border: 'none', padding: '10px 28px', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                ✅ Подтвердить
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.15)', padding: '10px 28px', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
