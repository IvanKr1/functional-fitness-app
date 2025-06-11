import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types/index.js'
import * as userService from '../services/userService.js'

/**
 * Get all users endpoint (admin only)
 */
export const getAllUsers = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const users = await userService.getAllUsers()

        const response: ApiResponse = {
            success: true,
            data: { users }
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch users'
        }

        res.status(500).json(response)
    }
}

/**
 * Get user by ID endpoint
 */
export const getUserById = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const requestingUserId = req.user?.id as string
        const requestingUserRole = req.user?.role

        if (!requestingUserId || !requestingUserRole) {
            const response: ApiResponse = {
                success: false,
                error: 'Authentication required'
            }
            res.status(401).json(response)
            return
        }

        const user = await userService.getUserById(
            userId,
            requestingUserId,
            requestingUserRole
        )

        const response: ApiResponse = {
            success: true,
            data: { user }
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'AuthorizationError' ? 403 :
            error instanceof Error && error.name === 'ValidationError' ? 404 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Update user endpoint
 */
export const updateUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const updateData = req.body
        const requestingUserId = req.user?.id as string
        const requestingUserRole = req.user?.role

        if (!requestingUserId || !requestingUserRole) {
            const response: ApiResponse = {
                success: false,
                error: 'Authentication required'
            }
            res.status(401).json(response)
            return
        }

        const user = await userService.updateUser(
            userId,
            updateData,
            requestingUserId,
            requestingUserRole
        )

        const response: ApiResponse = {
            success: true,
            data: { user },
            message: 'User updated successfully'
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'AuthorizationError' ? 403 :
            error instanceof Error && error.name === 'ValidationError' ? 400 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update user'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Update user notes endpoint
 */
export const updateUserNotes = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const notesData = req.body
        const requestingUserId = req.user?.id as string
        const requestingUserRole = req.user?.role

        if (!requestingUserId || !requestingUserRole) {
            const response: ApiResponse = {
                success: false,
                error: 'Authentication required'
            }
            res.status(401).json(response)
            return
        }

        const result = await userService.updateUserNotes(
            userId,
            notesData,
            requestingUserId,
            requestingUserRole
        )

        const response: ApiResponse = {
            success: true,
            data: result,
            message: 'User notes updated successfully'
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'AuthorizationError' ? 403 :
            error instanceof Error && error.name === 'ValidationError' ? 404 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update user notes'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Update user booking limit endpoint (admin only)
 */
export const updateUserBookingLimit = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const { weeklyBookingLimit } = req.body

        const result = await userService.updateUserBookingLimit(
            userId,
            weeklyBookingLimit
        )

        const response: ApiResponse = {
            success: true,
            data: result,
            message: 'Booking limit updated successfully'
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'ValidationError' ? 400 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update booking limit'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Delete user endpoint (admin only)
 */
export const deleteUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string

        await userService.deleteUser(userId)

        const response: ApiResponse = {
            success: true,
            message: 'User deleted successfully'
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'ValidationError' ? 400 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete user'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Get user statistics endpoint
 */
export const getUserStats = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string

        const stats = await userService.getUserStats(userId)

        const response: ApiResponse = {
            success: true,
            data: { stats }
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'ValidationError' ? 404 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user statistics'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Register a new user endpoint (admin only)
 */
export const register = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { user, generatedPassword } = await userService.registerUser(req.body)

        const response: ApiResponse = {
            success: true,
            data: {
                user,
                generatedPassword,
                message: 'User registered successfully'
            }
        }

        res.status(201).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'ValidationError' ? 400 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Record user payment endpoint (admin only)
 */
export const recordPayment = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const { paymentDate, amount = 50.00, currency = 'EUR', notes } = req.body

        const result = await userService.recordPayment(userId, paymentDate, amount, currency, notes)

        const response: ApiResponse = {
            success: true,
            data: result,
            message: `Payment of €${result.paymentRecord.amount} recorded successfully. Next payment due: ${result.nextPaymentDueDate.toISOString().split('T')[0]}`
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'ValidationError' ? 404 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to record payment'
        }

        res.status(statusCode).json(response)
    }
}

/**
 * Get user payment history endpoint
 */
export const getUserPaymentHistory = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const requestingUserId = req.user?.id as string
        const requestingUserRole = req.user?.role

        if (!requestingUserId || !requestingUserRole) {
            const response: ApiResponse = {
                success: false,
                error: 'Authentication required'
            }
            res.status(401).json(response)
            return
        }

        const paymentHistory = await userService.getUserPaymentHistory(
            userId,
            requestingUserId,
            requestingUserRole
        )

        const response: ApiResponse = {
            success: true,
            data: { paymentHistory }
        }

        res.status(200).json(response)
    } catch (error) {
        const statusCode = error instanceof Error && error.name === 'AuthorizationError' ? 403 :
            error instanceof Error && error.name === 'ValidationError' ? 404 : 500

        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch payment history'
        }

        res.status(statusCode).json(response)
    }
} 