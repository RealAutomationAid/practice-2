// Supabase Database Types for Test Execution & Bug Reporting Module

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      winners_bug_reports: {
        Row: WinnersBugReport
        Insert: BugReportInsert
        Update: BugReportUpdate
      }
      winners_test_sessions: {
        Row: WinnersTestSession
        Insert: TestSessionInsert
        Update: TestSessionUpdate
      }
      winners_session_bugs: {
        Row: WinnersSessionBug
        Insert: SessionBugInsert
        Update: SessionBugUpdate
      }
      winners_attachments: {
        Row: WinnersAttachment
        Insert: AttachmentInsert
        Update: AttachmentUpdate
      }
      winners_test_projects: {
        Row: WinnersTestProject
        Insert: TestProjectInsert
        Update: TestProjectUpdate
      }
      winners_sut_analysis: {
        Row: WinnersSutAnalysis
        Insert: SutAnalysisInsert
        Update: SutAnalysisUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Test Execution & Bug Reporting Types
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical'
export type BugPriority = 'low' | 'medium' | 'high' | 'urgent'
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate'
export type TestSessionStatus = 'active' | 'completed' | 'paused'

// SUT Analysis Types
export type SutAnalysisStatus = 'pending' | 'crawling' | 'analyzing' | 'completed' | 'failed'

export interface WinnersBugReport {
  id: string
  title: string
  description?: string
  severity?: BugSeverity
  priority?: BugPriority
  status?: BugStatus
  reporter_name?: string
  reporter_email?: string
  assigned_to?: string
  environment?: string
  browser?: string
  device?: string
  os?: string
  url?: string
  steps_to_reproduce?: string[]
  expected_result?: string
  actual_result?: string
  attachments?: Json
  tags?: string[]
  test_project_id?: string
  created_at?: string
  updated_at?: string
  resolved_at?: string
}

export interface WinnersTestSession {
  id: string
  name: string
  description?: string
  test_type?: string
  environment?: string
  started_by?: string
  status?: TestSessionStatus
  created_at?: string
  completed_at?: string
}

export interface WinnersSessionBug {
  id: string
  session_id?: string
  bug_id?: string
  created_at?: string
}

export interface WinnersAttachment {
  id: string
  bug_id?: string
  file_name: string
  file_type: string
  file_size?: number
  storage_path: string
  mime_type?: string
  uploaded_at?: string
}

export interface WinnersTestProject {
  id: string
  name: string
  description?: string
  sut_analysis?: string
  test_plan?: string
  requirements?: string
  testing_types?: Json
  tools_frameworks?: string
  more_context?: string
  allocated_hours?: number
  number_of_test_cases?: number
  risk_matrix_generation?: boolean
  created_by_email?: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

export interface WinnersSutAnalysis {
  id: string
  name: string
  target_url: string
  login_url?: string
  username?: string
  password_encrypted?: string
  crawl_settings?: Json
  crawl_data?: Json
  ai_analysis?: Json
  screenshots?: Json
  status?: SutAnalysisStatus
  error_message?: string
  created_at?: string
  updated_at?: string
  created_by_email?: string
}

// Insert types for creating new records
export type BugReportInsert = Omit<WinnersBugReport, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type TestSessionInsert = Omit<WinnersTestSession, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type SessionBugInsert = Omit<WinnersSessionBug, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type AttachmentInsert = Omit<WinnersAttachment, 'id' | 'uploaded_at'> & {
  id?: string
  uploaded_at?: string
}

export type TestProjectInsert = Omit<WinnersTestProject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type SutAnalysisInsert = Omit<WinnersSutAnalysis, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

// Update types for updating existing records
export type BugReportUpdate = Partial<WinnersBugReport>
export type TestSessionUpdate = Partial<WinnersTestSession>
export type SessionBugUpdate = Partial<WinnersSessionBug>
export type AttachmentUpdate = Partial<WinnersAttachment>
export type TestProjectUpdate = Partial<WinnersTestProject>
export type SutAnalysisUpdate = Partial<WinnersSutAnalysis>

// Form data interfaces for UI components
export interface BugReportFormData {
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
  steps_to_reproduce: string[]
  expected_result: string
  actual_result: string
  tags: string[]
}

export interface TestSessionFormData {
  name: string
  description: string
  test_type: string
  environment: string
  started_by: string
}

// File upload types
export interface FileUpload {
  file: File
  preview?: string
}

export interface AttachmentData {
  file_name: string
  file_type: string
  file_size: number
  mime_type: string
  storage_path: string
}

// Constants for dropdowns and validation
export const BUG_SEVERITIES: BugSeverity[] = ['low', 'medium', 'high', 'critical']
export const BUG_PRIORITIES: BugPriority[] = ['low', 'medium', 'high', 'urgent']
export const BUG_STATUSES: BugStatus[] = ['open', 'in_progress', 'resolved', 'closed', 'duplicate']
export const TEST_SESSION_STATUSES: TestSessionStatus[] = ['active', 'completed', 'paused']
export const SUT_ANALYSIS_STATUSES: SutAnalysisStatus[] = ['pending', 'crawling', 'analyzing', 'completed', 'failed']

// Storage bucket configuration
export const STORAGE_BUCKET = 'winners-test-assets'
export const MAX_FILE_SIZE = 52428800 // 50MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/mov'
]

// Error types
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: SupabaseError
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  error?: SupabaseError
} 