import React from 'react';
import { ChevronRight, Scale, Coins, Map, Gauge, Network, ScrollText, Truck, FileText, Settings, Database, Briefcase, Contact, CalendarCheck, MessagesSquare, Package } from 'lucide-react';

// Все пункты панели администратора сайта, которых нет в нижнем меню
export const MORE_ITEMS = [
  { id: 'deals', icon: Briefcase, title: 'Сделки CRM', text: 'Воронка менеджера, инженера и исполнителя' },
  { id: 'directory', icon: Contact, title: 'Клиенты, компании, бригады', text: 'Справочники CRM' },
  { id: 'chats', icon: MessagesSquare, title: 'Переписка по заказам', text: 'Все чаты, ответ от администратора' },
  { id: 'bookings', icon: CalendarCheck, title: 'Брони техники', text: 'Подтвердить, завершить, отменить' },
  { id: 'offers', icon: Package, title: 'Предложения материалов', text: 'Цены поставщиков' },
  { id: 'disputes', icon: Scale, title: 'Споры и арбитраж', text: 'Претензии по качеству работ' },
  { id: 'prices', icon: Coins, title: 'Прайсы и база расценок', text: 'Поиск по 23 тыс. позиций, состав базы' },
  { id: 'regions', icon: Map, title: 'Региональные индексы', text: 'Коэффициенты цен по городам РК' },
  { id: 'kpi', icon: Gauge, title: 'KPI платформы', text: 'Конверсия, средний чек, нагрузка' },
  { id: 'server', icon: Database, title: 'Сервер и база данных', text: 'Состояние, память, время работы' },
  { id: 'roles', icon: Network, title: 'Роли и древо прав', text: 'Кто что может на платформе' },
  { id: 'audit', icon: ScrollText, title: 'Журнал действий', text: 'Что меняли администраторы' },
  { id: 'market', icon: Truck, title: 'Маркетплейс', text: 'Техника, брони, материалы' },
  { id: 'documents', icon: FileText, title: 'Договоры и документы', text: 'КС-2, КС-3, счета, договоры' },
  { id: 'settings', icon: Settings, title: 'Настройки', text: 'Пароль, сервер, выход' },
];

export default function More({ go }) {
  return (
    <div className="qz-page qz-stack">
      <h2 className="qz-h2">Все разделы</h2>
      <div className="qga-list">
        {MORE_ITEMS.map(({ id, icon: Icon, title, text }) => (
          <button key={id} type="button" className="qga-row" onClick={() => go(id)}>
            <span className="qga-icon" aria-hidden="true"><Icon size={20} /></span>
            <span className="qz-grow" style={{ textAlign: 'left' }}>
              <span className="qga-row-title">{title}</span>
              <span className="qga-row-sub">{text}</span>
            </span>
            <ChevronRight size={18} className="qz-faint" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
