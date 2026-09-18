import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderBar from './components/HeaderBar';
import BottomNav from './components/BottomNav';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import CalendarView from './components/CalendarView';
import ClientsView from './components/ClientsView';
import DealDetailModal from './components/DealDetailModal';
import LeadCreateModal from './components/LeadCreateModal';
import VoiceLeadInput from './components/VoiceLeadInput';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import { 
  getStoredDeals, 
  saveStoredDeals, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredAuth,
  saveStoredAuth,
  clearStoredAuth,
  createDealOnServer,
  updateDealOnServer,
  deleteDealOnServer,
  twoWaySyncWithRailway
} from './api/crmApi';

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [deals, setDeals] = useState([]);
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
  const dealsRef = useRef(deals);
  dealsRef.current = deals;

  // Show temporary toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Save deals on change
  const updateDeals = useCallback((newDeals) => {
    setDeals(newDeals);
    saveStoredDeals(newDeals);
  }, []);

  // Two-Way Sync Handler with Railway
  const handleSync = useCallback(async (notify = true) => {
    setIsSyncing(true);
    const res = await twoWaySyncWithRailway(settings.serverUrl, dealsRef.current);
    setIsSyncing(false);

    if (res.success) {
      setIsOnline(true);
      setSyncLatency(res.latencyMs);
      setLastSyncTime(res.lastSyncTime);
      if (res.mergedDeals && res.mergedDeals.length > 0) {
        updateDeals(res.mergedDeals);
      }
      if (notify) {
        showToast(`✓ Railway синхронизирован (${res.latencyMs} мс, ${res.mergedDeals.length} сделок)`);
      }
    } else {
      setIsOnline(false);
      setSyncLatency(null);
      if (notify) {
        showToast('Офлайн-режим. Данные сохранены локально на телефоне');
      }
    }
  }, [settings.serverUrl, updateDeals, showToast]);

  // Initial load
  useEffect(() => {
    const loadedDeals = getStoredDeals();
    setDeals(loadedDeals);

    // Initial sync
    handleSync(false);

    // Auto-sync heartbeat every 30 seconds
    const interval = setInterval(() => {
      handleSync(false);
    }, (settings.autoSyncInterval || 30) * 1000);

    return () => clearInterval(interval);
  }, [handleSync, settings.autoSyncInterval]);

  // Auth Handlers
  const handleLoginSuccess = (authData) => {
    setAuth(authData);
    showToast(`✓ Добро пожаловать, ${authData.user.name.split(' ')[0]}!`);
    handleSync(true);
  };

  const handleLogout = () => {
    if (window.confirm('Выйти из аккаунта менеджера?')) {
      clearStoredAuth();
      setAuth(null);
      showToast('Вы вышли из системы');
    }
  };

  // Create new deal
  const handleCreateDeal = async (newDeal) => {
    const withTimestamp = {
      ...newDeal,
      updated_at: new Date().toISOString()
    };
    const updated = [withTimestamp, ...deals];
    updateDeals(updated);
    showToast(`⏳ Сохранение заявки #${newDeal.leadNum}...`);

    try {
      const serverRes = await createDealOnServer(settings.serverUrl, withTimestamp, auth?.user?.name);
      if (serverRes && serverRes.success && serverRes.deal) {
        const confirmedList = updated.map(d => String(d.id) === String(withTimestamp.id) ? serverRes.deal : d);
        updateDeals(confirmedList);
        setIsOnline(true);
        showToast(`⚡ Заявка #${newDeal.leadNum} сохранена в базу данных и синхронизирована с сайтом!`);
      } else {
        showToast(`✓ Заявка #${newDeal.leadNum} сохранена локально`);
      }
    } catch (e) {
      console.warn('Create deal error:', e);
    }

    // Trigger instant background sync
    setTimeout(() => handleSync(false), 300);
  };

  // Update deal status
  const handleUpdateStatus = (dealId, newStatus) => {
    let targetDeal = null;
    const updated = deals.map(d => {
      if (String(d.id) === String(dealId)) {
        targetDeal = { 
          ...d, 
          status: newStatus,
          updated_at: new Date().toISOString(),
          notes: [
            { text: `Статус изменен на «${newStatus}»`, time: 'Только что', author: auth?.user?.name || 'Менеджер' },
            ...(d.notes || [])
          ]
        };
        return targetDeal;
      }
      return d;
    });
    updateDeals(updated);
    if (selectedDeal && String(selectedDeal.id) === String(dealId)) {
      setSelectedDeal(prev => ({ ...prev, status: newStatus }));
    }
    showToast(`Статус обновлён: ${newStatus}`);
    if (targetDeal) {
      updateDealOnServer(settings.serverUrl, targetDeal, auth?.user?.name).catch(() => {});
    }
    setTimeout(() => handleSync(false), 500);
  };

  // Add note to deal
  const handleAddNote = (dealId, noteText) => {
    let targetDeal = null;
    const updated = deals.map(d => {
      if (String(d.id) === String(dealId)) {
        const newNotes = [
          { text: noteText, time: 'Только что', author: auth?.user?.name || 'Менеджер' },
          ...(d.notes || [])
        ];
        targetDeal = { 
          ...d, 
          notes: newNotes,
          updated_at: new Date().toISOString()
        };
        return targetDeal;
      }
      return d;
    });
    updateDeals(updated);
    if (selectedDeal && String(selectedDeal.id) === String(dealId)) {
      setSelectedDeal(prev => ({ 
        ...prev, 
        notes: [{ text: noteText, time: 'Только что', author: auth?.user?.name || 'Менеджер' }, ...(prev.notes || [])]
      }));
    }
    showToast('Заметка сохранена');
    if (targetDeal) {
      updateDealOnServer(settings.serverUrl, targetDeal, auth?.user?.name).catch(() => {});
    }
    setTimeout(() => handleSync(false), 500);
  };

  // Delete deal
  const handleDeleteDeal = (dealId) => {
    const updated = deals.filter(d => String(d.id) !== String(dealId));
    updateDeals(updated);
    setSelectedDeal(null);
    showToast('Сделка удалена');
    deleteDealOnServer(settings.serverUrl, dealId).catch(() => {});
    setTimeout(() => handleSync(false), 500);
  };

  // Reset demo
  const handleResetDemo = () => {
    localStorage.removeItem('qazgost_manager_crm_deals_v1');
    const fresh = getStoredDeals();
    setDeals(fresh);
    showToast('Демо-данные восстановлены');
  };

  // Save settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToast('Настройки сохранены');
    handleSync(true);
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

  return (
    <div className="app-container">
      {/* Top Header with Railway connection state */}
      <HeaderBar
        currentUser={auth?.user}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
        isOnline={isOnline}
        onSync={() => handleSync(true)}
        isSyncing={isSyncing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Body */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            deals={deals}
            onSelectDeal={setSelectedDeal}
            onOpenNewLead={() => setShowNewLeadModal(true)}
            onOpenVoice={() => setShowVoiceModal(true)}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #00e5ff',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 800,
          zIndex: 200,
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        onOpenNewLead={() => setShowNewLeadModal(true)}
        onOpenVoiceLead={() => setShowVoiceModal(true)}
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
