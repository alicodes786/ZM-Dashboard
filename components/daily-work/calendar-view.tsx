'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DailyWorkEntryWithFullRelations } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { Clock, Briefcase } from 'lucide-react'

interface CalendarViewProps {
  entries: DailyWorkEntryWithFullRelations[]
  startDate: Date
  view: 'week' | 'month'
}

export function CalendarView({ 
  entries, 
  startDate, 
  view
}: CalendarViewProps) {
  
  // Generate days for the calendar based on view
  const getDaysInView = () => {
    const days = []
    let currentDate = new Date(startDate)
    
    if (view === 'week') {
      // For week view, start from Monday of the current week
      const dayOfWeek = currentDate.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday as first day
      currentDate.setDate(currentDate.getDate() + diff)
      
      // Get 7 days for the week
      for (let i = 0; i < 7; i++) {
        days.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // For month view, start from the first day of the month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      // Get first day of week for the month
      const firstDayOfWeek = currentDate.getDay()
      const startOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek
      currentDate.setDate(currentDate.getDate() + startOffset)
      
      // Get enough days to fill the calendar grid (6 weeks max)
      for (let i = 0; i < 42; i++) {
        days.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    
    return days
  }

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return entries.filter(entry => entry.date === dateString)
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  // Check if date is in current month (for month view)
  const isInCurrentMonth = (date: Date) => {
    return date.getMonth() === startDate.getMonth()
  }

  const days = getDaysInView()
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {/* Day Headers */}
        {weekDays.map((day, index) => (
          <div key={`header-${index}`} className="text-center font-semibold py-2 text-gray-700 border-b-2 border-gray-200">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((day, index) => {
          const entriesForDay = getEntriesForDate(day)
          const isCurrentMonth = isInCurrentMonth(day)
          const isTodayDate = isToday(day)
          
          return (
            <div 
              key={`day-${index}`} 
              className={`min-h-[120px] ${!isCurrentMonth && view === 'month' ? 'opacity-40' : ''}`}
            >
              {/* Date Header */}
              <div className="mb-2">
                <div className={`text-center ${isTodayDate ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold' : 'font-medium text-gray-700'}`}>
                  {day.getDate()}
                </div>
              </div>
              
              {/* Work Entries */}
              <div className="space-y-2">
                {entriesForDay.map((entry, entryIndex) => {
                  const jobTitle = entry.job?.title
                  const staffName = entry.staff?.name || 'Unknown'
                  
                  return (
                    <Card 
                      key={`entry-${entryIndex}`} 
                      className="border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-2">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {entry.task_description}
                        </div>
                        {jobTitle && (
                          <div className="text-xs text-blue-600 flex items-center mt-0.5 truncate">
                            <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{jobTitle}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                          <span className="truncate">{staffName}</span>
                          <span className="flex items-center flex-shrink-0 ml-1">
                            <Clock className="h-3 w-3 mr-0.5" />
                            {formatTime(entry.hours_worked)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
