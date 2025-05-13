import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronUp, LayoutDashboard, Calendar, Settings, Menu } from 'lucide-react'
import { cn } from '../../lib/utils'

const SIDEBAR_WIDTH = 240

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const location = useLocation()
  const [bookingsOpen, setBookingsOpen] = useState(true)

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

        <Collapsible.Root
          open={bookingsOpen && open}
          onOpenChange={setBookingsOpen}
          className="space-y-1"
        >
          <Collapsible.Trigger
            className={cn(
              'flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
              location.pathname.includes('/admin/bookings')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3" />
              <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
                Bookings
              </span>
            </div>
            {open && (bookingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          </Collapsible.Trigger>

          <Collapsible.Content className="space-y-1">
            <Link
              to="/admin"
              className={cn(
                'flex items-center pl-10 pr-3 py-2 text-sm font-medium rounded-md transition-colors',
                isCurrentPath('/admin')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
                Bookings List
              </span>
            </Link>
            {/* <Link
              to="/admin"
              className={cn(
                'flex items-center pl-10 pr-3 py-2 text-sm font-medium rounded-md transition-colors',
                isCurrentPath('/admin')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className={cn('transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
                Active Bookings
              </span>
            </Link> */}
          </Collapsible.Content>
        </Collapsible.Root>

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
