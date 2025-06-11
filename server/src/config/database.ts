import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma client instance for database operations
 * Implements singleton pattern to prevent multiple connections
 */
declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient | undefined
}

/**
 * Initialize Prisma client with appropriate configuration
 * Based on environment (development vs production)
 */
const createPrismaClient = (): PrismaClient => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        errorFormat: 'pretty'
    })
}

/**
 * Database client instance
 * Uses global variable in development to prevent hot reload issues
 */
const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma
}

/**
 * Graceful database connection shutdown
 * Should be called when the application is terminating
 */
const disconnectDatabase = async (): Promise<void> => {
    await prisma.$disconnect()
}

/**
 * Test database connection
 * Useful for health checks and startup verification
 */
const testDatabaseConnection = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`
        return true
    } catch (error) {
        console.error('Database connection test failed:', error)
        return false
    }
}

export { prisma, disconnectDatabase, testDatabaseConnection } 