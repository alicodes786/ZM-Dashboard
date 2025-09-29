'use client'

import { useState } from 'react'
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Staff } from '@/lib/types'
import { StaffService } from '@/lib/services/staff'
import { formatCurrency } from '@/lib/utils'

interface StaffTableProps {
  staff: Staff[]
  onEdit: (staff: Staff) => void
  onRefresh: () => void
}

export function StaffTable({ staff, onEdit, onRefresh }: StaffTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleToggleStatus = async (staffMember: Staff) => {
    setLoading(staffMember.id)
    setError(null)

    try {
      await StaffService.toggleActiveStatus(staffMember.id)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to delete ${staffMember.name}? This action cannot be undone.`)) {
      return
    }

    setLoading(staffMember.id)
    setError(null)

    try {
      await StaffService.delete(staffMember.id)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member')
    } finally {
      setLoading(null)
    }
  }

  const calculateHourlyRate = (staffMember: Staff): number => {
    return StaffService.calculateHourlyRate(staffMember)
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <UserX className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No staff members</h3>
        <p className="mt-2 text-gray-500">Get started by adding your first staff member.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Daily Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((staffMember) => (
              <TableRow key={staffMember.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium text-gray-900">{staffMember.name}</div>
                    {staffMember.pay_override_enabled && (
                      <div className="text-xs text-blue-600 font-medium">
                        Override: {formatCurrency(staffMember.pay_override_amount || 0)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{staffMember.email}</TableCell>
                <TableCell className="text-gray-600">{staffMember.phone || '-'}</TableCell>
                <TableCell className="font-medium">
                  {StaffService.getPaymentDisplayText(staffMember)}
                </TableCell>
                <TableCell>
                  {formatCurrency(calculateHourlyRate(staffMember))}/hr
                </TableCell>
                <TableCell>{staffMember.allocated_daily_hours}h</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staffMember.active_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {staffMember.active_status ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(staffMember)}
                      disabled={loading === staffMember.id}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(staffMember)}
                      disabled={loading === staffMember.id}
                      className="h-8 w-8"
                    >
                      {staffMember.active_status ? (
                        <UserX className="h-4 w-4 text-orange-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(staffMember)}
                      disabled={loading === staffMember.id}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {staff.length} staff member{staff.length !== 1 ? 's' : ''}
        </div>
        <div>
          Active: {staff.filter(s => s.active_status).length} | 
          Inactive: {staff.filter(s => !s.active_status).length}
        </div>
      </div>
    </div>
  )
}
