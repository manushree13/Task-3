const request = require('supertest');
const app = require('../app');
const { getPool } = require('./setup');

describe('Product Tests', () => {
    let authToken;
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
    };

    const testProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 100
    };

    beforeEach(async () => {
        // Register and get auth token for each test
        const response = await request(app)
            .post('/api/register')
            .send(testUser);
        authToken = response.body.token;
    });

    describe('POST /api/products', () => {
        it('should create a new product when authenticated', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testProduct);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('name', testProduct.name);
            expect(response.body).toHaveProperty('price', String(testProduct.price));
            expect(response.body).toHaveProperty('stock', testProduct.stock);
        });

        it('should not create product without authentication', async () => {
            const response = await request(app)
                .post('/api/products')
                .send(testProduct);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/products', () => {
        beforeEach(async () => {
            // Create a test product
            await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testProduct);
        });

        it('should get all products', async () => {
            const response = await request(app)
                .get('/api/products');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('name', testProduct.name);
        });

        it('should get a single product by id', async () => {
            const products = await request(app).get('/api/products');
            const productId = products.body[0].id;

            const response = await request(app)
                .get(`/api/products/${productId}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', testProduct.name);
        });
    });

    describe('PUT /api/products/:id', () => {
        let productId;

        beforeEach(async () => {
            const product = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testProduct);
            productId = product.body.id;
        });

        it('should update product when authenticated', async () => {
            const updates = { 
                name: 'Updated Product',
                price: 149.99,
                stock: 50
            };

            const response = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', updates.name);
            expect(response.body).toHaveProperty('price', String(updates.price));
            expect(response.body).toHaveProperty('stock', updates.stock);
        });
    });
});