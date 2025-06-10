import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { prisma } from '../config/database.js'
import { jwtConfig } from '../config/index.js'
import {
    AuthenticationError,
    ValidationError,
    JWTPayload,
    LoginRequest,
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
 * Compare password with hash
 */
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
}

/**
 * Generate JWT token for user
 */
const generateToken = (userId: string, email: string, role: Role): string => {
    const payload: JWTPayload = {
        userId,
        email,
        role
    }

    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn
    })
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
            mobilePhone,
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
            mobilePhone: user.mobilePhone || undefined,
            weeklyBookingLimit: user.weeklyBookingLimit
        },
        generatedPassword
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