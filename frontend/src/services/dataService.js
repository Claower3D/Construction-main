// DataService v2.0 - Persistence & Data Provider with API fallback

import { checkHealth, fetchOrders as apiFetchOrders } from './api';

const ORDERS_KEY = 'qazgost_orders_store';
const MODERATION_KEY = 'qazgost_moderation_queue_store';
const CONTRACTORS_KEY = 'qazgost_contractors_store';

const initialModeration = [
  { id: 'MOD-101', priority: 'high', type: 'Заказ', title: 'Заказ: Капитальный ремонт офиса 450 м²', author: 'ТОО «Алматы Бизнес» (БИН 21044001293)', date: '12 минут назад', status: 'pending', details: { area: '450 м²', budget: '18,500,000 ₸', city: 'Алматы' } },
  { id: 'MOD-102', priority: 'normal', type: 'Верификация', title: 'Заявка на верификацию ИП «СтройМастер»', author: 'ИИН: 880412300451 • Астана', date: '25 минут назад', status: 'pending', details: { bin: '880412300451', city: 'Астана' } },
  { id: 'MOD-103', priority: 'high', type: 'Жалоба', title: 'Жалоба на некачественную заливку бетона', author: 'Заказчик: Касымов А. • Караганда', date: '1 час назад', status: 'pending', details: { disputeId: 'DSP-882', reason: 'Трещины на монолитном перекрытии' } },
];

export async function getOrders() {
  // Ответ сервера (в т.ч. пустой) — источник правды; при недоступности — только реально сохранённые
  // локальные заказы. Демо-заказы больше не подставляются.
  try {
    const apiOrders = await apiFetchOrders();
    if (Array.isArray(apiOrders) && !apiOrders.offline) {
      return apiOrders;
    }
  } catch (e) {
    // API unavailable fallback to local storage
  }
  return getLocalOrders();
}

export function saveOrder(newOrder) {
  const current = getLocalOrders();
  const orderObj = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    if (Array.isArray(saved)) return saved;
  } catch (e) {
    console.error('DataService getLocalOrders error:', e);
  }
  return [];
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
