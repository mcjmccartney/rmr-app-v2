import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST endpoint for Make.com to send back the document URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received document URL from Make.com:', body);

    const { sessionId, documentUrl } = body;

    // Validate required fields
    if (!sessionId || !documentUrl) {
      console.error('Missing required fields:', { sessionId, documentUrl });
      return NextResponse.json(
        { error: 'Missing sessionId or documentUrl' },
        { status: 400 }
      );
    }

    // Update the session plan with the document URL
    const { data, error } = await supabase
      .from('session_plans')
      .update({ 
        document_edit_url: documentUrl,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

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
    });

  } catch (error) {
    console.error('Error processing document URL webhook:', error);
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // Get the session plan with document URL
    const { data, error } = await supabase
      .from('session_plans')
      .select('document_edit_url')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session plan:', error);
      return NextResponse.json(
        { error: 'Session plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      documentUrl: data.document_edit_url || null
    });

  } catch (error) {
    console.error('Error fetching document URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
