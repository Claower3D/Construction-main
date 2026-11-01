import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './UserOrdersPage.css';
import { authHeaders, parseMoney, localDateKey, reportSyncError } from '../services/platformUtils';
import { createPlatformOrder, upsertCrmEvent } from '../services/orderSyncService';
import { releaseEscrow } from '../services/walletEngine';

// ── Ключ для localStorage (Единый реестр заказов для всех ролей и устройств) ──
function getOrdersKey() {
  return 'qazgost_orders_shared';
}

// Локальные заказы этого устройства (создаются orderSyncService.createPlatformOrder)
function loadLocalOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
    return Array.isArray(parsed) ? parsed.filter(o => o && o.id) : [];
  } catch {
    return [];
  }
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
    estimate_ready:     { label: '📊 Смета готова',            color: '#a78bfa' },
    pending_executor:   { label: '⏳ Ждёт исполнителя',       color: '#eab308' },
    in_progress:        { label: '🟢 В работе',               color: '#10b981' },
    completed:          { label: '✅ Завершён',               color: '#22c55e' }
  };

  const getStatusLabel = (status) => STATUS_CONFIG[status]?.label || status;

  // Раньше здесь были демо-заказы, которые перезаписывали реальные локальные заказы в localStorage
  const [orders, setOrders] = useState(loadLocalOrders);

  // ── Видимость: заказчик видит только свои заказы; исполнитель — свои и ожидающие исполнителя; персонал — все ──
  const actualRole = currentUser?.role || 'guest';
  const myKeys = useMemo(() => new Set(
    [currentUser?.email, currentUser?.login, currentUser?.name, currentUser?.id].filter(Boolean).map(String)
  ), [currentUser]);
  const canSeeOrder = useCallback((o) => {
    if (!o) return false;
    if (['admin', 'manager', 'engineer'].includes(actualRole)) return true;
    const mine = myKeys.has(String(o.createdBy || '')) || myKeys.has(String(o.ownerName || ''))
      || myKeys.has(String(o.clientName || '')) || myKeys.has(String(o.acceptedByEmail || ''))
      || myKeys.has(String(o.acceptedBy || ''));
    if (mine) return true;
    return actualRole === 'executor' && o.status === 'pending_executor';
  }, [actualRole, myKeys]);
  const canSeeRef = useRef(canSeeOrder);
  canSeeRef.current = canSeeOrder;
  const syncFailedRef = useRef(false);


  // Form State
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderCity, setNewOrderCity] = useState('Алматы');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── SERVER-FIRST: загрузка заказов с сервера (локальные заказы уже в состоянии) ──
  const fetchServerOrders = useCallback(async () => {
    const canSee = canSeeRef.current;
    try {
      // 1. Заказы с Go Backend (только с настоящим JWT; без него сервер ответит 401)
      const ordersRes = await fetch('/api/v1/orders', { headers: authHeaders() });
      if (ordersRes.ok) {
        const serverOrders = await ordersRes.json().catch(() => null);
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          setOrders(prev => {
            const merged = [...prev];
            // Заказ, созданный на этом устройстве и уже отправленный на сервер, не дублируем
            const knownServerIds = new Set(prev.map(o => o.serverId).filter(v => v !== undefined && v !== null).map(String));
            serverOrders.forEach(so => {
              if (!so || so.id === undefined || knownServerIds.has(String(so.id))) return;
              const orderId = `ORD-${so.id}`;
              if (merged.some(m => m.id === orderId || m.id === String(so.id))) return;
              const mapped = {
                id: orderId,
                serverId: so.id,
                source: 'server',
                title: so.title || 'Строительная заявка',
                clientName: so.clientName || so.contractor || 'Заказчик',
                clientPhone: so.clientPhone || '',
                createdBy: so.createdBy || '',
                amount: parseMoney(so.totalSum),
                status: so.status === 'В работе' ? 'in_progress' : (so.status === 'Завершено' ? 'completed' : 'new'),
                date: so.createdAt ? new Date(so.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
                city: so.location || '',
                category: so.jobType || 'Общестроительные работы',
                description: '',
                stages: Array.isArray(so.stages) ? so.stages : []
              };
              if (canSee(mapped)) merged.unshift(mapped);
            });
            return merged;
          });
        }
      }

      // 2. CRM-события (заявки, созданные через CRM/другие устройства)
      const crmRes = await fetch('/api/v1/crm/events', { headers: authHeaders() });
      if (!crmRes.ok) throw new Error(`CRM HTTP ${crmRes.status}`);
      const data = await crmRes.json().catch(() => null);
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setOrders(prev => {
          const next = [...prev];
          // CRM-событие локального заказа имеет id `crm-<orderId>` — не дублируем заказ
          const localCrmIds = new Set(prev.map(o => o.crmEventId || `crm-${o.id}`));
          data.items.forEach(evt => {
            if (!evt || !evt.id || localCrmIds.has(evt.id)) return;
            const orderId = String(evt.id).startsWith('ORD-') ? evt.id : `CRM-${evt.id}`;
            if (next.some(o => o.id === orderId || o.id === evt.id)) return;
            const mapped = {
              id: orderId,
              source: 'crm',
              crmEventId: evt.id,
              title: evt.title || 'Строительная заявка',
              clientName: evt.contractor || evt.clientName || 'Заказчик',
              clientPhone: evt.phone || '',
              createdBy: evt.createdBy || '',
              amount: parseMoney(evt.budget), // без выдуманных 1 500 000 по умолчанию
              status: evt.status === 'В работе' ? 'in_progress' : (evt.status === 'Успешно' ? 'completed' : 'new'),
              date: evt.date || '',
              city: evt.location || '',
              category: 'Общестроительные работы',
              description: evt.notes || evt.description || 'Заявка передана из CRM',
              assignedEngineer: evt.assignedEngineer || '',
              stages: []
            };
            if (canSee(mapped)) next.unshift(mapped);
          });
          return next;
        });
      }
      syncFailedRef.current = false;
    } catch (e) {
      // Сервер недоступен — работаем с локальными заказами, сообщаем один раз
      if (!syncFailedRef.current) {
        syncFailedRef.current = true;
        showToast('⚠️ Сервер недоступен — показаны только заказы с этого устройства');
      }
    }
  }, []);

  useEffect(() => {
    fetchServerOrders();

    // Поллинг сервера каждые 5 секунд для кросс-устройственной синхронизации
    const pollInterval = setInterval(() => {
      fetchServerOrders();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [fetchServerOrders]);

  // ── localStorage: кешируем ЛОКАЛЬНЫЕ заказы, не затирая чужие (других пользователей этого устройства) ──
  useEffect(() => {
    try {
      const existing = loadLocalOrders();
      const own = orders.filter(o => o.source !== 'server' && o.source !== 'crm');
      const ownIds = new Set(own.map(o => o.id));
      localStorage.setItem(getOrdersKey(), JSON.stringify([...own, ...existing.filter(o => !ownIds.has(o.id))]));
    } catch (e) { console.warn('Orders cache error:', e); }
  }, [orders]);

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

  // Выплата исполнителю из эскроу заказчика (walletEngine.releaseEscrow)
  const payoutEscrow = useCallback((order, amount, title) => {
    if (!order) return { ok: false, reason: 'заказ не найден' };
    const receiver = order.acceptedByEmail || order.acceptedBy
      ? { email: order.acceptedByEmail || undefined, name: order.acceptedBy }
      : null;
    if (!receiver) return { ok: false, reason: 'исполнитель не назначен' };
    const r = releaseEscrow({
      amount: amount > 0 ? amount : undefined,
      title,
      fromUser: currentUser,
      toUser: receiver,
      escrowTxId: order.escrowTxId || null,
      orderId: order.id,
    });
    if (r.ok) return { ok: true, released: r.released };
    return { ok: false, reason: r.error === 'no_escrow' ? 'нет удерживаемых средств по заказу' : r.error };
  }, [currentUser]);

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
    showToast(`🚀 Этап начат!`);
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
        const ord = orders.find(o => o.id === orderId);
        const stg = ord?.stages?.find(st => st.id === stageId);
        const payout = payoutEscrow(ord, parseMoney(stg?.budget), `Этап «${stg?.name || stageId}» заказа ${orderId}`);
        showToast(payout.ok
          ? `✅ Этап завершён! Эскроу ${formatMoney(payout.released)} разморожен → исполнителю`
          : `✅ Этап завершён. ⚠️ Выплата не проведена: ${payout.reason}`);
        setConfirmAction(null);
      }
    });
  }, [recalcOrderStatus, orders, payoutEscrow]);

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
    // Берём заказ из текущего состояния (раньше читали переменную, заполняемую внутри updater setState — ненадёжно)
    const acceptedOrder = orders.find(ord => ord.id === orderId) || null;
    const scheduleEvents = [];
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: 'in_progress',
        acceptedBy: currentUser?.name || 'Исполнитель',
        acceptedByEmail: currentUser?.email || '',
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
          scheduleEvents.push({ date: startDate, idx: existing[startDate].length });
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
            scheduleEvents.push({ date: endDate, idx: existing[endDate].length });
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
              const techDate = localDateKey(nextDay);
              if (!existing[techDate]) existing[techDate] = [];
              scheduleEvents.push({ date: techDate, idx: existing[techDate].length });
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

        // График сохраняется на сервере (иначе опрос CRM затирал его через 8 сек)
        const toPush = scheduleEvents.map(({ date, idx }) => ({ ...existing[date][idx], date }));
        Promise.all(toPush.map(ev => upsertCrmEvent({ ...ev, createdBy: currentUser?.email || currentUser?.name || '' })))
          .then(results => {
            const failed = results.filter(r => !r.ok);
            if (failed.length) reportSyncError(`График заказа ${orderId}: ${failed.length} из ${results.length} событий не сохранены на сервере (${failed[0].error})`);
          });
      } catch (e) { console.warn('Calendar auto-schedule error:', e); }
    }

    showToast(`✅ Заказ ${orderId} принят! График работ автоматически создан в CRM-календаре 📅`);
    setSelectedOrder(null);
  }, [currentUser, orders]);

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
      return {
        ...ord,
        status: 'pending_executor',
        transferredToExecutor: true,
        managerApprovedRevision: false
      };
    }));
    showToast(`⏳ Заявка выставлена для исполнителей. Ожидаем принятие.`);
    setSelectedOrder(null);
  }, []);

  const handleReturnOrderToManager = useCallback((orderId, reason = 'Требуется пересогласование сметы/условий') => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: 'new',
        returnedToManager: true,
        managerResolutionPending: true,
        managerApprovedRevision: false,
        transferredToExecutor: false,
        returnReason: reason
      };
    }));
    showToast(`↩️ Заявка возвращена менеджеру на пересогласование.`);
    setSelectedOrder(null);
  }, []);

  const handleManagerResolveReassign = useCallback((orderId) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        status: 'engineer_assigned',
        returnedToManager: false,
        managerResolutionPending: false,
        managerApprovedRevision: true,
        transferredToExecutor: false
      };
    }));
    showToast(`🔄 Правки согласованы менеджером! Заявка возвращена инженеру для повторной передачи.`);
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
        const payout = payoutEscrow(orders.find(o => o.id === orderId), undefined, `Остаток эскроу по заказу ${orderId}`);
        showToast(payout.ok
          ? `🎉 Заказ ${orderId} завершён! Остаток эскроу ${formatMoney(payout.released)} выплачен исполнителю.`
          : `🎉 Заказ ${orderId} завершён. ${payout.reason === 'нет удерживаемых средств по заказу' ? 'Остатка эскроу нет.' : `⚠️ Выплата не проведена: ${payout.reason}`}`);
        setSelectedOrder(null);
        setConfirmAction(null);
      }
    });
  }, [orders, payoutEscrow]);

  // Dynamic Filtering (с учётом роли!)
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // Видимость по реальной роли/владельцу (раньше «Мои заказы» показывали заказы всех клиентов)
      if (!canSeeOrder(ord)) return false;
      // ═══ РОЛЕВАЯ ФИЛЬТРАЦИЯ ═══
      // Исполнитель видит ТОЛЬКО: pending_executor, in_progress, completed
      if (role === 'engineer' || role === 'executor') {
        if (!['pending_executor', 'in_progress', 'completed'].includes(ord.status)) return false;
      }

      // Поиск
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = String(ord.title || '').toLowerCase().includes(q);
        const matchesClient = String(ord.clientName || '').toLowerCase().includes(q);
        const matchesId = String(ord.id || '').toLowerCase().includes(q);
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
  }, [orders, searchQuery, statusFilter, role, canSeeOrder]);

  // Stats
  const totalCount = filteredOrders.length;
  const totalSum = filteredOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
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

  function formatMoney(sum) {
    return (Number(sum) || 0).toLocaleString('ru-RU') + ' ₸';
  }

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrderTitle || !newOrderClient || !newOrderAmount) return;

    const amount = parseMoney(newOrderAmount);
    if (!(amount > 0)) { showToast('⚠️ Укажите корректную сумму заказа'); return; }
    // Через общий сервис: уникальный ID, синхронизация с сервером и CRM
    const newOrd = createPlatformOrder({
      title: newOrderTitle,
      clientName: newOrderClient,
      amount,
      city: newOrderCity,
      category: 'Общее строительство',
      description: 'Новый созданный заказ.',
      type: 'general',
      status: 'new',
      paymentMethod: 'По договорённости',
    });

    setOrders([newOrd, ...orders.filter(o => o.id !== newOrd.id)]);
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
                Текущая роль: {
                  role === 'customer' ? 'Заказчик' :
                  role === 'manager' ? 'Менеджер' :
                  role === 'engineer' ? 'Инженер' :
                  role === 'executor' ? 'Исполнитель' : 'Компания'
                }
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'manager', label: '👨‍💼 Менеджер' },
              { key: 'engineer', label: '👷 Инженер' },
              { key: 'executor', label: '🔨 Исполнитель' },
              { key: 'customer', label: '👤 Заказчик' }
            ].map(r => (
              <button
                key={r.key}
                className={`uo-btn-switch-role ${role === r.key ? 'active' : ''}`}
                style={{
                  background: role === r.key ? 'linear-gradient(135deg, #00e5ff, #7c3aed)' : 'rgba(255,255,255,0.06)',
                  color: role === r.key ? '#0a1628' : '#ece9f8',
                  border: role === r.key ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.12)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setRole(r.key);
                  if (onSwitchRole) onSwitchRole(r.key);
                  showToast(`🔄 Переключено на роль: ${r.label}`);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
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
                    <div style={{ fontSize: '0.85rem', color: '#ece9f8', marginBottom: '6px' }}>
                      👷 Инженер: <strong>{selectedOrder.assignedEngineer}</strong>
                    </div>
                  )}
                  {selectedOrder.engineerVisitDate && (
                    <div style={{ fontSize: '0.85rem', color: '#a39cc2', marginBottom: '6px' }}>
                      📅 Дата выезда: <strong style={{ color: '#b9a4ff' }}>{selectedOrder.engineerVisitDate}</strong>
                    </div>
                  )}
                  {selectedOrder.engineerReport && (
                    <div style={{ fontSize: '0.85rem', color: '#a39cc2', marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', lineHeight: 1.5 }}>
                      📝 <strong style={{ color: '#ece9f8' }}>Отчёт инженера:</strong> {selectedOrder.engineerReport}
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
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
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

                {/* Инженер: Вернуть менеджеру на пересогласование */}
                {(selectedOrder.status === 'engineer_assigned' || selectedOrder.status === 'engineer_visit' || selectedOrder.status === 'estimate_ready') && (role === 'engineer' || role === 'admin') && (
                  <button onClick={() => handleReturnOrderToManager(selectedOrder.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    ❌ Вернуть менеджеру
                  </button>
                )}

                {/* Менеджер: Согласовать возврат и вернуть инженеру */}
                {selectedOrder.returnedToManager && (role === 'manager' || role === 'admin') && (
                  <button onClick={() => handleManagerResolveReassign(selectedOrder.id)}
                    style={{ background: 'linear-gradient(135deg, #00e5ff, #7c3aed)', color: '#0a1628', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}>
                    🔄 Согласовать и вернуть инженеру
                  </button>
                )}
              </div>

              {/* 🚜 SMART GPS MACHINERY DISPATCH FOR PROJECT STAGES */}
              {selectedOrder.stages && selectedOrder.stages.length > 0 && (
                <div className="uo-stages-container" style={{ marginTop: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#b9a4ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏗️</span> График этапов работ и подбор спецтехники (GPS)
                    </h4>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(185, 164, 255, 0.15)', color: '#b9a4ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(185, 164, 255, 0.3)' }}>
                      📍 Автоподбор ближайших машин
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedOrder.stages.map(stg => (
                      <div key={stg.id} style={{
                        background: 'rgba(21, 18, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{stg.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#a39cc2', marginTop: '2px' }}>
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
                            background: stg.status === 'completed' ? '#10b981' : 'linear-gradient(90deg, #b9a4ff, #00ff88)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>

                        {/* ═══ УПРАВЛЕНИЕ ЭТАПОМ ═══ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {/* Эскроу индикатор */}
                          <div style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                            background: stg.status === 'completed' ? 'rgba(16,185,129,0.15)' : stg.status === 'in_progress' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                            color: stg.status === 'completed' ? '#10b981' : stg.status === 'in_progress' ? '#f59e0b' : '#8a82a8',
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
                                background: 'linear-gradient(135deg, #7c3aed, #0369a1)', color: '#fff',
                                border: '1px solid rgba(185, 164, 255, 0.5)', padding: '6px 14px',
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
                              <span style={{ fontSize: '0.75rem', color: '#b9a4ff', fontWeight: 800, minWidth: '35px' }}>{stg.progress}%</span>
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
                        <div style={{ background: 'rgba(8, 12, 22, 0.6)', border: '1px solid rgba(185, 164, 255, 0.2)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ece9f8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                  <div style={{ fontSize: '0.72rem', color: '#b9a4ff', fontWeight: '700' }}>
                                    📍 {m.dist} • {m.rate}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: m.assigned ? '#34d399' : '#a39cc2', marginTop: '2px' }}>
                                    {m.assigned ? '✅ Закреплена за этапом' : '🟢 Свободна (GPS Online)'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMachinery(selectedOrder.id, stg.id, m.id)}
                                  style={{
                                    background: m.assigned ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #7c3aed, #0369a1)',
                                    color: m.assigned ? '#f87171' : '#ffffff',
                                    border: m.assigned ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(185, 164, 255, 0.5)',
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
            <p style={{ color: '#a39cc2', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>{confirmAction.message}</p>
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
                  background: 'rgba(255,255,255,0.08)', color: '#a39cc2',
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
