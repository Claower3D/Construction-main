import React, { useState, useEffect } from 'react';
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
  getSavedAuth, setSavedAuth, getStoredDeals, fetchServerDeals, 
  updateDealStatus, saveInspectionReport, updateDealSchedule, DEFAULT_ENGINEER 
} from './api/engineerApi';

export default function App() {
  const [authData, setAuthData] = useState(() => getSavedAuth());
  const [serverUrl, setServerUrl] = useState('https://construction-main-production.up.railway.app');
  const [deals, setDeals] = useState(() => getStoredDeals());
  const [activeTab, setActiveTab] = useState('inspections'); // 'inspections' | 'calendar' | 'defects' | 'estimates' | 'marketplace' | 'tools'
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial live server sync
  useEffect(() => {
    if (authData) {
      handleSync();
    }
  }, [authData]);

  const handleSync = async () => {
    setIsSyncing(true);
    const res = await fetchServerDeals(serverUrl);
    setIsOnline(res.success);
    if (res.deals) {
      setDeals(res.deals);
    }
    setIsSyncing(false);
  };

  const handleUpdateStatus = async (dealId, newStatus, note) => {
    const updated = await updateDealStatus(serverUrl, dealId, newStatus, note, authData?.name || 'Инженер ПТО');
    setDeals([...updated]);
    if (selectedDeal && selectedDeal.id === dealId) {
      setSelectedDeal({ ...selectedDeal, status: newStatus });
    }
  };

  const handleSaveInspection = async (dealId, inspectionData) => {
    const updated = await saveInspectionReport(serverUrl, dealId, inspectionData, authData?.name || 'Инженер ПТО');
    setDeals([...updated]);
  };

  const handleScheduleVisit = async (dealId, newDate, newTime) => {
    const updated = await updateDealSchedule(serverUrl, dealId, newDate, newTime, authData?.name || 'Инженер ПТО');
    setDeals([...updated]);
  };

  const handleLogout = () => {
    setSavedAuth(null);
    setAuthData(null);
    setShowSettings(false);
  };

  const handleResetCache = async () => {
    localStorage.removeItem('qazgost_engineer_deals_perm');
    await handleSync();
  };

  const handleAddProductToEstimate = (product) => {
    alert(`Товар «${product.title}» (${product.price} ₸) добавлен в материалы сметы!`);
  };

  if (!authData) {
    return (
      <LoginScreen
        serverUrl={serverUrl}
        onUpdateServerUrl={setServerUrl}
        onLoginSuccess={(auth) => {
          setAuthData(auth);
        }}
      />
    );
  }

  const activeCount = deals.filter(d => d.status === 'Новые' || d.status === 'Выезд назначен' || d.status === 'На объекте').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = deals.filter(d => (d.date === todayStr || (!d.date && d.status === 'Выезд назначен')) && d.status !== 'Завершено').length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <HeaderBar
        engineer={authData}
        isOnline={isOnline}
        onRefresh={handleSync}
        isSyncing={isSyncing}
        onOpenSettings={() => setShowSettings(true)}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content View */}
      <div className="app-content">
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
            onAttachToDeal={(defectReport) => {
              alert('Акт дефектовки прикреплен к выбранному объекту');
            }}
          />
        )}

        {activeTab === 'estimates' && (
          <PhotoEstimateView
            onAttachToDeal={(estimate) => {
              alert('Смета прикреплена к объекту');
            }}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceView
            onAddToEstimate={handleAddProductToEstimate}
          />
        )}

        {activeTab === 'tools' && (
          <EngineeringCalcView />
        )}
      </div>

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
          onUpdateServerUrl={setServerUrl}
          onLogout={handleLogout}
          onClose={() => setShowSettings(false)}
          onResetCache={handleResetCache}
        />
      )}
    </div>
  );
}
