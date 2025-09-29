'use client'

import { useState, useEffect } from 'react'
import { Plus, Briefcase, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { JobTable } from '@/components/jobs/job-table'
import { JobForm } from '@/components/jobs/job-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { JobWithClient } from '@/lib/types'
import { JobService } from '@/lib/services/jobs'
import { formatCurrency } from '@/lib/utils'

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<JobWithClient | undefined>()
  const [viewingJob, setViewingJob] = useState<JobWithClient | undefined>()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all')

  const fetchJobs = async () => {
    try {
      setError(null)
      const data = await JobService.getAll()
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleAddJob = () => {
    setEditingJob(undefined)
    setShowForm(true)
  }

  const handleEditJob = (job: JobWithClient) => {
    setEditingJob(job)
    setShowForm(true)
  }

  const handleViewJob = (job: JobWithClient) => {
    setViewingJob(job)
    // TODO: Implement job detail view
    console.log('View job:', job)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingJob(undefined)
    fetchJobs()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingJob(undefined)
  }

  const filteredJobs = jobs.filter(job => {
    switch (filter) {
      case 'active':
        return ['draft', 'active'].includes(job.status)
      case 'completed':
        return job.status === 'completed'
      case 'overdue':
        return JobService.isOverdue(job)
      default:
        return true
    }
  })

  const activeJobs = jobs.filter(j => ['draft', 'active'].includes(j.status))
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const overdueJobs = jobs.filter(j => JobService.isOverdue(j))
  const totalValue = jobs.reduce((sum, job) => sum + (job.actual_cost || 0), 0)

  const headerActions = (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </Button>
      </div>
      <Button onClick={handleAddJob} className="flex items-center space-x-2">
        <Plus className="h-4 w-4" />
        <span>Create Job</span>
      </Button>
    </div>
  )

  if (showForm) {
    return (
      <DashboardLayout title="Job Management">
        <div className="max-w-6xl mx-auto">
          <JobForm
            job={editingJob}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Job Management"
      subtitle="Manage jobs and track progress"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{activeJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className={`h-8 w-8 ${overdueJobs.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className={`text-2xl font-bold ${overdueJobs.length > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                  {overdueJobs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Job Value</p>
              <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100">Average per Job</p>
              <p className="text-xl font-semibold">
                {jobs.length > 0 ? formatCurrency(totalValue / jobs.length) : '£0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Jobs Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading jobs...</span>
            </div>
          </div>
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEditJob}
            onView={handleViewJob}
            onRefresh={fetchJobs}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
