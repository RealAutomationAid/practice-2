import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database, BugReportInsert, AttachmentInsert, BugStatus, BugSeverity, BugPriority } from '@/lib/supabase-types'
import { fileUtils } from '@/lib/test-execution-utils'

// Check if environment variables are properly set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dagnscrjrktrrspyamwu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ25zY3Jqcmt0cnJzcHlhbXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MzA4NTQsImV4cCI6MjA1NDAwNjg1NH0.UXEhZJmX3wWPNMEMaxoxU_G2o0EURgjW12nsTlNePJc'
)

interface BugQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: BugStatus[]
  severity?: BugSeverity[]
  priority?: BugPriority[]
  reporters?: string[]
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// GET - Fetch bug reports with advanced filtering, search, and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/test-execution/bugs called')
    
    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('winners_bug_reports')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Supabase connection test failed:', testError)
        return NextResponse.json(
          { error: 'Database connection failed', details: testError.message },
          { status: 500 }
        )
      }
      console.log('Supabase connection test successful')
    } catch (connectionError) {
      console.error('Supabase connection error:', connectionError)
      return NextResponse.json(
        { error: 'Database connection error', details: String(connectionError) },
        { status: 500 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '0')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    
    const params: BugQueryParams = {
      page,
      pageSize,
      search: search || undefined,
      status: searchParams.get('status')?.split(',').filter(Boolean) as BugStatus[] || [],
      severity: searchParams.get('severity')?.split(',').filter(Boolean) as BugSeverity[] || [],
      priority: searchParams.get('priority')?.split(',').filter(Boolean) as BugPriority[] || [],
      reporters: searchParams.get('reporters')?.split(',').filter(Boolean) || [],
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy,
      sortOrder
    }

    // Build the base query
    let query = supabase
      .from('winners_bug_reports')
      .select(`
        *,
        attachments:winners_attachments(id, file_name, file_type, file_size, storage_path)
      `, { count: 'exact' })

    // Apply search filter
    if (search && search.length > 0) {
      const searchTerm = `%${search}%`
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},reporter_name.ilike.${searchTerm},reporter_email.ilike.${searchTerm}`)
    }

    // Apply status filter
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status)
    }

    // Apply severity filter
    if (params.severity && params.severity.length > 0) {
      query = query.in('severity', params.severity)
    }

    // Apply priority filter
    if (params.priority && params.priority.length > 0) {
      query = query.in('priority', params.priority)
    }

    // Apply reporter filter
    if (params.reporters && params.reporters.length > 0) {
      query = query.in('reporter_name', params.reporters)
    }

    // Apply date range filter
    if (params.startDate) {
      query = query.gte('created_at', params.startDate)
    }
    if (params.endDate) {
      // Add one day to include the end date
      const endDate = new Date(params.endDate)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('created_at', endDate.toISOString())
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    const offset = page * pageSize
    query = query.range(offset, offset + pageSize - 1)

    console.log('Executing Supabase query...')
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching bugs:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch bug reports', details: error.message },
        { status: 500 }
      )
    }

    console.log('Query successful, found', data?.length || 0, 'bugs, total count:', count)

    // Transform data to include attachment count and URLs
    const bugsWithAttachments = data?.map(bug => ({
      ...bug,
      attachment_count: bug.attachments?.length || 0,
      attachment_urls: bug.attachments?.map((att: any) => 
        supabase.storage.from('winners-test-assets').getPublicUrl(att.storage_path).data.publicUrl
      ) || []
    })) || []

    // Get unique reporters for filter options
    const { data: reportersData } = await supabase
      .from('winners_bug_reports')
      .select('reporter_name')
      .not('reporter_name', 'is', null)

    const uniqueReporters = Array.from(new Set(reportersData?.map(r => r.reporter_name).filter(Boolean)))

    return NextResponse.json({
      bugs: bugsWithAttachments,
      pagination: {
        total: count || 0,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      },
      filters: {
        uniqueReporters: uniqueReporters.sort()
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new bug report with file uploads
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const bugDataJson = formData.get('bugData') as string
    
    if (!bugDataJson) {
      return NextResponse.json(
        { error: 'Bug data is required' },
        { status: 400 }
      )
    }

    const bugData: BugReportInsert = JSON.parse(bugDataJson)

    // No required field validation - allow all fields to be optional

    // Create bug report
    const { data: bug, error: bugError } = await supabase
      .from('winners_bug_reports')
      .insert({
        ...bugData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bugError) {
      console.error('Error creating bug:', bugError)
      return NextResponse.json(
        { error: 'Failed to create bug report', details: bugError.message },
        { status: 500 }
      )
    }

    // Handle file uploads
    const uploadedAttachments = []
    const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith('file_'))
    
    for (const key of fileKeys) {
      const file = formData.get(key) as File
      if (!file) continue

      // Validate file
      const validation = fileUtils.validateFile(file)
      if (!validation.valid) {
        console.warn(`Skipping invalid file ${file.name}: ${validation.error}`)
        continue
      }

      // Generate unique filename
      const fileName = fileUtils.generateFileName(file.name, bug.id)
      
      // Upload to Supabase storage
      const uploadResult = await fileUtils.uploadFile(file, fileName, bug.id)
      if (!uploadResult) {
        console.warn(`Failed to upload file ${file.name}`)
        continue
      }

      // Create attachment record
      const attachmentData: AttachmentInsert = {
        bug_id: bug.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: uploadResult.path,
        mime_type: file.type,
        uploaded_at: new Date().toISOString()
      }

      const attachmentId = await fileUtils.createAttachment(attachmentData)
      if (attachmentId) {
        uploadedAttachments.push({
          id: attachmentId,
          ...attachmentData,
          url: uploadResult.url
        })
      }
    }

    return NextResponse.json({
      bug: {
        ...bug,
        attachment_count: uploadedAttachments.length,
        attachment_urls: uploadedAttachments.map(att => att.url)
      },
      attachments: uploadedAttachments
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update bug reports (single or bulk)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, updates, type } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Bug IDs are required' },
        { status: 400 }
      )
    }

    if (!updates) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      )
    }

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Update bugs
    const { data, error } = await supabase
      .from('winners_bug_reports')
      .update(updateData)
      .in('id', ids)
      .select()

    if (error) {
      console.error('Error updating bugs:', error)
      return NextResponse.json(
        { error: 'Failed to update bug reports', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      updated: data?.length || 0,
      bugs: data
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete multiple bug reports
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Bug IDs are required' },
        { status: 400 }
      )
    }

    // First, get storage paths for cleanup
    const { data: attachments } = await supabase
      .from('winners_attachments')
      .select('storage_path')
      .in('bug_id', ids)

    // Delete attachments from storage
    if (attachments && attachments.length > 0) {
      const storagePaths = attachments.map(att => att.storage_path)
      const { error: storageError } = await supabase.storage
        .from('winners-test-assets')
        .remove(storagePaths)

      if (storageError) {
        console.warn('Error deleting files from storage:', storageError)
      }
    }

    // Delete attachment records
    const { error: attachmentError } = await supabase
      .from('winners_attachments')
      .delete()
      .in('bug_id', ids)

    if (attachmentError) {
      console.error('Error deleting attachments:', attachmentError)
      // Continue with bug deletion even if attachment deletion fails
    }

    // Delete bugs
    const { error: bugError, count } = await supabase
      .from('winners_bug_reports')
      .delete({ count: 'exact' })
      .in('id', ids)

    if (bugError) {
      console.error('Error deleting bugs:', bugError)
      return NextResponse.json(
        { error: 'Failed to delete bug reports', details: bugError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      deleted: count || 0,
      message: `Successfully deleted ${count || 0} bug report(s)`
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 