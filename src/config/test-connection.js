const { exec } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

async function testPsqlConnection() {
    return new Promise((resolve) => {
        exec('psql -V', (error, stdout, stderr) => {
            console.log('\n=== PostgreSQL Installation Check ===');
            if (error) {
                console.log('psql is not installed or not in PATH');
                console.log('Please install PostgreSQL and add it to your PATH');
                resolve(false);
                return;
            }
            console.log('PostgreSQL client version:', stdout.trim());
            resolve(true);
        });
    });
}

async function testNodeConnection() {
    const client = new Client({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
        port: process.env.DB_PORT || 5432,
        connectionTimeoutMillis: 3000
    });

    console.log('\n=== Node.js Connection Test ===');
    console.log('Attempting to connect with settings:');
    console.log('Host:', '127.0.0.1');
    console.log('User:', process.env.DB_USER || 'postgres');
    console.log('Database:', 'postgres');
    console.log('Port:', process.env.DB_PORT || 5432);

    try {
        await client.connect();
        console.log('Successfully connected to PostgreSQL');
        await client.end();
        return true;
    } catch (err) {
        console.error('Connection failed:', err.message);
        return false;
    }
}

async function testConnections() {
    console.log('Starting comprehensive PostgreSQL connection test...');
    
    const psqlInstalled = await testPsqlConnection();
    const nodeConnected = await testNodeConnection();

    console.log('\n=== Test Results ===');
    console.log('PostgreSQL installed:', psqlInstalled ? 'Yes' : 'No');
    console.log('Node.js can connect:', nodeConnected ? 'Yes' : 'No');

    if (!psqlInstalled || !nodeConnected) {
        console.log('\n=== Troubleshooting Steps ===');
        console.log('1. Check PostgreSQL installation:');
        console.log('   - Open Services (Win + R, type "services.msc")');
        console.log('   - Find "PostgreSQL" service');
        console.log('   - Ensure it\'s running');
        console.log('\n2. Verify credentials in .env file:');
        console.log('   - Check DB_USER (default: postgres)');
        console.log('   - Verify DB_PASSWORD matches your PostgreSQL password');
        console.log('   - Confirm DB_PORT (default: 5432)');
        console.log('\n3. Try manual connection:');
        console.log('   - Open Command Prompt');
        console.log('   - Run: psql -U postgres');
        process.exit(1);
    }
}

testConnections().catch(console.error);