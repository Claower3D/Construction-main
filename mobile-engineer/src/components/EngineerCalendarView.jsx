import React from 'react';
import AgendaCalendar from './AgendaCalendar';
import InspectionCard from './InspectionCard';
import { statusTone } from './ui/kit';

export default function EngineerCalendarView({ deals = [], onSelectDeal, onScheduleVisit }) {
  const open = deals.filter(d => d.status !== 'Завершено');
  return (
    <AgendaCalendar
      items={deals}
      renderItem={(deal) => <InspectionCard deal={deal} onSelect={onSelectDeal} compact />}
      itemTone={(deal) => `var(--st-${statusTone(deal.status)})`}
      onSchedule={onScheduleVisit ? (id, date, time) => onScheduleVisit(id, date, time) : undefined}
      scheduleLabel="Назначить выезд"
      itemLabel={(d) => `${d.leadNum ? `№ ${d.leadNum}, ` : ''}${d.title}`}
      emptyText={open.length ? 'Выездов на эту дату нет. Назначьте выезд на свободный объект.' : 'Выездов на эту дату нет.'}
    />
  );
}
