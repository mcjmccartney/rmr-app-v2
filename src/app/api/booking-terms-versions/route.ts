import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Helper to check if user is authenticated
async function isUserAuthenticated(req: NextRequest): Promise<{ isAuthenticated: boolean; userEmail: string | null }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const userEmail = session?.user?.email || null;
  const isAuthenticated = !!session?.user;

  return { isAuthenticated, userEmail };
}

// GET - Fetch all versions
export async function GET(req: NextRequest) {
  const { isAuthenticated } = await isUserAuthenticated(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: versions, error } = await supabase
    .from('booking_terms_versions')
    .select('*')
    .order('version_number', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions, isAdmin: true });
}

// POST - Create new version
export async function POST(req: NextRequest) {
  const { isAuthenticated, userEmail } = await isUserAuthenticated(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 403 });
  }

  const body = await req.json();
  const { title, html_content } = body;

  if (!title || !html_content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the next version number
  const { data: maxVersion } = await supabase
    .from('booking_terms_versions')
    .select('version_number')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersionNumber = (maxVersion?.version_number || 0) + 1;

  // Create new version (not active by default)
  const { data: newVersion, error } = await supabase
    .from('booking_terms_versions')
    .insert([{
      version_number: nextVersionNumber,
      title,
      html_content,
      is_active: false,
      created_by: userEmail
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: newVersion });
}

// PUT - Update existing version
export async function PUT(req: NextRequest) {
  const { isAuthenticated } = await isUserAuthenticated(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 403 });
  }

  const body = await req.json();
  const { id, title, html_content } = body;

  if (!id || !title || !html_content) {
    return NextResponse.json({ error: 'ID, title, and content are required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: updatedVersion, error } = await supabase
    .from('booking_terms_versions')
    .update({
      title,
      html_content,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: updatedVersion });
}

