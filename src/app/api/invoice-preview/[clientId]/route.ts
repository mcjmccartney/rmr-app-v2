import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('booking_date', { ascending: true });

    const { data: aliases } = await supabase
      .from('client_email_aliases')
      .select('*')
      .eq('client_id', clientId);

    const emails = [
      client.email,
      ...(aliases || []).map((a: any) => a.email),
    ]
      .filter(Boolean)
      .map((e: string) => e.toLowerCase());

    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .in('email', emails)
      .order('date', { ascending: true });

    return NextResponse.json({
      client,
      sessions: sessions || [],
      memberships: memberships || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
