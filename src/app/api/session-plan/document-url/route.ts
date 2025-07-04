import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create admin client only if environment variables are available
const createSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

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
    const body = await request.json();

    // Temporary debugging for Make.com issue
    console.log('POST /api/session-plan/document-url received:', JSON.stringify(body, null, 2));

    // Try multiple possible field names that Make.com might send
    const sessionId = body.sessionId || body.session_id || body.sessionid;
    const documentUrl = body.documentUrl || body.document_url || body.documenturl || body.url;

    console.log('Extracted values:', { sessionId, documentUrl });

    // Validate required fields
    if (!sessionId || !documentUrl) {
      return NextResponse.json(
        { error: 'Missing sessionId or documentUrl', receivedData: body },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('session_plans')
      .update({
        document_edit_url: documentUrl,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update session plan' },
        { status: 500 }
      );
    }

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

    // Try multiple possible field names that Make.com might send
    const sessionId = body.sessionId || body.session_id || body.sessionid;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Clear the document URL from the session plan
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('session_plans')
      .update({
        document_edit_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to clear document URL' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document URL cleared successfully'
    });

  } catch (error) {
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



    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // Get the session plan with document URL
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('session_plans')
      .select('document_edit_url, updated_at')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Session plan not found' },
        { status: 404 }
      );
    }

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
