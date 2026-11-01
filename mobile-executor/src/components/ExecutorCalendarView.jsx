import React from 'react';
import AgendaCalendar from './AgendaCalendar';
import WorkOrderCard from './WorkOrderCard';

export default function ExecutorCalendarView({ orders = [], onSelectOrder }) {
  return (
    <AgendaCalendar
      items={orders}
      renderItem={(order) => <WorkOrderCard order={order} onSelectOrder={onSelectOrder} compact />}
      emptyText="Работ на эту дату не запланировано."
    />
  );
}
