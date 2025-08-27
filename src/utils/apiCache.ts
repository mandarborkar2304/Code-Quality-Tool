/**
 * API Cache utility with TTL (Time To Live)
 * Provides a centralized caching mechanism for API responses
 */

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

class ApiCache {
  private data: Map<string, CacheItem<any>> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default TTL
  private maxSize: number = 100; // Maximum cache size

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.data.get(key);
    if (!item) return null;
    
    // Check if the item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.data.delete(key);
      return null;
    }
    
    return item.value as T;
  }
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   */
  set<T>(key: string, value: T): void {
    this.data.set(key, { value, timestamp: Date.now() });
    
    // Clean up old entries if cache gets too large
    if (this.data.size > this.maxSize) {
      this.cleanupOldEntries();
    }
  }

  /**
   * Remove a value from the cache
   * @param key Cache key
   */
  remove(key: string): void {
    this.data.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.data.clear();
  }

  /**
   * Set the TTL for cache items
   * @param milliseconds TTL in milliseconds
   */
  setTTL(milliseconds: number): void {
    this.ttl = milliseconds;
  }

  /**
   * Set the maximum cache size
   * @param size Maximum number of items to keep in cache
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
    if (this.data.size > this.maxSize) {
      this.cleanupOldEntries();
    }
  }

  /**
   * Clean up old entries when cache exceeds maximum size
   */
  private cleanupOldEntries(): void {
    // Sort entries by timestamp and remove the oldest ones
    const entries = [...this.data.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're under the max size
    while (entries.length > this.maxSize) {
      const [oldestKey] = entries.shift()!;
      this.data.delete(oldestKey);
    }
  }
}

// Export a singleton instance
export const apiCache = new ApiCache();

/**
 * Utility function to create a cache key from parameters
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      // Handle different types of values
      if (typeof value === 'string') {
        // For strings, use a substring to avoid huge cache keys
        return `${key}:${value.substring(0, 50)}`;
      } else if (typeof value === 'object' && value !== null) {
        // For objects, use JSON.stringify with a length limit
        const json = JSON.stringify(value);
        return `${key}:${json.substring(0, 50)}`;
      }
      // For other types, convert to string
      return `${key}:${String(value)}`;
    })
    .join('|');

  return `${prefix}|${sortedParams}`;
}