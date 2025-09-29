'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, ClipboardList, TrendingUp, Calendar, Plus, ArrowRight, Building2, Briefcase } from 'lucide-react'
import { Staff, DailyWorkEntryWithStaff, Client, JobWithClient } from '@/lib/types'
import { StaffService } from '@/lib/services/staff'
import { DailyWorkService } from '@/lib/services/daily-work'
import { ClientService } from '@/lib/services/clients'
import { JobService } from '@/lib/services/jobs'
import { formatCurrency, formatTime } from '@/lib/utils'

export default function Home() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [jobs, setJobs] = useState<JobWithClient[]>([])
  const [todayEntries, setTodayEntries] = useState<DailyWorkEntryWithStaff[]>([])
  const [todayMargin, setTodayMargin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const [staffData, clientsData, jobsData, entriesData, marginData] = await Promise.all([
          StaffService.getAll(),
          ClientService.getAll(),
          JobService.getActiveJobs(),
          DailyWorkService.getByDate(today),
          DailyWorkService.getMarginSummary(today),
        ])
        setStaff(staffData)
        setClients(clientsData)
        setJobs(jobsData)
        setTodayEntries(entriesData)
        setTodayMargin(marginData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const activeStaff = staff.filter(s => s.active_status)
  const activeClients = clients.filter(c => c.active_status)
  const todayHours = todayEntries.reduce((sum, entry) => sum + entry.hours_worked, 0)
  const todayCost = todayEntries.reduce((sum, entry) => sum + (entry.client_cost || entry.override_cost || entry.calculated_cost), 0)
  const todayMarginAmount = todayMargin?.totalMarginAmount || 0
  const todayMarginPercentage = todayMargin?.averageMarginPercentage || 0

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Welcome to ZM Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Welcome to ZM Dashboard - Phase 1: Staff & Daily Work Management"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{activeStaff.length}</p>
                  <p className="text-xs text-gray-500">{staff.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{activeClients.length}</p>
                  <p className="text-xs text-gray-500">{clients.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                  <p className="text-xs text-gray-500">in progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayCost)}</p>
                  <p className="text-xs text-green-600">
                    Margin: {formatCurrency(todayMarginAmount)} ({todayMarginPercentage}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/clients">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Building2 className="h-6 w-6" />
                  <span>Manage Clients</span>
                  <span className="text-xs text-gray-500">Add and manage client information</span>
                </Button>
              </Link>

              <Link href="/jobs">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Briefcase className="h-6 w-6" />
                  <span>Manage Jobs</span>
                  <span className="text-xs text-gray-500">Create and track project progress</span>
                </Button>
              </Link>

              <Link href="/staff">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Staff</span>
                  <span className="text-xs text-gray-500">Add, edit, or view staff members</span>
                </Button>
              </Link>
              
              <Link href="/daily-work">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <ClipboardList className="h-6 w-6" />
                  <span>Daily Work</span>
                  <span className="text-xs text-gray-500">Log tasks and track hours</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Staff Activity
                <Link href="/staff">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first staff member.</p>
                  <Link href="/staff">
                    <Button className="mt-4" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Staff Member
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeStaff.slice(0, 5).map((staffMember) => (
                    <div key={staffMember.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{staffMember.name}</p>
                        <p className="text-sm text-gray-500">{StaffService.getPaymentDisplayText(staffMember)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(staffMember.allocated_daily_hours)}
                        </p>
                        <p className="text-xs text-gray-500">allocated</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Today's Work Entries
                <Link href="/daily-work">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No entries today</h3>
                  <p className="mt-1 text-sm text-gray-500">Start logging work to see entries here.</p>
                  <Link href="/daily-work">
                    <Button className="mt-4" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Work Entry
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{entry.staff?.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {entry.task_description}
                        </p>
                        <p className="text-xs text-gray-400">{entry.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(entry.hours_worked)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(entry.override_cost || entry.calculated_cost)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

    </div>
    </DashboardLayout>
  )
}
