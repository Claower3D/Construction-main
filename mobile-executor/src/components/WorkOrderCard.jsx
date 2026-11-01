import React from 'react';
import { Phone, Navigation, MapPin, UserRound, Camera, Truck } from 'lucide-react';
import { defaultStages } from '../api/executorApi';
import { Ticket, StepProgress } from './ui/kit';

export default function WorkOrderCard({ order, onSelectOrder, compact = false }) {
  const stages = order.stages && order.stages.length ? order.stages : defaultStages();
  const phone = String(order.phone || '');
  const tel = phone.replace(/[^\d+]/g, '');
  const photos = (order.photos || []).length;
  const machinery = (order.machinery || []).length;

  const open2GIS = () => {
    if (order.location) window.open(`https://2gis.kz/search/${encodeURIComponent(order.location)}`, '_blank');
  };

  return (
    <Ticket
      status={order.status}
      number={order.leadNum || undefined}
      title={order.title}
      tag={
        <>
          {(order.priority === 'urgent' || order.priority === 'high') && <span className="qz-tag is-warn">Срочно</span>}
          {order._dirty && <span className="qz-tag">Не отправлено</span>}
          {order._demo && <span className="qz-tag is-warn">Демо</span>}
        </>
      }
      meta={[
        { icon: <UserRound size={14} />, text: order.client },
        { icon: <MapPin size={14} />, text: order.location },
        (photos || machinery) ? { icon: photos ? <Camera size={14} /> : <Truck size={14} />, text: [photos && `фото: ${photos}`, machinery && `техника: ${machinery}`].filter(Boolean).join(', ') } : null
      ]}
      date={order.date}
      time={order.time}
      compact={compact}
      onOpen={() => onSelectOrder(order)}
      actions={
        <>
          {tel && <a className="qz-iconbtn" href={`tel:${tel}`} aria-label={`Позвонить: ${phone}`}><Phone size={18} /></a>}
          {order.location && <button type="button" className="qz-iconbtn" aria-label="Маршрут в 2GIS" onClick={open2GIS}><Navigation size={18} /></button>}
        </>
      }
      amount={order.budget}
      amountLabel="Сумма не указана"
    >
      <StepProgress stages={stages} />
    </Ticket>
  );
}
