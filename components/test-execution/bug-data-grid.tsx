'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  RowSelectionState
} from '@tanstack/react-table'
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
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BugReportExtended, BatchOperation, SearchFilterState } from './types'
import { BugSeverity, BugPriority, BugStatus } from '@/lib/supabase-types'
import { formatUtils } from '@/lib/test-execution-utils'

interface BugDataGridProps {
  data: BugReportExtended[]
  loading?: boolean
  onRefresh?: () => void
  onEdit?: (bug: BugReportExtended) => void
  onDelete?: (bugIds: string[]) => void
  onExport?: () => void
  onBatchUpdate?: (operation: BatchOperation) => void
}

const columnHelper = createColumnHelper<BugReportExtended>()

// Badge component for status/severity/priority
const Badge = ({ 
  value, 
  type 
}: { 
  value: string; 
  type: 'severity' | 'priority' | 'status' 
}) => {
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
          case 'duplicate': return 'bg-purple-100 text-purple-800'
          default: return 'bg-gray-100 text-gray-800'
        }
    }
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getColorClass()}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

export function BugDataGrid({
  data,
  loading = false,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
  onBatchUpdate
}: BugDataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  // Define columns
  const columns = useMemo(
    () => [
      // Selection column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center">
            <button
              onClick={table.getToggleAllRowsSelectedHandler()}
              className="p-1"
            >
              {table.getIsAllRowsSelected() ? (
                <CheckSquare className="w-4 h-4" />
              ) : table.getIsSomeRowsSelected() ? (
                <CheckSquare className="w-4 h-4 opacity-50" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <button
              onClick={row.getToggleSelectedHandler()}
              className="p-1"
            >
              {row.getIsSelected() ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </div>
        ),
        size: 50
      }),

      // ID column
      columnHelper.accessor('id', {
        header: 'ID',
        cell: info => (
          <span className="font-mono text-xs">
            {info.getValue().slice(0, 8)}...
          </span>
        ),
        size: 100
      }),

      // Title column
      columnHelper.accessor('title', {
        header: 'Title',
        cell: info => (
          <div className="max-w-xs">
            <span className="font-medium text-gray-900 line-clamp-2">
              {info.getValue()}
            </span>
          </div>
        ),
        size: 300
      }),

      // Severity column
      columnHelper.accessor('severity', {
        header: 'Severity',
        cell: info => <Badge value={info.getValue() || 'low'} type="severity" />,
        size: 120
      }),

      // Priority column
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: info => <Badge value={info.getValue() || 'low'} type="priority" />,
        size: 120
      }),

      // Status column
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => <Badge value={info.getValue() || 'open'} type="status" />,
        size: 120
      }),

      // Reporter column
      columnHelper.accessor('reporter_name', {
        header: 'Reporter',
        cell: info => (
          <span className="text-gray-700">
            {formatUtils.truncateText(info.getValue(), 20)}
          </span>
        ),
        size: 150
      }),

      // Environment column
      columnHelper.accessor('environment', {
        header: 'Environment',
        cell: info => (
          <span className="text-gray-600 text-sm">
            {info.getValue() || 'N/A'}
          </span>
        ),
        size: 120
      }),

      // Created date column
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: info => (
          <span className="text-gray-600 text-sm">
            {formatUtils.formatDate(info.getValue())}
          </span>
        ),
        size: 140
      }),

      // Updated date column
      columnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: info => (
          <span className="text-gray-600 text-sm">
            {formatUtils.formatRelativeTime(info.getValue())}
          </span>
        ),
        size: 120
      }),

      // Attachments column
      columnHelper.accessor('attachment_count', {
        header: 'Files',
        cell: info => (
          <span className="text-gray-600 text-sm">
            {info.getValue() || 0}
          </span>
        ),
        size: 80
      }),

      // Actions column
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(row.original)}
              className="p-1 text-gray-600 hover:text-blue-600"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.([row.original.id])}
              className="p-1 text-gray-600 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 100
      })
    ],
    [onEdit, onDelete]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false
  })

  // Get selected row IDs
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter(key => rowSelection[key])
  }, [rowSelection])

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

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Bug Reports</h3>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search bugs..."
              />
            </div>
          </div>

          {/* Column visibility toggle */}
          <div className="relative">
            <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <EyeOff className="w-4 h-4 mr-2" />
              Columns
            </button>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} selected
            </span>
            
            <div className="flex items-center gap-2 ml-4">
              <select
                onChange={(e) => handleBatchOperation('update_status', e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
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
                className="text-sm border border-gray-300 rounded px-2 py-1"
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
                className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                Delete Selected
              </button>

              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 ${
                  row.getIsSelected() ? 'bg-blue-50' : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-900"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {table.getRowModel().rows.length} of {data.length} results
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
} 