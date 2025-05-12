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
import { useStore } from '../store/useStore';
import type { ViewMode } from '../types';

// Maximum number of bookings allowed per time slot
const MAX_BOOKINGS_PER_SLOT = 10;

export const BookingScheduler = () => {
    const theme = useTheme();
    const { currentUser, bookings, addBooking } = useStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

    // Handle switching between daily and weekly views
    const handleViewModeChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
        setViewMode(newValue);
    };

    // Update selected date when user picks a new date from calendar
    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date);
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
        const endTime = format(
            new Date(selectedDate.setHours(parseInt(startTime) + 1, 30, 0)),
            'HH:mm'
        );
        const bookingDate = format(selectedDate, 'yyyy-MM-dd');

        // Final check for daily booking limit
        const hasBookingForDay = bookings.some(
            (booking) => booking.userId === currentUser.id && booking.date === bookingDate
        );

        if (hasBookingForDay) {
            alert('You can only have one booking per day');
            setIsBookingDialogOpen(false);
            setSelectedSlot(null);
            return;
        }

        // Final check for weekly booking limit
        const startOfCurrentWeek = startOfWeek(selectedDate);
        const endOfCurrentWeek = endOfWeek(selectedDate);

        const weeklyBookings = bookings.filter(
            (booking) =>
                booking.userId === currentUser.id &&
                new Date(booking.date) >= startOfCurrentWeek &&
                new Date(booking.date) <= endOfCurrentWeek
        );

        if (weeklyBookings.length >= 3) {
            alert('You have reached the maximum limit of 3 bookings per week');
            setIsBookingDialogOpen(false);
            setSelectedSlot(null);
            return;
        }

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

    // Generate time slots for the selected date
    // Creates slots from 6 AM to 10 PM with 1.5 hour duration
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour < 21; hour++) {
            const startTime = format(new Date().setHours(hour, 0, 0), 'HH:mm');
            const endTime = format(new Date().setHours(hour + 1, 30, 0), 'HH:mm');
            const slotBookings = bookings.filter(
                (booking) =>
                    booking.date === format(selectedDate, 'yyyy-MM-dd') &&
                    booking.startTime === startTime
            );
            slots.push({
                time: `${startTime} - ${endTime}`,
                bookings: slotBookings,
            });
        }
        return slots;
    };

    // Render the daily view showing all time slots for the selected date
    const renderDailyView = () => {
        const timeSlots = generateTimeSlots();

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {timeSlots.map((slot) => {
                    const [startTime] = slot.time.split(' - ');
                    // Check if user already has a booking for this day
                    const hasUserBookingForDay =
                        currentUser &&
                        bookings.some(
                            (booking) =>
                                booking.userId === currentUser.id &&
                                booking.date === format(selectedDate, 'yyyy-MM-dd')
                        );

                    // Check user's weekly bookings
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

                    // Determine if slot should be disabled based on booking limits
                    const isDisabled =
                        slot.bookings.length >= MAX_BOOKINGS_PER_SLOT ||
                        hasUserBookingForDay ||
                        weeklyBookings.length >= 3;

                    return (
                        <Box sx={{ width: '100%' }} key={slot.time}>
                            <Card
                                sx={{
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? 0.5 : 1,
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: isDisabled ? 'none' : 'translateY(-2px)',
                                        boxShadow: isDisabled ? theme.shadows[1] : theme.shadows[4],
                                    },
                                    background: isDisabled
                                        ? theme.palette.grey[100]
                                        : theme.palette.background.paper,
                                }}
                                onClick={() => handleSlotClick(slot.time)}
                            >
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: isDisabled
                                                ? theme.palette.text.disabled
                                                : theme.palette.primary.main,
                                            fontWeight: 600,
                                            mb: 1,
                                        }}
                                    >
                                        {slot.time}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: isDisabled
                                                ? theme.palette.text.disabled
                                                : theme.palette.text.secondary,
                                            mb: 0.5,
                                        }}
                                    >
                                        {slot.bookings.length} / {MAX_BOOKINGS_PER_SLOT} booked
                                    </Typography>
                                    {slot.bookings.length > 0 && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isDisabled
                                                    ? theme.palette.text.disabled
                                                    : theme.palette.text.secondary,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            Booked by:{' '}
                                            {slot.bookings.map((b) => b.userName).join(', ')}
                                        </Typography>
                                    )}
                                    {/* Show error message if user already has a booking for this day */}
                                    {hasUserBookingForDay && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: theme.palette.error.main,
                                                mt: 1,
                                                fontWeight: 500,
                                            }}
                                        >
                                            You already have a booking for this day
                                        </Typography>
                                    )}
                                    {/* Show error message if user has reached weekly limit */}
                                    {weeklyBookings.length >= 3 && !hasUserBookingForDay && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: theme.palette.error.main,
                                                mt: 1,
                                                fontWeight: 500,
                                            }}
                                        >
                                            You have reached the weekly booking limit
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    // Render the weekly view showing all days in the current week
    const renderWeeklyView = () => {
        const startDate = startOfWeek(selectedDate);
        const endDate = endOfWeek(selectedDate);
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

            {/* Main content area with calendar and booking slots */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* Calendar section */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '33.33%' },
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
                {/* Booking slots section */}
                <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
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
        </Paper>
    );
};
