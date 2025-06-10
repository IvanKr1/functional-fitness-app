import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenv.config()

/**
 * Environment variables validation schema
 * Ensures all required configuration is present and properly typed
 */
const configSchema = z.object({
    // Server configuration
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),

    // Database
    DATABASE_URL: z.string().min(1, 'Database URL is required'),

    // JWT configuration
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Cookie configuration
    COOKIE_SECRET: z.string().min(32, 'Cookie secret must be at least 32 characters'),

    // Admin credentials for seeding
    ADMIN_EMAIL: z.string().email().default('admin@gym.com'),
    ADMIN_PASSWORD: z.string().min(6).default('admin123'),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),

    // CORS
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    // Timezone
    TZ: z.string().default('Europe/Zagreb')
})

/**
 * Validate and parse environment variables
 * Throws error if validation fails
 */
const validateConfig = () => {
    try {
        return configSchema.parse(process.env)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(
                (err) => `${err.path.join('.')}: ${err.message}`
            )
            throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`)
        }
        throw error
    }
}

/**
 * Application configuration object
 * All configuration values are validated and typed
 */
export const config = validateConfig()

/**
 * Helper function to check if running in development mode
 */
export const isDevelopment = (): boolean => config.NODE_ENV === 'development'

/**
 * Helper function to check if running in production mode
 */
export const isProduction = (): boolean => config.NODE_ENV === 'production'

/**
 * Helper function to check if running in test mode
 */
export const isTest = (): boolean => config.NODE_ENV === 'test'

/**
 * Database configuration
 */
export const dbConfig = {
    url: config.DATABASE_URL
}

/**
 * JWT configuration
 */
export const jwtConfig = {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN
}

/**
 * Cookie configuration
 */
export const cookieConfig = {
    secret: config.COOKIE_SECRET,
    options: {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later'
    }
}

/**
 * CORS configuration
 */
export const corsConfig = {
    origin: config.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200
} 