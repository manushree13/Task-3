const { Client } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
    // Connect to default postgres database first
    const client = new Client({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
        port: process.env.DB_PORT || 5432
    });

    try {
        // Connect to PostgreSQL
        await client.connect();
        console.log('Connected to PostgreSQL');

        // Create main database if it doesn't exist
        try {
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log(`Created database: ${process.env.DB_NAME}`);
        } catch (err) {
            if (err.code === '42P04') {
                console.log(`Database ${process.env.DB_NAME} already exists`);
            } else {
                throw err;
            }
        }

        // Create test database if it doesn't exist
        try {
            await client.query(`CREATE DATABASE ${process.env.TEST_DB_NAME}`);
            console.log(`Created test database: ${process.env.TEST_DB_NAME}`);
        } catch (err) {
            if (err.code === '42P04') {
                console.log(`Test database ${process.env.TEST_DB_NAME} already exists`);
            } else {
                throw err;
            }
        }

        // Close connection to postgres database
        await client.end();

        // Now connect to each database and create schema
        const databases = [process.env.DB_NAME, process.env.TEST_DB_NAME];
        
        for (const dbName of databases) {
            const dbClient = new Client({
                host: '127.0.0.1',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: dbName,
                port: process.env.DB_PORT || 5432
            });

            try {
                await dbClient.connect();
                console.log(`Connected to ${dbName}`);

                // Create tables
                await dbClient.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        name VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS products (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        price DECIMAL(10,2) NOT NULL,
                        stock INTEGER NOT NULL DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS orders (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id),
                        total_amount DECIMAL(10,2) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS order_items (
                        id SERIAL PRIMARY KEY,
                        order_id INTEGER REFERENCES orders(id),
                        product_id INTEGER REFERENCES products(id),
                        quantity INTEGER NOT NULL,
                        price DECIMAL(10,2) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                console.log(`Created tables in ${dbName}`);
            } catch (err) {
                console.error(`Error setting up ${dbName}:`, err.message);
                throw err;
            } finally {
                await dbClient.end();
            }
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        console.error('\nTroubleshooting steps:');
        console.error('1. Make sure PostgreSQL is installed and running');
        console.error('2. Check your PostgreSQL credentials in .env file');
        console.error('3. Verify PostgreSQL port (default: 5432) is not in use');
        console.error('4. Try connecting manually: psql -U postgres');
        throw error;
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => console.log('Setup complete'))
        .catch(() => {
            console.error('Setup failed');
            process.exit(1);
        });
}

module.exports = initializeDatabase;