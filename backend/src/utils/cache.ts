// Simple in-memory cache with TTL
// This is intentionally lightweight and not suitable for clustered deployments.
// It stores entries in a Map and prunes expired values lazily on access.

type CacheEntry<T> = {
  value: T;
  expiresAt: number; // epoch ms
};

const cache = new Map<string, CacheEntry<any>>();

/**
 * Retrieve a value from the cache. If the entry has expired it will be removed and undefined returned.
 */
export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Store a value in the cache with a time‑to‑live (milliseconds).
 */
export function setCache<T>(key: string, value: T, ttlMs: number): void {
  const expiresAt = Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });
}

/**
 * Clear the entire cache (useful for invalidation when underlying data changes).
 */
export function clearCache(): void {
  cache.clear();
}
