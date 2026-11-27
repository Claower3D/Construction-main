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
import VoiceControlWidget from './components/VoiceControlWidget';
import ScrollToTopButton from './components/ScrollToTopButton';
import PageLoader from './components/PageLoader';
import { categoriesData } from './data/categoriesData';
import { LEGAL_PATHS } from './data/legal';
import { getAuthToken, jwtExpiry } from './services/platformUtils';
import { toUiUser } from './services/roleAccess';

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
const LegalPage = lazy(() => import('./components/LegalPage'));
const RegisterPage = lazy(() => import('./components/RegisterPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
import { canAskSibling, askSibling, ssoAfterLogin, ssoAfterLogout } from './utils/sso';
const ChangePasswordPage = lazy(() => import('./components/ChangePasswordPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

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
  if (!allowed || allowed.includes(user.role)) return true;
  // наблюдатель: панель администратора открыта на просмотр; CRM менеджера для него закрыта
  return view === 'admin' && user.observer === true;
}

// Вид по первому сегменту адреса. Раньше сравнивали по началу строки, и «/engineering»
// открывал кабинет инженера («/engineer…»). Вложенные адреса кабинета («/executor/calendar»)
// остаются видом кабинета — инструмент внутри выбирает AdminDashboardPage.
const VIEW_BY_SEGMENT = {
  admin: 'admin', engineer: 'engineer', customer: 'customer', executor: 'executor', company: 'company',
  crm: 'crm', manager: 'manager', category: 'category', profile: 'profile', wallet: 'wallet',
  catalog: 'catalog', orders: 'orders', engineering: 'engineering', calc: 'calc', lidar: 'lidar',
  materials: 'materials', equipment: 'equipment', register: 'register', login: 'login', password: 'password',
};
function viewFromPath(path) {
  if (LEGAL_PATHS[path.replace(/\/+$/, '')]) return 'legal';
  const seg = (path.split('/')[1] || '').toLowerCase();
  if (!seg || seg === 'index.html') return 'landing';
  const view = VIEW_BY_SEGMENT[seg];
  // Неизвестный адрес — честная страница «не найдено», а не главная под чужим адресом
  if (!view) return 'notfound';
  // Раздел каталога, которого нет: раньше оставался пустой экран между шапкой и подвалом
  if (view === 'category' && !categoriesData.some((c) => c.slug === path.split('/')[2])) return 'notfound';
  return view;
}

export default function App() {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('app_role') || 'executor';
  });
  const [theme, setTheme] = useState('dark');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' ? toUiUser(parsed) : null;
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
    // Вход и регистрация — отдельные страницы /login и /register
    const onOpenAuth = (e) => {
      const view = e.detail?.mode === 'register' ? 'register' : 'login';
      if (window.location.pathname !== `/${view}`) window.history.pushState({}, '', `/${view}`);
      setCurrentView(view);
      window.scrollTo(0, 0);
    };
    window.addEventListener('qazgost_open_auth', onOpenAuth);
    return () => window.removeEventListener('qazgost_open_auth', onOpenAuth);
  }, []);

  // Переключение между /terms, /privacy, /consent — тот же вид 'legal', нужен повторный рендер
  const [legalTick, setLegalTick] = useState(0);

  // Initialize view from URL path (e.g. /admin, /customer, etc.)
  const [currentView, setCurrentView] = useState(() => viewFromPath(window.location.pathname));

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
      const view = viewFromPath(path);
      if (view === 'category') {
        const slug = path.split('/')[2];
        const foundCat = categoriesData.find((c) => c.slug === slug);
        if (foundCat) setCurrentCategory(foundCat);
      }
      if (view === 'legal') setLegalTick((t) => t + 1);
      setCurrentView(view);
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



  // Серверная сессия живёт 24 часа. Раньше после её истечения сайт продолжал выглядеть «вошедшим»:
  // запросы молча получали отказ, списки пустели, сохранения не проходили. Теперь срок токена
  // проверяется при открытии, при возврате на вкладку и раз в минуту; истёкшую или отозванную
  // сессию закрываем и ведём на страницу входа с объяснением.
  // Связанные аккаунты команды (без серверного токена) эта проверка не затрагивает.
  const sessionUserKey = currentUser ? (currentUser.id || currentUser.email || 'user') : null;
  useEffect(() => {
    if (!sessionUserKey) return undefined;
    let stopped = false;
    const expire = (why = '1') => {
      if (stopped) return;
      stopped = true;
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('qazgost_current_user');
        sessionStorage.setItem('qazgost_session_expired', why);
      } catch (e) { /* хранилище недоступно */ }
      setCurrentUser(null);
      setRole('executor');
      window.history.replaceState({}, '', '/login');
      setCurrentView('login');
    };
    const check = async (askServer) => {
      const token = getAuthToken();
      if (!token || stopped) return;
      const exp = jwtExpiry(token);
      if (exp && exp * 1000 <= Date.now()) { expire(); return; }
      if (!askServer) return;
      try {
        const res = await fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        // 401 — токен не принят сервером (истёк, отозван, аккаунт удалён). Сбои сети и сервера не выкидывают из кабинета.
        if (res.status === 401 && getAuthToken() === token) {
          let code = '';
          try { code = (await res.json()).code || ''; } catch (e) { /* ответ без тела */ }
          // session_revoked — у аккаунта сменили пароль или роль; вход с другого устройства сессию не закрывает
          expire(code === 'session_revoked' ? 'replaced' : '1');
        }
        // доступ на просмотр («наблюдатель») администратор может открыть или закрыть в любой момент —
        // подхватываем это без повторного входа
        if (res.ok && getAuthToken() === token) {
          let seen = null;
          try { seen = (await res.json()).user || null; } catch (e) { /* ответ без тела */ }
          if (seen && !stopped) setCurrentUser((u) => (u && !!u.observer !== !!seen.observer ? { ...u, observer: !!seen.observer } : u));
        }
      } catch (e) { /* нет связи — оставляем как есть */ }
    };
    check(true);
    // Раз в минуту и при возврате на вкладку спрашиваем сервер: так отозванная сессия (сменили пароль
    // или роль) гаснет здесь сама, а не продолжает выглядеть рабочей.
    const timer = setInterval(() => check(document.visibilityState === 'visible'), 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sessionUserKey]);

  const navigateToDashboard = (targetRole) => {
    window.history.pushState({}, '', `/${targetRole}`);
    setCurrentView(targetRole);
    setRole(targetRole);
  };

  const openAuthFlow = (mode) => {
    const view = mode === 'register' ? 'register' : 'login';
    if (window.location.pathname !== `/${view}`) window.history.pushState({}, '', `/${view}`);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const navigateToPassword = () => {
    if (window.location.pathname !== '/password') window.history.pushState({}, '', '/password');
    setCurrentView('password');
    window.scrollTo(0, 0);
  };

  const handleLogin = (rawUser) => {
    const user = toUiUser(rawUser); // инженер без CRM открывает кабинет инженера
    ssoAfterLogin(); // вошли с паролем — вход с соседнего адреса сайта снова разрешён
    setCurrentUser(user);
    setRole(user.role);
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
    ssoAfterLogout(); // человек вышел сам: с соседнего адреса сайта сюда автоматически не входим
    setCurrentUser(null);
    setRole('executor');
    navigateToLanding();
  };

  // Вход между адресами сайта (qazgost.kz ↔ qazgost.com). Страница входа один раз за вкладку спрашивает
  // соседний адрес: если человек там уже вошёл, он возвращается сюда вошедшим и пароль не вводит.
  const [ssoChecking, setSsoChecking] = useState(() => viewFromPath(window.location.pathname) === 'login' && !currentUser && canAskSibling());
  useEffect(() => {
    if (currentView !== 'login' || currentUser) { setSsoChecking(false); return undefined; }
    if (!canAskSibling()) { setSsoChecking(false); return undefined; }
    let alive = true;
    setSsoChecking(true);
    askSibling().then((leaving) => { if (alive && !leaving) setSsoChecking(false); }, () => { if (alive) setSsoChecking(false); });
    return () => { alive = false; };
  }, [currentView, currentUser]);

  // Guard дашбордов: без входа — на лендинг + окно входа; панель чужой роли — на свою панель
  const dashboardBlocked = DASHBOARD_VIEWS.includes(currentView) && !canOpenDashboard(currentView, currentUser);
  useEffect(() => {
    if (!dashboardBlocked) return;
    if (!currentUser) {
      // без входа кабинет не открыть — ведём на страницу входа
      window.history.replaceState({}, '', '/login');
      setCurrentView('login');
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
            onOpenPassword={navigateToPassword}
            currentUser={currentUser} 
          />
        </Suspense>
        {syncBanner}
      </>
    );
  }

  return (
    <div className="app-root" data-view={currentView}>
      <a className="qg-skip-link" href="#main-content">Перейти к содержимому</a>
      <AnimatedBackground />

      <Header 
        role={role} 
        setRole={setRole} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenAuth={openAuthFlow} 
        onOpenAdmin={navigateToAdmin}
        onOpenEngineer={navigateToEngineer}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenDashboard={navigateToDashboard}
        onLogoClick={handleLogoClick}
        onOpenProfile={navigateToProfile}
        onOpenPassword={navigateToPassword}
        onOpenWallet={navigateToWallet}
        onOpenMaterials={navigateToMaterials}
        onOpenEquipment={navigateToEquipment}
        onOpenCalc={navigateToCalc}
        onOpenLidar={navigateToLidar}
      />

        <main id="main-content" className={currentView === 'landing' ? undefined : 'qg-app-page'} style={{ position: 'relative', zIndex: 1 }}>
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

          {currentView === 'login' && (
            <LoginPage
              currentUser={currentUser}
              checking={ssoChecking}
              onLogin={handleLogin}
              onOpenRegister={() => openAuthFlow('register')}
              onOpenDashboard={navigateToDashboard}
            />
          )}

          {currentView === 'password' && (
            <ChangePasswordPage
              currentUser={currentUser}
              onOpenLogin={() => openAuthFlow('login')}
              onOpenDashboard={navigateToDashboard}
            />
          )}

          {currentView === 'register' && (
            <RegisterPage
              currentUser={currentUser}
              onRegistered={handleLogin}
              onOpenLogin={() => openAuthFlow('login')}
              onOpenDashboard={navigateToDashboard}
            />
          )}

          {currentView === 'legal' && (
            <LegalPage
              key={`legal-${legalTick}`}
              docKey={LEGAL_PATHS[window.location.pathname.replace(/\/+$/, '')]}
              onBack={() => {
                if (window.history.length > 1) window.history.back();
                else navigateToLanding();
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

          {currentView === 'notfound' && (
            <NotFoundPage onHome={navigateToLanding} onOpenCatalog={navigateToMaterials} />
          )}

          {currentView === 'landing' && (
            <>
              <div className="qg-scene" aria-hidden="true" />
              {/* Секции лендинга больше не «выезжают» по одной при скролле: контент виден сразу,
                  единственный акцентный момент — первый экран (см. HeroSection). */}
              <HeroSection role={role} onOpenAuth={openAuthFlow} currentUser={currentUser} onOpenDashboard={navigateToDashboard} />
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

      {syncBanner}
    </div>
  );
}
