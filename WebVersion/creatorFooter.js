/**
 * creatorFooter.js — Глобальный футер «Создатель» на каждой странице.
 * Автоматически инжектируется внизу <body>.
 * ─────────────────────────────────────────────────────
 */
(function () {
    'use strict';

    /* ── CSS ────────────────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
        /* ===== Creator Footer ===== */
        .creator-footer {
            position: relative;
            z-index: 100;
            width: 100%;
            padding: 18px 20px 14px;
            text-align: center;
            background: linear-gradient(
                180deg,
                rgba(10, 10, 26, 0) 0%,
                rgba(10, 10, 26, 0.95) 30%,
                rgba(10, 10, 26, 1) 100%
            );
            border-top: 1px solid rgba(139, 92, 246, 0.15);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            user-select: none;
        }

        .creator-footer__inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        .creator-footer__label {
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.3);
        }

        .creator-footer__name {
            font-size: 0.95rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a78bfa 0%, #c084fc 40%, #ec4899 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: creatorShimmer 4s ease-in-out infinite;
            background-size: 200% 200%;
        }

        @keyframes creatorShimmer {
            0%, 100% { background-position: 0% 50%; }
            50%      { background-position: 100% 50%; }
        }

        .creator-footer__ig {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.45);
            text-decoration: none;
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid rgba(139, 92, 246, 0.15);
            background: rgba(139, 92, 246, 0.06);
            transition: all 0.3s ease;
        }

        .creator-footer__ig:hover {
            color: #e1306c;
            border-color: rgba(225, 48, 108, 0.35);
            background: rgba(225, 48, 108, 0.08);
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(225, 48, 108, 0.15);
        }

        .creator-footer__ig-icon {
            width: 14px;
            height: 14px;
            display: inline-block;
        }

        /* Mobile adjustments */
        @media (max-width: 600px) {
            .creator-footer {
                padding: 14px 16px 12px;
            }
            .creator-footer__name {
                font-size: 0.85rem;
            }
            .creator-footer__ig {
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);

    /* ── HTML ───────────────────────────────────────── */
    const footer = document.createElement('div');
    footer.className = 'creator-footer';
    footer.id = 'creatorFooter';
    footer.innerHTML = `
        <div class="creator-footer__inner">
            <span class="creator-footer__label">Создатель</span>
            <span class="creator-footer__name">Барбашин Максим</span>
            <a  class="creator-footer__ig"
                href="https://www.instagram.com/link_veai/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram: @Link_veAi">
                <svg class="creator-footer__ig-icon" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="5"/>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
                @Link_veAi
            </a>
        </div>
    `;

    /* ── Inject ─────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

    function inject() {
        document.body.appendChild(footer);
    }
})();
