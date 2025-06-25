import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useStore } from '../store/useStore';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, currentUser, isAuthenticated, isLoading, error, clearError } = useStore();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            navigate(currentUser.role === 'ADMIN' ? '/admin' : '/');
        }
    }, [isAuthenticated, currentUser, navigate]);

    // Clear error when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!formData.email || !formData.password) {
            return;
        }

        await login({
            email: formData.email,
            password: formData.password
        });
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: 2
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%' }}>
                <CardContent>
                    <Typography variant="h5" component="h1" gutterBottom align="center">
                        Login
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading || !formData.email || !formData.password}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
