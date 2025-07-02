import { useState, useEffect } from 'react'
import { X, Save, User, Mail, Phone, Calendar, CreditCard, FileText } from 'lucide-react'
import { apiService } from '../../services/api.js'

interface User {
  id: string
  name: string
  email: string
  role: string
  weeklyBookingLimit: number
  createdAt: string
  mobilePhone?: string
  lastPaymentDate?: string
  nextPaymentDueDate?: string
  notes?: string
  attendedBookingDates?: string[]
  upcomingBookings?: {
    id: string
    startTime: string
    status: string
    notes?: string
  }[]
}

interface EditUserFormProps {
  user: User | null
  onClose: () => void
  onUserUpdated: () => void
}

interface UpdateUserRequest {
  name?: string
  email?: string
  mobilePhone?: string
  weeklyBookingLimit?: number
  lastPaymentDate?: string
  nextPaymentDueDate?: string
}

interface UpdateUserResponse {
  success: boolean
  data?: {
    user: User
  }
  message?: string
  error?: string
}

interface RecordPaymentResponse {
  success: boolean
  data?: {
    paymentRecord: {
      id: string
      amount: number
      currency: string
      paymentDate: string
      dueDate: string
      status: string
      notes?: string | null
    }
    lastPaymentDate: string
    nextPaymentDueDate: string
  }
  message?: string
  error?: string
}



export function EditUserForm({ user, onClose, onUserUpdated }: EditUserFormProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: '',
    email: '',
    mobilePhone: '',
    weeklyBookingLimit: 3
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentPaid, setIsPaymentPaid] = useState(false)
  const [fullUser, setFullUser] = useState<User | null>(user)

  useEffect(() => {
    if (user) {
      apiService.get<{ success: boolean; data?: { user: User }; error?: string }>(`/users/${user.id}`)
        .then(res => {
          if (res.success && res.data?.user) {
            setFullUser(res.data.user)
            setFormData({
              name: res.data.user.name,
              email: res.data.user.email,
              mobilePhone: res.data.user.mobilePhone || '',
              weeklyBookingLimit: res.data.user.weeklyBookingLimit,
              lastPaymentDate: res.data.user.lastPaymentDate ? new Date(res.data.user.lastPaymentDate).toISOString() : '',
              nextPaymentDueDate: res.data.user.nextPaymentDueDate ? new Date(res.data.user.nextPaymentDueDate).toISOString() : ''
            })
          }
        })
    }
    // Always start unchecked
    setIsPaymentPaid(false)
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'weeklyBookingLimit' ? parseInt(value) : value
    }))
  }

  const handleLastPaymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastPaymentDate = e.target.value
    setFormData(prev => ({
      ...prev,
      lastPaymentDate
    }))

    // Automatically calculate next payment due date (30 days later)
    if (lastPaymentDate) {
      const nextDueDate = new Date(lastPaymentDate)
      nextDueDate.setDate(nextDueDate.getDate() + 30)
      const nextDueDateString = nextDueDate.toISOString()
      
      setFormData(prev => ({
        ...prev,
        lastPaymentDate: new Date(lastPaymentDate).toISOString(),
        nextPaymentDueDate: nextDueDateString
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        lastPaymentDate: '',
        nextPaymentDueDate: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullUser) return

    setIsLoading(true)
    setError(null)

    try {
      // First update user information
      const updateResponse = await apiService.patch<UpdateUserResponse>(`/users/${fullUser.id}`, formData)
      
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update user')
      }

      // If payment is marked as paid, record the payment
      if (isPaymentPaid && fullUser.role !== 'ADMIN') {
        const paymentResponse = await apiService.post<RecordPaymentResponse>(`/payments/${fullUser.id}`, {
          amount: 50.00, // Fixed amount
          currency: 'EUR',
          notes: 'Payment recorded via admin panel'
        })

        if (!paymentResponse.success) {
          throw new Error(paymentResponse.error || 'Failed to record payment')
        }
      }

      onUserUpdated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCalculatedNextDueDate = () => {
    if (!formData.lastPaymentDate) return 'Not set'
    
    const nextDueDate = new Date(formData.lastPaymentDate)
    nextDueDate.setDate(nextDueDate.getDate() + 30)
    return formatDate(nextDueDate.toISOString())
  }

  const getCalculatedDaysUntilDue = () => {
    if (!formData.lastPaymentDate) return null
    
    const nextDueDate = new Date(formData.lastPaymentDate)
    nextDueDate.setDate(nextDueDate.getDate() + 30)
    const now = new Date()
    const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysUntilDue
  }

  const getDateInputValue = (isoString: string | undefined) => {
    if (!isoString) return ''
    return new Date(isoString).toISOString().split('T')[0]
  }

  if (!fullUser) return null

  console.log('fullUser.attendedBookingDates', fullUser.attendedBookingDates)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Mobile Phone
              </label>
              <input
                type="tel"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekly Booking Limit
              </label>
              <select
                name="weeklyBookingLimit"
                value={formData.weeklyBookingLimit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1 per week</option>
                <option value={2}>2 per week</option>
                <option value={3}>3 per week</option>
                <option value={4}>4 per week</option>
                <option value={5}>5 per week</option>
                <option value={6}>6 per week</option>
                <option value={7}>7 per week</option>
              </select>
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Payment Date
                </label>
                <input
                  type="date"
                  name="lastPaymentDate"
                  value={getDateInputValue(formData.lastPaymentDate)}
                  onChange={handleLastPaymentDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Next payment will be due 30 days after this date
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Payment Due Date
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {getCalculatedNextDueDate()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculated
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">When User Needs to Pay:</span>
                <span className={`text-sm font-medium ${
                  fullUser.nextPaymentDueDate && new Date(fullUser.nextPaymentDueDate) < new Date()
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {fullUser.nextPaymentDueDate ? formatDate(fullUser.nextPaymentDueDate) : 'No payment record'}
                </span>
              </div>

              {/* Show calculated days until due when editing */}
              {formData.lastPaymentDate && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Calculated Due Date:</span>
                    <span className={`text-sm font-medium ${
                      getCalculatedDaysUntilDue()! < 0
                        ? 'text-red-600'
                        : getCalculatedDaysUntilDue()! <= 7
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {getCalculatedNextDueDate()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Based on last payment date: {formatDate(formData.lastPaymentDate)}
                  </p>
                </div>
              )}

              {fullUser.role !== 'ADMIN' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="paymentPaid"
                    checked={isPaymentPaid}
                    onChange={(e) => setIsPaymentPaid(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="paymentPaid" className="ml-2 text-sm text-gray-700">
                    Mark payment as paid
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* User Information Display */}
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              User Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  fullUser.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {fullUser.role}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">{formatDate(fullUser.createdAt)}</span>
              </div>


              {fullUser.notes && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Notes:</span>
                  <span className="ml-2 text-gray-600">{fullUser.notes}</span>
                </div>
              )}
              {/* Attended Booking Dates (last 30 days) */}
              {(fullUser.attendedBookingDates ?? []).length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Attended (last 30 days):</span>
                  <span className="ml-2 text-gray-600">
                    {(fullUser.attendedBookingDates ?? []).map((date, idx, arr) => (
                      <span key={date}>
                        {formatDate(date)}{idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {/* Upcoming Bookings */}
              {fullUser.upcomingBookings && fullUser.upcomingBookings.length > 0 && (
                <div className="md:col-span-2 mt-2">
                  <span className="font-medium text-gray-700">Upcoming Bookings:</span>
                  <ul className="ml-2 text-gray-600 list-disc list-inside">
                    {fullUser.upcomingBookings.map((booking) => (
                      <li key={booking.id}>
                        {formatDate(booking.startTime)}{' '}
                        {booking.status && (
                          <span className="ml-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {booking.status}
                          </span>
                        )}
                        {booking.notes && (
                          <span className="ml-2 italic text-gray-500">{booking.notes}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 