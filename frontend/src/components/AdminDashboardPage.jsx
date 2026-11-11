import React, { useState, useEffect, lazy, Suspense } from 'react';
import AnimatedBackground from './AnimatedBackground';
import PageLoader from './PageLoader';
import { QazGostMark } from './Header';
import './dashboard-refresh.css';

// Каждый инструмент кабинета — отдельный чанк: открываем меню карточек без загрузки CRM, админки, 3D и т.п.
const EngineerDashboardPage = lazy(() => import('./EngineerDashboardPage'));
const CompanyDashboardPage = lazy(() => import('./CompanyDashboardPage'));
const AdminDashboardModal = lazy(() => import('./AdminDashboardModal'));
const FeaturePageModule = lazy(() => import('./FeaturePageModule'));
const CrmPage = lazy(() => import('./CrmPage'));
const BuildingConstructionPage = lazy(() => import('./BuildingConstructionPage'));

// Роли кабинета
const ROLES = [
  {
    id: 'builder',
    title: 'Я Застройщик (VIP)',
    shortLabel: 'Застройщик',
    icon: '🏗️',
    desc: 'Капитальное строительство зданий, ПСД, сметы СНиП и генподряд',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.45)',
    badge: 'VIP'
  },
  {
    id: 'customer',
    title: 'Я Заказчик',
    shortLabel: 'Заказчик',
    icon: '📋',
    desc: 'Создаю заказы, выбираю исполнителей, принимаю работу',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    badge: ''
  },
  {
    id: 'executor',
    title: 'Я Исполнитель',
    shortLabel: 'Исполнитель',
    icon: '🔧',
    desc: 'Ищу заказы, отправляю предложения, выполняю работы',
    color: '#b9a4ff',
    glow: 'rgba(185, 164, 255, 0.45)',
    badge: ''
  },
  {
    id: 'engineer',
    title: 'Я Инженер',
    shortLabel: 'Инженер',
    icon: '👷',
    desc: 'Принимаю заявки, разрабатываю проектную документацию',
    color: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.45)',
    badge: ''
  },
  {
    id: 'manager',
    title: 'Я Менеджер CRM',
    shortLabel: 'Менеджер',
    icon: '💼',
    desc: 'Управление лидами, клиентами, сделками и CRM-аналитикой',
    color: '#b9a4ff',
    glow: 'rgba(185, 164, 255, 0.45)',
    badge: 'CRM'
  },
  {
    id: 'company',
    title: 'Я Компания',
    shortLabel: 'Компания',
    icon: '🏢',
    desc: 'Управление БИН, сотрудниками и объектами организации',
    color: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.45)',
    badge: 'ТОО'
  },
  {
    id: 'admin',
    title: 'Я Администратор',
    shortLabel: 'Админ',
    icon: '⚙️',
    desc: 'Управление платформой, прайсами, модерацией и арбитражем',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
    badge: 'ROOT'
  },
  {
    id: 'analyst',
    title: 'Я Аналитик',
    shortLabel: 'Аналитик',
    icon: '📊',
    desc: 'Финальная отчётность, проверка документации, PDF-экспорт',
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.45)',
    badge: 'QA'
  }
];

// Инструменты каждой роли (карточки кабинета)
const ROLE_CARDS = {
  builder: [
    { id: 'b-objects', title: 'Мои строительные объекты', icon: '🏢', desc: 'Управление портфелем ЖК, БЦ и коттеджных городков с 3D BIM-моделями', btnText: '🏢 Мои объекты', btnGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    { id: 'b-create', title: 'Создать объект (СНиП)', icon: '➕', desc: 'Выбор типа объекта, этажности и проверка допуска компаний ГАСК', btnText: '➕ Создать объект', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    { id: 'b-wbs', title: 'Выбор СМР & Оценка', icon: '📐', desc: 'WBS-калькулятор стоимости работ по сборникам ЭСН РК', btnText: '📐 Калькулятор СМР', btnGradient: 'linear-gradient(90deg, #b9a4ff, #7c3aed)' },
    { id: 'b-audit', title: 'Инженерный фото-аудит', icon: '🔍', desc: 'AI-проверка чертежей КЖ/АР, замечания технадзора и дефектовка', btnText: '🔍 AI Экспертиза', btnGradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)' },
    { id: 'b-lots', title: 'Лоты & Тендеры', icon: '📦', desc: 'Публикация строительных лотов в "Мои Заказы Строительство"', btnText: '📦 Лоты и тендеры', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
    { id: 'b-docs', title: 'Сметы & Документы PDF', icon: '📄', desc: 'Локальные сметы СНиП, аналитика прогресса и акты КС-2/КС-3', btnText: '📄 Скачать PDF', btnGradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { id: 'b-contractors', title: 'Реестр подрядчиков', icon: '🛡️', desc: 'Проверка лицензий ГАСК I/II категории, БИН и контакты ГИП', btnText: '🛡️ База подрядчиков', btnGradient: 'linear-gradient(90deg, #a78bfa, #10b981)' },
  ],

  customer: [
    { id: 'c-materials', title: 'Маркетплейс материалов', icon: '🧱', desc: 'Оптовые и розничные стройматериалы от заводов РК: цемент, кирпич, арматура, смеси', btnText: '🧱 Открыть маркетплейс', btnGradient: 'linear-gradient(90deg, #10b981, #8b5cf6)' },
    { id: 'c-estimate', title: 'Оценка стоимости', icon: '📊', desc: 'Обмерьте помещение — смета по техкартам и ценам с источниками, три сценария', btnText: '🚀 Начать оценку', btnGradient: 'linear-gradient(90deg, #b9a4ff, #7c3aed)' },
    { id: 'c-inspect', title: 'Проверка дефектов', icon: '🔍', desc: 'Трещины на фото, акт с нормативами СНиП и ГОСТ и ценой ремонта', btnText: '🔍 Начать проверку', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
    { id: 'c-vip', title: 'Строительство зданий', icon: '🏗️', desc: 'ПСД, ВВР-документация, сметы полного цикла и генподряд VIP', btnText: '⭐ Открыть', btnGradient: 'linear-gradient(90deg, #6366f1, #7c3aed)' },
    { id: 'c-engineering', title: 'Инженерные решения', icon: '⚙️', desc: 'Электрика, сантехника, HVAC, слаботочные системы и технадзор', btnText: '⚡ Выбрать', btnGradient: 'linear-gradient(90deg, #b9a4ff, #ddd6fe)' },
    { id: 'c-orders', title: 'Мои заказы', icon: '📬', desc: 'Просмотр активных заявок, откликов мастеров и статусов работ', btnText: '📗 Открыть заказы', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    { id: 'c-wallet', title: 'Оплата', icon: '💳', desc: 'Как сейчас оплачиваются заказы и когда появится онлайн-оплата', btnText: '💳 Открыть', btnGradient: 'linear-gradient(90deg, #7c3aed, #f59e0b)' },
    { id: 'c-equipment', title: 'Маркетплейс техники', icon: '🚜', desc: 'Аренда экскаваторов, кранов, самосвалов по всему Казахстану', btnText: '🚜 Открыть технику', btnGradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { id: 'c-catalog', title: 'Каталог подрядчиков', icon: '📒', desc: 'Реестр проверенных специалистов и строительных компаний по ИИН/БИН', btnText: '📒 Найти мастеров', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
    { id: 'c-volume', title: 'Расчёт объёмов (BOM)', icon: '📏', desc: 'Автоматический расчёт площадей и спецификации стройматериалов', btnText: '📐 Рассчитать', btnGradient: 'linear-gradient(90deg, #a78bfa, #10b981)' },
    { id: 'c-calendar', title: 'Календарь работ', icon: '📅', desc: 'График выполнения строительно-монтажных работ и инспекций', btnText: '📅 График', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
    { id: 'c-profile', title: 'Моя анкета', icon: '📝', desc: 'Личные данные Заказчика, параметры объекта, бюджет и реквизиты', btnText: '📝 Заполнить', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
  ],

  executor: [
    { id: 'e-materials', title: 'Маркетплейс материалов', icon: '🧱', desc: 'Оптовый закуп стройматериалов со скидками до 20% для подрядчиков', btnText: '🧱 Закуп материалов', btnGradient: 'linear-gradient(90deg, #10b981, #8b5cf6)' },
    { id: 'e-feed', title: 'Лента заказов', icon: '🌐', desc: 'Живой поток заказов со всего Казахстана без посредников и комиссий', btnText: '🌐 Смотреть заказы', btnGradient: 'linear-gradient(90deg, #b9a4ff, #7c3aed)' },
    { id: 'e-works', title: 'Мои работы', icon: '📌', desc: 'Портфолио, текущие объекты и онлайн-сдача этапов заказчику', btnText: '📌 Мои объекты', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
    { id: 'e-estimate', title: 'Оценка стоимости', icon: '📸', desc: 'Смета по технологическим картам и рыночным ценам с источниками', btnText: '🚀 Сметный расчёт', btnGradient: 'linear-gradient(90deg, #b9a4ff, #7c3aed)' },
    { id: 'e-inspect', title: 'Проверка дефектов', icon: '🔍', desc: 'Экспертная проверка состояния конструкций и дефектоскопия', btnText: '🔍 Проверить дефекты', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
    { id: 'e-soil', title: 'Фото-объёмы грунта', icon: '📐', desc: 'Геодезический 3D-расчёт выемки и насыпи грунта по фото ДО/ПОСЛЕ', btnText: '📸 Рассчитать объём', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'e-engineering', title: 'Инженерные решения', icon: '⚙️', desc: 'Техническая спецификация работ и схемы разводки сетей', btnText: '⚡ Спецификация', btnGradient: 'linear-gradient(90deg, #b9a4ff, #ddd6fe)' },
    { id: 'e-wallet', title: 'Оплата', icon: '💳', desc: 'Как исполнитель получает оплату по заказам', btnText: '💳 Открыть', btnGradient: 'linear-gradient(90deg, #7c3aed, #f59e0b)' },
    { id: 'e-equipment', title: 'Маркетплейс техники', icon: '🚜', desc: 'Поиск спецтехники в аренду и оптовый закуп стройматериалов', btnText: '🚜 Найти технику', btnGradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { id: 'e-calendar', title: 'Календарь выездов', icon: '📅', desc: 'Расписание выездов на замеры и этапов монтажных работ', btnText: '📅 Расписание', btnGradient: 'linear-gradient(90deg, #ef4444, #10b981)' },
    { id: 'e-catalog', title: 'Каталог специалистов', icon: '📒', desc: 'Рейтинг, отзывы и карточки мастеров в едином реестре РК', btnText: '📒 Реестр мастеров', btnGradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
    { id: 'e-vip', title: 'Строительство зданий (VIP)', icon: '🏗️', desc: 'Участие в тендерах генподряда, ПСД и аккредитация I/II категории', btnText: '⭐ VIP Тендеры', btnGradient: 'linear-gradient(90deg, #6366f1, #7c3aed)' },
    { id: 'e-profile', title: 'Анкета мастера', icon: '📝', desc: 'Профиль исполнителя, верификация ИИН/БИН, навыки и портфолио', btnText: '📝 Заполнить профиль', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
  ],

  engineer: [
    { id: 'ing-main', title: 'Главная панель', icon: '📊', desc: 'Сводный дашборд технического надзора, статусы проверок и графики', btnText: '📊 Открыть панель', btnGradient: 'linear-gradient(90deg, #7c3aed, #b9a4ff)' },
    { id: 'ing-requests', title: 'Заявки на технадзор', icon: '📬', desc: 'Очередь вызовов инженеров на объекты для проведения инспекций', btnText: '📬 Список заявок', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
    { id: 'ing-objects', title: 'Мои объекты', icon: '🏗️', desc: 'Реестр строящихся объектов под авторским и техническим контролем', btnText: '🏗️ Мои объекты', btnGradient: 'linear-gradient(90deg, #f59e0b, #10b981)' },
    { id: 'ing-ai', title: 'AI-просчёт по СНиП', icon: '🤖', desc: 'Автоматический анализ ПСД на соответствие ГОСТ и СНиП РК', btnText: '🤖 Запустить AI', btnGradient: 'linear-gradient(90deg, #7c3aed, #7c3aed)' },
    { id: 'ing-calendar', title: 'Календарь инспекций', icon: '📅', desc: 'План выездных инспекций и график подписания актов КС-2 / КС-3', btnText: '📅 План инспекций', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
    { id: 'ing-expenses', title: 'Контроль расходов', icon: '💰', desc: 'Анализ отклонений от утвержденной сметы и контроль перерасходов', btnText: '💰 Аудит смет', btnGradient: 'linear-gradient(90deg, #a78bfa, #10b981)' },
  ],

  company: [
    { id: 'comp-tree', title: 'Древо ролей и структуры', icon: '🌳', desc: 'Интерактивное семейное древо ролей, отделов, сотрудников и бригад ТОО', btnText: '🌳 Открыть древо', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'comp-profile', title: 'Профиль компании', icon: '📝', desc: 'Управление БИН компании, лицензиями ГСЛ и банковскими реквизитами', btnText: '📝 Реквизиты ТОО', btnGradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)' },
    { id: 'comp-employees', title: 'Сотрудники и бригады', icon: '👥', desc: 'Реестр штатных инженеров, прорабов и привязанных рабочих бригад', btnText: '👥 Управление штатом', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'comp-stats', title: 'Статистика компании', icon: '📈', desc: 'Сводные финансовые показатели, динамика сдачи объектов и KPI', btnText: '📈 Смотреть отчёты', btnGradient: 'linear-gradient(90deg, #7c3aed, #b9a4ff)' },
  ],

  manager: [
    { id: 'mgr-crm', title: 'CRM-система', icon: '📊', desc: 'Воронка лидов, карточки клиентов, управление компаниями и бригадами', btnText: '📊 Открыть CRM', btnGradient: 'linear-gradient(90deg, #8b5cf6, #f59e0b)' },
    { id: 'mgr-reports', title: 'Отчёты по продажам', icon: '📄', desc: 'Конверсия сделок, средний чек смет и аналитика эффективности', btnText: '📄 Сводка продаж', btnGradient: 'linear-gradient(90deg, #10b981, #059669)' },
  ],

  admin: [
    { id: 'adm-tree', title: 'Иерархия ролей (Древо)', icon: '🌳', desc: 'Визуальное древо ролей всех строительных организаций и компаний платформы', btnText: '🌳 Древо ролей', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'adm-prices', title: 'Прайсы ЭСН РК', icon: '💰', desc: 'База 23 864+ позиций строительных расценок по 17 областям Казахстана', btnText: '💰 Открыть прайсы', btnGradient: 'linear-gradient(90deg, #f59e0b, #ea580c)' },
    { id: 'adm-moderation', title: 'Модерация заявок', icon: '🛡️', desc: 'Очередь верификации подрядчиков, проверка документов и заказов', btnText: '🛡️ Модерация', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
    { id: 'adm-regions', title: 'Региональные индексы', icon: '🗺️', desc: 'Коэффициенты удорожания стройматериалов по регионам РК', btnText: '🗺️ Индексы цен', btnGradient: 'linear-gradient(90deg, #7c3aed, #b9a4ff)' },
    { id: 'adm-audit', title: 'Журнал действий', icon: '📜', desc: 'Полный аудит логов пользователей, изменений в сметах и AI-вызовов', btnText: '📜 Журнал логов', btnGradient: 'linear-gradient(90deg, #8b5cf6, #8b5cf6)' },
    { id: 'adm-kpi', title: 'KPI Платформы', icon: '📊', desc: 'Метрики скорости расчётов, точности AI и загрузки серверов', btnText: '📊 Открыть KPI', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'adm-disputes', title: 'Споры и арбитраж', icon: '⚖️', desc: 'Рассмотрение претензий по качеству работ и разблокировка эскроу', btnText: '⚖️ Разрешить спор', btnGradient: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
    { id: 'adm-contracts', title: 'Договоры подряда', icon: '📄', desc: 'Шаблоны договоров строительного подряда с поддержкой ЭЦП E-Gov', btnText: '📄 Реестр договоров', btnGradient: 'linear-gradient(90deg, #7c3aed, #10b981)' },
    { id: 'adm-documents', title: 'Документы & Выгрузка Excel', icon: '📁', desc: 'Выгрузка актов КС-2/КС-3, счетов на оплату, ЭСФ и реестров договоров в Excel (.xlsx)', btnText: '📁 Открыть документы', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
  ],

  analyst: [
    { id: 'an-queue', title: 'Очередь завершённых заявок', icon: '📋', desc: 'Заявки, закрытые исполнителями и переданные аналитику для финальной отчётности', btnText: '📋 Открыть очередь', btnGradient: 'linear-gradient(90deg, #8b5cf6, #6366f1)' },
    { id: 'an-reports', title: 'PDF-отчёты и экспорт', icon: '📄', desc: 'Формирование итоговых отчётов с фотографиями, файлами и хронологией работ', btnText: '📄 Генератор отчётов', btnGradient: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
    { id: 'an-stats', title: 'Статистика проделанных работ', icon: '📊', desc: 'Сводная аналитика по объектам, бригадам, бюджетам и срокам выполнения', btnText: '📊 Смотреть статистику', btnGradient: 'linear-gradient(90deg, #10b981, #a78bfa)' },
    { id: 'an-files', title: 'Архив документации', icon: '📎', desc: 'Договоры, акты КС-2/КС-3, заключения технадзора и гарантийные обязательства', btnText: '📎 Открыть архив', btnGradient: 'linear-gradient(90deg, #8b5cf6, #8b5cf6)' },
  ]
};

// ── Адреса инструментов ─────────────────────────────────────────────
// Каждый инструмент — отдельная страница: /executor/calendar, /customer/materials, /admin/prices…
// Работают кнопки «Назад/Вперёд» браузера, обновление страницы и прямые ссылки.
const ROUTABLE_ROLES = ['customer', 'executor', 'engineer', 'company', 'manager', 'admin'];
const SLUG_OVERRIDES = {
  'c-inspect': 'defects', 'e-inspect': 'defects',
  'c-wallet': 'payment', 'e-wallet': 'payment',
  'c-vip': 'building', 'e-vip': 'building',
  'ing-main': 'overview',
};
// Роли, которые сразу открываются на своём основном инструменте
const DEFAULT_TOOL = { manager: 'mgr-crm', admin: 'adm-prices', company: 'comp-profile', builder: 'b-objects' };

export function toolSlug(id) {
  if (SLUG_OVERRIDES[id]) return SLUG_OVERRIDES[id];
  if (id.startsWith('b-')) return `builder-${id.slice(2)}`;
  if (id.startsWith('an-')) return `analyst-${id.slice(3)}`;
  return id.replace(/^(c|e|ing|comp|mgr|adm)-/, '');
}

function moduleFor(id) {
  if (id.startsWith('b-')) return 'builder';
  if (id.startsWith('adm-')) return 'admin_panel';
  if (id.startsWith('comp-')) return 'company';
  if (id.startsWith('ing-') || id === 'c-calendar' || id === 'e-calendar' || id === 'e-works') return 'engineer';
  if (id.startsWith('mgr-')) return 'crm';
  return null;
}

function parseDashPath(pathname = window.location.pathname) {
  const parts = pathname.split('/');
  const base = (parts[1] || '').toLowerCase();
  let slug = '';
  try { slug = decodeURIComponent(parts[2] || '').toLowerCase(); } catch (e) { slug = ''; }
  return { base: base === 'crm' ? 'manager' : base, slug };
}

function findTool(baseRole, slug) {
  if (!slug) return null;
  const own = (ROLE_CARDS[baseRole] || []).find((c) => toolSlug(c.id) === slug);
  if (own) return { role: baseRole, card: own };
  for (const r of ['builder', 'analyst']) {
    const c = (ROLE_CARDS[r] || []).find((x) => toolSlug(x.id) === slug);
    if (c) return { role: r, card: c };
  }
  return null;
}

const defaultCard = (roleId) => {
  const id = DEFAULT_TOOL[roleId];
  return id ? (ROLE_CARDS[roleId] || []).find((c) => c.id === id) || null : null;
};

export default function AdminDashboardPage({ onBackToHome, onOpenEngineer, userRole = 'customer', currentUser }) {
  // Начальное состояние — из адреса: /роль или /роль/инструмент
  const [initialRoute] = useState(() => {
    const { base, slug } = parseDashPath();
    const fallbackRole = ['customer', 'executor', 'engineer', 'company', 'manager', 'admin'].includes(userRole)
      ? userRole
      : (currentUser?.role || 'customer');
    const role = ROUTABLE_ROLES.includes(base) ? base : fallbackRole;
    const hit = findTool(role, slug);
    if (hit) return { role: hit.role, card: hit.card, canonical: false };
    // без инструмента в адресе: CRM, админка и компания сразу открывают основной раздел
    return { role, card: defaultCard(role), canonical: true };
  });

  const [selectedRole, setSelectedRole] = useState(initialRoute.role);
  const [selectedItemId, setSelectedItemId] = useState(initialRoute.card ? initialRoute.card.id : null);
  const [selectedItemObject, setSelectedItemObject] = useState(initialRoute.card);
  const [embeddedModule, setEmbeddedModule] = useState(initialRoute.card ? moduleFor(initialRoute.card.id) : null);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const roles = ROLES;
  const roleCardsData = ROLE_CARDS;

  // Determine effective user role
  const effectiveUserRole = currentUser?.role || userRole || 'customer';

  // Role filtering based on user permissions:
  // Исполнители (Радион, Владимир, Данил) видят ТОЛЬКО «Я Заказчик» и «Я Исполнитель»
  const visibleRoles = (() => {
    if (effectiveUserRole === 'executor' || effectiveUserRole === 'customer') {
      return roles.filter(r => r.id === 'customer' || r.id === 'executor');
    }
    if (effectiveUserRole === 'engineer') {
      return roles.filter(r => ['customer', 'executor', 'engineer'].includes(r.id));
    }
    if (effectiveUserRole === 'manager' || effectiveUserRole === 'crm') {
      return roles.filter(r => ['customer', 'executor', 'manager'].includes(r.id));
    }
    if (effectiveUserRole === 'admin' || effectiveUserRole === 'builder') {
      return roles.filter(r => ['builder', 'customer', 'executor', 'engineer', 'manager'].includes(r.id));
    }
    return roles.filter(r => r.id === 'customer' || r.id === 'executor');
  })();

  const activeRoleObj = roles.find((r) => r.id === selectedRole) || visibleRoles.find(r => r.id === selectedRole) || visibleRoles[0] || roles[0];
  const activeCards = roleCardsData[selectedRole] || roleCardsData.customer;

  // Показать роль/инструмент (без смены адреса)
  const applyRoute = (roleId, card) => {
    setSelectedRole(roleId);
    setIsMobileSidebarOpen(false);
    if (card) {
      setSelectedItemId(card.id);
      setSelectedItemObject(card);
      setEmbeddedModule(moduleFor(card.id));
    } else {
      setSelectedItemId(null);
      setSelectedItemObject(null);
      setEmbeddedModule(null);
    }
  };

  // Адрес страницы: у «Застройщика» и «Аналитика» своего раздела нет — они живут под текущим кабинетом
  const baseFor = (roleId) => {
    if (ROUTABLE_ROLES.includes(roleId)) return roleId;
    const cur = parseDashPath().base;
    if (ROUTABLE_ROLES.includes(cur)) return cur;
    return ROUTABLE_ROLES.includes(userRole) ? userRole : 'customer';
  };
  const urlFor = (roleId, card) => `/${baseFor(roleId)}${card ? `/${toolSlug(card.id)}` : ''}`;

  // Перейти на страницу инструмента (или к списку инструментов роли) с записью в историю браузера
  const navigate = (roleId, card, { replace = false } = {}) => {
    applyRoute(roleId, card);
    const url = urlFor(roleId, card);
    if (window.location.pathname !== url) window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    window.scrollTo(0, 0);
  };

  // Адрес без инструмента у CRM/админки/компании → сразу адрес их основного раздела; неизвестный инструмент → адрес роли
  useEffect(() => {
    const url = urlFor(initialRoute.role, initialRoute.card);
    if (initialRoute.canonical && window.location.pathname !== url) window.history.replaceState({}, '', url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // «Назад/Вперёд» в браузере внутри кабинета
  useEffect(() => {
    const onPop = () => {
      const { base, slug } = parseDashPath();
      if (!ROUTABLE_ROLES.includes(base)) return; // ушли из кабинета — это решает App
      const hit = findTool(base, slug);
      applyRoute(hit ? hit.role : base, hit ? hit.card : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSelectRole = (roleKey) => navigate(roleKey, defaultCard(roleKey));
  const handleSelectItem = (item) => navigate(selectedRole, item);
  const handleBackToCardMenu = () => navigate(selectedRole, null);

  const isInnerToolActive = !!(embeddedModule || selectedItemObject || selectedItemId);

  // Заголовок вкладки браузера — название страницы
  useEffect(() => {
    const prev = document.title;
    return () => { document.title = prev; };
  }, []);
  useEffect(() => {
    const roleObj = ROLES.find((r) => r.id === selectedRole);
    document.title = selectedItemObject
      ? `${selectedItemObject.title} — QazGost AI`
      : `Кабинет${roleObj ? `: ${roleObj.shortLabel.toLowerCase()}` : ''} — QazGost AI`;
  }, [selectedItemObject, selectedRole]);

  // Keyboard shortcut: Escape to return to card cockpit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isInnerToolActive) {
        handleBackToCardMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInnerToolActive, selectedRole]);

  const handlePrimaryRoleAction = () => {
    const primaryId = {
      engineer: 'ing-main', executor: 'e-feed', manager: 'mgr-crm', crm: 'mgr-crm', company: 'comp-profile', admin: 'adm-prices',
    }[selectedRole] || 'c-estimate';
    const card = activeCards.find((c) => c.id === primaryId) || activeCards[0];
    if (card) handleSelectItem(card);
  };

  return (
    <div className="admin-redesign-layout" style={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', position: 'relative' }}>
      {/* 3D Holographic Background with BIM Skyline & Electricity */}
      <AnimatedBackground />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MOBILE DRAWER SIDEBAR (Only visible when toggled on mobile) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div 
        className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside className={`admin-redesign-sidebar mobile-drawer ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div 
              className="sidebar-brand" 
              onClick={() => {
                handleBackToCardMenu();
                setIsMobileSidebarOpen(false);
              }}
              style={{ cursor: 'pointer', marginBottom: 0 }}
              title="На главный экран"
            >
              <span className="logo-emoji">🏗️</span>
              <div>QazGost <span style={{ color: '#b9a4ff' }}>AI</span></div>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="sidebar-close-btn"
              title="Закрыть меню"
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#a39cc2', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '900', marginBottom: '0.6rem' }}>
            ВЫБРАТЬ ДАШБОРД
          </div>

          {/* Mobile Role Switcher Grid */}
          <div className="mobile-role-selector-grid" style={{ gridTemplateColumns: `repeat(${Math.min(visibleRoles.length, 3)}, 1fr)` }}>
            {visibleRoles.map(r => (
              <button
                key={r.id}
                className={`mobile-role-btn ${selectedRole === r.id ? 'active' : ''}`}
                onClick={() => handleSelectRole(r.id)}
                style={{
                  borderColor: selectedRole === r.id ? r.color : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: selectedRole === r.id ? `0 0 12px ${r.glow}` : 'none',
                  flexDirection: 'column',
                  padding: '8px 4px'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                <span style={{ fontSize: '0.75rem' }}>{r.shortLabel}</span>
                {selectedRole === r.id && <span style={{ color: r.color, fontWeight: '900', fontSize: '0.8rem' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-category">
            <div className="sidebar-category-header">
              <span>{activeRoleObj.icon} РАЗДЕЛЫ {activeRoleObj.shortLabel.toUpperCase()}</span>
            </div>
            <div className="sidebar-items-group">
              {activeCards.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={`sidebar-item ${selectedItemId === item.id ? 'active' : ''}`}
                  aria-current={selectedItemId === item.id ? 'page' : undefined}
                  onClick={() => handleSelectItem(item)}
                >
                  <span style={{ fontSize: '1.1rem' }} aria-hidden="true">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.8rem', color: '#a39cc2' }}>
            <span className="online-ai-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="live-dot" /> Online AI 2.0
            </span>
            <div style={{ fontSize: '0.75rem', color: '#cbc5e3', lineHeight: '1.3' }}>
              Система активна и готова к работе.
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MAIN COCKPIT & WORKSPACE                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <main className="admin-redesign-main full-width-workspace" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5 }}>
        
        {/* Шапка кабинета (липкая) */}
        <header className="main-top-header modern-topbar qg-dash-topbar">
          <div className="topbar-left-group">
            <a href="/" className="qg-dash-brand" onClick={(e) => { e.preventDefault(); onBackToHome(); }} aria-label="QazGost AI — на главную">
              <QazGostMark size={34} />
              <span className="qg-dash-brand-text">
                <span className="qg-dash-brand-title">QazGost AI</span>
                <span className="qg-dash-brand-sub">Сметы и дефекты по нормам РК</span>
              </span>
            </a>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="mobile-menu-trigger-btn"
              aria-label="Открыть меню разделов"
            >
              <span aria-hidden="true">☰</span>
              <span className="btn-text-mobile">Меню</span>
            </button>

            {isInnerToolActive ? (
              <button onClick={handleBackToCardMenu} className="btn-back-to-cards qg-dash-back" title="Вернуться ко всем разделам (Esc)">
                <span aria-hidden="true">←</span>
                <span>Все разделы</span>
              </button>
            ) : (
              <button onClick={onBackToHome} className="btn-back-to-cards qg-dash-back" title="На главную страницу">
                <span aria-hidden="true">←</span>
                <span>На главную</span>
              </button>
            )}

            <nav className="header-breadcrumbs-box qg-dash-crumbs" aria-label="Путь">
              <span className="qg-dash-crumb-role" style={{ '--role-color': activeRoleObj.color }}>{activeRoleObj.shortLabel}</span>
              {selectedItemObject && (
                <>
                  <span className="qg-dash-crumb-sep" aria-hidden="true">/</span>
                  <span className="qg-dash-crumb-item" aria-current="page">{selectedItemObject.title}</span>
                </>
              )}
            </nav>
          </div>

          <div className="topbar-right-group">
            {currentUser?.name && <span className="qg-dash-user" title={currentUser.email || ''}>{currentUser.name}</span>}
            <button onClick={onBackToHome} className="qg-btn qg-btn--ghost qg-btn--sm qg-dash-site">На сайт</button>
          </div>
        </header>

        {/* ────────────────────────────────────────────────────────── */}
        {/* WORKSPACE: INNER TOOL OR FULL CARD DASHBOARD               */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className={`qg-dash-workspace${isInnerToolActive ? ' is-tool' : ''}`}>

          {/* 1. INNER TOOL VIEW */}
          {isInnerToolActive && (
            <div style={{ width: '100%', minHeight: '85vh' }}>
              <Suspense fallback={<PageLoader label="Загружаем инструмент…" />}>
              {embeddedModule === 'engineer' && (
                <EngineerDashboardPage
                  key={selectedRole + '_' + selectedItemId}
                  hideHeader={true}
                  initialTab={
                    selectedItemId === 'ing-main' ? 'overview' :
                    selectedItemId === 'ing-requests' ? 'requests' :
                    (selectedItemId === 'ing-objects' || selectedItemId === 'e-works') ? 'objects' :
                    (selectedItemId === 'ing-calendar' || selectedItemId === 'c-calendar' || selectedItemId === 'e-calendar') ? 'calendar' :
                    selectedItemId === 'ing-ai' ? 'ai-calc' :
                    selectedItemId === 'ing-expenses' ? 'expenses' :
                    'calendar'
                  }
                  onBackToHome={handleBackToCardMenu}
                  viewRole={selectedRole}
                  currentUser={currentUser}
                />
              )}

              {embeddedModule === 'admin_panel' && (
                <AdminDashboardModal 
                  isOpen={true} 
                  inline={true} 
                  startTab={selectedItemId.replace('adm-', '')} 
                  onClose={handleBackToCardMenu} 
                  currentUser={currentUser} 
                  userRole={userRole} 
                />
              )}

              {embeddedModule === 'builder' && (
                <div style={{ height: '100%', width: '100%', minHeight: '80vh', position: 'relative' }}>
                  <BuildingConstructionPage onBack={handleBackToCardMenu} hideHeader={false} />
                </div>
              )}

              {embeddedModule === 'crm' && (
                <div style={{ height: '100%', width: '100%', minHeight: '80vh', position: 'relative' }}>
                  <CrmPage onBackToHome={handleBackToCardMenu} currentUser={currentUser} />
                </div>
              )}

              {embeddedModule === 'company' && (
                <CompanyDashboardPage 
                  currentUser={currentUser} 
                  initialTab={
                    selectedItemId === 'comp-employees' ? 'employees' :
                    selectedItemId === 'comp-stats' ? 'stats' : 'profile'
                  }
                />
              )}

              {!embeddedModule && selectedItemObject && (
                <FeaturePageModule
                  itemData={selectedItemObject}
                  onBack={handleBackToCardMenu}
                  currentUser={currentUser}
                  onOpenTool={(id) => {
                    const card = (ROLE_CARDS[selectedRole] || []).find((c) => c.id === id)
                      || Object.values(ROLE_CARDS).flat().find((c) => c.id === id);
                    if (card) navigate(selectedRole, card);
                  }}
                  onOpenAdminTab={(tab) => {
                    const card = (ROLE_CARDS.admin || []).find((c) => c.id === `adm-${tab}`);
                    if (card) navigate('admin', card);
                  }}
                />
              )}
              </Suspense>
            </div>
          )}

          {/* 2. Меню разделов кабинета */}
          {!isInnerToolActive && (
            <div className="qg-cockpit">
              <div className="qg-cockpit-head">
                <p className="qg-cockpit-pill"><span className="qg-cockpit-dot" aria-hidden="true" />Кабинет: {activeRoleObj.shortLabel.toLowerCase()} • нормы СНиП и ГОСТ РК</p>
                <h1>
                  {currentUser?.name
                    ? <><span className="qg-cockpit-name">{currentUser.name.split(' ')[0]}</span>, что делаем сегодня?</>
                    : 'Ваш кабинет'}
                </h1>
                <p>Выберите роль и инструмент. Фото объекта превращается в смету, акт о дефектах или заказ для бригады.</p>
              </div>

              {visibleRoles.length > 1 && (
                <div className="qg-role-switch" role="tablist" aria-label="Роль в кабинете">
                  {visibleRoles.map(r => {
                    const isActive = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleSelectRole(r.id)}
                        className={`qg-role-tab${isActive ? ' is-active' : ''}`}
                        style={{ '--role-color': r.color }}
                      >
                        <span className="qg-role-tab-title">{r.title.replace(/^Я\s+/, '').replace(r.badge ? /\s*\((VIP|CRM)\)/ : /$^/, '')}{r.badge ? <span className="qg-role-tab-badge">{r.badge}</span> : null}</span>
                        <span className="qg-role-tab-desc">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <section aria-labelledby="qg-tools-title">
                <div className="qg-tools-head">
                  <h2 id="qg-tools-title">Инструменты: {activeRoleObj.shortLabel.toLowerCase()}</h2>
                  <button type="button" className="qg-btn qg-btn--primary qg-btn--sm" onClick={handlePrimaryRoleAction}>
                    {selectedRole === 'executor' ? 'Открыть ленту заказов' : selectedRole === 'engineer' ? 'Открыть панель инженера' : selectedRole === 'manager' ? 'Открыть CRM' : 'Начать оценку по фото'}
                  </button>
                </div>
                <ul className="qg-tools-grid">
                  {activeCards.map(card => (
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectItem(card)}
                        className="qg-tool"
                        style={{ '--role-color': activeRoleObj.color }}
                      >
                        <span className="qg-tool-icon" aria-hidden="true">{card.icon}</span>
                        <span className="qg-tool-body">
                          <span className="qg-tool-title">{card.title}</span>
                          <span className="qg-tool-desc">{card.desc}</span>
                        </span>
                        <span className="qg-tool-action">{card.btnText.replace(/^[^\p{L}\p{N}]+/u, '')}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
