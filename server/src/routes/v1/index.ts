import { Router } from 'express'

// Import v1 route modules
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import bookingRoutes from './bookingRoutes.js'
import attendanceRoutes from './attendanceRoutes.js'
import paymentRoutes from './paymentRoutes.js'

const router = Router()

/**
 * API v1 Routes
 * All routes for version 1 of the API
 */

// Authentication routes
router.use('/auth', authRoutes)

// User management routes
router.use('/users', userRoutes)

// Booking management routes
router.use('/bookings', bookingRoutes)

// Attendance tracking routes
router.use('/attendance', attendanceRoutes)

// Payment processing routes
router.use('/payments', paymentRoutes)

/**
 * API v1 information endpoint
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gym Booking API v1',
        data: {
            version: '1.0.0',
            endpoints: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                bookings: '/api/v1/bookings',
                attendance: '/api/v1/attendance',
                payments: '/api/v1/payments'
            },
            documentation: '/api/v1/docs' // Future API documentation endpoint
        }
    })
})

export default router 