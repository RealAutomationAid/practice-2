import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase-types'
import { BatchOperation } from '@/components/test-execution/types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'placeholder-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)

// PATCH - Handle batch operations
export async function PATCH(request: NextRequest) {
  try {
    const operation: BatchOperation = await request.json()

    if (!operation.selectedIds || operation.selectedIds.length === 0) {
      return NextResponse.json(
        { error: 'No bug IDs selected' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    // Determine what to update based on operation type
    switch (operation.type) {
      case 'update_status':
        if (!operation.value) {
          return NextResponse.json(
            { error: 'Status value is required' },
            { status: 400 }
          )
        }
        updateData.status = operation.value
        break

      case 'update_severity':
        if (!operation.value) {
          return NextResponse.json(
            { error: 'Severity value is required' },
            { status: 400 }
          )
        }
        updateData.severity = operation.value
        break

      case 'update_priority':
        if (!operation.value) {
          return NextResponse.json(
            { error: 'Priority value is required' },
            { status: 400 }
          )
        }
        updateData.priority = operation.value
        break

      case 'assign':
        if (!operation.value) {
          return NextResponse.json(
            { error: 'Assignee value is required' },
            { status: 400 }
          )
        }
        updateData.assigned_to = operation.value
        break

      case 'delete':
        // Handle delete separately
        const { error: deleteError } = await supabase
          .from('winners_bug_reports')
          .delete()
          .in('id', operation.selectedIds)

        if (deleteError) {
          console.error('Batch delete error:', deleteError)
          return NextResponse.json(
            { error: 'Failed to delete bug reports' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: `${operation.selectedIds.length} bug report(s) deleted successfully`,
          affected_count: operation.selectedIds.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

    // Perform the update
    const { data, error } = await supabase
      .from('winners_bug_reports')
      .update(updateData)
      .in('id', operation.selectedIds)
      .select('id, title, status, severity, priority, assigned_to')

    if (error) {
      console.error('Batch update error:', error)
      return NextResponse.json(
        { error: 'Failed to update bug reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `${operation.selectedIds.length} bug report(s) updated successfully`,
      affected_count: operation.selectedIds.length,
      updated_bugs: data
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 