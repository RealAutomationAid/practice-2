'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AdvancedBugDataGrid } from './advanced-bug-data-grid'
import { AdvancedFilters } from './advanced-filters'
import { ColumnManager } from './column-manager'
import { BugReportExtended, BatchOperation, SearchFilterState } from './types'
import toast from 'react-hot-toast'

interface BugGridWrapperProps {
  onEdit?: (bug: BugReportExtended) => void
  className?: string
}

export function BugGridWrapper({ onEdit, className }: BugGridWrapperProps) {
  const [bugs, setBugs] = useState<BugReportExtended[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const fetchBugs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-execution/bugs')
      if (!response.ok) throw new Error('Failed to fetch bugs')
      
      const data = await response.json()
      setBugs(data.bugs || [])
      setTotalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to load bugs:', error)
      toast.error('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <AdvancedBugDataGrid
        data={bugs}
        loading={loading}
        totalCount={totalCount}
        onEdit={onEdit}
        onRefresh={fetchBugs}
      />
    </div>
  )
} 