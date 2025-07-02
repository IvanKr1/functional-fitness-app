import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { useStore } from '../store/useStore'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { currentUser, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-blue-600 text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-semibold">Gym Booking Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentUser?.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Layout Container */}
      <div className="flex min-h-screen pt-16">
        {/* Sidebar */}
        <AdminSidebar open={sidebarOpen} onToggle={handleToggleSidebar} />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'ml-[240px]' : 'ml-16'
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
} 