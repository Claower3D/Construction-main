/**
 * CookieConsent — автономный модуль баннера согласия на cookie
 * QazGost AI — GDPR/LPDP compliance
 * Подключается через <script src="cookieConsent.js"></script>
 */
(function () {
    'use strict';

    // Если уже принято — не показываем
    if (localStorage.getItem('cookieConsent') === 'accepted') return;

    // ========== СТИЛИ ==========
    const styles = document.createElement('style');
    styles.textContent = `
        .cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 90000;
            background: rgba(10, 10, 26, 0.95);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-top: 1px solid rgba(139, 92, 246, 0.15);
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            font-family: 'Inter', -apple-system, sans-serif;
            animation: cookieSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 -4px 30px rgba(0,0,0,0.3);
        }

        .cookie-banner__text {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.82rem;
            line-height: 1.55;
            flex: 1;
        }

        .cookie-banner__text a {
            color: #a78bfa;
            text-decoration: none;
        }

        .cookie-banner__text a:hover {
            text-decoration: underline;
        }

        .cookie-banner__actions {
            display: flex;
            gap: 0.6rem;
            flex-shrink: 0;
        }

        .cookie-banner__btn {
            border: none;
            border-radius: 10px;
            padding: 0.55rem 1.2rem;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
        }

        .cookie-banner__btn--accept {
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            color: #fff;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
        }

        .cookie-banner__btn--accept:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }

        .cookie-banner__btn--decline {
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .cookie-banner__btn--decline:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
        }

        @keyframes cookieSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 640px) {
            .cookie-banner {
                flex-direction: column;
                text-align: center;
                padding: 1.2rem;
            }
            .cookie-banner__actions {
                width: 100%;
            }
            .cookie-banner__btn {
                flex: 1;
            }
        }
    `;
    document.head.appendChild(styles);

    // ========== HTML ==========
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookieBanner';
    banner.innerHTML = `
        <div class="cookie-banner__text">
            🍪 Мы используем cookie и localStorage для обеспечения работы платформы, аналитики и улучшения пользовательского опыта.
            Подробнее — в <a href="privacy.html" target="_blank">Политике конфиденциальности</a>.
        </div>
        <div class="cookie-banner__actions">
            <button class="cookie-banner__btn cookie-banner__btn--decline" id="cookieDeclineBtn">Только необходимые</button>
            <button class="cookie-banner__btn cookie-banner__btn--accept" id="cookieAcceptBtn">Принять все</button>
        </div>
    `;

    // ========== ЛОГИКА ==========
    function accept() {
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        removeBanner();
    }

    function decline() {
        localStorage.setItem('cookieConsent', 'essential');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        removeBanner();
    }

    function removeBanner() {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(100%)';
        banner.style.transition = 'all 0.4s ease';
        setTimeout(() => banner.remove(), 400);
    }

    // ========== ВСТАВКА ==========
    document.addEventListener('DOMContentLoaded', function () {
        // Показываем баннер через 1.5 сек после загрузки (не мешаем splash)
        setTimeout(function () {
            document.body.appendChild(banner);
            document.getElementById('cookieAcceptBtn').addEventListener('click', accept);
            document.getElementById('cookieDeclineBtn').addEventListener('click', decline);
        }, 1500);
    });
})();
