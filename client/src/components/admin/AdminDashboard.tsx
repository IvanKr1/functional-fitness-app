import { useEffect } from 'react'
import { useAdminBookingsStore } from '../../store/adminBookings.store'
import type { AdminDashboardProps } from '../../types/admin.types'
import { Box, Button, TextField, Select, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from '@mui/material'
import type { ChangeEvent } from 'react'
import type { SelectChangeEvent } from '@mui/material'
import { cn } from '../../lib/utils'

const HOURS = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`)

export function AdminDashboard({ className }: AdminDashboardProps) {
  const {
    filters,
    pagination,
    isLoading,
    error,
    setFilters,
    setPagination,
    fetchBookings,
    getPaginatedBookings
  } = useAdminBookingsStore()

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const paginatedBookings = getPaginatedBookings()
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage)

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ userName: e.target.value })
  }

  const handleHourChange = (e: SelectChangeEvent<string>) => {
    setFilters({ bookingHour: e.target.value })
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPagination({ currentPage: page })
  }

  return (
    <Box className={cn('p-6', className)}>
      <Box display="flex" flexDirection="column" gap={3}>
        <Typography variant="h5" fontWeight="bold">
          Gym Bookings Dashboard
        </Typography>
        
        {/* Filters */}
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Filter by username..."
            value={filters.userName}
            onChange={handleUsernameChange}
            size="small"
          />
          <Select
            value={filters.bookingHour}
            onChange={handleHourChange}
            displayEmpty
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All Hours</MenuItem>
            {HOURS.map((hour) => (
              <MenuItem key={hour} value={hour}>
                {hour}
              </MenuItem>
            ))}
          </Select>
          <Button 
            variant="outlined" 
            onClick={() => setFilters({ userName: '', bookingHour: '' })}
          >
            Clear Filters
          </Button>
        </Box>

        {/* Error State */}
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Typography>Loading bookings...</Typography>
        ) : (
          <>
            {/* Bookings Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Hour</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.userName}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.bookingHour}</TableCell>
                      <TableCell>{booking.facility}</TableCell>
                      <TableCell>
                        <Typography
                          color={
                            booking.status === 'active'
                              ? 'success.main'
                              : booking.status === 'cancelled'
                              ? 'error.main'
                              : 'text.secondary'
                          }
                        >
                          {booking.status}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
} 