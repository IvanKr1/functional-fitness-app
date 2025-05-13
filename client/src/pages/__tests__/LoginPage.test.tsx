import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

vi.mock('../../store/useStore', () => ({
    useStore: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('LoginPage', () => {
    const mockNavigate = vi.fn();
    const mockSetCurrentUser = vi.fn();

    beforeEach(() => {
        vi.mocked(useStore).mockReturnValue({
            currentUser: null,
            bookings: [],
            addBooking: vi.fn(),
            removeBooking: vi.fn(),
            updateSchedules: vi.fn(),
            setCurrentUser: mockSetCurrentUser,
        });
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    it('renders the login form', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/login as admin/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('handles form submission with user role', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Test User' },
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(mockSetCurrentUser).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles form submission with admin role', async () => {
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'admin@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Admin User' },
        });
        fireEvent.click(screen.getByLabelText(/login as admin/i));

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(mockSetCurrentUser).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin',
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
