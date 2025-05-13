export interface Booking {
    id: string;
    userName: string;
    bookingHour: string;
    date: string;
    facility: string;
    createdAt: string;
}

export interface BookingFilters {
    userName: string;
    bookingHour: string;
}

export interface AdminDashboardProps {
    className?: string;
}

export interface BookingTableProps {
    className?: string;
}

export interface BookingFiltersProps {
    className?: string;
    onFilterChange: (filters: BookingFilters) => void;
    filters: BookingFilters;
}
