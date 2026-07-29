/**
 * QAZGOST AI - Configuration Module
 */

require('dotenv').config();

const config = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3001,

    // API
    api: {
        version: process.env.API_VERSION || 'v1'
    },

    // Database (PostgreSQL)
    db: {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'qazgost_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.DB_SSL === 'true',
        pool: {
            min: 2,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        }
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '30d'
    },

    // Twilio
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
        smsFrom: process.env.TWILIO_SMS_FROM
    },

    // CORS
    cors: {
        origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8080')
            .split(',')
            .map(s => s.trim())
    },

    // File Upload
    upload: {
        dir: process.env.UPLOAD_DIR || './uploads',
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf')
            .split(',')
            .map(s => s.trim())
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        file: process.env.LOG_FILE || './logs/app.log'
    },

    // Email (optional)
    email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.EMAIL_FROM
    },

    // Payments
    payments: {
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        },
        paybox: {
            merchantId: process.env.PAYBOX_MERCHANT_ID,
            secretKey: process.env.PAYBOX_SECRET_KEY
        },
        usdToKzt: parseInt(process.env.USD_TO_KZT_RATE) || 480
    }
};

// Validation
if (config.env === 'production') {
    if (config.jwt.secret === 'default-secret-change-in-production') {
        console.error('❌ FATAL: JWT_SECRET must be set in production!');
        process.exit(1);
    }
}

module.exports = config;
