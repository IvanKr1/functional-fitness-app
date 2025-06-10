import { Request, Response, NextFunction } from 'express'
import {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    BookingConflictError
} from '../types/index.js'
import { config } from '../config/index.js'

/**
 * Global error handling middleware
 * Handles all types of errors and provides consistent API responses
 */
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Don't handle if response already sent
    if (res.headersSent) {
        return next(error)
    }

    // Log error for debugging (in development) or monitoring (in production)
    if (config.NODE_ENV === 'development') {
        console.error('Error:', error)
    }

    // Handle specific error types
    if (error instanceof ValidationError) {
        res.status(400).json({
            success: false,
            error: error.message,
            field: error.field
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

    if (error instanceof AuthorizationError) {
        res.status(403).json({
            success: false,
            error: error.message
        })
        return
    }

    if (error instanceof BookingConflictError) {
        res.status(409).json({
            success: false,
            error: error.message
        })
        return
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any

        if (prismaError.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: 'Resource already exists',
                details: 'A record with this information already exists'
            })
            return
        }

        if (prismaError.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Resource not found'
            })
            return
        }
    }

    // Handle unexpected errors
    res.status(500).json({
        success: false,
        error: config.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error'
    })
}

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
    req: Request,
    res: Response
): void => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    })
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
} 