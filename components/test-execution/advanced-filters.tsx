'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  User,
  Filter,
  RotateCcw,
  Search
} from 'lucide-react'
import { SearchFilterState } from './types'
import { BugSeverity, BugPriority, BugStatus } from '@/lib/supabase-types'

interface AdvancedFiltersProps {
  filterState: SearchFilterState
  onFilterChange: (filterState: SearchFilterState) => void
  onClose: () => void
  reporters?: string[]
  className?: string
}

interface DateRangeInputProps {
  label: string
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
}

const DateRangeInput = ({ label, startDate, endDate, onChange }: DateRangeInputProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(
              e.target.value ? new Date(e.target.value) : null,
              endDate
            )}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start date"
          />
        </div>
        <div>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(
              startDate,
              e.target.value ? new Date(e.target.value) : null
            )}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  )
}

interface MultiSelectProps {
  label: string
  options: { value: string; label: string; color?: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

const MultiSelect = ({ label, options, selectedValues, onChange, placeholder }: MultiSelectProps) => {
  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  const getBadgeColor = (value: string, color?: string) => {
    if (color) return color
    
    // Default colors based on common values
    switch (value) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-2">
        {options.map(option => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleValue(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(option.value, option.color)}`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {selectedValues.length > 0 && (
        <div className="mt-2">
          <span className="text-xs text-gray-500">
            {selectedValues.length} selected
          </span>
        </div>
      )}
    </div>
  )
}

export function AdvancedFilters({
  filterState,
  onFilterChange,
  onClose,
  reporters = [],
  className = ''
}: AdvancedFiltersProps) {
  const [localFilterState, setLocalFilterState] = useState<SearchFilterState>(filterState)

  useEffect(() => {
    setLocalFilterState(filterState)
  }, [filterState])

  const handleApplyFilters = () => {
    onFilterChange(localFilterState)
  }

  const handleResetFilters = () => {
    const resetState: SearchFilterState = {
      searchTerm: '',
      statusFilter: [],
      severityFilter: [],
      priorityFilter: [],
      reporterFilter: [],
      dateRange: { start: null, end: null },
      sortBy: 'created_at',
      sortOrder: 'desc'
    }
    setLocalFilterState(resetState)
    onFilterChange(resetState)
  }

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'duplicate', label: 'Duplicate' }
  ]

  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const reporterOptions = reporters.map(reporter => ({
    value: reporter,
    label: reporter
  }))

  const hasActiveFilters = 
    localFilterState.statusFilter.length > 0 ||
    localFilterState.severityFilter.length > 0 ||
    localFilterState.priorityFilter.length > 0 ||
    localFilterState.reporterFilter.length > 0 ||
    localFilterState.dateRange.start ||
    localFilterState.dateRange.end

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Filter */}
          <MultiSelect
            label="Status"
            options={statusOptions}
            selectedValues={localFilterState.statusFilter}
            onChange={(values) =>
              setLocalFilterState(prev => ({ ...prev, statusFilter: values as BugStatus[] }))
            }
          />

          {/* Severity Filter */}
          <MultiSelect
            label="Severity"
            options={severityOptions}
            selectedValues={localFilterState.severityFilter}
            onChange={(values) =>
              setLocalFilterState(prev => ({ ...prev, severityFilter: values as BugSeverity[] }))
            }
          />

          {/* Priority Filter */}
          <MultiSelect
            label="Priority"
            options={priorityOptions}
            selectedValues={localFilterState.priorityFilter}
            onChange={(values) =>
              setLocalFilterState(prev => ({ ...prev, priorityFilter: values as BugPriority[] }))
            }
          />

          {/* Reporter Filter */}
          {reporterOptions.length > 0 && (
            <MultiSelect
              label="Reporter"
              options={reporterOptions}
              selectedValues={localFilterState.reporterFilter}
              onChange={(values) =>
                setLocalFilterState(prev => ({ ...prev, reporterFilter: values }))
              }
            />
          )}

          {/* Date Range Filter */}
          <div className="md:col-span-2">
            <DateRangeInput
              label="Date Range"
              startDate={localFilterState.dateRange.start}
              endDate={localFilterState.dateRange.end}
              onChange={(start, end) =>
                setLocalFilterState(prev => ({
                  ...prev,
                  dateRange: { start, end }
                }))
              }
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sort Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Sort By</label>
              <select
                value={localFilterState.sortBy}
                onChange={(e) =>
                  setLocalFilterState(prev => ({ ...prev, sortBy: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Created Date</option>
                <option value="updated_at">Updated Date</option>
                <option value="title">Title</option>
                <option value="severity">Severity</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="reporter_name">Reporter</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Order</label>
              <select
                value={localFilterState.sortOrder}
                onChange={(e) =>
                  setLocalFilterState(prev => ({ 
                    ...prev, 
                    sortOrder: e.target.value as 'asc' | 'desc' 
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
} 