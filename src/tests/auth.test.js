const request = require('supertest');
const app = require('../app');
const { getPool } = require('./setup');

describe('Authentication Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
    };

    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', testUser.email);
        });

        it('should not register user with existing email', async () => {
            // First registration
            await request(app).post('/api/register').send(testUser);
            
            // Attempt duplicate registration
            const response = await request(app)
                .post('/api/register')
                .send(testUser);

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/login', () => {
        beforeEach(async () => {
            // Register a user before each login test
            await request(app).post('/api/register').send(testUser);
        });

        it('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', testUser.email);
        });

        it('should not login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });
});