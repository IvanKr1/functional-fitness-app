import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import { prisma } from '../config/database.js'
import {
    ValidationError,
    AuthorizationError,
    UpdateUserRequest,
    UpdateUserNotesRequest,
    RegisterRequest
} from '../types/index.js'

/**
 * Generate a random 7-character password for new users
 */
const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 7; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
}

/**
 * Register a new user (admin only)
 * Returns the generated password and user data
 */
export const registerUser = async (userData: RegisterRequest): Promise<{
    user: {
        id: string
        name: string
        email: string
        role: Role
        mobilePhone?: string
        weeklyBookingLimit: number
    }
    generatedPassword: string
}> => {
    const {
        name,
        email,
        mobilePhone,
        role = Role.USER,
        weeklyBookingLimit = 2
    } = userData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    })

    if (existingUser) {
        throw new ValidationError('User with this email already exists', 'email')
    }

    // Generate random password
    const generatedPassword = generateRandomPassword()
    const passwordHash = await hashPassword(generatedPassword)

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            mobilePhone: mobilePhone || null,
            passwordHash,
            role,
            weeklyBookingLimit
        }
    })

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            ...(user.mobilePhone && { mobilePhone: user.mobilePhone }),
            weeklyBookingLimit: user.weeklyBookingLimit
        },
        generatedPassword
    }
}

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<Array<{
    id: string
    name: string
    email: string
    role: Role
    weeklyBookingLimit: number
    createdAt: Date
    mobilePhone?: string | undefined
    lastPaymentDate?: Date | null
    nextPaymentDueDate?: Date | null
    notes?: string | undefined
}>> => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            role: true,
            weeklyBookingLimit: true,
            lastPaymentDate: true,
            nextPaymentDueDate: true,
            notes: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    })

    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        mobilePhone: user.mobilePhone || undefined,
        role: user.role,
        weeklyBookingLimit: user.weeklyBookingLimit,
        lastPaymentDate: user.lastPaymentDate,
        nextPaymentDueDate: user.nextPaymentDueDate,
        notes: user.notes || undefined,
        createdAt: user.createdAt
    }))
}

/**
 * Get user by ID
 */
export const getUserById = async (
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<{
    id: string
    name: string
    email: string
    createdAt: Date
    role: Role
    weeklyBookingLimit: number
    mobilePhone?: string | undefined
    lastPaymentDate?: Date | undefined
    nextPaymentDueDate?: Date | null
    notes?: string | undefined
}> => {
    // Users can only view their own profile, admins can view any
    if (requestingUserRole !== Role.ADMIN && userId !== requestingUserId) {
        throw new AuthorizationError('You can only view your own profile')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            role: true,
            weeklyBookingLimit: true,
            lastPaymentDate: true,
            nextPaymentDueDate: true,
            notes: true,
            createdAt: true
        }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobilePhone: user.mobilePhone || undefined,
        role: user.role,
        weeklyBookingLimit: user.weeklyBookingLimit,
        lastPaymentDate: user.lastPaymentDate || undefined,
        nextPaymentDueDate: user.nextPaymentDueDate || null,
        notes: user.notes || undefined,
        createdAt: user.createdAt
    }
}

/**
 * Update user information
 */
export const updateUser = async (
    userId: string,
    updateData: UpdateUserRequest,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<{
    id: string
    name: string
    email: string
    role: Role
    weeklyBookingLimit: number
    mobilePhone?: string | undefined
    lastPaymentDate?: Date | null
    nextPaymentDueDate?: Date | null
}> => {
    // Users can only update their own profile (limited fields)
    // Admins can update any user (all fields)
    if (requestingUserRole !== Role.ADMIN && userId !== requestingUserId) {
        throw new AuthorizationError('You can only update your own profile')
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!existingUser) {
        throw new ValidationError('User not found')
    }

    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
            where: { email: updateData.email.toLowerCase() }
        })

        if (emailExists) {
            throw new ValidationError('Email already in use', 'email')
        }
    }

    // Prepare update data based on user role
    const allowedUpdates: any = {}

    // All users can update these fields
    if (updateData.name) allowedUpdates.name = updateData.name
    if (updateData.email) allowedUpdates.email = updateData.email.toLowerCase()
    if (updateData.mobilePhone !== undefined) allowedUpdates.mobilePhone = updateData.mobilePhone

    // Only admins can update these fields
    if (requestingUserRole === Role.ADMIN) {
        if (updateData.weeklyBookingLimit) allowedUpdates.weeklyBookingLimit = updateData.weeklyBookingLimit
        if (updateData.lastPaymentDate) allowedUpdates.lastPaymentDate = new Date(updateData.lastPaymentDate)
        if (updateData.nextPaymentDueDate) allowedUpdates.nextPaymentDueDate = new Date(updateData.nextPaymentDueDate)
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: allowedUpdates,
        select: {
            id: true,
            name: true,
            email: true,
            mobilePhone: true,
            role: true,
            weeklyBookingLimit: true,
            lastPaymentDate: true,
            nextPaymentDueDate: true
        }
    })

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobilePhone: updatedUser.mobilePhone || undefined,
        role: updatedUser.role,
        weeklyBookingLimit: updatedUser.weeklyBookingLimit,
        lastPaymentDate: updatedUser.lastPaymentDate || null,
        nextPaymentDueDate: updatedUser.nextPaymentDueDate || null
    }
}

/**
 * Update user notes (health/injury information)
 */
export const updateUserNotes = async (
    userId: string,
    notesData: UpdateUserNotesRequest,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<{ notes: string }> => {
    // Users can only update their own notes, admins can update any
    if (requestingUserRole !== Role.ADMIN && userId !== requestingUserId) {
        throw new AuthorizationError('You can only update your own notes')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { notes: notesData.notes },
        select: { notes: true }
    })

    return { notes: updatedUser.notes || '' }
}

/**
 * Update user's weekly booking limit (admin only)
 */
export const updateUserBookingLimit = async (
    userId: string,
    weeklyBookingLimit: number
): Promise<{ weeklyBookingLimit: number }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    if (weeklyBookingLimit < 1 || weeklyBookingLimit > 10) {
        throw new ValidationError('Weekly booking limit must be between 1 and 10')
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { weeklyBookingLimit },
        select: { weeklyBookingLimit: true }
    })

    return { weeklyBookingLimit: updatedUser.weeklyBookingLimit }
}

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: string): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    // Cannot delete admin users (safety measure)
    if (user.role === Role.ADMIN) {
        throw new ValidationError('Cannot delete admin users')
    }

    // Delete user and all related data (cascade will handle bookings, etc.)
    await prisma.user.delete({
        where: { id: userId }
    })
}

/**
 * Get user statistics
 */
export const getUserStats = async (userId: string): Promise<{
    totalBookings: number
    completedBookings: number
    cancelledBookings: number
    upcomingBookings: number
    currentWeekBookings: number
    weeklyBookingLimit: number
}> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyBookingLimit: true }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    const now = new Date()

    // Get current week bounds
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Get various booking counts
    const [
        totalBookings,
        completedBookings,
        cancelledBookings,
        upcomingBookings,
        currentWeekBookings
    ] = await Promise.all([
        prisma.booking.count({
            where: { userId }
        }),
        prisma.booking.count({
            where: {
                userId,
                status: 'COMPLETED'
            }
        }),
        prisma.booking.count({
            where: {
                userId,
                status: 'CANCELLED'
            }
        }),
        prisma.booking.count({
            where: {
                userId,
                startTime: { gte: now },
                status: { not: 'CANCELLED' }
            }
        }),
        prisma.booking.count({
            where: {
                userId,
                startTime: { gte: startOfWeek, lte: endOfWeek },
                status: { not: 'CANCELLED' }
            }
        })
    ])

    return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        upcomingBookings,
        currentWeekBookings,
        weeklyBookingLimit: user.weeklyBookingLimit
    }
} 