import { useEffect, useState } from 'react'
import { apiService } from '../../services/api.js'
import { AlertTriangle, Clock } from 'lucide-react'

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
}

interface UsersResponse {
  success: boolean
  data?: {
    users: User[]
  }
  error?: string
}

export function UsersToPaySidebar() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiService.get<UsersResponse>('/users')
        if (response.success && response.data) {
          setUsers(response.data.users)
        } else {
          setError(response.error || 'Failed to fetch users')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Filter users who need to pay (due today, overdue, or due within 7 days)
  const usersToPay = users
    .filter(user => {
      if (!user.nextPaymentDueDate) return false
      const dueDate = new Date(user.nextPaymentDueDate)
      const now = new Date()
      dueDate.setHours(0,0,0,0)
      now.setHours(0,0,0,0)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue <= 7
    })
    .sort((a, b) => {
      const aDue = new Date(a.nextPaymentDueDate!).getTime()
      const bDue = new Date(b.nextPaymentDueDate!).getTime()
      return aDue - bDue
    })

  function getDueStatus(user: User) {
    if (!user.nextPaymentDueDate) return { label: 'No due date', color: 'bg-gray-100 text-gray-800' }
    const dueDate = new Date(user.nextPaymentDueDate)
    const now = new Date()
    dueDate.setHours(0,0,0,0)
    now.setHours(0,0,0,0)
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue < 0) {
      return { label: `Overdue by ${Math.abs(daysUntilDue)} days`, color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="inline h-4 w-4 mr-1 text-red-600" /> }
    } else if (daysUntilDue === 0) {
      return { label: 'Due today', color: 'bg-orange-100 text-orange-800', icon: <Clock className="inline h-4 w-4 mr-1 text-orange-600" /> }
    } else if (daysUntilDue === 1) {
      return { label: 'Due tomorrow', color: 'bg-orange-100 text-orange-800', icon: <Clock className="inline h-4 w-4 mr-1 text-orange-600" /> }
    } else {
      return { label: `Due in ${daysUntilDue} days`, color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="inline h-4 w-4 mr-1 text-yellow-600" /> }
    }
  }

  return (
    <aside className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* <div className="p-4 border-b border-gray-200"> */}
        {/* <h2 className="text-lg font-bold text-gray-900 mb-1">Users Who Need to Pay</h2>
        <p className="text-xs text-gray-500">Ordered by closest due date</p> */}
      {/* </div> */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-red-600">{error}</div>
      ) : usersToPay.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No users need to pay soon.</div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {usersToPay.map(user => {
            const status = getDueStatus(user)
            return (
              <li key={user.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{user.name}</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                    {status.icon}{status.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 break-all">{user.email}</div>
                {user.mobilePhone && <div className="text-xs text-gray-500">{user.mobilePhone}</div>}
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
} 