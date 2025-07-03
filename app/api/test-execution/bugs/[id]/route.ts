import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database, BugReportInsert, AttachmentInsert } from '@/lib/supabase-types'
import { fileUtils } from '@/lib/test-execution-utils'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dagnscrjrktrrspyamwu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ25zY3Jqcmt0cnJzcHlhbXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MzA4NTQsImV4cCI6MjA1NDAwNjg1NH0.UXEhZJmX3wWPNMEMaxoxU_G2o0EURgjW12nsTlNePJc'
)

interface RouteContext {
  params: {
    id: string
  }
}

// GET - Fetch single bug report by ID
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Bug ID is required' },
        { status: 400 }
      )
    }

    const { data: bug, error } = await supabase
      .from('winners_bug_reports')
      .select(`
        *,
        attachments:winners_attachments(id, file_name, file_type, file_size, storage_path)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching bug:', error)
      return NextResponse.json(
        { error: 'Bug not found', details: error.message },
        { status: 404 }
      )
    }

    // Transform data to include attachment URLs
    const bugWithAttachments = {
      ...bug,
      attachment_count: bug.attachments?.length || 0,
      attachment_urls: bug.attachments?.map((att: any) => 
        supabase.storage.from('winners-test-assets').getPublicUrl(att.storage_path).data.publicUrl
      ) || []
    }

    return NextResponse.json({ bug: bugWithAttachments })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update single bug report by ID
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Bug ID is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const bugDataJson = formData.get('bugData') as string
    
    if (!bugDataJson) {
      return NextResponse.json(
        { error: 'Bug data is required' },
        { status: 400 }
      )
    }

    const bugData: Partial<BugReportInsert> = JSON.parse(bugDataJson)

    // Update bug report
    const { data: bug, error: bugError } = await supabase
      .from('winners_bug_reports')
      .update({
        ...bugData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (bugError) {
      console.error('Error updating bug:', bugError)
      return NextResponse.json(
        { error: 'Failed to update bug report', details: bugError.message },
        { status: 500 }
      )
    }

    // Handle new file uploads
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

    // Fetch updated bug with all attachments
    const { data: updatedBug, error: fetchError } = await supabase
      .from('winners_bug_reports')
      .select(`
        *,
        attachments:winners_attachments(id, file_name, file_type, file_size, storage_path)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching updated bug:', fetchError)
      return NextResponse.json(
        { error: 'Bug updated but failed to fetch updated data' },
        { status: 200 }
      )
    }

    // Transform data to include attachment URLs
    const bugWithAttachments = {
      ...updatedBug,
      attachment_count: updatedBug.attachments?.length || 0,
      attachment_urls: updatedBug.attachments?.map((att: any) => 
        supabase.storage.from('winners-test-assets').getPublicUrl(att.storage_path).data.publicUrl
      ) || []
    }

    return NextResponse.json({
      bug: bugWithAttachments,
      newAttachments: uploadedAttachments
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete single bug report by ID
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Bug ID is required' },
        { status: 400 }
      )
    }

    // First, get storage paths for cleanup
    const { data: attachments } = await supabase
      .from('winners_attachments')
      .select('storage_path')
      .eq('bug_id', id)

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
      .eq('bug_id', id)

    if (attachmentError) {
      console.error('Error deleting attachments:', attachmentError)
      // Continue with bug deletion even if attachment deletion fails
    }

    // Delete bug
    const { error: bugError } = await supabase
      .from('winners_bug_reports')
      .delete()
      .eq('id', id)

    if (bugError) {
      console.error('Error deleting bug:', bugError)
      return NextResponse.json(
        { error: 'Failed to delete bug report', details: bugError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Bug report deleted successfully'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 