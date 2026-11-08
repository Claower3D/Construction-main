import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
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
import './styles/landing-bg.css';
import './utils/audioFX.js';
// 3D-наклон карточек (utils/cardTilt.js) отключён: MutationObserver на весь документ
// и «прыгающие» карточки мешали чтению и нагружали CPU.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
