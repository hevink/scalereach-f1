/**
 * Server-side in-memory cache for username availability checks
 * This provides fast lookups without hitting the database for recently checked usernames
 */

interface CacheEntry {
  available: boolean;
  timestamp: number;
}

class UsernameCache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly TTL: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.TTL = ttl;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get cached result for a username
   * Returns null if not found or expired
   */
  get(username: string): boolean | null {
    const normalized = username.toLowerCase();
    const entry = this.cache.get(normalized);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      // Entry expired, remove it
      this.cache.delete(normalized);
      return null;
    }

    return entry.available;
  }

  /**
   * Set cached result for a username
   */
  set(username: string, available: boolean): void {
    const normalized = username.toLowerCase();
    this.cache.set(normalized, {
      available,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific username (useful when username is taken)
   */
  invalidate(username: string): void {
    const normalized = username.toLowerCase();
    this.cache.delete(normalized);
  }

  /**
   * Clear all expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: 10_000, // Prevent memory issues
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance for server-side caching
export const usernameCache = new UsernameCache();
