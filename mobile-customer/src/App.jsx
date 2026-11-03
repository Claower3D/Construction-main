import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { BottomNav, TopBar } from './components/Shell';
import HomeScreen from './components/HomeScreen';
import ServicesScreen from './components/ServicesScreen';
import OrdersScreen from './components/OrdersScreen';
import ProfileScreen from './components/ProfileScreen';
import OrderSheet from './components/OrderSheet';
import EstimateSheet from './components/EstimateSheet';
import DefectSheet from './components/DefectSheet';
import MarketplaceView from './components/MarketplaceView';
import { Toast, statusTone } from './components/ui/kit';
import { FALLBACK_MATERIALS, FALLBACK_EQUIPMENT } from './data/marketFallback';
import { loadAuth, getCity, setCity as storeCity, fetchOrders, flushPending, loadPending, getServerUrl, headers } from './api/clientApi';
import './styles/client.css';

const TITLES = {
  home: 'QazGost',
  services: 'Услуги и цены',
  orders: 'Мои заказы',
  market: 'Маркет',
  profile: 'Профиль'
};

export default function App() {
  const [tab, setTab] = useState('home');
  const [auth, setAuth] = useState(loadAuth);
  const [city, setCityState] = useState(getCity);
  const [orders, setOrders] = useState([]);
  const [ordersState, setOrdersState] = useState({ loading: true, offline: false, error: '' });
  const [sheet, setSheet] = useState(null); // { kind: 'order'|'estimate'|'defect', prefill }
  const [openOrder, setOpenOrder] = useState(null);
  const [marketTab, setMarketTab] = useState('materials');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2800);
  }, []);

  const reload = useCallback(async () => {
    setOrdersState((s) => ({ ...s, loading: true }));
    const r = await fetchOrders();
    setOrders(r.orders);
    setOrdersState({ loading: false, offline: r.offline, error: r.error || '' });
  }, []);

  useEffect(() => { reload(); }, [reload, auth]);

  // после входа — отправить заказы, сохранённые без аккаунта или без сети
  useEffect(() => {
    if (!auth?.token || !loadPending().length) return;
    flushPending().then((r) => { if (r.sent) { toast(`Отправлено заказов: ${r.sent}`); reload(); } });
  }, [auth, reload, toast]);

  // кнопка «Назад» на Android закрывает шторку, затем возвращает на главную
  const backRef = useRef(null);
  backRef.current = () => {
    if (sheet) { setSheet(null); return true; }
    if (openOrder) { setOpenOrder(null); return true; }
    if (tab !== 'home') { setTab('home'); return true; }
    return false;
  };
  useEffect(() => {
    const onPop = () => {
      if (backRef.current()) window.history.pushState(null, '');
    };
    window.history.pushState(null, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setCity = (c) => { storeCity(c); setCityState(c); };
  const activeCount = orders.filter((o) => !['done', 'lost'].includes(statusTone(o.status))).length;
  const marketHeaders = useMemo(() => headers(), [auth]);

  const openOrderSheet = (prefill) => setSheet({ kind: 'order', prefill: prefill || {} });
  const openService = (s) => openOrderSheet({ service: s.name, description: '' });
  const goMarket = (t) => { setMarketTab(t); setTab('market'); };

  const onCreated = ({ order, queued, reason }) => {
    setSheet(null);
    setOrders((list) => [order, ...list]);
    setTab('orders');
    if (!queued) toast('Заказ отправлен. Бригады пришлют предложения.');
    else if (reason === 'login') toast('Заказ сохранён. Войдите, чтобы отправить его бригадам.');
    else toast('Нет связи: заказ сохранён и отправится позже.');
  };

  return (
    <div className="qz-app cl-app">
      <div className="cl-glow" aria-hidden="true" />
      <TopBar
        title={TITLES[tab]}
        sub={tab === 'home' ? `${city} · ${auth?.user?.name ? auth.user.name : 'гость'}` : null}
        right={tab === 'orders' ? (
          <button type="button" className="qz-iconbtn" aria-label="Обновить" onClick={reload} disabled={ordersState.loading}>
            <RefreshCw size={20} className={ordersState.loading ? 'qz-spin' : ''} />
          </button>
        ) : null}
      />
      <main className="qz-main">
        {tab === 'home' && (
          <HomeScreen
            user={auth?.user}
            city={city}
            orders={orders}
            onEstimate={() => setSheet({ kind: 'estimate' })}
            onDefects={() => setSheet({ kind: 'defect' })}
            onOrder={openOrderSheet}
            onOpenService={openService}
            onMarket={goMarket}
            onOpenOrders={() => setTab('orders')}
            onOpenOrder={(o) => { setOpenOrder(o); setTab('orders'); }}
          />
        )}
        {tab === 'services' && <ServicesScreen onOpenService={openService} />}
        {tab === 'orders' && (
          <OrdersScreen
            orders={orders}
            loading={ordersState.loading}
            offline={ordersState.offline}
            error={ordersState.error}
            loggedIn={!!auth?.token}
            pendingCount={loadPending().length}
            onFlush={async () => { const r = await flushPending(); toast(r.sent ? `Отправлено: ${r.sent}` : 'Не удалось отправить, нет связи'); reload(); }}
            onNewOrder={() => openOrderSheet()}
            onLogin={() => setTab('profile')}
            openOrder={openOrder}
            setOpenOrder={setOpenOrder}
          />
        )}
        {tab === 'market' && (
          <div className="qz-page" style={{ paddingTop: 8 }}>
            <MarketplaceView
              key={marketTab}
              initialTab={marketTab}
              serverUrl={getServerUrl()}
              authHeaders={marketHeaders}
              addLabel="В заказ"
              onAddItem={(item) => openOrderSheet({ service: item.title || item.name })}
              fallbackMaterials={FALLBACK_MATERIALS}
              fallbackEquipment={FALLBACK_EQUIPMENT}
              defaultCity={city}
            />
          </div>
        )}
        {tab === 'profile' && <ProfileScreen auth={auth} city={city} onCity={setCity} onAuth={setAuth} toast={toast} />}
      </main>

      <BottomNav active={tab} onSelect={(t) => { setTab(t); setOpenOrder(null); }} activeCount={activeCount} />

      {sheet?.kind === 'order' && (
        <OrderSheet prefill={sheet.prefill} user={auth?.user} city={city} onClose={() => setSheet(null)} onCreated={onCreated} onNeedLogin={() => { setSheet(null); setTab('profile'); }} />
      )}
      {sheet?.kind === 'estimate' && (
        <EstimateSheet city={city} onClose={() => setSheet(null)} onOrder={(p) => setSheet({ kind: 'order', prefill: p })} />
      )}
      {sheet?.kind === 'defect' && (
        <DefectSheet onClose={() => setSheet(null)} onOrder={(p) => setSheet({ kind: 'order', prefill: p })} />
      )}
      <Toast message={toastMsg} />
    </div>
  );
}
