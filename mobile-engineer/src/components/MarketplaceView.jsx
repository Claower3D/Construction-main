import React, { useState } from 'react';
import { Search, Filter, ShoppingBag, MapPin, Tag, Check, ArrowUpRight, Phone, ShieldCheck, Plus } from 'lucide-react';
import { MARKETPLACE_PRODUCTS } from '../data/marketplaceData';

export default function MarketplaceView({ onAddToEstimate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [addedItemIds, setAddedItemIds] = useState(new Set());

  const categories = [
    { id: 'all', label: 'Все товары' },
    { id: 'electric', label: '⚡ Электрика' },
    { id: 'sewer', label: '🔧 Канализация' },
    { id: 'plumbing', label: '🚿 Сантехника' },
    { id: 'water', label: '💧 Водоснабжение' },
    { id: 'heating', label: '🔥 Отопление' },
    { id: 'roofing', label: '🏠 Кровля/Фасад' },
    { id: 'tools', label: '🛠 Инструменты' },
    { id: 'fasteners', label: '🔩 Крепёж' },
    { id: 'paint', label: '🎨 ЛКМ/Смеси' },
    { id: 'flooring', label: '🪵 Покрытия' }
  ];

  const cities = ['all', 'Алматы', 'Астана', 'Караганда', 'Шымкент', 'Актобе', 'Атырау', 'Павлодар'];

  const filteredProducts = (MARKETPLACE_PRODUCTS || []).filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && item.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (item.title || '').toLowerCase().includes(q) ||
                    (item.supplier || '').toLowerCase().includes(q) ||
                    (item.gost || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleAdd = (item) => {
    setAddedItemIds(prev => new Set([...prev, item.id]));
    if (onAddToEstimate) {
      onAddToEstimate(item);
    }
    setTimeout(() => {
      setAddedItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(2, 132, 199, 0.05) 100%)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#00e5ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            B2B Маркетплейс QazGost
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            Стройматериалы РК
          </div>
        </div>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(0, 229, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem'
        }}>
          🛒
        </div>
      </div>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '0 12px',
        marginBottom: '12px'
      }}>
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по названию, ГОСТу или ТОО..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '10px 10px',
            color: '#ffffff',
            fontSize: '0.84rem',
            outline: 'none'
          }}
        />
      </div>

      {/* City Filter Strip */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '10px',
        scrollbarWidth: 'none'
      }}>
        {cities.map(c => {
          const isSelected = selectedCity === c;
          return (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              style={{
                background: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#00e5ff' : '#94a3b8',
                border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {c === 'all' ? 'Все города РК' : c}
            </button>
          );
        })}
      </div>

      {/* Category Pills Strip */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        scrollbarWidth: 'none'
      }}>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#070a13' : '#94a3b8',
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Products Count */}
      <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px' }}>
        Найдено товаров: {filteredProducts.length}
      </div>

      {/* Products Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredProducts.slice(0, 40).map(item => {
          const isAdded = addedItemIds.has(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(13, 21, 39, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Badge & City */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {item.badge && (
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  {item.gost && (
                    <span style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.gost}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <MapPin size={12} color="#00e5ff" />
                  <span>{item.city}</span>
                </div>
              </div>

              {/* Title & Supplier */}
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', lineHeight: 1.3 }}>
                  {item.title}
                </h4>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Поставщик: <strong style={{ color: '#cbd5e1' }}>{item.supplier}</strong>
                </div>
              </div>

              {/* Price & Action */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00e5ff' }}>
                    {item.price.toLocaleString('ru-RU')} ₸
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    за 1 {item.unit} • В наличии: {item.inStock}
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(item)}
                  style={{
                    background: isAdded ? '#10b981' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#070a13',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isAdded ? <Check size={14} /> : <Plus size={14} />}
                  <span>{isAdded ? 'Добавлено' : 'В смету'}</span>
                </button>
              </div>

              {item.wholesaleNote && (
                <div style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.06)', padding: '4px 8px', borderRadius: '6px' }}>
                  💡 {item.wholesaleNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
