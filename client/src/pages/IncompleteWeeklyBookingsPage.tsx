import { useState, useEffect } from 'react'
import { Phone, Mail, Calendar, Clock, User, AlertTriangle, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'
import { format } from 'date-fns'

interface BookingTime {
  id: string
  startTime: string
  endTime: string
  status: string
}

interface UserWithIncompleteBookings {
  id: string
  name: string
  email: string
  mobilePhone: string | undefined
  weeklyBookingLimit: number
  currentWeekBookings: number
  currentWeekBookingTimes: BookingTime[]
  missingBookings: number
}

export function IncompleteWeeklyBookingsPage() {
  const [users, setUsers] = useState<UserWithIncompleteBookings[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.get<{
        success: boolean
        data: UserWithIncompleteBookings[]
        message: string
      }>('/bookings/incomplete-weekly')
      
      if (response.success) {
        setUsers(response.data)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const formatBookingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, 'EEE, MMM d')} at ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self')
    }
  }

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Incomplete Weekly Bookings
          </h1>
          <p className="text-gray-600">
            Users who haven't completed their weekly booking limit
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            All users have completed their weekly bookings!
          </h3>
          <p className="text-gray-600">
            Everyone has reached their weekly booking limit.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {user.currentWeekBookings}/{user.weeklyBookingLimit}
                    </span>
                    <span className="text-sm text-gray-500">bookings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-600">
                      {user.missingBookings} missing
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {user.mobilePhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{user.mobilePhone}</span>
                        <button
                          onClick={() => handleCall(user.mobilePhone!)}
                          className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          Call
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{user.email}</span>
                      <button
                        onClick={() => handleEmail(user.email)}
                        className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Week Bookings */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">This Week's Bookings</h4>
                  {user.currentWeekBookingTimes.length > 0 ? (
                    <div className="space-y-2">
                      {user.currentWeekBookingTimes.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {formatBookingTime(booking.startTime, booking.endTime)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-700'
                                : booking.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No bookings this week
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 