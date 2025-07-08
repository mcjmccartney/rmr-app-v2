import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, rateLimit, createRateLimitResponse } from '@/lib/security'

export async function middleware(req: NextRequest) {
  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitType = req.nextUrl.pathname.includes('webhook') ? 'webhook' : 'default';
    const rateLimitResult = rateLimit(req, rateLimitType);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/behavioural-brief', '/behavioural-brief-completed', '/behaviour-questionnaire', '/booking-terms', '/booking-terms-completed', '/questionnaire-completed', '/pay-confirm', '/payment-confirmed', '/payment-error'];



  // Check if current path is public (including dynamic routes)
  const isPublicRoute = publicRoutes.some(route => {
    if (route === req.nextUrl.pathname) return true;
    // Handle dynamic routes like /payment-confirmed/[sessionId]
    if (route === '/payment-confirmed' && req.nextUrl.pathname.startsWith('/payment-confirmed/')) return true;
    return false;
  });

  // If user is not signed in and the current path is not a public route, redirect to /login
  if (!session && !isPublicRoute) {
    const redirectResponse = NextResponse.redirect(new URL('/login', req.url));
    return addSecurityHeaders(redirectResponse);
  }

  // If user is signed in and the current path is /login, redirect to /calendar
  if (session && req.nextUrl.pathname === '/login') {
    const redirectResponse = NextResponse.redirect(new URL('/calendar', req.url));
    return addSecurityHeaders(redirectResponse);
  }

  // If user is signed in and on root path, redirect to /calendar
  if (session && req.nextUrl.pathname === '/') {
    const redirectResponse = NextResponse.redirect(new URL('/calendar', req.url));
    return addSecurityHeaders(redirectResponse);
  }

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
