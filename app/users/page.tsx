'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/contexts/auth-context'
import { User as UserType } from '@/lib/types'
import { AuthService } from '@/lib/services/auth'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.')
      setLoading(false)
      return
    }

    fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setError(null)
      const usersData = await AuthService.getAllUsers()
      setUsers(usersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (user: UserType) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return
    }

    try {
      const result = await AuthService.deleteUser(user.id)
      if (result.success) {
        await fetchUsers() // Refresh the list
      } else {
        setError(result.error || 'Failed to delete user')
      }
    } catch {
      setError('Failed to delete user')
    }
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Access denied. You need administrator privileges to view this page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="User Management" subtitle="Manage system users and their permissions">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button disabled className="opacity-50">
            <Plus className="h-4 w-4 mr-2" />
            Add User (Coming Soon)
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-red-500 mr-2" />
                          ) : (
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                          )}
                          <span className={`capitalize ${
                            user.role === 'admin' ? 'text-red-600 font-medium' : 'text-blue-600'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.email || 'Not set'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.active_status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active_status ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.username !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Default Admin Access</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Username: <code className="bg-blue-100 px-2 py-1 rounded">admin</code> | 
                  Password: <code className="bg-blue-100 px-2 py-1 rounded">admin123</code>
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  Simple text passwords for internal operations app.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
