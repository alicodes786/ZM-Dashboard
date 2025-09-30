import { supabase } from '@/lib/supabase'
import { Client, ClientInsert, ClientUpdate, ClientWithJobs } from '@/lib/types'

export class ClientService {
  static async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Failed to fetch clients')
    }

    return data || []
  }

  static async getActive(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active_status', true)
      .order('name')

    if (error) {
      console.error('Error fetching active clients:', error)
      throw new Error('Failed to fetch active clients')
    }

    return data || []
  }

  static async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return null
    }

    return data
  }

  static async getWithJobs(id: string): Promise<ClientWithJobs | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        jobs (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client with jobs:', error)
      return null
    }

    return data
  }

  static async create(client: ClientInsert): Promise<Client> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .insert(client)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw new Error('Failed to create client')
    }

    return data
  }

  static async update(id: string, updates: ClientUpdate): Promise<Client> {
    const { data, error } = await (supabase as any)
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw new Error('Failed to update client')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      throw new Error('Failed to delete client')
    }
  }

  static async toggleActiveStatus(id: string): Promise<Client> {
    const current = await this.getById(id)
    if (!current) {
      throw new Error('Client not found')
    }

    return this.update(id, { active_status: !current.active_status })
  }

  static async getClientStats(id: string): Promise<{
    totalJobs: number
    activeJobs: number
    completedJobs: number
    totalHours: number
    totalCost: number
  }> {
    // Get job statistics
    const { data: jobStats, error: jobError } = await supabase
      .from('jobs')
      .select('status, actual_hours, actual_cost')
      .eq('client_id', id)

    if (jobError) {
      console.error('Error fetching job stats:', jobError)
      throw new Error('Failed to fetch client statistics')
    }

    // Get work entry statistics (including non-job work)
    const { data: workStats, error: workError } = await supabase
      .from('daily_work_entries')
      .select('hours_worked, calculated_cost, override_cost')
      .eq('client_id', id)

    if (workError) {
      console.error('Error fetching work stats:', workError)
      throw new Error('Failed to fetch client statistics')
    }

    const totalJobs = jobStats?.length || 0
    const activeJobs = jobStats?.filter((j: any) => ['draft', 'active'].includes(j.status)).length || 0
    const completedJobs = jobStats?.filter((j: any) => j.status === 'completed').length || 0
    
    const totalHours = workStats?.reduce((sum: number, entry: any) => sum + entry.hours_worked, 0) || 0
    const totalCost = workStats?.reduce((sum: number, entry: any) => sum + (entry.override_cost || entry.calculated_cost), 0) || 0

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      totalHours,
      totalCost
    }
  }

  static async searchClients(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .eq('active_status', true)
      .order('name')
      .limit(10)

    if (error) {
      console.error('Error searching clients:', error)
      throw new Error('Failed to search clients')
    }

    return data || []
  }

  static async migrateFromClientNames(): Promise<void> {
    const { error } = await supabase.rpc('migrate_client_names')

    if (error) {
      console.error('Error migrating client names:', error)
      throw new Error('Failed to migrate client names')
    }
  }
}
