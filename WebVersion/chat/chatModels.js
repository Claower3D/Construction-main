// ========== CHAT MODELS v1.0 ==========
// Модели данных для модуля чата
// Поддержка: текст, вложения, статусы прочтения

(function () {
    'use strict';

    // ===== STORAGE KEY =====
    const STORAGE_KEYS = {
        ROOMS: 'chat_rooms',
        MESSAGES: 'chat_messages',
        PARTICIPANTS: 'chat_participants'
    };

    // ===== ENUMS =====
    const MessageType = Object.freeze({
        TEXT: 'TEXT',
        IMAGE: 'IMAGE',
        FILE: 'FILE',
        SYSTEM: 'SYSTEM' // Системные сообщения (статус изменился и т.п.)
    });

    const MessageStatus = Object.freeze({
        SENT: 'SENT',
        DELIVERED: 'DELIVERED',
        READ: 'READ'
    });

    const RoomType = Object.freeze({
        ORDER: 'ORDER',           // Чат по заказу (заказчик-подрядчик)
        SUPPORT: 'SUPPORT',       // Чат с инженером/поддержкой
        VIP_PROJECT: 'VIP_PROJECT' // Чат по VIP проекту
    });

    // ===== STORAGE HELPER =====
    const ChatStorage = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch {
                return [];
            }
        },

        set(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.error('ChatStorage.set error:', e);
            }
        },

        generateId(prefix = 'chat_') {
            return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ===== MODEL: ChatRoom =====
    class ChatRoom {
        constructor(data = {}) {
            this.id = data.id || ChatStorage.generateId('room_');
            this.type = data.type || RoomType.ORDER;
            this.refType = data.refType || 'Order';      // Order, VipProject, EngineeringRequest
            this.refId = data.refId || null;             // ID связанной сущности
            this.title = data.title || 'Чат';
            this.participantIds = data.participantIds || [];
            this.lastMessageAt = data.lastMessageAt || null;
            this.lastMessagePreview = data.lastMessagePreview || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.refId) errors.push('refId обязателен');
            if (this.participantIds.length < 2) errors.push('Минимум 2 участника');
            return errors;
        }

        save() {
            const errors = this.validate();
            if (errors.length) return { success: false, errors };

            this.updatedAt = new Date().toISOString();
            const all = ChatStorage.get(STORAGE_KEYS.ROOMS);
            const idx = all.findIndex(r => r.id === this.id);

            if (idx >= 0) {
                all[idx] = { ...this };
            } else {
                all.push({ ...this });
            }

            ChatStorage.set(STORAGE_KEYS.ROOMS, all);
            return { success: true, room: this };
        }

        updateLastMessage(message) {
            this.lastMessageAt = message.createdAt;
            this.lastMessagePreview = message.type === MessageType.TEXT
                ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                : message.type === MessageType.IMAGE ? '📷 Фото' : '📎 Файл';
            return this.save();
        }

        static find(id) {
            const all = ChatStorage.get(STORAGE_KEYS.ROOMS);
            const data = all.find(r => r.id === id);
            return data ? new ChatRoom(data) : null;
        }

        static findByRef(refType, refId) {
            const all = ChatStorage.get(STORAGE_KEYS.ROOMS);
            const data = all.find(r => r.refType === refType && r.refId === refId);
            return data ? new ChatRoom(data) : null;
        }

        static findByUser(userId) {
            const all = ChatStorage.get(STORAGE_KEYS.ROOMS);
            return all
                .filter(r => r.participantIds.includes(userId))
                .map(r => new ChatRoom(r))
                .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
        }

        static getAll() {
            return ChatStorage.get(STORAGE_KEYS.ROOMS).map(r => new ChatRoom(r));
        }
    }

    // ===== MODEL: ChatMessage =====
    class ChatMessage {
        constructor(data = {}) {
            this.id = data.id || ChatStorage.generateId('msg_');
            this.roomId = data.roomId || null;
            this.senderId = data.senderId || null;
            this.senderName = data.senderName || '';
            this.senderRole = data.senderRole || '';    // customer, executor, engineer
            this.type = data.type || MessageType.TEXT;
            this.content = data.content || '';
            this.attachments = data.attachments || [];   // [{ id, name, type, url, size }]
            this.status = data.status || MessageStatus.SENT;
            this.readBy = data.readBy || [];             // [userId, ...]
            this.replyToId = data.replyToId || null;     // ID сообщения, на которое отвечаем
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.roomId) errors.push('roomId обязателен');
            if (!this.senderId) errors.push('senderId обязателен');
            if (this.type === MessageType.TEXT && !this.content.trim()) {
                errors.push('Сообщение не может быть пустым');
            }
            if ((this.type === MessageType.IMAGE || this.type === MessageType.FILE) && !this.attachments.length) {
                errors.push('Нужно прикрепить файл');
            }
            return errors;
        }

        save() {
            const errors = this.validate();
            if (errors.length) return { success: false, errors };

            this.updatedAt = new Date().toISOString();
            const all = ChatStorage.get(STORAGE_KEYS.MESSAGES);
            const idx = all.findIndex(m => m.id === this.id);

            if (idx >= 0) {
                all[idx] = { ...this };
            } else {
                all.push({ ...this });
            }

            ChatStorage.set(STORAGE_KEYS.MESSAGES, all);
            return { success: true, message: this };
        }

        markAsRead(userId) {
            if (!this.readBy.includes(userId)) {
                this.readBy.push(userId);
                this.status = MessageStatus.READ;
                return this.save();
            }
            return { success: true };
        }

        static find(id) {
            const all = ChatStorage.get(STORAGE_KEYS.MESSAGES);
            const data = all.find(m => m.id === id);
            return data ? new ChatMessage(data) : null;
        }

        static findByRoom(roomId, limit = 50, offset = 0) {
            const all = ChatStorage.get(STORAGE_KEYS.MESSAGES);
            return all
                .filter(m => m.roomId === roomId)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .slice(offset, offset + limit)
                .map(m => new ChatMessage(m));
        }

        static getUnreadCount(roomId, userId) {
            const all = ChatStorage.get(STORAGE_KEYS.MESSAGES);
            return all.filter(m =>
                m.roomId === roomId &&
                m.senderId !== userId &&
                !m.readBy.includes(userId)
            ).length;
        }

        static getTotalUnreadCount(userId) {
            const rooms = ChatRoom.findByUser(userId);
            let total = 0;
            for (const room of rooms) {
                total += ChatMessage.getUnreadCount(room.id, userId);
            }
            return total;
        }

        static deleteByRoom(roomId) {
            const all = ChatStorage.get(STORAGE_KEYS.MESSAGES);
            const filtered = all.filter(m => m.roomId !== roomId);
            ChatStorage.set(STORAGE_KEYS.MESSAGES, filtered);
        }
    }

    // ===== MODEL: ChatParticipant =====
    class ChatParticipant {
        constructor(data = {}) {
            this.id = data.id || ChatStorage.generateId('part_');
            this.roomId = data.roomId || null;
            this.userId = data.userId || null;
            this.userName = data.userName || '';
            this.userRole = data.userRole || '';
            this.isOnline = data.isOnline || false;
            this.lastSeenAt = data.lastSeenAt || null;
            this.joinedAt = data.joinedAt || new Date().toISOString();
        }

        save() {
            const all = ChatStorage.get(STORAGE_KEYS.PARTICIPANTS);
            const idx = all.findIndex(p => p.roomId === this.roomId && p.userId === this.userId);

            if (idx >= 0) {
                all[idx] = { ...this };
            } else {
                all.push({ ...this });
            }

            ChatStorage.set(STORAGE_KEYS.PARTICIPANTS, all);
            return { success: true };
        }

        static findByRoom(roomId) {
            const all = ChatStorage.get(STORAGE_KEYS.PARTICIPANTS);
            return all.filter(p => p.roomId === roomId).map(p => new ChatParticipant(p));
        }

        static findByUser(userId) {
            const all = ChatStorage.get(STORAGE_KEYS.PARTICIPANTS);
            return all.filter(p => p.userId === userId).map(p => new ChatParticipant(p));
        }
    }

    // ===== EXPORT =====
    window.ChatModels = {
        ChatRoom,
        ChatMessage,
        ChatParticipant,
        MessageType,
        MessageStatus,
        RoomType,
        ChatStorage,
        STORAGE_KEYS
    };

    console.log('✅ ChatModels v1.0 loaded');
})();
