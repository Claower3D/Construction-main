import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './mobile-adapt.css';
import './modern-theme.css';
import './styles/main.scss';
import './utils/audioFX.js';
import { init3DCardTilt } from './utils/cardTilt.js';

init3DCardTilt();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
