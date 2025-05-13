import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Booking, DaySchedule } from '../types';

interface AppState {
    currentUser: User | null;
    bookings: Booking[];
    schedules: DaySchedule[];
    setCurrentUser: (user: User | null) => void;
    addBooking: (booking: Booking) => void;
    removeBooking: (bookingId: string) => void;
    updateSchedules: (schedules: DaySchedule[]) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            currentUser: null,
            bookings: [],
            schedules: [],
            setCurrentUser: (user) => set({ currentUser: user }),
            addBooking: (booking) =>
                set((state) => ({
                    bookings: [...state.bookings, booking],
                })),
            removeBooking: (bookingId) =>
                set((state) => ({
                    bookings: state.bookings.filter((b) => b.id !== bookingId),
                })),
            updateSchedules: (schedules) => set({ schedules }),
        }),
        {
            name: 'gym-booking-storage',
        }
    )
);
