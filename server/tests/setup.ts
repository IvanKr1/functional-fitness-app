import { beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../src/config/database.js'

/**
 * Global test setup and teardown
 */

beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test'

    // Test database connection
    try {
        await prisma.$connect()
        console.log('Test database connected')
    } catch (error) {
        console.error('Test database connection failed:', error)
        throw error
    }
})

beforeEach(async () => {
    // Clean up database before each test
    await cleanDatabase()
})

afterAll(async () => {
    // Clean up and disconnect
    await cleanDatabase()
    await prisma.$disconnect()
    console.log('Test database disconnected')
})

/**
 * Clean all tables in the correct order to avoid foreign key constraints
 */
async function cleanDatabase(): Promise<void> {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ')

    if (tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
        } catch (error) {
            console.log({ error })
        }
    }
}

/**
 * Create test user helper
 */
export const createTestUser = async (overrides: any = {}) => {
    return await prisma.user.create({
        data: {
            name: 'Test User',
            email: 'test@example.com',
            passwordHash: '$2a$12$test.hash.here',
            role: 'USER',
            weeklyBookingLimit: 2,
            ...overrides
        }
    })
}

/**
 * Create test admin helper
 */
export const createTestAdmin = async (overrides: any = {}) => {
    return await prisma.user.create({
        data: {
            name: 'Test Admin',
            email: 'admin@example.com',
            passwordHash: '$2a$12$test.hash.here',
            role: 'ADMIN',
            weeklyBookingLimit: 10,
            ...overrides
        }
    })
}

/**
 * Create test booking helper
 */
export const createTestBooking = async (userId: string, overrides: any = {}) => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return await prisma.booking.create({
        data: {
            userId,
            startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
            endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
            status: 'CONFIRMED',
            ...overrides
        }
    })
} 