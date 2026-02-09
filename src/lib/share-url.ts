/**
 * Share URL Utility Function
 * Constructs share URLs for public clip viewing
 * 
 * Validates: Requirements 2.3
 */

/**
 * Construct full share URL from token
 */
export function constructShareUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${baseUrl}/share/clips/${token}`;
}

/**
 * Extract token from share URL
 */
export function extractTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/share\/clips\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate share URL format
 */
export function isValidShareUrl(url: string): boolean {
  try {
    const token = extractTokenFromUrl(url);
    if (!token) return false;
    
    // Validate UUID v4 format
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(token);
  } catch {
    return false;
  }
}
