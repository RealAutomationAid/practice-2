import { createClient } from '@supabase/supabase-js'
import { Database, WinnersBugReport, AttachmentInsert } from '@/lib/supabase-types'
import { BugReportExtended, ExportOptions, BugSummaryStats, TestExecutionReport } from '@/components/test-execution/types'
import * as Papa from 'papaparse'

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'placeholder-url',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
)

// Clipboard utilities
export const clipboardUtils = {
  // Check if clipboard contains image data
  async hasImageData(): Promise<boolean> {
    try {
      const clipboardItems = await navigator.clipboard.read()
      return clipboardItems.some(item => 
        item.types.some(type => type.startsWith('image/'))
      )
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      return false
    }
  },

  // Get image from clipboard
  async getImageFromClipboard(): Promise<File | null> {
    try {
      const clipboardItems = await navigator.clipboard.read()
      
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            return new File([blob], `screenshot-${timestamp}.${type.split('/')[1]}`, { type })
          }
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get image from clipboard:', error)
      return null
    }
  },

  // Listen for paste events
  setupPasteListener(callback: (file: File) => void): () => void {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const itemsArray = Array.from(items)
      for (const item of itemsArray) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const file = new File([blob], `screenshot-${timestamp}.${item.type.split('/')[1]}`, { 
              type: item.type 
            })
            callback(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }
}

// File upload utilities
export const fileUtils = {
  // Validate file type and size
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov',
      'application/pdf', 'text/plain', 'application/json'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' }
    }

    return { valid: true }
  },

  // Generate unique file name
  generateFileName(originalName: string, bugId?: string): string {
    const timestamp = Date.now()
    const extension = originalName.split('.').pop()
    const name = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-')
    const prefix = bugId ? `bug-${bugId}` : 'attachment'
    return `${prefix}-${name}-${timestamp}.${extension}`
  },

  // Upload file to Supabase storage
  async uploadFile(file: File, fileName: string, bugId: string): Promise<{ url: string; path: string } | null> {
    try {
      const filePath = `bug-attachments/${bugId}/${fileName}`
      
      const { data, error } = await supabase.storage
        .from('winners-test-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('winners-test-assets')
        .getPublicUrl(filePath)

      return { url: publicUrl, path: filePath }
    } catch (error) {
      console.error('File upload failed:', error)
      return null
    }
  },

  // Create attachment record
  async createAttachment(attachmentData: AttachmentInsert): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('winners_attachments')
        .insert(attachmentData)
        .select('id')
        .single()

      if (error) {
        console.error('Attachment creation error:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Failed to create attachment record:', error)
      return null
    }
  }
}

// CSV Export utilities
export const exportUtils = {
  // Convert bug reports to CSV
  async exportBugsToCSV(bugs: BugReportExtended[], options: ExportOptions): Promise<string> {
    const processedBugs = bugs.map(bug => ({
      ID: bug.id,
      Title: bug.title,
      Description: bug.description || '',
      Severity: bug.severity || '',
      Priority: bug.priority || '',
      Status: bug.status || '',
      Reporter: bug.reporter_name || '',
      'Reporter Email': bug.reporter_email || '',
      Environment: bug.environment || '',
      Browser: bug.browser || '',
      Device: bug.device || '',
      OS: bug.os || '',
      URL: bug.url || '',
      'Steps to Reproduce': Array.isArray(bug.steps_to_reproduce) 
        ? bug.steps_to_reproduce.join('; ') 
        : bug.steps_to_reproduce || '',
      'Expected Result': bug.expected_result || '',
      'Actual Result': bug.actual_result || '',
      Tags: Array.isArray(bug.tags) ? bug.tags.join(', ') : '',
      'Created At': bug.created_at || '',
      'Updated At': bug.updated_at || '',
      'Resolved At': bug.resolved_at || '',
      'Attachment Count': bug.attachment_count || 0
    }))

    return Papa.unparse(processedBugs)
  },

  // Download CSV file
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  },

  // Generate export filename
  generateExportFilename(prefix: string = 'bug-reports'): string {
    const timestamp = new Date().toISOString().split('T')[0]
    return `${prefix}-${timestamp}.csv`
  }
}

// Date and formatting utilities
export const formatUtils = {
  // Format date for display
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A'
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString))
    } catch {
      return 'Invalid Date'
    }
  },

  // Format relative time
  formatRelativeTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
      
      return this.formatDate(dateString)
    } catch {
      return 'Invalid Date'
    }
  },

  // Truncate text
  truncateText(text: string | undefined, length: number = 50): string {
    if (!text) return ''
    return text.length > length ? `${text.substring(0, length)}...` : text
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Search and filter utilities
export const searchUtils = {
  // Filter bugs based on search criteria
  filterBugs(bugs: BugReportExtended[], searchTerm: string): BugReportExtended[] {
    if (!searchTerm.trim()) return bugs

    const term = searchTerm.toLowerCase()
    return bugs.filter(bug =>
      bug.title?.toLowerCase().includes(term) ||
      bug.description?.toLowerCase().includes(term) ||
      bug.reporter_name?.toLowerCase().includes(term) ||
      bug.reporter_email?.toLowerCase().includes(term) ||
      bug.environment?.toLowerCase().includes(term) ||
      bug.browser?.toLowerCase().includes(term) ||
      bug.id.toLowerCase().includes(term)
    )
  },

  // Debounce function for search
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }) as T
  }
}

// Keyboard shortcut utilities
export const keyboardUtils = {
  // Check if keyboard shortcut matches
  matchesShortcut(event: KeyboardEvent, shortcut: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.altKey === !!shortcut.altKey
    )
  },

  // Setup global keyboard shortcuts
  setupGlobalShortcuts(shortcuts: Array<{ shortcut: any; handler: () => void }>): () => void {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const { shortcut, handler } of shortcuts) {
        if (this.matchesShortcut(event, shortcut)) {
          event.preventDefault()
          handler()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }
}

// Real-time subscription utilities
export const realtimeUtils = {
  // Subscribe to bug report changes
  subscribeToBugReports(callback: (payload: any) => void) {
    const channel = supabase
      .channel('bug-reports')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'winners_bug_reports' },
        callback
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  },

  // Subscribe to attachment changes
  subscribeToAttachments(callback: (payload: any) => void) {
    const channel = supabase
      .channel('attachments')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'winners_attachments' },
        callback
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }
} 