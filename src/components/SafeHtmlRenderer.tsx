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

  // Only allow specific safe tags (expanded for booking terms content)
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For closing tags, just return them as-is
      if (match.startsWith('</')) {
        return match;
      }
      // For opening tags, preserve class and style attributes for formatting
      const classMatch = match.match(/class\s*=\s*["']([^"']*)["']/i);
      const styleMatch = match.match(/style\s*=\s*["']([^"']*)["']/i);

      let attributes = '';
      if (classMatch) {
        attributes += ` class="${classMatch[1]}"`;
      }
      if (styleMatch) {
        // Only allow safe CSS properties
        const safeStyle = styleMatch[1].replace(/(expression|javascript|behavior)/gi, '');
        attributes += ` style="${safeStyle}"`;
      }

      return `<${tagName.toLowerCase()}${attributes}>`;
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
