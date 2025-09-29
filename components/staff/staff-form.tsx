'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Staff, StaffInsert } from '@/lib/types'
import { StaffService } from '@/lib/services/staff'

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  payment_type: z.enum(['daily_rate', 'monthly_salary'], {
    required_error: 'Please select a payment type',
  }),
  daily_rate: z.number().optional(),
  monthly_salary: z.number().optional(),
  allocated_daily_hours: z.number().min(0.1, 'Work hours must be greater than 0').max(24, 'Cannot exceed 24 hours'),
  pay_override_enabled: z.boolean().default(false),
  pay_override_amount: z.number().optional(),
  active_status: z.boolean().default(true),
}).refine((data) => {
  if (data.payment_type === 'daily_rate') {
    return data.daily_rate && data.daily_rate > 0
  } else if (data.payment_type === 'monthly_salary') {
    return data.monthly_salary && data.monthly_salary > 0
  }
  return false
}, {
  message: 'Payment amount is required based on selected payment type',
  path: ['daily_rate'], // This will show the error on the rate field
})

type StaffFormData = z.infer<typeof staffSchema>

interface StaffFormProps {
  staff?: Staff
  onSuccess: (staff: Staff) => void
  onCancel: () => void
}

export function StaffForm({ staff, onSuccess, onCancel }: StaffFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: staff?.name || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      address: staff?.address || '',
      payment_type: staff?.payment_type || 'daily_rate',
      daily_rate: staff?.daily_rate || undefined,
      monthly_salary: staff?.monthly_salary || undefined,
      allocated_daily_hours: staff?.allocated_daily_hours || 8,
      pay_override_enabled: staff?.pay_override_enabled || false,
      pay_override_amount: staff?.pay_override_amount || undefined,
      active_status: staff?.active_status ?? true,
    },
  })

  const payOverrideEnabled = watch('pay_override_enabled')
  const paymentType = watch('payment_type')

  const onSubmit = async (data: StaffFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const staffData: StaffInsert = {
        ...data,
        phone: data.phone || null,
        address: data.address || null,
        daily_rate: data.payment_type === 'daily_rate' ? data.daily_rate || null : null,
        monthly_salary: data.payment_type === 'monthly_salary' ? data.monthly_salary || null : null,
        pay_override_amount: data.pay_override_enabled ? data.pay_override_amount || null : null,
      }

      let result: Staff
      if (staff) {
        result = await StaffService.update(staff.id, staffData)
      } else {
        result = await StaffService.create(staffData)
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
          {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
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
                Name *
              </label>
              <Input
                {...register('name')}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                {...register('phone')}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <Input
                {...register('address')}
                placeholder="Enter address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Structure *
              </label>
              <select
                {...register('payment_type')}
                className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  errors.payment_type ? 'border-red-500' : ''
                }`}
              >
                <option value="daily_rate">Daily Rate</option>
                <option value="monthly_salary">Monthly Salary</option>
              </select>
              {errors.payment_type && (
                <p className="text-red-500 text-sm mt-1">{errors.payment_type.message}</p>
              )}
            </div>

            {paymentType === 'daily_rate' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Rate (£) *
                </label>
                <Input
                  {...register('daily_rate', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={errors.daily_rate ? 'border-red-500' : ''}
                />
                {errors.daily_rate && (
                  <p className="text-red-500 text-sm mt-1">{errors.daily_rate.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Salary (£) *
                </label>
                <Input
                  {...register('monthly_salary', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={errors.monthly_salary ? 'border-red-500' : ''}
                />
                {errors.monthly_salary && (
                  <p className="text-red-500 text-sm mt-1">{errors.monthly_salary.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allocated Daily Hours *
              </label>
              <Input
                {...register('allocated_daily_hours', { valueAsNumber: true })}
                type="number"
                step="0.5"
                placeholder="8.0"
                className={errors.allocated_daily_hours ? 'border-red-500' : ''}
              />
              {errors.allocated_daily_hours && (
                <p className="text-red-500 text-sm mt-1">{errors.allocated_daily_hours.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('pay_override_enabled')}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable Pay Override
              </label>
            </div>

            {payOverrideEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Amount (£)
                </label>
                <Input
                  {...register('pay_override_amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="Fixed amount per task"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, this fixed amount will be used instead of calculated costs
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('active_status')}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Active Status
              </label>
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
              {isLoading ? 'Saving...' : staff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
