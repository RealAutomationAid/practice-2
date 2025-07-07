import { BugSeverity, BugPriority, BugStatus, WinnersBugReport, Json } from '@/lib/supabase-types'

// Test Project interface for dropdown selection
export interface TestProjectOption {
  id: string
  name: string
  description?: string
  created_at: string
  created_by_email?: string
  updated_at?: string
  sut_analysis?: string
  test_plan?: string
  requirements?: string
  more_context?: string
  testing_types?: Json
  tools_frameworks?: string
  allocated_hours?: number
  number_of_test_cases?: number
  risk_matrix_generation?: boolean
  is_active?: boolean
}

// Extended types for Test Execution module
export interface BugReportExtended extends WinnersBugReport {
  attachment_count?: number
  attachment_urls?: string[]
}

// Form validation schemas
export interface CreateBugFormData {
  title: string
  description: string
  severity: BugSeverity
  priority: BugPriority
  reporter_name: string
  reporter_email: string
  environment: string
  browser: string
  device: string
  os: string
  url: string
  steps_to_reproduce: string
  expected_result: string
  actual_result: string
  tags: string[]
  test_project_id?: string
  status: BugStatus
}

// File upload interfaces
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export interface ScreenshotPasteEvent {
  file: File
  timestamp: Date
}

// Data grid column definitions
export interface DataGridColumn {
  id: string
  label: string
  sortable: boolean
  filterable: boolean
  width?: number
  type: 'text' | 'date' | 'select' | 'number' | 'badge'
}

// Export options
export interface ExportOptions {
  format: 'csv' | 'excel'
  includeAttachments: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  statusFilter?: BugStatus[]
  severityFilter?: BugSeverity[]
}

// Summary report interfaces
export interface BugSummaryStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  by_severity: Record<BugSeverity, number>
  by_priority: Record<BugPriority, number>
  recent_activity: {
    created_today: number
    resolved_today: number
    created_this_week: number
    resolved_this_week: number
  }
}

export interface TestExecutionReport {
  summary: BugSummaryStats
  timeline: {
    date: string
    created: number
    resolved: number
  }[]
  top_reporters: {
    name: string
    count: number
  }[]
  environment_breakdown: Record<string, number>
  browser_breakdown: Record<string, number>
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: string
  description: string
}

// Notification types
export interface NotificationConfig {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Batch operations
export interface BatchOperation {
  type: 'update_status' | 'update_priority' | 'update_severity' | 'assign' | 'delete'
  value?: string
  selectedIds: string[]
}

// Search and filter state
export interface SearchFilterState {
  searchTerm: string
  statusFilter: BugStatus[]
  severityFilter: BugSeverity[]
  priorityFilter: BugPriority[]
  reporterFilter: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// Real-time subscription types
export interface RealtimeSubscription {
  channel: string
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  callback: (payload: any) => void
}

// Constants
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'n', ctrlKey: true, action: 'new_bug', description: 'Create new bug' },
  { key: 'e', ctrlKey: true, action: 'export', description: 'Export data' },
  { key: 'f', ctrlKey: true, action: 'search', description: 'Focus search' },
  { key: 'v', ctrlKey: true, action: 'paste_screenshot', description: 'Paste screenshot' },
  { key: 'Delete', action: 'delete_selected', description: 'Delete selected bugs' },
  { key: 'Escape', action: 'clear_selection', description: 'Clear selection' }
]

export const DEFAULT_COLUMNS: DataGridColumn[] = [
  { id: 'id', label: 'ID', sortable: true, filterable: false, width: 80, type: 'text' },
  { id: 'title', label: 'Title', sortable: true, filterable: true, width: 300, type: 'text' },
  { id: 'severity', label: 'Severity', sortable: true, filterable: true, width: 120, type: 'badge' },
  { id: 'priority', label: 'Priority', sortable: true, filterable: true, width: 120, type: 'badge' },
  { id: 'status', label: 'Status', sortable: true, filterable: true, width: 120, type: 'badge' },
  { id: 'reporter_name', label: 'Reporter', sortable: true, filterable: true, width: 150, type: 'text' },
  { id: 'environment', label: 'Environment', sortable: true, filterable: true, width: 120, type: 'text' },
  { id: 'created_at', label: 'Created', sortable: true, filterable: false, width: 120, type: 'date' },
  { id: 'updated_at', label: 'Updated', sortable: true, filterable: false, width: 120, type: 'date' }
] 