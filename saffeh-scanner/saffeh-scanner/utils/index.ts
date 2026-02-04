/**
 * Utility functions for the Saffeh Scanner app
 */

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a time string for display
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date and time string for display
 */
export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Truncate a string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'JOD'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Calculate duration between two dates
 */
export function calculateDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
}

/**
 * Validate QR token format
 */
export function isValidQRToken(token: string): boolean {
  // Basic validation - token should be a hex string of appropriate length
  const hexPattern = /^[a-f0-9]+$/i;
  return hexPattern.test(token) && token.length >= 32;
}

/**
 * Extract QR token from various formats
 */
export function extractQRToken(data: string): string {
  // If the data is a URL, try to extract the token parameter
  try {
    const url = new URL(data);
    const token = url.searchParams.get('token') || url.searchParams.get('qr');
    if (token) return token;
  } catch {
    // Not a URL, continue
  }
  
  // If it's JSON, try to extract the token field
  try {
    const json = JSON.parse(data);
    if (json.token) return json.token;
    if (json.qrToken) return json.qrToken;
  } catch {
    // Not JSON, continue
  }
  
  // Return the raw data as the token
  return data.trim();
}
