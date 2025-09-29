'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DailySummary as DailySummaryType } from '@/lib/types'
import { formatCurrency, formatTime } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react'

interface DailySummaryProps {
  summaries: DailySummaryType[]
  date: string
}

export function DailySummary({ summaries, date }: DailySummaryProps) {
  const totalHours = summaries.reduce((sum, s) => sum + s.totalHours, 0)
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0)
  const totalTasks = summaries.reduce((sum, s) => sum + s.totalTasks, 0)
  const allocatedHours = summaries.reduce((sum, s) => sum + s.allocatedHours, 0)

  const overAllocatedStaff = summaries.filter(s => s.isOverAllocated)
  const underAllocatedStaff = summaries.filter(s => s.isUnderAllocated)

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Daily Summary - {new Date(date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Hours</p>
                <p className="text-lg font-semibold">{formatTime(totalHours)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 font-bold text-lg">#</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-lg font-semibold">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Efficiency</p>
                <p className="text-lg font-semibold">
                  {allocatedHours > 0 ? Math.round((totalHours / allocatedHours) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overAllocatedStaff.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Over-allocated Staff</AlertTitle>
          <AlertDescription>
            The following staff members have exceeded their allocated hours:
            <ul className="mt-2 space-y-1">
              {overAllocatedStaff.map((staff) => (
                <li key={staff.staffId} className="flex justify-between">
                  <span>{staff.staffName}</span>
                  <span className="font-medium">
                    {formatTime(staff.totalHours)} / {formatTime(staff.allocatedHours)}
                    <span className="text-orange-600 ml-2">
                      (+{formatTime(staff.hoursVariance)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {underAllocatedStaff.length > 0 && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Under-allocated Staff</AlertTitle>
          <AlertDescription>
            The following staff members have not reached their allocated hours:
            <ul className="mt-2 space-y-1">
              {underAllocatedStaff.map((staff) => (
                <li key={staff.staffId} className="flex justify-between">
                  <span>{staff.staffName}</span>
                  <span className="font-medium">
                    {formatTime(staff.totalHours)} / {formatTime(staff.allocatedHours)}
                    <span className="text-blue-600 ml-2">
                      ({formatTime(staff.hoursVariance)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary.staffId}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {summary.isOverAllocated ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : summary.totalHours > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{summary.staffName}</h4>
                    <p className="text-sm text-gray-500">
                      {summary.totalTasks} task{summary.totalTasks !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatTime(summary.totalHours)}
                    </p>
                    <p className="text-gray-500">
                      of {formatTime(summary.allocatedHours)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(summary.totalCost)}
                    </p>
                    <p className="text-gray-500">total cost</p>
                  </div>
                  {summary.hoursVariance !== 0 && (
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          summary.hoursVariance > 0 ? 'text-orange-600' : 'text-blue-600'
                        }`}
                      >
                        {summary.hoursVariance > 0 ? '+' : ''}
                        {formatTime(Math.abs(summary.hoursVariance))}
                      </p>
                      <p className="text-gray-500">variance</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {summaries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No staff data available for this date
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
