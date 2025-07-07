import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase-types'

// Initialize Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Fetch specific SUT analysis by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const { data, error } = await supabase
      .from('winners_sut_analysis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'SUT analysis not found' },
          { status: 404 }
        )
      }
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sanitize password
    const sanitizedData = {
      ...data,
      password_encrypted: data.password_encrypted ? '********' : null
    }

    return NextResponse.json({ data: sanitizedData })

  } catch (error) {
    console.error('GET SUT Analysis by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SUT analysis' },
      { status: 500 }
    )
  }
}

// PUT - Update specific SUT analysis by ID
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const updateData = await request.json()

    // Remove id from update data
    delete updateData.id

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('winners_sut_analysis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'SUT analysis not found' },
          { status: 404 }
        )
      }
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sanitize password
    const sanitizedData = {
      ...data,
      password_encrypted: data.password_encrypted ? '********' : null
    }

    return NextResponse.json({ data: sanitizedData })

  } catch (error) {
    console.error('PUT SUT Analysis by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to update SUT analysis' },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific SUT analysis by ID
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    // Get analysis data to clean up storage
    const { data: analysisData } = await supabase
      .from('winners_sut_analysis')
      .select('screenshots')
      .eq('id', id)
      .single()

    // Delete screenshots from storage
    if (analysisData?.screenshots) {
      const screenshots = analysisData.screenshots as any[]
      for (const screenshot of screenshots) {
        if (screenshot.storage_path) {
          try {
            await supabase.storage
              .from('winners-test-assets')
              .remove([screenshot.storage_path])
          } catch (storageError) {
            console.error('Failed to delete screenshot:', storageError)
          }
        }
      }
    }

    // Delete analysis record
    const { error } = await supabase
      .from('winners_sut_analysis')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'SUT analysis not found' },
          { status: 404 }
        )
      }
      console.error('Supabase deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'SUT analysis deleted successfully' 
    })

  } catch (error) {
    console.error('DELETE SUT Analysis by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to delete SUT analysis' },
      { status: 500 }
    )
  }
}