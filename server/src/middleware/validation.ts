import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ValidationError } from '../types/index.js'

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.body)
            req.body = validatedData
            next()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors: errors
                })
                return
            }

            res.status(500).json({
                success: false,
                error: 'Validation error'
            })
        }
    }
}

/**
 * Query parameters validation middleware factory
 */
export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const validatedData = schema.parse(req.query)
            req.query = validatedData as any
            next()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))

                res.status(400).json({
                    success: false,
                    error: 'Query validation failed',
                    errors: errors
                })
                return
            }

            res.status(500).json({
                success: false,
                error: 'Query validation error'
            })
        }
    }
}

/**
 * Authentication request schemas
 */
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email format'),
    mobilePhone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    weeklyBookingLimit: z.number().min(1).max(10).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

/**
 * User management schemas
 */
export const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    mobilePhone: z.string().optional(),
    weeklyBookingLimit: z.number().min(1).max(10).optional(),
    lastPaymentDate: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid date format').optional(),
    nextPaymentDueDate: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid date format').optional()
})

export const updateUserNotesSchema = z.object({
    notes: z.string().max(1000, 'Notes too long')
})

export const updateBookingLimitSchema = z.object({
    weeklyBookingLimit: z.number().min(1, 'Booking limit must be at least 1').max(10, 'Booking limit cannot exceed 10')
})

export const recordPaymentSchema = z.object({
    paymentDate: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid date format').optional(),
    amount: z.number().min(0.01, 'Amount must be greater than 0').default(50.00).optional(),
    currency: z.string().length(3, 'Currency must be 3 characters (e.g., EUR, USD)').default('EUR').optional(),
    notes: z.string().max(500, 'Notes too long').optional()
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

/**
 * Booking schemas
 */
export const createBookingSchema = z.object({
    startTime: z.string().refine((val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid start time format'),
    endTime: z.string().refine((val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid end time format'),
    notes: z.string().max(500, 'Notes too long').optional()
}).refine((data) => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    return end > start
}, {
    message: 'End time must be after start time'
}).refine((data) => {
    const start = new Date(data.startTime)
    const hour = start.getHours()
    return hour >= 7 && hour < 20
}, {
    message: 'Bookings must be between 07:00 and 20:00'
})

export const updateBookingSchema = z.object({
    startTime: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid start time format').optional(),
    endTime: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid end time format').optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional()
}).refine((data) => {
    if (data.startTime && data.endTime) {
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        return end > start
    }
    return true
}, {
    message: 'End time must be after start time'
})

/**
 * Query parameter schemas
 */
export const weekCountQuerySchema = z.object({
    userId: z.string().optional(),
    week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week must be in YYYY-MM-DD format').optional()
})

export const attendanceQuerySchema = z.object({
    userId: z.string().optional(),
    startDate: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid start date format').optional(),
    endDate: z.string().refine((val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
    }, 'Invalid end date format').optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional()
})

export const paymentStatusQuerySchema = z.object({
    userId: z.string().optional()
})

/**
 * Attendance schemas
 */
export const createAttendanceSchema = z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    attended: z.boolean().default(false),
    notes: z.string().max(500, 'Notes too long').optional()
})

export const updateAttendanceSchema = z.object({
    attended: z.boolean().optional(),
    notes: z.string().max(500, 'Notes too long').optional()
})

/**
 * Validation middleware instances
 */
export const validateLogin = validateBody(loginSchema)
export const validateRegister = validateBody(registerSchema)
export const validateUpdateUser = validateBody(updateUserSchema)
export const validateUpdateUserNotes = validateBody(updateUserNotesSchema)
export const validateUpdateBookingLimit = validateBody(updateBookingLimitSchema)
export const validateRecordPayment = validateBody(recordPaymentSchema)
export const validateChangePassword = validateBody(changePasswordSchema)
export const validateCreateBooking = validateBody(createBookingSchema)
export const validateUpdateBooking = validateBody(updateBookingSchema)

export const validateWeekCountQuery = validateQuery(weekCountQuerySchema)
export const validateAttendanceQuery = validateQuery(attendanceQuerySchema)
export const validatePaymentStatusQuery = validateQuery(paymentStatusQuerySchema)
export const validateCreateAttendance = validateBody(createAttendanceSchema)
export const validateUpdateAttendance = validateBody(updateAttendanceSchema) 