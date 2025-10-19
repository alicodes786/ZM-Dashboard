export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          phone: string | null
          address: string | null
          payment_type: 'daily_rate' | 'hourly_rate'
          daily_rate: number | null
          hourly_rate: number | null
          allocated_daily_hours: number
          active_status: boolean
          pay_override_enabled: boolean
          pay_override_amount: number | null
          overtime_rate_multiplier: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          payment_type: 'daily_rate' | 'hourly_rate'
          daily_rate?: number | null
          hourly_rate?: number | null
          allocated_daily_hours: number
          active_status?: boolean
          pay_override_enabled?: boolean
          pay_override_amount?: number | null
          overtime_rate_multiplier?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          payment_type?: 'daily_rate' | 'hourly_rate'
          daily_rate?: number | null
          hourly_rate?: number | null
          allocated_daily_hours?: number
          active_status?: boolean
          pay_override_enabled?: boolean
          pay_override_amount?: number | null
          overtime_rate_multiplier?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          company_name: string | null
          contact_person: string | null
          billing_address: string | null
          active_status: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          contact_person?: string | null
          billing_address?: string | null
          active_status?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          company_name?: string | null
          contact_person?: string | null
          billing_address?: string | null
          active_status?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          client_id: string
          title: string
          description: string | null
          job_type: string
          status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          estimated_hours: number | null
          estimated_cost: number | null
          actual_hours: number
          actual_cost: number
          start_date: string | null
          target_completion_date: string | null
          completed_date: string | null
          location: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id: string
          title: string
          description?: string | null
          job_type?: string
          status?: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          estimated_hours?: number | null
          estimated_cost?: number | null
          actual_hours?: number
          actual_cost?: number
          start_date?: string | null
          target_completion_date?: string | null
          completed_date?: string | null
          location?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          title?: string
          description?: string | null
          job_type?: string
          status?: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          estimated_hours?: number | null
          estimated_cost?: number | null
          actual_hours?: number
          actual_cost?: number
          start_date?: string | null
          target_completion_date?: string | null
          completed_date?: string | null
          location?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_work_entries: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          date: string
          staff_id: string
          task_description: string
          client_name: string
          hours_worked: number
          overtime_hours: number
          calculated_cost: number
          override_cost: number | null
          notes: string | null
          client_id: string | null
          job_id: string | null
          client_cost: number | null
          margin_amount: number | null
          margin_percentage: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          date: string
          staff_id: string
          task_description: string
          client_name: string
          hours_worked: number
          overtime_hours?: number
          calculated_cost?: number
          override_cost?: number | null
          notes?: string | null
          client_id?: string | null
          job_id?: string | null
          client_cost?: number | null
          margin_amount?: number | null
          margin_percentage?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          date?: string
          staff_id?: string
          task_description?: string
          client_name?: string
          hours_worked?: number
          overtime_hours?: number
          calculated_cost?: number
          override_cost?: number | null
          notes?: string | null
          client_id?: string | null
          job_id?: string | null
          client_cost?: number | null
          margin_amount?: number | null
          margin_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_work_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_work_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_work_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
          Row: {
            id: string
            created_at: string
            updated_at: string
            username: string
            password: string
            role: 'admin' | 'staff'
            full_name: string
            email: string | null
            active_status: boolean
            last_login: string | null
            staff_id: string | null
          }
          Insert: {
            id?: string
            created_at?: string
            updated_at?: string
            username: string
            password: string
            role: 'admin' | 'staff'
            full_name: string
            email?: string | null
            active_status?: boolean
            last_login?: string | null
            staff_id?: string | null
          }
          Update: {
            id?: string
            created_at?: string
            updated_at?: string
            username?: string
            password?: string
            role?: 'admin' | 'staff'
            full_name?: string
            email?: string | null
            active_status?: boolean
            last_login?: string | null
            staff_id?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "users_staff_id_fkey"
              columns: ["staff_id"]
              isOneToOne: false
              referencedRelation: "staff"
              referencedColumns: ["id"]
            }
          ]
        }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          invoice_number: string
          client_id: string
          period_start: string
          period_end: string
          issue_date: string
          due_date: string | null
          status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          additional_cost_total: number
          vat_rate: number | null
          vat_amount: number | null
          total_amount: number
          paid_amount: number | null
          payment_date: string | null
          payment_reference: string | null
          payment_method: string | null
          notes: string | null
          transaction_id: string | null
          bank_reference: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_number: string
          client_id: string
          period_start: string
          period_end: string
          issue_date?: string
          due_date?: string | null
          status?: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          additional_cost_total?: number
          vat_rate?: number | null
          vat_amount?: number | null
          total_amount?: number
          paid_amount?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_method?: string | null
          notes?: string | null
          transaction_id?: string | null
          bank_reference?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_number?: string
          client_id?: string
          period_start?: string
          period_end?: string
          issue_date?: string
          due_date?: string | null
          status?: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          additional_cost_total?: number
          vat_rate?: number | null
          vat_amount?: number | null
          total_amount?: number
          paid_amount?: number | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_method?: string | null
          notes?: string | null
          transaction_id?: string | null
          bank_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_additional_costs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          invoice_id: string
          description: string
          amount: number
          cost_type: 'expense' | 'material' | 'transport' | 'subcontracting' | 'misc'
          date: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id: string
          description: string
          amount: number
          cost_type?: 'expense' | 'material' | 'transport' | 'subcontracting' | 'misc'
          date?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id?: string
          description?: string
          amount?: number
          cost_type?: 'expense' | 'material' | 'transport' | 'subcontracting' | 'misc'
          date?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_additional_costs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_work_entries: {
        Row: {
          id: string
          created_at: string
          invoice_id: string
          work_entry_id: string
          hours_worked: number
          labor_cost: number
          client_cost: number
        }
        Insert: {
          id?: string
          created_at?: string
          invoice_id: string
          work_entry_id: string
          hours_worked: number
          labor_cost: number
          client_cost: number
        }
        Update: {
          id?: string
          created_at?: string
          invoice_id?: string
          work_entry_id?: string
          hours_worked?: number
          labor_cost?: number
          client_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_work_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_work_entries_work_entry_id_fkey"
            columns: ["work_entry_id"]
            isOneToOne: false
            referencedRelation: "daily_work_entries"
            referencedColumns: ["id"]
          }
        ]
      }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
        migrate_client_names: {
          Args: Record<PropertyKey, never>
          Returns: undefined
        }
        get_daily_margin_summary: {
          Args: {
            p_date: string
          }
          Returns: {
            total_labor_cost: number
            total_client_cost: number
            total_margin_amount: number
            average_margin_percentage: number
            entries_count: number
          }
        }
        authenticate_user: {
          Args: {
            p_username: string
            p_password: string
          }
          Returns: {
            user_id: string
            username: string
            role: string
            full_name: string
            email: string
            staff_id: string
          }[]
        }
        update_user_password: {
          Args: {
            p_user_id: string
            p_new_password: string
          }
          Returns: boolean
        }
      }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }


