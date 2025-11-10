'use client';

import { useMemo } from 'react';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  fallback?: string;
}

// Simple HTML sanitizer that only allows basic formatting tags
function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove any script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove any javascript: links
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Convert double line breaks to paragraph breaks for better spacing
  sanitized = sanitized.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');

  // Wrap content in paragraphs if it contains paragraph breaks
  if (sanitized.includes('</p><p>')) {
    sanitized = '<p>' + sanitized + '</p>';
  }

  // Only allow specific safe tags
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For closing tags, just return them as-is
      if (match.startsWith('</')) {
        return match;
      }
      // For opening tags, remove any attributes except basic ones
      const basicTag = `<${tagName.toLowerCase()}>`;
      return basicTag;
    }
    return ''; // Remove disallowed tags
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
  
  // Convert plain text to HTML
  return text
    .replace(/\n\n/g, '<br><br>') // Double line breaks
    .replace(/\n/g, '<br>') // Single line breaks
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    .replace(/__(.*?)__/g, '<u>$1</u>'); // __underline__
}

export default function SafeHtmlRenderer({ 
  html, 
  className = '', 
  fallback = '' 
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

  return (
    <div
      className={`${className} [&_p]:mb-4 [&_p:last-child]:mb-0`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml || fallback }}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  );
}
