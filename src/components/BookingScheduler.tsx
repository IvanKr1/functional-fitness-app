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
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { useStore } from '../store/useStore';
import type { ViewMode } from '../types';

const MAX_BOOKINGS_PER_SLOT = 10;

export const BookingScheduler = () => {
    const { currentUser, bookings, addBooking } = useStore();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

    const handleViewModeChange = (_: React.SyntheticEvent, newValue: ViewMode) => {
        setViewMode(newValue);
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSlotClick = (slot: string) => {
        if (!currentUser) return;
        setSelectedSlot(slot);
        setIsBookingDialogOpen(true);
    };

    const handleBookingConfirm = () => {
        if (!currentUser || !selectedSlot) return;

        const [startTime] = selectedSlot.split(' - ');
        const endTime = format(new Date(selectedDate.setHours(parseInt(startTime) + 1)), 'HH:mm');

        addBooking({
            id: Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            startTime,
            endTime,
            date: format(selectedDate, 'yyyy-MM-dd'),
        });

        setIsBookingDialogOpen(false);
        setSelectedSlot(null);
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 6; hour < 22; hour++) {
            const startTime = format(new Date().setHours(hour, 0, 0), 'HH:mm');
            const endTime = format(new Date().setHours(hour + 1, 0, 0), 'HH:mm');
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

    const renderDailyView = () => {
        const timeSlots = generateTimeSlots();

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {timeSlots.map((slot) => (
                    <Box sx={{ width: '100%' }} key={slot.time}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                opacity: slot.bookings.length >= MAX_BOOKINGS_PER_SLOT ? 0.5 : 1,
                            }}
                            onClick={() => handleSlotClick(slot.time)}
                        >
                            <CardContent>
                                <Typography variant="h6">{slot.time}</Typography>
                                <Typography variant="body2">
                                    {slot.bookings.length} / {MAX_BOOKINGS_PER_SLOT} booked
                                </Typography>
                                {slot.bookings.length > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        Booked by: {slot.bookings.map((b) => b.userName).join(', ')}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>
        );
    };

    const renderWeeklyView = () => {
        const startDate = startOfWeek(selectedDate);
        const endDate = endOfWeek(selectedDate);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const currentDate = addDays(startDate, i);
            days.push(
                <Box sx={{ width: '100%' }} key={currentDate.toISOString()}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                {format(currentDate, 'EEEE, MMM d')}
                            </Typography>
                            <Typography variant="body2">
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
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={viewMode} onChange={handleViewModeChange}>
                    <Tab label="Daily" value="daily" />
                    <Tab label="Weekly" value="weekly" />
                </Tabs>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateCalendar value={selectedDate} onChange={handleDateChange} />
                    </LocalizationProvider>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
                    {viewMode === 'daily' ? renderDailyView() : renderWeeklyView()}
                </Box>
            </Box>

            <Dialog open={isBookingDialogOpen} onClose={() => setIsBookingDialogOpen(false)}>
                <DialogTitle>Confirm Booking</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to book the slot {selectedSlot} on{' '}
                        {format(selectedDate, 'MMMM d, yyyy')}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsBookingDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleBookingConfirm} variant="contained">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
