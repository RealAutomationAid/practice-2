import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user identifier from headers (same logic as in run route)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userIdentifier = `ip-${clientIP.split(',')[0]}-${userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`
    
    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    console.log('Fetching audit history for user:', userIdentifier)

    // Fetch audit reports from database
    const { data: reports, error } = await supabase
      .from('winners_audit_reports')
      .select('*')
      .eq('user_identifier', userIdentifier)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch audit history' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const auditReports = reports.map(report => ({
      ...report.report_data,
      id: report.id,
      databaseId: report.id,
      aiAnalysis: report.ai_analysis,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }))

    return NextResponse.json({ reports: auditReports, total: reports.length })
    
  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}