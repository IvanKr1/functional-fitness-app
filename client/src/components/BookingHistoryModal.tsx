import PropTypes from 'prop-types'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material'
import { format } from 'date-fns'

export function BookingHistoryModal({ open, onClose, bookings }) {
  console.log('bookings', bookings)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Booking History (Last 30 Days)</DialogTitle>
      <DialogContent>
        {bookings.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No bookings in the last 30 days.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{format(new Date(b.startTime), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{format(new Date(b.startTime), 'HH:mm')}</TableCell>
                  <TableCell>{format(new Date(b.endTime), 'HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  )
}

BookingHistoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookings: PropTypes.array.isRequired
} 