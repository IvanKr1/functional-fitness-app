export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
}

export interface Booking {
    id: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string;
    date: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    bookings: Booking[];
    isAvailable: boolean;
}

export interface DaySchedule {
    date: string;
    timeSlots: TimeSlot[];
}

export type ViewMode = 'daily' | 'weekly' | 'monthly';

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginFormData {
    email: string;
    password: string;
}
