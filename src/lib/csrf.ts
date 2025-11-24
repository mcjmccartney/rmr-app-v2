import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection Utilities
 * 
 * Provides Cross-Site Request Forgery protection for state-changing operations.
 * Uses the Double Submit Cookie pattern with SameSite cookies.
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token in response cookies
 */
export function setCsrfCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });

  return response;
}

/**
 * Verify CSRF token from request
 * Compares token from cookie with token from header
 */
export function verifyCsrfToken(request: NextRequest): boolean {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Both must exist
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch (error) {
    // Tokens are different lengths or invalid
    return false;
  }
}

/**
 * Middleware helper to verify CSRF for state-changing operations
 * Returns true if valid, false if invalid
 */
export function requireCsrfToken(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  
  // Only check CSRF for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return verifyCsrfToken(request);
  }

  // GET, HEAD, OPTIONS don't need CSRF protection
  return true;
}

/**
 * Create a CSRF error response
 */
export function createCsrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { 
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed. Please refresh the page and try again.'
    },
    { status: 403 }
  );
}

/**
 * Get CSRF token from request (for client-side use)
 */
export function getCsrfToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * CSRF protection configuration
 */
export const csrfConfig = {
  tokenLength: CSRF_TOKEN_LENGTH,
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
  
  // Paths that should be exempt from CSRF protection
  exemptPaths: [
    '/api/behavioural-brief',      // Public form submission
    '/api/behaviour-questionnaire', // Public form submission
    '/api/booking-terms',           // Public form submission
    '/api/stripe/webhook',          // External webhook (uses API key auth)
    '/api/daily-webhooks',          // Cron job (uses API key auth)
    '/api/scheduled-webhooks-combined', // Cron job (uses API key auth)
  ],

  // Check if a path is exempt from CSRF protection
  isExempt(pathname: string): boolean {
    return this.exemptPaths.some(path => pathname.startsWith(path));
  }
};

/**
 * Helper to check if CSRF protection should be applied
 */
export function shouldCheckCsrf(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;

  // Skip for safe methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }

  // Skip for exempt paths
  if (csrfConfig.isExempt(pathname)) {
    return false;
  }

  return true;
}

