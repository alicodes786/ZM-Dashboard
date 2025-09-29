'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WorkEntryForm } from '@/components/daily-work/work-entry-form'
import { DailySummary } from '@/components/daily-work/daily-summary'
import { InlineEditRow } from '@/components/daily-work/inline-edit-row'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DailyWorkEntry, DailyWorkEntryWithFullRelations, DailySummary as DailySummaryType } from '@/lib/types'
import { DailyWorkService, MarginSummary } from '@/lib/services/daily-work'
import { formatCurrency, formatTime } from '@/lib/utils'

export default function DailyWorkPage() {
  const [entries, setEntries] = useState<DailyWorkEntryWithFullRelations[]>([])
  const [summary, setSummary] = useState<DailySummaryType[]>([])
  const [marginSummary, setMarginSummary] = useState<MarginSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DailyWorkEntry | undefined>()
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [view, setView] = useState<'entries' | 'summary'>('entries')

  const fetchData = async (date: string) => {
    try {
      setError(null)
      setLoading(true)
      const [entriesData, summaryData, marginData] = await Promise.all([
        DailyWorkService.getByDate(date),
        DailyWorkService.getDailySummary(date),
        DailyWorkService.getMarginSummary(date),
      ])
      setEntries(entriesData)
      setSummary(summaryData)
      setMarginSummary(marginData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily work data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedDate)
  }, [selectedDate])

  const handleAddEntry = () => {
    setEditingEntry(undefined)
    setShowForm(true)
  }

  const handleEditEntry = (entry: DailyWorkEntry) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingEntry(undefined)
    fetchData(selectedDate)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingEntry(undefined)
  }

  const handleDeleteEntry = async (entry: DailyWorkEntry) => {
    if (!confirm('Are you sure you want to delete this work entry?')) {
      return
    }

    try {
      await DailyWorkService.delete(entry.id)
      fetchData(selectedDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0)
  const totalCost = entries.reduce((sum, entry) => sum + (entry.override_cost || entry.calculated_cost), 0)

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-40"
      />
      <Button
        variant={view === 'entries' ? 'default' : 'outline'}
        onClick={() => setView('entries')}
        size="sm"
      >
        Entries
      </Button>
      <Button
        variant={view === 'summary' ? 'default' : 'outline'}
        onClick={() => setView('summary')}
        size="sm"
      >
        Summary
      </Button>
      <Button onClick={handleAddEntry} className="flex items-center space-x-2">
        <Plus className="h-4 w-4" />
        <span>Add Entry</span>
      </Button>
    </div>
  )

  if (showForm) {
    return (
      <DashboardLayout title="Daily Work Management">
        <div className="max-w-4xl mx-auto">
          <WorkEntryForm
            entry={editingEntry}
            defaultDate={selectedDate}
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
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatTime(totalHours)}</p>
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
                  {formatCurrency(marginSummary?.totalClientCost || totalCost)}
                </p>
                <p className="text-xs text-gray-500">
                  Labor: {formatCurrency(marginSummary?.totalLaborCost || totalCost)}
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
                  (marginSummary?.totalMarginAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(marginSummary?.totalMarginAmount || 0)}
                </p>
                <p className={`text-xs ${
                  (marginSummary?.averageMarginPercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {marginSummary?.averageMarginPercentage || 0}% avg
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
        ) : view === 'summary' ? (
          <DailySummary summaries={summary} date={selectedDate} />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No entries for this date</h3>
                <p className="mt-2 text-gray-500">Add your first work entry to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    inlineEditingId === entry.id ? (
                      <InlineEditRow
                        key={entry.id}
                        entry={entry}
                        onUpdate={() => {
                          setInlineEditingId(null)
                          fetchData(selectedDate)
                        }}
                        onCancel={() => setInlineEditingId(null)}
                      />
                    ) : (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.staff?.name || 'Unknown Staff'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-xs">
                              {entry.task_description}
                            </div>
                          {entry.job && (
                            <div className="text-sm text-blue-600 truncate max-w-xs">
                              Job: {entry.job.title}
                            </div>
                          )}
                            {entry.notes && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {entry.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {entry.client?.name || entry.client_name}
                            </div>
                            {entry.client?.company_name && (
                              <div className="text-sm text-gray-500">
                                {entry.client.company_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(entry.hours_worked)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(entry.client_cost || entry.override_cost || entry.calculated_cost)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Labor: {formatCurrency(entry.calculated_cost)}
                            </div>
                            {entry.override_cost && (
                              <div className="text-xs text-blue-600">Custom price</div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            {entry.margin_amount !== null && entry.margin_percentage !== null ? (
                              <>
                                <div className={`font-medium ${
                                  entry.margin_amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {entry.margin_amount >= 0 ? '+' : ''}{formatCurrency(entry.margin_amount)}
                                </div>
                                <div className={`text-xs ${
                                  entry.margin_percentage >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {entry.margin_percentage >= 0 ? '+' : ''}{entry.margin_percentage}%
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400 text-sm">No margin</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInlineEditingId(entry.id)}
                              disabled={inlineEditingId !== null}
                            >
                              Quick Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              disabled={inlineEditingId !== null}
                            >
                              Full Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry)}
                              className="text-red-600 hover:text-red-700"
                              disabled={inlineEditingId !== null}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
