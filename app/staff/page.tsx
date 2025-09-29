'use client'

import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { StaffTable } from '@/components/staff/staff-table'
import { StaffForm } from '@/components/staff/staff-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Staff } from '@/lib/types'
import { StaffService } from '@/lib/services/staff'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>()

  const fetchStaff = async () => {
    try {
      setError(null)
      const data = await StaffService.getAll()
      setStaff(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleAddStaff = () => {
    setEditingStaff(undefined)
    setShowForm(true)
  }

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setShowForm(true)
  }

  const handleFormSuccess = (staffMember: Staff) => {
    setShowForm(false)
    setEditingStaff(undefined)
    fetchStaff()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingStaff(undefined)
  }

  const activeStaff = staff.filter(s => s.active_status)
  const totalPayrollCost = activeStaff.reduce((sum, s) => {
    if (s.payment_type === 'daily_rate' && s.daily_rate) {
      return sum + s.daily_rate
    } else if (s.payment_type === 'monthly_salary' && s.monthly_salary) {
      return sum + (s.monthly_salary / 22) // Convert to daily rate
    }
    return sum
  }, 0)

  const headerActions = (
    <Button onClick={handleAddStaff} className="flex items-center space-x-2">
      <Plus className="h-4 w-4" />
      <span>Add Staff Member</span>
    </Button>
  )

  if (showForm) {
    return (
      <DashboardLayout title="Staff Management">
        <div className="max-w-4xl mx-auto">
          <StaffForm
            staff={editingStaff}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Staff Management"
      subtitle="Manage your team members, rates, and work allocation"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{activeStaff.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">£</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Daily Rate Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{totalPayrollCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Daily Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeStaff.length > 0 
                    ? (activeStaff.reduce((sum, s) => sum + s.allocated_daily_hours, 0) / activeStaff.length).toFixed(1)
                    : '0'
                  }h
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Staff Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading staff...</span>
            </div>
          </div>
        ) : (
          <StaffTable
            staff={staff}
            onEdit={handleEditStaff}
            onRefresh={fetchStaff}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
