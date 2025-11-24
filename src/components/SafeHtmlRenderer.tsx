'use client';

import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  fallback?: string;
  paragraphSpacing?: 'tight' | 'normal'; // tight = mb-2, normal = mb-4
}

// HTML sanitizer using DOMPurify - industry standard security library
function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Convert double line breaks to paragraph breaks for better spacing
  let processed = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');

  // Wrap content in paragraphs if it contains paragraph breaks
  if (processed.includes('</p><p>')) {
    processed = '<p>' + processed + '</p>';
  }

  // Use DOMPurify to sanitize HTML with strict configuration
  const sanitized = DOMPurify.sanitize(processed, {
    ALLOWED_TAGS: [
      'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
    // Additional security options
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true
  });

  return sanitized;
}

// Convert plain text to HTML with basic formatting preservation
function textToHtml(text: string): string {
  if (!text) return '';

  // If it already contains HTML tags, assume it's HTML
  if (/<[^>]+>/.test(text)) {
    return sanitizeHtml(text);
  }

  // Convert plain text to HTML - handle line breaks properly
  let htmlText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    .replace(/__(.*?)__/g, '<u>$1</u>'); // __underline__

  // Handle line breaks - convert double line breaks to paragraph breaks
  htmlText = htmlText
    .replace(/\n\n+/g, '<br><br>') // Multiple line breaks to double breaks
    .replace(/\n/g, '<br>'); // Single line breaks to HTML breaks

  return htmlText;
}

export default function SafeHtmlRenderer({
  html,
  className = '',
  fallback = '',
  paragraphSpacing = 'normal'
}: SafeHtmlRendererProps) {
  const sanitizedHtml = useMemo(() => {
    try {
      return sanitizeHtml(textToHtml(html));
    } catch (error) {
      console.warn('Error sanitizing HTML:', error);
      return fallback || html;
    }
  }, [html, fallback]);

  if (!sanitizedHtml && !fallback) {
    return null;
  }

  const spacingClass = paragraphSpacing === 'tight' ? '[&_p]:mb-2' : '[&_p]:mb-4';

  return (
    <div
      className={`${className} ${spacingClass} [&_p:last-child]:mb-0 [&_a]:cursor-pointer [&_a]:hover:opacity-80`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml || fallback }}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  );
}
