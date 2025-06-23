import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Booking, DaySchedule, AuthState } from '../types';
import { authService, type LoginCredentials } from '../services/authService.js';

interface AppState extends AuthState {
    currentUser: User | null;
    bookings: Booking[];
    schedules: DaySchedule[];
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    getProfile: () => Promise<void>;
    clearError: () => void;
    addBooking: (booking: Booking) => void;
    removeBooking: (bookingId: string) => void;
    updateSchedules: (schedules: DaySchedule[]) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Auth state
            user: null,
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Auth actions
            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await authService.login(credentials);
                    if (response.success && response.data?.user) {
                        set({
                            user: response.data.user,
                            currentUser: response.data.user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        set({
                            isLoading: false,
                            error: response.error || 'Login failed'
                        });
                    }
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Login failed'
                    });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await authService.logout();
                    set({
                        user: null,
                        currentUser: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Logout failed'
                    });
                }
            },

            getProfile: async () => {
                set({ isLoading: true });
                try {
                    const response = await authService.getProfile();
                    if (response.success && response.data?.user) {
                        set({
                            user: response.data.user,
                            currentUser: response.data.user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        set({
                            user: null,
                            currentUser: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: response.error || 'Failed to get profile'
                        });
                    }
                } catch (error) {
                    set({
                        user: null,
                        currentUser: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to get profile'
                    });
                }
            },

            clearError: () => {
                set({ error: null });
            },

            // Booking state
            bookings: [],
            schedules: [],

            // Booking actions
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
            partialize: (state) => ({
                user: state.user,
                currentUser: state.currentUser,
                isAuthenticated: state.isAuthenticated,
                bookings: state.bookings,
                schedules: state.schedules
            })
        }
    )
);
