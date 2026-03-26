/**
 * Retrieve a value from the cache. If the entry has expired it will be removed and undefined returned.
 */
export declare function getCached<T>(key: string): T | undefined;
/**
 * Store a value in the cache with a time‑to‑live (milliseconds).
 */
export declare function setCache<T>(key: string, value: T, ttlMs: number): void;
/**
 * Clear the entire cache (useful for invalidation when underlying data changes).
 */
export declare function clearCache(): void;
//# sourceMappingURL=cache.d.ts.map