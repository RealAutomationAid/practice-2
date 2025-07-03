'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  User,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  Eye
} from 'lucide-react'
import { BugReportExtended, SearchFilterState } from './types'
import { formatUtils } from '@/lib/test-execution-utils'
import { InlineFilters } from './inline-filters'
import { EnhancedBugDetailModal } from './enhanced-bug-detail-modal'

interface CompactBugTableProps {
  data: BugReportExtended[]
  loading?: boolean
  totalCount?: number
  onRefresh?: () => void
  onEdit?: (bug: BugReportExtended) => void
  onDelete?: (bugIds: string[]) => void
  onExport?: () => void
  onSearch?: (searchState: SearchFilterState) => void
  onView?: (bug: BugReportExtended) => void
  className?: string
}

// Compact Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    open: { color: 'bg-red-500', textColor: 'text-white', icon: AlertCircle, label: 'Open' },
    in_progress: { color: 'bg-yellow-500', textColor: 'text-white', icon: Clock, label: 'In Progress' },
    resolved: { color: 'bg-green-500', textColor: 'text-white', icon: Check, label: 'Resolved' },
    closed: { color: 'bg-gray-500', textColor: 'text-white', icon: Check, label: 'Closed' },
    duplicate: { color: 'bg-purple-500', textColor: 'text-white', icon: ExternalLink, label: 'Duplicate' }
  }[status] || { color: 'bg-gray-500', textColor: 'text-white', icon: AlertCircle, label: status }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs font-medium text-gray-700">{config.label}</span>
    </div>
  )
}

// Compact Priority/Severity Indicator
const PriorityIndicator = ({ 
  priority, 
  severity 
}: { 
  priority: string
  severity: string 
}) => {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'border-l-red-500'
      case 'high': return 'border-l-orange-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getSeverityIcon = (s: string) => {
    switch (s) {
      case 'critical': return '🔴'
      case 'high': return '🟠'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  return (
    <div className={`flex items-center gap-1 border-l-2 pl-2 ${getPriorityColor(priority)}`}>
      <span className="text-xs">{getSeverityIcon(severity)}</span>
      <span className="text-xs font-medium text-gray-600 capitalize">{priority}</span>
    </div>
  )
}

// Expandable Row Content
const ExpandedRowContent = ({ bug }: { bug: BugReportExtended }) => (
  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Description</h4>
        <p className="text-gray-600">{bug.description || 'No description provided'}</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Environment</h4>
        <div className="space-y-1 text-gray-600">
          <div>Browser: {bug.browser || 'N/A'}</div>
          <div>OS: {bug.os || 'N/A'}</div>
          <div>Environment: {bug.environment || 'N/A'}</div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Steps to Reproduce</h4>
        <p className="text-gray-600">{bug.steps_to_reproduce || 'No steps provided'}</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Expected Result</h4>
        <p className="text-gray-600">{bug.expected_result || 'No expected result provided'}</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Actual Result</h4>
        <p className="text-gray-600">{bug.actual_result || 'No actual result provided'}</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Tags</h4>
        <div className="flex flex-wrap gap-1">
          {bug.tags && Array.isArray(bug.tags) && bug.tags.length > 0 ? (
            bug.tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-xs">No tags</span>
          )}
        </div>
      </div>
    </div>
    
    {/* Attachments Section */}
    {bug.attachment_urls && bug.attachment_urls.length > 0 && (
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">
          Attachments ({bug.attachment_urls.length})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {bug.attachment_urls.map((url, index) => {
            const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
            const isVideo = url.toLowerCase().match(/\.(mp4|webm|avi|mov|wmv|flv)$/i)
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-2 bg-white">
                {isImage ? (
                  <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ) : isVideo ? (
                  <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                    <video 
                      src={url}
                      className="w-full h-full object-cover cursor-pointer"
                      controls
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg mb-1">📄</div>
                      <div className="text-xs text-gray-600">File</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="text-xs text-blue-600 hover:underline w-full text-left"
                >
                  {isImage ? 'View Image' : isVideo ? 'Open Video' : 'Download File'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )}
  </div>
)

export function CompactBugTable({
  data,
  loading = false,
  totalCount = 0,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
  onSearch,
  onView,
  className = ''
}: CompactBugTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedBugForView, setSelectedBugForView] = useState<BugReportExtended | null>(null)
  const [filterState, setFilterState] = useState<SearchFilterState>({
    searchTerm: '',
    statusFilter: [],
    severityFilter: [],
    priorityFilter: [],
    reporterFilter: [],
    dateRange: { start: null, end: null },
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // Calculate bug counts for filter chips
  const bugCounts = useMemo(() => {
    return data.reduce((acc, bug) => {
      acc.total++
      acc[bug.status || 'open'] = (acc[bug.status || 'open'] || 0) + 1
      acc[bug.severity || 'low'] = (acc[bug.severity || 'low'] || 0) + 1
      acc[bug.priority || 'low'] = (acc[bug.priority || 'low'] || 0) + 1
      return acc
    }, {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      duplicate: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      urgent: 0
    } as Record<string, number>)
  }, [data])

  // Get unique reporters
  const reporters = useMemo(() => {
    return Array.from(new Set(data.map(bug => bug.reporter_name).filter(Boolean))) as string[]
  }, [data])

  // Apply filtering and sorting
  const filteredData = useMemo(() => {
    let filtered = data

    // Apply search term
    if (searchTerm || filterState.searchTerm) {
      const term = (searchTerm || filterState.searchTerm).toLowerCase()
      filtered = filtered.filter(bug =>
        bug.title?.toLowerCase().includes(term) ||
        bug.description?.toLowerCase().includes(term) ||
        bug.reporter_name?.toLowerCase().includes(term) ||
        bug.id.toLowerCase().includes(term)
      )
    }

    // Apply filters
    if (filterState.statusFilter.length > 0) {
      filtered = filtered.filter(bug => filterState.statusFilter.includes(bug.status || 'open'))
    }
    if (filterState.severityFilter.length > 0) {
      filtered = filtered.filter(bug => filterState.severityFilter.includes(bug.severity || 'low'))
    }
    if (filterState.priorityFilter.length > 0) {
      filtered = filtered.filter(bug => filterState.priorityFilter.includes(bug.priority || 'low'))
    }
    if (filterState.reporterFilter.length > 0) {
      filtered = filtered.filter(bug => filterState.reporterFilter.includes(bug.reporter_name || ''))
    }

    // Apply date range filter
    if (filterState.dateRange.start || filterState.dateRange.end) {
      filtered = filtered.filter(bug => {
        if (!bug.created_at) return false
        const bugDate = new Date(bug.created_at)
        if (filterState.dateRange.start && bugDate < filterState.dateRange.start) return false
        if (filterState.dateRange.end && bugDate > filterState.dateRange.end) return false
        return true
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filterState.sortBy as keyof BugReportExtended]
      const bValue = b[filterState.sortBy as keyof BugReportExtended]
      
      if (aValue === bValue) return 0
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      const comparison = aValue < bValue ? -1 : 1
      return filterState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [data, searchTerm, filterState])

  const toggleRowExpansion = useCallback((bugId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bugId)) {
        newSet.delete(bugId)
      } else {
        newSet.add(bugId)
      }
      return newSet
    })
  }, [])

  const handleFilterChange = useCallback((newFilterState: SearchFilterState) => {
    setFilterState(newFilterState)
    onSearch?.(newFilterState)
  }, [onSearch])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    const newFilterState = { ...filterState, searchTerm: value }
    setFilterState(newFilterState)
    onSearch?.(newFilterState)
  }, [filterState, onSearch])

  const handleViewBug = useCallback((bug: BugReportExtended) => {
    setSelectedBugForView(bug)
    setViewModalOpen(true)
    if (onView) {
      onView(bug)
    }
  }, [onView])

  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false)
    setSelectedBugForView(null)
  }, [])

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Bug Reports
            </h3>
            <span className="text-sm text-gray-500">
              {filteredData.length} of {totalCount}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onExport}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-3 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search bugs..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

                 {/* Inline Filters */}
         <InlineFilters
           filterState={filterState}
           onFilterChange={handleFilterChange}
           reporters={reporters}
           bugCounts={bugCounts as any}
         />
      </div>

      {/* Compact Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Loading bug reports...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No bugs found matching your criteria</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-2 text-left"></th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bug
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="w-16 px-3 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {filteredData.map((bug, index) => {
                const isExpanded = expandedRows.has(bug.id)
                
                return (
                  <React.Fragment key={bug.id}>
                    <tr 
                      className="group hover:bg-blue-50 transition-colors border-b border-gray-100"
                    >
                      {/* Expand/Collapse Button */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => toggleRowExpansion(bug.id)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Bug Title & ID */}
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <button
                            onClick={() => toggleRowExpansion(bug.id)}
                            className="text-left text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {bug.title}
                          </button>
                          <span className="text-xs text-gray-500 font-mono">
                            #{bug.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <StatusBadge status={bug.status || 'open'} />
                      </td>

                      {/* Priority & Severity */}
                      <td className="px-3 py-2">
                        <PriorityIndicator 
                          priority={bug.priority || 'low'} 
                          severity={bug.severity || 'low'} 
                        />
                      </td>

                      {/* Reporter */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {bug.reporter_name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-500">
                          {bug.created_at ? formatUtils.formatDate(bug.created_at) : 'N/A'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewBug(bug)}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onEdit?.(bug)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete?.([bug.id])}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7}>
                          <ExpandedRowContent bug={bug} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Enhanced Bug Detail Modal */}
      <EnhancedBugDetailModal
        bug={selectedBugForView}
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        onEdit={onEdit}
      />
    </div>
  )
}