import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Helper to check if user is authenticated
async function isUserAuthenticated(req: NextRequest): Promise<boolean> {
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
  return !!session?.user;
}

// POST - Set a version as active (deactivates all others)
export async function POST(req: NextRequest) {
  const isAuthenticated = await isUserAuthenticated(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 403 });
  }

  const body = await req.json();
  const { versionId } = body;

  if (!versionId) {
    return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First, deactivate all versions
  const { error: deactivateError } = await supabase
    .from('booking_terms_versions')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  // Then, activate the selected version and set activated_at timestamp
  const { data: activeVersion, error: activateError } = await supabase
    .from('booking_terms_versions')
    .update({
      is_active: true,
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', versionId)
    .select()
    .single();

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 500 });
  }

  return NextResponse.json({ version: activeVersion });
}

