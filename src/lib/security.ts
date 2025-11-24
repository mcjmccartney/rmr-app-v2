import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  webhook: { requests: 50, windowMs: 5 * 60 * 1000 },   // 50 requests per 5 minutes
  auth: { requests: 10, windowMs: 15 * 60 * 1000 },     // 10 requests per 15 minutes
};

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export function rateLimit(
  request: NextRequest, 
  type: keyof typeof RATE_LIMITS = 'default'
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientIP = getClientIP(request);
  const key = `${clientIP}:${type}`;
  const limit = RATE_LIMITS[type];
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.windowMs
    });
    return {
      allowed: true,
      remaining: limit.requests - 1,
      resetTime: now + limit.windowMs
    };
  }
  
  if (current.count >= limit.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: limit.requests - current.count,
    resetTime: current.resetTime
  };
}

export function addSecurityHeaders(response: NextResponse, allowEmbedding: boolean = false): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Allow embedding for specific pages, deny for others
  if (allowEmbedding) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Anti-indexing headers to prevent search engine crawling
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive, noimageindex');
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Content Security Policy - adjust frame-ancestors based on embedding allowance
  // Only allow embedding from trusted domains (main website)
  const frameAncestors = allowEmbedding
    ? "frame-ancestors 'self' https://www.raisingmyrescue.co.uk https://raisingmyrescue.co.uk"
    : "frame-ancestors 'none'";

  // Note: 'unsafe-inline' and 'unsafe-eval' are security risks but currently required for:
  // - Next.js development mode and hot reloading
  // - Stripe.js integration
  // - Rich text editor (TipTap/ProseMirror)
  // TODO: Migrate to nonce-based CSP in future for better security
  const csp = [
    "default-src 'self'",
    // Script sources - includes unsafe-inline/eval for compatibility
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com https://unpkg.com",
    // Style sources - unsafe-inline needed for dynamic styles
    "style-src 'self' 'unsafe-inline'",
    // Font sources - only self-hosted
    "font-src 'self'",
    // Image sources - allow data URIs, HTTPS, and blobs for uploaded images
    "img-src 'self' data: https: blob:",
    // Connection sources - restrict to known APIs only
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://hook.eu1.make.com https://api.stripe.com https://docs.google.com https://www.googleapis.com https://api.mapbox.com https://i.ibb.co",
    // Frame sources - only Stripe
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    // Worker sources - for service workers and web workers
    "worker-src 'self' blob:",
    // Child sources - for iframes and workers
    "child-src 'self' blob:",
    // Frame ancestors - control who can embed this app
    frameAncestors,
    // Base URI - prevent base tag injection
    "base-uri 'self'",
    // Form action - only allow forms to submit to same origin
    "form-action 'self'",
    // Object sources - block plugins like Flash
    "object-src 'none'",
    // Upgrade insecure requests to HTTPS
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export function createRateLimitResponse(resetTime: number): NextResponse {
  const response = NextResponse.json(
    { 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    },
    { status: 429 }
  );
  
  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  
  return addSecurityHeaders(response);
}

// Input sanitization helpers
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
