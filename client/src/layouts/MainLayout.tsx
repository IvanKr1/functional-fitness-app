import type { ReactNode } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useStore();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        navigate(newValue);
    };

    const getCurrentTab = () => {
        if (location.pathname === '/dashboard') return '/dashboard';
        return '/';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Gym Booking
                    </Typography>
                    {currentUser && (
                        <>
                            <Typography variant="body1" sx={{ mr: 2 }}>
                                {currentUser.name}
                            </Typography>
                            <Button color="inherit" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    )}
                </Toolbar>
                {currentUser && currentUser.role === 'USER' && (
                    <Tabs 
                        value={getCurrentTab()} 
                        onChange={handleTabChange}
                        sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiTab-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-selected': {
                                    color: 'white',
                                },
                            },
                        }}
                    >
                        <Tab label="Dashboard" value="/dashboard" />
                        <Tab label="Book Training" value="/" />
                    </Tabs>
                )}
            </AppBar>
            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                {children}
            </Container>
        </Box>
    );
};
