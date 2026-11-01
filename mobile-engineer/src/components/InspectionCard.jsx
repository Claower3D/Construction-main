import React from 'react';
import { Phone, Navigation, MapPin, UserRound, Ruler } from 'lucide-react';
import { Ticket } from './ui/kit';

export default function InspectionCard({ deal, onSelect, compact = false }) {
  const phone = String(deal.phone || '');
  const tel = phone.replace(/[^0-9+]/g, '');
  const measured = deal.inspection && (deal.inspection.depth || deal.inspection.ringsCount || deal.inspection.pipeLength);
  const defects = (deal.defects || []).length;

  const open2GIS = () => {
    if (deal.location) window.open(`https://2gis.kz/search/${encodeURIComponent(deal.location)}`, '_system');
  };

  return (
    <Ticket
      status={deal.status}
      number={deal.leadNum || undefined}
      title={deal.title}
      tag={
        <>
          {(deal.priority === 'urgent' || deal.priority === 'high') && <span className="qz-tag is-warn">Срочно</span>}
          {deal._dirty && <span className="qz-tag">Не отправлено</span>}
          {deal._demo && <span className="qz-tag is-warn">Демо</span>}
        </>
      }
      meta={[
        { icon: <UserRound size={14} />, text: deal.client },
        { icon: <MapPin size={14} />, text: deal.location },
        measured ? { icon: <Ruler size={14} />, text: `Замер: ${[deal.inspection.depth && `глубина ${deal.inspection.depth} м`, deal.inspection.ringsCount && `${deal.inspection.ringsCount} кол.`].filter(Boolean).join(', ') || 'сохранён'}${defects ? `; актов дефектов: ${defects}` : ''}` } : (defects ? { icon: <Ruler size={14} />, text: `Актов дефектов: ${defects}` } : null)
      ]}
      amount={deal.budget}
      date={deal.date}
      time={deal.time}
      compact={compact}
      onOpen={() => onSelect(deal)}
      actions={
        <>
          {tel && <a className="qz-iconbtn" href={`tel:${tel}`} aria-label={`Позвонить: ${phone}`}><Phone size={18} /></a>}
          {deal.location && <button type="button" className="qz-iconbtn" aria-label="Маршрут в 2GIS" onClick={open2GIS}><Navigation size={18} /></button>}
        </>
      }
    />
  );
}
