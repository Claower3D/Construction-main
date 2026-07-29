/**
 * Create Database Script
 * Creates the qazgost_db database if it doesn't exist
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const config = require('../config');

async function createDatabase() {
    console.log('🔧 Creating database...\n');

    // Connect to default 'postgres' database to create our database
    const pool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: 'postgres',  // Connect to default postgres DB
        max: 1
    });

    try {
        // Check if database exists
        const checkResult = await pool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [config.db.name]
        );

        if (checkResult.rows.length === 0) {
            // Create database
            await pool.query(`CREATE DATABASE ${config.db.name}`);
            console.log(`✅ Database "${config.db.name}" created successfully!`);
        } else {
            console.log(`✅ Database "${config.db.name}" already exists.`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createDatabase().then(() => process.exit(0));
