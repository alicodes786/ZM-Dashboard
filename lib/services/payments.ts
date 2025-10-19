import { supabase } from '@/lib/supabase'
import { StaffPayment, StaffPaymentInsert, StaffPaymentUpdate, StaffPaymentWithStaff, StaffWagesSummary } from '@/lib/types'

export class PaymentsService {
  /**
   * Get all payment records with staff information
   */
  static async getAll(): Promise<StaffPaymentWithStaff[]> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select(`
        *,
        staff (*)
      `)
      .order('period_end', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      throw new Error('Failed to fetch payment records')
    }

    return data || []
  }

  /**
   * Get payment records filtered by status
   */
  static async getByStatus(status: StaffPayment['status']): Promise<StaffPaymentWithStaff[]> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select(`
        *,
        staff (*)
      `)
      .eq('status', status)
      .order('period_end', { ascending: false })

    if (error) {
      console.error('Error fetching payments by status:', error)
      throw new Error('Failed to fetch payment records')
    }

    return data || []
  }

  /**
   * Get payment records for a specific staff member
   */
  static async getByStaff(staffId: string): Promise<StaffPaymentWithStaff[]> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select(`
        *,
        staff (*)
      `)
      .eq('staff_id', staffId)
      .order('period_end', { ascending: false })

    if (error) {
      console.error('Error fetching staff payments:', error)
      throw new Error('Failed to fetch staff payment records')
    }

    return data || []
  }

  /**
   * Get a single payment record by ID
   */
  static async getById(id: string): Promise<StaffPayment | null> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching payment:', error)
      return null
    }

    return data
  }

  /**
   * Calculate wages summary for all staff in a period
   */
  static async getWagesSummary(periodStart: string, periodEnd: string): Promise<StaffWagesSummary[]> {
    // Get all work entries in the period
    const { data: workEntries, error: workError } = await supabase
      .from('daily_work_entries')
      .select(`
        *,
        staff (id, name)
      `)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (workError) {
      console.error('Error fetching work entries:', workError)
      throw new Error('Failed to fetch work entries')
    }

    // Get all payment records in the period
    const { data: payments, error: paymentError } = await supabase
      .from('staff_payments')
      .select('*')
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd)

    if (paymentError) {
      console.error('Error fetching payments:', paymentError)
      throw new Error('Failed to fetch payment records')
    }

    // Group work entries by staff
    const staffMap = new Map<string, StaffWagesSummary>()

    workEntries?.forEach((entry: any) => {
      if (entry.staff) {
        const staffId = entry.staff_id
        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            staffId,
            staffName: entry.staff.name,
            totalHoursWorked: 0,
            totalWagesDue: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            lastPaymentDate: null,
            periodStart,
            periodEnd,
            workEntriesCount: 0
          })
        }

        const summary = staffMap.get(staffId)!
        summary.totalHoursWorked += entry.hours_worked + (entry.overtime_hours || 0)
        summary.totalWagesDue += entry.calculated_cost || 0
        summary.workEntriesCount += 1
      }
    })

    // Add payment information
    payments?.forEach((payment: StaffPayment) => {
      if (staffMap.has(payment.staff_id)) {
        const summary = staffMap.get(payment.staff_id)!
        summary.totalPaid += payment.amount_paid || 0
        
        if (payment.payment_date) {
          if (!summary.lastPaymentDate || payment.payment_date > summary.lastPaymentDate) {
            summary.lastPaymentDate = payment.payment_date
          }
        }
      }
    })

    // Calculate outstanding amounts
    staffMap.forEach(summary => {
      summary.totalOutstanding = summary.totalWagesDue - summary.totalPaid
    })

    return Array.from(staffMap.values()).sort((a, b) => 
      a.staffName.localeCompare(b.staffName)
    )
  }

  /**
   * Create a new payment record
   */
  static async create(payment: StaffPaymentInsert): Promise<StaffPayment> {
    const { data, error } = await (supabase as any)
      .from('staff_payments')
      .insert(payment)
      .select()
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      throw new Error('Failed to create payment record')
    }

    return data
  }

  /**
   * Update an existing payment record
   */
  static async update(id: string, updates: StaffPaymentUpdate): Promise<StaffPayment> {
    const { data, error } = await (supabase as any)
      .from('staff_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment:', error)
      throw new Error('Failed to update payment record')
    }

    return data
  }

  /**
   * Delete a payment record
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_payments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment:', error)
      throw new Error('Failed to delete payment record')
    }
  }

  /**
   * Mark a payment as fully paid
   */
  static async markAsPaid(
    id: string, 
    paymentDate: string, 
    paymentMethod: string,
    paymentReference?: string
  ): Promise<StaffPayment> {
    const payment = await this.getById(id)
    if (!payment) {
      throw new Error('Payment record not found')
    }

    return this.update(id, {
      status: 'paid',
      amount_paid: payment.amount_due,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      payment_reference: paymentReference
    })
  }

  /**
   * Record a partial payment
   */
  static async recordPartialPayment(
    id: string,
    amount: number,
    paymentDate: string,
    paymentMethod: string,
    paymentReference?: string
  ): Promise<StaffPayment> {
    const payment = await this.getById(id)
    if (!payment) {
      throw new Error('Payment record not found')
    }

    const newAmountPaid = payment.amount_paid + amount
    const status = newAmountPaid >= payment.amount_due ? 'paid' : 'partially_paid'

    return this.update(id, {
      status,
      amount_paid: newAmountPaid,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      payment_reference: paymentReference
    })
  }

  /**
   * Generate payment records for all staff in a period
   * This creates pending payment records based on work entries
   */
  static async generatePaymentsForPeriod(
    periodStart: string,
    periodEnd: string
  ): Promise<StaffPayment[]> {
    const summary = await this.getWagesSummary(periodStart, periodEnd)
    
    // Get work entry IDs for each staff member
    const { data: workEntries, error } = await supabase
      .from('daily_work_entries')
      .select('id, staff_id')
      .gte('date', periodStart)
      .lte('date', periodEnd)

    if (error) {
      console.error('Error fetching work entries:', error)
      throw new Error('Failed to fetch work entries')
    }

    // Group work entry IDs by staff
    const workEntryIdsByStaff = new Map<string, string[]>()
    workEntries?.forEach((entry: any) => {
      if (!workEntryIdsByStaff.has(entry.staff_id)) {
        workEntryIdsByStaff.set(entry.staff_id, [])
      }
      workEntryIdsByStaff.get(entry.staff_id)!.push(entry.id)
    })

    // Create payment records for staff with wages due
    const payments: StaffPaymentInsert[] = summary
      .filter(s => s.totalWagesDue > 0)
      .map(s => ({
        staff_id: s.staffId,
        period_start: periodStart,
        period_end: periodEnd,
        amount_due: s.totalWagesDue,
        amount_paid: 0,
        status: 'pending' as const,
        work_entry_ids: workEntryIdsByStaff.get(s.staffId) || []
      }))

    const results: StaffPayment[] = []
    for (const payment of payments) {
      try {
        const created = await this.create(payment)
        results.push(created)
      } catch (err) {
        console.error('Error creating payment for staff:', payment.staff_id, err)
      }
    }

    return results
  }

  /**
   * Get total outstanding wages across all staff
   */
  static async getTotalOutstanding(): Promise<number> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select('amount_due, amount_paid')
      .in('status', ['pending', 'partially_paid'])

    if (error) {
      console.error('Error fetching outstanding payments:', error)
      return 0
    }

    return data?.reduce((total, payment: any) => 
      total + (payment.amount_due - payment.amount_paid), 0
    ) || 0
  }

  /**
   * Get payment statistics
   */
  static async getStats(): Promise<{
    totalPending: number
    totalPaid: number
    totalOutstanding: number
    pendingCount: number
    paidCount: number
  }> {
    const { data, error } = await supabase
      .from('staff_payments')
      .select('status, amount_due, amount_paid')

    if (error) {
      console.error('Error fetching payment stats:', error)
      throw new Error('Failed to fetch payment statistics')
    }

    const stats = {
      totalPending: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      pendingCount: 0,
      paidCount: 0
    }

    data?.forEach((payment: any) => {
      if (payment.status === 'pending' || payment.status === 'partially_paid') {
        stats.totalPending += payment.amount_due
        stats.totalOutstanding += (payment.amount_due - payment.amount_paid)
        stats.pendingCount++
      } else if (payment.status === 'paid') {
        stats.totalPaid += payment.amount_paid
        stats.paidCount++
      }
    })

    return stats
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: StaffPayment['status']): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'partially_paid': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  /**
   * Format payment method for display
   */
  static formatPaymentMethod(method: string | null): string {
    if (!method) return '-'
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

