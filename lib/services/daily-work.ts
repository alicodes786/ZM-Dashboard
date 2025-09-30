import { supabase } from '@/lib/supabase'
import { DailyWorkEntry, DailyWorkEntryInsert, DailyWorkEntryUpdate, DailyWorkEntryWithFullRelations, DailySummary } from '@/lib/types'
import { StaffService } from './staff'

export interface MarginSummary {
  totalLaborCost: number
  totalClientCost: number
  totalMarginAmount: number
  averageMarginPercentage: number
  entriesCount: number
}

export class DailyWorkService {
  static async getAll(): Promise<DailyWorkEntryWithFullRelations[]> {
    const { data, error } = await supabase
      .from('daily_work_entries')
      .select(`
        *,
        staff (*),
        client:clients (*),
        job:jobs (
          *,
          client:clients (*)
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching daily work entries:', error)
      throw new Error('Failed to fetch daily work entries')
    }

    return (data || []) as DailyWorkEntryWithFullRelations[]
  }

  static async getByDate(date: string): Promise<DailyWorkEntryWithFullRelations[]> {
    const { data, error } = await supabase
      .from('daily_work_entries')
      .select(`
        *,
        staff (*),
        client:clients (*),
        job:jobs (
          *,
          client:clients (*)
        )
      `)
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching daily work entries by date:', error)
      throw new Error('Failed to fetch daily work entries')
    }

    return (data || []) as DailyWorkEntryWithFullRelations[]
  }

  static async getByStaff(staffId: string, startDate?: string, endDate?: string): Promise<DailyWorkEntry[]> {
    let query = supabase
      .from('daily_work_entries')
      .select('*')
      .eq('staff_id', staffId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching staff work entries:', error)
      throw new Error('Failed to fetch staff work entries')
    }

    return data || []
  }

  static async create(entry: DailyWorkEntryInsert): Promise<DailyWorkEntry> {
    const { data, error } = await (supabase as any)
      .from('daily_work_entries')
      .insert(entry)
      .select()
      .single()

    if (error) {
      console.error('Error creating daily work entry:', error)
      throw new Error('Failed to create daily work entry')
    }

    return data
  }

  static async update(id: string, updates: DailyWorkEntryUpdate): Promise<DailyWorkEntry> {
    const { data, error } = await (supabase as any)
      .from('daily_work_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating daily work entry:', error)
      throw new Error('Failed to update daily work entry')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_work_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting daily work entry:', error)
      throw new Error('Failed to delete daily work entry')
    }
  }

  static async getDailySummary(date: string): Promise<DailySummary[]> {
    const entries = await this.getByDate(date)
    const staff = await StaffService.getActive()

    const summaryMap = new Map<string, DailySummary>()

    // Initialize summaries for all active staff
    staff.forEach(staffMember => {
      summaryMap.set(staffMember.id, {
        staffId: staffMember.id,
        staffName: staffMember.name,
        date,
        totalTasks: 0,
        totalHours: 0,
        allocatedHours: staffMember.allocated_daily_hours,
        totalCost: 0,
        hoursVariance: -staffMember.allocated_daily_hours,
        isOverAllocated: false,
        isUnderAllocated: true,
      })
    })

    // Aggregate actual work data
    entries.forEach(entry => {
      if (entry.staff) {
        const summary = summaryMap.get(entry.staff_id)
        if (summary) {
          summary.totalTasks += 1
          summary.totalHours += entry.hours_worked
          summary.totalCost += entry.client_cost || entry.override_cost || entry.calculated_cost
        }
      }
    })

    // Calculate variances and alerts
    const summaries = Array.from(summaryMap.values()).map(summary => {
      summary.hoursVariance = summary.totalHours - summary.allocatedHours
      summary.isOverAllocated = summary.hoursVariance > 0.1 // Allow small tolerance
      summary.isUnderAllocated = summary.hoursVariance < -0.1 && summary.totalHours > 0

      return summary
    })

    return summaries.sort((a, b) => a.staffName.localeCompare(b.staffName))
  }

  static async getUniqueClientNames(): Promise<string[]> {
    const { data, error } = await supabase
      .from('daily_work_entries')
      .select('client_name')
      .order('client_name')

    if (error) {
      console.error('Error fetching client names:', error)
      return []
    }

    const uniqueNames = [...new Set(data.map((item: any) => item.client_name))].filter(Boolean)
    return uniqueNames
  }

  static async getDateRange(): Promise<{ earliest: string | null; latest: string | null }> {
    const { data, error } = await supabase
      .from('daily_work_entries')
      .select('date')
      .order('date', { ascending: true })
      .limit(1)

    const { data: latestData, error: latestError } = await supabase
      .from('daily_work_entries')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)

    if (error || latestError) {
      return { earliest: null, latest: null }
    }

    return {
      earliest: (data as any)?.[0]?.date || null,
      latest: (latestData as any)?.[0]?.date || null,
    }
  }

  static async getMarginSummary(date: string): Promise<MarginSummary> {
    const { data, error } = await (supabase as any)
      .rpc('get_daily_margin_summary', { p_date: date })
      .single()

    if (error) {
      console.error('Error fetching margin summary:', error)
      throw new Error('Failed to fetch margin summary')
    }

    // Type assertion since we know the structure from our database function
    const marginData = data as {
      total_labor_cost: number
      total_client_cost: number
      total_margin_amount: number
      average_margin_percentage: number
      entries_count: number
    } | null

    return {
      totalLaborCost: marginData?.total_labor_cost || 0,
      totalClientCost: marginData?.total_client_cost || 0,
      totalMarginAmount: marginData?.total_margin_amount || 0,
      averageMarginPercentage: marginData?.average_margin_percentage || 0,
      entriesCount: marginData?.entries_count || 0,
    }
  }

  static calculateMargin(laborCost: number, clientCost: number): { amount: number; percentage: number } {
    const amount = clientCost - laborCost
    const percentage = clientCost > 0 ? (amount / clientCost) * 100 : 0
    
    return {
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 100) / 100
    }
  }
}
