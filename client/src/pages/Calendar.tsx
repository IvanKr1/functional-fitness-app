import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography } from '@mui/material';

const Calendar = () => {
  const [events] = useState([
    {
      title: 'Morning Session',
      start: '2024-04-29T09:00:00',
      end: '2024-04-29T10:30:00',
    },
    {
      title: 'Afternoon Session',
      start: '2024-04-29T14:00:00',
      end: '2024-04-29T15:30:00',
    },
  ]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Your Session
      </Typography>
      <Box sx={{ mt: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="01:00:00"
          allDaySlot={false}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
        />
      </Box>
    </Box>
  );
};

export default Calendar; 