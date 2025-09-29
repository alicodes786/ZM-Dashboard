'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  ClipboardList, 
  BarChart3, 
  FileText, 
  Settings,
  Building2
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Jobs', href: '/jobs', icon: FileText },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Daily Work', href: '/daily-work', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3, disabled: true },
  { name: 'Settings', href: '/settings', icon: Settings, disabled: true },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">ZM Dashboard</h1>
        </div>
      </div>
      
      <div className="px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
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
      
    </nav>
  )
}
