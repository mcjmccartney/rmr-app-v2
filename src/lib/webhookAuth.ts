import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * Webhook Authentication Utilities
 *
 * Provides signature-based authentication for webhook endpoints
 * to prevent unauthorized access and data injection attacks.
 */

// Get webhook secret from environment variable
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

/**
 * Verify webhook signature using HMAC-SHA256
 * 
 * @param payload - The raw request body as string
 * @param signature - The signature from request headers
 * @param secret - Optional secret (defaults to WEBHOOK_SECRET env var)
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string = WEBHOOK_SECRET
): boolean {
  // If no secret is configured, log warning but allow in development
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.security('WEBHOOK_SECRET_MISSING', {
        severity: 'CRITICAL',
        message: 'WEBHOOK_SECRET not configured in production'
      });
      return false;
    }
    logger.warn('WEBHOOK_SECRET not configured. Allowing in development mode.');
    return true;
  }

  // If no signature provided, reject
  if (!signature) {
    logger.security('WEBHOOK_NO_SIGNATURE', {
      severity: 'WARNING',
      message: 'No signature provided in webhook request'
    });
    return false;
  }

  try {
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.security('WEBHOOK_INVALID_SIGNATURE', {
        severity: 'WARNING',
        message: 'Invalid webhook signature detected'
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook signature', error);
    return false;
  }
}

/**
 * Generate a webhook signature for outgoing webhooks
 * 
 * @param payload - The payload to sign
 * @param secret - Optional secret (defaults to WEBHOOK_SECRET env var)
 * @returns HMAC-SHA256 signature as hex string
 */
export function generateWebhookSignature(
  payload: string,
  secret: string = WEBHOOK_SECRET
): string {
  if (!secret) {
    throw new Error('WEBHOOK_SECRET not configured');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Middleware helper to verify webhook authentication
 * Returns the parsed body if valid, or null if invalid
 * 
 * @param request - Next.js request object
 * @returns Parsed JSON body if valid, null if invalid
 */
export async function verifyWebhookRequest(
  request: NextRequest
): Promise<any | null> {
  try {
    // Get signature from header
    const signature = request.headers.get('x-webhook-signature');

    // Read raw body
    const rawBody = await request.text();

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return null;
    }

    // Parse and return body
    return JSON.parse(rawBody);
  } catch (error) {
    logger.error('Error processing webhook request', error);
    return null;
  }
}

/**
 * Simple API key authentication for webhooks (alternative to signatures)
 * 
 * @param request - Next.js request object
 * @returns boolean indicating if API key is valid
 */
export function verifyWebhookApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.WEBHOOK_API_KEY;

  if (!validApiKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.security('WEBHOOK_API_KEY_MISSING', {
        severity: 'CRITICAL',
        message: 'WEBHOOK_API_KEY not configured in production'
      });
      return false;
    }
    logger.warn('WEBHOOK_API_KEY not configured. Allowing in development mode.');
    return true;
  }

  if (!apiKey) {
    logger.security('WEBHOOK_NO_API_KEY', {
      severity: 'WARNING',
      message: 'No API key provided in webhook request'
    });
    return false;
  }

  // Use timing-safe comparison
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validApiKey)
    );

    if (!isValid) {
      logger.security('WEBHOOK_INVALID_API_KEY', {
        severity: 'WARNING',
        message: 'Invalid API key provided in webhook request'
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook API key', error);
    return false;
  }
}

