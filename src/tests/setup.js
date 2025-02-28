const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const checkConnection = require('../config/check-db');
require('dotenv').config();

let testPool = null;

const setupTestDatabase = async () => {
    console.log('Setting up test database...');
    
    // First check basic PostgreSQL connection
    const isConnected = await checkConnection();
    if (!isConnected) {
        throw new Error('Cannot proceed with tests: PostgreSQL connection failed');
    }

    // Create pool for test database operations
    testPool = new Pool({
        host: '127.0.0.1',
        user: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        database: process.env.TEST_DB_NAME || 'ecommerce_test_db',
        port: process.env.TEST_DB_PORT || 5432,
        connectionTimeoutMillis: 5000
    });

    try {
        // Test the connection
        await testPool.query('SELECT 1');
        console.log('Successfully connected to test database');
    } catch (error) {
        console.error('Failed to connect to test database:', error.message);
        throw error;
    }
};

const clearTables = async () => {
    if (!testPool) {
        throw new Error('Database pool not initialized');
    }

    try {
        // Terminate all connections to the tables we want to drop
        await testPool.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [process.env.TEST_DB_NAME || 'ecommerce_test_db']);

        // Drop tables in correct order
        await testPool.query('DROP TABLE IF EXISTS order_items CASCADE');
        await testPool.query('DROP TABLE IF EXISTS orders CASCADE');
        await testPool.query('DROP TABLE IF EXISTS products CASCADE');
        await testPool.query('DROP TABLE IF EXISTS users CASCADE');
        
        console.log('Tables cleared successfully');
    } catch (error) {
        console.error('Error clearing tables:', error.message);
        throw error;
    }
};

const initializeTables = async () => {
    if (!testPool) {
        throw new Error('Database pool not initialized');
    }

    try {
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await testPool.query(schema);
        console.log('Schema initialized successfully');
    } catch (error) {
        console.error('Error initializing schema:', error.message);
        throw error;
    }
};

beforeAll(async () => {
    try {
        await setupTestDatabase();
        await clearTables();
        await initializeTables();
    } catch (error) {
        console.error('Test setup failed:', error);
        throw error;
    }
}, 30000);

beforeEach(async () => {
    try {
        await clearTables();
        await initializeTables();
    } catch (error) {
        console.error('Test preparation failed:', error);
        throw error;
    }
});

afterAll(async () => {
    if (testPool) {
        try {
            await clearTables();
            await testPool.end();
        } catch (error) {
            console.error('Test cleanup failed:', error);
            throw error;
        }
    }
});

module.exports = {
    getPool: () => testPool
};