/**
 * Content Sanitization Utility
 * Provides secure HTML sanitization to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content with strict configuration
 * Removes all potentially dangerous content
 */
export function sanitizeHTML(dirty: string, allowMarkdown: boolean = false): string {
  if (!dirty) return '';
  
  const config: any = {
    ALLOWED_TAGS: allowMarkdown
      ? [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'u', 's',
          'ul', 'ol', 'li',
          'blockquote',
          'code', 'pre',
          'a',
          'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span'
        ]
      : [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'u',
          'ul', 'ol', 'li',
          'blockquote',
          'code', 'pre',
          'div', 'span'
        ],
    ALLOWED_ATTR: allowMarkdown
      ? ['href', 'target', 'rel', 'class', 'src', 'alt', 'title']
      : ['class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    RETURN_TRUSTED_TYPE: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false
  };

  // Additional hook to sanitize links
  DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
    // Ensure all links are safe
    if (node.nodeName === 'A') {
      const href = node.getAttribute('href');
      if (href && !href.match(/^https?:\/\//i) && !href.match(/^mailto:/i)) {
        node.setAttribute('href', '#');
      }
      // Force external links to open in new tab with security attributes
      if (href && href.match(/^https?:\/\//i)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    
    // Remove potentially dangerous attributes from all elements
    const dangerousAttrs = [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup'
    ];
    
    dangerousAttrs.forEach(attr => {
      if (node.hasAttribute(attr)) {
        node.removeAttribute(attr);
      }
    });
  });

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Enhanced markdown formatting with XSS protection
 * Converts markdown to HTML and sanitizes the result
 */
export function formatMarkdownSafe(content: string): string {
  if (!content) return '';
  
  // Enhanced markdown to HTML conversion
  let html = content
    // Headers
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>'
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h1>'
    )

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

    // Inline code
    .replace(
      /`(.*?)`/g,
      '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>'
    )

    // Code blocks
    .replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono text-gray-800">$1</code></pre>'
    )

    // Links (will be sanitized by DOMPurify)
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
    )

    // Quotes
    .replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4">$1</blockquote>'
    )

    // Lists
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 mb-1">$2</li>')

    // Wrap lists in ul tags
    .replace(
      /(<li.*?<\/li>)/gs,
      '<ul class="list-disc list-inside mb-4">$1</ul>'
    )

    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
    .replace(/\n/g, '<br>');

  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p class="mb-4 leading-relaxed">' + html + '</p>';
  }

  // Sanitize the HTML to prevent XSS
  return sanitizeHTML(html, true);
}

/**
 * Sanitize plain text (strips all HTML)
 */
export function sanitizePlainText(text: string): string {
  if (!text) return '';
  
  // Strip all HTML tags
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize user input for display
 * Escapes HTML entities
 */
export function escapeHTML(text: string): string {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeURL(url: string): string {
  if (!url) return '';
  
  // Remove dangerous protocols
  const sanitized = url.trim();
  
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:'
  ];
  
  const lowerURL = sanitized.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerURL.startsWith(protocol)) {
      return '#';
    }
  }
  
  // Only allow http(s) and mailto
  if (!lowerURL.match(/^(https?:|mailto:)/)) {
    return '#';
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/^\.+/, '')
    .trim();
}

