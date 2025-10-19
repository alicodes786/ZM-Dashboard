'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InvoiceWithRelations, InvoiceAdditionalCostInsert } from '@/lib/types'
import { InvoiceService } from '@/lib/services/invoices'
import { InvoiceWorkEntries } from '@/components/invoices/invoice-work-entries'
import { InvoiceAdditionalCosts } from '@/components/invoices/invoice-additional-costs'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  FileText, 
  Download,
  CheckCircle,
  XCircle 
} from 'lucide-react'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels = {
  draft: 'Draft',
  issued: 'Issued',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export default function InvoiceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    paid_amount: 0,
    payment_reference: '',
    payment_method: '',
  })

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await InvoiceService.getById(invoiceId)
      if (data) {
        setInvoice(data)
        setPaymentData(prev => ({ ...prev, paid_amount: data.total_amount }))
      } else {
        setError('Invoice not found')
      }
    } catch (err) {
      console.error('Error fetching invoice:', err)
      setError('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled') => {
    if (!invoice) return

    try {
      setError(null)
      setSuccess(null)
      await InvoiceService.updateStatus(invoice.id, newStatus)
      setSuccess(`Invoice status updated to ${newStatus}`)
      await fetchInvoice()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice status'
      setError(errorMessage)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!invoice) return

    // Validation
    if (!paymentData.payment_date) {
      setError('Please enter a payment date')
      return
    }

    if (paymentData.paid_amount <= 0) {
      setError('Payment amount must be greater than zero')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await InvoiceService.markAsPaid(
        invoice.id,
        paymentData.payment_date,
        paymentData.paid_amount,
        paymentData.payment_reference,
        paymentData.payment_method
      )
      setShowPaymentForm(false)
      setSuccess('Invoice marked as paid successfully')
      await fetchInvoice()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error marking as paid:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark invoice as paid'
      setError(errorMessage)
    }
  }

  const handleAddCost = async (cost: InvoiceAdditionalCostInsert) => {
    try {
      setError(null)
      setSuccess(null)
      await InvoiceService.addAdditionalCost(cost)
      setSuccess('Additional cost added successfully')
      await fetchInvoice()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error adding cost:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add additional cost'
      setError(errorMessage)
    }
  }

  const handleDeleteCost = async (costId: string) => {
    try {
      setError(null)
      setSuccess(null)
      await InvoiceService.deleteAdditionalCost(costId)
      setSuccess('Additional cost removed successfully')
      await fetchInvoice()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting cost:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete additional cost'
      setError(errorMessage)
    }
  }

  const handleRemoveWorkEntry = async (workEntryId: string) => {
    if (!invoice) return

    try {
      setError(null)
      setSuccess(null)
      await InvoiceService.removeWorkEntry(invoice.id, workEntryId)
      setSuccess('Work entry removed from invoice')
      await fetchInvoice()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error removing work entry:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove work entry'
      setError(errorMessage)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading Invoice..." subtitle="Please wait">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !invoice) {
    return (
      <DashboardLayout title="Invoice Not Found" subtitle="Unable to load invoice details">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Invoice not found'}
        </div>
        <Link href="/invoices" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Link>
      </DashboardLayout>
    )
  }

  const isEditable = invoice.status === 'draft'

  const headerActions = (
    <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <Button variant="outline" onClick={() => handleStatusChange('issued')}>
                <FileText className="h-4 w-4 mr-2" />
                Mark as Issued
              </Button>
            )}
            {(invoice.status === 'issued' || invoice.status === 'overdue') && (
              <Button onClick={() => setShowPaymentForm(!showPaymentForm)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button variant="outline" onClick={() => handleStatusChange('cancelled')}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
    </div>
  )

  return (
    <DashboardLayout 
      title={invoice.invoice_number} 
      subtitle={invoice.client?.name}
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto">
      <Link href="/invoices" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoices
      </Link>

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Paid
              </label>
              <input
                type="number"
                value={paymentData.paid_amount}
                onChange={(e) => setPaymentData({ ...paymentData, paid_amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <input
                type="text"
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                placeholder="e.g., Bank Transfer, Card"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Reference
              </label>
              <input
                type="text"
                value={paymentData.payment_reference}
                onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                placeholder="e.g., Transaction ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkAsPaid}>
              Confirm Payment
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Invoice Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Period</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Issue Date</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(invoice.issue_date)}</dd>
            </div>
            {invoice.due_date && (
              <div>
                <dt className="text-sm text-gray-600">Due Date</dt>
                <dd className="text-sm font-medium text-gray-900">{formatDate(invoice.due_date)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-600">Created</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(invoice.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Client Information</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Name</dt>
              <dd className="text-sm font-medium text-gray-900">{invoice.client?.name}</dd>
            </div>
            {invoice.client?.company_name && (
              <div>
                <dt className="text-sm text-gray-600">Company</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.client.company_name}</dd>
              </div>
            )}
            {invoice.client?.email && (
              <div>
                <dt className="text-sm text-gray-600">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.client.email}</dd>
              </div>
            )}
            {invoice.client?.phone && (
              <div>
                <dt className="text-sm text-gray-600">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.client.phone}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Work Entries */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Entries</h3>
        <InvoiceWorkEntries
          entries={invoice.work_entries || []}
          onRemove={isEditable ? handleRemoveWorkEntry : undefined}
          readOnly={!isEditable}
        />
      </div>

      {/* Additional Costs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Costs</h3>
        <InvoiceAdditionalCosts
          costs={invoice.additional_costs || []}
          invoiceId={invoice.id}
          onAdd={isEditable ? handleAddCost : undefined}
          onDelete={isEditable ? handleDeleteCost : undefined}
          readOnly={!isEditable}
        />
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-600">Work Entries Subtotal:</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-600">Additional Costs:</dt>
            <dd className="font-medium text-gray-900">{formatCurrency(invoice.additional_cost_total)}</dd>
          </div>
          {invoice.vat_rate && invoice.vat_rate > 0 && (
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600">VAT ({invoice.vat_rate}%):</dt>
              <dd className="font-medium text-gray-900">{formatCurrency(invoice.vat_amount || 0)}</dd>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 mt-3"></div>
          <div className="flex justify-between text-lg">
            <dt className="font-bold text-gray-900">Total Amount:</dt>
            <dd className="font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</dd>
          </div>
          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <dt className="text-green-600">Paid Amount:</dt>
                <dd className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Outstanding:</dt>
                <dd className="font-medium text-gray-900">
                  {formatCurrency(invoice.total_amount - invoice.paid_amount)}
                </dd>
              </div>
            </>
          )}
        </dl>

        {invoice.payment_date && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Payment received on {formatDate(invoice.payment_date)}
              {invoice.payment_method && ` via ${invoice.payment_method}`}
              {invoice.payment_reference && ` (Ref: ${invoice.payment_reference})`}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}

