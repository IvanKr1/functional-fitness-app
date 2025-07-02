import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Paper,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Event, AccessTime, CreditCard, Warning, Save, Edit, Key } from '@mui/icons-material';
import { format, addDays, isAfter, isBefore, subDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api.js';
import { ResetPasswordForm } from '../components/ResetPasswordForm.js'
import { BookingHistoryModal } from '../components/BookingHistoryModal.js'

interface UserProfile {
    id: string;
    name: string;
    email: string;
    mobilePhone?: string;
    role: string;
    weeklyBookingLimit: number;
    lastPaymentDate?: string;
    nextPaymentDueDate?: string;
    notes?: string;
    createdAt: string;
}

interface Booking {
    id: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string;
    date: string;
}

interface ResetPasswordResponse {
    success: boolean;
    data?: {
        user: UserProfile;
        newPassword: string;
    };
    message?: string;
    error?: string;
}

export const UserDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { currentUser } = useStore();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [injuryNotes, setInjuryNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showBookingHistory, setShowBookingHistory] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetPasswordResult, setResetPasswordResult] = useState<{ show: boolean; password: string }>({ show: false, password: '' });

    // Fetch user profile and bookings
    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;

            setIsLoading(true);
            try {
                // Fetch user profile
                const profileResponse = await apiService.get<{
                    success: boolean;
                    data?: { user: UserProfile };
                    error?: string;
                }>(`/users/${currentUser.id}`);

                if (profileResponse.success && profileResponse.data?.user) {
                    setUserProfile(profileResponse.data.user);
                    setInjuryNotes(profileResponse.data.user.notes || '');
                }

                // Fetch user bookings
                const bookingsResponse = await apiService.get<{
                    success: boolean;
                    data?: Array<{
                        id: string;
                        startTime: string;
                        endTime: string;
                        status: string;
                        notes?: string | null;
                    }>;
                    error?: string;
                }>('/bookings');

                if (bookingsResponse.success && bookingsResponse.data) {
                    const userBookings = bookingsResponse.data.map(booking => ({
                        id: booking.id,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        startTime: format(new Date(booking.startTime), 'HH:mm'),
                        endTime: format(new Date(booking.endTime), 'HH:mm'),
                        date: format(new Date(booking.startTime), 'yyyy-MM-dd'),
                    }));
                    setBookings(userBookings);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser]);

    // Save injury notes
    const handleSaveInjuryNotes = async () => {
        if (!currentUser || !userProfile) return;

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await apiService.patch<{
                success: boolean;
                data?: { user: UserProfile };
                error?: string;
            }>(`/users/${currentUser.id}/notes`, {
                notes: injuryNotes
            });

            console.log('response', response)

            if (response.success && response.data) {
                setIsEditing(false);
                setSuccess('Injury notes saved successfully');
            } else {
                setError(response.error || 'Failed to save injury notes');
            }
        } catch (error) {
            console.error('Error saving injury notes:', error);
            setError('Failed to save injury notes');
        } finally {
            setIsSaving(false);
        }
    };

    // Get payment status
    const getPaymentStatus = () => {
        if (!userProfile?.nextPaymentDueDate) {
            return { status: 'No payment due', color: 'success' as const };
        }

        const dueDate = new Date(userProfile.nextPaymentDueDate);
        const today = new Date();

        if (isBefore(dueDate, today)) {
            return { status: 'Payment Overdue', color: 'error' as const };
        } else if (isBefore(dueDate, addDays(today, 7))) {
            return { status: 'Payment Due Soon', color: 'warning' as const };
        } else {
            return { status: 'Payment Up to Date', color: 'success' as const };
        }
    };

    // Get upcoming bookings
    const getUpcomingBookings = () => {
        const today = new Date();
        return bookings
            .filter(booking => new Date(booking.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3); // Show next 3 bookings
    };

    // Reset password
    const handleResetPassword = async () => {
        if (!currentUser) return;

        setIsResettingPassword(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await apiService.post<ResetPasswordResponse>(`/auth/reset-password/${currentUser.id}`);
            
            if (response.success && response.data) {
                setResetPasswordResult({ show: true, password: response.data.newPassword });
                setShowResetPasswordDialog(false);
                setSuccess('Password reset successfully. Please check the dialog for your new password.');
            } else {
                setError(response.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Failed to reset password');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const closeResetPasswordResult = () => {
        setResetPasswordResult({ show: false, password: '' });
    };

    // Filter bookings from the last 30 days
    const last30DaysBookings = bookings.filter(b => {
        const date = new Date(b.startTime)
        return date >= subDays(new Date(), 30)
    })

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!userProfile) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load user profile
            </Alert>
        );
    }

    const paymentStatus = getPaymentStatus();
    const upcomingBookings = getUpcomingBookings();

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Top bar with Reset Password and Booking History buttons */}
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}
              className="sm:flex-row flex-col sm:items-center items-stretch gap-2 hidden sm:flex"
            >
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowBookingHistory(true)}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                    className="sm:px-6 sm:py-2 px-3 py-2 text-base sm:text-base text-sm rounded-md sm:rounded-lg mb-2 sm:mb-0"
                >
                    Show Booking History
                </Button>
                <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => setShowResetPasswordDialog(true)}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                    className="sm:px-6 sm:py-2 px-3 py-2 text-base sm:text-base text-sm rounded-md sm:rounded-lg"
                >
                    Reset Password
                </Button>
            </Box>

            {/* Mobile fixed bottom bar for Booking History and Reset Password */}
            <Box
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex sm:hidden justify-center gap-2 p-3"
              style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}
            >
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowBookingHistory(true)}
                    sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
                    className="px-3 py-2 text-sm rounded-md w-full"
                >
                    Show Booking History
                </Button>
                <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => setShowResetPasswordDialog(true)}
                    sx={{ textTransform: 'none', fontWeight: 500, flex: 1 }}
                    className="px-3 py-2 text-sm rounded-md w-full"
                >
                    Reset Password
                </Button>
            </Box>

            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                  className="flex-col sm:flex-row sm:items-center items-start gap-2"
                >
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Welcome back, {userProfile.name}!
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/')} 
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                        className="sm:px-6 sm:py-2 px-3 py-2 text-base sm:text-base text-sm rounded-md sm:rounded-lg hidden sm:inline-flex"
                    >
                        Book Training
                    </Button>
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Here's your fitness journey overview
                </Typography>
            </Box>

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Payment Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CreditCard sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Payment Information
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={paymentStatus.status}
                                    color={paymentStatus.color}
                                    sx={{ mb: 2 }}
                                />
                            </Box>

                            {userProfile.lastPaymentDate && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Last Payment
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {format(new Date(userProfile.lastPaymentDate), 'MMMM d, yyyy')}
                                    </Typography>
                                </Box>
                            )}

                            {userProfile.nextPaymentDueDate && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Next Payment Due
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {format(new Date(userProfile.nextPaymentDueDate), 'MMMM d, yyyy')}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Training Information */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Event sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Training Information
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Weekly Booking Limit
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {userProfile.weeklyBookingLimit} sessions per week
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Total Bookings This Week
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {bookings.length} sessions
                                </Typography>
                            </Box>

                            {upcomingBookings.length > 0 && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Next Training Sessions
                                    </Typography>
                                    {upcomingBookings.map((booking) => (
                                        <Box key={booking.id} sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {format(new Date(booking.date), 'EEEE, MMMM d')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {booking.startTime} - {booking.endTime}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Injury & Health Notes */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Warning sx={{ mr: 1, color: theme.palette.warning.main }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Injury & Health Information
                                    </Typography>
                                </Box>
                                {!isEditing && (
                                    <Button
                                        startIcon={<Edit />}
                                        onClick={() => setIsEditing(true)}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Please provide information about any injuries you have or have had, 
                                as well as any health conditions that might affect your training.
                            </Typography>

                            {isEditing ? (
                                <Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        value={injuryNotes}
                                        onChange={(e) => setInjuryNotes(e.target.value)}
                                        placeholder="Describe any injuries, health conditions, or concerns that might affect your training..."
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveInjuryNotes}
                                            disabled={isSaving}
                                            startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
                                        >
                                            {isSaving ? 'Saving...' : 'Save Notes'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setInjuryNotes(userProfile.notes || '');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        minHeight: 120,
                                        backgroundColor: theme.palette.grey[50],
                                    }}
                                >
                                    {injuryNotes ? (
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {injuryNotes}
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No injury or health information provided yet. 
                                            Click "Edit" to add your information.
                                        </Typography>
                                    )}
                                </Paper>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Reset Password Dialog */}
            <Dialog
                open={showResetPasswordDialog}
                onClose={() => setShowResetPasswordDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <ResetPasswordForm onSuccess={() => setShowResetPasswordDialog(false)} onCancel={() => setShowResetPasswordDialog(false)} />
                </DialogContent>
            </Dialog>

            {/* Reset Password Result Dialog */}
            <Dialog
                open={resetPasswordResult.show}
                onClose={closeResetPasswordResult}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Key sx={{ mr: 1, color: theme.palette.success.main }} />
                        Password Reset Successful
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Your password has been reset successfully. Here's your new password:
                    </Typography>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.success.light,
                            borderColor: theme.palette.success.main,
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: theme.palette.success.dark,
                            }}
                        >
                            {resetPasswordResult.password}
                        </Typography>
                    </Paper>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        <strong>Important:</strong> Please copy this password and save it securely. You'll need it to log in next time.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(resetPasswordResult.password);
                        }}
                        variant="outlined"
                    >
                        Copy Password
                    </Button>
                    <Button
                        onClick={closeResetPasswordResult}
                        variant="contained"
                        color="primary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Booking History Modal */}
            <BookingHistoryModal open={showBookingHistory} onClose={() => setShowBookingHistory(false)} bookings={last30DaysBookings} />
        </Box>
    );
}; 