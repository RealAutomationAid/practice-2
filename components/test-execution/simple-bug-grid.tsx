'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Download,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BugReportExtended, BatchOperation } from './types'
import { BugDetailModal } from './bug-detail-modal'

interface SimpleBugGridProps {
  onEdit?: (bug: BugReportExtended) => void
  className?: string
}

// Simple Badge component
const Badge = ({ value, type }: { value: string; type: 'severity' | 'priority' | 'status' }) => {
  const getColorClass = () => {
    switch (type) {
      case 'severity':
        switch (value) {
          case 'low': return 'bg-green-100 text-green-800'
          case 'medium': return 'bg-yellow-100 text-yellow-800'
          case 'high': return 'bg-orange-100 text-orange-800'
          case 'critical': return 'bg-red-100 text-red-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      case 'priority':
        switch (value) {
          case 'low': return 'bg-blue-100 text-blue-800'
          case 'medium': return 'bg-purple-100 text-purple-800'
          case 'high': return 'bg-orange-100 text-orange-800'
          case 'urgent': return 'bg-red-100 text-red-800'
          default: return 'bg-gray-100 text-gray-800'
        }
      case 'status':
        switch (value) {
          case 'open': return 'bg-red-100 text-red-800'
          case 'in_progress': return 'bg-yellow-100 text-yellow-800'
          case 'resolved': return 'bg-green-100 text-green-800'
          case 'closed': return 'bg-gray-100 text-gray-800'
          default: return 'bg-gray-100 text-gray-800'
        }
    }
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getColorClass()}`}>
      {value?.replace('_', ' ') || 'N/A'}
    </span>
  )
}

export function SimpleBugGrid({ onEdit, className = '' }: SimpleBugGridProps) {
  const [bugs, setBugs] = useState<BugReportExtended[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedBug, setSelectedBug] = useState<BugReportExtended | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch bugs from API
  const fetchBugs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-execution/bugs')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setBugs(data.bugs || [])
      toast.success('Bug reports loaded successfully')
    } catch (error) {
      console.error('Failed to load bugs:', error)
      toast.error('Failed to load bug reports')
      setBugs([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  // Filter and sort bugs
  const filteredBugs = bugs
    .filter(bug => 
      !searchTerm || 
      bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField as keyof BugReportExtended] || ''
      const bVal = b[sortField as keyof BugReportExtended] || ''
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Handle delete
  const handleDelete = async (bugId: string) => {
    if (!confirm('Are you sure you want to delete this bug report?')) {
      return
    }

    try {
      const response = await fetch('/api/test-execution/bugs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [bugId] })
      })

      if (!response.ok) {
        throw new Error('Failed to delete bug')
      }

      setBugs(prev => prev.filter(bug => bug.id !== bugId))
      toast.success('Bug report deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete bug report')
    }
  }

  // Handle view bug details
  const handleViewBug = (bug: BugReportExtended) => {
    setSelectedBug(bug)
    setIsModalOpen(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBug(null)
  }

  // Handle export with better formatting
  const handleExport = () => {
    try {
      const headers = [
        'ID',
        'Title', 
        'Description',
        'Status',
        'Severity',
        'Priority',
        'Reporter Name',
        'Reporter Email',
        'Environment',
        'Browser',
        'OS',
        'Steps to Reproduce',
        'Expected Result',
        'Actual Result',
        'Tags',
        'Created Date',
        'Updated Date'
      ]

      const formatCSVField = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return ''
        try {
          return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString()
        } catch {
          return dateStr
        }
      }

      const formatTags = (tags: any): string => {
        if (!tags) return ''
        if (typeof tags === 'string') {
          try {
            const parsed = JSON.parse(tags)
            return Array.isArray(parsed) ? parsed.join('; ') : tags
          } catch {
            return tags
          }
        }
        if (Array.isArray(tags)) {
          return tags.join('; ')
        }
        return String(tags)
      }

      const csvRows = [
        headers.join(','),
        ...filteredBugs.map(bug => [
          formatCSVField(bug.id),
          formatCSVField(bug.title),
          formatCSVField(bug.description),
          formatCSVField(bug.status),
          formatCSVField(bug.severity),
          formatCSVField(bug.priority),
          formatCSVField(bug.reporter_name),
          formatCSVField(bug.reporter_email),
          formatCSVField(bug.environment),
          formatCSVField(bug.browser),
          formatCSVField(bug.os),
          formatCSVField(bug.steps_to_reproduce),
          formatCSVField(bug.expected_result),
          formatCSVField(bug.actual_result),
          formatCSVField(formatTags(bug.tags)),
          formatCSVField(formatDate(bug.created_at)),
          formatCSVField(formatDate(bug.updated_at))
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bug-reports-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(`${filteredBugs.length} bug reports exported successfully`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export bug reports')
    }
  }

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left w-full hover:bg-gray-100 p-1 rounded"
    >
      {label}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  )

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Bug Reports ({filteredBugs.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBugs}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search bugs..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="id" label="ID" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="title" label="Title" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="status" label="Status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="severity" label="Severity" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="priority" label="Priority" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="reporter_name" label="Reporter" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="created_at" label="Created" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading bug reports...
                </td>
              </tr>
            ) : filteredBugs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No bug reports found
                </td>
              </tr>
            ) : (
              filteredBugs.map(bug => (
                <tr key={bug.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                    {bug.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                    <button
                      onClick={() => handleViewBug(bug)}
                      className="text-left w-full hover:text-blue-600 transition-colors"
                      title="Click to view details"
                    >
                      <div className="truncate hover:underline">{bug.title}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge value={bug.status || 'open'} type="status" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge value={bug.severity || 'low'} type="severity" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge value={bug.priority || 'low'} type="priority" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {bug.reporter_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewBug(bug)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit?.(bug)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bug.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bug Detail Modal */}
      <BugDetailModal
        bug={selectedBug}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={onEdit}
      />
    </div>
  )
} 