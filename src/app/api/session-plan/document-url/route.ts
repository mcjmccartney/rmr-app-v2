import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  const allowedOrigins = [
    'https://raising-my-rescue.vercel.app',
    'https://hook.eu1.make.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://hook.eu1.make.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// POST endpoint for Make.com to send back the document URL
export async function POST(request: NextRequest) {
  try {
    // Log the raw request details
    console.log('POST request received at document-url endpoint');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    const body = await request.json();
    console.log('Received document URL from Make.com:', body);
    console.log('Body type:', typeof body);
    console.log('Body keys:', Object.keys(body));

    // Try multiple possible field names that Make.com might send
    const sessionId = body.sessionId || body.session_id || body.sessionid;
    const documentUrl = body.documentUrl || body.document_url || body.documenturl || body.url;

    console.log('Extracted values:', { sessionId, documentUrl });
    console.log('Original body for reference:', body);

    // Validate required fields
    if (!sessionId || !documentUrl) {
      console.error('Missing required fields:', { sessionId, documentUrl });
      console.error('Available body properties:', Object.keys(body));
      return NextResponse.json(
        { error: 'Missing sessionId or documentUrl', receivedData: body },
        { status: 400 }
      );
    }

    // Update the session plan with the document URL
    console.log('Attempting to update session plan with:', {
      sessionId,
      documentUrl,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('session_plans')
      .update({
        document_edit_url: documentUrl,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    console.log('Supabase update result:', { data, error });

    if (error) {
      console.error('Error updating session plan with document URL:', error);
      return NextResponse.json(
        { error: 'Failed to update session plan' },
        { status: 500 }
      );
    }

    console.log('Successfully updated session plan with document URL:', data);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document URL saved successfully',
      sessionPlanId: data.id,
      documentUrl: documentUrl
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hook.eu1.make.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error processing document URL webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear document URL for regeneration
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Clearing document URL for session:', body);

    const { sessionId } = body;

    // Validate required fields
    if (!sessionId) {
      console.error('Missing sessionId for document URL deletion');
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Clear the document URL from the session plan
    const { data, error } = await supabase
      .from('session_plans')
      .update({
        document_edit_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error clearing document URL from session plan:', error);
      return NextResponse.json(
        { error: 'Failed to clear document URL' },
        { status: 500 }
      );
    }

    console.log('Successfully cleared document URL from session plan:', data);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document URL cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing document URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve document URL for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const timestamp = searchParams.get('t'); // Cache busting parameter

    console.log(`GET request for session ${sessionId} at ${new Date().toISOString()}`);
    if (timestamp) {
      console.log(`Cache busting timestamp: ${timestamp}`);
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // Get the session plan with document URL
    const { data, error } = await supabase
      .from('session_plans')
      .select('document_edit_url, updated_at')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session plan:', error);
      return NextResponse.json(
        { error: 'Session plan not found' },
        { status: 404 }
      );
    }

    console.log(`Retrieved document URL: ${data.document_edit_url}`);
    console.log(`Last updated: ${data.updated_at}`);

    return NextResponse.json({
      documentUrl: data.document_edit_url || null,
      lastUpdated: data.updated_at
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching document URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
