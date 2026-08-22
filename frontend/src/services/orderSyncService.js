// OrderSyncService - Unified Order & CRM Calendar Dispatcher across Manager, Engineer, Executor & Customer

export function createPlatformOrder({
  title,
  category = 'Общестроительные работы',
  amount = 0,
  budget = '',
  clientName = 'Заказчик',
  clientPhone = '+7 (707) 000-00-00',
  city = 'Алматы',
  description = '',
  status = 'new',
  type = 'general', // 'general' | 'machinery' | 'materials' | 'defect' | 'estimate'
  stages = [],
  machinery = [],
  materials = [],
  defectReport = null,
  estimateData = null,
  paymentMethod = 'Эскроу QazGost'
}) {
  const numericAmount = typeof amount === 'number' ? amount : (parseInt(String(amount).replace(/\D/g, '')) || 0);
  const formattedBudget = budget || (numericAmount ? `${numericAmount.toLocaleString('ru-RU')} ₸` : 'По смете');
  const now = new Date();
  const orderId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;

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
    status,
    type,
    date: now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }),
    createdTime: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod,
    stages: stages.length > 0 ? stages : [
      {
        id: 'STG-1',
        name: 'Этап 1: Подготовительные работы и доставка ресурсов',
        status: 'pending',
        progress: 0,
        dateRange: `${now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${new Date(Date.now() + 86400000 * 3).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`,
        budget: Math.round(numericAmount * 0.3) || 500000,
        machinery: machinery || []
      },
      {
        id: 'STG-2',
        name: 'Этап 2: Основной комплекс СМР',
        status: 'pending',
        progress: 0,
        dateRange: `${new Date(Date.now() + 86400000 * 4).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} – ${new Date(Date.now() + 86400000 * 10).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`,
        budget: Math.round(numericAmount * 0.7) || 1200000,
        machinery: []
      }
    ],
    defectReport,
    estimateData,
    materials
  };

  // 1. Sync to localStorage Order Stores for All Roles
  try {
    const sharedKey = 'qazgost_orders_shared';
    const existingShared = JSON.parse(localStorage.getItem(sharedKey) || '[]');
    localStorage.setItem(sharedKey, JSON.stringify([orderObj, ...existingShared]));

    // Also sync to customer specific key
    const custKey = 'qazgost_orders_customer';
    const existingCust = JSON.parse(localStorage.getItem(custKey) || '[]');
    localStorage.setItem(custKey, JSON.stringify([orderObj, ...existingCust]));

    // If machinery/executor order, sync to executor key
    if (type === 'machinery' || type === 'general' || type === 'estimate') {
      const execKey = 'qazgost_orders_executor';
      const existingExec = JSON.parse(localStorage.getItem(execKey) || '[]');
      localStorage.setItem(execKey, JSON.stringify([orderObj, ...existingExec]));
    }
  } catch (e) {
    console.error('OrderSyncService: Failed to save orders', e);
  }

  // 2. Sync to Manager CRM Calendar Events (qazgost_calendar_events)
  try {
    const savedEvents = localStorage.getItem('qazgost_calendar_events');
    let crmEvents = savedEvents ? JSON.parse(savedEvents) : {};
    const today = now.toISOString().split('T')[0];
    if (!crmEvents[today]) crmEvents[today] = [];

    let crmPrefix = '[📝 ЛИД]';
    let eventType = 'request_construction';

    if (type === 'machinery') {
      crmPrefix = '[🚜 ТЕХНИКА]';
      eventType = 'request_machinery';
    } else if (type === 'materials') {
      crmPrefix = '[🧱 МАТЕРИАЛЫ]';
      eventType = 'request_materials';
    } else if (type === 'defect') {
      crmPrefix = '[👷 ИНЖЕНЕР]';
      eventType = 'request_engineering';
    }

    const crmItem = {
      id: `crm-evt-${Date.now()}`,
      orderId: orderId,
      title: `${crmPrefix} ${title} (#${orderId})`,
      time: now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: eventType,
      status: 'Новые',
      desc: description || `Заказ от ${clientName} (${clientPhone}) в г. ${city}. Бюджет: ${formattedBudget}`,
      contractor: 'Не распределено',
      budget: formattedBudget,
      city: city,
      clientName: clientName,
      clientPhone: clientPhone
    };

    crmEvents[today].push(crmItem);
    localStorage.setItem('qazgost_calendar_events', JSON.stringify(crmEvents));
  } catch (e) {
    console.error('OrderSyncService: Failed to push to CRM Calendar', e);
  }

  return orderObj;
}
