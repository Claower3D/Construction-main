/**
 * Request Logger Middleware
 */

const config = require('../config');

/**
 * Simple request logger
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    // Generate request ID
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);

    // Log on response finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')?.substring(0, 50)
        };

        // Color code by status
        let color = '\x1b[32m'; // Green
        if (res.statusCode >= 400) color = '\x1b[33m'; // Yellow
        if (res.statusCode >= 500) color = '\x1b[31m'; // Red

        if (config.env === 'development') {
            console.log(
                `${color}${logData.method.padEnd(7)}\x1b[0m`,
                logData.url.padEnd(40).substring(0, 40),
                `${res.statusCode}`,
                `${logData.duration}`
            );
        } else {
            console.log(JSON.stringify(logData));
        }
    });

    next();
}

module.exports = { requestLogger };
