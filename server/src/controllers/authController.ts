import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types/index.js'
import * as authService from '../services/authService.js'
import { cookieConfig, isDevelopment } from '../config/index.js'

/**
 * User login endpoint
 */
export const login = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const { user, token } = await authService.loginUser(req.body)

        // Set HTTP-only cookie
        res.cookie('token', token, cookieConfig.options)

        const response: ApiResponse = {
            success: true,
            data: {
                user,
                message: 'Login successful'
            }
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed'
        }

        res.status(401).json(response)
    }
}

/**
 * User logout endpoint
 */
export const logout = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        // Clear the authentication cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: cookieConfig.options.secure,
            sameSite: cookieConfig.options.sameSite
        })

        const response: ApiResponse = {
            success: true,
            message: 'Logout successful'
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: 'Logout failed'
        }

        res.status(500).json(response)
    }
}

/**
 * Change password endpoint
 */
export const changePassword = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.params.id as string
        const { currentPassword, newPassword } = req.body

        // Users can only change their own password, admins can change any password
        if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
            const response: ApiResponse = {
                success: false,
                error: 'You can only change your own password'
            }
            res.status(403).json(response)
            return;
        }

        await authService.changePassword(userId, currentPassword, newPassword)

        const response: ApiResponse = {
            success: true,
            message: 'Password changed successfully'
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Password change failed'
        }

        res.status(400).json(response)
    }
}

/**
 * Get current user profile endpoint
 */
export const getProfile = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            const response: ApiResponse = {
                success: false,
                error: 'User not authenticated'
            }
            res.status(401).json(response)
            return
        }

        // Get fresh user data from database
        const token = req.cookies?.token
        if (!token) {
            const response: ApiResponse = {
                success: false,
                error: 'No authentication token'
            }
            res.status(401).json(response)
            return
        }

        const user = await authService.verifyToken(token)

        const response: ApiResponse = {
            success: true,
            data: { user }
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get profile'
        }

        res.status(401).json(response)
    }
}

/**
 * Refresh token endpoint
 */
export const refreshToken = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const currentToken = req.cookies?.token

        if (!currentToken) {
            const response: ApiResponse = {
                success: false,
                error: 'No token to refresh'
            }
            res.status(401).json(response)
            return
        }

        // Verify current token and get user data
        const user = await authService.verifyToken(currentToken)

        // Generate new token
        const newToken = await authService.loginUser({
            email: user.email,
            password: '' // This won't be checked in a refresh scenario
        })

        // Set new cookie
        res.cookie('token', newToken.token, cookieConfig.options)

        const response: ApiResponse = {
            success: true,
            data: {
                user: newToken.user,
                message: 'Token refreshed successfully'
            }
        }

        res.status(200).json(response)
    } catch (error) {
        // Clear invalid cookie
        res.clearCookie('token')

        const response: ApiResponse = {
            success: false,
            error: 'Token refresh failed'
        }

        res.status(401).json(response)
    }
}

/**
 * Get development token endpoint (development only)
 * Returns a long-lasting token for development/testing purposes
 */
export const getDevToken = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        // Only allow in development mode
        if (!isDevelopment()) {
            const response: ApiResponse = {
                success: false,
                error: 'Development tokens are only available in development mode'
            }
            res.status(403).json(response)
            return
        }

        const { email, password } = req.body

        // Get user data first
        const { user } = await authService.loginUser({ email, password })

        // Generate a long-lasting token (1 year)
        const devToken = await authService.generateDevToken(user.id, user.email, user.role)

        const response: ApiResponse = {
            success: true,
            data: {
                user,
                token: devToken,
                message: 'Development token generated (expires in 1 year)',
                usage: 'Use this token in Authorization header: Bearer ' + devToken
            }
        }

        res.status(200).json(response)
    } catch (error) {
        const response: ApiResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate development token'
        }

        res.status(401).json(response)
    }
} 