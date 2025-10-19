'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InvoiceWithClient } from '@/lib/types'
import { InvoiceService } from '@/lib/services/invoices'
import { InvoiceTable } from '@/components/invoices/invoice-table'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, FileText } from 'lucide-react'

type FilterStatus = 'all' | 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [invoices, filterStatus, searchTerm])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await InvoiceService.getAll()
      setInvoices(data)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = invoices

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(inv => 
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.client?.name.toLowerCase().includes(term)
      )
    }

    setFilteredInvoices(filtered)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      await InvoiceService.delete(id)
      await fetchInvoices()
    } catch (err) {
      console.error('Error deleting invoice:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice'
      setError(errorMessage)
    }
  }

  const handleCreateNew = () => {
    router.push('/invoices/new')
  }

  const filterButtons: { status: FilterStatus; label: string; color: string }[] = [
    { status: 'all', label: 'All', color: 'bg-gray-100 text-gray-800' },
    { status: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { status: 'issued', label: 'Issued', color: 'bg-blue-100 text-blue-800' },
    { status: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  ]

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total_amount, 0),
    paidAmount: invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0),
  }

  if (loading) {
    return (
      <DashboardLayout title="Invoices" subtitle="Manage client invoicing and billing">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  const headerActions = (
    <Button onClick={handleCreateNew}>
      <Plus className="h-4 w-4 mr-2" />
      New Invoice
    </Button>
  )

  return (
    <DashboardLayout title="Invoices" subtitle="Manage client invoicing and billing" headerActions={headerActions}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600">{stats.draft}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issued</p>
              <p className="text-2xl font-bold text-blue-600">{stats.issued}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">{stats.issued}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-sm font-bold text-red-600">{stats.overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ status, label, color }) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? color + ' ring-2 ring-offset-2 ring-blue-500'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
              {status !== 'all' && ` (${invoices.filter(i => i.status === status).length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by invoice number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="outline" onClick={fetchInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <InvoiceTable 
        invoices={filteredInvoices}
        onDelete={handleDelete}
      />

      {/* Empty State */}
      {filteredInvoices.length === 0 && !loading && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          No invoices found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </DashboardLayout>
  )
}

