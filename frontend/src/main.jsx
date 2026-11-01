import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './mobile-adapt.css';
import './modern-theme.css';
import './styles/main.scss';
import './styles/tokens.css';
import './styles/landing.css';
import './utils/audioFX.js';
// 3D-наклон карточек (utils/cardTilt.js) отключён: MutationObserver на весь документ
// и «прыгающие» карточки мешали чтению и нагружали CPU.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
