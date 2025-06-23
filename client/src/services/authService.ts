import { apiService } from './api.js'

export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthResponse {
    success: boolean
    data?: {
        user: {
            id: string
            name: string
            email: string
            role: 'ADMIN' | 'USER'
        }
        message?: string
    }
    error?: string
}

export interface ProfileResponse {
    success: boolean
    data?: {
        user: {
            id: string
            name: string
            email: string
            role: 'ADMIN' | 'USER'
        }
    }
    error?: string
}

/**
 * Authentication service for handling login, logout, and profile operations
 */
export class AuthService {
    /**
     * Login user with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        return apiService.post<AuthResponse>('/auth/login', credentials)
    }

    /**
     * Logout current user
     */
    async logout(): Promise<AuthResponse> {
        return apiService.post<AuthResponse>('/auth/logout')
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<ProfileResponse> {
        return apiService.get<ProfileResponse>('/auth/profile')
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(): Promise<AuthResponse> {
        return apiService.post<AuthResponse>('/auth/refresh')
    }

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<AuthResponse> {
        return apiService.patch<AuthResponse>(`/auth/change-password/${userId}`, {
            currentPassword,
            newPassword
        })
    }
}

export const authService = new AuthService() 