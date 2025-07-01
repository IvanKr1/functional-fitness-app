import { Request, Response } from 'express'
import * as bookingService from '../services/bookingService.js'
import { AuthenticatedRequest } from '../types/index.js'

/**
 * Get bookings endpoint
 * Returns user's own bookings or all bookings for admin
 */
export const getBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { startDate, endDate, status, limit } = req.query

        const options: any = {}
        if (startDate) options.startDate = new Date(startDate as string)
        if (endDate) options.endDate = new Date(endDate as string)
        if (status) options.status = status
        if (limit) options.limit = parseInt(limit as string)

        let bookings
        // If admin is requesting bookings for a specific date range (like today), return all bookings
        // Otherwise, return only user's own bookings
        if (user!.role === 'ADMIN' && startDate && endDate) {
            bookings = await bookingService.getAllBookings(options)
        } else {
            bookings = await bookingService.getUserBookings(user!.id, options)
        }

        res.status(200).json({
            success: true,
            data: bookings,
            message: 'Bookings retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve bookings'
        })
    }
}

/**
 * Create booking endpoint
 */
export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const bookingData = req.body

        const booking = await bookingService.createBooking(user!.id, bookingData)

        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create booking'
        })
    }
}

/**
 * Update booking endpoint
 */
export const updateBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { id } = req.params
        const updateData = req.body

        if (!id) {
            throw new Error('Booking ID is required')
        }

        const booking = await bookingService.updateBooking(id, user!.id, user!.role, updateData)

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking updated successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update booking'
        })
    }
}

/**
 * Delete booking endpoint (marks as CANCELLED)
 */
export const deleteBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { id } = req.params

        if (!id) {
            throw new Error('Booking ID is required')
        }

        await bookingService.deleteBooking(id, user!.id, user!.role)

        res.status(200).json({
            success: true,
            data: null,
            message: 'Booking cancelled successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel booking'
        })
    }
}

/**
 * Get weekly booking count endpoint
 */
export const getWeeklyBookingCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { userId, week } = req.query

        // Users can only get their own count, admins can get any user's count
        const targetUserId = (user!.role === 'ADMIN' && userId) ? userId as string : user!.id

        const weeklyData = await bookingService.getWeeklyBookingCount(
            targetUserId,
            week as string
        )

        res.status(200).json({
            success: true,
            data: weeklyData,
            message: 'Weekly booking count retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve weekly booking count'
        })
    }
}

/**
 * Get users missing bookings this week endpoint (admin only)
 */
export const getUsersMissingThisWeek = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const users = await bookingService.getUsersWithoutBookingsThisWeek()

        res.status(200).json({
            success: true,
            data: users,
            message: 'Users without bookings this week retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve users missing bookings'
        })
    }
}

/**
 * Delete all bookings for a user endpoint (marks as CANCELLED)
 */
export const deleteAllUserBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { userId } = req.params

        if (!userId) {
            throw new Error('User ID is required')
        }

        const deletedCount = await bookingService.deleteAllUserBookings(
            userId,
            user!.id,
            user!.role
        )

        res.status(200).json({
            success: true,
            data: { deletedCount },
            message: `Successfully cancelled ${deletedCount} booking${deletedCount !== 1 ? 's' : ''}`
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel bookings'
        })
    }
}

/**
 * Mark past bookings as completed endpoint (admin only)
 */
export const markPastBookingsCompleted = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req

        // Only admins can trigger this
        if (user!.role !== 'ADMIN') {
            res.status(403).json({
                success: false,
                error: 'Only admins can perform this action'
            })
            return
        }

        const completedCount = await bookingService.markPastBookingsAsCompleted()

        res.status(200).json({
            success: true,
            data: { completedCount },
            message: `Successfully marked ${completedCount} booking${completedCount !== 1 ? 's' : ''} as completed`
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to mark bookings as completed'
        })
    }
}
