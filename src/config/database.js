const { Pool } = require('pg');
require('dotenv').config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

const pool = new Pool({
    host: isTestEnvironment ? process.env.TEST_DB_HOST : process.env.DB_HOST,
    user: isTestEnvironment ? process.env.TEST_DB_USER : process.env.DB_USER,
    password: isTestEnvironment ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
    database: isTestEnvironment ? process.env.TEST_DB_NAME : process.env.DB_NAME,
    port: isTestEnvironment ? process.env.TEST_DB_PORT : process.env.DB_PORT,
    // Force IPv4
    family: 4
});

module.exports = pool;