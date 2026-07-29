// ========== CHAT UI v1.0 ==========
// UI компоненты для модуля чата
// Виджет чата, список сообщений, ввод сообщений

(function () {
    'use strict';

    const { MessageType, MessageStatus, RoomType } = window.ChatModels || {};
    const ChatService = window.ChatService;

    // ===== STATE =====
    let currentRoomId = null;
    let isMinimized = false;
    let attachmentQueue = [];
    let pollInterval = null;

    // ===== RENDER CHAT WIDGET =====
    function renderChatWidget(containerId, orderId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('ChatUI: container not found:', containerId);
            return;
        }

        // Получаем или создаём комнату
        const roomResult = ChatService.Room.getOrCreateForOrder(orderId);
        if (!roomResult.success) {
            container.innerHTML = `
                <div class="chat-error">
                    <span class="chat-error-icon">⚠️</span>
                    <span>${roomResult.error}</span>
                </div>
            `;
            return;
        }

        currentRoomId = roomResult.room.id;

        const html = `
            <div class="chat-widget ${options.floating ? 'chat-widget-floating' : ''}" id="chat-widget-${currentRoomId}">
                <div class="chat-header" onclick="ChatUI.toggleMinimize()">
                    <div class="chat-header-info">
                        <span class="chat-header-icon">💬</span>
                        <span class="chat-header-title">${escapeHtml(roomResult.room.title)}</span>
                    </div>
                    <div class="chat-header-actions">
                        <span class="chat-unread-badge" id="chat-unread-badge" style="display:none">0</span>
                        <button class="chat-minimize-btn" title="Свернуть">
                            <span id="chat-minimize-icon">−</span>
                        </button>
                    </div>
                </div>
                <div class="chat-body" id="chat-body">
                    <div class="chat-messages" id="chat-messages">
                        <div class="chat-loading">Загрузка сообщений...</div>
                    </div>
                    <div class="chat-input-area" id="chat-input-area">
                        <div class="chat-attachments-preview" id="chat-attachments-preview" style="display:none"></div>
                        <div class="chat-input-row">
                            <button class="chat-attach-btn" onclick="ChatUI.triggerFileUpload()" title="Прикрепить файл">
                                📎
                            </button>
                            <input type="file" id="chat-file-input" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style="display:none" onchange="ChatUI.handleFileSelect(event)">
                            <textarea 
                                id="chat-input" 
                                class="chat-input" 
                                placeholder="Введите сообщение..." 
                                rows="1"
                                onkeydown="ChatUI.handleKeyDown(event)"
                                oninput="ChatUI.autoResize(this)"
                            ></textarea>
                            <button class="chat-send-btn" onclick="ChatUI.sendMessage()" title="Отправить">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Загружаем сообщения
        loadMessages();

        // Обновляем непрочитанные
        updateUnreadBadge();

        // Запускаем polling для новых сообщений
        startPolling();
    }

    // ===== LOAD MESSAGES =====
    function loadMessages() {
        if (!currentRoomId) return;

        const result = ChatService.Message.getMessages(currentRoomId, 100);
        if (!result.success) {
            showError(result.error);
            return;
        }

        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        if (result.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-empty">
                    <span class="chat-empty-icon">💬</span>
                    <span>Нет сообщений. Напишите первым!</span>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = result.messages.map(renderMessage).join('');
        scrollToBottom();

        // Отмечаем прочитанными
        ChatService.Message.markAllAsRead(currentRoomId);
        updateUnreadBadge();
    }

    // ===== RENDER MESSAGE =====
    function renderMessage(msg) {
        const currentUser = getCurrentUser();
        const isOwn = msg.senderId === currentUser?.id;
        const isSystem = msg.type === MessageType.SYSTEM;

        if (isSystem) {
            return `
                <div class="chat-message chat-message-system">
                    <span class="chat-system-text">${escapeHtml(msg.content)}</span>
                </div>
            `;
        }

        const roleLabel = getRoleLabel(msg.senderRole);
        const time = formatTime(msg.createdAt);
        const statusIcon = isOwn ? getStatusIcon(msg.status) : '';

        let contentHtml = '';

        if (msg.type === MessageType.TEXT) {
            contentHtml = `<div class="chat-message-text">${escapeHtml(msg.content)}</div>`;
        } else if (msg.type === MessageType.IMAGE) {
            contentHtml = `
                <div class="chat-message-attachments">
                    ${msg.attachments.map(a => `
                        <div class="chat-attachment chat-attachment-image">
                            <img src="${a.url}" alt="${escapeHtml(a.name)}" onclick="ChatUI.openImage('${a.url}')">
                        </div>
                    `).join('')}
                </div>
                ${msg.content ? `<div class="chat-message-text">${escapeHtml(msg.content)}</div>` : ''}
            `;
        } else if (msg.type === MessageType.FILE) {
            contentHtml = `
                <div class="chat-message-attachments">
                    ${msg.attachments.map(a => `
                        <a class="chat-attachment chat-attachment-file" href="${a.url}" download="${escapeHtml(a.name)}">
                            <span class="chat-file-icon">📄</span>
                            <span class="chat-file-name">${escapeHtml(a.name)}</span>
                            <span class="chat-file-size">${formatSize(a.size)}</span>
                        </a>
                    `).join('')}
                </div>
                ${msg.content ? `<div class="chat-message-text">${escapeHtml(msg.content)}</div>` : ''}
            `;
        }

        return `
            <div class="chat-message ${isOwn ? 'chat-message-own' : 'chat-message-other'}" data-id="${msg.id}">
                <div class="chat-message-bubble">
                    ${!isOwn ? `
                        <div class="chat-message-header">
                            <span class="chat-sender-name">${escapeHtml(msg.senderName)}</span>
                            <span class="chat-sender-role">${roleLabel}</span>
                        </div>
                    ` : ''}
                    ${contentHtml}
                    <div class="chat-message-footer">
                        <span class="chat-message-time">${time}</span>
                        ${statusIcon}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== SEND MESSAGE =====
    function sendMessage() {
        const input = document.getElementById('chat-input');
        const content = input?.value?.trim() || '';

        if (!content && attachmentQueue.length === 0) {
            return;
        }

        let result;

        if (attachmentQueue.length > 0) {
            result = ChatService.Message.sendWithAttachment(currentRoomId, content, attachmentQueue);
        } else {
            result = ChatService.Message.send(currentRoomId, content);
        }

        if (!result.success) {
            showToast(result.errors?.join(', ') || result.error, 'error');
            return;
        }

        // Очищаем
        input.value = '';
        input.style.height = 'auto';
        clearAttachmentQueue();

        // Добавляем сообщение в UI
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // Убираем "пустой" placeholder если есть
            const empty = messagesContainer.querySelector('.chat-empty');
            if (empty) empty.remove();

            messagesContainer.insertAdjacentHTML('beforeend', renderMessage(result.message));
            scrollToBottom();
        }
    }

    // ===== FILE HANDLING =====
    function triggerFileUpload() {
        document.getElementById('chat-file-input')?.click();
    }

    async function handleFileSelect(event) {
        const files = event.target.files;
        if (!files.length) return;

        try {
            const attachments = await ChatService.File.uploadMultiple(Array.from(files));
            attachmentQueue.push(...attachments);
            renderAttachmentPreview();
        } catch (e) {
            showToast('Ошибка загрузки файла', 'error');
        }

        // Сбрасываем input
        event.target.value = '';
    }

    function renderAttachmentPreview() {
        const container = document.getElementById('chat-attachments-preview');
        if (!container) return;

        if (attachmentQueue.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = attachmentQueue.map((att, idx) => {
            const isImage = att.type.startsWith('image/');
            return `
                <div class="chat-preview-item">
                    ${isImage
                    ? `<img src="${att.url}" alt="${escapeHtml(att.name)}" class="chat-preview-image">`
                    : `<span class="chat-preview-file">📄</span>`
                }
                    <span class="chat-preview-name">${escapeHtml(att.name.substring(0, 10))}${att.name.length > 10 ? '...' : ''}</span>
                    <button class="chat-preview-remove" onclick="ChatUI.removeAttachment(${idx})">×</button>
                </div>
            `;
        }).join('');
    }

    function removeAttachment(index) {
        attachmentQueue.splice(index, 1);
        renderAttachmentPreview();
    }

    function clearAttachmentQueue() {
        attachmentQueue = [];
        renderAttachmentPreview();
    }

    // ===== UI ACTIONS =====
    function toggleMinimize() {
        const body = document.getElementById('chat-body');
        const icon = document.getElementById('chat-minimize-icon');
        if (!body) return;

        isMinimized = !isMinimized;
        body.style.display = isMinimized ? 'none' : 'flex';
        if (icon) icon.textContent = isMinimized ? '+' : '−';
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function openImage(url) {
        // Простой lightbox
        const overlay = document.createElement('div');
        overlay.className = 'chat-lightbox';
        overlay.innerHTML = `
            <div class="chat-lightbox-content">
                <img src="${url}" alt="Изображение">
                <button class="chat-lightbox-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    // ===== POLLING =====
    function startPolling() {
        stopPolling();
        pollInterval = setInterval(() => {
            loadMessages();
        }, 5000); // Каждые 5 секунд
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    // ===== UNREAD BADGE =====
    function updateUnreadBadge() {
        const badge = document.getElementById('chat-unread-badge');
        if (!badge) return;

        const result = ChatService.Message.getUnreadCount(currentRoomId);
        if (result.success && result.count > 0) {
            badge.textContent = result.count > 99 ? '99+' : result.count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ===== GLOBAL UNREAD INDICATOR =====
    function renderGlobalUnreadBadge(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const result = ChatService.Message.getUnreadCount();
        if (!result.success) return;

        if (result.count > 0) {
            container.innerHTML = `<span class="chat-global-badge">${result.count > 99 ? '99+' : result.count}</span>`;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // ===== HELPERS =====
    function getCurrentUser() {
        if (window.Services?.Auth?.getCurrentUser) {
            return window.Services.Auth.getCurrentUser();
        }
        const userId = localStorage.getItem('currentUserId');
        if (userId && window.Models?.User) {
            return window.Models.User.find(userId);
        }
        return null;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) +
            ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    function formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function getRoleLabel(role) {
        const labels = {
            customer: 'Заказчик',
            executor: 'Исполнитель',
            engineer: 'Инженер',
            admin: 'Админ',
            system: 'Система'
        };
        return labels[role] || role;
    }

    function getStatusIcon(status) {
        const icons = {
            [MessageStatus.SENT]: '<span class="chat-status-icon">✓</span>',
            [MessageStatus.DELIVERED]: '<span class="chat-status-icon">✓✓</span>',
            [MessageStatus.READ]: '<span class="chat-status-icon chat-status-read">✓✓</span>'
        };
        return icons[status] || '';
    }

    function showToast(message, type = 'info') {
        // Используем глобальный toast если есть
        if (window.showToast) {
            window.showToast(message);
            return;
        }
        console.log(`[${type}] ${message}`);
    }

    function showError(message) {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.innerHTML = `
                <div class="chat-error">
                    <span class="chat-error-icon">⚠️</span>
                    <span>${escapeHtml(message)}</span>
                </div>
            `;
        }
    }

    // ===== CLEANUP =====
    function destroy() {
        stopPolling();
        currentRoomId = null;
        attachmentQueue = [];
    }

    // ===== EXPORT =====
    window.ChatUI = {
        render: renderChatWidget,
        renderGlobalBadge: renderGlobalUnreadBadge,
        sendMessage,
        triggerFileUpload,
        handleFileSelect,
        removeAttachment,
        toggleMinimize,
        handleKeyDown,
        autoResize,
        openImage,
        destroy,
        // For external access
        getCurrentRoomId: () => currentRoomId
    };

    console.log('✅ ChatUI v1.0 loaded');
})();
