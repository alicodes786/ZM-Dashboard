'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DailyWorkEntryWithFullRelations } from '@/lib/types'
import { formatCurrency, formatTime } from '@/lib/utils'
import { Clock, User, Briefcase, Calendar } from 'lucide-react'

interface ListViewProps {
  entries: DailyWorkEntryWithFullRelations[]
  startDate: Date
  endDate: Date
}

export function ListView({ entries, startDate, endDate }: ListViewProps) {
  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {} as Record<string, DailyWorkEntryWithFullRelations[]>)

  // Sort dates in descending order
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a))

  // Format date for display
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate totals for a date
  const getDateTotals = (entries: DailyWorkEntryWithFullRelations[]) => {
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0)
    const totalRevenue = entries.reduce((sum, entry) => sum + (entry.client_cost || entry.override_cost || entry.calculated_cost), 0)
    const totalCost = entries.reduce((sum, entry) => sum + entry.calculated_cost, 0)
    const totalMargin = totalRevenue - totalCost
    
    return { totalHours, totalRevenue, totalMargin }
  }

  const totalEntries = entries.length

  return (
    <div className="space-y-6">
      {/* Header with total count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {formatDateHeader(startDate.toISOString().split('T')[0])} → {formatDateHeader(endDate.toISOString().split('T')[0])}
        </h3>
        <div className="text-sm text-gray-600">
          {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* List of entries grouped by date */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No work entries found for this period</p>
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((date) => {
          const dateEntries = entriesByDate[date]
          const { totalHours, totalRevenue, totalMargin } = getDateTotals(dateEntries)
          
          return (
            <Card key={date} className="border-l-4 border-blue-500">
              <CardContent className="p-4">
                {/* Date Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {formatDateHeader(date)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700 flex items-center justify-end">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(totalHours)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <div className={`text-xs ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalMargin >= 0 ? '+' : ''}{formatCurrency(totalMargin)} margin
                    </div>
                  </div>
                </div>

                {/* Entries for this date */}
                <div className="space-y-3">
                  {dateEntries.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {entry.task_description}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          {entry.job && (
                            <div className="flex items-center text-blue-600">
                              <Briefcase className="h-3.5 w-3.5 mr-1" />
                              <span className="truncate">{entry.job.title}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <User className="h-3.5 w-3.5 mr-1" />
                            <span>{entry.staff?.name || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{formatTime(entry.hours_worked)}</span>
                          </div>
                        </div>

                        {entry.client && (
                          <div className="text-xs text-gray-500 mt-1">
                            Client: {entry.client.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(entry.client_cost || entry.override_cost || entry.calculated_cost)}
                        </div>
                        {entry.margin_amount !== null && (
                          <div className={`text-xs ${entry.margin_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.margin_amount >= 0 ? '+' : ''}{formatCurrency(entry.margin_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

