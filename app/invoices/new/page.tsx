'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Client, InvoiceFormData, DailyWorkEntryWithFullRelations, InvoiceWorkEntryInsert } from '@/lib/types'
import { InvoiceService } from '@/lib/services/invoices'
import { ClientService } from '@/lib/services/clients'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await ClientService.getAll()
      setClients(data)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (formData: InvoiceFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      // Validation
      if (!formData.client_id) {
        setError('Please select a client')
        setSubmitting(false)
        return
      }

      if (!formData.period_start || !formData.period_end) {
        setError('Please select both start and end dates for the billing period')
        setSubmitting(false)
        return
      }

      if (formData.period_start > formData.period_end) {
        setError('Period end date must be after the start date')
        setSubmitting(false)
        return
      }

      // Generate invoice number
      const invoiceNumber = await InvoiceService.getNextInvoiceNumber()

      // Create invoice
      const invoice = await InvoiceService.create({
        invoice_number: invoiceNumber,
        client_id: formData.client_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        vat_rate: formData.vat_rate || 0,
        notes: formData.notes || null,
        status: formData.status || 'draft',
      })

      // Fetch work entries for the selected period
      const entries = await InvoiceService.getWorkEntriesForInvoice(
        formData.client_id,
        formData.period_start,
        formData.period_end
      )

      // Add all work entries to invoice automatically
      if (entries.length > 0) {
        const workEntriesToAdd: InvoiceWorkEntryInsert[] = entries.map(entry => ({
          invoice_id: invoice.id,
          work_entry_id: entry.id,
          hours_worked: entry.hours_worked + (entry.overtime_hours || 0),
          labor_cost: entry.override_cost || entry.calculated_cost,
          client_cost: entry.client_cost || entry.override_cost || entry.calculated_cost,
        }))

        await InvoiceService.addWorkEntries(invoice.id, workEntriesToAdd)
      }

      // Show success and redirect
      setSuccess(`Invoice ${invoiceNumber} created successfully! Redirecting...`)
      setTimeout(() => {
        router.push(`/invoices/${invoice.id}`)
      }, 1000)
    } catch (err) {
      console.error('Error creating invoice:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice. Please try again.'
      setError(errorMessage)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Create New Invoice" subtitle="Loading clients...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Create New Invoice" subtitle="Fill in the details below to create a new invoice">
      <div className="max-w-4xl mx-auto">
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

      {/* Invoice Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <InvoiceForm
          clients={clients}
          onSubmit={handleFormSubmit}
          isLoading={submitting}
        />
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All daily work entries for the selected client and date range will be automatically added</li>
          <li>• You can add additional costs and adjust the invoice after creation</li>
          <li>• The invoice will be created in &quot;Draft&quot; status by default</li>
          <li>• You can mark it as &quot;Issued&quot; when ready to send to the client</li>
        </ul>
      </div>
      </div>
    </DashboardLayout>
  )
}

