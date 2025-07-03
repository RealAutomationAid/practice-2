import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database, TestProjectInsert } from '@/lib/supabase-types';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Log the request for debugging
    console.log('Received test plan submission:', body);
    
    // Forward the request to the webhook
    const webhookResponse = await fetch('https://sava.automationaid.eu/webhook/805ea6cc-10cf-432c-a718-1c74739e93c1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Check if the webhook request was successful
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', webhookResponse.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Webhook request failed',
          status: webhookResponse.status,
          message: errorText || 'Unknown error'
        },
        { status: webhookResponse.status }
      );
    }
    
    // Get the response from the webhook
    const webhookData = await webhookResponse.text();
    console.log('Webhook response:', webhookData);
    
    // Store test project in database after successful webhook
    let testProjectId = null;
    try {
      // Generate project name from subject and timestamp
      const subject = body.subject || 'Test Plan';
      const timestamp = new Date().toLocaleDateString('en-US');
      const projectName = `${subject} - ${timestamp}`;
      
      const testProjectData: TestProjectInsert = {
        name: projectName,
        description: body.description || null,
        sut_analysis: body.sutAnalysis || null,
        test_plan: body.testPlan || null,
        requirements: body.requirements || null,
        testing_types: body.testingTypes ? JSON.stringify(body.testingTypes) : null,
        tools_frameworks: body.toolsFrameworks || null,
        more_context: body.moreContext || null,
        allocated_hours: body.allocatedHours ? parseInt(body.allocatedHours) : undefined,
        number_of_test_cases: body.numberOfTestCases ? parseInt(body.numberOfTestCases) : undefined,
        risk_matrix_generation: body.riskMatrixGeneration || false,
        created_by_email: body.email || null,
        is_active: true
      };
      
      const { data: testProject, error: dbError } = await supabase
        .from('winners_test_projects')
        .insert(testProjectData)
        .select('id')
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request if database storage fails
      } else {
        testProjectId = testProject?.id;
        console.log('Test project created with ID:', testProjectId);
      }
    } catch (dbError) {
      console.error('Failed to store test project:', dbError);
      // Don't fail the request if database storage fails
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Test plan submitted successfully',
      data: webhookData,
      testProjectId
    });
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { 
            error: 'Network error',
            message: 'Failed to connect to the webhook server. Please check your internet connection and try again.'
          },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Server error',
          message: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Unknown error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 