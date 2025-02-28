const { Client } = require('pg');
require('dotenv').config();

async function checkConnection() {
    const client = new Client({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
        port: process.env.DB_PORT || 5432,
        connectionTimeoutMillis: 5000
    });

    console.log('Attempting to connect to PostgreSQL...');
    console.log('Connection settings:', {
        host: '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        database: 'postgres',
        port: process.env.DB_PORT || 5432
    });

    try {
        await client.connect();
        console.log('Successfully connected to PostgreSQL');
        
        // Check server version
        const versionRes = await client.query('SELECT version()');
        console.log('PostgreSQL server version:', versionRes.rows[0].version);
        
        // List databases
        const dbListRes = await client.query('SELECT datname FROM pg_database');
        console.log('\nAvailable databases:', dbListRes.rows.map(row => row.datname));
        
        // Test database creation permissions
        try {
            await client.query('CREATE DATABASE connection_test');
            console.log('Successfully created test database');
            await client.query('DROP DATABASE connection_test');
            console.log('Successfully cleaned up test database');
        } catch (err) {
            console.log('Note: Could not create test database:', err.message);
            console.log('You may need superuser privileges to create databases');
        }

        await client.end();
        return true;
    } catch (err) {
        console.error('\nConnection failed:', err.message);
        console.error('\nTroubleshooting steps:');
        console.error('1. Verify PostgreSQL is installed:');
        console.error('   - Open Services (Windows + R, type "services.msc")');
        console.error('   - Look for "PostgreSQL" service');
        console.error('   - Make sure it\'s running');
        console.error('\n2. Check credentials:');
        console.error('   - Verify the password in .env matches your PostgreSQL password');
        console.error('   - Default user is usually "postgres"');
        console.error('\n3. Check port:');
        console.error('   - Default PostgreSQL port is 5432');
        console.error('   - Make sure no other service is using this port');
        console.error('\n4. Try connecting manually:');
        console.error('   - Open Command Prompt');
        console.error('   - Run: psql -U postgres -h 127.0.0.1');
        
        return false;
    }
}

// Run if executed directly
if (require.main === module) {
    checkConnection().then(success => {
        if (!success) {
            process.exit(1);
        }
    });
}

module.exports = checkConnection;