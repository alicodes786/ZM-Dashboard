'use client'

import { useState, useEffect } from 'react'
import { Plus, Building, Users, TrendingUp, DollarSign } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ClientTable } from '@/components/clients/client-table'
import { ClientForm } from '@/components/clients/client-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Client } from '@/lib/types'
import { ClientService } from '@/lib/services/clients'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  // const [viewingClient, setViewingClient] = useState<Client | undefined>()

  const fetchClients = async () => {
    try {
      setError(null)
      const data = await ClientService.getAll()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleAddClient = () => {
    setEditingClient(undefined)
    setShowForm(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleViewClient = (client: Client) => {
    // TODO: Implement client detail view
    console.log('View client:', client)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingClient(undefined)
    fetchClients()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingClient(undefined)
  }

  const activeClients = clients.filter(c => c.active_status)
  const totalClients = clients.length

  const headerActions = (
    <Button onClick={handleAddClient} className="flex items-center space-x-2">
      <Plus className="h-4 w-4" />
      <span>Add Client</span>
    </Button>
  )

  if (showForm) {
    return (
      <DashboardLayout title="Client Management">
        <div className="max-w-6xl mx-auto">
          <ClientForm
            client={editingClient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Client Management"
      subtitle="Manage your clients and their information"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">{activeClients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">+12%</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Value</p>
                <p className="text-2xl font-bold text-gray-900">£2,450</p>
                <p className="text-xs text-gray-500">Per client</p>
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

        {/* Clients Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          </div>
        ) : (
          <ClientTable
            clients={clients}
            onEdit={handleEditClient}
            onView={handleViewClient}
            onRefresh={fetchClients}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
