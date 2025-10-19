'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  FileText, 
  Settings,
  Building2,
  LogOut,
  User,
  DollarSign,
  Briefcase,
  Receipt
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  adminOnly?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Staff Wages', href: '/staff-wages', icon: DollarSign },
  { name: 'Daily Work', href: '/daily-work', icon: ClipboardList },
  { name: 'Users', href: '/users', icon: User, adminOnly: true },
  { name: 'Reports', href: '/reports', icon: BarChart3, disabled: true },
  { name: 'Settings', href: '/settings', icon: Settings, disabled: true },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">ZM Dashboard</h1>
        </div>
      </div>
      
      <div className="px-3 flex-1">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            // Hide admin-only items for non-admin users
            if (item.adminOnly && user?.role !== 'admin') {
              return null
            }
            
            return (
              <li key={item.name}>
                {item.disabled ? (
                  <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                    <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">Soon</span>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* User info and logout */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg mb-2">
          <User className="mr-3 h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )
}
