import { Router } from 'express'
import * as authController from '../../controllers/authController.js'
import { authenticateToken, requireAdmin } from '../../middleware/auth.js'
import {
    validateLogin,
    validateChangePassword
} from '../../middleware/validation.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

const router = Router()

/**
 * Authentication routes
 */

// POST /auth/login - User login
router.post('/login',
    validateLogin,
    asyncHandler(authController.login)
)

// POST /auth/dev-token - Get development token (7 days)
router.post('/dev-token',
    validateLogin,
    asyncHandler(authController.getDevToken)
)

// POST /auth/logout - User logout
router.post('/logout',
    asyncHandler(authController.logout)
)

// GET /auth/profile - Get current user profile
router.get('/profile',
    authenticateToken,
    asyncHandler(authController.getProfile)
)

// POST /auth/refresh - Refresh authentication token
router.post('/refresh',
    asyncHandler(authController.refreshToken)
)

// PATCH /auth/change-password/:id - Change user password
router.patch('/change-password/:id',
    authenticateToken,
    validateChangePassword,
    asyncHandler(authController.changePassword)
)

export default router 