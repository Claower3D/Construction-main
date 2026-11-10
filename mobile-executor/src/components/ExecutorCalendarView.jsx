import React from 'react';
import AgendaCalendar from './AgendaCalendar';
import WorkOrderCard from './WorkOrderCard';
import { statusTone } from './ui/kit';

export default function ExecutorCalendarView({ orders = [], onSelectOrder }) {
  return (
    <AgendaCalendar
      items={orders}
      renderItem={(order) => <WorkOrderCard order={order} onSelectOrder={onSelectOrder} compact />}
      itemTone={(order) => `var(--st-${statusTone(order.status)})`}
      emptyText="Работ на эту дату не запланировано."
    />
  );
}
