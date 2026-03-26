"use strict";
// Simple in-memory cache with TTL
// This is intentionally lightweight and not suitable for clustered deployments.
// It stores entries in a Map and prunes expired values lazily on access.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCache = setCache;
exports.clearCache = clearCache;
const cache = new Map();
/**
 * Retrieve a value from the cache. If the entry has expired it will be removed and undefined returned.
 */
function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return undefined;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
    }
    return entry.value;
}
/**
 * Store a value in the cache with a time‑to‑live (milliseconds).
 */
function setCache(key, value, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    cache.set(key, { value, expiresAt });
}
/**
 * Clear the entire cache (useful for invalidation when underlying data changes).
 */
function clearCache() {
    cache.clear();
}
//# sourceMappingURL=cache.js.map