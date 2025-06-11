import { Router } from 'express'
import * as paymentController from '../controllers/paymentController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import {
    validateRecordPayment,
    validatePaymentStatusQuery
} from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * Payment management routes
 */

// GET /payments/status - Get payment status for user
router.get('/status',
    authenticateToken,
    validatePaymentStatusQuery,
    asyncHandler(paymentController.getPaymentStatus)
)

// GET /payments - Get all payment records (admin only)
router.get('/',
    authenticateToken,
    requireAdmin,
    asyncHandler(paymentController.getAllPaymentRecords)
)

// POST /payments/:id - Record payment (admin only)
router.post('/:id',
    authenticateToken,
    requireAdmin,
    validateRecordPayment,
    asyncHandler(paymentController.recordPayment)
)

// GET /payments/:id/history - Get payment history for user
router.get('/:id/history',
    authenticateToken,
    asyncHandler(paymentController.getUserPaymentHistory)
)

// GET /payments/overdue - Get overdue payments (admin only)
router.get('/overdue',
    authenticateToken,
    requireAdmin,
    asyncHandler(paymentController.getOverduePayments)
)

export default router 