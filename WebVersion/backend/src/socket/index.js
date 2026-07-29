/**
 * Socket.IO Handlers
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../database/connection');

/**
 * Initialize Socket.IO handlers
 */
function initSocketHandlers(io) {
    // Authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret);

            if (decoded.type !== 'access') {
                return next(new Error('Invalid token type'));
            }

            // Get user
            const result = await query(
                `SELECT id, phone, first_name, last_name, role FROM users WHERE id = $1`,
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                return next(new Error('User not found'));
            }

            socket.user = result.rows[0];
            next();

        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.user.id}`);

        // Join user's personal room
        socket.join(`user_${socket.user.id}`);

        // Join chat room
        socket.on('join_room', async (roomId) => {
            // Validate access to room
            const [type, id] = roomId.split('_');
            let hasAccess = false;

            if (type === 'order') {
                const result = await query(
                    `SELECT 1 FROM orders WHERE id = $1 AND (customer_id = $2 OR executor_id = $2)`,
                    [id, socket.user.id]
                );
                hasAccess = result.rows.length > 0;
            } else if (type === 'project') {
                const result = await query(
                    `SELECT 1 FROM engineer_projects WHERE id = $1 AND (customer_id = $2 OR engineer_id = $2)`,
                    [id, socket.user.id]
                );
                hasAccess = result.rows.length > 0;
            }

            if (hasAccess) {
                socket.join(roomId);
                console.log(`👤 ${socket.user.id} joined room: ${roomId}`);
            }
        });

        // Leave chat room
        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            console.log(`👤 ${socket.user.id} left room: ${roomId}`);
        });

        // Send chat message
        socket.on('chat_message', async (data) => {
            const { roomId, text } = data;

            if (!text || !roomId) return;

            const [type, id] = roomId.split('_');
            const senderName = `${socket.user.first_name || ''} ${socket.user.last_name || ''}`.trim() || 'Пользователь';

            try {
                // Save to database
                const result = await query(
                    `INSERT INTO chat_messages (room_id, ${type}_id, sender_id, sender_name, text)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, created_at`,
                    [roomId, id, socket.user.id, senderName, text.trim()]
                );

                const message = {
                    id: result.rows[0].id,
                    text: text.trim(),
                    sender: {
                        id: socket.user.id,
                        name: senderName
                    },
                    createdAt: result.rows[0].created_at
                };

                // Broadcast to room
                io.to(roomId).emit('new_message', message);

            } catch (error) {
                console.error('Error saving chat message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing_start', (roomId) => {
            socket.to(roomId).emit('user_typing', {
                userId: socket.user.id,
                name: `${socket.user.first_name || ''} ${socket.user.last_name || ''}`.trim()
            });
        });

        socket.on('typing_stop', (roomId) => {
            socket.to(roomId).emit('user_stopped_typing', {
                userId: socket.user.id
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.user.id}`);
        });
    });

    console.log('✅ Socket.IO handlers initialized');
}

/**
 * Send notification to user via socket
 */
function sendNotification(io, userId, notification) {
    io.to(`user_${userId}`).emit('notification', notification);
}

/**
 * Broadcast to specific room
 */
function broadcastToRoom(io, roomId, event, data) {
    io.to(roomId).emit(event, data);
}

module.exports = {
    initSocketHandlers,
    sendNotification,
    broadcastToRoom
};
