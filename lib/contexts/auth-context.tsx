'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthUser, AuthManager, AuthService } from '@/lib/services/auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isStaff: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize default admin user if needed
        await AuthService.initializeDefaultAdmin()
        
        // Check for existing auth
        const storedUser = AuthManager.getAuthUser()
        if (storedUser) {
          setUser(storedUser)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const publicRoutes = ['/login']
      const isPublicRoute = publicRoutes.includes(pathname)
      console.log('Auth Context: Route check - User:', user?.username, 'Path:', pathname, 'IsPublic:', isPublicRoute)
      
      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        console.log('Auth Context: Redirecting to login - no user')
        router.push('/login')
      } else if (user && pathname === '/login') {
        // Already authenticated and on login page - redirect to home
        console.log('Auth Context: Redirecting to home - user logged in')
        router.replace('/')
      }
    }
  }, [user, pathname, isLoading, router])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Auth Context: Attempting login for:', username)
      const response = await AuthService.login({ username, password })
      
      if (response.success && response.user) {
        console.log('Auth Context: Login successful, setting user:', response.user)
        setUser(response.user)
        AuthManager.setAuthUser(response.user)
        return true
      }
      
      console.log('Auth Context: Login failed:', response.error)
      return false
    } catch (error) {
      console.error('Auth Context: Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    AuthManager.clearAuthUser()
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
