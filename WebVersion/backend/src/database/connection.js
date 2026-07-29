/**
 * PostgreSQL Database Connection
 */

const { Pool } = require('pg');
const config = require('../config');

// Create connection pool
const pool = new Pool({
    connectionString: config.db.url,
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
    ...config.db.pool
});

// Connection event handlers
pool.on('connect', () => {
    console.log('📌 New PostgreSQL client connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
});

/**
 * Test database connection
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ PostgreSQL connected:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
}

/**
 * Execute query with timing
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        if (config.env === 'development' && duration > 100) {
            console.log('🐢 Slow query:', { text, duration: `${duration}ms`, rows: result.rowCount });
        }

        return result;
    } catch (error) {
        console.error('Query error:', { text, error: error.message });
        throw error;
    }
}

/**
 * Get client for transaction
 */
async function getClient() {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    // Timeout for client release
    const timeout = setTimeout(() => {
        console.error('⚠️  Client not released within 5 seconds!');
        console.trace();
    }, 5000);

    // Override release to clear timeout
    client.release = () => {
        clearTimeout(timeout);
        return originalRelease();
    };

    return client;
}

/**
 * Execute transaction
 */
async function transaction(callback) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    query,
    getClient,
    transaction,
    testConnection
};
