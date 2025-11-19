import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch the active version (public endpoint for clients)
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: activeVersion, error } = await supabase
    .from('booking_terms_versions')
    .select('id, version_number, title, html_content')
    .eq('is_active', true)
    .single();

  if (error) {
    // If no active version found, return a default message
    if (error.code === 'PGRST116') {
      return NextResponse.json({ 
        error: 'No active booking terms version found',
        version: null 
      }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: activeVersion });
}

