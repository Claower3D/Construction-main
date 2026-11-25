import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AndroidAppPrompt from './components/AndroidAppPrompt.jsx';
// Шрифты хостим сами (кириллица включена): Manrope — интерфейс, Unbounded — заголовки
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/600.css';
import './index.css';
import './mobile-adapt.css';
import './modern-theme.css';
import './styles/main.scss';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/landing-pro.css';
import './styles/landing-lux.css';
import './styles/landing-fx.css';
import './styles/landing-color.css';
import './styles/landing-scene.css';
import './styles/app-lux.css';
import './utils/audioFX.js';
import { initI18n, langReady } from './i18n';
import { startUserDataSync } from './services/userDataSync';
// 3D-наклон карточек (utils/cardTilt.js) отключён: MutationObserver на весь документ
// и «прыгающие» карточки мешали чтению и нагружали CPU.

// После обновления сайта у открытой вкладки остаётся старый список файлов. Когда она пытается
// догрузить раздел, которого на сервере уже нет, Vite сообщает событием vite:preloadError.
// Один раз перезагружаем страницу — человек получает свежую версию вместо пустого экрана.
// Отметка в sessionStorage не даёт перезагружаться по кругу, если файл недоступен по другой причине.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'qazgost_chunk_reload_at';
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch (e) { /* хранилище недоступно */ }
  if (Date.now() - last < 60000) return; // уже перезагружались меньше минуты назад — пусть ошибку покажет страница
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) { /* хранилище недоступно */ }
  event.preventDefault();
  window.location.reload();
});

// Английская версия (домен qazgost.com или выбор посетителя): сначала догружается словарь, потом
// рисуется сайт — иначе на мгновение мелькнул бы русский текст. Дольше 2,5 секунды словарь не ждём.
const start = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
      {/* на Android — окно «остаться на сайте или скачать приложение» */}
      <AndroidAppPrompt />
    </React.StrictMode>
  );
  // Язык интерфейса (RU / KZ / EN): выбор посетителя или язык домена применяется сразу после монтирования
  initI18n();
};
Promise.race([langReady(), new Promise((resolve) => setTimeout(resolve, 2500))]).then(start, start);
// Личные данные (календарь, объекты, уведомления, история смет…) — на сервер и на все устройства
startUserDataSync();
