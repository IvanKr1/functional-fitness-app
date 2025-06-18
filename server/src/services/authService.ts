import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { prisma } from '../config/database.js'
import { jwtConfig } from '../config/index.js'
import {
    AuthenticationError,
    ValidationError,
    JWTPayload,
    LoginRequest
} from '../types/index.js'


/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
}

/**
 * Compare password with hash
 */
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
}

/**
 * Generate JWT token for user
 */
const generateToken = (userId: string, email: string, role: Role): string => {
    const tokenExpiresIn = process.env.JWT_LIFE_HOURS ?? "24"

    const payload: JWTPayload = {
        userId,
        email,
        role
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET ?? "", {
        algorithm: "HS256",
        expiresIn: Number(tokenExpiresIn),
    });

    return accessToken;
}

/**
 * Authenticate user with email and password
 */
export const loginUser = async (credentials: LoginRequest): Promise<{
    user: {
        id: string
        name: string
        email: string
        role: Role
    }
    token: string
}> => {
    const { email, password } = credentials

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    })

    if (!user) {
        throw new AuthenticationError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)

    if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password')
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role)
    console.log('token', token)

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    }
}

/**
 * Change user password
 */
export const changePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    // Get user
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!user) {
        throw new AuthenticationError('User not found')
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash)

    if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
    })
}

/**
 * Verify JWT token and return user data
 */
export const verifyToken = async (token: string): Promise<{
    id: string
    email: string
    name: string
    role: Role
}> => {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload

        // Get current user data from database
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

        return user
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthenticationError('Invalid token')
        }
        throw error
    }
}

/**
 * Generate a long-lasting development token (7 days)
 * Only for development/testing purposes
 * Only admins can generate this token
 */
export const generateDevToken = async (credentials: LoginRequest): Promise<{
    user: {
        id: string
        name: string
        email: string
        role: Role
    }
    token: string
}> => {
    const { email, password } = credentials

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    })

    if (!user) {
        throw new AuthenticationError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)

    if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password')
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
        throw new AuthenticationError('Only administrators can generate development tokens')
    }

    // Generate token with 7 days expiration
    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET ?? "",
        {
            algorithm: "HS256",
            expiresIn: "7d"
        }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    }
} 