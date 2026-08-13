import React, { useState, useMemo } from 'react';
import './UserOrdersPage.css';

export default function UserOrdersPage({ currentUser, onBack, onSwitchRole }) {
  const [role, setRole] = useState(currentUser?.role || 'customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Sample Orders
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-081',
      title: 'Ремонт офиса 120 м² "под ключ"',
      clientName: 'ТОО «КазИнвестГрупп»',
      clientPhone: '+7 (701) 555-44-33',
      amount: 4850000,
      status: 'in_progress',
      statusLabel: '🟢 В работе',
      date: '12 авг 2026',
      city: 'Алматы',
      category: 'Отделочные работы',
      description: 'Комплексный ремонт офисного помещения: демонтаж, новая электрика, перегородки из ГКЛ, чистовая отделка.'
    },
    {
      id: 'ORD-2026-079',
      title: 'Монтаж системы отопления и HVAC',
      clientName: 'Алмаз Танирбергенов',
      clientPhone: '+7 (777) 123-99-88',
      amount: 1420000,
      status: 'pending',
      statusLabel: '🟡 В обработке',
      date: '10 авг 2026',
      city: 'Астана',
      category: 'Инженерные сети',
      description: 'Установка котла, коллекторов, лучевая разводка теплого пола на 2 этажа коттеджа.'
    },
    {
      id: 'ORD-2026-074',
      title: 'Заливка ленточного фундамента',
      clientName: 'ИП «СтройСервис»',
      clientPhone: '+7 (705) 888-11-22',
      amount: 3200000,
      status: 'completed',
      statusLabel: '✅ Завершён',
      date: '02 авг 2026',
      city: 'Шымкент',
      category: 'Монолитные работы',
      description: 'Арматурный каркас d12, опалубка, приемка бетона М300 с гидрофобизатором.'
    },
    {
      id: 'ORD-2026-068',
      title: 'Проектирование ЭОМ и СС ЖК «Зам-Зам»',
      clientName: 'ТОО «АктобеДевелопмент»',
      clientPhone: '+7 (7132) 40-50-60',
      amount: 890000,
      status: 'in_progress',
      statusLabel: '🟢 В работе',
      date: '28 июл 2026',
      city: 'Актобе',
      category: 'Проектирование',
      description: 'Разработка рабочей документации раздела ЭОМ, слаботочные сети и пожарная сигнализация.'
    }
  ]);

  // Form State
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderClient, setNewOrderClient] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderCity, setNewOrderCity] = useState('Алматы');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dynamic Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ord.title.toLowerCase().includes(q);
        const matchesClient = ord.clientName.toLowerCase().includes(q);
        const matchesId = ord.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesId) return false;
      }

      if (statusFilter !== 'all' && ord.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Stats
  const totalCount = filteredOrders.length;
  const totalSum = filteredOrders.reduce((acc, o) => acc + o.amount, 0);

  const formatMoney = (sum) => {
    return sum.toLocaleString('ru-RU') + ' ₸';
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrderTitle || !newOrderClient || !newOrderAmount) return;

    const newOrd = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newOrderTitle,
      clientName: newOrderClient,
      clientPhone: '+7 (700) 000-00-00',
      amount: parseFloat(newOrderAmount),
      status: 'pending',
      statusLabel: '🟡 В обработке',
      date: 'Сегодня',
      city: newOrderCity,
      category: 'Общее строительство',
      description: 'Новый созданный заказ.'
    };

    setOrders([newOrd, ...orders]);
    setShowCreateModal(false);
    setNewOrderTitle('');
    setNewOrderClient('');
    setNewOrderAmount('');
    showToast('🎉 Новый заказ успешно создан!');
  };

  return (
    <div className="uo-container">
      {toastMessage && <div className="uo-toast">{toastMessage}</div>}

      {/* Header Bar */}
      <div className="uo-header-bar">
        <button className="uo-back-btn" onClick={onBack} title="Вернуться">←</button>
        <div className="uo-title-flex">
          <span className="uo-header-icon">📋</span>
          <h2>Заказы</h2>
        </div>

        <button className="uo-btn-create" onClick={() => setShowCreateModal(true)}>
          ➕ Создать заказ
        </button>
      </div>

      <div className="uo-content">
        
        {/* User Role Card Header */}
        <div className="uo-role-card">
          <div className="uo-role-info">
            <div className="uo-avatar-box">👤</div>
            <div>
              <div className="uo-user-name">
                {currentUser?.name || 'Пользователь системы'}
              </div>
              <div className="uo-user-role">
                Текущая роль: {role === 'customer' ? 'Заказчик' : (role === 'engineer' ? 'Инженер' : 'Компания')}
              </div>
            </div>
          </div>

          <button className="uo-btn-switch-role" onClick={() => {
            const nextRole = role === 'customer' ? 'engineer' : 'customer';
            setRole(nextRole);
            if (onSwitchRole) onSwitchRole(nextRole);
            showToast(`🔄 Переключено на роль: ${nextRole === 'customer' ? 'Заказчик' : 'Инженер'}`);
          }}>
            🔄 Сменить роль
          </button>
        </div>

        {/* Total Summary KPI Container */}
        <div className="uo-summary-box">
          <div className="uo-kpi-item">
            <div className="uo-kpi-num">{totalCount}</div>
            <div className="uo-kpi-sub">ВСЕГО ЗАКАЗОВ</div>
          </div>

          <div className="uo-kpi-divider"></div>

          <div className="uo-kpi-item">
            <div className="uo-kpi-num pink">{formatMoney(totalSum)}</div>
            <div className="uo-kpi-sub">ОБЩАЯ СУММА</div>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="uo-list-card">
          <div className="uo-list-header">
            <div className="uo-list-title flex-align">
              <span>📋</span>
              <h3>Список заказов</h3>
            </div>

            {/* Filter Tabs */}
            <div className="uo-filter-tabs">
              <button 
                className={`uo-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Все
              </button>
              <button 
                className={`uo-tab ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                🟢 В работе
              </button>
              <button 
                className={`uo-tab ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                🟡 В обработке
              </button>
              <button 
                className={`uo-tab ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                ✅ Завершённые
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="uo-search-wrap">
            <span className="uo-search-icon">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру заказа, названию объекта или клиенту..." 
            />
            {searchQuery && (
              <button className="uo-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          {/* Table */}
          <div className="uo-table-wrap">
            <table className="uo-table">
              <thead>
                <tr>
                  <th>ЗАКАЗ</th>
                  <th>КЛИЕНТ</th>
                  <th>СУММА</th>
                  <th>СТАТУС</th>
                  <th style={{ textAlign: 'right' }}>ДЕЙСТВИЯ</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="uo-empty-td">
                      <div className="uo-empty">
                        <span>📭</span>
                        <p>Заказы не найдены</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(ord => (
                    <tr key={ord.id} onClick={() => setSelectedOrder(ord)} className="uo-tr-hover">
                      <td>
                        <div className="uo-ord-title">{ord.title}</div>
                        <div className="uo-ord-id">{ord.id} • 📍 {ord.city}</div>
                      </td>

                      <td>
                        <div className="uo-client-name">{ord.clientName}</div>
                        <div className="uo-client-phone">{ord.clientPhone}</div>
                      </td>

                      <td>
                        <div className="uo-amount">{formatMoney(ord.amount)}</div>
                      </td>

                      <td>
                        <span className={`uo-status-pill ${ord.status}`}>
                          {ord.statusLabel}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="uo-btn-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                        >
                          👁️ Детали
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="uo-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="uo-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uo-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>

            <div className="uo-m-header">
              <span className="uo-m-badge">{selectedOrder.id}</span>
              <h2>{selectedOrder.title}</h2>
              <div className="uo-m-sub">📍 {selectedOrder.city} • {selectedOrder.date}</div>
            </div>

            <div className="uo-m-body">
              <div className="uo-m-row">
                <span className="label">Клиент:</span>
                <span className="val">{selectedOrder.clientName} ({selectedOrder.clientPhone})</span>
              </div>

              <div className="uo-m-row">
                <span className="label">Сумма заказа:</span>
                <span className="val highlight">{formatMoney(selectedOrder.amount)}</span>
              </div>

              <div className="uo-m-row">
                <span className="label">Текущий статус:</span>
                <span className={`uo-status-pill ${selectedOrder.status}`}>{selectedOrder.statusLabel}</span>
              </div>

              <div className="uo-m-section mt-3">
                <h4>📋 Описание объекта</h4>
                <p>{selectedOrder.description}</p>
              </div>
            </div>

            <div className="uo-m-actions">
              <button 
                className="uo-btn-chat"
                onClick={() => showToast(`💬 Чат по заказу ${selectedOrder.id} открыт`)}
              >
                💬 Написать в чат
              </button>

              <button 
                className="uo-btn-close-m"
                onClick={() => setSelectedOrder(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="uo-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="uo-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uo-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            
            <h3>➕ Создать новый заказ</h3>
            <p className="uo-modal-sub-text">Введите параметры нового строительного объекта</p>

            <form onSubmit={handleCreateOrder}>
              <div className="uo-form-group">
                <label>Название заказа / объекта <span>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newOrderTitle}
                  onChange={e => setNewOrderTitle(e.target.value)}
                  placeholder="например, Ремонт квартиры 85м²" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Клиент / Заказчик <span>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newOrderClient}
                  onChange={e => setNewOrderClient(e.target.value)}
                  placeholder="например, ТОО 'Астана Строй' или Имя" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Сумма заказа (₸) <span>*</span></label>
                <input 
                  type="number" 
                  required 
                  value={newOrderAmount}
                  onChange={e => setNewOrderAmount(e.target.value)}
                  placeholder="например, 2500000" 
                  className="uo-input" 
                />
              </div>

              <div className="uo-form-group mt-3">
                <label>Город <span>*</span></label>
                <select 
                  value={newOrderCity} 
                  onChange={e => setNewOrderCity(e.target.value)}
                  className="uo-input"
                >
                  <option value="Алматы">Алматы</option>
                  <option value="Астана">Астана</option>
                  <option value="Шымкент">Шымкент</option>
                  <option value="Караганда">Караганда</option>
                  <option value="Актобе">Актобе</option>
                </select>
              </div>

              <button type="submit" className="uo-btn-submit mt-4">
                🚀 Сохранить и выставить заказ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
