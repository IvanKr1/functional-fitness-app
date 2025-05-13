import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingScheduler } from '../Booking/BookingScheduler';
import { useStore } from '../../store/useStore';

vi.mock('../../store/useStore', () => ({
    useStore: vi.fn(),
}));

describe('BookingScheduler', () => {
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
    };

    const mockBookings = [
        {
            id: '1',
            userId: '1',
            userName: 'Test User',
            startTime: '10:00',
            endTime: '11:00',
            date: '2024-03-20',
        },
    ];

    beforeEach(() => {
        vi.mocked(useStore).mockReturnValue({
            currentUser: mockUser,
            bookings: mockBookings,
            addBooking: vi.fn(),
            removeBooking: vi.fn(),
            updateSchedules: vi.fn(),
            setCurrentUser: vi.fn(),
        });
    });

    it('renders the scheduler with daily view by default', () => {
        render(<BookingScheduler />);
        expect(screen.getByText('Daily')).toBeInTheDocument();
        expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('shows booking confirmation dialog when clicking a time slot', () => {
        render(<BookingScheduler />);
        const timeSlot = screen.getByText('10:00 - 11:00');
        fireEvent.click(timeSlot);
        expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
    });

    it('displays the correct number of bookings for a time slot', () => {
        render(<BookingScheduler />);
        const bookingCount = screen.getByText('1 / 10 booked');
        expect(bookingCount).toBeInTheDocument();
    });
});
