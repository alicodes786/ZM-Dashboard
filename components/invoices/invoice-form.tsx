'use client'

import { useState, useEffect } from 'react'
import { Client, InvoiceFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InvoiceFormProps {
  clients: Client[]
  onSubmit: (data: InvoiceFormData) => void
  initialData?: Partial<InvoiceFormData>
  isLoading?: boolean
}

export function InvoiceForm({ clients, onSubmit, initialData, isLoading }: InvoiceFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_id: initialData?.client_id || '',
    period_start: initialData?.period_start || firstDayOfMonth,
    period_end: initialData?.period_end || lastDayOfMonth,
    issue_date: initialData?.issue_date || today,
    due_date: initialData?.due_date || '',
    vat_rate: initialData?.vat_rate || 0,
    notes: initialData?.notes || '',
    status: initialData?.status || 'draft',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }))
    }
  }, [initialData])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.client_id) {
      newErrors.client_id = 'Client is required'
    }
    if (!formData.period_start) {
      newErrors.period_start = 'Start date is required'
    }
    if (!formData.period_end) {
      newErrors.period_end = 'End date is required'
    }
    if (formData.period_start && formData.period_end && formData.period_start > formData.period_end) {
      newErrors.period_end = 'End date must be after start date'
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
          Client *
        </label>
        <select
          id="client_id"
          value={formData.client_id}
          onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Select a client</option>
          {clients.filter(c => c.active_status).map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
        )}
      </div>

      {/* Period */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="period_start" className="block text-sm font-medium text-gray-700 mb-1">
            Period Start *
          </label>
          <Input
            type="date"
            id="period_start"
            value={formData.period_start}
            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
            disabled={isLoading}
          />
          {errors.period_start && (
            <p className="mt-1 text-sm text-red-600">{errors.period_start}</p>
          )}
        </div>
        <div>
          <label htmlFor="period_end" className="block text-sm font-medium text-gray-700 mb-1">
            Period End *
          </label>
          <Input
            type="date"
            id="period_end"
            value={formData.period_end}
            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
            disabled={isLoading}
          />
          {errors.period_end && (
            <p className="mt-1 text-sm text-red-600">{errors.period_end}</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date *
          </label>
          <Input
            type="date"
            id="issue_date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            disabled={isLoading}
          />
          {errors.issue_date && (
            <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
          )}
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <Input
            type="date"
            id="due_date"
            value={formData.due_date || ''}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">Leave empty if no due date is required</p>
        </div>
      </div>

      {/* VAT Rate */}
      <div>
        <label htmlFor="vat_rate" className="block text-sm font-medium text-gray-700 mb-1">
          VAT Rate (%)
        </label>
        <Input
          type="number"
          id="vat_rate"
          value={formData.vat_rate || 0}
          onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
          step="0.01"
          min="0"
          max="100"
          disabled={isLoading}
        />
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes or comments..."
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  )
}

