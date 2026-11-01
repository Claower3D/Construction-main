import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderBar from './components/HeaderBar';
import BottomNav from './components/BottomNav';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import ClientsView from './components/ClientsView';
import DealDetailModal from './components/DealDetailModal';
import LeadCreateModal from './components/LeadCreateModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import { Toast, SyncBanner } from './components/ui/kit';
import {
  getStoredDeals,
  getStoredSettings,
  saveStoredSettings,
  getStoredAuth,
  clearStoredAuth,
  createLocalDeal,
  updateLocalDeal,
  deleteLocalDeal,
  loadDemoDeals,
  pendingSyncCount,
  syncDeals,
  dealsStore,
  makeNote
} from './api/crmApi';

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  // Hydrate synchronously from storage so the very first sync works on the real local list
  const [deals, setDeals] = useState(() => getStoredDeals());
  const [settings, setSettings] = useState(getStoredSettings());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLatency, setSyncLatency] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => pendingSyncCount());
  const [syncError, setSyncError] = useState(null);
  const toastTimerRef = useRef(null);

  // Show temporary toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3200);
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const applyList = useCallback((list) => {
    setDeals(list);
    setPendingCount(pendingSyncCount(list));
    setSelectedDeal(prev => (prev ? (list.find(d => String(d.id) === String(prev.id)) || null) : prev));
  }, []);

  // Two-way sync (reads the current list and server URL from storage — no stale closures)
  const runSync = useCallback(async () => {
    setIsSyncing(true);
    const res = await syncDeals();
    setIsSyncing(false);
    if (res.success) {
      setIsOnline(true);
      setSyncLatency(res.latencyMs);
      setLastSyncTime(res.lastSyncTime);
      setSyncError(res.errors && res.errors.length ? res.errors[0] : null);
      applyList(res.deals);
    } else {
      setIsOnline(false);
      setSyncLatency(null);
      setSyncError(res.error);
      // First launch without network: offline demo (never synchronized)
      applyList(dealsStore.isInitialized() ? res.deals : loadDemoDeals());
    }
    return res;
  }, [applyList]);

  const handleSync = useCallback(async (notify = true) => {
    const res = await runSync();
    if (!notify) return res;
    if (res.success) {
      showToast(res.errors && res.errors.length
        ? `⚠ Синхронизировано частично: ошибок ${res.errors.length}`
        : `✓ Синхронизировано (${res.latencyMs} мс, ${res.deals.length} сделок)`);
    } else {
      showToast(`Офлайн (${res.error}). Данные сохранены на телефоне`);
    }
    return res;
  }, [runSync, showToast]);

  const scheduleSync = useCallback(() => {
    setTimeout(() => { handleSync(false); }, 300);
  }, [handleSync]);

  // Initial sync + heartbeat — only for a logged-in user
  useEffect(() => {
    if (!auth) return undefined;
    handleSync(false);
    const intervalMs = Math.max(5, Number(settings.autoSyncInterval) || 30) * 1000;
    const interval = setInterval(() => { handleSync(false); }, intervalMs);
    return () => clearInterval(interval);
  }, [auth, handleSync, settings.autoSyncInterval]);

  const authorName = auth?.user?.name || 'Менеджер';

  // Auth Handlers
  const handleLoginSuccess = (authData) => {
    setAuth(authData); // sync starts from the effect above
    showToast(`✓ Добро пожаловать, ${authData.user.name.split(' ')[0]}!`);
  };

  const handleLogout = () => {
    if (window.confirm('Выйти из аккаунта менеджера?')) {
      clearStoredAuth();
      setAuth(null);
      showToast('Вы вышли из системы');
    }
  };

  // Create new deal (saved locally first, then pushed; no stale `deals` closure)
  const handleCreateDeal = async (newDeal) => {
    const res = createLocalDeal({
      ...newDeal,
      createdBy: authorName,
      notes: (newDeal.notes || []).map(n => ({ ...n, author: n.author && n.author !== 'Менеджер' ? n.author : authorName }))
    });
    applyList(res.list);
    if (!res.ok) {
      showToast(`⚠ ${res.error}`);
      return;
    }
    showToast(`⏳ Сохранение заявки #${newDeal.leadNum}...`);
    const s = await runSync();
    const rec = (s.deals || []).find(d => String(d.id) === String(res.record.id));
    if (s.success && rec && !rec._dirty) {
      showToast(`⚡ Заявка #${newDeal.leadNum} сохранена в базе данных`);
    } else {
      showToast(`✓ Заявка #${newDeal.leadNum} сохранена на телефоне — отправится при появлении связи`);
    }
  };

  // Update deal status
  const handleUpdateStatus = (dealId, newStatus) => {
    const res = updateLocalDeal(dealId, d => ({
      ...d,
      status: newStatus,
      notes: [makeNote(`Статус изменен на «${newStatus}»`, authorName), ...(d.notes || [])]
    }));
    applyList(res.list);
    showToast(res.ok ? `Статус обновлён: ${newStatus}` : `⚠ ${res.error}`);
    if (res.ok) scheduleSync();
  };

  // Add note to deal
  const handleAddNote = (dealId, noteText) => {
    const res = updateLocalDeal(dealId, d => ({
      ...d,
      notes: [makeNote(noteText, authorName), ...(d.notes || [])]
    }));
    applyList(res.list);
    showToast(res.ok ? 'Заметка сохранена' : `⚠ ${res.error}`);
    if (res.ok) scheduleSync();
  };

  // Delete deal (tombstone + offline DELETE queue → never resurrected)
  const handleDeleteDeal = (dealId) => {
    const res = deleteLocalDeal(dealId);
    applyList(res.list);
    setSelectedDeal(null);
    showToast('Сделка удалена');
    scheduleSync();
  };

  // Offline demo data (fictional, never synchronized; replaced by real data on the next successful sync)
  const handleResetDemo = () => {
    applyList(loadDemoDeals());
    showToast('Показаны демо-данные (только офлайн, не синхронизируются)');
  };

  // Save settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToast('Настройки сохранены');
    if (auth) handleSync(true);
  };

  // If user is not logged in, render the LoginScreen!
  if (!auth) {
    return (
      <LoginScreen 
        serverUrl={settings.serverUrl}
        onUpdateServerUrl={(newUrl) => handleSaveSettings({ ...settings, serverUrl: newUrl })}
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  const newLeadsCount = deals.filter(d => d.status === 'Новые').length;
  const TITLES = { dashboard: 'Сводка', kanban: 'Воронка продаж', calendar: 'Календарь', clients: 'Клиенты' };
  const modalOpen = !!selectedDeal || showNewLeadModal || showVoiceModal || showSettingsModal;

  return (
    <div className="qz-app">
      <HeaderBar
        title={TITLES[activeTab] || 'QazGost CRM'}
        currentUser={auth?.user}
        onOpenSettings={() => setShowSettingsModal(true)}
        isOnline={isOnline}
        onSync={() => handleSync(true)}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={activeTab === 'kanban' || activeTab === 'clients'}
      />

      <SyncBanner pending={pendingCount} error={syncError} onRetry={() => handleSync(true)} />

      <main className="qz-main has-fab">
        {activeTab === 'dashboard' && (
          <DashboardView
            deals={deals}
            onSelectDeal={setSelectedDeal}
            onOpenNewLead={() => setShowNewLeadModal(true)}
            onOpenTab={setActiveTab}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanView
            deals={deals}
            onSelectDeal={setSelectedDeal}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            deals={deals}
            onSelectDeal={setSelectedDeal}
            onOpenNewLead={() => setShowNewLeadModal(true)}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            deals={deals}
            onSelectDeal={setSelectedDeal}
            searchQuery={searchQuery}
          />
        )}
      </main>

      <Toast message={toastMessage} withFab={!modalOpen} />

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        onOpenNewLead={() => setShowNewLeadModal(true)}
        showFab={!modalOpen}
        unreadCount={newLeadsCount}
      />

      {/* Modals & Sheets */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddNote={handleAddNote}
          onDeleteDeal={handleDeleteDeal}
        />
      )}

      {(showNewLeadModal || showVoiceModal) && (
        <LeadCreateModal
          onClose={() => {
            setShowNewLeadModal(false);
            setShowVoiceModal(false);
          }}
          onCreateDeal={handleCreateDeal}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          currentUser={auth?.user}
          onLogout={handleLogout}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          onResetDemoData={handleResetDemo}
          lastSyncTime={lastSyncTime}
          syncLatency={syncLatency}
        />
      )}
    </div>
  );
}
