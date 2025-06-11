import { Router } from 'express'
import * as attendanceController from '../controllers/attendanceController.js'
import { authenticateToken } from '../middleware/auth.js'
import {
    validateCreateAttendance,
    validateUpdateAttendance,
    validateAttendanceQuery
} from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

/**
 * Attendance management routes
 */

// GET /attendance - Get attendance records (user's own or all for admin)
router.get('/',
    authenticateToken,
    validateAttendanceQuery,
    asyncHandler(attendanceController.getAttendanceRecords)
)

// POST /attendance - Create attendance record
router.post('/',
    authenticateToken,
    validateCreateAttendance,
    asyncHandler(attendanceController.createAttendanceRecord)
)

// PATCH /attendance/:id - Update attendance record
router.patch('/:id',
    authenticateToken,
    validateUpdateAttendance,
    asyncHandler(attendanceController.updateAttendanceRecord)
)

// GET /attendance/stats - Get attendance statistics
router.get('/stats',
    authenticateToken,
    asyncHandler(attendanceController.getAttendanceStats)
)

export default router 