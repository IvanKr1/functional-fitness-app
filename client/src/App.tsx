import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { BookingScheduler } from './components/Booking/BookingScheduler';
import { useStore } from './store/useStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useStore();
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
                                    <Route path="/settings" element={<div>Settings Page</div>} />
                                </Routes>
                            </AdminLayout>
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
