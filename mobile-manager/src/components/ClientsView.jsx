import React from 'react';
import { Phone, MessageCircle, Building2, UserRound, Users } from 'lucide-react';
import { EmptyState, formatMoney } from './ui/kit';

export default function ClientsView({ deals, onSelectDeal, searchQuery }) {
  // one row per client, with deal count and total budget
  const clientsMap = new Map();
  deals.forEach((d) => {
    const name = d.client || 'Клиент';
    if (!clientsMap.has(name)) {
      clientsMap.set(name, {
        name,
        phone: d.phone || '',
        location: d.location || '',
        dealsCount: 0,
        totalBudget: 0,
        lastDeal: d,
        isCompany: /ТОО|ИП|ООО|АО/.test(name)
      });
    }
    const c = clientsMap.get(name);
    c.dealsCount += 1;
    c.totalBudget += Number(d.budget) || 0;
    if (!c.phone && d.phone) c.phone = d.phone;
    if (String(d.date || '') > String(c.lastDeal.date || '')) c.lastDeal = d;
  });

  const q = (searchQuery || '').trim().toLowerCase();
  const clients = Array.from(clientsMap.values())
    .filter(c => !q || [c.name, c.phone, c.location].some(v => String(v).toLowerCase().includes(q)))
    .sort((a, b) => b.totalBudget - a.totalBudget);

  return (
    <div className="qz-page">
      <div className="qz-section-head">
        <h2 className="qz-h2">Клиенты и партнёры</h2>
        <span className="qz-small qz-faint num">{clients.length}</span>
      </div>

      {clients.length === 0 && (
        <EmptyState
          icon={<Users size={28} />}
          title={q ? 'Никого не нашли' : 'Клиентов пока нет'}
          text={q ? 'Проверьте имя, телефон или адрес.' : 'Клиенты появятся после первого лида.'}
        />
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {clients.map((c) => {
          const tel = c.phone.replace(/[^0-9+]/g, '');
          const wa = c.phone.replace(/[^0-9]/g, '');
          return (
            <div
              key={c.name}
              className="qz-card"
              role="button"
              tabIndex={0}
              onClick={() => onSelectDeal(c.lastDeal)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectDeal(c.lastDeal); }}
              style={{ padding: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--surface-3)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }} aria-hidden="true">
                {c.isCompany ? <Building2 size={20} /> : <UserRound size={20} />}
              </span>
              <div className="qz-grow">
                <div className="qz-h3" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div className="qz-small qz-muted num">
                  {c.dealsCount} {c.dealsCount === 1 ? 'сделка' : (c.dealsCount < 5 ? 'сделки' : 'сделок')}{c.totalBudget > 0 ? `, ${formatMoney(c.totalBudget)}` : ''}
                </div>
                {c.location && <div className="qz-xs qz-faint" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.location}</div>}
              </div>
              {tel && (
                <div className="qz-ticket-actions" onClick={(e) => e.stopPropagation()}>
                  <a className="qz-iconbtn" href={`tel:${tel}`} aria-label={`Позвонить ${c.name}`}><Phone size={18} /></a>
                  <button
                    type="button"
                    className="qz-iconbtn"
                    aria-label={`WhatsApp ${c.name}`}
                    onClick={() => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`Здравствуйте, ${c.name}! Менеджер QazGost на связи.`)}`, '_blank')}
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
