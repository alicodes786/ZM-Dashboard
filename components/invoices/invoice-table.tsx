'use client'

import { useState } from 'react'
import Link from 'next/link'
import { InvoiceWithClient } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Edit2, Trash2, FileText, Eye } from 'lucide-react'

interface InvoiceTableProps {
  invoices: InvoiceWithClient[]
  onDelete?: (id: string) => void
}

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

export function InvoiceTable({ invoices, onDelete }: InvoiceTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete?.(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new invoice.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issue Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.invoice_number}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invoice.client?.name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.issue_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.due_date ? formatDate(invoice.due_date) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(invoice.total_amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
                  {statusLabels[invoice.status]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.payment_date ? formatDate(invoice.payment_date) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {invoice.status === 'draft' && (
                    <>
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className={`${
                          deleteConfirm === invoice.id
                            ? 'text-red-600 font-bold'
                            : 'text-red-600'
                        } hover:text-red-900`}
                        title={deleteConfirm === invoice.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

