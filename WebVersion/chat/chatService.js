// ========== CHAT SERVICE v1.0 ==========
// API и бизнес-логика для модуля чата
// Создание комнат, отправка сообщений, статусы прочтения

(function () {
    'use strict';

    const {
        ChatRoom, ChatMessage, ChatParticipant,
        MessageType, MessageStatus, RoomType
    } = window.ChatModels || {};

    if (!ChatRoom || !ChatMessage) {
        console.warn('⚠️ ChatModels not loaded — ChatService unavailable');
        window.ChatService = { Room: {}, Message: {}, File: {} };
        return;
    }

    // ===== HELPERS =====
    function getCurrentUser() {
        // Используем глобальный Auth из services.js
        if (window.Services?.Auth?.getCurrentUser) {
            return window.Services.Auth.getCurrentUser();
        }
        // Fallback
        const userId = localStorage.getItem('currentUserId');
        if (userId && window.Models?.User) {
            return window.Models.User.find(userId);
        }
        return null;
    }

    function getOrder(orderId) {
        if (window.Models?.Order) {
            return window.Models.Order.find(orderId);
        }
        return null;
    }

    function getUserName(userId) {
        if (window.Models?.User) {
            const user = window.Models.User.find(userId);
            return user?.name || user?.email || 'Пользователь';
        }
        return 'Пользователь';
    }

    function getUserRole(userId) {
        if (window.Models?.User) {
            const user = window.Models.User.find(userId);
            return user?.role || 'customer';
        }
        return 'customer';
    }

    // ===== ROOM API =====
    const RoomAPI = {
        /**
         * Создать или получить существующую комнату для заказа
         * @param {string} orderId - ID заказа
         * @returns {Object} { success, room }
         */
        getOrCreateForOrder(orderId) {
            // Проверяем существующую комнату
            let room = ChatRoom.findByRef('Order', orderId);
            if (room) {
                return { success: true, room, created: false };
            }

            // Получаем заказ для определения участников
            const order = getOrder(orderId);
            if (!order) {
                return { success: false, error: 'Заказ не найден' };
            }

            const participantIds = [order.customerId];
            if (order.executorId) {
                participantIds.push(order.executorId);
            }

            // Создаём комнату
            room = new ChatRoom({
                type: RoomType.ORDER,
                refType: 'Order',
                refId: orderId,
                title: order.title || `Заказ #${orderId.substring(0, 8)}`,
                participantIds
            });

            const result = room.save();
            if (!result.success) {
                return result;
            }

            // Создаём записи участников
            for (const userId of participantIds) {
                const participant = new ChatParticipant({
                    roomId: room.id,
                    userId,
                    userName: getUserName(userId),
                    userRole: getUserRole(userId)
                });
                participant.save();
            }

            // Добавляем системное сообщение о создании чата
            const systemMsg = new ChatMessage({
                roomId: room.id,
                senderId: 'system',
                senderName: 'Система',
                senderRole: 'system',
                type: MessageType.SYSTEM,
                content: 'Чат по заказу создан. Вы можете обсудить детали здесь.'
            });
            systemMsg.save();

            return { success: true, room, created: true };
        },

        /**
         * Получить комнату по ID
         */
        get(roomId) {
            const room = ChatRoom.find(roomId);
            if (!room) {
                return { success: false, error: 'Комната не найдена' };
            }
            return { success: true, room };
        },

        /**
         * Получить все комнаты текущего пользователя
         */
        getMyRooms() {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            const rooms = ChatRoom.findByUser(user.id);

            // Добавляем информацию о непрочитанных
            const roomsWithUnread = rooms.map(room => ({
                ...room,
                unreadCount: ChatMessage.getUnreadCount(room.id, user.id)
            }));

            return { success: true, rooms: roomsWithUnread };
        },

        /**
         * Добавить участника в комнату (например, инженера)
         */
        addParticipant(roomId, userId) {
            const room = ChatRoom.find(roomId);
            if (!room) {
                return { success: false, error: 'Комната не найдена' };
            }

            if (room.participantIds.includes(userId)) {
                return { success: true, message: 'Уже участник' };
            }

            room.participantIds.push(userId);
            room.save();

            const participant = new ChatParticipant({
                roomId,
                userId,
                userName: getUserName(userId),
                userRole: getUserRole(userId)
            });
            participant.save();

            // Системное сообщение
            const systemMsg = new ChatMessage({
                roomId,
                senderId: 'system',
                senderName: 'Система',
                senderRole: 'system',
                type: MessageType.SYSTEM,
                content: `${getUserName(userId)} присоединился к чату`
            });
            systemMsg.save();

            return { success: true };
        }
    };

    // ===== MESSAGE API =====
    const MessageAPI = {
        /**
         * Отправить текстовое сообщение
         * @param {string} roomId - ID комнаты
         * @param {string} content - Текст сообщения
         * @param {string} replyToId - ID сообщения для ответа (опционально)
         */
        send(roomId, content, replyToId = null) {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            const room = ChatRoom.find(roomId);
            if (!room) {
                return { success: false, error: 'Комната не найдена' };
            }

            // Проверяем, что пользователь — участник
            if (!room.participantIds.includes(user.id)) {
                return { success: false, error: 'Вы не участник этого чата' };
            }

            const message = new ChatMessage({
                roomId,
                senderId: user.id,
                senderName: user.name || user.email,
                senderRole: user.role,
                type: MessageType.TEXT,
                content: content.trim(),
                replyToId,
                readBy: [user.id] // Отправитель уже прочитал
            });

            const result = message.save();
            if (!result.success) {
                return result;
            }

            // Обновляем комнату
            room.updateLastMessage(message);

            return { success: true, message };
        },

        /**
         * Отправить сообщение с вложением
         */
        sendWithAttachment(roomId, content, attachments) {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            const room = ChatRoom.find(roomId);
            if (!room) {
                return { success: false, error: 'Комната не найдена' };
            }

            // Определяем тип сообщения
            const isImage = attachments.every(a => a.type?.startsWith('image/'));
            const messageType = isImage ? MessageType.IMAGE : MessageType.FILE;

            const message = new ChatMessage({
                roomId,
                senderId: user.id,
                senderName: user.name || user.email,
                senderRole: user.role,
                type: messageType,
                content: content?.trim() || '',
                attachments,
                readBy: [user.id]
            });

            const result = message.save();
            if (!result.success) {
                return result;
            }

            room.updateLastMessage(message);

            return { success: true, message };
        },

        /**
         * Получить сообщения комнаты
         */
        getMessages(roomId, limit = 50, offset = 0) {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            const room = ChatRoom.find(roomId);
            if (!room) {
                return { success: false, error: 'Комната не найдена' };
            }

            const messages = ChatMessage.findByRoom(roomId, limit, offset);

            return { success: true, messages, total: messages.length };
        },

        /**
         * Отметить все сообщения как прочитанные
         */
        markAllAsRead(roomId) {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            const messages = ChatMessage.findByRoom(roomId, 1000, 0);
            let marked = 0;

            for (const msg of messages) {
                if (msg.senderId !== user.id && !msg.readBy.includes(user.id)) {
                    msg.markAsRead(user.id);
                    marked++;
                }
            }

            return { success: true, marked };
        },

        /**
         * Получить количество непрочитанных
         */
        getUnreadCount(roomId = null) {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'Не авторизован' };
            }

            if (roomId) {
                return {
                    success: true,
                    count: ChatMessage.getUnreadCount(roomId, user.id)
                };
            }

            return {
                success: true,
                count: ChatMessage.getTotalUnreadCount(user.id)
            };
        }
    };

    // ===== FILE UPLOAD HELPER =====
    const FileHelper = {
        /**
         * Загрузить файл и получить объект вложения
         * @param {File} file - File объект
         * @returns {Promise<Object>} attachment object
         */
        async upload(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const attachment = {
                        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: e.target.result // base64 data URL
                    };
                    resolve(attachment);
                };

                reader.onerror = () => reject(new Error('Ошибка чтения файла'));

                reader.readAsDataURL(file);
            });
        },

        /**
         * Загрузить несколько файлов
         */
        async uploadMultiple(files) {
            const attachments = [];
            for (const file of files) {
                const att = await this.upload(file);
                attachments.push(att);
            }
            return attachments;
        },

        /**
         * Форматировать размер файла
         */
        formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    };

    // ===== EXPORT =====
    window.ChatService = {
        Room: RoomAPI,
        Message: MessageAPI,
        File: FileHelper
    };

    console.log('✅ ChatService v1.0 loaded');
})();
