'use client'

import { InvoiceWorkEntryWithDetails } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface InvoiceWorkEntriesProps {
  entries: InvoiceWorkEntryWithDetails[]
  onRemove?: (workEntryId: string) => void
  readOnly?: boolean
}

export function InvoiceWorkEntries({ entries, onRemove, readOnly }: InvoiceWorkEntriesProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No work entries added yet
      </div>
    )
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0)
  const totalLabor = entries.reduce((sum, entry) => sum + entry.labor_cost, 0)
  const totalClient = entries.reduce((sum, entry) => sum + entry.client_cost, 0)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Labor Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client Cost
              </th>
              {!readOnly && onRemove && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {entry.daily_work_entry ? formatDate(entry.daily_work_entry.date) : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {entry.daily_work_entry?.staff?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                  {entry.daily_work_entry?.task_description || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {entry.hours_worked.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(entry.labor_cost)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(entry.client_cost)}
                </td>
                {!readOnly && onRemove && (
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onRemove(entry.work_entry_id)}
                      className="text-red-600 hover:text-red-900"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                Totals:
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                {totalHours.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(totalLabor)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                {formatCurrency(totalClient)}
              </td>
              {!readOnly && onRemove && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

