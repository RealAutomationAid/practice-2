'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AdvancedBugDataGrid } from './advanced-bug-data-grid'
import { AdvancedFilters } from './advanced-filters'
import { ColumnManager } from './column-manager'
import { BugReportExtended, BatchOperation, SearchFilterState } from './types'
import { BugSeverity, BugPriority, BugStatus } from '@/lib/supabase-types'
import toast from 'react-hot-toast'

interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  width: number
  order: number
  canHide: boolean
}

interface BugDataGridWrapperProps {
  className?: string
  enableVirtualScrolling?: boolean
  onEdit?: (bug: BugReportExtended) => void
  onBugCreated?: () => void
}

interface BugResponse {
  bugs: BugReportExtended[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: {
    uniqueReporters: string[]
  }
}

export function BugDataGridWrapper({
  className = '',
  enableVirtualScrolling = true,
  onEdit,
  onBugCreated
}: BugDataGridWrapperProps) {
  // Data state
  const [bugs, setBugs] = useState<BugReportExtended[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [uniqueReporters, setUniqueReporters] = useState<string[]>([])

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)

  // Filter state with cache
  const [filterState, setFilterState] = useState<SearchFilterState>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bugGrid_filterState')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            ...parsed,
            dateRange: {
              start: parsed.dateRange?.start ? new Date(parsed.dateRange.start) : null,
              end: parsed.dateRange?.end ? new Date(parsed.dateRange.end) : null
            }
          }
        } catch (e) {
          console.warn('Failed to parse saved filter state:', e)
        }
      }
    }
    return {
      searchTerm: '',
      statusFilter: [],
      severityFilter: [],
      priorityFilter: [],
      reporterFilter: [],
      dateRange: { start: null, end: null },
      sortBy: 'created_at',
      sortOrder: 'desc'
    }
  })

  // Column configuration with cache
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bugGrid_columnConfig')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse saved column config:', e)
        }
      }
    }
    return [
      { id: 'select', label: 'Select', visible: true, width: 50, order: 0, canHide: false },
      { id: 'id', label: 'ID', visible: true, width: 100, order: 1, canHide: true },
      { id: 'title', label: 'Title', visible: true, width: 300, order: 2, canHide: false },
      { id: 'status', label: 'Status', visible: true, width: 120, order: 3, canHide: true },
      { id: 'severity', label: 'Severity', visible: true, width: 120, order: 4, canHide: true },
      { id: 'priority', label: 'Priority', visible: true, width: 120, order: 5, canHide: true },
      { id: 'reporter_name', label: 'Reporter', visible: true, width: 150, order: 6, canHide: true },
      { id: 'environment', label: 'Environment', visible: true, width: 120, order: 7, canHide: true },
      { id: 'created_at', label: 'Created', visible: true, width: 140, order: 8, canHide: true },
      { id: 'updated_at', label: 'Updated', visible: true, width: 120, order: 9, canHide: true },
      { id: 'attachment_count', label: 'Files', visible: true, width: 80, order: 10, canHide: true },
      { id: 'actions', label: 'Actions', visible: true, width: 100, order: 11, canHide: false }
    ]
  })

  // Cache filter state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugGrid_filterState', JSON.stringify(filterState))
    }
  }, [filterState])

  // Cache column config to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugGrid_columnConfig', JSON.stringify(columnConfig))
    }
  }, [columnConfig])

  // Fetch bugs from API
  const fetchBugs = useCallback(async (
    page: number = currentPage,
    size: number = pageSize,
    filters: SearchFilterState = filterState
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      // Add filters to params
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm)
      }
      if (filters.statusFilter.length > 0) {
        params.append('status', filters.statusFilter.join(','))
      }
      if (filters.severityFilter.length > 0) {
        params.append('severity', filters.severityFilter.join(','))
      }
      if (filters.priorityFilter.length > 0) {
        params.append('priority', filters.priorityFilter.join(','))
      }
      if (filters.reporterFilter.length > 0) {
        params.append('reporters', filters.reporterFilter.join(','))
      }
      if (filters.dateRange.start) {
        params.append('startDate', filters.dateRange.start.toISOString().split('T')[0])
      }
      if (filters.dateRange.end) {
        params.append('endDate', filters.dateRange.end.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/test-execution/bugs?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: BugResponse = await response.json()
      
      setBugs(data.bugs)
      setTotalCount(data.pagination.total)
      setCurrentPage(data.pagination.page)
      setPageSize(data.pagination.pageSize)
      setUniqueReporters(data.filters.uniqueReporters)
      
    } catch (error) {
      console.error('Failed to fetch bugs:', error)
      toast.error('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filterState])

  // Initial load
  useEffect(() => {
    fetchBugs()
  }, [])

  // Handle search and filter changes with debouncing
  const handleSearchFilterChange = useCallback((newFilterState: SearchFilterState) => {
    setFilterState(newFilterState)
    setCurrentPage(0) // Reset to first page
    fetchBugs(0, pageSize, newFilterState)
  }, [pageSize, fetchBugs])

  // Handle page changes
  const handlePageChange = useCallback((page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
    fetchBugs(page, size)
  }, [fetchBugs])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchBugs()
  }, [fetchBugs])

  // Handle bulk operations
  const handleBatchUpdate = useCallback(async (operation: BatchOperation) => {
    if (!operation.selectedIds.length) return

    setLoading(true)
    try {
      let updates: any = {}
      
      switch (operation.type) {
        case 'update_status':
          updates.status = operation.value
          break
        case 'update_severity':
          updates.severity = operation.value
          break
        case 'update_priority':
          updates.priority = operation.value
          break
        case 'delete':
          const deleteResponse = await fetch('/api/test-execution/bugs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: operation.selectedIds })
          })
          
          if (!deleteResponse.ok) {
            throw new Error('Failed to delete bugs')
          }
          
          toast.success(`Deleted ${operation.selectedIds.length} bug(s) successfully`)
          await fetchBugs()
          return
        default:
          throw new Error(`Unsupported operation: ${operation.type}`)
      }

      // For update operations
      const updateResponse = await fetch('/api/test-execution/bugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: operation.selectedIds,
          updates
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update bugs')
      }

      toast.success(`Updated ${operation.selectedIds.length} bug(s) successfully`)
      await fetchBugs()
      
    } catch (error) {
      console.error('Batch operation failed:', error)
      toast.error(`Failed to ${operation.type.replace('_', ' ')} bugs`)
    } finally {
      setLoading(false)
    }
  }, [fetchBugs])

  // Handle single bug delete
  const handleDelete = useCallback(async (bugIds: string[]) => {
    await handleBatchUpdate({
      type: 'delete',
      selectedIds: bugIds
    })
  }, [handleBatchUpdate])

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      // Create CSV content
      const headers = columnConfig
        .filter(col => col.visible && col.id !== 'select' && col.id !== 'actions')
        .sort((a, b) => a.order - b.order)
        .map(col => col.label)

      const csvContent = [
        headers.join(','),
        ...bugs.map(bug => {
          return columnConfig
            .filter(col => col.visible && col.id !== 'select' && col.id !== 'actions')
            .sort((a, b) => a.order - b.order)
            .map(col => {
              const value = bug[col.id as keyof BugReportExtended]
              return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || ''
            })
            .join(',')
        })
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bug-reports-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Bug reports exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export bug reports')
    }
  }, [bugs, columnConfig])

  // Handle column configuration changes
  const handleColumnConfigChange = useCallback((config: ColumnConfig[]) => {
    setColumnConfig(config)
    toast.success('Column settings updated')
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Advanced Filters Overlay */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <AdvancedFilters
              filterState={filterState}
              onFilterChange={handleSearchFilterChange}
              onClose={() => setShowAdvancedFilters(false)}
              reporters={uniqueReporters}
            />
          </div>
        </div>
      )}

      {/* Column Manager Overlay */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <ColumnManager
              columns={columnConfig}
              onColumnConfigChange={handleColumnConfigChange}
              onClose={() => setShowColumnManager(false)}
            />
          </div>
        </div>
      )}

      {/* Main Data Grid */}
      <AdvancedBugDataGrid
        data={bugs}
        loading={loading}
        totalCount={totalCount}
        onRefresh={handleRefresh}
        onEdit={onEdit}
        onDelete={handleDelete}
        onExport={handleExport}
        onBatchUpdate={handleBatchUpdate}
        onSearch={handleSearchFilterChange}
        onPageChange={handlePageChange}
        enableVirtualScrolling={enableVirtualScrolling}
        className={className}
      />
    </div>
  )
} 