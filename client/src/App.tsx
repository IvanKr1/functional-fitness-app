import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { BookingScheduler } from './components/BookingScheduler';
import { useStore } from './store/useStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useStore();
    return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

export const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <MainLayout>
                                <AdminPage />
                            </MainLayout>
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <MainLayout>
                                <BookingScheduler />
                            </MainLayout>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
};
