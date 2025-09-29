'use client'

import { Navigation } from './navigation'
import { Header } from './header'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  headerActions?: React.ReactNode
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={title} 
          subtitle={subtitle} 
          actions={headerActions} 
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
