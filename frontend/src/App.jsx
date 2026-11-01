import React, { useState, useEffect, lazy, Suspense } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import EstimateExamples from './components/EstimateExamples';
import AudienceSection from './components/AudienceSection';
import FeatureHighlights from './components/FeatureHighlights';
import PriceCatalogSection from './components/PriceCatalogSection';
import PlatformServicesSection from './components/PlatformServicesSection';
import EngineeringServicesSection from './components/EngineeringServicesSection';
import HowItWorksSection from './components/HowItWorksSection';
import MobileAppBanner from './components/MobileAppBanner';
import FaqSection from './components/FaqSection';
import FooterSection from './components/FooterSection';
import AiAssistantWidget from './components/AiAssistantWidget';
import AuthModal from './components/AuthModal';
import VoiceControlWidget from './components/VoiceControlWidget';
import ScrollToTopButton from './components/ScrollToTopButton';
import PageLoader from './components/PageLoader';
import { categoriesData } from './data/categoriesData';

// Тяжёлые разделы грузятся отдельными чанками только при переходе в них
// (раньше всё приложение, включая three.js и xlsx, приходило одним JS-файлом ~2,3 МБ).
const AdminDashboardPage = lazy(() => import('./components/AdminDashboardPage'));
const CategoryTemplatePage = lazy(() => import('./components/CategoryTemplatePage'));
const ProfileQuestionnaire = lazy(() => import('./components/ProfileQuestionnaire'));
const UserWalletPage = lazy(() => import('./components/UserWalletPage'));
const ContractorsCatalogPage = lazy(() => import('./components/ContractorsCatalogPage'));
const UserOrdersPage = lazy(() => import('./components/UserOrdersPage'));
const EngineeringSolutionsPage = lazy(() => import('./components/EngineeringSolutionsPage'));
const MaterialsMarketplacePage = lazy(() => import('./components/MaterialsMarketplacePage'));
const EquipmentMarketplace = lazy(() => import('./components/EquipmentMarketplace'));
const EngineeringCalcPage = lazy(() => import('./components/EngineeringCalcPage'));
const LiDARScanPage = lazy(() => import('./components/LiDARScanPage'));

const DASHBOARD_VIEWS = ['admin', 'customer', 'executor', 'company', 'engineer', 'crm', 'manager'];
// Панели с ограничением по роли (UI-guard; реальная защита данных — на сервере)
const ROLE_RESTRICTED_VIEWS = {
  admin: ['admin'],
  crm: ['manager', 'admin'],
  manager: ['manager', 'admin'],
  company: ['company', 'admin'],
};

function canOpenDashboard(view, user) {
  if (!user) return false;
  const allowed = ROLE_RESTRICTED_VIEWS[view];
  return !allowed || allowed.includes(user.role);
}

export default function App() {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('app_role') || 'executor';
  });
  const [theme, setTheme] = useState('dark');
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      // Повреждённое значение больше не роняет приложение (белый экран)
      localStorage.removeItem('app_currentUser');
      return null;
    }
  });
  const [syncNotice, setSyncNotice] = useState(null);

  // Ошибки серверной синхронизации (заказы/CRM) показываются пользователю, а не глотаются
  useEffect(() => {
    let timer = null;
    const onSyncError = (e) => {
      setSyncNotice(e.detail?.message || 'Ошибка синхронизации с сервером');
      clearTimeout(timer);
      timer = setTimeout(() => setSyncNotice(null), 8000);
    };
    window.addEventListener('qazgost_sync_error', onSyncError);
    return () => { window.removeEventListener('qazgost_sync_error', onSyncError); clearTimeout(timer); };
  }, []);
  const [currentCategory, setCurrentCategory] = useState(null);

  // CTA лендинга открывают окно входа через событие (utils/navigate.js → openAuth)
  useEffect(() => {
    const onOpenAuth = (e) => setAuthMode(e.detail?.mode === 'register' ? 'register' : 'login');
    window.addEventListener('qazgost_open_auth', onOpenAuth);
    return () => window.removeEventListener('qazgost_open_auth', onOpenAuth);
  }, []);

  // Initialize view from URL path (e.g. /admin, /customer, etc.)
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/engineer')) return 'engineer';
    if (path.startsWith('/customer')) return 'customer';
    if (path.startsWith('/executor')) return 'executor';
    if (path.startsWith('/company')) return 'company';
    if (path.startsWith('/crm')) return 'crm';
    if (path.startsWith('/manager')) return 'manager';
    if (path.startsWith('/category')) return 'category';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/wallet')) return 'wallet';
    if (path.startsWith('/catalog')) return 'catalog';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/engineering')) return 'engineering';
    if (path.startsWith('/calc')) return 'calc';
    if (path.startsWith('/lidar')) return 'lidar';
    if (path.startsWith('/materials')) return 'materials';
    if (path.startsWith('/equipment')) return 'equipment';
    return 'landing';
  });

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/category/')) {
      const slug = path.split('/')[2];
      const foundCat = categoriesData.find((c) => c.slug === slug);
      if (foundCat) setCurrentCategory(foundCat);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) setCurrentView('admin');
      else if (path.startsWith('/engineer')) setCurrentView('engineer');
      else if (path.startsWith('/customer')) setCurrentView('customer');
      else if (path.startsWith('/executor')) setCurrentView('executor');
      else if (path.startsWith('/company')) setCurrentView('company');
      else if (path.startsWith('/crm')) setCurrentView('crm');
      else if (path.startsWith('/manager')) setCurrentView('manager');
      else if (path.startsWith('/category')) {
        const slug = path.split('/')[2];
        const foundCat = categoriesData.find((c) => c.slug === slug);
        if (foundCat) setCurrentCategory(foundCat);
        setCurrentView('category');
      }
      else if (path.startsWith('/profile')) setCurrentView('profile');
      else if (path.startsWith('/wallet')) setCurrentView('wallet');
      else if (path.startsWith('/catalog')) setCurrentView('catalog');
      else if (path.startsWith('/orders')) setCurrentView('orders');
      else if (path.startsWith('/engineering')) setCurrentView('engineering');
      else if (path.startsWith('/calc')) setCurrentView('calc');
      else if (path.startsWith('/lidar')) setCurrentView('lidar');
      else if (path.startsWith('/materials')) setCurrentView('materials');
      else if (path.startsWith('/equipment')) setCurrentView('equipment');
      else setCurrentView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save auth state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_currentUser', JSON.stringify(currentUser));
      localStorage.setItem('app_role', role);
    } else {
      localStorage.removeItem('app_currentUser');
      localStorage.removeItem('app_role');
    }
  }, [currentUser, role]);



  const navigateToDashboard = (targetRole) => {
    window.history.pushState({}, '', `/${targetRole}`);
    setCurrentView(targetRole);
    setRole(targetRole);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setRole(user.role);
    setAuthMode(null);
    navigateToDashboard(user.role);
  };

  const handleLogout = () => {
    // Чистим сессию полностью: токен, профиль, личный ключ OpenAI (раньше оставались после выхода)
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('qazgost_current_user');
      localStorage.removeItem('qazgost_user_openai_key');
      localStorage.removeItem('qazgost_user_openai_account');
    } catch (e) { /* ignore */ }
    setCurrentUser(null);
    setRole('executor');
    navigateToLanding();
  };

  // Guard дашбордов: без входа — на лендинг + окно входа; панель чужой роли — на свою панель
  const dashboardBlocked = DASHBOARD_VIEWS.includes(currentView) && !canOpenDashboard(currentView, currentUser);
  useEffect(() => {
    if (!dashboardBlocked) return;
    if (!currentUser) {
      window.history.replaceState({}, '', '/');
      setCurrentView('landing');
      setAuthMode('login');
    } else {
      const own = DASHBOARD_VIEWS.includes(currentUser.role) ? currentUser.role : 'customer';
      window.history.replaceState({}, '', `/${own}`);
      setCurrentView(own);
    }
  }, [dashboardBlocked, currentUser]);

  const navigateToAdmin = () => navigateToDashboard('admin');
  const navigateToEngineer = () => navigateToDashboard('engineer');
  
  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('landing');
  };

  const handleLogoClick = (e) => {
    if (e) e.preventDefault();
    navigateToLanding();
  };

  const navigateToCategory = (cat) => {
    setCurrentCategory(cat);
    window.history.pushState({}, '', `/category/${cat.slug}`);
    setCurrentView('category');
  };

  const navigateToProfile = () => {
    window.history.pushState({}, '', `/profile`);
    setCurrentView('profile');
  };

  const navigateToWallet = () => {
    window.history.pushState({}, '', `/wallet`);
    setCurrentView('wallet');
  };

  const navigateToCatalog = () => {
    window.history.pushState({}, '', `/catalog`);
    setCurrentView('catalog');
  };

  const navigateToMaterials = () => {
    window.history.pushState({}, '', `/materials`);
    setCurrentView('materials');
  };

  const navigateToEquipment = () => {
    window.history.pushState({}, '', `/equipment`);
    setCurrentView('equipment');
  };

  const navigateToCalc = () => {
    window.history.pushState({}, '', `/calc`);
    setCurrentView('calc');
  };

  const navigateToLidar = () => {
    window.history.pushState({}, '', `/lidar`);
    setCurrentView('lidar');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  // --- ROLE ACCESS & DASHBOARD ROUTING --- (см. canOpenDashboard / dashboardBlocked выше)

  // Unified Dashboard view for all roles (Customer, Executor, Engineer, Company, Manager/CRM, Admin)
  const syncBanner = syncNotice && (
    <div
      role="alert"
      data-testid="sync-error-banner"
      onClick={() => setSyncNotice(null)}
      style={{ position: 'fixed', left: '16px', bottom: '16px', zIndex: 10000, maxWidth: '420px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(120, 53, 15, 0.95)', border: '1px solid #f59e0b', color: '#fde68a', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', cursor: 'pointer' }}
    >
      ⚠️ {syncNotice}
    </div>
  );

  if (DASHBOARD_VIEWS.includes(currentView) && !dashboardBlocked) {
    const roleForPage = currentView === 'crm' ? 'manager' : currentView;
    return (
      <>
        <Suspense fallback={<PageLoader label="Открываем рабочий кабинет…" />}>
          <AdminDashboardPage 
            userRole={roleForPage} 
            onBackToHome={navigateToLanding} 
            onOpenEngineer={navigateToEngineer} 
            currentUser={currentUser} 
          />
        </Suspense>
        {syncBanner}
      </>
    );
  }

  return (
    <div className="app-root">
      <a className="qg-skip-link" href="#main-content">Перейти к содержимому</a>
      <AnimatedBackground />

      <Header 
        role={role} 
        setRole={setRole} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenAuth={setAuthMode} 
        onOpenAdmin={navigateToAdmin}
        onOpenEngineer={navigateToEngineer}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDashboard={navigateToDashboard}
        onLogoClick={handleLogoClick}
        onOpenProfile={navigateToProfile}
        onOpenWallet={navigateToWallet}
        onOpenMaterials={navigateToMaterials}
        onOpenEquipment={navigateToEquipment}
        onOpenCalc={navigateToCalc}
        onOpenLidar={navigateToLidar}
      />

        <main id="main-content" style={{ position: 'relative', zIndex: 1 }}>
          <Suspense fallback={<PageLoader />}>
          {currentView === 'category' && currentCategory && (
            <CategoryTemplatePage 
              category={currentCategory} 
              onBackToHome={navigateToLanding}
              onNavigate={navigateToDashboard}
            />
          )}

          {currentView === 'profile' && (
            <ProfileQuestionnaire 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }} 
            />
          )}

          {currentView === 'wallet' && (
            <UserWalletPage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }} 
              currentUser={currentUser}
            />
          )}

          {currentView === 'catalog' && (
            <ContractorsCatalogPage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }} 
            />
          )}

          {currentView === 'orders' && (
            <UserOrdersPage 
              currentUser={currentUser}
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }} 
            />
          )}

          {currentView === 'engineering' && (
            <EngineeringSolutionsPage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }} 
              onOpenOrders={() => {
                window.history.pushState({}, '', `/orders`);
                setCurrentView('orders');
              }}
            />
          )}

          {currentView === 'materials' && (
            <MaterialsMarketplacePage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }}
            />
          )}

          {currentView === 'equipment' && (
            <EquipmentMarketplace 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }}
            />
          )}

          {currentView === 'calc' && (
            <EngineeringCalcPage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }}
            />
          )}

          {currentView === 'lidar' && (
            <LiDARScanPage 
              onBack={() => {
                if (currentUser) {
                  navigateToDashboard(currentUser.role);
                } else {
                  navigateToLanding();
                }
              }}
            />
          )}

          {currentView === 'landing' && (
            <>
              {/* Секции лендинга больше не «выезжают» по одной при скролле: контент виден сразу,
                  единственный акцентный момент — первый экран (см. HeroSection). */}
              <HeroSection role={role} onOpenAuth={setAuthMode} currentUser={currentUser} onOpenDashboard={navigateToDashboard} />
              <FeatureHighlights />
              <EstimateExamples />
              <HowItWorksSection />
              <PriceCatalogSection onOpenCategory={navigateToCategory} />
              <AudienceSection />
              <PlatformServicesSection />
              <EngineeringServicesSection />
              <MobileAppBanner />
              <FaqSection />
            </>
          )}
          </Suspense>
        </main>

      <FooterSection />


      <AiAssistantWidget />
      <VoiceControlWidget />
      <ScrollToTopButton />

      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onLogin={handleLogin} />
      {syncBanner}
    </div>
  );
}
