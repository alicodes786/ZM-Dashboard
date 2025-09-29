'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Job, JobInsert, Client } from '@/lib/types'
import { JobService } from '@/lib/services/jobs'
import { ClientService } from '@/lib/services/clients'

const jobSchema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().optional(),
  job_type: z.enum(['maintenance', 'repair', 'installation', 'inspection', 'emergency']),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']),
  estimated_hours: z.number().optional(),
  estimated_cost: z.number().optional(),
  start_date: z.string().optional(),
  target_completion_date: z.string().optional(),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  notes: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

interface JobFormProps {
  job?: Job
  onSuccess: (job: Job) => void
  onCancel: () => void
}

export function JobForm({ job, onSuccess, onCancel }: JobFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      client_id: job?.client_id || '',
      title: job?.title || '',
      description: job?.description || '',
      job_type: job?.job_type || 'maintenance',
      status: job?.status || 'draft',
      estimated_hours: job?.estimated_hours || undefined,
      estimated_cost: job?.estimated_cost || undefined,
      start_date: job?.start_date || '',
      target_completion_date: job?.target_completion_date || '',
      location: job?.location || '',
      priority: job?.priority || 'medium',
      notes: job?.notes || '',
    },
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await ClientService.getActive()
        setClients(data)
      } catch (err) {
        setError('Failed to load clients')
      }
    }
    fetchClients()
  }, [])

  const onSubmit = async (data: JobFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const jobData: JobInsert = {
        ...data,
        description: data.description || null,
        estimated_hours: data.estimated_hours || null,
        estimated_cost: data.estimated_cost || null,
        start_date: data.start_date || null,
        target_completion_date: data.target_completion_date || null,
        location: data.location || null,
        notes: data.notes || null,
      }

      let result: Job
      if (job) {
        result = await JobService.update(job.id, jobData)
      } else {
        result = await JobService.create(jobData)
      }

      onSuccess(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {job ? 'Edit Job' : 'Create New Job'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="">Select a client</option>
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
                  Job Title *
                </label>
                <Input
                  {...register('title')}
                  placeholder="Enter job title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  {...register('job_type')}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="installation">Installation</option>
                  <option value="inspection">Inspection</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  {...register('location')}
                  placeholder="Job location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Describe the job requirements..."
              />
            </div>
          </div>

          {/* Planning & Estimates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Planning & Estimates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <Input
                  {...register('estimated_hours', { valueAsNumber: true })}
                  type="number"
                  step="0.5"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (£)
                </label>
                <Input
                  {...register('estimated_cost', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  {...register('start_date')}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Completion
                </label>
                <Input
                  {...register('target_completion_date')}
                  type="date"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Additional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Add any additional notes about this job..."
              />
            </div>
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
              {isLoading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
