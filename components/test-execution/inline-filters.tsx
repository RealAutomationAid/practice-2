'use client'

import React, { useState, useCallback } from 'react'
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { SearchFilterState } from './types'

interface InlineFiltersProps {
  filterState: SearchFilterState
  onFilterChange: (filterState: SearchFilterState) => void
  reporters?: string[]
  bugCounts?: {
    total: number
    open: number
    in_progress: number
    resolved: number
    closed: number
    critical: number
    high: number
    medium: number
    low: number
    urgent: number
  }
  className?: string
}

interface FilterChipProps {
  label: string
  count?: number
  active: boolean
  removable?: boolean
  onClick: () => void
  onRemove?: () => void
  variant?: 'default' | 'status' | 'priority' | 'severity'
  icon?: React.ReactNode
}

const FilterChip = ({ 
  label, 
  count, 
  active, 
  removable = false,
  onClick, 
  onRemove,
  variant = 'default',
  icon
}: FilterChipProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'status':
        return active 
          ? 'bg-blue-100 text-blue-800 border-blue-300' 
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      case 'priority':
        return active 
          ? 'bg-orange-100 text-orange-800 border-orange-300' 
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      case 'severity':
        return active 
          ? 'bg-red-100 text-red-800 border-red-300' 
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      default:
        return active 
          ? 'bg-blue-100 text-blue-800 border-blue-300' 
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border transition-colors ${getVariantStyles()}`}>
      {icon && <span className="w-3 h-3">{icon}</span>}
      <button onClick={onClick} className="flex items-center gap-1">
        {label}
        {count !== undefined && (
          <span className={`ml-1 px-1 rounded text-xs ${
            active ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-600'
          }`}>
            {count}
          </span>
        )}
      </button>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

const QuickFilterSection = ({ 
  title, 
  filters, 
  activeFilters, 
  onToggle,
  variant 
}: {
  title: string
  filters: Array<{ key: string; label: string; count?: number; icon?: React.ReactNode }>
  activeFilters: string[]
  onToggle: (key: string) => void
  variant: FilterChipProps['variant']
}) => (
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{title}:</span>
    {filters.map(filter => (
      <FilterChip
        key={filter.key}
        label={filter.label}
        count={filter.count}
        active={activeFilters.includes(filter.key)}
        onClick={() => onToggle(filter.key)}
        variant={variant}
        icon={filter.icon}
      />
    ))}
  </div>
)

const ActiveFiltersBar = ({ 
  filterState, 
  onRemoveFilter, 
  onClearAll 
}: {
  filterState: SearchFilterState
  onRemoveFilter: (type: string, value: string) => void
  onClearAll: () => void
}) => {
  const activeFilters = []

  // Collect all active filters
  filterState.statusFilter.forEach(status => 
    activeFilters.push({ type: 'status', value: status, label: `Status: ${status}` })
  )
  filterState.severityFilter.forEach(severity => 
    activeFilters.push({ type: 'severity', value: severity, label: `Severity: ${severity}` })
  )
  filterState.priorityFilter.forEach(priority => 
    activeFilters.push({ type: 'priority', value: priority, label: `Priority: ${priority}` })
  )
  filterState.reporterFilter.forEach(reporter => 
    activeFilters.push({ type: 'reporter', value: reporter, label: `Reporter: ${reporter}` })
  )

  if (filterState.dateRange.start || filterState.dateRange.end) {
    const start = filterState.dateRange.start?.toLocaleDateString() || ''
    const end = filterState.dateRange.end?.toLocaleDateString() || ''
    activeFilters.push({ 
      type: 'dateRange', 
      value: 'dateRange', 
      label: `Date: ${start} - ${end}` 
    })
  }

  if (activeFilters.length === 0) return null

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
      <span className="text-xs font-medium text-blue-700">Active filters:</span>
      <div className="flex items-center gap-1 flex-wrap">
        {activeFilters.map((filter, index) => (
          <FilterChip
            key={`${filter.type}-${filter.value}-${index}`}
            label={filter.label}
            active={true}
            removable={true}
            onClick={() => {}}
            onRemove={() => onRemoveFilter(filter.type, filter.value)}
          />
        ))}
      </div>
      <button
        onClick={onClearAll}
        className="ml-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Clear all
      </button>
    </div>
  )
}

const AdvancedFilterPanel = ({ 
  filterState, 
  onFilterChange, 
  reporters = [] 
}: {
  filterState: SearchFilterState
  onFilterChange: (state: SearchFilterState) => void
  reporters: string[]
}) => {
  const updateFilter = (updates: Partial<SearchFilterState>) => {
    onFilterChange({ ...filterState, ...updates })
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
          <div className="space-y-2">
            <input
              type="date"
              value={filterState.dateRange.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter({
                dateRange: {
                  ...filterState.dateRange,
                  start: e.target.value ? new Date(e.target.value) : null
                }
              })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filterState.dateRange.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateFilter({
                dateRange: {
                  ...filterState.dateRange,
                  end: e.target.value ? new Date(e.target.value) : null
                }
              })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Reporters */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reporters</label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {reporters.map(reporter => (
              <label key={reporter} className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={filterState.reporterFilter.includes(reporter)}
                  onChange={(e) => {
                    const newReporters = e.target.checked
                      ? [...filterState.reporterFilter, reporter]
                      : filterState.reporterFilter.filter(r => r !== reporter)
                    updateFilter({ reporterFilter: newReporters })
                  }}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 truncate">{reporter}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
          <div className="space-y-2">
            <select
              value={filterState.sortBy}
              onChange={(e) => updateFilter({ sortBy: e.target.value as any })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
            </select>
            <select
              value={filterState.sortOrder}
              onChange={(e) => updateFilter({ sortOrder: e.target.value as 'asc' | 'desc' })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InlineFilters({
  filterState,
  onFilterChange,
  reporters = [],
  bugCounts,
  className = ''
}: InlineFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleToggleFilter = useCallback((type: keyof SearchFilterState, value: string) => {
    const currentArray = filterState[type] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    onFilterChange({
      ...filterState,
      [type]: newArray
    })
  }, [filterState, onFilterChange])

  const handleRemoveFilter = useCallback((type: string, value: string) => {
    if (type === 'dateRange') {
      onFilterChange({
        ...filterState,
        dateRange: { start: null, end: null }
      })
    } else {
      const currentArray = filterState[type as keyof SearchFilterState] as string[]
      onFilterChange({
        ...filterState,
        [type]: currentArray.filter(item => item !== value)
      })
    }
  }, [filterState, onFilterChange])

  const handleClearAll = useCallback(() => {
    onFilterChange({
      searchTerm: '',
      statusFilter: [],
      severityFilter: [],
      priorityFilter: [],
      reporterFilter: [],
      dateRange: { start: null, end: null },
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }, [onFilterChange])

  const statusFilters = [
    { key: 'open', label: 'Open', count: bugCounts?.open, icon: <Circle className="w-3 h-3" /> },
    { key: 'in_progress', label: 'In Progress', count: bugCounts?.in_progress, icon: <Clock className="w-3 h-3" /> },
    { key: 'resolved', label: 'Resolved', count: bugCounts?.resolved, icon: <CheckCircle className="w-3 h-3" /> },
    { key: 'closed', label: 'Closed', count: bugCounts?.closed, icon: <CheckCircle className="w-3 h-3" /> }
  ]

  const priorityFilters = [
    { key: 'urgent', label: 'Urgent', count: bugCounts?.urgent, icon: <ArrowUp className="w-3 h-3 text-red-500" /> },
    { key: 'high', label: 'High', count: bugCounts?.high, icon: <ArrowUp className="w-3 h-3 text-orange-500" /> },
    { key: 'medium', label: 'Medium', count: bugCounts?.medium, icon: <Minus className="w-3 h-3 text-yellow-500" /> },
    { key: 'low', label: 'Low', count: bugCounts?.low, icon: <ArrowDown className="w-3 h-3 text-green-500" /> }
  ]

  const severityFilters = [
    { key: 'critical', label: 'Critical', count: bugCounts?.critical, icon: <AlertTriangle className="w-3 h-3 text-red-500" /> },
    { key: 'high', label: 'High', count: bugCounts?.high, icon: <AlertTriangle className="w-3 h-3 text-orange-500" /> },
    { key: 'medium', label: 'Medium', count: bugCounts?.medium, icon: <AlertTriangle className="w-3 h-3 text-yellow-500" /> },
    { key: 'low', label: 'Low', count: bugCounts?.low, icon: <AlertTriangle className="w-3 h-3 text-green-500" /> }
  ]

  const hasActiveFilters = 
    filterState.statusFilter.length > 0 ||
    filterState.severityFilter.length > 0 ||
    filterState.priorityFilter.length > 0 ||
    filterState.reporterFilter.length > 0 ||
    filterState.dateRange.start ||
    filterState.dateRange.end

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quick Filters */}
      <div className="space-y-2">
        <QuickFilterSection
          title="Status"
          filters={statusFilters}
          activeFilters={filterState.statusFilter}
          onToggle={(key) => handleToggleFilter('statusFilter', key)}
          variant="status"
        />
        
        <QuickFilterSection
          title="Priority"
          filters={priorityFilters}
          activeFilters={filterState.priorityFilter}
          onToggle={(key) => handleToggleFilter('priorityFilter', key)}
          variant="priority"
        />
        
        <QuickFilterSection
          title="Severity"
          filters={severityFilters}
          activeFilters={filterState.severityFilter}
          onToggle={(key) => handleToggleFilter('severityFilter', key)}
          variant="severity"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Filter className="w-3 h-3" />
          Advanced Filters
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Active Filters Bar */}
      <ActiveFiltersBar
        filterState={filterState}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <AdvancedFilterPanel
          filterState={filterState}
          onFilterChange={onFilterChange}
          reporters={reporters}
        />
      )}
    </div>
  )
} 