'use client'

import { useState } from 'react'
import { Edit, Trash2, Eye, Play, Pause, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { JobWithClient } from '@/lib/types'
import { JobService } from '@/lib/services/jobs'
import { formatCurrency, formatDate } from '@/lib/utils'

interface JobTableProps {
  jobs: JobWithClient[]
  onEdit: (job: JobWithClient) => void
  onView: (job: JobWithClient) => void
  onRefresh: () => void
}

export function JobTable({ jobs, onEdit, onView, onRefresh }: JobTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (job: JobWithClient) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This will also remove all associated work entries.`)) {
      return
    }

    setLoading(job.id)
    setError(null)

    try {
      await JobService.delete(job.id)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job')
    } finally {
      setLoading(null)
    }
  }

  const handleStatusChange = async (job: JobWithClient, newStatus: JobWithClient['status']) => {
    setLoading(job.id)
    setError(null)

    try {
      await JobService.updateStatus(job.id, newStatus)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  const getStatusAction = (job: JobWithClient) => {
    switch (job.status) {
      case 'draft':
        return {
          icon: Play,
          action: () => handleStatusChange(job, 'active'),
          title: 'Start Job',
          className: 'text-green-600 hover:text-green-700'
        }
      case 'active':
        return {
          icon: Pause,
          action: () => handleStatusChange(job, 'on_hold'),
          title: 'Put On Hold',
          className: 'text-orange-600 hover:text-orange-700'
        }
      case 'on_hold':
        return {
          icon: Play,
          action: () => handleStatusChange(job, 'active'),
          title: 'Resume Job',
          className: 'text-green-600 hover:text-green-700'
        }
      default:
        return null
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs</h3>
        <p className="mt-2 text-gray-500">Get started by creating your first job.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const progress = JobService.calculateProgress(job)
              const isOverdue = JobService.isOverdue(job)
              const isOverBudget = JobService.isOverBudget(job)
              const statusAction = getStatusAction(job)

              return (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {job.description || 'No description'}
                      </div>
                      {job.location && (
                        <div className="text-xs text-gray-400">📍 {job.location}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="font-medium">
                    {job.client?.name || 'Unknown Client'}
                  </TableCell>

                  <TableCell>
                    <span className="capitalize">
                      {JobService.getJobTypeLabel(job.job_type)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        JobService.getStatusColor(job.status)
                      }`}
                    >
                      {job.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        JobService.getPriorityColor(job.priority)
                      }`}
                    >
                      {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progress >= 100 ? 'bg-green-500' : 
                              progress >= 75 ? 'bg-blue-500' : 
                              progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-10">{progress}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.actual_hours}h / {job.estimated_hours || '?'}h
                        {isOverBudget && (
                          <span className="text-red-600 ml-1">⚠ Over budget</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {job.target_completion_date ? (
                        <div className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {formatDate(job.target_completion_date)}
                          {isOverdue && <div className="text-xs">Overdue</div>}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(job)}
                        disabled={loading === job.id}
                        className="h-8 w-8"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(job)}
                        disabled={loading === job.id}
                        className="h-8 w-8"
                        title="Edit Job"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {statusAction && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={statusAction.action}
                          disabled={loading === job.id}
                          className={`h-8 w-8 ${statusAction.className}`}
                          title={statusAction.title}
                        >
                          <statusAction.icon className="h-4 w-4" />
                        </Button>
                      )}

                      {job.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(job, 'completed')}
                          disabled={loading === job.id}
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          title="Mark Complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(job)}
                        disabled={loading === job.id}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </div>
        <div>
          Active: {jobs.filter(j => ['draft', 'active'].includes(j.status)).length} | 
          Completed: {jobs.filter(j => j.status === 'completed').length} | 
          Total Value: {formatCurrency(jobs.reduce((sum, j) => sum + (j.actual_cost || 0), 0))}
        </div>
      </div>
    </div>
  )
}
