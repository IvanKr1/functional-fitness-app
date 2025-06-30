import { UsersToPaySidebar } from '../components/admin/UsersToPaySidebar.js'

export function UsersToPayPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Users Who Need to Pay</h1>
        <UsersToPaySidebar />
      </div>
    </div>
  )
} 