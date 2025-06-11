import { Role } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ValidationError, AuthorizationError } from '../types/index.js'

/**
 * Get start and end of month for a given date
 */
const getMonthBounds = (dateString: string): { start: Date; end: Date } => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth()

    const start = new Date(year, month, 1)
    start.setHours(0, 0, 0, 0)

    const end = new Date(year, month + 1, 0)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

/**
 * Get attendance records for a user with optional filtering
 */
export const getUserAttendanceRecords = async (
    userId: string,
    options?: {
        startDate?: Date
        endDate?: Date
        month?: string
    }
): Promise<Array<{
    id: string
    bookingId: string
    attended: boolean
    checkedInAt: Date | null
    notes: string | null
    booking: {
        startTime: Date
        endTime: Date
        status: string
        notes: string | null
    }
}>> => {
    let whereClause: any = { userId }

    // Handle date filtering
    if (options?.month) {
        const { start, end } = getMonthBounds(options.month)
        whereClause.booking = {
            startTime: {
                gte: start,
                lte: end
            }
        }
    } else if (options?.startDate && options?.endDate) {
        whereClause.booking = {
            startTime: {
                gte: options.startDate,
                lte: options.endDate
            }
        }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
            booking: {
                select: {
                    startTime: true,
                    endTime: true,
                    status: true,
                    notes: true
                }
            }
        },
        orderBy: {
            booking: {
                startTime: 'desc'
            }
        }
    })

    return attendanceRecords.map(record => ({
        id: record.id,
        bookingId: record.bookingId,
        attended: record.attended,
        checkedInAt: record.checkedInAt,
        notes: record.notes,
        booking: {
            startTime: record.booking.startTime,
            endTime: record.booking.endTime,
            status: record.booking.status,
            notes: record.booking.notes
        }
    }))
}

/**
 * Get all attendance records (admin only)
 */
export const getAllAttendanceRecords = async (
    options?: {
        userId?: string
        startDate?: Date
        endDate?: Date
        month?: string
    }
): Promise<Array<{
    id: string
    userId: string
    bookingId: string
    attended: boolean
    checkedInAt: Date | null
    notes: string | null
    user: {
        name: string
        email: string
    }
    booking: {
        startTime: Date
        endTime: Date
        status: string
        notes: string | null
    }
}>> => {
    let whereClause: any = {}

    // Filter by user if specified
    if (options?.userId) {
        whereClause.userId = options.userId
    }

    // Handle date filtering
    if (options?.month) {
        const { start, end } = getMonthBounds(options.month)
        whereClause.booking = {
            startTime: {
                gte: start,
                lte: end
            }
        }
    } else if (options?.startDate && options?.endDate) {
        whereClause.booking = {
            startTime: {
                gte: options.startDate,
                lte: options.endDate
            }
        }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            booking: {
                select: {
                    startTime: true,
                    endTime: true,
                    status: true,
                    notes: true
                }
            }
        },
        orderBy: {
            booking: {
                startTime: 'desc'
            }
        }
    })

    return attendanceRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        bookingId: record.bookingId,
        attended: record.attended,
        checkedInAt: record.checkedInAt,
        notes: record.notes,
        user: {
            name: record.user.name,
            email: record.user.email
        },
        booking: {
            startTime: record.booking.startTime,
            endTime: record.booking.endTime,
            status: record.booking.status,
            notes: record.booking.notes
        }
    }))
}

/**
 * Create attendance record for a booking
 */
export const createAttendanceRecord = async (
    userId: string,
    bookingId: string,
    attended: boolean = false,
    notes?: string
): Promise<{
    id: string
    attended: boolean
    checkedInAt: Date | null
    notes: string | null
}> => {
    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            userId: userId
        }
    })

    if (!booking) {
        throw new ValidationError('Booking not found or does not belong to user')
    }

    // Check if attendance record already exists
    const existingRecord = await prisma.attendanceRecord.findUnique({
        where: { bookingId }
    })

    if (existingRecord) {
        throw new ValidationError('Attendance record already exists for this booking')
    }

    const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
            userId,
            bookingId,
            attended,
            checkedInAt: attended ? new Date() : null,
            notes: notes || null
        }
    })

    return {
        id: attendanceRecord.id,
        attended: attendanceRecord.attended,
        checkedInAt: attendanceRecord.checkedInAt,
        notes: attendanceRecord.notes
    }
}

/**
 * Update attendance record
 */
export const updateAttendanceRecord = async (
    attendanceId: string,
    userId: string,
    userRole: Role,
    updateData: {
        attended?: boolean
        notes?: string
    }
): Promise<{
    id: string
    attended: boolean
    checkedInAt: Date | null
    notes: string | null
}> => {
    // Get existing record
    const existingRecord = await prisma.attendanceRecord.findUnique({
        where: { id: attendanceId }
    })

    if (!existingRecord) {
        throw new ValidationError('Attendance record not found')
    }

    // Check authorization (user can only edit their own records, admins can edit any)
    if (userRole !== Role.ADMIN && existingRecord.userId !== userId) {
        throw new AuthorizationError('You can only edit your own attendance records')
    }

    const updatePayload: any = {}

    if (updateData.attended !== undefined) {
        updatePayload.attended = updateData.attended
        updatePayload.checkedInAt = updateData.attended ? new Date() : null
    }

    if (updateData.notes !== undefined) {
        updatePayload.notes = updateData.notes
    }

    const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: attendanceId },
        data: updatePayload
    })

    return {
        id: updatedRecord.id,
        attended: updatedRecord.attended,
        checkedInAt: updatedRecord.checkedInAt,
        notes: updatedRecord.notes
    }
}

/**
 * Get attendance statistics for a user
 */
export const getUserAttendanceStats = async (
    userId: string,
    options?: {
        month?: string
        year?: number
    }
): Promise<{
    totalBookings: number
    attendedBookings: number
    missedBookings: number
    attendanceRate: number
    period: string
}> => {
    let whereClause: any = { userId }

    if (options?.month) {
        const { start, end } = getMonthBounds(options.month)
        whereClause.booking = {
            startTime: {
                gte: start,
                lte: end
            }
        }
    }

    const records = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
            booking: {
                select: {
                    startTime: true
                }
            }
        }
    })

    const totalBookings = records.length
    const attendedBookings = records.filter(record => record.attended).length
    const missedBookings = totalBookings - attendedBookings
    const attendanceRate = totalBookings > 0 ? (attendedBookings / totalBookings) * 100 : 0

    return {
        totalBookings,
        attendedBookings,
        missedBookings,
        attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        period: options?.month || 'all-time'
    }
} 