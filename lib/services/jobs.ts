import { supabase } from '@/lib/supabase'
import { Job, JobInsert, JobUpdate, JobWithClient, JobWithWorkEntries } from '@/lib/types'

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
    const { data, error } = await (supabase as any)
      .from('jobs')
      .insert(job)
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      throw new Error('Failed to create job')
    }

    return data
  }

  static async update(id: string, updates: JobUpdate): Promise<Job> {
    const { data, error } = await (supabase as any)
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      throw new Error('Failed to update job')
    }

    return data
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

  static getJobTypeLabel(jobType: Job['job_type'], customJobType?: string): string {
    switch (jobType) {
      case 'maintenance': return 'Maintenance'
      case 'repair': return 'Repair'
      case 'installation': return 'Installation'
      case 'inspection': return 'Inspection'
      case 'emergency': return 'Emergency'
      case 'plumbing': return 'Plumbing'
      case 'electrical': return 'Electrical'
      case 'hvac': return 'HVAC'
      case 'roofing': return 'Roofing'
      case 'painting': return 'Painting'
      case 'flooring': return 'Flooring'
      case 'landscaping': return 'Landscaping'
      case 'renovation': return 'Renovation'
      case 'cleaning': return 'Cleaning'
      case 'pest_control': return 'Pest Control'
      case 'appliance_repair': return 'Appliance Repair'
      case 'custom': return customJobType || 'Custom'
      default: return 'Maintenance'
    }
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
