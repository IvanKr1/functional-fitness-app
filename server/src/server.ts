import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import { config, corsConfig, rateLimitConfig } from './config/index.js'
import { testDatabaseConnection, disconnectDatabase } from './config/database.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Import routes
import authRoutes from './routes/authRoutes.js'

const app = express()

/**
 * Security middleware
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}))

/**
 * CORS configuration
 */
app.use(cors(corsConfig))

/**
 * Rate limiting
 */
app.use(rateLimit(rateLimitConfig))

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * Cookie parsing middleware
 */
app.use(cookieParser())

/**
 * Logging middleware
 */
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined'))
}

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testDatabaseConnection()

        res.status(200).json({
            success: true,
            message: 'Server is healthy',
            data: {
                server: 'running',
                database: dbConnected ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString(),
                environment: config.NODE_ENV,
                timezone: config.TZ
            }
        })
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Server health check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

/**
 * API version endpoint
 */
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gym Booking API v1.0',
        data: {
            version: '1.0.0',
            environment: config.NODE_ENV,
            documentation: '/api/docs', // Future API documentation endpoint
            endpoints: {
                auth: '/api/auth',
                users: '/api/users',
                bookings: '/api/bookings',
                attendance: '/api/attendance',
                payments: '/api/payments'
            }
        }
    })
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
// TODO: Add other routes when created
// app.use('/api/users', userRoutes)
// app.use('/api/bookings', bookingRoutes)
// app.use('/api/attendance', attendanceRoutes)
// app.use('/api/payments', paymentRoutes)

/**
 * 404 handler for undefined routes
 */
app.use(notFoundHandler)

/**
 * Global error handler
 */
app.use(errorHandler)

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        console.log('Testing database connection...')
        const dbConnected = await testDatabaseConnection()

        if (!dbConnected) {
            throw new Error('Database connection failed')
        }

        console.log('✅ Database connected successfully')

        // Start server
        const server = app.listen(config.PORT, () => {
            console.log(`🚀 Server running on port ${config.PORT}`)
            console.log(`📱 Environment: ${config.NODE_ENV}`)
            console.log(`🌍 Timezone: ${config.TZ}`)
            console.log(`🔗 Health check: http://localhost:${config.PORT}/health`)
            console.log(`📚 API: http://localhost:${config.PORT}/api`)
        })

        // Graceful shutdown
        const gracefulShutdown = async (signal: string): Promise<void> => {
            console.log(`\n${signal} received. Starting graceful shutdown...`)

            server.close(async () => {
                console.log('HTTP server closed')

                try {
                    await disconnectDatabase()
                    console.log('Database disconnected')
                    process.exit(0)
                } catch (error) {
                    console.error('Error during database disconnect:', error)
                    process.exit(1)
                }
            })
        }

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
        process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

// Start the server
startServer()

export default app 