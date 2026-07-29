/**
 * Redis Connection
 */

const Redis = require('ioredis');
const config = require('../config');

let redisClient = null;
let redisDisabled = false;

/**
 * Connect to Redis
 */
async function connectRedis() {
    if (process.env.DISABLE_REDIS === 'true') {
        return null;
    }
    if (redisDisabled) {
        return null;
    }
    if (redisClient && redisClient.status === 'ready') {
        return redisClient;
    }

    try {
        redisClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password || undefined,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 1) {
                    redisDisabled = true;
                    return null; // Stop retrying
                }
                return 100;
            },
            lazyConnect: true,
            enableOfflineQueue: false
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        redisClient.on('error', (err) => {
            if (!redisDisabled) {
                console.warn('⚠️  Redis unavailable:', err.message);
                redisDisabled = true;
            }
        });

        await redisClient.connect();
        return redisClient;

    } catch (error) {
        console.warn('⚠️  Redis connection failed - continuing without cache');
        redisDisabled = true;
        return null;
    }
}

/**
 * Get cached value
 */
async function getCache(key) {
    if (!redisClient || redisClient.status !== 'ready') return null;
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
}

/**
 * Set cache value
 */
async function setCache(key, value, ttlSeconds = 300) {
    if (!redisClient || redisClient.status !== 'ready') return false;
    try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
}

/**
 * Delete cache
 */
async function deleteCache(key) {
    if (!redisClient || redisClient.status !== 'ready') return false;
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Redis delete error:', error);
        return false;
    }
}

/**
 * Clear cache by pattern
 */
async function clearCachePattern(pattern) {
    if (!redisClient || redisClient.status !== 'ready') return false;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
        }
        return true;
    } catch (error) {
        console.error('Redis clear pattern error:', error);
        return false;
    }
}

/**
 * Publish message to channel
 */
async function publish(channel, message) {
    if (!redisClient || redisClient.status !== 'ready') return false;
    try {
        await redisClient.publish(channel, JSON.stringify(message));
        return true;
    } catch (error) {
        console.error('Redis publish error:', error);
        return false;
    }
}

module.exports = {
    connectRedis,
    redisClient,
    getCache,
    setCache,
    deleteCache,
    clearCachePattern,
    publish
};
