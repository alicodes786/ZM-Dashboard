'use client'

import { useState } from 'react'
import { InvoiceAdditionalCost, InvoiceAdditionalCostInsert } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface InvoiceAdditionalCostsProps {
  costs: InvoiceAdditionalCost[]
  invoiceId: string
  onAdd?: (cost: InvoiceAdditionalCostInsert) => void
  onDelete?: (id: string) => void
  readOnly?: boolean
}

const costTypeLabels = {
  expense: 'Expense',
  material: 'Material',
  transport: 'Transport',
  subcontracting: 'Subcontracting',
  misc: 'Miscellaneous',
}

export function InvoiceAdditionalCosts({ 
  costs, 
  invoiceId, 
  onAdd, 
  onDelete, 
  readOnly 
}: InvoiceAdditionalCostsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Omit<InvoiceAdditionalCostInsert, 'invoice_id'>>({
    description: '',
    amount: 0,
    cost_type: 'misc',
    date: new Date().toISOString().split('T')[0],
  })

  const handleAdd = () => {
    if (formData.description && formData.amount > 0 && onAdd) {
      onAdd({
        ...formData,
        invoice_id: invoiceId,
      })
      setFormData({
        description: '',
        amount: 0,
        cost_type: 'misc',
        date: new Date().toISOString().split('T')[0],
      })
      setShowAddForm(false)
    }
  }

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0)

  return (
    <div className="space-y-4">
      {costs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                {!readOnly && onDelete && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costs.map((cost) => (
                <tr key={cost.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(cost.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {cost.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {costTypeLabels[cost.cost_type]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(cost.amount)}
                  </td>
                  {!readOnly && onDelete && (
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onDelete(cost.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
                  Total Additional Costs:
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totalCosts)}
                </td>
                {!readOnly && onDelete && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {!readOnly && onAdd && (
        <>
          {!showAddForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Additional Cost
            </Button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Add Additional Cost</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.cost_type}
                    onChange={(e) => setFormData({ ...formData, cost_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="material">Material</option>
                    <option value="transport">Transport</option>
                    <option value="subcontracting">Subcontracting</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Materials for installation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      description: '',
                      amount: 0,
                      cost_type: 'misc',
                      date: new Date().toISOString().split('T')[0],
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={!formData.description || formData.amount <= 0}
                >
                  Add Cost
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {costs.length === 0 && readOnly && (
        <div className="text-center py-4 text-gray-500">
          No additional costs
        </div>
      )}
    </div>
  )
}

