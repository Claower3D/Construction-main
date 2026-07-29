/**
 * Rate Limiter Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API rate limiter
 */
const rateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        error: {
            message: 'Слишком много запросов. Попробуйте позже.',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    }
});

/**
 * Auth endpoints rate limiter (stricter)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.rateLimit.authMax,
    message: {
        success: false,
        error: {
            message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Proposal/action rate limiter
 */
const actionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        success: false,
        error: {
            message: 'Слишком много действий. Подождите минуту.',
            statusCode: 429
        }
    }
});

module.exports = {
    rateLimiter,
    authLimiter,
    actionLimiter
};
