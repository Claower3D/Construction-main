import React from 'react';
import { Phone, MessageCircle, MapPin, UserRound } from 'lucide-react';
import { Ticket } from './ui/kit';

export default function DealCard({ deal, onClick, compact = false }) {
  const phone = String(deal.phone || '');
  const tel = phone.replace(/[^0-9+]/g, '');
  const wa = phone.replace(/[^0-9]/g, '');
  const urgent = deal.priority === 'urgent' || deal.priority === 'high';

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Здравствуйте, ${deal.client}! Пишу по вашей заявке «${deal.title}» в QazGost.`);
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
  };

  return (
    <Ticket
      status={deal.status}
      number={deal.leadNum || undefined}
      title={deal.title}
      tag={
        <>
          {urgent && <span className="qz-tag is-warn">Срочно</span>}
          {deal._dirty && <span className="qz-tag" title="Ещё не отправлено на сервер">Не отправлено</span>}
          {deal._demo && <span className="qz-tag is-warn">Демо</span>}
        </>
      }
      meta={[
        { icon: <UserRound size={14} />, text: deal.client },
        { icon: <MapPin size={14} />, text: deal.location }
      ]}
      amount={deal.budget}
      date={deal.date}
      time={deal.time}
      compact={compact}
      onOpen={() => onClick(deal)}
      actions={tel ? (
        <>
          <a className="qz-iconbtn" href={`tel:${tel}`} aria-label={`Позвонить: ${phone}`}><Phone size={18} /></a>
          <button type="button" className="qz-iconbtn" aria-label="Написать в WhatsApp" onClick={openWhatsApp}><MessageCircle size={18} /></button>
        </>
      ) : null}
    />
  );
}
