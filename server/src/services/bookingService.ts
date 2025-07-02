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
 * Check if a time slot is within allowed booking hours
 * Monday-Friday: 07:00 - 20:00 (ending at 21:00)
 * Saturday: 07:00 - 10:00 (ending at 11:00)
 * Sunday: No bookings allowed
 */
const isWithinBookingHours = (startTime: Date, endTime: Date): boolean => {
    const dayOfWeek = startTime.getDay()
    const startHour = startTime.getHours()
    const endHour = endTime.getHours()

    // No bookings on Sunday
    if (dayOfWeek === 0) {
        return false
    }

    // Saturday: allow slots starting at 7:00 up to 10:00, ending at 11:00
    if (dayOfWeek === 6) {
        return startHour >= 7 && startHour <= 10 && endHour === startHour + 1 && endHour <= 11 && startTime < endTime
    }

    // Monday-Friday: allow slots starting at 7:00 up to 20:00, ending at 21:00
    return startHour >= 7 && startHour <= 20 && endHour === startHour + 1 && endHour <= 21 && startTime < endTime
}

/**
 * Check if booking is within 2-week advance booking limit
 */
const isWithinBookingWindow = (startTime: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(today.getDate() + 14) // 2 weeks from today

    const bookingDate = new Date(startTime)
    bookingDate.setHours(0, 0, 0, 0) // Start of booking day

    return bookingDate >= today && bookingDate <= twoWeeksFromNow
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

    // Enforce booking at least 2 hours in advance
    const nowCreate = new Date()
    const diffMs = startTime.getTime() - nowCreate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 2) {
        throw new ValidationError('Bookings must be scheduled at least 2 hours in advance')
    }

    // Validate time slot
    if (!isWithinBookingHours(startTime, endTime)) {
        const dayOfWeek = startTime.getDay()
        if (dayOfWeek === 0) {
            throw new ValidationError('Bookings are not available on Sundays')
        } else if (dayOfWeek === 6) {
            throw new ValidationError('Saturday bookings must be between 07:00 and 10:00')
        } else {
            throw new ValidationError('Bookings must be between 07:00 and 20:00')
        }
    }

    // Check if booking is within 2-week advance booking limit
    if (!isWithinBookingWindow(startTime)) {
        throw new ValidationError('You can only book up to 2 weeks in advance')
    }

    // Check if booking is in the future
    const now = new Date()
    if (startTime <= now) {
        throw new ValidationError('Cannot book sessions in the past')
    }

    // Check for a cancelled booking for the same user and day
    const dayStart = new Date(startTime)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(startTime)
    dayEnd.setHours(23, 59, 59, 999)
    const cancelledBooking = await prisma.booking.findFirst({
        where: {
            userId,
            startTime: {
                gte: dayStart,
                lte: dayEnd
            },
            status: BookingStatus.CANCELLED
        }
    })

    // Check daily limit (1 session per day, but allow updating a cancelled booking)
    const hasDailyBooking = await prisma.booking.findFirst({
        where: {
            userId,
            startTime: {
                gte: dayStart,
                lte: dayEnd
            },
            status: { not: BookingStatus.CANCELLED }
        }
    })
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

    // Check weekly limit (count only CONFIRMED/COMPLETED, not CANCELLED)
    const weeklyCount = await getUserWeeklyBookingCount(userId, startTime)
    if (weeklyCount >= user.weeklyBookingLimit) {
        throw new BookingConflictError(
            `Weekly booking limit reached (${user.weeklyBookingLimit} sessions per week)`
        )
    }

    if (cancelledBooking) {
        // Update the cancelled booking to CONFIRMED with new time/notes
        const updated = await prisma.booking.update({
            where: { id: cancelledBooking.id },
            data: {
                startTime,
                endTime,
                notes: notes || null,
                status: BookingStatus.CONFIRMED
            }
        })
        return {
            id: updated.id,
            startTime: updated.startTime,
            endTime: updated.endTime,
            status: updated.status,
            notes: updated.notes || undefined
        }
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
 * Delete/cancel booking (now hard delete)
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

    // Enforce cancellation at least 2 hours before start time (unless admin)
    if (userRole !== Role.ADMIN) {
        const nowDelete = new Date()
        const diffMs = booking.startTime.getTime() - nowDelete.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        if (diffHours < 2) {
            throw new ValidationError('Bookings can only be cancelled at least 2 hours before the start time')
        }
    }

    // Mark as cancelled instead of hard delete
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
            // Removed the default filter to exclude cancelled bookings
            // Now all bookings (including cancelled) will be returned by default
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
 * Get users with incomplete weekly bookings (admin only)
 * Returns users who haven't reached their weekly booking limit
 */
export const getUsersWithIncompleteWeeklyBookings = async (): Promise<Array<{
    id: string
    name: string
    email: string
    mobilePhone: string | undefined
    weeklyBookingLimit: number
    currentWeekBookings: number
    currentWeekBookingTimes: Array<{
        id: string
        startTime: Date
        endTime: Date
        status: BookingStatus
    }>
    missingBookings: number
}>> => {
    const { start, end } = getWeekBounds(new Date())

    // Get all users with their current week bookings
    const users = await prisma.user.findMany({
        where: {
            role: Role.USER // Only include regular users, not admins
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            weeklyBookingLimit: true,
            bookings: {
                where: {
                    startTime: {
                        gte: start,
                        lte: end
                    },
                    status: { not: BookingStatus.CANCELLED }
                },
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    status: true
                },
                orderBy: { startTime: 'asc' }
            }
        }
    })

    // Filter users who haven't reached their weekly limit
    const usersWithIncompleteBookings = users
        .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            mobilePhone: user.mobilePhone || undefined,
            weeklyBookingLimit: user.weeklyBookingLimit,
            currentWeekBookings: user.bookings.length,
            currentWeekBookingTimes: user.bookings,
            missingBookings: user.weeklyBookingLimit - user.bookings.length
        }))
        .filter(user => user.missingBookings > 0) // Only users who haven't reached their limit
        .sort((a, b) => b.missingBookings - a.missingBookings) // Sort by most missing bookings first

    return usersWithIncompleteBookings
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
 * Cancel all bookings for a user (mark as cancelled)
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
    const bookings = await prisma.booking.findMany({
        where: {
            userId,
            status: { not: BookingStatus.CANCELLED }
        }
    })

    if (bookings.length === 0) {
        return 0
    }

    // Mark all as cancelled
    await prisma.booking.updateMany({
        where: {
            userId,
            status: { not: BookingStatus.CANCELLED }
        },
        data: { status: BookingStatus.CANCELLED }
    })

    return bookings.length
}

/**
 * Mark past bookings as completed
 * This function should be called periodically (e.g., via cron job)
 */
export const markPastBookingsAsCompleted = async (): Promise<number> => {
    const now = new Date()

    // Find all confirmed bookings that have ended
    const pastBookings = await prisma.booking.findMany({
        where: {
            status: BookingStatus.CONFIRMED,
            endTime: {
                lt: now
            }
        }
    })

    if (pastBookings.length === 0) {
        return 0
    }

    // Mark all past bookings as completed
    await prisma.booking.updateMany({
        where: {
            status: BookingStatus.CONFIRMED,
            endTime: {
                lt: now
            }
        },
        data: { status: BookingStatus.COMPLETED }
    })

    console.log(`📅 Booking Service: Found ${pastBookings.length} past booking${pastBookings.length !== 1 ? 's' : ''} to mark as completed`)
    return pastBookings.length
}