'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { WorkEntryForm } from '@/components/daily-work/work-entry-form'
import { CalendarView } from '@/components/daily-work/calendar-view'
import { ListView } from '@/components/daily-work/list-view'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DailyWorkEntry, DailyWorkEntryWithFullRelations } from '@/lib/types'
import { DailyWorkService, MarginSummary } from '@/lib/services/daily-work'
import { formatCurrency, formatTime } from '@/lib/utils'

export default function DailyWorkPage() {
  const [entries, setEntries] = useState<DailyWorkEntryWithFullRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DailyWorkEntry | undefined>()
  
  // View state
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate date range based on current view
  const getDateRange = () => {
    const start = new Date(currentDate.getTime()) // Use getTime() to avoid mutation issues
    let end: Date
    
    if (calendarView === 'week') {
      // Start from Monday of the current week
      const dayOfWeek = start.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      start.setDate(start.getDate() + diff)
      
      // End on Sunday - create new Date from start
      end = new Date(start.getTime())
      end.setDate(end.getDate() + 6)
    } else {
      // Start from beginning of month
      start.setDate(1)
      
      // End at end of month
      end = new Date(start.getTime())
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      startDate: start,
      endDate: end
    }
  }

  // Fetch data for current date range
  const fetchData = async () => {
    try {
      setError(null)
      setLoading(true)
      
      const { start, end } = getDateRange()
      const data = await DailyWorkService.getByDateRange(start, end)
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily work data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentDate, calendarView])

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Format period display
  const formatPeriod = () => {
    if (calendarView === 'week') {
      const { startDate, endDate } = getDateRange()
      const startDay = startDate.getDate()
      const endDay = endDate.getDate()
      const startMonth = startDate.toLocaleDateString('en-GB', { month: 'short' })
      const endMonth = endDate.toLocaleDateString('en-GB', { month: 'short' })
      const year = startDate.getFullYear()
      
      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${startMonth} ${year}`
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
      }
    } else {
      return currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
  }

  // Calculate stats for current period
  const calculateStats = () => {
    const totalEntries = entries.length
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0)
    const totalRevenue = entries.reduce((sum, entry) => 
      sum + (entry.client_cost || entry.override_cost || entry.calculated_cost), 0)
    const totalCost = entries.reduce((sum, entry) => sum + entry.calculated_cost, 0)
    const totalMargin = totalRevenue - totalCost
    const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0
    
    return {
      totalEntries,
      totalHours,
      totalRevenue,
      totalCost,
      totalMargin,
      marginPercentage
    }
  }

  const stats = calculateStats()

  const handleAddEntry = () => {
    setEditingEntry(undefined)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingEntry(undefined)
    fetchData()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingEntry(undefined)
  }

  const headerActions = (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Left side: Navigation and Period Display */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[240px] text-center">
            <div className="text-base font-semibold text-gray-900">
              {formatPeriod()}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={navigateToday} className="h-9">
          Today
        </Button>
      </div>

      {/* Right side: View controls and Add button */}
      <div className="flex items-center space-x-3">
        {/* View Toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView('calendar')}
            className={`flex items-center space-x-2 rounded-none border-r border-gray-300 ${
              view === 'calendar' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView('list')}
            className={`flex items-center space-x-2 rounded-none ${
              view === 'list' 
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </Button>
        </div>

        {/* Week/Month Toggle (only for calendar view) */}
        {view === 'calendar' && (
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setCalendarView('week')}
              className={`rounded-none border-r border-gray-300 ${
                calendarView === 'week' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              onClick={() => setCalendarView('month')}
              className={`rounded-none ${
                calendarView === 'month' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Month
            </Button>
          </div>
        )}

        <Button 
          onClick={handleAddEntry} 
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 h-9"
        >
          <Plus className="h-4 w-4" />
          <span>Add Entry</span>
        </Button>
      </div>
    </div>
  )

  if (showForm) {
    return (
      <DashboardLayout title="Daily Work Management">
        <div className="max-w-4xl mx-auto">
          <WorkEntryForm
            entry={editingEntry}
            defaultDate={new Date().toISOString().split('T')[0]}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Daily Work Management"
      subtitle="Track daily tasks, hours, and costs"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalHours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">£</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  Labor: {formatCurrency(stats.totalCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                <p className={`text-2xl font-bold ${
                  stats.totalMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.totalMargin)}
                </p>
                <p className={`text-xs ${
                  stats.marginPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.round(stats.marginPercentage)}% avg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {view === 'calendar' ? (
              <CalendarView 
                entries={entries}
                startDate={currentDate}
                view={calendarView}
              />
            ) : (
              <ListView 
                entries={entries}
                startDate={getDateRange().startDate}
                endDate={getDateRange().endDate}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
