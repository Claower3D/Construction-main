// DataService v2.0 - Persistence & Data Provider with API fallback

import { checkHealth, fetchOrders as apiFetchOrders } from './api';

const ORDERS_KEY = 'qazgost_orders_store';
const MODERATION_KEY = 'qazgost_moderation_queue_store';
const CONTRACTORS_KEY = 'qazgost_contractors_store';

const initialOrders = [
  { id: 'ORD-901', title: 'Капитальный ремонт бизнес-центра 1200 м²', city: 'Алматы', budget: '42 000 000 ₸', category: 'Отделка', date: '5 мин назад', status: 'published' },
  { id: 'ORD-902', title: 'Строительство монолитного каркаса коттеджа 320 м²', city: 'Астана', budget: '14 800 000 ₸', category: 'Монолит', date: '18 мин назад', status: 'published' },
  { id: 'ORD-903', title: 'Монтаж системы приточно-вытяжной вентиляции (HVAC)', city: 'Караганда', budget: '8 500 000 ₸', category: 'Инженерия', date: '45 мин назад', status: 'published' },
  { id: 'ORD-904', title: 'Электромонтажные работы в новостройке', city: 'Шымкент', budget: '3 600 000 ₸', category: 'Электрика', date: '1 час назад', status: 'published' },
];

const initialModeration = [
  { id: 'MOD-101', priority: 'high', type: 'Заказ', title: 'Заказ: Капитальный ремонт офиса 450 м²', author: 'ТОО «Алматы Бизнес» (БИН 21044001293)', date: '12 минут назад', status: 'pending', details: { area: '450 м²', budget: '18,500,000 ₸', city: 'Алматы' } },
  { id: 'MOD-102', priority: 'normal', type: 'Верификация', title: 'Заявка на верификацию ИП «СтройМастер»', author: 'ИИН: 880412300451 • Астана', date: '25 минут назад', status: 'pending', details: { bin: '880412300451', city: 'Астана' } },
  { id: 'MOD-103', priority: 'high', type: 'Жалоба', title: 'Жалоба на некачественную заливку бетона', author: 'Заказчик: Касымов А. • Караганда', date: '1 час назад', status: 'pending', details: { disputeId: 'DSP-882', reason: 'Трещины на монолитном перекрытии' } },
];

export async function getOrders() {
  try {
    const apiOrders = await apiFetchOrders();
    if (apiOrders && Array.isArray(apiOrders) && apiOrders.length > 0) {
      return apiOrders;
    }
  } catch (e) {
    // API unavailable fallback to local storage
  }

  try {
    const saved = localStorage.getItem(ORDERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('DataService getOrders error:', e);
  }
  return initialOrders;
}

export function saveOrder(newOrder) {
  const current = getLocalOrders();
  const orderObj = {
    id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
    date: 'Только что',
    status: 'published',
    ...newOrder,
  };
  const updated = [orderObj, ...current];
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('DataService saveOrder error:', e);
  }
  return updated;
}

export function getLocalOrders() {
  try {
    const saved = localStorage.getItem(ORDERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('DataService getLocalOrders error:', e);
  }
  return initialOrders;
}

export function getModerationQueue() {
  try {
    const saved = localStorage.getItem(MODERATION_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('DataService getModerationQueue error:', e);
  }
  return initialModeration;
}

export function approveModerationItem(id) {
  const current = getModerationQueue();
  const updated = current.filter((m) => m.id !== id);
  try {
    localStorage.setItem(MODERATION_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('DataService approveModerationItem error:', e);
  }
  return updated;
}

export function rejectModerationItem(id) {
  return approveModerationItem(id);
}

export function approveAllModerationItems() {
  try {
    localStorage.setItem(MODERATION_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('DataService approveAllModerationItems error:', e);
  }
  return [];
}
