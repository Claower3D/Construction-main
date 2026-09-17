import React, { useState } from 'react';
import { Phone, MessageSquare, Building2, User, Search, ChevronRight } from 'lucide-react';

export default function ClientsView({ deals, onSelectDeal, searchQuery }) {
  const [localSearch, setLocalSearch] = useState('');

  // Extract unique clients from deals
  const clientsMap = new Map();
  deals.forEach((d) => {
    if (!clientsMap.has(d.client)) {
      clientsMap.set(d.client, {
        name: d.client,
        phone: d.phone,
        location: d.location,
        dealsCount: 0,
        totalBudget: 0,
        lastDeal: d,
        isCompany: d.client.includes('ТОО') || d.client.includes('ИП') || d.client.includes('ООО')
      });
    }
    const c = clientsMap.get(d.client);
    c.dealsCount += 1;
    c.totalBudget += (d.budget || 0);
  });

  const clients = Array.from(clientsMap.values()).filter(c => {
    const q = (searchQuery || localSearch).toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.location || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
            База клиентов и партнёров
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Всего контактов в CRM: {clients.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {clients.map((c, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onSelectDeal(c.lastDeal)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: c.isCompany ? 'rgba(56, 189, 248, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: c.isCompany ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.isCompany ? '#38bdf8' : '#c4b5fd'
              }}>
                {c.isCompany ? <Building2 size={20} /> : <User size={20} />}
              </div>

              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem' }}>
                  {c.name}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '1px' }}>
                  {c.phone}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                  {c.dealsCount} {c.dealsCount === 1 ? 'сделка' : 'сделки'} • {new Intl.NumberFormat('ru-RU').format(c.totalBudget)} ₸
                </div>
              </div>
            </div>

            {/* Direct buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${c.phone.replace(/[^0-9+]/g, '')}`;
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Phone size={15} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const clean = c.phone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(`Здравствуйте, ${c.name}! Менеджер QazGost на связи.`)}`, '_blank');
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
