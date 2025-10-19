import { supabase } from '@/lib/supabase'
import { 
  Invoice, 
  InvoiceInsert, 
  InvoiceUpdate, 
  InvoiceWithClient, 
  InvoiceWithRelations,
  InvoiceAdditionalCost,
  InvoiceAdditionalCostInsert,
  InvoiceAdditionalCostUpdate,
  InvoiceWorkEntry,
  InvoiceWorkEntryInsert,
  DailyWorkEntryWithFullRelations
} from '@/lib/types'

export class InvoiceService {
  /**
   * Get all invoices with client information
   */
  static async getAll(): Promise<InvoiceWithClient[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      throw new Error('Failed to fetch invoices')
    }

    return (data || []) as InvoiceWithClient[]
  }

  /**
   * Get invoices by status
   */
  static async getByStatus(status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'): Promise<InvoiceWithClient[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices by status:', error)
      throw new Error('Failed to fetch invoices')
    }

    return (data || []) as InvoiceWithClient[]
  }

  /**
   * Get invoice by ID with all relations
   */
  static async getById(id: string): Promise<InvoiceWithRelations | null> {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      throw new Error('Failed to fetch invoice')
    }

    if (!invoice) return null

    // Fetch additional costs
    const { data: additionalCosts, error: costsError } = await supabase
      .from('invoice_additional_costs')
      .select('*')
      .eq('invoice_id', id)
      .order('date', { ascending: false })

    if (costsError) {
      console.error('Error fetching additional costs:', costsError)
      throw new Error('Failed to fetch additional costs')
    }

    // Fetch work entries with daily work details
    const { data: workEntries, error: workError } = await supabase
      .from('invoice_work_entries')
      .select(`
        *,
        daily_work_entry:daily_work_entries (
          *,
          staff (*),
          client:clients (*),
          job:jobs (
            *,
            client:clients (*)
          )
        )
      `)
      .eq('invoice_id', id)

    if (workError) {
      console.error('Error fetching work entries:', workError)
      throw new Error('Failed to fetch work entries')
    }

    const invoiceWithRelations: InvoiceWithRelations = {
      ...(invoice as any),
      additional_costs: additionalCosts || [],
      work_entries: workEntries || [],
    }

    return invoiceWithRelations
  }

  /**
   * Get invoices by client
   */
  static async getByClient(clientId: string): Promise<InvoiceWithClient[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients (*)
      `)
      .eq('client_id', clientId)
      .order('period_start', { ascending: false })

    if (error) {
      console.error('Error fetching client invoices:', error)
      throw new Error('Failed to fetch client invoices')
    }

    return (data || []) as InvoiceWithClient[]
  }

  /**
   * Get next invoice number
   */
  static async getNextInvoiceNumber(): Promise<string> {
    const { data, error } = await (supabase as any)
      .rpc('generate_invoice_number')

    if (error) {
      console.error('Error generating invoice number:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Fallback: generate invoice number manually
      console.log('Using fallback invoice number generation')
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 99999) + 1
      return `INV-${year}-${String(random).padStart(5, '0')}`
    }

    return data
  }

  /**
   * Create a new invoice
   */
  static async create(invoice: InvoiceInsert): Promise<Invoice> {
    console.log('Creating invoice with data:', invoice)
    
    const { data, error } = await (supabase as any)
      .from('invoices')
      .insert(invoice)
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Provide more specific error messages
      if (error.code === '42P01') {
        throw new Error('Database table "invoices" does not exist. Please run the database migration first.')
      } else if (error.code === '23505') {
        throw new Error('Invoice number already exists. Please try again.')
      } else if (error.code === '23503') {
        throw new Error('Invalid client ID or foreign key constraint violation.')
      } else {
        throw new Error(`Failed to create invoice: ${error.message || 'Unknown error'}`)
      }
    }

    return data
  }

  /**
   * Update an invoice
   */
  static async update(id: string, updates: InvoiceUpdate): Promise<Invoice> {
    const { data, error } = await (supabase as any)
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      throw new Error('Failed to update invoice')
    }

    return data
  }

  /**
   * Delete an invoice
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      throw new Error('Failed to delete invoice')
    }
  }

  /**
   * Get daily work entries for a client and date range (for invoice creation)
   */
  static async getWorkEntriesForInvoice(
    clientId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyWorkEntryWithFullRelations[]> {
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
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching work entries:', error)
      throw new Error('Failed to fetch work entries')
    }

    return (data || []) as DailyWorkEntryWithFullRelations[]
  }

  /**
   * Add work entries to an invoice
   */
  static async addWorkEntries(invoiceId: string, workEntries: InvoiceWorkEntryInsert[]): Promise<InvoiceWorkEntry[]> {
    const { data, error } = await (supabase as any)
      .from('invoice_work_entries')
      .insert(workEntries)
      .select()

    if (error) {
      console.error('Error adding work entries to invoice:', error)
      throw new Error('Failed to add work entries to invoice')
    }

    return data
  }

  /**
   * Remove a work entry from an invoice
   */
  static async removeWorkEntry(invoiceId: string, workEntryId: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_work_entries')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('work_entry_id', workEntryId)

    if (error) {
      console.error('Error removing work entry from invoice:', error)
      throw new Error('Failed to remove work entry from invoice')
    }
  }

  /**
   * Add an additional cost to an invoice
   */
  static async addAdditionalCost(cost: InvoiceAdditionalCostInsert): Promise<InvoiceAdditionalCost> {
    const { data, error } = await (supabase as any)
      .from('invoice_additional_costs')
      .insert(cost)
      .select()
      .single()

    if (error) {
      console.error('Error adding additional cost:', error)
      throw new Error('Failed to add additional cost')
    }

    return data
  }

  /**
   * Update an additional cost
   */
  static async updateAdditionalCost(id: string, updates: InvoiceAdditionalCostUpdate): Promise<InvoiceAdditionalCost> {
    const { data, error } = await (supabase as any)
      .from('invoice_additional_costs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating additional cost:', error)
      throw new Error('Failed to update additional cost')
    }

    return data
  }

  /**
   * Delete an additional cost
   */
  static async deleteAdditionalCost(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_additional_costs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting additional cost:', error)
      throw new Error('Failed to delete additional cost')
    }
  }

  /**
   * Update invoice status
   */
  static async updateStatus(id: string, status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'): Promise<Invoice> {
    return this.update(id, { status })
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(
    id: string, 
    paymentDate: string, 
    paidAmount: number, 
    paymentReference?: string,
    paymentMethod?: string
  ): Promise<Invoice> {
    return this.update(id, {
      status: 'paid',
      payment_date: paymentDate,
      paid_amount: paidAmount,
      payment_reference: paymentReference,
      payment_method: paymentMethod,
    })
  }

  /**
   * Update overdue invoices (can be called manually or via cron job)
   */
  static async updateOverdueInvoices(): Promise<void> {
    const { error } = await (supabase as any).rpc('update_overdue_invoices')

    if (error) {
      console.error('Error updating overdue invoices:', error)
      throw new Error('Failed to update overdue invoices')
    }
  }

  /**
   * Get invoice statistics
   */
  static async getStatistics(): Promise<{
    total: number
    draft: number
    issued: number
    paid: number
    overdue: number
    cancelled: number
    totalAmount: number
    paidAmount: number
    outstandingAmount: number
  }> {
    const invoices = await this.getAll()

    const stats = {
      total: invoices.length,
      draft: 0,
      issued: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    }

    invoices.forEach(invoice => {
      if (invoice.status === 'draft') stats.draft++
      else if (invoice.status === 'issued') stats.issued++
      else if (invoice.status === 'paid') stats.paid++
      else if (invoice.status === 'overdue') stats.overdue++
      else if (invoice.status === 'cancelled') stats.cancelled++
      
      stats.totalAmount += invoice.total_amount
      stats.paidAmount += invoice.paid_amount || 0
      
      if (invoice.status !== 'paid' && invoice.status !== 'cancelled') {
        stats.outstandingAmount += invoice.total_amount - (invoice.paid_amount || 0)
      }
    })

    return stats
  }
}

