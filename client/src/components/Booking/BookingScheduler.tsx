import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Tab,
    Tabs,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    useTheme,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { useStore } from '../../store/useStore';
import { apiService } from '../../services/api.js';
import type { ViewMode } from '../../types';


// Maximum number of bookings allowed per time slot
const MAX_BOOKINGS_PER_SLOT = 10;

export const BookingScheduler = () => {
    const theme = useTheme();
    const { currentUser, bookings, addBooking, removeBooking, setBookings } = useStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [uiSelectedSlot, setUiSelectedSlot] = useState<string | null>(null);
    const [bookingToRemove, setBookingToRemove] = useState<string | null>(null);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [bookingError, setBookingError] = useState<string | null>(null);

    // Fetch user bookings from database on component mount
    useEffect(() => {
        const fetchUserBookings = async () => {
            if (!currentUser) return;

            setIsLoadingBookings(true);
            try {
                const response = await apiService.get<{
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

                if (response.success && response.data) {
                    // Convert API response to local booking format
                    const userBookings = response.data.map(booking => ({
                        id: booking.id,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        startTime: format(new Date(booking.startTime), 'HH:mm'),
                        endTime: format(new Date(booking.endTime), 'HH:mm'),
                        date: format(new Date(booking.startTime), 'yyyy-MM-dd'),
                    }));

                    // Replace all bookings with fetched ones
                    setBookings(userBookings);
                }
            } catch (error) {
                console.error('Error fetching user bookings:', error);
            } finally {
                setIsLoadingBookings(false);
            }
        };

        fetchUserBookings();
    }, [currentUser, setBookings]);

    // Get user's upcoming bookings
    const userBookings = currentUser
        ? bookings
              .filter((booking) => booking.userId === currentUser.id)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [];

    // Get booking limits status
    const getBookingLimitsStatus = () => {
        if (!currentUser) return { daily: false, weekly: false };

        const bookingDate = format(selectedDate, 'yyyy-MM-dd');
        const startOfCurrentWeek = startOfWeek(selectedDate);
        const endOfCurrentWeek = endOfWeek(selectedDate);

        const hasBookingForDay = bookings.some(
            (booking) => booking.userId === currentUser.id && booking.date === bookingDate
        );

        const weeklyBookings = bookings.filter(
            (booking) =>
                booking.userId === currentUser.id &&
                new Date(booking.date) >= startOfCurrentWeek &&
                new Date(booking.date) <= endOfCurrentWeek
        );

        return {
            daily: hasBookingForDay,
            weekly: weeklyBookings.length >= 3,
        };
    };

    // Handle resetting booking limits
    const handleResetLimits = () => {
        setIsResetDialogOpen(true);
    };

    // Confirm reset booking limits
    const handleConfirmReset = async () => {
        if (!currentUser) return;

        try {
            // Use the new bulk delete endpoint
            const response = await apiService.delete<{
                success: boolean;
                data?: { deletedCount: number };
                error?: string;
            }>(`/bookings/user/${currentUser.id}`);

            if (response.success && response.data) {
                // Refresh bookings from server to get updated data
                const refreshResponse = await apiService.get<{
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

                if (refreshResponse.success && refreshResponse.data) {
                    // Convert API response to local booking format
                    const userBookings = refreshResponse.data.map(booking => ({
                        id: booking.id,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        startTime: format(new Date(booking.startTime), 'HH:mm'),
                        endTime: format(new Date(booking.endTime), 'HH:mm'),
                        date: format(new Date(booking.startTime), 'yyyy-MM-dd'),
                    }));

                    // Replace all bookings with fetched ones
                    setBookings(userBookings);
                }
                
                setIsResetDialogOpen(false);
                console.log(`Successfully cancelled ${response.data.deletedCount} booking(s)`);
            } else {
                console.error('Failed to reset bookings:', response.error);
                // You might want to show an error message to the user here
            }
        } catch (error) {
            console.error('Error resetting bookings:', error);
            // Handle network or other errors
        }
    };

    // Handle switching between daily and weekly views
    const handleViewModeChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
        setViewMode(newValue);
    };

    // Update selected date when user picks a new date from calendar
    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date);
            setUiSelectedSlot(null);
        }
    };

    // Handle clicking on a time slot
    // Checks for booking limits before allowing the dialog to open
    const handleSlotClick = (slot: string) => {
        if (!currentUser) return;

        const [startTime] = slot.split(' - ');
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const bookingDate = format(selectedDate, 'yyyy-MM-dd');

        // Check if the selected slot is already full (10 bookings)
        const slotBookings = bookings.filter(
            (booking) => booking.date === bookingDate && booking.startTime === startTime
        );

        if (slotBookings.length >= MAX_BOOKINGS_PER_SLOT) {
            return;
        }

        // Check if user already has a booking for this day (1 booking per day limit)
        const hasBookingForDay = bookings.some(
            (booking) => booking.userId === currentUser.id && booking.date === bookingDate
        );

        if (hasBookingForDay) {
            return;
        }

        // Check if user has reached weekly limit (3 bookings per week)
        const startOfCurrentWeek = startOfWeek(selectedDate);
        const endOfCurrentWeek = endOfWeek(selectedDate);

        const weeklyBookings = bookings.filter(
            (booking) =>
                booking.userId === currentUser.id &&
                new Date(booking.date) >= startOfCurrentWeek &&
                new Date(booking.date) <= endOfCurrentWeek
        );

        if (weeklyBookings.length >= 3) {
            return;
        }

        // Check if the booking time is in the past
        const now = new Date();
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(startHours, startMinutes, 0, 0);
        
        if (selectedDateTime <= now) {
            return; // Don't allow booking past times
        }

        // Check if the booking time is within allowed hours (7:00 - 20:00)
        if (startHours < 7 || startHours >= 20) {
            return; // Don't allow booking outside allowed hours
        }

        // If all checks pass, open the booking dialog
        setSelectedSlot(slot);
        setIsBookingDialogOpen(true);
    };

    // Handle confirming a booking
    // Performs final validation before adding the booking
    const handleBookingConfirm = async () => {
        if (!currentUser || !selectedSlot) return;

        setBookingError(null); // Clear any previous errors

        const [startTime] = selectedSlot.split(' - ');
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const endDate = new Date(selectedDate);
        endDate.setHours(startHours + 1, startMinutes, 0);
        const endTime = format(endDate, 'HH:mm');
        const bookingDate = format(selectedDate, 'yyyy-MM-dd');

        // Create ISO datetime strings for the API
        // Use the selected date and parse the time properly
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);
        
        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(startHours + 1, startMinutes, 0, 0);

        // Validate that the booking is within allowed hours (7:00 - 20:00)
        if (startHours < 7 || startHours >= 20) {
            setBookingError('Booking time is outside allowed hours (7:00 - 20:00)');
            return;
        }

        // Check if booking is in the past
        const now = new Date();
        if (startDateTime <= now) {
            setBookingError('Cannot book sessions in the past. Please select a future time.');
            return;
        }

        const requestData = {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            notes: '' // Optional notes field
        };

        console.log('Sending booking request:', requestData);

        try {
            // Make API call to create booking
            const response = await apiService.post<{
                success: boolean;
                data?: {
                    id: string;
                    startTime: string;
                    endTime: string;
                    status: string;
                    notes?: string | null;
                };
                error?: string;
            }>('/bookings', requestData);

            if (response.success && response.data) {
                // Add the booking to local state with the response data
                addBooking({
                    id: response.data.id,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    startTime,
                    endTime,
                    date: bookingDate,
                });

                setIsBookingDialogOpen(false);
                setSelectedSlot(null);
                setBookingError(null);
            } else {
                // Handle API error
                console.error('Failed to create booking:', response.error);
                setBookingError(response.error || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            setBookingError('Network error. Please try again.');
        }
    };

    // Helper: Check if a slot (start, end) overlaps with any existing bookings for the selected date
    const isSlotAvailable = (start: Date, end: Date) => {
        const bookingDate = format(start, 'yyyy-MM-dd');
        return !bookings.some((booking) => {
            if (booking.date !== bookingDate) return false;
            const bookingStart = new Date(`${booking.date}T${booking.startTime}`);
            const bookingEnd = new Date(`${booking.date}T${booking.endTime}`);
            return (
                start < bookingEnd && end > bookingStart // overlap
            );
        });
    };

    // Generate fixed 1-hour slots starting at 7:00, next at 8:00, etc., until last slot ends at 21:00
    const generateFixedSlots = () => {
        // If selectedDate is Sunday (0 = Sunday)
        if (selectedDate.getDay() === 0) {
            return [];
        }
        const slots = [];
        const slotDuration = 60; // minutes
        let slotStart = new Date(selectedDate);
        slotStart.setHours(7, 0, 0, 0);
        const slotEndLimit = new Date(selectedDate);
        slotEndLimit.setHours(21, 0, 0, 0); // Last slot ends at 21:00
        while (slotStart < slotEndLimit) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            // Only show if slot is available and within the same day
            if (slotEnd <= slotEndLimit && isSlotAvailable(slotStart, slotEnd)) {
                slots.push({
                    start: new Date(slotStart),
                    end: new Date(slotEnd),
                });
            }
            // Move to next slot (1 hour later)
            slotStart = new Date(slotStart.getTime() + slotDuration * 60000);
        }
        return slots;
    };

    // Helper: Get user's timezone (for demo, hardcode to London)
    const timeZoneLabel = 'ZAGREB (GMT+02:00)';

    // Handle removing a booking
    const handleRemoveBooking = (bookingId: string) => {
        setBookingToRemove(bookingId);
        setIsRemoveDialogOpen(true);
    };

    // Confirm booking removal
    const handleConfirmRemove = async () => {
        if (bookingToRemove) {
            try {
                // Make API call to delete booking
                const response = await apiService.delete<{
                    success: boolean;
                    data?: null;
                    error?: string;
                }>(`/bookings/${bookingToRemove}`);

                if (response.success) {
                    // Refresh bookings from server to get updated data
                    const refreshResponse = await apiService.get<{
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

                    if (refreshResponse.success && refreshResponse.data) {
                        // Convert API response to local booking format
                        const userBookings = refreshResponse.data.map(booking => ({
                            id: booking.id,
                            userId: currentUser!.id,
                            userName: currentUser!.name,
                            startTime: format(new Date(booking.startTime), 'HH:mm'),
                            endTime: format(new Date(booking.endTime), 'HH:mm'),
                            date: format(new Date(booking.startTime), 'yyyy-MM-dd'),
                        }));

                        // Replace all bookings with fetched ones
                        setBookings(userBookings);
                    }
                    
                    setBookingToRemove(null);
                    setIsRemoveDialogOpen(false);
                } else {
                    // Handle API error
                    console.error('Failed to delete booking:', response.error);
                    // You might want to show an error message to the user here
                }
            } catch (error) {
                console.error('Error deleting booking:', error);
                // Handle network or other errors
            }
        }
    };

    // Render the pretty grid of fixed slots
    const renderDailyView = () => {
        if (selectedDate.getDay() === 0) {
            return (
                <Typography color="error" sx={{ mt: 2, fontWeight: 500 }}>
                    Booking is not available on Sundays.
                </Typography>
            );
        }
        // Booking rules for disabling all slots
        const hasUserBookingForDay =
            currentUser &&
            bookings.some(
                (booking) =>
                    booking.userId === currentUser.id &&
                    booking.date === format(selectedDate, 'yyyy-MM-dd')
            );
        const startOfCurrentWeek = startOfWeek(selectedDate);
        const endOfCurrentWeek = endOfWeek(selectedDate);
        const weeklyBookings = currentUser
            ? bookings.filter(
                  (booking) =>
                      booking.userId === currentUser.id &&
                      new Date(booking.date) >= startOfCurrentWeek &&
                      new Date(booking.date) <= endOfCurrentWeek
              )
            : [];
        const isDisabled = hasUserBookingForDay || weeklyBookings.length >= 3;

        if (isDisabled) {
            return (
                <Typography color="error" sx={{ mt: 2 }}>
                    {hasUserBookingForDay
                        ? 'You already have a booking for this day.'
                        : 'You have reached the weekly booking limit.'}
                </Typography>
            );
        }

        const slots = generateFixedSlots();
        return (
            <Box sx={{ width: '100%' }}>
                {/* Date and timezone header */}
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, mt: { xs: 2, md: 0 } }}>
                    {format(selectedDate, 'EEEE, MMMM d')}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        mb: 2,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        textDecoration: 'underline',
                        color: 'text.secondary',
                        display: 'block',
                    }}
                >
                    Time Zone: {timeZoneLabel}
                </Typography>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 2,
                        mt: 2,
                        alignItems: 'start',
                    }}
                >
                    {slots.map(({ start, end }) => {
                        const slotLabel = `${format(start, 'HH:mm')}`;
                        const slotKey = format(start, 'HH:mm') + ' - ' + format(end, 'HH:mm');
                        const isSelected = uiSelectedSlot === slotKey;
                        
                        // Check if slot is disabled (past time or outside hours)
                        const now = new Date();
                        const isPastTime = start <= now;
                        const startHour = start.getHours();
                        // Allow slots starting at 7:00 up to and including 20:00
                        const isOutsideHours = startHour < 7 || startHour > 20;
                        const isDisabled = isPastTime || isOutsideHours;
                        
                        const baseStyles = {
                            width: '100%',
                            border: '1px solid',
                            borderColor: isSelected ? 'grey.400' : 'grey.300',
                            background: '#fff !important',
                            color: isDisabled 
                                ? 'grey.500' 
                                : isSelected 
                                    ? '#fff' 
                                    : '#111',
                            fontWeight: 700,
                            fontSize: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            padding: '1.1rem 0',
                            marginBottom: 0,
                            borderRadius: 1,
                            boxShadow: 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                            opacity: isDisabled ? 0.6 : 1,
                            pointerEvents: isDisabled ? 'none' : 'auto',
                        };

                        return (
                            <Box component="button"
                                key={slotKey}
                                type="button"
                                onClick={() => {
                                    if (!isDisabled) {
                                        setUiSelectedSlot(slotKey);
                                        handleSlotClick(slotKey);
                                    }
                                }}
                                disabled={isDisabled}
                                sx={[
                                    baseStyles,
                                    isDisabled
                                        ? {}
                                        : isSelected
                                            ? {
                                                background: 'grey.200 !important',
                                                color: '#111',
                                                borderColor: 'grey.400',
                                                '&:active': {
                                                    background: 'grey.200 !important',
                                                    color: '#111',
                                                    borderColor: 'grey.400',
                                                },
                                                '&:focus-visible': {
                                                    background: 'grey.200 !important',
                                                    color: '#111',
                                                    borderColor: 'grey.400',
                                                },
                                            }
                                            : {
                                                background: '#fff !important',
                                                color: '#111',
                                                borderColor: 'grey.300',
                                                '&:active': {
                                                    background: '#fff !important',
                                                    color: '#111',
                                                    borderColor: 'grey.300',
                                                },
                                                '&:focus-visible': {
                                                    background: '#fff !important',
                                                    color: '#111',
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                ]}
                                tabIndex={isDisabled ? -1 : 0}
                                aria-disabled={isDisabled}
                            >
                                {slotLabel}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 2,
                background: theme.palette.background.paper,
                minHeight: '80vh',
            }}
        >
            {/* Loading indicator */}
            {isLoadingBookings && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Loading your bookings...
                    </Typography>
                </Box>
            )}

            {/* Header section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                    Book Your Gym Session
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Select a date and time slot to book your fitness session. You can book up to 3 sessions per week.
                </Typography>
            </Box>

            {/* User's upcoming bookings section */}
            {currentUser && userBookings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            Your Upcoming Bookings
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleResetLimits}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Reset All Bookings
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {userBookings.map((booking) => (
                            <Card
                                key={booking.id}
                                sx={{
                                    minWidth: 280,
                                    background: theme.palette.background.paper,
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[4],
                                    },
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                                        {format(new Date(booking.date), 'EEEE, MMMM d')}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: 'text.secondary', mb: 2 }}
                                    >
                                        {booking.startTime} - {booking.endTime}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={() => handleRemoveBooking(booking.id)}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Cancel Booking
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Main content area: calendar and slot grid side by side */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
                {/* Calendar section */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '33.33%' },
                        minWidth: 280,
                        mr: { xs: 0, md: 4 },
                        mb: { xs: 3, md: 0 },
                        '& .MuiDateCalendar-root': {
                            width: '100%',
                            height: 'auto',
                            '& .MuiPickersCalendarHeader-root': {
                                marginTop: 0,
                            },
                        },
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            background: theme.palette.background.paper,
                        }}
                    >
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateCalendar
                                value={selectedDate}
                                onChange={handleDateChange}
                                sx={{
                                    '& .MuiPickersDay-root.Mui-selected': {
                                        backgroundColor: theme.palette.primary.main,
                                        '&:hover': {
                                            backgroundColor: theme.palette.primary.dark,
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Paper>
                </Box>
                {/* Time slot grid section */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 260,
                        maxWidth: { xs: '100%', md: '66.67%' },
                        overflowX: 'auto',
                    }}
                >
                    {renderDailyView()}
                </Box>
            </Box>

            {/* Booking confirmation dialog */}
            <Dialog
                open={isBookingDialogOpen}
                onClose={() => {
                    setIsBookingDialogOpen(false);
                    setBookingError(null);
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minWidth: '320px',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>Confirm Booking</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to book the slot {selectedSlot} on{' '}
                        {format(selectedDate, 'MMMM d, yyyy')}?
                    </Typography>
                    {bookingError && (
                        <Typography
                            color="error"
                            sx={{ mt: 2, fontSize: '0.875rem' }}
                        >
                            {bookingError}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setIsBookingDialogOpen(false);
                            setBookingError(null);
                        }}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBookingConfirm}
                        variant="contained"
                        disabled={!!bookingError}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Remove booking confirmation dialog */}
            <Dialog
                open={isRemoveDialogOpen}
                onClose={() => setIsRemoveDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minWidth: '320px',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>Cancel Booking</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setIsRemoveDialogOpen(false)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Keep Booking
                    </Button>
                    <Button
                        onClick={handleConfirmRemove}
                        variant="contained"
                        color="error"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                        }}
                    >
                        Cancel Booking
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset booking limits confirmation dialog */}
            <Dialog
                open={isResetDialogOpen}
                onClose={() => setIsResetDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minWidth: '320px',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>Reset All Bookings</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel all your bookings? This action cannot be
                        undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setIsResetDialogOpen(false)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Keep Bookings
                    </Button>
                    <Button
                        onClick={handleConfirmReset}
                        variant="contained"
                        color="error"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                        }}
                    >
                        Reset All
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
