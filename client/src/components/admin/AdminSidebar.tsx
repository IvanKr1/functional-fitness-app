import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Settings, Menu, Users, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const location = useLocation()

  const isCurrentPath = (path: string) => location.pathname === path

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        open ? 'w-[240px]' : 'w-16'
      )}
    >
      <div className="flex items-center justify-end p-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="space-y-1 px-2">
        <Link
          to="/"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isCurrentPath('/')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
            Dashboard
          </span>
        </Link>

        <Link
          to="/admin/users"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isCurrentPath('/admin/users')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <Users className="h-5 w-5 mr-3" />
          <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
            User Management
          </span>
        </Link>

        <Link
          to="/admin/users-to-pay"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isCurrentPath('/admin/users-to-pay')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <AlertTriangle className="h-5 w-5 mr-3" />
          <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
            Users to Pay
          </span>
        </Link>

        <Link
          to="/admin/today-bookings"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isCurrentPath('/admin/today-bookings')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <Clock className="h-5 w-5 mr-3" />
          <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
            Today's Bookings
          </span>
        </Link>

        <Link
          to="/admin/settings"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            isCurrentPath('/admin/settings')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          <Settings className="h-5 w-5 mr-3" />
          <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
            Settings
          </span>
        </Link>
      </nav>
    </aside>
  )
} 
