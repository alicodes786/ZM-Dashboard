import { Database } from './database.types'

export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']

export type DailyWorkEntry = Database['public']['Tables']['daily_work_entries']['Row']
export type DailyWorkEntryInsert = Database['public']['Tables']['daily_work_entries']['Insert']
export type DailyWorkEntryUpdate = Database['public']['Tables']['daily_work_entries']['Update']

export interface StaffWithWorkEntries extends Staff {
  daily_work_entries?: DailyWorkEntry[]
}

export interface ClientWithJobs extends Client {
  jobs?: Job[]
}

export interface JobWithClient extends Job {
  client?: Client
}

export interface JobWithWorkEntries extends Job {
  client?: Client
  daily_work_entries?: DailyWorkEntryWithStaff[]
}

export interface DailyWorkEntryWithStaff extends DailyWorkEntry {
  staff?: Staff
}

export interface DailyWorkEntryWithRelations extends DailyWorkEntry {
  staff?: Staff
  client?: Client
  job?: JobWithClient
}

export interface DailyWorkEntryWithFullRelations extends DailyWorkEntry {
  staff?: Staff
  client?: Client
  job?: {
    id: string
    title: string
    client?: Client
  }
}

export interface DailySummary {
  staffId: string
  staffName: string
  date: string
  totalTasks: number
  totalHours: number
  allocatedHours: number
  totalCost: number
  hoursVariance: number
  isOverAllocated: boolean
  isUnderAllocated: boolean
}

export interface AlertConfig {
  hoursDiscrepancyThreshold: number
  showOverAllocationAlerts: boolean
  showUnderAllocationAlerts: boolean
}

export interface ModuleConfig {
  staff: {
    defaultMarginPercentage: number
    defaultAllocatedHours: number
    requireEmailValidation: boolean
  }
  dailyWork: {
    allowFutureDates: boolean
    maxHoursPerTask: number
    requireClientName: boolean
  }
  alerts: AlertConfig
}
