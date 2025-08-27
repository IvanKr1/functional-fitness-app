import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, Users, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import ReactLogo from '../../assets/react.svg'
import { useStore } from '../../store/useStore'

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  {
    label: 'User Management',
    icon: Users,
    to: '/admin/users',
  },
  {
    label: 'Users to Pay',
    icon: AlertTriangle,
    to: '/admin/users-to-pay',
  },
  {
    label: "Bookings",
    icon: Clock,
    to: '/admin/today-bookings',
  },
  {
    label: 'Incomplete Weekly Bookings',
    icon: AlertTriangle,
    to: '/admin/incomplete-weekly-bookings',
  }
]

const AVATAR_PLACEHOLDER = 'https://ui-avatars.com/api/?name=User&background=E0E7FF&color=3730A3&size=64'

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const location = useLocation()
  const { currentUser } = useStore()

  const isCurrentPath = (path: string) => location.pathname === path

  return (
    <aside
      className={cn(
        'fixed left-0 z-30 h-[calc(100vh-4rem)] flex flex-col bg-white text-gray-900 shadow-lg transition-all duration-300 ease-in-out',
        open ? 'w-64 rounded-r-2xl' : 'w-20 rounded-r-3xl',
        'border-r border-gray-200',
        'top-16'
      )}
    >
      {/* Profile section only when expanded */}
      {open && (
        <div className={cn('flex flex-col items-center justify-center py-6 border-b border-gray-100', open ? 'px-4' : 'px-2')}> 
          {/* No avatar in collapsed state */}
          <span className="mt-1 text-base font-semibold text-gray-900 truncate w-full text-center">
            {currentUser?.name || 'User'}
          </span>
          {/* Toggle button below profile */}
          <button
            onClick={onToggle}
            className="mt-4 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors focus:outline-none"
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      )}
      {/* Toggle button at top when collapsed */}
      {!open && (
        <div className="flex flex-col items-center justify-center py-4 border-b border-gray-100 px-2">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors focus:outline-none"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      {/* Navigation */}
      <nav className="flex-1 mt-2">
        <ul className="space-y-1">
          {navItems.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              <Link
                to={to}
                className={cn(
                  'group flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium',
                  isCurrentPath(to)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100',
                  open ? '' : 'justify-center'
                )}
                tabIndex={0}
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
                <span
                  className={cn(
                    'transition-all duration-200',
                    open ? 'opacity-100 ml-1' : 'opacity-0 w-0 ml-0 overflow-hidden pointer-events-none'
                  )}
                >
                  {label}
                </span>
                {/* Tooltip for collapsed state */}
                {!open && (
                  <span className="absolute left-full ml-2 z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none shadow-lg transition-opacity">
                    {label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
} 
