import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import BottomNav from './components/BottomNav';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import WorkOrdersListView from './components/WorkOrdersListView';
import WorkOrderDetailModal from './components/WorkOrderDetailModal';
import MachineryRequestView from './components/MachineryRequestView';
import ExecutorCalendarView from './components/ExecutorCalendarView';
import MarketplaceView from './components/MarketplaceView';
import StageChecklist from './components/StageChecklist';
import { Toast, SyncBanner, StepProgress, EmptyState } from './components/ui/kit';
import { ListChecks } from 'lucide-react';

import {
  getSavedAuth,
  setSavedAuth,
  getSavedServerUrl,
  setSavedServerUrl,
  testServerPing,
  syncOrders,
  pendingSyncCount,
  loadDemoOrders,
  resetCachedOrders,
  ordersStore,
  updateOrderStatus,
  toggleWorkStage,
  addWorkPhoto,
  uploadWorkPhoto,
  requestMachinery,
  getStoredOrders,
  defaultStages,
  getAuthHeaders
} from './api/executorApi';
import { FALLBACK_MATERIALS, FALLBACK_EQUIPMENT } from './data/marketFallback';

const HEARTBEAT_MS = 60000;

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
  const [pendingCount, setPendingCount] = useState(() => pendingSyncCount());
  const [syncError, setSyncError] = useState(null);
  const toastTimerRef = useRef(null);

  const authorName = authData?.name || 'Бригадир';
  // stable reference: the marketplace refetches only when the session changes
  const marketHeaders = useMemo(() => getAuthHeaders(), [authData]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const applyOrders = useCallback((list) => {
    setOrders(list);
    setPendingCount(pendingSyncCount(list));
    setSelectedOrder(prev => (prev ? (list.find(o => String(o.id) === String(prev.id)) || prev) : prev));
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

  const runSync = useCallback(async () => {
    setIsSyncing(true);
    const res = await syncOrders();
    setIsSyncing(false);
    setIsOnline(!!res.success);
    if (res.success) {
      setSyncError(res.errors && res.errors.length ? res.errors[0] : null);
      applyOrders(res.deals);
    } else {
      setSyncError(res.error);
      applyOrders(ordersStore.isInitialized() ? res.deals : loadDemoOrders());
    }
    return res;
  }, [applyOrders]);

  // Initial sync + heartbeat
  useEffect(() => {
    if (!authData) return undefined;
    runSync();
    const t = setInterval(() => { runSync(); }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [serverUrl, authData, runSync]);

  // Handle Sync
  const handleSync = async () => {
    const res = await runSync();
    if (!res.success) showToast(`⚠️ Нет связи с сервером (${res.error}). Данные сохранены локально.`);
    else if (res.errors && res.errors.length) showToast(`⚠️ Не всё отправлено: ${res.errors[0]}`);
    else showToast('⚡ Синхронизировано с сервером');
  };

  // Save locally → push → tell the truth about delivery
  const commitAndSync = async (res, okMsg) => {
    applyOrders(res.list);
    if (!res.ok) {
      showToast(`⚠️ ${res.error}`);
      return { ok: false };
    }
    const s = await runSync();
    const rec = (s.deals || []).find(o => String(o.id) === String(res.record?.id));
    const synced = !!(s.success && rec && !rec._dirty);
    showToast(synced ? `${okMsg} — отправлено на сервер` : `${okMsg} — сохранено на телефоне, НЕ отправлено`);
    return { ok: true, synced };
  };

  // Handle Status Update
  const handleUpdateStatus = (orderId, newStatus, newNote) =>
    commitAndSync(updateOrderStatus(orderId, newStatus, newNote, authorName), `Статус «${newStatus}»`);

  // Handle Toggle Stage
  const handleToggleStage = (orderId, stageId, isDone, stageNote) =>
    commitAndSync(toggleWorkStage(orderId, stageId, isDone, stageNote, authorName), `${isDone ? '✅ Выполнен' : '↩️ Отменён'} этап #${stageId}`);

  // Handle Add Photo (upload when a server session exists, otherwise keep on device with a mark)
  const handleAddPhoto = async (orderId, photoObj) => {
    const { blob, ...photo } = photoObj;
    let stored = { ...photo, localOnly: true };
    if (blob) {
      const up = await uploadWorkPhoto(blob, `${photo.id || 'photo'}.jpg`);
      if (up.uploaded) stored = { ...photo, serverUrl: up.url, localOnly: false };
      else stored = { ...photo, localOnly: true, localReason: up.reason };
    }
    return commitAndSync(addWorkPhoto(orderId, stored, authorName), stored.localOnly ? '📷 Фото сохранено на телефоне' : '📷 Фото загружено');
  };

  // Handle Request Machinery
  const handleRequestMachinery = (orderId, machType, machDate, machTime, machNote) =>
    commitAndSync(requestMachinery(orderId, machType, machDate, machTime, machNote, authorName), `🚜 Заявка на ${machType}`);

  // Handle Quick Order from Marketplace
  const handleMarketOrder = (product) => {
    showToast(`🛒 «${product.name}» (${Math.round(product.price).toLocaleString('ru-RU')} ₸ / ${product.unit}) добавлен в список снабжения`);
  };

  const handleUpdateServerUrl = (newUrl) => {
    setSavedServerUrl(newUrl);
    setServerUrl(getSavedServerUrl());
  };

  const handleResetCache = async () => {
    applyOrders(resetCachedOrders());
    await handleSync();
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
        onUpdateServerUrl={handleUpdateServerUrl}
        onLoginSuccess={handleLoginSuccess}
        onSettingsOpen={() => setShowSettings(true)}
      />
    );
  }

  const TITLES = { orders: 'Наряды', stages: 'Этапы работ', machinery: 'Спецтехника', calendar: 'График', market: 'Снабжение' };

  return (
    <div className="qz-app">
      <HeaderBar
        title={TITLES[activeTab] || 'Наряды'}
        showSearch={activeTab === 'orders'}
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

      <SyncBanner pending={pendingCount} error={syncError} onRetry={handleSync} />

      {/* Main Content Area */}
      <main className="qz-main">
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
          <div className="qz-page">
            <p className="qz-small qz-muted" style={{ marginBottom: 'var(--sp-3)' }}>
              Нажмите на этап, чтобы отметить его выполненным. Отметка с временем уходит менеджеру.
            </p>
            {orders.filter(o => o.status !== 'Завершено').length === 0 && (
              <EmptyState icon={<ListChecks size={28} />} title="Активных нарядов нет" text="Когда менеджер назначит наряд, его этапы появятся здесь." />
            )}
            <div style={{ display: 'grid', gap: 'var(--sp-5)' }}>
              {orders.filter(o => o.status !== 'Завершено').map(order => {
                const stages = order.stages && order.stages.length ? order.stages : defaultStages();
                return (
                  <section key={order.id} className="qz-card" aria-label={order.title}>
                    <div className="qz-row" style={{ alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                      <div className="qz-grow">
                        <h2 className="qz-h3">{order.title}</h2>
                        <div className="qz-xs qz-faint">{[order.client, order.location].filter(Boolean).join(', ')}</div>
                      </div>
                      <button type="button" className="qz-btn is-sm" onClick={() => setSelectedOrder(order)}>Наряд</button>
                    </div>
                    <StepProgress stages={stages} />
                    <div style={{ marginTop: 'var(--sp-3)' }}>
                      <StageChecklist order={order} onToggleStage={handleToggleStage} compact />
                    </div>
                  </section>
                );
              })}
            </div>
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
            serverUrl={serverUrl}
            authHeaders={marketHeaders}
            addLabel="В заявку"
            fallbackMaterials={FALLBACK_MATERIALS}
            fallbackEquipment={FALLBACK_EQUIPMENT}
            onAddItem={handleMarketOrder}
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
          executor={authData}
          onClose={() => setShowSettings(false)}
          serverUrl={serverUrl}
          onUpdateServerUrl={(newUrl) => {
            handleUpdateServerUrl(newUrl);
            showToast('Адрес сервера сохранен!');
          }}
          onResetCache={handleResetCache}
          onLogout={handleLogout}
        />
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
