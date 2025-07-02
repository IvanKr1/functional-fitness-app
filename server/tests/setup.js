"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestBooking = exports.createTestAdmin = exports.createTestUser = void 0;
const vitest_1 = require("vitest");
const database_js_1 = require("../src/config/database.js");
(0, vitest_1.beforeAll)(async () => {
    process.env.NODE_ENV = 'test';
    try {
        await database_js_1.prisma.$connect();
        console.log('Test database connected');
    }
    catch (error) {
        console.error('Test database connection failed:', error);
        throw error;
    }
});
(0, vitest_1.beforeEach)(async () => {
    await cleanDatabase();
});
(0, vitest_1.afterAll)(async () => {
    await cleanDatabase();
    await database_js_1.prisma.$disconnect();
    console.log('Test database disconnected');
});
async function cleanDatabase() {
    const tablenames = await database_js_1.prisma.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');
    if (tables) {
        try {
            await database_js_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        }
        catch (error) {
            console.log({ error });
        }
    }
}
const createTestUser = async (overrides = {}) => {
    return await database_js_1.prisma.user.create({
        data: {
            name: 'Test User',
            email: 'test@example.com',
            passwordHash: '$2a$12$test.hash.here',
            role: 'USER',
            weeklyBookingLimit: 2,
            ...overrides
        }
    });
};
exports.createTestUser = createTestUser;
const createTestAdmin = async (overrides = {}) => {
    return await database_js_1.prisma.user.create({
        data: {
            name: 'Test Admin',
            email: 'admin@example.com',
            passwordHash: '$2a$12$test.hash.here',
            role: 'ADMIN',
            weeklyBookingLimit: 10,
            ...overrides
        }
    });
};
exports.createTestAdmin = createTestAdmin;
const createTestBooking = async (userId, overrides = {}) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return await database_js_1.prisma.booking.create({
        data: {
            userId,
            startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
            endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
            status: 'CONFIRMED',
            ...overrides
        }
    });
};
exports.createTestBooking = createTestBooking;
//# sourceMappingURL=setup.js.map