/**
 * QAZGOST AI - Main Server Entry Point
 * Production-ready Express.js + PostgreSQL + Redis + Socket.IO
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');

// Config & Database
const config = require('./config');
const { pool, testConnection } = require('./database/connection');
const { connectRedis, redisClient } = require('./database/redis');

// Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { rateLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const engineerRoutes = require('./routes/engineers');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const chatRoutes = require('./routes/chat');
const financeRoutes = require('./routes/finance');
const notificationRoutes = require('./routes/notifications');
const telegramRoutes = require('./routes/telegram');

// Socket.IO handlers
const { initSocketHandlers } = require('./socket');

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: config.cors.origins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

// ========== GLOBAL MIDDLEWARE ==========

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS
app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token']
}));

// Cookie parsing (for CSRF)
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== CSRF PROTECTION (Double-Submit Pattern) ==========
// Генерируем CSRF-токен для клиента и валидируем на POST/PUT/PATCH/DELETE
const crypto = require('crypto');

// Endpoint для получения CSRF-токена (клиент вызывает при загрузке)
app.get('/api/csrf-token', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    // Устанавливаем токен в cookie (SameSite=Strict для защиты)
    res.cookie('_csrf', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.env === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    });
    res.json({ csrfToken: token });
});

// Middleware проверки CSRF для мутирующих запросов
app.use((req, res, next) => {
    // Пропускаем безопасные методы
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Пропускаем webhook-и Stripe (они приходят от Stripe, не от клиента)
    if (req.path.includes('/stripe/webhook')) return next();

    // Пропускаем Telegram Bot API (API key auth, не cookies)
    if (req.path.startsWith('/api/telegram')) return next();

    // Пропускаем health check
    if (req.path === '/health') return next();

    // В dev-режиме — не блокируем (для удобства разработки)
    if (config.env === 'development') return next();

    // Проверяем X-CSRF-Token header vs cookie
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies?._csrf;

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        return res.status(403).json({ error: 'Недействительный CSRF-токен' });
    }

    next();
});

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', rateLimiter);

// Static files (uploads)
app.use('/uploads', express.static(config.upload.dir));

// ========== SWAGGER API DOCS ==========

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'QAZGOST AI API Docs',
    customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
        .swagger-ui .topbar-wrapper img { content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><text x="0" y="15" fill="white" font-size="14" font-weight="bold">🏗️ QAZGOST AI</text></svg>'); }
        .swagger-ui .info .title { color: #1a1a2e; }
    `,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        deepLinking: true
    }
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ========== API ROUTES ==========

const apiPrefix = `/api/${config.api.version}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/engineers`, engineerRoutes);
app.use(`${apiPrefix}/projects`, projectRoutes);
app.use(`${apiPrefix}/files`, fileRoutes);
app.use(`${apiPrefix}/chat`, chatRoutes);
app.use(`${apiPrefix}/finance`, financeRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use('/api/telegram', telegramRoutes); // Telegram bot API (no JWT, API key auth)

const { asyncHandler } = require('./middleware/errorHandler');
const stripeService = require('./services/stripePayment');
const { query: dbQuery, transaction: dbTransaction } = require('./database/connection');


// ========== STRIPE CHECKOUT (NO AUTH — public endpoint) ==========
app.post(`${apiPrefix}/finance/stripe/create-session`, asyncHandler(async (req, res) => {
    const { amount, type = 'topup', tariffId, userId, description } = req.body;

    const result = await stripeService.createCheckoutSession({
        amount: parseFloat(amount),
        userId: userId || 'anonymous',
        type,
        tariffId,
        description
    });

    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }

    // If demo mode — auto-credit wallet
    if (result.mode === 'demo' && result.userId !== 'anonymous') {
        try {
            await dbTransaction(async (client) => {
                let walletResult = await client.query(
                    `SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE`, [result.userId]
                );
                if (walletResult.rows.length === 0) {
                    walletResult = await client.query(
                        `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id`, [result.userId]
                    );
                }
                const amountCents = Math.round(result.amount * 100); // USD cents
                await client.query(
                    `UPDATE wallets SET balance_usd = balance_usd + $1 WHERE id = $2`,
                    [amountCents, walletResult.rows[0].id]
                );
                await client.query(
                    `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, metadata)
                     VALUES ($1, 'deposit', $2, 'USD', 'completed', $3, $4)`,
                    [walletResult.rows[0].id, amountCents, `Stripe Demo: $${result.amount}`,
                     JSON.stringify({ method: 'stripe_demo', type: result.type })]
                );
            });
        } catch (e) {
            console.warn('Demo wallet credit failed (DB may be offline):', e.message);
        }
    }

    res.json(result);
}));

// ========== STRIPE SESSION STATUS (NO AUTH) ==========
app.get(`${apiPrefix}/finance/stripe/session/:sessionId`, asyncHandler(async (req, res) => {
    const result = await stripeService.getSessionStatus(req.params.sessionId);
    if (!result.success) {
        return res.status(404).json({ error: result.error });
    }
    res.json(result);
}));

// ========== STRIPE CONFIG (public — publishable key for frontend) ==========
app.get(`${apiPrefix}/finance/stripe/config`, (req, res) => {
    res.json({
        publishableKey: stripeService.getPublishableKey(),
        configured: stripeService.isConfigured()
    });
});

// ========== STRIPE WEBHOOK (NO AUTH — Stripe calls directly) ==========
// IMPORTANT: This must use raw body parser, not JSON
app.post(`${apiPrefix}/finance/stripe/webhook`,
    express.raw({ type: 'application/json' }),
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const result = stripeService.constructWebhookEvent(req.body, sig);

        if (!result.success) {
            console.error('❌ Stripe webhook error:', result.error);
            return res.status(400).json({ error: result.error });
        }

        const event = result.event;
        console.log(`📨 Stripe event: ${event.type}`);

        // Handle checkout.session.completed
        if (event.type === 'checkout.session.completed') {
            const payment = stripeService.extractPaymentFromEvent(event);
            if (payment && payment.status === 'paid') {
                try {
                    await dbTransaction(async (client) => {
                        let walletResult = await client.query(
                            `SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE`, [payment.userId]
                        );
                        if (walletResult.rows.length === 0) {
                            walletResult = await client.query(
                                `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id`, [payment.userId]
                            );
                        }
                        const walletId = walletResult.rows[0].id;
                        const amountCents = Math.round(payment.amount * 100);

                        // Credit balance in USD
                        await client.query(
                            `UPDATE wallets SET balance_usd = balance_usd + $1 WHERE id = $2`,
                            [amountCents, walletId]
                        );

                        // Record transaction
                        await client.query(
                            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, metadata, completed_at)
                             VALUES ($1, 'deposit', $2, 'USD', 'completed', $3, $4, NOW())`,
                            [walletId, amountCents,
                             `Stripe Checkout: $${payment.amount}`,
                             JSON.stringify({
                                 method: 'stripe',
                                 sessionId: payment.sessionId,
                                 paymentIntent: payment.paymentIntent,
                                 type: payment.type,
                                 tariffId: payment.tariffId,
                                 email: payment.customerEmail
                             })]
                        );

                        console.log(`💳 Stripe payment credited: ${payment.userId} +$${payment.amount}`);
                    });
                } catch (e) {
                    console.error('❌ Stripe webhook DB error:', e.message);
                    // Return 500 so Stripe retries
                    return res.status(500).json({ error: 'DB error' });
                }
            }
        }

        res.json({ received: true });
    })
);

// ========== HEALTH CHECK ==========

app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();
    const redisStatus = redisClient?.isReady || false;

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.api.version,
        environment: config.env,
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'QAZGOST AI API',
        version: config.api.version,
        documentation: '/api/docs',
        openApiSpec: '/api/docs.json',
        endpoints: {
            auth: `${apiPrefix}/auth`,
            users: `${apiPrefix}/users`,
            orders: `${apiPrefix}/orders`,
            engineers: `${apiPrefix}/engineers`,
            projects: `${apiPrefix}/projects`,
            files: `${apiPrefix}/files`,
            chat: `${apiPrefix}/chat`,
            finance: `${apiPrefix}/finance`,
            notifications: `${apiPrefix}/notifications`
        }
    });
});

// ========== ERROR HANDLING ==========

app.use(notFound);
app.use(errorHandler);

// ========== SOCKET.IO ==========

initSocketHandlers(io);

// ========== START SERVER ==========

async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Database not connected - running in demo mode');
        }

        // Connect Redis (optional)
        await connectRedis().catch(err => {
            console.warn('⚠️  Redis not connected:', err.message);
        });

        // Start HTTP server
        httpServer.listen(config.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║           🏗️  QAZGOST AI Backend Server               ║
╠═══════════════════════════════════════════════════════╣
║  📍 Port:        ${config.port.toString().padEnd(35)}║
║  🌐 Environment: ${config.env.padEnd(35)}║
║  📊 API Version: ${config.api.version.padEnd(35)}║
║  🗄️  Database:   ${(dbConnected ? '✅ Connected' : '❌ Not connected').padEnd(35)}║
║  📦 Redis:       ${(redisClient?.isReady ? '✅ Connected' : '⚠️  Not connected').padEnd(35)}║
╠═══════════════════════════════════════════════════════╣
║  API Endpoints:                                       ║
║  • Auth:      ${apiPrefix}/auth                       ║
║  • Users:     ${apiPrefix}/users                      ║
║  • Orders:    ${apiPrefix}/orders                     ║
║  • Engineers: ${apiPrefix}/engineers                  ║
║  • Projects:  ${apiPrefix}/projects                   ║
║  • Chat:      ${apiPrefix}/chat                       ║
║  • Finance:   ${apiPrefix}/finance                    ║
║  📖 Swagger:  /api/docs                               ║
╚═══════════════════════════════════════════════════════╝
            `);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 Received SIGTERM, shutting down gracefully...');
    httpServer.close(() => {
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('📴 Received SIGINT, shutting down gracefully...');
    httpServer.close(() => {
        pool.end();
        process.exit(0);
    });
});

startServer();

module.exports = { app, httpServer, io };
