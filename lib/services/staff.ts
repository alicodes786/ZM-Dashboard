import { supabase } from '@/lib/supabase'
import { Staff, StaffInsert, StaffUpdate } from '@/lib/types'

export class StaffService {
  static async getAll(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching staff:', error)
      throw new Error('Failed to fetch staff members')
    }

    return data || []
  }

  static async getById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching staff member:', error)
      return null
    }

    return data
  }

  static async getActive(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('active_status', true)
      .order('name')

    if (error) {
      console.error('Error fetching active staff:', error)
      throw new Error('Failed to fetch active staff members')
    }

    return data || []
  }

  static async create(staff: StaffInsert): Promise<Staff> {
    const { data, error } = await (supabase as any)
      .from('staff')
      .insert(staff)
      .select()
      .single()

    if (error) {
      console.error('Error creating staff member:', error)
      throw new Error('Failed to create staff member')
    }

    return data
  }

  static async update(id: string, updates: StaffUpdate): Promise<Staff> {
    const { data, error } = await (supabase as any)
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating staff member:', error)
      throw new Error('Failed to update staff member')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting staff member:', error)
      throw new Error('Failed to delete staff member')
    }
  }

  static async toggleActiveStatus(id: string): Promise<Staff> {
    // First get current status
    const current = await this.getById(id)
    if (!current) {
      throw new Error('Staff member not found')
    }

    // Toggle the status
    return this.update(id, { active_status: !current.active_status })
  }

  static calculateHourlyRate(staff: Staff): number {
    if (staff.payment_type === 'daily_rate' && staff.daily_rate) {
      return staff.daily_rate / staff.allocated_daily_hours
    } else if (staff.payment_type === 'hourly_rate' && staff.hourly_rate) {
      return staff.hourly_rate
    }
    return 0
  }

  static calculateTaskCost(
    hoursWorked: number, 
    staff: Staff, 
    useOverride: boolean = false
  ): number {
    if (useOverride && staff.pay_override_enabled && staff.pay_override_amount) {
      return staff.pay_override_amount
    }

    const hourlyRate = this.calculateHourlyRate(staff)
    const baseCost = hoursWorked * hourlyRate
    
    return Math.round(baseCost * 100) / 100
  }

  static getPaymentDisplayText(staff: Staff): string {
    if (staff.payment_type === 'daily_rate' && staff.daily_rate) {
      return `£${staff.daily_rate.toFixed(2)}/day`
    } else if (staff.payment_type === 'hourly_rate' && staff.hourly_rate) {
      return `£${staff.hourly_rate.toFixed(2)}/hour`
    }
    return 'Not set'
  }
}
