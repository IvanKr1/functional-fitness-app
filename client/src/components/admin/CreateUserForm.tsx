import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiService } from '../../services/api.js'

// Validation schema for user creation
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobilePhone: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']),
  weeklyBookingLimit: z.number().min(1).max(10)
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserResponse {
  success: boolean
  data?: {
    user: {
      id: string
      name: string
      email: string
      role: string
      weeklyBookingLimit: number
    }
    generatedPassword: string
  }
  error?: string
}

interface CreateUserFormProps {
  onUserCreated: () => void
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'USER',
      weeklyBookingLimit: 3
    }
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    setError(null)
    setGeneratedPassword(null)

    try {
      const response = await apiService.post<CreateUserResponse>('/users', data)
      
      if (response.success && response.data) {
        setGeneratedPassword(response.data.generatedPassword)
        reset()
        onUserCreated()
      } else {
        setError(response.error || 'Failed to create user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <User className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Mobile Phone Field */}
        <div>
          <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Phone (Optional)
          </label>
          <input
            {...register('mobilePhone')}
            type="tel"
            id="mobilePhone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter mobile phone number"
          />
        </div>

        {/* Role Field */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            {...register('role')}
            id="role"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Weekly Booking Limit Field */}
        <div>
          <label htmlFor="weeklyBookingLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Booking Limit *
          </label>
          <input
            {...register('weeklyBookingLimit', { valueAsNumber: true })}
            type="number"
            id="weeklyBookingLimit"
            min="1"
            max="10"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.weeklyBookingLimit ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="3"
          />
          {errors.weeklyBookingLimit && (
            <p className="mt-1 text-sm text-red-600">{errors.weeklyBookingLimit.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Generated Password Display */}
        {generatedPassword && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              User created successfully! Generated password:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={generatedPassword}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-green-600 hover:text-green-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Please share this password with the user. They can change it after their first login.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 