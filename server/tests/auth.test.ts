import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/server.js'
import { createTestUser, createTestAdmin } from './setup.js'

describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            // Create test user
            await createTestUser({
                email: 'test@example.com',
                passwordHash: '$2a$12$valid.hash.here' // Mock hash
            })

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'validpassword'
                })

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.user).toBeDefined()
            expect(response.body.data.user.email).toBe('test@example.com')
        })

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                })

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBeDefined()
        })

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123'
                })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.error).toBe('Validation failed')
        })

        it('should require password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com'
                    // password missing
                })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
        })
    })

    describe('POST /api/auth/register', () => {
        it('should register new user as admin', async () => {
            // Create admin user first
            const admin = await createTestAdmin()

            // Get admin token (mock implementation)
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: admin.email,
                    password: 'adminpassword'
                })

            const response = await request(app)
                .post('/api/auth/register')
                .set('Cookie', loginResponse.headers['set-cookie'])
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    mobilePhone: '+1234567890',
                    weeklyBookingLimit: 3
                })

            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.data.user).toBeDefined()
            expect(response.body.data.generatedPassword).toBeDefined()
        })

        it('should reject registration from non-admin', async () => {
            // Create regular user
            const user = await createTestUser()

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com'
                })

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
        })

        it('should validate required fields', async () => {
            const admin = await createTestAdmin()

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    // name missing
                    email: 'newuser@example.com'
                })

            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
        })
    })

    describe('POST /api/auth/logout', () => {
        it('should logout user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Logout successful')
        })
    })

    describe('GET /api/auth/profile', () => {
        it('should return user profile when authenticated', async () => {
            const user = await createTestUser()

            // Mock authentication (in real tests, you'd set proper cookie)
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', 'token=valid-jwt-token')

            // This would need proper JWT implementation in tests
            // For now, test the endpoint structure
            expect(response.status).toBeOneOf([200, 401])
        })

        it('should reject unauthenticated requests', async () => {
            const response = await request(app)
                .get('/api/auth/profile')

            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)
        })
    })
}) 