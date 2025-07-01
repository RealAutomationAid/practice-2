'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
  OnChangeFn
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  X,
  Plus,
  Calendar,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BugReportExtended, BatchOperation, SearchFilterState } from './types'
import { BugSeverity, BugPriority, BugStatus } from '@/lib/supabase-types'
import { formatUtils } from '@/lib/test-execution-utils'

interface AdvancedBugDataGridProps {
  data: BugReportExtended[]
  loading?: boolean
  totalCount?: number
  onRefresh?: () => void
  onEdit?: (bug: BugReportExtended) => void
  onDelete?: (bugIds: string[]) => void
  onExport?: () => void
  onBatchUpdate?: (operation: BatchOperation) => void
  onSearch?: (searchState: SearchFilterState) => void
  onPageChange?: (page: number, pageSize: number) => void
  enableVirtualScrolling?: boolean
  className?: string
}

interface EditingCell {
  rowId: string
  columnId: string
  value: any
}

// Enhanced Badge component with better styling
const Badge = ({ 
  value, 
  type,
  size = 'sm' 
}: { 
  value: string; 
  type: 'severity' | 'priority' | 'status';
  size?: 'xs' | 'sm' | 'md'
}) => {
  const getColorClass = () => {
    switch (type) {
      case 'severity':
        switch (value) {
          case 'low': return 'bg-green-100 text-green-800 border-green-200'
          case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
          case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
          case 'critical': return 'bg-red-100 text-red-800 border-red-200'
          default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
      case 'priority':
        switch (value) {
          case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
          case 'medium': return 'bg-purple-100 text-purple-800 border-purple-200'
          case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
          case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
          default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
      case 'status':
        switch (value) {
          case 'open': return 'bg-red-100 text-red-800 border-red-200'
          case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
          case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
          case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
          case 'duplicate': return 'bg-purple-100 text-purple-800 border-purple-200'
          default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const sizeClass = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  }[size]

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${getColorClass()} ${sizeClass}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

// Inline editable cell component
const EditableCell = ({
  value: initialValue,
  row,
  column,
  table,
  type = 'text'
}: {
  value: any
  row: any
  column: any
  table: any
  type?: 'text' | 'select'
}) => {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)

  const onBlur = () => {
    setIsEditing(false)
    table.options.meta?.updateData(row.index, column.id, value)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur()
    } else if (e.key === 'Escape') {
      setValue(initialValue)
      setIsEditing(false)
    }
  }

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  if (type === 'select') {
    const options = column.id === 'status' 
      ? ['open', 'in_progress', 'resolved', 'closed', 'duplicate']
      : column.id === 'severity'
      ? ['low', 'medium', 'high', 'critical']
      : ['low', 'medium', 'high', 'urgent']

    return isEditing ? (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option.replace('_', ' ')}
          </option>
        ))}
      </select>
    ) : (
      <div onClick={() => setIsEditing(true)} className="cursor-pointer">
        <Badge value={value} type={column.id as any} size="xs" />
      </div>
    )
  }

  return isEditing ? (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus
      className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  ) : (
    <div 
      onClick={() => setIsEditing(true)} 
      className="cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
      title="Click to edit"
    >
      {value || 'Click to edit'}
    </div>
  )
}

const columnHelper = createColumnHelper<BugReportExtended>()

export function AdvancedBugDataGrid({
  data,
  loading = false,
  totalCount = 0,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
  onBatchUpdate,
  onSearch,
  onPageChange,
  enableVirtualScrolling = true,
  className = ''
}: AdvancedBugDataGridProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  })

  // UI state
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  // Refs for virtual scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const debounceRef = useRef<NodeJS.Timeout>()
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setFilterState(prev => ({ ...prev, searchTerm: term }))
      onSearch?.({ ...filterState, searchTerm: term })
    }, 300)
  }, [filterState, onSearch])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Define columns with inline editing
  const columns = useMemo(
    () => [
      // Selection column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              ref={(el) => {
                if (el) el.indeterminate = table.getIsSomeRowsSelected()
              }}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false
      }),

      // ID column
      columnHelper.accessor('id', {
        header: 'ID',
        cell: info => (
          <span className="font-mono text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
            #{info.getValue().slice(0, 8)}
          </span>
        ),
        size: 100,
        enableColumnFilter: false
      }),

      // Title column (editable)
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <EditableCell
            value={info.getValue()}
            row={info.row}
            column={info.column}
            table={info.table}
            type="text"
          />
        ),
        size: 300
      }),

      // Status column (editable select)
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <EditableCell
            value={info.getValue() || 'open'}
            row={info.row}
            column={info.column}
            table={info.table}
            type="select"
          />
        ),
        size: 120
      }),

      // Severity column (editable select)
      columnHelper.accessor('severity', {
        header: 'Severity',
        cell: (info) => (
          <EditableCell
            value={info.getValue() || 'low'}
            row={info.row}
            column={info.column}
            table={info.table}
            type="select"
          />
        ),
        size: 120
      }),

      // Priority column (editable select)
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => (
          <EditableCell
            value={info.getValue() || 'low'}
            row={info.row}
            column={info.column}
            table={info.table}
            type="select"
          />
        ),
        size: 120
      }),

      // Reporter column
      columnHelper.accessor('reporter_name', {
        header: 'Reporter',
        cell: info => (
          <div className="text-gray-700 text-sm">
            {formatUtils.truncateText(info.getValue(), 20)}
          </div>
        ),
        size: 150
      }),

      // Environment column
      columnHelper.accessor('environment', {
        header: 'Environment',
        cell: info => (
          <span className="text-gray-600 text-sm px-2 py-1 bg-gray-100 rounded-md">
            {info.getValue() || 'N/A'}
          </span>
        ),
        size: 120
      }),

      // Created date column
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: info => (
          <div className="text-gray-600 text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatUtils.formatDate(info.getValue())}
          </div>
        ),
        size: 140,
        enableColumnFilter: false
      }),

      // Updated date column
      columnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: info => (
          <div className="text-gray-600 text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatUtils.formatRelativeTime(info.getValue())}
          </div>
        ),
        size: 120,
        enableColumnFilter: false
      }),

      // Attachments column
      columnHelper.accessor('attachment_count', {
        header: 'Files',
        cell: info => {
          const count = info.getValue() || 0
          return (
            <div className="flex items-center gap-1">
              <span className={`text-sm ${count > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {count}
              </span>
              {count > 0 && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          )
        },
        size: 80,
        enableColumnFilter: false
      }),

      // Actions column
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(row.original)}
              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.([row.original.id])}
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 100,
        enableSorting: false,
        enableHiding: false
      })
    ],
    [onEdit, onDelete]
  )

  // Table instance with meta for inline editing
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any) => {
        // Optimistic update
        const updatedBug = { ...data[rowIndex], [columnId]: value }
        // Trigger update callback
        onEdit?.(updatedBug)
      }
    },
    debugTable: false
  })

  // Virtual scrolling setup
  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52,
    overscan: 10,
    enabled: enableVirtualScrolling
  })

  // Get selected row IDs
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter(key => rowSelection[key])
      .map(index => data[parseInt(index)]?.id).filter(Boolean)
  }, [rowSelection, data])

  // Handle batch operations
  const handleBatchOperation = (type: BatchOperation['type'], value?: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one bug report')
      return
    }

    onBatchUpdate?.({
      type,
      value,
      selectedIds
    })
  }

  // Clear selection
  const clearSelection = () => {
    setRowSelection({})
  }

  // Handle pagination
  useEffect(() => {
    onPageChange?.(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, onPageChange])

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Enhanced Toolbar */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Bug Reports</h3>
            <span className="text-sm text-gray-500">
              {totalCount} total • {selectedIds.length} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-md transition-colors ${
                showAdvancedFilters 
                  ? 'text-blue-600 bg-blue-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className={`p-2 rounded-md transition-colors ${
                showColumnSettings 
                  ? 'text-blue-600 bg-blue-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Column Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search bugs..."
              />
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} bug{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => handleBatchOperation('update_status', e.target.value)}
                className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
                defaultValue=""
              >
                <option value="" disabled>Change Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                onChange={(e) => handleBatchOperation('update_severity', e.target.value)}
                className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
                defaultValue=""
              >
                <option value="" disabled>Change Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <button
                onClick={() => handleBatchOperation('delete')}
                className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>

              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div 
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ height: enableVirtualScrolling ? '600px' : 'auto' }}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronsUpDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enableVirtualScrolling ? (
              // Virtual scrolling rows
              <>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 whitespace-nowrap text-sm"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </>
            ) : (
              // Regular rows
              rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 whitespace-nowrap text-sm"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} of{' '}
            {totalCount} results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {[25, 50, 100, 200].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize} per page
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm px-2">
              {pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 