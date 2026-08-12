import React, { useState, useEffect } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
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

export default function App() {
  const [role, setRole] = useState('executor');
  const [theme, setTheme] = useState('dark');
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize view from URL path (e.g. /admin, /customer, etc.)
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/engineer')) return 'engineer';
    if (path.startsWith('/customer')) return 'customer';
    if (path.startsWith('/executor')) return 'executor';
    if (path.startsWith('/crm')) return 'crm';
    if (path.startsWith('/manager')) return 'manager';
    return 'landing';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) setCurrentView('admin');
      else if (path.startsWith('/engineer')) setCurrentView('engineer');
      else if (path.startsWith('/customer')) setCurrentView('customer');
      else if (path.startsWith('/executor')) setCurrentView('executor');
      else if (path.startsWith('/crm')) setCurrentView('crm');
      else if (path.startsWith('/manager')) setCurrentView('manager');
      else setCurrentView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  // --- ROLE ACCESS GUARD ---
  const isDashboardAllowed = (view) => {
    if (!currentUser) return false;
    if (view === 'crm' || view === 'manager') return currentUser.role === 'manager';
    return currentUser.role === view;
  };

  useEffect(() => {
    const protectedViews = ['admin', 'engineer', 'customer', 'executor', 'crm', 'manager'];
    const path = window.location.pathname.substring(1).split('/')[0];
    const viewToCheck = protectedViews.includes(currentView) ? currentView : (protectedViews.includes(path) ? path : null);

    if (viewToCheck && !isDashboardAllowed(viewToCheck)) {
      navigateToLanding();
    }
  }, [currentView, currentUser]);

  // Full-Page Engineer Cabinet View (Renders at /engineer or when Engineer button clicked)
  if (currentView === 'engineer' || window.location.pathname.startsWith('/engineer')) {
    return isDashboardAllowed('engineer') ? <EngineerDashboardPage onBackToHome={navigateToLanding} /> : null;
  }

  // Full-Page CRM View (Also accessible via Manager role)
  if (currentView === 'crm' || currentView === 'manager' || window.location.pathname.startsWith('/crm') || window.location.pathname.startsWith('/manager')) {
    return isDashboardAllowed('manager') ? <CrmPage onBackToHome={navigateToLanding} /> : null;
  }

  // Dashboard views for roles
  if (['admin', 'customer', 'executor'].includes(currentView)) {
    return isDashboardAllowed(currentView) ? <AdminDashboardPage userRole={currentView} onBackToHome={navigateToLanding} onOpenEngineer={navigateToEngineer} /> : null;
  }


  return (
    <div className="app-root">
      <AnimatedBackground />

      <Header
        role={role}
        setRole={setRole}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAuth={(mode) => setAuthMode(mode)}
        onOpenAdmin={navigateToAdmin}
        onOpenEngineer={navigateToEngineer}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDashboard={() => navigateToDashboard(currentUser?.role || role)}
      />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection role={role} />
        <FeatureHighlights />
        <PriceCatalogSection />
        <PlatformServicesSection />
        <EngineeringServicesSection />
        <StatsBanner />
        <HowItWorksSection />
        <TestimonialsSection />
        <MobileAppBanner />
        <FaqSection />
      </main>

      <FooterSection />


      <AiAssistantWidget />
      <VoiceControlWidget />
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onLogin={handleLogin} />
    </div>
  );
}



