import { Router } from 'express'
import * as userController from '../controllers/userController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import {
    validateRegister,
    validateUpdateUser,
    validateUpdateUserNotes,
    validateUpdateBookingLimit
} from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * User management routes
 */

// POST /users - Register new user (admin only)
router.post('/',
    authenticateToken,
    requireAdmin,
    validateRegister,
    asyncHandler(userController.register)
)

// GET /users - Get all users (admin only)
router.get('/',
    authenticateToken,
    requireAdmin,
    asyncHandler(userController.getAllUsers)
)

// GET /users/:id - Get user by ID
router.get('/:id',
    authenticateToken,
    asyncHandler(userController.getUserById)
)

// PUT /users/:id - Update user
router.put('/:id',
    authenticateToken,
    validateUpdateUser,
    asyncHandler(userController.updateUser)
)

// PATCH /users/:id/notes - Update user notes
router.patch('/:id/notes',
    authenticateToken,
    validateUpdateUserNotes,
    asyncHandler(userController.updateUserNotes)
)

// PATCH /users/:id/booking-limit - Update booking limit (admin only)
router.patch('/:id/booking-limit',
    authenticateToken,
    requireAdmin,
    validateUpdateBookingLimit,
    asyncHandler(userController.updateUserBookingLimit)
)

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id',
    authenticateToken,
    requireAdmin,
    asyncHandler(userController.deleteUser)
)

// GET /users/:id/stats - Get user statistics
router.get('/:id/stats',
    authenticateToken,
    asyncHandler(userController.getUserStats)
)

export default router 