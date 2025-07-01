import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = 'https://dagnscrjrktrrspyamwu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ25zY3Jqcmt0cnJzcHlhbXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MzA4NTQsImV4cCI6MjA1NDAwNjg1NH0.UXEhZJmX3wWPNMEMaxoxU_G2o0EURgjW12nsTlNePJc'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Storage helper functions
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)
  
  return { data, error }
}

export const getPublicUrl = (bucket: string, filePath: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export const deleteFile = async (bucket: string, filePath: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath])
  
  return { data, error }
}

// Test Execution & Bug Reporting API functions
export const bugReportApi = {
  // Get all bug reports with optional filtering
  getAll: async (filters?: {
    status?: string
    severity?: string
    assigned_to?: string
    limit?: number
    offset?: number
  }) => {
    let query = supabase
      .from('winners_bug_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    return await query
  },

  // Get single bug report by ID
  getById: async (id: string) => {
    return await supabase
      .from('winners_bug_reports')
      .select('*')
      .eq('id', id)
      .single()
  },

  // Create new bug report
  create: async (bugReport: any) => {
    return await supabase
      .from('winners_bug_reports')
      .insert(bugReport)
      .select()
      .single()
  },

  // Update bug report
  update: async (id: string, updates: any) => {
    return await supabase
      .from('winners_bug_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  },

  // Delete bug report
  delete: async (id: string) => {
    return await supabase
      .from('winners_bug_reports')
      .delete()
      .eq('id', id)
  }
}

export const testSessionApi = {
  // Get all test sessions
  getAll: async (filters?: {
    status?: string
    started_by?: string
    limit?: number
    offset?: number
  }) => {
    let query = supabase
      .from('winners_test_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.started_by) {
      query = query.eq('started_by', filters.started_by)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    return await query
  },

  // Get single test session by ID
  getById: async (id: string) => {
    return await supabase
      .from('winners_test_sessions')
      .select('*')
      .eq('id', id)
      .single()
  },

  // Create new test session
  create: async (session: any) => {
    return await supabase
      .from('winners_test_sessions')
      .insert(session)
      .select()
      .single()
  },

  // Update test session
  update: async (id: string, updates: any) => {
    return await supabase
      .from('winners_test_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  },

  // Delete test session
  delete: async (id: string) => {
    return await supabase
      .from('winners_test_sessions')
      .delete()
      .eq('id', id)
  },

  // Get bugs associated with a test session
  getBugs: async (sessionId: string) => {
    return await supabase
      .from('winners_session_bugs')
      .select(`
        *,
        winners_bug_reports (*)
      `)
      .eq('session_id', sessionId)
  },

  // Associate bug with test session
  addBug: async (sessionId: string, bugId: string) => {
    return await supabase
      .from('winners_session_bugs')
      .insert({ session_id: sessionId, bug_id: bugId })
      .select()
      .single()
  },

  // Remove bug from test session
  removeBug: async (sessionId: string, bugId: string) => {
    return await supabase
      .from('winners_session_bugs')
      .delete()
      .eq('session_id', sessionId)
      .eq('bug_id', bugId)
  }
}

export const attachmentApi = {
  // Get attachments for a bug report
  getByBugId: async (bugId: string) => {
    return await supabase
      .from('winners_attachments')
      .select('*')
      .eq('bug_id', bugId)
      .order('uploaded_at', { ascending: false })
  },

  // Create new attachment record
  create: async (attachment: any) => {
    return await supabase
      .from('winners_attachments')
      .insert(attachment)
      .select()
      .single()
  },

  // Delete attachment
  delete: async (id: string) => {
    return await supabase
      .from('winners_attachments')
      .delete()
      .eq('id', id)
  }
} 