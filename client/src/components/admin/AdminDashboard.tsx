import { useEffect } from 'react'
import { useAdminBookingsStore } from '../../store/adminBookings.store'
import type { AdminDashboardProps } from '../../types/admin.types'
import { Box, Button, TextField, Select, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, styled, Chip } from '@mui/material'
import { Spinner } from '@radix-ui/themes'
import type { ChangeEvent } from 'react'
import type { SelectChangeEvent } from '@mui/material'
import { cn } from '../../lib/utils'
import type { Theme } from '@mui/material/styles'
import { format } from 'date-fns'

const HOURS = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`)

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  borderRadius: theme.shape.borderRadius,
  '& .MuiTable-root': {
    minWidth: 650,
  },
}))

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: theme.spacing(2),
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease',
  },
  '& .MuiTableCell-root': {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}))

interface StatusChipProps {
  status: 'active' | 'cancelled' | 'completed'
}

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<StatusChipProps>(({ theme, status }) => ({
  fontWeight: 500,
  fontSize: '0.85rem',
  height: 24,
  borderRadius: 12,
  ...(status === 'active' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
  }),
  ...(status === 'cancelled' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  }),
  ...(status === 'completed' && {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
  }),
}))

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

  // Only show bookings for today
  const today = format(new Date(), 'yyyy-MM-dd')
  const allTodaysBookings = getPaginatedBookings().filter(b => b.date === today)
  // Pagination for today's bookings
  const ITEMS_PER_PAGE = pagination.itemsPerPage
  const totalTodaysPages = Math.ceil(allTodaysBookings.length / ITEMS_PER_PAGE)
  const currentPage = pagination.currentPage
  const todaysBookings = allTodaysBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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
          <Box display="flex" justifyContent="center" p={4}>
            <Spinner size="3" />
          </Box>
        ) : (
          <>
            {/* Bookings Table */}
            <Box component={Paper}>
              <StyledTableContainer>
                <Table stickyHeader>
                  <StyledTableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Hour</TableCell>
                      <TableCell>Facility</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </StyledTableHead>
                  <TableBody>
                    {todaysBookings.map((booking) => (
                      <StyledTableRow key={booking.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {booking.userName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {booking.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {booking.bookingHour}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {booking.facility}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            label={booking.status}
                            status={booking.status as 'active' | 'cancelled' | 'completed'}
                            size="small"
                          />
                        </TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </StyledTableContainer>
            </Box>

            {/* Pagination */}
            {totalTodaysPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalTodaysPages}
                  page={currentPage}
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