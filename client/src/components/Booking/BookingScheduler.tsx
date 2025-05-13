import { useState } from 'react';
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
import type { ViewMode } from '../../types';

// Maximum number of bookings allowed per time slot
const MAX_BOOKINGS_PER_SLOT = 10;

export const BookingScheduler = () => {
    const theme = useTheme();
    const { currentUser, bookings, addBooking, removeBooking } = useStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [uiSelectedSlot, setUiSelectedSlot] = useState<string | null>(null);
    const [bookingToRemove, setBookingToRemove] = useState<string | null>(null);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

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
    const handleConfirmReset = () => {
        // Remove all bookings for the current user
        userBookings.forEach((booking) => {
            removeBooking(booking.id);
        });
        setIsResetDialogOpen(false);
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

        // If all checks pass, open the booking dialog
        setSelectedSlot(slot);
        setIsBookingDialogOpen(true);
    };

    // Handle confirming a booking
    // Performs final validation before adding the booking
    const handleBookingConfirm = () => {
        if (!currentUser || !selectedSlot) return;

        const [startTime] = selectedSlot.split(' - ');
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const endDate = new Date(selectedDate);
        endDate.setHours(startHours + 1, startMinutes + 30, 0);
        const endTime = format(endDate, 'HH:mm');
        const bookingDate = format(selectedDate, 'yyyy-MM-dd');

        // Final check for weekly booking limit
        const startOfCurrentWeek = startOfWeek(selectedDate);
        const endOfCurrentWeek = endOfWeek(selectedDate);

        // Add the booking if all checks pass
        addBooking({
            id: Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            startTime,
            endTime,
            date: bookingDate,
        });

        setIsBookingDialogOpen(false);
        setSelectedSlot(null);
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

    // Generate fixed 1.5-hour slots starting at 7:00, next at 8:30, etc., until last slot ends at 22:00
    const generateFixedSlots = () => {
        const slots = [];
        const slotDuration = 90; // minutes
        let slotStart = new Date(selectedDate);
        slotStart.setHours(7, 0, 0, 0);
        const slotEndLimit = new Date(selectedDate);
        slotEndLimit.setHours(22, 0, 0, 0);
        while (slotStart < slotEndLimit) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            // Only show if slot is available and within the same day
            if (slotEnd <= slotEndLimit && isSlotAvailable(slotStart, slotEnd)) {
                slots.push({
                    start: new Date(slotStart),
                    end: new Date(slotEnd),
                });
            }
            // Move to next slot (1.5 hours later)
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
    const handleConfirmRemove = () => {
        if (bookingToRemove) {
            removeBooking(bookingToRemove);
            setBookingToRemove(null);
            setIsRemoveDialogOpen(false);
        }
    };

    // Render the pretty grid of fixed slots
    const renderDailyView = () => {
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
                        return (
                            <Box
                                key={slotKey}
                                component="button"
                                type="button"
                                onClick={() => {
                                    setUiSelectedSlot(slotKey);
                                    handleSlotClick(slotKey);
                                }}
                                sx={{
                                    width: '100%',
                                    border: '1px solid',
                                    borderColor: isSelected ? 'grey.400' : 'grey.300',
                                    background: isSelected ? 'grey.200' : '#fff',
                                    color: isSelected ? '#fff' : '#111',
                                    fontWeight: 700,
                                    fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                    py: 2.2,
                                    px: 0,
                                    mb: 0,
                                    borderRadius: 1,
                                    boxShadow: 'none',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                                    '&:hover': {
                                        background: 'grey.100',
                                        borderColor: 'grey.400',
                                    },
                                }}
                            >
                                {slotLabel}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    // Render the weekly view showing all days in the current week
    const renderWeeklyView = () => {
        const startDate = startOfWeek(selectedDate);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const currentDate = addDays(startDate, i);
            const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            days.push(
                <Box
                    sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}
                    key={currentDate.toISOString()}
                >
                    <Card
                        sx={{
                            height: '100%',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                            },
                            border: isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
                        }}
                    >
                        <CardContent>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: isToday
                                        ? theme.palette.primary.main
                                        : theme.palette.text.primary,
                                    fontWeight: isToday ? 600 : 400,
                                    mb: 1,
                                }}
                            >
                                {format(currentDate, 'EEEE, MMM d')}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                }}
                            >
                                {
                                    bookings.filter(
                                        (b) => b.date === format(currentDate, 'yyyy-MM-dd')
                                    ).length
                                }{' '}
                                bookings
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            );
        }

        return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{days}</Box>;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                background: theme.palette.background.default,
            }}
        >
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

            {/* View mode tabs (Daily/Weekly) */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={viewMode}
                    onChange={handleViewModeChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '1rem',
                        },
                        '& .Mui-selected': {
                            color: theme.palette.primary.main,
                        },
                    }}
                >
                    <Tab label="Daily" value="daily" />
                    <Tab label="Weekly" value="weekly" />
                </Tabs>
            </Box>

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
                    {viewMode === 'daily' ? renderDailyView() : renderWeeklyView()}
                </Box>
            </Box>

            {/* Booking confirmation dialog */}
            <Dialog
                open={isBookingDialogOpen}
                onClose={() => setIsBookingDialogOpen(false)}
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
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setIsBookingDialogOpen(false)}
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
