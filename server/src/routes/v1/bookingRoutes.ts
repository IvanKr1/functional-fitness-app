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

// DELETE /bookings/user/:userId - Cancel all bookings for a user (marks as CANCELLED)
router.delete('/user/:userId',
    authenticateToken,
    asyncHandler(bookingController.deleteAllUserBookings)
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

// GET /bookings/incomplete-weekly - Get users with incomplete weekly bookings (admin only)
router.get('/incomplete-weekly',
    authenticateToken,
    requireAdmin,
    asyncHandler(bookingController.getUsersWithIncompleteWeeklyBookings)
)

// POST /bookings/mark-completed - Mark past bookings as completed (admin only)
router.post('/mark-completed',
    authenticateToken,
    requireAdmin,
    asyncHandler(bookingController.markPastBookingsCompleted)
)

export default router 