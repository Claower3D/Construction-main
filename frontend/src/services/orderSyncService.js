// OrderSyncService - Unified Order & CRM Calendar Dispatcher across Manager, Engineer, Executor & Customer

import {
  jsonAuthHeaders, getAuthToken, getStoredCurrentUser, userKeyOf,
  localDateKey, genId, shortNum, parseMoney, reportSyncError, responseError,
  PIPELINE_STATUS_LABELS,
} from './platformUtils';

const SHARED_KEY = 'qazgost_orders_shared';

function newOrderId() {
  // Было: ORD-2026-<100..999> (900 вариантов → коллизии уже на ~36 заказах)
  return `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function patchStoredOrder(orderId, patch) {
  for (const key of [SHARED_KEY, 'qazgost_orders_customer', 'qazgost_orders_executor']) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(list)) continue;
      let changed = false;
      const next = list.map((o) => {
        if (o && o.id === orderId) { changed = true; return { ...o, ...patch }; }
        return o;
      });
      if (changed) localStorage.setItem(key, JSON.stringify(next));
    } catch { /* ignore */ }
  }
}

/** Upsert CRM-события на сервере (тот же id → обновление). Возвращает { ok, error }. */
export async function upsertCrmEvent(eventPayload) {
  try {
    const res = await fetch('/api/v1/crm/events', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify(eventPayload),
    });
    if (!res.ok) return { ok: false, error: await responseError(res) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || 'Сеть недоступна' };
  }
}

export function createPlatformOrder({
  title,
  category = 'Общестроительные работы',
  amount = 0,
  totalSum,
  budget = '',
  clientName = 'Заказчик',
  clientPhone = '',
  city = 'Алматы',
  description = '',
  status,
  type = 'general', // 'general' | 'machinery' | 'materials' | 'defect' | 'estimate'
  stages = [],
  machinery = [],
  materials = [],
  defectReport = null,
  estimateData = null,
  paymentMethod = 'Эскроу QazGost',
  escrowTxId = null,
  escrowAmount = 0,
  assignedEngineer,
  assignedTo,
}) {
  const isMachineryRental = type === 'machinery' || category?.toLowerCase().includes('техника') || title?.toLowerCase().includes('аренда') || title?.toLowerCase().includes('техник');
  const finalStatus = status || (isMachineryRental ? 'in_progress' : 'new');
  const crmStatus = isMachineryRental && finalStatus === 'new' ? 'В работе' : (PIPELINE_STATUS_LABELS[finalStatus] || 'Новые');

  // Сумма: число как есть; строка — с учётом пробелов/дробной части/диапазонов (раньше «1 500 000.50» → 150 000 050)
  const numericAmount = parseMoney(amount || totalSum || 0) || parseMoney(budget);
  const formattedBudget = budget || (numericAmount ? `${numericAmount.toLocaleString('ru-RU')} ₸` : 'По смете');
  const now = new Date();
  const orderId = newOrderId();
  const owner = getStoredCurrentUser();
  const ownerKey = userKeyOf(owner);

  const orderObj = {
    id: orderId,
    title: title || 'Новая строительная заявка',
    category,
    amount: numericAmount,
    budget: formattedBudget,
    clientName,
    clientPhone,
    city,
    description,
    status: finalStatus,
    type,
    date: now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    createdAt: now.toISOString(),
    createdBy: ownerKey || null,
    ownerName: owner?.name || null,
    paymentMethod,
    escrowTxId: escrowTxId || null,
    escrowAmount: Number(escrowAmount) || 0,
    assignedEngineer: assignedEngineer || undefined,
    assignedTo: assignedTo || undefined,
    crmEventId: `crm-${orderId}`,
    stages: stages.length > 0 ? stages : [
      {
        id: 'STG-1',
        name: 'Этап 1: Подготовительные работы и доставка ресурсов',
        status: isMachineryRental ? 'in_progress' : 'pending',
        progress: isMachineryRental ? 50 : 0,
        dateRange: `${now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${new Date(Date.now() + 86400000 * 3).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`,
        budget: Math.round(numericAmount * 0.3),
        machinery: machinery || []
      },
      {
        id: 'STG-2',
        name: 'Этап 2: Основной комплекс СМР',
        status: 'pending',
        progress: 0,
        dateRange: `${new Date(Date.now() + 86400000 * 4).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${new Date(Date.now() + 86400000 * 10).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`,
        budget: Math.round(numericAmount * 0.7),
        machinery: []
      }
    ],
    defectReport,
    estimateData,
    materials
  };

  // 1. Sync to localStorage Order Stores for All Roles
  try {
    const existingShared = JSON.parse(localStorage.getItem(SHARED_KEY) || '[]');
    localStorage.setItem(SHARED_KEY, JSON.stringify([orderObj, ...(Array.isArray(existingShared) ? existingShared : [])]));

    const custKey = 'qazgost_orders_customer';
    const existingCust = JSON.parse(localStorage.getItem(custKey) || '[]');
    localStorage.setItem(custKey, JSON.stringify([orderObj, ...(Array.isArray(existingCust) ? existingCust : [])]));

    if (type === 'machinery' || type === 'general' || type === 'estimate') {
      const execKey = 'qazgost_orders_executor';
      const existingExec = JSON.parse(localStorage.getItem(execKey) || '[]');
      localStorage.setItem(execKey, JSON.stringify([orderObj, ...(Array.isArray(existingExec) ? existingExec : [])]));
    }
  } catch (e) {
    console.error('OrderSyncService: Failed to save orders', e);
  }

  // ═══ SERVER: заказ на Go Backend (требует настоящий JWT; ошибки не глотаются) ═══
  if (getAuthToken()) {
    fetch('/api/v1/orders', {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        title: orderObj.title || 'Строительная заявка',
        location: `г. ${orderObj.city || 'Алматы'}`,
        type: orderObj.type || 'general',
        contractor: orderObj.clientName || 'Заказчик',
        status: orderObj.status === 'in_progress' ? 'В работе' : 'Запланировано',
        clientName: orderObj.clientName || '',
        clientPhone: orderObj.clientPhone || '',
        totalSum: orderObj.amount || 0,
        createdBy: ownerKey || 'System'
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          reportSyncError(`Заказ ${orderId} не сохранён на сервере: ${await responseError(res)}`);
          patchStoredOrder(orderId, { serverSync: 'failed' });
          return;
        }
        const data = await res.json().catch(() => ({}));
        patchStoredOrder(orderId, { serverId: data.id ?? null, serverSync: 'ok' });
      })
      .catch((e) => {
        reportSyncError(`Заказ ${orderId} не отправлен на сервер: ${e.message}`);
        patchStoredOrder(orderId, { serverSync: 'failed' });
      });
  } else {
    patchStoredOrder(orderId, { serverSync: 'local_only' });
    reportSyncError(`Заказ ${orderId} сохранён только на этом устройстве: нет действующей серверной сессии (войдите в аккаунт).`);
  }

  const todayKey = localDateKey(now);

  // 2. Sync to Manager CRM Calendar Events (qazgost_calendar_events)
  try {
    const savedEvents = localStorage.getItem('qazgost_calendar_events');
    let crmEvents = savedEvents ? JSON.parse(savedEvents) : {};
    if (!crmEvents || typeof crmEvents !== 'object') crmEvents = {};
    if (!crmEvents[todayKey]) crmEvents[todayKey] = [];

    let crmPrefix = '[📝 ЛИД]';
    let eventType = 'request_construction';

    if (type === 'machinery' || isMachineryRental) {
      crmPrefix = '[🚜 ТЕХНИКА]';
      eventType = 'request_machinery';
    } else if (type === 'materials') {
      crmPrefix = '[🧱 МАТЕРИАЛЫ]';
      eventType = 'request_materials';
    } else if (type === 'defect') {
      crmPrefix = '[👷 ИНЖЕНЕР]';
      eventType = 'request_engineering';
    } else if (type === 'contractor' || type === 'contractor_invite') {
      crmPrefix = '[🔨 ПОДРЯДЧИК]';
      eventType = 'request_construction';
    } else if (type === 'engineering') {
      crmPrefix = '[⚙️ ИНЖИНИРИНГ]';
      eventType = 'request_engineering';
    } else if (type === 'construction') {
      crmPrefix = '[🏗️ СТРОИТЕЛЬСТВО]';
      eventType = 'request_construction';
    }

    const crmItem = {
      id: genId('evt'),
      orderId: orderId,
      title: `${crmPrefix} ${title} (#${orderId})`,
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: eventType,
      status: crmStatus,
      desc: description || `Заказ от ${clientName} (${clientPhone}) в г. ${city}. Бюджет: ${formattedBudget}`,
      contractor: 'Не распределено',
      budget: formattedBudget,
      city: city,
      clientName: clientName,
      clientPhone: clientPhone
    };

    crmEvents[todayKey].push(crmItem);
    localStorage.setItem('qazgost_calendar_events', JSON.stringify(crmEvents));
  } catch (e) {
    console.error('OrderSyncService: Failed to push to CRM Calendar', e);
  }

  // 3. Sync to Primary CRM Calendar (qazgost_crm_calendar) used by CrmPage.jsx
  try {
    const crmCalendarKey = 'qazgost_crm_calendar';
    const savedCrmCalendar = localStorage.getItem(crmCalendarKey);
    let crmCalendar = savedCrmCalendar ? JSON.parse(savedCrmCalendar) : {};
    if (!crmCalendar || typeof crmCalendar !== 'object') crmCalendar = {};
    if (!crmCalendar[todayKey]) crmCalendar[todayKey] = [];

    const eventPayload = {
      id: orderObj.crmEventId, // детерминированный id → upsert, без коллизий между заказами
      leadNum: shortNum(orderId),
      title: isMachineryRental ? `🚜 Аренда техники: ${title}` : title,
      status: crmStatus,
      type: isMachineryRental ? 'request_construction' : 'request',
      role: isMachineryRental ? 'machinery' : 'lead',
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      phone: clientPhone || '',
      contractor: clientName || 'Заказчик',
      location: `г. ${city}`,
      budget: formattedBudget,
      description: `Заказ ${orderId}`,
      createdBy: ownerKey || '',
      date: todayKey
    };

    crmCalendar[todayKey].push(eventPayload);

    localStorage.setItem(crmCalendarKey, JSON.stringify(crmCalendar));
    window.dispatchEvent(new CustomEvent('crm_calendar_updated'));

    // Server-wide synchronization for all accounts and devices
    upsertCrmEvent(eventPayload).then((r) => {
      if (!r.ok) reportSyncError(`Заявка ${orderId} не передана в CRM на сервере: ${r.error}`);
    });
  } catch (e) {
    console.error('OrderSyncService: Failed to push to qazgost_crm_calendar', e);
  }

  return orderObj;
}
