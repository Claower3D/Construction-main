import React, { useState, useEffect } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import LiveAIScannerDemo from './components/LiveAIScannerDemo';
import FeatureHighlights from './components/FeatureHighlights';
import PriceCatalogSection from './components/PriceCatalogSection';
import PlatformServicesSection from './components/PlatformServicesSection';
import EngineeringServicesSection from './components/EngineeringServicesSection';
import StatsBanner from './components/StatsBanner';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import MobileAppBanner from './components/MobileAppBanner';
import FaqSection from './components/FaqSection';
import FooterSection from './components/FooterSection';
import AiAssistantWidget from './components/AiAssistantWidget';
import AuthModal from './components/AuthModal';
import AdminDashboardPage from './components/AdminDashboardPage';
import EngineerDashboardPage from './components/EngineerDashboardPage';
import VoiceControlWidget from './components/VoiceControlWidget';
import CrmPage from './components/CrmPage';
import CategoryTemplatePage from './components/CategoryTemplatePage';
import ProfileQuestionnaire from './components/ProfileQuestionnaire';
import UserWalletPage from './components/UserWalletPage';
import ContractorsCatalogPage from './components/ContractorsCatalogPage';
import UserOrdersPage from './components/UserOrdersPage';
import EngineeringSolutionsPage from './components/EngineeringSolutionsPage';
import MaterialsMarketplacePage from './components/MaterialsMarketplacePage';
import EquipmentMarketplace from './components/EquipmentMarketplace';
import ScrollToTopButton from './components/ScrollToTopButton';
import { categoriesData } from './data/categoriesData';

export default function App() {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('app_role') || 'executor';
  });
  const [theme, setTheme] = useState('dark');
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentCategory, setCurrentCategory] = useState(null);

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
    setCurrentUser(null);
    setRole('executor');
    navigateToLanding();
  };

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

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  // --- ROLE ACCESS & DASHBOARD ROUTING ---
  const isDashboardAllowed = (view) => {
    // Allow demo/guest exploration of dashboards, or match user role if logged in
    return true;
  };

  // Unified Dashboard view for all roles (Customer, Executor, Engineer, Company, Manager/CRM, Admin)
  if (['admin', 'customer', 'executor', 'company', 'engineer', 'crm', 'manager'].includes(currentView)) {
    const roleForPage = currentView === 'crm' ? 'manager' : currentView;
    return (
      <AdminDashboardPage 
        userRole={roleForPage} 
        onBackToHome={navigateToLanding} 
        onOpenEngineer={navigateToEngineer} 
        currentUser={currentUser} 
      />
    );
  }

  return (
    <div className="app-root">
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
      />

        <main style={{ position: 'relative', zIndex: 1 }}>
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

          {currentView === 'landing' && (
            <>
              <HeroSection role={role} />
              <LiveAIScannerDemo />
              <FeatureHighlights />
              <PriceCatalogSection onOpenCategory={navigateToCategory} />
              <PlatformServicesSection />
              <EngineeringServicesSection />
              <StatsBanner />
              <HowItWorksSection />
              <TestimonialsSection />
              <MobileAppBanner />
              <FaqSection />
            </>
          )}
        </main>

      <FooterSection />


      <AiAssistantWidget />
      <VoiceControlWidget />
      <ScrollToTopButton />

      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onLogin={handleLogin} />
    </div>
  );
}
