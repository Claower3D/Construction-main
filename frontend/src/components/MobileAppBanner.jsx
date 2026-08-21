import React, { useState } from 'react';

export default function MobileAppBanner() {
  const [activeTab, setActiveTab] = useState('estimate'); // 'estimate' | 'scan' | 'bom'

  return (
    <section className="app-banner-v2-section" id="mobile-app">
      <div className="container">
        <div className="app-banner-v2-card">
          {/* Cyber Grid & Glowing Animated Particle Grid */}
          <div className="app-cyber-grid"></div>

          {/* Dynamic Floating Ambient Orbs */}
          <div className="app-glow-orb orb-gold-v2"></div>
          <div className="app-glow-orb orb-purple-v2"></div>
          <div className="app-glow-orb orb-cyan-v2"></div>

          {/* Left Text & Action Content */}
          <div className="app-banner-v2-left">
            <span className="app-top-pill">
              <span className="app-spark-dot"></span>
              QazGost AI Mobile 2.0 • Pro Edition
            </span>

            <h2 className="app-banner-v2-title">
              Мобильный AI-эксперт <br />
              <span className="hero-gradient-text">всегда в вашем кармане</span>
            </h2>

            <p className="app-banner-v2-sub">
              Оценивайте стоимость ремонта и проверяйте дефекты прямо на объекте.
              Сфотографируйте помещение со смартфона — и получите готовую смету по ГОСТ РК за 2 секунды.
            </p>

            {/* Store Download Buttons & QR Code Row */}
            <div className="app-download-row">
              <div className="app-store-btns">
                <button
                  className="store-btn store-apple"
                  onClick={() => alert('Переход в App Store для скачивания QazGost AI')}
                >
                  <span className="store-icon"></span>
                  <div className="store-btn-text">
                    <small>Загрузите в</small>
                    <strong>App Store</strong>
                  </div>
                </button>

                <button
                  className="store-btn store-google"
                  onClick={() => alert('Переход в Google Play для скачивания QazGost AI')}
                >
                  <span className="store-icon">▶</span>
                  <div className="store-btn-text">
                    <small>Доступно в</small>
                    <strong>Google Play</strong>
                  </div>
                </button>
              </div>

              {/* Instant QR Code Card */}
              <div className="app-qr-card">
                <div className="qr-box">
                  <div className="qr-matrix">
                    <div className="qr-corner top-left"></div>
                    <div className="qr-corner top-right"></div>
                    <div className="qr-corner bottom-left"></div>
                    <div className="qr-dots-center"></div>
                  </div>
                </div>
                <div className="qr-text">
                  <strong>Сканируйте QR</strong>
                  <small>для мгновенного скачивания</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Smartphone Showcase Container with Levitating Feature Cards */}
          <div className="app-phone-mockup-container">
            <div className="phone-3d-wrap">
              {/* Outer Pulsating Multi-Color Neon Aura */}
              <div className="phone-ambient-aura"></div>

              {/* Glowing Ambient Light Ring */}
              <div className="phone-light-ring"></div>

              {/* 4 Levitating Feature Cards Orbiting COMPLETELY OUTSIDE the Phone Screen */}
              <div className="levitate-card lev-gold">
                <div className="lev-icon-box">⚡</div>
                <div className="lev-text">
                  <strong>AI-Смета за 2 сек</strong>
                  <small>100% точность ГОСТ РК</small>
                </div>
              </div>

              <div className="levitate-card lev-purple">
                <div className="lev-icon-box">🤖</div>
                <div className="lev-text">
                  <strong>8 AI-нейросетей</strong>
                  <small>Дефектоскопия LIVE</small>
                </div>
              </div>

              <div className="levitate-card lev-cyan">
                <div className="lev-icon-box">📊</div>
                <div className="lev-text">
                  <strong>BOM-ведомость</strong>
                  <small>База расценок 2026</small>
                </div>
              </div>

              <div className="levitate-card lev-pink">
                <div className="lev-icon-box">⭐</div>
                <div className="lev-text">
                  <strong>Рейтинг 4.9 / 5.0</strong>
                  <small>1 240+ объектов</small>
                </div>
              </div>

              {/* iPhone Frame */}
              <div className="phone-frame">
                {/* Dynamic Island Notch */}
                <div className="dynamic-island">
                  <div className="camera-lens"></div>
                </div>

                {/* Mobile Screen Content - LIVE INTERACTIVE PLATFORM DEMO WITH OUR WEBSITE BACKGROUND */}
                <div className="phone-screen-content">
                  {/* Website Cyber Grid & Subtle Crisp Ambient Accents Inside Phone Screen */}
                  <div className="app-cyber-grid opacity-50"></div>
                  <div className="app-glow-orb orb-gold-v2" style={{ width: '150px', height: '150px', opacity: 0.15 }}></div>
                  <div className="app-glow-orb orb-purple-v2" style={{ width: '150px', height: '150px', opacity: 0.15, right: '-20px', bottom: '10px' }}></div>

                  {/* Status Bar */}
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <span>5G 🔋</span>
                  </div>

                  {/* App Header */}
                  <div className="phone-app-header">
                    <span className="app-logo-symbol">🏗️</span>
                    <div>
                      <strong>QazGost AI Platform</strong>
                      <small>Онлайн-Демо • Казахстан 2026</small>
                    </div>
                    <span className="live-status-dot">●</span>
                  </div>

                  {/* Interactive Demo Mode Switcher Tabs */}
                  <div className="phone-demo-tabs">
                    <button
                      className={`demo-tab-btn ${activeTab === 'estimate' ? 'active' : ''}`}
                      onClick={() => setActiveTab('estimate')}
                    >
                      ⚡ Смета
                    </button>
                    <button
                      className={`demo-tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                      onClick={() => setActiveTab('scan')}
                    >
                      🤖 3D-Сканер
                    </button>
                    <button
                      className={`demo-tab-btn ${activeTab === 'bom' ? 'active' : ''}`}
                      onClick={() => setActiveTab('bom')}
                    >
                      📊 BOM
                    </button>
                  </div>

                  {/* TAB 1: LIVE AI ESTIMATE DEMO */}
                  {activeTab === 'estimate' && (
                    <div className="phone-demo-body fade-in">
                      <div className="demo-live-badge">
                        <span>● LIVE AI-РАСЧЁТ</span>
                        <small>ГОСТ РК 2026</small>
                      </div>

                      <div className="phone-scan-card">
                        <div className="scan-card-header">
                          <span>📸 Чертеж / Сканирование</span>
                          <span className="scan-time">1.8 сек</span>
                        </div>
                        <div className="scan-viewfinder">
                          <div className="scan-laser-line"></div>
                          <div className="scan-tag-detected">Квартира 84 м² • ЖК "Highvill"</div>
                        </div>
                      </div>

                      <div className="phone-result-card">
                        <div className="result-label">⚡ Авто-Смета готова</div>
                        <div className="result-price">1 450 000 ₸</div>
                        <div className="result-breakdown-row">
                          <span className="bd-pill">Материалы: 820k ₸</span>
                          <span className="bd-pill">Работы: 630k ₸</span>
                        </div>
                      </div>

                      <button
                        className="phone-cta-btn"
                        onClick={() => alert('Генерация PDF-сметы по ГОСТ РК 2026')}
                      >
                        <span>Скачать смету (PDF/Excel)</span>
                        <span>➔</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 2: LIVE 3D SCANNER DEMO */}
                  {activeTab === 'scan' && (
                    <div className="phone-demo-body fade-in">
                      <div className="demo-live-badge purple">
                        <span>🤖 AI-ДЕФЕКТОСКОПИЯ</span>
                        <small>Нейросеть QazGost</small>
                      </div>

                      <div className="phone-scanner-feed">
                        <div className="scan-laser-line pulse"></div>
                        <div className="ai-obj-tag tag-1">🧱 Стены: 120 м² (Гипсокартон)</div>
                        <div className="ai-obj-tag tag-2">🎨 Отделка: Леонардо Premium</div>
                        <div className="ai-obj-tag tag-3">⚠️ Отклонение: 0.2 мм (В норме)</div>
                      </div>

                      <div className="scanner-metrics-card">
                        <div className="metric-item">
                          <small>Точность</small>
                          <strong>99.8%</strong>
                        </div>
                        <div className="metric-item">
                          <small>Нейросети</small>
                          <strong>8 AI Core</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE BOM MATERIAL DEMO */}
                  {activeTab === 'bom' && (
                    <div className="phone-demo-body fade-in">
                      <div className="demo-live-badge cyan">
                        <span>📊 BOM-ВЕДОМОСТЬ</span>
                        <small>База расценок РК</small>
                      </div>

                      <div className="phone-bom-list">
                        <div className="bom-item">
                          <span>📦 Профиль Кнауф 60х27</span>
                          <strong>140 шт • 182k ₸</strong>
                        </div>
                        <div className="bom-item">
                          <span>🧪 Шпаклевка Снежка</span>
                          <strong>25 меш • 95k ₸</strong>
                        </div>
                        <div className="bom-item">
                          <span>💡 LED Трэки 24V</span>
                          <strong>32 м • 144k ₸</strong>
                        </div>
                      </div>

                      <div className="bom-total-box">
                        <span>Итого материалов:</span>
                        <strong>421 000 ₸</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


