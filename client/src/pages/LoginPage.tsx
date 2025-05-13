import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { useStore } from '../store/useStore';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { setCurrentUser } = useStore();
    const [isAdmin, setIsAdmin] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const name = formData.get('name') as string;

        setCurrentUser({
            id: Math.random().toString(36).substr(2, 9),
            email,
            name,
            role: isAdmin ? 'admin' : 'user',
        });

        navigate('/');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%' }}>
                <CardContent>
                    <Typography variant="h5" component="h1" gutterBottom>
                        Login
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Full Name"
                            name="name"
                            autoComplete="name"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                />
                            }
                            label="Login as Admin"
                            sx={{ mt: 2 }}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
