import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Check, Tag } from 'lucide-react';

const CATALOG_ITEMS = [
  { id: 'm1', cat: 'sewer', title: 'Кольцо ЖБИ КС-15.9 (1.5м)', price: 28000, unit: 'шт', badge: 'ГОСТ' },
  { id: 'm2', cat: 'sewer', title: 'Кольцо ЖБИ КС-20.9 (2.0м)', price: 42000, unit: 'шт', badge: 'ГОСТ' },
  { id: 'm3', cat: 'sewer', title: 'Плита перекрытия ПП-15', price: 26000, unit: 'шт', badge: 'ГОСТ' },
  { id: 'm4', cat: 'sewer', title: 'Плита перекрытия ПП-20', price: 38000, unit: 'шт', badge: 'ГОСТ' },
  { id: 'm5', cat: 'sewer', title: 'Люк полимерно-песчаный 6т', price: 14000, unit: 'шт', badge: 'ХИТ' },
  { id: 'm6', cat: 'sewer', title: 'Люк чугунный тип Т (25т)', price: 32000, unit: 'шт', badge: 'ГОСТ' },
  { id: 'm7', cat: 'pipe', title: 'Труба рыжая канализационная 110 (2м)', price: 4200, unit: 'шт', badge: 'SN4' },
  { id: 'm8', cat: 'pipe', title: 'Труба рыжая канализационная 110 (3м)', price: 6100, unit: 'шт', badge: 'SN4' },
  { id: 'm9', cat: 'pipe', title: 'Отвод ПВХ 110 / 45°', price: 1200, unit: 'шт', badge: '' },
  { id: 'm10', cat: 'pipe', title: 'Тройник ПВХ 110 / 110 / 45°', price: 2400, unit: 'шт', badge: '' },
  { id: 'm11', cat: 'bulk', title: 'Щебень фракция 20-40 (самосвал 10т)', price: 45000, unit: 'рейс', badge: 'ДОСТАВКА' },
  { id: 'm12', cat: 'bulk', title: 'Песок мытый карьерный (10т)', price: 38000, unit: 'рейс', badge: 'ДОСТАВКА' },
  { id: 'm13', cat: 'tools', title: 'Гидроизоляция битумная мастика (20л)', price: 12500, unit: 'ведро', badge: '' },
  { id: 'm14', cat: 'tools', title: 'Цемент М400 (мешок 50кг)', price: 2800, unit: 'мешок', badge: '' }
];

export default function MarketplaceView({ onAddRequisition }) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());

  const categories = [
    { id: 'all', label: 'Все товары' },
    { id: 'sewer', label: 'ЖБИ & Люки' },
    { id: 'pipe', label: 'Трубы 110/160' },
    { id: 'bulk', label: 'Щебень & Песок' },
    { id: 'tools', label: 'Расходники' }
  ];

  const filtered = CATALOG_ITEMS.filter(item => {
    if (selectedCat !== 'all' && item.cat !== selectedCat) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = (item) => {
    setAddedIds(prev => new Set(prev).add(item.id));
    if (onAddRequisition) onAddRequisition(item);
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
          Снабжение и дозаказ материалов
        </h2>
        <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 12px' }}>
          Быстрый дозаказ колец, труб, люков и щебня на объект бригады
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '12px',
          padding: '0 12px'
        }}>
          <Search size={16} color="#00e5ff" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск КС-15, люк, труба рыжая..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '10px',
              color: '#ffffff',
              fontSize: '0.84rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px', scrollbarWidth: 'none' }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            style={{
              background: selectedCat === c.id ? '#00e5ff' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCat === c.id ? '#060b17' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(item => {
          const isAdded = addedIds.has(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(13, 21, 39, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                    {item.title}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      background: 'rgba(0, 229, 255, 0.15)',
                      color: '#00e5ff',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#10b981' }}>
                  {item.price.toLocaleString('ru-RU')} ₸ <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>/ {item.unit}</span>
                </div>
              </div>

              <button
                onClick={() => handleAdd(item)}
                style={{
                  background: isAdded ? '#10b981' : 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: '#060b17',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isAdded ? <Check size={14} /> : <Plus size={14} />}
                <span>{isAdded ? 'Добавлено' : 'В заявку'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}