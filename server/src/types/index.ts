import { Request } from 'express'
import { Role } from '@prisma/client'

/**
 * Extended Express Request interface with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string
        email: string
        role: Role
        name: string
    }
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
    userId: string
    email: string
    role: Role
    iat?: number
    exp?: number
}

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    message?: string
    error?: string
    errors?: string[]
}

/**
 * Authentication request bodies
 */
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    name: string
    email: string
    mobilePhone?: string
    role?: Role
    weeklyBookingLimit?: number
}

/**
 * User management request bodies
 */
export interface UpdateUserRequest {
    name?: string
    email?: string
    mobilePhone?: string
    weeklyBookingLimit?: number
    lastPaymentDate?: string
    nextPaymentDueDate?: string
}

export interface UpdateUserNotesRequest {
    notes: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

/**
 * Booking request bodies
 */
export interface CreateBookingRequest {
    startTime: string // ISO string
    endTime: string   // ISO string
    notes?: string
}

export interface UpdateBookingRequest {
    startTime?: string
    endTime?: string
    notes?: string
    status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
}

/**
 * Query parameters for various endpoints
 */
export interface BookingWeekCountQuery {
    userId?: string
    week?: string // YYYY-MM-DD format (start of week)
}

export interface AttendanceQuery {
    userId?: string
    startDate?: string
    endDate?: string
    month?: string
}

export interface PaymentStatusQuery {
    userId?: string
}

/**
 * Statistics and analytics types
 */
export interface WeeklyStats {
    userId: string
    userName: string
    bookingsThisWeek: number
    weeklyLimit: number
    lastBooking?: string
}

export interface MissingBookingsUser {
    id: string
    name: string
    email: string
    weeklyBookingLimit: number
}

export interface AttendanceStats {
    totalBookings: number
    attendedSessions: number
    missedSessions: number
    attendanceRate: number
    monthlyStats?: {
        month: string
        bookings: number
        attended: number
        rate: number
    }[]
}

/**
 * Time slot validation
 */
export interface TimeSlot {
    startTime: Date
    endTime: Date
}

/**
 * Custom error types
 */
export class ValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string = 'Authentication failed') {
        super(message)
        this.name = 'AuthenticationError'
    }
}

export class AuthorizationError extends Error {
    constructor(message: string = 'Insufficient permissions') {
        super(message)
        this.name = 'AuthorizationError'
    }
}

export class BookingConflictError extends Error {
    constructor(message: string = 'Booking conflict detected') {
        super(message)
        this.name = 'BookingConflictError'
    }
} 