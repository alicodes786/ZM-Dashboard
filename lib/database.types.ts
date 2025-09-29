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
          payment_type: 'daily_rate' | 'monthly_salary'
          daily_rate: number | null
          monthly_salary: number | null
          allocated_daily_hours: number
          active_status: boolean
          pay_override_enabled: boolean
          pay_override_amount: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          payment_type: 'daily_rate' | 'monthly_salary'
          daily_rate?: number | null
          monthly_salary?: number | null
          allocated_daily_hours: number
          active_status?: boolean
          pay_override_enabled?: boolean
          pay_override_amount?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          payment_type?: 'daily_rate' | 'monthly_salary'
          daily_rate?: number | null
          monthly_salary?: number | null
          allocated_daily_hours?: number
          active_status?: boolean
          pay_override_enabled?: boolean
          pay_override_amount?: number | null
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
          job_type: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'emergency'
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
          job_type?: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'emergency'
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
          job_type?: 'maintenance' | 'repair' | 'installation' | 'inspection' | 'emergency'
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
