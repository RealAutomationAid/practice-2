import { NextRequest, NextResponse } from 'next/server';

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
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Test plan submitted successfully',
      data: webhookData 
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