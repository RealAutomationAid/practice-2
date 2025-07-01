import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Test database connection and environment variables
export async function GET(request: NextRequest) {
  try {
    console.log('Testing environment variables...')
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dagnscrjrktrrspyamwu.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ25zY3Jqcmt0cnJzcHlhbXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MzA4NTQsImV4cCI6MjA1NDAwNjg1NH0.UXEhZJmX3wWPNMEMaxoxU_G2o0EURgjW12nsTlNePJc'
    
    console.log('Using Supabase URL:', supabaseUrl)
    console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    console.log('Testing basic Supabase connection...')
    const { data, error } = await supabase.from('winners_bug_reports').select('count').limit(1)
    
    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        env_vars: {
          url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }
    
    console.log('Supabase connection successful!')
    
    // Test table existence
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_names')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data_count: data?.length || 0,
      env_vars: {
        url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      using_key_type: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'
    })
    
  } catch (error) {
    console.error('Test DB API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: String(error),
      env_vars: {
        url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anon_key_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }, { status: 500 })
  }
} 