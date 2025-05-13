export interface GymBooking {
    id: string
    userId: string
    userName: string
    bookingHour: string
    date: string
    facility: string
    createdAt: string
    status: 'active' | 'cancelled' | 'completed'
}

export interface BookingFilters {
    userName: string
    bookingHour: string
}

export interface PaginationState {
    currentPage: number
    itemsPerPage: number
    totalItems: number
}

export interface AdminDashboardProps {
    className?: string
} 