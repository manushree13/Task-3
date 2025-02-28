const request = require('supertest');
const app = require('../app');
const { getPool } = require('./setup');

describe('Order Tests', () => {
    let authToken;
    let productId;
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
        // Register and get auth token
        const userResponse = await request(app)
            .post('/api/register')
            .send(testUser);
        authToken = userResponse.body.token;

        // Create test product
        const productResponse = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${authToken}`)
            .send(testProduct);
        productId = productResponse.body.id;
    });

    describe('POST /api/orders', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                items: [
                    {
                        productId: productId,
                        quantity: 2
                    }
                ]
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('total_amount');
            expect(parseFloat(response.body.total_amount)).toBe(testProduct.price * 2);
        });

        it('should not create order with insufficient stock', async () => {
            const orderData = {
                items: [
                    {
                        productId: productId,
                        quantity: testProduct.stock + 1 // More than available stock
                    }
                ]
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/orders', () => {
        beforeEach(async () => {
            // Create a test order
            const orderData = {
                items: [
                    {
                        productId: productId,
                        quantity: 1
                    }
                ]
            };

            await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);
        });

        it('should get user orders', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('items');
            expect(response.body[0].items).toHaveLength(1);
            expect(response.body[0].items[0]).toHaveProperty('product_id', productId);
        });
    });

    describe('PATCH /api/orders/:orderId/status', () => {
        let orderId;

        beforeEach(async () => {
            const orderData = {
                items: [
                    {
                        productId: productId,
                        quantity: 1
                    }
                ]
            };

            const orderResponse = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData);
            
            orderId = orderResponse.body.id;
        });

        it('should update order status', async () => {
            const response = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'completed');
        });

        it('should not update non-existent order', async () => {
            const response = await request(app)
                .patch(`/api/orders/99999/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'completed' });

            expect(response.status).toBe(404);
        });
    });
});