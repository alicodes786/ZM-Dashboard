'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DailyWorkEntry, DailyWorkEntryInsert, Staff, Client, JobWithClient } from '@/lib/types'
import { DailyWorkService } from '@/lib/services/daily-work'
import { StaffService } from '@/lib/services/staff'
import { ClientService } from '@/lib/services/clients'
import { JobService } from '@/lib/services/jobs'
import { formatCurrency } from '@/lib/utils'

const workEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  staff_id: z.string().min(1, 'Please select a staff member'),
  task_description: z.string().min(3, 'Task description must be at least 3 characters'),
  client_id: z.string().min(1, 'Please select a client'),
  job_id: z.string().optional(),
  hours_worked: z.number().min(0.1, 'Hours must be greater than 0').max(24, 'Hours cannot exceed 24'),
  override_cost: z.number().optional(),
  notes: z.string().optional(),
})

type WorkEntryFormData = z.infer<typeof workEntrySchema>

interface WorkEntryFormProps {
  entry?: DailyWorkEntry
  defaultDate?: string
  onSuccess: (entry: DailyWorkEntry) => void
  onCancel: () => void
}

export function WorkEntryForm({ entry, defaultDate, onSuccess, onCancel }: WorkEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<JobWithClient[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [calculatedCost, setCalculatedCost] = useState<number>(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkEntryFormData>({
    resolver: zodResolver(workEntrySchema),
    defaultValues: {
      date: entry?.date || defaultDate || new Date().toISOString().split('T')[0],
      staff_id: entry?.staff_id || '',
      task_description: entry?.task_description || '',
      client_id: entry?.client_id || '',
      job_id: entry?.job_id || '',
      hours_worked: entry?.hours_worked || 0,
      override_cost: entry?.override_cost || undefined,
      notes: entry?.notes || '',
    },
  })

  const watchedStaffId = watch('staff_id')
  const watchedClientId = watch('client_id')
  const watchedHours = watch('hours_worked')
  const watchedOverrideCost = watch('override_cost')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffData, clientsData] = await Promise.all([
          StaffService.getActive(),
          ClientService.getActive(),
        ])
        setStaff(staffData)
        setClients(clientsData)
      } catch (err) {
        setError('Failed to load form data')
      }
    }
    fetchData()
  }, [])

  // Fetch jobs when client changes
  useEffect(() => {
    const fetchJobs = async () => {
      if (watchedClientId) {
        try {
          const jobsData = await JobService.getByClient(watchedClientId)
          setJobs(jobsData.filter(job => ['draft', 'active'].includes(job.status)))
          
          const client = clients.find(c => c.id === watchedClientId)
          setSelectedClient(client || null)
        } catch (err) {
          console.error('Failed to load jobs:', err)
          setJobs([])
        }
      } else {
        setJobs([])
        setSelectedClient(null)
      }
    }
    fetchJobs()
  }, [watchedClientId, clients])

  useEffect(() => {
    const staffMember = staff.find(s => s.id === watchedStaffId)
    setSelectedStaff(staffMember || null)

    if (staffMember && watchedHours > 0) {
      const cost = StaffService.calculateTaskCost(watchedHours, staffMember)
      setCalculatedCost(cost)
    } else {
      setCalculatedCost(0)
    }
  }, [watchedStaffId, watchedHours, staff])

  // Calculate client cost and margin for display (simplified)
  const getClientCostAndMargin = () => {
    if (!selectedStaff || watchedHours <= 0) {
      return { clientCost: 0, marginAmount: 0, marginPercentage: 0 }
    }

    const laborCost = calculatedCost
    const clientCost = watchedOverrideCost && watchedOverrideCost > 0 ? watchedOverrideCost : laborCost

    const marginAmount = clientCost - laborCost
    const marginPercentage = clientCost > 0 ? (marginAmount / clientCost) * 100 : 0

    return {
      clientCost,
      marginAmount,
      marginPercentage: Math.round(marginPercentage * 100) / 100
    }
  }

  const { clientCost, marginAmount, marginPercentage } = getClientCostAndMargin()

  const onSubmit = async (data: WorkEntryFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const entryData: DailyWorkEntryInsert = {
        ...data,
        client_name: selectedClient?.name || 'Unknown Client', // Keep for backward compatibility
        job_id: data.job_id || null,
        override_cost: data.override_cost || null,
        notes: data.notes || null,
      }

      let result: DailyWorkEntry
      if (entry) {
        result = await DailyWorkService.update(entry.id, entryData)
      } else {
        result = await DailyWorkService.create(entryData)
      }

      onSuccess(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {entry ? 'Edit Work Entry' : 'Add New Work Entry'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <Input
                {...register('date')}
                type="date"
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member *
              </label>
              <select
                {...register('staff_id')}
                className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  errors.staff_id ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select staff member</option>
                {staff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.name} - {StaffService.getPaymentDisplayText(staffMember)}
                  </option>
                ))}
              </select>
              {errors.staff_id && (
                <p className="text-red-500 text-sm mt-1">{errors.staff_id.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <textarea
                {...register('task_description')}
                rows={3}
                className={`flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  errors.task_description ? 'border-red-500' : ''
                }`}
                placeholder="Describe the work performed..."
              />
              {errors.task_description && (
                <p className="text-red-500 text-sm mt-1">{errors.task_description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                {...register('client_id')}
                className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  errors.client_id ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-red-500 text-sm mt-1">{errors.client_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job (Optional)
              </label>
              <select
                {...register('job_id')}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                disabled={!watchedClientId}
              >
                <option value="">No specific job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {!watchedClientId 
                  ? 'Select a client first to see available jobs'
                  : jobs.length === 0 
                  ? 'No active jobs for this client'
                  : 'Link this work to a specific job (optional)'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked *
              </label>
              <Input
                {...register('hours_worked', { valueAsNumber: true })}
                type="number"
                step="0.25"
                placeholder="0.00"
                className={errors.hours_worked ? 'border-red-500' : ''}
              />
              {errors.hours_worked && (
                <p className="text-red-500 text-sm mt-1">{errors.hours_worked.message}</p>
              )}
            </div>
          </div>

          {/* Enhanced Cost Calculation Display */}
          {selectedStaff && watchedHours > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">💰 Cost & Margin Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                
                {/* Labor Cost */}
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-gray-600">Labor Cost</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(calculatedCost)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {watchedHours}h × {formatCurrency(StaffService.calculateHourlyRate(selectedStaff))}/h
                  </div>
                </div>

                {/* Client Cost */}
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-gray-600">Client Cost</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(clientCost)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {watchedOverrideCost ? 'Fixed price set' : 'Same as labor cost'}
                  </div>
                </div>

                {/* Margin */}
                <div className="bg-white/70 p-3 rounded-lg">
                  <div className="text-gray-600">Profit Margin</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(marginAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {marginPercentage >= 0 ? '+' : ''}{marginPercentage}%
                  </div>
                </div>
              </div>

              {marginAmount < 0 && (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  ⚠️ Warning: This task will result in a loss of {formatCurrency(Math.abs(marginAmount))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Price (£)
            </label>
            <Input
              {...register('override_cost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="Amount to charge client (leave empty for labor cost)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set the price to charge the client. If empty, will use labor cost (no profit).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
