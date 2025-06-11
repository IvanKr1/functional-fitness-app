import { Request, Response } from 'express'
import * as paymentService from '../services/paymentService.js'
import { AuthenticatedRequest } from '../types/index.js'

/**
 * Record payment endpoint (admin only)
 */
export const recordPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id: userId } = req.params
        const { paymentDate, amount = 50.00, currency = 'EUR', notes } = req.body

        if (!userId) {
            throw new Error('User ID is required')
        }

        const result = await paymentService.recordPayment(userId, paymentDate, amount, currency, notes)

        res.status(201).json({
            success: true,
            data: result,
            message: `Payment of €${result.paymentRecord.amount} recorded successfully. Next payment due: ${result.nextPaymentDueDate.toISOString().split('T')[0]}`
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to record payment'
        })
    }
}

/**
 * Get user payment history endpoint
 */
export const getUserPaymentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { id: userId } = req.params

        if (!userId) {
            throw new Error('User ID is required')
        }

        const paymentHistory = await paymentService.getUserPaymentHistory(
            userId,
            user!.id,
            user!.role
        )

        res.status(200).json({
            success: true,
            data: { paymentHistory },
            message: 'Payment history retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch payment history'
        })
    }
}

/**
 * Get payment status endpoint
 */
export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { user } = req
        const { userId } = req.query

        // Users can only get their own status, admins can get any user's status
        const targetUserId = (user!.role === 'ADMIN' && userId) ? userId as string : user!.id

        const paymentStatus = await paymentService.getPaymentStatus(
            targetUserId,
            user!.id,
            user!.role
        )

        res.status(200).json({
            success: true,
            data: paymentStatus,
            message: 'Payment status retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve payment status'
        })
    }
}

/**
 * Get all payment records endpoint (admin only)
 */
export const getAllPaymentRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { userId, status, startDate, endDate, limit } = req.query

        const options: any = {}
        if (userId) options.userId = userId as string
        if (status) options.status = status as string
        if (startDate) options.startDate = new Date(startDate as string)
        if (endDate) options.endDate = new Date(endDate as string)
        if (limit) options.limit = parseInt(limit as string)

        const paymentRecords = await paymentService.getAllPaymentRecords(options)

        res.status(200).json({
            success: true,
            data: paymentRecords,
            message: 'Payment records retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve payment records'
        })
    }
}

/**
 * Get overdue payments endpoint (admin only)
 */
export const getOverduePayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const overduePayments = await paymentService.getOverduePayments()

        res.status(200).json({
            success: true,
            data: overduePayments,
            message: 'Overdue payments retrieved successfully'
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retrieve overdue payments'
        })
    }
} 