export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
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
