import React, { useState, useMemo } from 'react';
import './UserOrdersPage.css';

export default function UserOrdersPage({ currentUser, onBack, onSwitchRole }) {
  const [role, setRole] = useState(currentUser?.role || 'customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Sample Orders with Detailed Stages & Auto-matched Machinery
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
      description: 'Комплексный ремонт офисного помещения: демонтаж, новая электрика, перегородки из ГКЛ, чистовая отделка.',
      stages: [
        {
          id: 'STG-1',
          name: '1. Демонтажные работы и вывоз мусора',
          status: 'completed',
          progress: 100,
          dateRange: '12.08 – 15.08.2026',
          budget: 650000,
          machinery: [
            { id: 18, name: 'Самосвал Shacman F3000 (25 т)', photo: '/assets/machinery/shacman_dump_truck.jpg', rate: '18 000 ₸ / час', dist: '1.4 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 11, name: 'Мини-погрузчик Bobcat S530', photo: '/assets/machinery/bobcat_skid_steer.jpg', rate: '14 000 ₸ / час', dist: '1.6 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-2',
          name: '2. Монтаж перегородок, потолков и электрики',
          status: 'in_progress',
          progress: 65,
          dateRange: '16.08 – 24.08.2026',
          budget: 1850000,
          machinery: [
            { id: 8, name: 'Кран-манипулятор КАМАЗ 65117 (КМУ 7 т)', photo: '/assets/machinery/kamaz_manipulator.jpg', rate: '20 000 ₸ / час', dist: '1.8 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 22, name: 'Дизель-генератор SDMO 100 кВт (Резерв)', photo: '/assets/machinery/diesel_generator_sdmo.jpg', rate: '12 000 ₸ / час', dist: '1.5 км от объекта', status: '🟢 Свободен', assigned: false }
          ]
        },
        {
          id: 'STG-3',
          name: '3. Чистовая отделка, полы и освещение',
          status: 'pending',
          progress: 0,
          dateRange: '25.08 – 05.09.2026',
          budget: 2350000,
          machinery: [
            { id: 12, name: 'Телескопический погрузчик Manitou MT 1840', photo: '/assets/machinery/manitou_telehandler.jpg', rate: '24 000 ₸ / час', dist: '2.3 км от объекта', status: '🟢 Свободен', assigned: false }
          ]
        }
      ]
    },
    {
      id: 'ORD-2026-074',
      title: 'Строительство монолитного коттеджа 320 м²',
      clientName: 'ИП «СтройСервис»',
      clientPhone: '+7 (705) 888-11-22',
      amount: 14800000,
      status: 'in_progress',
      statusLabel: '🟢 В работе',
      date: '05 авг 2026',
      city: 'Астана',
      category: 'Монолитные работы',
      description: 'Земляные работы, свайное поле, заливка фундаментной плиты и возведение монолитного каркаса.',
      stages: [
        {
          id: 'STG-1',
          name: '1. Земляные работы и разработка котлована',
          status: 'completed',
          progress: 100,
          dateRange: '05.08 – 10.08.2026',
          budget: 2800000,
          machinery: [
            { id: 1, name: 'Гусеничный экскаватор Hitachi ZX240', photo: '/assets/machinery/hitachi_excavator.jpg', rate: '25 000 ₸ / час', dist: '1.8 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 4, name: 'Тяжелый бульдозер CAT D6R', photo: '/assets/machinery/cat_bulldozer.jpg', rate: '32 000 ₸ / час', dist: '2.2 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 18, name: 'Самосвал Shacman F3000 (25 т)', photo: '/assets/machinery/shacman_dump_truck.jpg', rate: '18 000 ₸ / час', dist: '1.4 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-2',
          name: '2. Устройство свайного поля и фундамента',
          status: 'in_progress',
          progress: 45,
          dateRange: '11.08 – 22.08.2026',
          budget: 5200000,
          machinery: [
            { id: 21, name: 'Буровая сваебойная установка Bauer BG 28', photo: '/assets/machinery/bauer_piling_rig.jpg', rate: '95 000 ₸ / час', dist: '3.1 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 16, name: 'Автобетононасос Putzmeister 38м', photo: '/assets/machinery/concrete_pump.jpg', rate: '40 000 ₸ / час', dist: '1.9 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 17, name: 'Автобетоносмеситель КАМАЗ 6520', photo: '/assets/machinery/kamaz_concrete_mixer.jpg', rate: '15 000 ₸ / рейс', dist: '1.4 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-3',
          name: '3. Монтаж колонн, перекрытий и кровли',
          status: 'pending',
          progress: 0,
          dateRange: '23.08 – 15.09.2026',
          budget: 6800000,
          machinery: [
            { id: 5, name: 'Автокран XCMG QY25K5, 25 т', photo: '/assets/machinery/xcmg_mobile_crane.jpg', rate: '28 000 ₸ / час', dist: '2.1 км от объекта', status: '🟢 Свободен', assigned: false },
            { id: 6, name: 'Автовышка телескопическая Hyundai HD78', photo: '/assets/machinery/hyundai_cherry_picker.jpg', rate: '18 000 ₸ / час', dist: '2.0 км от объекта', status: '🟢 Свободен', assigned: false }
          ]
        }
      ]
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
      description: 'Установка котла, коллекторов, лучевая разводка теплого пола на 2 этажа коттеджа.',
      stages: [
        {
          id: 'STG-1',
          name: '1. Прокладка трубопроводов и монтаж коллекторов',
          status: 'in_progress',
          progress: 30,
          dateRange: '10.08 – 18.08.2026',
          budget: 620000,
          machinery: [
            { id: 8, name: 'Кран-манипулятор КАМАЗ 65117', photo: '/assets/machinery/kamaz_manipulator.jpg', rate: '20 000 ₸ / час', dist: '1.8 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-2',
          name: '2. Опрессовка системы и пусконаладка',
          status: 'pending',
          progress: 0,
          dateRange: '19.08 – 25.08.2026',
          budget: 800000,
          machinery: [
            { id: 23, name: 'Компрессор дизельный Atlas Copco XAS 97', photo: '/assets/machinery/air_compressor_atlas.jpg', rate: '14 000 ₸ / час', dist: '1.7 км от объекта', status: '🟢 Свободен', assigned: false }
          ]
        }
      ]
    },
    {
      id: 'ORD-2026-068',
      title: 'Строительство подъездной дороги и парковки',
      clientName: 'ТОО «АктобеДевелопмент»',
      clientPhone: '+7 (7132) 40-50-60',
      amount: 6890000,
      status: 'in_progress',
      statusLabel: '🟢 В работе',
      date: '28 июл 2026',
      city: 'Актобе',
      category: 'Дорожные работы',
      description: 'Планировка основания, укладка геотекстиля, щебеночное основание и асфальтирование.',
      stages: [
        {
          id: 'STG-1',
          name: '1. Земляное корыто и профилирование откосов',
          status: 'completed',
          progress: 100,
          dateRange: '28.07 – 03.08.2026',
          budget: 2100000,
          machinery: [
            { id: 14, name: 'Автогрейдер XCMG GR215 (4.3 м)', photo: '/assets/machinery/motor_grader_xcmg.jpg', rate: '22 000 ₸ / час', dist: '2.7 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 13, name: 'Каток дорожный Bomag 14т', photo: '/assets/machinery/road_roller_bomag.jpg', rate: '18 000 ₸ / час', dist: '1.9 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        },
        {
          id: 'STG-2',
          name: '2. Укладка двух слоев горячего асфальтобетона',
          status: 'in_progress',
          progress: 50,
          dateRange: '04.08 – 14.08.2026',
          budget: 4790000,
          machinery: [
            { id: 15, name: 'Асфальтоукладчик Vogele Super 1800-3', photo: '/assets/machinery/asphalt_paver_vogele.jpg', rate: '48 000 ₸ / час', dist: '2.5 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 13, name: 'Каток дорожный Bomag 14т', photo: '/assets/machinery/road_roller_bomag.jpg', rate: '18 000 ₸ / час', dist: '1.9 км от объекта', status: '🟢 Свободен', assigned: true },
            { id: 18, name: 'Самосвал Shacman F3000 (25 т)', photo: '/assets/machinery/shacman_dump_truck.jpg', rate: '18 000 ₸ / час', dist: '1.4 км от объекта', status: '🟢 Свободен', assigned: true }
          ]
        }
      ]
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
  const handleToggleMachinery = (orderId, stageId, machineId) => {
    setOrders(prevOrders => prevOrders.map(ord => {
      if (ord.id !== orderId) return ord;
      return {
        ...ord,
        stages: ord.stages?.map(stg => {
          if (stg.id !== stageId) return stg;
          return {
            ...stg,
            machinery: stg.machinery?.map(m => {
              if (m.id !== machineId) return m;
              const newAssigned = !m.assigned;
              showToast(newAssigned ? `🚜 ${m.name} успешно забронирован на этап! (GPS Online)` : `Техника ${m.name} снята с этапа`);
              return { ...m, assigned: newAssigned };
            })
          };
        })
      };
    }));

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({
        ...prev,
        stages: prev.stages?.map(stg => {
          if (stg.id !== stageId) return stg;
          return {
            ...stg,
            machinery: stg.machinery?.map(m => {
              if (m.id !== machineId) return m;
              return { ...m, assigned: !m.assigned };
            })
          };
        })
      }));
    }
  };

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

            <div className="uo-m-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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

              {/* 🚜 SMART GPS MACHINERY DISPATCH FOR PROJECT STAGES */}
              {selectedOrder.stages && selectedOrder.stages.length > 0 && (
                <div className="uo-stages-container" style={{ marginTop: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏗️</span> График этапов работ и подбор спецтехники (GPS)
                    </h4>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      📍 Автоподбор ближайших машин
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedOrder.stages.map(stg => (
                      <div key={stg.id} style={{
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        padding: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{stg.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                              ⏱ Сроки: {stg.dateRange} • Бюджет этапа: <strong style={{ color: '#00ff88' }}>{formatMoney(stg.budget)}</strong>
                            </div>
                          </div>
                          <span className={`uo-status-pill ${stg.status}`} style={{ fontSize: '0.75rem' }}>
                            {stg.status === 'completed' && '✅ Выполнен'}
                            {stg.status === 'in_progress' && `🟢 В процессе (${stg.progress}%)`}
                            {stg.status === 'pending' && '⏳ Запланирован'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                          <div style={{
                            width: `${stg.progress}%`,
                            height: '100%',
                            background: stg.status === 'completed' ? '#10b981' : 'linear-gradient(90deg, #38bdf8, #00ff88)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>

                        {/* Needed Machinery for this stage */}
                        <div style={{ background: 'rgba(8, 12, 22, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🚜</span> Необходимая спецтехника для этого этапа (Подобрано с маркетплейса):
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                            {stg.machinery?.map(m => (
                              <div key={m.id} style={{
                                display: 'flex',
                                gap: '10px',
                                background: m.assigned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                border: m.assigned ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '8px',
                                alignItems: 'center'
                              }}>
                                <img
                                  src={m.photo}
                                  alt={m.name}
                                  style={{ width: '64px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '700' }}>
                                    📍 {m.dist} • {m.rate}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: m.assigned ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
                                    {m.assigned ? '✅ Закреплена за этапом' : '🟢 Свободна (GPS Online)'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMachinery(selectedOrder.id, stg.id, m.id)}
                                  style={{
                                    background: m.assigned ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                                    color: m.assigned ? '#f87171' : '#ffffff',
                                    border: m.assigned ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.5)',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {m.assigned ? '✕ Отвязать' : '⚡ В этап'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}
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
