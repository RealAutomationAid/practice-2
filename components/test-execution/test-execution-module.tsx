'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { 
  Plus, 
  RefreshCw, 
  Download, 
  BarChart3, 
  Settings,
  FileText,
  Bug
} from 'lucide-react'
import { QuickBugForm } from './quick-bug-form'
import { EnhancedBugForm } from './enhanced-bug-form'
import { SimpleBugGrid } from './simple-bug-grid'
import { AIBugChat } from './ai-bug-chat'
import { HTMLBugReport } from './html-bug-report'
import { CreateBugFormData, BugReportExtended, BatchOperation, ExportOptions } from './types'
import { WinnersBugReport, BugReportInsert } from '@/lib/supabase-types'
import { exportUtils, realtimeUtils, keyboardUtils } from '@/lib/test-execution-utils'

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = [
  { key: 'n', ctrlKey: true, shiftKey: false, altKey: false, action: 'new_bug', description: 'Create new bug' },
  { key: 'e', ctrlKey: true, shiftKey: false, altKey: false, action: 'export', description: 'Export data' },
  { key: 'r', ctrlKey: true, shiftKey: false, altKey: false, action: 'refresh', description: 'Refresh data' },
  { key: 'Escape', ctrlKey: false, shiftKey: false, altKey: false, action: 'close', description: 'Close dialogs' }
]

interface TestExecutionModuleProps {
  initialData?: BugReportExtended[]
}

export function TestExecutionModule({ initialData = [] }: TestExecutionModuleProps) {
  const [bugs, setBugs] = useState<BugReportExtended[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBug, setEditingBug] = useState<BugReportExtended | null>(null)
  const [selectedBug, setSelectedBug] = useState<BugReportExtended | null>(null)
  const [showSummaryReport, setShowSummaryReport] = useState(false)

  // Load bugs from API
  const loadBugs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-execution/bugs')
      if (!response.ok) throw new Error('Failed to fetch bugs')
      
      const data = await response.json()
      setBugs(data.bugs || [])
    } catch (error) {
      console.error('Failed to load bugs:', error)
      toast.error('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (initialData.length === 0) {
      loadBugs()
    }
  }, [initialData.length, loadBugs])

  // Setup real-time subscriptions
  useEffect(() => {
    const unsubscribeBugs = realtimeUtils.subscribeToBugReports((payload) => {
      console.log('Real-time update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setBugs(prev => [payload.new, ...prev])
        toast.success('New bug report added')
      } else if (payload.eventType === 'UPDATE') {
        setBugs(prev => prev.map(bug => 
          bug.id === payload.new.id ? { ...bug, ...payload.new } : bug
        ))
        toast.success('Bug report updated')
      } else if (payload.eventType === 'DELETE') {
        setBugs(prev => prev.filter(bug => bug.id !== payload.old.id))
        toast.success('Bug report deleted')
      }
    })

    return () => {
      unsubscribeBugs()
    }
  }, [])

  // Setup global keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        shortcut: { key: 'n', ctrlKey: true },
        handler: () => setShowCreateForm(true)
      },
      {
        shortcut: { key: 'e', ctrlKey: true },
        handler: handleExport
      },
      {
        shortcut: { key: 'r', ctrlKey: true },
        handler: loadBugs
      },
      {
        shortcut: { key: 'Escape' },
        handler: () => {
          setShowCreateForm(false)
          setEditingBug(null)
          setSelectedBug(null)
          setShowSummaryReport(false)
        }
      }
    ]

    const cleanup = keyboardUtils.setupGlobalShortcuts(shortcuts)
    return cleanup
  }, [loadBugs])

  // Handle create bug
  const handleCreateBug = async (formData: CreateBugFormData, files: File[]) => {
    try {
      setLoading(true)

      // Prepare bug data
      const bugData: BugReportInsert = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        priority: formData.priority,
        reporter_name: formData.reporter_name,
        reporter_email: formData.reporter_email,
        environment: formData.environment,
        browser: formData.browser,
        device: formData.device,
        os: formData.os,
        url: formData.url,
        steps_to_reproduce: formData.steps_to_reproduce ? [formData.steps_to_reproduce] : [],
        expected_result: formData.expected_result,
        actual_result: formData.actual_result,
        tags: formData.tags,
        status: 'open'
      }

      // Create FormData for file uploads
      const submitData = new FormData()
      submitData.append('bugData', JSON.stringify(bugData))
      
      files.forEach((file, index) => {
        submitData.append(`file_${index}`, file)
      })

      const response = await fetch('/api/test-execution/bugs', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create bug report')
      }

      const result = await response.json()
      
      // Add new bug to state (real-time subscription will also handle this)
      setBugs(prev => [result.bug, ...prev])
      setShowCreateForm(false)
      
      toast.success('Bug report created successfully!')
    } catch (error) {
      console.error('Failed to create bug:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create bug report')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit bug
  const handleEditBug = (bug: BugReportExtended) => {
    setEditingBug(bug)
    setShowCreateForm(true)
  }

  // Handle update bug
  const handleUpdateBug = async (formData: CreateBugFormData, files: File[]) => {
    if (!editingBug) return

    try {
      setLoading(true)

      // Prepare bug data
      const bugData = {
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        priority: formData.priority,
        reporter_name: formData.reporter_name,
        reporter_email: formData.reporter_email,
        environment: formData.environment,
        browser: formData.browser,
        device: formData.device,
        os: formData.os,
        url: formData.url,
        steps_to_reproduce: formData.steps_to_reproduce ? [formData.steps_to_reproduce] : [],
        expected_result: formData.expected_result,
        actual_result: formData.actual_result,
        tags: formData.tags
      }

      // Create FormData for file uploads
      const submitData = new FormData()
      submitData.append('bugData', JSON.stringify(bugData))
      
      files.forEach((file, index) => {
        submitData.append(`file_${index}`, file)
      })

      const response = await fetch(`/api/test-execution/bugs/${editingBug.id}`, {
        method: 'PUT',
        body: submitData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update bug report')
      }

      const result = await response.json()
      
      // Update bug in state
      setBugs(prev => prev.map(bug => 
        bug.id === editingBug.id ? result.bug : bug
      ))
      
      setShowCreateForm(false)
      setEditingBug(null)
      
      toast.success('Bug report updated successfully!')
    } catch (error) {
      console.error('Failed to update bug:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update bug report')
    } finally {
      setLoading(false)
    }
  }

  // Handle AI bug created
  const handleAIBugCreated = (bugId: string) => {
    // Refresh the bug list to show the new bug
    loadBugs()
  }

  // Handle delete bugs
  const handleDeleteBugs = async (bugIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${bugIds.length} bug report(s)?`)) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/test-execution/bugs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: bugIds })
      })

      if (!response.ok) {
        throw new Error('Failed to delete bug reports')
      }

      // Remove deleted bugs from state
      setBugs(prev => prev.filter(bug => !bugIds.includes(bug.id)))
      toast.success(`${bugIds.length} bug report(s) deleted`)
    } catch (error) {
      console.error('Failed to delete bugs:', error)
      toast.error('Failed to delete bug reports')
    } finally {
      setLoading(false)
    }
  }

  // Handle batch update
  const handleBatchUpdate = async (operation: BatchOperation) => {
    try {
      setLoading(true)

      const response = await fetch('/api/test-execution/bugs/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(operation)
      })

      if (!response.ok) {
        throw new Error('Failed to update bug reports')
      }

      // Refresh data to get updated records
      await loadBugs()
      toast.success(`${operation.selectedIds.length} bug report(s) updated`)
    } catch (error) {
      console.error('Failed to update bugs:', error)
      toast.error('Failed to update bug reports')
    } finally {
      setLoading(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const options: ExportOptions = {
        format: 'csv',
        includeAttachments: false
      }

      const csvContent = await exportUtils.exportBugsToCSV(bugs, options)
      const filename = exportUtils.generateExportFilename('bug-reports')
      
      exportUtils.downloadCSV(csvContent, filename)
      toast.success('Bug reports exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export bug reports')
    }
  }

  // Get summary statistics
  const getSummaryStats = () => {
    const total = bugs.length
    const open = bugs.filter(bug => bug.status === 'open').length
    const inProgress = bugs.filter(bug => bug.status === 'in_progress').length
    const resolved = bugs.filter(bug => bug.status === 'resolved').length
    const closed = bugs.filter(bug => bug.status === 'closed').length

    return { total, open, inProgress, resolved, closed }
  }

  const stats = getSummaryStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />

      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Bug className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Execution Dashboard</h1>
                <p className="text-sm text-gray-600">Bug reporting and tracking system</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Summary Stats */}
              <div className="hidden lg:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.open}</div>
                  <div className="text-gray-600">Open</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                  <div className="text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                  <div className="text-gray-600">Resolved</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSummaryReport(!showSummaryReport)}
                  className={`hidden sm:inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium ${
                    showSummaryReport 
                      ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showSummaryReport ? 'Hide Reports' : 'Reports'}
                </button>

                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Bug</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
              <EnhancedBugForm
                onSubmit={editingBug ? handleUpdateBug : handleCreateBug}
                isLoading={loading}
                onCancel={() => {
                  setShowCreateForm(false)
                  setEditingBug(null)
                  setSelectedBug(null)
                }}
                editingBug={editingBug}
                mode={editingBug ? 'edit' : 'create'}
              />
            </div>
          </div>
        )}

        {/* Reports Section */}
        {showSummaryReport && (
          <div className="mb-8">
            <HTMLBugReport bugs={bugs} />
          </div>
        )}

        {/* Data Grid */}
        <div className="space-y-6">
          <SimpleBugGrid
            onEdit={handleEditBug}
          />
        </div>

        {/* AI Bug Chat Interface */}
        <div className="mt-8">
          <AIBugChat 
            onBugCreated={handleAIBugCreated}
            className="max-w-4xl mx-auto"
          />
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            {KEYBOARD_SHORTCUTS.map(shortcut => (
              <div key={shortcut.action} className="flex items-center justify-between">
                <span>{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {shortcut.ctrlKey && 'Ctrl+'}
                  {shortcut.shiftKey && 'Shift+'}
                  {shortcut.altKey && 'Alt+'}
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 