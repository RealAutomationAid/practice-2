import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase-types';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE endpoint: Delete a test project by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    // First, get count of associated bug reports
    const { count: bugCount } = await supabase
      .from('winners_bug_reports')
      .select('*', { count: 'exact', head: true })
      .eq('test_project_id', id)

    // Update any bugs that reference this project to remove the association
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

    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully',
      updatedBugReports: bugCount || 0
    })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}