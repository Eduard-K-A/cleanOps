/**
 * Multi-layer cache manager for API responses
 * Supports memory cache (session-scoped) and localStorage (persistent)
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

export interface CacheConfig {
  defaultTTL?: number; // milliseconds
  maxMemoryEntries?: number;
  enableLocalStorage?: boolean;
  localStoragePrefix?: string;
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryEntries: 100,
  enableLocalStorage: true,
  localStoragePrefix: 'cleanops_cache_',
};

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cleanupExpired();
  }

  /**
   * Generate cache key from URL and params
   */
  private getCacheKey(url: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  /**
   * Get cached data if valid
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.getCacheKey(url, params);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check localStorage if enabled
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${this.config.localStoragePrefix}${key}`);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (this.isValid(entry)) {
            // Promote to memory cache
            this.memoryCache.set(key, entry);
            return entry.data;
          } else {
            // Remove expired entry
            localStorage.removeItem(`${this.config.localStoragePrefix}${key}`);
          }
        }
      } catch (e) {
        console.warn('Cache: localStorage read failed', e);
      }
    }

    return null;
  }

  /**
   * Set cache entry
   */
  set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number, etag?: string): void {
    const key = this.getCacheKey(url, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      etag,
    };

    // Set memory cache
    this.memoryCache.set(key, entry);

    // Enforce memory cache size limit
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    // Set localStorage if enabled
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `${this.config.localStoragePrefix}${key}`,
          JSON.stringify(entry)
        );
      } catch (e) {
        // Quota exceeded or other error
        console.warn('Cache: localStorage write failed', e);
        this.clearLocalStorage();
      }
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.getCacheKey(url, params);
    this.memoryCache.delete(key);
    
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(`${this.config.localStoragePrefix}${key}`);
    }
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.config.localStoragePrefix)) {
            const cacheKey = key.slice(this.config.localStoragePrefix.length);
            if (regex.test(cacheKey)) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (e) {
        console.warn('Cache: Pattern invalidation failed', e);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      this.clearLocalStorage();
    }
  }

  /**
   * Clear localStorage cache
   */
  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.config.localStoragePrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Cache: Clear localStorage failed', e);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(this.config.localStoragePrefix)) {
            try {
              const entry: CacheEntry<any> = JSON.parse(localStorage.getItem(key) || '{}');
              if (now - entry.timestamp >= entry.ttl) {
                localStorage.removeItem(key);
              }
            } catch {
              // Invalid entry, remove it
              localStorage.removeItem(key);
            }
          }
        }
      } catch (e) {
        console.warn('Cache: Cleanup failed', e);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let localStorageCount = 0;
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      localStorageCount = keys.filter(k => k.startsWith(this.config.localStoragePrefix)).length;
    }

    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries: localStorageCount,
      maxMemoryEntries: this.config.maxMemoryEntries,
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
