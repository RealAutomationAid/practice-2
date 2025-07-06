import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase-types';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET endpoint: Return all active test projects
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (id) {
      // Return specific project by id
      const { data: project, error } = await supabase
        .from('winners_test_projects')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, data: [project] })
    }
    // Return all active projects
    const { data: testProjects, error } = await supabase
      .from('winners_test_projects')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to fetch test projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: testProjects || [],
      count: testProjects?.length || 0
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Server error', message: 'An unexpected error occurred while fetching test projects' },
      { status: 500 }
    )
  }
}



// POST endpoint: Create a new test project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Only allow certain fields
    const insertData = {
      name: body.name,
      description: body.description,
      sut_analysis: body.sut_analysis,
      test_plan: body.test_plan,
      requirements: body.requirements,
      testing_types: body.testing_types,
      tools_frameworks: body.tools_frameworks,
      more_context: body.more_context,
      allocated_hours: body.allocated_hours,
      number_of_test_cases: body.number_of_test_cases,
      risk_matrix_generation: body.risk_matrix_generation,
      created_by_email: body.created_by_email,
      is_active: body.is_active !== false, // default to true
      created_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('winners_test_projects')
      .insert([insertData])
      .select('*')
      .single()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

// PUT endpoint: Update an existing test project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Project id is required' }, { status: 400 })
    }
    const updateData = { ...body, updated_at: new Date().toISOString() }
    delete updateData.id // id is used for .eq, not update
    const { data, error } = await supabase
      .from('winners_test_projects')
      .update(updateData)
      .eq('id', body.id)
      .select('*')
      .single()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE endpoint: Delete a test project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    // First, update any bugs that reference this project to remove the association
    const { error: bugUpdateError } = await supabase
      .from('winners_bug_reports')
      .update({ test_project_id: null })
      .eq('test_project_id', id)

    if (bugUpdateError) {
      console.error('Error updating bug reports:', bugUpdateError)
      return NextResponse.json({ success: false, error: 'Failed to update associated bug reports' }, { status: 500 })
    }

    // Then delete the project
    const { error: deleteError } = await supabase
      .from('winners_test_projects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
} 