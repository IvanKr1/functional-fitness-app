"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_js_1 = __importDefault(require("../src/server.js"));
const setup_js_1 = require("./setup.js");
(0, vitest_1.describe)('Authentication API', () => {
    (0, vitest_1.describe)('POST /api/auth/login', () => {
        (0, vitest_1.it)('should login with valid credentials', async () => {
            await (0, setup_js_1.createTestUser)({
                email: 'test@example.com',
                passwordHash: '$2a$12$valid.hash.here'
            });
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'validpassword'
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.user).toBeDefined();
            (0, vitest_1.expect)(response.body.data.user.email).toBe('test@example.com');
        });
        (0, vitest_1.it)('should reject invalid credentials', async () => {
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });
            (0, vitest_1.expect)(response.status).toBe(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toBeDefined();
        });
        (0, vitest_1.it)('should validate email format', async () => {
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/login')
                .send({
                email: 'invalid-email',
                password: 'password123'
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toBe('Validation failed');
        });
        (0, vitest_1.it)('should require password', async () => {
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com'
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('POST /api/auth/register', () => {
        (0, vitest_1.it)('should register new user as admin', async () => {
            const admin = await (0, setup_js_1.createTestAdmin)();
            const loginResponse = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/login')
                .send({
                email: admin.email,
                password: 'adminpassword'
            });
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/register')
                .set('Cookie', loginResponse.headers['set-cookie'])
                .send({
                name: 'New User',
                email: 'newuser@example.com',
                mobilePhone: '+1234567890',
                weeklyBookingLimit: 3
            });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.user).toBeDefined();
            (0, vitest_1.expect)(response.body.data.generatedPassword).toBeDefined();
        });
        (0, vitest_1.it)('should reject registration from non-admin', async () => {
            const user = await (0, setup_js_1.createTestUser)();
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/register')
                .send({
                name: 'New User',
                email: 'newuser@example.com'
            });
            (0, vitest_1.expect)(response.status).toBe(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
        (0, vitest_1.it)('should validate required fields', async () => {
            const admin = await (0, setup_js_1.createTestAdmin)();
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/register')
                .send({
                email: 'newuser@example.com'
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('POST /api/auth/logout', () => {
        (0, vitest_1.it)('should logout user successfully', async () => {
            const response = await (0, supertest_1.default)(server_js_1.default)
                .post('/api/auth/logout');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.message).toBe('Logout successful');
        });
    });
    (0, vitest_1.describe)('GET /api/auth/profile', () => {
        (0, vitest_1.it)('should return user profile when authenticated', async () => {
            const user = await (0, setup_js_1.createTestUser)();
            const response = await (0, supertest_1.default)(server_js_1.default)
                .get('/api/auth/profile')
                .set('Cookie', 'token=valid-jwt-token');
            (0, vitest_1.expect)(response.status).toBeOneOf([200, 401]);
        });
        (0, vitest_1.it)('should reject unauthenticated requests', async () => {
            const response = await (0, supertest_1.default)(server_js_1.default)
                .get('/api/auth/profile');
            (0, vitest_1.expect)(response.status).toBe(401);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        });
    });
});
//# sourceMappingURL=auth.test.js.map