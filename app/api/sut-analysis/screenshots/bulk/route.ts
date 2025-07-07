import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase-types'
import JSZip from 'jszip'

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Download all screenshots as ZIP
export async function POST(request: NextRequest) {
  try {
    const { analysisId } = await request.json()
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 })
    }

    // Get analysis data with screenshots
    const { data: analysisData, error: fetchError } = await supabase
      .from('winners_sut_analysis')
      .select('name, screenshots')
      .eq('id', analysisId)
      .single()

    if (fetchError || !analysisData) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const screenshots = (analysisData.screenshots as any[]) || []
    
    if (screenshots.length === 0) {
      return NextResponse.json({ error: 'No screenshots available' }, { status: 404 })
    }

    // Create ZIP file
    const zip = new JSZip()
    const folder = zip.folder('screenshots')

    // Download and add each screenshot to ZIP
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i]
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('winners-test-assets')
          .download(screenshot.storage_path)

        if (downloadError) {
          console.error(`Failed to download ${screenshot.storage_path}:`, downloadError)
          continue
        }

        // Add to ZIP with meaningful filename
        const pageTitle = screenshot.page_title ? 
          screenshot.page_title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 
          `page-${i + 1}`
        
        const fileName = `${pageTitle}-screenshot.jpg`
        folder?.file(fileName, await fileData.arrayBuffer())

      } catch (error) {
        console.error(`Error processing screenshot ${screenshot.storage_path}:`, error)
        continue
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
    
    // Create response with ZIP file
    const analysisName = analysisData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const fileName = `${analysisName}-screenshots-${new Date().toISOString().split('T')[0]}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Bulk screenshot download error:', error)
    return NextResponse.json(
      { error: 'Failed to create screenshot archive' },
      { status: 500 }
    )
  }
}

// DELETE - Delete all screenshots for an analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysisId')
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 })
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

    const screenshots = (analysisData.screenshots as any[]) || []
    
    if (screenshots.length === 0) {
      return NextResponse.json({ message: 'No screenshots to delete' })
    }

    // Delete all files from storage
    const filePaths = screenshots.map(screenshot => screenshot.storage_path)
    const { error: storageError } = await supabase.storage
      .from('winners-test-assets')
      .remove(filePaths)

    if (storageError) {
      console.error('Failed to delete screenshots from storage:', storageError)
      return NextResponse.json({ error: 'Failed to delete screenshots from storage' }, { status: 500 })
    }

    // Clear screenshots array in database
    const { error: updateError } = await supabase
      .from('winners_sut_analysis')
      .update({
        screenshots: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)

    if (updateError) {
      console.error('Failed to update analysis record:', updateError)
      return NextResponse.json({ error: 'Failed to update analysis record' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${screenshots.length} screenshots` 
    })

  } catch (error) {
    console.error('Bulk screenshot deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete screenshots' },
      { status: 500 }
    )
  }
}