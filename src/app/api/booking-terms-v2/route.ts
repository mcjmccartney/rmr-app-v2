import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SLUG = 'booking-terms-v2'

function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS || ''
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  // read public content
  const { data: pageData, error } = await supabase
    .from('site_pages')
    .select('id,slug,title,html_content,created_at,updated_at')
    .eq('slug', SLUG)
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // determine if user is admin by checking session email against ADMIN_EMAILS
  const { data: { session } } = await supabase.auth.getSession()
  const adminEmails = getAdminEmailsFromEnv()
  const isAdmin = !!(session?.user?.email && adminEmails.includes(session.user.email))

  return NextResponse.json({ page: pageData ?? null, isAdmin })
}

export async function POST(req: NextRequest) {
  // verify admin
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { session } } = await serverSupabase.auth.getSession()
  const adminEmails = getAdminEmailsFromEnv()
  const userEmail = session?.user?.email

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // parse body
  const body = await req.json().catch(() => ({}))
  const { title = null, html_content = '' } = body

  // use service role for write operations
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // upsert by slug
  const payload: any = {
    slug: SLUG,
    html_content,
    updated_at: new Date().toISOString(),
  }
  if (title !== null) payload.title = title

  const { data, error } = await svc
    .from('site_pages')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ page: data })
}
