
/**
 * Decodes text in quoted-printable format, removing characters like =20
 * that commonly appear in emails
 */
export const decodeQuotedPrintable = (text: string): string => {
  if (!text) return '';
  
  // Replace encoded characters like =20 (space)
  let decoded = text.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch (e) {
      return match;
    }
  });
  
  // Replace encoded line breaks
  decoded = decoded.replace(/=\r\n/g, '');
  decoded = decoded.replace(/=\n/g, '');
  
  // Completely remove all instances of =20 characters
  decoded = decoded.replace(/=20+/g, ' ');
  
  // Replace other problematic characters common in emails
  decoded = decoded.replace(/&nbsp;/g, ' ');
  
  // Clean up excessive whitespace
  decoded = decoded.replace(/\s+/g, ' ').trim();
  
  return decoded;
};

/**
 * Detects and converts URLs in plain text to clickable HTML links
 * using absolute URLs with the correct domain
 */
export const linkifyText = (text: string): string => {
  if (!text) return '';
  
  // Get the base domain from the browser window
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Regular expression to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Replace URLs with HTML links
  const linkedText = text.replace(urlRegex, (url) => {
    // If the URL contains incidencias.lingotes.com, replace it with the correct URL
    let correctedUrl = url;
    if (url.includes('incidencias.lingotes.com')) {
      correctedUrl = url.replace('incidencias.lingotes.com', baseDomain.replace(/^https?:\/\//, ''));
    }
    
    return `<a href="${correctedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
  });
  
  return linkedText;
};

/**
 * Creates an absolute URL based on the current path
 */
export const getAbsoluteUrl = (path: string): string => {
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  // Make sure the path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseDomain}${normalizedPath}`;
};
