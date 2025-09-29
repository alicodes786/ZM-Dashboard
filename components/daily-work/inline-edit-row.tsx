'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { DailyWorkEntryWithFullRelations } from '@/lib/types'
import { DailyWorkService } from '@/lib/services/daily-work'
import { formatCurrency } from '@/lib/utils'

interface InlineEditRowProps {
  entry: DailyWorkEntryWithFullRelations
  onUpdate: () => void
  onCancel: () => void
}

export function InlineEditRow({ entry, onUpdate, onCancel }: InlineEditRowProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [values, setValues] = useState({
    task_description: entry.task_description,
    hours_worked: entry.hours_worked,
    override_cost: entry.override_cost || '',
    notes: entry.notes || '',
  })

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await DailyWorkService.update(entry.id, {
        task_description: values.task_description,
        hours_worked: values.hours_worked,
        override_cost: values.override_cost ? parseFloat(values.override_cost.toString()) : null,
        notes: values.notes || null,
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to update entry:', error)
      // Could add error handling here
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setValues({
      task_description: entry.task_description,
      hours_worked: entry.hours_worked,
      override_cost: entry.override_cost || '',
      notes: entry.notes || '',
    })
    onCancel()
  }

  return (
    <TableRow className="bg-blue-50">
      <TableCell className="font-medium">
        {entry.staff?.name || 'Unknown Staff'}
      </TableCell>
      
      <TableCell>
        <div className="space-y-2">
          <Input
            value={values.task_description}
            onChange={(e) => setValues({...values, task_description: e.target.value})}
            className="text-sm"
            placeholder="Task description"
          />
          <Input
            value={values.notes}
            onChange={(e) => setValues({...values, notes: e.target.value})}
            className="text-sm"
            placeholder="Notes (optional)"
          />
        </div>
      </TableCell>

      <TableCell>
        <div>
          <div className="font-medium">
            {entry.client?.name || entry.client_name}
          </div>
          {entry.client?.company_name && (
            <div className="text-sm text-gray-500">
              {entry.client.company_name}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <Input
          type="number"
          step="0.25"
          value={values.hours_worked}
          onChange={(e) => setValues({...values, hours_worked: parseFloat(e.target.value) || 0})}
          className="w-20 text-sm"
        />
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <Input
            type="number"
            step="0.01"
            value={values.override_cost}
            onChange={(e) => setValues({...values, override_cost: e.target.value})}
            className="w-24 text-sm"
            placeholder="Client price"
          />
          <div className="text-xs text-gray-500">
            Labor: {formatCurrency(entry.calculated_cost)}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div>
          {entry.margin_amount !== null && entry.margin_percentage !== null ? (
            <>
              <div className={`font-medium text-sm ${
                entry.margin_amount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {entry.margin_amount >= 0 ? '+' : ''}{formatCurrency(entry.margin_amount)}
              </div>
              <div className={`text-xs ${
                entry.margin_percentage >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {entry.margin_percentage >= 0 ? '+' : ''}{entry.margin_percentage}%
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-sm">Updating...</div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
