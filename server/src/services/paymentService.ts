import { Role, PaymentStatus } from '@prisma/client'
import { prisma } from '../config/database.js'
import { ValidationError, AuthorizationError } from '../types/index.js'

/**
 * Record user payment and automatically set next due date (30 days later)
 * Creates PaymentRecord entry and updates User fields
 * Admin only function
 */
export const recordPayment = async (
    userId: string,
    paymentDate?: string,
    amount: number = 50.00,
    currency: string = 'EUR',
    notes?: string
): Promise<{
    paymentRecord: {
        id: string
        amount: number
        currency: string
        paymentDate: Date
        dueDate: Date
        status: string
        notes?: string | null
    }
    lastPaymentDate: Date
    nextPaymentDueDate: Date
}> => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    // Use provided date or current date
    const lastPaymentDate = paymentDate ? new Date(paymentDate) : new Date()

    // Calculate next due date (30 days from payment)
    const nextPaymentDueDate = new Date(lastPaymentDate)
    nextPaymentDueDate.setDate(nextPaymentDueDate.getDate() + 30)

    // 1. Create PaymentRecord entry for detailed tracking
    const paymentRecord = await prisma.paymentRecord.create({
        data: {
            userId,
            amount,
            currency,
            paymentDate: lastPaymentDate,
            dueDate: nextPaymentDueDate,
            status: PaymentStatus.PAID,
            notes: notes || 'Monthly membership fee'
        }
    })

    // 2. Update User fields for quick access (derived from PaymentRecord)
    await prisma.user.update({
        where: { id: userId },
        data: {
            lastPaymentDate,
            nextPaymentDueDate
        }
    })

    return {
        paymentRecord: {
            id: paymentRecord.id,
            amount: Number(paymentRecord.amount),
            currency: paymentRecord.currency,
            paymentDate: paymentRecord.paymentDate,
            dueDate: paymentRecord.dueDate,
            status: paymentRecord.status,
            notes: paymentRecord.notes || null
        },
        lastPaymentDate,
        nextPaymentDueDate
    }
}

/**
 * Get user payment history
 * Admin only or user viewing their own history
 */
export const getUserPaymentHistory = async (
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<Array<{
    id: string
    amount: number
    currency: string
    paymentDate: Date
    dueDate: Date
    status: string
    notes?: string | null
    createdAt: Date
}>> => {
    // Users can only view their own payment history, admins can view any
    if (requestingUserRole !== Role.ADMIN && userId !== requestingUserId) {
        throw new AuthorizationError('You can only view your own payment history')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    const paymentRecords = await prisma.paymentRecord.findMany({
        where: { userId },
        orderBy: { paymentDate: 'desc' }
    })

    return paymentRecords.map(record => ({
        id: record.id,
        amount: Number(record.amount),
        currency: record.currency,
        paymentDate: record.paymentDate,
        dueDate: record.dueDate,
        status: record.status,
        notes: record.notes || null,
        createdAt: record.createdAt
    }))
}

/**
 * Get payment status for a user
 * Returns current payment status, next due date, and overdue information
 */
export const getPaymentStatus = async (
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role
): Promise<{
    userId: string
    lastPaymentDate: Date | null
    nextPaymentDueDate: Date | null
    isOverdue: boolean
    daysPastDue: number
    status: 'CURRENT' | 'DUE_SOON' | 'OVERDUE' | 'NO_PAYMENT_RECORD'
    latestPayment?: {
        id: string
        amount: number
        currency: string
        paymentDate: Date
        status: string
    }
}> => {
    // Users can only view their own payment status, admins can view any
    if (requestingUserRole !== Role.ADMIN && userId !== requestingUserId) {
        throw new AuthorizationError('You can only view your own payment status')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            lastPaymentDate: true,
            nextPaymentDueDate: true
        }
    })

    if (!user) {
        throw new ValidationError('User not found')
    }

    // Get the latest payment record for additional details
    const latestPayment = await prisma.paymentRecord.findFirst({
        where: { userId },
        orderBy: { paymentDate: 'desc' }
    })

    const now = new Date()
    let status: 'CURRENT' | 'DUE_SOON' | 'OVERDUE' | 'NO_PAYMENT_RECORD'
    let isOverdue = false
    let daysPastDue = 0

    if (!user.nextPaymentDueDate) {
        status = 'NO_PAYMENT_RECORD'
    } else {
        const daysUntilDue = Math.ceil((user.nextPaymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilDue < 0) {
            status = 'OVERDUE'
            isOverdue = true
            daysPastDue = Math.abs(daysUntilDue)
        } else if (daysUntilDue <= 7) {
            status = 'DUE_SOON'
        } else {
            status = 'CURRENT'
        }
    }

    const result: {
        userId: string
        lastPaymentDate: Date | null
        nextPaymentDueDate: Date | null
        isOverdue: boolean
        daysPastDue: number
        status: 'CURRENT' | 'DUE_SOON' | 'OVERDUE' | 'NO_PAYMENT_RECORD'
        latestPayment?: {
            id: string
            amount: number
            currency: string
            paymentDate: Date
            status: string
        }
    } = {
        userId: user.id,
        lastPaymentDate: user.lastPaymentDate,
        nextPaymentDueDate: user.nextPaymentDueDate,
        isOverdue,
        daysPastDue,
        status
    }

    if (latestPayment) {
        result.latestPayment = {
            id: latestPayment.id,
            amount: Number(latestPayment.amount),
            currency: latestPayment.currency,
            paymentDate: latestPayment.paymentDate,
            status: latestPayment.status
        }
    }

    return result
}

/**
 * Get all payment records (admin only)
 */
export const getAllPaymentRecords = async (
    options?: {
        userId?: string
        status?: string
        startDate?: Date
        endDate?: Date
        limit?: number
    }
): Promise<Array<{
    id: string
    userId: string
    userName: string
    userEmail: string
    amount: number
    currency: string
    paymentDate: Date
    dueDate: Date
    status: string
    createdAt: Date
    notes?: string | null
}>> => {
    const whereClause: any = {}

    if (options?.userId) {
        whereClause.userId = options.userId
    }

    if (options?.status) {
        whereClause.status = options.status
    }

    if (options?.startDate && options?.endDate) {
        whereClause.paymentDate = {
            gte: options.startDate,
            lte: options.endDate
        }
    }

    const queryOptions: any = {
        where: whereClause,
        orderBy: { paymentDate: 'desc' as const }
    }

    if (options?.limit) {
        queryOptions.take = options.limit
    }

    const paymentRecords = await prisma.paymentRecord.findMany(queryOptions)

    // Get user data separately to avoid complex typing issues
    const userIds = [...new Set(paymentRecords.map(record => record.userId))]
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
    })

    const userMap = new Map(users.map(user => [user.id, user]))

    return paymentRecords.map(record => {
        const user = userMap.get(record.userId)
        return {
            id: record.id,
            userId: record.userId,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            amount: Number(record.amount),
            currency: record.currency,
            paymentDate: record.paymentDate,
            dueDate: record.dueDate,
            status: record.status,
            notes: record.notes || null,
            createdAt: record.createdAt
        }
    })
}

/**
 * Update payment record status
 */
export const updatePaymentStatus = async (
    paymentId: string,
    status: PaymentStatus,
    notes?: string
): Promise<{
    id: string
    status: PaymentStatus
    notes?: string | null
}> => {
    const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId }
    })

    if (!payment) {
        throw new ValidationError('Payment record not found')
    }

    const updatedPayment = await prisma.paymentRecord.update({
        where: { id: paymentId },
        data: {
            status,
            ...(notes && { notes })
        }
    })

    return {
        id: updatedPayment.id,
        status: updatedPayment.status,
        notes: updatedPayment.notes || null
    }
}

/**
 * Get overdue payments (admin only)
 */
export const getOverduePayments = async (): Promise<Array<{
    userId: string
    userName: string
    userEmail: string
    lastPaymentDate: Date | null
    nextPaymentDueDate: Date | null
    daysPastDue: number
}>> => {
    const now = new Date()

    const users = await prisma.user.findMany({
        where: {
            role: Role.USER,
            nextPaymentDueDate: {
                lt: now
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            lastPaymentDate: true,
            nextPaymentDueDate: true
        }
    })

    return users.map(user => {
        const daysPastDue = user.nextPaymentDueDate
            ? Math.ceil((now.getTime() - user.nextPaymentDueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0

        return {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            lastPaymentDate: user.lastPaymentDate,
            nextPaymentDueDate: user.nextPaymentDueDate,
            daysPastDue
        }
    })
} 