import { Router } from 'express'
import * as bookingController from '../../controllers/bookingController.js'
import { authenticateToken, requireAdmin } from '../../middleware/auth.js'
import {
    validateCreateBooking,
    validateUpdateBooking,
    validateWeekCountQuery
} from '../../middleware/validation.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

const router = Router()

/**
 * Booking management routes
 */

// GET /bookings - Get bookings (user's own or all for admin)
router.get('/',
    authenticateToken,
    asyncHandler(bookingController.getBookings)
)

// POST /bookings - Create new booking
router.post('/',
    authenticateToken,
    validateCreateBooking,
    asyncHandler(bookingController.createBooking)
)

// PATCH /bookings/:id - Update existing booking
router.patch('/:id',
    authenticateToken,
    validateUpdateBooking,
    asyncHandler(bookingController.updateBooking)
)

// DELETE /bookings/:id - Cancel booking (marks as CANCELLED)
router.delete('/:id',
    authenticateToken,
    asyncHandler(bookingController.deleteBooking)
)

// GET /bookings/week-count - Get weekly booking count for user
router.get('/week-count',
    authenticateToken,
    validateWeekCountQuery,
    asyncHandler(bookingController.getWeeklyBookingCount)
)

// GET /bookings/missing-this-week - Get users with no bookings this week (admin only)
router.get('/missing-this-week',
    authenticateToken,
    requireAdmin,
    asyncHandler(bookingController.getUsersMissingThisWeek)
)

export default router 