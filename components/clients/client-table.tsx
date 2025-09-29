'use client'

import { useState } from 'react'
import { Edit, Trash2, Eye, Building, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Client } from '@/lib/types'
import { ClientService } from '@/lib/services/clients'

interface ClientTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onView: (client: Client) => void
  onRefresh: () => void
}

export function ClientTable({ clients, onEdit, onView, onRefresh }: ClientTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.name}? This will also delete all associated jobs and work entries.`)) {
      return
    }

    setLoading(client.id)
    setError(null)

    try {
      await ClientService.delete(client.id)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client')
    } finally {
      setLoading(null)
    }
  }

  const handleToggleStatus = async (client: Client) => {
    setLoading(client.id)
    setError(null)

    try {
      await ClientService.toggleActiveStatus(client.id)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No clients</h3>
        <p className="mt-2 text-gray-500">Get started by adding your first client.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.contact_person && (
                      <div className="text-sm text-gray-500">
                        Contact: {client.contact_person}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-gray-600">
                  {client.company_name || '-'}
                </TableCell>

                <TableCell className="text-gray-600">
                  <div className="max-w-xs truncate">
                    {client.address || '-'}
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.active_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {client.active_status ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(client)}
                      disabled={loading === client.id}
                      className="h-8 w-8"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(client)}
                      disabled={loading === client.id}
                      className="h-8 w-8"
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(client)}
                      disabled={loading === client.id}
                      className="h-8 w-8"
                      title={client.active_status ? 'Deactivate' : 'Activate'}
                    >
                      <span className={`text-xs font-bold ${
                        client.active_status ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {client.active_status ? '⏸' : '▶'}
                      </span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(client)}
                      disabled={loading === client.id}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {clients.length} client{clients.length !== 1 ? 's' : ''}
        </div>
        <div>
          Active: {clients.filter(c => c.active_status).length} | 
          Inactive: {clients.filter(c => !c.active_status).length}
        </div>
      </div>
    </div>
  )
}
