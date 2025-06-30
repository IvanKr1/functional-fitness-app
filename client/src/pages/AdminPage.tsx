import { Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export function AdminPage() {
  const { currentUser } = useStore()
  
  // Redirect to login if not authenticated or to home if not an admin
  if (!currentUser) {
    return <Navigate to="/login" />
  }
  
  if (currentUser.role !== 'ADMIN') {
    return <Navigate to="/" />
  }
} 