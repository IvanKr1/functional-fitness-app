import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import {
    AuthenticatedRequest,
    JWTPayload,
    AuthenticationError,
    AuthorizationError
} from '../types/index.js'
import { jwtConfig } from '../config/index.js'
import { prisma } from '../config/database.js'

/**
 * JWT Authentication middleware
 * Verifies JWT token from HttpOnly cookie and adds user data to request
 */
export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.token

        if (!token) {
            throw new AuthenticationError('No authentication token provided')
        }

        // Verify JWT token
        const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload

        // Get user from database to ensure they still exist and have current data
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        if (!user) {
            throw new AuthenticationError('User not found')
        }

        // Add user data to request object
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }

        next()
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid authentication token'
            })
            return
        }

        if (error instanceof AuthenticationError) {
            res.status(401).json({
                success: false,
                error: error.message
            })
            return
        }

        res.status(500).json({
            success: false,
            error: 'Authentication error'
        })
    }
}

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 */
export const requireRole = (allowedRoles: Role | Role[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new AuthenticationError('User not authenticated')
            }

            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

            if (!roles.includes(req.user.role)) {
                throw new AuthorizationError(`Access denied. Required role: ${roles.join(' or ')}`)
            }

            next()
        } catch (error) {
            if (error instanceof AuthenticationError) {
                res.status(401).json({
                    success: false,
                    error: error.message
                })
                return
            }

            if (error instanceof AuthorizationError) {
                res.status(403).json({
                    success: false,
                    error: error.message
                })
                return
            }

            res.status(500).json({
                success: false,
                error: 'Authorization error'
            })
        }
    }
}

/**
 * Admin only authorization middleware
 * Shorthand for requiring ADMIN role
 */
export const requireAdmin = requireRole(Role.ADMIN)

/**
 * User or Admin authorization middleware
 * Allows both USER and ADMIN roles
 */
export const requireUser = requireRole([Role.USER, Role.ADMIN])

/**
 * Optional authentication middleware
 * Adds user data if token is present but doesn't require authentication
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.token

        if (token) {
            const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            })

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        }

        next()
    } catch (error) {
        // Continue without authentication if token is invalid
        next()
    }
} 