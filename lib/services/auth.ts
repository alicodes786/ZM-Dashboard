import { supabase } from '@/lib/supabase'

// Simple User interface (bypassing database types)
interface SimpleUser {
  id: string
  username: string
  password: string
  role: 'admin' | 'staff'
  full_name: string
  email: string | null
  active_status: boolean
  last_login: string | null
  staff_id: string | null
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  username: string
  role: 'admin' | 'staff'
  full_name: string
  email: string | null
  staff_id: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: AuthUser
  error?: string
}

export class AuthService {
  // Login user (simple text password)
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { username, password } = credentials
      
      // Get user from database  
      const { data: users, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('password', password)
        .eq('active_status', true)
        .limit(1)

      if (error) {
        console.error('Database error during login:', error)
        return { success: false, error: 'Database error' }
      }

      if (!users || users.length === 0) {
        return { success: false, error: 'Invalid username or password' }
      }

      const user = users[0] as SimpleUser

      // Update last login (skip for now due to type issues)
      // await supabase
      //   .from('users')
      //   .update({ last_login: new Date().toISOString() })
      //   .eq('id', user.id)

      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        staff_id: user.staff_id
      }

      return { success: true, user: authUser }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  // Create user (admin only)
  static async createUser(userData: Record<string, any>, password: string): Promise<{ success: boolean; user?: SimpleUser; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .insert({
          ...userData,
          password: password,
          username: userData.username.toLowerCase()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return { success: false, error: 'Failed to create user' }
      }

      return { success: true, user: data }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: 'Failed to create user' }
    }
  }

  // Update user password
  static async updatePassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({ password: newPassword })
        .eq('id', userId)

      if (error) {
        console.error('Error updating password:', error)
        return { success: false, error: 'Failed to update password' }
      }

      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      return { success: false, error: 'Failed to update password' }
    }
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<SimpleUser[]> {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }

    return data || []
  }

  // Get user by ID
  static async getUserById(id: string): Promise<SimpleUser | null> {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  }

  // Update user
  static async updateUser(id: string, updates: Record<string, any>): Promise<{ success: boolean; user?: SimpleUser; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        return { success: false, error: 'Failed to update user' }
      }

      return { success: true, user: data }
    } catch (error) {
      console.error('Update user error:', error)
      return { success: false, error: 'Failed to update user' }
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user:', error)
        return { success: false, error: 'Failed to delete user' }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete user error:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  }

  // Initialize default admin user
  static async initializeDefaultAdmin(): Promise<void> {
    try {
      // Check if admin user exists
      const { data: existingUsers } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('username', 'admin')
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        console.log('Admin user already exists')
        return
      }

      // Create default admin user
      const { error } = await (supabase as any)
        .from('users')
        .insert({
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          full_name: 'System Administrator',
          email: 'admin@company.com',
          active_status: true
        })

      if (error) {
        console.error('Error creating default admin:', error)
      } else {
        console.log('Default admin user created successfully')
      }
    } catch (error) {
      console.error('Initialize admin error:', error)
    }
  }
}

// Client-side authentication state management
export class AuthManager {
  private static readonly AUTH_KEY = 'zm-dashboard-auth'

  static setAuthUser(user: AuthUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(user))
    }
  }

  static getAuthUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.AUTH_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  static clearAuthUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.AUTH_KEY)
    }
  }

  static isAuthenticated(): boolean {
    return this.getAuthUser() !== null
  }

  static isAdmin(): boolean {
    const user = this.getAuthUser()
    return user?.role === 'admin'
  }

  static isStaff(): boolean {
    const user = this.getAuthUser()
    return user?.role === 'staff'
  }
}
