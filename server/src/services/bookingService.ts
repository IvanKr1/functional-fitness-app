import { BookingStatus, Role } from '@prisma/client'
import { prisma } from '../config/database.js'
import {
    BookingConflictError,
    ValidationError,
    AuthorizationError,
    CreateBookingRequest,
    UpdateBookingRequest,
    TimeSlot
} from '../types/index.js'

/**
 * Get start and end of week for a given date (Monday to Sunday)
 * Using Europe/Zagreb timezone
 */
const getWeekBounds = (date: Date): { start: Date; end: Date } => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday is start of week

    start.setDate(diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

/**
 * Check if a time slot is within allowed booking hours (07:00 - 20:00)
 */
const isWithinBookingHours = (startTime: Date, endTime: Date): boolean => {
    const startHour = startTime.getHours()
    const endHour = endTime.getHours()
    // Allow slots starting at 7:00 up to 20:00, ending at 21:00
    return startHour >= 7 && startHour <= 20 && endHour === startHour + 1 && endHour <= 21 && startTime < endTime
}

/**
 * Check if user already has a booking on the same day
 */
const hasBookingOnSameDay = async (userId: string, date: Date): Promise<boolean> => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const existingBooking = await prisma.booking.findFirst({
        where: {
            userId,
            startTime: {
                gte: dayStart,
                lte: dayEnd
            },
            status: {
                not: BookingStatus.CANCELLED
            }
        }
    })

    return !!existingBooking
}

/**
 * Get user's booking count for current week
 */
const getUserWeeklyBookingCount = async (userId: string, weekDate?: Date): Promise<number> => {
    const date = weekDate || new Date()
    const { start, end } = getWeekBounds(date)

    const count = await prisma.booking.count({
        where: {
            userId,
            startTime: {
                gte: start,
                lte: end
            },
            status: {
                not: BookingStatus.CANCELLED
            }
        }
    })

    return count
}

/**
 * Create a new booking with validation
 */
export const createBooking = async (
    userId: string,
    bookingData: CreateBookingRequest
): Promise<{
    id: string
    startTime: Date
    endTime: Date
    status: BookingStatus
    notes?: string | undefined
}> => {
    const { startTime: startTimeStr, endTime: endTimeStr, notes } = bookingData

    const startTime = new Date(startTimeStr)
    const endTime = new Date(endTimeStr)

    // Validate time slot
    if (!isWithinBookingHours(startTime, endTime)) {
        throw new ValidationError('Bookings must be between 07:00 and 20:00')
    }

    // Check if booking is in the future
    const now = new Date()
    if (startTime <= now) {
        throw new ValidationError('Cannot book sessions in the past')
    }

    // Check daily limit (1 session per day)
    const hasDailyBooking = await hasBookingOnSameDay(userId, startTime)
    if (hasDailyBooking) {
        throw new BookingConflictError('You already have a booking on this day')
    }

    // Get user's weekly booking limit
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyBookingLimit: true }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    // Check weekly limit
    const weeklyCount = await getUserWeeklyBookingCount(userId, startTime)
    if (weeklyCount >= user.weeklyBookingLimit) {
        throw new BookingConflictError(
            `Weekly booking limit reached (${user.weeklyBookingLimit} sessions per week)`
        )
    }

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            userId,
            startTime,
            endTime,
            notes: notes || null,
            status: BookingStatus.CONFIRMED
        }
    })

    return {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes || undefined
    }
}

/**
 * Update existing booking with validation
 */
export const updateBooking = async (
    bookingId: string,
    userId: string,
    userRole: Role,
    updateData: UpdateBookingRequest
): Promise<{
    id: string
    startTime: Date
    endTime: Date
    status: BookingStatus
    notes?: string | null
}> => {
    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { user: true }
    })

    if (!existingBooking) {
        throw new ValidationError('Booking not found')
    }

    // Check authorization (user can only edit their own bookings, admins can edit any)
    if (userRole !== Role.ADMIN && existingBooking.userId !== userId) {
        throw new AuthorizationError('You can only edit your own bookings')
    }

    // If updating time, validate reschedule restrictions (only for users, not admins)
    if ((updateData.startTime || updateData.endTime) && userRole !== Role.ADMIN) {
        const now = new Date()
        const timeDiff = existingBooking.startTime.getTime() - now.getTime()
        const hoursUntilBooking = timeDiff / (1000 * 60 * 60)

        if (hoursUntilBooking < 2) {
            throw new ValidationError('Cannot reschedule booking less than 2 hours before start time')
        }
    }

    // Validate new time if provided
    if (updateData.startTime && updateData.endTime) {
        const newStartTime = new Date(updateData.startTime)
        const newEndTime = new Date(updateData.endTime)

        if (!isWithinBookingHours(newStartTime, newEndTime)) {
            throw new ValidationError('Bookings must be between 07:00 and 20:00')
        }

        // Check if new date conflicts with daily limit (excluding current booking)
        if (userRole !== Role.ADMIN) {
            const hasDailyBooking = await prisma.booking.findFirst({
                where: {
                    userId: existingBooking.userId,
                    id: { not: bookingId },
                    startTime: {
                        gte: new Date(newStartTime.setHours(0, 0, 0, 0)),
                        lte: new Date(newStartTime.setHours(23, 59, 59, 999))
                    },
                    status: { not: BookingStatus.CANCELLED }
                }
            })

            if (hasDailyBooking) {
                throw new BookingConflictError('You already have a booking on this day')
            }
        }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            ...(updateData.startTime && { startTime: new Date(updateData.startTime) }),
            ...(updateData.endTime && { endTime: new Date(updateData.endTime) }),
            ...(updateData.notes !== undefined && { notes: updateData.notes }),
            ...(updateData.status && { status: updateData.status as BookingStatus })
        }
    })

    return {
        id: updatedBooking.id,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        status: updatedBooking.status,
        notes: updatedBooking.notes || null
    }
}

/**
 * Delete/cancel booking
 */
export const deleteBooking = async (
    bookingId: string,
    userId: string,
    userRole: Role
): Promise<void> => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
    })

    if (!booking) {
        throw new ValidationError('Booking not found')
    }

    // Check authorization
    if (userRole !== Role.ADMIN && booking.userId !== userId) {
        throw new AuthorizationError('You can only delete your own bookings')
    }

    // Instead of deleting, mark as cancelled to maintain records
    await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED }
    })
}

/**
 * Get user's bookings with optional filtering
 */
export const getUserBookings = async (
    userId: string,
    options?: {
        startDate?: Date
        endDate?: Date
        status?: BookingStatus
        limit?: number
    }
): Promise<Array<{
    id: string
    startTime: Date
    endTime: Date
    status: BookingStatus
    notes?: string | null
}>> => {
    const bookings = await prisma.booking.findMany({
        where: {
            userId,
            // Only show active bookings by default, unless status is explicitly specified
            ...(options?.status
                ? { status: options.status }
                : { status: { not: BookingStatus.CANCELLED } }
            ),
            ...(options?.startDate && options?.endDate && {
                startTime: {
                    gte: options.startDate,
                    lte: options.endDate
                }
            })
        },
        orderBy: { startTime: 'desc' },
        ...(options?.limit && { take: options.limit })
    })

    return bookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes || null
    }))
}

/**
 * Get all bookings (admin only)
 */
export const getAllBookings = async (
    options?: {
        startDate?: Date
        endDate?: Date
        status?: BookingStatus
        userId?: string
        limit?: number
    }
): Promise<Array<{
    id: string
    userId: string
    userName: string
    userEmail: string
    startTime: Date
    endTime: Date
    status: BookingStatus
    notes?: string | null
}>> => {
    const bookings = await prisma.booking.findMany({
        where: {
            ...(options?.userId && { userId: options.userId }),
            ...(options?.status && { status: options.status }),
            ...(options?.startDate && options?.endDate && {
                startTime: {
                    gte: options.startDate,
                    lte: options.endDate
                }
            })
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { startTime: 'desc' },
        ...(options?.limit && { take: options.limit })
    })

    return bookings.map(booking => ({
        id: booking.id,
        userId: booking.userId,
        userName: booking.user.name,
        userEmail: booking.user.email,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: booking.notes || null
    }))
}

/**
 * Get weekly booking count for a user
 */
export const getWeeklyBookingCount = async (
    userId: string,
    weekStartDate?: string
): Promise<{
    count: number
    weeklyLimit: number
    weekStart: Date
    weekEnd: Date
}> => {
    const weekDate = weekStartDate ? new Date(weekStartDate) : new Date()
    const { start, end } = getWeekBounds(weekDate)

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyBookingLimit: true }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    const count = await getUserWeeklyBookingCount(userId, weekDate)

    return {
        count,
        weeklyLimit: user.weeklyBookingLimit,
        weekStart: start,
        weekEnd: end
    }
}

/**
 * Get users with no bookings this week (admin only)
 */
export const getUsersWithoutBookingsThisWeek = async (): Promise<Array<{
    id: string
    name: string
    email: string
    weeklyBookingLimit: number
}>> => {
    const { start, end } = getWeekBounds(new Date())

    const usersWithBookings = await prisma.booking.findMany({
        where: {
            startTime: {
                gte: start,
                lte: end
            },
            status: { not: BookingStatus.CANCELLED }
        },
        select: { userId: true },
        distinct: ['userId']
    })

    const userIdsWithBookings = usersWithBookings.map(b => b.userId)

    const usersWithoutBookings = await prisma.user.findMany({
        where: {
            id: { notIn: userIdsWithBookings },
            role: Role.USER // Only include regular users, not admins
        },
        select: {
            id: true,
            name: true,
            email: true,
            weeklyBookingLimit: true
        }
    })

    return usersWithoutBookings
}

/**
 * Delete all bookings for a user (marks as CANCELLED)
 */
export const deleteAllUserBookings = async (
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<number> => {
    // Check authorization - users can only delete their own bookings, admins can delete any user's
    if (requestingUserRole !== Role.ADMIN && requestingUserId !== userId) {
        throw new AuthorizationError('You can only delete your own bookings')
    }

    // Get all active bookings for the user
    const activeBookings = await prisma.booking.findMany({
        where: {
            userId,
            status: {
                not: BookingStatus.CANCELLED
            }
        }
    })

    if (activeBookings.length === 0) {
        return 0
    }

    // Mark all bookings as cancelled
    await prisma.booking.updateMany({
        where: {
            userId,
            status: {
                not: BookingStatus.CANCELLED
            }
        },
        data: {
            status: BookingStatus.CANCELLED
        }
    })

    return activeBookings.length
} 