import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { UsersToPayPage } from './pages/UsersToPayPage';
import { TodayBookingsPage } from './pages/TodayBookingsPage';
import { UserDashboard } from './pages/UserDashboard';
import { BookingScheduler } from './components/Booking/BookingScheduler';
import { useStore } from './store/useStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser, isAuthenticated, getProfile, isLoading, error, clearError } = useStore();
    
    useEffect(() => {
        // Only check authentication if not already authenticated and not on login page
        if (!isAuthenticated && !isLoading) {
            getProfile();
        }
        // Clear error if on login page
        return () => {
            if (window.location.pathname === '/login') {
                clearError();
            }
        };
    }, [isAuthenticated, isLoading, getProfile, clearError]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const ConditionalLayout = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useStore();
    
    if (currentUser?.role === 'ADMIN') {
        return <AdminLayout>{children}</AdminLayout>;
    }
    
    return <MainLayout>{children}</MainLayout>;
};

export const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/admin/*"
                    element={
                        <PrivateRoute>
                            <AdminLayout>
                                <Routes>
                                    <Route path="/" element={<AdminPage />} />
                                    <Route path="/bookings/all" element={<AdminPage />} />
                                    <Route path="/bookings/active" element={<AdminPage />} />
                                    <Route path="/users" element={<UserManagementPage />} />
                                    <Route path="/users-to-pay" element={<UsersToPayPage />} />
                                    <Route path="/today-bookings" element={<TodayBookingsPage />} />
                                    <Route path="/settings" element={<div>Settings Page</div>} />
                                </Routes>
                            </AdminLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <ConditionalLayout>
                                <UserDashboard />
                            </ConditionalLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <ConditionalLayout>
                                <BookingScheduler />
                            </ConditionalLayout>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
};
