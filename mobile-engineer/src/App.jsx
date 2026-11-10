import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HeaderBar from './components/HeaderBar';
import BottomNav from './components/BottomNav';
import InspectionListView from './components/InspectionListView';
import EngineerCalendarView from './components/EngineerCalendarView';
import EngineeringCalcView from './components/EngineeringCalcView';
import MarketplaceView from './components/MarketplaceView';
import DefectInspectionView from './components/DefectInspectionView';
import PhotoEstimateView from './components/PhotoEstimateView';
import ObjectInspectionModal from './components/ObjectInspectionModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import {
  getSavedAuth, setSavedAuth, getStoredDeals, syncDeals, pendingSyncCount, loadDemoDeals, resetCachedDeals,
  updateDealStatus, saveInspectionReport, updateDealSchedule, attachDefectReport, attachEstimate,
  getSavedServerUrl, setSavedServerUrl, dealsStore, getAuthHeaders
} from './api/engineerApi';
import { FALLBACK_MATERIALS, FALLBACK_EQUIPMENT } from './data/marketFallback';
import { localDateISO } from './api/syncCore';
import { Toast, SyncBanner } from './components/ui/kit';

// Ошибки браузера («Failed to fetch») показываем по-русски
const humanSyncError = (msg) => (/failed to fetch|networkerror|load failed|network request failed/i.test(String(msg || '')) ? 'Нет связи с сервером, данные сохранены на телефоне' : msg);

const TITLES = { inspections: 'Объекты', calendar: 'Календарь выездов', defects: 'Дефекты по фото', estimates: 'Смета по фото', marketplace: 'Маркет', tools: 'Расчёты и СНиП' };

const HEARTBEAT_MS = 60000;

export default function App() {
  const [authData, setAuthData] = useState(() => getSavedAuth());
  const [serverUrl, setServerUrl] = useState(() => getSavedServerUrl());
  const [deals, setDeals] = useState(() => getStoredDeals());
  const [activeTab, setActiveTab] = useState('inspections'); // 'inspections' | 'calendar' | 'defects' | 'estimates' | 'marketplace' | 'tools'
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(() => pendingSyncCount());
  const [syncError, setSyncError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);

  const authorName = authData?.name || 'Инженер ПТО';
  // stable reference: the marketplace refetches only when the session changes
  const marketHeaders = useMemo(() => getAuthHeaders(), [authData]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const applyDeals = useCallback((list) => {
    setDeals(list);
    setPendingCount(pendingSyncCount(list));
    setSelectedDeal(prev => (prev ? (list.find(d => String(d.id) === String(prev.id)) || prev) : prev));
  }, []);

  const runSync = useCallback(async () => {
    setIsSyncing(true);
    const res = await syncDeals();
    setIsSyncing(false);
    setIsOnline(!!res.success);
    if (res.success) {
      setSyncError(res.errors && res.errors.length ? humanSyncError(res.errors[0]) : null);
      applyDeals(res.deals);
    } else {
      setSyncError(humanSyncError(res.error));
      applyDeals(dealsStore.isInitialized() ? res.deals : loadDemoDeals());
    }
    return res;
  }, [applyDeals]);

  const handleSync = useCallback(async (notify = false) => {
    const res = await runSync();
    if (notify) {
      if (!res.success) showToast(`Офлайн (${res.error}). Изменения сохранены на телефоне`);
      else if (res.errors && res.errors.length) showToast(`⚠ Не всё синхронизировано: ${res.errors[0]}`);
      else showToast('✓ Синхронизировано с сервером');
    }
    return res;
  }, [runSync, showToast]);

  // Initial sync + heartbeat (only when logged in)
  useEffect(() => {
    if (!authData) return undefined;
    handleSync(false);
    const t = setInterval(() => handleSync(false), HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [authData, serverUrl, handleSync]);

  // Save locally, then push; returns whether the change really reached the server
  const commitAndSync = useCallback(async (res, okMsg) => {
    applyDeals(res.list);
    if (!res.ok) {
      showToast(`⚠ ${res.error}`);
      return { ok: false, synced: false, error: res.error };
    }
    const s = await runSync();
    const rec = (s.deals || []).find(d => String(d.id) === String(res.record?.id));
    const synced = !!(s.success && rec && !rec._dirty);
    const error = synced ? null : (s.error || (s.errors && s.errors[0]) || 'нет связи с сервером');
    if (okMsg) {
      showToast(synced ? `✓ ${okMsg} — отправлено на сервер` : `⚠ ${okMsg} — сохранено на телефоне, НЕ отправлено (${error})`);
    }
    return { ok: true, synced, error };
  }, [applyDeals, runSync, showToast]);

  const handleUpdateStatus = (dealId, newStatus, note) =>
    commitAndSync(updateDealStatus(dealId, newStatus, note, authorName), `Статус «${newStatus}»`);

  const handleSaveInspection = (dealId, inspectionData, opts) =>
    commitAndSync(saveInspectionReport(dealId, inspectionData, authorName, opts), 'Замеры сохранены');

  const handleScheduleVisit = (dealId, newDate, newTime) =>
    commitAndSync(updateDealSchedule(dealId, newDate, newTime, authorName), `Выезд на ${newDate} ${newTime}`);

  const handleAttachDefect = (dealId, report) =>
    commitAndSync(attachDefectReport(dealId, report, authorName), null);

  const handleAttachEstimate = (dealId, estimate) =>
    commitAndSync(attachEstimate(dealId, estimate, authorName), null);

  const handleUpdateServerUrl = (url) => {
    setSavedServerUrl(url);
    setServerUrl(getSavedServerUrl());
  };

  const handleLogout = () => {
    setSavedAuth(null);
    setAuthData(null);
    setShowSettings(false);
  };

  const handleResetCache = async () => {
    applyDeals(resetCachedDeals());
    await handleSync(true);
  };

  const handleAddProductToEstimate = (product) => {
    showToast(`«${product.name}» (${Math.round(product.price).toLocaleString('ru-RU')} ₸ / ${product.unit}) добавлен в список материалов`);
  };

  if (!authData) {
    return (
      <LoginScreen
        serverUrl={serverUrl}
        onUpdateServerUrl={handleUpdateServerUrl}
        onLoginSuccess={(auth) => {
          setAuthData(auth);
        }}
      />
    );
  }

  const activeCount = deals.filter(d => d.status === 'Новые' || d.status === 'Выезд назначен' || d.status === 'На объекте').length;
  const todayStr = localDateISO();
  const todayCount = deals.filter(d => (d.date === todayStr || (!d.date && d.status === 'Выезд назначен')) && d.status !== 'Завершено').length;

  return (
    <div className="qz-app">
      <HeaderBar
        title={TITLES[activeTab] || 'QazGost Engineer'}
        showSearch={activeTab === 'inspections'}
        engineer={authData}
        isOnline={isOnline}
        onRefresh={() => handleSync(true)}
        isSyncing={isSyncing}
        onOpenSettings={() => setShowSettings(true)}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <SyncBanner pending={pendingCount} error={syncError} onRetry={() => handleSync(true)} />

      {/* Main Content View */}
      <main className="qz-main">
        {activeTab === 'inspections' && (
          <InspectionListView
            deals={deals}
            onSelectDeal={(deal) => setSelectedDeal(deal)}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'calendar' && (
          <EngineerCalendarView
            deals={deals}
            onSelectDeal={(deal) => setSelectedDeal(deal)}
            onScheduleVisit={handleScheduleVisit}
          />
        )}

        {activeTab === 'defects' && (
          <DefectInspectionView
            deals={deals}
            onAttachToDeal={handleAttachDefect}
          />
        )}

        {activeTab === 'estimates' && (
          <PhotoEstimateView
            deals={deals}
            onAttachToDeal={handleAttachEstimate}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceView
            serverUrl={serverUrl}
            authHeaders={marketHeaders}
            addLabel="В смету"
            fallbackMaterials={FALLBACK_MATERIALS}
            fallbackEquipment={FALLBACK_EQUIPMENT}
            onAddItem={handleAddProductToEstimate}
          />
        )}

        {activeTab === 'tools' && (
          <EngineeringCalcView />
        )}
      </main>

      {/* Bottom Nav Bar with 6 core tabs */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        activeCount={activeCount}
        todayCount={todayCount}
      />

      {/* Inspection Modal */}
      {selectedDeal && (
        <ObjectInspectionModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdateStatus={handleUpdateStatus}
          onSaveInspection={handleSaveInspection}
        />
      )}

      {/* Settings Modal (from header) */}
      {showSettings && (
        <SettingsModal
          engineer={authData}
          serverUrl={serverUrl}
          onUpdateServerUrl={handleUpdateServerUrl}
          onLogout={handleLogout}
          onClose={() => setShowSettings(false)}
          onResetCache={handleResetCache}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
