import React from 'react';

export default function MobileAppBanner() {
  return (
    <section className="app-banner-v2-section" id="mobile-app">
      <div className="container">
        <div className="app-banner-v2-card">
          {/* Cyber Grid & Particle Background Pattern */}
          <div className="app-cyber-grid"></div>

          {/* Dynamic Floating Ambient Orbs */}
          <div className="app-glow-orb orb-gold-v2"></div>
          <div className="app-glow-orb orb-purple-v2"></div>
          <div className="app-glow-orb orb-cyan-v2"></div>

          {/* Floating Glass AI Badges in Background */}
          <div className="float-badge badge-top-right">
            <span className="badge-dot green">●</span>
            <span>🚀 ГОСТ РК 2026 • 12k+ смет</span>
          </div>
          <div className="float-badge badge-mid-left">
            <span className="badge-dot gold">●</span>
            <span>⚡ BOM-ведомость: 100% точность</span>
          </div>
          <div className="float-badge badge-bottom-mid">
            <span className="badge-dot cyan">●</span>
            <span>🛡️ AI Дефектоскопия LIVE</span>
          </div>

          {/* Left Text & Action Content */}
          <div className="app-banner-v2-left">
            <span className="app-top-pill">
              <span className="app-spark-dot"></span>
              QazGost AI Mobile 2.0
            </span>

            <h2 className="app-banner-v2-title">
              Мобильный AI-эксперт <br />
              <span className="hero-gradient-text">всегда в вашем кармане</span>
            </h2>

            <p className="app-banner-v2-sub">
              Оценивайте стоимость ремонта и проверяйте дефекты прямо на объекте.
              Сфотографируйте помещение со смартфона — и получите готовую смету по ГОСТ РК за 2 секунды.
            </p>

            {/* Feature Pills */}
            <div className="app-feature-chips">
              <span className="app-chip">⚡ Смета за 2 сек</span>
              <span className="app-chip">🤖 8 нейросетей</span>
              <span className="app-chip">⭐ 4.9 (1 240+ оценок)</span>
            </div>

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
                  <small>для скачивания</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Smartphone Mockup with Dynamic Island & Scanning UI */}
          <div className="app-phone-mockup-container">
            <div className="phone-3d-wrap">
              {/* Outer Glow Aura */}
              <div className="phone-ambient-aura"></div>

              {/* iPhone Frame */}
              <div className="phone-frame">
                {/* Dynamic Island Notch */}
                <div className="dynamic-island">
                  <div className="camera-lens"></div>
                </div>

                {/* Mobile Screen Content */}
                <div className="phone-screen-content">
                  {/* Status Bar */}
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <span>5G 🔋</span>
                  </div>

                  {/* App Header */}
                  <div className="phone-app-header">
                    <span className="app-logo-symbol">🏗️</span>
                    <div>
                      <strong>QazGost AI</strong>
                      <small>Казахстан 2026</small>
                    </div>
                    <span className="live-status-dot">●</span>
                  </div>

                  {/* Active Scan Card Preview */}
                  <div className="phone-scan-card">
                    <div className="scan-card-header">
                      <span>📸 Фото объекта...</span>
                      <span className="scan-time">2.4 сек</span>
                    </div>
                    <div className="scan-viewfinder">
                      <div className="scan-laser-line"></div>
                      <div className="scan-tag-detected">Ванная • 12.4 м²</div>
                    </div>
                  </div>

                  {/* Calculated Estimate Results Card */}
                  <div className="phone-result-card">
                    <div className="result-label">⚡ AI-Смета готова</div>
                    <div className="result-price">450 000 ₸</div>
                    <div className="result-scenarios">
                      <span className="scen active">Эконом</span>
                      <span className="scen">Стандарт</span>
                      <span className="scen">Премиум</span>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <button className="phone-cta-btn">
                    <span>Заказать ремонт</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


