import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase-types'

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Generate signed URL for screenshot viewing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')
    const download = searchParams.get('download') === 'true'
    
    if (!storagePath) {
      return NextResponse.json({ error: 'Storage path is required' }, { status: 400 })
    }

    const { data, error } = await supabase.storage
      .from('winners-test-assets')
      .createSignedUrl(storagePath, 3600, { // 1 hour expiry
        download: download ? `screenshot-${Date.now()}.jpg` : false
      })

    if (error) {
      console.error('Failed to create signed URL:', error)
      return NextResponse.json({ error: 'Failed to generate screenshot URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })

  } catch (error) {
    console.error('Screenshot URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate screenshot URL' },
      { status: 500 }
    )
  }
}

// DELETE - Delete individual screenshot
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')
    const analysisId = searchParams.get('analysisId')
    
    if (!storagePath || !analysisId) {
      return NextResponse.json({ error: 'Storage path and analysis ID are required' }, { status: 400 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('winners-test-assets')
      .remove([storagePath])

    if (storageError) {
      console.error('Failed to delete screenshot from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete screenshot from storage' }, { status: 500 })
    }

    // Get current analysis data
    const { data: analysisData, error: fetchError } = await supabase
      .from('winners_sut_analysis')
      .select('screenshots')
      .eq('id', analysisId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch analysis data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 })
    }

    // Remove screenshot from the screenshots array
    const screenshots = (analysisData.screenshots as any[]) || []
    const updatedScreenshots = screenshots.filter(screenshot => screenshot.storage_path !== storagePath)

    // Update the analysis record
    const { error: updateError } = await supabase
      .from('winners_sut_analysis')
      .update({
        screenshots: updatedScreenshots,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Failed to update analysis record:', updateError)
      return NextResponse.json({ error: 'Failed to update analysis record' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Screenshot deleted successfully' })

  } catch (error) {
    console.error('Screenshot deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete screenshot' },
      { status: 500 }
    )
  }
}