import { create } from 'zustand'
import type { GymBooking, BookingFilters, PaginationState } from '../types/admin.types'

interface AdminBookingsState {
    bookings: GymBooking[]
    filters: BookingFilters
    pagination: PaginationState
    isLoading: boolean
    error: string | null

    // Actions
    setFilters: (filters: Partial<BookingFilters>) => void
    setPagination: (pagination: Partial<PaginationState>) => void
    fetchBookings: () => Promise<void>

    // Computed
    getFilteredBookings: () => GymBooking[]
    getPaginatedBookings: () => GymBooking[]
}

const ITEMS_PER_PAGE = 10

export const useAdminBookingsStore = create<AdminBookingsState>((set, get) => ({
    bookings: [],
    filters: {
        userName: '',
        bookingHour: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: ITEMS_PER_PAGE,
        totalItems: 0
    },
    isLoading: false,
    error: null,

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, currentPage: 1 }
        }))
    },

    setPagination: (newPagination) => {
        set((state) => ({
            pagination: { ...state.pagination, ...newPagination }
        }))
    },

    fetchBookings: async () => {
        set({ isLoading: true, error: null })
        try {
            // TODO: Replace with actual API call
            const mockBookings: GymBooking[] = Array.from({ length: 50 }, (_, index) => ({
                id: `booking-${index + 1}`,
                userId: `user-${index + 1}`,
                userName: `User ${index + 1}`,
                bookingHour: `${Math.floor(Math.random() * 12 + 8)}:00`,
                date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                facility: ['Gym', 'Pool', 'Tennis Court'][Math.floor(Math.random() * 3)],
                createdAt: new Date().toISOString(),
                status: ['active', 'cancelled', 'completed'][Math.floor(Math.random() * 3)] as GymBooking['status']
            }))

            set({
                bookings: mockBookings,
                pagination: {
                    ...get().pagination,
                    totalItems: mockBookings.length
                },
                isLoading: false
            })
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'An error occurred', isLoading: false })
        }
    },

    getFilteredBookings: () => {
        const { bookings, filters } = get()
        return bookings.filter(booking => {
            const userNameMatch = !filters.userName ||
                booking.userName.toLowerCase().includes(filters.userName.toLowerCase())
            const bookingHourMatch = !filters.bookingHour ||
                booking.bookingHour === filters.bookingHour
            return userNameMatch && bookingHourMatch
        })
    },

    getPaginatedBookings: () => {
        const { pagination: { currentPage, itemsPerPage } } = get()
        const filteredBookings = get().getFilteredBookings()
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        return filteredBookings.slice(start, end)
    }
})) 