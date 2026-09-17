import React, { useState, useEffect, useCallback } from 'react';
import HeaderBar from './components/HeaderBar';
import BottomNav from './components/BottomNav';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import WorkOrdersListView from './components/WorkOrdersListView';
import WorkOrderDetailModal from './components/WorkOrderDetailModal';
import MachineryRequestView from './components/MachineryRequestView';
import ExecutorCalendarView from './components/ExecutorCalendarView';
import MarketplaceView from './components/MarketplaceView';

import {
  getSavedAuth,
  setSavedAuth,
  getSavedServerUrl,
  setSavedServerUrl,
  testServerPing,
  fetchServerOrders,
  updateOrderStatus,
  toggleWorkStage,
  addWorkPhoto,
  requestMachinery,
  getStoredOrders
} from './api/executorApi';

export default function App() {
  const [authData, setAuthData] = useState(() => getSavedAuth());
  const [serverUrl, setServerUrl] = useState(() => getSavedServerUrl());
  const [orders, setOrders] = useState(() => getStoredOrders());
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'stages' | 'machinery' | 'calendar' | 'market'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Check server connection on mount and every 45 seconds
  useEffect(() => {
    const checkPing = async () => {
      const ping = await testServerPing(serverUrl);
      setIsOnline(ping.ok);
    };
    checkPing();
    const interval = setInterval(checkPing, 45000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  // Initial fetch from server
  useEffect(() => {
    const loadInit = async () => {
      if (authData) {
        setIsSyncing(true);
        const res = await fetchServerOrders(serverUrl);
        if (res && res.orders) {
          setOrders(res.orders);
        }
        setIsSyncing(false);
      }
    };
    loadInit();
  }, [serverUrl, authData]);

  // Handle Sync
  const handleSync = async () => {
    setIsSyncing(true);
    const res = await fetchServerOrders(serverUrl);
    setIsSyncing(false);
    if (res && res.orders) {
      setOrders(res.orders);
      setIsOnline(res.ok !== false && !res.fromCache);
      showToast(res.fromCache ? '🔄 Загружено из локальной базы' : '⚡ Синхронизировано с Railway сервером!');
    } else {
      setIsOnline(false);
      showToast('⚠️ Ошибка соединения с сервером. Данные сохранены локально.');
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (orderId, newStatus, newNote) => {
    const updated = await updateOrderStatus(serverUrl, orderId, newStatus, newNote, authData?.name || 'Тимур (Бригадир)');
    setOrders(updated);
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder(updated.find(o => String(o.id) === String(orderId)));
    }
    showToast(`Статус наряда #${orderId} изменен: "${newStatus}"`);
  };

  // Handle Toggle Stage
  const handleToggleStage = async (orderId, stageId, isDone, stageNote) => {
    const updated = await toggleWorkStage(serverUrl, orderId, stageId, isDone, stageNote, authData?.name || 'Тимур (Бригадир)');
    setOrders(updated);
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder(updated.find(o => String(o.id) === String(orderId)));
    }
    showToast(`${isDone ? '✅ Выполнен' : '↩️ Отменён'}: Этап #${stageId}`);
  };

  // Handle Add Photo
  const handleAddPhoto = async (orderId, photoObj) => {
    const updated = await addWorkPhoto(serverUrl, orderId, photoObj, authData?.name || 'Тимур (Бригадир)');
    setOrders(updated);
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder(updated.find(o => String(o.id) === String(orderId)));
    }
    showToast('📷 Фотоотчёт сохранён в наряд объекта!');
  };

  // Handle Request Machinery
  const handleRequestMachinery = async (orderId, machType, machDate, machTime, machNote) => {
    const updated = await requestMachinery(serverUrl, orderId, machType, machDate, machTime, machNote, authData?.name || 'Тимур (Бригадир)');
    setOrders(updated);
    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder(updated.find(o => String(o.id) === String(orderId)));
    }
    showToast(`🚜 Заявка на ${machType} создана на ${machDate}!`);
  };

  // Handle Quick Order from Marketplace
  const handleMarketOrder = (product) => {
    showToast(`🛒 "${product.title}" добавлен в наряд снабжения!`);
  };

  // Login handler
  const handleLoginSuccess = (loginResult) => {
    setAuthData(loginResult);
    showToast(`Добро пожаловать, ${loginResult.name || 'Бригадир СМР'}!`);
  };

  // Logout handler
  const handleLogout = () => {
    setSavedAuth(null);
    setAuthData(null);
    setSelectedOrder(null);
    showToast('Вы вышли из системы');
  };

  // If not logged in, show Login Screen
  if (!authData) {
    return (
      <LoginScreen
        serverUrl={serverUrl}
        onLoginSuccess={handleLoginSuccess}
        onSettingsOpen={() => setShowSettings(true)}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060b17',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Header */}
      <HeaderBar
        activeTab={activeTab}
        executor={authData}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onSync={handleSync}
        onRefresh={handleSync}
        onOpenSettings={() => setShowSettings(true)}
        ordersCount={orders.length}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        paddingBottom: '85px',
        overflowY: 'auto'
      }}>
        {activeTab === 'orders' && (
          <WorkOrdersListView
            orders={orders}
            onSelectOrder={setSelectedOrder}
            onUpdateStatus={handleUpdateStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === 'stages' && (
          <div style={{ padding: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#00e5ff', margin: 0 }}>
                  📋 Чек-лист 7 этапов СМР
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                  Нажмите на этап для подтверждения выполнения
                </p>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                В работе: {orders.filter(o => o.status === 'В работе').length}
              </span>
            </div>

            {orders.map(order => {
              const stages = order.stages || [];
              const doneCount = stages.filter(s => s.done).length;
              const totalCount = stages.length || 7;
              const pct = Math.round((doneCount / totalCount) * 100);

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                        Заказ #{order.leadNum || order.id} • {order.client}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        📍 {order.location || 'Адрес не указан'}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        border: '1px solid #00e5ff',
                        borderRadius: '8px',
                        color: '#00e5ff',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Наряд ↗
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Готовность объекта</span>
                      <span style={{ color: pct === 100 ? '#10b981' : '#00e5ff', fontWeight: '800' }}>
                        {doneCount}/{totalCount} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: pct === 100 ? '#10b981' : '#00e5ff',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  {/* Stages items quick checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stages.map(st => (
                      <div
                        key={st.id}
                        onClick={() => handleToggleStage(order.id, st.id, !st.done, st.note || '')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          backgroundColor: st.done ? 'rgba(16, 185, 129, 0.08)' : '#1e293b',
                          border: `1px solid ${st.done ? 'rgba(16, 185, 129, 0.4)' : '#334155'}`,
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: st.done ? '#10b981' : 'transparent',
                          border: `2px solid ${st.done ? '#10b981' : '#64748b'}`,
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: '800',
                          flexShrink: 0
                        }}>
                          {st.done ? '✓' : ''}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: st.done ? '#10b981' : '#f8fafc',
                            textDecoration: st.done ? 'line-through' : 'none'
                          }}>
                            {st.id}. {st.title}
                          </div>
                          {st.time && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Отметка: {st.time} {st.note ? `• ${st.note}` : ''}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: st.done ? '#10b981' : '#64748b' }}>
                          {st.done ? 'Сделано' : 'Отметить'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'machinery' && (
          <MachineryRequestView
            orders={orders}
            onRequestMachinery={handleRequestMachinery}
          />
        )}

        {activeTab === 'calendar' && (
          <ExecutorCalendarView
            orders={orders}
            onSelectOrder={setSelectedOrder}
          />
        )}

        {activeTab === 'market' && (
          <MarketplaceView
            onOrderProduct={handleMarketOrder}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onChangeTab={setActiveTab}
        activeCount={orders.filter(o => o.status === 'В работе').length}
      />

      {/* Work Order Detail Modal */}
      {selectedOrder && (
        <WorkOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onToggleStage={handleToggleStage}
          onAddPhoto={handleAddPhoto}
          onRequestMachinery={handleRequestMachinery}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          authData={authData}
          serverUrl={serverUrl}
          onUpdateServerUrl={(newUrl) => {
            setSavedServerUrl(newUrl);
            setServerUrl(newUrl);
            showToast('Адрес сервера сохранен!');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#00e5ff',
          color: '#060b17',
          padding: '10px 20px',
          borderRadius: '24px',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4)',
          zIndex: 9999,
          textAlign: 'center',
          maxWidth: '90%',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
