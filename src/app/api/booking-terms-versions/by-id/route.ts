import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch a specific version by ID (public endpoint for viewing signed terms)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get('versionId');

  if (!versionId) {
    return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: version, error } = await supabase
    .from('booking_terms_versions')
    .select('id, version_number, title, html_content, activated_at')
    .eq('id', versionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ 
        error: 'Version not found',
        version: null 
      }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version });
}

