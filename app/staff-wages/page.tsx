'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, CheckCircle, Clock, Plus, Download, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PaymentsService } from '@/lib/services/payments'
import { StaffWagesSummary, StaffPaymentWithStaff } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

export default function StaffWagesPage() {
  const [wagesSummary, setWagesSummary] = useState<StaffWagesSummary[]>([])
  const [payments, setPayments] = useState<StaffPaymentWithStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  // Set default period to current month
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setPeriodStart(firstDay.toISOString().split('T')[0])
    setPeriodEnd(lastDay.toISOString().split('T')[0])
  }, [])

  const fetchData = async () => {
    if (!periodStart || !periodEnd) return
    
    try {
      setLoading(true)
      setError(null)
      
      const [summary, allPayments, outstanding] = await Promise.all([
        PaymentsService.getWagesSummary(periodStart, periodEnd),
        PaymentsService.getAll(),
        PaymentsService.getTotalOutstanding()
      ])
      
      setWagesSummary(summary)
      setPayments(allPayments)
      setTotalOutstanding(outstanding)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wages data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [periodStart, periodEnd])

  const handleGeneratePayments = async () => {
    try {
      setError(null)
      setSuccess(null)
      const created = await PaymentsService.generatePaymentsForPeriod(periodStart, periodEnd)
      setSuccess(`Successfully generated ${created.length} payment record(s)`)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payments')
    }
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      setError(null)
      setSuccess(null)
      const today = new Date().toISOString().split('T')[0]
      await PaymentsService.markAsPaid(paymentId, today, 'bank_transfer')
      setSuccess('Payment marked as paid')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payment as paid')
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return
    
    try {
      setError(null)
      setSuccess(null)
      await PaymentsService.delete(paymentId)
      setSuccess('Payment record deleted')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment')
    }
  }

  const handleSetPeriodToLastMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
    
    setPeriodStart(firstDay.toISOString().split('T')[0])
    setPeriodEnd(lastDay.toISOString().split('T')[0])
  }

  const handleSetPeriodToThisMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setPeriodStart(firstDay.toISOString().split('T')[0])
    setPeriodEnd(lastDay.toISOString().split('T')[0])
  }

  // Calculate totals for the selected period
  const totalDue = wagesSummary.reduce((sum, s) => sum + s.totalWagesDue, 0)
  const totalPaid = wagesSummary.reduce((sum, s) => sum + s.totalPaid, 0)
  const totalHours = wagesSummary.reduce((sum, s) => sum + s.totalHoursWorked, 0)
  const periodOutstanding = totalDue - totalPaid

  // Filter payments based on filter selection
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true
    if (filter === 'pending') return payment.status === 'pending' || payment.status === 'partially_paid'
    if (filter === 'paid') return payment.status === 'paid'
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading && !wagesSummary.length) {
    return (
      <DashboardLayout title="Staff Wages & Payments" subtitle="Track wages owed and manage payment records">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading wages data...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Staff Wages & Payments" subtitle="Track wages owed and manage payment records">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleGeneratePayments} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Generate Payments
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Period:</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSetPeriodToThisMonth} variant="outline" size="sm">
                  This Month
                </Button>
                <Button onClick={handleSetPeriodToLastMonth} variant="outline" size="sm">
                  Last Month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wages Due</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                For selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Payments in period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                For selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wages Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Wages Summary by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Staff Member</th>
                    <th className="text-right p-3 font-medium">Hours Worked</th>
                    <th className="text-right p-3 font-medium">Tasks</th>
                    <th className="text-right p-3 font-medium">Wages Due</th>
                    <th className="text-right p-3 font-medium">Paid</th>
                    <th className="text-right p-3 font-medium">Outstanding</th>
                    <th className="text-right p-3 font-medium">Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {wagesSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No work entries found for this period
                      </td>
                    </tr>
                  ) : (
                    wagesSummary.map((summary) => (
                      <tr key={summary.staffId} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{summary.staffName}</td>
                        <td className="p-3 text-right">{summary.totalHoursWorked.toFixed(1)}</td>
                        <td className="p-3 text-right">{summary.workEntriesCount}</td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(summary.totalWagesDue)}
                        </td>
                        <td className="p-3 text-right text-green-600">
                          {formatCurrency(summary.totalPaid)}
                        </td>
                        <td className="p-3 text-right">
                          <span className={summary.totalOutstanding > 0 ? 'text-orange-600 font-medium' : ''}>
                            {formatCurrency(summary.totalOutstanding)}
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm text-gray-600">
                          {summary.lastPaymentDate ? formatDate(summary.lastPaymentDate) : 'Never'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {wagesSummary.length > 0 && (
                  <tfoot>
                    <tr className="font-bold border-t-2 bg-gray-50">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">{totalHours.toFixed(1)}</td>
                      <td className="p-3 text-right">
                        {wagesSummary.reduce((sum, s) => sum + s.workEntriesCount, 0)}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(totalDue)}</td>
                      <td className="p-3 text-right">{formatCurrency(totalPaid)}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(periodOutstanding)}
                      </td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Records */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Records</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('paid')}
                >
                  Paid
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Staff Member</th>
                    <th className="text-left p-3 font-medium">Period</th>
                    <th className="text-right p-3 font-medium">Amount Due</th>
                    <th className="text-right p-3 font-medium">Amount Paid</th>
                    <th className="text-left p-3 font-medium">Payment Date</th>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No payment records found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{payment.staff?.name || 'Unknown'}</td>
                        <td className="p-3 text-sm">
                          {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                        </td>
                        <td className="p-3 text-right font-medium">{formatCurrency(payment.amount_due)}</td>
                        <td className="p-3 text-right">{formatCurrency(payment.amount_paid)}</td>
                        <td className="p-3 text-sm">
                          {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {PaymentsService.formatPaymentMethod(payment.payment_method)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            PaymentsService.getStatusColor(payment.status)
                          }`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment.id)}
                                className="text-xs"
                              >
                                Mark Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

