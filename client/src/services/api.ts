const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9080/api/v1'

/**
 * Base API service for making HTTP requests
 */
class ApiService {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    /**
     * Make a GET request
     */
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
            ...options
        })
    }

    /**
     * Make a POST request
     */
    async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options
        })
    }

    /**
     * Make a PATCH request
     */
    async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            },
            body: data ? JSON.stringify(data) : undefined,
            ...options
        })
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            ...options
        })
    }

    /**
     * Make a generic HTTP request
     */
    private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        const config: RequestInit = {
            credentials: 'include', // Include cookies for authentication
            ...options
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }))
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw new Error('Network error')
        }
    }
}

export const apiService = new ApiService(API_BASE_URL) 