import { supabase } from '@/lib/supabase'
import { Job, JobInsert, JobUpdate, JobWithClient, JobWithWorkEntries } from '@/lib/types'
import { JOB_TYPES } from '@/lib/constants'

export class JobService {
  static async getAll(): Promise<JobWithClient[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      throw new Error('Failed to fetch jobs')
    }

    return data || []
  }

  static async getByStatus(status: Job['status']): Promise<JobWithClient[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs by status:', error)
      throw new Error('Failed to fetch jobs')
    }

    return data || []
  }

  static async getActiveJobs(): Promise<JobWithClient[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*)
      `)
      .in('status', ['draft', 'active'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active jobs:', error)
      throw new Error('Failed to fetch active jobs')
    }

    return data || []
  }

  static async getByClient(clientId: string): Promise<JobWithClient[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs by client:', error)
      throw new Error('Failed to fetch jobs for client')
    }

    return data || []
  }

  static async getById(id: string): Promise<JobWithClient | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
      return null
    }

    return data
  }

  static async getWithWorkEntries(id: string): Promise<JobWithWorkEntries | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        client:clients (*),
        daily_work_entries (
          *,
          staff (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching job with work entries:', error)
      return null
    }

    return data
  }

  static async create(job: JobInsert): Promise<Job> {
    try {
      // Make sure job_type is a string
      const jobData = {
        ...job,
        job_type: String(job.job_type || 'maintenance')
      }

      // Use the original approach with type casting
      const { data, error } = await (supabase as any)
        .from('jobs')
        .insert(jobData)
        .select()
        .single()

      if (error) {
        console.error('Error creating job:', error)
        throw new Error(`Failed to create job: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Exception in create job:', err)
      throw err
    }
  }

  static async update(id: string, updates: JobUpdate): Promise<Job> {
    try {
      // Make sure job_type is a string if it exists in updates
      const updateData = {
        ...updates,
        job_type: updates.job_type ? String(updates.job_type) : undefined
      }

      // Use the original approach with type casting
      const { data, error } = await (supabase as any)
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating job:', error)
        throw new Error(`Failed to update job: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Exception in update job:', err)
      throw err
    }
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting job:', error)
      throw new Error('Failed to delete job')
    }
  }

  static async updateStatus(id: string, status: Job['status']): Promise<Job> {
    const updates: JobUpdate = { status }
    
    // Set completed_date when marking as completed
    if (status === 'completed') {
      updates.completed_date = new Date().toISOString().split('T')[0]
    }

    return this.update(id, updates)
  }

  static getStatusColor(status: Job['status']): string {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  static getPriorityColor(priority: Job['priority']): string {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  static getJobTypeLabel(jobType: string): string {
    // First check if it's one of our predefined types
    const predefinedType = JOB_TYPES.find(type => type.value === jobType)
    if (predefinedType) {
      return predefinedType.label
    }
    
    // If not found in predefined types, it might be a custom type
    // Just capitalize the first letter and return
    if (jobType) {
      return jobType.charAt(0).toUpperCase() + jobType.slice(1).replace(/_/g, ' ')
    }
    
    // Fallback
    return 'Maintenance'
  }

  static calculateProgress(job: Job): number {
    if (!job.estimated_hours || job.estimated_hours === 0) {
      return job.status === 'completed' ? 100 : 0
    }
    
    const progress = (job.actual_hours / job.estimated_hours) * 100
    return Math.min(Math.round(progress), 100)
  }

  static isOverBudget(job: Job): boolean {
    if (!job.estimated_cost) return false
    return job.actual_cost > job.estimated_cost
  }

  static isOverTime(job: Job): boolean {
    if (!job.estimated_hours) return false
    return job.actual_hours > job.estimated_hours
  }

  static isOverdue(job: Job): boolean {
    if (!job.target_completion_date || job.status === 'completed') return false
    return new Date(job.target_completion_date) < new Date()
  }

  static async getJobStats(): Promise<{
    total: number
    active: number
    completed: number
    overdue: number
    totalValue: number
  }> {
    const { data, error } = await supabase
      .from('jobs')
      .select('status, target_completion_date, actual_cost')

    if (error) {
      console.error('Error fetching job stats:', error)
      throw new Error('Failed to fetch job statistics')
    }

    const total = data?.length || 0
    const active = data?.filter((j: any) => ['draft', 'active'].includes(j.status)).length || 0
    const completed = data?.filter((j: any) => j.status === 'completed').length || 0
    const overdue = data?.filter((j: any) => 
      j.status !== 'completed' && 
      j.target_completion_date && 
      new Date(j.target_completion_date) < new Date()
    ).length || 0
    const totalValue = data?.reduce((sum: number, job: any) => sum + (job.actual_cost || 0), 0) || 0

    return {
      total,
      active,
      completed,
      overdue,
      totalValue
    }
  }
}
