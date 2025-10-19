'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {actions && <div className="flex-1 flex justify-end">{actions}</div>}
            
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
