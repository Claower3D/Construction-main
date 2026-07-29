// ========== CHAT INTEGRATION v1.0 ==========
// Интеграция модуля чата с основным приложением
// Добавляет чат-виджет к заказам, сметам и VIP-проектам

(function () {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        CHAT_CONTAINER_ID: 'floating-chat-container',
        FLOATING_BUTTON_ID: 'chat-floating-button',
        GLOBAL_BADGE_ID: 'chat-global-badge-indicator'
    };

    // ===== STATE =====
    let currentOrderId = null;
    let isChatVisible = false;

    // ===== INITIALIZE =====
    function init() {
        // Создаём контейнеры для чата
        createFloatingContainers();

        // Добавляем badge в хедер (если нужно)
        addGlobalUnreadBadge();

        // Подписываемся на события
        setupEventListeners();

        console.log('✅ ChatIntegration v1.0 initialized');
    }

    // ===== CREATE FLOATING CONTAINERS =====
    function createFloatingContainers() {
        // Контейнер для floating чата
        if (!document.getElementById(CONFIG.CHAT_CONTAINER_ID)) {
            const container = document.createElement('div');
            container.id = CONFIG.CHAT_CONTAINER_ID;
            container.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(container);
        }

        // Floating кнопка чата
        if (!document.getElementById(CONFIG.FLOATING_BUTTON_ID)) {
            const button = document.createElement('button');
            button.id = CONFIG.FLOATING_BUTTON_ID;
            button.className = 'chat-floating-button';
            button.innerHTML = `
                <span class="chat-floating-icon">💬</span>
                <span class="chat-floating-badge" id="${CONFIG.GLOBAL_BADGE_ID}" style="display:none">0</span>
            `;
            button.onclick = toggleFloatingChat;
            button.style.display = 'none'; // Скрыта по умолчанию, показывается когда есть orderId
            document.body.appendChild(button);

            // Добавляем стили для кнопки
            addFloatingButtonStyles();
        }
    }

    // ===== ADD FLOATING BUTTON STYLES =====
    function addFloatingButtonStyles() {
        const styleId = 'chat-integration-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .chat-floating-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border: none;
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
                cursor: pointer;
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .chat-floating-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(99, 102, 241, 0.7);
            }
            
            .chat-floating-button.active {
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            }
            
            .chat-floating-icon {
                font-size: 1.8rem;
            }
            
            .chat-floating-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                font-size: 0.7rem;
                font-weight: 600;
                min-width: 20px;
                height: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
            }

            /* Интегрированный чат в карточке заказа */
            .order-chat-section {
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--border, rgba(255,255,255,0.08));
            }

            .order-chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .order-chat-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text, #f8fafc);
            }

            .order-chat-toggle {
                padding: 0.5rem 1rem;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .order-chat-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }

            .order-chat-container {
                border-radius: 12px;
                overflow: hidden;
            }

            /* Стиль навигации с badge */
            .nav-item-with-badge {
                position: relative;
            }

            .nav-chat-badge {
                position: absolute;
                top: -4px;
                right: -8px;
                background: #ef4444;
                color: white;
                font-size: 0.6rem;
                font-weight: 600;
                min-width: 14px;
                height: 14px;
                border-radius: 7px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(style);
    }

    // ===== ADD GLOBAL UNREAD BADGE =====
    function addGlobalUnreadBadge() {
        // Обновляем badge периодически
        setInterval(updateGlobalBadge, 10000); // Каждые 10 секунд
        updateGlobalBadge();
    }

    // ===== UPDATE GLOBAL BADGE =====
    function updateGlobalBadge() {
        if (!window.ChatService?.Message?.getUnreadCount) return;

        const result = window.ChatService.Message.getUnreadCount();
        const badge = document.getElementById(CONFIG.GLOBAL_BADGE_ID);

        if (badge && result.success) {
            if (result.count > 0) {
                badge.textContent = result.count > 99 ? '99+' : result.count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ===== SETUP EVENT LISTENERS =====
    function setupEventListeners() {
        // Слушаем глобальные события навигации
        document.addEventListener('orderOpened', (e) => {
            if (e.detail?.orderId) {
                showFloatingChatButton(e.detail.orderId);
            }
        });

        document.addEventListener('orderClosed', () => {
            hideFloatingChatButton();
        });
    }

    // ===== TOGGLE FLOATING CHAT =====
    function toggleFloatingChat() {
        if (!currentOrderId) return;

        const container = document.getElementById(CONFIG.CHAT_CONTAINER_ID);
        const button = document.getElementById(CONFIG.FLOATING_BUTTON_ID);

        if (!container) return;

        isChatVisible = !isChatVisible;

        if (isChatVisible) {
            container.style.display = 'block';
            button?.classList.add('active');

            // Рендерим чат
            if (window.ChatUI?.render) {
                window.ChatUI.render(CONFIG.CHAT_CONTAINER_ID, currentOrderId, { floating: true });
            }
        } else {
            container.style.display = 'none';
            button?.classList.remove('active');

            // Очищаем чат
            if (window.ChatUI?.destroy) {
                window.ChatUI.destroy();
            }
            container.innerHTML = '';
        }
    }

    // ===== SHOW FLOATING CHAT BUTTON =====
    function showFloatingChatButton(orderId) {
        currentOrderId = orderId;
        const button = document.getElementById(CONFIG.FLOATING_BUTTON_ID);
        if (button) {
            button.style.display = 'flex';
        }
        updateGlobalBadge();
    }

    // ===== HIDE FLOATING CHAT BUTTON =====
    function hideFloatingChatButton() {
        currentOrderId = null;
        isChatVisible = false;

        const button = document.getElementById(CONFIG.FLOATING_BUTTON_ID);
        const container = document.getElementById(CONFIG.CHAT_CONTAINER_ID);

        if (button) {
            button.style.display = 'none';
            button.classList.remove('active');
        }

        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }

        if (window.ChatUI?.destroy) {
            window.ChatUI.destroy();
        }
    }

    // ===== RENDER INLINE CHAT =====
    // Встроить чат прямо в страницу (не floating)
    function renderInlineChat(containerId, orderId) {
        if (!window.ChatUI?.render) {
            console.warn('ChatUI not available');
            return;
        }
        window.ChatUI.render(containerId, orderId, { floating: false });
    }

    // ===== CREATE CHAT SECTION FOR ORDER DETAILS =====
    // Создаёт секцию чата для страницы деталей заказа
    function createOrderChatSection(orderId) {
        const html = `
            <div class="order-chat-section">
                <div class="order-chat-header">
                    <div class="order-chat-title">
                        <span>💬</span>
                        <span>Чат по заказу</span>
                    </div>
                    <button class="order-chat-toggle" onclick="ChatIntegration.toggleInlineChat('order-chat-inline', '${orderId}')">
                        Открыть чат
                    </button>
                </div>
                <div id="order-chat-inline" class="order-chat-container" style="display:none;"></div>
            </div>
        `;
        return html;
    }

    // ===== TOGGLE INLINE CHAT =====
    let inlineChatVisible = {};

    function toggleInlineChat(containerId, orderId) {
        const container = document.getElementById(containerId);
        const button = container?.previousElementSibling?.querySelector('.order-chat-toggle');

        if (!container) return;

        const isVisible = inlineChatVisible[containerId];

        if (isVisible) {
            container.style.display = 'none';
            if (button) button.textContent = 'Открыть чат';
            inlineChatVisible[containerId] = false;
        } else {
            container.style.display = 'block';
            if (button) button.textContent = 'Скрыть чат';
            inlineChatVisible[containerId] = true;

            // Рендерим чат
            if (window.ChatUI?.render) {
                window.ChatUI.render(containerId, orderId, { floating: false });
            }
        }
    }

    // ===== OPEN CHAT FOR ORDER =====
    // Программно открыть чат для заказа
    function openChatForOrder(orderId) {
        showFloatingChatButton(orderId);
        if (!isChatVisible) {
            toggleFloatingChat();
        }
    }

    // ===== EXPORT =====
    window.ChatIntegration = {
        init,
        showFloatingChatButton,
        hideFloatingChatButton,
        toggleFloatingChat,
        renderInlineChat,
        createOrderChatSection,
        toggleInlineChat,
        openChatForOrder,
        updateGlobalBadge
    };

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
